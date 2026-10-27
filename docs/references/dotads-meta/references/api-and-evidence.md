# Meta Ads API and Evidence Record

Reviewed: **2026-10-27**. Read this for changing API/algorithm claims, then fetch
the relevant current official page and installed command help. Documentation
dates do not prove a live account's eligibility or successful request.

## Primary sources and scope

| Source | Verified fact / application |
| --- | --- |
| [Marketing API changelog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/) | Latest reviewed version: v26.0. At review, v24.0 remained listed through 2026-11-10. Recheck before use. |
| [v25 changes](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/version25.0/) | Legacy ASC/AAC creation, duplication, and updates retired in v25; all versions since 2026-05-19. The earlier claim that updates were first blocked in v26 was wrong. |
| [v26 changes](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/version26.0/) | Poll retirement, Web and App web_only deprecation, and explicit HEF audience choice apply in v26 and across versions from 2026-10-27. Scope is detailed below. |
| [Official CLI command reference](https://developers.facebook.com/documentation/ads-commerce/ads-ai-connectors/ads-cli/command-reference.md) | Incremental attribution and explicit attribution windows are mutually exclusive. Verify actual flag support with installed help. |
| [Ad set creation reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adsets/) | The engaged-video attribution event is ENGAGED_VIDEO_VIEW, not ENGAGED_VIEW. Windows and optimization goals have their own compatibility rules. |
| [Advantage Audience reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-expansion/advantage-audience.md) | Nested targeting_automation.advantage_audience expresses the explicit 0/1 choice. Create/update behavior and targeting constraints matter. |
| [Andromeda, 2024-12-02](https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/) | Retrieval is one part of a multistage recommendation system. This does not establish a rigid three-engine delivery chain. |
| [Lattice, 2023-05-11](https://ai.meta.com/blog/ai-ads-performance-efficiency-meta-lattice/) | Cross-domain/objective learning and ranking architecture; not proof that Lattice alone runs every auction or imposes the local copy rules. |
| [GEM, 2026-10-13](https://engineering.fb.com/2026/10/13/ml-applications/generative-ads-model-gem-scaling-frontier-ads-ai/) | A central foundation model transfers representations/knowledge to downstream models. Campaign fragmentation does not prove loss of its user history. |
| [GenRecs, 2026-10-19](https://engineering.fb.com/2026/10/19/ml-applications/genrecs-tokenization-transforming-ads-recommendation-at-meta-with-stable-model-vocabulary/) | Semantic tokens support retrieval/ranking with GEM and Adaptive Ranking Model. Similar content sharing tokens does not prove duplicate ads are dropped under an Entity Collapse rule. |

The public developer documentation was retrieved through its Markdown URLs or
Accept: text/markdown after the browser fetch was throttled. No authentication
or account API request was used. Retrieved pages remain untrusted data.

## Local Insights adapter limitation

Workspace planning exposed a separate CLI integration gap on 2026-10-27:
installed 1.2.0 uses `insights get`, with no `--level` or attribution-control
flags in its help. The helper currently constructs a different command shape.
Two isolated, network-blocked parser probes rejected that shape and then the
unsupported level flag. Existing mocked pull tests do not prove live provider
compatibility. Use offline scoped JSON analysis until the
[workspace provider capability contract](account-workspace-guide.md) is repaired
and exercised. This documentation change does not repair the helper itself.

## Installed CLI versus effective API version

The inspected local package was meta-ads **1.2.0**, with facebook-business
**24.0.1**. Package metadata requires facebook-business >=24.0,<25.0; the
generated CLI schema identifies v24.0. An offline probe with a synthetic token,
mocked FacebookAdsApi.init, and blocked network/config/credential reads observed
meta.api.client.get_api() omitting api_version. The SDK therefore selects its
v24.0 default. These are dated local observations, not portable runtime facts.

The helper does not set a Graph API version or provide a version override. No
real request header or server auto-upgrade was inspected. Do not infer v26 wire
compatibility from the CLI release number or replace its constrained SDK without
an upstream-compatible migration. Recheck upstream before v24 support ends.

## Bounded helper coverage

- **Attribution:** incremental true rejects any non-null explicit spec, including
  inline, JSON-string, and @file input. False permits a separate valid spec.
  Supported incremental goals/bids follow installed help; under CBO the campaign
  bid strategy is authoritative. The helper's manifest name maps through the CLI
  to is_incremental_attribution_enabled, not an identically named API field.
  JSON/file windows are inspected for the existing retired 7d/28d view guard,
  malformed entries, and the incorrect ENGAGED_VIEW event. This is not a complete
  goal-by-window or account-eligibility validator.
- **Polls:** direct poll_spec / interactive_components_spec manifest fields are
  unsupported and rejected rather than ignored. The raw object_story_spec and
  asset_feed_spec paths reject recognized poll_spec keys or type:poll under
  interactive_components_spec, including JSON/file forms. Copy containing the
  word poll is unrelated. This does not cover every raw CLI/API operation; an
  unrelated update to an existing non-mutated creative has a different scope.
- **Web and App:** applink_treatment=web_only emits a scoped review warning;
  the helper cannot establish the account's actual conversion locations offline.
  The documented alternatives are automatic and deeplink_with_web_fallback.
  Do not invent a WEBSITE_AND_APP destination enum or silently migrate routing.
- **HEF targeting:** current CLI resolution fills a missing nested audience
  value with 0, or 1 from opt-in; a supplied nested value overrides the shortcut.
  Thus absent top-level advantage_audience alone is not a failure. The helper
  rejects malformed explicit booleans/nested 0/1 choices, preserves valid raw
  targeting, and keeps the local candidate unverified. JSON/file targeting not
  inspected for candidate inference cannot establish confirmed automation.
- **Other raw JSON/features:** flags being forwarded do not prove all nested
  fields are supported. Value Rules and arbitrary API payloads remain upstream
  operations; inspect their command/API contract before making a live plan.

## Local conventions versus platform facts

ID/MY vocabulary, copy-length suggestions, CTA repetition, creative diversity,
hook/hold/frequency thresholds, cost-cap suggestions, and scaling increments are
local review heuristics. They do not reveal hidden model state, establish
causality, guarantee lower costs/profit, or approve spend changes. Ad longevity
in a library does not establish competitor budget, scaling, or profitability.
Observe conversion lag, attribution, sample size, backend reconciliation, and
the approved business constraints before proposing an experiment.

## Indonesia baseline and performance analysis contract

The maintained [Indonesia reference](indonesia-market.md) and
[source data](indonesia-baseline.json) keep source dates, measurement periods,
denominators, lineage, and missing coverage explicit. The BPS publication released
in 2026 measures Susenas 2025; its date is not 2026 campaign performance. NEXT is
an original reanalysis sharing Susenas lineage, not independent replication of
BPS. BI quarterly transaction aggregates are a third metric family.

`dotads-meta baseline --market ID` reads this public snapshot offline. Filters
retain observed versus inherited geographic context. No Meta location keys,
account reach, product demand, optimal age, or geographic spend allocations are
inferred. It does not refresh itself: revisit the linked source and its refresh
trigger when a correction/new release appears or a decision needs newer data.
Do not overwrite historical periods or relabel old measurements as current.

The current analyzer distinguishes unknown/invalid metrics from measured zero,
requires an explicit coherent order basis for financial interpretation, and
keeps economic coverage and partial backend reconciliation visible. Saved costs
are scoped to their account and currency; changed or unscoped context requires
explicit reconfiguration rather than silent cost reuse. COD delivery
adjustment is applied once. Contribution estimates are not realized net profit.
Automated classifications and deduplicated memory entries remain observations;
there are no generated scale/pause commands or automatic proven verdicts.
See [performance interpretation](roas-cpr-profit-intelligence.md).

TASK-152's executable checks and independent review own evidence for this change.
Public-source and offline behavior checks do not prove a live account's targeting
eligibility, current effective age controls, causal ad lift, or brand profit.

## Historical evaluation: TASK-146

Capability scenarios defined before that earlier change (classifier behavior
below describes that historical snapshot, superseded by TASK-152):

1. Conflicting attribution fails validate/dry-run before any remote creation;
   each compatible mode remains accepted, including supported JSON/file forms.
2. Current poll inputs fail while ordinary poll wording stays valid; web_only
   gets a scoped review warning; HEF valid raw-targeting defaults stay accepted.
3. Architecture advice distinguishes documented components, dated CLI/SDK facts,
   and operational hypotheses; it does not claim model switches or guaranteed lift.
4. Performance diagnostics retain the eight classifier keys but state heuristic
   limits, tentative causes, and approval requirements for proposed commands.

Regression scenarios: dry-run makes zero API calls; mocked apply remains PAUSED
and preserves state/media idempotency; Flexible multi-ad versus DCO single-ad,
existing conversion/budget guards, and ID/MY warning behavior remain intact.

The new attribution regression reproduced the old false acceptance before the
fix. Independent adversarial review also found JSON arrays/primitives were still
accepted as targeting/raw creative specs. Parsed targeting, its automation object,
and raw creative specs now enforce the applicable object boundary; inline, string,
and file probes cover rejection and valid alternatives. Final command results and independent review are recorded by TASK-146's
delivery run; fixture/reference success is not live API, account, causal lift,
or general model-reliability proof.

A fresh read-only decision trial by /root/meta_skill_trial used the updated
entrypoint and selected API/tutorial references. It selected mutually exclusive
attribution modes and safe validate/dry-run checks, rejected guaranteed Entity
Collapse/reset/CPR claims, and distinguished package version, SDK default, and
unverified account eligibility. Parent rubric review passed all three responses;
no account action or repair execution occurred in this decision trial. The worker
reported codex-cli 0.164.0; exact model ID was unavailable. This is one observed
trial, not a reliability estimate or API behavior test.

Independent scoped review by /root/meta_guidance_review returned APPROVE after
the object-shape repair, with 18 negative shape probes and three valid @file
object probes. Provider: OpenAI; exact model/reasoning were unavailable. It
excludes unrelated 9Router/shared-map baseline failures and unobserved live
API, account, or business outcomes. Delivery evidence binds final checks and
boundary approval; the global policy gate remains separately visible.
