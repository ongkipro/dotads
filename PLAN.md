# DotAds Engine v2 — Architecture Plan

> **Compatibility record — superseded for current architecture truth.** `ARCHITECTURE.md` is the canonical system architecture and executable code/migrations win over this planning snapshot. Options and target states below are not deployment evidence.

## 1. Problem
DotAds 1.0 coupled tenant isolation to Cloudflare Worker/D1 fleets. That made provisioning, migrations, preview environments, and embed UX too expensive to operate.

## 2. Decision
Use one hybrid monorepo with one pooled PostgreSQL data plane and strict row-level tenancy.

- `apps/admin`: Next.js App Router, React, TypeScript, Tailwind, shadcn/ui.
- `apps/storefront`: Astro for storefront pages and landing pages.
- `apps/api`: Hono on Node.js/Bun with `@hono/zod-openapi`.
- `packages/db`: Drizzle schema, migrations, repositories.
- `packages/auth`: better-auth configuration and policy.
- `packages/contracts`: shared Zod schemas, enums, builders, event contracts.
- `packages/form-runtime`: native `dotads-form.js` Web Component.
- `packages/integrations`: Mengantar, AutoLaris, Meta CAPI outbox, Google Ads helpers.
- `packages/ui`: shared admin primitives and storefront form tokens.
- `packages/config`: lint, tsconfig, env contracts, Tailwind presets.

## 3. System Context
```mermaid
flowchart LR
    A[Super Admin Workspace
Next.js] --> API[Hono API]
    B[Tenant Admin Workspace
Next.js] --> API
    C[Astro Storefront / LP] --> API
    D[Embedded dotads-form.js
Web Component] --> API
    API --> DB[(PostgreSQL + Drizzle)]
    API --> OBJ[(Object Storage)]
    API --> MQ[(Outbox / Dispatch Queue)]
    API --> M[Meta CAPI]
    API --> G[Mengantar API]
    API --> P[AutoLaris API]
```


## 4. Domain & Multi-Tenant Routing Architecture

### 4.1 Hub Domain (`app.namadomain.com`)
- **Host:** `app.namadomain.com` (Super Admin, Tenant Admin, Form & LP Builder Canvas, SaaS Billing).
- **Stack:** Next.js 15 App Router + React 19 + shadcn/ui + Tailwind v4.
- **Routing:** Session-based tenant resolution (`/admin/*`, `/super-admin/*`).

### 4.2 Client Custom Domains (`order.brandclient.com` / `brandclient.com`)
- **Host:** Custom CNAME or A Record pointing to DotAds Edge / Coolify Reverse Proxy.
- **Lookup:** Middleware queries `tenant_domains` table in PostgreSQL (< 5ms cached) to resolve `tenant_id`.
- **Render Engine:** Astro 5 SSR/Static (Landing Pages & Mini Storefront) + Hono API (`/api/v1/public/*`).

## 4. Deployment Topology
- Admin: Vercel or Coolify-hosted Node runtime.
- API: Bun or Node process behind reverse proxy.
- Storefront: Astro static/SSR deploy. Cloudflare Pages acceptable only for page delivery, not as tenant data plane.
- Assets: S3-compatible object store or R2.
- Database: PostgreSQL. Preferred managed option: Neon. Self-hosted fallback: Postgres on VPS.

## 5. Custom Domain Model
- `tenant_domains` stores seller-owned hostnames.
- Sellers self-manage domains in tenant settings.
- Verification states: `pending_dns`, `verified`, `ssl_issuing`, `active`, `failed`, `removing`.
- Primary domain change is a tenant operation.
- Unknown or unverified domains fail closed.

## 6. Data Model

### Geography & Cache tables
- `mengantar_locations(id, mengantar_id, subdistrict_name, city_name, province_name, postal_code, zone_group, raw_search_query)` (Pre-seeded ~7,200+ Indonesian Kecamatan with GIN Trigram index for <15ms autocomplete)


### Core tables
- `tenants(id, slug, name, status, plan_code, timezone, currency, created_at, updated_at)`
- `tenant_domains(id, tenant_id, hostname_normalized, is_primary, verification_status, verification_target, ssl_status, last_verified_at, created_at)`
- `users(id, email_normalized, password_hash, display_name, last_login_at, created_at)`
- `memberships(id, tenant_id, user_id, role, status, invited_by, invited_at, accepted_at)`
- `audit_logs(id, tenant_id nullable, actor_user_id nullable, actor_role, action, target_type, target_id, correlation_id, metadata_json, created_at)`

### Catalog tables
- `products(id, tenant_id, slug, title, description_json, status, media_asset_id, created_at, updated_at)`
- `product_variants(id, tenant_id, product_id, sku, title, option_values_json, price_idr, compare_at_price_idr nullable, stock_qty, weight_grams, is_active, created_at, updated_at)`

### Builder tables
- `form_schemas(id, tenant_id, name, status, current_version_id nullable, created_by, updated_by, created_at, updated_at)`
- `form_schema_versions(id, tenant_id, form_schema_id, version_number, schema_hash, schema_json, styling_json, published_at nullable, created_by, created_at)`
- `landing_pages(id, tenant_id, slug, name, status, current_version_id nullable, created_at, updated_at)`
- `landing_page_versions(id, tenant_id, landing_page_id, version_number, section_tree_json, theme_json, seo_json, publish_snapshot_json, created_by, created_at, published_at nullable)`

### Order and integration tables
- `orders(id, tenant_id, public_token, customer_name, customer_phone_e164, customer_email nullable, province_code, city_name, district_id, address_line1, postal_code, payment_method, payment_status, order_status, shipping_status, subtotal_idr, shipping_cost_idr, total_idr, attribution_json, risk_score, risk_level, created_at, updated_at)`
- `order_items(id, tenant_id, order_id, product_id, product_variant_id, title_snapshot, sku_snapshot, qty, unit_price_idr, weight_grams_snapshot)`
- `order_events(id, tenant_id, order_id, event_type, event_payload_json, occurred_at, actor_user_id nullable, source)`
- `mengantar_configs(id, tenant_id, credential_ref, origin_area_id, allowed_couriers_json, cod_enabled, created_at, updated_at)`
- `autolaris_configs(id, tenant_id, credential_ref, callback_secret_ref, enabled_methods_json, created_at, updated_at)`
- `tracking_configs(id, tenant_id, meta_pixel_id, meta_capi_token_ref, google_ads_config_json, default_utm_json, created_at, updated_at)`
- `meta_event_outbox(id, tenant_id, order_id nullable, event_name, event_id, payload_json, delivery_state, attempts, next_attempt_at, last_error, created_at, delivered_at nullable)`
- `mengantar_dispatch_queue(id, tenant_id, order_id, credential_scope_key, lease_until nullable, state, attempts, last_error, created_at)`

### Indexes
- Unique `(tenant_id, slug)` on products and landing pages.
- Unique `(tenant_id, sku)` on product variants.
- Unique `(hostname_normalized)` on tenant domains.
- Unique `(tenant_id, public_token)` on orders.
- Index `(tenant_id, created_at desc)` on operational tables.
- Index `(tenant_id, payment_status, order_status, shipping_status)` on orders.
- Index `(credential_scope_key, state, lease_until)` on dispatch queue.
- Unique `(tenant_id, event_name, event_id)` on Meta outbox.

## 7. Admin Information Architecture
1. Commerce: Dashboard, Order Management, Pengiriman, Produk, Konten Storefront.
2. Operations: Ekspedisi, Cek WA & Ongkir.
3. Growth: Ads & Tracking (Meta Pixel & CAPI, Google Ads).
4. Finance & System: Payment AutoLaris, Rekonsiliasi, Pengaturan (Store & CS, Gudang, CRM Templates, Akses Pengguna).
5. Profile: Profil & Integrasi.

## 8. Responsive Admin Contract
- Desktop: persistent sidebar, dense tables, sticky page header.
- Tablet: collapsible sidebar, preserved primary actions, side sheets.
- Mobile/webview: bottom navigation, sticky CTA, row-to-sheet detail, safe-area padding, keyboard-aware footer, no desktop-only hidden action.

## 9. Builder and Form Runtime
- Canonical JSON first.
- Four form presets are permanent contracts: `full`, `hybrid`, `middle`, and `mini`; `FORM_ENGINE_PRESETS_SPEC.md` owns their canonical runtime and UX behavior.
- Native Web Component runtime; no iframe.
- Parent-page attribution propagation includes `_fbp`, `_fbc`, `fbclid`, `gclid`, `gbraid`, `wbraid`, `utm_*`.
- Payment selection keeps DotAds-style bank-logo trust cues.

## 10. Integrations & Catalog Feeds
- Multi-Ad Signal Engine: Meta Pixel/CAPI, Google Ads (gtag + Consent Mode v2 + Offline Conversion API + gclid/gbraid/wbraid), TikTok Ads (Events API v2 + ttclid).
- Auto Google Product Category Selection Engine & GTIN-13/EAN validation.
- Dynamic XML/JSON Catalog Feeds (`/api/v1/public/catalog/google-shopping.xml` & `meta-catalog.json`).

- Mengantar: server-authoritative rates, sequential dispatch queue, provider-accepted waybill persistence.
- AutoLaris: QRIS and VA session creation from exact server total, verified webhooks.
- Meta Ads: Pixel + CAPI, COD never emits premature Purchase, outbox handles retries.

## 11. OMP Multi-Model Execution Contract
Parallel slices:
- architecture/data/auth
- API/OpenAPI/contracts
- admin UX/components
- storefront/embed runtime
- tracking/integrations
- verification/docs

Shared contracts land first: roles, route namespaces, event IDs, domain model, form mode names.


## 12. Local & VPS Deployment Architecture (Docker & Coolify)

### 12.1 Local Development Stack (`docker-compose.yml`)
For zero-dependency local development, DotAds provides a pre-configured `docker-compose.yml`:
- **PostgreSQL 16:** `postgres:16-alpine` on port `5432` with `dotads_dev` database.
- **Environment:** Local `.env` containing `DATABASE_URL="postgres://postgres:postgres@localhost:5432/dotads_dev"`.
- **Orchestration:** `pnpm dev` runs Hono API (`8787`), Next.js Admin (`3000`), and Astro Storefront (`4321`) concurrently with live reload.

### 12.2 Multi-Stage Dockerfiles
- **`apps/api/Dockerfile`:** Lightweight Bun/Node 22 multi-stage build exposing Hono API on port `8787`.
- **`apps/admin/Dockerfile`:** Multi-stage Next.js standalone build (`output: 'standalone'`) exposing Admin UI on port `3000`.
- **`apps/storefront/Dockerfile`:** Multi-stage Astro SSR build exposing storefront on port `4321` (or static export deployed to Cloudflare Pages).

### 12.3 VPS & Coolify Self-Hosting Workflow
For merchants or operators self-hosting DotAds on a VPS (Vultr, Hetzner, DigitalOcean) via **Coolify**:
1. **Server Setup:** Spin up Ubuntu 24.04 LTS VPS and install Coolify (`curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`).
2. **Coolify Application Stack (`docker-compose.coolify.yml`):**
   - **Service 1 (`db`):** PostgreSQL 16 container with persistent volume.
   - **Service 2 (`api`):** DotAds Hono API container (`api.yourdomain.com`).
   - **Service 3 (`admin`):** DotAds Next.js Admin container (`admin.yourdomain.com`).
   - **Service 4 (`storefront`):** DotAds Astro Storefront container or Cloudflare Pages static edge.
3. **Environment & Secrets:** Managed inside Coolify UI (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `MENGANTAR_API_KEY`, `AUTOLARIS_SECRET`, `META_CAPI_TOKEN`).
4. **SSL & Reverse Proxy:** Coolify's built-in Traefik reverse proxy handles automatic SSL certificates via Let's Encrypt.
5. **Database Migrations:** Executed on release via Coolify deployment hooks (`pnpm --filter @dotads/db db:migrate`).
