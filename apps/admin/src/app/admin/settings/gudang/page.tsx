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
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Warehouse & Origin Location
          </h1>
          <p className="text-xs text-slate-500">Manage fulfillment centers for expedition pickup and shipping rates.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-xs transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving..." : "Save Locations"}</span>
        </button>
      </div>

      <div className="flex justify-end">
        <button className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Warehouse</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => (
          <div key={loc.id} className={`bg-white rounded-lg border shadow-xs overflow-hidden transition-all ${loc.isDefault ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'}`}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Building className={`w-4 h-4 ${loc.isDefault ? 'text-indigo-600' : 'text-slate-400'}`} />
                <h3 className="text-sm font-bold text-slate-800">{loc.name}</h3>
                {loc.isDefault && (
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                    Primary Origin
                  </span>
                )}
              </div>
              <button 
                onClick={() => removeLocation(loc.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors"
                title="Remove warehouse"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Full Address</label>
                <p className="text-sm text-slate-800">{loc.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">City / District</label>
                  <p className="text-sm text-slate-800">{loc.city}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Province</label>
                  <p className="text-sm text-slate-800">{loc.province}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Postal Code</label>
                <p className="text-sm text-slate-800 font-mono">{loc.postalCode}</p>
              </div>
            </div>

            {!loc.isDefault && (
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => setAsDefault(loc.id)}
                  className="w-full text-xs font-semibold text-slate-600 hover:text-indigo-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
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
