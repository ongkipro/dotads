import { hasPermission, type Role } from "@dotads/auth";
import { app } from "../src/app.ts";
import { resolveEffectiveRole, tenantStatusAllowsAccess } from "../src/middleware/auth.ts";
import { requiredAdminPermission } from "../src/routes/admin.ts";
import { validateGtinChecksum } from "@dotads/contracts";
import { client, platformClient } from "@dotads/db";
import assert from "node:assert";

async function runRbacSmoke() {
  console.log("Starting RBAC 6-Role Permission Assertion Smoke Test...");

  const roles: Role[] = ["SUPER_ADMIN", "TENANT_OWNER", "ADMIN", "ADVERTISER", "CUSTOMER_SERVICE", "END_BUYER"];

  // 1. Super Admin has full wildcard access
  assert.strictEqual(hasPermission("SUPER_ADMIN", "anything:at:all"), true);

  // 2. Tenant Owner has tenant management and billing access
  assert.strictEqual(hasPermission("TENANT_OWNER", "tenant:update"), true);
  assert.strictEqual(hasPermission("TENANT_OWNER", "billing:read"), true);

  // 3. Admin does NOT have billing write access
  assert.strictEqual(hasPermission("ADMIN", "billing:update"), false);

  // 4. Advertiser has tracking and builder access, but NO members write access
  assert.strictEqual(hasPermission("ADVERTISER", "tracking:update"), true);
  assert.strictEqual(hasPermission("ADVERTISER", "members:create"), false);
  assert.strictEqual(hasPermission("ADVERTISER", "orders:read"), false);

  // 5. Customer Service has orders management, but NO builder update access
  assert.strictEqual(hasPermission("CUSTOMER_SERVICE", "orders:update"), true);
  assert.strictEqual(hasPermission("CUSTOMER_SERVICE", "builders:update"), false);

  // 6. End Buyer has storefront read & order create access
  assert.strictEqual(hasPermission("END_BUYER", "orders:create"), true);
  assert.strictEqual(hasPermission("END_BUYER", "members:read"), false);

  // 7. A tenant membership can never elevate a user to the global platform role.
  assert.strictEqual(resolveEffectiveRole("END_BUYER", "SUPER_ADMIN"), "END_BUYER");
  assert.strictEqual(resolveEffectiveRole("SUPER_ADMIN", "ADMIN"), "SUPER_ADMIN");
  assert.strictEqual(tenantStatusAllowsAccess("active"), true);
  assert.strictEqual(tenantStatusAllowsAccess("suspended"), false);
  assert.strictEqual(tenantStatusAllowsAccess("cancelled"), false);

  // 8. Every current admin route maps to an explicit permission domain.
  assert.strictEqual(requiredAdminPermission("GET", "/api/v1/admin/members"), "members:read");
  assert.strictEqual(requiredAdminPermission("POST", "/api/v1/admin/forms"), "builders:update");
  assert.strictEqual(requiredAdminPermission("DELETE", "/api/v1/admin/orders/order-id"), "orders:delete");

  // 9. Restricted roles are rejected before a tenant query or mutation executes.
  process.env.NODE_ENV = "test";
  const requestAs = (path: string, method: string, role: Role) =>
    app.request(path, {
      method,
      headers: {
        "x-session-token": "test-superadmin-token",
        "x-user-role": role,
        "content-type": "application/json",
      },
    });

  assert.strictEqual((await requestAs("/api/v1/admin/members", "GET", "ADVERTISER")).status, 403);
  assert.strictEqual((await requestAs("/api/v1/admin/forms", "GET", "CUSTOMER_SERVICE")).status, 403);
  assert.strictEqual((await requestAs("/api/v1/admin/orders/order-id", "DELETE", "ADVERTISER")).status, 403);
  assert.strictEqual((await requestAs("/api/v1/admin/orders", "GET", "ADVERTISER")).status, 403);
  assert.strictEqual((await requestAs("/api/v1/admin/orders/11111111-1111-4111-8111-111111111111", "DELETE", "ADMIN")).status, 403);

  const sessionResponse = await requestAs("/api/v1/session", "GET", "SUPER_ADMIN");
  assert.strictEqual(sessionResponse.status, 200);
  const sessionContext = await sessionResponse.json();
  assert.deepStrictEqual(Object.keys(sessionContext).sort(), [
    "organizationId", "role", "tenantId", "tenantName", "tenantStatus", "userEmail", "userId",
  ].sort());

  // 10. Mengantar callbacks fail closed before touching order data.
  const originalMengantarSecret = process.env.MENGANTAR_WEBHOOK_SECRET;
  delete process.env.MENGANTAR_WEBHOOK_SECRET;
  const unsignedWebhook = await app.request("/api/v1/webhooks/mengantar", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ waybill_number: "TEST-1", status: "DELIVERED" }),
  });
  assert.strictEqual(unsignedWebhook.status, 503);
  process.env.MENGANTAR_WEBHOOK_SECRET = "test-webhook-secret";
  const invalidWebhook = await app.request("/api/v1/webhooks/mengantar", {
    method: "POST",
    headers: { "content-type": "application/json", "x-mengantar-signature": "invalid" },
    body: JSON.stringify({ waybill_number: "TEST-1", status: "DELIVERED" }),
  });
  assert.strictEqual(invalidWebhook.status, 401);
  if (originalMengantarSecret) process.env.MENGANTAR_WEBHOOK_SECRET = originalMengantarSecret;
  else delete process.env.MENGANTAR_WEBHOOK_SECRET;

  // 11. GTIN validation rejects valid-looking digits with injected prefix/suffix bytes.
  assert.strictEqual(validateGtinChecksum("4006381333931"), true);
  assert.strictEqual(validateGtinChecksum("x4006381333931"), false);
  assert.strictEqual(validateGtinChecksum("4006381333931x"), false);

  await client.end();
  await platformClient.end();
  console.log("RBAC 6-ROLE PERMISSION SMOKE TEST PASSED!");
}

runRbacSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("RBAC Smoke FAILED:", msg);
  process.exit(1);
});
