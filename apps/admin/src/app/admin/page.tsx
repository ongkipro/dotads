"use client";

import { AnalyticsOverview } from "@/components/AnalyticsOverview";
import { OrderDataTable } from "@/components/OrderDataTable";

export default function AdminDashboardPage() {
  return <div className="mx-auto max-w-7xl space-y-8 pb-12">
    <header><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Ringkasan Toko</h1><p className="mt-1 text-sm font-medium text-slate-500">Data operasional pesanan dari workspace aktif.</p></header>
    <AnalyticsOverview />
    <section aria-label="Pesanan terbaru"><OrderDataTable compact /></section>
  </div>;
}
