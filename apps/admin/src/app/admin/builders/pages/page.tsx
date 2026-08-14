"use client";

import React, { useState } from "react";
import { Layers, Plus, Settings, Type, Image as ImageIcon, Layout, MoveUp, MoveDown, Trash2, Eye, Save, Smartphone, Monitor, Code, Check, X, Copy } from "lucide-react";
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
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
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
    setShowAddMenu(false);
  };

  const copySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(sections, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            onClick={() => setExportModalOpen(true)}
            className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <Code className="w-3.5 h-3.5" />
            <span>JSON Schema</span>
          </button>
PUT 175*=179:
            {/* Add New Section Button */}
            <div className="relative">
              <button 
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center space-y-1"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-semibold">Add Section</span>
              </button>

              {showAddMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden">
                  <div className="p-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Select Type</span>
                    <button onClick={() => setShowAddMenu(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-1 space-y-1">
                    <button onClick={() => addSection('HERO', 'New Hero')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors">Hero Header</button>
                    <button onClick={() => addSection('FEATURES', 'New Features')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors">Features Grid</button>
                    <button onClick={() => addSection('TESTIMONIALS', 'New Testimonials')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors">Testimonials</button>
                    <button onClick={() => addSection('CTA', 'New CTA')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors">Call to Action</button>
                    <button onClick={() => addSection('CUSTOM_HTML', 'New Custom HTML')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors">Custom HTML Block</button>
                  </div>
                </div>
              )}
            </div>
PUT 185*=193:
          <div className={`bg-white shadow-sm border border-slate-200 transition-all duration-300 overflow-y-auto overflow-x-hidden ${deviceView === 'mobile' ? 'w-[375px] min-h-[812px] rounded-[2rem] border-[8px] border-slate-800' : 'w-full max-w-5xl rounded-lg min-h-full'}`}>
            {sections.length === 0 ? (
              <div className="w-full h-full p-8 flex items-center justify-center bg-slate-50 text-slate-400 border-2 border-dashed border-slate-200 m-4 w-[calc(100%-2rem)] min-h-[500px] rounded-lg">
                <div className="text-center">
                  <Layout className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-500">Empty Page</p>
                  <p className="text-xs text-slate-400 mt-1">Add a section from the left sidebar to start building.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col min-h-full w-full">
                {sections.map(section => (
                  <div key={section.id} className="relative group border-b border-dashed border-slate-200 last:border-0 hover:bg-slate-50 transition-colors p-8 min-h-[150px] flex flex-col justify-center items-center">
                    <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-300 uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
                      {section.type}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">{section.title}</h2>
                    <p className="text-sm text-slate-500 text-center max-w-md">Sample content visualization for {section.title}. In a real app, this would render actual components mapped to the {section.type} schema.</p>
                  </div>
                ))}
              </div>
            )}
          </div>
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

      {/* JSON Schema Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Page JSON Schema</h3>
              <button onClick={() => setExportModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-slate-50">
              <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap">
                {JSON.stringify(sections, null, 2)}
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
    </div>
  );
}
