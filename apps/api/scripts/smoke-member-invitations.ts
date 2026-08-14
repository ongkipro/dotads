import { db, schema } from "@dotads/db";
import { eq } from "drizzle-orm";
import assert from "node:assert";

async function runMemberInvitationsSmoke() {
  console.log("Starting Member Invitations & Lifecycle Smoke Test...");

  const [user] = await db.select().from(schema.users);
  assert.ok(user, "User must exist from seed");

  const [org] = await db.select().from(schema.organizations);
  assert.ok(org, "Organization must exist from seed");

  const inviteId = `inv_smoke_${Date.now()}`;
  const inviteEmail = `invited_${Date.now()}@example.com`;

  // Create invitation
  const [invite] = await db
    .insert(schema.invitations)
    .values({
      id: inviteId,
      organizationId: org.id,
      email: inviteEmail,
      role: "ADMIN",
      inviterId: user.id,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })
    .returning();

  assert.strictEqual(invite.email, inviteEmail);
  assert.strictEqual(invite.status, "pending");

  // Accept invitation (Simulate member join)
  const newUserId = `usr_new_${Date.now()}`;
  await db.insert(schema.users).values({
    id: newUserId,
    name: "Invited Admin User",
    email: inviteEmail,
    emailVerified: true,
  });

  const memberId = `mem_new_${Date.now()}`;
  const [newMember] = await db
    .insert(schema.members)
    .values({
      id: memberId,
      organizationId: org.id,
      userId: newUserId,
      role: "ADMIN",
    })
    .returning();

  assert.strictEqual(newMember.role, "ADMIN");

  await db
    .update(schema.invitations)
    .set({ status: "accepted" })
    .where(eq(schema.invitations.id, invite.id));

  const [updatedInvite] = await db
    .select()
    .from(schema.invitations)
    .where(eq(schema.invitations.id, invite.id));

  assert.strictEqual(updatedInvite.status, "accepted");

  console.log("MEMBER INVITATIONS & LIFECYCLE SMOKE TEST PASSED!");
  process.exit(0);
}

runMemberInvitationsSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Member Invitations Smoke FAILED:", msg);
  process.exit(1);
});
