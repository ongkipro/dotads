"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  ArrowLeft,
  Barcode,
  CheckCircle2,
  Edit,
  Image as ImageIcon,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

type ProductStatus = "active" | "draft" | "archived";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  gtin: string;
  weightGrams: number;
  stockQuantity: number;
  priceValue: number;
  compareAtPriceValue?: number;
  status: ProductStatus;
  imageUrl?: string;
}

interface ProductFormState {
  name: string;
  slug: string;
  sku: string;
  gtin: string;
  weightGrams: number;
  stockQuantity: number;
  priceValue: number;
  compareAtPriceValue: number;
  status: ProductStatus;
  imageUrl: string;
}

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "prod_1",
    name: "Gawai Premium Alpha",
    slug: "gawai-premium-alpha",
    sku: "DTA-GPA-001",
    gtin: "8991234567890",
    weightGrams: 750,
    stockQuantity: 142,
    priceValue: 270000,
    compareAtPriceValue: 499000,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
  },
  {
    id: "prod_2",
    name: "Bantal Ergonomis Ultra",
    slug: "bantal-ergonomis-ultra",
    sku: "DTA-BEU-002",
    gtin: "8991234567891",
    weightGrams: 1200,
    stockQuantity: 89,
    priceValue: 185000,
    compareAtPriceValue: 250000,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600",
  },
  {
    id: "prod_3",
    name: "Jam Pintar V2 Edisi Kebugaran",
    slug: "jam-pintar-v2",
    sku: "DTA-JPV2-003",
    gtin: "8991234567892",
    weightGrams: 350,
    stockQuantity: 0,
    priceValue: 450000,
    status: "draft",
    imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600",
  },
];

const EMPTY_FORM: ProductFormState = {
  name: "",
  slug: "",
  sku: "",
  gtin: "",
  weightGrams: 500,
  stockQuantity: 0,
  priceValue: 0,
  compareAtPriceValue: 0,
  status: "active",
  imageUrl: "",
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: "Aktif",
  draft: "Draf",
  archived: "Diarsipkan",
};

const IDR_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const generateGtin13 = () => {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const base = `899${String(random[0] % 1_000_000_000).padStart(9, "0")}`;
  const weightedSum = base
    .split("")
    .reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (weightedSum % 10)) % 10;
  return `${base}${checkDigit}`;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ProductItem | null>(null);
  const [formData, setFormData] = useState<ProductFormState>(EMPTY_FORM);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.gtin.includes(query);
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, statusFilter]);
  const showToast = (message: string) => {
    window.clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3000);
  };

  const openAddForm = () => {
    setEditingProductId(null);
    setFormData({ ...EMPTY_FORM, gtin: generateGtin13() });
    setViewMode("form");
  };

  const openEditForm = (product: ProductItem) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      gtin: product.gtin,
      weightGrams: product.weightGrams,
      stockQuantity: product.stockQuantity,
      priceValue: product.priceValue,
      compareAtPriceValue: product.compareAtPriceValue ?? 0,
      status: product.status,
      imageUrl: product.imageUrl ?? "",
    });
    setViewMode("form");
  };
  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Pilih berkas gambar yang valid.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData((current) => ({ ...current, imageUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const slug = createSlug(formData.slug || formData.name);
    const nextProduct: ProductItem = {
      id: editingProductId ?? `prod_${Date.now()}`,
      name: formData.name.trim(),
      slug,
      sku: formData.sku.trim().toUpperCase(),
      gtin: formData.gtin.trim(),
      weightGrams: formData.weightGrams,
      stockQuantity: formData.stockQuantity,
      priceValue: formData.priceValue,
      compareAtPriceValue: formData.compareAtPriceValue || undefined,
      status: formData.status,
      imageUrl: formData.imageUrl || undefined,
    };

    if (editingProductId) {
      setProducts((current) =>
        current.map((product) => (product.id === editingProductId ? { ...product, ...nextProduct } : product)),
      );
      showToast("Perubahan produk berhasil disimpan.");
    } else {
      setProducts((current) => [nextProduct, ...current]);
      showToast("Produk baru berhasil ditambahkan.");
    }

    setViewMode("list");
  };
  const confirmDelete = () => {
    if (!deleteCandidate) return;
    setProducts((current) => current.filter((product) => product.id !== deleteCandidate.id));
    setDeleteCandidate(null);
    showToast("Produk berhasil dihapus dari katalog.");
  };

  return (
    <div className="space-y-6 pb-8">
      {toastMessage && (
        <div
          role="status"
          className="fixed right-5 top-5 z-[70] flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {viewMode === "form" ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
            <div>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Katalog Produk
              </button>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {editingProductId ? `Edit Produk: ${formData.name}` : "Tambah Produk Baru"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Lengkapi rincian produk, harga, stok, gambar, dan informasi logistik untuk ditampilkan di toko.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                form="product-full-form"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
              >
                {editingProductId ? "Simpan Perubahan" : "Terbitkan Produk"}
              </button>
            </div>
          </div>

          <form id="product-full-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Informasi Produk</h2>
                <div>
                  <label htmlFor="product-name" className="mb-1 block text-xs font-bold text-slate-700">Nama produk</label>
                  <input
                    id="product-name"
                    type="text"
                    required
                    placeholder="Contoh: Gawai Premium Alpha"
                    value={formData.name}
                    onChange={(event) => {
                      const name = event.target.value;
                      setFormData((current) => ({
                        ...current,
                        name,
                        slug: editingProductId ? current.slug : createSlug(name),
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="product-slug" className="mb-1 block text-xs font-bold text-slate-700">Slug URL</label>
                  <input
                    id="product-slug"
                    type="text"
                    placeholder="gawai-premium-alpha"
                    value={formData.slug}
                    onChange={(event) => setFormData((current) => ({ ...current, slug: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Harga & Diskon</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="product-price" className="mb-1 block text-xs font-bold text-slate-700">Harga jual (IDR)</label>
                    <input
                      id="product-price"
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={formData.priceValue}
                      onChange={(event) => setFormData((current) => ({ ...current, priceValue: Number(event.target.value) }))}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="product-compare-price" className="mb-1 block text-xs font-bold text-slate-700">Harga sebelum diskon (IDR)</label>
                    <input
                      id="product-compare-price"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.compareAtPriceValue}
                      onChange={(event) => setFormData((current) => ({ ...current, compareAtPriceValue: Number(event.target.value) }))}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Gambar Produk</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Pratinjau produk" className="h-40 w-40 rounded-xl border border-slate-200 object-cover shadow-sm" />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-slate-200 text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100">
                      <Upload className="h-4 w-4" />
                      Unggah berkas gambar
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="sr-only" />
                    </label>
                    <div>
                      <label htmlFor="image-url" className="mb-1 block text-xs font-bold text-slate-700">Atau masukkan URL gambar</label>
                      <input
                        id="image-url"
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={formData.imageUrl}
                        onChange={(event) => setFormData((current) => ({ ...current, imageUrl: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Status & Inventaris</h2>
                <div>
                  <label htmlFor="product-status" className="mb-1 block text-xs font-bold text-slate-700">Status produk</label>
                  <select
                    id="product-status"
                    value={formData.status}
                    onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value as ProductStatus }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                  >
                    <option value="active">Aktif</option>
                    <option value="draft">Draf</option>
                    <option value="archived">Diarsipkan</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="product-stock" className="mb-1 block text-xs font-bold text-slate-700">Jumlah stok unit</label>
                  <input
                    id="product-stock"
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formData.stockQuantity}
                    onChange={(event) => setFormData((current) => ({ ...current, stockQuantity: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">SKU & GTIN Barcode</h2>
                <div>
                  <label htmlFor="product-sku" className="mb-1 block text-xs font-bold text-slate-700">Kode SKU</label>
                  <input
                    id="product-sku"
                    type="text"
                    required
                    placeholder="DTA-PRODUK-001"
                    value={formData.sku}
                    onChange={(event) => setFormData((current) => ({ ...current, sku: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-3 font-mono text-sm uppercase outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="product-gtin" className="mb-1 block text-xs font-bold text-slate-700">Barcode GTIN-13</label>
                  <div className="flex gap-2">
                    <input
                      id="product-gtin"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{13}"
                      required
                      value={formData.gtin}
                      onChange={(event) => setFormData((current) => ({ ...current, gtin: event.target.value.replace(/\D/g, "").slice(0, 13) }))}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((current) => ({ ...current, gtin: generateGtin13() }))}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Acak
                    </button>
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Pengiriman & Logistik</h2>
                <div>
                  <label htmlFor="product-weight" className="mb-1 block text-xs font-bold text-slate-700">Berat bersih (gram)</label>
                  <input
                    id="product-weight"
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={formData.weightGrams}
                    onChange={(event) => setFormData((current) => ({ ...current, weightGrams: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                  />
                </div>
              </section>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
                <Package className="h-4 w-4" />
                <span>Katalog dan inventaris</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Produk</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Kelola data produk, barcode GTIN, harga, berat, dan stok dalam satu tempat.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Tambah produk
            </button>
          </div>

          <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  aria-label="Cari produk"
                  placeholder="Cari nama produk, SKU, atau GTIN..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <select
                aria-label="Filter status produk"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="draft">Draf</option>
                <option value="archived">Diarsipkan</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-3">Produk</th>
                    <th className="px-3 py-3">SKU dan GTIN</th>
                    <th className="px-3 py-3">Berat</th>
                    <th className="px-3 py-3 text-right">Harga</th>
                    <th className="px-3 py-3">Stok</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-3 py-3">
                        <div className="flex min-w-52 items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={`Gambar ${product.name}`}
                              className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{product.name}</p>
                            <p className="font-mono text-[11px] text-slate-400">/{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-800">{product.sku}</p>
                        <span className="mt-1 inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                          <Barcode className="h-3 w-3 text-slate-500" />
                          {product.gtin}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-600">{product.weightGrams} g</td>
                      <td className="px-3 py-3 text-right font-bold text-slate-900">
                        {IDR_FORMATTER.format(product.priceValue)}
                        {product.compareAtPriceValue ? (
                          <span className="block font-normal text-slate-400 line-through text-[10px]">
                            {IDR_FORMATTER.format(product.compareAtPriceValue)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{product.stockQuantity}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            product.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : product.status === "draft"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {STATUS_LABELS[product.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditForm(product)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                            title="Edit produk"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(product)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            title="Hapus produk"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {deleteCandidate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-rose-50 p-2 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <h2 id="delete-product-title" className="font-bold text-slate-900">Hapus produk?</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Produk <strong className="text-slate-700">{deleteCandidate.name}</strong> akan dihapus dari katalog. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Ya, hapus produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
