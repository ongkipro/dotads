# DotAds Engine v2 — Data Model Contract

**Document owner:** Database Engineering
**Status:** Current schema inventory plus unresolved release invariants
**Last reviewed:** 2026-08-17

## Sources of Truth

1. Applied SQL migrations under `packages/db/drizzle/migrations/`.
2. Drizzle declarations under `packages/db/src/schema/`.
3. Executable clean-database and adversarial checks.

Prose examples never override those sources.

## Domain Tables

| Domain | Observed tables |
| --- | --- |
| Tenant and domain | `tenants`, `tenant_domains`, `organizations` |
| Identity | `users`, `sessions`, `accounts`, `verifications`, `members`, `invitations`, `roles_permissions` |
| Catalog | `products`, `product_variants` |
| Orders | `orders`, `order_items`, `order_events`, `idempotency_keys` |
| Builders | `form_schemas`, `form_schema_versions`, `landing_pages`, `landing_page_versions`, `draft_leads` |
| Payments/logistics | `autolaris_configs`, `payment_transactions`, `mengantar_configs`, `mengantar_dispatch_queue`, `mengantar_locations` |
| Signals | `tracking_configs`, `outbox_events` |
| Governance | `audit_logs` |

## Required Invariants

- Tenant-owned rows carry a non-null tenant key or an unambiguous parent relationship.
- Tenant-owned tables use forced PostgreSQL RLS under a non-owner runtime role.
- Tenant context is transaction-local and cleared automatically at transaction end.
- Cross-tenant foreign-key relationships are prevented by schema/transaction rules, not controller convention alone.
- Sensitive business writes and their audit rows commit atomically.
- Audit rows reject update and delete at the database boundary.
- Order intake is idempotent and inventory changes cannot oversell under concurrency.
- IDR values are integer rupiah; legacy `*Minor` names do not change that semantic.
- Instants are stored unambiguously and reporting boundaries are calculated in `Asia/Jakarta`.

## Observed Orders Slice

- `orders.status`, `orders.payment_status`, and `orders.fulfillment_status` are independent canonical state axes; no derived lifecycle label is persisted or returned by the current Orders API.
- Orders API money fields are non-negative integer rupiah and responses declare `currency: "IDR"`; legacy `*Minor` column names do not imply a 100× scale.
- Orders API timestamps are serialized as offset-bearing instants. `createdFrom` and `createdTo` accept explicit-offset instants; conversion of operator-selected WIB calendar boundaries remains a client/reporting responsibility and is not yet covered end to end.
- Migration `0007_unique_dispatch_queue_order.sql` rejects pre-existing duplicate `(tenant_id, order_id)` rows before creating `uniq_mengantar_queue_tenant_order`. One mutable queue row therefore owns dispatch state for one tenant/order.
- Guarded processing, cancellation, queueing, and test-worker completion commit state changes with order events and audit rows in their transaction boundary. This is a bounded slice, not the final refund, return/RTS, remittance, or recovery model.

## Observed Catalog and Reporting Slices

- Migration `0008_catalog_invariants.sql` enforces tenant-scoped product GTIN, case-insensitive variant SKU, and variant GTIN uniqueness; product/variant price, compare-price, weight, stock, and status checks; and a composite tenant/product foreign key that prevents cross-tenant variants.
- Catalog create/update/archive writes one product plus its primary variant transactionally with actor audit evidence. Update/archive use optimistic `expectedUpdatedAt` tokens and per-tenant/product serialization. Migration `0010_monotonic_catalog_updated_at.sql` advances catalog tokens by at least one millisecond in UTC so multiple writes within one clock tick remain observable.
- The checkout/catalog interleaving smoke uses a consistent sorted product-then-variant lock order, re-reads catalog eligibility after shipping-rate lookup, rejects stale checkout, and proves concurrent checkout/PATCH completion without deadlock, lost decrement, or stock resurrection. This is focused concurrency evidence, not complete inventory/order-intake closure.
- Migration `0009_unique_pending_invitation_email.sql` enforces one pending invitation for `(organization_id, lower(email))`. Migration `0012_accept_tenant_invitation.sql` owns local session/email-bound acceptance atomically across membership, invitation status, active organization, and audit; browser/live acceptance remains unverified.
- Migration `0011_dashboard_tenant_created_at_index.sql` adds `(tenant_id, created_at)` for bounded tenant-period aggregation. All application, platform, and migration PostgreSQL pools send the supported `TimeZone=UTC` startup parameter; the Dashboard smoke executes `show timezone` against each pool.
- The mounted Dashboard API returns 7/30-day `Asia/Jakarta` periods, zero-filled WIB dates, integer-rupiah aggregates, and complete canonical order/payment/fulfillment breakdowns. KPI and daily totals intentionally exclude orders whose order status is `CANCELLED` or `REFUNDED`; breakdowns retain all states.

## Observed Webhook and Public-Order Invariants

- Migration `0013_platform_role_least_privilege.sql` revokes blanket current/default platform-role privileges; adversarial checks preserve bounded platform routes while denying auth-table access and order mutation.
- Migration `0014_webhook_binding_invariants.sql` makes non-null Mengantar waybills globally unique and adds fixed-search-path resolvers for exact waybill and AutoLaris transaction/order/amount bindings.
- Migration `0015_public_order_idempotency.sql` adds SHA-256 request hashes, explicit states, optional order binding, stored `201/202` responses, a 24-hour expiry policy, state-shape checks, and a tenant/state index. Legacy rows remain `LEGACY_COMPLETED`.
- `payment_transactions.transaction_id` may be null only while a provider request has no confirmed identifier; unique `(tenant_id, gateway, order_id)` ownership prevents a second payment request row for the same tenant/order/gateway.
- Public-order claim, stock decrement, order/items, and COD dispatch enqueue share one transaction. Purchase conversion outbox rows are not emitted at intake; payment success or verified COD delivery owns eligibility.
- **Operational caveat:** the new uniqueness indexes use blocking `CREATE UNIQUE INDEX`, not `CONCURRENTLY`. Promotion requires duplicate preflight, approved maintenance timing, bounded lock/statement timeouts, and rollback/recovery planning. Clean tmpfs evidence does not measure production lock duration.

## Lifecycle Ownership

| Object | Canonical lifecycle owner | Current state |
| --- | --- | --- |
| Tenant | `SUPER_ADMIN_ARCHITECTURE.md` | Provisioning/failed retry incomplete |
| Invitation/member | `IAM.md` | Lifecycle backend/client and local session-bound acceptance verified; browser coverage is limited and delivery is not configured |
| Order/payment/fulfillment | `PRD.md` + `TASKS.md` | Canonical axes and guarded processing/cancellation verified; complete transition matrix incomplete |
| Outbox/dispatch | `TRACKING_SPECS.md` and `MENGANTAR_INTEGRATION_SPEC.md` | Unique Orders dispatch queue and test-worker transaction verified; provider delivery/recovery incomplete |
| Audit | `SECURITY.md` | Append-only enforcement exists; mutation coverage partial |

## Migration Rules

- Forward-only, reviewed SQL migrations; never edit an applied migration.
- Validate from a clean PostgreSQL 16 database before promotion.
- RLS/policy migrations require a non-owner-role test, cross-tenant read/write denial, and explicit platform/service behavior.
- Data conversions require row counts, invariant queries, failure behavior, and rollback/recovery notes.
- Remote migration execution is approval-gated and recorded in `RELEASE.md`.

## Unknowns

- Retention/deletion schedule by data class. `[TBD owner=Privacy/legal owner; due=before production release]`
- Backup encryption, cadence, tested restore, RPO, and RTO. `[TBD owner=Platform Engineering; due=before staging exit]`
- Final `timestamptz` migration strategy and historical timestamp validation remain unresolved even though current PostgreSQL pools force UTC sessions. `[TBD owner=Database Engineering; due=before production release]`
