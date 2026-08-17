import { getNavigationForRole } from "../src/components/admin-navigation.ts";
import assert from "node:assert";

async function runAdminNavigationSmoke() {
  console.log("Starting focused merchant navigation smoke test...");

  // 1. Super Admin navigation assertion
  const superAdminNav = getNavigationForRole("SUPER_ADMIN");
  assert.strictEqual(superAdminNav.some((item) => item.href === "/super-admin/tenants"), true);
  assert.strictEqual(superAdminNav.some((item) => item.href === "/admin/orders"), false);

  // 2. Tenant Owner navigation assertion
  const ownerNav = getNavigationForRole("TENANT_OWNER");
  assert.deepStrictEqual(ownerNav.map((item) => item.href), ["/admin", "/admin/orders", "/admin/products", "/admin/settings/members", "/admin/settings/domains", "/admin/settings/audit-logs"]);
  assert.strictEqual(ownerNav.some((item) => item.href.includes("builders") || item.href.includes("integrations")), false);

  const adminNav = getNavigationForRole("ADMIN");
  assert.deepStrictEqual(adminNav.map((item) => item.href), ["/admin", "/admin/orders", "/admin/products", "/admin/settings/members", "/admin/settings/audit-logs"]);

  // 3. Advertiser navigation assertion
  const advertiserNav = getNavigationForRole("ADVERTISER");
  assert.deepStrictEqual(advertiserNav.map((item) => item.href), ["/admin/products"]);

  // 4. CS navigation assertion
  const csNav = getNavigationForRole("CUSTOMER_SERVICE");
  assert.deepStrictEqual(csNav.map((item) => item.href), ["/admin", "/admin/orders", "/admin/products"]);
  assert.strictEqual(csNav.some((item) => item.href === "/admin/settings/audit-logs"), false);
  assert.strictEqual(csNav.some((item) => item.href === "/admin/settings/members"), false);

  for (const role of ["TENANT_OWNER", "ADMIN", "ADVERTISER", "CUSTOMER_SERVICE"] as const) {
    for (const item of getNavigationForRole(role)) {
      assert.match(item.title, /^(Ringkasan|Pesanan|Produk|Anggota Tim|Domain Kustom|Log Aktivitas)$/);
    }
  }

  console.log("FOCUSED MERCHANT NAVIGATION SMOKE TEST PASSED");
}

runAdminNavigationSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Admin Navigation Smoke FAILED:", msg);
  process.exit(1);
});
