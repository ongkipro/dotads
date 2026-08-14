"use client";

import React, { useState } from "react";
import { Layers, Plus, Type, Image as ImageIcon, Layout, MoveUp, MoveDown, Trash2, Save, Smartphone, Monitor, Code, Check, X, Copy, Sparkles, CheckCircle2, Upload } from "lucide-react";

type SectionType = "HERO" | "FEATURES" | "TESTIMONIALS" | "FORM_EMBED";

interface PageSection {
  id: string;
  type: SectionType;
  title: string;
  isExpanded: boolean;
}

export default function PagesBuilderPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("mobile");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sections, setSections] = useState<PageSection[]>([
    { id: "sec_1", type: "HERO", title: "Hero Header & Promo Utama", isExpanded: true },
    { id: "sec_2", type: "FEATURES", title: "Fitur & Keunggulan Produk", isExpanded: false },
    { id: "sec_3", type: "TESTIMONIALS", title: "Ulasan & Bukti Transaksi Pelanggan", isExpanded: false },
    { id: "sec_4", type: "FORM_EMBED", title: "Embed Form Pemesanan COD", isExpanded: false },
  ]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showNotification("Halaman Landing Page berhasil disimpan!");
    }, 500);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      const newSections = [...sections];
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      setSections(newSections);
    } else if (direction === "down" && index < sections.length - 1) {
      const newSections = [...sections];
      [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
      setSections(newSections);
    }
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const toggleExpand = (id: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, isExpanded: !s.isExpanded } : s));
  };

  const addSection = (type: SectionType, title: string) => {
    setSections([...sections, { id: `sec_${Date.now()}`, type, title, isExpanded: true }]);
    setShowAddMenu(false);
    showNotification(`Seksi ${title} berhasil ditambahkan!`);
  };

  const copySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(sections, null, 2));
    setCopied(true);
    showNotification("Skema JSON Landing Page berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importData);
      if (Array.isArray(parsed)) {
        setSections(parsed);
        setImportModalOpen(false);
        setImportData("");
        showNotification("Skema JSON berhasil diimpor!");
      } else {
        alert("Format JSON tidak valid. Harap masukkan array skema yang benar.");
      }
    } catch (e) {
      alert("Format JSON tidak valid. Pastikan format penulisan benar.");
    }
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
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight">Pembuat Halaman Pendaratan (Landing Page) Interaktif</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kanvas Visual Block DotAds</p>
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
              title="Tampilan Seluler"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

          <button 
            onClick={() => setImportModalOpen(true)}
            className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor JSON</span>
          </button>
          <button 
            onClick={() => setExportModalOpen(true)}
            className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5"
          >
            {isSaving ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? "Menyimpan..." : "Simpan Halaman"}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div className="flex-1 flex overflow-hidden bg-slate-50/50 dark:bg-slate-950">
        {/* Left Sidebar: Section Tree & Components */}
        <div className="w-80 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Seksi & Blok Halaman ({sections.length})</h2>
            <div className="relative">
              <button 
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="p-1.5 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Seksi</span>
              </button>

              {showAddMenu && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-2 space-y-1">
                  <button onClick={() => addSection("HERO", "Hero Header & Promo")} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2">
                    <Layout className="w-3.5 h-3.5 text-indigo-500" /> Hero Header
                  </button>
                  <button onClick={() => addSection("FEATURES", "Fitur Utama Produk")} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2">
                    <Type className="w-3.5 h-3.5 text-indigo-500" /> Fitur & Keunggulan
                  </button>
                  <button onClick={() => addSection("TESTIMONIALS", "Ulasan Pelanggan")} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> Testimoni & Ulasan
                  </button>
                  <button onClick={() => addSection("FORM_EMBED", "Embed Form Checkout COD")} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Form Checkout COD
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sections.map((section, idx) => (
              <div 
                key={section.id}
                className="border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-800/60 overflow-hidden shadow-2xs group"
              >
                <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => toggleExpand(section.id)}>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {idx + 1}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{section.title}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => moveSection(idx, "up")} disabled={idx === 0} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20">
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveSection(idx, "down")} disabled={idx === sections.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20">
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeSection(section.id)} className="p-1 text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {section.isExpanded && (
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Judul Seksi</label>
                      <input 
                        type="text" 
                        value={section.title} 
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[idx].title = e.target.value;
                          setSections(updated);
                        }}
                        className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1 font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center Canvas Live Device Rendering */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start">
          <div className={`bg-white dark:bg-slate-900 shadow-2xl transition-all duration-300 ring-1 ring-slate-900/5 ${deviceView === 'mobile' ? 'w-[360px] min-h-[700px] rounded-[2.5rem] border-[10px] border-slate-900 overflow-hidden' : 'w-full max-w-3xl rounded-2xl min-h-[600px] border border-slate-200 dark:border-slate-800 overflow-hidden'}`}>
            {deviceView === 'mobile' && (
              <div className="w-full h-6 bg-slate-900 flex justify-center items-center shrink-0">
                <div className="w-1/3 h-3.5 bg-black rounded-b-xl"></div>
              </div>
            )}

            <div className="p-6 space-y-8">
              {sections.map((sec) => (
                <div key={sec.id} className="border-2 border-dashed border-indigo-200/80 dark:border-indigo-900/60 rounded-2xl p-6 bg-indigo-50/20 dark:bg-indigo-950/20 relative group hover:border-indigo-500 transition-colors">
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-2xs">
                    {sec.type}
                  </div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base mb-2">{sec.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {sec.type === "HERO" && "🔥 Promo Spesial Hari Ini! Dapatkan Diskon Hingga 50% & Gratis Ongkir COD."}
                    {sec.type === "FEATURES" && "✨ Garansi 100% Produk Original, Pengiriman Cepat 1-3 Hari via JNE & SiCepat."}
                    {sec.type === "TESTIMONIALS" && "⭐⭐⭐⭐⭐ 'Paket sampai cepat, COD sangat aman!' - Budi S., Jakarta"}
                    {sec.type === "FORM_EMBED" && "[Komponen Form Order COD DotAds Terpasang di Sini]"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* JSON Schema Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Ekspor Skema JSON Halaman</h3>
              <button onClick={() => setExportModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
              <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                {JSON.stringify(sections, null, 2)}
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

      {/* JSON Schema Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Impor Skema JSON Halaman</h3>
              <button onClick={() => setImportModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950">
              <p className="text-xs text-slate-500 mb-4">Paste kode JSON di bawah ini untuk menimpa tata letak (layout) halaman saat ini.</p>
              <textarea
                rows={8}
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="[ { &quot;id&quot;: &quot;sec_1&quot;, &quot;type&quot;: &quot;HERO&quot;, ... } ]"
                className="w-full text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3 bg-white dark:bg-slate-900">
              <button onClick={() => setImportModalOpen(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors">
                Batal
              </button>
              <button 
                onClick={handleImport}
                disabled={!importData.trim()}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center space-x-2 shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>Impor Layout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
