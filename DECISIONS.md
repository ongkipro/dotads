# DotAds Engine v2 — Architecture Decisions

**Document owner:** Engineering Architecture
**Last reviewed:** 2026-08-16

This file owns active decisions. `ADR.md` is a compatibility record and must not override this file or executable behavior.

## DEC-001 — Pooled PostgreSQL with Defense-in-Depth Tenant Isolation

**Status:** Accepted; locally enforced, deployment wiring unverified
**Decision:** use PostgreSQL 16 and Drizzle. Every tenant-owned table carries `tenant_id`; application filters and PostgreSQL forced RLS are both required. Runtime queries use a non-owner role and transaction-local tenant context.
**Evidence:** `packages/db/src/schema`, migration `0004_tenant_rls.sql`, and the RLS stage of `pnpm test:clean-db` pass with distinct login roles and adversarial denial. Production role provisioning remains a release gate.

## DEC-002 — Better Auth Session and Organization Membership

**Status:** Accepted
**Decision:** one organization maps to one tenant. Global `SUPER_ADMIN` is not an organization role. Tenant roles come from active organization membership and tenant lifecycle status.
**Evidence:** `packages/auth/src/index.ts`, `apps/api/src/middleware/auth.ts`.

## DEC-003 — Hono OpenAPI Boundary

**Status:** Accepted
**Decision:** Hono owns API routing; shared Zod/OpenAPI contracts validate trust boundaries. The generated runtime document is authoritative over prose endpoint lists.
**Evidence:** `apps/api/src/app.ts`, `/api/v1/openapi.json`, `openapi.yaml`.

## DEC-004 — Next.js Admin and Astro Storefront

**Status:** Accepted
**Decision:** Next.js serves authenticated, data-dense operator workflows. Astro 6 serves product-first storefront pages with progressive enhancement. UI route hiding is never treated as authorization.

## DEC-005 — Native Web Component Form Runtime

**Status:** Accepted
**Decision:** `dotads-form` remains a native Shadow DOM custom element with the permanent `full`, `hybrid`, `middle`, and `mini` presets. It submits identifiers and customer choices; the server derives commerce authority.

## DEC-006 — Integer Rupiah

**Status:** Accepted
**Decision:** all internal IDR monetary integers represent rupiah, not one-hundredth subunits. Formatting uses `Intl.NumberFormat("id-ID", { currency: "IDR" })`. Any provider with a different unit converts exactly once inside its adapter and leaves a contract test.
**Reason:** Rupiah operational displays use exponent 0; the previous `*Minor` terminology created a 100× ambiguity.
**Migration note:** legacy column names may retain `Minor` until a reviewed schema migration; semantics are integer rupiah.

## DEC-007 — Transactional Outbox and Server-Authoritative Conversions

**Status:** Accepted; provider delivery incomplete
**Decision:** deterministic event IDs and a transactional outbox coordinate Meta, Google, and TikTok signals. Prepaid Purchase follows verified payment; COD Purchase follows the verified delivered/cash policy event. Missing adapters fail/retry and never claim delivery.

## DEC-008 — Provider Webhooks and Reconciliation

**Status:** Accepted
**Decision:** Mengantar and AutoLaris callbacks require authentication, idempotent compare-and-set reconciliation, and durable event/audit evidence. Synthetic waybills and client-side success simulation are forbidden.

## DEC-009 — Docker Clean-Database Verification

**Status:** Accepted
**Decision:** `pnpm test:clean-db` uses an isolated PostgreSQL 16 tmpfs container on an ephemeral port and removes it automatically. It must not reuse or delete persistent developer data.

## DEC-010 — Documentation Ownership

**Status:** Accepted
**Decision:** root Markdown files are canonical. Existing `docs/` copies are byte-identical compatibility mirrors where retained. Historical audit reports carry a superseded banner and never define current release truth. `STATUS.md` owns current state; `BUILD-LOG.md` owns executed evidence; `RELEASE.md` owns go/no-go.

## DEC-011 — Deployment Target Is Not Deployment Evidence

**Status:** Accepted
**Decision:** Coolify/Docker is the maintained target. A Compose file or green image build is not proof of production readiness. Remote migrations, provider calls, and production deployment require separate approval and revision-level evidence.
