import { hasPermission, type Role } from "@dotads/auth";
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

  // 5. Customer Service has orders management, but NO builder update access
  assert.strictEqual(hasPermission("CUSTOMER_SERVICE", "orders:update"), true);
  assert.strictEqual(hasPermission("CUSTOMER_SERVICE", "builders:update"), false);

  // 6. End Buyer has storefront read & order create access
  assert.strictEqual(hasPermission("END_BUYER", "orders:create"), true);
  assert.strictEqual(hasPermission("END_BUYER", "members:read"), false);

  console.log("RBAC 6-ROLE PERMISSION SMOKE TEST PASSED!");
}

runRbacSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("RBAC Smoke FAILED:", msg);
  process.exit(1);
});
