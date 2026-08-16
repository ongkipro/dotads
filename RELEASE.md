# DotAds Engine v2 — Release Contract

**Document owner:** Release Engineering
**Current decision:** NO-GO
**Last reviewed:** 2026-08-17

`STATUS.md` explains current blockers. This document owns the release gate and revision-level evidence required to change NO-GO to GO.

## Mandatory Gates

| Gate | Required evidence | Current state |
| --- | --- | --- |
| Requirements | Critical requirements linked to one primary task and executable check | Partial |
| Tenant isolation | Forced RLS, non-owner runtime role, transaction-local context, adversarial cross-tenant read/write tests | Passing locally; deployment role wiring unverified |
| IAM | Six-role route/action matrix, direct-route denial, active/suspended tenant behavior | Partial |
| Audit | Append-only DB enforcement and transactional coverage for every sensitive mutation | Partial |
| Commerce | Canonical order/payment/fulfillment transition suite, IDR/WIB, inventory/idempotency | Public-order/idempotency and bounded webhook slices pass locally; complete lifecycle remains Partial |
| Providers | Non-live approved contract/sandbox tests, retries, DLQ/recovery, redacted logs | Blocked |
| CMS | Session-derived tenant/role and persistent primary workflows with honest failure states | Session boundary partial; persistence blocked |
| Privacy/security | Threat review, data inventory/retention, incident owner, dependency review | Blocked |
| Build/test | Same-revision clean DB, full tests, build, high-threshold dependency audit | Migrations `0000`–`0015` and the full clean chain pass on this mutable worktree; not yet a reviewed immutable revision |
| Browser | Authenticated role/device/a11y/failure matrix | Partial |
| Delivery | Immutable image build, required-secret validation, migration and rollback rehearsal | Unverified |

## Local Release Candidate Command Set

```bash
pnpm install --frozen-lockfile
pnpm test:clean-db
pnpm build
pnpm audit --prod --audit-level high
pnpm --filter @dotads/db audit:rls
git diff --check
```

Browser and provider contract checks are additional gates and cannot be replaced by a green build.

Migration `0015` creates uniqueness indexes with blocking `CREATE UNIQUE INDEX`. Any non-disposable migration needs an approved maintenance plan covering duplicate preflight, observed table size, lock/statement timeouts, controlled traffic, and rollback/recovery. Local tmpfs evidence neither authorizes nor predicts production lock duration.

## Release Record Template

- Revision: `[TBD owner=Release Engineering; due=release candidate]`
- Artifact/image digests: `[TBD owner=Release Engineering; due=release candidate]`
- Database migration range: `[TBD owner=Database owner; due=release candidate]`
- Backup/restore rehearsal: `[TBD owner=Database owner; due=staging exit]`
- Rollback revision and procedure: `[TBD owner=Release Engineering; due=staging exit]`
- Approved environment: `[TBD owner=Product owner; due=deployment approval]`
- Provider sandbox evidence: `[TBD owner=Integrations owner; due=staging exit]`
- Monitoring/alert confirmation: `[TBD owner=Platform Engineering; due=staging exit]`
- Privacy/security sign-off: `[TBD owner=Privacy/security owner; due=production release]`
- Go/no-go approver and timestamp: `[TBD owner=Product owner; due=production release]`

## Approval Boundary

Local editing, disposable Docker tests, and image builds do not authorize remote migration, provider delivery, DNS changes, staging deployment, or production deployment. Each live action requires explicit user approval and a completed release record.
