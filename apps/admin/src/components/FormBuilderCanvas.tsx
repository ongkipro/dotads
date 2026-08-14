"use client";

import React, { useState } from "react";
import { Plus, Trash2, Smartphone, Save, Check, MoveUp, MoveDown, Monitor, Code, Copy, X, Settings2, ShieldAlert } from "lucide-react";

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
        <div className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm ${previewDevice === 'desktop' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Checkout Form Builder</h2>
              <p className="text-sm text-slate-500 mt-1">Configure direct response checkout fields & flow</p>
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setExportModalOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-xs"
              >
                <Code className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-xs"
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{saved ? "Saved" : "Save Version"}</span>
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="mb-8">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              <Settings2 className="w-4 h-4 text-slate-400" />
              Integration Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["hybrid", "full", "mini"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    mode === m
                      ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {mode === m && (
                    <div className="absolute top-3 right-3 text-indigo-600">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <h3 className={`text-sm font-bold capitalize mb-1 ${mode === m ? 'text-indigo-900' : 'text-slate-700'}`}>{m} Mode</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {m === "hybrid"
                      ? "Step 1: Contact -> Step 2: Shipping & Payment."
                      : m === "full"
                      ? "All fields visible immediately on page load."
                      : "Fast 2-input capture. Ideal for WhatsApp COD."}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Fields List */}
          <div className="space-y-4">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Plus className="w-4 h-4 text-slate-400" />
              Field Sequence
            </label>
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-xl group transition-colors hover:border-slate-300 hover:bg-slate-50/50">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-400 shadow-xs">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => {
                      const updated = [...fields];
                      updated[idx].label = e.target.value;
                      setFields(updated);
                    }}
                    className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs transition-shadow"
                    placeholder="Field Label"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const updated = [...fields];
                      updated[idx].type = e.target.value;
                      setFields(updated);
                    }}
                    className="w-48 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-600 font-medium focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
                  >
                    <option value="text">Text Input</option>
                    <option value="phone">Phone (WhatsApp)</option>
                    <option value="address_autocomplete">Address Autocomplete</option>
                    <option value="select">Dropdown Select</option>
                  </select>
                  <div className="flex items-center space-x-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveField(idx, "up")} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md disabled:opacity-30 transition-colors">
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveField(idx, "down")} disabled={idx === fields.length - 1} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md disabled:opacity-30 transition-colors">
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <button
                      onClick={() => removeField(field.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Remove Field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addField}
              className="w-full py-3.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center space-x-2 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Form Field</span>
            </button>
          </div>
        </div>

        {/* Mobile / Desktop Live Preview */}
        <div className={`bg-slate-100/50 pattern-dots pattern-slate-200 pattern-bg-transparent pattern-size-4 border border-slate-200 rounded-xl p-6 shadow-inner flex flex-col items-center transition-all duration-300 relative overflow-hidden ${previewDevice === 'desktop' ? 'lg:col-span-3 w-full' : ''}`}>
          <div className="flex w-full items-center justify-between mb-8 z-10">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              {previewDevice === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              <span>Live Checkout</span>
            </div>
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-xs">
              <button 
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded-md ${previewDevice === 'desktop' ? 'bg-slate-100 text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded-md ${previewDevice === 'mobile' ? 'bg-slate-100 text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`relative bg-white shadow-xl transition-all duration-300 ring-1 ring-slate-900/5 flex flex-col ${previewDevice === 'mobile' ? 'w-[320px] min-h-[600px] rounded-[2.5rem] border-[10px] border-slate-900 overflow-hidden' : 'w-full max-w-2xl rounded-xl min-h-[400px] overflow-hidden'}`}>
            
            {/* Mock Header */}
            {previewDevice === 'mobile' ? (
              <div className="w-full h-6 bg-slate-900 flex justify-center items-center shrink-0">
                <div className="w-1/3 h-3.5 bg-black rounded-b-xl"></div>
              </div>
            ) : (
              <div className="w-full h-8 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400 border border-slate-300/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-300/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-300/50"></div>
              </div>
            )}
            
            <div className="flex-1 bg-white p-6 sm:p-8 overflow-y-auto">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h4 className="font-bold text-lg text-slate-900">Secure Checkout</h4>
                <div className="flex items-center gap-1.5 mt-1 text-emerald-600 text-[11px] font-semibold bg-emerald-50 w-max px-2 py-0.5 rounded-full">
                  <ShieldAlert className="w-3 h-3" />
                  SSL Encrypted
                </div>
              </div>

              <div className="space-y-4">
                {fields.map((f) => (
                  <div key={f.id} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">{f.label} {f.required && <span className="text-rose-500">*</span>}</label>
                    <input
                      type="text"
                      placeholder={f.placeholder || `Masukkan ${f.label}`}
                      disabled
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 cursor-not-allowed shadow-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                <button disabled className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-sm shadow-sm opacity-90 cursor-not-allowed">
                  Beli Sekarang (COD)
                </button>
                <p className="text-[10px] text-center text-slate-400 font-medium">By completing this order, you agree to our terms.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* JSON Schema Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Form JSON Schema</h3>
              <button onClick={() => setExportModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-auto bg-slate-50">
              <pre className="text-sm text-slate-700 font-mono whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                {JSON.stringify({ mode, fields }, null, 2)}
              </pre>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end space-x-3 bg-white">
              <button onClick={() => setExportModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors">
                Close
              </button>
              <button 
                onClick={copySchema}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center space-x-2"
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
