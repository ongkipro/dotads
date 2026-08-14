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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Immutable Audit Logs</h1>
        <p className="text-xs text-slate-500">Security audit trail recording tenant modifications, user actions, and domain changes</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, actor email, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-3">Action Event</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-sans">{log.actorEmail}</td>
                  <td className="py-2.5 px-3 text-slate-500">{log.ipAddress}</td>
                  <td className="py-2.5 px-3 text-slate-800 font-sans">{log.details}</td>
                  <td className="py-2.5 px-3 text-slate-400">{log.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
