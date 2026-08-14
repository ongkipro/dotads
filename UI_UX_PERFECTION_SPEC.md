# DotAds Engine v2 — UI/UX & System Perfection Specification

> **Status:** Canonical Specification  
> **Target Audience:** Full-Stack Engineers, AI Coding Agents, UX Designers  
> **Target Surfaces:** `<dotads-form>` Shadow DOM Runtime, Next.js 15 Admin Workspace, Astro 5 Storefront, Hono OpenAPI Headless API  

---

## 1. Executive Overview & System Precision Contract

Spesifikasi ini menetapkan standar kepresisian UI/UX dan keandalan sistem untuk **DotAds Engine v2** di seluruh layar interaktif, pipeline data, dan komponen runtime:

1. **Form Engine Runtime (`<dotads-form>` Web Component):**
   * Mendukung 4 preset UI/UX dinamis secara Shadow DOM terisolasi: `FULL` (1-Step COD), `HYBRID` (2-Step Stepper), `MIDDLE` (1.5-Step Compact), dan `MINI` (2-Input WA Lead).
   * Mendengarkan event `blur` WhatsApp untuk pengiriman *Draft Lead Ingestion* otomatis.
   * Melakukan preservasi cookie `_fbp`/`_fbc` dan penembakan Meta Pixel `Purchase` event di browser.

2. **Admin Builder Canvas (`FormBuilderCanvas.tsx` & `LandingPageBuilderCanvas.tsx`):**
   * Mendukung pergantian 4 mode preset form secara real-time dengan tampilan pratinjau desktop & mobile webview.
   * Ekspor skema JSON dan tag `<script>` embed Web Component secara instan.

3. **Multi-Tenant Navigation & RBAC Roles:**
   * Navigasi sidebar (`AdminSidebar.tsx` & `admin-navigation.ts`) menyesuaikan dengan 6 role RBAC (`SUPER_ADMIN`, `TENANT_OWNER`, `ADMIN`, `CUSTOMER_SERVICE`, `ADVERTISER`, `END_BUYER`).

4. **Headless API & Signal Engine (`apps/api`):**
   * Endpoint public `/api/v1/public/*`, admin `/api/v1/admin/*`, dan platform `/api/v1/platform/*` tervalidasi skema Zod dan OpenAPI 3.1 contract.

---

## 2. Form Engine Runtime Dynamic Presets Matrix

| Dimension | `FULL` (1-Step COD) | `HYBRID` (2-Step Stepper) | `MIDDLE` (1.5-Step Compact) | `MINI` (2-Input WA Lead) |
| :--- | :--- | :--- | :--- | :--- |
| **Step 1 UI** | All Fields Visible | Nama + No. WhatsApp | Nama + No. WA + Kecamatan | Nama + No. WhatsApp |
| **Draft Lead Blur** | Active | Active (Auto-save) | Active | Active |
| **Step 2 UI** | N/A (Single Step) | Alamat, Kurir, Payment | Drawer Compact Selection | N/A (Direct WA App) |
| **Submit Action** | `/api/v1/public/orders` | `/api/v1/public/orders` | `/api/v1/public/orders` | `https://wa.me/62...` |
| **Primary Color** | Indigo `#2563eb` | Indigo `#2563eb` | Indigo `#2563eb` / Emerald | WhatsApp `#16a34a` |
