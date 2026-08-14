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
  LogOut,
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
  currentTenantName?: string;
  onRoleChange?: (role: Role) => void;
}

export function AdminSidebar({
  currentRole,
  currentTenantName = "Alpha Store",
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

  return (
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
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
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
                SaaS Pro
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate-500 dark:text-slate-400 font-medium">Aktif</span>
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
                    onClick={() => toggleSection(sectionName)}
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
          className={`flex items-center rounded ${
            isCollapsed ? "p-1 justify-center" : "px-2 py-1 justify-between"
          }`}
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            <div className="w-6 h-6 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center">
              PO
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-200 text-[11px] leading-tight truncate">
                  Paduka Ongki
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
