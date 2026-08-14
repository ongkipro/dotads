"use client";

import React, { useState } from "react";
import { Radio, ShieldCheck, CheckCircle2, RefreshCw, Layers, Send, Save, AlertCircle, PlayCircle } from "lucide-react";

export interface EventLog {
  id: string;
  eventName: string;
  platform: string;
  eventId: string;
  status: "DISPATCHED" | "FAILED" | "PENDING";
  emqScore: string;
  timestamp: string;
}

const INITIAL_LOGS: EventLog[] = [
  {
    id: "evt_101",
    eventName: "Purchase",
    platform: "Meta CAPI",
    eventId: "ord_991022_pur",
    status: "DISPATCHED",
    emqScore: "9.2/10 (High)",
    timestamp: "2026-08-14 10:15:02",
  },
  {
    id: "evt_102",
    eventName: "conversion",
    platform: "Google Ads CAPI",
    eventId: "ord_991022_gads",
    status: "DISPATCHED",
    emqScore: "8.8/10 (Enhanced Match)",
    timestamp: "2026-08-14 10:15:03",
  },
  {
    id: "evt_103",
    eventName: "CompletePayment",
    platform: "TikTok Events API",
    eventId: "ord_991022_tt",
    status: "DISPATCHED",
    emqScore: "9.0/10 (SHA256 Match)",
    timestamp: "2026-08-14 10:15:03",
  },
  {
    id: "evt_104",
    eventName: "Lead",
    platform: "Meta CAPI",
    eventId: "draft_lead_7712",
    status: "FAILED",
    emqScore: "0/10 (Network Error)",
    timestamp: "2026-08-14 09:45:18",
  },
];

export default function AdminTrackingPage() {
  const [metaPixelId, setMetaPixelId] = useState("123456789012345");
  const [metaCapiToken, setMetaCapiToken] = useState("EAAG...mock_token_alpha_dotads_v2");
  const [googleTagId, setGoogleTagId] = useState("G-ALPHA12345");
  const [tiktokPixelId, setTiktokPixelId] = useState("C123456789012345");
  const [logs, setLogs] = useState<EventLog[]>(INITIAL_LOGS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification("Pengaturan signal CAPI & Pixel berhasil disimpan!");
  };

  const handleSimulateSignal = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const newEvtId = `ord_sim_${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString().replace("T", " ").slice(0, 19);

      setLogs((prev) => [
        {
          id: `evt_${Date.now()}_1`,
          eventName: "Purchase",
          platform: "Meta CAPI",
          eventId: `${newEvtId}_meta`,
          status: "DISPATCHED",
          emqScore: "9.2/10 (Match)",
          timestamp: now,
        },
        {
          id: `evt_${Date.now()}_2`,
          eventName: "conversion",
          platform: "Google Ads CAPI",
          eventId: `${newEvtId}_gads`,
          status: "DISPATCHED",
          emqScore: "8.8/10 (Enhanced Match)",
          timestamp: now,
        },
        {
          id: `evt_${Date.now()}_3`,
          eventName: "CompletePayment",
          platform: "TikTok Events API",
          eventId: `${newEvtId}_tt`,
          status: "DISPATCHED",
          emqScore: "9.0/10 (SHA256 Match)",
          timestamp: now,
        },
        ...prev,
      ]);

      setIsSimulating(false);
      showNotification("Simulasi pengiriman signal Purchase CAPI berhasil terkirim!");
    }, 800);
  };

  const handleRetry = (id: string) => {
    setLogs((prevLogs) => 
      prevLogs.map((log) => 
        log.id === id 
          ? { ...log, status: "DISPATCHED", emqScore: "8.5/10 (Retried)", timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) }
          : log
      )
    );
    showNotification("Event berhasil dikirim ulang (Retry)!");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Pelacakan Signal Iklan Multi-Platform & Server CAPI Engine
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Konfigurasi Conversions API (CAPI) server-authoritative untuk Meta Ads, Google Ads Enhanced Conversions, & TikTok Events API v2
          </p>
        </div>

        <button
          onClick={handleSimulateSignal}
          disabled={isSimulating}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isSimulating ? "Mengirim Signal..." : "Tes Simulasi Signal CAPI"}
        </button>
      </div>

      {/* KPI Cards / EMQ Score Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Meta CAPI EMQ Score</span>
            <Radio className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">9.2 <span className="text-sm text-purple-400">/ 10</span></p>
          <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Kualitas Match Tinggi (Deduplicated)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Google Ads Signal Score</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">8.8 <span className="text-sm text-blue-400">/ 10</span></p>
          <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Enhanced Conversions Aktif</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">TikTok Events API Score</span>
            <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">9.0 <span className="text-sm text-slate-400">/ 10</span></p>
          <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SHA256 Email/Phone Match Aktif</span>
          </div>
        </div>
      </div>

      {/* Form Credentials */}
      <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
          Kredensial Pixel & Access Token CAPI
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Meta Ads */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Meta Pixel ID (Browser Pixel)</label>
              <input
                type="text"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Meta Conversions API (CAPI) Access Token</label>
              <textarea
                rows={3}
                value={metaCapiToken}
                onChange={(e) => setMetaCapiToken(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Google & TikTok */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Google Tag / Measurement ID (gtag.js / sGTM)</label>
              <input
                type="text"
                value={googleTagId}
                onChange={(e) => setGoogleTagId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">TikTok Pixel ID & Events API v2 Access Token</label>
              <input
                type="text"
                value={tiktokPixelId}
                onChange={(e) => setTiktokPixelId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-end">
          <button 
            type="submit"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Simpan Konfigurasi Signal
          </button>
        </div>
      </form>

      {/* Outbox Conversion Event Audit Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Log Aktivitas Antrean (Outbox) Conversions</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Riwayat pengiriman event real-time dengan proteksi deduplikasi `event_id`</p>
          </div>
          <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400">
            Engine Outbox Aktif
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Platform Target</th>
                <th className="py-3.5 px-4">Nama Event</th>
                <th className="py-3.5 px-4">Event ID (Deduplikasi)</th>
                <th className="py-3.5 px-4">Skor Match / EMQ</th>
                <th className="py-3.5 px-4">Status Outbox</th>
                <th className="py-3.5 px-4">Waktu Terkirim</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                    {log.platform}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 text-[11px]">
                      {log.eventName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                    {log.eventId}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    {log.emqScore}
                  </td>
                  <td className="py-3.5 px-4">
                    {log.status === "DISPATCHED" ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Terkirim
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        Gagal
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {log.status === "FAILED" && (
                      <button 
                        onClick={() => handleRetry(log.id)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 px-2 py-1 rounded-md transition-colors"
                      >
                        <PlayCircle className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
