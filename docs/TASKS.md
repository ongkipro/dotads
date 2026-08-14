# TASKS: DotAds Engine v2 - Parallel Menu Perfection & Feature Polish

## Execution Contract

- Implement tasks in dependency order; tasks without a dependency edge may run in parallel.
- Every task has exactly one **Primary requirement**. `Constraints` are requirements or accepted architecture decisions that shape the implementation but are not additional primary outcomes.
- A task is complete only after its `Done when` command/procedure is run against the implemented surface and the stated observable result is recorded.
- Record footprints in `BUILD-LOG.md`, maintain task tracking in `TASKS.md`, and verify changes with runnable smoke tests and `pnpm build`.

---

## Completed Slices (v2 Base Foundation)

### Slice 1: Sales & Orders Management (`/admin/orders`, `/admin/products`)
- [X] **Task 1.1: Perfect Orders Management Page**
  - **Requirement:** Enhance `/admin/orders` with status tabs (ALL, PENDING, PAID, SHIPPED, COMPLETED, RTS), search/filter by order number or customer phone, RTS risk score badge, Quick WhatsApp follow-up action link (`wa.me/62...`), and batch CSV export.
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and `/admin/orders` renders interactive filter/action controls.

- [X] **Task 1.2: Perfect Products & Catalog CRUD**
  - **Requirement:** Enhance `/admin/products` with stateful product variant management (SKU, weight in grams, stock level, price in IDR), image upload/preview modal, GTIN barcode generator, and toast notifications on save/delete.
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and product CRUD operations trigger stateful updates.

### Slice 2: Builders & Ad Tracking (`/admin/builders/*`, `/admin/tracking`)
- [X] **Task 2.1: Perfect Form Builder Canvas & Presets**
  - **Requirement:** Keep `/admin/builders/forms` and `<dotads-form>` aligned with the four canonical presets: `FULL` (1-Step COD), `HYBRID` (2-Step Progressive Checkout), `MIDDLE` (Compact 1.5-Step Direct Checkout), and `MINI` (2-Input WhatsApp Lead), including field ordering, custom inputs, device preview, and script generation.
  - **Done when:** `FORM_ENGINE_PRESETS_SPEC.md` documents all four contracts, `pnpm --filter @dotads/admin build` passes, and the builder supports preset switching and JSON export.

- [X] **Task 2.2: Perfect Landing Page Builder Canvas**
  - **Requirement:** Enhance `/admin/builders/pages` with section reordering/addition (Hero, Features, Video, Testimonials, Form Embed), live device preview frame, and layout spec JSON exporter/importer.
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and LP builder supports section management.

- [X] **Task 2.3: Perfect Ad Signal Tracking Engine Page**
  - **Requirement:** Enhance `/admin/tracking` with real-time CAPI test signal sender, Event Match Quality (EMQ) score gauge per platform (Meta, Google, TikTok), outbox queue inspector, and retry trigger.
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and signal tracking page renders outbox queue and test payload trigger.

### Slice 3: Logistics & Operational Tools (`/admin/integrations/mengantar`, `/admin/operations/shipping-check`)
- [X] **Task 3.1: Perfect Mengantar 3PL Integration Page**
  - **Requirement:** Enhance `/admin/integrations/mengantar` with API Key & Webhook Secret configuration, Sandbox toggle, RTS threshold slider, auto-dispatch COD toggle, and GIN Trigram subdistrict search tester.
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and Mengantar settings support interactive testing.

- [X] **Task 3.2: Perfect Shipping Rate Check & WA Generator**
  - **Requirement:** Enhance `/admin/operations/shipping-check` with courier rate comparison table (JNE, SiCepat, J&T, SAP), weight calculation input, subdistrict auto-complete, and WA follow-up message preview generator with dynamic chips.
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and shipping check tool calculates rates & generates WA template text.

### Slice 4: Finance & Payment Integration (`/admin/reconciliation`, `/admin/integrations/autolaris`)
- [X] **Task 4.1: Perfect Finance Reconciliation Page**
  - **Requirement:** Enhance `/admin/reconciliation` with AutoLaris QRIS/VA settlement table and Mengantar COD remittance table, search filter by TX/AWB ID, settlement status filter, CSV export, and dispute claim modal.
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and reconciliation page toggles between gateway & COD remittance views.

- [X] **Task 4.2: Perfect AutoLaris Payment Settings Page**
  - **Requirement:** Enhance `/admin/integrations/autolaris` with Merchant Secret Key configuration (HMAC SHA-256), toggle for QRIS EMV & Virtual Accounts (BCA, Mandiri, BRI, BSI), webhook URL copier, and test payment payload simulator.
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and payment settings page saves credentials and triggers test webhook.

### Slice 5: Merchant Settings & System Admin (`/admin/settings/*`, `/admin/profile`)
- [X] **Task 5.1: Perfect Store, Warehouse & CRM Templates**
  - **Requirement:** Enhance `/admin/settings/store`, `/admin/settings/gudang`, and `/admin/settings/crm` with full store identity settings, multiple origin warehouses CRUD, and WA message templates with dynamic variable insertion chips (`{customerName}`, `{orderNumber}`, `{courier}`, `{waybill}`).
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and settings pages handle stateful saving.

- [X] **Task 5.2: Perfect Domains, Team Members, Audit Logs & Profile**
  - **Requirement:** Enhance `/admin/settings/domains`, `/admin/settings/members`, `/admin/settings/audit-logs`, and `/admin/profile` with custom domain DNS verification modal, team member invitation with role selection, filterable audit log viewer, and user profile password/security controls.
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and all settings pages operate with interactive state.

### Slice 6: Super Admin Platform Management (`/super-admin/*`)
- [X] **Task 6.1: Perfect Super Admin Fleet & Platform Management**
  - **Requirement:** Enhance `/super-admin`, `/super-admin/tenants`, `/super-admin/settings`, and `/super-admin/audit-logs` with platform GMV analytics, tenant SaaS management (plan upgrade, status toggle, impersonate login), global Turnstile/security settings, and platform audit trail.
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and super admin pages provide full SaaS fleet management controls.

---

## Actionable Upgrade Slices (Adapted & Enhanced from Zanobyshop/CMSAds Specs)

### Slice 7: Public Headless API Layer & Embeddable Widgets
- [X] **Task 7.1: Non-Secret Public Storefront Bootstrap API (`GET /api/v1/public/bootstrap`)**
  - **Requirement:** Provide tenant metadata, active store identity, help phone, active payment channels, COD disabled provinces, and non-secret tracking config (Meta Pixel ID, GTM Container ID, Google Ads Conversion ID/Label, TikTok Pixel ID) to dynamic headless storefronts without leaking CAPI or provider credentials.
  - **Done when:** `pnpm test` passes and `GET /api/v1/public/bootstrap?tenantId=...` returns validated non-secret JSON payload.

- [X] **Task 7.2: Canonical Public Product Catalog Read API (`GET /api/v1/public/products`, `GET /api/v1/public/products/:slug`)**
  - **Requirement:** Serve dynamic catalog facts (products, variants, IDR pricing, stock, SKU/GTIN, active status, media) to dynamic external storefronts using canonical product IDs for ad tracking alignment.
  - **Done when:** `pnpm test` passes and public product endpoints return active catalog facts with variant details.

- [X] **Task 7.3: Dynamic Storefront Form Config Gateway (`GET /api/v1/public/form-config`)**
  - **Requirement:** Resolve `FULL`, `HYBRID`, `MIDDLE`, and `MINI` form contracts with canonical product selection, warehouse origin, courier-rate estimation, regional COD eligibility, draft-lead capture, and WhatsApp lead redirect as applicable.
  - **Done when:** `pnpm test` passes 100% and the form-config endpoint returns a structured schema for each canonical preset with its pricing, logistics, and lead-capture boundaries.

- [X] **Task 7.4: Embeddable Form Widget & Iframe Gateway (`<dotads-form>` / `/embed/form`)**
  - **Requirement:** Provide embeddable form script and iframe endpoint `/embed/form` with height postMessage sync, CSRF/Turnstile protection, and parent window payment/thanks redirection.
  - **Done when:** Embeddable form widget renders inside external HTML page and handles cross-origin height sync and submit navigation cleanly.

### Slice 8: Advanced Conversion Signal Engine & Attribution Preservation
- [X] **Task 8.1: Meta CAPI Advanced Matching & Purchase Deduplication Boundary**
  - **Requirement:** Normalize and SHA-256 hash customer identifiers (`ph`, `fn`, `ln`, `external_id`), preserve raw `_fbp` and `_fbc` cookies, and ensure browser Pixel Purchase and server CAPI Purchase use exact matching `event_id` (`Purchase_` + order ID).
  - **Done when:** `pnpm test` passes and Meta outbox events pass validation with SHA-256 hashed matching fields.

- [X] **Task 8.2: Google Ads Enhanced Conversions & Click-ID Attribution Preservation**
  - **Requirement:** Capture `gclid`, `gbraid`, `wbraid` in session cookies (90-day retention), attach them to order transactions, and format Enhanced Conversion payloads (SHA-256 hashed phone/email/name) for Google Ads API.
  - **Done when:** `pnpm test` passes and order persistence retains click IDs and generates Google Enhanced Conversion payloads.

- [X] **Task 8.3: TikTok Ads Signal Engine Integration (TikTok Pixel & Events API v2)**
  - **Requirement:** Capture `ttclid` cookie and format Events API v2 payloads with SHA-256 hashed customer identifiers for server-side purchase signals.
  - **Done when:** `pnpm test` passes and TikTok Events API outbox dispatches qualifying orders.

### Slice 9: Provider Hardening (Mengantar Logistics & AutoLaris Gateway)
- [X] **Task 9.1: Mengantar Real-Time Receiver Risk Scoring (`/getReceiverScoreByNumberUser`)**
  - **Requirement:** Execute receiver delivery history lookup on checkout in background (`waitUntil`) without blocking submission; compute RTS risk (Hijau/Kuning/Merah, score 0-100) and expose courier history breakdown in `/admin/orders/[id]`.
  - **Done when:** Order detail renders provider courier delivery breakdown and RTS risk badge.

- [X] **Task 9.2: Mengantar Sequential Order Dispatch & Webhook Lifecycle Sync**
  - **Requirement:** Implement sequential order push to Mengantar `/order` endpoint, avoid parallel calls, handle `cnote_no` (waybill) assignment, and process webhook updates (`/api/webhooks/mengantar`) for tracking status (`IN_TRANSIT`, `DELIVERED`, `RTS`).
  - **Done when:** `pnpm test` passes and webhook callbacks update order tracking history idempotently.

- [X] **Task 9.3: AutoLaris HMAC-SHA256 Signature Verification & Ledger Reconciliation**
  - **Requirement:** Verify `x-autolaris-signature` header on webhooks using constant-time comparison, reconcile payment status idempotently, and update double-entry finance ledger.
  - **Done when:** `pnpm test` passes and invalid signature webhooks are rejected with HTTP 400.

### Slice 10: WhatsApp CRM Action Group & Dynamic Template Engine
- [X] **Task 10.1: Touch-friendly WhatsApp CRM Action Buttons & Dynamic Template Engine**
  - **Requirement:** Refactor WhatsApp follow-up controls in `OrdersTable` and `OrderDetail` into compact styled buttons (`W`, `D`, `F1`–`F5`, `P`, `C`, `U`) with state persistence (turning clicked buttons to dark slate `#0f172a`), and dynamic template variable replacement (`{{nama}}`, `{{wa}}`, `{{alamat}}`, `{{kecamatan}}`, `{{inv}}`, `{{produk}}`, `{{ongkir}}`, `{{total}}`, `{{resi}}`, `{{kurir}}`).
  - **Done when:** Operator clicking CRM action button opens pre-filled `wa.me/62...` link and button persists clicked state.

### Slice 11: System Maintenance & Stale Order Cleanup Crons
- [X] **Task 11.1: Automated Stale/Unpaid Order Cleanup Cron & Manual Order Purge API**
  - **Requirement:** Implement scheduled worker job (`DELETE /api/v1/admin/orders/cleanup`) to clean unpaid or abandoned orders older than 7 days from `orders` and `order_items` tables, and support manual single/bulk order deletion in `/admin/orders`.
  - **Done when:** `pnpm test` passes and cleanup endpoint successfully purges abandoned orders older than 7 days.

## Completed Documentation & Verification Tasks

- [X] **Task DOC-1: Canonical Form Engine Presets Specification**
  - **Requirement:** Document the runtime, state, submission, attribution, and UI contracts for `FULL`, `HYBRID`, `MIDDLE`, and `MINI`.
  - **Done when:** `FORM_ENGINE_PRESETS_SPEC.md` is indexed as the canonical four-preset contract and all specification-pack references use the same preset set.

- [X] **Task VER-1: Unified Monorepo Test Audit**
  - **Requirement:** Run the unified monorepo test suite and record the exact result in `BUILD-LOG.md` and `STATUS.md`.
  - **Done when:** `pnpm test` completes with all 5/5 suites passing (100%).

### Slice 12: Production VPS Coolify Deployment & Domain SSL Handoff (Standby)
- [ ] **Task 12.1: Coolify Service Provisioning & Production Environment Deployment**
  - **Requirement:** Deploy production containers to VPS via Coolify when user authorizes remote deployment.
  - **Done when:** Live domain endpoints return HTTP 200 OK with SSL certificates.
