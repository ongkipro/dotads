"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  Truck,
  Weight,
  X,
  Zap,
} from "lucide-react";

type Quote = {
  id: string;
  courier: string;
  service: string;
  category: "Regular" | "Express" | "Cargo";
  eta: string;
  price: number;
  codSupported: boolean;
  pickupCutoff: string;
  notes: string;
};

const QUOTES: Quote[] = [
  { id: "jne-reg", courier: "JNE", service: "REG", category: "Regular", eta: "2–3 hari", price: 18000, codSupported: true, pickupCutoff: "16:00 WIB", notes: "Estimasi reguler antarkota dengan pelacakan penuh." },
  { id: "sicepat-best", courier: "SiCepat", service: "BEST", category: "Express", eta: "1 hari", price: 26000, codSupported: true, pickupCutoff: "15:30 WIB", notes: "Layanan prioritas untuk pengiriman hari berikutnya." },
  { id: "jnt-ez", courier: "J&T", service: "EZ", category: "Regular", eta: "2–4 hari", price: 17000, codSupported: true, pickupCutoff: "17:00 WIB", notes: "Pickup harian dan dukungan COD di area tujuan." },
  { id: "sap-reg", courier: "SAP Express", service: "REG", category: "Regular", eta: "3–5 hari", price: 15500, codSupported: true, pickupCutoff: "14:30 WIB", notes: "Pilihan ekonomis dengan jangkauan COD nasional." },
  { id: "jne-jtr", courier: "JNE", service: "JTR", category: "Cargo", eta: "3–6 hari", price: 32000, codSupported: false, pickupCutoff: "14:00 WIB", notes: "Tarif cargo untuk paket besar; COD tidak tersedia." },
];

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export default function ShippingCheckPage() {
  const [origin, setOrigin] = useState("Jakarta Barat, DKI Jakarta");
  const [destination, setDestination] = useState("Bandung, Jawa Barat");
  const [weight, setWeight] = useState("1000");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [codOnly, setCodOnly] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [waOpen, setWaOpen] = useState(false);
  const [waNumber, setWaNumber] = useState("6281234567890");
  const [waResult, setWaResult] = useState<"registered" | "not_registered" | null>(null);

  const filteredQuotes = useMemo(() => {
    const term = query.trim().toLowerCase();
    return QUOTES.filter((quote) => {
      const matchesTerm = !term || `${quote.courier} ${quote.service}`.toLowerCase().includes(term);
      const matchesCategory = category === "all" || quote.category === category;
      const matchesCod = !codOnly || quote.codSupported;
      return matchesTerm && matchesCategory && matchesCod;
    });
  }, [category, codOnly, query]);

  const runShippingCheck = (event: React.FormEvent) => {
    event.preventDefault();
    setHasSearched(true);
  };

  const runWaCheck = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = waNumber.replace(/\D/g, "");
    setWaResult(normalized.length >= 10 && normalized.startsWith("62") ? "registered" : "not_registered");
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <Truck className="h-4 w-4" /> Operations desk
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cek Ongkir & WhatsApp</h1>
          <p className="mt-1 text-sm text-slate-500">Bandingkan tarif pengiriman dan validasi nomor penerima sebelum konfirmasi pesanan.</p>
        </div>
        <button
          type="button"
          onClick={() => { setWaResult(null); setWaOpen(true); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
        >
          <MessageCircle className="h-4 w-4" /> WA Check
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Kurir terhubung", value: "8", meta: "Semua layanan aktif", icon: Truck, color: "text-indigo-600 bg-indigo-50" },
          { label: "Tarif termurah", value: formatRupiah(15500), meta: "SAP Express REG", icon: Zap, color: "text-emerald-600 bg-emerald-50" },
          { label: "COD tersedia", value: "4 layanan", meta: "Untuk rute terpilih", icon: ShieldCheck, color: "text-amber-600 bg-amber-50" },
        ].map((item) => (
          <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
              </div>
              <span className={`rounded-lg p-2 ${item.color}`}><item.icon className="h-5 w-5" /></span>
            </div>
          </article>
        ))}
      </section>

      <form onSubmit={runShippingCheck} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-indigo-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Rute pengiriman</h2>
            <p className="text-xs text-slate-500">Masukkan wilayah pickup, tujuan, dan berat aktual paket.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_180px_auto] lg:items-end">
          <label className="space-y-1.5 text-xs font-semibold text-slate-700">
            Asal pickup
            <input required value={origin} onChange={(event) => setOrigin(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" />
          </label>
          <ArrowRight className="mb-3 hidden h-5 w-5 text-slate-300 lg:block" />
          <label className="space-y-1.5 text-xs font-semibold text-slate-700">
            Tujuan
            <input required value={destination} onChange={(event) => setDestination(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" />
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-700">
            Berat (gram)
            <span className="relative block">
              <Weight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input required min="1" type="number" value={weight} onChange={(event) => setWeight(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" />
            </span>
          </label>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20">
            <Search className="h-4 w-4" /> Cek ongkir
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pilihan layanan</h2>
            <p className="text-xs text-slate-500">{origin} → {destination} · {Number(weight || 0).toLocaleString("id-ID")} gram</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input aria-label="Cari kurir atau layanan" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kurir..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 sm:w-56" />
            </label>
            <select aria-label="Filter kategori layanan" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20">
              <option value="all">Semua kategori</option>
              <option value="Regular">Regular</option>
              <option value="Express">Express</option>
              <option value="Cargo">Cargo</option>
            </select>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={codOnly} onChange={(event) => setCodOnly(event.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" /> COD saja
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Kurir & layanan</th>
                <th className="px-5 py-3 font-semibold">Kategori</th>
                <th className="px-5 py-3 font-semibold">Estimasi</th>
                <th className="px-5 py-3 font-semibold">Pickup cutoff</th>
                <th className="px-5 py-3 font-semibold">COD</th>
                <th className="px-5 py-3 text-right font-semibold">Tarif</th>
                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hasSearched && filteredQuotes.map((quote) => (
                <tr key={quote.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4"><p className="font-bold text-slate-900">{quote.courier}</p><p className="text-xs text-slate-500">{quote.service}</p></td>
                  <td className="px-5 py-4"><span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{quote.category}</span></td>
                  <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 font-medium text-slate-700"><Clock3 className="h-4 w-4 text-slate-400" />{quote.eta}</span></td>
                  <td className="px-5 py-4 text-slate-600">{quote.pickupCutoff}</td>
                  <td className="px-5 py-4">{quote.codSupported ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Tersedia</span> : <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Tidak tersedia</span>}</td>
                  <td className="px-5 py-4 text-right font-bold text-slate-900">{formatRupiah(quote.price)}</td>
                  <td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelectedQuote(quote)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!hasSearched || filteredQuotes.length === 0) && <div className="px-5 py-12 text-center"><PackageCheck className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">Tidak ada layanan yang cocok</p><p className="text-xs text-slate-500">Ubah filter atau periksa kembali rute pengiriman.</p></div>}
      </section>

      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedQuote(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="quote-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Detail layanan</p><h2 id="quote-title" className="mt-1 text-lg font-bold text-slate-900">{selectedQuote.courier} {selectedQuote.service}</h2></div>
              <button aria-label="Tutup detail layanan" onClick={() => setSelectedQuote(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Tarif</p><p className="mt-1 font-bold text-slate-900">{formatRupiah(selectedQuote.price)}</p></div>
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Estimasi tiba</p><p className="mt-1 font-bold text-slate-900">{selectedQuote.eta}</p></div>
              </div>
              <p className="text-sm leading-6 text-slate-600">{selectedQuote.notes}</p>
              <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600"><span className="font-semibold text-slate-900">Rute:</span> {origin} → {destination}<br /><span className="font-semibold text-slate-900">Batas pickup:</span> {selectedQuote.pickupCutoff}</div>
            </div>
            <div className="flex justify-end border-t border-slate-100 p-5"><button onClick={() => setSelectedQuote(null)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Gunakan layanan</button></div>
          </section>
        </div>
      )}

      {waOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setWaOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="wa-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Customer validation</p><h2 id="wa-title" className="mt-1 text-lg font-bold text-slate-900">WhatsApp Number Check</h2></div>
              <button aria-label="Tutup WhatsApp check" onClick={() => setWaOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={runWaCheck} className="space-y-4 p-5">
              <label className="block space-y-1.5 text-xs font-semibold text-slate-700">Nomor WhatsApp
                <div className="relative"><MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required value={waNumber} onChange={(event) => { setWaNumber(event.target.value); setWaResult(null); }} placeholder="62812..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></div>
              </label>
              <p className="text-xs leading-5 text-slate-500">Gunakan format internasional tanpa tanda +, misalnya 6281234567890.</p>
              {waResult && <div aria-live="polite" className={`rounded-xl border p-4 ${waResult === "registered" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}><p className="flex items-center gap-2 text-sm font-bold">{waResult === "registered" ? <CheckCircle2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}{waResult === "registered" ? "Nomor terdaftar di WhatsApp" : "Nomor belum dapat divalidasi"}</p><p className="mt-1 text-xs">{waResult === "registered" ? "Nomor siap digunakan untuk notifikasi pesanan." : "Periksa kode negara dan jumlah digit sebelum mencoba lagi."}</p></div>}
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><Search className="h-4 w-4" /> Periksa nomor</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
