# DotAds Engine v2 — Status Report

**Last Updated:** 2026-08-17
**Project Phase:** Active remediation after system-wide audit
**Release Status:** **NOT READY FOR PRODUCTION**

## Executive Summary

DotAds Engine v2 has a working monorepo foundation for a multi-tenant commerce platform, form and landing-page builders, an Astro storefront, an admin application, and provider integration boundaries. The repository also contains narrow smoke checks for authentication helpers, navigation configuration, tenant isolation, provisioning, platform routes, audit records, and release contracts.

Those checks do not establish production readiness. The 2026-08-16 remediation now enforces database RLS with distinct migration, tenant-runtime, and platform-control login roles, and admin workspace identity is derived from a bounded server session endpoint. Release-blocking gaps remain in persistent CMS workflows, the complete route-by-role matrix, provider delivery, lifecycle coverage, privacy/operations decisions, and staging/recovery evidence.

No completion percentage is reported until the release-blocking requirements have traceable implementation and executable evidence.

## Implemented Foundation

The following repository surfaces exist. This is an inventory, not a release certification:

- Monorepo packages for database access, contracts, authentication, form runtime, and provider integrations.
- Public merchant registration and first-super-admin bootstrap routes.
- Six-role permission helper and role-specific navigation configuration.
- Tenant-scoped schemas and query patterns on several admin routes.
- Public product, form, shipping, lead, and order route contracts.
- Platform routes under `/api/v1/platform/*` for tenant listing, statistics, creation, status mutation, fail-closed impersonation denial, and audit-log listing.
- Admin pages for orders, products, builders, tracking, integrations, settings, and platform operations.
- Canonical form presets: `FULL`, `HYBRID`, `MIDDLE`, and `MINI`.

## Release Blockers

| Area | Status | Evidence-backed blocker |
| :--- | :--- | :--- |
| Tenant isolation / RLS | **VERIFIED LOCALLY** | Migration `0004` enables and forces RLS on 20 direct tenant tables plus `tenants`, `members`, and `invitations`. Disposable PostgreSQL tests use distinct non-owner app/platform logins and deny cross-tenant reads, writes, forged child relationships, role escalation, and unscoped access. Deployment configuration remains unverified. |
| Admin authorization | **BLOCKED / PARTIAL GUARD VERIFIED** | Default-deny API route mapping and selected negative cases pass. The tenant server layout now derives allowed route prefixes from role navigation and a six-role smoke denies direct rendering outside the visible capability set; `END_BUYER` is excluded from CMS workspace list/select. Real-session owner invitation and advertiser form creation pass on a clean database, but a complete per-role × API route × tenant × state matrix is still missing. |
| Session-derived UI access | **PARTIAL / LOCALLY VERIFIED** | Hardcoded tenant/role switching was removed. The current clean PostgreSQL chain through `0015` retains reproducible Super Admin and multi-workspace tenant fixtures. Real Chrome over the local Tailscale address verified role-separated roots, picker loading/available/unavailable states, explicit database-backed selection, sign-out, and stale-cookie recovery. T-1004 remains open for the complete role/direct-route/accessibility matrix. |
| Tenant suspension | **VERIFIED** | A real owner session can access the admin API while active and receives `403` immediately after platform suspension; the smoke restores the tenant afterward. |
| Audit immutability and completeness | **PARTIAL** | Migration `0003` installs a database trigger that rejects audit `UPDATE`/`DELETE`. Admin and platform mutations changed in this pass write actor-correct audit rows transactionally, but complete coverage and before/after/request metadata remain unfinished. |
| Super-admin impersonation | **BLOCKED / SAFE** | The insecure `imp_*` token was removed. The endpoint now requires a reason, audits the authenticated attempt, and returns `501` until signed scoped sessions, banner, expiry, revocation, and exit are implemented. |
| Super-admin provisioning | **BLOCKED** | The platform API and CMS create only a persisted tenant record. They do not provision the documented owner, organization, membership, or complete lifecycle workflow. |
| CMS persistence | **BLOCKED / PARTIAL READ-WRITE SLICES VERIFIED** | Super Admin fleet, overview, and audit plus tenant Dashboard, Orders, and Products consume persisted typed APIs. Real merchant Chrome at 1280/768/390 verified Dashboard 7/30-day data, Products list plus persisted create/edit/archive, and Members invite→resend→cancel. Media upload remains unavailable; invitation acceptance has no browser/live evidence and delivery remains `not_configured`; builders/tracking/integrations/settings remain incomplete. |
| Order lifecycle | **BLOCKED / BOUNDED SLICE VERIFIED** | Tenant-scoped list/detail expose only canonical order, payment, and fulfillment axes. Guarded processing/cancellation and dispatch use transaction locks, conditional writes, order events, and actor audit rows; unpaid prepaid processing, unsafe cancellation, foreign-tenant detail, active-queue cancellation, and implicit DLQ replay are rejected. Real merchant Chrome verified persisted list/detail and safe dispatch, including a real `409` for an already-shipped order. Refund, return/RTS, remittance, recovery, webhook parity, and the complete browser state matrix remain incomplete. |
| Provider delivery adapters | **BLOCKED / QUEUE SLICE VERIFIED** | Migration `0007` enforces one Mengantar dispatch row per tenant/order and the test-mode worker proves claim, mock completion, event, and audit behavior without a live provider call. Real production delivery to Meta, Google, TikTok, Mengantar, and AutoLaris; official provider contracts; operator DLQ recovery; and approved sandbox/live evidence remain unproven. |
| Indonesia operational correctness | **BLOCKED / PARTIAL** | Orders and Catalog declare `currency: "IDR"` and retain integer-rupiah amounts. The mounted Dashboard API reports 7/30-day `Asia/Jakarta` periods, zero-filled WIB dates, and verified 16:59:59Z/17:00:00Z boundary behavior while excluding cancelled/refunded orders from its KPI/daily totals. PostgreSQL pools now force UTC session timezone. Export parity, complete region data, COD eligibility, provider failures, WhatsApp governance, and reconciliation still require end-to-end coverage. |
| Dependency vulnerabilities | **REMEDIATED TO REVIEWED BASELINE** | Drizzle `0.45.2`, Astro `6.4.x`, Sharp `0.35.0`, and PostCSS `8.5.26` remove all high findings. The current audit reports 4 remaining findings: 2 moderate and 2 low. |
| Database coverage | **PARTIAL** | `pnpm test:clean-db` provisions an isolated tmpfs PostgreSQL 16 container with separate owner/app/platform credentials and passes migrations `0000`–`0015`, seed, RLS/provisioning, Orders, Catalog, Members, Dashboard, signed webhooks, public-order idempotency, integrations, and release smokes. Provider delivery, backup/restore, rollback, and migration-lock rehearsal remain open. |
| Browser/device coverage | **PARTIAL** | Real Tailscale Chrome covers role-separated roots, workspace selection/sign-out/stale-cookie recovery, and mobile clipping. Real merchant Chrome passed Dashboard, Orders, Products, and bounded Members flows at 1280/768/390. Dashboard rendered real 7/30-day data without fake conversion/CAPI controls. Complete six-role/device accessibility, live empty/error fixtures, Members acceptance/full role/remove, and broader forced-failure coverage remain unverified. |

## Verification Evidence — 2026-08-16

Results below describe only the command or probe executed. They must not be generalized into production readiness.

| Check | Result | Scope / limitation |
| :--- | :--- | :--- |
| `pnpm --filter @dotads/api smoke:rbac` | **PASS** | Current-worktree helper, permission-map, selected negative HTTP authorization, role-escalation, and GTIN assertions passed. This is not a complete route-by-role/database matrix. |
| `pnpm --filter @dotads/admin smoke:admin-navigation` | **PASS** | Static role-navigation assertions passed. This does not validate session-derived roles, direct-route authorization, or browser behavior. |
| Authenticated `TENANT_OWNER` invitation and `ADVERTISER` form creation | **PASS** | Both allowed mutations reached real HTTP handlers and persisted actor-correct audit rows on a clean database; selected unauthorized roles still receive `403`. |
| Active-to-suspended tenant session | **PASS** | The same authenticated owner cookie received `200` while active and `403` after suspension. |
| Register → logout → tenant email re-login | **PASS** | A fresh Better Auth session restored and persisted the only active organization; the bounded session endpoint and tenant admin route both returned `200`. A second active membership produced `409 WORKSPACE_SELECTION_REQUIRED` without mutating the session. |
| Fresh local database and development fixtures | **PASS / DEVELOPMENT ONLY** | A fresh PostgreSQL database applied migrations `0000`–`0006`, then reproducibly seeded production-disabled `admin` / `admin` as Super Admin and `merchant` / `merchant` as a multi-workspace tenant operator. These aliases are local-only and are not production credentials. |
| Live Tailscale account/workspace flow | **PASS / DEVELOPMENT ONLY** | Real Chrome verified Super Admin → `/super-admin`, merchant → workspace picker, three picker states, explicit database-backed selection → `/admin`, sign-out → `/login`, and stale-cookie recovery. The initial sign-out `415` was traced to a missing JSON content type/body and passed after the request contract was corrected. |
| Explicit multi-workspace selection | **PASS / LOCAL INTEGRATED FLOW** | Migration `0006`, authenticated workspace routes, client smokes, clean-database checks, and real browser interaction prove bounded own-membership listing, required `organizationName`, exclusion of `END_BUYER`, rejection of forged/inactive selections, and persistence to the same user's current session. |
| `pnpm --filter @dotads/admin smoke:admin-route-access` | **PASS** | The six-role matrix covers allowed, denied, nested, and prefix-boundary paths. This UI guard does not replace API authorization or complete the per-role/API route matrix. |
| Super Admin tenant fleet client smoke | **PASS** | Validated list/create/status request shapes, same-origin credentials, API errors, and malformed payload rejection. |
| Super Admin stats/audit client smoke | **PASS** | Typed stats and bounded audit envelope parsing, exact request filters, malformed response rejection, and `securityAlertsCount: null` passed. |
| Super Admin overview/audit Chrome at 1280/390 | **PASS / READ-ONLY SCOPE** | Real platform statistics, tenant data, and bounded audit events rendered without horizontal overflow. Settings stayed unavailable and export/retention/integrity controls were not simulated. |
| Full `NODE_ENV=test pnpm test` on the current worktree | **PASS** | Integration contracts and all configured repository smoke chains passed. The release-smoke output now explicitly states that it is not deployment certification. |
| Full `pnpm build` on the current worktree | **PASS** | Turborepo completed 5/5 tasks; Next generated 28 routes and Astro generated 2 routes. Build success does not prove production behavior. |
| `pnpm --filter @dotads/integrations test` | **PASS** | Three narrow contract checks passed for integer-rupiah identity, same-millisecond order-number uniqueness, and Indonesian phone normalization. |
| `pnpm --filter @dotads/api smoke:catalog` and `pnpm --filter @dotads/admin smoke:catalog-products` | **PASS** | Tenant isolation, role read/write boundaries, persisted create/update/archive, GTIN/SKU/price constraints, stale-write handling, malformed client responses, audit snapshots, and checkout/catalog interleaving passed. |
| Real merchant Chrome `/admin/products` at 1280/768/390 | **PASS / BOUNDED SCOPE** | Persisted list, create, edit, archive, reload, and responsive card/table behavior passed with zero reported overflow, network, runtime, or console errors. File upload stayed disabled and no media-delivery workflow was claimed. |
| `pnpm --filter @dotads/api smoke:member-invitations` and `pnpm --filter @dotads/admin smoke:admin-members` | **PASS / BACKEND + CLIENT** | Typed list/invite/resend/cancel/role/remove contracts, tenant scope, pending-invite uniqueness, owner/self guards, audit writes, exact errors, `delivery: "not_configured"`, and malformed-response rejection passed. |
| Members Chrome at 1280/768/390 | **PASS / BOUNDED SCOPE** | Persisted invite→resend→cancel passed. Invitation acceptance and the complete role-update/removal/accessibility matrix were not browser-verified. |
| `pnpm --filter @dotads/api smoke:invitation-acceptance` inside the clean gate | **PASS / LOCAL BACKEND** | Migration `0012` covered real-session and normalized-email binding, forged/cross-site/wrong-email denial, expired/cancelled/rejected/inactive/invalid-role denial, idempotent membership/session selection, and one audit row. No live delivery or browser acceptance was exercised. |
| `pnpm --filter @dotads/api smoke:dashboard` plus real merchant Chrome at 1280/768/390 | **PASS / BOUNDED API + UI** | API checks cover tenant isolation, permission denial, exact envelopes, 7/30 validation, zero buckets, WIB boundary, cancelled/refunded exclusion, UTC pools, and exact keys. Chrome rendered real 7-day totals, switched to 30 days with 30 fallback-table rows, had zero overflow/runtime/console errors, and omitted fake CAPI/conversion/sync/export controls. Live empty/error fixtures and dedicated tab-order automation remain unverified. |
| `pnpm test:clean-db` | **PASS** | A disposable PostgreSQL 16 tmpfs container completed migrations `0000`–`0015`, seed, least-privilege/RLS/provisioning checks, Orders, Catalog, Members, Dashboard, signed webhooks, public-order idempotency twice, integrations, and the release-smoke chain; the container was removed automatically. This does not prove provider delivery or production migration lock duration. |
| RLS adversarial gate inside `pnpm test:clean-db` | **PASS** | Forced policies cover 20 direct tenant tables plus `tenants`, `members`, and `invitations`; app/platform roles are distinct non-owner logins, and cross-tenant reads/writes/parent forgery and role escalation are denied. |
| Chrome validation at 1280, 768, and 390 px | **PASS / PARTIAL SCOPE** | Existing admin/storefront matrices retained zero overflow. A real Super Admin session loaded the API-backed tenant fleet at 1280/390 with a distinct platform shell. A production-build fixture verified picker selection, disabled inactive state, 403 retry, malformed-409 recovery, and switch-account success/failure at 1280/390. Complete database-backed six-role persistence/a11y remains unverified. |
| `pnpm docs:check` | **PASS** | 17 canonical owners, 22 controlled mirrors, 87 unique requirements, and 30 permanent tasks passed ownership/traceability checks. |
| OpenAPI export/snapshot comparison | **PASS** | Runtime export and byte-identical root/`docs/` snapshots contain 48 paths. JSON assertions verify the public Orders `Idempotency-Key` header and both webhook paths. This is contract parity, not provider delivery evidence. |
| Admin `:3100` hydration recovery | **PASS / DEVELOPMENT ONLY** | `/login` HTML was `200` while four referenced Next chunks were `404`, identifying a stale/internally inconsistent dev output/process. A graceful process-group termination and Next dev restart—without deleting `.next`—restored all six referenced JS/CSS assets to `200`; real Chrome then verified hydrated login, local Super Admin navigation/API reads, sign-out, zero overflow, and zero console/runtime/non-2xx resource errors. This is not a production deployment check. |
| Production provider delivery or deployment | **UNVERIFIED** | No live action was authorized or performed. |
| `pnpm audit --prod --audit-level high` | **PASS AT HIGH THRESHOLD** | 4 findings remain: 2 moderate and 2 low; no high findings remain after coordinated dependency upgrades. |

## Release Exit Criteria

Production readiness may be reconsidered only after:

1. `TASKS.md` release blockers are implemented and individually verified.
2. Authorization and tenant isolation are tested through real HTTP routes and database policies, including negative cross-role and cross-tenant cases.
3. CMS workflows persist through the API and database with honest loading, empty, error, retry, and partial-failure states.
4. Order, payment, fulfillment, COD, shipping, and reconciliation transitions share one enforced lifecycle contract.
5. Audit entries are complete, actor-correct, transactional, and append-only.
6. Provider adapters have non-live contract tests and authorized staging evidence; production validation remains a separate approval-gated activity.
7. Dependency audit, clean-database suite, full build/test, and browser/device matrix all pass on the same reviewed revision.
