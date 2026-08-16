"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Ban, Building2, CheckCircle2, CircleHelp, FileClock, RefreshCw, ShieldAlert, Store } from "lucide-react";
import { listPlatformTenants, type PlatformTenant, type TenantStatus } from "@/lib/platform-tenants";
import { getPlatformStats, listPlatformAuditLogs, type PlatformAuditItem, type PlatformStats } from "@/lib/platform-observability";

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

function StatusBadge({ status }: { status: TenantStatus }) {
  const active = status === "active";
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "suspended" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>{active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}{status}</span>;
}

export default function SuperAdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [audit, setAudit] = useState<PlatformAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextStats, nextTenants, nextAudit] = await Promise.all([
        getPlatformStats(),
        listPlatformTenants(),
        listPlatformAuditLogs({ limit: 5, offset: 0 }),
      ]);
      setStats(nextStats);
      setTenants(nextTenants);
      setAudit(nextAudit.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ringkasan platform belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const planCounts = useMemo(() => tenants.reduce<Record<string, number>>((counts, tenant) => {
    counts[tenant.tier] = (counts[tenant.tier] || 0) + 1;
    return counts;
  }, {}), [tenants]);
  const fleetPreview = tenants.slice(0, 5);

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Ringkasan Platform</h1><p className="mt-1 text-sm text-slate-500">Pantau fleet tenant, agregat transaksi, dan audit event platform terbaru.</p></div>
        <Link href="/super-admin/tenants" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"><Building2 className="h-4 w-4" /> Kelola tenant</Link>
      </header>

      {error && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button type="button" onClick={() => void load()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 font-semibold"><RefreshCw className="h-4 w-4" /> Coba lagi</button></div>}

      <section aria-label="Metrik platform" aria-busy={loading} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(loading ? ["Total tenant", "Tenant aktif", "GMV tercatat", "Pesanan tercatat"] : [
          ["Total tenant", stats?.totalTenants.toLocaleString("id-ID") ?? "—", "Semua status"],
          ["Tenant aktif", stats?.activeTenants.toLocaleString("id-ID") ?? "—", `${stats?.suspendedTenants ?? 0} suspended`],
          ["GMV tercatat", stats ? rupiah.format(stats.totalGmv) : "—", "Aggregate API · IDR"],
          ["Pesanan tercatat", stats?.totalOrders.toLocaleString("id-ID") ?? "—", "Aggregate API"],
        ]).map((item, index) => {
          const data = Array.isArray(item) ? item : [item, "", ""];
          const icons = [Building2, CheckCircle2, Activity, Store]; const Icon = icons[index];
          return <article key={data[0]} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-lg bg-indigo-50 p-2 text-indigo-700"><Icon className="h-5 w-5" /></span><h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{data[0]}</h2></div>{loading ? <div className="mt-4 h-9 w-28 animate-pulse rounded bg-slate-100" /> : <><p className="mt-4 text-2xl font-black tracking-tight text-slate-950">{data[1]}</p><p className="mt-1 text-xs text-slate-500">{data[2]}</p></>}</article>;
        })}
      </section>

      {!loading && stats && <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600"><CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" /><div><p className="font-semibold text-slate-800">Klasifikasi peringatan keamanan belum tersedia</p><p className="mt-1 text-xs leading-5">API mengembalikan <code>securityAlertsCount: null</code> sampai audit events memiliki severity/classification resmi.</p></div></div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4"><div><h2 className="font-bold text-slate-900">Sebaran paket</h2><p className="mt-1 text-xs text-slate-500">Dihitung dari tenant API.</p></div><Link href="/super-admin/tenants" className="text-sm font-semibold text-indigo-700">Lihat fleet</Link></div>
            {loading ? <div className="mt-5 h-20 animate-pulse rounded-xl bg-slate-100" /> : tenants.length === 0 ? <p className="mt-5 rounded-lg bg-slate-50 p-5 text-sm text-slate-500">Belum ada tenant.</p> : <div className="mt-5 grid grid-cols-3 gap-3">{["STARTER", "PRO", "ENTERPRISE"].map((tier) => <div key={tier} className="rounded-xl bg-slate-50 p-4 text-center"><p className="text-2xl font-black text-slate-950">{planCounts[tier] || 0}</p><p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-slate-500">{tier}</p></div>)}</div>}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="font-bold text-slate-900">Fleet terbaru</h2><p className="mt-1 text-xs text-slate-500">Maksimal lima tenant dari urutan API.</p></div><Link href="/super-admin/tenants" aria-label="Buka seluruh tenant" className="rounded-lg p-2 text-indigo-700 hover:bg-indigo-50"><ArrowRight className="h-5 w-5" /></Link></div>
            {loading ? <div className="m-5 h-36 animate-pulse rounded-xl bg-slate-100" /> : fleetPreview.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Belum ada tenant untuk ditampilkan.</p> : <div className="divide-y divide-slate-100">{fleetPreview.map((tenant) => <article key={tenant.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Store className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{tenant.name}</p><p className="truncate text-xs text-slate-500">{tenant.customDomain || tenant.slug}</p></div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={tenant.status} /><span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">{tenant.tier}</span></div></article>)}</div>}
          </section>
        </div>

        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="font-bold text-slate-900">Audit terbaru</h2><p className="mt-1 text-xs text-slate-500">Lima event platform terbaru.</p></div><FileClock className="h-5 w-5 text-slate-400" /></div>
          {loading ? <div className="m-5 h-56 animate-pulse rounded-xl bg-slate-100" /> : audit.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Belum ada audit event.</p> : <div className="divide-y divide-slate-100">{audit.map((item) => <article key={item.id} className="p-4"><p className="break-words text-sm font-bold text-slate-900">{item.action}</p><p className="mt-1 truncate text-xs text-slate-600">{item.actorEmail} · {item.actorRole}</p><p className="mt-2 text-[11px] text-slate-400">{dateTime.format(new Date(item.createdAt))} WIB</p></article>)}</div>}
          <div className="border-t border-slate-100 p-3"><Link href="/super-admin/audit-logs" className="flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Buka audit trail <ArrowRight className="h-4 w-4" /></Link></div>
        </aside>
      </div>

      {!loading && error && <p className="text-xs text-slate-500"><ShieldAlert className="mr-1 inline h-4 w-4" />Data lama tidak ditampilkan ketika refresh gagal.</p>}
    </div>
  );
}
