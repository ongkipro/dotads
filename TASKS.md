# DotAds Engine v2 — Mass Development Task List

## Phase 1: Security, Tenant Isolation & Authentication Hardening
- [ ] **Task 1**: Remove static `test-superadmin-token` bypass in `apps/api/src/middleware/auth.ts` and mount `better-auth` HTTP routes on `apps/api/src/app.ts`.
- [ ] **Task 2**: Eliminate `x-tenant-id` header override fallback in `authMiddleware`. Derive `tenantId` strictly from session or validated domain host.
- [ ] **Task 3**: Add router-level `requirePermission(...)` authorization middleware across all `apps/api/src/routes/admin.ts` routes.
- [ ] **Task 4**: Enforce mandatory HMAC signature verification in `apps/api/src/routes/webhooks.ts` for AutoLaris and Mengantar callbacks.
- [ ] **Task 5**: Replace raw `c.req.json()` calls with `c.req.valid("json")` across all public and admin route handlers. Recompute order subtotal and total server-side.
- [ ] **Task 6**: Sanitize HTML output in `/api/v1/public/embed/form` to prevent reflected XSS.
- [ ] **Task 7**: Fail closed on Turnstile token verification when `TURNSTILE_SECRET_KEY` is not present in production environment.

## Phase 2: Payment Gateway & Checkout Engine
- [ ] **Task 8**: Fix public order contract and creation logic to compute valid integer totals (resolving `NaN` integer bind error).
- [ ] **Task 9**: Refactor `<dotads-form>` Web Component to retain input values in internal component state across `render()` calls and step switches in `HYBRID` mode.
- [ ] **Task 10**: Build interactive QRIS QR code and Virtual Account presentation modal with payment status polling.
- [ ] **Task 11**: Make `reconcilePaymentStatus` atomic using SQL compare-and-set updates (`WHERE payment_status != 'SUCCESS'`).
- [ ] **Task 12**: Implement client-supplied UUID idempotency keys for public order placement.

## Phase 3: Inventory, Orders & Mengantar Logistics
- [ ] **Task 13**: Implement atomic database stock deduction (`UPDATE product_variants SET stock_quantity = stock_quantity - $qty WHERE stock_quantity >= $qty`) during order placement.
- [ ] **Task 14**: Correct Mengantar `cod_value` calculation to send major IDR units (rupiah) instead of minor units (sen).
- [ ] **Task 15**: Remove synthetic waybill fabrication (`MNTR_########`) in `packages/integrations/src/mengantar.ts`. Throw HTTP errors and push failed dispatches to DLQ.
- [ ] **Task 16**: Fix Mengantar shipping rate calculation URL typo (`order/allEstimate3PL`).
- [ ] **Task 17**: Replace order number generator `ORD_${Date.now()}` with monotonic per-tenant ULID / sequence generator.
- [ ] **Task 18**: Enqueue prepaid orders into `mengantarDispatchQueue` upon successful payment reconciliation (`PAID`).
- [ ] **Task 19**: Reconcile order status vocabularies across Schema, API, Admin UI, and Webhooks.

## Phase 4: Ad Tracking Signals Outbox & Multi-Platform Delivery
- [ ] **Task 20**: Implement real HTTP POST request workers in `packages/integrations/src/outbox-worker.ts` for Meta CAPI, Google Ads, and TikTok Ads.
- [ ] **Task 21**: Generate deterministic conversion event IDs (`evt_purchase_${orderId}`) shared between browser pixels and server outbox.
- [ ] **Task 22**: Delay `Purchase` conversion outbox insertion until payment confirmation (prepaid) or courier cash delivery (COD).
- [ ] **Task 23**: Add Google Consent Mode v2 initialization script and TikTok Events API v2 payload formatter.

## Phase 5: Tokophi UI/UX, Performance & Accessibility
- [ ] **Task 24**: Add `:not(:defined)` skeleton CSS placeholder for `<dotads-form>` on storefront to reduce CLS < 0.02.
- [ ] **Task 25**: Add mobile sticky purchase bar with smooth scroll anchor to form.
- [ ] **Task 26**: Preserve keyboard focus during form step navigation.
- [ ] **Task 27**: Align Admin UI components with `oklch` CSS variables in `globals.css` for Dark Mode support.

## Phase 6: Codebase Cleanup, Refactoring & Verification
- [ ] **Task 28**: Delete dead `packages/ui` workspace directory and duplicate PostCSS configs in `apps/admin`.
- [ ] **Task 29**: Replace hand-rolled CORS logic in `apps/api/src/app.ts` with Hono standard `cors()` middleware.
- [ ] **Task 30**: Decompose monolithic `apps/api/src/routes/admin.ts` into modular domain routers (`admin/orders.ts`, `admin/builders.ts`, etc.).
- [ ] **Task 31**: Add Vitest unit test suite covering Zod contracts, HMAC verification, Mengantar rate calculations, and signal payload formatters.
- [ ] **Task 32**: Run full monorepo build (`pnpm build`) and regression test suite (`pnpm test`) to achieve 100% PASS.