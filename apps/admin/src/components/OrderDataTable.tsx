"use client";

import React, { useState } from "react";
import { Search, Eye, MapPin, Truck, CreditCard, ShieldAlert, X, ChevronRight, PackageCheck } from "lucide-react";

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
    shippingAddress: "Jl. Sudirman No. 45, Jakarta Selatan",
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
    shippingAddress: "Jl. Pemuda No. 12, Surabaya",
    totalMinor: 150000,
    paymentMethod: "QRIS",
    paymentStatus: "PAID",
    fulfillmentStatus: "DELIVERED",
    cnoteNo: "MNG-8899211",
    courierCode: "SICEPAT",
    rtsRiskScore: 5,
    createdAt: "2026-08-14 09:30",
  },
  {
    id: "ord_1003",
    orderNumber: "ORD_991023",
    customerName: "Agus Pratama",
    customerPhone: "082199887766",
    shippingAddress: "Gg. Mawar No. 3, Bandung",
    totalMinor: 320000,
    paymentMethod: "COD",
    paymentStatus: "UNPAID",
    fulfillmentStatus: "UNFULFILLED",
    courierCode: "JNT",
    rtsRiskScore: 68,
    createdAt: "2026-08-14 08:45",
  },
  {
    id: "ord_1004",
    orderNumber: "ORD_991024",
    customerName: "Rina Kusuma",
    customerPhone: "081999888777",
    shippingAddress: "Jl. Merdeka No. 8, Medan",
    totalMinor: 450000,
    paymentMethod: "Bank Transfer",
    paymentStatus: "PAID",
    fulfillmentStatus: "PICKUP_REQUESTED",
    cnoteNo: "MNG-8899212",
    courierCode: "NINJA",
    rtsRiskScore: 2,
    createdAt: "2026-08-14 07:15",
  },
  {
    id: "ord_1005",
    orderNumber: "ORD_991025",
    customerName: "Digital Buyer",
    customerPhone: "08111222333",
    shippingAddress: "Digital Delivery via Email",
    totalMinor: 99000,
    paymentMethod: "E-Wallet",
    paymentStatus: "PAID",
    fulfillmentStatus: "DELIVERED",
    createdAt: "2026-08-14 06:10",
  }
];
export function OrderDataTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);

  const filteredOrders = SAMPLE_ORDERS.filter((order) => {
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Orders Management</h2>
            <p className="text-sm text-slate-500 mt-1">Real-time COD & Paid transactions ledger</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order, customer, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow bg-slate-50 hover:bg-white focus:bg-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto text-sm border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:bg-white cursor-pointer transition-shadow"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid (COD)</option>
              <option value="DELIVERED">Delivered</option>
              <option value="UNFULFILLED">Unfulfilled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dense Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <th className="py-4 px-5">Order Number</th>
              <th className="py-4 px-5">Customer</th>
              <th className="py-4 px-5">Total Amount</th>
              <th className="py-4 px-5">Payment</th>
              <th className="py-4 px-5">Fulfillment</th>
              <th className="py-4 px-5">RTS Risk</th>
              <th className="py-4 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-5">
                    <span className="font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors cursor-pointer">
                      {order.orderNumber}
                    </span>
                    <div className="text-xs text-slate-400 mt-0.5">{order.createdAt}</div>
                  </td>
                  <td className="py-4 px-5">
                    <p className="font-semibold text-slate-900">{order.customerName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{order.customerPhone}</p>
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-900">
                    Rp {order.totalMinor.toLocaleString("id-ID")}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] border font-bold ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {order.paymentMethod}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium text-sm bg-slate-100 px-2.5 py-1 rounded-md">
                      {order.fulfillmentStatus === "DELIVERED" ? (
                        <PackageCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Truck className="w-4 h-4 text-slate-500" />
                      )}
                      {order.fulfillmentStatus}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        (order.rtsRiskScore || 0) > 50 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {(order.rtsRiskScore || 0) > 50 && <ShieldAlert className="w-3.5 h-3.5" />}
                      {order.rtsRiskScore}%
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No orders found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Side Drawer Detail View */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-xl text-slate-900">{selectedOrder.orderNumber}</h3>
                <p className="text-sm text-slate-500">{selectedOrder.createdAt}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Customer Section */}
              <section>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  <MapPin className="w-4 h-4" /> Customer Details
                </h4>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="font-bold text-slate-900 text-lg mb-1">{selectedOrder.customerName}</p>
                  <p className="text-slate-600 font-medium mb-3">{selectedOrder.customerPhone}</p>
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedOrder.shippingAddress}</p>
                  </div>
                </div>
              </section>

              {/* Payment Section */}
              <section>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  <CreditCard className="w-4 h-4" /> Payment & Courier
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 mb-1">Method</p>
                    <p className="font-bold text-slate-900">{selectedOrder.paymentMethod}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] border font-bold ${
                      selectedOrder.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500 mb-1">Courier</p>
                    <p className="font-bold text-slate-900">{selectedOrder.courierCode || "N/A"}</p>
                    <p className="text-xs text-slate-500 mt-2 truncate" title={selectedOrder.cnoteNo}>
                      {selectedOrder.cnoteNo || "No waybill yet"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Actions Section */}
              <section>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  <Truck className="w-4 h-4" /> Fulfillment Actions
                </h4>
                <div className="flex flex-col gap-3">
                  {selectedOrder.fulfillmentStatus === "UNFULFILLED" && selectedOrder.courierCode && (
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm">
                      <Truck className="w-4 h-4" /> Dispatch to Mengantar ({selectedOrder.courierCode})
                    </button>
                  )}
                  {selectedOrder.cnoteNo && (
                    <button className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm">
                      Print Shipping Label
                    </button>
                  )}
                  {!selectedOrder.courierCode && selectedOrder.fulfillmentStatus === "UNFULFILLED" && (
                    <button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm">
                      Mark as Fulfilled (Digital/Manual)
                    </button>
                  )}
                </div>
              </section>

              {/* RTS Risk Section */}
              <section>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  <ShieldAlert className="w-4 h-4" /> Receiver RTS Risk
                </h4>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700">Assessment Score</span>
                    <span className={`font-black text-lg ${
                      (selectedOrder.rtsRiskScore || 0) > 50 ? "text-rose-600" : "text-emerald-600"
                    }`}>
                      {selectedOrder.rtsRiskScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (selectedOrder.rtsRiskScore || 0) > 50 ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${selectedOrder.rtsRiskScore || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    {(selectedOrder.rtsRiskScore || 0) > 50 
                      ? "High risk of Return to Sender. Consider confirming via WhatsApp." 
                      : "Low risk. Customer has good delivery history."}
                  </p>
                </div>
              </section>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-100 bg-white flex flex-col gap-3">
              <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                Dispatch to Mengantar
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl border border-slate-200 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
