# DotAds Engine v2 — UI/UX Research, Specification & Master Task Matrix

> **Historical/superseded record — 2026-08-16.** This research and task matrix is superseded as an owner. Use `PRD.md`, `UI-UX-DESIGN-SYSTEM.md`, relevant feature specifications, and permanent tasks in `TASKS.md`.

> **Status:** Active Production Specification & Implementation Plan  
> **Target Audience:** Full-Stack Engineers, UX Designers, AI Agents  
> **Target Surfaces:** Next.js 15 Admin Workspace (`apps/admin`), Form & LP Builder Canvases, Astro 5 Storefront (`apps/storefront`), `<dotads-form>` Web Component Runtime  

---

## 1. Executive Research & UI/UX Audit Findings

Berdasarkan audit komprehensif terhadap antarmuka pengguna pada **DotAds Engine v2** dan studi komparasi dengan platform SaaS/Commerce modern (seperti Shopify Dawn, Stripe Dashboard, Vercel Dashboard, & Linear App), ditemukan beberapa poin penyempurnaan UI/UX yang esensial:

### A. Admin Dashboard Workspace & Operator UX
1. **Visual Hierarchy & Density Control:** Data-dense table pada `OrderDataTable` memerlukan kontrol kepadatan baris (*compact vs comfortable*) agar operator CS/Gudang dapat memproses puluhan pesanan per menit tanpa kelelahan visual.
2. **Contextual Status & RTS Risk Badging:** Skor risiko RTS (0–100) memerlukan tooltip penjelasan eksplisit (*reasons*) dan aksentuasi warna kontras tinggi (Hijau ≤34, Kuning 35–59, Merah ≥60) dengan aksi langsung ("Ubah Alamat", "Chat WA Confirmation").
3. **Multi-Tenant Context Switching:** Switcher tenant di header/sidebar harus memberikan umpan balik visual instan (avatar/badge toko active), serta *impersonation indicator* saat Super Admin sedang mengontrol toko tenant tertentu.
4. **KPI Summary Cards & Data Visualization:** Kartu ringkasan omset dan performa iklan Meta/TikTok membutuhkan indikator tren eksplisit (`+14.2% vs periode sebelumnya`), sparkline mini, serta skema warna chart yang *colorblind-safe*.

### B. Visual Builder Surfaces (Form Builder & LP Builder)
1. **Interactive Canvas & Device Webview:** Canvas pembangun form dan landing page harus mendukung switch pratinjau *Desktop vs Mobile Webview (375px)* secara real-time.
2. **Preset Selector & Visual Feedback:** Pergantian 4 preset mode form (`FULL`, `HYBRID`, `MIDDLE`, `MINI`) harus menyegarkan kanvas secara instan dan menyediakan *Drawer Snippet Embed* dengan tombol "Salin Script" 1-klik.
3. **Drag & Drop Handle Polish:** Setiap bagian (*section*) atau bidang form (*input field*) memiliki drag handle visual (`GripVertical`), tombol hapus/duplikasi, serta panel inspector properti yang bersih di sisi kanan.

### C. Storefront & High-Converting Form Runtime (`<dotads-form>`)
1. **Zero-Layout-Shift (CLS < 0.05) & Fast TTFB:** Web Component Shadow DOM harus terisolasi total dari CSS tema luar (Astro/WordPress/Shopify) agar tidak merusak tata letak form.
2. **Indonesiasian E.164 Autocomplete & Validation:** Autocomplete nama kecamatan/kabupaten Indonesia yang responsif dengan debounce 150ms dan validasi nomor WhatsApp berformat `08...` / `62...`.
3. **Micro-interactions & Micro-copy:** Tombol submit dengan *loading spinner*, *disabled state*, serta pengalihan *smooth scroll* atau pengalihan WhatsApp instan.

---

## 2. EARS-Style Numbered UI/UX Requirements

* **[REQ-UX-001]** *When* operator membuka Admin Dashboard, *the system shall* menampilkan layout 12-kolom bersistem grid dengan KPI cards di kiri atas, trend charts di tengah, dan Order Data Table di bawah.
* **[REQ-UX-002]** *When* operator memilih filter status pesanan atau mengetik pencarian, *the system shall* melakukan filter instan tanpa merefresh halaman penuh dan menampilkan *loading skeleton* bila data sedang dimuat.
* **[REQ-UX-003]** *When* pesanan memiliki skor risiko RTS > 35, *the system shall* menampilkan badge warna kontras (Kuning/Merah) lengkap dengan tooltip alasan risiko dan tombol cepat "Ubah Alamat" / "Konfirmasi WA".
* **[REQ-UX-004]** *When* pengguna berada di Form Builder Canvas, *the system shall* menyediakan sakelar mode preset (`FULL`, `HYBRID`, `MIDDLE`, `MINI`) dan pratinjau responsif mobile/desktop secara *live*.
* **[REQ-UX-005]** *When* pembeli mengisi form pada storefront, *the system shall* memberikan umpan balik validasi instan, autokompresi nomor WhatsApp E.164, dan autosave draft lead saat input WhatsApp kehilangan fokus (`blur`).

---

## 3. Master UI/UX Task Matrix

### Phase 1: Design System, Tokens & Workspace Shell
- [x] **TASK-UX-1.1:** Standardisasi CSS variables & semantic color tokens di `globals.css` (Dark & Light mode support).
- [x] **TASK-UX-1.2:** Enhance `AdminSidebar.tsx` & Header dengan tenant switcher visual dan indikator role RBAC.

### Phase 2: Operator Workspace & Analytics UX
- [x] **TASK-UX-2.1:** Upgrade `AnalyticsOverview.tsx` dengan KPI sparklines, trend badge (+%), dan Recharts colorblind-safe palette.
- [x] **TASK-UX-2.2:** Polish `OrderDataTable.tsx` dengan toggle kepadatan (*compact/comfortable*), RTS risk tooltips, modal ubah alamat, dan WhatsApp message template deep-link.

### Phase 3: Visual Builders & Canvas UX
- [x] **TASK-UX-3.1:** Polish `FormBuilderCanvas.tsx` dengan drag-and-drop handles, preset switcher, dan modal export snippet embed `<script>`.
- [x] **TASK-UX-3.2:** Polish `LandingPageBuilderCanvas.tsx` dengan section reordering visual, property inspector, dan mobile device frame switcher.

### Phase 4: Storefront & Form Runtime UX
- [x] **TASK-UX-4.1:** Polish Shadow DOM styling pada `<dotads-form>` untuk keempat preset UI (`FULL`, `HYBRID`, `MIDDLE`, `MINI`).
- [x] **TASK-UX-4.2:** Integrasi autokomplit kecamatan Indonesia dan validasi instant pada form checkout.

---

## 4. Verification & Acceptance Criteria

1. **Accessibility & Keyboard Nav:** Seluruh elemen interaktif (tombol, input, dropdown) dapat diakses dengan `Tab` & `Enter`, serta memiliki focus ring yang jelas.
2. **Visual Consistency:** Seluruh komponen menggunakan sistem token shadcn/ui (Radius `0.5rem`, Font Inter/Sans, Neutral Palette).
3. **Build & Test Green:** Executed `pnpm test` (5/5 Monorepo Test Suites 100% Pass) dan `pnpm build` (0 Errors / 0 Warnings).
