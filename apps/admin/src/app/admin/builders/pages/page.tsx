"use client";

import React, { useState } from "react";
import { Layers, Plus, Settings, Type, Image as ImageIcon, Layout, MoveUp, MoveDown, Trash2, Eye, Save, Smartphone, Monitor } from "lucide-react";

type SectionType = "HERO" | "FEATURES" | "TESTIMONIALS" | "CTA" | "CUSTOM_HTML";

interface PageSection {
  id: string;
  type: SectionType;
  title: string;
  isExpanded: boolean;
}

export default function PagesBuilderPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [sections, setSections] = useState<PageSection[]>([
    { id: "sec_1", type: "HERO", title: "Hero Header", isExpanded: true },
    { id: "sec_2", type: "FEATURES", title: "Product Features", isExpanded: false },
    { id: "sec_3", type: "TESTIMONIALS", title: "Customer Reviews", isExpanded: false },
    { id: "sec_4", type: "CTA", title: "Call to Action", isExpanded: false },
  ]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 600);
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
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6">
      {/* Builder Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">Product Launch LP</h1>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Landing Page Builder</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button 
              onClick={() => setDeviceView("desktop")}
              className={`p-1.5 rounded ${deviceView === 'desktop' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setDeviceView("mobile")}
              className={`p-1.5 rounded ${deviceView === 'mobile' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-6 w-px bg-slate-200"></div>

          <button className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-1.5 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Publish Page"}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-slate-50">
        {/* Left Sidebar - Sections Outline */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Page Structure</h2>
            <button className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors" title="Add Section">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sections.map((section, idx) => (
              <div key={section.id} className="border border-slate-200 rounded-lg bg-white shadow-xs overflow-hidden">
                <div 
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${section.isExpanded ? 'bg-indigo-50/50 border-b border-slate-100' : 'hover:bg-slate-50'}`}
                  onClick={() => toggleExpand(section.id)}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="cursor-grab text-slate-400 hover:text-slate-600">
                      <Layout className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{section.title}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveSection(idx, "up"); }}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveSection(idx, "down"); }}
                      disabled={idx === sections.length - 1}
                      className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                {/* Section Config Panel (Expanded) */}
                {section.isExpanded && (
                  <div className="p-4 bg-white space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Heading</label>
                      <input type="text" defaultValue={section.title} className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Content / Subheading</label>
                      <textarea rows={2} className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-indigo-500 font-sans" defaultValue="Sample content for this section." />
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center space-x-1 hover:text-indigo-700">
                        <Settings className="w-3 h-3" />
                        <span>Advanced</span>
                      </button>
                      <button 
                        onClick={() => removeSection(section.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add New Section Button */}
            <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center space-y-1">
              <Plus className="w-5 h-5" />
              <span className="text-xs font-semibold">Add Section</span>
            </button>
          </div>
        </div>

        {/* Right Area - Canvas Preview */}
        <div className="flex-1 p-6 overflow-y-auto flex justify-center">
          <div className={`bg-white shadow-sm border border-slate-200 transition-all duration-300 ${deviceView === 'mobile' ? 'w-[375px] min-h-[812px] rounded-[2rem] border-[8px] border-slate-800' : 'w-full max-w-5xl rounded-lg min-h-full'}`}>
            <div className="w-full h-full p-8 flex items-center justify-center bg-slate-50 text-slate-400 border-2 border-dashed border-slate-200 m-4 w-[calc(100%-2rem)] min-h-[500px] rounded-lg">
              <div className="text-center">
                <Layout className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">Live Preview Canvas</p>
                <p className="text-xs text-slate-400 mt-1">Select a section on the left to edit its content.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
