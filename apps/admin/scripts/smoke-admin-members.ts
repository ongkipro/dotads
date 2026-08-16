import assert from "node:assert/strict";
import {
  AdminMembersError,
  cancelMemberInvitation,
  inviteAdminMember,
  listAdminMembers,
  parseAdminMember,
  parseMemberDirectory,
  parseMemberInvitation,
  removeAdminMember,
  resendMemberInvitation,
  updateAdminMemberRole,
} from "../src/lib/admin-members.ts";

const createdAt = "2026-08-16T12:00:00.000Z";
const expiresAt = "2026-08-23T12:00:00+07:00";
const member = {
  id: "member_owner_01",
  userId: "user_owner_01",
  name: "Owner Toko",
  email: "owner@example.com",
  role: "TENANT_OWNER",
  createdAt,
};
const invitation = {
  id: "invitation_01",
  email: "admin@example.com",
  role: "ADMIN",
  status: "pending",
  expiresAt,
  createdAt,
  delivery: "not_configured",
};

assert.equal(parseAdminMember(member).role, "TENANT_OWNER");
assert.equal(parseMemberInvitation(invitation).delivery, "not_configured");
assert.deepEqual(parseMemberDirectory({ members: [member], invitations: [invitation] }), {
  members: [member],
  invitations: [invitation],
});
for (const malformed of [
  { ...member, role: "SUPER_ADMIN" },
  { ...member, createdAt: "2026-08-16" },
  { ...member, email: "not-an-email" },
  { ...member, unexpected: true },
]) assert.throws(() => parseAdminMember(malformed), /tidak valid/);
for (const malformed of [
  { ...invitation, status: "accepted" },
  { ...invitation, delivery: "sent" },
  { ...invitation, expiresAt: "tomorrow" },
  { ...invitation, unexpected: true },
]) assert.throws(() => parseMemberInvitation(malformed), /tidak valid/);
assert.throws(() => parseMemberDirectory({ members: [], invitations: [], total: 0 }), /tidak valid/);

let listInit: RequestInit | undefined;
await listAdminMembers(async (input, init) => {
  assert.equal(String(input), "/api/v1/members");
  listInit = init;
  return new Response(JSON.stringify({ members: [member], invitations: [invitation] }), { status: 200 });
});
assert.equal(listInit?.credentials, "include");
assert.equal(listInit?.cache, "no-store");

let inviteBody: unknown;
await inviteAdminMember({ email: "admin@example.com", role: "ADMIN" }, async (input, init) => {
  assert.equal(String(input), "/api/v1/members/invitations");
  assert.equal(init?.method, "POST");
  assert.equal(init?.credentials, "include");
  assert.deepEqual(init?.headers, { "content-type": "application/json" });
  inviteBody = JSON.parse(String(init?.body));
  return new Response(JSON.stringify(invitation), { status: 201 });
});
assert.deepEqual(inviteBody, { email: "admin@example.com", role: "ADMIN" });

let resendBody = "";
await resendMemberInvitation("invite/with space", async (input, init) => {
  assert.equal(String(input), "/api/v1/members/invitations/invite%2Fwith%20space/resend");
  assert.equal(init?.method, "POST");
  assert.equal(init?.credentials, "include");
  assert.deepEqual(init?.headers, { "content-type": "application/json" });
  resendBody = String(init?.body);
  return new Response(JSON.stringify(invitation), { status: 200 });
});
assert.equal(resendBody, "{}");

await cancelMemberInvitation("invitation_01", async (input, init) => {
  assert.equal(String(input), "/api/v1/members/invitations/invitation_01");
  assert.equal(init?.method, "DELETE");
  assert.equal(init?.credentials, "include");
  assert.equal(init?.body, undefined);
  return new Response(JSON.stringify({ id: "invitation_01", status: "canceled" }), { status: 200 });
});

let roleBody: unknown;
const roleResult = await updateAdminMemberRole("member/01", "CUSTOMER_SERVICE", async (input, init) => {
  assert.equal(String(input), "/api/v1/members/member%2F01/role");
  assert.equal(init?.method, "PUT");
  assert.equal(init?.credentials, "include");
  roleBody = JSON.parse(String(init?.body));
  return new Response(JSON.stringify({ member: { ...member, role: "CUSTOMER_SERVICE" }, alreadyApplied: false }), { status: 200 });
});
assert.deepEqual(roleBody, { role: "CUSTOMER_SERVICE" });
assert.equal(roleResult.member.role, "CUSTOMER_SERVICE");
assert.equal(roleResult.alreadyApplied, false);

await removeAdminMember("member_01", async (input, init) => {
  assert.equal(String(input), "/api/v1/members/member_01");
  assert.equal(init?.method, "DELETE");
  assert.equal(init?.credentials, "include");
  return new Response(JSON.stringify({ id: "member_01", removed: true }), { status: 200 });
});

for (const status of [400, 403, 404, 409]) {
  await assert.rejects(
    () => listAdminMembers(async () => new Response(JSON.stringify({ error: `members-${status}` }), { status })),
    (error) => error instanceof AdminMembersError && error.status === status && error.message === `members-${status}`
  );
}
await assert.rejects(
  () => listAdminMembers(async () => new Response("not-json", { status: 409 })),
  (error) => error instanceof AdminMembersError && error.status === 409 && error.message === "Permintaan anggota gagal (409)."
);
await assert.rejects(
  () => resendMemberInvitation("invitation_01", async () => new Response(JSON.stringify({ ...invitation, delivery: "sent" }), { status: 200 })),
  /tidak valid/
);
await assert.rejects(
  () => updateAdminMemberRole("member_01", "ADMIN", async () => new Response(JSON.stringify({ member, alreadyApplied: "false" }), { status: 200 })),
  /tidak valid/
);
await assert.rejects(
  () => cancelMemberInvitation("invitation_01", async () => new Response(JSON.stringify({ id: "invitation_01", status: "accepted" }), { status: 200 })),
  /tidak valid/
);
await assert.rejects(
  () => removeAdminMember("member_01", async () => new Response(JSON.stringify({ id: "member_01", removed: false }), { status: 200 })),
  /tidak valid/
);

console.log("admin members client smoke passed");
