import { getNavigationForRole, ROLE_NAVIGATION } from "../src/components/admin-navigation.ts";
import assert from "node:assert";

async function runAdminNavigationSmoke() {
  console.log("Starting 6-Role Adaptive Admin Navigation Smoke Test...");

  // 1. Super Admin navigation assertion
  const superAdminNav = getNavigationForRole("SUPER_ADMIN");
  assert.strictEqual(superAdminNav.some((item) => item.href === "/super-admin/tenants"), true);
  assert.strictEqual(superAdminNav.some((item) => item.href === "/admin/orders"), false);

  // 2. Tenant Owner navigation assertion
  const ownerNav = getNavigationForRole("TENANT_OWNER");
  assert.strictEqual(ownerNav.some((item) => item.href === "/admin/orders"), true);
  assert.strictEqual(ownerNav.some((item) => item.href === "/admin/settings/members"), true);

  // 3. Advertiser navigation assertion
  const advertiserNav = getNavigationForRole("ADVERTISER");
  assert.strictEqual(advertiserNav.some((item) => item.href === "/admin/builders/forms"), true);
  assert.strictEqual(advertiserNav.some((item) => item.href === "/admin/settings/members"), false);

  // 4. CS navigation assertion
  const csNav = getNavigationForRole("CUSTOMER_SERVICE");
  assert.strictEqual(csNav.some((item) => item.href === "/admin/orders"), true);
  assert.strictEqual(csNav.some((item) => item.href === "/admin/builders/forms"), false);

  console.log("6-ROLE ADAPTIVE ADMIN NAVIGATION SMOKE TEST PASSED!");
}

runAdminNavigationSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Admin Navigation Smoke FAILED:", msg);
  process.exit(1);
});
