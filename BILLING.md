# DotAds Engine v2 — Billing, Payments, and Settlement

**Document owner:** Product and Finance Engineering
**Status:** Product contract incomplete
**Last reviewed:** 2026-08-16

## Separate Money Domains

1. **Platform subscription billing** — DotAds charges a merchant/agency for SaaS access. Provider, plans, entitlements, proration, tax invoices, dunning, and cancellation are not implemented.
2. **Buyer payment collection** — merchant orders use COD, QRIS, or Virtual Account eligibility through AutoLaris/provider boundaries.
3. **Logistics COD remittance** — courier collects buyer cash and remits under a separate reconciliation lifecycle.

These domains must not share statuses or balances implicitly.

## Money Contract

- All internal IDR integers represent rupiah (exponent 0).
- UI formatting uses Indonesian locale and never divides/multiplies by 100 implicitly.
- Provider adapters document their unit and convert exactly once with contract tests.
- Discounts, shipping, fees, refunds, settlements, and exports reconcile from immutable transaction/event evidence.

## Required Lifecycles

| Domain | Required states/guards | Current state |
| --- | --- | --- |
| Subscription | trial/active/past-due/suspended/cancelled, entitlement effective dates | Unknown/not implemented |
| Buyer payment | pending/paid/failed/expired/cancelled/refunded with idempotent reconciliation | Partial |
| COD | eligible/confirmed/dispatched/delivered/remitted/returned/disputed | Partial and not canonicalized |
| Refund | requested/approved/submitted/succeeded/failed/cancelled plus order impact | Unknown/not implemented |

## Indonesia and Finance Unknowns

- Whether DotAds touches/controls funds or only redirects/provider-orchestrates.
- AutoLaris/provider licensing and merchant-of-record responsibilities.
- QRIS/VA settlement, refund, chargeback/dispute, and COD courier-fee ownership.
- Platform subscription VAT/withholding and invoice obligations.
- Merchant sales invoice and refund-document responsibilities.

`[TBD owner=Indonesia finance/legal owner; due=before production release]`

## Release Gates

No production billing/payment claim until idempotency, signed callbacks, out-of-order events, reconciliation, ledger balancing, refund/failure recovery, redacted observability, and role/audit controls pass approved non-live tests. Live provider validation remains approval-gated.
