# Meta Ads Performance, Contribution Estimates, and Scoped Learning

Use this reference for `dotads-meta analyze` and `learn`. For public Indonesian
shopping context, load [Indonesia market guidance](indonesia-market.md) only
when the target market is explicitly ID. Public baseline research requires no
brand or unit-economics setup. Brand economics are relevant to financial
performance analysis, not a prerequisite for general market research.

## Interpret metrics before diagnosing

Use matching account, currency, date range, conversion definition, attribution
window, and reporting level. Keep those fields with exported insights. A saved
JSON array without that metadata remains unqualified; the helper cannot recover
provenance, complete pagination, or conversion maturity from its numbers.
Financial comparisons require row `account_id` and `account_currency` (or
`currency`) matching the selected brand and its saved economics scope. Missing
scope still permits independent raw metrics, without a contribution candidate.

- Missing, malformed, or unsupported metrics remain unknown. A measured zero is
  different from a missing value. Derived ratios require valid denominators.
- Revenue, orders, clicks, and spend must describe compatible populations and
  periods. Aggregate ROAS is total compatible revenue divided by total spend;
  do not average row ROAS values or mix currencies.
- An attributed purchase is not evidence of incrementality. A strong observed
  result is a review candidate, not a proven creative winner or causal diagnosis.
- Judge sample sufficiency against the decision, variability, conversion lag,
  and experiment design. There is no universal minimum count in this helper.

For a coherent funnel, CPR = spend / purchases, ROAS = revenue / spend,
CTR = outbound clicks / impressions, and observed click-to-purchase ratio =
purchases / outbound clicks. The latter is not necessarily a landing-session
conversion rate: attribution can include other paths. Hook/hold/frequency
thresholds are local review heuristics, not Meta penalties or causal tests.

## Economics and COD order basis

Unknown costs produce an unknown contribution estimate. Revenue minus ad spend
alone is not net profit. Configure assumptions only from an established business
source; explicit zero costs are permitted, silent zero defaults are not.

```bash
dotads-meta learn unit-economics --brand ./brand.json \
  --aov 250000 --cogs 75000 --shipping-fee 15000 \
  --cod-rts-rate 0.12 --rts-penalty 20000 --target-margin 0.20
```

These are fictional example inputs. The model covers only configured COGS,
shipping subsidy, and RTS penalty, excluding unconfigured taxes, payment fees,
refunds, overhead, and other costs. Its output is an assumption-based contribution
estimate after ads, not audited realized net profit.

For raw **placed orders**, define delivery fraction d, revenue per delivered order
A, delivered-order COGS C, shipping subsidy S, and failed-order penalty P:

```text
expected contribution per placed order = d * (A - C - S) - (1 - d) * P
estimated contribution after ads = placed orders * expected contribution - spend
break-even CPR (placed) = expected contribution per placed order
break-even ROAS (placed revenue basis) = A / expected contribution per placed order
break-even ROAS (expected delivered revenue basis) = d * A / expected contribution
target CPR (placed) = expected contribution - d * A * target margin
```

Keep every CPR/ROAS threshold on the same order/revenue basis as its observed
metric. A declared target margin is an assumption, not an automatically approved
business target; it applies to expected delivered/collected revenue. A zero or
negative target CPR is unattainable and returns null, without a positive clamp.
The local
`recommended_cost_cap` convention, when available, is not a guaranteed CPA or
profit ceiling and does not establish bidding eligibility.

Do not multiply an already delivery-adjusted order count by an RTS-adjusted
per-placed-order contribution. For example, 10 placed orders, A=100, C=30, S=5,
d=0.9, P=10, and ad spend=100 yield 475, not 417.5. Already-delivered backend
orders do not reveal placed counts or failed-order costs. Partial backend fields
are not full reconciliation; keep the source and coverage visible.

## Run the analyzer

```bash
# Offline analysis; declare placed only when the source establishes that basis
dotads-meta analyze ./insights.json --brand ./brand.json --purchase-basis placed --json

# Explicit delivery-rate assumption declares raw Meta orders placed;
# resulting delivered counts/revenue remain estimates, not backend reconciliation
dotads-meta analyze ./insights.json --brand ./brand.json --delivery-rate 0.88 --json

```

Authorized `analyze --pull` uses the installed official SDK adapter; CLI 1.2.0's
unsupported level flags are no longer used. The
[runtime contract](account-workspace-runtime.md) distinguishes installed-SDK
HTTP fixtures from actual account access. Scoped saved JSON remains the offline
path; a successful provider fixture does not prove account eligibility or profit.

`--purchase-basis placed|delivered` or a row's `purchase_basis` declares the source
order definition. Do not add a declaration merely to obtain a favorable result.
Conflicting bases/rates, partial backend overrides, and unknown provenance remain
visible. `real_purchases` and `real_revenue` are optional backend fields; they are
not proof that both sides describe the same cohort.

Read the report's metric quality, basis, economic coverage, and limitations
before its observational classification. `estimated_contribution_after_ads`
replaces the misleading net-profit interpretation; the deprecated
`estimated_net_profit` field is null. Financial candidates require coherent
inputs and are still observations. Diagnostic hypotheses suggest what to
inspect, not what caused a result. There are no generated scale/pause commands.
Any later live mutation requires an approved, reviewed deployment/change plan.

`comparison_cpr`, `comparison_roas`, and `comparison_benchmarks` retain the
placed-order/gross placed-revenue basis. Delivery-estimated displayed ROAS uses
the corresponding delivered-revenue threshold; do not cross-compare the two.
Derived thresholds are recomputed from qualified base assumptions. Legacy
economics without explicit cost coverage or account/currency scope remain
unqualified until reviewed and explicitly reconfigured. Saved cost assumptions
must match the selected brand's account and currency. Editing `brand.json` or
changing row currency does not convert historical costs or authorize reusing
them across accounts.

## Learning without manufacturing proof

```bash
# Explicitly record scoped analysis observations; repeat input is deduplicated
dotads-meta analyze ./insights.json --brand ./brand.json --record-memory

# Add a reference hypothesis, retaining its source and uncertainty
dotads-meta learn add --brand ./brand.json \
  --source competitor --category hook --verdict insight \
  --title "Product demonstration reference" \
  --summary "An observed ad demonstrates product handling; spend and outcomes are unknown." \
  --action "Consider a distinct demonstration concept if relevant to the approved offer."

dotads-meta learn list --brand ./brand.json
```

Automated analysis records `insight`, never a proven `winner` or `loser`.
Repeated observations are not independent replications. Existing manual verdicts
remain stored with their original evidence; their labels do not validate them.
Competitor longevity, forum claims, and outsourced advice are hypotheses unless
outcomes and methods are verifiable. Do not turn illustrative payday effects,
creative counts, editing cadence, or bidding ratios into established rules.

Keep brand/account records outside dotfiles. Promote only verified reusable,
non-sensitive engineering lessons through the separate `ai-learn` review path;
campaign outcomes and client data do not belong in shared memory.

## Copy and campaign experiments

Start with the actual objective, destination, serviceability, budget, and
verified offer. Choose distinct concepts the budget can meaningfully observe.
Consolidation, ad counts, creative formats, and bid controls are conditional
choices, not guaranteed algorithm advantages. Changing attribution also changes
the measurement basis; do not silently switch it while comparing performance.

Technical guidance stays English. For an explicit ID market/segment, write
customer-facing copy in natural Bahasa Indonesia; keep MY and other markets
separate. Mixed-country plans require market-specific creative/measurement
rather than imposing Indonesian language on the whole plan. Vocabulary warnings
are contextual review aids: a valid Indonesian use of “percuma” is not itself a
language defect or a ranking penalty.

Primary text, headline, and description should express a specific, substantiated
benefit or relevant information. Approximate 125/40/30-character preview targets
are local starting points, not guaranteed placement limits. Verify actual
placement previews, product claims, discounts, shipping promises, and guarantees.
Use a native CTA appropriate to the destination; a messaging journey can use a
WhatsApp CTA. Do not infer an algorithm penalty from an explicit text CTA.

Current platform sources, CLI compatibility limits, and changing API claims are
maintained in [API and evidence](api-and-evidence.md). Never promise maximum ROAS,
lowest CPR, successful delivery, or profitable scaling from a public baseline,
a classifier, or a cost-cap setting.
