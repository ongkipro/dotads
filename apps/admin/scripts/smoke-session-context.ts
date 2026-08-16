import assert from "node:assert/strict";
import { fetchSessionContext, parseSessionContext } from "../src/lib/session-context.ts";

const validContext = {
  userId: "usr_1",
  userEmail: "operator@example.test",
  tenantId: "tenant_1",
  organizationId: "org_1",
  role: "ADMIN",
  tenantName: "Nusa Commerce",
  tenantStatus: "active",
};

assert.deepEqual(parseSessionContext(validContext), validContext);
assert.equal(parseSessionContext({ ...validContext, role: "ROOT" }), null);
assert.equal(parseSessionContext({ ...validContext, tenantName: undefined }), null);
assert.equal(parseSessionContext(null), null);

const exactSelectionRequired = (async () => new Response(JSON.stringify({
  error: "Workspace selection required",
  code: "WORKSPACE_SELECTION_REQUIRED",
  workspaceSelectionRequired: true,
}), { status: 409 })) as typeof fetch;
assert.deepEqual(await fetchSessionContext("session=test", exactSelectionRequired), { status: "workspace_selection_required" });

const malformedSelectionRequired = (async () => new Response(JSON.stringify({
  error: "Conflict",
  workspaceSelectionRequired: true,
}), { status: 409 })) as typeof fetch;
assert.deepEqual(await fetchSessionContext("session=test", malformedSelectionRequired), {
  status: "unavailable",
  message: "Respons pemilihan workspace tidak valid.",
});

console.log("SESSION CONTEXT BOUNDARY SMOKE TEST PASSED");
