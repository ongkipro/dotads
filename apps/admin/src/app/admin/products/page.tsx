"use client";

import React, { useState } from "react";
import { Package, Plus, Search, Tag, Barcode, CheckCircle2, AlertCircle, Edit, Trash2, X, Image as ImageIcon, Sparkles } from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  gtin: string;
  priceFormatted: string;
  priceValue: number;
  compareAtPriceFormatted?: string;
  compareAtPriceValue?: number;
  status: "active" | "draft" | "archived";
  inventory: number;
  imageUrl?: string;
}

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "prod_1",
    name: "Alpha Premium Gadget",
    slug: "alpha-premium-gadget",
    gtin: "8991234567890",
    priceFormatted: "Rp 270.000",
    priceValue: 270000,
    compareAtPriceFormatted: "Rp 499.000",
    compareAtPriceValue: 499000,
    status: "active",
    inventory: 142,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
  },
  {
    id: "prod_2",
    name: "Ultra Ergonomic Pillow",
    slug: "ultra-ergonomic-pillow",
    gtin: "8991234567891",
    priceFormatted: "Rp 185.000",
    priceValue: 185000,
    compareAtPriceFormatted: "Rp 250.000",
    compareAtPriceValue: 250000,
    status: "active",
    inventory: 89,
    imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600",
  },
  {
    id: "prod_3",
    name: "Smart Watch V2 - Fitness Edition",
    slug: "smart-watch-v2",
    gtin: "8991234567892",
    priceFormatted: "Rp 450.000",
    priceValue: 450000,
    status: "draft",
    inventory: 0,
    imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600",
  },
];

const formatRupiah = (val: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    gtin: "",
    priceValue: 270000,
    compareAtPriceValue: 0,
    inventory: 100,
    status: "active" as "active" | "draft" | "archived",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.gtin.includes(searchTerm) ||
      p.slug.includes(searchTerm)
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      slug: "",
      gtin: `899${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      priceValue: 250000,
      compareAtPriceValue: 350000,
      inventory: 100,
      status: "active",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
    });
    setModalOpen(true);
  };

  const openEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      slug: prod.slug,
      gtin: prod.gtin,
      priceValue: prod.priceValue,
      compareAtPriceValue: prod.compareAtPriceValue || 0,
      inventory: prod.inventory,
      status: prod.status,
      imageUrl: prod.imageUrl || "",
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast("Produk berhasil dihapus dari katalog.");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const formattedPrice = formatRupiah(formData.priceValue);
    const formattedCompare = formData.compareAtPriceValue ? formatRupiah(formData.compareAtPriceValue) : undefined;
    const generatedSlug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: formData.name,
                slug: generatedSlug,
                gtin: formData.gtin,
                priceValue: formData.priceValue,
                priceFormatted: formattedPrice,
                compareAtPriceValue: formData.compareAtPriceValue || undefined,
                compareAtPriceFormatted: formattedCompare,
                inventory: formData.inventory,
                status: formData.status,
                imageUrl: formData.imageUrl,
              }
            : p
        )
      );
      showToast("Produk berhasil diperbarui!");
    } else {
      const newProd: ProductItem = {
        id: `prod_${Date.now()}`,
        name: formData.name,
        slug: generatedSlug,
        gtin: formData.gtin,
        priceValue: formData.priceValue,
        priceFormatted: formattedPrice,
        compareAtPriceValue: formData.compareAtPriceValue || undefined,
        compareAtPriceFormatted: formattedCompare,
        inventory: formData.inventory,
        status: formData.status,
        imageUrl: formData.imageUrl,
      };
      setProducts((prev) => [newProd, ...prev]);
      showToast("Produk baru berhasil ditambahkan ke katalog!");
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Katalog & Inventaris</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Produk & Form Meta Ads</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Kelola katalog produk, barcode GTIN, harga promo, dan stok untuk formulir checkout instan</p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Filter & Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* Search */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama produk, GTIN barcode, atau slug URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3">Produk</th>
                <th className="py-3 px-3">GTIN Barcode</th>
                <th className="py-3 px-3">Harga COD / Online</th>
                <th className="py-3 px-3">Stok Inventaris</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-3">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">/{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center space-x-1 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                      <Barcode className="w-3 h-3 text-slate-500" />
                      <span>{product.gtin}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{product.priceFormatted}</p>
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
                      {product.inventory} unit
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        product.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {product.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Produk"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-base">
                  {editingProduct ? "Edit Detail Produk" : "Tambah Produk Katalog Baru"}
                </h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Alpha Premium Gadget"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Slug URL</label>
                  <input
                    type="text"
                    placeholder="alpha-premium-gadget"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-normal font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block mb-1">GTIN Barcode</label>
                  <input
                    type="text"
                    required
                    value={formData.gtin}
                    onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-normal font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={formData.priceValue}
                    onChange={(e) => setFormData({ ...formData, priceValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block mb-1">Harga Coret / Promo (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.compareAtPriceValue}
                    onChange={(e) => setFormData({ ...formData, compareAtPriceValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Jumlah Stok (Unit)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.inventory}
                    onChange={(e) => setFormData({ ...formData, inventory: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block mb-1">Status Produk</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  >
                    <option value="active">ACTIVE (Tampil di Form)</option>
                    <option value="draft">DRAFT (Sembunyi)</option>
                    <option value="archived">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">URL Gambar Produk</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
