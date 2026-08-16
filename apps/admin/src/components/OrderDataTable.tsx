"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, ChevronLeft, ChevronRight, Clock3, PackageOpen, RefreshCw, Search, Truck, X } from "lucide-react";
import { AdminOrdersError, dispatchOrder, getOrder, listCompactOrders, listOrders, transitionOrder, type FulfillmentStatus, type OrderDetail, type OrderPage, type OrderStatus, type OrderSummary, type PaymentStatus } from "@/lib/admin-orders";

const LIMIT = 25;
const IDR = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const WIB = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
const orderLabel: Record<OrderStatus, string> = { PENDING_PAYMENT: "Menunggu pembayaran", CONFIRMED: "Dikonfirmasi", PROCESSING: "Diproses", SHIPPED: "Dikirim", DELIVERED: "Selesai", CANCELLED: "Dibatalkan", REFUNDED: "Dikembalikan" };
const paymentLabel: Record<PaymentStatus, string> = { UNPAID: "Belum dibayar", PAID: "Lunas", REFUNDED: "Dikembalikan", FAILED: "Gagal" };
const fulfillmentLabel: Record<FulfillmentStatus, string> = { UNFULFILLED: "Belum diproses", PICKUP_REQUESTED: "Menunggu penjemputan", IN_TRANSIT: "Dalam pengiriman", DELIVERED: "Terkirim", RETURNED: "Dikembalikan", FAILED: "Gagal" };
const formatDate = (value: string) => `${WIB.format(new Date(value))} WIB`;
const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : "Pesanan belum dapat dimuat. Coba lagi.";
const badgeClass = (status: OrderStatus) => status === "DELIVERED" ? "bg-emerald-50 text-emerald-700" : ["CANCELLED", "REFUNDED"].includes(status) ? "bg-rose-50 text-rose-700" : "bg-indigo-50 text-indigo-700";

export function OrderDataTable({ compact = false }: { compact?: boolean }) {
  return compact ? <CompactOrderSummary /> : <FullOrderDataTable />;
}

function CompactOrderSummary() {
  const [page, setPage] = useState<OrderPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    listCompactOrders((input, init) => fetch(input, { ...init, signal: controller.signal }))
      .then(setPage).catch((cause) => { if (!controller.signal.aborted) setError(errorMessage(cause)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  return <div className="space-y-4">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Pesanan terbaru</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ringkasan maksimal lima pesanan terbaru berdasarkan data tersimpan.</p></div><a href="/admin/orders" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50">Lihat semua pesanan <ArrowRight className="h-4 w-4" /></a></header>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-label="Ringkasan pesanan terbaru">
      {loading ? <CompactOrderSkeleton /> : error ? <StatePanel icon={AlertCircle} title="Pesanan terbaru belum dapat dimuat" detail={error}><button onClick={() => setReload((value) => value + 1)} className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white"><RefreshCw className="mr-2 inline h-4 w-4" />Coba lagi</button></StatePanel> : page && page.items.length === 0 ? <StatePanel icon={PackageOpen} title="Belum ada pesanan" detail="Pesanan baru dari toko akan tampil di ringkasan ini." /> : page && <>
        <div className="divide-y divide-slate-100 xl:hidden dark:divide-slate-800">{page.items.map((order) => <CompactOrderCard key={order.id} order={order} />)}</div>
        <div className="hidden overflow-x-auto xl:block"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Pesanan</th><th className="px-4 py-3">Pelanggan</th><th className="px-4 py-3">Status pesanan</th><th className="px-4 py-3">Pembayaran</th><th className="px-4 py-3">Pemenuhan</th><th className="px-4 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{page.items.map((order) => <CompactOrderRow key={order.id} order={order} />)}</tbody></table></div>
        <footer className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Menampilkan {page.items.length} dari {page.pagination.total} pesanan.</footer>
      </>}
    </section>
  </div>;
}

function CompactOrderCard({ order }: { order: OrderSummary }) {
  return <article className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-bold text-slate-900">{order.orderNumber}</p><p className="mt-1 text-xs text-slate-500">{formatDate(order.createdAt)}</p></div><strong className="whitespace-nowrap text-sm">{IDR.format(order.totalMinor)}</strong></div><p className="truncate text-sm font-semibold text-slate-700">{order.customerName}</p><dl className="grid gap-2 text-sm sm:grid-cols-3"><CompactAxis label="Status pesanan" value={orderLabel[order.status]} emphasis={badgeClass(order.status)} /><CompactAxis label="Pembayaran" value={`${order.paymentMethod} · ${paymentLabel[order.paymentStatus]}`} /><CompactAxis label="Pemenuhan" value={fulfillmentLabel[order.fulfillmentStatus]} /></dl></article>;
}

function CompactAxis({ label, value, emphasis = "" }: { label: string; value: string; emphasis?: string }) {
  return <div className="min-w-0 rounded-lg bg-slate-50 p-2.5"><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className={`mt-1 break-words text-xs font-bold ${emphasis || "text-slate-800"}`}>{value}</dd></div>;
}

function CompactOrderRow({ order }: { order: OrderSummary }) {
  return <tr><td className="px-4 py-4"><p className="font-bold text-slate-900">{order.orderNumber}</p><p className="mt-1 text-xs text-slate-500">{formatDate(order.createdAt)}</p></td><td className="px-4 py-4 font-semibold text-slate-700">{order.customerName}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass(order.status)}`}>{orderLabel[order.status]}</span></td><td className="px-4 py-4"><p>{order.paymentMethod}</p><p className="text-xs text-slate-500">{paymentLabel[order.paymentStatus]}</p></td><td className="px-4 py-4">{fulfillmentLabel[order.fulfillmentStatus]}</td><td className="whitespace-nowrap px-4 py-4 text-right font-bold">{IDR.format(order.totalMinor)}</td></tr>;
}

function CompactOrderSkeleton() {
  return <div aria-label="Memuat ringkasan pesanan" className="space-y-3 p-4">{[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />)}</div>;
}

function FullOrderDataTable() {
  const [page, setPage] = useState<OrderPage | null>(null);
  const [offset, setOffset] = useState(0);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    listOrders({ limit: LIMIT, offset, query: query || undefined, paymentStatus: paymentStatus || undefined, fulfillmentStatus: fulfillmentStatus || undefined }, (input, init) => fetch(input, { ...init, signal: controller.signal }))
      .then(setPage).catch((cause) => { if (!controller.signal.aborted) setError(errorMessage(cause)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [offset, query, paymentStatus, fulfillmentStatus, reloadKey]);

  const applySearch = (event: FormEvent) => { event.preventDefault(); setOffset(0); setQuery(queryInput.trim()); };
  const clearFilters = () => { setQueryInput(""); setQuery(""); setPaymentStatus(""); setFulfillmentStatus(""); setOffset(0); };
  const filtered = !!query || !!paymentStatus || !!fulfillmentStatus;

  return <div className="space-y-4">
    <header>
      <h1 className="text-xl font-extrabold text-slate-950 dark:text-white">Pesanan</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pantau status pesanan, pembayaran, dan pengiriman berdasarkan data tersimpan.</p>
    </header>

    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <form onSubmit={applySearch} className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_210px_auto] dark:border-slate-800">
        <label className="relative"><span className="sr-only">Cari pesanan</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input type="search" value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="No. pesanan, nama, atau telepon" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950" />
        </label>
        <label><span className="sr-only">Status pembayaran</span><select value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value as PaymentStatus | ""); setOffset(0); }} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">Semua pembayaran</option><option value="UNPAID">Belum dibayar</option><option value="PAID">Lunas</option><option value="REFUNDED">Dikembalikan</option><option value="FAILED">Gagal</option></select></label>
        <label><span className="sr-only">Status pengiriman</span><select value={fulfillmentStatus} onChange={(event) => { setFulfillmentStatus(event.target.value as FulfillmentStatus | ""); setOffset(0); }} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">Semua pengiriman</option><option value="UNFULFILLED">Belum diproses</option><option value="PICKUP_REQUESTED">Menunggu penjemputan</option><option value="IN_TRANSIT">Dalam pengiriman</option><option value="DELIVERED">Terkirim</option><option value="RETURNED">Dikembalikan</option><option value="FAILED">Gagal</option></select></label>
        <button type="submit" className="min-h-11 rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700">Cari</button>
      </form>

      {loading ? <OrderSkeleton /> : error ? <StatePanel icon={AlertCircle} title="Pesanan belum dapat dimuat" detail={error}><button onClick={() => setReloadKey((key) => key + 1)} className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white"><RefreshCw className="mr-2 inline h-4 w-4" />Coba lagi</button></StatePanel> : page && page.items.length === 0 ? <StatePanel icon={PackageOpen} title={filtered ? "Tidak ada hasil" : "Belum ada pesanan"} detail={filtered ? "Ubah kata pencarian atau filter untuk melihat pesanan lain." : "Pesanan baru dari toko akan tampil di sini."}>{filtered && <button onClick={clearFilters} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold">Hapus filter</button>}</StatePanel> : page && <>
        <div className="divide-y divide-slate-100 xl:hidden dark:divide-slate-800">{page.items.map((order) => <OrderCard key={order.id} order={order} onOpen={() => setSelectedId(order.id)} />)}</div>
        <div className="hidden overflow-x-auto xl:block"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950"><tr><th className="px-4 py-3">Pesanan</th><th className="px-4 py-3">Pelanggan</th><th className="px-4 py-3">Pembayaran</th><th className="px-4 py-3">Pengiriman</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3"><span className="sr-only">Tindakan</span></th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{page.items.map((order) => <OrderTableRow key={order.id} order={order} onOpen={() => setSelectedId(order.id)} />)}</tbody></table></div>
        <Pagination page={page} onOffset={setOffset} />
      </>}
    </section>
    {selectedId && <OrderDrawer id={selectedId} onClose={() => setSelectedId(null)} onMutated={() => setReloadKey((key) => key + 1)} />}
  </div>;
}

function OrderCard({ order, onOpen }: { order: OrderSummary; onOpen: () => void }) {
  return <article className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><button onClick={onOpen} className="min-h-11 text-left font-bold text-indigo-700 underline-offset-4 hover:underline">{order.orderNumber}</button><p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass(order.status)}`}>{orderLabel[order.status]}</span></div><div><p className="font-semibold text-slate-900 dark:text-white">{order.customerName}</p><p className="text-sm text-slate-500">{order.customerPhone}</p></div><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-500">Pembayaran</p><p className="font-semibold">{order.paymentMethod} · {paymentLabel[order.paymentStatus]}</p></div><div><p className="text-xs text-slate-500">Pengiriman</p><p className="font-semibold">{fulfillmentLabel[order.fulfillmentStatus]}</p></div></div><div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800"><strong>{IDR.format(order.totalMinor)}</strong><button onClick={onOpen} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold">Lihat detail</button></div></article>;
}
function OrderTableRow({ order, onOpen }: { order: OrderSummary; onOpen: () => void }) {
  return <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td className="px-4 py-4"><button onClick={onOpen} className="min-h-11 font-bold text-indigo-700 hover:underline">{order.orderNumber}</button><p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p></td><td className="px-4 py-4"><p className="font-semibold">{order.customerName}</p><p className="text-xs text-slate-500">{order.customerPhone}</p></td><td className="px-4 py-4"><p>{order.paymentMethod}</p><p className="text-xs text-slate-500">{paymentLabel[order.paymentStatus]}</p></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass(order.status)}`}>{orderLabel[order.status]}</span><p className="mt-2 text-xs text-slate-500">{fulfillmentLabel[order.fulfillmentStatus]}</p></td><td className="whitespace-nowrap px-4 py-4 text-right font-bold">{IDR.format(order.totalMinor)}</td><td className="px-4 py-4 text-right"><button onClick={onOpen} className="min-h-11 rounded-lg border border-slate-300 px-4 font-bold">Detail</button></td></tr>;
}
function Pagination({ page, onOffset }: { page: OrderPage; onOffset: (offset: number) => void }) {
  const start = page.pagination.total ? page.pagination.offset + 1 : 0; const end = Math.min(page.pagination.offset + page.pagination.limit, page.pagination.total);
  return <footer className="flex items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm dark:border-slate-800"><p className="text-slate-500">{start}–{end} dari {page.pagination.total} pesanan</p><div className="flex gap-2"><button aria-label="Halaman sebelumnya" disabled={page.pagination.offset === 0} onClick={() => onOffset(Math.max(0, page.pagination.offset - page.pagination.limit))} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-slate-300 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><button aria-label="Halaman berikutnya" disabled={end >= page.pagination.total} onClick={() => onOffset(page.pagination.offset + page.pagination.limit)} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-slate-300 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></footer>;
}
function OrderDrawer({ id, onClose, onMutated }: { id: string; onClose: () => void; onMutated: () => void }) {
  const [detail, setDetail] = useState<OrderDetail | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [mutating, setMutating] = useState(false); const [notice, setNotice] = useState<string | null>(null); const [reload, setReload] = useState(0); const [showCancel, setShowCancel] = useState(false); const [cancelReason, setCancelReason] = useState("");
  const load = useCallback(() => { setLoading(true); setError(null); getOrder(id).then(setDetail).catch((cause) => setError(errorMessage(cause))).finally(() => setLoading(false)); }, [id]);
  useEffect(() => { load(); }, [load, reload]);
  const refreshAfterConflict = (cause: unknown, prefix: string) => { setError(cause instanceof AdminOrdersError && cause.status === 409 ? `${prefix}: ${cause.message}. Data pesanan dimuat ulang.` : errorMessage(cause)); if (cause instanceof AdminOrdersError && cause.status === 409) load(); };
  const queueDispatch = async () => { setMutating(true); setError(null); setNotice(null); try { const result = await dispatchOrder(id); setNotice(result.alreadyQueued ? "Pesanan ini sudah berada dalam antrean pengiriman." : "Pesanan berhasil masuk antrean pengiriman. Resi belum tersedia sampai provider memprosesnya."); setDetail((current) => current ? { ...current, dispatch: result.dispatch } : current); onMutated(); } catch (cause) { refreshAfterConflict(cause, "Tidak dapat masuk antrean"); } finally { setMutating(false); } };
  const applyTransition = async (input: { action: "start_processing" } | { action: "cancel"; reason: string }) => { setMutating(true); setError(null); setNotice(null); try { const result = await transitionOrder(id, input); setNotice(result.alreadyApplied ? "Perubahan ini sudah tersimpan sebelumnya." : input.action === "cancel" ? "Pesanan berhasil dibatalkan dan alasannya tersimpan." : "Pesanan kini diproses."); setShowCancel(false); setCancelReason(""); await load(); onMutated(); } catch (cause) { refreshAfterConflict(cause, "Status pesanan tidak dapat diubah"); } finally { setMutating(false); } };
  const dispatchEligible = detail && !detail.dispatch && detail.fulfillmentStatus === "UNFULFILLED" && !detail.cnoteNo && ["CONFIRMED", "PROCESSING"].includes(detail.status) && (detail.paymentMethod === "COD" || detail.paymentStatus === "PAID") && !!detail.subdistrictId && !!detail.courierCode;
  const canProcess = detail?.status === "CONFIRMED" && detail.fulfillmentStatus === "UNFULFILLED" && (detail.paymentMethod === "COD" || detail.paymentStatus === "PAID");
  const canCancel = detail && detail.paymentStatus === "UNPAID" && detail.fulfillmentStatus === "UNFULFILLED" && !detail.cnoteNo && !detail.dispatch && ["PENDING_PAYMENT", "CONFIRMED"].includes(detail.status);
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside role="dialog" aria-modal="true" aria-labelledby="order-title" className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-slate-900"><header className="flex min-h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Detail pesanan</p><h2 id="order-title" className="font-extrabold">{detail?.orderNumber ?? "Memuat…"}</h2></div><button onClick={onClose} aria-label="Tutup detail pesanan" className="grid min-h-11 min-w-11 place-items-center rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button></header><div className="flex-1 overflow-y-auto p-4 sm:p-6">{loading ? <OrderSkeleton /> : error && !detail ? <StatePanel icon={AlertCircle} title="Detail belum dapat dimuat" detail={error}><button onClick={() => setReload((value) => value + 1)} className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white">Coba lagi</button></StatePanel> : detail && <div className="space-y-6">{notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}{error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}<section className="grid grid-cols-2 gap-3"><Metric label="Status pesanan" value={orderLabel[detail.status]} /><Metric label="Total" value={IDR.format(detail.totalMinor)} /><Metric label="Pembayaran" value={`${detail.paymentMethod} · ${paymentLabel[detail.paymentStatus]}`} /><Metric label="Pengiriman" value={fulfillmentLabel[detail.fulfillmentStatus]} /></section><section><Heading>Pelanggan dan tujuan</Heading><div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800"><p className="font-bold">{detail.customerName}</p><p>{detail.customerPhone}{detail.customerEmail ? ` · ${detail.customerEmail}` : ""}</p><p className="mt-2 text-slate-600 dark:text-slate-300">{detail.shippingAddress}</p><p className="mt-1 text-slate-500">{[detail.subdistrictName, detail.cityName, detail.provinceName, detail.postalCode].filter(Boolean).join(", ")}</p></div></section><section><Heading>Rincian barang</Heading><div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">{detail.items.length ? detail.items.map((item) => <div key={item.id} className="flex justify-between gap-3 p-3 text-sm"><div><p className="font-semibold">{item.productName}</p><p className="text-xs text-slate-500">{[item.variantTitle, item.sku].filter(Boolean).join(" · ")} · {item.quantity} × {IDR.format(item.priceMinor)}</p></div><strong className="whitespace-nowrap">{IDR.format(item.subtotalMinor)}</strong></div>) : <p className="p-4 text-sm text-slate-500">Tidak ada rincian barang.</p>}</div></section><section><Heading>Antrean pengiriman</Heading>{detail.dispatch ? <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700"><p className="font-bold capitalize">{detail.dispatch.status}</p><p className="mt-1 text-slate-500">Percobaan: {detail.dispatch.attempts}</p><p className="mt-1 text-xs text-slate-500">Diperbarui {formatDate(detail.dispatch.updatedAt)}</p>{["failed", "dlq"].includes(detail.dispatch.status) && <p className="mt-2 text-amber-700">Antrean memerlukan pemulihan operator sebelum dapat dicoba kembali.</p>}</div> : <p className="text-sm text-slate-500">Belum masuk antrean. Resi hanya akan tampil setelah provider memproses pengiriman.</p>}</section><section><Heading>Riwayat</Heading>{detail.events.length ? <ol className="space-y-3">{detail.events.map((event) => <li key={event.id} className="flex gap-3 text-sm"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><div><p className="font-semibold">{event.event.replaceAll("_", " ")}</p><p className="text-xs text-slate-500">{formatDate(event.createdAt)} · {event.actor}</p></div></li>)}</ol> : <p className="text-sm text-slate-500">Belum ada riwayat pesanan.</p>}</section></div>}</div><footer className="space-y-2 border-t border-slate-200 p-4 dark:border-slate-800">{showCancel ? <form onSubmit={(event) => { event.preventDefault(); applyTransition({ action: "cancel", reason: cancelReason.trim() }); }} className="space-y-2"><label className="block text-sm font-semibold">Alasan pembatalan<textarea required minLength={3} maxLength={500} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 p-3 font-normal" placeholder="Minimal 3 karakter" /></label><div className="flex gap-2"><button type="button" onClick={() => setShowCancel(false)} className="min-h-11 flex-1 rounded-lg border border-slate-300 font-bold">Kembali</button><button disabled={mutating || cancelReason.trim().length < 3} className="min-h-11 flex-1 rounded-lg bg-rose-600 px-3 font-bold text-white disabled:opacity-50">Konfirmasi batalkan</button></div></form> : <div className="grid gap-2 sm:grid-cols-2">{canProcess && <button disabled={mutating} onClick={() => applyTransition({ action: "start_processing" })} className="min-h-11 rounded-lg border border-indigo-300 px-3 text-sm font-bold text-indigo-700 disabled:opacity-50">Mulai proses</button>}{canCancel && <button disabled={mutating} onClick={() => setShowCancel(true)} className="min-h-11 rounded-lg border border-rose-300 px-3 text-sm font-bold text-rose-700 disabled:opacity-50">Batalkan pesanan</button>}<button onClick={queueDispatch} disabled={!dispatchEligible || mutating} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Truck className="h-4 w-4" />{mutating ? "Menyimpan…" : detail?.dispatch ? "Sudah masuk antrean" : "Masukkan ke antrean"}</button></div>}{detail && !dispatchEligible && !detail.dispatch && !showCancel && <p className="text-center text-xs text-slate-500">Antrean tersedia untuk pesanan dikonfirmasi/diproses dengan pembayaran, tujuan, kurir, dan berat yang valid.</p>}</footer></aside></div>;
}
function Heading({ children }: { children: React.ReactNode }) { return <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{children}</h3>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>; }
function OrderSkeleton() { return <div aria-label="Memuat pesanan" className="space-y-3 p-4">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>; }
function StatePanel({ icon: Icon, title, detail, children }: { icon: typeof AlertCircle; title: string; detail: string; children?: React.ReactNode }) { return <div className="grid min-h-72 place-items-center p-6 text-center"><div><Icon className="mx-auto h-9 w-9 text-slate-400" /><h2 className="mt-3 font-bold">{title}</h2><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{detail}</p>{children && <div className="mt-4">{children}</div>}</div></div>; }
