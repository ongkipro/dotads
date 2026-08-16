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
