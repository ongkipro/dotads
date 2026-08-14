"use client";

import React, { useState } from "react";
import { CreditCard, QrCode, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";

export default function AdminAutoLarisPage() {
  const [apiSecret, setApiSecret] = useState("sandbox-autolaris-secret");
  const [qrisEnabled, setQrisEnabled] = useState(true);
  const [vaBcaEnabled, setVaBcaEnabled] = useState(true);
  const [vaMandiriEnabled, setVaMandiriEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">AutoLaris Payment Gateway</h1>
        <p className="text-xs text-slate-500">Configure instant QRIS, Virtual Accounts (BCA, Mandiri, BNI, BRI), and server-authoritative payment reconciliation</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">Reconciliation Rate</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900">100% Reconciled</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Automatic HMAC SHA256 Webhook verification</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">Active Gateways</span>
            <CreditCard className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-indigo-700">QRIS & 4 VAs</p>
          <p className="text-[11px] text-slate-400 mt-1">BCA, Mandiri, BRI, BSI</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">Auto Settled GMV</span>
            <QrCode className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900">Rp 18.250.000</p>
          <p className="text-[11px] text-purple-600 font-semibold mt-1">Instant QRIS payment confirmations</p>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">AutoLaris API Credentials & Payment Methods</h2>

        <div className="space-y-4 max-w-xl">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">AutoLaris Merchant Secret Key (HMAC)</label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <label className="text-xs font-bold text-slate-900 uppercase block">Enabled Payment Channels</label>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="qrisToggle"
                checked={qrisEnabled}
                onChange={(e) => setQrisEnabled(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="qrisToggle" className="text-xs font-semibold text-slate-700">
                QRIS Instant Dynamic QR Code
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="bcaToggle"
                checked={vaBcaEnabled}
                onChange={(e) => setVaBcaEnabled(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="bcaToggle" className="text-xs font-semibold text-slate-700">
                BCA Virtual Account
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="mandiriToggle"
                checked={vaMandiriEnabled}
                onChange={(e) => setVaMandiriEnabled(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="mandiriToggle" className="text-xs font-semibold text-slate-700">
                Mandiri Virtual Account
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex justify-end">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2 rounded-md shadow-xs transition-colors">
            Save Payment Gateway Settings
          </button>
        </div>
      </div>
    </div>
  );
}
