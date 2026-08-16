# Super Admin Control Plane — Current Architecture and Remediation Contract

**Last verified against repository code:** 2026-08-16
**Release state:** Incomplete; not production-ready

## 1. Boundary and Route Topology

The intended boundary remains:

- `/super-admin/*` — platform-operator workspace for `SUPER_ADMIN`.
- `/admin/*` — tenant workspace for tenant-scoped roles.
- `/api/v1/platform/*` — platform API mounted by `apps/api/src/app.ts`.
- `/api/v1/admin/*` — tenant API.

Menu separation is not an authorization boundary. The server must validate the session and role for every platform request, and the Next.js layouts must prevent direct cross-workspace navigation.

## 2. Current Platform API Truth

`apps/api/src/routes/platform.ts` currently registers the following guarded routes:

| Method | Canonical path | Current behavior | Known gap |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/platform/stats` | Returns tenant counts plus aggregate order count and `totalMinor` GMV. | `securityAlertsCount` is not a verified live metric; time period, WIB boundary, and IDR unit semantics are not specified. |
| `GET` | `/api/v1/platform/tenants` | Lists tenant rows ordered by creation time. | Pagination, filtering, data minimization, and browser integration are not verified. |
| `POST` | `/api/v1/platform/tenants` | Atomically creates one active tenant row and an authenticated-actor audit row. | It does not provision the owner, organization, or membership; there is no `provisioning -> active|failed` workflow. |
| `PATCH` | `/api/v1/platform/tenants/{id}/status` | Atomically changes status with a required reason and writes an authenticated-actor audit row. Existing tenant sessions are denied after suspension. | Broader lifecycle, notification, recovery, and billing consequences are not implemented. |
| `POST` | `/api/v1/platform/tenants/{id}/impersonate` | Requires a reason, validates the target, audits the authenticated attempt, and returns `501`. | Signed/persisted scope, effective role, banner, expiry, exit, and revocation are not implemented, so impersonation remains disabled. |
| `GET` | `/api/v1/platform/audit-logs` | Returns the latest 100 append-only audit rows. | No pagination/filter/export contract is implemented. |

There are currently **no implemented platform settings API routes**. The `/super-admin/settings` page must not be documented as persisted platform configuration until corresponding authenticated endpoints, storage, audit, and tests exist.

## 3. Current UI Truth

The repository contains pages for:

- `/super-admin`
- `/super-admin/tenants`
- `/super-admin/settings`
- `/super-admin/audit-logs`
- `/super-admin/setup`

The audited platform dashboard, tenant fleet, settings, and audit pages primarily use hardcoded arrays or client-local state. Tenant provisioning and status toggles in the CMS do not currently prove calls to the platform API or persistence after reload. “Open workspace” does not establish the secure impersonation flow defined below.

The super-admin layout must derive `SUPER_ADMIN` from a validated server session. A hardcoded layout role or the mere presence of a cookie is not sufficient authorization.

## 4. Target Provisioning Contract

The production provisioning operation must use one transaction or compensating workflow to create:

1. tenant with initial `provisioning` state;
2. organization bound to that tenant;
3. owner user or a secure invitation for an existing user;
4. `TENANT_OWNER` membership;
5. required default settings and plan state;
6. actor-correct audit evidence;
7. final transition to `active`, or `failed` with a retryable error record.

A target request may include `name`, `slug`, `ownerEmail`, `tier`, and optional domain/region configuration, but this is a target contract—not the current endpoint contract. The current endpoint accepts only `name`, `slug`, `tier`, and optional `customDomain`.

Required failure behavior:

- duplicate email, slug, or domain returns a stable conflict response;
- partial writes do not leave an active orphan tenant;
- retry is idempotent;
- credentials or provider secrets never appear in responses or audit metadata.

## 5. Target Impersonation Contract

Secure impersonation must provide:

- a short-lived signed or server-stored session;
- authenticated `SUPER_ADMIN` actor ID and email;
- explicit target tenant and effective tenant role;
- operator-provided support reason or ticket reference;
- issued-at, expiry, revocation, and one-click exit;
- a persistent, high-visibility impersonation banner on every tenant page;
- server-side authorization on every impersonated request;
- append-only start, sensitive-action, and end audit evidence;
- re-authentication or step-up policy for destructive, billing, secret, and ownership actions.

No placeholder impersonation token is emitted. The endpoint must remain fail-closed until every invariant above is implemented.

## 6. Audit Invariants

Every platform mutation must record the actual authenticated actor and target. The audit record must be committed atomically with the business mutation and include appropriate before/after state without secrets or unnecessary personal data.

Required events include:

- tenant provisioning requested, activated, failed, or retried;
- tenant status changed with reason;
- impersonation started, ended, expired, or revoked;
- plan, billing, domain, security, or platform setting changed;
- privileged export or secret rotation requested.

Migration `0003_immutable_audit_log.sql` installs a database trigger that rejects audit updates and deletes. The smoke test attempts both mutations and verifies the original row remains unchanged. Completeness and before/after/request metadata still require broader coverage.

## 7. Permission and Tenant-State Invariants

- All `/api/v1/platform/*` routes require a validated `SUPER_ADMIN` session.
- Tenant roles must receive `403` for every platform route.
- Super-admin access to `/admin/*` must occur only through an explicit support workflow, not a client-side role switch.
- Suspending or cancelling a tenant must deny tenant operations immediately according to a documented recovery policy.
- UI visibility, disabled buttons, and confirmation dialogs complement but never replace server authorization.

## 8. Required Verification

The control plane is complete only when executable evidence covers:

1. negative role tests for every platform route;
2. atomic provisioning success, conflict, rollback, and retry;
3. status enforcement against an already-authenticated tenant session;
4. signed/stored impersonation scope, expiry, revocation, banner, exit, and audit actor;
5. database rejection of audit update/delete;
6. platform UI persistence after reload and honest API failure recovery;
7. desktop, tablet, mobile, keyboard, and accessibility behavior;
8. pagination/filter/export behavior without cross-tenant or secret leakage.

The narrow platform, RBAC, or navigation smoke checks may contribute evidence but cannot alone complete these requirements.
