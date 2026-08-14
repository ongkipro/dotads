"use client";

import React, { useState } from "react";
import { 
  Building2, 
  ShieldAlert, 
  Activity, 
  DollarSign, 
  ExternalLink, 
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Settings,
  Ban,
  ArrowUpRight,
  Database
} from "lucide-react";

interface TenantFleetRow {
  id: string;
  name: string;
  slug: string;
  tier: "STARTER" | "PRO" | "ENTERPRISE";
  status: "active" | "suspended" | "provisioning";
  customDomain: string;
  gmvFormatted: string;
  ordersCount: number;
  lastActive: string;
}

const SAMPLE_FLEET: TenantFleetRow[] = [
  {
    id: "tenant_alpha",
    name: "Store Alpha",
    slug: "store-alpha",
    tier: "PRO",
    status: "active",
    customDomain: "store-alpha.com",
    gmvFormatted: "Rp 47.800.000",
    ordersCount: 315,
    lastActive: "2 mins ago"
  },
  {
    id: "tenant_beta",
    name: "Store Beta",
    slug: "store-beta",
    tier: "STARTER",
    status: "active",
    customDomain: "store-beta.com",
    gmvFormatted: "Rp 12.400.000",
    ordersCount: 88,
    lastActive: "1 hour ago"
  },
  {
    id: "tenant_gamma",
    name: "Store Gamma",
    slug: "store-gamma",
    tier: "ENTERPRISE",
    status: "suspended",
    customDomain: "store-gamma.id",
    gmvFormatted: "Rp 124.000.000",
    ordersCount: 1042,
    lastActive: "2 days ago"
  },
  {
    id: "tenant_delta",
    name: "Store Delta",
    slug: "store-delta",
    tier: "STARTER",
    status: "provisioning",
    customDomain: "store-delta.net",
    gmvFormatted: "Rp 0",
    ordersCount: 0,
    lastActive: "Just now"
  }
];

interface PlatformActivity {
  id: string;
  type: "tenant_created" | "tier_upgraded" | "payment_failed" | "security_alert" | "system_update";
  message: string;
  tenantName: string;
  timestamp: string;
}

const ACTIVITY_FEED: PlatformActivity[] = [
  { id: "1", type: "tenant_created", message: "New tenant provisioned successfully.", tenantName: "Store Delta", timestamp: "10 mins ago" },
  { id: "2", type: "tier_upgraded", message: "Upgraded to PRO tier via Stripe.", tenantName: "Store Alpha", timestamp: "1 hour ago" },
  { id: "3", type: "security_alert", message: "Failed admin login (5x attempts).", tenantName: "System", timestamp: "2 hours ago" },
  { id: "4", type: "system_update", message: "Database replica auto-scaled.", tenantName: "System", timestamp: "5 hours ago" },
  { id: "5", type: "payment_failed", message: "Subscription renewal failed.", tenantName: "Store Gamma", timestamp: "1 day ago" },
];

export default function SuperAdminOverviewPage() {
  const [fleet] = useState<TenantFleetRow[]>(SAMPLE_FLEET);

  const getStatusBadge = (status: TenantFleetRow["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full text-[11px] border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 font-semibold px-2.5 py-1 rounded-full text-[11px] border border-rose-200">
            <Ban className="w-3 h-3" /> Suspended
          </span>
        );
      case "provisioning":
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full text-[11px] border border-amber-200">
            <Clock className="w-3 h-3 animate-pulse" /> Provisioning
          </span>
        );
    }
  };

  const getTierBadge = (tier: TenantFleetRow["tier"]) => {
    const styles = {
      STARTER: "bg-slate-100 text-slate-700 border-slate-200",
      PRO: "bg-indigo-50 text-indigo-700 border-indigo-200",
      ENTERPRISE: "bg-purple-50 text-purple-700 border-purple-200",
    };
    return (
      <span className={`font-bold px-2 py-0.5 rounded text-[10px] border ${styles[tier]}`}>
        {tier}
      </span>
    );
  };

  const getActivityIcon = (type: PlatformActivity["type"]) => {
    switch (type) {
      case "tenant_created": return <Building2 className="w-4 h-4 text-emerald-600" />;
      case "tier_upgraded": return <ArrowUpRight className="w-4 h-4 text-indigo-600" />;
      case "payment_failed": return <Ban className="w-4 h-4 text-rose-600" />;
      case "security_alert": return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case "system_update": return <Database className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Global SaaS tenant fleet health, platform metrics, and administrative controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs">
            <Settings className="w-4 h-4" />
            Platform Settings
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Building2 className="w-16 h-16 text-indigo-600" />
          </div>
          <div className="flex items-center gap-3 text-slate-600 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Tenant Fleet</span>
          </div>
          <p className="text-3xl font-black text-slate-900">4</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +1 this week
            </span>
            <span className="text-xs text-slate-500">Total active stores</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="flex items-center gap-3 text-slate-600 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Global GMV</span>
          </div>
          <p className="text-3xl font-black text-slate-900">Rp 184.2M</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-emerald-600 font-medium">processed across fleet</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-16 h-16 text-purple-600" />
          </div>
          <div className="flex items-center gap-3 text-slate-600 mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">System API</span>
          </div>
          <p className="text-3xl font-black text-purple-700">99.99%</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Healthy (0.02s)
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldAlert className="w-16 h-16 text-amber-600" />
          </div>
          <div className="flex items-center gap-3 text-slate-600 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Security Logs</span>
          </div>
          <p className="text-3xl font-black text-slate-900">1</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-amber-600 font-medium">Recent violation detected</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Tenant Fleet */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Tenant Fleet Management</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tenants..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64"
                />
              </div>
              <button className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold text-slate-600">Tenant</th>
                    <th className="py-3 px-4 font-semibold text-slate-600">Status & Tier</th>
                    <th className="py-3 px-4 font-semibold text-slate-600">Performance</th>
                    <th className="py-3 px-4 font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fleet.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {tenant.name}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" /> {tenant.customDomain}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top space-y-2">
                        <div>{getStatusBadge(tenant.status)}</div>
                        <div>{getTierBadge(tenant.tier)}</div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{tenant.gmvFormatted}</span>
                          <span className="text-xs text-slate-500">{tenant.ordersCount} total orders</span>
                          <span className="text-[10px] text-slate-400 mt-1">Last active: {tenant.lastActive}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md font-semibold transition-colors"
                            title="Impersonate Tenant"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Impersonate</span>
                          </button>
                          
                          <button 
                            className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md font-semibold transition-colors"
                            title="Edit Tier"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Edit Tier</span>
                          </button>

                          <button 
                            className="inline-flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-md font-semibold transition-colors"
                            title="Suspend Tenant"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Suspend</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
              <button className="text-sm text-indigo-600 font-semibold hover:text-indigo-700">View All Tenants →</button>
            </div>
          </div>
        </div>

        {/* Sidebar: Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Platform Activity</h2>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="space-y-6">
              {ACTIVITY_FEED.map((activity, index) => (
                <div key={activity.id} className="relative">
                  {/* Timeline connector */}
                  {index !== ACTIVITY_FEED.length - 1 && (
                    <div className="absolute top-8 left-4 bottom-[-24px] w-px bg-slate-100" />
                  )}
                  
                  <div className="flex gap-4">
                    <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-100 shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="pt-1.5 flex-1">
                      <p className="text-sm text-slate-800 font-medium leading-snug">
                        {activity.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-slate-600">{activity.tenantName}</span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-xs text-slate-400">{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Load More Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}