"use client";

import React, { useState } from "react";
import { MoveUp, MoveDown, Trash2, Layout, Sparkles, Monitor, Smartphone } from "lucide-react";

export interface PageBlock {
  id: string;
  type: string;
  title: string;
}

export function LandingPageBuilderCanvas() {
  const [blocks, setBlocks] = useState<PageBlock[]>([
    { id: "b1", type: "hero", title: "Hero High Impact Section" },
    { id: "b2", type: "features", title: "Key Features & Benefits Grid" },
    { id: "b3", type: "video", title: "Product Video Showcase" },
    { id: "b4", type: "testimonials", title: "Customer Reviews & Social Proof" },
    { id: "b5", type: "order_form_embed", title: "Single-Page Hybrid Form Embed" },
  ]);
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [selectedTheme, setSelectedTheme] = useState<"indigo" | "emerald" | "dark" | "amber">("indigo");
  const [selectedFormPreset, setSelectedFormPreset] = useState<"hybrid" | "full" | "middle" | "mini">("hybrid");

  const moveBlock = (index: number, direction: "up" | "down") => {
    const updated = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setBlocks(updated);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const addBlock = (type: string, title: string) => {
    setBlocks([...blocks, { id: `b_${Date.now()}`, type, title }]);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Landing Page Canvas Builder & Theme Engine</h2>
          <p className="text-xs text-slate-500">Kustomisasi halaman pendaratan Ads, skema warna tema, dan preset form checkout</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Theme Palette Switcher */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setSelectedTheme("indigo")}
              className={`w-5 h-5 rounded-full bg-indigo-600 transition-transform ${selectedTheme === "indigo" ? "ring-2 ring-indigo-400 scale-110" : ""}`}
              title="Tema Indigo Direct Response"
            />
            <button
              onClick={() => setSelectedTheme("emerald")}
              className={`w-5 h-5 rounded-full bg-emerald-600 transition-transform ${selectedTheme === "emerald" ? "ring-2 ring-emerald-400 scale-110" : ""}`}
              title="Tema Emerald Organic"
            />
            <button
              onClick={() => setSelectedTheme("dark")}
              className={`w-5 h-5 rounded-full bg-slate-900 transition-transform ${selectedTheme === "dark" ? "ring-2 ring-slate-400 scale-110" : ""}`}
              title="Tema Dark Tech"
            />
            <button
              onClick={() => setSelectedTheme("amber")}
              className={`w-5 h-5 rounded-full bg-amber-500 transition-transform ${selectedTheme === "amber" ? "ring-2 ring-amber-400 scale-110" : ""}`}
              title="Tema Amber Flash Sale"
            />
          </div>

          {/* Device Preview Switcher */}
          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setDeviceView("desktop")}
              className={`p-1.5 rounded-md ${deviceView === "desktop" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500 hover:text-slate-700"}`}
              title="Tampilan Desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView("mobile")}
              className={`p-1.5 rounded-md ${deviceView === "mobile" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500 hover:text-slate-700"}`}
              title="Tampilan Seluler (375px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Terbitkan (Astro High-Speed)</span>
          </button>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Section Tree & Form Preset Switcher */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Preset Form Checkout Terpasang</label>
            <select
              value={selectedFormPreset}
              onChange={(e) => setSelectedFormPreset(e.target.value as any)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="hybrid">HYBRID (2-Step Progressive Checkout)</option>
              <option value="full">FULL (1-Step Single-Page Direct Form)</option>
              <option value="middle">MIDDLE (1.5-Step Compact Direct Form)</option>
              <option value="mini">MINI (2-Input WhatsApp Lead Form)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Struktur Seksi Blok Halaman ({blocks.length})</label>
            <div className="space-y-2.5">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Layout className="w-4 h-4 text-indigo-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{block.title}</h4>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">{block.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => moveBlock(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveBlock(idx, "down")}
                      disabled={idx === blocks.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tambah Blok Seksi Baru</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => addBlock("faq", "Frequently Asked Questions (FAQ)")}
                className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
              >
                + FAQ Block
              </button>
              <button
                onClick={() => addBlock("order_form_embed", "COD Checkout Form Section")}
                className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
              >
                + Form Embed
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live Interactive Device Render */}
        <div className="lg:col-span-7 flex justify-center bg-slate-100 p-6 rounded-2xl border border-slate-200">
          <div
            className={`bg-white shadow-xl transition-all duration-300 ${
              deviceView === "mobile"
                ? "w-[360px] min-h-[550px] rounded-[2rem] border-[8px] border-slate-900 overflow-hidden"
                : "w-full max-w-xl min-h-[500px] rounded-xl border border-slate-200 overflow-hidden"
            }`}
          >
            {deviceView === "mobile" && (
              <div className="w-full h-5 bg-slate-900 flex justify-center items-center shrink-0">
                <div className="w-1/4 h-2.5 bg-black rounded-b-md"></div>
              </div>
            )}

            <div className="p-5 space-y-4">
              <div className={`p-3 rounded-lg text-white font-bold text-center text-xs ${
                selectedTheme === "indigo" ? "bg-indigo-600" :
                selectedTheme === "emerald" ? "bg-emerald-600" :
                selectedTheme === "dark" ? "bg-slate-900" : "bg-amber-500"
              }`}>
                Pratinjau Live Tema ({selectedTheme.toUpperCase()}) & Form ({selectedFormPreset.toUpperCase()})
              </div>

              {blocks.map((b) => (
                <div key={b.id} className="p-4 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/30">
                  <div className="text-xs font-bold text-slate-800">{b.title}</div>
                  <div className="text-[10px] text-slate-400 uppercase mt-0.5">{b.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
