import { app } from "../src/app.ts";
import assert from "node:assert";

async function runPlatformSmoke() {
  console.log("Starting Super Admin Platform Router & API Smoke Test...");

  // Mock super admin authorization headers
  const authHeaders = {
    "x-session-token": "test-superadmin-token",
    "x-tenant-id": "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8",
    "x-user-role": "SUPER_ADMIN",
    "x-user-email": "superadmin@dotads.com",
    "x-user-id": "superadmin_system",
    "content-type": "application/json",
  };

  // 1. GET /api/v1/platform/stats
  const statsRes = await app.request("/api/v1/platform/stats", {
    method: "GET",
    headers: authHeaders,
  });
  assert.strictEqual(statsRes.status, 200, "GET /api/v1/platform/stats must return 200");
  const statsData = await statsRes.json();
  assert.ok(typeof statsData.totalTenants === "number", "stats must contain totalTenants count");
  assert.strictEqual(statsData.securityAlertsCount, null, "Undefined security alert semantics must not return fabricated data");

  const nonPlatformStats = await app.request("/api/v1/platform/stats", {
    headers: { ...authHeaders, "x-user-role": "ADMIN" },
  });
  assert.strictEqual(nonPlatformStats.status, 403, "Tenant admins must not read platform-wide metrics");

  // 2. GET /api/v1/platform/tenants
  const tenantsRes = await app.request("/api/v1/platform/tenants", {
    method: "GET",
    headers: authHeaders,
  });
  assert.strictEqual(tenantsRes.status, 200, "GET /api/v1/platform/tenants must return 200");
  const tenantsList = await tenantsRes.json();
  assert.ok(Array.isArray(tenantsList), "tenants must be an array");
  assert.ok(!("settingsJson" in tenantsList[0]), "Tenant list must not expose arbitrary settings JSON");
  assert.deepStrictEqual(Object.keys(tenantsList[0]).sort(), [
    "createdAt", "customDomain", "id", "name", "slug", "status", "tier", "updatedAt",
  ]);

  // 3. POST /api/v1/platform/tenants (Provision new tenant)
  const newSlug = `test-store-${Date.now()}`;
  const createRes = await app.request("/api/v1/platform/tenants", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: "Automated Test Store",
      slug: newSlug,
      tier: "PRO",
      customDomain: `${newSlug}.com`,
    }),
  });
  assert.strictEqual(createRes.status, 201, "POST /api/v1/platform/tenants must return 201 Created");
  const createdTenant = await createRes.json();
  assert.strictEqual(createdTenant.slug, newSlug, "Created tenant must have correct slug");

  // 4. PATCH /api/v1/platform/tenants/:id/status (Mutate status)
  const statusRes = await app.request(`/api/v1/platform/tenants/${createdTenant.id}/status`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      status: "suspended",
      reason: "Automated smoke testing",
    }),
  });
  assert.strictEqual(statusRes.status, 200, "PATCH status must return 200");
  const updatedTenant = await statusRes.json();
  assert.strictEqual(updatedTenant.status, "suspended", "Tenant status must update to suspended");

  // 5. POST /api/v1/platform/tenants/:id/impersonate
  const impRes = await app.request(`/api/v1/platform/tenants/${createdTenant.id}/impersonate`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ reason: "Investigating merchant support incident" }),
  });
  assert.strictEqual(impRes.status, 501, "Insecure placeholder impersonation must fail closed");
  const impData = await impRes.json();
  assert.match(impData.error, /disabled/, "Response must explain why impersonation is unavailable");

  // 6. GET /api/v1/platform/audit-logs
  const auditRes = await app.request(`/api/v1/platform/audit-logs?limit=1&offset=0&tenantId=${createdTenant.id}&action=tenant.suspended`, {
    method: "GET",
    headers: authHeaders,
  });
  assert.strictEqual(auditRes.status, 200, "GET /api/v1/platform/audit-logs must return 200");
  const auditPayload = await auditRes.json();
  assert.strictEqual(auditPayload.items.length, 1, "Audit pagination limit must be enforced");
  assert.strictEqual(auditPayload.items[0].action, "tenant.suspended", "Audit exact action filter must be enforced");
  assert.strictEqual(auditPayload.items[0].tenantId, createdTenant.id, "Audit tenant filter must be enforced");
  assert.deepStrictEqual(Object.keys(auditPayload.items[0]).sort(), [
    "action", "actorEmail", "actorId", "actorRole", "createdAt", "id", "targetId", "targetType", "tenantId",
  ]);
  assert.deepStrictEqual(auditPayload.pagination, { limit: 1, offset: 0, total: 1 });

  const invalidPagination = await app.request("/api/v1/platform/audit-logs?limit=101", {
    headers: authHeaders,
  });
  assert.strictEqual(invalidPagination.status, 400, "Audit log limit above 100 must be rejected");

  console.log("SUPER ADMIN PLATFORM ROUTER SMOKE TEST PASSED!");
  process.exit(0);
}

runPlatformSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Platform Smoke FAILED:", msg);
  process.exit(1);
});
