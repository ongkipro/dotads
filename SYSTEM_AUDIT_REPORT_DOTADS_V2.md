# DotAds Engine v2 — Full System & Codebase Comprehensive Audit Report

> **Historical/superseded record — 2026-08-16.** This dated audit is not a current source of requirements, tasks, architecture, release status, or evidence. Use `PRD.md`, the named domain owner documents, `TASKS.md`, `STATUS.md`, and `BUILD-LOG.md`.

**Date:** 2026-08-15  
**Auditor:** Senior Full-Stack System Architect & Security Lead  
**Scope:** `@dotads/db`, `@dotads/auth`, `@dotads/contracts`, `@dotads/integrations`, `@dotads/form-runtime`, `apps/api`, `apps/admin`, `apps/storefront`  
**Overall Status:** Critical Remediation Required Prior to Production / Live Ad Traffic.

---

## Executive Summary

A comprehensive 6-domain parallel audit of DotAds Engine v2 was conducted across Security & Privacy, Payment & Checkout, Order/Stock/Dispatch, Ad Tracking Signals, Frontend (Type/A11y/Perf/UI-UX), and Senior Engineering Discipline.

While the monorepo architecture and OpenAPI contracts are well-structured on paper, **the platform contains critical release-blocking vulnerabilities, broken checkout calculations, zero inventory management, fake waybill generation, unauthenticated webhooks, and zero-delivery ad signal outbox execution.**

This document synthesizes all findings and details the concrete action plan required before mass development.

---

## 1. Security & Privacy Audit (Batch 1)

### Critical & High Findings
1. **SEC-AUTH-001 (Critical):** Static `test-superadmin-token` in `authMiddleware` grants unauthenticated `SUPER_ADMIN` access over any tenant via `x-tenant-id`. Furthermore, `better-auth` is never mounted as an HTTP handler (`app.route("/api/auth/*")`), making this bypass the *only* functional authentication path in the API.
2. **SEC-TENANT-001 (Critical):** Client-supplied `x-tenant-id` header override combined with 10+ admin routes lacking `hasPermission()` authorization checks allows any user to read and delete any tenant's orders, audit logs, and domains.
3. **SEC-WEBHOOK-001 (Critical):** AutoLaris payment webhook signature check is inside `if (signatureHeader)` — omitting the signature header skips verification completely, allowing unauthenticated remote callers to flip any order status to `PAID` / `CONFIRMED`.
4. **SEC-WEBHOOK-002 (High):** Mengantar logistics webhook is completely unauthenticated and performs unscoped order lookups by `cnoteNo`.
5. **SEC-INPUT-001 (High):** Handlers call raw `await c.req.json()` instead of `c.req.valid("json")`, enabling price mass assignment (clients can submit arbitrary `subtotalMinor`, `shippingCostMinor`, and item `priceMinor`).
6. **SEC-XSS-001 (High):** Reflected XSS in `/api/v1/public/embed/form` via unescaped `tenantId` query parameter.
7. **SEC-BOT-001 (High):** Cloudflare Turnstile verification fails open when `TURNSTILE_SECRET_KEY` is not set in environment.
8. **SEC-CRYPTO-001 (High):** Payment gateway secrets, courier API keys, and CAPI access tokens stored in plaintext database columns without application-level encryption.

---

## 2. Payment & Checkout Audit (Batch 2)

### Critical & High Findings
1. **PAY-P0-01 (Critical):** Public order creation handler computes `orderInput.subtotalMinor + orderInput.shippingCostMinor - discountMinor`. Because `<dotads-form>` sends no money fields and Zod contract excludes them, `totalMinor` yields `NaN`, causing PostgreSQL INSERT failure on all public form orders.
2. **PAY-P0-02 (Critical):** HYBRID 2-step form destroys contact input data (Name & Phone) when switching steps because `render()` overwrites shadow DOM HTML without storing element values in component state.
3. **PAY-P0-03 (Critical):** QRIS and Virtual Account (VA) payment instructions (`qrUrl`, `vaNumber`) returned by API are ignored by `<dotads-form>` runtime; buyer is immediately redirected to a generic thank-you page with no QR code or VA payment instructions.
4. **PAY-P0-04 (High):** `reconcilePaymentStatus` overwrites transaction status unconditionally without atomic compare-and-set or monotonic status checks, allowing out-of-order webhooks to regress paid orders.
5. **PAY-P0-05 (High):** No checkout-level idempotency key handling; network retries or double-clicks generate duplicate orders and duplicate outbox conversion signals.

---

## 3. Order, Stock & Mengantar Logistics Audit (Batch 3)

### Critical & High Findings
1. **ORD-P0-01 (Critical):** Stock management subsystem does not exist. `productVariants.stockQuantity` is never read or decremented upon order placement. Unlimited oversell possible.
2. **ORD-P0-02 (Critical):** COD `cod_value` sent to Mengantar courier API is 100× inflated (`order.totalMinor` in sen sent as IDR rupiah). Courier attempts to collect Rp 149.900.000 for a Rp 1.499.000 order.
3. **ORD-P0-03 (Critical):** When Mengantar API returns an error or no `cnote_no`, `mengantar.ts` fabricates a synthetic waybill `MNTR_########`, updates order to `SHIPPED`, and marks the queue job complete — permanently stranding unshipped orders.
4. **ORD-P0-04 (Critical):** Typo in Mengantar rate quote endpoint `order/allEstimate3Pld` (should be `order/allEstimate3PL`) causes 404 on every quote request, falling back to a flat Rp 18.000 national rate.
5. **ORD-P0-05 (Critical):** Order numbers generated via `ORD_${Date.now().toString().slice(-6)}` experience 300 duplicate collisions per 500 requests during ad spikes, throwing database unique violation 500 errors.
6. **ORD-P0-06 (High):** Prepaid orders (QRIS/VA) are never inserted into `mengantarDispatchQueue` upon payment reconciliation.
7. **ORD-P0-07 (High):** Four mutually incompatible order status vocabularies exist across Schema, Public API, Admin UI, and Webhooks.

---

## 4. Tracking Signals & Attribution Audit (Batch 4)

### Critical & High Findings
1. **SIG-P0-01 (Critical):** `processOutboxEvents()` updates event status from `pending` -> `processing` -> `sent` without making any HTTP network calls to Meta, Google, or TikTok. 100% server conversion loss.
2. **SIG-P0-02 (Critical):** Single Meta-formatted JSON payload is stored verbatim for Meta, Google Ads, and TikTok Ads events. Google and TikTok API contracts are completely violated.
3. **SIG-P0-03 (Critical):** All order submissions trigger instant `Purchase` events, even for unpaid QRIS/VA or unconfirmed COD orders.
4. **SIG-P0-04 (Critical):** Meta Pixel client-side `Purchase` event does not pass `eventID`, making browser and server event deduplication impossible.
5. **SIG-P0-05 (High):** Storefront does not capture `gclid`, `gbraid`, `wbraid`, `ttclid`, or `_ttp` from URL query parameters. Google Consent Mode v2 is missing.

---

## 5. Type, Accessibility, Performance & UI/UX Audit (Batch 5)

### Findings
1. **UI-P0-01 (Critical):** Cumulative Layout Shift (CLS > 0.4) on storefront because `<dotads-form>` custom element renders `0px` height until JS script hydration completes.
2. **UI-P0-02 (High):** Shadow DOM styles in `<dotads-form>` re-inject `<style>` tags on every render instead of using constructable stylesheets (`CSSStyleSheet`).
3. **UI-P0-03 (High):** Accessibility focus loss: advancing steps in multi-step form resets focus to `<body>`, breaking screen reader experience.
4. **UI-P0-04 (High):** Admin Panel UI ignores CSS variables (`oklch` tokens) in `globals.css` and uses hardcoded Tailwind slate/emerald classes, breaking Dark Mode.

---

## 6. Engineering Discipline & Monorepo Audit (Batch 6)

### Findings
1. **ENG-P0-01 (High):** No automated CI workflow or unit testing framework (Vitest/Jest). Monorepo test suite consists of 7 live-DB smoke scripts executed sequentially with `&&`.
2. **ENG-P0-02 (Medium):** Dead workspace package `packages/ui` (empty).
3. **ENG-P0-03 (Medium):** Duplicate byte-identical `postcss.config.js` and `postcss.config.mjs` in `apps/admin`.
4. **ENG-P0-04 (Medium):** Hand-rolled CORS middleware in `apps/api/src/app.ts` duplicating Hono standard `cors()` middleware.

---

## Remediation Roadmap

All issues are prioritized into **Phase 1: Critical Security & Contract Hardening**, **Phase 2: Core Engine & Architecture Fixes**, and **Phase 3: Tokophi UI/UX Perfection & Mass Refactoring**.
