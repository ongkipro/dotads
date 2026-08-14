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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mengantar 3PL Logistics Aggregator</h1>
        <p className="text-xs text-slate-500">Configure Indonesian courier routing (JNE, SiCepat, J&T, SAP), RTS receiver risk engine, and waybill dispatch queue</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">Environment State</span>
            <Truck className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-slate-900">{isSandbox ? "SANDBOX MODE" : "PRODUCTION LIVE"}</p>
          <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mengantar Aggregator API Connected</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">RTS Risk Score Threshold</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-amber-600">{riskThreshold}% Risk Limit</p>
          <p className="text-[11px] text-slate-400 mt-1">Flag high-RTS buyers before waybill dispatch</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">Subdistrict Cache Index</span>
            <Search className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-slate-900">7,230 Kecamatan</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">GIN Trigram Search (&lt;15ms latency)</p>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Mengantar API Credentials & Courier Preferences</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Production API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
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
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                placeholder="whsec_..."
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="sandboxToggle"
                checked={isSandbox}
                onChange={(e) => setIsSandbox(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="sandboxToggle" className="text-xs font-semibold text-slate-700">
                Enable Sandbox Mode (Overrides to https://sandbox.mengantar.com/v1)
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Default Priority Courier</label>
              <select
                value={defaultCourier}
                onChange={(e) => setDefaultCourier(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
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
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="DAILY">Daily (T+1)</option>
                <option value="WEEKLY">Weekly (Every Tuesday)</option>
                <option value="BIWEEKLY">Bi-weekly</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">RTS Risk Score Flag Limit ({riskThreshold}%)</label>
              <input
                type="range"
                min="10"
                max="90"
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Subdistrict GIN Trigram Search Demo */}
        <div className="border-t border-slate-100 pt-6 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase">Interactive GIN Trigram Address Search Preview</h3>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Type subdistrict e.g. Kebayoran..."
              value={searchDistrict}
              onChange={(e) => setSearchDistrict(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2 px-3">Kecamatan</th>
                  <th className="py-2 px-3">Kota / Kabupaten</th>
                  <th className="py-2 px-3">Provinsi</th>
                  <th className="py-2 px-3">Kode Pos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {districtResults.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">{item.subdistrictName}</td>
                    <td className="py-2 px-3 text-slate-600">{item.cityName}</td>
                    <td className="py-2 px-3 text-slate-600">{item.provinceName}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{item.postalCode}</td>
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
