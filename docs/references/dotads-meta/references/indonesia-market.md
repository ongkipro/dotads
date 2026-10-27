# Indonesia market baseline

Use this on-demand reference to form useful regional shopping hypotheses before
a brand has performance history. It covers general online-shopping behavior
across products and niches; a product brief, brand, account, token, or economics
record is not required to use the public baseline.

## Select the market explicitly

Apply the Indonesia overlay only to an explicitly selected **ID** market or an
identified Indonesian segment. Conversation language, account currency, and
billing country do not establish the target market. For Malaysia or another
country, retain shared Meta guidance and use that market's own evidence and
language decision. In a mixed-market report, apply these priors only to the ID
segment, never to the aggregate or other countries.

Technical instructions, diagnostics, and schemas stay in English. Customer-facing
ads, subtitles, landing pages, and sales conversations use **Bahasa Indonesia**
for the selected Indonesian market. A Bahasa Indonesia conversation alone must
not activate this overlay. A creative-language choice does not automatically
require an audience-language restriction.

## Load the relevant public evidence

[indonesia-baseline.json](indonesia-baseline.json) is the maintained numeric
source. Read only the requested province/city records and their source metadata;
do not load every row into every campaign prompt. It contains no Meta location
keys, private account data, automatic budget policy, or performance targets.

```bash
dotads-meta baseline --market ID
dotads-meta baseline --market ID --province 71
dotads-meta baseline --market ID --province "Jawa Barat" --city "Kota Depok" --json
```

This offline query reads public records; it needs no credentials, upstream CLI,
installation, or brand workspace and performs no account call or write. A known
city must match any supplied province. For a city without a direct observation,
supply a valid province explicitly: the output retains inherited provincial
context and a null city metric; it does not verify the unmatched city label or
its administrative parent. With neither geographic filter, the query returns
all 38 provinces and the provided selected-city context. A known city alone
returns that city and its verified parent province. City coverage stays incomplete.

| Record | Coverage and population | Appropriate starting use |
|---|---|---|
| `province_participation` | 38 BPS provinces; Susenas 2025; internet users aged 5+ with access in the preceding three months, reporting purchasing goods/services as an internet-use purpose. National 26.73%; urban 30.47%; rural 20.22%. | A dated shopping-participation prior. It is not an all-resident, adult Meta-audience, or individual purchase-probability measure. BPS urban/rural is distinct from administrative kota/kabupaten. |
| `city_participation` | Seven selected high-participation examples from NEXT's reanalysis of Susenas March 2025; publisher-defined total-population denominator, national 19.18%. | Provisional direct city observations. The list is incomplete and not representative; an unlisted city is unknown, not less attractive. Do not compare these percentages directly with BPS internet-user percentages. |
| `regional_transactions` | BI Sulawesi Utara only, Q1/Q2 2026; reported ecommerce value and transaction count. | Investigate transaction intensity and value composition. Rounded aggregate counts are not unique buyers or frequency per buyer. Panel, buyer-versus-merchant geography, and refund treatment remain unknown. |

Publication is not measurement: BPS's 31 August 2026 release reports 2025 data;
NEXT's 13 July 2026 release reprocesses March 2025; BI's 15 June/14 September 2026
releases describe Q1/Q2 respectively. The four primary URLs, locators, retrieval
date, and replacement triggers are in `sources` in the JSON. BPS and NEXT share
Susenas lineage; do not count them as independent replication or average them
into a common regional score. NEXT's microdata estimates were not independently
reproduced, and city sample sizes/uncertainty are undisclosed.

BI reports Q1 value/count as IDR 789.6 billion / 5.34 million and Q2 as
IDR 773.3 billion / 5.56 million. Calculating from these rounded totals gives
approximately IDR **147,865 / 139,083** per transaction, volume **+4.12%**, value
**-2.06%**, and mean value **-5.94%** quarter on quarter. These means are neither
median baskets nor brand AOV. Q1 describes COD as the leading payment option
without a numerical share. This can motivate an affordability/payment-clarity
hypothesis; category mix, seasonality, prices, or reporting coverage may explain
the pattern. It does not establish regional psychology or a structural preference
change.

## Produce a baseline without brand history

For each requested area, return **observed pattern → proposed interpretation →
initial test question → evidence that would change the view**, together with
source, date, denominator, and geographic coverage. Distinguish direct regional
observations, explicitly inherited provincial/national context, and unavailable
fields. When a city lacks direct evidence, a provincial prior can inform a
question; the province's percentage must not become a city measurement.

| General dimension | Current coverage or gap |
|---|---|
| Shopping participation | 38/38 provinces for one indicator; seven selected city observations. |
| Ecommerce value/volume | One province over two quarters; broader comparable coverage is absent from this dataset. |
| Payment behavior | One qualitative Sulawesi Utara COD observation; no comparable quantitative buyer-side regional series here. |
| Channels, frequency, spending distributions | No complete regional series here. Transaction counts cannot substitute for unique-buyer measures. |
| Shipping, delivery, cancellation, RTS | No comparable general regional series populated. Missing coverage is a collection gap, not proof that no public source exists. |
| Category/niche details | Optional later campaign enrichment; absence does not block general-baseline readiness. |

Participation can inform a first market shortlist, but a high rate does not prove
the largest buyer pool. Use compatible population/buyer-base estimates when
available; otherwise leave absolute size unknown. Do not privilege only the
seven listed cities, invent income/category personas, assign unsupported
confidence percentages, or turn incomplete metrics into a universal score.

Useful initial questions concern truthful payment choice, total shipping cost,
delivery estimates, product-information clarity, assistance, and factual local
service cues. They are hypotheses to evaluate, not universal Indonesian buyer
preferences. Preserve actual prices, serviceability, payment availability, and
promises when producing customer-facing content; do not invent local slang or
testimonials from a place name.

## Audience and campaign use

Broad eligible adults and **all genders** are reasonable starting candidates
within actual service, business, advertising-policy, and platform constraints.
**21–65+ is a conditional candidate**, not a universal Indonesian legal age,
verified platform minimum, or experimentally best-performing range. Where 18–20
are eligible, choosing 21 excludes them; acceptance of a setting does not prove
that exclusion improves performance. Retain older adults when appropriate.

Reviewed **27 October 2026**:

- [Meta Advantage+ audience creation](https://www.facebook.com/business/help/793748385630490?locale=en_US)
  says ages below 18 cannot be selected, with older thresholds in some countries;
  the retrieved body does not name Indonesia's numerical floor. An example about
  goods unavailable below 21 is not a country-wide recommendation. Verify the
  effective account/configuration rather than asserting universal 18 or 21.
- [Meta age/gender guidance](https://www.facebook.com/business/help/151999381652364?locale=en_US)
  distinguishes suggestions and stronger controls available in some setups.
  Verify the effective controls rather than just the displayed age/gender range.
  **WhatsApp Status can include people of unknown age to whom the minimum-age
  selection does not apply.** Check the corresponding unknown-age option before
  making a strict age-bound claim.

Broad eligibility does not guarantee equal delivery by age or gender. No narrow
interest filter or one-ad-set-per-city structure follows from the baseline.
Confirm actual campaign/placement eligibility and current official guidance when
preparing a live plan. This reference does not create or change audience settings.

For one offer, one serviceable market, and a limited Purchase budget, **one
campaign, one ad set, and three distinct concept ads** is a conditional starting
plan. Use 1–2 strong ads when resources are thin; 3–5 can be manageable when
budget and creative quality support them. No inspected study establishes a
universal optimal count. Split only for real business/delivery constraints,
necessary budget control, or a specified experiment. Campaign/ad-set budgets do
not guarantee equal ad delivery or a randomized creative comparison.

`weekly budget / target CPA` is an arithmetic capacity scenario, not a conversion
forecast. Meta's approximately 50 weekly ad-set optimization events guidance is
not 50 purchases per ad, a hard profitability threshold, or a statistical-power
calculation. Do not require a universal sample size, force budget increases, or
switch to an easier event merely to reach a learning threshold. Review the
applicable current guidance and event definition before using the heuristic.

A later campaign plan needs the actual offer, destination, service coverage,
conversion definition, budget, and relevant economics. Observed CPA is optional
for a new account; label launch estimates as scenarios. The public baseline can
already produce initial questions without these inputs. Mature paid/fulfilled
outcomes, or the appropriate completed service/downstream lead outcome, determine
whether a campaign meets its business criteria. CTR, messages, ad longevity, and
platform purchases alone do not prove a profitable winner.

Keep targeted Meta geography, platform-reported geography, and fulfillment
geography separate. BPS codes are administrative identifiers, not Meta target
keys. Verify the actual location object and reporting capability before use;
do not fabricate city/kecamatan targets. Compatible geographic spend and
attributed acquisitions are required for local CPA. City backend orders alone
cannot supply it; allocating national spend by city order shares does not create
observed local CPA. Sparse or unsupported local metrics remain unavailable or
roll up to a justified parent, never measured zero.

## Maintain and verify

Retain source version, locator, measurement/publication/retrieval dates,
population, geography, unknown uncertainty, and replacement trigger. Recheck BPS
on a replacement annual release, BI on a new quarterly report, and NEXT on an
updated analysis or correction. New quarterly transaction data does not update
an annual participation percentage. Failed refreshes preserve the last dated
evidence and its limits; they do not silently make it current.

Baseline checks should cover unique source-matched province rows, canonical
province parents for the seven cities, separate metric families, source lineage,
rounded-total arithmetic, and missing-city behavior. Decision checks should cover
no brand/niche/account prerequisite, positive ID selection, negative MY/non-ID
selection, mixed-market segment isolation, and Bahasa Indonesia conversation
without inferred ID selection. No automatic age 21, budget ranking, CPA promise,
or verified winner follows from this dataset.

Source matching and arithmetic were checked offline; no account capability or
campaign outcome was verified. These files provide dated evidence and guidance,
not an independently validated adaptive campaign engine.
