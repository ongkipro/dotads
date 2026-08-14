# TASKS: DotAds Engine v2

## Execution Contract

- Implement tasks in dependency order; tasks without a dependency edge may run in parallel.
- Every task has exactly one **Primary requirement**. `Constraints` are requirements or accepted architecture decisions that shape the implementation but are not additional primary outcomes.
- A task is complete only after its `Done when` command/procedure is run against the implemented surface and the stated observable result is recorded. Planning this command is not evidence that it passed.
- Use the canonical workspaces: `apps/api` (`@dotads/api`), `apps/admin` (`@dotads/admin`), `apps/storefront` (`@dotads/storefront`), `packages/db`, `packages/auth`, `packages/contracts`, `packages/form-runtime`, `packages/integrations`, `packages/ui`, and `packages/config`.
- Preserve clean tenant boundaries: authenticated tenant routes derive `tenant_id` from trusted session/host context, public routes resolve an explicit published tenant resource, and client-supplied tenant IDs are never authoritative.
- Keep money as integer minor units, external side effects idempotent, audit/event history append-only, credentials write-only, and public projections minimal.

## Status Summary

- [X] **Phase 1: Core Foundation & Database Schema** (PostgreSQL + Drizzle ORM + Multi-tenant isolations verified)
- [X] **Phase 2: Hono API, better-auth Multi-tenancy & OpenAPI 3.1** (Hono + OpenAPI 3.1 + Scalar Docs + 6-Role RBAC verified)
- [X] **Phase 3: Admin UI/UX & Navigation** (Next.js 15 + Tailwind v4 + shadcn/ui + 21 prerendered static routes verified)
- [X] **Phase 4: Form & LP Builder Engines** (Section-based Landing Page editor + Form Schema versioning verified)
- [X] **Phase 5: Storefront & Web Component Embed** (<dotads-form> Web Component + Astro 5 zero-JS storefront verified)
- [X] **Phase 6: Mengantar Logistics, AutoLaris Payments & Multi-Platform Ad Outbox** (Production Mengantar API + AutoLaris QRIS/VA + Meta/GAds/TikTok outbox verified)
- [X] **Phase 7: Integrated Verification & Release Build** (`pnpm build` & `pnpm run smoke:release` verified)
