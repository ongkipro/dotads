import assert from "node:assert/strict";
import {
  createPlatformTenant,
  listPlatformTenants,
  updatePlatformTenantStatus,
} from "../src/lib/platform-tenants.ts";

const tenant = {
  id: "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8",
  name: "Nusa Commerce",
  slug: "nusa-commerce",
  status: "active",
  tier: "pro",
  customDomain: null,
  settingsJson: {},
  createdAt: "2026-08-16T00:00:00.000Z",
  updatedAt: "2026-08-16T00:00:00.000Z",
};

const calls: Array<{ url: string; init?: RequestInit }> = [];
const okFetch = (async (url: string | URL | Request, init?: RequestInit) => {
  calls.push({ url: String(url), init });
  const payload = init?.method === "PATCH" ? { ...tenant, status: "suspended" } : tenant;
  return new Response(JSON.stringify(init?.method ? payload : [payload]), {
    status: init?.method === "POST" ? 201 : 200,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

const listed = await listPlatformTenants(okFetch);
assert.equal(listed[0]?.tier, "PRO");
assert.equal(calls[0]?.url, "/api/v1/platform/tenants");
assert.equal(calls[0]?.init?.credentials, "same-origin");

const created = await createPlatformTenant({ name: "Nusa Commerce", slug: "nusa-commerce", tier: "PRO" }, okFetch);
assert.equal(created.id, tenant.id);
assert.deepEqual(JSON.parse(String(calls[1]?.init?.body)), {
  name: "Nusa Commerce",
  slug: "nusa-commerce",
  tier: "PRO",
});

const suspended = await updatePlatformTenantStatus(tenant.id, { status: "suspended", reason: "Manual risk review" }, okFetch);
assert.equal(suspended.status, "suspended");
assert.equal(calls[2]?.url, `/api/v1/platform/tenants/${tenant.id}/status`);
assert.deepEqual(JSON.parse(String(calls[2]?.init?.body)), { status: "suspended", reason: "Manual risk review" });

const deniedFetch = (async () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })) as typeof fetch;
await assert.rejects(() => listPlatformTenants(deniedFetch), /Forbidden/);

const malformedFetch = (async () => new Response(JSON.stringify([{ id: "broken" }]), { status: 200 })) as typeof fetch;
await assert.rejects(() => listPlatformTenants(malformedFetch), /invalid tenant record/);

const invalidDateFetch = (async () => new Response(JSON.stringify([{ ...tenant, createdAt: "not-a-date" }]), { status: 200 })) as typeof fetch;
await assert.rejects(() => listPlatformTenants(invalidDateFetch), /invalid tenant record/);

console.log("PLATFORM TENANT API CLIENT SMOKE TEST PASSED");
