# DotAds Engine v2 — Documentation Index

**Canonical location:** Root-level documents own current project truth. Files under `docs/` with the same name are byte-identical compatibility mirrors and must not be edited independently.

## Evidence Semantics

- **Observed:** verified current repository behavior or dated executable evidence.
- **Target:** intended behavior or an unresolved implementation obligation.
- **Unknown:** an unresolved decision or external fact requiring authoritative input.

## Canonical Read Order

1. `AGENTS.md` — repository working rules and safety gates.
2. `README.md` — repository orientation and local commands.
3. `PRD.md` — permanent `REQ-*` product requirements.
4. `ARCHITECTURE.md` — observed system structure and target boundaries.
5. `DECISIONS.md` — accepted decisions and unresolved decision records.
6. `DATA-MODEL.md` — data ownership, tenancy, lifecycle, and money semantics.
7. `IAM.md` — identities, roles, capabilities, sessions, and impersonation.
8. `SECURITY.md` — trust boundaries, threat controls, and security verification.
9. `PRIVACY.md` — data classification, retention, consent, and jurisdiction unknowns.
10. `BILLING.md` — platform billing, payment, COD, settlement, and reconciliation ownership.
11. `openapi.yaml` plus executable route/schema definitions — API contract evidence.
12. `UI-UX-DESIGN-SYSTEM.md` and feature specifications — interaction and domain detail subordinate to the PRD.
13. `OBSERVABILITY.md` — logs, metrics, traces, audit evidence, and alert ownership.
14. `RELEASE.md` — environment, migration, rollback, and release gates.
15. `TASKS.md` — permanent `T-1001+` implementation graph.
16. `STATUS.md` — conservative current-state summary.
17. `BUILD-LOG.md` — chronological command and result evidence.
18. `HISTORY.md` — historical context only.

## Ownership Rules

- Requirements are changed only in `PRD.md`; tasks are changed only in `TASKS.md`.
- Current status and verification results belong only in `STATUS.md` and `BUILD-LOG.md`.
- Architecture, decisions, data, IAM, security, privacy, billing, observability, and release facts belong to their named owner documents.
- Detailed feature documents may refine an owner but cannot override it. Contradictions are resolved in favor of executable code for Observed behavior and the canonical owner for Target behavior.
- Historical audit and perfection reports are retained only as superseded input; they are not active requirements, tasks, release evidence, or compliance claims.

## Current Evidence Boundary

The permanent PRD catalog contains 87 `REQ-*` identifiers. This count does not imply implementation completion. Current task count, completion state, release blockers, and exact verification evidence must be read from `TASKS.md`, `STATUS.md`, `BUILD-LOG.md`, and `RELEASE.md`.
