import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { app } from "../src/app.ts";
import {
  client,
  migrationClient,
  migrationDb,
  platformClient,
  schema,
} from "@dotads/db";

const suffix = crypto.randomUUID().slice(0, 8);
const invitedEmail = `invitee-${suffix}@example.com`;
const otherEmail = `other-${suffix}@example.com`;
const password = "InvitationSmoke123!";
const tenantId = "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8";
const inviterId = "usr_alpha_owner_01";

async function signUp(email: string, name: string) {
  const response = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3100" },
    body: JSON.stringify({ email, name, password }),
  });
  assert.equal(response.status, 200, `Better Auth sign-up failed for ${name}`);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie, "Sign-up must establish an authenticated session cookie");
  const sessionResponse = await app.request("/api/auth/get-session", { headers: { cookie } });
  const session = await sessionResponse.json() as { user: { id: string }; session: { id: string } };
  return { cookie, userId: session.user.id, sessionId: session.session.id };
}

async function accept(invitationId: string, cookie?: string, origin = "http://localhost:3100") {
  return app.request(`/api/v1/invitations/${invitationId}/accept`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(origin ? { origin } : {}),
    },
    body: "{}",
  });
}

async function seedInvitation(
  status: "pending" | "accepted" | "rejected" | "canceled",
  expiresAt: Date,
  organizationId: string,
  role: string = "ADMIN"
) {
  const id = crypto.randomUUID();
  await migrationDb.insert(schema.invitations).values({
    id,
    organizationId,
    email: invitedEmail.toUpperCase(),
    role,
    status,
    expiresAt,
    inviterId,
  });
  return id;
}

async function runInvitationAcceptanceSmoke() {
  console.log("Starting session-bound invitation acceptance smoke...");
  const openApiResponse = await app.request("/api/v1/openapi.json");
  const openApi = await openApiResponse.json() as { paths?: Record<string, Record<string, unknown>> };
  assert.ok(openApi.paths?.["/api/v1/invitations/{id}/accept"]?.post, "Invitation acceptance must be exported in OpenAPI");
  const invited = await signUp(invitedEmail, "Invited Operator");
  const other = await signUp(otherEmail, "Other User");
  const malformed = await accept("not-a-uuid", invited.cookie);
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: "Invalid request", code: "INVALID_REQUEST" });

  const orgIds = {
    success: `org_inv_success_${suffix}`,
    expired: `org_inv_expired_${suffix}`,
    canceled: `org_inv_cancelled_${suffix}`,
    rejected: `org_inv_rejected_${suffix}`,
    invalidRole: `org_inv_invalid_role_${suffix}`,
    inactive: `org_inv_inactive_${suffix}`,
  };
  const inactiveTenantId = crypto.randomUUID();
  await migrationDb.insert(schema.tenants).values({
    id: inactiveTenantId,
    name: "Invitation Suspended Tenant",
    slug: `invitation-suspended-${suffix}`,
    status: "suspended",
  });
  await migrationDb.insert(schema.organizations).values([
    ...Object.entries(orgIds).filter(([key]) => key !== "inactive").map(([key, id]) => ({
      id, tenantId, name: `Invitation ${key}`, slug: `invitation-${key}-${suffix}`,
    })),
    { id: orgIds.inactive, tenantId: inactiveTenantId, name: "Inactive Invitation Org", slug: `invitation-inactive-${suffix}` },
  ]);

  const future = new Date(Date.now() + 86_400_000);
  const successId = await seedInvitation("pending", future, orgIds.success, "CUSTOMER_SERVICE");
  const expiredId = await seedInvitation("pending", new Date(Date.now() - 1_000), orgIds.expired);
  const canceledId = await seedInvitation("canceled", future, orgIds.canceled);
  const rejectedId = await seedInvitation("rejected", future, orgIds.rejected);
  const invalidRoleId = await seedInvitation("pending", future, orgIds.invalidRole, "END_BUYER");
  const inactiveId = await seedInvitation("pending", future, orgIds.inactive);

  assert.equal((await accept(successId)).status, 401, "Acceptance must require a real Better Auth session");
  const forged = await app.request(`/api/v1/invitations/${successId}/accept`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer test-superadmin-token",
      "x-user-id": invited.userId,
      "x-user-email": invitedEmail,
      origin: "http://localhost:3100",
    },
    body: "{}",
  });
  assert.equal(forged.status, 401, "Header-forged test identities must not enter session-only acceptance");
  assert.equal((await accept(successId, other.cookie)).status, 404, "Another authenticated email must not discover the invitation");
  assert.equal((await accept(successId, invited.cookie, "https://attacker.invalid")).status, 403, "Cross-site browser acceptance must be rejected");
  assert.equal((await accept(expiredId, invited.cookie)).status, 409);
  assert.equal((await accept(canceledId, invited.cookie)).status, 409);
  assert.equal((await accept(rejectedId, invited.cookie)).status, 409);
  assert.equal((await accept(invalidRoleId, invited.cookie)).status, 409, "Buyer roles must never enter the CMS through invitations");
  assert.equal((await accept(inactiveId, invited.cookie)).status, 409, "Suspended tenants must reject acceptance");

  const accepted = await accept(successId, invited.cookie);
  assert.equal(accepted.status, 200);
  const acceptedBody = await accepted.json() as Record<string, unknown>;
  assert.deepEqual(acceptedBody, {
    membershipId: acceptedBody.membershipId,
    organizationId: orgIds.success,
    role: "CUSTOMER_SERVICE",
    alreadyAccepted: false,
  });
  assert.equal(typeof acceptedBody.membershipId, "string");

  const canonicalSession = await app.request("/api/v1/session", { headers: { cookie: invited.cookie } });
  assert.equal(canonicalSession.status, 200, "Accepted session must immediately resolve canonical tenant context");
  assert.deepEqual(await canonicalSession.json(), {
    userId: invited.userId,
    userEmail: invitedEmail,
    tenantId,
    organizationId: orgIds.success,
    role: "CUSTOMER_SERVICE",
    tenantName: "Store Alpha Gadget",
    tenantStatus: "active",
  });

  const repeated = await accept(successId, invited.cookie);
  assert.equal(repeated.status, 200);
  assert.deepEqual(await repeated.json(), { ...acceptedBody, alreadyAccepted: true });

  const memberships = await migrationDb.select().from(schema.members).where(and(
    eq(schema.members.organizationId, orgIds.success),
    eq(schema.members.userId, invited.userId)
  ));
  assert.equal(memberships.length, 1, "Idempotent acceptance must not duplicate membership");
  const audits = await migrationDb.select().from(schema.auditLogs).where(and(
    eq(schema.auditLogs.action, "member.invitation_accepted"),
    eq(schema.auditLogs.targetId, successId)
  ));
  assert.equal(audits.length, 1, "Idempotent acceptance must not duplicate audit evidence");
  assert.equal(audits[0]?.actorId, invited.userId);
  assert.equal(audits[0]?.actorEmail, invitedEmail);
  assert.equal(audits[0]?.actorRole, "CUSTOMER_SERVICE");
  assert.equal(audits[0]?.tenantId, tenantId);
  assert.equal((audits[0]?.metadataJson as Record<string, unknown>).role, "CUSTOMER_SERVICE");

  const persistedSession = await migrationDb.select().from(schema.sessions)
    .where(eq(schema.sessions.id, invited.sessionId));
  assert.equal(persistedSession[0]?.activeOrganizationId, orgIds.success);
  console.log("SESSION-BOUND INVITATION ACCEPTANCE SMOKE PASSED");
}

runInvitationAcceptanceSmoke().then(async () => {
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
}).catch(async (error: unknown) => {
  console.error("Invitation acceptance smoke FAILED:", error instanceof Error ? error.message : String(error));
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
  process.exitCode = 1;
});
