# DotAds Engine v2 — UI & UX Design System

## 1. Design Direction
Preserve DotAds familiarity, but formalize a responsive, app-like operator system across desktop, tablet, and mobile webview.

## 2. Tokens
- Admin accent: `#2563eb`
- Success: `#16a34a`
- Warning: `#d97706`
- Danger: `#dc2626`
- Minimum touch target: 44px
- Mobile gutter: 16px

## 3. Tenant Admin IA — exact migration from DotAds Fisik
### Commerce
- Dashboard
- Order Management
- Pengiriman
- Produk (Katalog, Input GTIN & Auto-Category, Stok / Inventaris)
- Konten Storefront
### Operations
- Ekspedisi
- Cek WA & Ongkir
### Growth
- Ads & Tracking
  - Meta Pixel & CAPI
  - Google Ads
  - TikTok Ads
### Finance & System
- Payment AutoLaris
- Rekonsiliasi
- Pengaturan
  - Store & CS
  - Gudang
  - CRM Templates
  - Akses Pengguna
### Profile
- Profil & Integrasi

## 4. Role-based navigation
- `TENANT_OWNER`: all tenant groups and dangerous integrations/domain actions.
- `ADMIN`: all tenant groups except owner-only plan/ownership actions.
- `ADVERTISER`: Dashboard, Produk, Konten Storefront, Ads & Tracking, Builders.
- `CUSTOMER_SERVICE`: Dashboard, Order Management, Pengiriman, Ekspedisi, Cek WA & Ongkir, profile.

## 5. Responsive behavior contract
### Desktop ≥ 1280px
- Persistent left sidebar.
- Dense tables.
- Builder uses 3-pane layout.
### Tablet 768–1279px
- Collapsible sidebar.
- Side sheet detail.
### Mobile 320–767px
- Feels like a webview app.
- Bottom navigation: Home, Orders, Growth, Settings, More.
- Sticky save/submit action.
- Filters in bottom sheet.
- Row opens detail sheet/page.
- Safe-area and keyboard-aware footer.

## 6. Settings and domain UX
Inside `Pengaturan > Store & CS`:
- primary domain card
- additional domains list
- add-domain dialog
- verification instructions (TXT/CNAME)
- status badge
- set primary
- remove action
- SSL state

## 7. Builder UX
### Form Builder
- left field palette
- center canvas
- right properties
- device preview: 390 / 768 / 1280
### LP Builder
- section-based editing
- product binding inspector
- SEO tab
- publish checklist

## 8. Embedded form UX contract
### Permanent layout modes
- `middle`
- `full`
- `hybrid`

### Performance rules
- no iframe
- no global CSS leakage
- progressive enhancement
- no layout jump on upgrade

### Attribution continuity
- read UTMs and click IDs from parent page
- read `_fbp` and `_fbc`
- preserve consent state
- submit canonical tracking object

## 9. Visual precision — match proven DotAds form behavior
- Supported logos: QRIS, BCA, BNI, BRI, Mandiri, Permata, CIMB Niaga, BSI.
- Price summary remains clear and trust-building.
- Variant buttons are thumb-friendly.
- Address order: province → city/kabupaten → district/kecamatan → detail address.
- Payment selection is visually grouped and immediately understandable.
- CTA remains obvious at every breakpoint.


---

## 10. Product Listing, Inventory & Google Category UI/UX Mapping

### 10.1 Navigation & Screen Mapping
- **Product Catalog List (`/admin/products`):**
  - Data table displaying Thumbnail, Product Title, SKU, Price Range, Inventory Count, Google Category Badge, and Active Status Toggle.
  - Multi-filter bar: Status (Active/Archived), Inventory (In Stock / Low Stock / Out of Stock), Category.
  - Bulk actions: Bulk Status Toggle, Bulk Category Re-assignment, Export Catalog (CSV / Google Feed).

- **Product Detail & Variant Matrix Form (`/admin/products/new` & `/admin/products/[id]`):**
  - **Basic Info Card:** Title, Auto-generated Slug, Rich Description, Media Dropzone with ALT text editor.
  - **AI Google Category Card:** Displays auto-selected Google Product Category ID & Path with manual override modal.
  - **Pricing & GTIN Card:** Price (IDR), Compare-at Price (IDR), GTIN/EAN Barcode, MPN, Brand.
  - **Inventory Card:** Inventory Tracking Toggle, Oversell Option, SKU, Stock Quantity, Weight (Grams).
  - **Variant Matrix Editor:** Option creation (Size, Color, Package) generating dynamic variant rows with individual SKU, price, stock, and GTIN fields.

- **Inventory Management Screen (`/admin/inventory`):**
  - Rapid stock adjustment table with quick inline (+ / -) quantity updates, low-stock threshold alerts, and warehouse origin assignment.


---

## 11. Data Analytics, Charts, Date Range Pickers & Filter Controls (shadcn/ui)

### 11.1 Recharts & Chart Component Architecture (`@/components/ui/chart`)
DotAds Engine v2 incorporates responsive **Recharts** wrapped in `shadcn/ui` thematic chart containers:

1. **GMV & Revenue Trend Chart (`AreaChart`):**
   - Displays daily gross merchandise value (IDR) vs net paid revenue.
   - Gradient fill (`#2563eb` primary blue to transparent), interactive tooltip with IDR currency formatting (`Intl.NumberFormat('id-ID')`).

2. **Order Volume & Status Breakdown (`BarChart`):**
   - Stacked bar chart showing Pending, Paid, Shipped, Delivered, and RTS orders over time.

3. **Meta CAPI EMQ Score Tracker (`LineChart`):**
   - Tracks daily Event Match Quality (EMQ score 1.0–10.0) across `Lead`, `AddToCart`, `InitiateCheckout`, and `Purchase`.

4. **Courier & Shipping Distribution (`PieChart` / Donut):**
   - Displays percentage distribution across JNE, SiCepat, J&T, and SAP Express.

---

### 11.2 Date Range Picker & Preset Controls (`DateRangePicker`)
- **Presets:** `Today`, `Yesterday`, `Last 7 Days`, `Last 30 Days`, `This Month`, `Custom Range`.
- **Calendar UI:** `shadcn/ui` Popover + Calendar component supporting dual-month view, keyboard navigation, and timezone normalization (`Asia/Jakarta`).

---

### 11.3 Searchable Combobox & Select UI/UX Components
- **Location Combobox (`<LocationCombobox />`):**
  - Searchable popover built with `shadcn/ui` `Command` & `Popover`.
  - Instant typeahead over pre-seeded `mengantar_locations` PostgreSQL database.
- **Product & Variant Select (`<ProductSelect />`):**
  - Select dropdown with inline product thumbnail, SKU, price, and current stock badge.
- **Multi-Select Filter Controls (`<FilterDropdown />`):**
  - Filter by Payment Status (`PAID`, `PENDING_PAYMENT`), Shipping Status (`UNSHIPPED`, `SHIPPED`, `DELIVERED`, `RTS`), Payment Method (`COD`, `QRIS`, `VA`), and Origin Courier.

---

### 11.4 Server-Paginated Data Tables (`<DataTable />` - `@tanstack/react-table`)
- **Column Sorting & Visibility:** Clickable headers for sorting, column visibility toggle dropdown.
- **Bulk Action Toolbar:** Select all / selected rows toolbar enabling Bulk Shipping Label Printing (PDF), Bulk Export (CSV/Excel), and Bulk Status Change.
- **Inline Drawer Preview:** Clicking an order row slides out a sheet drawer (`shadcn/ui` Sheet) displaying full customer details, ordered items, shipping timeline, and Meta CAPI diagnostic logs without navigating away.


---

## 12. Flagship Universal Embedded Hybrid Form Engine (`dotads-form.js`)

The **Universal Embedded Hybrid Form Engine** is the core competitive advantage of DotAds Engine v2. It allows merchants to place high-converting direct-response order forms onto ANY external landing page builder (WordPress, Elementor, Divi, Webflow, Framer, Wix, Shopify, or Custom HTML).

```html
<!-- Example 1-Line Embed Script for External LP Builders -->
<script 
  src="https://app.namadomain.com/sdk/dotads-form.js" 
  data-tenant="tenant_c123" 
  data-form="form_f456" 
  data-mode="hybrid" 
  async>
</script>
<div id="dotads-form-container"></div>
```

### 12.1 Dynamic Form Modes & Lead Capture Safety Net

1. **`middle` Mode (Frictionless 1-Step Lead Form):**
   - Asks only for Name, WhatsApp/Phone Number, and Product Variant selection.
   - Ideal for ultra-fast lead generation or quick order intents.

2. **`full` Mode (Complete Direct-Response Checkout Form):**
   - Includes Name, Phone, Fast Kecamatan Autocomplete (<15ms), Complete Shipping Address, Mengantar 3PL Courier Choice, and Payment Method (COD / AutoLaris QRIS / VA).

3. **`hybrid` Mode (The Flagship Morphing Form Engine):**
   - **Stage 1 (Initial Impression):** Displays as a clean, low-friction `middle` form (Name + Phone + Variant).
   - **Draft Lead Signal (`POST /api/v1/public/orders/draft-lead`):** The instant the customer inputs their phone number, `dotads-form.js` fires an immediate background draft lead request. If the buyer drops off before completing checkout, the merchant retains the customer lead for automated WhatsApp follow-up!
   - **Stage 2 (Seamless Morphing):** As the customer selects a variant or interacts, the form smoothly expands (using CSS transitions & Shadow DOM) into the `full` checkout form with address autocomplete and shipping options without page reload.

### 12.2 Technical Invariants of `dotads-form.js`
- **Native Web Component (`<dotads-form>`):** Isolated Shadow DOM ensures no CSS bleed or style conflicts with Elementor, WordPress themes, or Webflow styles.
- **Ultra-Lightweight Bundle:** < 12KB gzipped standalone JavaScript. Zero external UI dependencies.
- **Parent Window Attribution Extraction:** Reads `window.location.search` and `document.cookie` from the parent page to capture `_fbp`, `_fbc`, `gclid`, `gbraid`, `wbraid`, `ttclid`, `utm_source`, `utm_campaign`, and `utm_medium` seamlessly.
- **No Iframe Pitfalls:** Eliminates iframe height miscalculations, scroll-bar glitches, and mobile keyboard obstruction.
