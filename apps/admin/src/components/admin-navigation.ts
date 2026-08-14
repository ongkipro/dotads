import type { Role } from "@dotads/auth";

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  section: "Utama" | "Pemasaran & Operasional" | "Pengaturan" | "Operasional Platform" | "Pengaturan Platform";
}

export const ROLE_NAVIGATION: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { title: "Ringkasan Platform", href: "/super-admin", iconName: "LayoutDashboard", section: "Operasional Platform" },
    { title: "Merchant SaaS", href: "/super-admin/tenants", iconName: "Building2", section: "Operasional Platform" },
    { title: "Pengaturan Platform", href: "/super-admin/settings", iconName: "Settings", section: "Pengaturan Platform" },
    { title: "Log Audit Global", href: "/super-admin/audit-logs", iconName: "ShieldAlert", section: "Pengaturan Platform" },
  ],
  TENANT_OWNER: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Utama" },
    { title: "Pesanan", href: "/admin/orders", iconName: "ShoppingCart", section: "Utama" },
    { title: "Katalog Produk", href: "/admin/products", iconName: "Package", section: "Utama" },
    
    { title: "Landing Page Builder", href: "/admin/builders/pages", iconName: "Layers", section: "Pemasaran & Operasional" },
    { title: "Form Builder COD", href: "/admin/builders/forms", iconName: "FileSpreadsheet", section: "Pemasaran & Operasional" },
    { title: "Pelacakan Iklan CAPI", href: "/admin/tracking", iconName: "Radio", section: "Pemasaran & Operasional" },
    { title: "Ekspedisi Mengantar", href: "/admin/integrations/mengantar", iconName: "Truck", section: "Pemasaran & Operasional" },
    { title: "Cek Ongkir & WA", href: "/admin/operations/shipping-check", iconName: "Search", section: "Pemasaran & Operasional" },
    { title: "Rekonsiliasi & Payment", href: "/admin/reconciliation", iconName: "Receipt", section: "Pemasaran & Operasional" },
    { title: "Setting AutoLaris", href: "/admin/integrations/autolaris", iconName: "CreditCard", section: "Pemasaran & Operasional" },

    { title: "Identitas Toko", href: "/admin/settings/store", iconName: "Store", section: "Pengaturan" },
    { title: "Alamat Gudang", href: "/admin/settings/gudang", iconName: "MapPin", section: "Pengaturan" },
    { title: "Template WA CRM", href: "/admin/settings/crm", iconName: "MessageSquare", section: "Pengaturan" },
    { title: "Anggota Tim", href: "/admin/settings/members", iconName: "Users", section: "Pengaturan" },
    { title: "Domain Kustom", href: "/admin/settings/domains", iconName: "Globe", section: "Pengaturan" },
    { title: "Log Aktivitas", href: "/admin/settings/audit-logs", iconName: "ShieldCheck", section: "Pengaturan" },
    { title: "Profil Akun", href: "/admin/profile", iconName: "User", section: "Pengaturan" },
  ],
  ADMIN: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Utama" },
    { title: "Pesanan", href: "/admin/orders", iconName: "ShoppingCart", section: "Utama" },
    { title: "Katalog Produk", href: "/admin/products", iconName: "Package", section: "Utama" },
    { title: "Landing Page Builder", href: "/admin/builders/pages", iconName: "Layers", section: "Pemasaran & Operasional" },
    { title: "Form Builder COD", href: "/admin/builders/forms", iconName: "FileSpreadsheet", section: "Pemasaran & Operasional" },
    { title: "Pelacakan Iklan CAPI", href: "/admin/tracking", iconName: "Radio", section: "Pemasaran & Operasional" },
    { title: "Ekspedisi Mengantar", href: "/admin/integrations/mengantar", iconName: "Truck", section: "Pemasaran & Operasional" },
    { title: "Rekonsiliasi & Payment", href: "/admin/reconciliation", iconName: "Receipt", section: "Pemasaran & Operasional" },
  ],
  ADVERTISER: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Utama" },
    { title: "Landing Page Builder", href: "/admin/builders/pages", iconName: "Layers", section: "Pemasaran & Operasional" },
    { title: "Form Builder COD", href: "/admin/builders/forms", iconName: "FileSpreadsheet", section: "Pemasaran & Operasional" },
    { title: "Pelacakan Iklan CAPI", href: "/admin/tracking", iconName: "Radio", section: "Pemasaran & Operasional" },
    { title: "Katalog Produk", href: "/admin/products", iconName: "Package", section: "Utama" },
  ],
  CUSTOMER_SERVICE: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Utama" },
    { title: "Kelola Pesanan", href: "/admin/orders", iconName: "ShoppingCart", section: "Utama" },
    { title: "Status Pengiriman", href: "/admin/integrations/mengantar", iconName: "Truck", section: "Pemasaran & Operasional" },
    { title: "Cek Ongkir & WA", href: "/admin/operations/shipping-check", iconName: "Search", section: "Pemasaran & Operasional" },
  ],
  END_BUYER: [
    { title: "Halaman Toko", href: "/", iconName: "Store", section: "Utama" },
    { title: "Lacak Pesanan", href: "/orders/track", iconName: "Search", section: "Utama" },
  ],
};

export function getNavigationForRole(role: Role): NavItem[] {
  return ROLE_NAVIGATION[role] || ROLE_NAVIGATION.END_BUYER;
}
