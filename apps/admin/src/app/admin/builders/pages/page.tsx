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

          <button className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs">
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button 
            onClick={() => setExportModalOpen(true)}
            className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <Code className="w-3.5 h-3.5" />
            <span>JSON Schema</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-1.5 rounded-lg shadow-xs transition-colors disabled:opacity-50 ml-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Publish Page"}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-slate-50/50">
        {/* Left Sidebar - Sections Outline */}
        <div className="w-[340px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-sm relative">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Page Structure</h2>
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-colors" 
              title="Add Section"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            {sections.map((section, idx) => (
              <div key={section.id} className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden transition-all duration-200 hover:border-slate-300 group">
                <div 
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${section.isExpanded ? 'bg-indigo-50/50 border-b border-slate-100' : 'hover:bg-slate-50'}`}
                  onClick={() => toggleExpand(section.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="cursor-grab text-slate-300 hover:text-slate-500 transition-colors">
                      <Layout className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 leading-none">{section.title}</span>
                      <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide font-medium">{section.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveSection(idx, "up"); }}
                      disabled={idx === 0}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 transition-colors"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveSection(idx, "down"); }}
                      disabled={idx === sections.length - 1}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 transition-colors"
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
                      <input type="text" defaultValue={section.title} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Content / Subheading</label>
                      <textarea rows={2} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans transition-shadow" defaultValue="Sample content for this section." />
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                      <button className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1.5 px-2 py-1 -ml-2 rounded transition-colors hover:bg-slate-50">
                        <Settings className="w-3.5 h-3.5" />
                        <span>Advanced</span>
                      </button>
                      <button 
                        onClick={() => removeSection(section.id)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded transition-colors"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add New Section Button */}
            <div className="relative pt-2">
              <button 
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center space-y-1.5 group"
              >
                <div className="bg-slate-100 group-hover:bg-indigo-100 p-2 rounded-full transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold">Add New Section</span>
              </button>

              {showAddMenu && (
                <div className="absolute bottom-full mb-3 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden transform origin-bottom animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center backdrop-blur-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Type</span>
                    <button onClick={() => setShowAddMenu(false)} className="text-slate-400 hover:text-slate-600 bg-white shadow-xs rounded-md p-1 border border-slate-200">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2 space-y-1">
                    <button onClick={() => addSection('HERO', 'Hero Header')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"><Layout className="w-4 h-4 text-slate-400" />Hero Header</button>
                    <button onClick={() => addSection('FEATURES', 'Product Features')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"><Layers className="w-4 h-4 text-slate-400" />Features Grid</button>
                    <button onClick={() => addSection('TESTIMONIALS', 'Customer Reviews')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"><Type className="w-4 h-4 text-slate-400" />Testimonials</button>
                    <button onClick={() => addSection('CTA', 'Call to Action')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"><Plus className="w-4 h-4 text-slate-400" />Call to Action</button>
                    <button onClick={() => addSection('CUSTOM_HTML', 'Custom HTML')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"><Code className="w-4 h-4 text-slate-400" />Custom HTML Block</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Area - Canvas Preview */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto flex justify-center bg-slate-100/50 pattern-dots pattern-slate-200 pattern-bg-transparent pattern-size-4">
          <div className={`relative bg-white shadow-xl transition-all duration-300 ring-1 ring-slate-900/5 flex flex-col ${deviceView === 'mobile' ? 'w-[375px] min-h-[812px] rounded-[2.5rem] border-[12px] border-slate-900 overflow-hidden my-auto' : 'w-full max-w-5xl rounded-xl min-h-full overflow-hidden'}`}>
            
            {/* Mock Browser/Device Header */}
            {deviceView === 'mobile' ? (
              <div className="w-full h-7 bg-slate-900 flex justify-center items-center shrink-0">
                <div className="w-1/3 h-4 bg-black rounded-b-xl"></div>
              </div>
            ) : (
              <div className="w-full h-10 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400 border border-slate-300/50"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400 border border-slate-300/50"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400 border border-slate-300/50"></div>
                </div>
                <div className="mx-auto bg-white rounded-md border border-slate-200 px-24 py-1 text-[10px] text-slate-400 font-medium shadow-xs">
                  store.dotads.com
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white">
              {sections.length === 0 ? (
                <div className="absolute inset-0 p-8 flex items-center justify-center">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Layout className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-base font-bold text-slate-700">Empty Canvas</p>
                    <p className="text-sm text-slate-500 mt-1">Add a section from the left sidebar to start building your landing page.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col w-full pb-16">
                  {sections.map(section => (
                    <div key={section.id} className={`relative group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors py-16 px-6 sm:px-12 min-h-[250px] flex flex-col justify-center items-center ${section.isExpanded ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/10' : ''}`}>
                      <div className="absolute top-4 left-4 z-10">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity border border-indigo-100">
                          <Settings className="w-3 h-3" /> {section.type}
                        </span>
                      </div>
                      
                      {/* Visual representations based on type */}
                      {section.type === 'HERO' && (
                        <div className="text-center max-w-2xl space-y-6">
                          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">{section.title}</h2>
                          <p className="text-lg text-slate-500 max-w-xl mx-auto">Engaging subtitle describing the core value proposition goes here. This area is typically designed for maximum conversion impact.</p>
                          <div className="flex justify-center gap-4 pt-4">
                            <div className="h-12 w-36 bg-slate-900 rounded-lg shadow-sm"></div>
                            <div className="h-12 w-36 bg-white border border-slate-200 rounded-lg shadow-sm"></div>
                          </div>
                        </div>
                      )}
                      
                      {section.type === 'FEATURES' && (
                        <div className="w-full max-w-4xl space-y-12">
                          <div className="text-center">
                            <h2 className="text-3xl font-bold text-slate-900">{section.title}</h2>
                            <div className="w-16 h-1 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            {[1,2,3].map(i => (
                              <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-xs transition-shadow hover:shadow-sm text-center sm:text-left flex flex-col items-center sm:items-start">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl mb-6 flex items-center justify-center">
                                  <Layers className="w-6 h-6" />
                                </div>
                                <div className="h-5 w-3/4 bg-slate-200 rounded mb-4"></div>
                                <div className="h-4 w-full bg-slate-100 rounded mb-2"></div>
                                <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.type === 'TESTIMONIALS' && (
                        <div className="w-full max-w-4xl">
                          <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">{section.title}</h2>
                          <div className="flex flex-col sm:flex-row gap-6 overflow-hidden">
                            {[1,2].map(i => (
                              <div key={i} className="flex-1 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex gap-1.5 mb-6">
                                  {[1,2,3,4,5].map(star => (
                                    <svg key={star} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                  ))}
                                </div>
                                <div className="space-y-3 mb-8">
                                  <div className="h-4 w-full bg-slate-200 rounded"></div>
                                  <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
                                  <div className="h-4 w-4/6 bg-slate-200 rounded"></div>
                                </div>
                                <div className="flex items-center gap-4 pt-6 border-t border-slate-200/50">
                                  <div className="w-12 h-12 rounded-full bg-slate-300 shrink-0"></div>
                                  <div>
                                    <div className="h-4 w-28 bg-slate-300 rounded mb-2"></div>
                                    <div className="h-3 w-20 bg-slate-200 rounded"></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.type === 'CTA' && (
                        <div className="w-full max-w-4xl bg-slate-900 rounded-[2.5rem] p-16 text-center text-white space-y-8 shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Plus className="w-48 h-48" />
                          </div>
                          <h2 className="text-4xl font-black relative z-10 tracking-tight">{section.title}</h2>
                          <p className="text-lg text-slate-300 max-w-xl mx-auto relative z-10">Ready to get started? Join thousands of other users today and transform your workflow instantly.</p>
                          <div className="h-14 w-48 bg-indigo-500 hover:bg-indigo-400 transition-colors rounded-xl mx-auto mt-6 shadow-lg shadow-indigo-500/20 relative z-10"></div>
                        </div>
                      )}

                      {section.type === 'CUSTOM_HTML' && (
                        <div className="w-full max-w-4xl border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[250px]">
                          <Code className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                          <h2 className="text-xl font-bold text-slate-700">{section.title}</h2>
                          <p className="text-sm text-slate-500 mt-3 font-mono bg-white border border-slate-200 p-3 rounded-lg inline-block shadow-xs">&lt;div class="custom-block"&gt;...&lt;/div&gt;</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* JSON Schema Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Page JSON Schema</h3>
              <button onClick={() => setExportModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-auto bg-slate-50">
              <pre className="text-sm text-slate-700 font-mono whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                {JSON.stringify(sections, null, 2)}
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
    </div>
  );
}
