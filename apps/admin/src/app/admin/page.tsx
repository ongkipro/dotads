"use client";

import { AnalyticsOverview } from "@/components/AnalyticsOverview";
import { OrderDataTable } from "@/components/OrderDataTable";
import { ArrowRight, Package, ShoppingCart } from "lucide-react";

export default function AdminDashboardPage() {
  return <div className="mx-auto max-w-7xl space-y-8 pb-12">
    <header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Operasional toko</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Ringkasan</h1><p className="mt-1 text-sm font-medium text-slate-500">Data pesanan dari toko aktif, dihitung dalam waktu Indonesia Barat (WIB).</p></header>
    <nav aria-label="Tugas merchant" className="grid gap-3 sm:grid-cols-2">
      <TaskLink href="/admin/orders" icon={ShoppingCart} title="Kelola pesanan" detail="Periksa pembayaran dan pengiriman" />
      <TaskLink href="/admin/products" icon={Package} title="Buka produk" detail="Lihat katalog, harga, dan stok" />
    </nav>
    <AnalyticsOverview />
    <section aria-label="Pesanan terbaru"><OrderDataTable compact /></section>
  </div>;
}

function TaskLink({ href, icon: Icon, title, detail }: { href: string; icon: typeof ShoppingCart; title: string; detail: string }) {
  return <a href={href} className="group flex min-h-20 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 focus:outline-none focus:ring-2 focus:ring-indigo-500">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-white group-hover:text-indigo-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
    <span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{title}</strong><span className="mt-0.5 block text-xs leading-5 text-slate-500">{detail}</span></span>
    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-indigo-600" aria-hidden="true" />
  </a>;
}
