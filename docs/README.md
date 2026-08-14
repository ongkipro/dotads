# DotAds Engine v2 — Direct-Response Commerce & Multi-Platform Signal Engine

DotAds Engine v2 (`@dotads/*`) is a multi-tenant, high-performance direct-response commerce operating system built with Hono (Node.js/Bun), Astro 5, Next.js 15, PostgreSQL, Drizzle ORM, better-auth, and Tailwind CSS v4.

It powers high-converting ad funnels with zero-hydration landing pages, a native Web Component embed form engine (`dotads-form.js`) supporting the `full`, `hybrid`, `middle`, and `mini` presets (including Hybrid Draft Lead capture and Mini WhatsApp lead redirect), 3PL Mengantar shipping integration, AutoLaris payment gateway, and a server-authoritative Multi-Platform Signal Engine covering Meta CAPI (8.5–9.5+ EMQ), Google Ads Enhanced Conversions with Consent Mode v2, and TikTok Events API v2 — all sharing the `outbox_events` transactional outbox with per-platform fan-out and `unique(tenant_id, platform, event_id)` deduplication.

## Domain Topology
- `app.namadomain.com` — Platform Hub (Next.js 15 Admin + Hono API)
- `order.brandclient.com` — Client Custom Domains (Astro 5 Storefront + Landing Pages)

## Repository Architecture
```
dotads/
├── apps/
│   ├── admin/          # Next.js 15 Super Admin & Tenant Admin + Builders
│   ├── storefront/     # Astro 5 High-Speed Storefront & LP Engine
│   └── api/            # Hono Backend API with OpenAPI 3.1 & Scalar docs
├── packages/
│   ├── db/             # PostgreSQL + Drizzle Schema, Migrations, & Local Kecamatan Cache
│   ├── auth/           # better-auth Multi-Tenant Organization & RBAC Policy
│   ├── contracts/      # Shared Zod Contracts, Enums & Form Mode Definitions
│   ├── form-runtime/   # dotads-form.js Native Web Component (Shadow DOM, <12KB)
│   ├── integrations/   # Mengantar, AutoLaris, Meta CAPI, Google Ads, TikTok Ads Adapters
│   ├── ui/             # shadcn/ui Admin Primitives & Storefront Form Tokens
│   └── config/         # Lint, TSConfig, Env Contracts, Tailwind Presets
└── docker-compose.yml          # Local dev: PostgreSQL 16
└── docker-compose.coolify.yml  # VPS production: Coolify self-hosting
```

## Quick Start
```bash
# 1. Clone and install
git clone <repo-url> && cd dotads
pnpm install

# 2. Start local PostgreSQL and run migrations
docker compose up -d db
pnpm --filter @dotads/db db:generate
pnpm --filter @dotads/db db:migrate
pnpm --filter @dotads/db db:seed

# 3. Start development servers
pnpm dev
```

## Specification Pack

All specifications live in `./docs/`. See `docs/INDEX.md` for canonical read order.

| File | Description |
|---|---|
| `INDEX.md` | Canonical specification read order and file inventory |
| `PRD.md` | 87 EARS Requirements across 7 functional domains |
| `TASKS.md` | 87 Execution Tasks with 1:1 requirement traceability and runnable `Done when` gates |
| `PLAN.md` | Architecture: Hono + PostgreSQL + Drizzle + better-auth + Astro + Next.js topology |
| `ADR.md` | Architecture Decision Records (ADR-001 through ADR-011) |
| `UI-UX-DESIGN-SYSTEM.md` | Visual Tokens, DotAds Fisik IA, shadcn/ui, & Responsive UX Matrix |
| `SUPER_ADMIN_ARCHITECTURE.md` | Super Admin Workspace & SaaS Billing Engine |
| `MENGANTAR_INTEGRATION_SPEC.md` | 3PL Shipping, Bun Sequential Queue, & RTS Risk Engine |
| `TRACKING_SPECS.md` | Multi-Platform Signal Engine: Meta CAPI, Google Ads, TikTok Events API v2 |
| `STOREFRONT-HEADLESS-SDK.md` | Headless Storefront SDK, Draft Lead Protocol, & Ad Attribution |
| `FORM_ENGINE_PRESETS_SPEC.md` | Canonical `FULL`, `HYBRID`, `MIDDLE`, and `MINI` runtime, state, attribution, and UI contracts |
| `openapi.yaml` | OpenAPI 3.1 REST API Contract |
| `DEVELOPMENT.md` | OMP Terminal Parallel Development Rules |
| `AGENTS.md` | AI Terminal Guidance & Repository Boundaries |
| `STATUS.md` | Current Specification & Implementation Milestones |
| `BUILD-LOG.md` | Chronological Audit Trail & Verification Log |
| `HISTORY.md` | Architectural Decision & Refactoring History |
| `README.md` | This file |
