import type { Role } from "@dotads/auth";
import { getNavigationForRole } from "../components/admin-navigation.ts";

function normalizePathname(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0] || "/";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function canAccessTenantAdminPath(role: Role, rawPathname: string): boolean {
  const pathname = normalizePathname(rawPathname);
  if (pathname === "/admin") {
    return role === "TENANT_OWNER" || role === "ADMIN" || role === "ADVERTISER" || role === "CUSTOMER_SERVICE";
  }
  if (!pathname.startsWith("/admin/")) return false;

  return getNavigationForRole(role)
    .filter((item) => item.href.startsWith("/admin/"))
    .sort((left, right) => right.href.length - left.href.length)
    .some((item) => matchesPrefix(pathname, item.href));
}

export function tenantAdminLandingPath(role: Role): string {
  return role === "ADVERTISER" ? "/admin/products" : "/admin";
}
