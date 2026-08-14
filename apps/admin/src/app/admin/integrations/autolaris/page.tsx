"use client";

import React, { useState } from "react";
import { CreditCard, QrCode, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";

export default function AdminAutoLarisPage() {
  const [apiSecret, setApiSecret] = useState("sandbox-autolaris-secret");
  const [qrisEnabled, setQrisEnabled] = useState(true);
  const [vaBcaEnabled, setVaBcaEnabled] = useState(true);
  const [vaMandiriEnabled, setVaMandiriEnabled] = useState(true);

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <CreditCard className="h-4 w-4" /> Payment Gateway
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">AutoLaris Pay</h1>
          <p className="mt-1 text-sm text-slate-500">Configure instant QRIS, Virtual Accounts, and server-authoritative payment reconciliation.</p>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reconciliation Rate</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">100%</p>
              <p className="mt-1 text-xs text-slate-500">HMAC SHA256 Webhook active</p>
            </div>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Gateways</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-indigo-700">QRIS & 4 VAs</p>
              <p className="mt-1 text-xs text-slate-500">BCA, Mandiri, BRI, BSI</p>
            </div>
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <CreditCard className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Auto Settled GMV</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">Rp 18.250.000</p>
              <p className="mt-1 text-xs text-slate-500">Instant QRIS confirmations</p>
            </div>
            <span className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <QrCode className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      {/* Configuration Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">AutoLaris API Credentials & Payment Methods</h2>

        <div className="space-y-4 max-w-xl">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">AutoLaris Merchant Secret Key (HMAC)</label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block pb-2">Enabled Payment Channels</label>

            <div className="space-y-4">
              <label className="relative flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50 has-[:checked]:border-indigo-200 has-[:checked]:bg-indigo-50/50">
                <div className="flex h-6 items-center">
                  <input
                    type="checkbox"
                    checked={qrisEnabled}
                    onChange={(e) => setQrisEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">QRIS Dynamic</p>
                  <p className="text-xs text-slate-500">Instant QR Code generation and settlement</p>
                </div>
              </label>

              <label className="relative flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50 has-[:checked]:border-indigo-200 has-[:checked]:bg-indigo-50/50">
                <div className="flex h-6 items-center">
                  <input
                    type="checkbox"
                    checked={vaBcaEnabled}
                    onChange={(e) => setVaBcaEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">BCA Virtual Account</p>
                  <p className="text-xs text-slate-500">Auto-verified transfers via BCA</p>
                </div>
              </label>

              <label className="relative flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50 has-[:checked]:border-indigo-200 has-[:checked]:bg-indigo-50/50">
                <div className="flex h-6 items-center">
                  <input
                    type="checkbox"
                    checked={vaMandiriEnabled}
                    onChange={(e) => setVaMandiriEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">Mandiri Virtual Account</p>
                  <p className="text-xs text-slate-500">Auto-verified transfers via Mandiri</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex justify-end">
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20">
            Save Payment Settings
          </button>
        </div>
      </div>
    </div>
  );
}
