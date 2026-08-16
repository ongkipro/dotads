"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, CircleDollarSign, PackageOpen, RefreshCw, ShoppingBag } from "lucide-react";
import { Area, Bar, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminDashboardError, getAdminDashboard, type AdminDashboard, type DashboardDays } from "@/lib/admin-dashboard";

const IDR = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const INTEGER = new Intl.NumberFormat("id-ID");
const orderLabels = { PENDING_PAYMENT: "Menunggu pembayaran", CONFIRMED: "Dikonfirmasi", PROCESSING: "Diproses", SHIPPED: "Dikirim", DELIVERED: "Selesai", CANCELLED: "Dibatalkan", REFUNDED: "Dikembalikan" } as const;
const paymentLabels = { UNPAID: "Belum dibayar", PAID: "Lunas", REFUNDED: "Dikembalikan", FAILED: "Gagal" } as const;
const fulfillmentLabels = { UNFULFILLED: "Belum diproses", PICKUP_REQUESTED: "Menunggu penjemputan", IN_TRANSIT: "Dalam pengiriman", DELIVERED: "Terkirim", RETURNED: "Retur", FAILED: "Gagal" } as const;

function wibDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function errorState(error: unknown): { title: string; detail: string; action?: { href: string; label: string } } {
  if (!(error instanceof AdminDashboardError)) return { title: "Dashboard belum dapat dimuat", detail: error instanceof Error ? error.message : "Terjadi gangguan saat mengambil data dashboard." };
  if (error.status === 400) return { title: "Periode dashboard tidak valid", detail: "Pilih periode 7 atau 30 hari, lalu coba kembali." };
  if (error.status === 401) return { title: "Sesi Anda berakhir", detail: "Masuk kembali untuk melihat ringkasan toko.", action: { href: "/login", label: "Ke halaman login" } };
  if (error.status === 403) return { title: "Dashboard tidak tersedia untuk akun ini", detail: "Akun atau workspace aktif tidak memiliki izin membaca pesanan." };
  if (error.status === 409 && error.code === "WORKSPACE_SELECTION_REQUIRED") return { title: "Pilih workspace terlebih dahulu", detail: "Dashboard memerlukan satu workspace aktif.", action: { href: "/", label: "Pilih workspace" } };
  if (error.status === 409) return { title: "Konteks workspace belum siap", detail: "Muat ulang session atau pilih workspace kembali sebelum membuka dashboard." };
  return { title: "Dashboard belum dapat dimuat", detail: error.message };
}

export function AnalyticsOverview() {
  const [days, setDays] = useState<DashboardDays>(7);
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    getAdminDashboard(days, (input, init) => fetch(input, { ...init, signal: controller.signal }))
      .then(setData)
      .catch((cause) => { if (!controller.signal.aborted) setError(cause); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [days, reload]);

  if (loading && !data) return <DashboardSkeleton />;
  if (error && !data) {
    const state = errorState(error);
    return <StatePanel title={state.title} detail={state.detail}>{state.action ? <a href={state.action.href} className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white">{state.action.label}</a> : <button onClick={() => setReload((value) => value + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" /> Coba lagi</button>}</StatePanel>;
  }
  if (!data) return null;

  const allZero = data.kpis.ordersCreated === 0 && data.kpis.grossOrderValueMinor === 0;
  const chartData = data.daily.map((item) => ({ ...item, label: dateLabel(item.date) }));

  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="dashboard-period">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 id="dashboard-period" className="font-bold text-slate-900">Periode ringkasan</h2><p className="mt-1 text-sm text-slate-500"><CalendarDays className="mr-1.5 inline h-4 w-4" /> {wibDate(data.period.from)}–{wibDate(new Date(Date.parse(data.period.to) - 1).toISOString())} · WIB</p></div>
        <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Pilih periode dashboard">{([7, 30] as const).map((value) => <button key={value} disabled={loading} aria-pressed={days === value} onClick={() => { if (days !== value) { setData(null); setDays(value); } }} className={`min-h-11 rounded-lg px-5 text-sm font-bold transition-colors motion-reduce:transition-none ${days === value ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{value} hari</button>)}</div>
      </div>
      {error !== null && <div role="alert" className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><span>Data terbaru belum dapat dimuat. Data periode sebelumnya masih ditampilkan.</span><button onClick={() => setReload((value) => value + 1)} className="min-h-11 rounded-lg border border-amber-300 px-4 font-bold">Coba lagi</button></div>}
    </section>

    <section className="grid gap-4 xl:grid-cols-2" aria-label="KPI pesanan">
      <Kpi icon={ShoppingBag} label="Pesanan dibuat (tidak dibatalkan/dikembalikan)" value={INTEGER.format(data.kpis.ordersCreated)} detail="Dibuat pada periode; status pembayaran dapat masih belum dibayar." />
      <Kpi icon={CircleDollarSign} label="Nilai pesanan kotor (tidak termasuk dibatalkan/dikembalikan)" value={IDR.format(data.kpis.grossOrderValueMinor)} detail="Total nilai pesanan pada metrik ini; bukan pendapatan yang sudah diterima." />
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="daily-chart-title">
      <header className="border-b border-slate-100 p-5"><h2 id="daily-chart-title" className="font-bold text-slate-900">Pesanan dibuat dan nilai kotor harian</h2><p className="mt-1 text-sm text-slate-500">Tanggal mengikuti WIB. Dibatalkan/dikembalikan tidak masuk grafik.</p></header>
      {allZero ? <div className="grid min-h-64 place-items-center p-6 text-center"><div><PackageOpen className="mx-auto h-9 w-9 text-slate-400" /><h3 className="mt-3 font-bold text-slate-900">Belum ada pesanan pada metrik ini</h3><p className="mt-1 text-sm text-slate-500">Grafik akan terisi ketika ada pesanan yang tidak dibatalkan/dikembalikan.</p></div></div> : <div role="img" aria-label={`Grafik ${data.period.days} hari: ${INTEGER.format(data.kpis.ordersCreated)} pesanan dibuat yang tidak dibatalkan/dikembalikan, dengan nilai kotor ${IDR.format(data.kpis.grossOrderValueMinor)}.`} className="h-80 w-full p-3 sm:p-5"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 10, right: 4, bottom: 5, left: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={data.period.days === 30 ? 4 : 0} /><YAxis yAxisId="money" tickLine={false} axisLine={false} width={64} fontSize={11} tickFormatter={(value: number) => value === 0 ? "Rp0" : value >= 1_000_000 ? `Rp${(value / 1_000_000).toLocaleString("id-ID")}jt` : `Rp${Math.round(value / 1_000).toLocaleString("id-ID")}rb`} /><YAxis yAxisId="orders" orientation="right" tickLine={false} axisLine={false} width={30} allowDecimals={false} fontSize={11} /><Tooltip formatter={(value: number, name: string) => name === "grossOrderValueMinor" ? [IDR.format(value), "Nilai kotor"] : [INTEGER.format(value), "Pesanan dibuat"]} /><Legend formatter={(value) => value === "grossOrderValueMinor" ? "Nilai kotor" : "Pesanan dibuat"} /><Area yAxisId="money" type="monotone" dataKey="grossOrderValueMinor" stroke="#4f46e5" fill="#c7d2fe" strokeWidth={2} isAnimationActive={false} /><Bar yAxisId="orders" dataKey="ordersCreated" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} /></ComposedChart></ResponsiveContainer></div>}
      <details className="border-t border-slate-100"><summary className="flex min-h-11 cursor-pointer items-center px-5 text-sm font-bold text-indigo-700">Lihat tabel data grafik</summary><div className="max-h-80 overflow-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Tanggal WIB</th><th className="px-5 py-3 text-right">Pesanan dibuat</th><th className="px-5 py-3 text-right">Nilai kotor</th></tr></thead><tbody className="divide-y divide-slate-100">{data.daily.map((item) => <tr key={item.date}><td className="px-5 py-3">{dateLabel(item.date)}</td><td className="px-5 py-3 text-right">{INTEGER.format(item.ordersCreated)}</td><td className="px-5 py-3 text-right font-semibold">{IDR.format(item.grossOrderValueMinor)}</td></tr>)}</tbody></table></div></details>
    </section>

    <section aria-labelledby="breakdown-title"><div className="mb-3"><h2 id="breakdown-title" className="font-bold text-slate-900">Rincian seluruh pesanan</h2><p className="mt-1 text-sm text-slate-500">Mencakup semua pesanan periode ini, termasuk dibatalkan/dikembalikan.</p></div><div className="grid gap-4 lg:grid-cols-3"><Breakdown title="Status pesanan" labels={orderLabels} values={data.breakdowns.orderStatus} /><Breakdown title="Status pembayaran" labels={paymentLabels} values={data.breakdowns.paymentStatus} /><Breakdown title="Status pemenuhan" labels={fulfillmentLabels} values={data.breakdowns.fulfillmentStatus} /></div></section>
  </div>;
}

function Kpi({ icon: Icon, label, value, detail }: { icon: typeof ShoppingBag; label: string; value: string; detail: string }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 break-words text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div></div></article>; }
function Breakdown<T extends string>({ title, labels, values }: { title: string; labels: Record<T, string>; values: Record<T, number> }) { const total = Object.values(values).reduce<number>((sum, value) => sum + (value as number), 0); return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">{title}</h3><span className="text-xs font-semibold text-slate-500">{INTEGER.format(total)} total</span></div><dl className="mt-4 space-y-3">{(Object.entries(labels) as Array<[T, string]>).map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3 text-sm"><dt className="text-slate-600">{label}</dt><dd className="min-w-8 rounded-full bg-slate-100 px-2.5 py-1 text-center font-bold text-slate-800">{INTEGER.format(values[key])}</dd></div>)}</dl></article>; }
function DashboardSkeleton() { return <div aria-label="Memuat dashboard" className="space-y-5"><div className="h-24 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" /><div className="grid gap-4 sm:grid-cols-2"><div className="h-40 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" /><div className="h-40 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" /></div><div className="h-96 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" /></div>; }
function StatePanel({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) { return <div role="alert" aria-live="polite" className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center"><div><AlertCircle className="mx-auto h-9 w-9 text-slate-400" /><h2 className="mt-3 font-bold text-slate-900">{title}</h2><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{detail}</p><div className="mt-5">{children}</div></div></div>; }
