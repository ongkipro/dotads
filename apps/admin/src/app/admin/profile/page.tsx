"use client";

import React, { useState } from "react";
import { User, Save, Mail, Lock, Shield, Key } from "lucide-react";

export default function ProfilePage() {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "Paduka Ongki",
    email: "ongki@dotads.id",
    phone: "62811112222",
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Merchant Profile
          </h1>
          <p className="text-xs text-slate-500">Manage your personal account details and security.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-xs transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving..." : "Save Profile"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-2xl flex items-center justify-center mb-3">
              PO
            </div>
            <h2 className="font-bold text-slate-900">{formData.fullName}</h2>
            <p className="text-xs text-slate-500 mb-4">{formData.email}</p>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-4">
              <Shield className="w-3 h-3" />
              <span>TENANT_OWNER</span>
            </span>
            <button className="text-xs font-semibold text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-md px-3 py-1.5 w-full transition-colors">
              Change Avatar
            </button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center space-x-2 bg-slate-50/50">
              <User className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800">Personal Information</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-md cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Contact support to change your primary email address.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center space-x-2 bg-slate-50/50">
              <Lock className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800">Security</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Password</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Change your account password securely.</p>
                </div>
                <button className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors">
                  Update
                </button>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Two-Factor Authentication</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security to your account.</p>
                </div>
                <button className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition-colors">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center space-x-2 bg-slate-50/50">
              <Key className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800">API Access & Keys</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-4">
                Use your Personal Access Token to authenticate against the DotAds v2 API. Keep this token secret.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between">
                <code className="text-xs font-mono text-slate-800 select-all">dotads_pat_********************************</code>
                <button className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors">
                  Reveal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
