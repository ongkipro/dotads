"use client";

import { useState, type FormEvent } from "react";
import { Building, CheckCircle2, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";

interface Warehouse {
  id: number;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  contactPhone: string;
  isDefault: boolean;
}

type WarehouseForm = Omit<Warehouse, "id" | "isDefault">;

const emptyForm: WarehouseForm = {
  name: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  contactPhone: "",
};

const initialWarehouses: Warehouse[] = [
  { id: 1, name: "Gudang Utama Jakarta", address: "Jl. Sudirman No. 1", city: "Jakarta Selatan", province: "DKI Jakarta", postalCode: "12190", contactPhone: "628111234567", isDefault: true },
  { id: 2, name: "Pusat Pemenuhan Surabaya", address: "Jl. Pemuda No. 12", city: "Surabaya", province: "Jawa Timur", postalCode: "60271", contactPhone: "628123456780", isDefault: false },
];

export default function GudangSettingsPage() {
  const [locations, setLocations] = useState(initialWarehouses);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<WarehouseForm>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState("");

  const showNotification = (message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(""), 3000);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (location: Warehouse) => {
    setEditingId(location.id);
    setForm({
      name: location.name,
      address: location.address,
      city: location.city,
      province: location.province,
      postalCode: location.postalCode,
      contactPhone: location.contactPhone,
    });
    setIsModalOpen(true);
  };

  const saveLocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId === null) {
      setLocations((current) => [...current, { id: Date.now(), ...form, isDefault: current.length === 0 }]);
      showNotification("Gudang baru berhasil ditambahkan.");
    } else {
      setLocations((current) => current.map((location) => location.id === editingId ? { ...location, ...form } : location));
      showNotification("Data gudang berhasil diperbarui.");
    }
    setIsModalOpen(false);
  };

  const setAsDefault = (id: number) => {
    setLocations((current) => current.map((location) => ({ ...location, isDefault: location.id === id })));
    showNotification("Gudang utama berhasil diubah.");
  };

  const removeLocation = (id: number) => {
    const location = locations.find((item) => item.id === id);
    if (!location) return;
    if (location.isDefault) {
      showNotification("Pilih gudang utama lain sebelum menghapus gudang ini.");
      return;
    }
    setLocations((current) => current.filter((item) => item.id !== id));
    showNotification(`${location.name} berhasil dihapus.`);
  };

  return (
    <div className="max-w-5xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <Building className="h-4 w-4" /> Lokasi Pemenuhan
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gudang & Alamat Asal</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola alamat penjemputan kurir dan asal perhitungan ongkos kirim.</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20">
          <Plus className="h-4 w-4" /> Tambah Gudang
        </button>
      </header>

      {notification && (
        <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
          <CheckCircle2 className="h-4 w-4" /> {notification}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {locations.map((location) => (
          <article key={location.id} className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${location.isDefault ? "border-indigo-300 ring-2 ring-indigo-500/20" : "border-slate-200"}`}>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`rounded-lg p-2 ${location.isDefault ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}><Building className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900">{location.name}</h2>
                  {location.isDefault && <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">Gudang utama</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEditModal(location)} aria-label={`Ubah ${location.name}`} title="Ubah gudang" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => removeLocation(location.id)} aria-label={`Hapus ${location.name}`} title="Hapus gudang" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-500/20"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Alamat lengkap</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-900">{location.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kota/Kabupaten</p><p className="mt-1 text-sm text-slate-900">{location.city}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Provinsi</p><p className="mt-1 text-sm text-slate-900">{location.province}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kode pos</p><p className="mt-1 font-mono text-sm text-slate-900">{location.postalCode}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kontak gudang</p><p className="mt-1 text-sm text-slate-900">+{location.contactPhone}</p></div>
              </div>
            </div>
            {!location.isDefault && (
              <div className="border-t border-slate-100 bg-slate-50/80 p-4">
                <button onClick={() => setAsDefault(location.id)} className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><MapPin className="h-4 w-4" /> Jadikan gudang utama</button>
              </div>
            )}
          </article>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="warehouse-dialog-title">
          <form onSubmit={saveLocation} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div><h2 id="warehouse-dialog-title" className="text-lg font-bold text-slate-900">{editingId === null ? "Tambah Gudang" : "Ubah Gudang"}</h2><p className="mt-1 text-xs text-slate-500">Lengkapi alamat yang digunakan untuk penjemputan paket.</p></div>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-semibold text-slate-700 sm:col-span-2"><span className="block">Nama gudang</span><input required autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-700 sm:col-span-2"><span className="block">Alamat lengkap</span><textarea required rows={3} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-700"><span className="block">Kota/Kabupaten</span><input required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-700"><span className="block">Provinsi</span><input required value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-700"><span className="block">Kode pos</span><input required inputMode="numeric" value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value.replace(/\D/g, "") })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-700"><span className="block">Nomor kontak</span><input required type="tel" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value.replace(/\D/g, "") })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 p-5"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Batal</button><button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">{editingId === null ? "Tambah Gudang" : "Simpan Perubahan"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
