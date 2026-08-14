"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, FileText, Search, ShieldAlert, User, X } from "lucide-react";

type AuditAction = "TENANT_PROVISIONED" | "FORM_SCHEMA_PUBLISHED" | "DOMAIN_ADD_ATTEMPT" | "MENGANTAR_DISPATCH" | "MEMBER_INVITED";

interface AuditLogRow {
  id: string;
  action: AuditAction;
  actorEmail: string;
  ipAddress: string;
  details: string;
  createdAt: string;
}

const actionLabels: Record<AuditAction, string> = {
  TENANT_PROVISIONED: "Toko dibuat",
  FORM_SCHEMA_PUBLISHED: "Formulir diterbitkan",
  DOMAIN_ADD_ATTEMPT: "Domain ditambahkan",
  MENGANTAR_DISPATCH: "Paket dikirim",
  MEMBER_INVITED: "Anggota diundang",
};

const sampleAuditLogs: AuditLogRow[] = [
  { id: "log_1", action: "TENANT_PROVISIONED", actorEmail: "superadmin@dotads.com", ipAddress: "127.0.0.1", details: "Toko Alpha berhasil dibuat dan siap digunakan.", createdAt: "2026-08-14T10:00:00+07:00" },
  { id: "log_2", action: "FORM_SCHEMA_PUBLISHED", actorEmail: "owner@store-alpha.com", ipAddress: "180.252.10.14", details: "Formulir COD satu halaman versi 2 diterbitkan.", createdAt: "2026-08-14T10:12:30+07:00" },
  { id: "log_3", action: "DOMAIN_ADD_ATTEMPT", actorEmail: "owner@store-alpha.com", ipAddress: "180.252.10.14", details: "Domain store-alpha.com ditambahkan untuk verifikasi.", createdAt: "2026-08-13T10:20:15+07:00" },
  { id: "log_4", action: "MENGANTAR_DISPATCH", actorEmail: "ops@store-alpha.com", ipAddress: "100.127.67.86", details: "Resi MNG_51628351 diserahkan ke JNE.", createdAt: "2026-08-10T10:45:00+07:00" },
  { id: "log_5", action: "MEMBER_INVITED", actorEmail: "owner@store-alpha.com", ipAddress: "180.252.10.14", details: "Undangan anggota dikirim ke finance@store-alpha.com.", createdAt: "2026-07-28T09:30:00+07:00" },
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default function AdminAuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [periodFilter, setPeriodFilter] = useState<"all" | "7" | "30">("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const now = new Date("2026-08-14T23:59:59+07:00").getTime();
    return sampleAuditLogs.filter((log) => {
      const matchesSearch = !query || `${actionLabels[log.action]} ${log.actorEmail} ${log.details} ${log.ipAddress}`.toLowerCase().includes(query);
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesPeriod = periodFilter === "all" || now - new Date(log.createdAt).getTime() <= Number(periodFilter) * 86_400_000;
      return matchesSearch && matchesAction && matchesPeriod;
    });
  }, [actionFilter, periodFilter, searchTerm]);

  const resetFilters = () => {
    setSearchTerm("");
    setActionFilter("all");
    setPeriodFilter("all");
  };

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><ShieldAlert className="h-4 w-4" /> Keamanan & Kepatuhan</div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Riwayat Audit</h1>
        <p className="mt-1 text-sm text-slate-500">Telusuri perubahan toko, tindakan anggota, dan aktivitas keamanan. Waktu ditampilkan dalam WIB.</p>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[minmax(240px,1fr)_220px_180px_auto]">
          <label className="relative"><span className="sr-only">Cari riwayat audit</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari pelaku, tindakan, IP, atau rincian..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
          <label className="relative"><span className="sr-only">Filter tindakan</span><FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><select value={actionFilter} onChange={(event) => setActionFilter(event.target.value as AuditAction | "all")} className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"><option value="all">Semua tindakan</option>{(Object.keys(actionLabels) as AuditAction[]).map((action) => <option key={action} value={action}>{actionLabels[action]}</option>)}</select></label>
          <label className="relative"><span className="sr-only">Filter periode</span><CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value as "all" | "7" | "30")} className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"><option value="all">Semua waktu</option><option value="7">7 hari terakhir</option><option value="30">30 hari terakhir</option></select></label>
          <button onClick={resetFilters} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Atur ulang</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3 font-semibold">Tindakan</th><th className="px-5 py-3 font-semibold">Pelaku</th><th className="px-5 py-3 font-semibold">Alamat IP</th><th className="px-5 py-3 font-semibold">Waktu (WIB)</th><th className="px-5 py-3"><span className="sr-only">Buka rincian</span></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} onClick={() => setSelectedLog(log)} className="cursor-pointer transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4"><span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">{actionLabels[log.action]}</span><p className="mt-2 max-w-sm truncate text-xs text-slate-500">{log.details}</p></td>
                  <td className="px-5 py-4"><span className="flex items-center gap-2 font-medium text-slate-700"><User className="h-4 w-4 text-slate-400" />{log.actorEmail}</span></td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{log.ipAddress}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{dateFormatter.format(new Date(log.createdAt))}</td>
                  <td className="px-5 py-4 text-right"><ChevronRight className="inline h-4 w-4 text-slate-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && <div className="p-10 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">Tidak ada riwayat yang cocok</p><button onClick={resetFilters} className="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">Atur ulang filter</button></div>}
        </div>
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500">Menampilkan {filteredLogs.length} dari {sampleAuditLogs.length} aktivitas.</div>
      </section>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="audit-detail-title">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5"><div><h2 id="audit-detail-title" className="text-lg font-bold text-slate-900">Rincian Aktivitas</h2><p className="mt-1 text-xs text-slate-500">ID audit: {selectedLog.id}</p></div><button onClick={() => setSelectedLog(null)} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-4 p-5 text-sm"><dt className="font-semibold text-slate-500">Tindakan</dt><dd className="font-semibold text-slate-900">{actionLabels[selectedLog.action]}</dd><dt className="font-semibold text-slate-500">Pelaku</dt><dd className="break-all text-slate-900">{selectedLog.actorEmail}</dd><dt className="font-semibold text-slate-500">Alamat IP</dt><dd className="font-mono text-slate-900">{selectedLog.ipAddress}</dd><dt className="font-semibold text-slate-500">Waktu</dt><dd className="text-slate-900">{dateFormatter.format(new Date(selectedLog.createdAt))} WIB</dd><dt className="font-semibold text-slate-500">Rincian</dt><dd className="leading-relaxed text-slate-900">{selectedLog.details}</dd></dl>
            <div className="flex justify-end border-t border-slate-100 p-5"><button onClick={() => setSelectedLog(null)} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
