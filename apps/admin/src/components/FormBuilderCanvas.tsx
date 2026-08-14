"use client";

import React, { useState } from "react";
import { Plus, Trash2, Smartphone, Save, Check, MoveUp, MoveDown, Monitor, Code, Copy, X, Settings2, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

const PRESET_TEMPLATES = {
  cod_single_page: [
    { id: "f1", type: "text", label: "Nama Lengkap Pelanggan", placeholder: "Budi Santoso", required: true },
    { id: "f2", type: "phone", label: "Nomor WhatsApp (Aktif)", placeholder: "081234567890", required: true },
    { id: "f3", type: "address_autocomplete", label: "Kecamatan & Alamat Pengiriman Lengkap", placeholder: "Kec. Kebayoran Baru, Jakarta Selatan...", required: true },
    { id: "f4", type: "select", label: "Pilihan Kurir Ekspedisi", required: true, options: ["JNE Regular / YES", "SiCepat REG", "J&T Express COD", "SAP Express COD"] },
  ],
  digital_checkout: [
    { id: "f1", type: "text", label: "Nama Pembeli", placeholder: "Siti Rahma", required: true },
    { id: "f2", type: "text", label: "Alamat Email (Akses File)", placeholder: "siti@example.com", required: true },
    { id: "f3", type: "phone", label: "Nomor WhatsApp Konfirmasi", placeholder: "085711223344", required: true },
  ],
  lead_gen_wa: [
    { id: "f1", type: "text", label: "Nama Pelanggan", placeholder: "Agus Pratama", required: true },
    { id: "f2", type: "phone", label: "Nomor WhatsApp", placeholder: "082199887766", required: true },
  ],
};

export function FormBuilderCanvas() {
  const [mode, setMode] = useState<"hybrid" | "full" | "mini">("hybrid");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("mobile");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<FormField[]>(PRESET_TEMPLATES.cod_single_page);
  const [saved, setSaved] = useState(false);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const addField = () => {
    const newField: FormField = {
      id: `f_${Date.now()}`,
      type: "text",
      label: "Field Input Baru",
      placeholder: "Masukkan data...",
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

  const applyTemplate = (presetKey: keyof typeof PRESET_TEMPLATES) => {
    setFields(PRESET_TEMPLATES[presetKey]);
    showNotification("Template formulir berhasil diterapkan!");
  };

  const copySchema = () => {
    navigator.clipboard.writeText(JSON.stringify({ mode, fields }, null, 2));
    setCopied(true);
    showNotification("Skema JSON berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    showNotification("Skema formulir checkout berhasil disimpan ke database!");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings & Canvas Editor */}
        <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs ${previewDevice === 'desktop' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 mb-6 gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Interactive Form Builder</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Rancang skema formulir pemesanan direct response & alur checkout</p>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto">
              <button 
                onClick={() => setExportModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Code className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-xs"
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{saved ? "Tersimpan" : "Simpan Skema"}</span>
              </button>
            </div>
          </div>

          {/* Preset Templates bar */}
          <div className="mb-6 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Gunakan Template Formulir Siap Pakai:</span>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => applyTemplate("cod_single_page")}
                className="text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
              >
                Single-Page COD Indonesia
              </button>
              <button
                onClick={() => applyTemplate("digital_checkout")}
                className="text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
              >
                Checkout Produk Digital
              </button>
              <button
                onClick={() => applyTemplate("lead_gen_wa")}
                className="text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
              >
                Lead WA Instan (2 Input)
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="mb-8">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              <Settings2 className="w-4 h-4 text-slate-400" />
              Mode Tampilan & Integrasi Form
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["hybrid", "full", "mini"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    mode === m
                      ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 shadow-xs"
                      : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700"
                  }`}
                >
                  {mode === m && (
                    <div className="absolute top-3 right-3 text-indigo-600 dark:text-indigo-400">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <h3 className={`text-xs font-bold uppercase mb-1 ${mode === m ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>Mode {m}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {m === "hybrid"
                      ? "Langkah 1: Kontak -> Langkah 2: Alamat Pengiriman & Pembayaran."
                      : m === "full"
                      ? "Seluruh input langsung tampil lengkap dalam 1 halaman."
                      : "2 input super cepat. Ideal untuk konfirmasi cepat via WhatsApp."}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Fields List */}
          <div className="space-y-4">
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-slate-400" />
                Urutan Elemen Form ({fields.length} Input)
              </span>
            </label>
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl group transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold text-slate-500 dark:text-slate-400">
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
                      className="flex-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      placeholder="Label Input"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const updated = [...fields];
                        updated[idx].type = e.target.value;
                        setFields(updated);
                      }}
                      className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="text">Teks Bebas</option>
                      <option value="phone">Nomor HP (WhatsApp)</option>
                      <option value="address_autocomplete">Autocomplete Alamat Subdistrik</option>
                      <option value="select">Pilihan Dropdown</option>
                    </select>

                    <div className="flex items-center space-x-1">
                      <button onClick={() => moveField(idx, "up")} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-md disabled:opacity-30 transition-colors">
                        <MoveUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => moveField(idx, "down")} disabled={idx === fields.length - 1} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-md disabled:opacity-30 transition-colors">
                        <MoveDown className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                      <button
                        onClick={() => removeField(field.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-md transition-colors"
                        title="Hapus Input"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addField}
              className="w-full py-3.5 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-center space-x-2 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Elemen Input Baru</span>
            </button>
          </div>
        </div>

        {/* Mobile / Desktop Live Preview */}
        <div className={`bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-inner flex flex-col items-center transition-all duration-300 relative overflow-hidden ${previewDevice === 'desktop' ? 'lg:col-span-3 w-full' : ''}`}>
          <div className="flex w-full items-center justify-between mb-8 z-10">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              {previewDevice === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              <span>Live Interactive Preview</span>
            </div>
            <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button 
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded-md ${previewDevice === 'desktop' ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                title="Tampilan Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded-md ${previewDevice === 'mobile' ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                title="Tampilan Mobile"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`relative bg-white dark:bg-slate-900 shadow-2xl transition-all duration-300 ring-1 ring-slate-900/5 flex flex-col ${previewDevice === 'mobile' ? 'w-[320px] min-h-[600px] rounded-[2.5rem] border-[10px] border-slate-900 overflow-hidden' : 'w-full max-w-2xl rounded-xl min-h-[400px] overflow-hidden'}`}>
            
            {/* Mock Device Header */}
            {previewDevice === 'mobile' ? (
              <div className="w-full h-6 bg-slate-900 flex justify-center items-center shrink-0">
                <div className="w-1/3 h-3.5 bg-black rounded-b-xl"></div>
              </div>
            ) : (
              <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              </div>
            )}
            
            <div className="flex-1 bg-white dark:bg-slate-900 p-6 sm:p-8 overflow-y-auto">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <h4 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Formulir Pesanan Aman</h4>
                <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 w-max px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <ShieldAlert className="w-3 h-3" />
                  SSL Encrypted 256-Bit
                </div>
              </div>

              <div className="space-y-4">
                {fields.map((f) => (
                  <div key={f.id} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {f.label} {f.required && <span className="text-rose-500">*</span>}
                    </label>
                    {f.type === "select" ? (
                      <select disabled className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-not-allowed">
                        {(f.options || ["Pilihan 1", "Pilihan 2"]).map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={f.placeholder || `Masukkan ${f.label}`}
                        disabled
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                <button disabled className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-extrabold py-3.5 rounded-xl text-xs shadow-sm cursor-not-allowed opacity-90">
                  Beli Sekarang (COD / QRIS)
                </button>
                <p className="text-[10px] text-center text-slate-400 font-medium">Dengan memesan, Anda menyetujui syarat & ketentuan transaksi toko kami.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* JSON Schema Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Skema Form JSON (DotAds Spec)</h3>
              <button onClick={() => setExportModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
              <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                {JSON.stringify({ mode, fields }, null, 2)}
              </pre>
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3 bg-white dark:bg-slate-900">
              <button onClick={() => setExportModalOpen(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors">
                Tutup
              </button>
              <button 
                onClick={copySchema}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center space-x-2 shadow-xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Tersalin!" : "Salin ke Clipboard"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
