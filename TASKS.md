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

---

## Next Actionable Follow-up Phases & Tasks

### Phase 8: Advanced Operational Security & Bot Protection (Pending)
- [ ] **Task 8.1: Cloudflare Turnstile Bot Protection on Public Orders**
  - **Requirement:** Integrate Turnstile CAPTCHA verification in `@dotads/form-runtime` and validate server-side token on `/api/v1/public/orders` to prevent automated bot spam on Meta Ads landing pages.
  - **Done when:** `curl -X POST` without valid Turnstile token is rejected with HTTP 403, and valid submissions pass.

- [ ] **Task 8.2: Dynamic IP Rate Limiting & Abuse Prevention**
  - **Requirement:** Add strict per-IP rate limiting middleware in Hono API for order creation (max 5 orders / minute per IP).
  - **Done when:** Exceeding threshold triggers HTTP 429 Too Many Requests response with retry-after header.

### Phase 9: High-Availability VPS Infrastructure & Production Deployment (Pending)
- [ ] **Task 9.1: Coolify Docker Compose Setup with PgBouncer**
  - **Requirement:** Create production `docker-compose.yml` spec including PostgreSQL connection pooler (PgBouncer) tuned for handling high-concurrency Meta Ads traffic spikes.
  - **Done when:** `docker compose config` validates without errors.

- [ ] **Task 9.2: Automated Backup & Database Migration Cron**
  - **Requirement:** Configure automated PostgreSQL logical backup script and migration verification hook before production release.
  - **Done when:** Backup script successfully creates encrypted `.sql.gz` dump.

### Phase 10: Logistics Dead-Letter Queue (DLQ) & Webhook Monitoring (Pending)
- [ ] **Task 10.1: Mengantar Failed Dispatch Auto-Retry Engine**
  - **Requirement:** Implement exponential backoff retry worker for failed Mengantar waybill requests (e.g. temporary API timeout).
  - **Done when:** Failed dispatch automatically retries up to 3 times before marking as DLQ.
