import Link from "next/link";
import { ArrowRight, Building2, FileClock, LockKeyhole, Settings, ShieldAlert } from "lucide-react";

export default function PlatformSettingsPage() {
  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
          <Settings className="h-4 w-4" aria-hidden="true" /> Kendali platform global
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Platform</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Status akses konfigurasi global DotAds.</p>
      </header>

      <section role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Hanya baca · belum tersedia</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">Perubahan konfigurasi belum tersedia</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-950/80">
              CMS belum memiliki API untuk membaca atau menyimpan konfigurasi platform. Tidak ada nilai yang diperkirakan dan tidak ada perubahan yang akan disimulasikan dari halaman ini.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="settings-availability" className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 id="settings-availability" className="font-bold text-slate-900">Ketersediaan kontrol</h2>
          <p className="mt-1 text-sm text-slate-500">Semua mutation platform-wide dinonaktifkan sampai contract API dan audit persistence tersedia.</p>
        </div>
        <dl className="divide-y divide-slate-100">
          {[
            ["Default tenant", "Belum tersedia", "Default plan, batas domain, dan kebijakan self-service belum tersedia melalui API."],
            ["Kebijakan keamanan", "Belum tersedia", "Kontrol session, MFA, alert, dan maintenance belum tersedia melalui API."],
            ["Tata kelola data", "Belum tersedia", "Kebijakan retention, backup, region, dan encryption tidak dilaporkan oleh CMS ini."],
          ].map(([label, state, detail]) => (
            <div key={label} className="grid gap-2 p-5 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(18rem,1.3fr)] sm:items-start">
              <div>
                <dt className="font-semibold text-slate-900">{label}</dt>
                <dd className="mt-1 inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{state}</dd>
              </div>
              <dd className="text-sm leading-6 text-slate-600">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/super-admin/tenants" className="group flex min-h-24 items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <span className="rounded-lg bg-indigo-50 p-2 text-indigo-700"><Building2 className="h-5 w-5" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold text-slate-900">Kelola tenant</span><span className="mt-1 block text-sm text-slate-500">Gunakan lifecycle controls yang terhubung ke API.</span></span>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/super-admin/audit-logs" className="group flex min-h-24 items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <span className="rounded-lg bg-slate-100 p-2 text-slate-700"><FileClock className="h-5 w-5" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold text-slate-900">Lihat audit trail</span><span className="mt-1 block text-sm text-slate-500">Tinjau event yang dikembalikan platform API.</span></span>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </section>

      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        UI ini tidak menggantikan authorization backend. Platform API tetap menjadi authority untuk setiap operasi.
      </p>
    </div>
  );
}
