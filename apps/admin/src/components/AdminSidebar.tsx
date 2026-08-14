"use client";

import React, { useState } from "react";
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
  onRoleChange,
}: AdminSidebarProps) {
  const navItems = getNavigationForRole(currentRole);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Commerce": true,
    "Direct Ads": true,
    "Operations": true,
    "Finance": true,
    "Settings": true,
    "Other": true,
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
    const section = item.section || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  // Section render order
  const sectionOrder = ["Commerce", "Direct Ads", "Operations", "Finance", "Settings", "Other"];

  return (
    <aside 
      className={`border-r border-slate-200 bg-white min-h-screen flex flex-col justify-between hidden md:flex transition-all duration-300 ${
        isSidebarCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        {/* Brand Header */}
        <div className={`p-4 pb-4 ${isSidebarCollapsed ? "flex flex-col items-center" : ""}`}>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              .
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="font-extrabold text-slate-900 text-xl tracking-tight leading-none truncate">
                  DotAds <span className="text-indigo-600">v2</span>
                </h1>
                <p className="text-xs font-medium text-slate-500 mt-1 truncate">{currentTenantName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Toggle */}
        <div className="px-4 pb-4 border-b border-slate-100 flex justify-end">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-x-hidden">
          {sectionOrder.map((sectionName) => {
            const items = groupedItems[sectionName];
            if (!items || items.length === 0) return null;
            
            const isExpanded = expandedSections[sectionName];

            return (
              <div key={sectionName} className="mb-4">
                {!isSidebarCollapsed ? (
                  <button
                    onClick={() => toggleSection(sectionName)}
                    className="w-full flex items-center justify-between px-2 mb-2 group"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
                      {sectionName}
                    </p>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    )}
                  </button>
                ) : (
                  <div className="flex justify-center mb-2">
                    <div className="w-6 h-px bg-slate-200"></div>
                  </div>
                )}

                {(isExpanded || isSidebarCollapsed) && (
                  <div className="space-y-1">
                    {items.map((item, idx) => {
                      const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
                      const isActive = idx === 0 && sectionName === "Commerce"; // Mock active state
                      
                      return (
                        <a
                          key={idx}
                          href={item.href}
                          title={isSidebarCollapsed ? item.title : undefined}
                          className={`flex items-center ${isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"} py-2.5 rounded-lg font-semibold transition-all group ${
                            isActive 
                              ? "bg-indigo-50 text-indigo-700" 
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`shrink-0 w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"} transition-colors`} />
                            {!isSidebarCollapsed && (
                              <span className="text-sm truncate">{item.title}</span>
                            )}
                          </div>
                          {!isSidebarCollapsed && (
                            item.badge ? (
                              <span className="shrink-0 text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full ml-2">
                                {item.badge}
                              </span>
                            ) : (
                              <ChevronRight className={`shrink-0 w-4 h-4 opacity-0 -translate-x-2 transition-all ml-2 ${
                                isActive ? "opacity-100 translate-x-0 text-indigo-400" : "group-hover:opacity-100 group-hover:translate-x-0 text-slate-300"
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

      {/* Footer Profile */}
      <div className={`p-4 border-t border-slate-200 bg-slate-50/50 ${isSidebarCollapsed ? "flex justify-center" : ""}`}>
        <div className={`flex items-center bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
          isSidebarCollapsed ? "p-2 justify-center" : "p-3 justify-between"
        }`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-full bg-slate-100 border border-slate-200 text-indigo-700 font-bold text-sm flex items-center justify-center">
              PO
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm leading-tight truncate">Paduka Ongki</p>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">Settings</p>
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
