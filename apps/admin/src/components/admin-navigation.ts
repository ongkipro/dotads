import type { Role } from "@dotads/auth";

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  section?: string;
}

export const ROLE_NAVIGATION: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { title: "Ringkasan Platform", href: "/super-admin", iconName: "LayoutDashboard", section: "Operasional Platform" },
    { title: "Kelola Merchant SaaS", href: "/super-admin/tenants", iconName: "Building2", badge: "Aktif", section: "Operasional Platform" },
    { title: "Pengaturan Platform", href: "/super-admin/settings", iconName: "Settings", section: "Pengaturan Platform" },
    { title: "Log Audit Global", href: "/super-admin/audit-logs", iconName: "ShieldAlert", section: "Pengaturan Platform" },
  ],
  TENANT_OWNER: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Penjualan & Pesanan" },
    { title: "Kelola Pesanan", href: "/admin/orders", iconName: "ShoppingCart", badge: "COD", section: "Penjualan & Pesanan" },
    { title: "Produk & Katalog", href: "/admin/products", iconName: "Package", section: "Penjualan & Pesanan" },
    
    { title: "Pembuat Form", href: "/admin/builders/forms", iconName: "FileSpreadsheet", section: "Iklan & Landing Page" },
    { title: "Pembuat Landing Page", href: "/admin/builders/pages", iconName: "Layers", section: "Iklan & Landing Page" },
    { title: "Pelacakan Iklan CAPI", href: "/admin/tracking", iconName: "Radio", badge: "Meta & Google", section: "Iklan & Landing Page" },
    
    { title: "Ekspedisi Mengantar", href: "/admin/integrations/mengantar", iconName: "Truck", badge: "3PL", section: "Kurir & Operasional" },
    { title: "Cek Ongkir & WA", href: "/admin/operations/shipping-check", iconName: "Search", section: "Kurir & Operasional" },

    { title: "Rekonsiliasi Keuangan", href: "/admin/reconciliation", iconName: "Receipt", badge: "Otomatis", section: "Keuangan & Payment" },
    { title: "Payment AutoLaris", href: "/admin/integrations/autolaris", iconName: "CreditCard", section: "Keuangan & Payment" },

    { title: "Pengaturan Toko", href: "/admin/settings/store", iconName: "Store", section: "Pengaturan & Sistem" },
    { title: "Alamat Gudang", href: "/admin/settings/gudang", iconName: "MapPin", section: "Pengaturan & Sistem" },
    { title: "Template WA CRM", href: "/admin/settings/crm", iconName: "MessageSquare", section: "Pengaturan & Sistem" },
    { title: "Tim & Akses Anggota", href: "/admin/settings/members", iconName: "Users", section: "Pengaturan & Sistem" },
    { title: "Domain Kustom", href: "/admin/settings/domains", iconName: "Globe", section: "Pengaturan & Sistem" },
    { title: "Log Aktivitas", href: "/admin/settings/audit-logs", iconName: "ShieldCheck", section: "Pengaturan & Sistem" },
    { title: "Profil Merchant", href: "/admin/profile", iconName: "User", section: "Pengaturan & Sistem" },
  ],
  ADMIN: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Penjualan & Pesanan" },
    { title: "Kelola Pesanan", href: "/admin/orders", iconName: "ShoppingCart", section: "Penjualan & Pesanan" },
    { title: "Produk & Katalog", href: "/admin/products", iconName: "Package", section: "Penjualan & Pesanan" },
    { title: "Pembuat Form", href: "/admin/builders/forms", iconName: "FileSpreadsheet", section: "Iklan & Landing Page" },
    { title: "Pembuat Landing Page", href: "/admin/builders/pages", iconName: "Layers", section: "Iklan & Landing Page" },
    { title: "Pelacakan Iklan CAPI", href: "/admin/tracking", iconName: "Radio", section: "Iklan & Landing Page" },
    { title: "Ekspedisi Mengantar", href: "/admin/integrations/mengantar", iconName: "Truck", section: "Kurir & Operasional" },
    { title: "Rekonsiliasi Keuangan", href: "/admin/reconciliation", iconName: "Receipt", section: "Keuangan & Payment" },
  ],
  ADVERTISER: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Iklan & Landing Page" },
    { title: "Pembuat Form", href: "/admin/builders/forms", iconName: "FileSpreadsheet", section: "Iklan & Landing Page" },
    { title: "Pembuat Landing Page", href: "/admin/builders/pages", iconName: "Layers", section: "Iklan & Landing Page" },
    { title: "Pelacakan Iklan CAPI", href: "/admin/tracking", iconName: "Radio", badge: "Signal Engine", section: "Iklan & Landing Page" },
    { title: "Katalog Produk", href: "/admin/products", iconName: "Package", section: "Penjualan & Pesanan" },
  ],
  CUSTOMER_SERVICE: [
    { title: "Ringkasan", href: "/admin", iconName: "LayoutDashboard", section: "Penjualan & Pesanan" },
    { title: "Kelola Pesanan", href: "/admin/orders", iconName: "ShoppingCart", badge: "Tindak Lanjut", section: "Penjualan & Pesanan" },
    { title: "Status Pengiriman", href: "/admin/integrations/mengantar", iconName: "Truck", section: "Kurir & Operasional" },
    { title: "Cek Ongkir & WA", href: "/admin/operations/shipping-check", iconName: "Search", section: "Kurir & Operasional" },
  ],
  END_BUYER: [
    { title: "Halaman Toko", href: "/", iconName: "Store", section: "Penjualan & Pesanan" },
    { title: "Lacak Pesanan", href: "/orders/track", iconName: "Search", section: "Penjualan & Pesanan" },
  ],
};

export function getNavigationForRole(role: Role): NavItem[] {
  return ROLE_NAVIGATION[role] || ROLE_NAVIGATION.END_BUYER;
}
