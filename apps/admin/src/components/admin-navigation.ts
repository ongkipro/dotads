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
    { title: "Overview", href: "/super-admin", iconName: "LayoutDashboard", section: "Operations" },
    { title: "Tenants & SaaS Health", href: "/super-admin/tenants", iconName: "Building2", badge: "Live", section: "Operations" },
    { title: "Platform Settings", href: "/super-admin/settings", iconName: "Settings", section: "Settings" },
    { title: "Global Audit Logs", href: "/super-admin/audit-logs", iconName: "ShieldAlert", section: "Settings" },
  ],
  TENANT_OWNER: [
    { title: "Overview", href: "/admin", iconName: "LayoutDashboard", section: "Commerce" },
    { title: "Order Management", href: "/admin/orders", iconName: "ShoppingCart", badge: "Live COD", section: "Commerce" },
    { title: "Products & Catalog", href: "/admin/products", iconName: "Package", section: "Commerce" },
    
    { title: "Form Builder", href: "/admin/builders/forms", iconName: "FileSpreadsheet", section: "Direct Ads" },
    { title: "Landing Page Builder", href: "/admin/builders/pages", iconName: "Layers", section: "Direct Ads" },
    { title: "Ads & Tracking CAPI", href: "/admin/tracking", iconName: "Radio", badge: "Meta/GAds/TikTok", section: "Direct Ads" },
    
    { title: "Mengantar 3PL Expeditions", href: "/admin/integrations/mengantar", iconName: "Truck", badge: "Production", section: "Operations" },
    { title: "Cek Ongkir & WA Check", href: "/admin/operations/shipping-check", iconName: "Search", section: "Operations" },

    { title: "Finance Reconciliation", href: "/admin/reconciliation", iconName: "Receipt", badge: "AutoLaris & Mengantar", section: "Finance" },
    { title: "AutoLaris Gateway", href: "/admin/integrations/autolaris", iconName: "CreditCard", section: "Finance" },

    { title: "Store & CS Settings", href: "/admin/settings/store", iconName: "Store", section: "Settings" },
    { title: "Gudang & Warehouse", href: "/admin/settings/gudang", iconName: "MapPin", section: "Settings" },
    { title: "WhatsApp CRM Templates", href: "/admin/settings/crm", iconName: "MessageSquare", section: "Settings" },
    { title: "Team Members & Roles", href: "/admin/settings/members", iconName: "Users", section: "Settings" },
    { title: "Custom Domains", href: "/admin/settings/domains", iconName: "Globe", section: "Settings" },
    { title: "Audit Trail Logs", href: "/admin/settings/audit-logs", iconName: "ShieldCheck", section: "Settings" },
    { title: "Merchant Profile", href: "/admin/profile", iconName: "User", section: "Settings" },
  ],
  ADMIN: [
    { title: "Overview", href: "/admin", iconName: "LayoutDashboard", section: "Commerce" },
    { title: "Order Management", href: "/admin/orders", iconName: "ShoppingCart", section: "Commerce" },
    { title: "Products & Catalog", href: "/admin/products", iconName: "Package", section: "Commerce" },
    { title: "Form Builder", href: "/admin/builders/forms", iconName: "FileSpreadsheet", section: "Direct Ads" },
    { title: "Landing Page Builder", href: "/admin/builders/pages", iconName: "Layers", section: "Direct Ads" },
    { title: "Ads & Tracking CAPI", href: "/admin/tracking", iconName: "Radio", section: "Direct Ads" },
    { title: "Mengantar Expeditions", href: "/admin/integrations/mengantar", iconName: "Truck", section: "Operations" },
    { title: "Finance Reconciliation", href: "/admin/reconciliation", iconName: "Receipt", section: "Finance" },
  ],
  ADVERTISER: [
    { title: "Overview", href: "/admin", iconName: "LayoutDashboard", section: "Direct Ads" },
    { title: "Form Builder", href: "/admin/builders/forms", iconName: "FileSpreadsheet", section: "Direct Ads" },
    { title: "Landing Page Builder", href: "/admin/builders/pages", iconName: "Layers", section: "Direct Ads" },
    { title: "Ads & Tracking CAPI", href: "/admin/tracking", iconName: "Radio", badge: "Signal Engine", section: "Direct Ads" },
    { title: "Products Catalog", href: "/admin/products", iconName: "Package", section: "Commerce" },
  ],
  CUSTOMER_SERVICE: [
    { title: "Overview", href: "/admin", iconName: "LayoutDashboard", section: "Commerce" },
    { title: "Order Management", href: "/admin/orders", iconName: "ShoppingCart", badge: "Action Required", section: "Commerce" },
    { title: "Dispatch Status", href: "/admin/integrations/mengantar", iconName: "Truck", section: "Operations" },
    { title: "Cek Ongkir & WA", href: "/admin/operations/shipping-check", iconName: "Search", section: "Operations" },
  ],
  END_BUYER: [
    { title: "My Storefront", href: "/", iconName: "Store", section: "Commerce" },
    { title: "Order Tracking", href: "/orders/track", iconName: "Search", section: "Commerce" },
  ],
};

export function getNavigationForRole(role: Role): NavItem[] {
  return ROLE_NAVIGATION[role] || ROLE_NAVIGATION.END_BUYER;
}
