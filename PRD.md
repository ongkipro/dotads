# DotAds Engine v2 — Product Requirements Document (PRD)

## Goals
1. Provide a production-ready, secure, zero-trust multi-tenant direct-response commerce platform and form engine.
2. Ensure 100% Signal Match Quality and true browser/server conversion deduplication across Meta Ads, Google Ads (Consent Mode v2), and TikTok Ads (Events API v2).
3. Deliver a high-converting, sub-second, zero-CLS Tokophi storefront and Web Component form engine (`FULL`, `HYBRID`, `MIDDLE`, `MINI`).
4. Implement reliable Mengantar logistics dispatch, AutoLaris payment reconciliation, and atomic stock inventory allocation.

## Non-Goals
- Supporting legacy unauthenticated super-admin tokens or unverified webhooks.
- Client-authoritative pricing or untrusted price field mass assignment.

## Requirements

### R1. Security, Tenant Isolation & Authentication
- **R1.1**: Remove hardcoded bypass tokens (`test-superadmin-token`). Mount `better-auth` handlers on `/api/auth/*`.
- **R1.2**: Tenant ID MUST be derived exclusively from session/domain host, never from `x-tenant-id` header override.
- **R1.3**: Admin routes MUST be protected by default-deny permission middleware (`requirePermission(...)`).
- **R1.4**: Webhooks (AutoLaris & Mengantar) MUST require valid HMAC signature verification.
- **R1.5**: Discard unvalidated JSON request bodies (`c.req.valid("json")`). Recompute prices server-side.
- **R1.6**: Escape HTML parameters in public embed route to prevent reflected XSS.

### R2. Payment & Checkout Engine
- **R2.1**: Fix order total arithmetic so public checkout computes valid integer minor totals (no `NaN`).
- **R2.2**: Encapsulate Web Component state so step navigation in `HYBRID` mode preserves user contact input.
- **R2.3**: Render QRIS QR codes and Virtual Account numbers on a dedicated payment-pending surface with status polling.
- **R2.4**: Perform atomic compare-and-set updates during payment reconciliation.
- **R2.5**: Support client-generated UUID idempotency keys for public order placement.

### R3. Inventory, Orders & Mengantar Logistics
- **R3.1**: Implement atomic stock decrement on order placement (`stockQuantity >= qty`).
- **R3.2**: Correct `cod_value` unit conversion for Mengantar API (send IDR major units, not sen).
- **R3.3**: Throw on carrier API error or missing waybill — NEVER fabricate synthetic `MNTR_########` waybills or mark failed dispatches `SHIPPED`.
- **R3.4**: Fix Mengantar rate calculation URL typo (`order/allEstimate3PL`).
- **R3.5**: Replace `ORD_${Date.now()}` with monotonic per-tenant ULID/sequence to eliminate duplicate order number collisions.
- **R3.6**: Enqueue prepaid orders into logistics dispatch queue upon confirmed payment reconciliation (`PAID`).

### R4. Ad Tracking Signals & Multi-Platform Outbox
- **R4.1**: Execute real HTTP API requests to Meta CAPI, Google Ads, and TikTok Ads in `outbox-worker.ts`.
- **R4.2**: Generate deterministic event IDs (`evt_purchase_${orderId}`) shared across browser Pixel and server CAPI.
- **R4.3**: Enqueue `Purchase` events ONLY when payment is confirmed (prepaid) or cash delivered (COD).
- **R4.4**: Support Google Consent Mode v2 and TikTok Events API v2.

### R5. Tokophi UI/UX, Accessibility & Engineering Discipline
- **R5.1**: Add `:not(:defined)` skeleton bounds for `<dotads-form>` to achieve CLS < 0.02.
- **R5.2**: Add mobile sticky purchase bar with instant smooth scroll to form.
- **R5.3**: Maintain keyboard focus during form step navigation.
- **R5.4**: Use CSS variables (`oklch`) in Admin UI components for seamless Dark Mode.
- **R5.5**: Remove dead `packages/ui` package and duplicate PostCSS configs. Add Vitest suite.