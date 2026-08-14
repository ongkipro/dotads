"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Save, Settings2, ShieldCheck, Store } from "lucide-react";

const initialSettings = {
  storeName: "Alpha Store",
  storeSlug: "alpha-store",
  description: "Produk pilihan untuk kebutuhan harian pelanggan Indonesia.",
  supportEmail: "support@alphastore.id",
  supportPhone: "6281234567890",
  currency: "IDR",
  timezone: "Asia/Jakarta",
  orderPrefix: "ALP",
  codEnabled: true,
  autoConfirmOrders: false,
};

export default function StoreSettingsPage() {
  const [formData, setFormData] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaved(false);
    window.setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
    }, 500);
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <Store className="h-4 w-4" /> Identitas Toko
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Toko</h1>
          <p className="mt-1 text-sm text-slate-500">Atur identitas toko, layanan pelanggan, dan aturan pesanan utama.</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"
        >
          {saved && !isSaving ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{isSaving ? "Menyimpan..." : saved ? "Tersimpan" : "Simpan Pengaturan"}</span>
        </button>
      </header>

      {saved && (
        <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Pengaturan toko berhasil diperbarui.
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 p-5">
          <Settings2 className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-bold text-slate-900">Informasi Umum</h2>
        </div>
        <div className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              <span className="block">Nama toko</span>
              <input required value={formData.storeName} onChange={(event) => setFormData({ ...formData, storeName: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              <span className="block">Alamat singkat toko</span>
              <div className="flex rounded-lg border border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20">
                <span className="flex items-center rounded-l-lg bg-slate-50 px-3 text-xs font-normal text-slate-500">dotads.id/</span>
                <input required value={formData.storeSlug} onChange={(event) => setFormData({ ...formData, storeSlug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} className="min-w-0 flex-1 rounded-r-lg px-3 py-2.5 text-sm font-normal outline-none" />
              </div>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700 md:col-span-2">
              <span className="block">Deskripsi toko</span>
              <textarea rows={3} value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              <span className="block">Email layanan pelanggan</span>
              <input required type="email" value={formData.supportEmail} onChange={(event) => setFormData({ ...formData, supportEmail: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              <span className="block">Nomor WhatsApp layanan pelanggan</span>
              <input required type="tel" value={formData.supportPhone} onChange={(event) => setFormData({ ...formData, supportPhone: event.target.value.replace(/\D/g, "") })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              <span className="block">Mata uang</span>
              <select value={formData.currency} onChange={(event) => setFormData({ ...formData, currency: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20">
                <option value="IDR">IDR — Rupiah Indonesia</option>
                <option value="USD">USD — Dolar Amerika Serikat</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              <span className="block">Zona waktu operasional</span>
              <select value={formData.timezone} onChange={(event) => setFormData({ ...formData, timezone: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20">
                <option value="Asia/Jakarta">Jakarta (WIB)</option>
                <option value="Asia/Makassar">Makassar (WITA)</option>
                <option value="Asia/Jayapura">Jayapura (WIT)</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              <span className="block">Awalan nomor pesanan</span>
              <input maxLength={6} value={formData.orderPrefix} onChange={(event) => setFormData({ ...formData, orderPrefix: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-mono uppercase outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" />
              <span className="block font-normal text-slate-500">Contoh: {formData.orderPrefix || "TOKO"}-10241</span>
            </label>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 p-5">
          <ShieldCheck className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-bold text-slate-900">Aturan Pesanan</h2>
        </div>
        <div className="divide-y divide-slate-100 px-6">
          {[
            { key: "codEnabled" as const, title: "Bayar di tempat (COD)", description: "Tawarkan pembayaran COD pada formulir pemesanan yang mendukungnya." },
            { key: "autoConfirmOrders" as const, title: "Konfirmasi pesanan otomatis", description: "Pesanan baru langsung masuk antrean pemenuhan tanpa pemeriksaan manual." },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between gap-5 py-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{setting.title}</h3>
                <p className="mt-0.5 text-sm text-slate-500">{setting.description}</p>
              </div>
              <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" checked={formData[setting.key]} onChange={(event) => setFormData({ ...formData, [setting.key]: event.target.checked })} />
                <span className="h-6 w-11 rounded-full bg-slate-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-focus:ring-4 peer-focus:ring-indigo-500/20" />
              </label>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
