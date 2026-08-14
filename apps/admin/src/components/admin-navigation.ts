import type { Role } from "@dotads/auth";

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  section: "Utama" | "Builder & Iklan" | "Logistik & Keuangan" | "Pengaturan Toko" | "Operasional Platform" | "Pengaturan Platform";
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
    
    { title: "Landing Page Builder", href: "/admin/builders/pages", iconName: "Layers", section: "Builder & Iklan" },
    { title: "Form Builder COD", href: "/admin/builders/forms", iconName: "FileSpreadsheet", section: "Builder & Iklan" },
    { title: "Pelacakan Iklan CAPI", href: "/admin/tracking", iconName: "Radio", section: "Builder & Iklan" },

    { title: "Ekspedisi Mengantar", href: "/admin/integrations/mengantar", iconName: "Truck", section: "Logistik & Keuangan" },
    { title: "Cek Ongkir & WA", href: "/admin/operations/shipping-check", iconName: "Search", section: "Logistik & Keuangan" },
    { title: "Rekonsiliasi & Payment", href: "/admin/reconciliation", iconName: "Receipt", section: "Logistik & Keuangan" },
    { title: "Setting AutoLaris", href: "/admin/integrations/autolaris", iconName: "CreditCard", section: "Logistik & Keuangan" },

    { title: "Identitas Toko", href: "/admin/settings/store", iconName: "Store", section: "Pengaturan Toko" },
    { title: "Alamat Gudang", href: "/admin/settings/gudang", iconName: "MapPin", section: "Pengaturan Toko" },
    { title: "Template WA CRM", href: "/admin/settings/crm", iconName: "MessageSquare", section: "Pengaturan Toko" },
    { title: "Anggota Tim", href: "/admin/settings/members", iconName: "Users", section: "Pengaturan Toko" },
    { title: "Domain Kustom", href: "/admin/settings/domains", iconName: "Globe", section: "Pengaturan Toko" },
    { title: "Log Aktivitas", href: "/admin/settings/audit-logs", iconName: "ShieldCheck", section: "Pengaturan Toko" },
    { title: "Profil Akun", href: "/admin/profile", iconName: "User", section: "Pengaturan Toko" },
  ],
  ADMIN: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Utama" },
    { title: "Pesanan", href: "/admin/orders", iconName: "ShoppingCart", section: "Utama" },
    { title: "Katalog Produk", href: "/admin/products", iconName: "Package", section: "Utama" },
    { title: "Landing Page Builder", href: "/admin/builders/pages", iconName: "Layers", section: "Builder & Iklan" },
    { title: "Form Builder COD", href: "/admin/builders/forms", iconName: "FileSpreadsheet", section: "Builder & Iklan" },
    { title: "Pelacakan Iklan CAPI", href: "/admin/tracking", iconName: "Radio", section: "Builder & Iklan" },
    { title: "Ekspedisi Mengantar", href: "/admin/integrations/mengantar", iconName: "Truck", section: "Logistik & Keuangan" },
    { title: "Rekonsiliasi & Payment", href: "/admin/reconciliation", iconName: "Receipt", section: "Logistik & Keuangan" },
  ],
  ADVERTISER: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Utama" },
    { title: "Landing Page Builder", href: "/admin/builders/pages", iconName: "Layers", section: "Builder & Iklan" },
    { title: "Form Builder COD", href: "/admin/builders/forms", iconName: "FileSpreadsheet", section: "Builder & Iklan" },
    { title: "Pelacakan Iklan CAPI", href: "/admin/tracking", iconName: "Radio", section: "Builder & Iklan" },
    { title: "Katalog Produk", href: "/admin/products", iconName: "Package", section: "Utama" },
  ],
  CUSTOMER_SERVICE: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Utama" },
    { title: "Kelola Pesanan", href: "/admin/orders", iconName: "ShoppingCart", section: "Utama" },
    { title: "Status Pengiriman", href: "/admin/integrations/mengantar", iconName: "Truck", section: "Logistik & Keuangan" },
    { title: "Cek Ongkir & WA", href: "/admin/operations/shipping-check", iconName: "Search", section: "Logistik & Keuangan" },
  ],
  END_BUYER: [
    { title: "Halaman Toko", href: "/", iconName: "Store", section: "Utama" },
    { title: "Lacak Pesanan", href: "/orders/track", iconName: "Search", section: "Utama" },
  ],
};

export function getNavigationForRole(role: Role): NavItem[] {
  return ROLE_NAVIGATION[role] || ROLE_NAVIGATION.END_BUYER;
}
