"use client";

import React, { useState } from "react";
import { Store, Save, Settings2, ShieldCheck } from "lucide-react";

export default function StoreSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    storeName: "Alpha Store (Pro)",
    description: "Premium digital goods and fashion.",
    supportEmail: "support@alphastore.id",
    supportPhone: "6281234567890",
    currency: "IDR",
    timezone: "Asia/Jakarta",
    codEnabled: true,
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // Simulate success
    }, 600);
  };

  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <Store className="h-4 w-4" /> Global Options
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Store Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Configure your storefront identity and basic operations.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? "Saving..." : "Save Settings"}</span>
        </button>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-slate-400" />
          <h2 className="text-base font-bold text-slate-900">General Information</h2>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Store Name</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              >
                <option value="IDR">IDR (Indonesian Rupiah)</option>
                <option value="USD">USD (US Dollar)</option>
              </select>
            </div>
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block">Store Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Customer Service Email</label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">CS Phone / WhatsApp</label>
              <input
                type="tel"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              >
                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
              </select>
            </div>
          </div>
          
          <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Cash on Delivery (COD)</h3>
              <p className="text-sm text-slate-500 mt-0.5">Enable or disable COD payments across all funnels.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.codEnabled}
                onChange={(e) => setFormData({ ...formData, codEnabled: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
