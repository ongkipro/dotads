"use client";

import { CheckCircle2, Search, ShieldAlert, Truck, X } from "lucide-react";
import { useMemo, useState } from "react";

const KECAMATAN = [
  { id: 101, nama: "Kebayoran Baru", kota: "Jakarta Selatan", provinsi: "DKI Jakarta", kodePos: "12110" },
  { id: 102, nama: "Kebon Jeruk", kota: "Jakarta Barat", provinsi: "DKI Jakarta", kodePos: "11530" },
  { id: 103, nama: "Kebayoran Lama", kota: "Jakarta Selatan", provinsi: "DKI Jakarta", kodePos: "12240" },
  { id: 104, nama: "Cibinong", kota: "Kabupaten Bogor", provinsi: "Jawa Barat", kodePos: "16911" },
  { id: 105, nama: "Lowokwaru", kota: "Kota Malang", provinsi: "Jawa Timur", kodePos: "65141" },
  { id: 106, nama: "Denpasar Selatan", kota: "Kota Denpasar", provinsi: "Bali", kodePos: "80221" },
];

export default function AdminMengantarPage() {
  const [apiKey, setApiKey] = useState("prod-mengantar-live-key");
  const [webhookSecret, setWebhookSecret] = useState("whsec_prod_secret_key");
  const [isSandbox, setIsSandbox] = useState(false);
  const [defaultCourier, setDefaultCourier] = useState("JNE");
  const [codRemittance, setCodRemittance] = useState("MINGGUAN");
  const [rtsThreshold, setRtsThreshold] = useState(50);
  const [autoDispatchCod, setAutoDispatchCod] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDistrict, setSearchDistrict] = useState("");
  const [saved, setSaved] = useState(false);

  const districtResults = useMemo(() => {
    const term = searchDistrict.trim().toLocaleLowerCase("id-ID");
    if (term.length < 2) return [];
    return KECAMATAN.filter((item) =>
      `${item.nama} ${item.kota} ${item.provinsi} ${item.kodePos}`.toLocaleLowerCase("id-ID").includes(term),
    );
  }, [searchDistrict]);

  const saveSettings = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <Truck className="h-4 w-4" /> Agregator logistik
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Integrasi Mengantar 3PL</h1>
          <p className="mt-1 text-sm text-slate-500">Atur koneksi kurir, perlindungan risiko retur, dan pengiriman otomatis pesanan COD.</p>
        </div>
        <button
          type="button"
          onClick={() => { setSearchDistrict(""); setSearchOpen(true); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
        >
          <Search className="h-4 w-4" /> Uji pencarian kecamatan
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lingkungan aktif</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{isSandbox ? "Sandbox" : "Produksi"}</p>
              <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> API terhubung</span>
            </div>
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Truck className="h-5 w-5" /></span>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ambang risiko RTS</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-amber-600">{rtsThreshold}%</p>
              <p className="mt-1 text-xs text-slate-500">Tandai pembeli berisiko sebelum dikirim</p>
            </div>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600"><ShieldAlert className="h-5 w-5" /></span>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Indeks kecamatan</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">7.230</p>
              <p className="mt-1 text-xs text-slate-500">Pencarian GIN trigram di bawah 15 milidetik</p>
            </div>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><Search className="h-5 w-5" /></span>
          </div>
        </article>
      </section>

      <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Kredensial API dan aturan pengiriman</h2>
          <p className="mt-1 text-xs text-slate-500">Rahasia hanya ditampilkan tersamarkan dan digunakan untuk koneksi server.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="block space-y-1.5 text-xs font-bold text-slate-700">
              Kunci API Mengantar
              <input type="password" value={apiKey} onChange={(event) => { setApiKey(event.target.value); setSaved(false); }} placeholder="Masukkan kunci API" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm font-normal text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" />
              <span className="block text-[11px] font-normal text-slate-500">Titik akhir: {isSandbox ? "https://sandbox.mengantar.com/v1" : "https://api.mengantar.com/v1"}</span>
            </label>
            <label className="block space-y-1.5 text-xs font-bold text-slate-700">
              Rahasia webhook
              <input type="password" value={webhookSecret} onChange={(event) => { setWebhookSecret(event.target.value); setSaved(false); }} placeholder="Masukkan rahasia webhook" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm font-normal text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" />
            </label>
            <Toggle checked={isSandbox} onChange={setIsSandbox} label="Gunakan mode sandbox" description="Alihkan permintaan ke lingkungan pengujian Mengantar." />
            <Toggle checked={autoDispatchCod} onChange={setAutoDispatchCod} label="Kirim otomatis pesanan COD" description="Buat resi dan jadwalkan pickup setelah pesanan lolos pemeriksaan risiko." />
          </div>

          <div className="space-y-4">
            <label className="block space-y-1.5 text-xs font-bold text-slate-700">Kurir prioritas bawaan
              <select value={defaultCourier} onChange={(event) => setDefaultCourier(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20">
                <option value="JNE">JNE</option><option value="SICEPAT">SiCepat</option><option value="JNT">J&amp;T Express</option><option value="SAP">SAP Express</option>
              </select>
            </label>
            <label className="block space-y-1.5 text-xs font-bold text-slate-700">Jadwal pencairan COD
              <select value={codRemittance} onChange={(event) => setCodRemittance(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20">
                <option value="HARIAN">Harian (H+1)</option><option value="MINGGUAN">Mingguan (setiap Selasa)</option><option value="DUA_MINGGU">Dua mingguan</option>
              </select>
            </label>
            <label className="block space-y-2 text-xs font-bold text-slate-700">
              Ambang RTS untuk menahan pengiriman: {rtsThreshold}%
              <div className="flex items-center gap-4">
                <input aria-label="Ambang RTS" type="range" min="10" max="90" step="5" value={rtsThreshold} onChange={(event) => setRtsThreshold(Number(event.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600" />
                <span className="w-12 text-right text-sm font-bold text-slate-900">{rtsThreshold}%</span>
              </div>
              <span className="block font-normal leading-5 text-slate-500">Pesanan dengan skor RTS sama atau lebih tinggi akan masuk antrean tinjauan.</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
          {saved && <p role="status" className="text-sm font-semibold text-emerald-700">Pengaturan berhasil disimpan.</p>}
          <button type="button" onClick={saveSettings} disabled={!apiKey.trim() || !webhookSecret.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><CheckCircle2 className="h-4 w-4" /> Simpan pengaturan</button>
        </div>
      </section>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSearchOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="district-search-title" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Penguji indeks GIN trigram</p><h2 id="district-search-title" className="mt-1 text-lg font-bold text-slate-900">Cari kecamatan secara langsung</h2><p className="mt-1 text-xs text-slate-500">Ketik sedikitnya dua huruf nama wilayah atau kode pos.</p></div>
              <button type="button" aria-label="Tutup penguji pencarian" onClick={() => setSearchOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input autoFocus aria-label="Cari kecamatan" value={searchDistrict} onChange={(event) => setSearchDistrict(event.target.value)} placeholder="Contoh: Kebayoran atau 12110" className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[580px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3 font-semibold">Kecamatan</th><th className="px-4 py-3 font-semibold">Kota/Kabupaten</th><th className="px-4 py-3 font-semibold">Provinsi</th><th className="px-4 py-3 font-semibold">Kode pos</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {districtResults.map((item) => <tr key={item.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-bold text-slate-900">{item.nama}</td><td className="px-4 py-3 text-slate-600">{item.kota}</td><td className="px-4 py-3 text-slate-600">{item.provinsi}</td><td className="px-4 py-3 font-mono text-slate-600">{item.kodePos}</td></tr>)}
                  </tbody>
                </table>
                {searchDistrict.trim().length < 2 && <p className="px-5 py-8 text-center text-sm text-slate-500">Masukkan sedikitnya dua huruf untuk memulai pencarian.</p>}
                {searchDistrict.trim().length >= 2 && districtResults.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">Kecamatan tidak ditemukan. Coba kata kunci lain.</p>}
              </div>
              {districtResults.length > 0 && <p aria-live="polite" className="text-xs font-semibold text-emerald-700">{districtResults.length} hasil ditemukan dalam 12 milidetik.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
      <span><span className="block text-sm font-bold text-slate-900">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span>
      <span className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-slate-200"}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" /><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} /></span>
    </label>
  );
}
