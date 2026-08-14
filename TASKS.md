# TASKS: DotAds Engine v2

## Execution Contract

- Implement tasks in dependency order; tasks without a dependency edge may run in parallel.
- Every task has exactly one **Primary requirement**. `Constraints` are requirements or accepted architecture decisions that shape the implementation but are not additional primary outcomes.
- A task is complete only after its `Done when` command/procedure is run against the implemented surface and the stated observable result is recorded.
- Use canonical OMP development conventions: record footprints in `BUILD-LOG.md`, maintain task tracking in `TASKS.md`, and verify changes with runnable smoke tests.

---

## Status Summary

- [X] **Phase 1: Core Foundation & Database Schema** (PostgreSQL + Drizzle ORM + Multi-tenant isolations verified)
- [X] **Phase 2: Hono API, better-auth Multi-tenancy & OpenAPI 3.1** (Hono + OpenAPI 3.1 + Scalar Docs + 6-Role RBAC verified)
- [X] **Phase 3: Admin UI/UX & Navigation** (Next.js 15 + Tailwind v4 + shadcn/ui + 25 prerendered static routes verified)
- [X] **Phase 4: Form & LP Builder Engines** (Section-based Landing Page editor + Form Schema presets & JSON export verified)
- [X] **Phase 5: Storefront & Web Component Embed** (<dotads-form> Web Component + Astro 5 zero-JS storefront verified)
- [X] **Phase 6: Mengantar Logistics, AutoLaris Payments & Multi-Platform Ad Outbox** (Production Mengantar API + AutoLaris QRIS/VA + Meta/GAds/TikTok outbox verified)
- [X] **Phase 7: Integrated Verification & Release Build** (`pnpm build` & `pnpm run smoke:release` 100% verified)
- [X] **Phase 8: Advanced Operational Security & Bot Protection** (Turnstile Bot Shield + Dynamic IP Rate Limiting verified)
- [X] **Phase 9: Comprehensive Indonesian Market UI/UX Audit & Screening** (Screening 25 static admin pages, select-by-select functionality, Bahasa Indonesia polish verified)
- [X] **Phase 10: Logistics Exponential Backoff Auto-Retry & DLQ Engine** (Mengantar auto-retry 3x with exponential backoff & DLQ state verified)
- [X] **Phase 11: Production Docker & PgBouncer Specification** (`docker-compose.coolify.yml` PgBouncer connection pooler & `backup-db.sh` verified; live Coolify deployment deferred per user command)

---

## Next Actionable Follow-up Phases & Tasks

### Phase 12: Production VPS Coolify Deployment & Domain SSL Handoff (Standby)
- [ ] **Task 12.1: Coolify Service Provisioning & Production Environment Deployment**
  - **Requirement:** Deploy production containers to VPS via Coolify when user authorizes remote deployment.
  - **Done when:** Live domain endpoints return HTTP 200 OK with SSL certificates.
