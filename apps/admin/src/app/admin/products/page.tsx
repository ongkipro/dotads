"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
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
  X,
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
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ProductItem | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageDraft, setImageDraft] = useState("");
  const [formData, setFormData] = useState<ProductFormState>(EMPTY_FORM);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.gtin.includes(query),
    );
  }, [products, searchTerm]);

  const showToast = (message: string) => {
    window.clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3000);
  };

  const openAddModal = () => {
    setEditingProductId(null);
    setFormData({ ...EMPTY_FORM, gtin: generateGtin13() });
    setProductModalOpen(true);
  };

  const openEditModal = (product: ProductItem) => {
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
    setProductModalOpen(true);
  };

  const openImageModal = () => {
    setImageDraft(formData.imageUrl);
    setImageModalOpen(true);
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
      if (typeof reader.result === "string") setImageDraft(reader.result);
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
        current.map((product) => (product.id === editingProductId ? nextProduct : product)),
      );
      showToast("Produk berhasil diperbarui.");
    } else {
      setProducts((current) => [nextProduct, ...current]);
      showToast("Produk baru berhasil ditambahkan.");
    }

    setProductModalOpen(false);
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
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Tambah produk
        </button>
      </div>

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="relative max-w-md">
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
                  <td className="px-3 py-3 font-semibold text-slate-700">
                    {product.weightGrams.toLocaleString("id-ID")} gram
                  </td>
                  <td className="px-3 py-3 text-right">
                    <p className="font-bold text-slate-900">{IDR_FORMATTER.format(product.priceValue)}</p>
                    {product.compareAtPriceValue && (
                      <p className="text-[10px] text-slate-400 line-through">
                        {IDR_FORMATTER.format(product.compareAtPriceValue)}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`font-semibold ${
                        product.stockQuantity > 10 ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {product.stockQuantity.toLocaleString("id-ID")} unit
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        product.status === "active"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : product.status === "draft"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                      }`}
                    >
                      {STATUS_LABELS[product.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      aria-label={`Edit ${product.name}`}
                      className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteCandidate(product)}
                      aria-label={`Hapus ${product.name}`}
                      className="ml-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-sm text-slate-500">
                    Tidak ada produk yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <h2 id="product-modal-title" className="text-base font-bold text-slate-900">
                  {editingProductId ? "Edit produk" : "Tambah produk baru"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                aria-label="Tutup formulir produk"
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 p-5 text-xs font-semibold text-slate-700">
              <div>
                <label htmlFor="product-name" className="mb-1 block">Nama produk</label>
                <input
                  id="product-name"
                  type="text"
                  required
                  placeholder="Contoh: Gawai Premium Alpha"
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="product-sku" className="mb-1 block">SKU</label>
                  <input
                    id="product-sku"
                    type="text"
                    required
                    placeholder="DTA-PRODUK-001"
                    value={formData.sku}
                    onChange={(event) => setFormData((current) => ({ ...current, sku: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono font-normal uppercase outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="product-slug" className="mb-1 block">Slug URL</label>
                  <input
                    id="product-slug"
                    type="text"
                    placeholder="Dibuat otomatis dari nama"
                    value={formData.slug}
                    onChange={(event) => setFormData((current) => ({ ...current, slug: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="product-gtin" className="mb-1 block">Barcode GTIN-13</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="product-gtin"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{13}"
                    required
                    value={formData.gtin}
                    onChange={(event) => setFormData((current) => ({ ...current, gtin: event.target.value.replace(/\D/g, "").slice(0, 13) }))}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((current) => ({ ...current, gtin: generateGtin13() }))}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Buat GTIN
                  </button>
                </div>
                <p className="mt-1 font-normal text-slate-400">Nomor GTIN dibuat dengan digit pemeriksa yang valid.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="product-price" className="mb-1 block">Harga jual (IDR)</label>
                  <input
                    id="product-price"
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={formData.priceValue}
                    onChange={(event) => setFormData((current) => ({ ...current, priceValue: Number(event.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="product-compare-price" className="mb-1 block">Harga sebelum diskon (IDR)</label>
                  <input
                    id="product-compare-price"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.compareAtPriceValue}
                    onChange={(event) => setFormData((current) => ({ ...current, compareAtPriceValue: Number(event.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="product-weight" className="mb-1 block">Berat (gram)</label>
                  <input
                    id="product-weight"
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={formData.weightGrams}
                    onChange={(event) => setFormData((current) => ({ ...current, weightGrams: Number(event.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="product-stock" className="mb-1 block">Jumlah stok</label>
                  <input
                    id="product-stock"
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formData.stockQuantity}
                    onChange={(event) => setFormData((current) => ({ ...current, stockQuantity: Number(event.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="product-status" className="mb-1 block">Status produk</label>
                  <select
                    id="product-status"
                    value={formData.status}
                    onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value as ProductStatus }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="active">Aktif</option>
                    <option value="draft">Draf</option>
                    <option value="archived">Diarsipkan</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="mb-1 block">Gambar produk</span>
                <button
                  type="button"
                  onClick={openImageModal}
                  className="flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
                >
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Pratinjau gambar produk" className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-slate-400 shadow-xs">
                      <ImageIcon className="h-5 w-5" />
                    </span>
                  )}
                  <span>
                    <span className="block font-bold text-slate-800">Unggah atau pratinjau gambar</span>
                    <span className="mt-0.5 block font-normal text-slate-500">Pilih berkas gambar atau masukkan URL.</span>
                  </span>
                </button>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  {editingProductId ? "Simpan perubahan" : "Tambahkan produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {imageModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-modal-title"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 id="image-modal-title" className="font-bold text-slate-900">Gambar produk</h2>
                <p className="mt-0.5 text-xs text-slate-500">Unggah gambar dan periksa tampilannya sebelum digunakan.</p>
              </div>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                aria-label="Tutup pratinjau gambar"
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-56 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {imageDraft ? (
                <img src={imageDraft} alt="Pratinjau gambar yang dipilih" className="max-h-72 w-full object-contain" />
              ) : (
                <div className="text-center text-slate-400">
                  <ImageIcon className="mx-auto h-10 w-10" />
                  <p className="mt-2 text-xs font-semibold">Belum ada gambar dipilih</p>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100">
                <Upload className="h-4 w-4" />
                Unggah berkas gambar
                <input type="file" accept="image/*" onChange={handleImageFileChange} className="sr-only" />
              </label>
              <div>
                <label htmlFor="image-url" className="mb-1 block text-xs font-semibold text-slate-700">Atau gunakan URL gambar</label>
                <input
                  id="image-url"
                  type="url"
                  placeholder="https://contoh.id/gambar-produk.jpg"
                  value={imageDraft.startsWith("data:") ? "" : imageDraft}
                  onChange={(event) => setImageDraft(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((current) => ({ ...current, imageUrl: imageDraft }));
                  setImageModalOpen(false);
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Gunakan gambar
              </button>
            </div>
          </div>
        </div>
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
