# DotAds Engine v2 — PRD

## Product Vision
DotAds Engine v2 is a multi-tenant direct-response commerce operating system for Indonesian sellers and agencies. It combines a high-conversion storefront and embeddable order form, a tenant admin OMS, a platform super admin workspace, and a headless OpenAPI backend.

## Product Goals
1. Replace DotAds 1.0 infra complexity with pooled PostgreSQL multi-tenancy.
2. Preserve proven DotAds menus and form UX while upgrading architecture.
3. Keep the four canonical form presets: `full`, `hybrid`, `middle`, and `mini` — including Hybrid Draft Lead capture and Mini WhatsApp lead redirect.
4. Support Mengantar logistics, AutoLaris payments, and multi-ad-platform signal integrity (Meta Pixel/CAPI, Google Ads Enhanced Conversions/Consent Mode v2, TikTok Events API v2).
5. Provide a Headless Storefront SDK and public REST API for custom frontend integrations.
6. Deploy via Docker Compose locally and Coolify VPS self-hosting in production.
7. Stay executable by OMP multi-model terminal orchestration.

## Roles
- **Super Admin** — platform operator.
- **Tenant Owner** — merchant owner with domain, team, billing, and integration control.
- **Admin** — broad tenant operator.
- **Advertiser** — builder, products, and ads/tracking operator.
- **Customer Service** — order, shipping, WA/ongkir, and customer follow-up operator.
- **End Buyer** — public shopper.

## Information Architecture Baseline
Tenant admin preserves DotAds Fisik grouping: Commerce, Operations, Growth, Finance & System, Profile. Super Admin owns a separate workspace. Mobile, tablet, and desktop are all first-class surfaces.

## System, Auth, Tenancy, Domains
- **REQ-SYS-001 — Establish the tenant-isolated PostgreSQL foundation**: When the relevant actor or runtime invokes this capability, the system SHALL establish the tenant-isolated PostgreSQL foundation.
- **REQ-SYS-002 — Implement transactional tenant provisioning and deterministic seed data**: When the relevant actor or runtime invokes this capability, the system SHALL implement transactional tenant provisioning and deterministic seed data.
- **REQ-SYS-003 — Bootstrap the Hono OpenAPI API and better-auth integration**: When the relevant actor or runtime invokes this capability, the system SHALL bootstrap the Hono OpenAPI API and better-auth integration.
- **REQ-SYS-004 — Enforce the six-role authorization policy**: When the relevant actor or runtime invokes this capability, the system SHALL enforce the six-role authorization policy.
- **REQ-SYS-005 — Implement organization membership and invitation lifecycle**: When the relevant actor or runtime invokes this capability, the system SHALL implement organization membership and invitation lifecycle.
- **REQ-SYS-006 — Resolve verified custom domains to tenants**: When the relevant actor or runtime invokes this capability, the system SHALL resolve verified custom domains to tenants.
- **REQ-SYS-007 — Enforce tenant- and route-aware API rate limits**: When the relevant actor or runtime invokes this capability, the system SHALL enforce tenant- and route-aware API rate limits.
- **REQ-SYS-008 — Persist immutable actor-aware audit logs**: When the relevant actor or runtime invokes this capability, the system SHALL persist immutable actor-aware audit logs.
- **REQ-SYS-009 — Expose validated tenant-scoped configuration**: When the relevant actor or runtime invokes this capability, the system SHALL expose validated tenant-scoped configuration.
- **REQ-SYS-010 — Harden session and token lifecycle**: When the relevant actor or runtime invokes this capability, the system SHALL harden session and token lifecycle.

## Admin and Workspace Requirements
- **REQ-ADM-001 — Build the Super Admin tenant management workspace**: When the relevant actor or runtime invokes this capability, the system SHALL build the Super Admin tenant management workspace.
- **REQ-ADM-002 — Implement subscription and billing administration**: When the relevant actor or runtime invokes this capability, the system SHALL implement subscription and billing administration.
- **REQ-ADM-003 — Build the global analytics dashboard**: When the relevant actor or runtime invokes this capability, the system SHALL build the global analytics dashboard.
- **REQ-ADM-004 — Implement Super Admin system settings**: When the relevant actor or runtime invokes this capability, the system SHALL implement Super Admin system settings.
- **REQ-ADM-005 — Implement scoped, auditable tenant impersonation**: When the relevant actor or runtime invokes this capability, the system SHALL implement scoped, auditable tenant impersonation.
- **REQ-ADM-006 — Implement tenant product catalog CRUD**: When the relevant actor or runtime invokes this capability, the system SHALL implement tenant product catalog CRUD.
- **REQ-ADM-007 — Implement product variants and exact pricing**: When the relevant actor or runtime invokes this capability, the system SHALL implement product variants and exact pricing.
- **REQ-ADM-008 — Implement tenant media asset management**: When the relevant actor or runtime invokes this capability, the system SHALL implement tenant media asset management.
- **REQ-ADM-009 — Build the order management dashboard**: When the relevant actor or runtime invokes this capability, the system SHALL build the order management dashboard.
- **REQ-ADM-010 — Enforce order status transitions in the admin**: When the relevant actor or runtime invokes this capability, the system SHALL enforce order status transitions in the admin.
- **REQ-ADM-011 — Build order detail and immutable timeline**: When the relevant actor or runtime invokes this capability, the system SHALL build order detail and immutable timeline.
- **REQ-ADM-012 — Implement safe bulk order actions**: When the relevant actor or runtime invokes this capability, the system SHALL implement safe bulk order actions.
- **REQ-ADM-013 — Build tenant customer and lead management**: When the relevant actor or runtime invokes this capability, the system SHALL build tenant customer and lead management.
- **REQ-ADM-014 — Implement tenant branding and operational settings UI**: When the relevant actor or runtime invokes this capability, the system SHALL implement tenant branding and operational settings UI.
- **REQ-ADM-015 — Build team and role management**: When the relevant actor or runtime invokes this capability, the system SHALL build team and role management.

## Builder Requirements
- **REQ-BLD-001 — Build the form drag-and-drop editor**: When the relevant actor or runtime invokes this capability, the system SHALL build the form drag-and-drop editor.
- **REQ-BLD-002 — Implement the Form Schema v1 field library**: When the relevant actor or runtime invokes this capability, the system SHALL implement the Form Schema v1 field library.
- **REQ-BLD-003 — Implement schema-driven validation rules**: When the relevant actor or runtime invokes this capability, the system SHALL implement schema-driven validation rules.
- **REQ-BLD-004 — Implement declarative conditional form logic**: When the relevant actor or runtime invokes this capability, the system SHALL implement declarative conditional form logic.
- **REQ-BLD-005 — Version and export canonical Form Schema v1 JSON**: When the relevant actor or runtime invokes this capability, the system SHALL version and export canonical Form Schema v1 JSON.
- **REQ-BLD-006 — Build responsive form preview modes**: When the relevant actor or runtime invokes this capability, the system SHALL build responsive form preview modes.
- **REQ-BLD-007 — Add safe form styling and custom CSS**: When the relevant actor or runtime invokes this capability, the system SHALL add safe form styling and custom CSS.
- **REQ-BLD-008 — Build the landing-page drag-and-drop section editor**: When the relevant actor or runtime invokes this capability, the system SHALL build the landing-page drag-and-drop section editor.
- **REQ-BLD-009 — Implement the landing-page section library**: When the relevant actor or runtime invokes this capability, the system SHALL implement the landing-page section library.
- **REQ-BLD-010 — Bind landing pages to tenant products and variants**: When the relevant actor or runtime invokes this capability, the system SHALL bind landing pages to tenant products and variants.
- **REQ-BLD-011 — Add landing-page theme tokens and safe custom CSS**: When the relevant actor or runtime invokes this capability, the system SHALL add landing-page theme tokens and safe custom CSS.
- **REQ-BLD-012 — Build responsive LP preview and device modes**: When the relevant actor or runtime invokes this capability, the system SHALL build responsive LP preview and device modes.
- **REQ-BLD-013 — Implement landing-page SEO and social metadata**: When the relevant actor or runtime invokes this capability, the system SHALL implement landing-page SEO and social metadata.
- **REQ-BLD-014 — Implement validated landing-page publication workflow**: When the relevant actor or runtime invokes this capability, the system SHALL implement validated landing-page publication workflow.
- **REQ-BLD-015 — Implement immutable landing-page version history**: When the relevant actor or runtime invokes this capability, the system SHALL implement immutable landing-page version history.

## Storefront and Embedded Form Requirements
- **REQ-STF-001 — Build the Astro tenant storefront and LP renderer**: When the relevant actor or runtime invokes this capability, the system SHALL build the Astro tenant storefront and LP renderer.
- **REQ-STF-002 — Guarantee zero-hydration initial landing-page content**: When the relevant actor or runtime invokes this capability, the system SHALL guarantee zero-hydration initial landing-page content.
- **REQ-STF-003 — Implement the native dotads-form.js Web Component**: When the relevant actor or runtime invokes this capability, the system SHALL implement the native dotads-form.js Web Component.
- **REQ-STF-004 — Submit native forms to the public order API**: When the relevant actor or runtime invokes this capability, the system SHALL submit native forms to the public order API.
- **REQ-STF-005 — Implement district-level address autocomplete**: When the relevant actor or runtime invokes this capability, the system SHALL implement district-level address autocomplete.
- **REQ-STF-006 — Resolve and select valid dynamic shipping rates**: When the relevant actor or runtime invokes this capability, the system SHALL resolve and select valid dynamic shipping rates.
- **REQ-STF-007 — Render the thank-you page without false Purchase events**: When the relevant actor or runtime invokes this capability, the system SHALL render the thank-you page without false Purchase events.
- **REQ-STF-008 — Deploy verified custom domains with SSL-safe routing**: When the relevant actor or runtime invokes this capability, the system SHALL deploy verified custom domains with SSL-safe routing.
- **REQ-STF-009 — Support multiple products on one landing page**: When the relevant actor or runtime invokes this capability, the system SHALL support multiple products on one landing page.
- **REQ-STF-010 — Enforce performance budgets and deploy all production surfaces**: When the relevant actor or runtime invokes this capability, the system SHALL enforce performance budgets and deploy all production surfaces.

## Order and Logistics Requirements
- **REQ-ORD-001 — Implement the authoritative order lifecycle state machine**: When the relevant actor or runtime invokes this capability, the system SHALL implement the authoritative order lifecycle state machine.
- **REQ-ORD-002 — Create orders atomically from validated public form submissions**: When the relevant actor or runtime invokes this capability, the system SHALL create orders atomically from validated public form submissions.
- **REQ-ORD-003 — Implement the order confirmation workflow**: When the relevant actor or runtime invokes this capability, the system SHALL implement the order confirmation workflow.
- **REQ-ORD-004 — Synchronize order state from payment state**: When the relevant actor or runtime invokes this capability, the system SHALL synchronize order state from payment state.
- **REQ-ORD-005 — Integrate Mengantar expedition eligibility and rates**: When the relevant actor or runtime invokes this capability, the system SHALL integrate Mengantar expedition eligibility and rates.
- **REQ-ORD-006 — Serialize Mengantar dispatch through a durable queue**: When the relevant actor or runtime invokes this capability, the system SHALL serialize Mengantar dispatch through a durable queue.
- **REQ-ORD-007 — Persist waybills and expose tracking/label actions**: When the relevant actor or runtime invokes this capability, the system SHALL persist waybills and expose tracking/label actions.
- **REQ-ORD-008 — Verify and apply Mengantar webhooks**: When the relevant actor or runtime invokes this capability, the system SHALL verify and apply Mengantar webhooks.
- **REQ-ORD-009 — Track Mengantar COD remittance and reconciliation**: When the relevant actor or runtime invokes this capability, the system SHALL track Mengantar COD remittance and reconciliation.
- **REQ-ORD-010 — Handle RTS and returned orders explicitly**: When the relevant actor or runtime invokes this capability, the system SHALL handle RTS and returned orders explicitly.
- **REQ-ORD-011 — Calculate receiver RTS risk before COD confirmation**: When the relevant actor or runtime invokes this capability, the system SHALL calculate receiver RTS risk before COD confirmation.
- **REQ-ORD-012 — Cache and refresh Mengantar district resolution**: When the relevant actor or runtime invokes this capability, the system SHALL cache and refresh Mengantar district resolution.
- **REQ-ORD-013 — Export tenant order reports safely**: When the relevant actor or runtime invokes this capability, the system SHALL export tenant order reports safely.
- **REQ-ORD-014 — Implement internal order notes and mentions**: When the relevant actor or runtime invokes this capability, the system SHALL implement internal order notes and mentions.
- **REQ-ORD-015 — Expire stale eligible orders automatically**: When the relevant actor or runtime invokes this capability, the system SHALL expire stale eligible orders automatically.

## Payment Requirements
- **REQ-PAY-001 — Create idempotent AutoLaris payment sessions**: When the relevant actor or runtime invokes this capability, the system SHALL create idempotent AutoLaris payment sessions.
- **REQ-PAY-002 — Implement the AutoLaris QRIS flow**: When the relevant actor or runtime invokes this capability, the system SHALL implement the AutoLaris QRIS flow.
- **REQ-PAY-003 — Implement the AutoLaris virtual-account flow**: When the relevant actor or runtime invokes this capability, the system SHALL implement the AutoLaris virtual-account flow.
- **REQ-PAY-004 — Verify AutoLaris webhook authenticity and replay safety**: When the relevant actor or runtime invokes this capability, the system SHALL verify AutoLaris webhook authenticity and replay safety.
- **REQ-PAY-005 — Reconcile payment transactions with AutoLaris**: When the relevant actor or runtime invokes this capability, the system SHALL reconcile payment transactions with AutoLaris.
- **REQ-PAY-006 — Implement the direct COD order flow**: When the relevant actor or runtime invokes this capability, the system SHALL implement the direct COD order flow.
- **REQ-PAY-007 — Validate COD availability server-side**: When the relevant actor or runtime invokes this capability, the system SHALL validate COD availability server-side.
- **REQ-PAY-008 — Render only currently eligible payment methods**: When the relevant actor or runtime invokes this capability, the system SHALL render only currently eligible payment methods.
- **REQ-PAY-009 — Implement refund and payment cancellation handling**: When the relevant actor or runtime invokes this capability, the system SHALL implement refund and payment cancellation handling.
- **REQ-PAY-010 — Implement the tenant financial ledger and settlement views**: When the relevant actor or runtime invokes this capability, the system SHALL implement the tenant financial ledger and settlement views.

## Tracking Requirements
- **REQ-TRK-001 — Integrate tenant-configured Meta Pixel browser events**: When the relevant actor or runtime invokes this capability, the system SHALL integrate tenant-configured Meta Pixel browser events.
- **REQ-TRK-002 — Send server-authoritative events to Meta CAPI**: When the relevant actor or runtime invokes this capability, the system SHALL send server-authoritative events to Meta CAPI.
- **REQ-TRK-003 — Generate deterministic browser/server event IDs**: When the relevant actor or runtime invokes this capability, the system SHALL generate deterministic browser/server event IDs.
- **REQ-TRK-004 — Preserve first-party _fbp and _fbc attribution values**: When the relevant actor or runtime invokes this capability, the system SHALL preserve first-party _fbp and _fbc attribution values.
- **REQ-TRK-005 — Normalize and SHA-256 hash ad-platform matching data**: When the relevant actor or runtime invokes this capability, the system SHALL normalize and SHA-256 hash ad-platform matching data.
- **REQ-TRK-006 — Deliver conversion events through a multi-platform transactional outbox**: When the relevant actor or runtime invokes this capability, the system SHALL deliver conversion events through a multi-platform transactional outbox (`outbox_events` with `platform`, `destination_id`, and `unique(tenant_id, platform, event_id)`).
- **REQ-TRK-007 — Implement the COD Meta signal taxonomy**: When the relevant actor or runtime invokes this capability, the system SHALL implement the COD Meta signal taxonomy.
- **REQ-TRK-008 — Implement the prepaid Meta signal taxonomy**: When the relevant actor or runtime invokes this capability, the system SHALL implement the prepaid Meta signal taxonomy.
- **REQ-TRK-009 — Maximize Meta Event Match Quality safely**: When the relevant actor or runtime invokes this capability, the system SHALL maximize Meta Event Match Quality safely.
- **REQ-TRK-010 — Provide end-to-end multi-platform diagnostics and release smoke coverage**: When the relevant actor or runtime invokes this capability, the system SHALL provide end-to-end multi-platform diagnostics and release smoke coverage.
- **REQ-TRK-011 — Implement Google Ads Enhanced Conversions and Consent Mode v2**: When the relevant actor or runtime invokes this capability, the system SHALL implement Google Ads Enhanced Conversions with SHA-256 hashed user data, Consent Mode v2 with consent-default deny-all, `gclid`/`gbraid`/`wbraid` click-ID preservation, server-side offline conversion upload via Google Ads API, and Google Product Category auto-selection with GTIN/EAN validation for Merchant Center catalog feeds.
- **REQ-TRK-012 — Implement TikTok Events API v2 with Advanced Matching**: When the relevant actor or runtime invokes this capability, the system SHALL implement TikTok Pixel initialization, `ttclid` click-ID capture and persistence, SHA-256 Advanced Matching (email, phone), server-side Events API v2 delivery from `outbox_events`, COD vs. prepaid `CompletePayment` signal taxonomy, and VBO-ready value/currency reporting.

## Acceptance Themes
1. The admin UX must be complete on desktop, tablet, and mobile webview.
2. Seller self-service domain management must be native.
3. Embedded forms must stay lightweight, pixel-aware, and visually precise with bank logos.
4. Cross-tenant leakage is a release blocker.
5. Multi-ad-platform signal integrity: Meta CAPI, Google Ads Enhanced Conversions, and TikTok Events API v2 must all fire correct deduplication-safe events through the shared `outbox_events` table.
6. Headless SDK consumers can build custom storefronts against the public REST API without internal knowledge.
7. Docker Compose local dev and Coolify VPS self-hosting must both work from a clean checkout.
8. OMP can execute implementation in parallel from this spec set without inventing new contracts.

## Traceability
`TASKS.md` is the implementation graph and leaves one runnable gate per requirement (87 requirements → 87 tasks, 1:1). `PLAN.md`, `ADR.md`, `openapi.yaml`, `UI-UX-DESIGN-SYSTEM.md`, `SUPER_ADMIN_ARCHITECTURE.md`, `MENGANTAR_INTEGRATION_SPEC.md`, `TRACKING_SPECS.md`, `STOREFRONT-HEADLESS-SDK.md`, and `FORM_ENGINE_PRESETS_SPEC.md` own the detailed behavior for their domains. `INDEX.md` provides the canonical read order for the full specification pack.
