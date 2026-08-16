# DotAds Engine v2 — Privacy and Data Governance

**Document owner:** Privacy/Legal
**Status:** Applicability and policy decisions are Unknown; this is not a compliance claim
**Last reviewed:** 2026-08-16

## Data Inventory

| Data class | Examples | Observed purpose |
| --- | --- | --- |
| Account and team | name, email, session, membership, role | Authentication and tenant operations |
| Buyer and lead | name, phone, email, address, notes | Order, delivery, support, lead workflow |
| Commerce | cart, price, discount, payment/fulfillment status | Order and reconciliation |
| Logistics | destination, waybill, courier events, RTS risk inputs | Shipping and delivery operations |
| Advertising attribution | `_fbp`, `_fbc`, click IDs, event IDs, hashed match fields | Measurement and deduplicated conversion delivery |
| Technical/security | IP/request metadata, audit and error events | Abuse prevention, troubleshooting, accountability |

## Required Governance Decisions

- Controller/processor and merchant/platform responsibilities by workflow.
- Notice and lawful-basis/consent treatment for storefront, lead-on-blur, cookies/click IDs, Advanced Matching, and WhatsApp messages.
- Data-subject request intake, identity verification, access/correction/deletion/objection handling, and merchant coordination.
- Retention/deletion by data class, legal hold, backups, audit evidence, and provider deletion propagation.
- Children/minimum-age policy and sensitive free-text/address restrictions.
- Receiver-risk provenance, explainability, contestability, and prohibited discriminatory inputs.
- Incident escalation and notification ownership.

## Indonesia Jurisdiction Records

These are applicability questions for qualified review, not legal conclusions.

- **JUR-ID-001 — Unknown:** applicability and assigned obligations under Indonesia Law No. 27 of 2022 on Personal Data Protection. `[TBD owner=Indonesia privacy/legal owner; due=before production release]`
- **JUR-ID-002 — Unknown:** private electronic-system operator registration and operational obligations under the applicable electronic-system framework. `[TBD owner=Indonesia regulatory/legal owner; due=before production release]`
- **JUR-ID-003 — Unknown:** platform-versus-merchant duties for electronic commerce, consumer information, confirmation, cancellation, return/refund, and complaints. `[TBD owner=Indonesia commerce/legal owner; due=before production release]`
- **XFER-ID-001 — Unknown:** hosting, backup, support, Meta/Google/TikTok, Mengantar, AutoLaris, WhatsApp, and email data locations; exporter/importer roles; onward transfers; retention and deletion. `[TBD owner=Privacy/legal owner; due=before production release]`

## Official Source Register

Applicability must be confirmed against current official text and qualified advice:

- Indonesia Law No. 27 of 2022: <https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022>
- Government Regulation No. 71 of 2019: <https://peraturan.bpk.go.id/Details/122030/pp-no-71-tahun-2019>
- Government Regulation No. 80 of 2019: <https://peraturan.bpk.go.id/Details/126143/pp-no-80-tahun-2019>

Source URLs recorded 2026-08-16. No legal applicability or compliance status was inferred from the repository.

## Engineering Gates

Before production: data inventory reviewed, required notices approved, consent/opt-out behavior tested, retention jobs and deletion exceptions implemented, provider transfer register approved, logs redacted, rights workflow exercised, and incident owner/runbook assigned.
