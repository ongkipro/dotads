"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, ArrowUpRight, Ban, Building2, CheckCircle2, Clock, Database, DollarSign, ExternalLink, Search, ShieldAlert, SlidersHorizontal, Users } from "lucide-react";

type TenantStatus = "active" | "suspended" | "provisioning";
type TenantPlan = "STARTER" | "PRO" | "ENTERPRISE";

interface TenantFleetRow {
  id: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  customDomain: string;
  gmv: number;
  ordersCount: number;
  lastActive: string;
}

const fleet: TenantFleetRow[] = [
  { id: "tenant_alpha", name: "Store Alpha", plan: "PRO", status: "active", customDomain: "store-alpha.com", gmv: 47_800_000, ordersCount: 315, lastActive: "2 menit lalu" },
  { id: "tenant_beta", name: "Store Beta", plan: "STARTER", status: "active", customDomain: "store-beta.com", gmv: 12_400_000, ordersCount: 88, lastActive: "1 jam lalu" },
  { id: "tenant_gamma", name: "Store Gamma", plan: "ENTERPRISE", status: "suspended", customDomain: "store-gamma.id", gmv: 124_000_000, ordersCount: 1042, lastActive: "2 hari lalu" },
  { id: "tenant_delta", name: "Store Delta", plan: "STARTER", status: "provisioning", customDomain: "store-delta.net", gmv: 0, ordersCount: 0, lastActive: "Baru saja" },
];

const activities = [
  { id: "1", type: "tenant", message: "Tenant baru berhasil dibuat.", tenant: "Store Delta", timestamp: "10 menit lalu" },
  { id: "2", type: "upgrade", message: "Paket ditingkatkan ke Pro.", tenant: "Store Alpha", timestamp: "1 jam lalu" },
  { id: "3", type: "security", message: "Lima percobaan masuk administrator gagal.", tenant: "Sistem", timestamp: "2 jam lalu" },
  { id: "4", type: "system", message: "Replika basis data ditingkatkan otomatis.", tenant: "Sistem", timestamp: "5 jam lalu" },
  { id: "5", type: "payment", message: "Perpanjangan langganan gagal diproses.", tenant: "Store Gamma", timestamp: "1 hari lalu" },
];

const currencyFormatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default function SuperAdminOverviewPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TenantStatus | "all">("all");
  const [activityLimit, setActivityLimit] = useState(3);

  const filteredFleet = useMemo(() => fleet.filter((tenant) => {
    const matchesSearch = `${tenant.name} ${tenant.customDomain}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (statusFilter === "all" || tenant.status === statusFilter);
  }), [search, statusFilter]);

  const metrics = useMemo(() => ({
    activeTenants: fleet.filter((tenant) => tenant.status === "active").length,
    totalGmv: fleet.reduce((total, tenant) => total + tenant.gmv, 0),
    totalOrders: fleet.reduce((total, tenant) => total + tenant.ordersCount, 0),
    securityAlerts: activities.filter((activity) => activity.type === "security").length,
  }), []);

  const planCounts = (["STARTER", "PRO", "ENTERPRISE"] as TenantPlan[]).map((plan) => ({ plan, count: fleet.filter((tenant) => tenant.plan === plan).length }));

  const statusBadge = (status: TenantStatus) => {
    const styles = { active: "border-emerald-200 bg-emerald-50 text-emerald-700", suspended: "border-rose-200 bg-rose-50 text-rose-700", provisioning: "border-amber-200 bg-amber-50 text-amber-700" };
    const labels = { active: "Aktif", suspended: "Ditangguhkan", provisioning: "Sedang dibuat" };
    const Icon = status === "active" ? CheckCircle2 : status === "suspended" ? Ban : Clock;
    return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}><Icon className="h-3 w-3" /> {labels[status]}</span>;
  };

  const activityIcon = (type: string) => {
    if (type === "tenant") return <Building2 className="h-4 w-4 text-emerald-600" />;
    if (type === "upgrade") return <ArrowUpRight className="h-4 w-4 text-indigo-600" />;
    if (type === "security") return <ShieldAlert className="h-4 w-4 text-amber-600" />;
    if (type === "payment") return <Ban className="h-4 w-4 text-rose-600" />;
    return <Database className="h-4 w-4 text-purple-600" />;
  };

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Ringkasan Platform</h1><p className="mt-1 text-sm text-slate-500">Pantau kesehatan tenant, transaksi, dan keamanan DotAds secara menyeluruh.</p></div>
        <Link href="/super-admin/settings" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50"><SlidersHorizontal className="h-4 w-4" /> Pengaturan Platform</Link>
      </header>

      <section aria-label="Metrik utama" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tenant aktif", value: metrics.activeTenants.toString(), note: `${fleet.length} tenant terdaftar`, icon: Building2, tone: "indigo" },
          { label: "GMV platform", value: currencyFormatter.format(metrics.totalGmv), note: "Bulan berjalan (WIB)", icon: DollarSign, tone: "emerald" },
          { label: "Pesanan diproses", value: metrics.totalOrders.toLocaleString("id-ID"), note: "Bulan berjalan (WIB)", icon: Activity, tone: "purple" },
          { label: "Peringatan keamanan", value: metrics.securityAlerts.toString(), note: "24 jam terakhir", icon: ShieldAlert, tone: "amber" },
        ].map((metric) => {
          const Icon = metric.icon;
          const tones: Record<string, string> = { indigo: "bg-indigo-50 text-indigo-600", emerald: "bg-emerald-50 text-emerald-600", purple: "bg-purple-50 text-purple-600", amber: "bg-amber-50 text-amber-600" };
          return <article key={metric.label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 flex items-center gap-3"><span className={`rounded-lg p-2 ${tones[metric.tone]}`}><Icon className="h-5 w-5" /></span><h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">{metric.label}</h2></div><p className="text-3xl font-black tracking-tight text-slate-900">{metric.value}</p><p className="mt-2 text-xs text-slate-500">{metric.note}</p></article>;
        })}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-base font-bold text-slate-900">Sebaran Paket Langganan</h2><p className="mt-1 text-xs text-slate-500">Komposisi seluruh tenant yang terdaftar.</p></div><Link href="/super-admin/tenants" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Kelola tenant →</Link></div>
            <div className="mt-6 grid grid-cols-3 gap-4">{planCounts.map((item) => <div key={item.plan} className="rounded-xl bg-slate-50 p-4 text-center"><p className="text-2xl font-black text-slate-900">{item.count}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.plan === "STARTER" ? "Pemula" : item.plan === "PRO" ? "Pro" : "Enterprise"}</p><div className="mx-auto mt-3 h-1.5 max-w-24 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${(item.count / fleet.length) * 100}%` }} /></div></div>)}</div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h2 className="text-lg font-bold text-slate-900">Kesehatan Tenant</h2><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><span className="sr-only">Cari tenant</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari tenant..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-56" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TenantStatus | "all")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"><option value="all">Semua status</option><option value="active">Aktif</option><option value="suspended">Ditangguhkan</option><option value="provisioning">Sedang dibuat</option></select></div></div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50/80"><th className="px-4 py-3 font-semibold text-slate-600">Tenant</th><th className="px-4 py-3 font-semibold text-slate-600">Status & Paket</th><th className="px-4 py-3 font-semibold text-slate-600">Kinerja</th><th className="px-4 py-3 text-right font-semibold text-slate-600">Tindakan</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredFleet.map((tenant) => <tr key={tenant.id} className="transition-colors hover:bg-slate-50/50"><td className="px-4 py-4"><p className="font-bold text-slate-900">{tenant.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><ExternalLink className="h-3 w-3" /> {tenant.customDomain}</p></td><td className="px-4 py-4"><div>{statusBadge(tenant.status)}</div><span className="mt-2 inline-block rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">{tenant.plan}</span></td><td className="px-4 py-4"><p className="font-semibold text-slate-900">{currencyFormatter.format(tenant.gmv)}</p><p className="text-xs text-slate-500">{tenant.ordersCount.toLocaleString("id-ID")} pesanan</p><p className="mt-1 text-[10px] text-slate-400">Aktif {tenant.lastActive}</p></td><td className="px-4 py-4 text-right"><Link href="/super-admin/tenants" className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"><Users className="h-3.5 w-3.5" /> Kelola</Link></td></tr>)}</tbody></table>{filteredFleet.length === 0 && <div className="p-8 text-center text-sm text-slate-500">Tidak ada tenant yang cocok dengan filter.</div>}</div></div>
          </section>
        </div>

        <aside className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">Aktivitas Platform</h2><Link href="/super-admin/audit-logs" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Lihat audit</Link></div><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="space-y-6">{activities.slice(0, activityLimit).map((activity, index) => <div key={activity.id} className="relative">{index !== Math.min(activityLimit, activities.length) - 1 && <div className="absolute bottom-[-24px] left-4 top-8 w-px bg-slate-100" />}<div className="flex gap-4"><span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50">{activityIcon(activity.type)}</span><div className="flex-1 pt-1"><p className="text-sm font-medium leading-snug text-slate-800">{activity.message}</p><p className="mt-1 text-xs text-slate-400"><span className="font-semibold text-slate-600">{activity.tenant}</span> · {activity.timestamp}</p></div></div></div>)}</div>{activityLimit < activities.length ? <button onClick={() => setActivityLimit(activities.length)} className="mt-6 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Tampilkan aktivitas lainnya</button> : <button onClick={() => setActivityLimit(3)} className="mt-6 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Ringkas aktivitas</button>}</div></aside>
      </div>
    </div>
  );
}
