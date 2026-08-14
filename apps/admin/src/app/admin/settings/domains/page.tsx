"use client";

import React, { useState } from "react";
import { Globe, Plus, CheckCircle2, Clock, ShieldCheck, AlertCircle, Copy } from "lucide-react";

interface DomainItem {
  id: string;
  hostname: string;
  isPrimary: boolean;
  status: "verified" | "pending" | "failed";
  sslStatus: "active" | "provisioning";
  verificationToken: string;
}

const SAMPLE_DOMAINS: DomainItem[] = [
  {
    id: "dom_1",
    hostname: "store-alpha.com",
    isPrimary: true,
    status: "verified",
    sslStatus: "active",
    verificationToken: "dotads-verify-alpha-998811",
  },
  {
    id: "dom_2",
    hostname: "shop.mybrand.id",
    isPrimary: false,
    status: "pending",
    sslStatus: "provisioning",
    verificationToken: "dotads-verify-mybrand-772211",
  },
];

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<DomainItem[]>(SAMPLE_DOMAINS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHostname, setNewHostname] = useState("");

  const handleAddDomain = () => {
    if (!newHostname) return;
    const newDom: DomainItem = {
      id: `dom_${Date.now()}`,
      hostname: newHostname,
      isPrimary: false,
      status: "pending",
      sslStatus: "provisioning",
      verificationToken: `dotads-verify-${Math.random().toString(36).substring(7)}`,
    };
    setDomains([...domains, newDom]);
    setNewHostname("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <Globe className="h-4 w-4" /> Routing & DNS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Custom Domains</h1>
          <p className="mt-1 text-sm text-slate-500">Manage tenant custom domains, SSL certificates, and DNS TXT/CNAME routing.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Add Domain</span>
        </button>
      </header>

      {/* Domain List Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {domains.map((dom) => (
          <div key={dom.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 text-base">{dom.hostname}</h3>
                    {dom.isPrimary && (
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">SSL: <span className="font-semibold text-slate-700">{dom.sslStatus.toUpperCase()}</span></p>
                </div>
              </div>

              <div>
                <span
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    dom.status === "verified"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {dom.status === "verified" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span>{dom.status}</span>
                </span>
              </div>
            </div>

            {/* Verification Instructions if pending */}
            {dom.status === "pending" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3 text-sm text-slate-700 mt-auto">
                <h4 className="font-bold text-amber-900 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span>DNS Verification Required</span>
                </h4>
                <p className="text-amber-800 leading-relaxed text-xs">Add the following DNS records to your domain provider (Cloudflare, Namecheap, Niagahoster):</p>
                <div className="bg-white p-4 rounded-lg border border-amber-200 font-mono text-xs space-y-2 text-slate-800 overflow-x-auto shadow-xs">
                  <div className="flex items-center gap-2 whitespace-nowrap"><span className="text-slate-400">Type:</span> <span className="font-bold text-indigo-600">CNAME</span> <span className="text-slate-400 px-2">|</span> <span className="text-slate-400">Name:</span> <span className="font-bold text-slate-900">@</span> <span className="text-slate-400 px-2">|</span> <span className="text-slate-400">Target:</span> <span className="font-bold text-slate-900">ingress.dotads.com</span></div>
                  <div className="flex items-center gap-2 whitespace-nowrap"><span className="text-slate-400">Type:</span> <span className="font-bold text-indigo-600">TXT</span> <span className="text-slate-400 px-2">|</span> <span className="text-slate-400">Name:</span> <span className="font-bold text-slate-900">_dotads-challenge</span> <span className="text-slate-400 px-2">|</span> <span className="text-slate-400">Value:</span> <span className="font-bold text-slate-900">{dom.verificationToken}</span></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-5">
              <h3 className="text-lg font-bold text-slate-900">Add Custom Domain</h3>
              <p className="mt-1 text-xs text-slate-500">Connect a domain you already own to this store.</p>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Hostname / Domain Name</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="promo.mystore.id"
                    value={newHostname}
                    onChange={(e) => setNewHostname(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm font-mono text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-500/20"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDomain}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
              >
                Add Domain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
