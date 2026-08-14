"use client";

import React, { useState } from "react";
import { MessageSquare, Save, Settings2, Sparkles, Send } from "lucide-react";

type TemplateType = "ORDER_CONFIRMATION" | "SHIPPING_UPDATE" | "PAYMENT_REMINDER";

interface Template {
  type: TemplateType;
  label: string;
  content: string;
  enabled: boolean;
}

export default function CRMSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState<Record<TemplateType, Template>>({
    ORDER_CONFIRMATION: {
      type: "ORDER_CONFIRMATION",
      label: "Order Confirmation (COD)",
      content: "Halo {{customer_name}}, terima kasih telah berbelanja di toko kami! Pesanan Anda dengan nomor {{order_id}} sejumlah {{total_amount}} sedang kami proses dengan metode COD. Mohon siapkan uang tunai saat kurir tiba. Terima kasih!",
      enabled: true,
    },
    SHIPPING_UPDATE: {
      type: "SHIPPING_UPDATE",
      label: "Shipping & Dispatch Update",
      content: "Halo {{customer_name}}, pesanan Anda {{order_id}} telah diserahkan ke kurir {{courier_name}} dengan nomor resi {{awb}}. Lacak pesanan Anda di: {{tracking_link}}",
      enabled: true,
    },
    PAYMENT_REMINDER: {
      type: "PAYMENT_REMINDER",
      label: "Payment Reminder (Transfer)",
      content: "Halo {{customer_name}}, ini adalah pengingat untuk pembayaran pesanan {{order_id}} sebesar {{total_amount}}. Mohon segera lakukan pembayaran agar pesanan dapat kami proses.",
      enabled: false,
    }
  });

  const [activeTab, setActiveTab] = useState<TemplateType>("ORDER_CONFIRMATION");

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 600);
  };

  const handleTemplateChange = (val: string) => {
    setTemplates({
      ...templates,
      [activeTab]: {
        ...templates[activeTab],
        content: val
      }
    });
  };

  const toggleEnabled = () => {
    setTemplates({
      ...templates,
      [activeTab]: {
        ...templates[activeTab],
        enabled: !templates[activeTab].enabled
      }
    });
  };

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <MessageSquare className="h-4 w-4" /> Messaging Automations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">WhatsApp CRM Templates</h1>
          <p className="mt-1 text-sm text-slate-500">Automate customer communication via WhatsApp integration.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? "Saving..." : "Save Templates"}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="md:col-span-1 space-y-2">
          {Object.values(templates).map((tpl) => (
            <button
              key={tpl.type}
              onClick={() => setActiveTab(tpl.type)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between outline-none focus:ring-4 focus:ring-indigo-500/20 ${
                activeTab === tpl.type 
                  ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{tpl.label}</span>
              <div className={`w-2.5 h-2.5 rounded-full ${tpl.enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Settings2 className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-bold text-slate-800">{templates[activeTab].label}</h2>
            </div>
            
            <label className="flex items-center cursor-pointer space-x-3">
              <span className="text-sm font-semibold text-slate-700">
                {templates[activeTab].enabled ? "Active" : "Inactive"}
              </span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={templates[activeTab].enabled}
                  onChange={toggleEnabled}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>
          </div>

          <div className="p-6 flex-1 flex flex-col space-y-5">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-700 block mb-2">Message Content</label>
              <textarea
                value={templates[activeTab].content}
                onChange={(e) => handleTemplateChange(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 leading-relaxed"
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Available Variables
              </h3>
              <div className="flex flex-wrap gap-2">
                {["{{customer_name}}", "{{order_id}}", "{{total_amount}}", "{{courier_name}}", "{{awb}}", "{{tracking_link}}"].map((v) => (
                  <button 
                    key={v}
                    onClick={() => handleTemplateChange(templates[activeTab].content + ` ${v}`)}
                    className="text-xs font-mono bg-white border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-md hover:border-indigo-300 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">Click a variable to insert it into the message.</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500 italic">Messages are dispatched via the connected WhatsApp API.</p>
            <button className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-slate-500/20">
              <Send className="w-4 h-4" />
              <span>Send Test Message</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
