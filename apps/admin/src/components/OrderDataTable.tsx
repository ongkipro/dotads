"use client";

import React, { useState } from "react";
import { 
  Search, 
  Eye, 
  MapPin, 
  Truck, 
  CreditCard, 
  ShieldAlert, 
  X, 
  ChevronRight, 
  PackageCheck,
  Download,
  MessageSquare,
  Printer,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalMinor: number;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  cnoteNo?: string;
  courierCode?: string;
  rtsRiskScore?: number;
  createdAt: string;
}

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
    courierCode: "JNE",
    rtsRiskScore: 12,
    createdAt: "2026-08-14 10:15",
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
    cnoteNo: "MNTR-8899211",
    courierCode: "SICEPAT",
    rtsRiskScore: 5,
    createdAt: "2026-08-14 09:30",
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
    fulfillmentStatus: "UNFULFILLED",
    courierCode: "J&T",
    rtsRiskScore: 68,
    createdAt: "2026-08-14 08:45",
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
    fulfillmentStatus: "PICKUP_REQUESTED",
    cnoteNo: "MNTR-8899212",
    courierCode: "SAP",
    rtsRiskScore: 2,
    createdAt: "2026-08-14 07:15",
  },
  {
    id: "ord_1005",
    orderNumber: "ORD_991025",
    customerName: "Digital Buyer",
    customerPhone: "08111222333",
    shippingAddress: "Digital Assets Download via Email / WA Instant",
    totalMinor: 99000,
    paymentMethod: "QRIS AutoLaris",
    paymentStatus: "PAID",
    fulfillmentStatus: "DELIVERED",
    createdAt: "2026-08-14 06:10",
  }
];

export function OrderDataTable() {
  const [orders, setOrders] = useState<OrderRow[]>(SAMPLE_ORDERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);

    const matchesStatus =
      selectedStatus === "ALL" ||
      order.paymentStatus === selectedStatus ||
      order.fulfillmentStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = "No Pesanan,Nama Pelanggan,No HP,Alamat,Total (Rp),Metode Bayar,Status Bayar,Status Pengiriman,Resi,Waktu\n";
    const rows = filteredOrders.map(o => 
      `"${o.orderNumber}","${o.customerName}","${o.customerPhone}","${o.shippingAddress.replace(/"/g, '""')}",${o.totalMinor},"${o.paymentMethod}","${o.paymentStatus}","${o.fulfillmentStatus}","${o.cnoteNo || ''}","${o.createdAt}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Data_Pesanan_DotAds_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Data pesanan berhasil di-export ke berkas CSV!");
  };

  const handleDispatchMengantar = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const generatedWaybill = `MNTR-${Math.floor(1000000 + Math.random() * 9000000)}`;
          return {
            ...o,
            fulfillmentStatus: "PICKUP_REQUESTED",
            cnoteNo: generatedWaybill,
          };
        }
        return o;
      })
    );
    
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              fulfillmentStatus: "PICKUP_REQUESTED",
              cnoteNo: `MNTR-${Math.floor(1000000 + Math.random() * 9000000)}`,
            }
          : null
      );
    }

    showNotification("Pesanan berhasil didaftarkan ke Ekspedisi Mengantar!");
  };

  const handleOpenWhatsApp = (phone: string, orderNo: string, name: string) => {
    const cleanPhone = phone.replace(/^0/, "62");
    const msg = encodeURIComponent(`Halo Kak ${name}, terima kasih telah memesan di toko kami (No. Pesanan: ${orderNo}). Kami ingin konfirmasi pesanan Anda.`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Data Table Wrapper */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Kelola Pesanan E-Commerce</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Buku kas transaksi COD & Payment Gateway real-time</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari pesanan, nama, HP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Status Filter Dropdown */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-auto text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="PAID">Lunas (Paid)</option>
                <option value="UNPAID">Belum Bayar (COD)</option>
                <option value="DELIVERED">Terkirim</option>
                <option value="UNFULFILLED">Belum Diproses</option>
              </select>

              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-2 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">No. Pesanan</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Total Transaksi</th>
                <th className="py-3.5 px-4">Pembayaran</th>
                <th className="py-3.5 px-4">Status Pengiriman</th>
                <th className="py-3.5 px-4">Risiko RTS</th>
                <th className="py-3.5 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4">
                      <span 
                        onClick={() => setSelectedOrder(order)}
                        className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline cursor-pointer"
                      >
                        {order.orderNumber}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">{order.createdAt}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{order.customerName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{order.customerPhone}</p>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-slate-100">
                      Rp {order.totalMinor.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border font-bold ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {order.paymentStatus === "PAID" ? "Lunas" : "Belum Bayar (COD)"}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {order.paymentMethod}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {order.fulfillmentStatus === "DELIVERED" ? (
                            <PackageCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Truck className="w-3.5 h-3.5 text-indigo-500" />
                          )}
                          {order.fulfillmentStatus}
                        </span>
                        {order.cnoteNo && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            Resi: {order.cnoteNo}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          (order.rtsRiskScore || 0) > 50 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {(order.rtsRiskScore || 0) > 50 && <ShieldAlert className="w-3.5 h-3.5" />}
                        {order.rtsRiskScore}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                        title="Lihat Detail Pesanan"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada pesanan yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Drawer Detail View */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <div>
                <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">{selectedOrder.orderNumber}</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{selectedOrder.createdAt}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Section */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <MapPin className="w-4 h-4" /> Detail Pelanggan & Alamat
                  </h4>
                  <button
                    onClick={() => handleOpenWhatsApp(selectedOrder.customerPhone, selectedOrder.orderNumber, selectedOrder.customerName)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat WA
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-base mb-0.5">{selectedOrder.customerName}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mb-3">{selectedOrder.customerPhone}</p>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{selectedOrder.shippingAddress}</p>
                  </div>
                </div>
              </section>

              {/* Payment Section */}
              <section>
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  <CreditCard className="w-4 h-4" /> Pembayaran & Kurir
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
                    <p className="text-[11px] font-medium text-slate-400 mb-1">Metode Bayar</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedOrder.paymentMethod}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] border font-bold ${
                      selectedOrder.paymentStatus === "PAID" 
                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200" 
                        : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200"
                    }`}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
                    <p className="text-[11px] font-medium text-slate-400 mb-1">Ekspedisi</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedOrder.courierCode || "N/A"}</p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-2 truncate" title={selectedOrder.cnoteNo}>
                      {selectedOrder.cnoteNo || "Belum terbit resi"}
                    </p>
                  </div>
                </div>
              </section>

              {/* RTS Risk Assessment Section */}
              <section>
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  <ShieldAlert className="w-4 h-4" /> Skor Analisis RTS Risk
                </h4>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tingkat Risiko Gagal COD</span>
                    <span className={`font-extrabold text-base ${
                      (selectedOrder.rtsRiskScore || 0) > 50 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {selectedOrder.rtsRiskScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (selectedOrder.rtsRiskScore || 0) > 50 ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${selectedOrder.rtsRiskScore || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    {(selectedOrder.rtsRiskScore || 0) > 50 
                      ? "⚠️ Risiko tinggi barang retur (RTS). Disarankan konfirmasi alamat via WA terlebih dahulu." 
                      : "✅ Risiko rendah. Pelanggan memiliki riwayat penerimaan paket baik."}
                  </p>
                </div>
              </section>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2.5">
              {selectedOrder.fulfillmentStatus === "UNFULFILLED" ? (
                <button 
                  onClick={() => handleDispatchMengantar(selectedOrder.id)}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all text-xs"
                >
                  <Truck className="w-4 h-4" />
                  Daftarkan Resi Mengantar ({selectedOrder.courierCode || "JNE"})
                </button>
              ) : (
                <button 
                  onClick={() => showNotification("Cetak label pengiriman berhasil dikirim ke printer!")}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all text-xs"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Label Resi Mengantar ({selectedOrder.cnoteNo})
                </button>
              )}

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl transition-colors text-xs"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
