export const ADMIN_MEMBERS_PATH = "/api/v1/members";

export type MemberRole = "TENANT_OWNER" | "ADMIN" | "ADVERTISER" | "CUSTOMER_SERVICE";
export type InvitationRole = Exclude<MemberRole, "TENANT_OWNER">;
export type InvitationStatus = "pending" | "expired";

export interface AdminMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  createdAt: string;
}

export interface MemberInvitation {
  id: string;
  email: string;
  role: MemberRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  delivery: "not_configured";
}

export interface MemberDirectory {
  members: AdminMember[];
  invitations: MemberInvitation[];
}

export interface MemberRoleResult {
  member: AdminMember;
  alreadyApplied: boolean;
}

export class AdminMembersError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const MEMBER_ROLES = ["TENANT_OWNER", "ADMIN", "ADVERTISER", "CUSTOMER_SERVICE"] as const;
const INVITATION_STATUSES = ["pending", "expired"] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

function isEmail(value: unknown): value is string {
  return isString(value) && value.length <= 255 && EMAIL.test(value);
}

function isInstant(value: unknown): value is string {
  return isString(value) && INSTANT.test(value) && !Number.isNaN(Date.parse(value));
}

function isOneOf<T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return isString(value) && values.includes(value as T[number]);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key)) && keys.every((key) => key in value);
}

function invalid(): never {
  throw new Error("API anggota mengembalikan data yang tidak valid.");
}

export function parseAdminMember(value: unknown): AdminMember {
  if (!isObject(value) || !hasOnlyKeys(value, ["id", "userId", "name", "email", "role", "createdAt"]) ||
      !isNonEmptyString(value.id) || !isNonEmptyString(value.userId) || !isString(value.name) ||
      !isEmail(value.email) || !isOneOf(value.role, MEMBER_ROLES) || !isInstant(value.createdAt)) {
    invalid();
  }
  return {
    id: value.id,
    userId: value.userId,
    name: value.name,
    email: value.email,
    role: value.role,
    createdAt: value.createdAt,
  };
}

export function parseMemberInvitation(value: unknown): MemberInvitation {
  if (!isObject(value) || !hasOnlyKeys(value, ["id", "email", "role", "status", "expiresAt", "createdAt", "delivery"]) ||
      !isNonEmptyString(value.id) || !isEmail(value.email) || !isOneOf(value.role, MEMBER_ROLES) ||
      !isOneOf(value.status, INVITATION_STATUSES) || !isInstant(value.expiresAt) ||
      !isInstant(value.createdAt) || value.delivery !== "not_configured") {
    invalid();
  }
  return {
    id: value.id,
    email: value.email,
    role: value.role,
    status: value.status,
    expiresAt: value.expiresAt,
    createdAt: value.createdAt,
    delivery: value.delivery,
  };
}

export function parseMemberDirectory(value: unknown): MemberDirectory {
  if (!isObject(value) || !hasOnlyKeys(value, ["members", "invitations"]) ||
      !Array.isArray(value.members) || !Array.isArray(value.invitations)) {
    invalid();
  }
  return {
    members: value.members.map(parseAdminMember),
    invitations: value.invitations.map(parseMemberInvitation),
  };
}

async function responsePayload(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isObject(body) && isString(body.error)
      ? body.error
      : `Permintaan anggota gagal (${response.status}).`;
    throw new AdminMembersError(message, response.status);
  }
  return body;
}

export async function listAdminMembers(fetcher: typeof fetch = fetch): Promise<MemberDirectory> {
  const response = await fetcher(ADMIN_MEMBERS_PATH, {
    credentials: "include",
    cache: "no-store",
  });
  return parseMemberDirectory(await responsePayload(response));
}

export async function inviteAdminMember(
  input: { email: string; role: InvitationRole },
  fetcher: typeof fetch = fetch
): Promise<MemberInvitation> {
  const response = await fetcher(`${ADMIN_MEMBERS_PATH}/invitations`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseMemberInvitation(await responsePayload(response));
}

export async function resendMemberInvitation(
  invitationId: string,
  fetcher: typeof fetch = fetch
): Promise<MemberInvitation> {
  const response = await fetcher(`${ADMIN_MEMBERS_PATH}/invitations/${encodeURIComponent(invitationId)}/resend`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  return parseMemberInvitation(await responsePayload(response));
}

export async function cancelMemberInvitation(
  invitationId: string,
  fetcher: typeof fetch = fetch
): Promise<{ id: string; status: "canceled" }> {
  const body = await responsePayload(await fetcher(
    `${ADMIN_MEMBERS_PATH}/invitations/${encodeURIComponent(invitationId)}`,
    { method: "DELETE", credentials: "include" }
  ));
  if (!isObject(body) || !hasOnlyKeys(body, ["id", "status"]) ||
      !isNonEmptyString(body.id) || body.status !== "canceled") {
    invalid();
  }
  return { id: body.id, status: body.status };
}

export async function updateAdminMemberRole(
  memberId: string,
  role: MemberRole,
  fetcher: typeof fetch = fetch
): Promise<MemberRoleResult> {
  const body = await responsePayload(await fetcher(`${ADMIN_MEMBERS_PATH}/${encodeURIComponent(memberId)}/role`, {
    method: "PUT",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role }),
  }));
  if (!isObject(body) || !hasOnlyKeys(body, ["member", "alreadyApplied"]) ||
      typeof body.alreadyApplied !== "boolean") {
    invalid();
  }
  return { member: parseAdminMember(body.member), alreadyApplied: body.alreadyApplied };
}

export async function removeAdminMember(
  memberId: string,
  fetcher: typeof fetch = fetch
): Promise<{ id: string; removed: true }> {
  const body = await responsePayload(await fetcher(
    `${ADMIN_MEMBERS_PATH}/${encodeURIComponent(memberId)}`,
    { method: "DELETE", credentials: "include" }
  ));
  if (!isObject(body) || !hasOnlyKeys(body, ["id", "removed"]) ||
      !isNonEmptyString(body.id) || body.removed !== true) {
    invalid();
  }
  return { id: body.id, removed: true };
}
