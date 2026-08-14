"use client";

import React, { useState } from "react";
import { MapPin, Save, Building, Plus, Trash2 } from "lucide-react";

export default function GudangSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [locations, setLocations] = useState([
    { id: 1, name: "Jakarta Main Hub", address: "Jl. Sudirman No. 1", city: "Jakarta Selatan", province: "DKI Jakarta", postalCode: "12190", isDefault: true },
    { id: 2, name: "Surabaya Fulfillment", address: "Jl. Pemuda No. 12", city: "Surabaya", province: "Jawa Timur", postalCode: "60271", isDefault: false },
  ]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 600);
  };

  const setAsDefault = (id: number) => {
    setLocations(locations.map(loc => ({
      ...loc,
      isDefault: loc.id === id
    })));
  };

  const removeLocation = (id: number) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <Building className="h-4 w-4" /> Fulfillment Options
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Warehouse & Origin</h1>
          <p className="mt-1 text-sm text-slate-500">Manage fulfillment centers for expedition pickup and shipping rates.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-50 text-indigo-600 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20">
            <Plus className="h-4 w-4" />
            <span>Add Warehouse</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Saving..." : "Save Locations"}</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {locations.map((loc) => (
          <div key={loc.id} className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${loc.isDefault ? 'border-indigo-300 ring-2 ring-indigo-500/20' : 'border-slate-200'}`}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${loc.isDefault ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{loc.name}</h3>
                  {loc.isDefault && (
                    <span className="inline-block mt-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Primary Origin
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => removeLocation(loc.id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-rose-500/20"
                title="Remove warehouse"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Full Address</label>
                <p className="text-sm text-slate-900 leading-relaxed">{loc.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">City / District</label>
                  <p className="text-sm text-slate-900">{loc.city}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Province</label>
                  <p className="text-sm text-slate-900">{loc.province}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Postal Code</label>
                <p className="text-sm text-slate-800 font-mono bg-slate-50 px-2 py-1 rounded inline-block">{loc.postalCode}</p>
              </div>
            </div>

            {!loc.isDefault && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/80">
                <button 
                  onClick={() => setAsDefault(loc.id)}
                  className="w-full text-sm font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center justify-center space-x-2 py-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Set as Primary Origin</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
