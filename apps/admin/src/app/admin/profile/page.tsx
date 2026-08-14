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
    <div className="space-y-6 pb-8 max-w-4xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <User className="h-4 w-4" /> Personal Account
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Merchant Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your personal account details and security settings.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? "Saving..." : "Save Profile"}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-3xl flex items-center justify-center mb-4 ring-4 ring-indigo-50">
              PO
            </div>
            <h2 className="font-bold text-lg text-slate-900">{formData.fullName}</h2>
            <p className="text-sm text-slate-500 mb-5">{formData.email}</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-6">
              <Shield className="w-3.5 h-3.5" />
              <span>TENANT_OWNER</span>
            </span>
            <button className="text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 w-full transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500/20">
              Change Avatar
            </button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
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
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-sm font-normal text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Contact support to change your primary email address.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-bold text-slate-900">Security</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Password</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Change your account password securely.</p>
                </div>
                <button className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-slate-500/20">
                  Update
                </button>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Add an extra layer of security to your account.</p>
                </div>
                <button className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500/20">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-bold text-slate-900">API Access & Keys</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-5">
                Use your Personal Access Token to authenticate against the DotAds v2 API. Keep this token secret.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                <code className="text-sm font-mono text-slate-800 select-all">dotads_pat_********************************</code>
                <button className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500/20 px-2 py-1 rounded">
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
