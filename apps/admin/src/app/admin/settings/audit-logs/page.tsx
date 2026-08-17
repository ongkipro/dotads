"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, FileText, RefreshCw, Search, ShieldCheck, User } from "lucide-react";
import { listTenantAuditLogs, type TenantAuditLog, type TenantAuditLogPage } from "@/lib/admin-audit-logs";

const LIMIT = 25;
const WIB = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
const ACTION_LABELS: Record<string, string> = {
  "catalog.product_created": "Produk dibuat", "catalog.product_updated": "Produk diperbarui", "catalog.product_archived": "Produk diarsipkan",
  "domain.verified": "Domain diverifikasi", "member.invite": "Anggota diundang", "member.invited": "Anggota diundang", "member.invitation_accepted": "Undangan anggota diterima",
  "member.invitation_created": "Undangan anggota dibuat", "member.invitation_resent": "Masa berlaku undangan diperpanjang", "member.invitation_cancelled": "Undangan anggota dibatalkan", "member.role_updated": "Peran anggota diubah", "member.removed": "Anggota dihapus",
  "order.processing_started": "Pemrosesan pesanan dimulai", "order.cancel": "Pesanan dibatalkan", "order.dispatch_queued": "Pengiriman masuk antrean",
};
const ROLE_LABELS: Record<string, string> = { TENANT_OWNER: "Pemilik Toko", ADMIN: "Admin Toko", ADVERTISER: "Pengelola Iklan", CUSTOMER_SERVICE: "Layanan Pelanggan", SUPER_ADMIN: "Super Admin" };
const actionLabel = (value: string) => ACTION_LABELS[value] ?? "Aktivitas sistem";
const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : "Log aktivitas belum dapat dimuat.";

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState<TenantAuditLogPage | null>(null);
  const [offset, setOffset] = useState(0);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [days, setDays] = useState<"" | "7" | "30">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    listTenantAuditLogs({ limit: LIMIT, offset, q: query || undefined, action: action || undefined, days: days ? Number(days) as 7 | 30 : undefined }, (input, init) => fetch(input, { ...init, signal: controller.signal }))
      .then(setPage).catch((cause) => { if (!controller.signal.aborted) setError(errorMessage(cause)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [action, days, offset, query, reload]);

  const submit = (event: FormEvent) => { event.preventDefault(); setOffset(0); setQuery(queryInput.trim()); };
  const reset = () => { setQueryInput(""); setQuery(""); setAction(""); setDays(""); setOffset(0); };
  const filtered = !!query || !!action || !!days;

  return <div className="space-y-5 pb-8">
    <header><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Akses dan keamanan</div><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Log Aktivitas</h1><p className="mt-1 text-sm text-slate-500">Tinjau aktivitas yang tercatat untuk toko aktif. Waktu ditampilkan dalam WIB.</p></header>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <form onSubmit={submit} className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_220px_180px_auto_auto]">
        <label className="relative"><span className="sr-only">Cari log aktivitas</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" /><input type="search" maxLength={100} value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Cari pelaku, tindakan, atau target" className="min-h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" /></label>
        <label className="relative"><span className="sr-only">Filter tindakan</span><FileText className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" /><select value={action} onChange={(event) => { setAction(event.target.value); setOffset(0); }} className="min-h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm"><option value="">Semua tindakan</option>{page?.filters.actions.map((value) => <option key={value} value={value}>{ACTION_LABELS[value] ? actionLabel(value) : `Aktivitas sistem · ${value}`}</option>)}</select></label>
        <label className="relative"><span className="sr-only">Filter periode</span><CalendarDays className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" /><select value={days} onChange={(event) => { setDays(event.target.value as typeof days); setOffset(0); }} className="min-h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm"><option value="">Semua waktu</option><option value="7">7 hari terakhir</option><option value="30">30 hari terakhir</option></select></label>
        <button className="min-h-11 rounded-lg bg-slate-900 px-5 text-sm font-bold text-white">Cari</button>
        <button type="button" onClick={reset} disabled={!filtered && !queryInput} className="min-h-11 rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40">Atur ulang</button>
      </form>
      {loading && !page ? <Skeleton /> : error && !page ? <State icon={AlertCircle} title="Log aktivitas belum dapat dimuat" detail={error}><button onClick={() => setReload((value) => value + 1)} className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white"><RefreshCw className="mr-2 inline h-4 w-4" />Coba lagi</button></State> : page && page.items.length === 0 ? <State icon={FileText} title={filtered ? "Tidak ada hasil" : "Belum ada aktivitas tercatat"} detail={filtered ? "Ubah pencarian atau filter untuk melihat aktivitas lain." : "Aktivitas yang tersedia akan tampil di halaman ini."}>{filtered && <button onClick={reset} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold">Atur ulang filter</button>}</State> : page && <>
        {error && <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><span>Data terbaru belum dapat dimuat. Data sebelumnya masih ditampilkan.</span><button onClick={() => setReload((value) => value + 1)} className="font-bold underline">Coba lagi</button></div>}
        <div className="divide-y divide-slate-100 lg:hidden">{page.items.map((item) => <AuditCard key={item.id} item={item} />)}</div>
        <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Tindakan</th><th className="px-5 py-3">Pelaku</th><th className="px-5 py-3">Target</th><th className="px-5 py-3">Waktu (WIB)</th></tr></thead><tbody className="divide-y divide-slate-100">{page.items.map((item) => <AuditRow key={item.id} item={item} />)}</tbody></table></div>
        <Pagination page={page} onOffset={setOffset} />
      </>}
    </section>
  </div>;
}

function AuditCard({ item }: { item: TenantAuditLog }) { return <article className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">{actionLabel(item.action)}</span><time className="text-right text-xs text-slate-500">{WIB.format(new Date(item.createdAt))} WIB</time></div>{!ACTION_LABELS[item.action] && <p className="font-mono text-[11px] text-slate-400">{item.action}</p>}<div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-slate-400" aria-hidden="true" /><span className="break-all font-semibold text-slate-800">{item.actor.email}</span></div><dl className="grid grid-cols-[72px_1fr] gap-2 text-xs"><dt className="text-slate-500">Peran</dt><dd>{ROLE_LABELS[item.actor.role] ?? item.actor.role}</dd><dt className="text-slate-500">Objek</dt><dd className="break-all font-mono">{item.target.type} · {item.target.id}</dd></dl></article>; }
function AuditRow({ item }: { item: TenantAuditLog }) { return <tr><td className="px-5 py-4"><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">{actionLabel(item.action)}</span><p className="mt-2 font-mono text-[11px] text-slate-400">{item.action}</p></td><td className="px-5 py-4"><p className="font-semibold text-slate-800">{item.actor.email}</p><p className="mt-1 text-xs text-slate-500">{ROLE_LABELS[item.actor.role] ?? item.actor.role}</p></td><td className="px-5 py-4"><p>{item.target.type}</p><p className="mt-1 max-w-xs break-all font-mono text-xs text-slate-500">{item.target.id}</p></td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{WIB.format(new Date(item.createdAt))} WIB</td></tr>; }
function Pagination({ page, onOffset }: { page: TenantAuditLogPage; onOffset: (value: number) => void }) { const end = Math.min(page.pagination.offset + page.pagination.limit, page.pagination.total); return <footer className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 text-sm"><p className="text-slate-500">{page.pagination.total ? page.pagination.offset + 1 : 0}–{end} dari {page.pagination.total} aktivitas</p><div className="flex gap-2"><button aria-label="Halaman sebelumnya" disabled={page.pagination.offset === 0} onClick={() => onOffset(Math.max(0, page.pagination.offset - page.pagination.limit))} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-slate-300 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><button aria-label="Halaman berikutnya" disabled={end >= page.pagination.total} onClick={() => onOffset(page.pagination.offset + page.pagination.limit)} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-slate-300 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></footer>; }
function Skeleton() { return <div aria-label="Memuat log aktivitas" className="space-y-3 p-4">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />)}</div>; }
function State({ icon: Icon, title, detail, children }: { icon: typeof AlertCircle; title: string; detail: string; children?: React.ReactNode }) { return <div className="grid min-h-72 place-items-center p-6 text-center"><div><Icon className="mx-auto h-9 w-9 text-slate-400" /><h2 className="mt-3 font-bold text-slate-900">{title}</h2><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{detail}</p>{children && <div className="mt-4">{children}</div>}</div></div>; }
