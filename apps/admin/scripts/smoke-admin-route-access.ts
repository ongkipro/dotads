import assert from "node:assert/strict";
import type { Role } from "@dotads/auth";
import { canAccessTenantAdminPath, tenantAdminLandingPath } from "../src/lib/admin-route-access.ts";

const matrix: Record<Role, { allowed: string[]; denied: string[] }> = {
  SUPER_ADMIN: {
    allowed: [],
    denied: ["/admin", "/admin/orders", "/admin/settings/store"],
  },
  TENANT_OWNER: {
    allowed: ["/admin", "/admin/orders/ord_1", "/admin/settings/domains", "/admin/integrations/autolaris"],
    denied: ["/super-admin", "/admin-legacy", "/admin/unknown"],
  },
  ADMIN: {
    allowed: ["/admin", "/admin/orders", "/admin/settings/members", "/admin/reconciliation"],
    denied: ["/admin/settings/domains", "/admin/integrations/autolaris", "/admin/orders-archive"],
  },
  ADVERTISER: {
    allowed: ["/admin", "/admin/products/prod_1", "/admin/builders/forms", "/admin/tracking"],
    denied: ["/admin/orders", "/admin/settings/members", "/admin/integrations/mengantar"],
  },
  CUSTOMER_SERVICE: {
    allowed: ["/admin", "/admin/orders/ord_1", "/admin/products", "/admin/integrations/mengantar", "/admin/operations/shipping-check", "/admin/settings/members"],
    denied: ["/admin/builders/forms", "/admin/settings/store"],
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
