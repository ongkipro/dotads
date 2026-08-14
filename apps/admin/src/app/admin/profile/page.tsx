"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, Key, Lock, Mail, Save, Shield, ShieldCheck, User, X } from "lucide-react";

export default function ProfilePage() {
  const [formData, setFormData] = useState({ fullName: "Paduka Ongki", email: "ongki@dotads.id", phone: "62811112222" });
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirmation: "" });
  const [passwordError, setPasswordError] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [notice, setNotice] = useState("");

  const initials = useMemo(() => formData.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((name) => name[0]).join("").toUpperCase(), [formData.fullName]);

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    window.setTimeout(() => {
      setIsSaving(false);
      notify("Profil berhasil diperbarui.");
    }, 500);
  };

  const changePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwords.next.length < 8) {
      setPasswordError("Kata sandi baru harus berisi minimal 8 karakter.");
      return;
    }
    if (passwords.next !== passwords.confirmation) {
      setPasswordError("Konfirmasi kata sandi belum sama.");
      return;
    }
    setPasswords({ current: "", next: "", confirmation: "" });
    setPasswordError("");
    setShowPasswordModal(false);
    notify("Kata sandi berhasil diubah. Sesi lain telah dikeluarkan.");
  };

  const toggleTwoFactor = () => {
    setTwoFactorEnabled((enabled) => {
      notify(enabled ? "Autentikasi dua langkah dinonaktifkan." : "Autentikasi dua langkah berhasil diaktifkan.");
      return !enabled;
    });
  };

  return (
    <div className="max-w-4xl space-y-6 pb-8">
      <form onSubmit={handleSave}>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><User className="h-4 w-4" /> Akun Pribadi</div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Profil Merchant</h1><p className="mt-1 text-sm text-slate-500">Kelola informasi pribadi dan keamanan akun Anda.</p></div>
          <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"><Save className="h-4 w-4" /> {isSaving ? "Menyimpan..." : "Simpan Profil"}</button>
        </header>

        {notice && <div role="status" aria-live="polite" className="mt-6 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700"><CheckCircle2 className="h-4 w-4" /> {notice}</div>}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <aside className="md:col-span-1"><div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"><div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-3xl font-extrabold text-indigo-700 ring-4 ring-indigo-50">{initials || "PM"}</div><h2 className="text-lg font-bold text-slate-900">{formData.fullName}</h2><p className="mb-5 break-all text-sm text-slate-500">{formData.email}</p><span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"><Shield className="h-3.5 w-3.5" /> Pemilik Toko</span></div></aside>

          <div className="space-y-6 md:col-span-2">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 p-5"><User className="h-5 w-5 text-slate-400" /><h2 className="text-base font-bold text-slate-900">Informasi Pribadi</h2></div>
              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                <label className="space-y-1.5 text-xs font-semibold text-slate-700"><span className="block">Nama lengkap</span><input required value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
                <label className="space-y-1.5 text-xs font-semibold text-slate-700"><span className="block">Nomor telepon</span><input required type="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value.replace(/\D/g, "") })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
                <label className="space-y-1.5 text-xs font-semibold text-slate-700 md:col-span-2"><span className="block">Alamat email</span><span className="relative block"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="email" value={formData.email} disabled className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-500" /></span><span className="block font-normal text-slate-500">Hubungi dukungan untuk mengganti alamat email utama.</span></label>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 p-5"><Lock className="h-5 w-5 text-slate-400" /><h2 className="text-base font-bold text-slate-900">Keamanan Akun</h2></div>
              <div className="divide-y divide-slate-100 px-6">
                <div className="flex items-center justify-between gap-4 py-5"><div><h3 className="text-sm font-semibold text-slate-900">Kata sandi</h3><p className="mt-0.5 text-sm text-slate-500">Terakhir diubah 32 hari lalu.</p></div><button type="button" onClick={() => setShowPasswordModal(true)} className="shrink-0 rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">Ubah Kata Sandi</button></div>
                <div className="flex items-center justify-between gap-4 py-5"><div><div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-slate-900">Autentikasi dua langkah</h3>{twoFactorEnabled && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">Aktif</span>}</div><p className="mt-0.5 text-sm text-slate-500">Minta kode verifikasi saat masuk dari perangkat baru.</p></div><button type="button" role="switch" aria-checked={twoFactorEnabled} onClick={toggleTwoFactor} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${twoFactorEnabled ? "bg-indigo-600" : "bg-slate-200"}`}>{twoFactorEnabled ? <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full border border-slate-300 bg-white" /> : <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full border border-slate-300 bg-white" />}</button></div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 p-5"><Key className="h-5 w-5 text-slate-400" /><h2 className="text-base font-bold text-slate-900">Akses API</h2></div>
              <div className="p-6"><p className="mb-5 text-sm text-slate-600">Gunakan token akses pribadi untuk terhubung ke API DotAds. Jangan bagikan token ini kepada siapa pun.</p><div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"><code className="min-w-0 overflow-x-auto text-sm text-slate-800">{tokenVisible ? "dotads_pat_8Xq9zM4kL2pN7sV1" : "dotads_pat_************************"}</code><button type="button" onClick={() => setTokenVisible((visible) => !visible)} className="inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50">{tokenVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{tokenVisible ? "Sembunyikan" : "Tampilkan"}</button></div></div>
            </section>
          </div>
        </div>
      </form>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="password-title">
          <form onSubmit={changePassword} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5"><div><h2 id="password-title" className="text-lg font-bold text-slate-900">Ubah Kata Sandi</h2><p className="mt-1 text-xs text-slate-500">Gunakan kata sandi unik minimal 8 karakter.</p></div><button type="button" onClick={() => setShowPasswordModal(false)} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="space-y-4 p-5">{[{ key: "current" as const, label: "Kata sandi saat ini" }, { key: "next" as const, label: "Kata sandi baru" }, { key: "confirmation" as const, label: "Ulangi kata sandi baru" }].map((field) => <label key={field.key} className="space-y-1.5 text-xs font-semibold text-slate-700"><span className="block">{field.label}</span><input required type="password" autoComplete={field.key === "current" ? "current-password" : "new-password"} value={passwords[field.key]} onChange={(event) => { setPasswords({ ...passwords, [field.key]: event.target.value }); setPasswordError(""); }} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>)}{passwordError && <p role="alert" className="text-xs font-medium text-rose-600">{passwordError}</p>}</div>
            <div className="flex justify-end gap-3 border-t border-slate-100 p-5"><button type="button" onClick={() => setShowPasswordModal(false)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Batal</button><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><ShieldCheck className="h-4 w-4" /> Simpan Kata Sandi</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
