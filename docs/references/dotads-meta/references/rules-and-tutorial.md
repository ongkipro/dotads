# Meta Ads CLI & `dotads-meta` — Operations and Campaign Recipes

Operational contracts and illustrative campaign recipes. For dated platform facts, current API scope, installed CLI/SDK limits, and primary URLs, read [API and evidence](api-and-evidence.md). Do not load every reference for a bounded repair.

## Public market research versus account operations

For an explicitly Indonesian market or segment, start with
`dotads-meta baseline --market ID` and the on-demand
[Indonesia market reference](indonesia-market.md). This general cross-category
baseline does not require a product, brand history, token, installation, or live
account call. Province participation, selected city observations, and regional
transactions remain separate metrics; none is a campaign budget score.

Only account operations below require the relevant workspace and credentials.
Documentation stays English; customer content follows the explicitly selected
market. Do not infer ID from conversation language, IDR, or billing country.
Age 21–65+, all genders, and a consolidated campaign structure are conditional
test candidates, not a universal Meta requirement or verified performance optimum.

---

## Part 1: The 8 Golden Rules (Mandatory Guardrails)

1. **Workspace Separation (`~/dotfiles` vs Project Data):**
   - `~/dotfiles` holds only CLI helpers (`bin/dotads-meta`, `bin/dotads-meta-test`) and skills (`skills/local/meta-ads-cli/`).
   - Every account or brand workspace (`brand.json`, `campaigns/*.json`, `media/`, `.meta-state.json`) lives outside `~/dotfiles` under `~/Documents/dotads-meta-report/act_<id>--<slug>/` (or `<repo>/ads/`).
2. **Zero Plaintext Secrets in Project Folders:**
   - Never create `.env` files with Meta tokens inside project workspaces, and never pass tokens via CLI flags (`--access-token`).
   - Store all System User tokens in `~/.config/ai-local/secrets.env` (`chmod 600`) and let `dotads-meta` inject `ACCESS_TOKEN` in-memory via `secrets-env get`.
3. **Mandatory 4-Step Pre-Flight Sequence:**
   - Always run: (1) `dotads-meta validate <campaign.json>` -> (2) `dotads-meta deploy <campaign.json>` (dry-run) -> (3) obtain explicit user approval -> (4) `dotads-meta deploy <campaign.json> --apply`.
4. **Paused-by-Default Safety Gate:**
   - `dotads-meta deploy --apply` forces `--status PAUSED` on all created entities unless `--activate` is explicitly passed.
5. **Budget Exclusivity & Minor Currency Units:**
   - Choose exactly one budget mode per campaign: **CBO** (budget on `campaign`, none on `adsets`), **ABO** (no budget/bid_strategy/pacing_type on `campaign`, budget on each `adset`), or **Flex** (`"adset_budget_sharing": true` on `campaign`, `daily_budget` on each `adset`).
   - Budgets and bid amounts are integers in **minor currency units** (`5000` = `$50.00` USD).
6. **Conversion, Flexible Format & DCO Completeness:**
   - `OUTCOME_SALES` / `OFFSITE_CONVERSIONS` requires `pixel_id` + `custom_event_type` on the ad set and `conversion_domain` on the ad.
   - Multi-asset creatives (`images`, `videos`, `titles`, `bodies`, `descriptions`, `call_to_actions`) require either `"ad_format": "AUTOMATIC_FORMAT"` on the creative (ad-level Flexible Format, allowing multiple ads per ad set) or `"dynamic_creative": true` on the owning ad set (classic DCO, restricted to 1 ad per ad set).
7. **Stateful Idempotency (`.meta-state.json`):**
   - State writes replace the file atomically. Invalid state blocks deployment and status; restore a verified backup rather than deleting it. A remote creation can succeed before a state-write failure: reconcile the created ID before retrying. Do not run concurrent deployments in the same workspace.
   - Created IDs and SHA-256 media hashes (`image_hash`, `video_id`) are persisted after every step in `.meta-state.json`. Re-running `deploy --apply` skips already-created steps and reuses uploaded media hashes.
8. **Strict Flag Ordering for Raw `meta` Commands:**
   - Global flags (`--output json`, `--no-input`, `--no-color`, `--debug`) must precede `ads`; group flags (`--ad-account-id`, `--business-id`) must follow `ads` before the resource noun:
     ```bash
     dotads-meta run -- --output json --no-input ads --ad-account-id act_1234567890 campaign list
     ```

---

## Part 2: Documented Components and API Boundaries

### 1. Delivery components and operational hypotheses

The official sources describe Andromeda retrieval, GEM foundation-model transfer,
Lattice cross-domain learning, and GenRecs semantic tokens. These are evolving,
related components, not a documented fixed three-engine execution chain. Similar
creative content sharing representations does not prove duplicate ad rejection,
Entity Collapse, a ranking penalty, or a delivery reset after a creative edit.

Consider distinct creative concepts and suitable campaign consolidation as
experiments tied to the business objective, budget, audience constraints, and
observed results. Do not claim a particular ad-set structure controls GEM's
user-history access. Platform architecture alone does not justify switching
attribution, removing targeting restrictions, or changing spend.

### From delivery systems to campaign decisions

An eligible audience defines who may receive the ad. Retrieval selects candidate
ads; prediction/ranking estimates relevance and the chosen action or value. Meta's
[auction explanation](https://about.fb.com/wp-content/uploads/2023/01/Toward_fairness_in_personalized_ads.pdf)
(2023 foundation, pp. 15–16) combines bid, estimated action rate and ad quality
to select delivery. Budget/pacing also affects opportunities. This is a conceptual
explanation, not every current internal ranking stage or coefficient. Newer
GEM/GenRecs sources explain representation learning and transfer; they do not
publish a universal campaign layout. Optimizing clicks does not establish
purchase or profit optimization, and a downstream reporting metric does not
change the selected delivery objective by itself.

### Campaign decision procedure

Operational synthesis reviewed **2026-10-28**. Meta's
[Performance 5](https://www.facebookblueprint.com/student/path/253157-performance-5)
teaches simpler account structure, automation, creative diversification, data
quality and results validation. The following choices are local starting
hypotheses, not a Meta-certified optimum or a guaranteed ROAS recipe.

1. **Define success:** distinguish purchase count, purchase value, qualified leads,
   and profitable delivered orders. Specify currency, attribution, conversion
   lag, target CPA/ROAS, contribution costs and acceptable test loss. ROAS and
   conversion volume can trade off; a target needs business economics.
2. **Validate the signal and destination:** verify the selected conversion event,
   deduplication, values, consent and backend reconciliation; use
   `meta-ads-signal-engine` for tracking work. Check landing-page relevance,
   mobile completion, stock, checkout and delivery/payment constraints.
3. **Begin with a structure the budget can support:** for one objective, market
   and offer, one campaign with one prospecting ad set and a small batch of
   distinct concepts is a testable starting point. Three to five ads can be an
   illustrative batch when affordable; fewer may suit a small budget. This is
   not an algorithm requirement. Classic DCO's one-ad constraint still applies.
4. **Split only for a concrete reason:** separate serviceability, market/language,
   economics, business goal or a controlled experiment. Separate retargeting
   needs meaningful eligible demand and an explicit acquisition/exclusion plan.
   CBO suits flexible allocation; ABO can reserve test budgets. Unequal delivery
   does not prove a fair creative comparison; use a supported randomized test
   when that comparison is the decision.
5. **Choose audience and placement controls deliberately:** broad eligible reach
   and suitable automation are candidates, subject to policy, serviceability,
   brand and measurement constraints. Neither 21–65+ nor all genders is a
   universal Indonesia default. Do not split every province/city from public
   shopping statistics; those data are priors, not account conversion evidence.
6. **Test meaningful creative differences:** vary the relevant customer problem,
   benefit, demonstration, proof or format, retaining truthful offer facts.
   Cosmetic variants alone do not test distinct propositions. Match customer
   language to the explicit market and inspect actual placement previews.
7. **Predeclare the decision window:** use expected CPA and affordable spend to
   judge whether each planned cell can produce useful evidence. Document the
   time horizon, conversion lag, uncertainty and stop-loss; do not invent a
   universal 24-hour cutoff, purchase count or ROAS threshold. Diagnose signal,
   funnel and economics before attributing failure to targeting or an engine.
8. **Validate, iterate and scale deliberately:** compare consistent scopes and
   backend outcomes, preserve a baseline and log material changes. A plausible
   winner is provisional until further evidence supports it. Propose controlled
   budget/creative changes within the approved risk; live writes and new spend
   require their applicable approval. Record account learning privately and
   review reusable methods before updating the shared skill.

The [source record](api-and-evidence.md) explains retrieval, ranking and model
transfer; these systems predict relevance and actions rather than expose a
hidden advertiser-side "winning" switch. Use
[economics and evidence rules](roas-cpr-profit-intelligence.md) when judging a test.

### 2. Marketing API v22.0–v26.0 Reference Matrix

| Feature | Legacy Pattern (Deprecated/Blocked) | 2025–2026 Canonical API Pattern (`dotads-meta`) |
| --- | --- | --- |
| **Advantage+ Sales / App / Leads** | `smart_promotion_type: "AUTOMATED_SHOPPING_ADS"` or `"SMART_APP_PROMOTION"` (create, duplicate, and update retired in v25; all versions since 2026-05-19) | Standard `objective` (`OUTCOME_SALES`, `OUTCOME_LEADS`, `OUTCOME_APP_PROMOTION`) + CBO budget + `"advantage_audience": true` on ad set -> local automation candidate; actual server `advantage_state` and placement eligibility require account evidence |
| **Multi-Asset Creative Testing** | Ad-set `"dynamic_creative": true` only (limits ad set to 1 ad) | Creative `"ad_format": "AUTOMATIC_FORMAT"` (ad-level Flexible Format `asset_feed_spec`; supports multiple multi-asset ads in one ad set) |
| **Advantage+ Creative Enhancements** | Bundled `creative_features_spec.standard_enhancements` (deprecated in v22.0+) | Granular `degrees_of_freedom_spec.creative_features_spec` keys (`image_touchups`, `image_templates`, `video_auto_crop`, `text_optimizations`, `inline_comment`, `background_generation`, `image_expansion`, `text_generation`) |
| **Attribution Windows** | `7d_view` and `28d_view` (removed from Insights & ad set attribution specs) | `1d_view` (`VIEW_THROUGH`, `window_days: 1`), `1d_ev` (`ENGAGED_VIDEO_VIEW`, `window_days: 1`), `7d_click` / `1d_click` (`CLICK_THROUGH`) |
| **Causal Lift Optimization** | Correlational post-view/click optimization only | Ad set `"incremental_attribution": true` (`--incremental-attribution`), only for eligible goals/bids and without `attribution_spec`; this is an optimization setting, not measured causal lift |
| **ABO Testing Budget Liquidity** | Rigid isolated ABO budgets | Campaign `"adset_budget_sharing": true` (`--adset-budget-sharing`) to share up to 20% budget across ad sets |
| **Multi-Advertiser Placement** | Implicit auto-enrollment | Creative `"contextual_multi_ads": false` (`--no-contextual-multi-ads`) to opt out when offer isolation is required |

---

For explicit windows, use a separate mode such as
`"attribution_spec": [{"event_type":"CLICK_THROUGH","window_days":7}]`
with incremental attribution omitted or false. Validate the actual goal/window
combination; the offline validator is not a complete API eligibility oracle.

The source record covers the 2026-10-27 poll, Web and App, and HEF changes.
Installed CLI 1.2.0 uses SDK 24.x; a v26 checklist does not upgrade its requests.

### 3. Granular `degrees_of_freedom_spec` JSON Reference (v22.0–v26.0)

Prefer explicit feature choices to the retired bundled pattern. This is an illustrative shape: check each feature name, current availability, and enrollment behavior before live use. Opt-outs do not guarantee every rendering preserves the intended brand appearance:

```json
{
  "creative_features_spec": {
    "image_touchups": { "enroll_status": "OPT_IN" },
    "image_templates": { "enroll_status": "OPT_OUT" },
    "video_auto_crop": { "enroll_status": "OPT_OUT" },
    "text_optimizations": { "enroll_status": "OPT_IN" },
    "inline_comment": { "enroll_status": "OPT_IN" },
    "background_generation": { "enroll_status": "OPT_OUT" },
    "image_expansion": { "enroll_status": "OPT_OUT" },
    "text_generation": { "enroll_status": "OPT_OUT" }
  }
}
```

### 4. Value Rules & Opportunity Score Operational Rules

- **Value Rules:** Assess against the approved business objective and current
  account eligibility. Verify limits, matching order, and the actual upstream
  operation in official documentation; this helper has no first-class Value
  Rules manifest feature. Do not infer a guaranteed profit ceiling.
- **Opportunity Score and account guidance:**
  - Measures structural alignment with Meta's automation defaults, **not** business ROAS or net profit.
  - `meta ads guidance list` reads account recommendations. A returned score
    requires its own defined source; do not assume this CLI command returns one.
  - Never auto-apply recommendations that remove deliberate geographic exclusions (e.g. non-serviceable COD islands) or collapse structured creative testing ad sets.

---

## Part 3: One-Time Setup Tutorial (Device & Business Manager)

### 1. Device Bootstrap

Run only when synchronization/installation is authorized; offline validation
does not need setup, credentials, or account access.
```bash
dotsync
dotads-meta setup
meta --version
dotads-meta --help
```

### 2. Meta Developer App & Business Manager System User
1. **Meta App (`developers.facebook.com/apps`):** Create a **Business** app connected to your Business Portfolio, add **Marketing API**, configure a Privacy Policy URL in **App Settings > Basic**, and switch **App Mode** from `Development` to **`Live`** (prevents `Error 1885183` on `creative create`).
2. **System User (`business.facebook.com/latest/settings/system_users`):** Create an **Admin** System User and **Assign Assets** for your Ad Account (*Manage campaigns*), Facebook Page (*Create ads*), Instagram Account (*Ads*), and Dataset/Pixel (*Manage events / Create ads*).
3. **Token Generation:** Generate a token for your App with scopes `ads_management`, `ads_read`, `business_management`, `pages_read_engagement`, `pages_manage_ads` (plus `catalog_management` if needed).
4. **Save to `secrets.env`:** Add `META_ACCESS_TOKEN=<token>` (or per-BM `META_ACCESS_TOKEN_<BRAND>`) to `~/.config/ai-local/secrets.env` and verify:
   ```bash
   secrets-env check
   dotads-meta doctor
   ```

### 3. Discover Asset IDs via Terminal
```bash
dotads-meta run -- --output json --no-input ads adaccount list
dotads-meta run -- --output json --no-input ads --ad-account-id act_YOUR_ID page list
dotads-meta run -- --output json --no-input ads --ad-account-id act_YOUR_ID dataset list
```

---

## Part 4: Illustrative Campaign Manifest Recipes

Examples use fictional IDs, offers, copy, and media. Replace them with verified
brand facts/assets; validate and dry-run before seeking approval for any live
execution. Passing the helper does not establish account/API eligibility.

### Recipe 1: Unified Advantage+ Sales Campaign (`ADVANTAGE_PLUS_SALES` + Incremental Attribution + Granular DOF)

Illustrates a standard sales CBO candidate with explicit audience opt-in and incremental attribution. It does not confirm server Advantage+ eligibility. Use only with an eligible goal/bid, and do not add explicit attribution windows:

```json
{
  "campaign": {
    "key": "camp_adv_plus_sales",
    "name": "ID_AdvPlus_Sales_CBO",
    "objective": "OUTCOME_SALES",
    "status": "PAUSED",
    "daily_budget": 10000
  },
  "creatives": [
    {
      "key": "cr_ugc_problem_v1",
      "name": "Cr_9x16_UGC_ProblemHook_V1",
      "video": "media/ugc-problem-9x16.mp4",
      "title": "Jalan Seharian Tanpa Nyeri Tumit",
      "body": "Tumit sering nyeri setelah berdiri atau jalan lebih dari 4 jam? Insole dual-density rebound foam menopang lengkung kaki dan meredam 68% tekanan di titik tumpu.",
      "description": "Garansi tukar ukuran 14 hari",
      "link_url": "https://example.com/products/flagship",
      "call_to_action": "SHOP_NOW",
      "contextual_multi_ads": false,
      "url_tags": "utm_source=meta&utm_medium=paid_social&utm_campaign=adv_plus_sales&utm_content=ugc_problem_v1",
      "degrees_of_freedom_spec": {
        "creative_features_spec": {
          "video_auto_crop": { "enroll_status": "OPT_OUT" },
          "text_optimizations": { "enroll_status": "OPT_IN" },
          "inline_comment": { "enroll_status": "OPT_IN" },
          "text_generation": { "enroll_status": "OPT_OUT" }
        }
      }
    },
    {
      "key": "cr_static_comparison_v1",
      "name": "Cr_4x5_Static_Comparison_V1",
      "image": "media/comparison-4x5.jpg",
      "title": "Dipakai 42.000+ Pekerja Aktif",
      "body": "Uji ketahanan bantalan setelah 6 bulan pemakaian harian di jalan aspal dan lantai keras.",
      "description": "Dikirim di hari yang sama",
      "link_url": "https://example.com/products/flagship",
      "call_to_action": "SHOP_NOW",
      "contextual_multi_ads": false,
      "url_tags": "utm_source=meta&utm_medium=paid_social&utm_campaign=adv_plus_sales&utm_content=static_comparison_v1"
    }
  ],
  "adsets": [
    {
      "key": "adset_adv_broad_id",
      "name": "AdSet_AdvAudience_ID_Incremental",
      "optimization_goal": "OFFSITE_CONVERSIONS",
      "billing_event": "IMPRESSIONS",
      "custom_event_type": "PURCHASE",
      "targeting_countries": ["ID"],
      "advantage_audience": true,
      "incremental_attribution": true,
      "status": "PAUSED"
    }
  ],
  "ads": [
    {
      "key": "ad_ugc_problem_v1",
      "name": "Ad_UGC_ProblemHook_V1",
      "adset": "adset_adv_broad_id",
      "creative": "cr_ugc_problem_v1",
      "status": "PAUSED"
    },
    {
      "key": "ad_static_comparison_v1",
      "name": "Ad_Static_Comparison_V1",
      "adset": "adset_adv_broad_id",
      "creative": "cr_static_comparison_v1",
      "status": "PAUSED"
    }
  ]
}
```

### Recipe 2: Ad-Level Flexible Ad Format (`AUTOMATIC_FORMAT`) — Multiple Multi-Asset Concepts in One Ad Set

Uses `"ad_format": "AUTOMATIC_FORMAT"` on each creative to supply multiple assets per concept while serving multiple concepts inside one consolidated ad set:

```json
{
  "campaign": {
    "key": "camp_flex_format_sales",
    "name": "ID_Sales_CBO_FlexibleFormat",
    "objective": "OUTCOME_SALES",
    "status": "PAUSED",
    "daily_budget": 12000
  },
  "creatives": [
    {
      "key": "cr_flex_angle_durability",
      "name": "Cr_Flex_Durability_Angle",
      "ad_format": "AUTOMATIC_FORMAT",
      "images": ["media/durability-1.jpg", "media/durability-2.jpg"],
      "titles": ["Full-Grain Leather Built to Last", "10-Year Stitch Guarantee"],
      "bodies": [
        "Hand-cut full-grain cowhide that develops a richer patina every year.",
        "Zero synthetic peeling—backed by our workshop repair guarantee."
      ],
      "descriptions": ["Free shipping nationwide"],
      "call_to_actions": ["SHOP_NOW"],
      "link_url": "https://example.com/collections/leather",
      "contextual_multi_ads": false
    },
    {
      "key": "cr_flex_angle_gift",
      "name": "Cr_Flex_ExecutiveGift_Angle",
      "ad_format": "AUTOMATIC_FORMAT",
      "images": ["media/gift-box-1.jpg", "media/gift-box-2.jpg"],
      "titles": ["Ready-to-Gift Luxury Box Included", "Custom Monogram Available"],
      "bodies": [
        "Arrives in a signature hard-shell gift box with complimentary initials embossing.",
        "The practical executive gift that gets used every single day."
      ],
      "descriptions": ["Same-day dispatch before 15:00 WIB"],
      "call_to_actions": ["SHOP_NOW"],
      "link_url": "https://example.com/collections/gifts",
      "contextual_multi_ads": false
    }
  ],
  "adsets": [
    {
      "key": "adset_consolidated_id",
      "name": "AdSet_Consolidated_AdvAudience_ID",
      "optimization_goal": "OFFSITE_CONVERSIONS",
      "billing_event": "IMPRESSIONS",
      "custom_event_type": "PURCHASE",
      "targeting_countries": ["ID"],
      "advantage_audience": true,
      "status": "PAUSED"
    }
  ],
  "ads": [
    {
      "key": "ad_flex_durability",
      "name": "Ad_Flex_Durability",
      "adset": "adset_consolidated_id",
      "creative": "cr_flex_angle_durability",
      "status": "PAUSED"
    },
    {
      "key": "ad_flex_gift",
      "name": "Ad_Flex_ExecutiveGift",
      "adset": "adset_consolidated_id",
      "creative": "cr_flex_angle_gift",
      "status": "PAUSED"
    }
  ]
}
```

### Recipe 3: Classic Dynamic Creative Optimization (DCO — 1 Ad per Ad Set)

When using ad-set-level `"dynamic_creative": true`, keep exactly 1 ad in that DCO ad set:

```json
{
  "campaign": {
    "key": "camp_dco_sales",
    "name": "ID_Sales_CBO_DCO",
    "objective": "OUTCOME_SALES",
    "status": "PAUSED",
    "daily_budget": 8000
  },
  "creatives": [
    {
      "key": "cr_dco_pack",
      "name": "Cr_DCO_3Img_2Copy",
      "images": ["media/img1.jpg", "media/img2.jpg", "media/img3.jpg"],
      "titles": ["Headline Variant A", "Headline Variant B"],
      "bodies": ["Primary text variant 1.", "Primary text variant 2."],
      "descriptions": ["Ships within 24 hours"],
      "call_to_actions": ["SHOP_NOW", "LEARN_MORE"],
      "link_url": "https://example.com/collections/all"
    }
  ],
  "adsets": [
    {
      "key": "adset_dco_id",
      "name": "AdSet_DCO_ID",
      "optimization_goal": "OFFSITE_CONVERSIONS",
      "billing_event": "IMPRESSIONS",
      "custom_event_type": "PURCHASE",
      "targeting_countries": ["ID"],
      "dynamic_creative": true,
      "status": "PAUSED"
    }
  ],
  "ads": [
    {
      "key": "ad_dco_pack",
      "name": "Ad_DCO_Pack",
      "adset": "adset_dco_id",
      "creative": "cr_dco_pack"
    }
  ]
}
```

### Recipe 4: Flex Budget (`adset_budget_sharing: true`) Creative Testing Campaign

Uses ABO with `"adset_budget_sharing": true` so each creative concept gets a dedicated daily budget while allowing Meta to shift up to 20% budget toward the winning ad set:

```json
{
  "campaign": {
    "key": "camp_flex_creative_test",
    "name": "ID_Sales_FlexBudget_ConceptTest",
    "objective": "OUTCOME_SALES",
    "adset_budget_sharing": true,
    "status": "PAUSED"
  },
  "creatives": [
    {
      "key": "cr_concept_a",
      "name": "Cr_ConceptA_FounderStory",
      "video": "media/founder-story.mp4",
      "title": "Why We Built This From Scratch",
      "body": "3 years of R&D to solve tropical humidity wear.",
      "link_url": "https://example.com/products/flagship",
      "call_to_action": "SHOP_NOW"
    },
    {
      "key": "cr_concept_b",
      "name": "Cr_ConceptB_UnboxingBundle",
      "video": "media/unboxing-bundle.mp4",
      "title": "Complete 3-Piece Starter Bundle",
      "body": "Everything you need in one box—save 25% on the bundle today.",
      "link_url": "https://example.com/products/bundle",
      "call_to_action": "SHOP_NOW"
    }
  ],
  "adsets": [
    {
      "key": "adset_test_a",
      "name": "AdSet_Test_ConceptA",
      "daily_budget": 5000,
      "optimization_goal": "OFFSITE_CONVERSIONS",
      "billing_event": "IMPRESSIONS",
      "custom_event_type": "PURCHASE",
      "targeting_countries": ["ID"],
      "advantage_audience": true,
      "status": "PAUSED"
    },
    {
      "key": "adset_test_b",
      "name": "AdSet_Test_ConceptB",
      "daily_budget": 5000,
      "optimization_goal": "OFFSITE_CONVERSIONS",
      "billing_event": "IMPRESSIONS",
      "custom_event_type": "PURCHASE",
      "targeting_countries": ["ID"],
      "advantage_audience": true,
      "status": "PAUSED"
    }
  ],
  "ads": [
    {
      "key": "ad_test_a",
      "name": "Ad_Test_ConceptA",
      "adset": "adset_test_a",
      "creative": "cr_concept_a"
    },
    {
      "key": "ad_test_b",
      "name": "Ad_Test_ConceptB",
      "adset": "adset_test_b",
      "creative": "cr_concept_b"
    }
  ]
}
```

---

## Part 5: Day-2 Operations (Insights, Guidance, Status & Budget Updates)

Read commands need authorized account access. Update commands below are proposals;
validate their exact installed syntax and obtain approval before live execution.
The helper read adapter uses the installed official SDK for explicit Insights
scope; native CLI 1.2.0 still lacks the required level/attribution flags. Read
the [runtime contract](account-workspace-runtime.md). Saved scoped JSON is the
offline alternative; SDK fixture coverage does not prove actual account access.

```bash
# 1. Inspect supported Insights controls (local help; no credentials required)
meta ads insights get --help

# 2. Read account recommendations
dotads-meta run --brand ./brand.json -- \
  --output json --no-input ads --ad-account-id act_1234567890 guidance list

# 3. Activate or pause a campaign
dotads-meta run --brand ./brand.json -- \
  --output json --no-input ads --ad-account-id act_1234567890 \
  campaign update <CAMPAIGN_ID> --status ACTIVE

# 4. Update a CBO campaign daily budget (in minor currency units)
dotads-meta run --brand ./brand.json -- \
  --output json --no-input ads --ad-account-id act_1234567890 \
  campaign update <CAMPAIGN_ID> --daily-budget 7500
```
