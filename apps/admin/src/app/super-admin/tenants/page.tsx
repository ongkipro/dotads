"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  Globe2,
  Plus,
  Search,
  ShieldOff,
  Store,
  X,
} from "lucide-react";
import {
  createPlatformTenant,
  listPlatformTenants,
  updatePlatformTenantStatus,
  type PlatformTenant,
  type TenantStatus,
  type TenantTier,
} from "@/lib/platform-tenants";

const statusStyles: Record<TenantStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  suspended: "border-rose-200 bg-rose-50 text-rose-700",
  cancelled: "border-slate-300 bg-slate-100 text-slate-700",
  provisioning: "border-amber-200 bg-amber-50 text-amber-700",
};

const statusLabels: Record<TenantStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  cancelled: "Cancelled",
  provisioning: "Provisioning",
};

function StatusBadge({ status }: { status: TenantStatus }) {
  const Icon = status === "active" ? CheckCircle2 : status === "provisioning" ? Clock3 : Ban;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      <Icon className="h-3.5 w-3.5" />
      {statusLabels[status]}
    </span>
  );
}

function TierBadge({ tier }: { tier: TenantTier }) {
  return <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700">{tier}</span>;
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "The platform request could not be completed.";
}

export default function TenantFleetPage() {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TenantStatus | "all">("all");
  const [tierFilter, setTierFilter] = useState<TenantTier | "all">("all");
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionedName, setProvisionedName] = useState<string | null>(null);
  const [newTenant, setNewTenant] = useState({
    name: "",
    slug: "",
    tier: "STARTER" as TenantTier,
    customDomain: "",
  });

  const loadTenants = async () => {
    setLoading(true);
    setPageError(null);
    try {
      setTenants(await listPlatformTenants());
    } catch (error) {
      setPageError(describeError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTenants();
  }, []);

  const filteredTenants = useMemo(() => {
    const term = query.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const text = `${tenant.name} ${tenant.slug} ${tenant.customDomain || ""}`.toLowerCase();
      return (!term || text.includes(term))
        && (statusFilter === "all" || tenant.status === statusFilter)
        && (tierFilter === "all" || tenant.tier === tierFilter);
    });
  }, [query, statusFilter, tenants, tierFilter]);

  const provisionTenant = async (event: React.FormEvent) => {
    event.preventDefault();
    setMutating(true);
    setMutationError(null);
    try {
      const created = await createPlatformTenant({
        name: newTenant.name.trim(),
        slug: newTenant.slug,
        tier: newTenant.tier,
        ...(newTenant.customDomain.trim() ? { customDomain: newTenant.customDomain.trim() } : {}),
      });
      setTenants((current) => [created, ...current.filter((tenant) => tenant.id !== created.id)]);
      setProvisionedName(created.name);
      setNewTenant({ name: "", slug: "", tier: "STARTER", customDomain: "" });
    } catch (error) {
      setMutationError(describeError(error));
    } finally {
      setMutating(false);
    }
  };

  const changeTenantStatus = async () => {
    if (!selectedTenant || selectedTenant.status === "provisioning" || statusReason.trim().length < 3) return;
    const status = selectedTenant.status === "active" ? "suspended" : "active";
    setMutating(true);
    setMutationError(null);
    try {
      const updated = await updatePlatformTenantStatus(selectedTenant.id, { status, reason: statusReason.trim() });
      setTenants((current) => current.map((tenant) => tenant.id === updated.id ? updated : tenant));
      setSelectedTenant(updated);
      setStatusReason("");
    } catch (error) {
      setMutationError(describeError(error));
    } finally {
      setMutating(false);
    }
  };

  const counts = {
    total: tenants.length,
    active: tenants.filter((tenant) => tenant.status === "active").length,
    suspended: tenants.filter((tenant) => tenant.status === "suspended").length,
    unavailable: tenants.filter((tenant) => tenant.status === "cancelled" || tenant.status === "provisioning").length,
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><Building2 className="h-4 w-4" /> Platform operations</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tenant Fleet Manager</h1>
          <p className="mt-1 text-sm text-slate-500">Data tenant dan kontrol lifecycle langsung dari platform API.</p>
        </div>
        <button onClick={() => { setMutationError(null); setProvisionedName(null); setProvisionOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"><Plus className="h-4 w-4" /> Create tenant</button>
      </header>

      {pageError && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{pageError}</span>
          <button onClick={() => void loadTenants()} className="font-semibold underline underline-offset-2">Retry</button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy={loading}>
        {[
          { label: "Total tenants", value: counts.total },
          { label: "Active", value: counts.active },
          { label: "Suspended", value: counts.suspended },
          { label: "Provisioning / cancelled", value: counts.unavailable },
        ].map((item) => (
          <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{loading ? "—" : item.value}</p>
            <p className="mt-1 text-xs text-slate-500">Current API response</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div><h2 className="text-base font-bold text-slate-900">Semua tenant</h2><p className="text-xs text-slate-500">{filteredTenants.length} dari {tenants.length} data ditampilkan</p></div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_160px_160px]">
            <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search tenants" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, slug, domain..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
            <select aria-label="Filter tenant status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TenantStatus | "all")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><option value="all">All statuses</option><option value="active">Active</option><option value="provisioning">Provisioning</option><option value="suspended">Suspended</option><option value="cancelled">Cancelled</option></select>
            <select aria-label="Filter tenant tier" value={tierFilter} onChange={(event) => setTierFilter(event.target.value as TenantTier | "all")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><option value="all">All plans</option><option value="STARTER">Starter</option><option value="PRO">Pro</option><option value="ENTERPRISE">Enterprise</option></select>
          </div>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3 font-semibold">Tenant</th><th className="px-5 py-3 font-semibold">Status / plan</th><th className="px-5 py-3 font-semibold">Custom domain</th><th className="px-5 py-3 font-semibold">Created</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Store className="h-5 w-5" /></span><div><p className="font-bold text-slate-900">{tenant.name}</p><p className="text-xs text-slate-500">{tenant.slug}</p></div></div></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><StatusBadge status={tenant.status} /><TierBadge tier={tenant.tier} /></div></td>
                  <td className="px-5 py-4 text-slate-600">{tenant.customDomain ? <span className="inline-flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" />{tenant.customDomain}</span> : "Not configured"}</td>
                  <td className="px-5 py-4 text-slate-600">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(tenant.createdAt))}</td>
                  <td className="px-5 py-4 text-right"><button onClick={() => { setMutationError(null); setStatusReason(""); setSelectedTenant(tenant); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredTenants.map((tenant) => (
            <article key={tenant.id} className="space-y-4 p-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Store className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-slate-900">{tenant.name}</h3>
                  <p className="truncate text-xs text-slate-500">{tenant.slug}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={tenant.status} />
                <TierBadge tier={tenant.tier} />
              </div>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Custom domain</dt>
                  <dd className="mt-1 break-all text-slate-700">
                    {tenant.customDomain ? <span className="inline-flex items-start gap-1"><Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{tenant.customDomain}</span> : "Not configured"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created</dt>
                  <dd className="mt-1 text-slate-700">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(tenant.createdAt))}</dd>
                </div>
              </dl>
              <button
                onClick={() => { setMutationError(null); setStatusReason(""); setSelectedTenant(tenant); }}
                aria-label={`Manage ${tenant.name}`}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
              >
                <Eye className="h-4 w-4" /> Manage
              </button>
            </article>
          ))}
        </div>
        {!loading && filteredTenants.length === 0 && <div className="px-5 py-12 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">{tenants.length ? "No tenants match these filters" : "No tenant records returned"}</p>{tenants.length > 0 && <button onClick={() => { setQuery(""); setStatusFilter("all"); setTierFilter("all"); }} className="mt-2 text-xs font-semibold text-indigo-600">Clear filters</button>}</div>}
      </section>

      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedTenant(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="tenant-title" className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5"><div><h2 id="tenant-title" className="text-lg font-bold text-slate-900">{selectedTenant.name}</h2><p className="text-xs text-slate-500">{selectedTenant.id}</p></div><button aria-label="Close tenant manager" onClick={() => setSelectedTenant(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-2"><StatusBadge status={selectedTenant.status} /><TierBadge tier={selectedTenant.tier} /></div>
              <label className="block space-y-1.5 text-xs font-semibold text-slate-700">Reason for lifecycle change<textarea value={statusReason} onChange={(event) => setStatusReason(event.target.value)} minLength={3} maxLength={500} rows={3} placeholder="Required for the audit record" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" /></label>
              {mutationError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{mutationError}</p>}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><ShieldOff className="mr-1 inline h-4 w-4" />Impersonation is unavailable until signed, scoped sessions and persistent operator context are implemented.</div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-between">
              <button disabled className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400">Impersonate unavailable</button>
              <button disabled={mutating || selectedTenant.status === "provisioning" || statusReason.trim().length < 3} onClick={() => void changeTenantStatus()} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${selectedTenant.status === "active" ? "border border-rose-200 bg-rose-50 text-rose-700" : "bg-emerald-600 text-white"}`}>{mutating ? "Saving…" : selectedTenant.status === "active" ? "Suspend tenant" : "Activate tenant"}</button>
            </div>
          </section>
        </div>
      )}

      {provisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setProvisionOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="provision-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Fleet lifecycle</p><h2 id="provision-title" className="mt-1 text-lg font-bold text-slate-900">Create tenant record</h2></div><button aria-label="Close create form" onClick={() => setProvisionOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            {provisionedName ? <div className="p-6 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" /><h3 className="mt-4 font-bold text-slate-900">{provisionedName} created</h3><p className="mt-1 text-sm text-slate-500">The API returned the persisted tenant record. Owner onboarding is not part of this platform endpoint.</p><button onClick={() => setProvisionOpen(false)} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">Done</button></div> : <form onSubmit={(event) => void provisionTenant(event)} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-xs font-semibold text-slate-700">Tenant name<input required minLength={2} value={newTenant.name} onChange={(event) => setNewTenant({ ...newTenant, name: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label><label className="space-y-1.5 text-xs font-semibold text-slate-700">Workspace slug<input required minLength={2} pattern="[a-z0-9-]+" value={newTenant.slug} onChange={(event) => setNewTenant({ ...newTenant, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label></div>
              <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-xs font-semibold text-slate-700">Initial plan<select value={newTenant.tier} onChange={(event) => setNewTenant({ ...newTenant, tier: event.target.value as TenantTier })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="STARTER">Starter</option><option value="PRO">Pro</option><option value="ENTERPRISE">Enterprise</option></select></label><label className="space-y-1.5 text-xs font-semibold text-slate-700">Custom domain (optional)<input value={newTenant.customDomain} onChange={(event) => setNewTenant({ ...newTenant, customDomain: event.target.value })} placeholder="shop.example.id" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label></div>
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">This endpoint creates the tenant record and audit entry only. It does not provision an owner account or membership.</p>
              {mutationError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{mutationError}</p>}
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setProvisionOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button disabled={mutating} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" />{mutating ? "Creating…" : "Create tenant"}</button></div>
            </form>}
          </section>
        </div>
      )}
    </div>
  );
}
