# DotAds Engine v2 — Security Contract

**Document owner:** Security Engineering
**Status:** Active remediation
**Last reviewed:** 2026-08-17

## Protected Assets

Tenant/customer data, sessions and credentials, catalog/pricing/inventory, orders/payments/COD remittance, provider credentials, conversion identifiers, custom-domain ownership, audit evidence, and deployment/database control.

## Primary Threats and Required Controls

| Threat | Required controls | Current evidence |
| --- | --- | --- |
| Cross-tenant access | Server-derived tenant, forced RLS, non-owner role, adversarial tests | Locally verified by migration `0004` and disposable PostgreSQL adversarial tests; production role wiring unverified |
| Broken role authorization | Default-deny API permission map, resource/state guards, direct-route denial | Partial API evidence; browser/session matrix incomplete |
| Client-controlled commerce | Contract validation, server price/stock derivation, idempotency, transactions | Migration `0015` and clean smoke prove UUID keys, hash-conflict denial, atomic stock/order claim, exact replay, and stable prepaid ambiguity; broader commerce coverage remains partial |
| Session/CSRF/origin abuse | Strong required secret, trusted origins, secure cookies, CSRF/session lifecycle, rate limiting | Configuration hardening exists; full negative matrix incomplete |
| Webhook forgery/replay | HMAC/official authentication, persisted provider-object binding, idempotent CAS | Migration `0014` and signed webhook smoke prove signature-first rejection, strict payloads, exact bindings, duplicate/stale behavior, and selected races; provider timestamp/replay-window acceptance remains unverified |
| Stored/reflected injection | Output encoding, UUID/schema parsing, safe custom CSS/HTML policy | Reflected embed case fixed; full surface review incomplete |
| Audit tampering | Transactional actor-correct writes, append-only DB control, restricted DB grants | Append-only trigger exists; coverage partial |
| Provider/queue false success | Acknowledged delivery only, retry/backoff, DLQ, redacted logs | Missing adapter now fails/retries; real delivery unverified |
| Dependency compromise | Frozen lockfile, reviewed updates, production audit threshold, image review | Zero high package-manager findings on prior worktree revision |
| Secret disclosure | Required environment injection, no defaults in production, log redaction, rotation runbook | Application fail-closed checks exist; deployment config/rotation unverified |

## Security Invariants

### Observed 2026-08-17 controls

- The platform database role has bounded grants and cannot directly access auth credential/session/user tables or mutate orders.
- Public-order replay is resolved under tenant context before Turnstile and shipping work. Mismatched or expired key reuse fails `409`; stored public responses omit customer PII and provider secrets.
- Once `PAYMENT_REQUESTING` commits, automatic AutoLaris retry is forbidden. Timeout, throw, or crash after the boundary remains manual/recovery-required `202` rather than risking a duplicate charge.

- No production bypass token, default secret, or arbitrary tenant header.
- No secret or personal-data payload in logs, audit metadata, test fixtures, or documentation.
- No sensitive mutation without actor, tenant, target, reason where applicable, and atomic audit evidence.
- No audit update/delete through application or direct database role.
- No provider event marked delivered without provider acknowledgement.
- No production claim based only on a unit smoke or green build.

## Verification

Required gates include malformed payloads, disallowed origins, invalid/expired sessions, forged tenant identifiers, every unauthorized role, inactive tenant, cross-tenant direct SQL, invalid/replayed signatures, audit mutation, concurrent stock/idempotency, dependency audit, and authenticated browser direct routes.

## Incident Readiness Unknowns

Incident severity model, notification routing, forensic retention, credential rotation, customer communication owner, recovery exercises, and Indonesia-specific notification obligations are Unknown. `[TBD owner=Security and privacy/legal owners; due=before production release]`
