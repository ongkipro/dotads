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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Custom Domains & Branding</h1>
          <p className="text-xs text-slate-500">Manage tenant custom domains, SSL certificates, and DNS TXT/CNAME routing</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Domain</span>
        </button>
      </div>

      {/* Domain List Cards */}
      <div className="space-y-4">
        {domains.map((dom) => (
          <div key={dom.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 text-sm">{dom.hostname}</h3>
                    {dom.isPrimary && (
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        PRIMARY DOMAIN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">SSL Certificate: {dom.sslStatus.toUpperCase()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    dom.status === "verified"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {dom.status === "verified" ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  <span>{dom.status.toUpperCase()}</span>
                </span>
              </div>
            </div>

            {/* Verification Instructions if pending */}
            {dom.status === "pending" && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-md p-4 space-y-2 text-xs text-slate-700">
                <h4 className="font-bold text-amber-900 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>DNS Verification Instructions Needed</span>
                </h4>
                <p>Add the following DNS records to your domain provider (Cloudflare, Namecheap, Niagahoster):</p>
                <div className="bg-white p-3 rounded border border-amber-200 font-mono text-[11px] space-y-1 text-slate-800">
                  <p>Type: <span className="font-bold">CNAME</span> | Name: <span className="font-bold">@</span> | Target: <span className="font-bold">ingress.dotads.com</span></p>
                  <p>Type: <span className="font-bold">TXT</span> | Name: <span className="font-bold">_dotads-challenge</span> | Value: <span className="font-bold">{dom.verificationToken}</span></p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add New Custom Domain</h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Hostname / Domain Name</label>
              <input
                type="text"
                placeholder="e.g. promo.mystore.id"
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDomain}
                className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded font-semibold"
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
