"use client";

import React, { useState } from "react";
import { MoveUp, MoveDown, Trash2, Plus, Layout, Eye, Sparkles } from "lucide-react";

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
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Landing Page Canvas Builder</h2>
          <p className="text-xs text-slate-500">Structure high-conversion direct-response Meta Ads landing page</p>
        </div>

        <button className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Publish Page (Astro High-Speed)</span>
        </button>
      </div>

      {/* Block Sequence List */}
      <div className="space-y-3 mb-6">
        {blocks.map((block, idx) => (
          <div
            key={block.id}
            className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-md hover:border-indigo-300 transition-colors"
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
                className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
              >
                <MoveUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => moveBlock(idx, "down")}
                disabled={idx === blocks.length - 1}
                className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
              >
                <MoveDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeBlock(block.id)}
                className="p-1 text-rose-500 hover:text-rose-700 ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Block Toolbar */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">Available Section Blocks</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => addBlock("faq", "Frequently Asked Questions (FAQ)")}
            className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-medium px-3 py-1.5 rounded border border-slate-200"
          >
            + FAQ Block
          </button>
          <button
            onClick={() => addBlock("order_form_embed", "COD Checkout Form Section")}
            className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-medium px-3 py-1.5 rounded border border-slate-200"
          >
            + Form Embed
          </button>
        </div>
      </div>
    </div>
  );
}
