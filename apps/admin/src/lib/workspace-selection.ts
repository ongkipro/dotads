import type { Role } from "@dotads/auth";
import { parseSessionContext, type SessionContext } from "./session-context.ts";

export const WORKSPACES_PATH = "/api/v1/workspaces";

export type WorkspaceRole = Exclude<Role, "SUPER_ADMIN" | "END_BUYER">;
export type WorkspaceTenantStatus = "active" | "suspended" | "cancelled";

export interface WorkspaceOption {
  organizationId: string;
  organizationName: string;
  tenantName: string;
  tenantStatus: WorkspaceTenantStatus;
  role: WorkspaceRole;
}

const roles = new Set<WorkspaceRole>([
  "TENANT_OWNER",
  "ADMIN",
  "ADVERTISER",
  "CUSTOMER_SERVICE",
]);
const tenantStatuses = new Set<WorkspaceTenantStatus>(["active", "suspended", "cancelled"]);

export function parseWorkspaceList(value: unknown): WorkspaceOption[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as { workspaces?: unknown }).workspaces)) {
    throw new Error("Daftar workspace dari layanan sesi tidak valid.");
  }

  return (value as { workspaces: unknown[] }).workspaces.map((workspace) => {
    if (!workspace || typeof workspace !== "object") {
      throw new Error("Daftar workspace dari layanan sesi tidak valid.");
    }
    const candidate = workspace as Record<string, unknown>;
    if (
      typeof candidate.organizationId !== "string" ||
      typeof candidate.organizationName !== "string" ||
      typeof candidate.tenantName !== "string" ||
      typeof candidate.tenantStatus !== "string" ||
      !tenantStatuses.has(candidate.tenantStatus as WorkspaceTenantStatus) ||
      typeof candidate.role !== "string" ||
      !roles.has(candidate.role as WorkspaceRole)
    ) {
      throw new Error("Daftar workspace dari layanan sesi tidak valid.");
    }
    return candidate as unknown as WorkspaceOption;
  });
}

export async function listWorkspaces(fetcher: typeof fetch = fetch): Promise<WorkspaceOption[]> {
  const response = await fetcher(WORKSPACES_PATH, { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw new Error("Daftar workspace belum dapat dimuat. Coba lagi.");
  return parseWorkspaceList(await response.json().catch(() => null));
}

export async function selectWorkspace(organizationId: string, fetcher: typeof fetch = fetch): Promise<SessionContext> {
  const response = await fetcher(`${WORKSPACES_PATH}/select`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ organizationId }),
  });

  if (response.status === 403) throw new Error("Workspace tidak aktif atau akun tidak lagi memiliki akses.");
  if (!response.ok) throw new Error("Workspace belum berhasil dipilih. Coba lagi.");

  const context = parseSessionContext(await response.json().catch(() => null));
  if (!context) throw new Error("Respons pemilihan workspace tidak valid.");
  return context;
}
