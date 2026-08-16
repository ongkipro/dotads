"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import type { Role } from "@dotads/auth";
import { getNavigationForRole, type NavItem } from "./admin-navigation";
import {
  LayoutDashboard,
  Building2,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Package,
  FileSpreadsheet,
  Layers,
  Radio,
  Truck,
  CreditCard,
  Users,
  Globe,
  ShieldCheck,
  Store,
  Search,
  Receipt,
  MapPin,
  MessageSquare,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { SwitchAccountButton } from "@/components/SwitchAccountButton";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Building2,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Package,
  FileSpreadsheet,
  Layers,
  Radio,
  Truck,
  CreditCard,
  Users,
  Globe,
  ShieldCheck,
  Store,
  Search,
  Receipt,
  MapPin,
  MessageSquare,
  User,
};

interface AdminSidebarProps {
  currentRole: Role;
  currentTenantName: string;
  tenantStatus: string;
  userEmail: string;
}

export function AdminSidebar({
  currentRole,
  currentTenantName,
  tenantStatus,
  userEmail,
}: AdminSidebarProps) {
  const pathname = usePathname() || "/admin";
  const navItems = getNavigationForRole(currentRole);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Group items by section
  const groupedItems = navItems.reduce((acc: Record<string, NavItem[]>, item) => {
    const section = item.section || "Utama";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  const sectionOrder = [
    "Utama",
    "Builder & Iklan",
    "Logistik & Keuangan",
    "Pengaturan Toko",
    "Operasional Platform",
    "Pengaturan Platform",
  ];

  const toggleSection = (sectionName: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const preferredMobileHrefs: Partial<Record<Role, string[]>> = {
    TENANT_OWNER: ["/admin", "/admin/orders", "/admin/tracking", "/admin/settings/store"],
    ADMIN: ["/admin", "/admin/orders", "/admin/tracking", "/admin/settings/store"],
    ADVERTISER: ["/admin", "/admin/products", "/admin/tracking", "/admin/builders/forms"],
    CUSTOMER_SERVICE: ["/admin", "/admin/orders", "/admin/integrations/mengantar", "/admin/operations/shipping-check"],
  };
  const preferredHrefs = preferredMobileHrefs[currentRole];
  const mobilePrimaryItems = preferredHrefs
    ? preferredHrefs.map((href) => navItems.find((item) => item.href === href)).filter((item): item is NavItem => Boolean(item))
    : navItems.slice(0, 4);
  const mobilePrimaryHrefs = new Set(mobilePrimaryItems.map((item) => item.href));
  const mobileMoreItems = navItems.filter((item) => !mobilePrimaryHrefs.has(item.href));
  const roleLabel: Partial<Record<Role, string>> = {
    SUPER_ADMIN: "Super Admin",
    TENANT_OWNER: "Pemilik Toko",
    ADMIN: "Administrator",
    ADVERTISER: "Tim Iklan",
    CUSTOMER_SERVICE: "Customer Service",
  };
  const mobileLabel = (item: NavItem) => {
    if (item.href === "/admin" || item.href === "/super-admin") return "Ringkasan";
    if (item.href === "/admin/orders") return "Pesanan";
    if (item.href === "/admin/tracking") return "Growth";
    if (item.href === "/admin/settings/store") return "Pengaturan";
    if (item.href === "/admin/integrations/mengantar") return "Pengiriman";
    if (item.href === "/admin/operations/shipping-check") return "Cek Ongkir";
    if (item.href === "/admin/builders/forms") return "Form";
    return item.title.replace("Ringkasan Platform", "Ringkasan").replace("Katalog Produk", "Produk");
  };
  const userInitials = userEmail
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AK";
  const statusLabel = tenantStatus === "active" ? "Aktif" : tenantStatus || "Tidak tersedia";

  return (
    <>
    <aside
      className={`border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/95 min-h-screen flex flex-col justify-between hidden md:flex transition-all duration-200 select-none ${
        isCollapsed ? "w-14" : "w-56"
      }`}
    >
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        {/* Tokophi-style Ramping Brand Header */}
        <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 shrink-0 rounded-md bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-2xs">
              .
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-slate-900 dark:text-white text-xs tracking-tight leading-none truncate">
                  DotAds <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-[10px]">v2</span>
                </h1>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">{currentTenantName}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Tokophi/Zanoby Style Ramping Subscription Status Pill */}
        {!isCollapsed && (
          <div className="border-b border-slate-100 dark:border-slate-800 px-2.5 py-1.5">
            <div className="flex items-center justify-between gap-1.5 rounded-md border border-indigo-500/20 bg-indigo-500/5 px-2 py-1 text-[10px]">
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                {roleLabel[currentRole] ?? "Akun"}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate-500 dark:text-slate-400 font-medium">{statusLabel}</span>
              </span>
            </div>
          </div>
        )}

        {/* Ramping Streamlined Nav Links */}
        <nav className="flex-1 px-2 py-2 space-y-3 overflow-x-hidden">
          {sectionOrder.map((sectionName) => {
            const items = groupedItems[sectionName];
            if (!items || items.length === 0) return null;
            const isSectionCollapsed = !!collapsedSections[sectionName];

            return (
              <div key={sectionName} className="space-y-0.5">
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(sectionName)}
                    aria-expanded={!isSectionCollapsed}
                    className="w-full flex items-center justify-between px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <span>{sectionName}</span>
                    {isSectionCollapsed ? (
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                ) : (
                  <div className="flex justify-center my-1">
                    <div className="w-3 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>
                )}

                {(!isSectionCollapsed || isCollapsed) &&
                  items.map((item, idx) => {
                    const Icon = ICON_MAP[item.iconName] || LayoutDashboard;

                    const isActive =
                      item.href === "/admin" || item.href === "/super-admin"
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    return (
                      <a
                        key={idx}
                        href={item.href}
                        title={isCollapsed ? item.title : undefined}
                        className={`flex items-center ${
                          isCollapsed ? "justify-center px-0" : "px-2"
                        } py-1.5 rounded text-[11px] font-medium transition-colors group ${
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold border-l-2 border-indigo-600"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100"
                        }`}
                      >
                        <Icon
                          className={`shrink-0 w-3.5 h-3.5 ${
                            isCollapsed ? "" : "mr-2"
                          } ${
                            isActive
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                          } transition-colors`}
                        />
                        {!isCollapsed && <span className="truncate leading-none">{item.title}</span>}
                      </a>
                    );
                  })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Ramping User Profile Handoff */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div
          className={`rounded ${
            isCollapsed ? "flex items-center justify-center p-1" : "space-y-1 px-1 py-1"
          }`}
        >
          {!isCollapsed && (
            <div className="flex min-w-0 items-center space-x-1.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-200 text-[11px] leading-tight truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          )}
          <SwitchAccountButton showLabel={!isCollapsed} buttonClassName={isCollapsed ? "" : "w-full justify-start"} />
        </div>
      </div>
    </aside>

    <nav
      aria-label="Navigasi utama mobile"
      className="fixed inset-x-0 bottom-0 z-40 grid min-h-16 grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
    >
      {mobilePrimaryItems.map((item) => {
        const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
        const isActive = item.href === "/admin" || item.href === "/super-admin"
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[10px] font-semibold ${
              isActive ? "text-indigo-700" : "text-slate-500"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="max-w-full truncate">{mobileLabel(item)}</span>
          </a>
        );
      })}

      <details className="group relative min-w-0">
        <summary className="flex min-h-16 cursor-pointer list-none flex-col items-center justify-center gap-1 rounded-md px-1 text-[10px] font-semibold text-slate-500 [&::-webkit-details-marker]:hidden">
          <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
          <span>Lainnya</span>
        </summary>
        <div className="absolute bottom-[calc(100%+0.5rem)] right-0 max-h-[65dvh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
          <p className="px-3 py-2 text-xs font-bold text-slate-900">Menu {roleLabel[currentRole] ?? "Akun"}</p>
          {mobileMoreItems.length > 0 ? mobileMoreItems.map((item) => {
            const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
            const isActive = pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.title}</span>
              </a>
            );
          }) : (
            <p className="px-3 py-2 text-sm text-slate-500">Semua menu utama sudah ditampilkan.</p>
          )}
        </div>
      </details>
    </nav>
    </>
  );
}
