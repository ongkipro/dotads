"use client";

import React, { useState } from "react";
import { Plus, Settings, Type, Image as ImageIcon, Layout, MoveUp, MoveDown, Trash2, Eye, Save, Smartphone, Monitor, Code, Check, X, Copy, CheckCircle2, GripVertical, ChevronDown } from "lucide-react";

type FieldType = "TEXT" | "TEXTAREA" | "DROPDOWN" | "RADIO" | "CHECKBOX" | "PHONE" | "EMAIL";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  isExpanded: boolean;
}

const TEMPLATES = {
  COD: [
    { id: "f_1", type: "TEXT", label: "Nama Lengkap", placeholder: "Masukkan nama Anda", required: true, isExpanded: false },
    { id: "f_2", type: "PHONE", label: "Nomor WhatsApp", placeholder: "0812...", required: true, isExpanded: false },
    { id: "f_3", type: "TEXTAREA", label: "Alamat Lengkap", placeholder: "Nama jalan, RT/RW, kelurahan, kecamatan...", required: true, isExpanded: false },
    { id: "f_4", type: "DROPDOWN", label: "Metode Pembayaran", required: true, options: ["COD (Bayar di Tempat)", "Transfer Bank"], isExpanded: false },
  ],
  DIGITAL: [
    { id: "f_1", type: "TEXT", label: "Nama Lengkap", placeholder: "Masukkan nama Anda", required: true, isExpanded: false },
    { id: "f_2", type: "EMAIL", label: "Alamat Email", placeholder: "email@contoh.com", required: true, isExpanded: false },
    { id: "f_3", type: "PHONE", label: "Nomor WhatsApp (Opsional)", placeholder: "0812...", required: false, isExpanded: false },
  ],
  LEAD_WA: [
    { id: "f_1", type: "TEXT", label: "Nama", placeholder: "Nama Panggilan", required: true, isExpanded: false },
    { id: "f_2", type: "PHONE", label: "Nomor WhatsApp", placeholder: "0812...", required: true, isExpanded: false },
    { id: "f_3", type: "RADIO", label: "Ketertarikan Produk", required: true, options: ["Produk A", "Produk B", "Lainnya"], isExpanded: false },
  ]
};

export default function FormsBuilderPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("mobile");
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<FormField[]>(TEMPLATES.COD as FormField[]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showNotification("Formulir berhasil disimpan!");
    }, 500);
  };

  const loadTemplate = (templateKey: keyof typeof TEMPLATES) => {
    setFields(TEMPLATES[templateKey] as FormField[]);
    showNotification("Template berhasil dimuat!");
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...fields];
    if (direction === "up" && index > 0) {
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      setFields(newFields);
    } else if (direction === "down" && index < fields.length - 1) {
      [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
      setFields(newFields);
    }
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const toggleExpand = (id: string) => {
    setFields(fields.map(f => f.id === id ? { ...f, isExpanded: !f.isExpanded } : f));
  };

  const addField = (type: FieldType, label: string) => {
    const newField: FormField = { 
      id: `f_${Date.now()}`, 
      type, 
      label, 
      required: false, 
      isExpanded: true,
      options: (type === "DROPDOWN" || type === "RADIO") ? ["Opsi 1", "Opsi 2"] : undefined
    };
    setFields([...fields, newField]);
    setShowAddMenu(false);
    showNotification(`Input ${label} berhasil ditambahkan!`);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const copySnippet = () => {
    const snippet = `<script src="https://cdn.dotads.com/forms.js"></script>\n<dotads-form id="form_${Date.now().toString().slice(-6)}"></dotads-form>`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    showNotification("Snippet Form berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Builder Top Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-6 py-3 flex items-center justify-between shadow-2xs z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-100 dark:bg-indigo-950 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight">Pembuat Formulir Interaktif</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DotAds Form Builder</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setDeviceView("desktop")}
              className={`p-1.5 rounded-md ${deviceView === 'desktop' ? 'bg-white dark:bg-slate-700 shadow-2xs text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
              title="Tampilan Desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setDeviceView("mobile")}
              className={`p-1.5 rounded-md ${deviceView === 'mobile' ? 'bg-white dark:bg-slate-700 shadow-2xs text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
              title="Tampilan Mobile"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

          <button 
            onClick={() => setEmbedModalOpen(true)}
            className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Embed Form</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5"
          >
            {isSaving ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? "Menyimpan..." : "Simpan Formulir"}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div className="flex-1 flex overflow-hidden bg-slate-50/50 dark:bg-slate-950">
        {/* Left Sidebar: Fields & Templates */}
        <div className="w-80 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Template Cepat</h2>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => loadTemplate("COD")} className="px-2 py-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 transition-colors">
                Single-Page COD
              </button>
              <button onClick={() => loadTemplate("DIGITAL")} className="px-2 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 transition-colors">
                Produk Digital
              </button>
              <button onClick={() => loadTemplate("LEAD_WA")} className="px-2 py-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 transition-colors col-span-2">
                Lead WhatsApp
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Input Formulir ({fields.length})</h2>
            <div className="relative">
              <button 
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="p-1.5 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Input</span>
              </button>

              {showAddMenu && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-2 space-y-1">
                  <button onClick={() => addField("TEXT", "Teks Singkat")} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2">
                    <Type className="w-3.5 h-3.5 text-indigo-500" /> Teks Singkat
                  </button>
                  <button onClick={() => addField("DROPDOWN", "Pilihan Dropdown")} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2">
                    <ChevronDown className="w-3.5 h-3.5 text-indigo-500" /> Dropdown
                  </button>
                  <button onClick={() => addField("RADIO", "Pilihan Radio")} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Tombol Radio
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {fields.map((field, idx) => (
              <div 
                key={field.id}
                className="border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-800/60 overflow-hidden shadow-2xs group"
              >
                <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => toggleExpand(field.id)}>
                  <div className="flex items-center space-x-2.5">
                    <div className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{field.label}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => moveField(idx, "up")} disabled={idx === 0} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20">
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveField(idx, "down")} disabled={idx === fields.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20">
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeField(field.id)} className="p-1 text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {field.isExpanded && (
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Label Input</label>
                      <input 
                        type="text" 
                        value={field.label} 
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1 font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    {field.type !== "DROPDOWN" && field.type !== "RADIO" && field.type !== "CHECKBOX" && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Placeholder teks</label>
                        <input 
                          type="text" 
                          value={field.placeholder || ""} 
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1 font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    )}
                    {(field.type === "DROPDOWN" || field.type === "RADIO") && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Pilihan (Pisahkan dengan koma)</label>
                        <input 
                          type="text" 
                          value={(field.options || []).join(", ")} 
                          onChange={(e) => updateField(field.id, { options: e.target.value.split(",").map(o => o.trim()) })}
                          className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1 font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    )}
                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input 
                        type="checkbox" 
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      />
                      <span>Wajib Diisi (Required)</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center Canvas Live Device Rendering */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start">
          <div className={`bg-white dark:bg-slate-900 shadow-2xl transition-all duration-300 ring-1 ring-slate-900/5 ${deviceView === 'mobile' ? 'w-[360px] min-h-[700px] rounded-[2.5rem] border-[10px] border-slate-900 overflow-hidden' : 'w-full max-w-2xl rounded-2xl min-h-[600px] border border-slate-200 dark:border-slate-800 overflow-hidden'}`}>
            {deviceView === 'mobile' && (
              <div className="w-full h-6 bg-slate-900 flex justify-center items-center shrink-0">
                <div className="w-1/3 h-3.5 bg-black rounded-b-xl"></div>
              </div>
            )}

            <div className="p-6">
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5">
                <div className="text-center mb-6">
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Selesaikan Pesanan Anda</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Isi data di bawah dengan lengkap dan benar.</p>
                </div>

                {fields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    
                    {field.type === "TEXT" || field.type === "EMAIL" || field.type === "PHONE" ? (
                      <input 
                        type={field.type === "EMAIL" ? "email" : "text"}
                        disabled
                        placeholder={field.placeholder}
                        className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-slate-500 placeholder:text-slate-400"
                      />
                    ) : field.type === "TEXTAREA" ? (
                      <textarea 
                        disabled
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-slate-500 placeholder:text-slate-400"
                      />
                    ) : field.type === "DROPDOWN" ? (
                      <div className="relative">
                        <select disabled className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-slate-500 appearance-none">
                          <option>{field.options?.[0] || "Pilih opsi"}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                      </div>
                    ) : field.type === "RADIO" ? (
                      <div className="space-y-2">
                        {field.options?.map((opt, i) => (
                          <label key={i} className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                            <input type="radio" disabled className="text-indigo-600 focus:ring-indigo-500 bg-slate-100 dark:bg-slate-800" />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}

                <button disabled className="w-full bg-indigo-600 text-white font-bold text-sm py-3.5 rounded-xl shadow-xs opacity-90">
                  Konfirmasi Pesanan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embed Modal */}
      {embedModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Kode Embed Formulir</h3>
              <button onClick={() => setEmbedModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Salin kode script di bawah ini dan paste ke dalam HTML website Anda untuk menampilkan formulir pesanan.</p>
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap bg-slate-900 p-4 rounded-xl shadow-inner border border-slate-800 relative group">
                <code className="text-emerald-400">{'<script src="https://cdn.dotads.com/forms.js"></script>'}</code><br/>
                <code className="text-indigo-300">{'<dotads-form id="form_88291a"></dotads-form>'}</code>
              </pre>
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3 bg-white dark:bg-slate-900">
              <button onClick={() => setEmbedModalOpen(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors">
                Tutup
              </button>
              <button 
                onClick={copySnippet}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center space-x-2 shadow-xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Tersalin!" : "Salin Kode"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
