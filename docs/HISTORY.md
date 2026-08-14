# DotAds Engine v2 — Refactoring & Decision History

## 2026-08-14 — Rebrand & Architectural Shift (CMSAds v1.0 → DotAds Engine v2)

- **Problem in v1.0:** CMSAds v1.0 relied on a per-tenant Cloudflare Worker + D1 database fleet. As tenant count grew, managing migrations, secrets, and preview environments across hundreds of isolated Workers became unmaintainable.
- **Refactoring Decision:** Re-architected into **DotAds Engine v2** — one unified hybrid monorepo with one pooled PostgreSQL database using strict row-level `tenant_id` isolation.
- **Form Preset Standardization:** Presets `full`, `hybrid`, `middle`, and `mini` were locked as permanent core runtime contracts, including Hybrid Draft Lead capture and Mini WhatsApp lead redirect.
- **Embed Engine Upgrade:** Replaced iframe widget embeds with native Web Component `dotads-form.js` using Shadow DOM to eliminate iframe loading lag and layout jumps.
- **Branding:** Official product brand established as **DotAds** (*The Direct-Response Commerce OS*), with spec folder consolidated at `/home/ongki/Documents/work/prd/dotads/`. Package scope changed from `@cmsads/*` to `@dotads/*`.

## 2026-08-14 — Multi-Platform Signal Engine Evolution (Meta-only → Meta + Google + TikTok)

- **Problem:** The original TRACKING_SPECS.md and PRD tracking requirements (REQ-TRK-001–010) covered only Meta Pixel/CAPI. PLAN.md §10 and STOREFRONT-HEADLESS-SDK.md already promised Google Ads and TikTok Ads support, creating an untraced gap.
- **Resolution:** Added REQ-TRK-011 (Google Ads Enhanced Conversions + Consent Mode v2) and REQ-TRK-012 (TikTok Events API v2) to PRD.md, with corresponding tasks T-086 and T-087 in TASKS.md. Total requirement count: 85 → 87.
- **Outbox Table Rename:** Renamed `capi_event_outbox` to `outbox_events` since the table carries signals for all three ad platforms, not just Meta CAPI.
- **Schema Fix:** Changed unique constraint from `unique(tenant_id, event_id)` to `unique(tenant_id, platform, event_id)`. The old constraint silently dropped Google and TikTok rows because the same `event_id` (e.g., `purchase:ORD_9901`) is deliberately reused across platforms for browser-vs-server deduplication.
- **Column Changes:** Replaced Meta-only `pixel_id` column with platform-agnostic `destination_id` (pixel ID, conversion action ID, or TikTok pixel code) and added `platform` enum column (`'meta'|'google'|'tiktok'`).

## 2026-08-14 — Headless Storefront SDK & Docker/Coolify Deployment

- **Headless SDK:** Added `STOREFRONT-HEADLESS-SDK.md` defining the turnkey API contract for custom frontends (Next.js, Remix, SvelteKit, Astro, Nuxt, mobile apps) connecting to DotAds Engine v2 via public REST API.
- **Docker & Coolify:** Formalized `docker-compose.yml` for local development (PostgreSQL 16) and `docker-compose.coolify.yml` for one-click VPS self-hosting via Coolify with multi-stage Dockerfiles, Traefik reverse proxy, and automated SSL.
