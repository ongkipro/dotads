# DotAds Engine v2 — Development Workflow

## Goal

Move one documented Target at a time to Observed behavior with executable evidence, while preserving tenant isolation and release safety.

## Read Before Changing Code

1. Read `AGENTS.md` and the task in `TASKS.md`.
2. Trace its single Primary requirement to `PRD.md`.
3. Read only the relevant owner contracts: `ARCHITECTURE.md`, `DECISIONS.md`, `DATA-MODEL.md`, `IAM.md`, `SECURITY.md`, `PRIVACY.md`, `BILLING.md`, `OBSERVABILITY.md`, or `RELEASE.md`.
4. Inspect current code, migrations, routes, tests, package manifests, and lockfile. Disk wins for Observed behavior.
5. Keep provider, jurisdiction, privacy, tax, and production facts Unknown until authoritative evidence exists.

## Implementation Loop

1. Select one permanent `T-1001+` task.
2. Trace the real workflow and every shared caller before editing.
3. Make the smallest complete change; do not add speculative abstractions or dependencies.
4. Add the smallest runnable check for non-trivial logic.
5. Run the task's stated evidence and relevant regression checks.
6. Record the exact command, result, date, and limitations in `BUILD-LOG.md`.
7. Update `STATUS.md` and check the task only when evidence supports that exact scope.
8. Evaluate the release gates in `RELEASE.md`; no local result authorizes deployment.

## Parallel Work

Parallelize independent slices only. Keep migrations before dependent data/API work, shared contracts before consumers, and provider adapters before end-to-end delivery verification. The coordinating session owns integration, conflict resolution, and final evidence.

Visual, layout, responsive, accessibility, or interaction work requires design review before the first visual edit and browser verification afterward.

## Required Evidence by Change Type

| Change | Minimum evidence |
|---|---|
| API or authorization | Allowed and denied HTTP requests using real session context |
| Data or tenancy | Clean-database migration plus same-tenant and cross-tenant assertions |
| Admin UI | Browser workflow at affected desktop, tablet, and mobile widths |
| Embedded form/storefront | Host-page workflow, validation/failure states, and mobile viewport |
| Provider adapter | Approved non-live fixture or sandbox contract test, including failures |
| Tracking/outbox | Database-backed delivery, retry, replay, and deduplication assertions |
| Release | The complete reviewed-revision gate defined in `RELEASE.md` |

A green build alone proves only compilation. Static navigation tests do not prove authenticated routing or responsive behavior.

## Workspace Conventions

- Use the repository's current `pnpm` scripts and workspace manifests.
- API paths and documentation URLs are owned by executable routes and `openapi.yaml`; do not copy stale base paths into new docs.
- Use integer rupiah for internal money values and explicit adapters at provider boundaries.
- Use `Asia/Jakarta` for Indonesian business-period calculations.
- Never print secrets. Never perform live deployment or remote writes without explicit approval.
- Root documents are canonical; update retained `docs/` mirrors byte-identically.
