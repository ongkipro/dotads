"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  Ban,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  Globe2,
  Plus,
  Search,
  ServerCog,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";

type TenantStatus = "active" | "suspended" | "provisioning";
type TenantTier = "STARTER" | "PRO" | "ENTERPRISE";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  owner: string;
  domain: string;
  tier: TenantTier;
  status: TenantStatus;
  users: number;
  orders: number;
  gmv: number;
  region: string;
  lastActive: string;
};

const INITIAL_TENANTS: Tenant[] = [
  { id: "tenant_alpha", name: "Store Alpha", slug: "store-alpha", owner: "owner@store-alpha.com", domain: "store-alpha.com", tier: "PRO", status: "active", users: 12, orders: 315, gmv: 47800000, region: "Jakarta", lastActive: "2 menit lalu" },
  { id: "tenant_beta", name: "Store Beta", slug: "store-beta", owner: "owner@store-beta.com", domain: "store-beta.com", tier: "STARTER", status: "active", users: 4, orders: 88, gmv: 12400000, region: "Surabaya", lastActive: "1 jam lalu" },
  { id: "tenant_gamma", name: "Store Gamma", slug: "store-gamma", owner: "ops@store-gamma.id", domain: "store-gamma.id", tier: "ENTERPRISE", status: "suspended", users: 28, orders: 1042, gmv: 124000000, region: "Bandung", lastActive: "2 hari lalu" },
  { id: "tenant_delta", name: "Store Delta", slug: "store-delta", owner: "hello@store-delta.net", domain: "store-delta.net", tier: "STARTER", status: "provisioning", users: 1, orders: 0, gmv: 0, region: "Medan", lastActive: "Baru saja" },
  { id: "tenant_nusa", name: "Nusa Commerce", slug: "nusa-commerce", owner: "admin@nusa.co.id", domain: "shop.nusa.co.id", tier: "PRO", status: "active", users: 9, orders: 227, gmv: 32150000, region: "Makassar", lastActive: "18 menit lalu" },
];

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

function StatusBadge({ status }: { status: TenantStatus }) {
  const styles: Record<TenantStatus, string> = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    suspended: "border-rose-200 bg-rose-50 text-rose-700",
    provisioning: "border-amber-200 bg-amber-50 text-amber-700",
  };
  const labels: Record<TenantStatus, string> = { active: "Active", suspended: "Suspended", provisioning: "Provisioning" };
  const Icon = status === "active" ? CheckCircle2 : status === "suspended" ? Ban : Clock3;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}><Icon className="h-3.5 w-3.5" />{labels[status]}</span>;
}

function TierBadge({ tier }: { tier: TenantTier }) {
  const styles: Record<TenantTier, string> = {
    STARTER: "border-slate-200 bg-slate-100 text-slate-700",
    PRO: "border-indigo-200 bg-indigo-50 text-indigo-700",
    ENTERPRISE: "border-purple-200 bg-purple-50 text-purple-700",
  };
  return <span className={`rounded-md border px-2 py-1 text-[11px] font-bold ${styles[tier]}`}>{tier}</span>;
}

export default function TenantFleetPage() {
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionedName, setProvisionedName] = useState<string | null>(null);
  const [newTenant, setNewTenant] = useState({ name: "", slug: "", owner: "", tier: "STARTER" as TenantTier, region: "Jakarta" });

  const filteredTenants = useMemo(() => {
    const term = query.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const text = `${tenant.name} ${tenant.slug} ${tenant.owner} ${tenant.domain}`.toLowerCase();
      return (!term || text.includes(term)) && (statusFilter === "all" || tenant.status === statusFilter) && (tierFilter === "all" || tenant.tier === tierFilter);
    });
  }, [query, statusFilter, tenants, tierFilter]);

  const activeTenants = tenants.filter((tenant) => tenant.status === "active").length;
  const totalGmv = tenants.reduce((sum, tenant) => sum + tenant.gmv, 0);
  const totalUsers = tenants.reduce((sum, tenant) => sum + tenant.users, 0);

  const provisionTenant = (event: React.FormEvent) => {
    event.preventDefault();
    const created: Tenant = {
      id: `tenant_${Date.now()}`,
      name: newTenant.name,
      slug: newTenant.slug,
      owner: newTenant.owner,
      domain: `${newTenant.slug}.dotads.id`,
      tier: newTenant.tier,
      status: "provisioning",
      users: 1,
      orders: 0,
      gmv: 0,
      region: newTenant.region,
      lastActive: "Baru saja",
    };
    setTenants((current) => [created, ...current]);
    setProvisionedName(created.name);
    setNewTenant({ name: "", slug: "", owner: "", tier: "STARTER", region: "Jakarta" });
  };

  const toggleTenantStatus = () => {
    if (!selectedTenant || selectedTenant.status === "provisioning") return;
    const nextStatus: TenantStatus = selectedTenant.status === "active" ? "suspended" : "active";
    setTenants((current) => current.map((tenant) => tenant.id === selectedTenant.id ? { ...tenant, status: nextStatus } : tenant));
    setSelectedTenant({ ...selectedTenant, status: nextStatus });
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><Building2 className="h-4 w-4" /> Platform operations</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tenant Fleet Manager</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor tenant health, plans, usage, and lifecycle across the DotAds platform.</p>
        </div>
        <button onClick={() => { setProvisionedName(null); setProvisionOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><Plus className="h-4 w-4" /> Provision tenant</button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total tenants", value: tenants.length.toString(), meta: `${activeTenants} active`, icon: Building2, color: "bg-indigo-50 text-indigo-600" },
          { label: "Global GMV", value: formatRupiah(totalGmv), meta: "All tenants · WIB", icon: Activity, color: "bg-emerald-50 text-emerald-600" },
          { label: "Platform users", value: totalUsers.toString(), meta: "Across every workspace", icon: Users, color: "bg-purple-50 text-purple-600" },
          { label: "Fleet health", value: "99.98%", meta: "30-day availability", icon: ShieldCheck, color: "bg-amber-50 text-amber-600" },
        ].map((item) => (
          <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{item.value}</p><p className="mt-1 text-xs text-slate-500">{item.meta}</p></div><span className={`rounded-lg p-2 ${item.color}`}><item.icon className="h-5 w-5" /></span></div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div><h2 className="text-base font-bold text-slate-900">All tenants</h2><p className="text-xs text-slate-500">{filteredTenants.length} of {tenants.length} workspaces visible</p></div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_160px_160px]">
            <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search tenants" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, owner, domain..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
            <select aria-label="Filter tenant status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"><option value="all">All statuses</option><option value="active">Active</option><option value="provisioning">Provisioning</option><option value="suspended">Suspended</option></select>
            <select aria-label="Filter tenant tier" value={tierFilter} onChange={(event) => setTierFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"><option value="all">All plans</option><option value="STARTER">Starter</option><option value="PRO">Pro</option><option value="ENTERPRISE">Enterprise</option></select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3 font-semibold">Tenant</th><th className="px-5 py-3 font-semibold">Status / plan</th><th className="px-5 py-3 font-semibold">Owner</th><th className="px-5 py-3 font-semibold">Region</th><th className="px-5 py-3 text-right font-semibold">Users</th><th className="px-5 py-3 text-right font-semibold">Orders</th><th className="px-5 py-3 text-right font-semibold">GMV</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Store className="h-5 w-5" /></span><div><p className="font-bold text-slate-900">{tenant.name}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><Globe2 className="h-3 w-3" />{tenant.domain}</p></div></div></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><StatusBadge status={tenant.status} /><TierBadge tier={tenant.tier} /></div></td>
                  <td className="px-5 py-4"><p className="font-medium text-slate-700">{tenant.owner}</p><p className="text-xs text-slate-400">Active {tenant.lastActive}</p></td>
                  <td className="px-5 py-4 text-slate-600">{tenant.region}</td>
                  <td className="px-5 py-4 text-right font-medium text-slate-700">{tenant.users}</td>
                  <td className="px-5 py-4 text-right font-medium text-slate-700">{tenant.orders.toLocaleString("id-ID")}</td>
                  <td className="px-5 py-4 text-right font-bold text-slate-900">{formatRupiah(tenant.gmv)}</td>
                  <td className="px-5 py-4 text-right"><button onClick={() => setSelectedTenant(tenant)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTenants.length === 0 && <div className="px-5 py-12 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No tenants match these filters</p><button onClick={() => { setQuery(""); setStatusFilter("all"); setTierFilter("all"); }} className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700">Clear filters</button></div>}
      </section>

      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedTenant(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="tenant-title" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Building2 className="h-6 w-6" /></span><div><div className="flex items-center gap-2"><h2 id="tenant-title" className="text-lg font-bold text-slate-900">{selectedTenant.name}</h2><StatusBadge status={selectedTenant.status} /></div><p className="text-xs text-slate-500">{selectedTenant.id} · {selectedTenant.slug}</p></div></div><button aria-label="Close tenant manager" onClick={() => setSelectedTenant(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div>
            <div className="grid gap-4 p-5 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">GMV</p><p className="mt-1 font-bold text-slate-900">{formatRupiah(selectedTenant.gmv)}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Orders</p><p className="mt-1 font-bold text-slate-900">{selectedTenant.orders.toLocaleString("id-ID")}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Users</p><p className="mt-1 font-bold text-slate-900">{selectedTenant.users}</p></div></div>
            <div className="mx-5 mb-5 rounded-xl border border-slate-200"><div className="grid grid-cols-[140px_1fr] border-b border-slate-100 px-4 py-3 text-sm"><span className="text-slate-500">Owner</span><span className="font-medium text-slate-900">{selectedTenant.owner}</span></div><div className="grid grid-cols-[140px_1fr] border-b border-slate-100 px-4 py-3 text-sm"><span className="text-slate-500">Domain</span><span className="font-medium text-slate-900">{selectedTenant.domain}</span></div><div className="grid grid-cols-[140px_1fr] px-4 py-3 text-sm"><span className="text-slate-500">Plan / region</span><span className="font-medium text-slate-900">{selectedTenant.tier} · {selectedTenant.region}</span></div></div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-between"><button disabled={selectedTenant.status === "provisioning"} onClick={toggleTenantStatus} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${selectedTenant.status === "suspended" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}>{selectedTenant.status === "suspended" ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}{selectedTenant.status === "suspended" ? "Reactivate tenant" : "Suspend tenant"}</button><div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ServerCog className="h-4 w-4" /> Infrastructure</button><button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><ExternalLink className="h-4 w-4" /> Open workspace</button></div></div>
          </section>
        </div>
      )}

      {provisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setProvisionOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="provision-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Fleet lifecycle</p><h2 id="provision-title" className="mt-1 text-lg font-bold text-slate-900">Provision new tenant</h2></div><button aria-label="Close provision form" onClick={() => setProvisionOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div>
            {provisionedName ? <div className="p-6 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></span><h3 className="mt-4 font-bold text-slate-900">{provisionedName} queued for provisioning</h3><p className="mt-1 text-sm text-slate-500">The workspace is visible in the fleet with a provisioning status.</p><button onClick={() => setProvisionOpen(false)} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Done</button></div> : <form onSubmit={provisionTenant} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-xs font-semibold text-slate-700">Tenant name<input required value={newTenant.name} onChange={(event) => setNewTenant({ ...newTenant, name: event.target.value })} placeholder="Acme Commerce" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label><label className="space-y-1.5 text-xs font-semibold text-slate-700">Workspace slug<input required pattern="[a-z0-9-]+" value={newTenant.slug} onChange={(event) => setNewTenant({ ...newTenant, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="acme-commerce" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label></div>
              <label className="space-y-1.5 text-xs font-semibold text-slate-700">Owner email<input required type="email" value={newTenant.owner} onChange={(event) => setNewTenant({ ...newTenant, owner: event.target.value })} placeholder="owner@acme.co.id" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-xs font-semibold text-slate-700">Initial plan<select value={newTenant.tier} onChange={(event) => setNewTenant({ ...newTenant, tier: event.target.value as TenantTier })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"><option value="STARTER">Starter</option><option value="PRO">Pro</option><option value="ENTERPRISE">Enterprise</option></select></label><label className="space-y-1.5 text-xs font-semibold text-slate-700">Primary region<select value={newTenant.region} onChange={(event) => setNewTenant({ ...newTenant, region: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"><option>Jakarta</option><option>Surabaya</option><option>Bandung</option><option>Makassar</option><option>Medan</option></select></label></div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">Provisioning creates an isolated workspace and records the actor in the global audit trail.</div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setProvisionOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> Provision</button></div>
            </form>}
          </section>
        </div>
      )}
    </div>
  );
}
