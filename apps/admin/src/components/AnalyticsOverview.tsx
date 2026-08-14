"use client";

import React from "react";
import { TrendingUp, ShoppingBag, DollarSign, Radio, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PERFORMANCE_DATA = [
  { day: "Mon", gmv: 4200000, orders: 28, capiMatch: 8.9 },
  { day: "Tue", gmv: 5100000, orders: 34, capiMatch: 9.1 },
  { day: "Wed", gmv: 6800000, orders: 45, capiMatch: 9.3 },
  { day: "Thu", gmv: 6100000, orders: 39, capiMatch: 9.0 },
  { day: "Fri", gmv: 7900000, orders: 52, capiMatch: 9.4 },
  { day: "Sat", gmv: 9200000, orders: 61, capiMatch: 9.5 },
  { day: "Sun", gmv: 8500000, orders: 56, capiMatch: 9.2 },
];

export function AnalyticsOverview() {
  return (
    <div className="space-y-6">
      {/* Top Level KPI Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-24 h-24 text-emerald-600" />
          </div>
          <div className="flex items-center space-x-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Gross Revenue</span>
          </div>
          <div className="relative z-10">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Rp 47.8M</p>
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                18.4%
              </span>
              <span className="text-xs text-slate-500 font-medium">vs last week</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingBag className="w-24 h-24 text-indigo-600" />
          </div>
          <div className="flex items-center space-x-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Orders</span>
          </div>
          <div className="relative z-10">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">315</p>
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                12.1%
              </span>
              <span className="text-xs text-slate-500 font-medium">vs last week</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Radio className="w-24 h-24 text-purple-600" />
          </div>
          <div className="flex items-center space-x-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
              <Radio className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Meta CAPI Score</span>
          </div>
          <div className="relative z-10">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              9.3 <span className="text-lg text-slate-400 font-medium">/ 10</span>
            </p>
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                Excellent Match
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-24 h-24 text-amber-600" />
          </div>
          <div className="flex items-center space-x-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Conversion Rate</span>
          </div>
          <div className="relative z-10">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">4.82%</p>
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                0.5%
              </span>
              <span className="text-xs text-slate-500 font-medium">vs last week</span>
            </div>
          </div>
        </div>
      </div>

      {/* GMV Trend Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Revenue Performance Trend</h3>
            <p className="text-sm text-slate-500 mt-1">Daily GMV breakdown from direct Meta Ads traffic</p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button className="px-3 py-1.5 text-xs font-semibold bg-white shadow-sm rounded-md text-slate-800 border border-slate-200">7 Days</button>
            <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-md transition-colors">30 Days</button>
            <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-md transition-colors">YTD</button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PERFORMANCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gmvColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="day" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val: number) => `Rp ${val / 1000000}M`}
              />
              <Tooltip
                formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, "GMV"]}
                labelStyle={{ color: "#64748b", fontWeight: 600, marginBottom: "4px" }}
                contentStyle={{ 
                  borderRadius: "12px", 
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                  padding: "12px",
                  fontWeight: 600
                }}
              />
              <Area 
                type="monotone" 
                dataKey="gmv" 
                stroke="#4f46e5" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#gmvColor)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: "#4f46e5" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
