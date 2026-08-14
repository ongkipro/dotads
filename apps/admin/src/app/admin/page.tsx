"use client";

import React from "react";
import { AnalyticsOverview } from "@/components/AnalyticsOverview";
import { OrderDataTable } from "@/components/OrderDataTable";
import { Calendar, Download, RefreshCcw } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tenant Merchant Overview</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Live operational performance and direct ads conversion metrics
          </p>
        </div>
        
        {/* Page Actions */}
        <div className="flex items-center space-x-3">
          <button className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
            <RefreshCcw className="w-4 h-4 text-slate-400" />
            <span>Sync CAPI</span>
          </button>
          
          <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Aug 14, 2026 - Today</span>
          </div>

          <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-8">
        <section>
          <AnalyticsOverview />
        </section>

        <section>
          <OrderDataTable />
        </section>
      </div>
    </div>
  );
}
