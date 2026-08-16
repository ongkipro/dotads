import assert from "node:assert/strict";
import { acceptInvitation, fetchInvitationAuthState, InvitationAcceptanceError, isInvitationId, parseInvitationAcceptance, safeInvitationReturnTo } from "../src/lib/invitation-acceptance.ts";

const id = "123e4567-e89b-42d3-a456-426614174000";
const accepted = { membershipId: "member_1", organizationId: "org_1", role: "ADMIN", alreadyAccepted: false };
assert.equal(isInvitationId(id), true);
assert.equal(isInvitationId("not-an-id"), false);
assert.deepEqual(parseInvitationAcceptance(accepted), accepted);
for (const malformed of [{ ...accepted, role: "TENANT_OWNER" }, { ...accepted, alreadyAccepted: "false" }, { ...accepted, extra: true }]) assert.throws(() => parseInvitationAcceptance(malformed), /tidak valid/);

for (const value of [`/invitations/${id}`, `//invitations/${id}`, `https://evil.test/invitations/${id}`, `/admin`, `/super-admin`, `/invitations/${id}?next=/admin`, `/invitations/not-uuid`, null]) {
  assert.equal(safeInvitationReturnTo(value), value === `/invitations/${id}` ? value : "/");
}

let request = { url: "", init: undefined as RequestInit | undefined };
assert.deepEqual(await acceptInvitation(id, async (input, init) => { request = { url: String(input), init }; return new Response(JSON.stringify(accepted), { status: 200 }); }), accepted);
assert.equal(request.url, `/api/v1/invitations/${id}/accept`);
assert.deepEqual(request.init, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: "{}" });
await assert.rejects(() => acceptInvitation("bad", async () => { throw new Error("must not fetch"); }), (error) => error instanceof InvitationAcceptanceError && error.code === "INVALID_REQUEST");

const errors = [[400, "INVALID_REQUEST"], [401, "SESSION_REQUIRED"], [403, "UNTRUSTED_ORIGIN"], [404, "INVITATION_NOT_FOUND"], [409, "INVITATION_NOT_ACCEPTABLE"]] as const;
for (const [status, code] of errors) await assert.rejects(() => acceptInvitation(id, async () => new Response(JSON.stringify({ error: code, code }), { status })), (error) => error instanceof InvitationAcceptanceError && error.status === status && error.code === code);
await assert.rejects(() => acceptInvitation(id, async () => new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 })), (error) => error instanceof InvitationAcceptanceError && error.code === "INTERNAL_ERROR");
await assert.rejects(() => acceptInvitation(id, async () => new Response(JSON.stringify({ error: "Unauthorized", code: "WRONG" }), { status: 401 })), (error) => error instanceof InvitationAcceptanceError && error.code === "INVALID_RESPONSE");

let authRequest = { url: "", cookie: "" };
assert.equal(await fetchInvitationAuthState("better-auth.session_token=invitee", async (input, init) => {
  authRequest = { url: String(input), cookie: String((init?.headers as Record<string, string>)?.cookie) };
  return new Response(JSON.stringify({ user: { id: "invited-user-with-zero-memberships" }, session: { id: "session_1", activeOrganizationId: null } }), { status: 200 });
}), "authenticated");
assert.match(authRequest.url, /\/api\/auth\/get-session$/);
assert.equal(authRequest.cookie, "better-auth.session_token=invitee");
assert.equal(await fetchInvitationAuthState("", async () => new Response("null", { status: 200 })), "unauthenticated");
assert.equal(await fetchInvitationAuthState("", async () => new Response(JSON.stringify({ user: { id: "user_1" }, session: null }), { status: 200 })), "unavailable");
console.log("invitation acceptance client smoke passed");
