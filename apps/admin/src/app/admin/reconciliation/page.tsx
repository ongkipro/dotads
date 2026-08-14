"use client";

import { AlertCircle, CheckCircle2, Clock, CreditCard, Download, Receipt, Search, Truck, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

type Tab = "autolaris" | "mengantar";
type SettlementStatus = "Selesai" | "Diproses" | "Ditahan" | "Disengketakan";
type Row = {
  id: string;
  reference: string;
  date: string;
  channel: string;
  gross: number;
  fee: number;
  net: number;
  status: Exclude<SettlementStatus, "Disengketakan">;
};

const AUTOLARIS_ROWS: Row[] = [
  { id: "TX_AL_0991", reference: "ORD_991021", date: "14 Agu 2026, 10.30", channel: "QRIS", gross: 250000, fee: 1750, net: 248250, status: "Selesai" },
  { id: "TX_AL_0992", reference: "ORD_991022", date: "14 Agu 2026, 11.15", channel: "VA BCA", gross: 850000, fee: 4000, net: 846000, status: "Diproses" },
  { id: "TX_AL_0993", reference: "ORD_991023", date: "13 Agu 2026, 15.45", channel: "VA Mandiri", gross: 125000, fee: 4000, net: 121000, status: "Selesai" },
  { id: "TX_AL_0994", reference: "ORD_991024", date: "13 Agu 2026, 17.20", channel: "VA BRI", gross: 490000, fee: 4000, net: 486000, status: "Ditahan" },
];

const MENGANTAR_ROWS: Row[] = [
  { id: "RMT_MG_100", reference: "JNT8829103991", date: "14 Agu 2026, 09.00", channel: "J&T EZ", gross: 350000, fee: 10500, net: 339500, status: "Selesai" },
  { id: "RMT_MG_101", reference: "SAP9982331122", date: "13 Agu 2026, 14.20", channel: "SAP Reguler", gross: 1250000, fee: 37500, net: 1212500, status: "Diproses" },
  { id: "RMT_MG_102", reference: "JNE889102001", date: "12 Agu 2026, 16.10", channel: "JNE REG", gross: 150000, fee: 4500, net: 145500, status: "Selesai" },
  { id: "RMT_MG_103", reference: "SCP771028119", date: "12 Agu 2026, 18.40", channel: "SiCepat REG", gross: 850000, fee: 25500, net: 824500, status: "Ditahan" },
];

const formatRupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export default function ReconciliationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("autolaris");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | SettlementStatus>("semua");
  const [claims, setClaims] = useState<Record<string, string>>({});
  const [claimRow, setClaimRow] = useState<Row | null>(null);
  const [claimReason, setClaimReason] = useState("Nominal tidak sesuai");
  const [claimNote, setClaimNote] = useState("");
  const [notice, setNotice] = useState("");

  const sourceRows = activeTab === "autolaris" ? AUTOLARIS_ROWS : MENGANTAR_ROWS;
  const visibleRows = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id-ID");
    return sourceRows.filter((row) => {
      const effectiveStatus: SettlementStatus = claims[row.id] ? "Disengketakan" : row.status;
      return (!term || `${row.id} ${row.reference}`.toLocaleLowerCase("id-ID").includes(term)) && (statusFilter === "semua" || effectiveStatus === statusFilter);
    });
  }, [claims, query, sourceRows, statusFilter]);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setQuery("");
    setStatusFilter("semua");
    setNotice("");
  };

  const exportCsv = () => {
    const header = ["ID", activeTab === "autolaris" ? "Referensi pesanan" : "Nomor resi", "Tanggal", "Kanal", "Bruto", "Biaya", "Bersih", "Status"];
    const records = visibleRows.map((row) => [row.id, row.reference, row.date, row.channel, row.gross, row.fee, row.net, claims[row.id] ? "Disengketakan" : row.status]);
    const csv = [header, ...records].map((record) => record.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rekonsiliasi-${activeTab}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`${visibleRows.length} baris berhasil diekspor ke CSV.`);
  };

  const openClaim = (row: Row) => {
    setClaimRow(row);
    setClaimReason("Nominal tidak sesuai");
    setClaimNote("");
  };

  const submitClaim = (event: FormEvent) => {
    event.preventDefault();
    if (!claimRow || !claimNote.trim()) return;
    setClaims((current) => ({ ...current, [claimRow.id]: `${claimReason}: ${claimNote.trim()}` }));
    setNotice(`Klaim sengketa untuk ${claimRow.id} berhasil diajukan.`);
    setClaimRow(null);
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><Receipt className="h-4 w-4" /> Operasional keuangan</div><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Rekonsiliasi pencairan</h1><p className="mt-1 text-sm font-medium text-slate-500">Cocokkan pencairan AutoLaris dan setoran COD Mengantar dalam satu tampilan.</p></div>
        <button type="button" onClick={exportCsv} disabled={visibleRows.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><Download className="h-4 w-4" /> Ekspor CSV</button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Menunggu pencairan" value="Rp12.450.000" detail="14 transaksi sedang diproses" icon={Clock} color="bg-amber-50 text-amber-600" />
        <Metric label="Siap ditarik" value="Rp34.200.000" detail="Tersedia di saldo dompet" icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        <Metric label="Sengketa dan penahanan" value="Rp850.000" detail={`${Object.keys(claims).length + 2} transaksi memerlukan tindak lanjut`} icon={AlertCircle} color="bg-rose-50 text-rose-600" />
      </section>

      <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex overflow-x-auto border-b border-slate-200 px-2 pt-2" role="tablist" aria-label="Sumber rekonsiliasi">
          <button type="button" role="tab" aria-selected={activeTab === "autolaris"} onClick={() => switchTab("autolaris")} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeTab === "autolaris" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}><CreditCard className="h-4 w-4" /> Pencairan QRIS/VA AutoLaris</button>
          <button type="button" role="tab" aria-selected={activeTab === "mengantar"} onClick={() => switchTab("mengantar")} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeTab === "mengantar" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}><Truck className="h-4 w-4" /> Setoran COD Mengantar</button>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative w-full sm:w-96"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={activeTab === "autolaris" ? "Cari ID transaksi atau pesanan" : "Cari ID setoran atau nomor resi"} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none shadow-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" /></label>
          <label className="flex w-full items-center gap-2 text-xs font-bold text-slate-600 sm:w-auto"><span className="shrink-0">Status pencairan</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "semua" | SettlementStatus)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none shadow-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-48"><option value="semua">Semua status</option><option value="Selesai">Selesai</option><option value="Diproses">Diproses</option><option value="Ditahan">Ditahan</option><option value="Disengketakan">Disengketakan</option></select></label>
        </div>

        {notice && <div role="status" className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500"><th className="p-4">{activeTab === "autolaris" ? "ID transaksi" : "ID setoran"}</th><th className="p-4">{activeTab === "autolaris" ? "Referensi pesanan" : "Nomor resi"}</th><th className="p-4">Tanggal dan waktu</th><th className="p-4">{activeTab === "autolaris" ? "Metode pembayaran" : "Kurir"}</th><th className="p-4 text-right">Nilai bruto</th><th className="p-4 text-right">Biaya</th><th className="p-4 text-right">Nilai bersih</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.map((row) => { const status: SettlementStatus = claims[row.id] ? "Disengketakan" : row.status; return <tr key={row.id} className="hover:bg-slate-50/60"><td className="p-4 text-sm font-semibold text-slate-900">{row.id}</td><td className="p-4 text-sm font-medium text-indigo-600">{row.reference}</td><td className="p-4 text-sm font-medium text-slate-600">{row.date}</td><td className="p-4 text-sm font-medium text-slate-600">{row.channel}</td><td className="p-4 text-right text-sm font-bold text-slate-900">{formatRupiah(row.gross)}</td><td className="p-4 text-right text-sm font-medium text-rose-600">-{formatRupiah(row.fee)}</td><td className="p-4 text-right text-sm font-bold text-emerald-700">{formatRupiah(row.net)}</td><td className="p-4"><StatusBadge status={status} /></td><td className="p-4 text-right"><button type="button" onClick={() => openClaim(row)} disabled={Boolean(claims[row.id])} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">{claims[row.id] ? "Klaim diajukan" : "Ajukan sengketa"}</button></td></tr>; })}
            </tbody>
          </table>
          {visibleRows.length === 0 && <div className="px-5 py-12 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">Data pencairan tidak ditemukan</p><p className="text-xs text-slate-500">Ubah kata kunci atau pilih status lain.</p></div>}
        </div>
      </section>

      {claimRow && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setClaimRow(null)}><section role="dialog" aria-modal="true" aria-labelledby="claim-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-rose-600">Klaim sengketa</p><h2 id="claim-title" className="mt-1 text-lg font-bold text-slate-900">Laporkan selisih pencairan</h2><p className="mt-1 text-xs text-slate-500">{claimRow.id} · {claimRow.reference}</p></div><button type="button" aria-label="Tutup formulir sengketa" onClick={() => setClaimRow(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div><form onSubmit={submitClaim} className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Nilai bruto</p><p className="mt-1 font-bold text-slate-900">{formatRupiah(claimRow.gross)}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Nilai bersih</p><p className="mt-1 font-bold text-slate-900">{formatRupiah(claimRow.net)}</p></div></div><label className="block space-y-1.5 text-xs font-bold text-slate-700">Alasan sengketa<select value={claimReason} onChange={(event) => setClaimReason(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"><option>Nominal tidak sesuai</option><option>Pencairan belum diterima</option><option>Biaya layanan tidak sesuai</option><option>Transaksi tidak dikenali</option></select></label><label className="block space-y-1.5 text-xs font-bold text-slate-700">Keterangan pendukung<textarea required rows={4} value={claimNote} onChange={(event) => setClaimNote(event.target.value)} placeholder="Jelaskan selisih dan bukti yang tersedia" className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm font-normal leading-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label><p className="text-xs leading-5 text-slate-500">Klaim akan menandai transaksi sebagai disengketakan untuk ditinjau tim keuangan.</p><button type="submit" disabled={!claimNote.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"><AlertCircle className="h-4 w-4" /> Kirim klaim sengketa</button></form></section></div>}
    </div>
  );
}

function Metric({ label, value, detail, icon: Icon, color }: { label: string; value: string; detail: string; icon: typeof Clock; color: string }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">{label}</h2><span className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}><Icon className="h-4 w-4" /></span></div><p className="text-3xl font-extrabold text-slate-900">{value}</p><p className="mt-2 text-xs font-medium text-slate-500">{detail}</p></article>;
}

function StatusBadge({ status }: { status: SettlementStatus }) {
  const color = status === "Selesai" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "Disengketakan" ? "border-rose-200 bg-rose-50 text-rose-700" : status === "Ditahan" ? "border-orange-200 bg-orange-50 text-orange-700" : "border-amber-200 bg-amber-50 text-amber-700";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${color}`}>{status}</span>;
}
