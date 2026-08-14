"use client";

import React, { useState } from "react";
import { Package, Plus, Search, Tag, Barcode, CheckCircle2, AlertCircle, Edit, Trash2 } from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  gtin: string;
  priceFormatted: string;
  compareAtPriceFormatted?: string;
  status: "active" | "draft" | "archived";
  inventory: number;
}

const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: "prod_1",
    name: "Alpha Premium Gadget",
    slug: "alpha-premium-gadget",
    gtin: "8991234567890",
    priceFormatted: "Rp 299.000",
    compareAtPriceFormatted: "Rp 499.000",
    status: "active",
    inventory: 142,
  },
  {
    id: "prod_2",
    name: "Ultra Ergonomic Pillow",
    slug: "ultra-ergonomic-pillow",
    gtin: "8991234567891",
    priceFormatted: "Rp 185.000",
    compareAtPriceFormatted: "Rp 250.000",
    status: "active",
    inventory: 89,
  },
  {
    id: "prod_3",
    name: "Smart Watch V2 - Fitness Edition",
    slug: "smart-watch-v2",
    gtin: "8991234567892",
    priceFormatted: "Rp 450.000",
    status: "draft",
    inventory: 0,
  },
];

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<ProductItem[]>(SAMPLE_PRODUCTS);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.gtin.includes(searchTerm) ||
      p.slug.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Products & Catalog</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage catalog products, GTIN barcode identifiers, and pricing for direct Meta Ads forms</p>
        </div>

        <button className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-xs transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* Filter & Search */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search product name, GTIN, or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Product Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">GTIN Barcode</th>
                <th className="py-2.5 px-3">Price</th>
                <th className="py-2.5 px-3">Inventory</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900">{product.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">/{product.slug}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center space-x-1 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                      <Barcode className="w-3 h-3 text-slate-500" />
                      <span>{product.gtin}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900">{product.priceFormatted}</p>
                    {product.compareAtPriceFormatted && (
                      <p className="text-[10px] text-slate-400 line-through">
                        {product.compareAtPriceFormatted}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-semibold ${
                        product.inventory > 10 ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {product.inventory} units
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        product.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {product.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1">
                    <button className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
