# DotAds Engine v2 — Observability Contract

**Document owner:** Platform Engineering
**Status:** Target contract; implementation is partial
**Last reviewed:** 2026-08-16

## Objectives

Observability must answer: which actor/request changed business state, which tenant was affected, what provider work is pending or failed, and whether buyer/operator journeys meet service objectives—without logging secrets or unnecessary personal data.

## Required Structured Fields

`timestamp`, `level`, `service`, `environment`, `request_id`, `trace_id`, `route`, `method`, `status_code`, `duration_ms`, `actor_id`, `actor_role`, `tenant_id`, `organization_id`, `target_type`, `target_id`, `event_name`, `provider`, `attempt`, `error_class`.

- Values must be absent rather than fabricated.
- Tokens, cookies, signatures, passwords, raw authorization headers, payment credentials, and full webhook bodies are forbidden.
- Email, phone, address, and ad identifiers are redacted or hashed only when the documented use requires them.

## Signals and Minimum Alerts

| Area | Metrics/events | Alert condition |
| --- | --- | --- |
| API | request count, latency, 4xx/5xx by route | sustained 5xx or latency budget breach |
| Auth | sign-in failures, forbidden actions, inactive-tenant denials | anomaly by account/IP/tenant without exposing credentials |
| Database | pool saturation, transaction latency, migration state, RLS denial | saturation, migration mismatch, or isolation-test failure |
| Orders | created, rejected, idempotent replay, stock conflict, invalid transition | spike in failures or duplicate invariant breach |
| Payments | reconciliation latency, invalid signature, stale pending | delayed or conflicting payment state |
| Logistics | dispatch backlog, retries, missing waybill, webhook lag, RTS | backlog age or permanent failure threshold |
| Outbox | pending age, retry count, dead-letter count, deduplication conflict | oldest pending age or dead-letter count above zero |
| Audit | mutation coverage and append-only rejection | sensitive mutation without audit evidence |
| Web UX | LCP, INP, CLS, JS/runtime errors, submit failures | budget breach by surface/device |

## Service Objectives

The final numeric SLOs are **Unknown** until traffic and business-impact baselines exist. `[TBD owner=Product and Platform Engineering; due=before staging exit]`

Initial release gates:

- No known cross-tenant read/write path.
- No sensitive mutation without actor-correct transactional audit evidence.
- No provider event marked sent without an acknowledged provider response.
- Buyer order submission exposes a recoverable error and preserves entered data.
- Admin direct-route authorization is enforced server-side at all supported viewports.

## Correlation and Retention

- One inbound request ID propagates to audit, order events, queue jobs, and provider attempts.
- Provider payload fingerprints may support idempotency; raw secret-bearing payloads are not retained in logs.
- Audit, operational logs, analytics, and customer records have separate retention policies.
- Retention duration and deletion/legal-hold rules are **Unknown**. `[TBD owner=Privacy/legal owner; due=before production release]`

## Runbooks Required Before Release

1. Authentication/session outage.
2. Suspected tenant-isolation breach.
3. Database migration failure and rollback/recovery.
4. Payment webhook delay or replay storm.
5. Mengantar dispatch backlog or provider outage.
6. Outbox dead-letter replay with deduplication.
7. Incorrect conversion signal and provider-side suppression.
8. Personal-data incident intake and escalation.

## Current Evidence

**Observed:** health endpoint, audit table, order events, provider/outbox status fields, retry behavior, and clean-database smoke commands exist.
**Unknown:** centralized log backend, metrics backend, alert routing, dashboards, on-call ownership, tested runbooks, numeric SLOs, and retention enforcement are not evidenced in the repository.
