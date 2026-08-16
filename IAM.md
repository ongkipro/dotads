# DotAds Engine v2 — Identity and Access Management

**Document owner:** Security Engineering
**Status:** Partial implementation
**Last reviewed:** 2026-08-16

## Actors

| Actor | Scope | Authority source |
| --- | --- | --- |
| `SUPER_ADMIN` | Platform control plane | Authenticated global user role |
| `TENANT_OWNER` | One active tenant organization | Active membership |
| `ADMIN` | One active tenant organization | Active membership |
| `ADVERTISER` | Catalog/builders/tracking within one tenant | Active membership |
| `CUSTOMER_SERVICE` | Orders/customers/shipping within one tenant | Active membership |
| `END_BUYER` | Public buyer flow; not a CMS operator | Public/session account policy when implemented |
| Provider/service | Narrow webhook or worker action | Verified signature or dedicated service credential |

## Authentication and Tenant Context

1. Better Auth validates the session.
2. The active organization resolves the tenant and membership.
3. Inactive, suspended, or cancelled tenants fail closed for tenant operations.
4. The effective role is derived server-side. Tenant membership cannot grant global `SUPER_ADMIN`.
5. UI receives a bounded session context and may hide unavailable actions, but API authorization remains authoritative.
6. Tenant database context is set transaction-locally for every tenant-scoped operation.
7. A fresh non-platform session with no active organization may recover exactly one active membership and persist it to that same user/session. Multiple active memberships return bounded `409 WORKSPACE_SELECTION_REQUIRED`; the conflict response itself contains no candidate tenant identifiers and the server does not choose arbitrarily.

## Workspace Selection Contract

- `GET /api/v1/workspaces` returns at most 100 of the authenticated user's own CMS memberships. Each choice includes `organizationId`, required `organizationName`, `tenantName`, `tenantStatus`, and one of `TENANT_OWNER`, `ADMIN`, `ADVERTISER`, or `CUSTOMER_SERVICE`; `END_BUYER` is excluded.
- `POST /api/v1/workspaces/select` accepts an organization identifier but selects only an active tenant membership belonging to the authenticated user. Migration `0006` updates only that user's current session.
- A foreign, inactive, malformed, or otherwise unavailable selection fails closed. Rendering a choice in the UI grants no authority; API and database checks remain authoritative.
- The admin renders a picker only for the validated exact `WORKSPACE_SELECTION_REQUIRED` conflict and returns through `/` after selection so the server-derived role dispatcher remains authoritative.

## Authorization Policy

- API routes are default-deny and declare a permission from the shared vocabulary (`tenant`, `members`, `catalog`, `orders`, `settings`, `builders`, `tracking`, `billing`).
- Direct URLs and server layouts enforce workspace boundaries independently: platform operators do not rely on a tenant shell, and tenant operators cannot render `/super-admin/*`.
- The tenant server layout also checks the canonical request pathname against prefixes derived from the current role navigation. This presentation guard prevents direct rendering of hidden CMS pages but does not replace API permission enforcement.
- Sensitive actions additionally enforce resource tenant, current lifecycle state, and audit requirements.
- Test bypass headers/tokens exist only when `NODE_ENV=test` and are forbidden in production.

### Observed Orders Permissions

- `TENANT_OWNER`, `ADMIN`, and `CUSTOMER_SERVICE` hold `orders:read` and `orders:update`; `ADVERTISER` does not hold either permission, and `END_BUYER` has only public order creation authority.
- `GET /api/v1/admin/orders` and `GET /api/v1/admin/orders/{id}` require `orders:read`; processing, cancellation, and dispatch endpoints require `orders:update`.
- Every Orders query also binds the validated tenant identifier. Foreign-tenant detail returns `404`, and mutation eligibility is checked against current payment, fulfillment, order, waybill, and dispatch state.
- This focused permission evidence does not close T-1002: the complete six-role × route × action × tenant × lifecycle-state HTTP matrix remains missing.

### Observed Catalog and Members Permissions

- `TENANT_OWNER` and `ADMIN` may mutate Catalog; `ADVERTISER` and `CUSTOMER_SERVICE` have read-only Catalog access; `END_BUYER` has no CMS Catalog authority. API tests verify read access and denied mutations, while the Products UI hides create/edit/archive for read-only sessions.
- The Catalog API binds every list/detail/create/update/archive query to the validated tenant and returns foreign-tenant records as unavailable. UI role presentation remains subordinate to API authorization and RLS.
- `/api/v1/members` requires `members:read` for the directory, `members:create` for invitation creation/resend/cancel, and `members:update`/`members:delete` for role/removal mutations. Under the current permission map, only `TENANT_OWNER` may mutate membership; `ADMIN` and `CUSTOMER_SERVICE` may read, and `ADVERTISER`/`END_BUYER` have no Members access.
- Member mutations are organization-scoped and serialize ownership-sensitive changes. The backend rejects self-removal/self-role change and last-owner removal/demotion, writes audit rows transactionally, and returns invitation delivery as `not_configured`.
- **Observed locally:** `POST /api/v1/invitations/{id}/accept` ignores test identity headers and requires a real Better Auth session plus trusted browser origin. Migration `0012` binds normalized session email to the locked invitation, rejects ineligible lifecycle/role/tenant states, atomically creates or reuses one matching membership, marks the invitation accepted, selects the organization for the same session, and writes one actor-correct audit row. The clean smoke covers idempotent repeat acceptance; browser/live acceptance and delivery are not verified.

## Session Context Contract

The admin boundary may expose only validated fields required for rendering:

```ts
type SessionContext = {
  userId: string;
  userEmail: string;
  tenantId: string;
  organizationId: string;
  role: "SUPER_ADMIN" | "TENANT_OWNER" | "ADMIN" | "ADVERTISER" | "CUSTOMER_SERVICE" | "END_BUYER";
  tenantName: string;
  tenantStatus: "active" | "suspended" | "cancelled";
};
```

Missing or invalid context redirects to login; authenticated but disallowed workspace access returns/redirects to the actor's valid workspace without rendering protected data. The root workspace entry resolves the validated session, renders the picker only for the exact workspace-selection state, and otherwise dispatches `SUPER_ADMIN` directly to `/super-admin` and tenant operators to `/admin`.

## Development-only Credential Boundary

- `pnpm --filter @dotads/api dev:seed-auth` reproducibly creates local aliases when their environment-backed passwords are supplied: `admin` / `admin` resolves to a Super Admin fixture and `merchant` / `merchant` resolves to a multi-workspace tenant fixture in the verified local setup.
- The seed command refuses `NODE_ENV=production`; the login aliases are also disabled in production. The tenant password boundary remains at least eight characters and the Super Admin local convenience boundary at least four characters.
- Both aliases are non-production conveniences. Production requires normal Better Auth credentials and approved secret handling.

## Incomplete Workflows

- Invitation delivery remains explicitly `not_configured`; acceptance has local backend evidence but no browser/live evidence.
- Ownership transfer beyond the verified last-owner/self safety guards.
- Complete Members browser lifecycle: invite→resend→cancel passed at 1280/768/390, while acceptance, role mutation, removal, forced errors, and accessibility remain unverified in-browser.
- Secure short-lived impersonation with reason, expiry, persistent banner, exit, revocation, actor-preserving audit, and step-up authentication for dangerous actions.
- Password recovery, email verification, session revocation, and MFA/step-up policy evidence.
- Complete role/device/accessibility coverage. Real Tailscale Chrome already covers role separation, three picker states, database-backed selection, sign-out, stale-cookie recovery, and the corrected mobile long-name layout.
- Complete six-role × route × action × tenant/state test matrix.

All are release tasks in `TASKS.md`; no UI-only implementation can close them.
