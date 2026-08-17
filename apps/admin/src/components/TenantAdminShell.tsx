"use client";

import type { ReactNode } from "react";
import { Store } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SwitchAccountButton } from "@/components/SwitchAccountButton";
import type { SessionContext } from "@/lib/session-context";

const ROLE_LABELS: Record<SessionContext["role"], string> = {
  SUPER_ADMIN: "Super Admin",
  TENANT_OWNER: "Pemilik Toko",
  ADMIN: "Admin Toko",
  ADVERTISER: "Pengelola Iklan",
  CUSTOMER_SERVICE: "Layanan Pelanggan",
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
          <div className="flex min-w-0 items-center gap-2 rounded-md border border-indigo-200/50 bg-indigo-50 px-2.5 py-1.5 text-indigo-900" aria-label={`Toko saat ini: ${context.tenantName}`}>
            <Store className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-indigo-500">Toko saat ini</span>
              <span className="block truncate text-sm font-semibold leading-tight">{context.tenantName}</span>
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-3">
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
