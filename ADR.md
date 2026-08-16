# DotAds Engine v2 — ADR

> **Compatibility record.** `DECISIONS.md` owns active architecture decisions. Entries below preserve legacy ADR identifiers but do not override current executable behavior or release blockers.

## ADR-001 — PostgreSQL + Drizzle over Cloudflare D1 fleet
Status: Accepted

Decision: Use one pooled PostgreSQL database with strict row-level tenant isolation and Drizzle ORM.

## ADR-002 — Native Web Component form over iframe widget
Status: Accepted

Decision: Replace iframe embeds with `dotads-form.js` using custom elements and Shadow DOM.

## ADR-003 — Hono + @hono/zod-openapi for headless API
Status: Accepted

Decision: Use Hono with shared Zod contracts and generated OpenAPI 3.1.

## ADR-004 — Next.js admin + Astro storefront hybrid split
Status: Accepted

Decision: Use Next.js for admin/builder and Astro for storefront/LP.

## ADR-005 — better-auth organization plugin for tenancy and roles
Status: Accepted

Decision: one organization equals one tenant. Roles attach to memberships.

## ADR-006 — Seller self-service custom domains
Status: Accepted

Decision: tenant owners can add, verify, set primary, and remove domains themselves through admin UI and API.

## ADR-007 — Sequential Mengantar dispatch queue
Status: Accepted

Decision: use a lease-based sequential queue per provider credential scope.

## ADR-008 — Meta server-authoritative Purchase events
Status: Accepted

Decision: COD submissions are `Lead`; `Purchase` is emitted only on verified paid/delivered policy event.

## ADR-009 — Integer IDR amounts everywhere
Status: Accepted

Decision: all money fields are integer rupiah values.

## ADR-010 — Four canonical form presets remain first-class
Status: Accepted

Decision: `full`, `hybrid`, `middle`, and `mini` remain permanent runtime and builder contracts. `FORM_ENGINE_PRESETS_SPEC.md` is the canonical behavioral and UI contract for all four presets.


## ADR-011 — Local Docker Compose & Coolify VPS Self-Hosting Pipeline
Status: Accepted

Decision: Provide multi-stage Dockerfiles (`apps/api`, `apps/admin`, `apps/storefront`), a local `docker-compose.yml` for PostgreSQL, and a `docker-compose.coolify.yml` for one-click VPS deployment via Coolify with automated SSL and Drizzle migration hooks.
