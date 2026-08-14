"use client";

import { ArrowRight, CheckCircle2, Clock3, Eye, MapPin, MessageCircle, PackageCheck, Search, Truck, Weight, X, Zap } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

type Quote = {
  id: string;
  courier: string;
  service: string;
  category: "Reguler" | "Kilat";
  eta: string;
  basePrice: number;
  codSupported: boolean;
  pickupCutoff: string;
  notes: string;
};

type District = { name: string; city: string; province: string; postalCode: string };

type MessageVariables = {
  customerName: string;
  orderNumber: string;
  courier: string;
  waybill: string;
  totalAmount: string;
};

const DISTRICTS: District[] = [
  { name: "Kebon Jeruk", city: "Jakarta Barat", province: "DKI Jakarta", postalCode: "11530" },
  { name: "Kebayoran Baru", city: "Jakarta Selatan", province: "DKI Jakarta", postalCode: "12110" },
  { name: "Cicendo", city: "Kota Bandung", province: "Jawa Barat", postalCode: "40172" },
  { name: "Coblong", city: "Kota Bandung", province: "Jawa Barat", postalCode: "40132" },
  { name: "Cibinong", city: "Kabupaten Bogor", province: "Jawa Barat", postalCode: "16911" },
  { name: "Lowokwaru", city: "Kota Malang", province: "Jawa Timur", postalCode: "65141" },
  { name: "Denpasar Selatan", city: "Kota Denpasar", province: "Bali", postalCode: "80221" },
];

const BASE_QUOTES: Quote[] = [
  { id: "jne-reg", courier: "JNE", service: "REG", category: "Reguler", eta: "2–3 hari", basePrice: 18000, codSupported: true, pickupCutoff: "16.00 WIB", notes: "Layanan reguler antarkota dengan pelacakan penuh." },
  { id: "sicepat-best", courier: "SiCepat", service: "BEST", category: "Kilat", eta: "1 hari", basePrice: 26000, codSupported: true, pickupCutoff: "15.30 WIB", notes: "Layanan prioritas untuk pengiriman hari berikutnya." },
  { id: "jnt-ez", courier: "J&T", service: "EZ", category: "Reguler", eta: "2–4 hari", basePrice: 17000, codSupported: true, pickupCutoff: "17.00 WIB", notes: "Penjemputan harian dan dukungan COD di area tujuan." },
  { id: "sap-reg", courier: "SAP Express", service: "REG", category: "Reguler", eta: "3–5 hari", basePrice: 15500, codSupported: true, pickupCutoff: "14.30 WIB", notes: "Pilihan ekonomis dengan jangkauan COD nasional." },
];

const CHIPS = ["{customerName}", "{orderNumber}", "{courier}", "{waybill}", "{totalAmount}"] as const;

const formatRupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const districtLabel = (district: District) => `${district.name}, ${district.city}, ${district.province} ${district.postalCode}`;

export default function ShippingCheckPage() {
  const [origin, setOrigin] = useState(districtLabel(DISTRICTS[0]));
  const [destination, setDestination] = useState(districtLabel(DISTRICTS[2]));
  const [weight, setWeight] = useState("1000");
  const [activeAutocomplete, setActiveAutocomplete] = useState<"origin" | "destination" | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("semua");
  const [codOnly, setCodOnly] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [waOpen, setWaOpen] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState("Halo {customerName}, pesanan {orderNumber} sudah dikirim melalui {courier}. Nomor resi: {waybill}. Total tagihan: {totalAmount}. Terima kasih.");
  const [messageVariables, setMessageVariables] = useState<MessageVariables>({ customerName: "Rina", orderNumber: "ORD-260814-0991", courier: "JNE REG", waybill: "JNE8829103991", totalAmount: "Rp250.000" });

  const billedWeight = Math.max(1, Math.ceil((Number(weight) || 0) / 1000));
  const quotes = useMemo(() => BASE_QUOTES.map((quote) => ({ ...quote, price: quote.basePrice * billedWeight })), [billedWeight]);
  const filteredQuotes = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id-ID");
    return quotes.filter((quote) => (!term || `${quote.courier} ${quote.service}`.toLocaleLowerCase("id-ID").includes(term)) && (category === "semua" || quote.category === category) && (!codOnly || quote.codSupported));
  }, [category, codOnly, query, quotes]);

  const suggestionsFor = (value: string) => {
    const term = value.split(",")[0].trim().toLocaleLowerCase("id-ID");
    if (!term) return DISTRICTS.slice(0, 5);
    return DISTRICTS.filter((district) => districtLabel(district).toLocaleLowerCase("id-ID").includes(term)).slice(0, 5);
  };

  const resolvedMessage = useMemo(() => {
    let preview = messageTemplate;
    for (const [key, value] of Object.entries(messageVariables)) preview = preview.replaceAll(`{${key}}`, value || `(${key})`);
    return preview;
  }, [messageTemplate, messageVariables]);

  const runShippingCheck = (event: FormEvent) => {
    event.preventDefault();
    setActiveAutocomplete(null);
    setHasSearched(true);
  };

  const insertChip = (chip: typeof CHIPS[number]) => setMessageTemplate((current) => `${current}${current.endsWith(" ") || !current ? "" : " "}${chip}`);

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><Truck className="h-4 w-4" /> Meja operasional</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cek ongkir dan pesan WhatsApp</h1>
          <p className="mt-1 text-sm text-slate-500">Bandingkan tarif empat kurir dan siapkan pesan tindak lanjut untuk pelanggan.</p>
        </div>
        <button type="button" onClick={() => setWaOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><MessageCircle className="h-4 w-4" /> Buat pesan WhatsApp</button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Kurir terhubung", value: "4", meta: "JNE, SiCepat, J&T, dan SAP", icon: Truck, color: "bg-indigo-50 text-indigo-600" },
          { label: "Berat yang ditagihkan", value: `${billedWeight} kg`, meta: `${Number(weight || 0).toLocaleString("id-ID")} gram dibulatkan ke atas`, icon: Weight, color: "bg-emerald-50 text-emerald-600" },
          { label: "Tarif termurah", value: formatRupiah(Math.min(...quotes.map((quote) => quote.price))), meta: "Untuk rute dan berat saat ini", icon: Zap, color: "bg-amber-50 text-amber-600" },
        ].map((item) => <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{item.value}</p><p className="mt-1 text-xs text-slate-500">{item.meta}</p></div><span className={`rounded-lg p-2 ${item.color}`}><item.icon className="h-5 w-5" /></span></div></article>)}
      </section>

      <form onSubmit={runShippingCheck} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-indigo-600" /><div><h2 className="text-sm font-bold text-slate-900">Kalkulator tarif langsung</h2><p className="text-xs text-slate-500">Cari kecamatan asal dan tujuan, lalu masukkan berat aktual paket.</p></div></div>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_180px_auto] lg:items-end">
          <DistrictInput label="Kecamatan asal" value={origin} active={activeAutocomplete === "origin"} suggestions={suggestionsFor(origin)} onFocus={() => setActiveAutocomplete("origin")} onChange={(value) => { setOrigin(value); setActiveAutocomplete("origin"); setHasSearched(false); }} onSelect={(district) => { setOrigin(districtLabel(district)); setActiveAutocomplete(null); }} />
          <ArrowRight className="mb-3 hidden h-5 w-5 text-slate-300 lg:block" />
          <DistrictInput label="Kecamatan tujuan" value={destination} active={activeAutocomplete === "destination"} suggestions={suggestionsFor(destination)} onFocus={() => setActiveAutocomplete("destination")} onChange={(value) => { setDestination(value); setActiveAutocomplete("destination"); setHasSearched(false); }} onSelect={(district) => { setDestination(districtLabel(district)); setActiveAutocomplete(null); }} />
          <label className="space-y-1.5 text-xs font-semibold text-slate-700">Berat aktual (gram)<span className="relative block"><Weight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required min="1" type="number" value={weight} onChange={(event) => { setWeight(event.target.value); setHasSearched(false); }} className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></span></label>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><Search className="h-4 w-4" /> Hitung tarif</button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Berat tagihan: <span className="font-bold text-slate-700">{billedWeight} kg</span>. Setiap pecahan kilogram dibulatkan ke atas.</p>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-base font-bold text-slate-900">Pilihan layanan</h2><p className="text-xs text-slate-500">{origin} → {destination}</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Cari kurir atau layanan" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kurir" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 sm:w-52" /></label>
            <select aria-label="Saring kategori layanan" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"><option value="semua">Semua kategori</option><option value="Reguler">Reguler</option><option value="Kilat">Kilat</option></select>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={codOnly} onChange={(event) => setCodOnly(event.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" /> Hanya COD</label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3 font-semibold">Kurir dan layanan</th><th className="px-5 py-3 font-semibold">Kategori</th><th className="px-5 py-3 font-semibold">Estimasi</th><th className="px-5 py-3 font-semibold">Batas penjemputan</th><th className="px-5 py-3 font-semibold">COD</th><th className="px-5 py-3 text-right font-semibold">Tarif {billedWeight} kg</th><th className="px-5 py-3 text-right font-semibold">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {hasSearched && filteredQuotes.map((quote) => <tr key={quote.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-bold text-slate-900">{quote.courier}</p><p className="text-xs text-slate-500">{quote.service}</p></td><td className="px-5 py-4"><span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{quote.category}</span></td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 font-medium text-slate-700"><Clock3 className="h-4 w-4 text-slate-400" />{quote.eta}</span></td><td className="px-5 py-4 text-slate-600">{quote.pickupCutoff}</td><td className="px-5 py-4">{quote.codSupported ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Tersedia</span> : <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Tidak tersedia</span>}</td><td className="px-5 py-4 text-right font-bold text-slate-900">{formatRupiah(quote.price)}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelectedQuote(quote)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Rincian</button></td></tr>)}
            </tbody>
          </table>
        </div>
        {(!hasSearched || filteredQuotes.length === 0) && <div className="px-5 py-12 text-center"><PackageCheck className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">{hasSearched ? "Tidak ada layanan yang cocok" : "Tarif perlu dihitung ulang"}</p><p className="text-xs text-slate-500">{hasSearched ? "Ubah penyaring atau periksa kembali rute pengiriman." : "Tekan Hitung tarif setelah mengubah rute atau berat."}</p></div>}
      </section>

      {selectedQuote && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedQuote(null)}><section role="dialog" aria-modal="true" aria-labelledby="quote-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Rincian layanan</p><h2 id="quote-title" className="mt-1 text-lg font-bold text-slate-900">{selectedQuote.courier} {selectedQuote.service}</h2></div><button type="button" aria-label="Tutup rincian layanan" onClick={() => setSelectedQuote(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div><div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Tarif</p><p className="mt-1 font-bold text-slate-900">{formatRupiah(selectedQuote.basePrice * billedWeight)}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Estimasi tiba</p><p className="mt-1 font-bold text-slate-900">{selectedQuote.eta}</p></div></div><p className="text-sm leading-6 text-slate-600">{selectedQuote.notes}</p><div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600"><span className="font-semibold text-slate-900">Rute:</span> {origin} → {destination}<br /><span className="font-semibold text-slate-900">Batas penjemputan:</span> {selectedQuote.pickupCutoff}</div></div><div className="flex justify-end border-t border-slate-100 p-5"><button type="button" onClick={() => { setMessageVariables((current) => ({ ...current, courier: `${selectedQuote.courier} ${selectedQuote.service}` })); setSelectedQuote(null); setWaOpen(true); }} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Pilih dan buat pesan</button></div></section></div>}

      {waOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setWaOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="wa-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Pratinjau dinamis</p><h2 id="wa-title" className="mt-1 text-lg font-bold text-slate-900">Pembuat pesan tindak lanjut WhatsApp</h2><p className="mt-1 text-xs text-slate-500">Klik variabel untuk menambahkannya ke templat pesan.</p></div><button type="button" aria-label="Tutup pembuat pesan" onClick={() => setWaOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div><div className="grid gap-5 p-5 lg:grid-cols-2"><div className="space-y-4"><div><p className="mb-2 text-xs font-bold text-slate-700">Variabel dinamis</p><div className="flex flex-wrap gap-2">{CHIPS.map((chip) => <button key={chip} type="button" onClick={() => insertChip(chip)} className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-700 hover:bg-indigo-100">{chip}</button>)}</div></div><label className="block space-y-1.5 text-xs font-bold text-slate-700">Templat pesan<textarea rows={6} value={messageTemplate} onChange={(event) => setMessageTemplate(event.target.value)} className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm font-normal leading-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label><div className="grid gap-3 sm:grid-cols-2">{(Object.keys(messageVariables) as Array<keyof MessageVariables>).map((key) => <label key={key} className="space-y-1 text-[11px] font-bold text-slate-600">{`{${key}}`}<input value={messageVariables[key]} onChange={(event) => setMessageVariables((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500" /></label>)}</div></div><div><p className="mb-2 text-xs font-bold text-slate-700">Pratinjau untuk pelanggan</p><div className="rounded-2xl bg-slate-100 p-4"><div className="ml-auto max-w-sm rounded-xl rounded-tr-sm bg-emerald-100 p-4 text-sm leading-6 text-slate-800 shadow-xs whitespace-pre-wrap">{resolvedMessage}</div><p className="mt-2 text-right text-[11px] text-slate-500">Pesan hanya berupa pratinjau dan belum dikirim.</p></div></div></div><div className="flex justify-end border-t border-slate-100 p-5"><button type="button" onClick={() => setWaOpen(false)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><MessageCircle className="h-4 w-4" /> Simpan pratinjau</button></div></section></div>}
    </div>
  );
}

function DistrictInput({ label, value, active, suggestions, onFocus, onChange, onSelect }: { label: string; value: string; active: boolean; suggestions: District[]; onFocus: () => void; onChange: (value: string) => void; onSelect: (district: District) => void }) {
  return <label className="relative space-y-1.5 text-xs font-semibold text-slate-700">{label}<span className="relative block"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required autoComplete="off" value={value} onFocus={onFocus} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></span>{active && <span className="absolute left-0 right-0 top-full z-20 mt-1 block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">{suggestions.length > 0 ? suggestions.map((district) => <button key={`${district.name}-${district.postalCode}`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(district)} className="block w-full border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-indigo-50"><span className="block text-sm font-bold text-slate-900">{district.name}</span><span className="block text-[11px] font-normal text-slate-500">{district.city}, {district.province} · {district.postalCode}</span></button>) : <span className="block px-3 py-4 text-center text-xs font-normal text-slate-500">Kecamatan tidak ditemukan.</span>}</span>}</label>;
}
