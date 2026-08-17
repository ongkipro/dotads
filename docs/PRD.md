# DotAds Engine v2 — Product Requirements

**Canonical owner:** This root document owns product requirements. The byte-identical `docs/PRD.md` file is a compatibility mirror, not an independent source.

## Evidence Semantics

- **Observed** means verified against the current repository or recorded executable evidence.
- **Target** means required behavior that is not thereby claimed implemented.
- **Unknown** means a decision or external fact still requires authoritative evidence.
- Every requirement below is **Target** unless `STATUS.md` and `BUILD-LOG.md` record it as Observed on a specific revision. This PRD never serves as implementation or release evidence.

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

## Merchant Workspace Product Contract

### Operational frame

- **Tenant Owner:** governs the store, monitors business health, resolves exceptions, configures providers, and manages access.
- **Admin:** runs daily commerce operations and store configuration without owner-only billing, provider-secret, ownership, or domain-authority actions.
- **Advertiser:** maintains products for campaign use, builds landing pages/forms, and operates ad measurement. It does not receive order, finance, member, or provider-secret access.
- **Customer Service:** triages orders, validates shipment/customer information, and follows fulfilment progress. It receives read-only product context and no builder, finance, membership, or provider-secret access.

The workspace SHALL be task-first rather than a flat list of features. Its target UI groups are **Ringkasan**, **Operasional**, **Konten & Iklan**, **Keuangan**, and **Pengaturan**. Super Admin remains a separate platform workspace. End Buyer never enters the CMS shell.

### Target merchant menu

| Group | Destination | Primary job | Visibility |
| :--- | :--- | :--- | :--- |
| Ringkasan | Ringkasan | Identify current priorities and enter the relevant work queue | Owner, Admin, Customer Service; Advertiser only after an advertiser-specific dashboard exists |
| Operasional | Pesanan | Triage, inspect, transition, and dispatch orders | Owner, Admin, Customer Service |
| Operasional | Produk | Maintain or inspect the sellable catalog | Owner/Admin edit; Advertiser/Customer Service read-only |
| Operasional | Pengiriman | Check rates, dispatch eligibility, waybill, tracking, and shipment exceptions without exposing provider credentials | Owner, Admin, Customer Service |
| Konten & Iklan | Landing Page | List, edit, preview, version, validate, and publish persisted landing pages | Owner, Admin, Advertiser |
| Konten & Iklan | Form Pesanan | List, edit, preview, version, validate, and publish persisted order forms | Owner, Admin, Advertiser |
| Konten & Iklan | Tracking Iklan | Configure authorized ad destinations and inspect real delivery diagnostics | Owner, Admin, Advertiser |
| Keuangan | Rekonsiliasi | Review real payment, COD remittance, fees, discrepancies, and export parity | Owner; Admin only when a specific finance permission is accepted |
| Pengaturan | Toko | Maintain tenant identity and operational defaults | Owner, Admin |
| Pengaturan | Lokasi & Gudang | Maintain warehouses and shipment origins | Owner, Admin |
| Pengaturan | Integrasi | Configure Mengantar and AutoLaris credentials/channels with secret-safe states | Owner only unless a narrower permission is accepted |
| Pengaturan | Pesan WhatsApp | Maintain governed WhatsApp templates independently of rate lookup | Owner, Admin |
| Pengaturan | Tim | Invite and govern members | Owner edit; Admin read-only |
| Pengaturan | Domain | Maintain and verify tenant domains | Owner only unless domain authority is explicitly delegated |
| Pengaturan | Log Aktivitas | Inspect real tenant audit evidence | Owner, Admin |

Account profile, workspace switching, and sign-out belong in the account/workspace control, not in the primary merchant menu. Search SHALL appear only when it queries implemented tenant-scoped resources. A menu destination SHALL be hidden until its primary job is backed by a real authorized workflow; a route may instead expose an explicit unavailable state for direct bookmarks, but SHALL NOT simulate success.

### Menu removals and consolidations

- Remove **Profile Account** from the sidebar and place account actions in the authenticated account control.
- Remove the non-functional global search affordance until tenant-scoped search exists.
- Replace **Mengantar Expedition** in Customer Service navigation with credential-free **Shipments** operations.
- Move **AutoLaris Settings** and Mengantar credentials out of daily operations into owner-only **Integrations** settings.
- Split **Shipping Check & WhatsApp** into **Shipments** and **Messaging** because they are different jobs, permissions, states, and audit boundaries.
- Keep synthetic/local-only reconciliation, tracking, builder, store, warehouse, messaging, domain, audit, integration, and profile demonstrations out of production navigation until their real persistence and failure states are implemented.

### Role/action matrix

| Capability | Tenant Owner | Admin | Advertiser | Customer Service |
| :--- | :---: | :---: | :---: | :---: |
| Operational dashboard | Manage | Manage | Hidden until role-specific | View operational subset |
| Orders and dispatch | Manage | Manage | None | Manage bounded workflow |
| Catalog | Manage | Manage | View | View |
| Landing pages, forms, tracking | Manage | Manage | Manage | None |
| Shipments | Manage | Manage | None | Manage without configuration secrets |
| Reconciliation | Manage | None until granted | None | None |
| Store, locations, messaging | Manage | Manage | None | None |
| Provider integrations and domains | Manage | None until granted | None | None |
| Team | Manage | View | None | None |
| Activity log | View | View | None | None |

Every screen SHALL cover applicable initial loading, retained-data refresh, true empty, no-filter-result, read-only, validation, server failure, conflict, pending mutation, success, and retry states. Menu visibility is not authorization; direct routes and every backing API action remain server-enforced and tenant-scoped.

## System, Auth, Tenancy, Domains
- **REQ-SYS-001 — Establish the tenant-isolated PostgreSQL foundation** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL establish the tenant-isolated PostgreSQL foundation.
- **REQ-SYS-002 — Implement transactional tenant provisioning and deterministic seed data** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement transactional tenant provisioning and deterministic seed data.
- **REQ-SYS-003 — Bootstrap the Hono OpenAPI API and better-auth integration** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL bootstrap the Hono OpenAPI API and better-auth integration.
- **REQ-SYS-004 — Enforce the six-role authorization policy** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL enforce the six-role authorization policy.
- **REQ-SYS-005 — Implement organization membership and invitation lifecycle** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement organization membership and invitation lifecycle.
- **REQ-SYS-006 — Resolve verified custom domains to tenants** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL resolve verified custom domains to tenants.
- **REQ-SYS-007 — Enforce tenant- and route-aware API rate limits** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL enforce tenant- and route-aware API rate limits.
- **REQ-SYS-008 — Persist immutable actor-aware audit logs** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL persist immutable actor-aware audit logs.
- **REQ-SYS-009 — Expose validated tenant-scoped configuration** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL expose validated tenant-scoped configuration.
- **REQ-SYS-010 — Harden session and token lifecycle** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL harden session and token lifecycle.

## Admin and Workspace Requirements
- **REQ-ADM-001 — Build the Super Admin tenant management workspace** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL build the Super Admin tenant management workspace.
- **REQ-ADM-002 — Implement subscription and billing administration** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement subscription and billing administration.
- **REQ-ADM-003 — Build the global analytics dashboard** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL build the global analytics dashboard.
- **REQ-ADM-004 — Implement Super Admin system settings** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement Super Admin system settings.
- **REQ-ADM-005 — Implement scoped, auditable tenant impersonation** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement scoped, auditable tenant impersonation.
- **REQ-ADM-006 — Implement tenant product catalog CRUD** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement tenant product catalog CRUD.
- **REQ-ADM-007 — Implement product variants and exact pricing** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement product variants and exact pricing.
- **REQ-ADM-008 — Implement tenant media asset management** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement tenant media asset management.
- **REQ-ADM-009 — Build the order management dashboard** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL build the order management dashboard.
- **REQ-ADM-010 — Enforce order status transitions in the admin** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL enforce order status transitions in the admin.
- **REQ-ADM-011 — Build order detail and immutable timeline** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL build order detail and immutable timeline.
- **REQ-ADM-012 — Implement safe bulk order actions** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement safe bulk order actions.
- **REQ-ADM-013 — Build tenant customer and lead management** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL build tenant customer and lead management.
- **REQ-ADM-014 — Implement tenant branding and operational settings UI** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement tenant branding and operational settings UI.
- **REQ-ADM-015 — Build team and role management** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL build team and role management.
- **REQ-ADM-016 — Provide task-first capability-backed merchant navigation** — **Status: Target.** When a tenant actor enters the CMS, the system SHALL show only the target merchant menu destinations authorized for that role and backed by an honest workflow, while direct routes remain server-authorized. Acceptance requires a generated route/menu/capability inventory with no dead links, orphan operational routes, Customer Service access to provider credentials, or role-visible action rejected by its backing permission contract.
- **REQ-ADM-017 — Provide role-specific operational dashboards** — **Status: Target.** When an authorized tenant actor opens their workspace landing page, the system SHALL present persisted, WIB-bounded priorities and deep links appropriate to that actor's job without fabricated KPIs or actions. Acceptance requires owner, admin, advertiser, and customer-service browser cases to render only supported data/actions or redirect to an implemented role landing page.
- **REQ-ADM-018 — Provide a recoverable merchant sign-in entry** — **Status: Target.** When a merchant submits valid credentials, the system SHALL establish the server session and route the actor to workspace selection or the authorized role landing page; invalid, stale, suspended, multi-workspace, invitation-return, and sign-out states SHALL preserve a clear recovery path without revealing account existence. Acceptance requires browser coverage for success, invalid credentials, pending submission, workspace selection, safe invitation return, suspended tenant denial, stale session recovery, and sign-out.
- **REQ-ADM-019 — Eliminate simulated merchant workflow success** — **Status: Target.** If a merchant surface lacks a persisted authorized operation, then the system SHALL hide its navigation entry or present an explicit unavailable/read-only state and SHALL NOT display seeded secrets, sample business records as live data, synthetic provider results, or local-only save success. Acceptance requires a repository and browser inventory proving every visible mutation persists after reload or fails honestly while preserving recoverable input.
- **REQ-ADM-020 — Separate account utilities from business navigation** — **Status: Target.** When an authenticated merchant uses account utilities, the system SHALL expose real workspace switching, profile/security operations, and sign-out from one account control, while global search SHALL remain absent until it returns authorized tenant-scoped results. Acceptance requires keyboard and browser tests for the account control and either a real bounded search contract or absence of the search affordance.
- **REQ-ADM-021 — Deliver accessible responsive merchant workflows** — **Status: Target.** While the CMS is rendered at desktop, tablet, or mobile widths, the system SHALL preserve current location, reachable role-authorized navigation, readable dense data, visible focus, labelled controls, mutation feedback, and no horizontal page overflow. Acceptance requires browser validation for every tenant role at representative 1280, 768, and 390 pixel widths, including keyboard navigation and forced empty/error/read-only states.
- **REQ-ADM-022 — Separate daily fulfilment from provider configuration** — **Status: Target.** When a Customer Service or operations actor handles a shipment, the system SHALL expose credential-free rate, eligibility, dispatch, waybill, tracking, exception, and retry information, while provider secrets/channels SHALL remain in owner-authorized Integrations settings. Acceptance requires route/API tests proving operational roles cannot read or mutate provider secrets and can complete only their bounded shipment actions.
- **REQ-ADM-023 — Consolidate merchant settings by governed object** — **Status: Target.** When an authorized merchant manages Store, Locations, Integrations, Messaging, Team, Domains, or Activity Log, the system SHALL provide one persisted tenant-scoped source per governed object with permission-aware actions, destructive confirmation, audit evidence, and honest unavailable states. Acceptance requires same-tenant persistence/reload, cross-tenant denial, read-only role behavior, validation/conflict recovery, and audit assertions for every settings destination.
- **REQ-ADM-024 — Use unambiguous Indonesian merchant UI language** — **Status: Target.** When the merchant CMS presents navigation, headings, actions, states, validation, or recovery guidance, the system SHALL use Bahasa Indonesia (Indonesia, not Malay) with deliberate hybrid English only for widely understood technical/product terms that become less clear when translated, while preserving code identifiers, API fields, provider names, and status enums exactly. Acceptance requires a terminology scan and role/device browser review to find no Malay wording, ambiguous generic action labels, inconsistent synonyms for the same object/state, or translated technical identifiers.

## Builder Requirements
- **REQ-BLD-001 — Build the form drag-and-drop editor** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL build the form drag-and-drop editor.
- **REQ-BLD-002 — Implement the Form Schema v1 field library** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement the Form Schema v1 field library.
- **REQ-BLD-003 — Implement schema-driven validation rules** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement schema-driven validation rules.
- **REQ-BLD-004 — Implement declarative conditional form logic** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement declarative conditional form logic.
- **REQ-BLD-005 — Version and export canonical Form Schema v1 JSON** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL version and export canonical Form Schema v1 JSON.
- **REQ-BLD-006 — Build responsive form preview modes** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL build responsive form preview modes.
- **REQ-BLD-007 — Add safe form styling and custom CSS** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL add safe form styling and custom CSS.
- **REQ-BLD-008 — Build the landing-page drag-and-drop section editor** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL build the landing-page drag-and-drop section editor.
- **REQ-BLD-009 — Implement the landing-page section library** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement the landing-page section library.
- **REQ-BLD-010 — Bind landing pages to tenant products and variants** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL bind landing pages to tenant products and variants.
- **REQ-BLD-011 — Add landing-page theme tokens and safe custom CSS** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL add landing-page theme tokens and safe custom CSS.
- **REQ-BLD-012 — Build responsive LP preview and device modes** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL build responsive LP preview and device modes.
- **REQ-BLD-013 — Implement landing-page SEO and social metadata** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement landing-page SEO and social metadata.
- **REQ-BLD-014 — Implement validated landing-page publication workflow** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement validated landing-page publication workflow.
- **REQ-BLD-015 — Implement immutable landing-page version history** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement immutable landing-page version history.

## Storefront and Embedded Form Requirements
- **REQ-STF-001 — Build the Astro tenant storefront and LP renderer** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL build the Astro tenant storefront and LP renderer.
- **REQ-STF-002 — Guarantee zero-hydration initial landing-page content** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL guarantee zero-hydration initial landing-page content.
- **REQ-STF-003 — Implement the native dotads-form.js Web Component** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement the native dotads-form.js Web Component.
- **REQ-STF-004 — Submit native forms to the public order API** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL submit native forms to the public order API.
- **REQ-STF-005 — Implement district-level address autocomplete** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement district-level address autocomplete.
- **REQ-STF-006 — Resolve and select valid dynamic shipping rates** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL resolve and select valid dynamic shipping rates.
- **REQ-STF-007 — Render the thank-you page without false Purchase events** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL render the thank-you page without false Purchase events.
- **REQ-STF-008 — Deploy verified custom domains with SSL-safe routing** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL deploy verified custom domains with SSL-safe routing.
- **REQ-STF-009 — Support multiple products on one landing page** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL support multiple products on one landing page.
- **REQ-STF-010 — Enforce performance budgets and deploy all production surfaces** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL enforce performance budgets and deploy all production surfaces.

## Order and Logistics Requirements
- **REQ-ORD-001 — Implement the authoritative order lifecycle state machine** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement the authoritative order lifecycle state machine.
- **REQ-ORD-002 — Create orders atomically from validated public form submissions** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL create orders atomically from validated public form submissions.
- **REQ-ORD-003 — Implement the order confirmation workflow** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement the order confirmation workflow.
- **REQ-ORD-004 — Synchronize order state from payment state** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL synchronize order state from payment state.
- **REQ-ORD-005 — Integrate Mengantar expedition eligibility and rates** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL integrate Mengantar expedition eligibility and rates.
- **REQ-ORD-006 — Serialize Mengantar dispatch through a durable queue** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL serialize Mengantar dispatch through a durable queue.
- **REQ-ORD-007 — Persist waybills and expose tracking/label actions** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL persist waybills and expose tracking/label actions.
- **REQ-ORD-008 — Verify and apply Mengantar webhooks** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL verify and apply Mengantar webhooks.
- **REQ-ORD-009 — Track Mengantar COD remittance and reconciliation** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL track Mengantar COD remittance and reconciliation.
- **REQ-ORD-010 — Handle RTS and returned orders explicitly** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL handle RTS and returned orders explicitly.
- **REQ-ORD-011 — Calculate receiver RTS risk before COD confirmation** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL calculate receiver RTS risk before COD confirmation.
- **REQ-ORD-012 — Cache and refresh Mengantar district resolution** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL cache and refresh Mengantar district resolution.
- **REQ-ORD-013 — Export tenant order reports safely** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL export tenant order reports safely.
- **REQ-ORD-014 — Implement internal order notes and mentions** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement internal order notes and mentions.
- **REQ-ORD-015 — Expire stale eligible orders automatically** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL expire stale eligible orders automatically.

## Payment Requirements
- **REQ-PAY-001 — Create idempotent AutoLaris payment sessions** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL create idempotent AutoLaris payment sessions.
- **REQ-PAY-002 — Implement the AutoLaris QRIS flow** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement the AutoLaris QRIS flow.
- **REQ-PAY-003 — Implement the AutoLaris virtual-account flow** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement the AutoLaris virtual-account flow.
- **REQ-PAY-004 — Verify AutoLaris webhook authenticity and replay safety** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL verify AutoLaris webhook authenticity and replay safety.
- **REQ-PAY-005 — Reconcile payment transactions with AutoLaris** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL reconcile payment transactions with AutoLaris.
- **REQ-PAY-006 — Implement the direct COD order flow** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement the direct COD order flow.
- **REQ-PAY-007 — Validate COD availability server-side** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL validate COD availability server-side.
- **REQ-PAY-008 — Render only currently eligible payment methods** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL render only currently eligible payment methods.
- **REQ-PAY-009 — Implement refund and payment cancellation handling** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement refund and payment cancellation handling.
- **REQ-PAY-010 — Implement the tenant financial ledger and settlement views** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement the tenant financial ledger and settlement views.

## Tracking Requirements
- **REQ-TRK-001 — Integrate tenant-configured Meta Pixel browser events** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL integrate tenant-configured Meta Pixel browser events.
- **REQ-TRK-002 — Send server-authoritative events to Meta CAPI** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL send server-authoritative events to Meta CAPI.
- **REQ-TRK-003 — Generate deterministic browser/server event IDs** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL generate deterministic browser/server event IDs.
- **REQ-TRK-004 — Preserve first-party _fbp and _fbc attribution values** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL preserve first-party _fbp and _fbc attribution values.
- **REQ-TRK-005 — Normalize and SHA-256 hash ad-platform matching data** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL normalize and SHA-256 hash ad-platform matching data.
- **REQ-TRK-006 — Deliver conversion events through a multi-platform transactional outbox** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL deliver conversion events through a multi-platform transactional outbox (`outbox_events` with `platform`, `destination_id`, and `unique(tenant_id, platform, event_id)`).
- **REQ-TRK-007 — Implement the COD Meta signal taxonomy** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement the COD Meta signal taxonomy.
- **REQ-TRK-008 — Implement the prepaid Meta signal taxonomy** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement the prepaid Meta signal taxonomy.
- **REQ-TRK-009 — Maximize Meta Event Match Quality safely** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL maximize Meta Event Match Quality safely.
- **REQ-TRK-010 — Provide end-to-end multi-platform diagnostics and release smoke coverage** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL provide end-to-end multi-platform diagnostics and release smoke coverage.
- **REQ-TRK-011 — Implement Google Ads Enhanced Conversions and Consent Mode v2** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement Google Ads Enhanced Conversions with SHA-256 hashed user data, Consent Mode v2 with consent-default deny-all, `gclid`/`gbraid`/`wbraid` click-ID preservation, server-side offline conversion upload via Google Ads API, and Google Product Category auto-selection with GTIN/EAN validation for Merchant Center catalog feeds.
- **REQ-TRK-012 — Implement TikTok Events API v2 with Advanced Matching** — **Status: Target.** When the relevant actor or runtime invokes this capability, the system SHALL implement TikTok Pixel initialization, `ttclid` click-ID capture and persistence, SHA-256 Advanced Matching (email, phone), server-side Events API v2 delivery from `outbox_events`, COD vs. prepaid `CompletePayment` signal taxonomy, and VBO-ready value/currency reporting.

## Acceptance Themes

**Status: Target.** These are release expectations, not current-state claims.
1. The admin UX must be complete on desktop, tablet, and mobile webview.
2. Seller self-service domain management must be native.
3. Embedded forms must stay lightweight, pixel-aware, and visually precise with bank logos.
4. Cross-tenant leakage is a release blocker.
5. Multi-ad-platform signal integrity: Meta CAPI, Google Ads Enhanced Conversions, and TikTok Events API v2 must all fire correct deduplication-safe events through the shared `outbox_events` table.
6. Headless SDK consumers can build custom storefronts against the public REST API without internal knowledge.
7. Docker Compose local dev and Coolify VPS self-hosting must both work from a clean checkout.
8. OMP can execute implementation in parallel from this spec set without inventing new contracts.

## Indonesia Market and Jurisdiction Unknowns

The following are **Unknown** until authoritative product, provider, tax, privacy, and legal inputs are recorded in the relevant owner document:

- Supported provinces, districts, couriers, COD eligibility rules, remittance timing, and provider failure semantics.
- WhatsApp consent, template governance, retention, and operator accountability requirements.
- Tax invoice, refund, settlement, and reconciliation obligations for each seller and platform operating model.
- Personal-data roles, lawful basis, retention periods, deletion exceptions, cross-border processing, and incident-notification duties.
- Required accessibility baseline, service levels, disaster-recovery targets, and production support ownership.

No statement in this PRD is a claim of regulatory compliance or provider certification.

## Traceability and Domain Owners

- `TASKS.md` owns the permanent implementation task graph. Implementation tasks have exactly one **Primary requirement**; evidence-only tasks identify a **Verification target**.
- `STATUS.md` owns current-state summaries, and `BUILD-LOG.md` owns dated command evidence.
- `ARCHITECTURE.md` and `DECISIONS.md` own system structure and accepted decisions.
- `DATA-MODEL.md`, `IAM.md`, `SECURITY.md`, `PRIVACY.md`, and `BILLING.md` own their domain contracts.
- `OBSERVABILITY.md` and `RELEASE.md` own operational evidence and release gates.
- `openapi.yaml` and executable route/schema definitions own the API contract; discrepancies are defects, not alternate requirements.
- Detailed feature specs may refine a requirement but cannot replace or renumber its `REQ-*` identifier.
