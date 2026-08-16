# DotAds Engine v2 — Build and Verification Evidence Log

This file records observed evidence. A historical pass applies only to the revision and scope tested at that time; it is not a standing production-readiness claim.

## Historical Repository Record — 2026-08-14 to 2026-08-15

Earlier versions of this log reported successful smoke suites, package builds, static route generation, and release-smoke checks while the project foundation, form presets, Super Admin pages, provider boundaries, and storefront were being assembled.

The 2026-08-16 audit showed that those checks were narrower than their former descriptions implied. In particular:

- helper-level RBAC checks did not exercise permissions on real admin routes;
- navigation checks did not prove session-derived roles or direct-route authorization;
- insert/read audit checks did not prove database-enforced immutability or mutation coverage;
- UI builds did not prove persistence, real provider delivery, browser behavior, or failure recovery;
- platform route checks did not prove atomic owner/organization provisioning or secure impersonation;
- release smoke checks did not prove RLS, clean-database behavior, dependency safety, or production readiness.

Historical command output is not reclassified as a failure, but prior “complete,” “fully verified,” “immutable,” “synced,” and production-ready conclusions are withdrawn. The current release status is maintained in `STATUS.md`.

## Evidence Entry — 2026-08-16: Product, RBAC, Menu, and Control-Plane Audit

### Scope

Read-only inspection covered repository guidance, product/status/task documents, authentication and permission code, database schemas, API mounts and routes, admin middleware/layouts/navigation/pages, Super Admin contracts, orders, member invitations, Indonesia-market operations, and the existing smoke scripts.

No secrets were read, no live services were called, no production action was performed, and no database mutation was intentionally executed by this audit.

### Executed Checks

| Command or probe | Result | Interpretation |
| :--- | :--- | :--- |
| `pnpm --filter @dotads/api smoke:rbac` | **PASS** | On the current worktree, helper, permission-map, selected negative HTTP authorization, role-escalation, and GTIN assertions passed. It is not a complete route-by-role/database matrix. |
| `pnpm --filter @dotads/admin smoke:admin-navigation` | **PASS** | Static role-navigation item assertions passed. The script does not launch a browser or validate server sessions and direct URLs. |
| Pre-remediation test-mode `TENANT_OWNER` request to `POST /api/v1/admin/members/invite` with a valid invitation body | **FAIL** — HTTP `403` | Exposed permission-vocabulary drift. The current worktree maps the route to `members:create`; the allowed database mutation remains unverified. |
| Pre-remediation test-mode `ADVERTISER` request to `POST /api/v1/admin/forms` with a contract-valid form body | **FAIL** — HTTP `403` | Exposed permission-vocabulary drift. The current worktree maps the route to `builders:update`; the allowed database mutation remains unverified. |

### Static Findings Confirmed During the Audit

- Root and `docs/` copies of `STATUS.md` and `TASKS.md` had diverged before this correction.
- The platform API is mounted at `/api/v1/platform/*`; older `/api/platform/*` documentation was incorrect.
- No platform settings API routes were registered.
- Platform tenant creation accepted no owner email and created only a tenant row, not the documented owner/organization/membership unit.
- The impersonation handler returned a generated `imp_*` value rather than a signed or persisted impersonation session.
- Multiple CMS and Super Admin pages used hardcoded arrays or client-local mutations.
- The current worktree now contains a default-deny admin permission map and mobile bottom navigation. Comprehensive authorization, database, browser, audit, order-cleanup, and tenant-suspension evidence remains missing.

### Checks Not Run in This Documentation Pass

| Gate | Result |
| :--- | :--- |
| Full current-worktree `pnpm test` | **UNVERIFIED** |
| Full current-worktree `pnpm build` | **UNVERIFIED** |
| Clean-database migrations and integration suite | **UNVERIFIED** |
| Database RLS/adversarial tenant-isolation suite | **UNVERIFIED** |
| Dependency vulnerability audit | **UNVERIFIED** |
| Browser desktop/tablet/mobile and accessibility matrix | **UNVERIFIED** |
| Non-live provider contract/sandbox suite | **UNVERIFIED** |
| Production deployment or provider delivery | **UNVERIFIED** — not authorized or attempted |

### Documentation Correction

- Replaced completion percentages and production-ready claims with an evidence-based release status.
- Rebuilt `TASKS.md` around release blockers and explicit runnable completion criteria.
- Corrected the Super Admin base path and separated current implementation truth from target provisioning and impersonation contracts.
- Synchronized root documents and their existing `docs/` mirrors byte-for-byte.

## Evidence Entry — 2026-08-16: Remediation and Integrated Verification

### Implemented Scope

- Added fail-closed production authentication/database/provider configuration, explicit admin route permissions, bounded request contracts, signed Mengantar webhook verification, and safer platform audit actors.
- Made public order pricing and stock server-authoritative and tenant-scoped; added atomic stock deduction, collision-resistant order numbers, soft cancellation for eligible unpaid orders, and payment/delivery-triggered conversion events.
- Canonicalized IDR as integer rupiah and removed premature browser-side Purchase emission.
- Added responsive admin mobile navigation, Indonesian/WIB dashboard presentation, and a product-first responsive storefront with a generated fictional demo product asset.
- Replaced silent outbox success with retry/failure behavior when provider delivery adapters are not configured. Real Meta, Google, and TikTok delivery remains a release blocker.

### Executed Checks

| Command or check | Result | Scope / limitation |
| :--- | :--- | :--- |
| `NODE_ENV=test pnpm test` | **PASS** | All configured repository smoke chains passed. The legacy release-smoke banner overstates its coverage and is not a release certification. |
| `pnpm build` | **PASS** | Turborepo 5/5 tasks; Next generated 28 routes; Astro generated 2 routes. |
| `pnpm --filter @dotads/integrations test` | **PASS** | 3/3 narrow money, order-number, and phone-normalization contract tests. |
| `pnpm --filter @dotads/api smoke:rbac` | **PASS** | Permission helpers, route policy mapping, selected negative requests, role escalation, and GTIN assertions. |
| `pnpm --filter @dotads/admin smoke:admin-navigation` | **PASS** | Static navigation contract only. |
| Chrome CDP matrix at 1280/768/390 px | **PASS** | Admin, Super Admin, storefront, and thank-you shells: zero page overflow, expected mobile-nav visibility, storefront hydration, and scoped role-fixture links. Auth/session/persistence/failure flows remain unverified. |
| `pnpm audit --prod --audit-level high` | **FAIL / BLOCKED** | 15 findings total, 6 high, including Drizzle ORM, Astro, Sharp, and PostCSS advisories. No coordinated major upgrade was attempted in this pass. |
| `git diff --check` | **PASS** | No whitespace errors after integration. |

### Deliberately Unverified or Unchanged

- No production deployment, live provider call, secret access, remote database write, commit, or push was performed.
- PostgreSQL RLS, server-derived CMS roles, complete audit coverage, secure impersonation, complete provisioning, persistent CMS workflows, and full provider adapters remained open after this first pass.

## Evidence Entry — 2026-08-16: Clean-Database and Dependency Hardening Continuation

### Implemented Scope

- Added `pnpm test:clean-db`, which launches PostgreSQL 16 in an isolated tmpfs container on an ephemeral localhost port, migrates, seeds, executes DB smokes and the full suite, and removes the container through a shell trap.
- Fixed clean seed failure caused by a removed `productMedia` schema reference; product image paths now use `products.imagesJson`. Seeded users now carry their intended global roles, and seeded outbox rows no longer claim fake delivery.
- Added migration `0003_immutable_audit_log.sql`; database triggers reject audit `UPDATE` and `DELETE`, and the smoke verifies both rejection and record preservation.
- Made tenant create/status business writes and audit rows atomic, required a status reason, and enforced suspended/cancelled tenant denial against an existing authenticated session.
- Added transactional audit rows for member invitations, domains, builder creation/publication, and order cancellation paths.
- Removed the insecure `imp_*` impersonation response. The endpoint validates tenant/reason, records the authenticated attempt, and returns `501` until secure scoped sessions exist.
- Restricted CORS to configured origins with local development defaults; unknown origins are denied.
- Upgraded Drizzle ORM to `0.45.2`, Astro to `6.4.x`, Sharp to `0.35.0`, and PostCSS to `8.5.26`. Drizzle wrapped-error handling was updated without weakening PostgreSQL error assertions.
- Added an executable RLS audit that deliberately fails until tenant-owned tables have enabled and forced database policies.

### Executed Checks

| Command or check | Result | Scope / limitation |
| :--- | :--- | :--- |
| `pnpm test:clean-db` | **PASS** | Fresh PostgreSQL 16 tmpfs container: migration, seed, tenant/provision smokes, integration contracts, all API smokes, and release smoke passed; container removed automatically. RLS is a separate failing gate. |
| `pnpm build` | **PASS** | 5/5 Turborepo tasks; Next 28 routes and Astro 6.4.x 2 routes. |
| `pnpm audit --prod --audit-level high` | **PASS AT HIGH THRESHOLD** | 4 findings remain: 2 moderate and 2 low; zero high findings. |
| `pnpm --filter @dotads/db audit:rls` | **FAIL / BLOCKED** | Lists 20 tenant-owned tables without enabled and forced PostgreSQL RLS. |
| Authenticated owner/advertiser mutations | **PASS** | Real owner cookie created an invitation; the same fixture with advertiser membership created a form; both emitted audit rows. |
| Active-to-suspended session | **PASS** | Same owner cookie: `200` while active, `403` after suspension, then fixture restoration. |
| Audit mutation attempts | **PASS** | Direct `UPDATE` and `DELETE` were rejected by PostgreSQL and the original row remained unchanged. |
| Chrome CDP matrix after Astro/Sharp upgrade | **PASS** | 1280/768/390 px admin, Super Admin, storefront, and thank-you shells retained zero overflow, expected hydration/navigation, and no runtime/network failures. |

### Environment Safety

- The existing `dotads_postgres` container and persistent `dotads_postgres_data` volume were not changed or removed.
- Only disposable audit containers and their tmpfs test data were stopped and removed.
- No production deployment, live provider call, secret access, remote database write, commit, or push was performed.

## Evidence Entry — 2026-08-16: RLS, Session-Derived CMS Access, and Specification Ownership

### Implemented Scope

- Added migration `0004_tenant_rls.sql` with forced tenant policies, organization-scoped membership/invitation policies, child-parent tenant checks, fixed-search-path resolvers, and revoked public function access.
- Split database credentials into owner-only migration, non-owner tenant runtime, and non-owner platform-control logins. Runtime checks reject superuser, `BYPASSRLS`, table ownership, shared logins, and role escalation.
- Added transaction-local database context and applied it to authenticated admin/platform requests, public tenant operations, provisioning, and authenticated provider webhook reconciliation.
- Added bounded `GET /api/v1/session`; admin and platform layouts now derive tenant/role/status from the server, remove fake selectors, redirect cross-workspace access, and fail closed when session context is unavailable.
- Consolidated root documentation ownership, preserved 87 permanent requirements, created `T-1001`–`T-1030`, added architecture/data/IAM/security/privacy/billing/observability/release owners, classified historical reports, and regenerated the 33-path OpenAPI snapshot.
- Corrected the release smoke to enter explicit platform/tenant database contexts. Mengantar test mode no longer makes a network request before returning its explicit test fixture.

### Executed Checks

| Command or check | Result | Scope / limitation |
| :--- | :--- | :--- |
| `pnpm test:clean-db` | **PASS** | Disposable PostgreSQL 16: clean migration/seed; separate owner/app/platform logins; 20 direct tenant tables plus `tenants`, `members`, and `invitations`; cross-tenant read/write/parent-forgery and role-escalation denial; provisioning; integration/API/release smokes. Container removed. |
| `pnpm build` | **PASS** | 5/5 Turborepo tasks; Next 28 routes (protected workspaces dynamic), Astro 2 pages, API TypeScript green. |
| `pnpm audit --prod --audit-level high` | **PASS AT HIGH THRESHOLD** | 4 findings remain: 2 moderate and 2 low; zero high findings. |
| `pnpm docs:check` | **PASS** | 17 canonical owner documents, 22 controlled root/docs mirrors, 87 unique `REQ-*`, and 30 unique `T-*` with exactly one primary requirement or verification target. |
| Session/navigation smokes | **PASS** | Session payload validation and six-role navigation configuration passed. |
| Chrome session matrix | **PASS / PARTIAL SCOPE** | ADMIN 1280/768/390, SUPER_ADMIN 390, cross-workspace redirects, unavailable-session recovery, and zero overflow passed against a local contract stub. Real-session logout/a11y/persistence remain open. |
| OpenAPI export comparison | **PASS** | Runtime-generated 33-path JSON equals committed root and `docs/` `openapi.yaml` snapshots (JSON is valid YAML 1.2). |
| `git diff --check` | **PASS** | No whitespace errors. |

### Release Decision

Release remains **NO-GO**. Database tenant isolation is locally verified, but persistent CMS workflows, complete authorization/lifecycle matrices, provider contract/sandbox evidence, privacy/retention decisions, observability/runbooks, deployment role wiring, backup/restore, rollback, and authorized staging evidence remain incomplete.

## Evidence Entry — 2026-08-16: Admin and Platform Workspace Separation

### Implemented Scope

- Added migration `0005_session_workspace_resolution.sql`. A fresh non-platform Better Auth session recovers and persists exactly one active membership; multiple active memberships return bounded `409 WORKSPACE_SELECTION_REQUIRED` without selecting or exposing a tenant.
- Replaced unconditional root dispatch with validated session/role dispatch and kept stale-cookie auth pages reachable.
- Split the platform control plane into dedicated `PlatformShell` and `PlatformSidebar`; Super Admin no longer consumes tenant status or tenant navigation.
- Replaced the Super Admin tenant fleet's local array and simulated mutations with validated same-origin platform API list/create/status requests, explicit partial-provisioning copy, loading/empty/error/retry states, and fail-closed impersonation copy.
- Applied migration `0005` to the task-owned disposable development PostgreSQL container. No persistent or remote database was changed.

### Executed Checks

| Command or check | Result | Scope / limitation |
| :--- | :--- | :--- |
| `pnpm test:clean-db` | **PASS** | Fresh PostgreSQL migrations through `0005`, RLS, provisioning, integrations, RBAC, invitations, domains, immutable audit, platform, public-auth re-login/multi-workspace, and release smoke; ephemeral container removed. |
| `pnpm --filter @dotads/api build` | **PASS** | API/session resolver integration compiled. |
| `pnpm --filter @dotads/admin smoke:session-context` | **PASS** | Bounded seven-field session parser. |
| `pnpm --filter @dotads/admin smoke:admin-navigation` | **PASS** | Six-role navigation configuration. |
| `pnpm --filter @dotads/admin smoke:platform-tenants` | **PASS** | Platform tenant list/create/status shapes, credentials, API errors, and malformed responses. |
| Next production builds | **PASS** | Agent-isolated and current-worktree builds generated all 28 routes without sharing a live `.next` writer. |
| Real-session HTTP probes | **PASS** | Tenant re-login session `200`; role-aware root dispatches Super Admin directly to `/super-admin` and owner directly to `/admin`; platform fleet API/UI `200`. |
| Chrome real-session fleet at 1280/390 | **PASS / PARTIAL SCOPE** | Persisted tenant records rendered in the distinct platform shell with zero page overflow. Full six-role accessibility and persisted browser mutation matrix remain open. |
| `git diff --check` and `pnpm docs:check` | **PASS** | No whitespace drift; canonical owners and compatibility mirrors remain consistent. |

### Release Decision

Release remains **NO-GO**. This closes the observed admin/Super Admin collision and one Super Admin persistence slice; complete provisioning, secure impersonation, the remaining CMS persistence work, full authorization/device coverage, provider evidence, and release operations remain open.

## Evidence Entry — 2026-08-16: Explicit Workspace Selection and Local Account Entry

### Implemented Scope

- Added migration `0006_workspace_selection.sql` with a bounded own-membership list and same-user/current-session explicit selection of an active tenant workspace.
- Added authenticated `/api/v1/workspaces` list and `/api/v1/workspaces/select` routes. The list contract requires exact `organizationName` context; foreign, inactive, or unavailable selection fails closed.
- Added exact `WORKSPACE_SELECTION_REQUIRED` client handling and a workspace picker that returns to `/` for server-derived role dispatch after selection.
- Added shared switch-account entry points to the tenant and platform shells with pending, success, and retryable failure states.
- Recorded development-only account-entry boundaries: `admin` / `admin` is an explicit local convenience confirmed by the user as working in the current development environment; the `merchant` alias requires `pnpm --filter @dotads/api dev:seed-auth` and an environment-backed `DOTADS_DEV_TENANT_PASSWORD` of at least eight characters. Neither path is supported or permitted as a production credential contract.

### Executed Checks

| Command or check | Result | Scope / limitation |
| :--- | :--- | :--- |
| `pnpm test:clean-db` | **PASS** | Fresh PostgreSQL migrations through `0006`; own-workspace listing; forged-selection denial; explicit selection persisted and restored canonical session context; remaining configured clean-database checks passed; ephemeral container removed. |
| `pnpm --filter @dotads/api build` | **PASS** | Workspace route and migration-facing API integration compiled. |
| `pnpm --filter @dotads/admin smoke:session-context` | **PASS** | Exact `409 WORKSPACE_SELECTION_REQUIRED` and malformed-conflict handling passed. |
| `pnpm --filter @dotads/admin smoke:workspace-selection` | **PASS** | Client list/select contract, required organization context, and denial handling passed. |
| `pnpm --filter @dotads/admin smoke:admin-navigation` | **PASS** | Static role-navigation assertions passed; this is not browser or direct-route authorization evidence. |
| `pnpm --filter @dotads/admin build` | **PASS** | Next production build generated 28 routes. |
| Chrome production-build fixture at 1280/390 | **PASS / PARTIAL SCOPE** | Picker active selection, disabled inactive choice, 403 retry, malformed `409` recovery, and tenant/platform switch-account pending/success/failure states passed with zero horizontal overflow. The fixture used the canonical API contract; a browser flow spanning the database-backed API and stale-cookie recovery remains unverified. |
| Live local Tailscale role dispatch | **PASS / DEVELOPMENT ONLY** | The local Super Admin session resolved `/` to `/super-admin` (`200`), and a separate merchant session resolved `/` to `/admin` (`200`). Response bodies, cookies, and tokens were not recorded. |

### Release Decision

Release remains **NO-GO**. Explicit selection closes a server/API/client/browser-fixture boundary slice, not the complete account-access matrix. T-1004 remains open pending database-backed browser recovery, stale-cookie evidence, and full role, route, tenant-state, device, and accessibility coverage.

## Evidence Entry — 2026-08-16: Integrated Local Account, Workspace, and Direct-route Verification

### Implemented Scope

- Made the development auth seed reproducible for two production-disabled aliases: `admin` / `admin` as Super Admin and `merchant` / `merchant` as a multi-workspace tenant operator. The seed requires environment-backed passwords and refuses production.
- Restricted migration `0006`, the workspace API contract, and the admin parser to CMS operator roles; `END_BUYER` is not a selectable CMS workspace.
- Corrected the Better Auth sign-out request to send JSON content type and body. This resolves the observed `415 Unsupported Media Type` root cause rather than masking the failure.
- Added a tenant direct-route presentation guard derived from current role navigation. Middleware supplies a canonical pathname only; the server layout performs the role decision after validated session resolution, and API authorization remains independent.
- Corrected mobile workspace-card clipping for long organization and tenant names with bounded flex sizing. No visual redesign was introduced.

### Executed Checks

| Command or check | Result | Scope / limitation |
| :--- | :--- | :--- |
| Fresh local PostgreSQL migration and seed | **PASS / DEVELOPMENT ONLY** | Applied migrations `0000`–`0006`; seeded the reproducible Super Admin and multi-workspace merchant fixtures; production paths remained disabled. |
| Real Chrome over local Tailscale | **PASS / DEVELOPMENT ONLY** | Verified Super Admin and merchant role-separated roots, picker loading/available/unavailable states, explicit database-backed workspace selection, sign-out to `/login`, stale-cookie recovery, and the mobile long-name clipping correction. This is local evidence, not staging or production certification. |
| Sign-out `415` regression | **PASS** | The failure was reproduced, traced to the missing JSON request contract, corrected, and rechecked through the real browser flow. |
| `pnpm --filter @dotads/admin smoke:sign-out` | **PASS** | The helper sends same-origin POST with JSON content type/body and preserves non-OK responses for retryable UI handling. |
| `pnpm --filter @dotads/admin smoke:admin-route-access` | **PASS** | Six-role allowed/denied matrix plus nested and prefix-boundary paths passed. This does not replace API authorization. |
| `pnpm --filter @dotads/admin smoke:admin-navigation` | **PASS** | Existing role-navigation assertions still passed. |
| `pnpm --filter @dotads/admin build` | **PASS** | Next generated 28 routes after removing the accidental auth/database runtime import from middleware. |
| Live production-build `/login` and unauthenticated `/admin` probe | **PASS** | `/login` returned `200`; `/admin` returned `307` to `/login`, confirming the pure middleware boundary after the import fix. |

### Remaining Blockers

- T-1004 and T-1028 remain open for complete role, direct-route, device, and accessibility browser coverage.
- The complete per-role × API route × tenant × lifecycle-state authorization matrix remains missing.
- Tenant CMS workflows remain largely synthetic or client-local. Super Admin overview, settings, and global audit are also synthetic, and platform statistics retain a hardcoded security-alert value.
- Complete provisioning, secure impersonation, provider delivery, privacy/retention decisions, backup/restore, rollback, and authorized staging evidence remain open.

### Release Decision

Release remains **NO-GO**. The integrated local flow closes the observed account/workspace collision and specific routing regressions, not the remaining product, authorization, operational, or production gates.

## Evidence Entry — 2026-08-16: Super Admin Read-only Truth Slice

### Implemented Scope

- Replaced permissive platform tenant/statistics/audit response shapes with typed server and client contracts.
- Made `securityAlertsCount` explicitly `null` instead of reporting a synthetic security count before an audit classification exists.
- Bounded platform audit reads to `limit` 1–100 and `offset` 0–10,000 with optional exact `tenantId`, `action`, and `actorId` filters. The response is `{ items, pagination }` and deliberately omits metadata, IP, severity, before/after, retention, and integrity claims.
- Wired the Super Admin overview and global audit page to real read APIs with loading, empty, error, retry, filtering, and pagination states.
- Replaced simulated platform configuration, audit export, retention, backup, region, encryption, and integrity behavior with honest unavailable/disabled states.

### Executed Checks

| Command or check | Result | Scope / limitation |
| :--- | :--- | :--- |
| `pnpm --filter @dotads/api smoke:platform` | **PASS** | Typed tenants/stats responses, `securityAlertsCount: null`, bounded audit filters/pagination, selected-field envelope, invalid limit rejection, tenant lifecycle, and fail-closed impersonation passed. |
| `pnpm --filter @dotads/admin smoke:platform-observability` | **PASS** | Typed stats/audit parsing, exact filtered request construction, and malformed payload rejection passed. |
| Chrome Super Admin overview and audit at 1280/390 | **PASS / READ-ONLY SCOPE** | Real overview totals, tenant rows, bounded audit events, loading/empty/error behavior, pagination, and zero horizontal overflow passed. Settings remained unavailable and export was disabled. |

### Remaining Blockers

- Platform settings read/write contracts, full owner/organization/membership provisioning, and secure impersonation remain unavailable.
- Audit completeness, classification, metadata, export governance, retention, and production operations remain unresolved.
- Tenant CMS data and mutations remain largely synthetic or client-local.

### Release Decision

Release remains **NO-GO**. This verifies a bounded Super Admin read slice; it does not complete platform governance, tenant workflows, authorization coverage, provider delivery, or release operations.

## Evidence Entry — 2026-08-16: Tenant Orders Backend Slice

### Implemented Scope

- Added typed, bounded, tenant-scoped Orders list/detail contracts with canonical `status`, `paymentStatus`, and `fulfillmentStatus` axes, explicit `currency: "IDR"`, integer-rupiah amounts, offset-bearing instants, and minimized list PII.
- Added guarded, idempotent processing and cancellation transitions with per-tenant/order transaction locking, conditional writes, order events, and before/after audit metadata.
- Added asynchronous dispatch enqueue and a test-mode Mengantar worker path. Migration `0007_unique_dispatch_queue_order.sql` rejects existing duplicate tenant/order queue rows and enforces one mutable queue row per tenant/order.
- Removed Orders read/update authority from `ADVERTISER`; `TENANT_OWNER`, `ADMIN`, and `CUSTOMER_SERVICE` retain the observed merchant Orders permissions. Foreign-tenant detail fails as not found.
- Kept provider calls outside the API request. The verified path uses an explicit test waybill and is not Mengantar sandbox, live-provider, or browser evidence.

### Executed Checks

| Command or check | Result | Scope / limitation |
| :--- | :--- | :--- |
| `pnpm --filter @dotads/integrations test` | **PASS** | Three contract tests cover integer-rupiah IDR without 100× conversion, collision-resistant order numbering, and Indonesian phone normalization. |
| `pnpm --filter @dotads/api smoke:rbac` | **PASS** | Six-role assertions include `ADVERTISER` Orders-read denial and selected route permission checks; this is not the complete route/state matrix. |
| `pnpm --filter @dotads/admin smoke:admin-orders` | **PASS** | Typed list/detail parsing, IDR/integer rejection, filter construction, JSON dispatch body, conflict preservation, and cancellation request shape passed. This is client-contract evidence, not browser evidence. |
| `pnpm test:clean-db` | **PASS** | Disposable PostgreSQL 16 applied migrations `0000`–`0007`, seeded, passed RLS/provisioning/integration/API/release checks, and removed the container. Its Orders smoke covered tenant privacy, canonical axes, bounded filters, guarded/idempotent transitions, queue uniqueness/idempotency, active-dispatch cancellation denial, explicit DLQ recovery requirement, test-worker completion, and order/audit events. |
| Standalone `pnpm --filter @dotads/api smoke:orders` against the pre-existing local database | **UNVERIFIED / ENVIRONMENT REJECTED** | The smoke correctly refused an unsafe local platform DB role. The same smoke passed inside `pnpm test:clean-db` with distinct non-owner credentials; no product failure is inferred from the rejected local environment. |
| Real merchant Chrome `/admin/orders` at 1280/768/390 | **PASS / BOUNDED SCOPE** | Persisted list plus `ORD-ALPHA-1001` detail passed with zero overflow, network, runtime, or console errors. Tablet overflow was found and corrected by switching the dense table/card breakpoint to `xl`. |
| Development-safe dispatch and reload | **PASS / NON-LIVE** | Dispatch queued and remained `pending` with `attempts: 0` and `DISPATCH_QUEUED` after reload. No synthetic cnote or provider call occurred. Shipped `ORD-ALPHA-1002` returned the real API `409`. |
| Orders empty/error/no-results browser states | **UNVERIFIED** | These states were not forced in the real browser session; their presence in code is not recorded as runtime proof. |
| Real merchant Chrome `/admin` at 1280/390 | **PASS / BOUNDED SCOPE** | Expected headings rendered with zero overflow; this does not validate the remaining CMS workflows. |

### Remaining Blockers

- T-1012 remains open for refund, return/RTS, remittance, webhook parity, recovery, and complete UI lifecycle coverage.
- T-1016 remains open for official Mengantar contract validation, approved sandbox/provider evidence, region/COD failure coverage, operator recovery, and WhatsApp governance.
- T-1021 and T-1022 remain open because the verified Orders slice does not cover empty/error/no-results, complete tenant denial, all mutations, or other tenant CMS surfaces that remain synthetic or client-local.
- UTC/WIB business-day boundary parity, exports, reconciliation, and the complete six-role × route × tenant × state authorization matrix remain unverified.

### Release Decision

Release remains **NO-GO**. This verifies a bounded Orders backend, queue, worker, and audit slice on a disposable database; it is not complete commerce operations, provider acceptance, browser validation, or production certification.

## Evidence Entry — 2026-08-16: Catalog, Members, and Tenant Dashboard Slices

### Implemented Scope

- Added migrations `0008_catalog_invariants.sql`, `0009_unique_pending_invitation_email.sql`, `0010_monotonic_catalog_updated_at.sql`, and `0011_dashboard_tenant_created_at_index.sql`. A later coordinated clean gate also applied `0012_accept_tenant_invitation.sql`.
- Added a tenant-scoped Catalog API and strict admin client for persisted list/detail/create/update/archive. Product and primary-variant writes are transactional, stale writes return a bounded `409 STALE_WRITE`, and create/update/archive audit rows contain bounded before/after mutable-field snapshots.
- Hardened Catalog/checkout concurrency with one sorted product-then-variant lock order and post-shipping-rate revalidation. The interleaving fixture mutates Catalog while rate lookup is held, rejects stale checkout, and proves concurrent checkout/PATCH completion without deadlock, lost decrement, or stock resurrection.
- Added `/api/v1/members` list/invite/resend/cancel/role/remove and the strict same-origin admin client. Delivery is explicitly `not_configured`. Migration `0012` and `/api/v1/invitations/{id}/accept` add locally verified real-session/email-bound acceptance; no browser/live acceptance or delivery was claimed.
- Added mounted `/api/v1/dashboard` with strict typed success/error envelopes, tenant-only `orders:read`, 7/30-day WIB periods, IDR integer aggregates, zero-filled dates, and canonical order/payment/fulfillment breakdowns. KPI and daily totals exclude order states `CANCELLED` and `REFUNDED`; the current Dashboard UI remains synthetic until wired.
- Configured every postgres.js app/platform/migration pool with the supported native `TimeZone=UTC` startup parameter. The Dashboard smoke executes `show timezone` on all three pools.
- Added PATCH to the API CORS method set. Development combines localhost/127.0.0.1 with configured origins; production remains configured-only.

### Executed Checks

| Command or check | Result | Scope / limitation |
| :--- | :--- | :--- |
| `pnpm --filter @dotads/api build` | **PASS** | Catalog, Members, Dashboard, mounted routing, and strict OpenAPI contracts compiled. |
| `pnpm --filter @dotads/integrations build` | **PASS** | Checkout revalidation and lock-order changes compiled. |
| `pnpm --filter @dotads/api smoke:catalog` | **PASS** | Tenant isolation, child ownership, canonical IDR/catalog fields, permission denial, create/update/archive, uniqueness/check constraints, stale writes, complete mutation audit snapshots, and checkout/Catalog concurrency interleaving passed. |
| `pnpm --filter @dotads/admin smoke:catalog-products` | **PASS** | Strict parsing, same-origin mutations, exact IDR/integer/instant/GTIN boundaries, optimistic token propagation, archive body, and bounded stale-conflict recovery passed. |
| Trusted-origin/CORS smoke inside `pnpm test:clean-db` | **PASS** | Trusted PATCH preflight returned `204` and advertised PATCH; attacker origin received no allow-origin. This is local contract evidence, not deployment evidence. |
| Real merchant Chrome `/admin/products` at 1280/768/390 | **PASS / BOUNDED SCOPE** | Persisted list, create, edit, archive, and reload passed with responsive `xl` table/cards and zero reported overflow, network, runtime, or console errors. File upload remained disabled and honestly labelled unavailable. |
| `pnpm --filter @dotads/api smoke:member-invitations` | **PASS / BACKEND SCOPE** | Tenant/organization scope, list/invite/resend/cancel/role/remove, expired/reused transition guards, pending-email uniqueness, self/last-owner safety, and transactional audit evidence passed. No acceptance endpoint or email delivery was claimed. |
| `pnpm --filter @dotads/admin smoke:admin-members` | **PASS / CLIENT SCOPE** | Exact lifecycle paths/methods/bodies, credentials, strict enums/instants/envelopes, `delivery: "not_configured"`, `400/403/404/409`, and malformed-response rejection passed. Browser evidence is recorded separately. |
| Real Chrome Members at 1280/768/390 | **PASS / BOUNDED SCOPE** | Persisted invite→resend→cancel passed. Acceptance, role mutation, removal, forced failures, and accessibility were not exercised. |
| `pnpm --filter @dotads/api smoke:invitation-acceptance` inside `pnpm test:clean-db` | **PASS / LOCAL BACKEND** | Real-session/normalized-email binding, forged/cross-site/wrong-email denial, invalid lifecycle/tenant/role denial, idempotent membership plus active-session selection, and one audit row passed. This is not live delivery or browser evidence. |
| `pnpm --filter @dotads/api smoke:dashboard` | **PASS / API SCOPE** | Direct injected-clock and mounted-app checks covered path/OpenAPI, tenant 200, unauthenticated 401, Super Admin 403, invalid query 400, tenant isolation, empty 7/30 buckets, exact keys, cancelled/refunded exclusion, 16:59:59Z/17:00:00Z WIB boundary, and UTC on all three pools. Dashboard UI wiring was not exercised. |
| `pnpm test:clean-db` | **PASS** | Disposable PostgreSQL 16 applied migrations `0000`–`0012`, seeded, and passed RLS, provisioning, auth, Orders, Catalog, Members/acceptance, Dashboard, integration, and release smokes; the container was removed automatically. |
| `pnpm check` and scoped `git diff --check` | **PASS** | Available workspace checks and changed-code whitespace validation passed. |

### Remaining Blockers

- T-1011 remains open: acceptance is locally verified at the backend, but browser/live acceptance, delivery, and the complete role/remove/accessibility workflow are not verified.
- T-1021 and T-1022 remain open: Dashboard UI remains synthetic, Members browser coverage is bounded, media upload is unavailable, and builders/tracking/integrations/settings plus full forced-failure coverage are unfinished.
- Catalog evidence is a bounded product/primary-variant slice, not the target bulk, full variant-matrix, media-storage, warehouse, export, or automated-category workflow.
- Full per-role × API route × tenant/state coverage, provider delivery, privacy/retention decisions, backup/restore, rollback, and authorized staging remain incomplete.

### Release Decision

Release remains **NO-GO**. These checks verify bounded Catalog/Products, Members backend/client, and Dashboard backend slices on the current local worktree; they do not establish complete CMS behavior, provider acceptance, deployment, or production readiness.

## 2026-08-17 — Webhooks, Public-Order Idempotency, and Admin Runtime Repair

### Observed implementation

- Migrations `0013`–`0015` narrow platform database grants, add unambiguous webhook bindings, and add the public-order/prepaid idempotency state machine.
- Public-order replay resolves before Turnstile, catalog, and shipping work. The form runtime retains one UUID plus serialized request for a retry chain and clears them only after accepted `201/202`.
- Purchase conversion outbox creation remains at verified payment/delivery eligibility, not initial order submission.

### Evidence

| Command / probe | Result | Bounded conclusion |
| --- | --- | --- |
| `pnpm --filter @dotads/api build` | **PASS** | Public Orders/OpenAPI/webhook routing compiled. |
| `pnpm --filter @dotads/integrations build` | **PASS** | Hashing, transactional claim, prepaid ambiguity, and reconciliation code type-checked. |
| `pnpm --filter @dotads/form-runtime build` | **PASS** | Stable retry key/body handling type-checked. |
| `pnpm test:clean-db` | **PASS** | Fresh PostgreSQL 16 applied `0000`–`0015`; least-privilege/RLS/provisioning, isolated public-order idempotency, complete configured API/integration chain, signed webhooks, and release smoke passed. |
| Public-order idempotency smoke inside the clean gate | **PASS** | Missing header `400`; concurrent duplicate creates/decrements once; exact COD replay; mismatch `409`; 24-hour retention; replay bypasses invalid Turnstile and unavailable shipping; prepaid success calls the provider once; ambiguity returns stable exact-key `202` without a second call. |
| Signed webhook smoke inside the clean gate | **PASS** | Signature-first rejection, strict payloads, exact tenant/object binding, duplicate/stale/out-of-order behavior, and payment/cancellation race coherence passed against local fixtures. |
| OpenAPI export, mirror comparison, and JSON assertions | **PASS** | Runtime and byte-identical root/`docs/` snapshots contain 48 paths; public Orders declares `Idempotency-Key`; both webhook paths exist. |
| Admin `:3100` resource probe before restart | **FAIL / DIAGNOSED** | `/login` HTML returned `200`, but `main-app.js`, `app-pages-internals.js`, `app/login/page.js`, and `polyfills.js` returned `404`; `webpack.js` and `layout.css` returned `200`. Evidence identified a stale/internally inconsistent Next dev output/process, not a business/API failure. |
| Graceful process restart: `kill -TERM -- -2072272`, wait for port close, then from `apps/admin` run `pnpm exec next dev -H 0.0.0.0 -p 3100` | **PASS / DEVELOPMENT ONLY** | No `.next` deletion was used. All six referenced JS/CSS resources returned `200` afterward. |
| Real Chrome 1280 over Tailscale after restart | **PASS / BOUNDED DEVELOPMENT FLOW** | `/login` hydrated with controlled inputs; local `admin` sign-in returned `200` and reached `/super-admin`; stats/tenants/audit returned `200`; overflow, console/runtime, and non-2xx resource errors were zero; sign-out returned `200` to hydrated `/login`. Evidence: `/tmp/dotads-3100-hydration-report.json` and `/tmp/dotads-3100-post-restart/report.json`. |
| Live provider delivery | **UNVERIFIED** | No approved Mengantar, AutoLaris, Meta, Google, or TikTok sandbox/live delivery evidence exists. |

### Operational and release limits

- Migration `0015` uses blocking `CREATE UNIQUE INDEX`; tmpfs execution is not production lock-duration evidence. Duplicate preflight, table size, maintenance traffic, lock/statement timeouts, and recovery require an approved environment plan.
- The worktree is mutable, not one reviewed immutable release revision.
- Release remains **NO-GO**: provider delivery/recovery, complete commerce/CMS/role/browser matrices, privacy/incident ownership, backup/restore, migration rehearsal, and deployment evidence remain open.
