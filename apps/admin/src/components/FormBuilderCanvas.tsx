"use client";

import React, { useState } from "react";
import { Plus, Trash2, Smartphone, Save, Check } from "lucide-react";

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
}

export function FormBuilderCanvas() {
  const [mode, setMode] = useState<"hybrid" | "full" | "mini">("hybrid");
  const [fields, setFields] = useState<FormField[]>([
    { id: "f1", type: "text", label: "Nama Lengkap", placeholder: "Budi Santoso", required: true },
    { id: "f2", type: "phone", label: "Nomor WhatsApp", placeholder: "081234567890", required: true },
    { id: "f3", type: "address_autocomplete", label: "Kecamatan & Alamat Pengiriman", required: true },
  ]);
  const [saved, setSaved] = useState(false);

  const addField = () => {
    const newField: FormField = {
      id: `f_${Date.now()}`,
      type: "text",
      label: "New Input Field",
      required: false,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Settings & Canvas Editor */}
      <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Form Builder Canvas</h2>
            <p className="text-xs text-slate-500">Configure single-page direct response checkout form</p>
          </div>

          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded transition-colors"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saved ? "Saved" : "Save Version"}</span>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 mb-2">Form Integration Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {(["hybrid", "full", "mini"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-2 px-3 rounded text-xs font-semibold border transition-all ${
                  mode === m
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {m.toUpperCase()} MODE
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {mode === "hybrid"
              ? "Hybrid Mode: Step 1 Mini Form (Name+Phone) -> Step 2 Full Checkout (Address+Payment)."
              : mode === "full"
              ? "Full Mode: All fields visible immediately on page load."
              : "Mini Mode: Fast 2-input WhatsApp lead capture."}
          </p>
        </div>

        {/* Fields List */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">Form Fields Sequence</label>
          {fields.map((field, idx) => (
            <div key={field.id} className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
              <input
                type="text"
                value={field.label}
                onChange={(e) => {
                  const updated = [...fields];
                  updated[idx].label = e.target.value;
                  setFields(updated);
                }}
                className="flex-1 text-xs bg-white border border-slate-200 rounded px-2.5 py-1 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={field.type}
                onChange={(e) => {
                  const updated = [...fields];
                  updated[idx].type = e.target.value;
                  setFields(updated);
                }}
                className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700"
              >
                <option value="text">Text Input</option>
                <option value="phone">Phone (WhatsApp)</option>
                <option value="address_autocomplete">Kecamatan Autocomplete</option>
                <option value="select">Dropdown Select</option>
              </select>
              <button
                onClick={() => removeField(field.id)}
                className="text-rose-500 hover:text-rose-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={addField}
            className="w-full py-2 border-2 border-dashed border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center space-x-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Form Field</span>
          </button>
        </div>
      </div>

      {/* Mobile Live Preview */}
      <div className="bg-slate-900 rounded-2xl p-4 shadow-xl flex flex-col items-center">
        <div className="flex items-center space-x-2 text-slate-400 mb-3 text-xs font-semibold">
          <Smartphone className="w-4 h-4" />
          <span>Live Storefront Preview</span>
        </div>

        <div className="w-full max-w-[280px] bg-white rounded-xl p-4 text-slate-900 shadow-inner space-y-3 text-xs">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-sm text-indigo-900">Order Form Preview</h4>
            <p className="text-[10px] text-slate-400">Mode: {mode.toUpperCase()}</p>
          </div>

          {fields.map((f) => (
            <div key={f.id} className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">{f.label}</label>
              <input
                type="text"
                placeholder={f.placeholder || `Masukkan ${f.label}`}
                disabled
                className="w-full border border-slate-200 rounded px-2 py-1 text-[11px] bg-slate-50 cursor-not-allowed"
              />
            </div>
          ))}

          <button className="w-full bg-indigo-600 text-white font-bold py-2 rounded text-xs mt-2 shadow-xs">
            Beli Sekarang (COD)
          </button>
        </div>
      </div>
    </div>
  );
}
