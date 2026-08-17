import assert from "node:assert/strict";
import type { Role } from "@dotads/auth";
import { canAccessTenantAdminPath, tenantAdminLandingPath } from "../src/lib/admin-route-access.ts";

const matrix: Record<Role, { allowed: string[]; denied: string[] }> = {
  SUPER_ADMIN: {
    allowed: [],
    denied: ["/admin", "/admin/orders", "/admin/settings/store"],
  },
  TENANT_OWNER: {
    allowed: ["/admin", "/admin/orders/ord_1", "/admin/products", "/admin/settings/members", "/admin/settings/domains", "/admin/settings/audit-logs"],
    denied: ["/super-admin", "/admin-legacy", "/admin/unknown", "/admin/integrations/autolaris", "/admin/profile"],
  },
  ADMIN: {
    allowed: ["/admin", "/admin/orders", "/admin/products", "/admin/settings/members", "/admin/settings/audit-logs"],
    denied: ["/admin/settings/domains", "/admin/integrations/autolaris", "/admin/reconciliation", "/admin/orders-archive"],
  },
  ADVERTISER: {
    allowed: ["/admin", "/admin/products/prod_1"],
    denied: ["/admin/orders", "/admin/settings/members", "/admin/integrations/mengantar", "/admin/builders/forms", "/admin/tracking"],
  },
  CUSTOMER_SERVICE: {
    allowed: ["/admin", "/admin/orders/ord_1", "/admin/products"],
    denied: ["/admin/settings/members", "/admin/builders/forms", "/admin/settings/store", "/admin/settings/audit-logs", "/admin/integrations/mengantar", "/admin/operations/shipping-check"],
  },
  END_BUYER: {
    allowed: [],
    denied: ["/admin", "/admin/orders", "/admin/products"],
  },
};

for (const [role, paths] of Object.entries(matrix) as Array<[Role, (typeof matrix)[Role]]>) {
  for (const pathname of paths.allowed) {
    assert.equal(canAccessTenantAdminPath(role, pathname), true, `${role} should access ${pathname}`);
  }
  for (const pathname of paths.denied) {
    assert.equal(canAccessTenantAdminPath(role, pathname), false, `${role} should not access ${pathname}`);
  }
}

assert.equal(tenantAdminLandingPath("ADVERTISER"), "/admin/products");
assert.equal(tenantAdminLandingPath("TENANT_OWNER"), "/admin");
assert.equal(tenantAdminLandingPath("ADMIN"), "/admin");
assert.equal(tenantAdminLandingPath("CUSTOMER_SERVICE"), "/admin");

console.log("SIX-ROLE TENANT ADMIN ROUTE ACCESS MATRIX PASSED");
