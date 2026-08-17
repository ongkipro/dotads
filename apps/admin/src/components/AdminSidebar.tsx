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
  Users,
  Globe,
  ShieldCheck,
  Store,
  Search,
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
  Users,
  Globe,
  ShieldCheck,
  Store,
  Search,
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
    "Operasional Toko",
    "Akses & Keamanan",
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
    TENANT_OWNER: ["/admin", "/admin/orders", "/admin/products", "/admin/settings/members"],
    ADMIN: ["/admin", "/admin/orders", "/admin/products", "/admin/settings/members"],
    ADVERTISER: ["/admin/products"],
    CUSTOMER_SERVICE: ["/admin", "/admin/orders", "/admin/products"],
  };
  const preferredHrefs = preferredMobileHrefs[currentRole];
  const mobilePrimaryItems = preferredHrefs
    ? preferredHrefs.map((href) => navItems.find((item) => item.href === href)).filter((item): item is NavItem => Boolean(item))
    : navItems.slice(0, 4);
  const mobilePrimaryHrefs = new Set(mobilePrimaryItems.map((item) => item.href));
  const mobileMoreItems = navItems.filter((item) => !mobilePrimaryHrefs.has(item.href));
  const isMobileMoreActive = mobileMoreItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const roleLabel: Partial<Record<Role, string>> = {
    SUPER_ADMIN: "Super Admin",
    TENANT_OWNER: "Pemilik Toko",
    ADMIN: "Admin Toko",
    ADVERTISER: "Pengelola Iklan",
    CUSTOMER_SERVICE: "Layanan Pelanggan",
  };
  const mobileLabel = (item: NavItem) => {
    if (item.href === "/admin" || item.href === "/super-admin") return "Ringkasan";
    if (item.href === "/admin/orders") return "Pesanan";
    if (item.href === "/admin/settings/members") return "Tim";
    return item.title.replace("Ringkasan Platform", "Ringkasan");
  };
  const userInitials = userEmail
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AK";
  const statusLabel = tenantStatus === "active" ? "Aktif" : tenantStatus === "suspended" ? "Ditangguhkan" : tenantStatus === "cancelled" ? "Dibatalkan" : "Tidak tersedia";

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
                <h1 className="truncate text-sm font-bold leading-none tracking-tight text-slate-900 dark:text-white">
                  DotAds <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">v2</span>
                </h1>
                <p className="mt-1 truncate text-xs font-medium leading-tight text-slate-500 dark:text-slate-400">{currentTenantName}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Tokophi/Zanoby Style Ramping Subscription Status Pill */}
        {!isCollapsed && (
          <div className="border-b border-slate-100 dark:border-slate-800 px-2.5 py-1.5">
            <div className="flex items-center justify-between gap-1.5 rounded-md border border-indigo-500/20 bg-indigo-500/5 px-2 py-1.5 text-xs">
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
        <nav className="flex-1 space-y-4 overflow-x-hidden px-2 py-3">
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
                    className="flex min-h-9 w-full items-center justify-between rounded px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:text-slate-400 dark:hover:text-slate-200"
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
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center ${
                          isCollapsed ? "justify-center px-0" : "px-2"
                        } group min-h-11 rounded-md border-l-2 py-2 text-sm font-medium leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${
                          isActive
                            ? "border-indigo-600 bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300"
                            : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isCollapsed ? "" : "mr-2"
                          } ${
                            isActive
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                          } transition-colors`}
                        />
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
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
                <p className="truncate text-xs font-medium leading-tight text-slate-800 dark:text-slate-200">
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
      className={`fixed inset-x-0 bottom-0 z-40 grid min-h-16 ${mobileMoreItems.length > 0 ? "grid-cols-5" : mobilePrimaryItems.length === 1 ? "grid-cols-1" : mobilePrimaryItems.length === 2 ? "grid-cols-2" : mobilePrimaryItems.length === 3 ? "grid-cols-3" : "grid-cols-4"} border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden`}
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
            className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
              isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="max-w-full truncate">{mobileLabel(item)}</span>
          </a>
        );
      })}

      {mobileMoreItems.length > 0 && <details className="group relative min-w-0">
        <summary aria-label={isMobileMoreActive ? "Lainnya, halaman aktif ada di menu ini" : "Buka menu lainnya"} className={`flex min-h-16 cursor-pointer list-none flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden ${isMobileMoreActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}>
          <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
          <span>Lainnya</span>
        </summary>
        <div className="absolute bottom-[calc(100%+0.5rem)] right-0 max-h-[65dvh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
          <p className="px-3 py-2 text-xs font-bold text-slate-900">Menu {roleLabel[currentRole] ?? "Akun"}</p>
          {mobileMoreItems.map((item) => {
            const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
            const isActive = pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.title}</span>
              </a>
            );
          })}
        </div>
      </details>}
    </nav>
    </>
  );
}
