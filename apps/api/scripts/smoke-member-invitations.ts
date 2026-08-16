import assert from "node:assert/strict";
import type { Context, Next } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";
import {
  client,
  migrationClient,
  migrationDb,
  platformClient,
  schema,
  withDatabaseContext,
} from "@dotads/db";
import type { Role } from "@dotads/auth";
import { createMembersRouter } from "../src/routes/members.ts";
import type { AppEnv, AuthContext } from "../src/middleware/auth.ts";

const suffix = crypto.randomUUID().slice(0, 8);
const tenantId = crypto.randomUUID();
const organizationId = `org_members_${suffix}`;
const ownerUserId = `usr_members_owner_${suffix}`;
const ownerMemberId = `mem_members_owner_${suffix}`;
const adminUserId = `usr_members_admin_${suffix}`;
const adminMemberId = `mem_members_admin_${suffix}`;

function errorChainIncludes(error: unknown, expected: string): boolean {
  const seen = new Set<unknown>();
  let current = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if ("message" in current && String(current.message).includes(expected)) return true;
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}

async function testAuthMiddleware(c: Context<AppEnv>, next: Next) {
  const role = (c.req.header("x-user-role") || "TENANT_OWNER") as Role;
  const userId = c.req.header("x-user-id") || ownerUserId;
  const auth: AuthContext = {
    userId,
    userEmail: c.req.header("x-user-email") || "owner.members@dotads.invalid",
    tenantId,
    organizationId,
    role,
    tenantName: "Members Smoke Tenant",
    tenantStatus: "active",
  };
  c.set("auth", auth);
  return withDatabaseContext(auth, next);
}

const app = new OpenAPIHono<AppEnv>();
app.route("/api/v1/members", createMembersRouter(testAuthMiddleware));

async function jsonRequest(
  path: string,
  init: RequestInit = {},
  actor: { role?: Role; userId?: string; email?: string } = {}
) {
  const response = await app.request(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-user-role": actor.role || "TENANT_OWNER",
      "x-user-id": actor.userId || ownerUserId,
      "x-user-email": actor.email || "owner.members@dotads.invalid",
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null) as Record<string, any> | null;
  return { response, body };
}

async function seedFixtures() {
  await migrationDb.insert(schema.tenants).values({
    id: tenantId,
    name: "Members Smoke Tenant",
    slug: `members-smoke-${suffix}`,
  });
  await migrationDb.insert(schema.organizations).values({
    id: organizationId,
    tenantId,
    name: "Members Smoke Organization",
    slug: `members-smoke-org-${suffix}`,
  });
  await migrationDb.insert(schema.users).values([
    { id: ownerUserId, name: "Owner Smoke", email: `owner-${suffix}@dotads.invalid`, emailVerified: true },
    { id: adminUserId, name: "Admin Smoke", email: `admin-${suffix}@dotads.invalid`, emailVerified: true },
  ]);
  await migrationDb.insert(schema.members).values([
    { id: ownerMemberId, organizationId, userId: ownerUserId, role: "TENANT_OWNER" },
    { id: adminMemberId, organizationId, userId: adminUserId, role: "ADMIN" },
  ]);
}

async function runMemberInvitationsSmoke() {
  console.log("Starting Members API Lifecycle Smoke Test...");
  await seedFixtures();

  const list = await jsonRequest("/api/v1/members");
  assert.equal(list.response.status, 200);
  assert.equal(list.body?.members.length, 2);
  assert.deepEqual(list.body?.invitations, []);
  assert.equal("organizationId" in list.body!.members[0], false, "Response must not expose a caller-controlled organization scope");

  assert.equal((await jsonRequest("/api/v1/members", {}, { role: "CUSTOMER_SERVICE", userId: adminUserId })).response.status, 200);
  assert.equal((await jsonRequest("/api/v1/members", {}, { role: "ADVERTISER", userId: adminUserId })).response.status, 403);
  assert.equal((await jsonRequest("/api/v1/members/invitations", {
    method: "POST",
    body: JSON.stringify({ email: "denied@dotads.invalid", role: "ADMIN" }),
  }, { role: "ADMIN", userId: adminUserId })).response.status, 403);

  const inviteEmail = `Invited-${suffix}@Example.COM`;
  const invited = await jsonRequest("/api/v1/members/invitations", {
    method: "POST",
    body: JSON.stringify({ email: ` ${inviteEmail} `, role: "CUSTOMER_SERVICE" }),
  });
  assert.equal(invited.response.status, 201);
  assert.equal(invited.body?.email, inviteEmail.toLowerCase());
  assert.equal(invited.body?.status, "pending");
  assert.equal(invited.body?.delivery, "not_configured");

  const duplicate = await jsonRequest("/api/v1/members/invitations", {
    method: "POST",
    body: JSON.stringify({ email: inviteEmail.toLowerCase(), role: "ADMIN" }),
  });
  assert.equal(duplicate.response.status, 409);
  await assert.rejects(
    migrationDb.insert(schema.invitations).values({
      id: `inv_members_duplicate_${suffix}`,
      organizationId,
      email: invited.body!.email.toUpperCase(),
      role: "ADMIN",
      inviterId: ownerUserId,
      expiresAt: new Date(Date.now() + 86_400_000),
    }),
    (error) => errorChainIncludes(error, "uniq_pending_invitation_org_email")
  );

  await migrationDb.update(schema.invitations).set({ expiresAt: new Date(Date.now() - 1_000) })
    .where(eq(schema.invitations.id, invited.body!.id));
  const expiredList = await jsonRequest("/api/v1/members");
  assert.equal(expiredList.body?.invitations[0].status, "expired");

  const resent = await jsonRequest(`/api/v1/members/invitations/${invited.body!.id}/resend`, { method: "POST", body: "{}" });
  assert.equal(resent.response.status, 200);
  assert.equal(resent.body?.status, "pending");
  assert.equal(resent.body?.delivery, "not_configured");

  const cancelled = await jsonRequest(`/api/v1/members/invitations/${invited.body!.id}`, { method: "DELETE" });
  assert.equal(cancelled.response.status, 200);
  assert.equal(cancelled.body?.status, "canceled");
  assert.equal((await jsonRequest(`/api/v1/members/invitations/${invited.body!.id}/resend`, { method: "POST", body: "{}" })).response.status, 409);
  assert.equal((await jsonRequest(`/api/v1/members/invitations/${invited.body!.id}`, { method: "DELETE" })).response.status, 409);

  const acceptedInvitationId = `inv_members_accepted_${suffix}`;
  await migrationDb.insert(schema.invitations).values({
    id: acceptedInvitationId,
    organizationId,
    email: `accepted-${suffix}@dotads.invalid`,
    role: "ADMIN",
    status: "accepted",
    inviterId: ownerUserId,
    expiresAt: new Date(Date.now() + 86_400_000),
  });
  assert.equal((await jsonRequest(`/api/v1/members/invitations/${acceptedInvitationId}/resend`, { method: "POST", body: "{}" })).response.status, 409);
  assert.equal((await jsonRequest(`/api/v1/members/invitations/${acceptedInvitationId}`, { method: "DELETE" })).response.status, 409);

  const roleChanged = await jsonRequest(`/api/v1/members/${adminMemberId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role: "ADVERTISER" }),
  });
  assert.equal(roleChanged.response.status, 200);
  assert.equal(roleChanged.body?.member.role, "ADVERTISER");
  assert.equal(roleChanged.body?.alreadyApplied, false);
  const repeatedRole = await jsonRequest(`/api/v1/members/${adminMemberId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role: "ADVERTISER" }),
  });
  assert.equal(repeatedRole.body?.alreadyApplied, true);

  const ownerDemotion = await jsonRequest(`/api/v1/members/${ownerMemberId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role: "ADMIN" }),
  });
  assert.equal(ownerDemotion.response.status, 409);
  assert.match(ownerDemotion.body?.error, /last tenant owner/i);
  assert.equal((await jsonRequest(`/api/v1/members/${ownerMemberId}`, { method: "DELETE" })).response.status, 409);

  const secondOwnerUserId = `usr_members_owner_two_${suffix}`;
  const secondOwnerMemberId = `mem_members_owner_two_${suffix}`;
  await migrationDb.insert(schema.users).values({
    id: secondOwnerUserId,
    name: "Second Owner Smoke",
    email: `owner-two-${suffix}@dotads.invalid`,
  });
  await migrationDb.insert(schema.members).values({
    id: secondOwnerMemberId,
    organizationId,
    userId: secondOwnerUserId,
    role: "TENANT_OWNER",
  });
  const selfRoleChange = await jsonRequest(`/api/v1/members/${secondOwnerMemberId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role: "ADMIN" }),
  }, { role: "TENANT_OWNER", userId: secondOwnerUserId, email: `owner-two-${suffix}@dotads.invalid` });
  assert.equal(selfRoleChange.response.status, 409);
  assert.match(selfRoleChange.body?.error, /own role/i);
  const selfRemoval = await jsonRequest(
    `/api/v1/members/${secondOwnerMemberId}`,
    { method: "DELETE" },
    { role: "TENANT_OWNER", userId: secondOwnerUserId, email: `owner-two-${suffix}@dotads.invalid` }
  );
  assert.equal(selfRemoval.response.status, 409);
  assert.match(selfRemoval.body?.error, /own active membership/i);

  const foreignTenantId = crypto.randomUUID();
  const foreignOrgId = `org_members_foreign_${suffix}`;
  const foreignUserId = `usr_members_foreign_${suffix}`;
  const foreignMemberId = `mem_members_foreign_${suffix}`;
  await migrationDb.insert(schema.tenants).values({ id: foreignTenantId, name: "Foreign Members Tenant", slug: `members-foreign-${suffix}` });
  await migrationDb.insert(schema.organizations).values({ id: foreignOrgId, tenantId: foreignTenantId, name: "Foreign Org", slug: `members-foreign-org-${suffix}` });
  await migrationDb.insert(schema.users).values({ id: foreignUserId, name: "Foreign User", email: `foreign-${suffix}@dotads.invalid` });
  await migrationDb.insert(schema.members).values({ id: foreignMemberId, organizationId: foreignOrgId, userId: foreignUserId, role: "ADMIN" });
  assert.equal((await jsonRequest(`/api/v1/members/${foreignMemberId}/role`, {
    method: "PUT", body: JSON.stringify({ role: "CUSTOMER_SERVICE" }),
  })).response.status, 404);
  assert.equal((await jsonRequest(`/api/v1/members/${foreignMemberId}`, { method: "DELETE" })).response.status, 404);

  const removed = await jsonRequest(`/api/v1/members/${adminMemberId}`, { method: "DELETE" });
  assert.equal(removed.response.status, 200);
  assert.equal(removed.body?.removed, true);
  assert.equal((await jsonRequest(`/api/v1/members/${adminMemberId}`, { method: "DELETE" })).response.status, 404);

  const persistedAdmin = await migrationDb.select().from(schema.members).where(eq(schema.members.id, adminMemberId));
  assert.equal(persistedAdmin.length, 0);
  const audits = await migrationDb.select().from(schema.auditLogs).where(and(
    eq(schema.auditLogs.tenantId, tenantId),
    eq(schema.auditLogs.actorId, ownerUserId)
  ));
  for (const action of [
    "member.invitation_created",
    "member.invitation_resent",
    "member.invitation_cancelled",
    "member.role_updated",
    "member.removed",
  ]) {
    assert.ok(audits.some((entry) => entry.action === action), `Missing transactional audit action ${action}`);
  }

  console.log("MEMBERS API LIFECYCLE SMOKE PASSED");
}

runMemberInvitationsSmoke().then(async () => {
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
}).catch(async (error: unknown) => {
  console.error("Members API Lifecycle Smoke FAILED:", error instanceof Error ? error.message : String(error));
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
  process.exitCode = 1;
});
