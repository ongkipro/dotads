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
  ChevronRight,
  ChevronDown,
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
  onRoleChange?: (newRole: Role) => void;
}

export function AdminSidebar({
  currentRole,
  currentTenantName = "Alpha Store (Pro)",
}: AdminSidebarProps) {
  const pathname = usePathname() || "/admin";
  const navItems = getNavigationForRole(currentRole);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Penjualan & Pesanan": true,
    "Iklan & Landing Page": true,
    "Kurir & Operasional": true,
    "Keuangan & Payment": true,
    "Pengaturan & Sistem": true,
    "Operasional Platform": true,
    "Pengaturan Platform": true,
  });

  const toggleSection = (section: string) => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      setExpandedSections((prev) => ({ ...prev, [section]: true }));
      return;
    }
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Group items by section
  const groupedItems = navItems.reduce((acc: Record<string, NavItem[]>, item) => {
    const section = item.section || "Lainnya";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  // Section order prioritized by workflow
  const sectionOrder = [
    "Penjualan & Pesanan",
    "Iklan & Landing Page",
    "Kurir & Operasional",
    "Keuangan & Payment",
    "Pengaturan & Sistem",
    "Operasional Platform",
    "Pengaturan Platform",
    "Lainnya",
  ];

  return (
    <aside 
      className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-screen flex flex-col justify-between hidden md:flex transition-all duration-300 ${
        isSidebarCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        {/* Brand Header */}
        <div className={`p-4 pb-3 ${isSidebarCollapsed ? "flex flex-col items-center" : ""}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              .
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="font-extrabold text-slate-900 dark:text-white text-xl tracking-tight leading-none truncate">
                  DotAds <span className="text-indigo-600 dark:text-indigo-400">v2</span>
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">{currentTenantName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Toggle Bar */}
        <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigasi Panel
            </span>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title={isSidebarCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation Accordion Sections */}
        <nav className="flex-1 px-3 py-3 space-y-2 overflow-x-hidden">
          {sectionOrder.map((sectionName) => {
            const items = groupedItems[sectionName];
            if (!items || items.length === 0) return null;
            
            const isExpanded = expandedSections[sectionName];

            return (
              <div key={sectionName} className="mb-2">
                {!isSidebarCollapsed ? (
                  <button
                    onClick={() => toggleSection(sectionName)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-100/50 dark:hover:bg-slate-800/50 group transition-colors"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                      {sectionName}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    )}
                  </button>
                ) : (
                  <div className="flex justify-center my-1.5">
                    <div className="w-6 h-px bg-slate-200 dark:bg-slate-800"></div>
                  </div>
                )}

                {(isExpanded || isSidebarCollapsed) && (
                  <div className="space-y-1 mt-1">
                    {items.map((item, idx) => {
                      const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
                      
                      // Active state route matching
                      const isActive = item.href === "/admin" || item.href === "/super-admin"
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                      return (
                        <a
                          key={idx}
                          href={item.href}
                          title={isSidebarCollapsed ? item.title : undefined}
                          className={`flex items-center ${isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"} py-2 rounded-lg font-semibold text-sm transition-all group ${
                            isActive 
                              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border-l-3 border-indigo-600 shadow-2xs" 
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <Icon className={`shrink-0 w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"} transition-colors`} />
                            {!isSidebarCollapsed && (
                              <span className="truncate">{item.title}</span>
                            )}
                          </div>
                          {!isSidebarCollapsed && (
                            item.badge ? (
                              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 ${
                                isActive
                                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              }`}>
                                {item.badge}
                              </span>
                            ) : (
                              <ChevronRight className={`shrink-0 w-3.5 h-3.5 opacity-0 -translate-x-2 transition-all ml-2 ${
                                isActive ? "opacity-100 translate-x-0 text-indigo-500" : "group-hover:opacity-100 group-hover:translate-x-0 text-slate-300"
                              }`} />
                            )
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer User Profile & Settings */}
      <div className={`p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 ${isSidebarCollapsed ? "flex justify-center" : ""}`}>
        <div className={`flex items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs hover:shadow-xs transition-shadow cursor-pointer ${
          isSidebarCollapsed ? "p-2 justify-center" : "p-2.5 justify-between"
        }`}>
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
              PO
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-tight truncate">Paduka Ongki</p>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">Pemilik Merchant</p>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <LogOut className="w-4 h-4 shrink-0 text-slate-400 hover:text-rose-600 transition-colors ml-2" />
          )}
        </div>
      </div>
    </aside>
  );
}
