# DotAds Engine v2 — Specification Pack Index

**Total files:** 18 (including this index)
**Total requirements:** 87 (PRD.md) → 87 tasks (TASKS.md), 1:1 traceability
**Last updated:** 2026-08-14

## Canonical Read Order

1. **`README.md`** — Repository overview, architecture diagram, quick start, and file inventory.
2. **`PRD.md`** — Product Requirements Document: 87 EARS-style requirements across System/Auth (10), Admin (15), Builder (15), Storefront (10), Order/Logistics (15), Payment (10), and Tracking (12) domains.
3. **`PLAN.md`** — Architecture Plan: Hono + PostgreSQL + Drizzle + better-auth + Astro 5 + Next.js 15 topology, Docker Compose local dev, and Coolify VPS self-hosting.
4. **`ADR.md`** — Architecture Decision Records: ADR-001 (PostgreSQL + Drizzle) through ADR-011 (Local Docker Compose & Coolify VPS).
5. **`UI-UX-DESIGN-SYSTEM.md`** — Design System: Visual tokens, DotAds Fisik IA grouping, shadcn/ui component library, Recharts analytics, responsive UX matrix (desktop/tablet/mobile webview).
6. **`SUPER_ADMIN_ARCHITECTURE.md`** — Super Admin Workspace: Platform analytics, tenant management, billing, impersonation, and domain health.
7. **`MENGANTAR_INTEGRATION_SPEC.md`** — Logistics Integration: Mengantar 3PL API, fast Kecamatan cache (`mengantar_locations` GIN Trigram index <15ms), Bun sequential dispatch queue, RTS risk engine, COD remittance, and custom shipping fee adjustments.
8. **`TRACKING_SPECS.md`** — Multi-Platform Signal Engine: Meta Pixel/CAPI (EMQ 8.5–9.5+), Google Ads Enhanced Conversions/Consent Mode v2 (REQ-TRK-011), TikTok Events API v2 (REQ-TRK-012), shared `outbox_events` transactional outbox with `unique(tenant_id, platform, event_id)` deduplication, and deterministic event-ID generation.
9. **`STOREFRONT-HEADLESS-SDK.md`** — Headless Storefront SDK: Turnkey API contract, draft-lead protocol, ad attribution (Meta `_fbp`/`_fbc`, Google `gclid`/`gbraid`/`wbraid`, TikTok `ttclid`), and integration guide for custom frontends.
10. **`FORM_ENGINE_PRESETS_SPEC.md`** — Preset Form Engine & Shadow DOM Specification: Full (1-Step COD), Hybrid (2-Step Progressive), Middle (Compact 1.5-Step), and Mini (2-Input WA Lead) UI/UX, logic flow, draft lead capture, and attribution signals.
11. **`openapi.yaml`** — OpenAPI 3.1 REST API Contract: All public and admin endpoints.
12. **`TASKS.md`** — Implementation Graph: 87 tasks in 7 phases with dependency edges, runnable `Done when` verification gates, and requirement-to-task traceability table.
13. **`DEVELOPMENT.md`** — OMP Development Rules: Parallel execution phases, Docker/Coolify deployment verification, and workspace conventions.
14. **`AGENTS.md`** — AI Agent Guidance: Role profile, safety boundaries, multi-platform architecture awareness, and repository conventions.
15. **`STATUS.md`** — Project Milestones: Specification and implementation phase tracking.
16. **`BUILD-LOG.md`** — Audit Log: Chronological verification entries and cross-validation results.
17. **`HISTORY.md`** — Refactoring History: CMSAds v1.0 → DotAds v2 rebrand, architecture shift, and multi-platform signal engine evolution.

## External CLI References

This optional reference bundle is separate from the core specification-pack count
and does not add application requirements or completed implementation claims.

- [Bahasa Indonesia operator guide](references/dotads-meta/GUIDE.id.md): daily
  usage, AI prompts, tutorials, device handoffs and troubleshooting for humans.
- [English AI terminal contract](references/dotads-meta/references/terminal-control.md):
  task-specific context, execution boundaries, evidence and operator handoffs.
- [Meta Ads CLI skill entrypoint](references/dotads-meta/SKILL.md): choose the
  relevant account/market/API guidance without preloading every reference.
- [Account workspace and existing-device guide](references/dotads-meta/references/account-workspace-guide.md):
  reviewed Documents layout, adoption rules, reporting and media-recovery design.
- [Guide review evidence](references/dotads-meta/references/account-workspace-guide.review.json):
  hash-bound design reviews and pending implementation/live verification gates.
- [Mirror manifest](references/dotads-meta/mirror.json): canonical source and
  hashes for the full mirrored skill/reference bundle.

## Cross-Reference Matrix

| Domain | Requirements | Tasks | Detail Spec |
|---|---|---|---|
| System, Auth, Tenancy | REQ-SYS-001–010 | T-001–T-009, T-083 | PLAN.md, ADR.md |
| Admin & Workspaces | REQ-ADM-001–015 | T-010–T-024 | SUPER_ADMIN_ARCHITECTURE.md, UI-UX-DESIGN-SYSTEM.md |
| Builders | REQ-BLD-001–015 | T-025–T-039 | UI-UX-DESIGN-SYSTEM.md |
| Storefront & Forms | REQ-STF-001–010 | T-040–T-050, T-084 | STOREFRONT-HEADLESS-SDK.md, FORM_ENGINE_PRESETS_SPEC.md |
| Orders & Logistics | REQ-ORD-001–015 | T-043–T-044, T-054–T-066 | MENGANTAR_INTEGRATION_SPEC.md |
| Payments | REQ-PAY-001–010 | T-067–T-076 | PLAN.md |
| Tracking & Signals | REQ-TRK-001–012 | T-051–T-053, T-077–T-082, T-085–T-087 | TRACKING_SPECS.md |
