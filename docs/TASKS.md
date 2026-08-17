# DotAds Engine v2 — Release Remediation Tasks

**Canonical owner:** This root document owns implementation work. The byte-identical `docs/TASKS.md` file is a compatibility mirror.

Task IDs are permanent. A checked box means the stated evidence is present; it is not a claim that related requirements or release gates are complete.

## Execution Contract

- A task is complete only when its implementation and the stated executable evidence are both present on the same reviewed revision.
- A passing helper or static-navigation smoke test does not complete an HTTP authorization, database, browser, or provider-integration task.
- Keep production deployment, live provider calls, secret access, and remote database writes behind explicit approval.
- Record exact commands and results in `BUILD-LOG.md`; keep `STATUS.md` conservative.

## P0 — Security, Tenant Isolation, and Access Control

- [x] **T-1001: Enforce database row-level tenant isolation.**
  - **Primary requirement:** REQ-SYS-001
  - Add PostgreSQL RLS policies or an equivalently enforced database boundary for every tenant-owned table.
  - **Done when:** a clean-database integration suite proves allowed same-tenant access and denied cross-tenant reads/writes for every tenant-owned resource.
  - **Evidence:** migration `0004_tenant_rls.sql` plus `smoke:tenant-rls` enforce distinct non-owner runtime/platform roles, forced RLS on 20 direct tenant tables plus `tenants`, `members`, and `invitations`, transaction-local context, child-parent tenant checks, and adversarial denial. `pnpm test:clean-db` passed on 2026-08-16.

- [ ] **T-1002: Make admin authorization default-deny.**
  - **Primary requirement:** REQ-SYS-004
  - Apply explicit permissions to every `/api/v1/admin/*` route, including reads, exports, cleanup, single delete, and bulk mutations.
  - **Done when:** an HTTP matrix test covers all six roles and proves both allowed and denied cases for every route family.

- [x] **T-1003: Unify the permission vocabulary.**
  - **Primary requirement:** REQ-SYS-004
  - Replace divergent names such as `member:*` versus `members:*` and `product:*` versus `catalog:*` or `builders:*` with one typed catalog shared by API and navigation.
  - **Done when:** owner member invitation and advertiser builder mutations pass through real HTTP handlers, while unauthorized roles receive `403`.
  - **Evidence:** `smoke:public-auth` uses real session cookies to persist owner invitation and advertiser form creation plus audit rows; `smoke:rbac` verifies selected unauthorized roles receive `403`.

- [ ] **T-1004: Derive UI role, tenant, and navigation from the validated server session.**
  - **Primary requirement:** REQ-SYS-010
  - Remove production-visible hardcoded role and tenant switching. Protect `/admin/*` and `/super-admin/*` independently and guard direct URLs, not only menu visibility.
  - **Done when:** browser tests prove role-correct redirects, navigation, direct-route denial, tenant scope, and logout behavior.
  - **Partial evidence:** fresh migrations `0000`–`0007`; reproducible production-disabled Super Admin and multi-workspace merchant fixtures; exact multi-workspace `409`; bounded own-workspace list/select with required `organizationName` and `END_BUYER` excluded; role-aware root dispatch; distinct shells; six-role direct-route guard smoke; and real Tailscale Chrome coverage for role separation, three picker states, database-backed selection, sign-out, stale-cookie recovery, and mobile clipping. T-1004 remains open for the complete role/direct-route/accessibility matrix and does not replace API authorization evidence.

- [x] **T-1005: Enforce tenant lifecycle status.**
  - **Primary requirement:** REQ-SYS-001
  - Deny tenant operations for suspended or cancelled tenants while preserving an explicit support/recovery path.
  - **Done when:** HTTP tests prove an active tenant can operate and the same session is denied immediately after suspension.
  - **Evidence:** `smoke:public-auth` proves the same owner cookie receives `200` while active and `403` after platform suspension, then restores the fixture.

- [ ] **T-1006: Complete authentication and trust-boundary hardening.**
  - **Primary requirement:** REQ-SYS-003
  - Keep test bypasses test-only, remove untrusted tenant overrides outside tests, validate request bodies through contracts, fail closed for required bot/webhook verification, sanitize generated HTML, and restrict CORS to configured origins.
  - **Done when:** negative tests cover forged tenant headers, invalid signatures, missing production verification configuration, malformed payloads, reflected content, and disallowed origins.

- [x] **T-1007: Audit and remediate dependency vulnerabilities.**
  - **Primary requirement:** REQ-SYS-003
  - **Done when:** the repository records the package-manager audit command, reviewed findings, remediation decisions, and an acceptable final result.
  - **Evidence:** Drizzle, Astro, Sharp, and PostCSS were upgraded with full build, clean-database, and browser regression checks; `pnpm audit --prod --audit-level high` now reports 2 moderate and 2 low findings with zero high findings.

## P0 — Audit, Super Admin, and Governance

- [ ] **T-1008: Make audit records complete and append-only.**
  - **Primary requirement:** REQ-SYS-008
  - Emit audit evidence for every sensitive mutation with authenticated actor, role, tenant, target, request metadata, and before/after state. Prevent update/delete at the database boundary.
  - **Done when:** transactional integration tests prove the business mutation and audit entry commit together, and direct audit update/delete attempts fail.

- [ ] **T-1009: Implement secure tenant impersonation.**
  - **Primary requirement:** REQ-ADM-005
  - Use a short-lived signed/scoped server session with authenticated actor, target tenant, reason, expiry, persistent banner, and one-click exit. Require appropriate re-authentication for dangerous actions.
  - **Done when:** API and browser tests prove scope, expiry, banner persistence, exit, denial to non-super-admins, and actor-correct audit records.

- [ ] **T-1010: Implement transactional tenant provisioning.**
  - **Primary requirement:** REQ-SYS-002
  - Reuse one provisioning service to create the tenant, organization, owner account/membership, and lifecycle state; define failure and retry behavior.
  - **Done when:** integration tests prove atomic success, rollback on failure, duplicate handling, and the `provisioning -> active|failed` lifecycle.

- [ ] **T-1011: Complete the invitation and membership lifecycle.**
  - **Primary requirement:** REQ-SYS-005
  - Add invitation listing, resend, cancel, expiry, acceptance bound to the invited email, role changes, member removal, and last-owner protection.
  - **Done when:** authenticated HTTP tests cover every transition, invalid/expired/reused invites, cross-tenant denial, and audit evidence.
  - **Partial evidence:** `/api/v1/members` provides typed tenant/organization-scoped list, invite, resend, cancel, role update, and removal with transactional audit rows, last-owner/self guards, `delivery: "not_configured"`, and migration `0009` pending-email uniqueness. Migration `0012` plus a clean-DB smoke locally verifies real-session/normalized-email-bound acceptance, forged/wrong-email/cross-site denial, invalid lifecycle/tenant/role denial, idempotent membership/session selection, and one audit row. Chrome verifies invite→resend→cancel at 1280/768/390; acceptance and the complete role/remove/accessibility workflow are not browser/live verified, so T-1011 remains open.

## P0 — Commerce and Indonesia Operations

- [ ] **T-1012: Define and enforce one order lifecycle.**
  - **Primary requirement:** REQ-ORD-001
  - Reconcile order, payment, and fulfillment vocabularies across schema, API, webhooks, admin UI, and outbox. Define valid transitions, guards, terminal states, retries, cancellation, refund, RTS/return, and recovery.
  - **Done when:** state-transition tests reject invalid transitions and prove side effects and audit events for valid ones.
  - **Partial evidence:** the persisted Orders API now exposes separate canonical `status`, `paymentStatus`, and `fulfillmentStatus` axes; tenant-scoped tests cover valid/idempotent processing and cancellation, unpaid-prepaid rejection, active-dispatch cancellation rejection, conditional writes, order events, and before/after audit metadata. Refund, RTS/return, remittance, webhook parity, recovery, and UI coverage keep this task open.

- [ ] **T-1013: Make stale-order cleanup safe.**
  - **Primary requirement:** REQ-ORD-015
  - Restrict cleanup to explicit unpaid/abandoned states, preserve financial and audit records, and separate scheduled service authorization from merchant actions.
  - **Done when:** tests prove old paid, delivered, refunded, and audited orders are never purged; eligible abandoned orders follow the documented retention policy.

- [ ] **T-1014: Canonicalize IDR money semantics.**
  - **Primary requirement:** REQ-PAY-010
  - Keep the observed canonical representation as integer rupiah, document every provider conversion boundary, and use shared parsing and formatting.
  - **Done when:** contract tests cover checkout totals, discounts, shipping, COD values, reconciliation, exports, and UI formatting without a 100× ambiguity.
  - **Partial evidence:** Orders API responses declare `currency: "IDR"` and validate non-negative integer amounts; the Mengantar adapter contract test proves integer rupiah without a 100× conversion. Reconciliation, exports, and complete UI coverage remain open.

- [ ] **T-1015: Enforce WIB reporting boundaries.**
  - **Primary requirement:** REQ-ADM-003
  - Store instants safely, calculate business periods in `Asia/Jakarta`, and label dashboard periods, filters, exports, and audit timestamps consistently.
  - **Done when:** tests cover the UTC/WIB day boundary and prove dashboard and export totals use the same interval.
  - **Partial evidence:** Orders responses serialize offset-bearing instants and filters require explicit offsets. The mounted Dashboard API derives stable 7/30-day `[from,to)` periods and zero-filled dates in `Asia/Jakarta`; its injected-clock smoke proves 16:59:59Z and 17:00:00Z fall on adjacent WIB dates. All PostgreSQL pools force UTC and pass `show timezone`. Dashboard UI wiring and dashboard/export interval parity remain unverified, so T-1015 stays open.

- [ ] **T-1016: Complete COD, shipping, and WhatsApp operations.**
  - **Primary requirement:** REQ-PAY-006
  - Use authoritative Indonesian region data, E.164 phone validation, destination/COD eligibility, receiver-risk policy, courier failure/retry states, governed WhatsApp templates, and communication audit evidence.
  - **Done when:** integration/browser tests cover a successful COD flow plus invalid address, ineligible COD, provider failure, RTS, retry, and WhatsApp consent/template cases.
  - **Partial evidence:** migration `0007` plus the schema enforce one dispatch queue row per tenant/order. The Orders smoke covers idempotent queueing, active-queue cancellation denial, explicit DLQ recovery requirement, test-mode worker completion, and dispatch event/audit rows without a live provider call. Real merchant Chrome queued a development-safe dispatch, preserved `pending`/`attempts: 0` plus `DISPATCH_QUEUED` after reload, and made no provider call or synthetic waybill; a shipped order returned real `409`. Official Mengantar acceptance, failure/retry recovery, RTS, regional correctness, and WhatsApp governance remain open.

- [ ] **T-1017: Implement atomic inventory and idempotent order intake.**
  - **Primary requirement:** REQ-ORD-002
  - Deduct stock atomically, generate collision-safe tenant order numbers, recompute totals server-side, and enforce client idempotency keys.
  - **Done when:** concurrent integration tests prove no oversell, duplicate order, or client-controlled total.
  - **Partial evidence:** migration `0015`, public Orders, the integration boundary, form runtime, and the isolated clean-database smoke require a UUID `Idempotency-Key`, hash normalized business input without Turnstile, claim the key in the stock/order transaction, replay the exact stored response, reject mismatched/expired reuse, and decrement stock once under concurrent duplicates. Prepaid persists `PAYMENT_REQUESTING` before AutoLaris I/O; ambiguity returns stable `202 PAYMENT_PROCESSING` without automatic retry. Replay bypasses consumed Turnstile and unavailable shipping paths. Broader inventory/property and provider evidence remain open, so T-1017 stays open.

## P0 — Provider and Signal Delivery

- [ ] **T-1018: Implement and verify production-shaped provider adapters.**
  - **Primary requirement:** REQ-TRK-010
  - Cover Meta CAPI, Google Ads, TikTok Events API, Mengantar, and AutoLaris with official request contracts, timeouts, retries, idempotency, error classification, and redacted observability.
  - **Done when:** non-live contract tests against approved fixtures or sandboxes prove request shape and failure handling for every provider.
  - **Partial evidence:** migration `0014` and the signed webhook smoke bind AutoLaris callbacks to transaction/order/amount and Mengantar callbacks to a unique persisted waybill, reject invalid signatures and malformed/cross-tenant bindings, and serialize a payment/cancellation race. Migration `0015` prevents automatic AutoLaris re-entry after the request boundary may have been crossed. Actual provider fixture/sandbox/live delivery remains **UNVERIFIED**.

- [ ] **T-1019: Complete transactional outbox delivery and recovery.**
  - **Primary requirement:** REQ-TRK-006
  - Ensure deterministic event IDs, correct COD/prepaid conversion timing, retry scheduling, dead-letter handling, and operator replay without duplicate delivery.
  - **Done when:** database-backed worker tests cover success, transient failure, permanent failure, replay, and deduplication across all platforms.

- [ ] **T-1020: Verify payment and logistics reconciliation.**
  - **Primary requirement:** REQ-PAY-005
  - Make webhook reconciliation atomic and idempotent; bind Mengantar dispatch and waybill assignment to real provider responses.
  - **Done when:** signed webhook and adapter tests prove duplicate delivery safety, invalid-signature rejection, delayed/out-of-order events, and recovery.

## P1 — Persistent CMS and Product Workflows

- [ ] **T-1021: Replace hardcoded CMS data with authenticated API/database reads.**
  - **Primary requirement:** REQ-SYS-009
  - Cover dashboard, orders, products, members, builders, tracking, integrations, settings, audit, and super-admin surfaces.
  - **Done when:** a seeded record appears in the correct tenant UI, a mutation persists after reload, and another tenant cannot observe it.
  - **Partial evidence:** Super Admin fleet/overview/audit and tenant Dashboard/Orders/Products use typed persisted APIs. Dashboard passed real merchant Chrome at 1280/768/390 for real 7/30-day data; Products persisted create/edit/archive and Catalog smoke proves cross-tenant denial. Members has a real lifecycle API/client, bounded invite→resend→cancel browser evidence, and locally verified session-bound acceptance backend. Platform settings, builders/tracking/integrations, and incomplete Members browser coverage keep T-1021 open.

- [ ] **T-1022: Implement honest mutation states.**
  - **Primary requirement:** REQ-ADM-010
  - Remove simulated success, synthetic waybills, and local-only saves. Provide loading, empty, validation, conflict, partial-failure, retry, and recovery states.
  - **Done when:** browser tests exercise success and forced failure for each primary workflow without losing operator input.
  - **Partial evidence:** Super Admin settings no longer simulate global writes, and Orders preserves real pending/`409` outcomes. Products persists create/edit/archive, preserves local input on `STALE_WRITE`, exposes honest states, hides mutations for read-only roles, and labels upload unavailable. Members invite/resend/cancel is browser-backed, while acceptance and role/remove failures lack browser coverage. Dashboard uses real API data, but its empty/error states were not live-fixture forced. Not every primary workflow has browser-forced failure/recovery evidence, so T-1022 remains open.

- [ ] **T-1023: Align menu, routes, and capabilities.**
  - **Primary requirement:** REQ-SYS-004
  - Generate or validate navigation against the same role-capability contract as server authorization. Remove `END_BUYER` from the CMS shell and provide a separate implemented storefront/account tracking flow if required.
  - **Done when:** route inventory tests find no missing links, orphan operational routes, or role-visible actions that the API rejects.
  - **Partial evidence:** the tenant server layout derives allowed prefixes from the current role navigation; the six-role route smoke covers allowed, denied, nested, and prefix-boundary paths; and `END_BUYER` is excluded from CMS workspace list/select. Full menu/API capability parity remains open.

- [ ] **T-1024: Complete responsive admin navigation and dense workflows.**
  - **Primary requirement:** REQ-BLD-006
  - Provide full desktop sidebar, tablet rail, and mobile drawer with current-location indication and accessible keyboard/focus behavior.
  - **Done when:** browser validation passes representative desktop, tablet portrait/landscape, and mobile widths for every role shell.

## P1 — Merchant Workspace UX and Menu Completion

- [x] **T-1031: Replace the merchant menu with the task-first capability map.**
  - **Primary requirement:** REQ-ADM-016
  - **Constraints:** REQ-SYS-004, REQ-ADM-019, REQ-ADM-022, REQ-ADM-024
  - **Dependencies:** T-1023
  - Define one typed menu/capability source for Ringkasan, Operasional, Konten & Iklan, Keuangan, and Pengaturan; remove END_BUYER, profile, non-functional search, and unauthorized/synthetic destinations from each tenant role.
  - **Done when:** run the admin navigation and direct-route inventory tests; they enumerate every merchant page and prove no dead link, orphan operational route, prefix-boundary bypass, Customer Service provider-configuration route, or menu/API permission contradiction.
  - **Evidence:** the focused navigation smoke and six-role direct-route smoke passed on 2026-08-17. The visible merchant map is deliberately limited to real destinations: Owner sees Ringkasan, Pesanan, Produk, Anggota Tim, Domain Kustom, and Log Aktivitas; Admin omits Domain Kustom; Advertiser lands on Produk; Customer Service sees Ringkasan, Pesanan, and Produk. Profile, global search, builders, provider configuration, reconciliation, tracking, and other simulated destinations are absent from navigation and denied by the tenant server guard.

- [ ] **T-1032: Complete merchant login and workspace-entry recovery.**
  - **Primary requirement:** REQ-ADM-018
  - **Constraints:** REQ-SYS-005, REQ-SYS-010, REQ-ADM-024
  - **Dependencies:** T-1004
  - Keep production authentication email-based, development aliases non-production-only, safe invitation return paths, multi-workspace selection, suspended-tenant denial, generic invalid-credential copy, pending-submit prevention, stale-session recovery, and sign-out.
  - **Done when:** execute the login browser matrix at 1280, 768, and 390 pixels; valid single/multiple-workspace, invalid credential, invitation return, suspended tenant, stale cookie, retry, and sign-out cases satisfy REQ-ADM-018 without console/runtime errors or account-enumeration copy.
  - **Partial evidence:** the login now uses generic invalid-credential/rate-limit copy, prevents duplicate submission, preserves safe invitation return handling, and explains workspace selection without exposing backend errors. Earlier browser evidence covers multi-workspace selection, stale-cookie recovery, and sign-out, but the complete current 1280/768/390 single/multiple-workspace, invitation, suspended, invalid, retry, and sign-out matrix has not run on one revision.

- [ ] **T-1033: Make each tenant role land on an actionable real-data view.**
  - **Primary requirement:** REQ-ADM-017
  - **Constraints:** REQ-ADM-003, REQ-SYS-009, REQ-SYS-004
  - **Dependencies:** T-1031
  - Keep owner/admin/customer-service dashboards scoped to their permitted operational priorities; redirect Advertiser to Products until a persisted advertiser-specific dashboard exists. Every KPI and shortcut must resolve to a real authorized queue.
  - **Done when:** execute the seeded role dashboard/browser procedure and assert exact API requests, WIB period labels, persisted totals, authorized deep links, advertiser landing behavior, empty/error recovery, and absence of fabricated KPIs/actions.
  - **Partial evidence:** the dashboard uses the real Dashboard and Orders clients, labels WIB explicitly, retains only real Pesanan and Produk task links, and the static role guard redirects Advertiser to Produk. Owner Chrome at 1280/768/390 rendered persisted data without runtime, network, console, or overflow errors. Seeded Admin, Advertiser, and Customer Service browser cases plus forced empty/error recovery remain unverified.

- [ ] **T-1034: Quarantine simulated merchant pages and secrets.**
  - **Primary requirement:** REQ-ADM-019
  - **Constraints:** REQ-SYS-009, REQ-ADM-016, REQ-ADM-024
  - **Dependencies:** T-1031
  - Inventory builders, tracking, reconciliation, shipping/WhatsApp, store, warehouse, domains, audit, integrations, and profile; remove seeded credentials/sample records and hide each menu entry until its real primary workflow exists, while direct bookmarks receive a clear unavailable/read-only state.
  - **Done when:** run the synthetic-content scan plus browser route inventory; no production-renderable route exposes seeded secrets, sample records presented as live, local-only save success, synthetic provider outcomes, or navigation to an unavailable primary job.
  - **Partial evidence:** all inspected synthetic destinations are removed from role navigation and denied by the shared server route guard, while Domain Kustom and Log Aktivitas were promoted only after receiving real tenant APIs. Synthetic builder/tracking/reconciliation/provider page implementations still exist behind the guard, and a complete synthetic-content scan plus direct-bookmark browser inventory has not been recorded, so quarantine is not closed broadly.

- [ ] **T-1035: Move real account utilities out of the business menu.**
  - **Primary requirement:** REQ-ADM-020
  - **Constraints:** REQ-SYS-010, REQ-ADM-018, REQ-ADM-021
  - **Dependencies:** T-1031, T-1032
  - Provide one session-derived account/workspace control for workspace switching, implemented profile/security operations, and sign-out; omit global search until a tenant-scoped API contract exists.
  - **Done when:** keyboard/browser tests prove the control opens and closes predictably, identifies the active workspace/role, completes switch/sign-out, handles failure without trapping focus, and either returns authorized search results or renders no search affordance.

- [ ] **T-1036: Separate shipment operations from provider configuration.**
  - **Primary requirement:** REQ-ADM-022
  - **Constraints:** REQ-ORD-005, REQ-ORD-006, REQ-ORD-007, REQ-SYS-004
  - **Dependencies:** T-1012, T-1016, T-1031
  - Build a credential-free Pengiriman queue/detail for rates, COD eligibility, dispatch, waybill, tracking, exception, and retry; keep Mengantar/AutoLaris credentials in owner-only Integrasi settings.
  - **Done when:** execute HTTP authorization and browser role tests proving Customer Service can complete its bounded shipment path, cannot read/mutate provider configuration, and sees persisted pending/success/failure/conflict/retry states without a synthetic waybill.

- [ ] **T-1037: Persist every governed merchant settings destination.**
  - **Primary requirement:** REQ-ADM-023
  - **Constraints:** REQ-ADM-014, REQ-ADM-015, REQ-SYS-006, REQ-SYS-008, REQ-SYS-009
  - **Dependencies:** T-1002, T-1008, T-1011, T-1034
  - Implement tenant-scoped Toko, Lokasi & Gudang, Integrasi, Pesan WhatsApp, Tim, Domain, and Log Aktivitas sources with role-specific read/write behavior, validation, conflict handling, destructive confirmation, and audit evidence.
  - **Done when:** execute each settings destination's clean-database HTTP and browser test; same-tenant changes persist after reload, cross-tenant access fails, read-only roles cannot mutate, forced validation/conflict/server failures preserve input, and sensitive mutations create actor-correct audit rows.
  - **Partial evidence:** Log Aktivitas now reads a bounded, redacted, tenant-scoped persisted audit feed for Owner/Admin, and Domain Kustom provides an Owner-only persisted list/create slice with normalized hostnames, duplicate rejection, transactional audit creation, and honest manual TXT instructions. Cross-tenant and role denials pass locally, and Owner browser coverage exists. Toko, Lokasi & Gudang, Integrasi, Pesan WhatsApp, the complete Tim lifecycle, automated DNS verification, SSL, primary-domain mutation, deletion, and forced browser failure states remain open.

- [ ] **T-1038: Validate the complete merchant workspace responsively and accessibly.**
  - **Primary requirement:** REQ-ADM-021
  - **Constraints:** REQ-ADM-016, REQ-ADM-018, REQ-ADM-024
  - **Dependencies:** T-1031, T-1032, T-1033, T-1035
  - Cover desktop sidebar, tablet navigation, mobile navigation, dense list/detail screens, dialogs, account control, current-location state, focus return, keyboard operation, reduced motion, and horizontal overflow.
  - **Done when:** execute the four-role browser matrix at 1280, 768, and 390 pixels with keyboard-only navigation and forced loading, empty, read-only, validation, conflict, server-error, and pending states; the observed evidence satisfies REQ-ADM-021.
  - **Partial evidence:** Owner Chrome at 1280/768/390 covered login, workspace entry, dashboard, Log Aktivitas, and Domain Kustom with no reported overflow, runtime, network, or console errors. The domain dialog passed autofocus, Escape dismissal, and focus return. Admin, Advertiser, and Customer Service browser fixtures, complete keyboard/reduced-motion checks, and forced loading/empty/read-only/validation/conflict/server-error/pending states remain unverified.

- [ ] **T-1039: Standardize merchant UI terminology in Indonesian.**
  - **Primary requirement:** REQ-ADM-024
  - **Constraints:** REQ-ADM-016, REQ-ADM-018, REQ-ADM-021
  - **Dependencies:** T-1031
  - Create one reviewed merchant terminology map in the existing design-system owner, then align navigation, headings, object names, outcome-based actions, status explanations, validation, and recovery copy. Preserve API/code identifiers, provider names, and stored enums.
  - **Done when:** execute the repository terminology scan and four-role/device browser review; there is no Malay wording, ambiguous generic action label, inconsistent synonym for the same object/state, or translated technical identifier, and every deliberate English term has a clarity rationale in the canonical terminology map.
  - **Partial evidence:** the exposed login, workspace controls, dashboard, menu, Domain Kustom, and Log Aktivitas copy was normalized to Indonesian terms such as ruang kerja, toko aktif, anggota tim, and layanan pelanggan while preserving technical identifiers. A canonical reviewed terminology map, automated repository scan, and complete four-role/device language review do not yet exist.

- [ ] **T-1040: Connect Landing Page management to persisted list-edit-version-publish workflows.**
  - **Primary requirement:** REQ-BLD-008
  - **Constraints:** REQ-BLD-010, REQ-BLD-012, REQ-BLD-013, REQ-BLD-014, REQ-BLD-015, REQ-ADM-019
  - **Dependencies:** T-1034
  - Replace the local-only editor state with an authenticated tenant list/detail flow, explicit draft/version/publish lifecycle, validation, preview device modes, unsaved-change protection, and recoverable conflicts.
  - **Done when:** execute the Landing Page HTTP and browser procedure; create/edit/version/publish persists after reload, another tenant is denied, invalid publish is rejected, stale edits retain input, and desktop/tablet/mobile previews render the selected persisted version.
  - **Blocker:** the current API exposes incomplete list/create/version primitives but no strict detail/update contract, atomic publish transition, immutable complete version snapshot, or public published-page resolution. The current UI remains a local-only canvas without API-backed lifecycle, conflict recovery, or persisted device preview. Keep the destination quarantined.

- [ ] **T-1041: Connect Order Form management to persisted list-edit-version-publish workflows.**
  - **Primary requirement:** REQ-BLD-001
  - **Constraints:** REQ-BLD-002, REQ-BLD-003, REQ-BLD-004, REQ-BLD-005, REQ-BLD-006, REQ-ADM-019
  - **Dependencies:** T-1034
  - Replace the seeded/local-only form editor with an authenticated tenant list/detail workflow for the four canonical presets, schema validation, versioning, preview, publish, embed configuration, unsaved-change protection, and conflict recovery.
  - **Done when:** execute the Form HTTP and browser procedure; each canonical preset can be persisted/versioned/published and reloaded, invalid schema/publish and stale edit cases fail safely without losing input, cross-tenant access is denied, and the embed uses the selected published version.
  - **Blocker:** the current API lacks strict bounded builder schema validation, detail/update and concurrency semantics, an atomic selected-version publish contract, and a reliable public embed contract; the inspected public form path is hard-coded rather than selected from the tenant's published version. The current UI is seeded/local-only. Keep the destination quarantined.

- [ ] **T-1042: Replace tracking simulation with configuration and delivery diagnostics.**
  - **Primary requirement:** REQ-TRK-010
  - **Constraints:** REQ-TRK-001, REQ-TRK-002, REQ-TRK-006, REQ-SYS-008, REQ-ADM-019
  - **Dependencies:** T-1018, T-1019, T-1034
  - Provide secret-safe destination configuration plus real outbox delivery status, deduplication identity, redacted failure detail, retry/DLQ state, and permission-aware actions; remove simulated event generation and sample logs.
  - **Done when:** execute non-live adapter/HTTP and browser diagnostics tests proving real persisted configured/unconfigured, success, retry, permanent failure, replay, and read-only states without displaying raw tokens or fabricated delivery.

- [ ] **T-1043: Replace local reconciliation rows with authoritative settlement views.**
  - **Primary requirement:** REQ-PAY-010
  - **Constraints:** REQ-PAY-005, REQ-ORD-009, REQ-ADM-019
  - **Dependencies:** T-1020, T-1034
  - Back reconciliation, dispute, and CSV export with tenant-scoped payment/COD remittance records using integer-rupiah and WIB semantics; keep the menu owner-only until an explicit Admin finance permission is accepted.
  - **Done when:** execute clean-database HTTP and browser tests proving totals/export parity, persisted dispute lifecycle, duplicate/out-of-order reconciliation safety, cross-tenant denial, read-only/empty/error states, and no sample settlement rows.

## P1 — Verification and Release Evidence

- [x] **T-1025: Run the current RBAC smoke.**
  - **Verification target:** REQ-SYS-004
  - **Evidence:** `pnpm --filter @dotads/api smoke:rbac` passed on 2026-08-16 with helper, permission-map, selected negative HTTP authorization, role-escalation, and GTIN assertions.
  - **Limitation:** this is not a complete route-by-role, tenant, state, or database matrix; it does not complete `SEC-02`.

- [x] **T-1026: Run the static admin-navigation smoke.**
  - **Verification target:** REQ-SYS-004
  - **Evidence:** `pnpm --filter @dotads/admin smoke:admin-navigation` passed on 2026-08-16.
  - **Limitation:** configuration-only; does not complete `SEC-04`, `CMS-03`, or `CMS-04`.

- [ ] **T-1027: Add clean-database migration and integration coverage.**
  - **Verification target:** REQ-SYS-001
  - **Done when:** a reproducible command provisions a clean database and passes schema, RLS, auth, lifecycle, provider, audit, and rollback tests.
  - **Partial evidence:** `pnpm test:clean-db` provisions and removes an isolated tmpfs PostgreSQL 16 container, applies migrations `0000`–`0012`, creates distinct owner/app/platform logins plus production-disabled development auth fixtures, and passes RLS, workspace/auth, audit immutability, provisioning, Orders, Catalog concurrency/interleaving, Members lifecycle/session-bound acceptance, Dashboard mounted/direct, integration, and release smokes. Full provider, backup/restore, rollback, and browser matrices remain open.

- [ ] **T-1028: Add browser role/device coverage.**
  - **Verification target:** REQ-BLD-006
  - **Done when:** executable evidence covers super admin, owner, admin, advertiser, customer service, and buyer-facing flows at desktop, tablet, and mobile widths.
  - **Partial evidence:** session-derived tenant and Super Admin shells; real Tailscale role/workspace/sign-out recovery; Super Admin fleet at 1280/390; and real merchant Orders plus Products at 1280/768/390. Products mutations persisted after reload, and Members invite→resend→cancel passed at 1280/768/390. Members acceptance/role/remove, Dashboard real-data rendering, remaining roles, accessibility, and broader forced-failure flows remain open.

- [ ] **T-1029: Run the full release gate on one reviewed revision.**
  - **Verification target:** release gate in `RELEASE.md`
  - **Done when:** dependency audit, clean migration, `pnpm test`, `pnpm build`, browser matrix, and non-live provider contracts pass and their exact outputs are recorded in `BUILD-LOG.md`.

- [ ] **T-1030: Perform approval-gated staging and production validation.**
  - **Verification target:** approval-gated release validation in `RELEASE.md`
  - **Done when:** the user separately authorizes the environment action and the release record captures revision, migration, rollback, health, and provider evidence. This task does not authorize deployment.
