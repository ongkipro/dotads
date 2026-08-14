# Dotfiles Senior Engineering System Audit & Review — DotAds v2

**Framework:** Dotfiles Master Senior Engineering Rules (`/home/ongki/.omp/agent/AGENTS.md`)  
**Auditor:** Senior Staff Software & Systems Engineer  
**Date:** 2026-08-15

---

## 1. Evaluation Against Lazy Senior Dev Principles

### 1.1 YAGNI & Code Deletion
- **Finding:** `packages/ui` is an empty workspace package with zero source code.
- **Finding:** `apps/admin` contains duplicate byte-identical PostCSS configs (`postcss.config.js` and `postcss.config.mjs`).
- **Action:** Delete `packages/ui` workspace entry and `postcss.config.mjs`.

### 1.2 Platform & Stdlib Reuse over Hand-Rolled Abstractions
- **Finding:** `apps/api/src/app.ts` implements hand-rolled CORS header logic (`c.header("Access-Control-Allow-Origin", "*")`) instead of using Hono's built-in `cors()` middleware.
- **Finding:** Custom rate limiter in `apps/api/src/middleware/rate-limit.ts` uses an in-process unbounded JavaScript `Map` without TTL or LRU eviction, leading to memory leaks and fail-open Header spoofing (`x-forwarded-for`).
- **Action:** Standardize on Hono native `cors()` middleware and replace in-memory rate limiter with Redis/KV rate limiting or bounded LRU cache with proper client IP resolution.

---

## 2. Monorepo & Architectural Separation of Concerns

### 2.1 Package Boundaries
- `@dotads/db`: DB schema, Drizzle ORM client, tenant isolation middleware.
- `@dotads/auth`: Better-auth configuration, RBAC permissions, session resolution.
- `@dotads/contracts`: Shared Zod schemas, OpenAPI definitions, preset schemas.
- `@dotads/integrations`: Mengantar logistics client, AutoLaris payment gateway client, ad conversion outbox worker.
- `@dotads/form-runtime`: Web component (`<dotads-form>`) engine.
- `apps/api`: Hono REST API server & webhooks handler.
- `apps/admin`: Next.js 15 Super Admin & Merchant Management Dashboard.
- `apps/storefront`: Astro 5 high-converting storefront.

### 2.2 Route Refactoring & Organization
- `apps/api/src/routes/admin.ts` is currently a monolithic ~640 line file containing orders, forms, pages, domains, audit logs, and members endpoints.
- **Action:** Decompose `admin.ts` into modular domain routers:
  - `apps/api/src/routes/admin/orders.ts`
  - `apps/api/src/routes/admin/builders.ts`
  - `apps/api/src/routes/admin/domains.ts`
  - `apps/api/src/routes/admin/members.ts`
  - `apps/api/src/routes/admin/audit-logs.ts`

---

## 3. Automated Verification & Testing Strategy

- Current testing relies strictly on sequential live-database Node smoke scripts.
- **Action:** Introduce Vitest unit test suite for:
  - Zod contract validation.
  - Payment HMAC signature verification functions.
  - Mengantar rate calculator arithmetic & currency conversion functions.
  - Receiver risk scoring rules.
  - Outbox wire payload formatters (Meta CAPI, Google Ads, TikTok Ads).

---

## 4. Summary of Output Copies

Draft copy saved to: `~/Documents/work/research/DOTADS_V2_FULL_AUDIT_AND_SPEC.md`  
Project Root copies saved to:
- `/home/ongki/Projects/dotads/SYSTEM_AUDIT_REPORT_DOTADS_V2.md`
- `/home/ongki/Projects/dotads/TOKOPHI_PERFECTION_SPEC.md`
- `/home/ongki/Projects/dotads/DOTFILES_ENGINEERING_REVIEW.md`
- `/home/ongki/Projects/dotads/PRD.md` (updated)
- `/home/ongki/Projects/dotads/TASKS.md` (updated)