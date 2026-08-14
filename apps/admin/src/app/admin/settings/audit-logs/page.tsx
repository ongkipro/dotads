"use client";

import React, { useState } from "react";
import { ShieldAlert, Search, FileText, User } from "lucide-react";

interface AuditLogRow {
  id: string;
  action: string;
  actorEmail: string;
  ipAddress: string;
  details: string;
  createdAt: string;
}

const SAMPLE_AUDIT_LOGS: AuditLogRow[] = [
  { id: "log_1", action: "TENANT_PROVISIONED", actorEmail: "superadmin@dotads.com", ipAddress: "127.0.0.1", details: "Seeded tenant store-alpha (Store Alpha)", createdAt: "2026-08-14 10:00:00" },
  { id: "log_2", action: "FORM_SCHEMA_PUBLISHED", actorEmail: "owner@store-alpha.com", ipAddress: "180.252.10.14", details: "Published Form Schema v2 for single-page COD", createdAt: "2026-08-14 10:12:30" },
  { id: "log_3", action: "DOMAIN_ADD_ATTEMPT", actorEmail: "owner@store-alpha.com", ipAddress: "180.252.10.14", details: "Added domain store-alpha.com for verification", createdAt: "2026-08-14 10:20:15" },
  { id: "log_4", action: "MENGANTAR_DISPATCH", actorEmail: "ops@store-alpha.com", ipAddress: "100.127.67.86", details: "Dispatched Waybill MNG_51628351 to JNE", createdAt: "2026-08-14 10:45:00" },
];

export default function AdminAuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = SAMPLE_AUDIT_LOGS.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            <ShieldAlert className="h-4 w-4" /> Security Logs
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Immutable Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">Security audit trail recording tenant modifications, user actions, and domain changes.</p>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="relative max-w-sm">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search action, actor email, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold">Action Event</th>
                <th className="px-5 py-3 font-semibold">Actor</th>
                <th className="px-5 py-3 font-semibold">IP Address</th>
                <th className="px-5 py-3 font-semibold">Details</th>
                <th className="px-5 py-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-md border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-700 font-sans font-medium">{log.actorEmail}</td>
                  <td className="px-5 py-4 text-slate-500">{log.ipAddress}</td>
                  <td className="px-5 py-4 text-slate-800 font-sans">{log.details}</td>
                  <td className="px-5 py-4 text-slate-400">{log.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
