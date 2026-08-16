export type AcceptedInvitationRole = "ADMIN" | "ADVERTISER" | "CUSTOMER_SERVICE";

export interface InvitationAcceptance {
  membershipId: string;
  organizationId: string;
  role: AcceptedInvitationRole;
  alreadyAccepted: boolean;
}

export class InvitationAcceptanceError extends Error {
  readonly status: number;
  readonly code: "INVALID_REQUEST" | "SESSION_REQUIRED" | "UNTRUSTED_ORIGIN" | "INVITATION_NOT_FOUND" | "INVITATION_NOT_ACCEPTABLE" | "INTERNAL_ERROR" | "INVALID_RESPONSE";

  constructor(message: string, status: number, code: InvitationAcceptanceError["code"]) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type InvitationAuthState = "authenticated" | "unauthenticated" | "unavailable";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROLES = new Set<AcceptedInvitationRole>(["ADMIN", "ADVERTISER", "CUSTOMER_SERVICE"]);
const ERROR_CODES = new Map<number, InvitationAcceptanceError["code"]>([
  [400, "INVALID_REQUEST"], [401, "SESSION_REQUIRED"], [403, "UNTRUSTED_ORIGIN"],
  [404, "INVITATION_NOT_FOUND"], [409, "INVITATION_NOT_ACCEPTABLE"],
]);

function isObject(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function onlyKeys(value: Record<string, unknown>, keys: readonly string[]) { const expected = new Set(keys); return Object.keys(value).length === keys.length && Object.keys(value).every((key) => expected.has(key)); }
function isNonEmpty(value: unknown): value is string { return typeof value === "string" && value.length > 0; }

export function isInvitationId(value: string): boolean { return UUID.test(value); }

export function safeInvitationReturnTo(value: string | null | undefined): string {
  return value && /^\/invitations\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : "/";
}

export async function fetchInvitationAuthState(cookieHeader: string, fetcher: typeof fetch = fetch): Promise<InvitationAuthState> {
  const apiOrigin = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
  try {
    const response = await fetcher(`${apiOrigin}/api/auth/get-session`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return "unavailable";
    const payload: unknown = await response.json().catch(() => undefined);
    if (payload === null) return "unauthenticated";
    if (!isObject(payload) || !isObject(payload.user) || !isObject(payload.session) ||
        !isNonEmpty(payload.user.id) || !isNonEmpty(payload.session.id)) return "unavailable";
    return "authenticated";
  } catch {
    return "unavailable";
  }
}

export function parseInvitationAcceptance(value: unknown): InvitationAcceptance {
  if (!isObject(value) || !onlyKeys(value, ["membershipId", "organizationId", "role", "alreadyAccepted"]) ||
      !isNonEmpty(value.membershipId) || !isNonEmpty(value.organizationId) ||
      typeof value.role !== "string" || !ROLES.has(value.role as AcceptedInvitationRole) ||
      typeof value.alreadyAccepted !== "boolean") {
    throw new InvitationAcceptanceError("Respons penerimaan undangan tidak valid.", 200, "INVALID_RESPONSE");
  }
  return { membershipId: value.membershipId, organizationId: value.organizationId, role: value.role as AcceptedInvitationRole, alreadyAccepted: value.alreadyAccepted };
}

export async function acceptInvitation(id: string, fetcher: typeof fetch = fetch): Promise<InvitationAcceptance> {
  if (!isInvitationId(id)) throw new InvitationAcceptanceError("ID undangan tidak valid.", 400, "INVALID_REQUEST");
  const response = await fetcher(`/api/v1/invitations/${encodeURIComponent(id)}/accept`, {
    method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: "{}",
  });
  const payload: unknown = await response.json().catch(() => null);
  if (response.ok) return parseInvitationAcceptance(payload);

  if (response.status === 500 && isObject(payload) && onlyKeys(payload, ["error"]) && payload.error === "Internal Server Error") {
    throw new InvitationAcceptanceError("Layanan undangan sedang bermasalah. Coba lagi.", 500, "INTERNAL_ERROR");
  }
  const expectedCode = ERROR_CODES.get(response.status);
  if (expectedCode && isObject(payload) && onlyKeys(payload, ["error", "code"]) &&
      typeof payload.error === "string" && payload.code === expectedCode) {
    throw new InvitationAcceptanceError(payload.error, response.status, expectedCode);
  }
  throw new InvitationAcceptanceError(`Respons undangan tidak valid (${response.status}).`, response.status, "INVALID_RESPONSE");
}
