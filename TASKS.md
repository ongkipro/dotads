# TASKS: DotAds Engine v2 - Parallel Menu Perfection & Feature Polish

## Execution Contract

- Implement tasks in dependency order; tasks without a dependency edge may run in parallel.
- Every task has exactly one **Primary requirement**. `Constraints` are requirements or accepted architecture decisions that shape the implementation but are not additional primary outcomes.
- A task is complete only after its `Done when` command/procedure is run against the implemented surface and the stated observable result is recorded.
- Record footprints in `BUILD-LOG.md`, maintain task tracking in `TASKS.md`, and verify changes with runnable smoke tests and `pnpm build`.

---

## Parallel Execution Slices

### Slice 1: Sales & Orders Management (`/admin/orders`, `/admin/products`)
- [X] **Task 1.1: Perfect Orders Management Page**
  - **Requirement:** Enhance `/admin/orders` with status tabs (ALL, PENDING, PAID, SHIPPED, COMPLETED, RTS), search/filter by order number or customer phone, RTS risk score badge, Quick WhatsApp follow-up action link (`wa.me/62...`), and batch CSV export.
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and `/admin/orders` renders interactive filter/action controls.

- [X] **Task 1.2: Perfect Products & Catalog CRUD**
  - **Requirement:** Enhance `/admin/products` with stateful product variant management (SKU, weight in grams, stock level, price in IDR), image upload/preview modal, GTIN barcode generator, and toast notifications on save/delete.
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and product CRUD operations trigger stateful updates.

### Slice 2: Builders & Ad Tracking (`/admin/builders/*`, `/admin/tracking`)
- [X] **Task 2.1: Perfect Form Builder Canvas & Presets**
  - **Requirement:** Enhance `/admin/builders/forms` with preset templates (1-Step COD, 2-Step Hybrid, WA Lead), field ordering & custom input options (dropdowns/radios), live mobile/desktop device preview toggle, and script snippet generator (`<dotads-form>`).
  - **Done when:** `pnpm --filter @dotads/admin build` passes without errors and form builder state supports template switching & JSON export.

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

## Next Actionable Follow-up Phases & Tasks

### Phase 12: Production VPS Coolify Deployment & Domain SSL Handoff (Standby)
- [ ] **Task 12.1: Coolify Service Provisioning & Production Environment Deployment**
  - **Requirement:** Deploy production containers to VPS via Coolify when user authorizes remote deployment.
  - **Done when:** Live domain endpoints return HTTP 200 OK with SSL certificates.
