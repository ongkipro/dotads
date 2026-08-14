"use client";

import React, { useState } from "react";
import { Truck, Search, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";

export default function AdminMengantarPage() {
  const [apiKey, setApiKey] = useState("prod-mengantar-live-key");
  const [webhookSecret, setWebhookSecret] = useState("whsec_prod_secret_key");
  const [isSandbox, setIsSandbox] = useState(false);
  const [defaultCourier, setDefaultCourier] = useState("JNE");
  const [codRemittance, setCodRemittance] = useState("WEEKLY");
  const [riskThreshold, setRiskThreshold] = useState(50);
  const [searchDistrict, setSearchDistrict] = useState("");
  const [districtResults, setDistrictResults] = useState([
    { id: 101, subdistrictName: "Kebayoran Baru", cityName: "Jakarta Selatan", provinceName: "DKI Jakarta", postalCode: "12110" },
    { id: 102, subdistrictName: "Kebon Jeruk", cityName: "Jakarta Barat", provinceName: "DKI Jakarta", postalCode: "11530" },
    { id: 103, subdistrictName: "Kebayoran Lama", cityName: "Jakarta Selatan", provinceName: "DKI Jakarta", postalCode: "12240" },
  ]);

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <Truck className="h-4 w-4" /> Logistics Aggregator
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mengantar 3PL</h1>
          <p className="mt-1 text-sm text-slate-500">Configure Indonesian courier routing, RTS receiver risk engine, and waybill dispatch queue.</p>
        </div>
      </header>

      {/* Overview Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Environment State</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{isSandbox ? "SANDBOX" : "PRODUCTION"}</p>
              <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> API Connected
              </span>
            </div>
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Truck className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">RTS Risk Score Limit</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-amber-600">{riskThreshold}%</p>
              <p className="mt-1 text-xs text-slate-500">Flag high-RTS buyers before dispatch</p>
            </div>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subdistrict Cache</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">7,230</p>
              <p className="mt-1 text-xs text-slate-500">GIN Trigram Search (&lt;15ms latency)</p>
            </div>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Search className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      {/* Configuration Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Mengantar API Credentials & Courier Preferences</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Production API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                placeholder="Bearer prod-mengantar-..."
              />
              <p className="text-[10px] text-slate-500 mt-1">Endpoint: https://api.mengantar.com/v1</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Webhook Secret</label>
              <input
                type="text"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                placeholder="whsec_..."
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <label className="relative inline-flex cursor-pointer items-center gap-3">
                <div className="relative flex h-6 w-11 items-center rounded-full bg-slate-200 transition-colors has-[:checked]:bg-indigo-600">
                  <input
                    type="checkbox"
                    id="sandboxToggle"
                    checked={isSandbox}
                    onChange={(e) => setIsSandbox(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="absolute left-[2px] h-5 w-5 rounded-full border border-slate-300 bg-white transition-all peer-checked:translate-x-full peer-checked:border-white"></div>
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  Enable Sandbox Mode (Overrides to https://sandbox.mengantar.com/v1)
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Default Priority Courier</label>
              <select
                value={defaultCourier}
                onChange={(e) => setDefaultCourier(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              >
                <option value="JNE">JNE (Reguler / YES / JTR)</option>
                <option value="SICEPAT">SiCepat (GOKIL / HALU / REG)</option>
                <option value="JNT">J&T Express (EZ / ECO)</option>
                <option value="SAP">SAP Express</option>
                <option value="NINJA">Ninja Xpress</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">COD Remittance Schedule</label>
              <select
                value={codRemittance}
                onChange={(e) => setCodRemittance(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              >
                <option value="DAILY">Daily (T+1)</option>
                <option value="WEEKLY">Weekly (Every Tuesday)</option>
                <option value="BIWEEKLY">Bi-weekly</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">RTS Risk Score Flag Limit ({riskThreshold}%)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={riskThreshold}
                  onChange={(e) => setRiskThreshold(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                />
                <span className="w-12 text-right text-sm font-bold text-slate-900">{riskThreshold}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subdistrict GIN Trigram Search Demo */}
        <div className="border-t border-slate-100 pt-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Interactive GIN Trigram Address Search Preview</h3>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Type subdistrict e.g. Kebayoran..."
              value={searchDistrict}
              onChange={(e) => setSearchDistrict(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Kecamatan</th>
                  <th className="px-5 py-3 font-semibold">Kota / Kabupaten</th>
                  <th className="px-5 py-3 font-semibold">Provinsi</th>
                  <th className="px-5 py-3 font-semibold">Kode Pos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {districtResults.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-bold text-slate-900">{item.subdistrictName}</td>
                    <td className="px-5 py-4 text-slate-600">{item.cityName}</td>
                    <td className="px-5 py-4 text-slate-600">{item.provinceName}</td>
                    <td className="px-5 py-4 font-mono text-slate-500">{item.postalCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
