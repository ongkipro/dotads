"use client";

import React, { useState } from "react";
import { Radio, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Layers } from "lucide-react";

export default function AdminTrackingPage() {
  const [metaPixelId, setMetaPixelId] = useState("123456789012345");
  const [metaCapiToken, setMetaCapiToken] = useState("EAAG...mock_token_alpha");
  const [googleTagId, setGoogleTagId] = useState("G-ALPHA12345");
  const [tiktokPixelId, setTiktokPixelId] = useState("C123456789012345");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Multi-Platform Tracking Signals & CAPI Engine</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Configure server-authoritative conversion outbox for Meta CAPI, Google Ads Enhanced Conversions, and TikTok Events API v2</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">Meta CAPI EMQ Score</span>
            <Radio className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-purple-700">9.3 / 10</p>
          <div className="flex items-center space-x-1 text-xs text-emerald-600 font-semibold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>High Quality Match (Deduplicated)</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">Google Ads Consent Mode</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-blue-700">v2 Compliant</p>
          <p className="text-[11px] text-slate-400 mt-1">Enhanced Conversions active (`gclid`, `gbraid`)</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-800 mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">Outbox Sync Status</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">100% Dispatched</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">0 pending events in outbox queue</p>
        </div>
      </div>

      {/* Form Credentials */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Signal Credentials Setup</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Meta Ads */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 block">Meta Pixel ID</label>
            <input
              type="text"
              value={metaPixelId}
              onChange={(e) => setMetaPixelId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />

            <label className="text-sm font-bold text-slate-700 block pt-2">Meta Conversions API (CAPI) Token</label>
            <textarea
              rows={3}
              value={metaCapiToken}
              onChange={(e) => setMetaCapiToken(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Google & TikTok */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 block">Google Tag / Conversion ID (gtag.js)</label>
            <input
              type="text"
              value={googleTagId}
              onChange={(e) => setGoogleTagId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />

            <label className="text-sm font-bold text-slate-700 block pt-2">TikTok Pixel ID / Events API v2</label>
            <input
              type="text"
              value={tiktokPixelId}
              onChange={(e) => setTiktokPixelId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex justify-end">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-xs transition-colors">
            Save Signal Configurations
          </button>
        </div>
      </div>
    </div>
  );
}
