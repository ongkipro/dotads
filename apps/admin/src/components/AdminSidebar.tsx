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

  // Group items by section
  const groupedItems = navItems.reduce((acc: Record<string, NavItem[]>, item) => {
    const section = item.section || "Utama";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  const sectionOrder = [
    "Utama",
    "Pemasaran & Operasional",
    "Pengaturan",
    "Operasional Platform",
    "Pengaturan Platform",
  ];

  return (
    <aside
      className={`border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/90 min-h-screen flex flex-col justify-between hidden md:flex transition-all duration-200 select-none ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        {/* Sleek Minimalist Brand Header */}
        <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
              .
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight leading-none truncate">
                  DotAds <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs">v2</span>
                </h1>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">{currentTenantName}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Minimalist Navigation Links */}
        <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-x-hidden">
          {sectionOrder.map((sectionName) => {
            const items = groupedItems[sectionName];
            if (!items || items.length === 0) return null;

            return (
              <div key={sectionName} className="space-y-1">
                {!isCollapsed ? (
                  <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    {sectionName}
                  </h3>
                ) : (
                  <div className="flex justify-center my-1">
                    <div className="w-4 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>
                )}

                {items.map((item, idx) => {
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
                        isCollapsed ? "justify-center px-0" : "px-2.5"
                      } py-1.5 rounded-md text-xs font-semibold transition-colors group ${
                        isActive
                          ? "bg-indigo-600 text-white dark:bg-indigo-600 dark:text-white shadow-2xs font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`shrink-0 w-4 h-4 ${
                          isCollapsed ? "" : "mr-2.5"
                        } ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
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

      {/* Clean Bottom User Profile */}
      <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50">
        <div
          className={`flex items-center rounded-lg ${
            isCollapsed ? "p-1.5 justify-center" : "px-2 py-1.5 justify-between"
          }`}
        >
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
              PO
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs leading-tight truncate">
                  Paduka Ongki
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  Pemilik Toko
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
