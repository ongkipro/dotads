"use client";

import React, { useState } from "react";
import { Plus, Trash2, Smartphone, Save, Check, MoveUp, MoveDown, Monitor, Code, Copy, X } from "lucide-react";

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
}

export function FormBuilderCanvas() {
  const [mode, setMode] = useState<"hybrid" | "full" | "mini">("hybrid");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("mobile");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const moveField = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      const newFields = [...fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      setFields(newFields);
    } else if (direction === "down" && index < fields.length - 1) {
      const newFields = [...fields];
      [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
      setFields(newFields);
    }
  };

  const copySchema = () => {
    navigator.clipboard.writeText(JSON.stringify({ mode, fields }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings & Canvas Editor */}
        <div className={`bg-white rounded-lg border border-slate-200 p-5 shadow-xs ${previewDevice === 'desktop' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Form Builder Canvas</h2>
              <p className="text-xs text-slate-500">Configure single-page direct response checkout form</p>
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={() => setExportModalOpen(true)}
                className="inline-flex items-center space-x-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded transition-colors"
              >
                <Code className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded transition-colors"
              >
                {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saved ? "Saved" : "Save Version"}</span>
              </button>
            </div>
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
                <div className="flex items-center space-x-1">
                  <button onClick={() => moveField(idx, "up")} disabled={idx === 0} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors">
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveField(idx, "down")} disabled={idx === fields.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors">
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeField(field.id)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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

        {/* Mobile / Desktop Live Preview */}
        <div className={`bg-slate-900 rounded-2xl p-4 shadow-xl flex flex-col items-center transition-all duration-300 ${previewDevice === 'desktop' ? 'lg:col-span-3 w-full' : ''}`}>
          <div className="flex w-full items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold">
              {previewDevice === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              <span>Live Storefront Preview</span>
            </div>
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button 
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded ${previewDevice === 'desktop' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-300'}`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded ${previewDevice === 'mobile' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-300'}`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`bg-white rounded-xl p-4 text-slate-900 shadow-inner space-y-3 text-xs transition-all duration-300 ${previewDevice === 'desktop' ? 'w-full max-w-2xl' : 'w-full max-w-[280px]'}`}>
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

      {/* JSON Schema Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Form JSON Schema</h3>
              <button onClick={() => setExportModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-slate-50">
              <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap">
                {JSON.stringify({ mode, fields }, null, 2)}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-white">
              <button onClick={() => setExportModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors">
                Close
              </button>
              <button 
                onClick={copySchema}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center space-x-1.5"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}