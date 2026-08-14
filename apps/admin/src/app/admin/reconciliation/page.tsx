"use client";

import React, { useState } from "react";
import { 
  Receipt, 
  ArrowRightLeft, 
  Search, 
  Download, 
  Filter, 
  CreditCard, 
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";

type Tab = "autolaris" | "mengantar";

export default function ReconciliationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("autolaris");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Finance Reconciliation</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Track and reconcile AutoLaris gateway settlements and Mengantar COD remittances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm text-sm">
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Settlement</h3>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">Rp 12.450.000</span>
          </div>
          <p className="text-xs font-medium text-amber-600 mt-2">14 transactions processing</p>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ready to Withdraw</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">Rp 34.200.000</span>
          </div>
          <p className="text-xs font-medium text-emerald-600 mt-2">Available in wallet balance</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Disputes / Holds</h3>
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">Rp 850.000</span>
          </div>
          <p className="text-xs font-medium text-rose-600 mt-2">2 COD packages pending claim</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 px-2 pt-2">
          <button
            onClick={() => setActiveTab("autolaris")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "autolaris"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            AutoLaris QRIS/VA
          </button>
          <button
            onClick={() => setActiveTab("mengantar")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "mengantar"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Truck className="w-4 h-4" />
            Mengantar COD Remittance
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search TX ID or Order No..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm text-sm">
              <Filter className="w-4 h-4 text-slate-400" />
              Filter
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {activeTab === "autolaris" ? <AutoLarisTable /> : <MengantarTable />}
        </div>
      </div>
    </div>
  );
}

function AutoLarisTable() {
  const transactions = [
    { id: "TX_AL_0991", order: "ORD_991021", date: "Aug 14, 2026 10:30", method: "QRIS", amount: "Rp 250.000", fee: "Rp 1.750", net: "Rp 248.250", status: "Settled" },
    { id: "TX_AL_0992", order: "ORD_991022", date: "Aug 14, 2026 11:15", method: "BCA VA", amount: "Rp 850.000", fee: "Rp 4.000", net: "Rp 846.000", status: "Processing" },
    { id: "TX_AL_0993", order: "ORD_991023", date: "Aug 13, 2026 15:45", method: "Mandiri VA", amount: "Rp 125.000", fee: "Rp 4.000", net: "Rp 121.000", status: "Settled" },
  ];

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
          <th className="p-4">Transaction ID</th>
          <th className="p-4">Order Ref</th>
          <th className="p-4">Date & Time</th>
          <th className="p-4">Payment Method</th>
          <th className="p-4 text-right">Gross Amount</th>
          <th className="p-4 text-right">MDR / Fee</th>
          <th className="p-4 text-right">Net Settlement</th>
          <th className="p-4">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {transactions.map((tx, i) => (
          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
            <td className="p-4 text-sm font-semibold text-slate-900">{tx.id}</td>
            <td className="p-4 text-sm font-medium text-indigo-600 hover:underline cursor-pointer">{tx.order}</td>
            <td className="p-4 text-sm font-medium text-slate-600">{tx.date}</td>
            <td className="p-4 text-sm font-medium text-slate-600">{tx.method}</td>
            <td className="p-4 text-sm font-bold text-slate-900 text-right">{tx.amount}</td>
            <td className="p-4 text-sm font-medium text-rose-600 text-right">-{tx.fee}</td>
            <td className="p-4 text-sm font-bold text-emerald-700 text-right">{tx.net}</td>
            <td className="p-4">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                tx.status === "Settled" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {tx.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MengantarTable() {
  const remittances = [
    { id: "RMT_MG_100", awb: "JNT8829103991", date: "Aug 14, 2026 09:00", courier: "J&T EZ", amount: "Rp 350.000", fee: "Rp 10.500", net: "Rp 339.500", status: "Remitted" },
    { id: "RMT_MG_101", awb: "SAP9982331122", date: "Aug 13, 2026 14:20", courier: "SAP Reguler", amount: "Rp 1.250.000", fee: "Rp 37.500", net: "Rp 1.212.500", status: "Pending" },
    { id: "RMT_MG_102", awb: "ID88910200", date: "Aug 12, 2026 16:10", courier: "ID Express", amount: "Rp 150.000", fee: "Rp 4.500", net: "Rp 145.500", status: "Remitted" },
  ];

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
          <th className="p-4">Remittance ID</th>
          <th className="p-4">AWB / Resi</th>
          <th className="p-4">Delivery Date</th>
          <th className="p-4">Courier</th>
          <th className="p-4 text-right">COD Amount</th>
          <th className="p-4 text-right">COD Fee (3%)</th>
          <th className="p-4 text-right">Net Remittance</th>
          <th className="p-4">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {remittances.map((rmt, i) => (
          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
            <td className="p-4 text-sm font-semibold text-slate-900">{rmt.id}</td>
            <td className="p-4 text-sm font-medium text-indigo-600 hover:underline cursor-pointer">{rmt.awb}</td>
            <td className="p-4 text-sm font-medium text-slate-600">{rmt.date}</td>
            <td className="p-4">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {rmt.courier}
              </span>
            </td>
            <td className="p-4 text-sm font-bold text-slate-900 text-right">{rmt.amount}</td>
            <td className="p-4 text-sm font-medium text-rose-600 text-right">-{rmt.fee}</td>
            <td className="p-4 text-sm font-bold text-emerald-700 text-right">{rmt.net}</td>
            <td className="p-4">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                rmt.status === "Remitted" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
              }`}>
                {rmt.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}