import assert from "node:assert/strict";
import {
  listWorkspaces,
  parseWorkspaceList,
  selectWorkspace,
} from "../src/lib/workspace-selection.ts";

const workspace = {
  organizationId: "org_nusa",
  organizationName: "PT Nusa Niaga",
  tenantName: "Nusa Commerce",
  tenantStatus: "active",
  role: "TENANT_OWNER",
};

assert.deepEqual(parseWorkspaceList({ workspaces: [workspace] }), [workspace]);
assert.throws(() => parseWorkspaceList({ workspaces: [{ ...workspace, role: "ROOT" }] }), /tidak valid/);
assert.throws(() => parseWorkspaceList({ workspaces: [{ ...workspace, role: "SUPER_ADMIN" }] }), /tidak valid/);
assert.throws(() => parseWorkspaceList({ workspaces: [{ ...workspace, role: "END_BUYER" }] }), /tidak valid/);
assert.throws(() => parseWorkspaceList({ workspaces: [{ ...workspace, tenantStatus: "provisioning" }] }), /tidak valid/);
assert.throws(() => parseWorkspaceList({ workspaces: [{ ...workspace, organizationName: undefined }] }), /tidak valid/);
assert.throws(() => parseWorkspaceList([]), /tidak valid/);

const calls: Array<{ url: string; init?: RequestInit }> = [];
const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
  calls.push({ url: String(url), init });
  const payload = init?.method === "POST"
    ? {
      userId: "usr_1",
      userEmail: "owner@nusa.test",
      tenantId: "tenant_nusa",
      organizationId: workspace.organizationId,
      role: workspace.role,
      tenantName: workspace.tenantName,
      tenantStatus: workspace.tenantStatus,
    }
    : { workspaces: [workspace] };
  return new Response(JSON.stringify(payload), { status: 200 });
}) as typeof fetch;

assert.equal((await listWorkspaces(fetcher))[0]?.organizationId, workspace.organizationId);
assert.equal(calls[0]?.url, "/api/v1/workspaces");
assert.equal(calls[0]?.init?.credentials, "same-origin");

const selected = await selectWorkspace(workspace.organizationId, fetcher);
assert.equal(selected.organizationId, workspace.organizationId);
assert.equal(calls[1]?.url, "/api/v1/workspaces/select");
assert.deepEqual(JSON.parse(String(calls[1]?.init?.body)), { organizationId: workspace.organizationId });

const forbidden = (async () => new Response(null, { status: 403 })) as typeof fetch;
await assert.rejects(() => selectWorkspace(workspace.organizationId, forbidden), /tidak aktif/);

console.log("WORKSPACE SELECTION BOUNDARY SMOKE TEST PASSED");
