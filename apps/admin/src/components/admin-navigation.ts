import type { Role } from "@dotads/auth";

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  section: "Operasional Toko" | "Akses & Keamanan" | "Operasional Platform" | "Pengaturan Platform";
}

export const ROLE_NAVIGATION: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { title: "Ringkasan Platform", href: "/super-admin", iconName: "LayoutDashboard", section: "Operasional Platform" },
    { title: "Merchant SaaS", href: "/super-admin/tenants", iconName: "Building2", section: "Operasional Platform" },
    { title: "Pengaturan Platform", href: "/super-admin/settings", iconName: "Settings", section: "Pengaturan Platform" },
    { title: "Log Audit Global", href: "/super-admin/audit-logs", iconName: "ShieldAlert", section: "Pengaturan Platform" },
  ],
  TENANT_OWNER: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Operasional Toko" },
    { title: "Pesanan", href: "/admin/orders", iconName: "ShoppingCart", section: "Operasional Toko" },
    { title: "Produk", href: "/admin/products", iconName: "Package", section: "Operasional Toko" },
    { title: "Anggota Tim", href: "/admin/settings/members", iconName: "Users", section: "Akses & Keamanan" },
    { title: "Domain Kustom", href: "/admin/settings/domains", iconName: "Globe", section: "Akses & Keamanan" },
    { title: "Log Aktivitas", href: "/admin/settings/audit-logs", iconName: "ShieldCheck", section: "Akses & Keamanan" },
  ],
  ADMIN: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Operasional Toko" },
    { title: "Pesanan", href: "/admin/orders", iconName: "ShoppingCart", section: "Operasional Toko" },
    { title: "Produk", href: "/admin/products", iconName: "Package", section: "Operasional Toko" },
    { title: "Anggota Tim", href: "/admin/settings/members", iconName: "Users", section: "Akses & Keamanan" },
    { title: "Log Aktivitas", href: "/admin/settings/audit-logs", iconName: "ShieldCheck", section: "Akses & Keamanan" },
  ],
  ADVERTISER: [
    { title: "Produk", href: "/admin/products", iconName: "Package", section: "Operasional Toko" },
  ],
  CUSTOMER_SERVICE: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Operasional Toko" },
    { title: "Pesanan", href: "/admin/orders", iconName: "ShoppingCart", section: "Operasional Toko" },
    { title: "Produk", href: "/admin/products", iconName: "Package", section: "Operasional Toko" },
  ],
  END_BUYER: [
    { title: "Halaman Toko", href: "/", iconName: "Store", section: "Operasional Toko" },
    { title: "Lacak Pesanan", href: "/orders/track", iconName: "Search", section: "Operasional Toko" },
  ],
};

export function getNavigationForRole(role: Role): NavItem[] {
  return ROLE_NAVIGATION[role] || ROLE_NAVIGATION.END_BUYER;
}
