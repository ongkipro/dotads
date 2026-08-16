"use client";

import type { ReactNode } from "react";
import { Search, Store } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SwitchAccountButton } from "@/components/SwitchAccountButton";
import type { SessionContext } from "@/lib/session-context";

const ROLE_LABELS: Record<SessionContext["role"], string> = {
  SUPER_ADMIN: "Super Admin",
  TENANT_OWNER: "Pemilik Toko",
  ADMIN: "Administrator",
  ADVERTISER: "Tim Iklan",
  CUSTOMER_SERVICE: "Customer Service",
  END_BUYER: "Pembeli",
};

export function TenantAdminShell({ context, children }: { context: SessionContext; children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] overflow-hidden bg-slate-50 font-sans text-slate-900 md:h-screen">
      <AdminSidebar
        currentRole={context.role}
        currentTenantName={context.tenantName}
        tenantStatus={context.tenantStatus}
        userEmail={context.userEmail}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-3 py-2 backdrop-blur-xs md:px-4">
          <div className="flex min-w-0 items-center gap-2 rounded-md border border-indigo-200/50 bg-indigo-50 px-2.5 py-1.5 text-indigo-900">
            <Store className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
            <span className="truncate text-sm font-semibold">{context.tenantName}</span>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-400 xl:flex">
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cari pesanan, resi, produk...</span>
              <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shadow-2xs">⌘K</kbd>
            </div>
            <div className="hidden min-w-0 text-right md:block">
              <p className="truncate text-xs font-semibold text-slate-700">{context.userEmail}</p>
              <p className="text-[10px] font-medium text-slate-500">{ROLE_LABELS[context.role]}</p>
            </div>
            <SwitchAccountButton className="md:hidden" />
          </div>
        </header>

        <main className="flex-1 space-y-6 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
