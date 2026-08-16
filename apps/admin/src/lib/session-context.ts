import type { Role } from "@dotads/auth";

export interface SessionContext {
  userId: string;
  userEmail: string;
  tenantId: string;
  organizationId: string;
  role: Role;
  tenantName: string;
  tenantStatus: string;
}

export type SessionContextResult =
  | { status: "authenticated"; context: SessionContext }
  | { status: "unauthenticated" }
  | { status: "workspace_selection_required" }
  | { status: "unavailable"; message: string };

const ROLES = new Set<Role>([
  "SUPER_ADMIN",
  "TENANT_OWNER",
  "ADMIN",
  "ADVERTISER",
  "CUSTOMER_SERVICE",
  "END_BUYER",
]);

export const parseSessionContext = (value: unknown): SessionContext | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const valid = (
    typeof candidate.userId === "string" &&
    typeof candidate.userEmail === "string" &&
    typeof candidate.tenantId === "string" &&
    typeof candidate.organizationId === "string" &&
    typeof candidate.role === "string" &&
    ROLES.has(candidate.role as Role) &&
    typeof candidate.tenantName === "string" &&
    typeof candidate.tenantStatus === "string"
  );
  return valid ? candidate as unknown as SessionContext : null;
};

export async function fetchSessionContext(cookieHeader: string, fetcher: typeof fetch = fetch): Promise<SessionContextResult> {
  const apiOrigin = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

  try {
    const response = await fetcher(`${apiOrigin}/api/v1/session`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (response.status === 401) return { status: "unauthenticated" };
    if (response.status === 409) {
      const payload: unknown = await response.json().catch(() => null);
      const candidate = payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
      const keys = candidate ? Object.keys(candidate).sort() : [];
      if (
        candidate &&
        keys.join(",") === "code,error,workspaceSelectionRequired" &&
        typeof candidate.error === "string" &&
        candidate.code === "WORKSPACE_SELECTION_REQUIRED" &&
        candidate.workspaceSelectionRequired === true
      ) {
        return { status: "workspace_selection_required" };
      }
      return { status: "unavailable", message: "Respons pemilihan workspace tidak valid." };
    }
    if (!response.ok) {
      return {
        status: "unavailable",
        message: response.status === 403
          ? "Sesi tidak memiliki akses ke workspace ini."
          : "Konteks akun belum dapat dimuat dari layanan sesi.",
      };
    }

    const payload: unknown = await response.json();
    const context = parseSessionContext(payload);
    if (!context) {
      return { status: "unavailable", message: "Respons layanan sesi tidak valid." };
    }

    return { status: "authenticated", context };
  } catch {
    return { status: "unavailable", message: "Layanan sesi tidak dapat dijangkau." };
  }
}
