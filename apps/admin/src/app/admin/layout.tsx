"use client";

import React, { useState } from "react";
import type { Role } from "@dotads/auth";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Store, UserCheck, ExternalLink } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("TENANT_OWNER");
  const [tenantName, setTenantName] = useState("Alpha Store");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      <AdminSidebar currentRole={role} currentTenantName={tenantName} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sleek Ramping Top Navigation Bar */}
        <header className="h-12 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded border border-indigo-200/50 dark:border-indigo-800/50">
              <Store className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <select
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="bg-transparent text-xs font-semibold text-indigo-900 dark:text-indigo-200 border-none focus:ring-0 cursor-pointer py-0 pr-2"
              >
                <option value="Alpha Store">Alpha Store (Gadget)</option>
                <option value="Beta Digital">Beta Digital (E-Book/Course)</option>
                <option value="Gamma Skincare">Gamma Skincare (Beauty)</option>
              </select>
            </div>
            <a
              href="http://100.127.67.86:4321"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Lihat Toko <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center space-x-3">
            {/* Command / Search Trigger */}
            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              <span>Cari pesanan, resi, produk...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-900 text-slate-500 border border-slate-300 dark:border-slate-700 rounded shadow-2xs">⌘K</kbd>
            </div>

            {/* Quick Role Switcher for Testing/Dev */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-md">
              <UserCheck className="w-3.5 h-3.5 text-slate-500 ml-1" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">Peran:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 border-none focus:ring-0 cursor-pointer py-0 pl-1 pr-4"
              >
                <option value="TENANT_OWNER">Pemilik Toko (Tenant Owner)</option>
                <option value="ADMIN">Administrator</option>
                <option value="ADVERTISER">Advertiser (Tim Ads)</option>
                <option value="CUSTOMER_SERVICE">Customer Service (CS)</option>
                <option value="SUPER_ADMIN">Super Admin SaaS</option>
              </select>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
