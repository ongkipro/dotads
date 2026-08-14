"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  MapPin,
  PackageCheck,
  Pencil,
  Printer,
  Search,
  ShieldAlert,
  Truck,
  X,
} from "lucide-react";
export type OrderLifecycleStatus = "PENDING" | "PAID" | "SHIPPED" | "COMPLETED" | "RTS";

type OrderTab = "ALL" | OrderLifecycleStatus;
type RiskLevel = "green" | "yellow" | "red";

export interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalMinor: number;
  paymentMethod: string;
  paymentStatus: "PAID" | "UNPAID";
  fulfillmentStatus: "UNFULFILLED" | "PICKUP_REQUESTED" | "IN_TRANSIT" | "DELIVERED" | "RTS";
  lifecycleStatus: OrderLifecycleStatus;
  cnoteNo?: string;
  courierCode?: string;
  rtsRiskScore: number;
  createdAt: string;
}

interface RiskBadge {
  level: RiskLevel;
  label: "Hijau" | "Kuning" | "Merah";
  className: string;
  barClassName: string;
  advice: string;
}

const ORDER_TABS: ReadonlyArray<{ value: OrderTab; label: string }> = [
  { value: "ALL", label: "Semua" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "COMPLETED", label: "Completed" },
  { value: "RTS", label: "RTS" },
];

const LIFECYCLE_LABELS: Record<OrderLifecycleStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  RTS: "RTS",
};

const FULFILLMENT_LABELS: Record<OrderRow["fulfillmentStatus"], string> = {
  UNFULFILLED: "Belum diproses",
  PICKUP_REQUESTED: "Menunggu penjemputan",
  IN_TRANSIT: "Dalam pengiriman",
  DELIVERED: "Terkirim",
  RTS: "Dikembalikan ke pengirim",
};

const IDR_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const DISTRICT_DATABASE = [
  { name: "Kebayoran Baru", city: "Jakarta Selatan", province: "DKI Jakarta", postalCode: "12110" },
  { name: "Kebon Jeruk", city: "Jakarta Barat", province: "DKI Jakarta", postalCode: "11530" },
  { name: "Kebayoran Lama", city: "Jakarta Selatan", province: "DKI Jakarta", postalCode: "12240" },
  { name: "Cibinong", city: "Kabupaten Bogor", province: "Jawa Barat", postalCode: "16911" },
  { name: "Lowokwaru", city: "Kota Malang", province: "Jawa Timur", postalCode: "65141" },
  { name: "Denpasar Selatan", city: "Kota Denpasar", province: "Bali", postalCode: "80221" },
  { name: "Cicendo", city: "Kota Bandung", province: "Jawa Barat", postalCode: "40172" },
  { name: "Coblong", city: "Kota Bandung", province: "Jawa Barat", postalCode: "40132" },
  { name: "Genteng", city: "Surabaya", province: "Jawa Timur", postalCode: "60271" },
  { name: "Medan Barat", city: "Medan", province: "Sumatera Utara", postalCode: "20111" },
];

const SAMPLE_ORDERS: OrderRow[] = [
  {
    id: "ord_1001",
    orderNumber: "ORD_991021",
    customerName: "Budi Santoso",
    customerPhone: "081234567890",
    shippingAddress: "Jl. Sudirman No. 45, Kebayoran Baru, Jakarta Selatan",
    totalMinor: 270000,
    paymentMethod: "COD",
    paymentStatus: "UNPAID",
    fulfillmentStatus: "UNFULFILLED",
    lifecycleStatus: "PENDING",
    courierCode: "JNE",
    rtsRiskScore: 12,
    createdAt: "14 Agu 2026, 10.15 WIB",
  },
  {
    id: "ord_1002",
    orderNumber: "ORD_991022",
    customerName: "Siti Rahma",
    customerPhone: "085711223344",
    shippingAddress: "Jl. Pemuda No. 12, Genteng, Surabaya",
    totalMinor: 150000,
    paymentMethod: "QRIS",
    paymentStatus: "PAID",
    fulfillmentStatus: "DELIVERED",
    lifecycleStatus: "COMPLETED",
    cnoteNo: "MNTR-8899211",
    courierCode: "SICEPAT",
    rtsRiskScore: 5,
    createdAt: "14 Agu 2026, 09.30 WIB",
  },
  {
    id: "ord_1003",
    orderNumber: "ORD_991023",
    customerName: "Agus Pratama",
    customerPhone: "082199887766",
    shippingAddress: "Gg. Mawar No. 3, Coblong, Bandung",
    totalMinor: 320000,
    paymentMethod: "COD",
    paymentStatus: "UNPAID",
    fulfillmentStatus: "RTS",
    lifecycleStatus: "RTS",
    cnoteNo: "MNTR-8899208",
    courierCode: "J&T",
    rtsRiskScore: 86,
    createdAt: "14 Agu 2026, 08.45 WIB",
  },
  {
    id: "ord_1004",
    orderNumber: "ORD_991024",
    customerName: "Rina Kusuma",
    customerPhone: "081999888777",
    shippingAddress: "Jl. Merdeka No. 8, Medan Barat, Medan",
    totalMinor: 450000,
    paymentMethod: "VA BCA",
    paymentStatus: "PAID",
    fulfillmentStatus: "IN_TRANSIT",
    lifecycleStatus: "SHIPPED",
    cnoteNo: "MNTR-8899212",
    courierCode: "SAP",
    rtsRiskScore: 2,
    createdAt: "14 Agu 2026, 07.15 WIB",
  },
  {
    id: "ord_1005",
    orderNumber: "ORD_991025",
    customerName: "Dewi Lestari",
    customerPhone: "08111222333",
    shippingAddress: "Jl. Kemang Raya No. 21, Jakarta Selatan",
    totalMinor: 99000,
    paymentMethod: "QRIS",
    paymentStatus: "PAID",
    fulfillmentStatus: "UNFULFILLED",
    lifecycleStatus: "PAID",
    courierCode: "JNE",
    rtsRiskScore: 42,
    createdAt: "14 Agu 2026, 06.10 WIB",
  },
];

const getRiskBadge = (score: number): RiskBadge => {
  if (score < 30) {
    return {
      level: "green",
      label: "Hijau",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      barClassName: "bg-emerald-500",
      advice: "Risiko rendah. Riwayat penerimaan paket pelanggan tergolong baik.",
    };
  }

  if (score <= 70) {
    return {
      level: "yellow",
      label: "Kuning",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      barClassName: "bg-amber-500",
      advice: "Risiko sedang. Konfirmasikan pesanan dan alamat pelanggan melalui WhatsApp.",
    };
  }

  return {
    level: "red",
    label: "Merah",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    barClassName: "bg-rose-500",
    advice: "Risiko tinggi. Pastikan ulang alamat dan kesiapan pelanggan menerima paket.",
  };
};

const CRM_TEMPLATES: Record<string, { label: string; title: string; template: string }> = {
  W: {
    label: "W",
    title: "Welcome Order",
    template: "Halo Kak {{nama}}, terima kasih sudah memesan {{produk}} di toko kami (No. Inv: {{inv}}). Total: Rp {{total}}. Mohon konfirmasi alamat: {{alamat}}, {{kecamatan}}.",
  },
  D: {
    label: "D",
    title: "Draft/Unpaid Follow-up",
    template: "Halo Kak {{nama}}, pesanan {{inv}} belum diselesaikan. Yuk selesaikan pesanan {{produk}} agar dapat kami proses hari ini!",
  },
  F1: {
    label: "F1",
    title: "Follow-up COD 1",
    template: "Halo Kak {{nama}}, konfirmasi pengiriman COD pesanan {{inv}} ke {{kecamatan}}. Mohon reply 'OK' agar kurir {{kurir}} segera menjemput paket.",
  },
  F2: {
    label: "F2",
    title: "Follow-up Resi/Transit",
    template: "Halo Kak {{nama}}, paket {{produk}} (Inv: {{inv}}) telah dikirim via {{kurir}} No. Resi: {{resi}}. Siapkan uang pas Rp {{total}} saat kurir tiba ya!",
  },
  P: {
    label: "P",
    title: "Pembayaran Lunas",
    template: "Halo Kak {{nama}}, pembayaran pesanan {{inv}} sebesar Rp {{total}} telah berhasil diverifikasi. Terima kasih!",
  },
};

const buildDynamicWhatsAppUrl = (
  order: OrderRow,
  actionKey: string = "W"
) => {
  const digits = order.customerPhone.replace(/\D/g, "");
  const internationalPhone = digits.startsWith("62") ? digits : `62${digits.replace(/^0/, "")}`;
  const tpl = CRM_TEMPLATES[actionKey]?.template || CRM_TEMPLATES.W.template;

  const formattedTotal = IDR_FORMATTER.format(order.totalMinor);
  const messageText = tpl
    .replace(/\{\{nama\}\}/g, order.customerName)
    .replace(/\{\{wa\}\}/g, order.customerPhone)
    .replace(/\{\{inv\}\}/g, order.orderNumber)
    .replace(/\{\{produk\}\}/g, "Alpha Premium Gadget")
    .replace(/\{\{total\}\}/g, formattedTotal)
    .replace(/\{\{alamat\}\}/g, order.shippingAddress)
    .replace(/\{\{kecamatan\}\}/g, "Kebayoran Baru")
    .replace(/\{\{kurir\}\}/g, order.courierCode || "JNE")
    .replace(/\{\{resi\}\}/g, order.cnoteNo || "SEDANG_DIPROSES");

  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(messageText)}`;
};

const toCsvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export function OrderDataTable() {
  const [orders, setOrders] = useState<OrderRow[]>(SAMPLE_ORDERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderTab>("ALL");
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [editingAddressOrder, setEditingAddressOrder] = useState<OrderRow | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editShippingAddress, setEditShippingAddress] = useState("");
  const [districtQuery, setDistrictQuery] = useState("");
  const [showDistrictSuggestions, setShowDistrictSuggestions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [clickedCrmButtons, setClickedCrmButtons] = useState<Record<string, Set<string>>>({});
  const toastTimerRef = useRef<number | undefined>(undefined);

  const handleCrmClick = (order: OrderRow, key: string) => {
    setClickedCrmButtons((prev) => {
      const nextSet = new Set(prev[order.id] || []);
      nextSet.add(key);
      return { ...prev, [order.id]: nextSet };
    });
    const url = buildDynamicWhatsAppUrl(order, key);
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const districtSuggestions = useMemo(() => {
    const term = districtQuery.trim().toLowerCase();
    if (!term) return [];
    return DISTRICT_DATABASE.filter((item) =>
      `${item.name} ${item.city} ${item.province} ${item.postalCode}`.toLowerCase().includes(term),
    );
  }, [districtQuery]);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimerRef.current);
    },
  );

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const phoneQuery = searchTerm.replace(/\D/g, "");

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        (order.cnoteNo && order.cnoteNo.toLowerCase().includes(query)) ||
        (order.courierCode && order.courierCode.toLowerCase().includes(query)) ||
        order.paymentMethod.toLowerCase().includes(query) ||
        (phoneQuery.length > 0 && order.customerPhone.replace(/\D/g, "").includes(phoneQuery));
      const matchesStatus = selectedStatus === "ALL" || order.lifecycleStatus === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, selectedStatus]);

  const selectedOrders = useMemo(
    () => filteredOrders.filter((order) => selectedOrderIds.has(order.id)),
    [filteredOrders, selectedOrderIds],
  );

  const allVisibleSelected =
    filteredOrders.length > 0 && filteredOrders.every((order) => selectedOrderIds.has(order.id));
  const selectedOrderRisk = selectedOrder ? getRiskBadge(selectedOrder.rtsRiskScore) : null;

  const showNotification = (message: string) => {
    window.clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((current) => {
      const next = new Set(current);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleAllVisibleOrders = () => {
    setSelectedOrderIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) filteredOrders.forEach((order) => next.delete(order.id));
      else filteredOrders.forEach((order) => next.add(order.id));
      return next;
    });
  };

  const handleExportCsv = async () => {
    if (selectedOrders.length === 0 || isExporting) return;
    setIsExporting(true);

    await new Promise<void>((resolve) => window.setTimeout(resolve, 250));

    const headers = [
      "No. Pesanan",
      "Nama Pelanggan",
      "No. HP",
      "Alamat",
      "Total (IDR)",
      "Metode Pembayaran",
      "Status Pembayaran",
      "Status Pesanan",
      "Status Pengiriman",
      "Risiko RTS",
      "Resi",
      "Waktu",
    ];
    const rows = selectedOrders.map((order) =>
      [
        order.orderNumber,
        order.customerName,
        order.customerPhone,
        order.shippingAddress,
        order.totalMinor,
        order.paymentMethod,
        order.paymentStatus === "PAID" ? "Lunas" : "Belum dibayar",
        LIFECYCLE_LABELS[order.lifecycleStatus],
        FULFILLMENT_LABELS[order.fulfillmentStatus],
        `${getRiskBadge(order.rtsRiskScore).label} (${order.rtsRiskScore})`,
        order.cnoteNo ?? "",
        order.createdAt,
      ]
        .map(toCsvCell)
        .join(","),
    );

    const blob = new Blob([[headers.map(toCsvCell).join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pesanan-dotads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setIsExporting(false);
    setSelectedOrderIds(new Set());
    showNotification(`${selectedOrders.length} pesanan berhasil diekspor ke CSV.`);
  };

  const handleDispatchMengantar = (orderId: string) => {
    const generatedWaybill = `MNTR-${Math.floor(1_000_000 + Math.random() * 9_000_000)}`;
    const updateOrder = (order: OrderRow): OrderRow =>
      order.id === orderId
        ? {
            ...order,
            fulfillmentStatus: "PICKUP_REQUESTED",
            lifecycleStatus: "SHIPPED",
            cnoteNo: generatedWaybill,
          }
        : order;

    setOrders((current) => current.map(updateOrder));
    setSelectedOrder((current) => (current ? updateOrder(current) : null));
    showNotification("Pesanan berhasil didaftarkan ke ekspedisi Mengantar.");
  };

  return (
    <div className="space-y-4">
      {toastMessage && (
        <div
          role="status"
          className="fixed right-5 top-5 z-[70] flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Kelola pesanan</h1>
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                Pantau pembayaran, pengiriman, dan risiko pengembalian pesanan.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  aria-label="Cari nomor pesanan atau nomor telepon"
                  placeholder="Cari no. pesanan atau telepon..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setSelectedOrderIds(new Set());
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={selectedOrders.length === 0 || isExporting}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Download className={`h-3.5 w-3.5 ${isExporting ? "animate-bounce" : ""}`} />
                {isExporting ? "Mengekspor..." : `Ekspor CSV (${selectedOrders.length})`}
              </button>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Filter status pesanan"
            className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800"
          >
            {ORDER_TABS.map((tab) => {
              const count =
                tab.value === "ALL"
                  ? orders.length
                  : orders.filter((order) => order.lifecycleStatus === tab.value).length;
              const active = selectedStatus === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setSelectedStatus(tab.value);
                    setSelectedOrderIds(new Set());
                  }}
                  className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition-colors ${
                    active
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-indigo-50" : "bg-slate-100 dark:bg-slate-800"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedOrders.length > 0 && (
          <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50 px-5 py-2.5 text-xs font-semibold text-indigo-700">
            <span>{selectedOrders.length} pesanan dipilih untuk ekspor.</span>
            <button type="button" onClick={() => setSelectedOrderIds(new Set())} className="font-bold hover:underline">
              Batalkan pilihan
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua pesanan yang terlihat"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisibleOrders}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-3.5">No. pesanan</th>
                <th className="px-4 py-3.5">Pelanggan</th>
                <th className="px-4 py-3.5 text-right">Total</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Pengiriman</th>
                <th className="px-4 py-3.5">Risiko RTS</th>
                <th className="px-4 py-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.map((order) => {
                const risk = getRiskBadge(order.rtsRiskScore);
                const checked = selectedOrderIds.has(order.id);

                return (
                  <tr key={order.id} className="group transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        aria-label={`Pilih pesanan ${order.orderNumber}`}
                        checked={checked}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="font-bold text-indigo-600 group-hover:underline dark:text-indigo-400"
                      >
                        {order.orderNumber}
                      </button>
                      <div className="mt-0.5 whitespace-nowrap text-[11px] text-slate-400">{order.createdAt}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{order.customerName}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{order.customerPhone}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-extrabold text-slate-900 dark:text-slate-100">
                      {IDR_FORMATTER.format(order.totalMinor)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            order.lifecycleStatus === "COMPLETED"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : order.lifecycleStatus === "RTS"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-indigo-200 bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {LIFECYCLE_LABELS[order.lifecycleStatus]}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <CreditCard className="h-3 w-3" />
                          {order.paymentMethod} · {order.paymentStatus === "PAID" ? "Lunas" : "Belum dibayar"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex min-w-40 flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {order.fulfillmentStatus === "DELIVERED" ? (
                            <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Truck className="h-3.5 w-3.5 text-indigo-500" />
                          )}
                          {FULFILLMENT_LABELS[order.fulfillmentStatus]}
                        </span>
                        {order.cnoteNo && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Resi: {order.cnoteNo}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex min-w-24 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${risk.className}`}>
                        {risk.level === "red" && <ShieldAlert className="h-3.5 w-3.5" />}
                        {risk.label} · {order.rtsRiskScore}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {Object.entries(CRM_TEMPLATES).map(([key, item]) => {
                          const isClicked = clickedCrmButtons[order.id]?.has(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              title={item.title}
                              onClick={() => handleCrmClick(order, key)}
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-extrabold transition-colors ${
                                isClicked
                                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-400"
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          aria-label={`Lihat detail ${order.orderNumber}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    Tidak ada pesanan yang sesuai dengan status atau pencarian ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && selectedOrderRisk && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 id="order-detail-title" className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {selectedOrder.orderNumber}
                </h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{selectedOrder.createdAt}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Tutup detail pesanan"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <MapPin className="h-4 w-4" /> Pelanggan dan alamat
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedOrder) return;
                        setEditingAddressOrder(selectedOrder);
                        setEditCustomerName(selectedOrder.customerName);
                        setEditCustomerPhone(selectedOrder.customerPhone);
                        setEditShippingAddress(selectedOrder.shippingAddress);
                        setDistrictQuery("");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Pencil className="h-3 w-3" />
                      Ubah Alamat
                    </button>
                    <div className="flex items-center gap-1">
                      {Object.entries(CRM_TEMPLATES).map(([key, item]) => {
                        const isClicked = clickedCrmButtons[selectedOrder.id]?.has(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            title={item.title}
                            onClick={() => handleCrmClick(selectedOrder, key)}
                            className={`inline-flex h-7 px-2 items-center justify-center rounded-md text-[11px] font-extrabold transition-colors ${
                              isClicked
                                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-400"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                  <p className="mb-0.5 text-base font-bold text-slate-900 dark:text-slate-100">{selectedOrder.customerName}</p>
                  <p className="mb-3 font-mono text-xs text-slate-600 dark:text-slate-400">{selectedOrder.customerPhone}</p>
                  <p className="border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:text-slate-300">
                    {selectedOrder.shippingAddress}
                  </p>
                </div>
              </section>
              <section>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <CreditCard className="h-4 w-4" /> Pembayaran dan kurir
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-800">
                    <p className="mb-1 text-[11px] font-medium text-slate-400">Metode pembayaran</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedOrder.paymentMethod}</p>
                    <span className="mt-2 inline-block rounded border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {selectedOrder.paymentStatus === "PAID" ? "Lunas" : "Belum dibayar"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-800">
                    <p className="mb-1 text-[11px] font-medium text-slate-400">Ekspedisi</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedOrder.courierCode ?? "Belum ditentukan"}</p>
                    <p className="mt-2 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedOrder.cnoteNo ?? "Resi belum tersedia"}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <ShieldAlert className="h-4 w-4" /> Analisis risiko RTS
                </h3>
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tingkat risiko gagal COD</span>
                    <span className={`rounded-full border px-2 py-1 text-xs font-extrabold ${selectedOrderRisk.className}`}>
                      {selectedOrderRisk.label} · {selectedOrder.rtsRiskScore}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${selectedOrderRisk.barClassName}`}
                      style={{ width: `${selectedOrder.rtsRiskScore}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedOrderRisk.advice}
                  </p>
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-2.5 border-t border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              {selectedOrder.fulfillmentStatus === "UNFULFILLED" ? (
                <button
                  type="button"
                  onClick={() => handleDispatchMengantar(selectedOrder.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-indigo-700"
                >
                  <Truck className="h-4 w-4" />
                  Daftarkan resi Mengantar ({selectedOrder.courierCode ?? "JNE"})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => showNotification("Label pengiriman berhasil dikirim ke printer.")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  <Printer className="h-4 w-4" />
                  Cetak label pengiriman{selectedOrder.cnoteNo ? ` (${selectedOrder.cnoteNo})` : ""}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {editingAddressOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (!editingAddressOrder) return;
              const updatedAddress = editShippingAddress.trim();
              const updatedOrders = orders.map((o) =>
                o.id === editingAddressOrder.id
                  ? {
                      ...o,
                      customerName: editCustomerName.trim(),
                      customerPhone: editCustomerPhone.trim(),
                      shippingAddress: updatedAddress,
                      rtsRiskScore: Math.max(5, Math.floor(o.rtsRiskScore * 0.8)),
                    }
                  : o,
              );
              setOrders(updatedOrders);
              if (selectedOrder && selectedOrder.id === editingAddressOrder.id) {
                setSelectedOrder({
                  ...selectedOrder,
                  customerName: editCustomerName.trim(),
                  customerPhone: editCustomerPhone.trim(),
                  shippingAddress: updatedAddress,
                  rtsRiskScore: Math.max(5, Math.floor(selectedOrder.rtsRiskScore * 0.8)),
                });
              }
              setEditingAddressOrder(null);
              showNotification(`Alamat pengiriman ${editingAddressOrder.orderNumber} berhasil diperbarui.`);
            }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Ubah Alamat & Kecamatan Pelanggan</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pesanan {editingAddressOrder.orderNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAddressOrder(null)}
                aria-label="Tutup modal ubah alamat"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block space-y-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Nama Pelanggan</span>
                <input
                  required
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <label className="block space-y-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Nomor WhatsApp</span>
                <input
                  required
                  value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>

              <div className="relative space-y-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Cari & Otomatis Isi Kecamatan</span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Ketik nama kecamatan/kota (contoh: Kebayoran Baru, Coblong)..."
                    value={districtQuery}
                    onChange={(e) => {
                      setDistrictQuery(e.target.value);
                      setShowDistrictSuggestions(true);
                    }}
                    onFocus={() => setShowDistrictSuggestions(true)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                {showDistrictSuggestions && districtSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    {districtSuggestions.map((d) => (
                      <button
                        key={`${d.name}-${d.postalCode}`}
                        type="button"
                        onClick={() => {
                          setEditShippingAddress((prev) => {
                            const suffix = `${d.name}, ${d.city}, ${d.province} ${d.postalCode}`;
                            return prev ? `${prev.split(",")[0]}, ${suffix}` : suffix;
                          });
                          setDistrictQuery(`${d.name}, ${d.city}`);
                          setShowDistrictSuggestions(false);
                        }}
                        className="flex w-full flex-col text-left rounded-lg p-2.5 transition-colors hover:bg-indigo-50 dark:hover:bg-slate-700"
                      >
                        <span className="font-bold text-slate-900 dark:text-slate-100">{d.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{d.city}, {d.province} · {d.postalCode}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="block space-y-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Alamat Lengkap (Jalan, RT/RW, Kecamatan, Kota)</span>
                <textarea
                  required
                  rows={3}
                  value={editShippingAddress}
                  onChange={(e) => setEditShippingAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 p-5 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingAddressOrder(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
              >
                Simpan Alamat
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
