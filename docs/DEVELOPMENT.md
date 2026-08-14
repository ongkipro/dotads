# DotAds Engine v2 — OMP Fullstack Development Orchestration

## Goal
Provide an A–Z implementation operating system for OMP multi-model terminal development so the specification suite can move to production with parallel execution and minimal rework.

## Principle
Main session owns product intent, contracts, and verification. Parallel subagents own independent slices only.

## Canonical Implementation Phases
1. Foundation and data contracts
2. Auth, RBAC, and tenancy
3. OpenAPI and shared contracts
4. Admin shell and navigation
5. Tenant workflows
6. Builders
7. Storefront and embed runtime
8. Integrations (Mengantar, AutoLaris, Meta CAPI, Google Ads, TikTok Ads)
9. Multi-platform tracking and observability
10. End-to-end verification and release hardening

## Parallel Decomposition Model
- **Wave 1:** data schema, auth, API contracts, admin IA, integrations.
- **Wave 2:** admin shell, products/orders/settings, super admin, builder shell, storefront shell.
- **Wave 3:** Mengantar, AutoLaris, multi-platform `outbox_events` fan-out, domain verification.
- **Wave 4:** browser/API/integration verification, Headless SDK smoke, and docs.

## Typed Subagent Map
- **architect:** data model, repo layout, ADR, platform plan
- **designer:** admin IA, responsive behavior, builder UX, form precision
- **complex-developer:** auth, order lifecycle, integrations, queues
- **scout:** repo and provider evidence mapping
- **reviewer:** final quality/security pass

## Required Implementation Proofs
- **API changes:** request/response smoke.
- **Admin UI:** browser verification on desktop + tablet + 390px mobile. 100% shadcn/ui components.
- **Embedded form:** browser verification inside host page and mobile viewport.
- **Provider integration:** sandbox or recorded fixture smoke.
- **Tracking:** network/asserted outbox evidence for Meta CAPI, Google Ads, and TikTok Events API v2.
- **Headless SDK:** public REST API endpoint smoke covering products, shipping, regions, orders, and draft-lead capture.
- **Docker/Coolify:** deployment verification per the rules below.

## Non-Negotiables
- No deploy without approval.
- No secret printing.
- No cross-tenant shortcuts.
- No preview-only renderer divergence.
- No mobile deferred to later.
- No `@cmsads/*` package references (post-rebrand canonical prefix is `@dotads/*`).

## Docker & Coolify Deployment Rules
- **Local DB:** `docker compose up -d db` starts PostgreSQL 16.
- **Local Apps:** `pnpm dev` starts all 3 apps locally.
- **Migrations:** `pnpm --filter @dotads/db db:generate && pnpm --filter @dotads/db db:migrate && pnpm --filter @dotads/db db:seed` from a clean database.
- **Docker Build Check:** `docker compose -f docker-compose.coolify.yml build` verifies clean multi-stage compilation for `apps/api`, `apps/admin`, and `apps/storefront`.
- **VPS Deployment:** Coolify pulls Git repo, builds Docker images, runs `db:migrate`, and updates Traefik routes with zero downtime and automated SSL via Let’s Encrypt.
- **Rollback:** Coolify retains previous image versions; rollback restores the prior container set and verifies API/admin/storefront health.
- **Environment Secrets:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `MENGANTAR_API_KEY`, `AUTOLARIS_SECRET`, `META_CAPI_TOKEN`, `GOOGLE_ADS_API_TOKEN`, `TIKTOK_EVENTS_API_TOKEN` managed inside Coolify UI; never committed to Git.

## Workspace Conventions
- **Package manager:** pnpm workspaces + Turborepo.
- **Canonical workspaces:** `apps/api` (`@dotads/api`), `apps/admin` (`@dotads/admin`), `apps/storefront` (`@dotads/storefront`), `packages/db`, `packages/auth`, `packages/contracts`, `packages/form-runtime`, `packages/integrations`, `packages/ui`, `packages/config`.
- **API base URL:** `http://localhost:8787`; OpenAPI at `/api/v1/openapi.json`; Scalar docs at `/api/v1/docs`.
- **Browser tests:** Chromium with desktop, tablet, and mobile-webview viewport matrix.
- **Money:** Integer IDR minor units everywhere.
- **Outbox:** `outbox_events` table with `unique(tenant_id, platform, event_id)` — one row per configured ad platform per conversion.
