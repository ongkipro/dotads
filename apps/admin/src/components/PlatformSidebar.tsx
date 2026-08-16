"use client";

import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Settings, ShieldAlert } from "lucide-react";
import { ROLE_NAVIGATION } from "@/components/admin-navigation";
import { SwitchAccountButton } from "@/components/SwitchAccountButton";

const ICONS = {
  LayoutDashboard,
  Building2,
  Settings,
  ShieldAlert,
} as const;

export function PlatformSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname() || "/super-admin";
  const navigation = ROLE_NAVIGATION.SUPER_ADMIN;
  const initials = userEmail
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "OP";

  const isActive = (href: string) => href === "/super-admin" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <aside className="hidden min-h-screen w-16 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 md:flex lg:w-60">
        <div className="flex h-16 items-center border-b border-slate-800 px-3 lg:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-sm font-black text-white">D</span>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-bold">DotAds Platform</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-300">Control plane</p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-800 px-3 py-3 lg:px-4">
          <div className="flex items-center justify-center gap-2 rounded-lg border border-indigo-400/20 bg-indigo-400/10 px-2 py-2 text-indigo-100 lg:justify-start">
            <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden text-xs font-semibold lg:inline">Akses platform global</span>
          </div>
        </div>

        <nav aria-label="Navigasi platform" className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const Icon = ICONS[item.iconName as keyof typeof ICONS] || LayoutDashboard;
            const active = isActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                title={item.title}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors lg:justify-start ${
                  active ? "bg-indigo-500 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden truncate lg:inline">{item.title}</span>
              </a>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-2 lg:p-3">
          <div className="flex items-center justify-center gap-2 rounded-lg px-2 py-2 lg:justify-start">
            <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-200 lg:flex">{initials}</span>
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="truncate text-xs font-semibold text-slate-200">{userEmail}</p>
              <p className="text-[10px] text-slate-500">Super Admin</p>
            </div>
          </div>
          <SwitchAccountButton tone="dark" showLabel={false} className="lg:hidden" />
          <SwitchAccountButton tone="dark" buttonClassName="w-full justify-start" className="hidden lg:block" />
        </div>
      </aside>

      <nav aria-label="Navigasi platform mobile" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        {navigation.map((item) => {
          const Icon = ICONS[item.iconName as keyof typeof ICONS] || LayoutDashboard;
          const active = isActive(item.href);
          const label = item.href === "/super-admin" ? "Ringkasan" : item.title.replace("Pengaturan Platform", "Pengaturan").replace("Log Audit Global", "Audit");
          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[10px] font-semibold ${active ? "text-indigo-700" : "text-slate-500"}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
