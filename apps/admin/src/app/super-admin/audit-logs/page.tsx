"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileClock,
  FileJson,
  Fingerprint,
  LockKeyhole,
  Search,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";

type Severity = "info" | "warning" | "critical";
type AuditEvent = {
  id: string;
  timestamp: string;
  event: string;
  category: "Tenant" | "Security" | "Configuration" | "Integration";
  severity: Severity;
  actor: string;
  role: string;
  tenant: string;
  resource: string;
  ip: string;
  summary: string;
  before: string;
  after: string;
};

const EVENTS: AuditEvent[] = [
  { id: "evt_01J5A7X9", timestamp: "14 Aug 2026, 10:45:00 WIB", event: "MENGANTAR_DISPATCHED", category: "Integration", severity: "info", actor: "ops@store-alpha.com", role: "CUSTOMER_SERVICE", tenant: "Store Alpha", resource: "order/ORD-10429", ip: "100.127.67.86", summary: "Order dispatched to JNE through Mengantar.", before: '{"status":"CONFIRMED","waybill":null}', after: '{"status":"DISPATCHED","waybill":"MNG_51628351"}' },
  { id: "evt_01J5A6C2", timestamp: "14 Aug 2026, 10:20:15 WIB", event: "DOMAIN_ADD_ATTEMPT", category: "Tenant", severity: "warning", actor: "owner@store-alpha.com", role: "TENANT_OWNER", tenant: "Store Alpha", resource: "domain/store-alpha.com", ip: "180.252.10.14", summary: "Custom domain submitted and awaiting DNS verification.", before: "null", after: '{"domain":"store-alpha.com","status":"PENDING"}' },
  { id: "evt_01J5A4P8", timestamp: "14 Aug 2026, 10:12:30 WIB", event: "FORM_SCHEMA_PUBLISHED", category: "Configuration", severity: "info", actor: "owner@store-alpha.com", role: "TENANT_OWNER", tenant: "Store Alpha", resource: "form/cod-checkout-v2", ip: "180.252.10.14", summary: "Single-page COD schema version 2 published.", before: '{"version":1,"status":"PUBLISHED"}', after: '{"version":2,"status":"PUBLISHED"}' },
  { id: "evt_01J5A2J1", timestamp: "14 Aug 2026, 10:00:00 WIB", event: "TENANT_PROVISIONED", category: "Tenant", severity: "info", actor: "superadmin@dotads.com", role: "SUPER_ADMIN", tenant: "Store Delta", resource: "tenant/tenant_delta", ip: "127.0.0.1", summary: "New tenant workspace queued for provisioning.", before: "null", after: '{"tier":"STARTER","status":"PROVISIONING"}' },
  { id: "evt_01J59ZZ4", timestamp: "14 Aug 2026, 09:42:18 WIB", event: "PLATFORM_SETTING_UPDATED", category: "Configuration", severity: "warning", actor: "superadmin@dotads.com", role: "SUPER_ADMIN", tenant: "Platform", resource: "config/auth.session_ttl", ip: "127.0.0.1", summary: "Admin session lifetime changed.", before: '{"value":"12 hours"}', after: '{"value":"8 hours"}' },
  { id: "evt_01J59XR3", timestamp: "14 Aug 2026, 08:15:54 WIB", event: "ADMIN_LOGIN_BLOCKED", category: "Security", severity: "critical", actor: "unknown", role: "UNAUTHENTICATED", tenant: "Platform", resource: "auth/admin-login", ip: "45.12.88.210", summary: "Login blocked after five failed password attempts.", before: '{"attempts":4}', after: '{"attempts":5,"blocked":true}' },
  { id: "evt_01J59VQ7", timestamp: "13 Aug 2026, 23:58:10 WIB", event: "TENANT_SUSPENDED", category: "Tenant", severity: "critical", actor: "superadmin@dotads.com", role: "SUPER_ADMIN", tenant: "Store Gamma", resource: "tenant/tenant_gamma", ip: "127.0.0.1", summary: "Tenant access suspended after subscription renewal failed.", before: '{"status":"ACTIVE"}', after: '{"status":"SUSPENDED","reason":"PAYMENT_FAILED"}' },
];

function SeverityBadge({ severity }: { severity: Severity }) {
  const styles: Record<Severity, string> = { info: "bg-indigo-50 text-indigo-700 border-indigo-200", warning: "bg-amber-50 text-amber-700 border-amber-200", critical: "bg-rose-50 text-rose-700 border-rose-200" };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles[severity]}`}>{severity === "critical" ? <AlertTriangle className="h-3.5 w-3.5" /> : severity === "warning" ? <ShieldAlert className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{severity}</span>;
}

export default function GlobalAuditLogsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [tenant, setTenant] = useState("all");
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportFormat, setExportFormat] = useState("CSV");

  const filteredEvents = useMemo(() => {
    const term = query.trim().toLowerCase();
    return EVENTS.filter((event) => (!term || `${event.event} ${event.actor} ${event.tenant} ${event.resource} ${event.summary} ${event.ip}`.toLowerCase().includes(term)) && (category === "all" || event.category === category) && (severity === "all" || event.severity === severity) && (tenant === "all" || event.tenant === tenant));
  }, [category, query, severity, tenant]);

  const criticalCount = EVENTS.filter((event) => event.severity === "critical").length;
  const actors = new Set(EVENTS.map((event) => event.actor)).size;

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><ShieldAlert className="h-4 w-4" /> Governance & security</div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Global Audit Trail</h1><p className="mt-1 text-sm text-slate-500">Append-only platform activity across tenants, integrations, settings, and authentication.</p></div><button onClick={() => { setExportComplete(false); setExportOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><Download className="h-4 w-4" /> Export filtered logs</button></header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: "Events today", value: EVENTS.length.toString(), meta: "Timezone: Asia/Jakarta", icon: FileClock, color: "bg-indigo-50 text-indigo-600" },
        { label: "Critical events", value: criticalCount.toString(), meta: "Require operator review", icon: AlertTriangle, color: "bg-rose-50 text-rose-600" },
        { label: "Unique actors", value: actors.toString(), meta: "Including unauthenticated", icon: UserRound, color: "bg-purple-50 text-purple-600" },
        { label: "Retention", value: "365 days", meta: "Immutable storage policy", icon: LockKeyhole, color: "bg-emerald-50 text-emerald-600" },
      ].map((item) => <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{item.value}</p><p className="mt-1 text-xs text-slate-500">{item.meta}</p></div><span className={`rounded-lg p-2 ${item.color}`}><item.icon className="h-5 w-5" /></span></div></article>)}</section>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"><div className="flex gap-3"><Fingerprint className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><p className="text-sm font-bold text-emerald-900">Append-only integrity is active</p><p className="mt-0.5 text-xs leading-5 text-emerald-800">Audit events cannot be edited or deleted. Exports always include the complete filtered set, not only the visible table page.</p></div></div></div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="space-y-4 border-b border-slate-200 p-5"><div className="flex flex-col gap-3 xl:flex-row xl:items-end"><label className="relative flex-1"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Search logs</span><Search className="absolute bottom-2.5 left-3 h-4 w-4 text-slate-400" /><input aria-label="Search global audit logs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Event, actor, tenant, resource, IP..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label><label className="text-xs font-semibold text-slate-700">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 block w-full min-w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"><option value="all">All categories</option><option>Tenant</option><option>Security</option><option>Configuration</option><option>Integration</option></select></label><label className="text-xs font-semibold text-slate-700">Severity<select value={severity} onChange={(event) => setSeverity(event.target.value)} className="mt-1.5 block w-full min-w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"><option value="all">All severities</option><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select></label><label className="text-xs font-semibold text-slate-700">Tenant scope<select value={tenant} onChange={(event) => setTenant(event.target.value)} className="mt-1.5 block w-full min-w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"><option value="all">All tenants</option><option>Platform</option><option>Store Alpha</option><option>Store Delta</option><option>Store Gamma</option></select></label></div><div className="flex items-center justify-between"><p className="text-xs text-slate-500">Showing <strong className="text-slate-700">{filteredEvents.length}</strong> events · newest first · WIB</p><button onClick={() => { setQuery(""); setCategory("all"); setSeverity("all"); setTenant("all"); }} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Reset filters</button></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3 font-semibold">Time</th><th className="px-5 py-3 font-semibold">Event</th><th className="px-5 py-3 font-semibold">Severity</th><th className="px-5 py-3 font-semibold">Actor</th><th className="px-5 py-3 font-semibold">Tenant</th><th className="px-5 py-3 font-semibold">Resource</th><th className="px-5 py-3 font-semibold">IP address</th><th className="px-5 py-3 text-right font-semibold">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredEvents.map((event) => <tr key={event.id} className="transition-colors hover:bg-slate-50/70"><td className="px-5 py-4"><p className="whitespace-nowrap text-xs font-medium text-slate-700">{event.timestamp}</p><code className="mt-1 block text-[10px] text-slate-400">{event.id}</code></td><td className="px-5 py-4"><p className="font-mono text-xs font-bold text-slate-900">{event.event}</p><p className="mt-1 max-w-xs text-xs text-slate-500">{event.summary}</p></td><td className="px-5 py-4"><SeverityBadge severity={event.severity} /></td><td className="px-5 py-4"><p className="font-medium text-slate-700">{event.actor}</p><p className="text-[11px] text-slate-400">{event.role}</p></td><td className="px-5 py-4 font-medium text-slate-700">{event.tenant}</td><td className="px-5 py-4"><code className="text-xs text-indigo-700">{event.resource}</code></td><td className="px-5 py-4 font-mono text-xs text-slate-500">{event.ip}</td><td className="px-5 py-4 text-right"><button onClick={() => setSelected(event)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Inspect</button></td></tr>)}</tbody></table></div>
        {filteredEvents.length === 0 && <div className="px-5 py-12 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No audit events match</p><p className="text-xs text-slate-500">Broaden the search or reset filters.</p></div>}
      </section>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><section role="dialog" aria-modal="true" aria-labelledby="audit-title" className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><div className="flex items-center gap-2"><SeverityBadge severity={selected.severity} /><span className="text-xs text-slate-400">{selected.category}</span></div><h2 id="audit-title" className="mt-2 font-mono text-lg font-bold text-slate-900">{selected.event}</h2><p className="mt-1 text-xs text-slate-500">{selected.id} · {selected.timestamp}</p></div><button aria-label="Close audit detail" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div><div className="space-y-4 p-5"><p className="text-sm leading-6 text-slate-600">{selected.summary}</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{ label: "Actor", value: selected.actor }, { label: "Role", value: selected.role }, { label: "Tenant", value: selected.tenant }, { label: "IP address", value: selected.ip }].map((item) => <div key={item.label} className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{item.label}</p><p className="mt-1 break-all text-xs font-semibold text-slate-900">{item.value}</p></div>)}</div><div className="grid gap-4 lg:grid-cols-2"><div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Before</p><pre className="min-h-28 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-200">{selected.before}</pre></div><div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">After</p><pre className="min-h-28 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-emerald-300">{selected.after}</pre></div></div></div><div className="flex justify-end border-t border-slate-100 p-5"><button onClick={() => setSelected(null)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Close</button></div></section></div>}

      {exportOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setExportOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="export-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Compliance export</p><h2 id="export-title" className="mt-1 text-lg font-bold text-slate-900">Export audit logs</h2></div><button aria-label="Close audit export" onClick={() => setExportOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div>{exportComplete ? <div className="p-6 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></span><h3 className="mt-4 font-bold text-slate-900">Export prepared</h3><p className="mt-1 text-sm text-slate-500">{filteredEvents.length} filtered events were prepared as {exportFormat}.</p><button onClick={() => setExportOpen(false)} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Done</button></div> : <div className="space-y-4 p-5"><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Filtered event set</p><p className="mt-1 text-2xl font-black text-slate-900">{filteredEvents.length}</p><p className="mt-1 text-xs text-slate-500">Current search and category filters are included.</p></div><label className="block text-xs font-semibold text-slate-700">Export format<select value={exportFormat} onChange={(event) => setExportFormat(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"><option>CSV</option><option>JSON</option></select></label><div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"><Clock3 className="h-4 w-4 shrink-0" /> Export contains actor and IP data. Handle it according to the platform access policy.</div><button onClick={() => setExportComplete(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">{exportFormat === "JSON" ? <FileJson className="h-4 w-4" /> : <Download className="h-4 w-4" />} Prepare {exportFormat}</button></div>}</section></div>}
    </div>
  );
}
