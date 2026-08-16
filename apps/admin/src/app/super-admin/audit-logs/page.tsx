"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileClock, Filter, RefreshCw, ShieldAlert, UserRound } from "lucide-react";
import { listPlatformAuditLogs, type PlatformAuditFilters, type PlatformAuditItem, type PlatformAuditPage } from "@/lib/platform-observability";

const PAGE_SIZE = 25;
const dateTime = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Jakarta" });

export default function GlobalAuditLogsPage() {
  const [page, setPage] = useState<PlatformAuditPage | null>(null);
  const [filters, setFilters] = useState<PlatformAuditFilters>({ limit: PAGE_SIZE, offset: 0 });
  const [draft, setDraft] = useState({ action: "", actorId: "", tenantId: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (nextFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      setPage(await listPlatformAuditLogs(nextFilters));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Audit trail belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(filters); }, [filters]);

  const submitFilters = (event: FormEvent) => {
    event.preventDefault();
    setFilters({
      limit: PAGE_SIZE,
      offset: 0,
      ...(draft.action.trim() ? { action: draft.action.trim() } : {}),
      ...(draft.actorId.trim() ? { actorId: draft.actorId.trim() } : {}),
      ...(draft.tenantId.trim() ? { tenantId: draft.tenantId.trim() } : {}),
    });
  };
  const clearFilters = () => {
    setDraft({ action: "", actorId: "", tenantId: "" });
    setFilters({ limit: PAGE_SIZE, offset: 0 });
  };

  const uniqueActors = useMemo(() => new Set(page?.items.map((item) => item.actorId)).size, [page]);
  const offset = page?.pagination.offset ?? 0;
  const total = page?.pagination.total ?? 0;
  const end = Math.min(offset + (page?.items.length ?? 0), total);

  const AuditDetails = ({ item }: { item: PlatformAuditItem }) => (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      <div><dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target</dt><dd className="mt-1 break-all text-slate-700">{item.targetType}/{item.targetId}</dd></div>
      <div><dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tenant ID</dt><dd className="mt-1 break-all text-slate-700">{item.tenantId || "Platform"}</dd></div>
    </dl>
  );

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><ShieldAlert className="h-4 w-4" /> Tata kelola</div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Global Audit Trail</h1><p className="mt-1 text-sm text-slate-500">Catatan append-only yang dikembalikan platform audit API.</p></div>
        <button type="button" disabled title="Export API belum tersedia" className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-400"><Download className="h-4 w-4" /> Export belum tersedia</button>
      </header>

      {error && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button type="button" onClick={() => void load()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 font-semibold"><RefreshCw className="h-4 w-4" /> Coba lagi</button></div>}

      <section className="grid gap-4 sm:grid-cols-3" aria-busy={loading}>
        {[
          ["Total cocok", loading ? "—" : total.toLocaleString("id-ID"), "Hasil filter server", FileClock],
          ["Halaman ini", loading ? "—" : (page?.items.length ?? 0).toLocaleString("id-ID"), `Offset ${offset}`, ShieldAlert],
          ["Actor unik", loading ? "—" : uniqueActors.toLocaleString("id-ID"), "Pada halaman ini", UserRound],
        ].map(([label, value, note, Icon]) => <article key={String(label)} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{String(label)}</p><p className="mt-2 text-2xl font-black text-slate-950">{String(value)}</p><p className="mt-1 text-xs text-slate-500">{String(note)}</p></div><span className="rounded-lg bg-indigo-50 p-2 text-indigo-700"><Icon className="h-5 w-5" /></span></div></article>)}
      </section>

      <form onSubmit={submitFilters} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="space-y-1.5 text-xs font-semibold text-slate-600">Action persis<input value={draft.action} onChange={(event) => setDraft({ ...draft, action: event.target.value })} placeholder="tenant.create" className="block min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-600">ID actor persis<input value={draft.actorId} onChange={(event) => setDraft({ ...draft, actorId: event.target.value })} placeholder="User ID" className="block min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-600">UUID tenant persis<input value={draft.tenantId} onChange={(event) => setDraft({ ...draft, tenantId: event.target.value })} placeholder="Tenant UUID" className="block min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
          <button type="submit" disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50"><Filter className="h-4 w-4" /> Terapkan</button>
        </div>
        {(filters.action || filters.actorId || filters.tenantId) && <button type="button" onClick={clearFilters} className="mt-3 min-h-11 text-sm font-semibold text-indigo-700">Hapus semua filter</button>}
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5"><h2 className="font-bold text-slate-900">Event audit</h2><p className="mt-1 text-xs text-slate-500">IP, metadata, severity, dan before/after sengaja tidak dikembalikan oleh API ini.</p></div>
        {loading ? <div className="space-y-3 p-5" role="status" aria-label="Memuat audit trail">{[0, 1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div> : !page || page.items.length === 0 ? <div className="p-10 text-center"><FileClock className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">Tidak ada audit event yang cocok</p><p className="mt-1 text-sm text-slate-500">Ubah filter atau tunggu event platform berikutnya.</p></div> : <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Waktu (WIB)</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Target</th><th className="px-5 py-3">Tenant</th></tr></thead><tbody className="divide-y divide-slate-100">{page.items.map((item) => <tr key={item.id}><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">{dateTime.format(new Date(item.createdAt))}</td><td className="px-5 py-4"><p className="font-bold text-slate-900">{item.action}</p><p className="mt-1 text-xs text-slate-400">{item.id}</p></td><td className="px-5 py-4"><p className="text-slate-800">{item.actorEmail}</p><p className="text-xs text-slate-500">{item.actorRole} · {item.actorId}</p></td><td className="px-5 py-4 text-slate-700">{item.targetType}/{item.targetId}</td><td className="px-5 py-4 text-xs text-slate-600">{item.tenantId || "Platform"}</td></tr>)}</tbody></table></div>
          <div className="divide-y divide-slate-100 md:hidden">{page.items.map((item) => <article key={item.id} className="space-y-4 p-4"><div><p className="break-words font-bold text-slate-900">{item.action}</p><p className="mt-1 text-xs text-slate-400">{dateTime.format(new Date(item.createdAt))} WIB</p></div><div><p className="text-sm font-semibold text-slate-800">{item.actorEmail}</p><p className="mt-1 break-all text-xs text-slate-500">{item.actorRole} · {item.actorId}</p></div><AuditDetails item={item} /></article>)}</div>
        </>}
        {!loading && page && <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">{total === 0 ? "0 event" : `${offset + 1}–${end} dari ${total.toLocaleString("id-ID")}`}</p><div className="grid grid-cols-2 gap-2"><button type="button" disabled={offset === 0 || loading} onClick={() => setFilters({ ...filters, offset: Math.max(0, offset - PAGE_SIZE) })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Sebelumnya</button><button type="button" disabled={end >= total || loading} onClick={() => setFilters({ ...filters, offset: offset + PAGE_SIZE })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-40">Berikutnya <ChevronRight className="h-4 w-4" /></button></div></div>}
      </section>
    </div>
  );
}
