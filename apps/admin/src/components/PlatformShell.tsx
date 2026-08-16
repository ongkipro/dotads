import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { SwitchAccountButton } from "@/components/SwitchAccountButton";

export function PlatformShell({ userEmail, children }: { userEmail: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] overflow-hidden bg-slate-100 font-sans text-slate-900 md:h-screen">
      <PlatformSidebar userEmail={userEmail} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-indigo-300">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">DotAds Platform</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Global control plane</p>
            </div>
          </div>
          <div className="hidden min-w-0 text-right md:block">
            <p className="truncate text-xs font-semibold text-slate-700">{userEmail}</p>
            <p className="text-[10px] font-medium text-indigo-700">Super Admin</p>
          </div>
          <SwitchAccountButton className="md:hidden" />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-8 p-4 pb-24 md:p-8 md:pb-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
