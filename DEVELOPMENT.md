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

## Workspace Conventions
- **Package manager:** pnpm workspaces + Turborepo.
- **Canonical workspaces:** `apps/api` (`@dotads/api`), `apps/admin` (`@dotads/admin`), `apps/storefront` (`@dotads/storefront`), `packages/db`, `packages/auth`, `packages/contracts`, `packages/form-runtime`, `packages/integrations`, `packages/ui`, `packages/config`.
- **API base URL:** `http://localhost:8787`; OpenAPI at `/api/v1/openapi.json`; Scalar docs at `/api/v1/docs`.
- **Admin App:** `http://localhost:3000/admin`; Super Admin at `http://localhost:3000/super-admin`.
- **Storefront:** `http://localhost:4321/`; Thank You Page at `http://localhost:4321/thank-you/`.
- **Money:** Integer IDR minor units everywhere.
- **Outbox:** `outbox_events` table with `unique(tenant_id, platform, event_id)` — one row per configured ad platform per conversion.
