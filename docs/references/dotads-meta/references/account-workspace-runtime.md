# Account reporting runtime

This is the implemented CLI contract for scoped account reporting. Repository
code, tests and TASK-155 evidence own execution truth. The earlier
[revision 3 design](account-workspace-guide.md) remains a historical proposal;
its implementation-status wording does not describe this newer runtime.

Implemented paths have offline SDK, filesystem and CLI evidence. Actual Meta
account permissions, effective server version, field availability and real macOS
execution remain unverified until an authorized runtime trial supplies them.

## Ownership and access

Dotfiles owns the helper, skill and guides. Private reports/assets live under
`~/Documents/dotads-meta-report/`; repository pulls do not transfer them or their
credentials. The separate DotAds application has its own repository and tenant
authorization. Its documentation mirror grants no application capability.

Account reads need the operator's selected scope and approved token reference.
Never ask for a token value in chat. `--token-env META_ACCESS_TOKEN` names a local
key. The parent uses `secrets-env`; only the provider child's environment receives
`ACCESS_TOKEN`. SDK errors and credential-bearing outputs are sanitized/rejected.
No reporting command creates ads, activates spend or changes campaign budgets.

## Commands

```bash
# Offline: inspect locally registered accounts without creating a root
dotads-meta accounts --local --json

# Authorized read: discover available accounts, then explicitly select one
dotads-meta accounts --token-env META_ACCESS_TOKEN --json

# Authorized read: explicit account, dates and reporting levels
dotads-meta sync --account act_123 --since 2026-09-01 --until 2026-09-30 \
  --levels account,campaign,adset,ad --token-env META_ACCESS_TOKEN --json

# Offline: import a selected collection envelope with the same explicit scope
dotads-meta sync --account act_123 --since 2026-09-01 --until 2026-09-30 \
  --levels ad --input ./collection.json --json

# Offline: use the selected scope's last complete snapshot
dotads-meta report --account act_123 --json

# Offline: explicitly choose a partial or historical snapshot / a saved scope
dotads-meta report --account act_123 --snapshot '<saved-snapshot-id>' --json
dotads-meta report --account act_123 --scope-key '<saved-scope-key>' --json

# Selected assets: copy by default; move requires explicit operator authorization
dotads-meta import-media --account act_123 ./selected-image.jpg --json
dotads-meta import-media --account act_123 ./selected-video.mp4 --move --json

# Selected external project: plan first; apply adds an operational reference only
dotads-meta adopt --account act_123 ./existing-project --json
dotads-meta adopt --account act_123 ./existing-project --apply --json
```

All IDs, dates, paths and saved keys above are examples. Replace them with
operator-selected facts; examples are never evidence of account access.
`init name` remains a separate local campaign-template scaffold. It does not
discover an account or prove the fictional template values.

When an existing initialized folder already occupies the report root, explicitly
select it with `sync ... --existing-directory /selected/contained/folder`. Its
brand, state, campaigns and memory must agree with the chosen account. Unknown,
mixed or conflicting ownership stops registration. Notes, state and operational
files stay in place. An account rename changes display metadata, not its registered
directory. Multiple unregistered same-ID folders require an explicit choice.

## Transport and scope

The installed official CLI 1.2.0 does not expose the needed Insights level and
attribution controls. The read adapter uses its already-installed official
`facebook-business` SDK through a separate Python process. Native CLI writes and
the existing dry-run/PAUSED deployment path retain their own approval gates.

The helper resolves Python beside the real `meta` binary; an explicit
`DOTADS_META_PYTHON` path can select an existing compatible environment. It does
not install dependencies during reads or offline report rendering. The observed
SDK is 24.0.1, default requested API v24.0; this is not a claim of v26 eligibility
or current server behavior. Check the [API source record](api-and-evidence.md)
and current official support dates before real use or upgrades.

An internal `--plan` validates and normalizes the request before credential
access. It shares the exact scope helper with collection, including inventory
field sets and status filters; failed refreshes retain that same request identity.
The provider uses explicit read-only SDK calls, cursor continuation and bounded
retries. It never follows arbitrary `paging.next` URLs. Page exhaustion, truncation,
denial, malformed responses and empty success remain distinct.

Defaults are four inventory resources (campaigns, ad sets, ads, creatives), all
four Insights levels, no breakdowns, `all_days`, and conversion action report
time. Dates are mandatory. The provider records exact effective-status filters,
requested/required/observed fields, account currency/timezone and collection
times. Completeness covers this declared scope and the server's visible records;
it does not establish retained deleted objects or all lifetime account history.

`--breakdowns age,gender`, `--attribution '{"action_attribution_windows":["7d_click"]}'`
and `--action-report-time conversion|impression|mixed` change measurement scope.
Conflicting attribution sources/windows fail locally. Unsupported combinations
fail visibly; controls are not silently dropped. Requested settings are saved;
unobserved effective attribution/API settings remain unknown.

The provider defaults to 100 pages per resource/query; `--max-pages` accepts
1–1000. CLI collection is bounded to 180 seconds and 128 MiB stdout. Hitting a
limit is not a complete empty result. Large asynchronous backfill and resumable
network checkpoints are not implemented; rerun a deliberate bounded scope.

## Files and publication

```text
dotads-meta-report/
  GUIDE.md
  accounts.json
  act_<id>--<initial-name>/
    account.json, ACCOUNT.md, NOTES.md, sync.json
    data/snapshots/<snapshot-id>/
    reports/<period-and-scope>/<immutable-revision>/
    media/index.json, media/images/, media/videos/
    web/index.json
    operational-references.json       # when an adoption is explicitly applied
```

Registry identity is the account ID. Paths, registry/schema/identity conflicts,
symlinks and uncertain locks stop the operation; never delete locks blindly.
The root must have verified private permissions. Parent directories must remain
operator-controlled; hostile concurrent directory replacement is outside this
local bootstrap contract.

Each query has a deterministic identity covering its exact account, dates,
level, fields, breakdowns, attribution and definitions. Required inventory field
sets and filters participate in collection scope. Row identity also includes
entity, date bucket and returned breakdown dimensions. Different levels and
breakdown scopes are not added together into a fabricated account total.

Snapshots and their manifests publish before mutable pointers. `sync.json` tracks
the latest attempt and last complete success per scope. Partial/failed attempts
cannot replace complete-success pointers. After a failed different-period request,
default reporting cannot silently show a different period as current; select the
older scope explicitly if needed. Reports expose failed/partial latest attempts.

Markdown/CSV revisions pin snapshot bytes, queries, renderer/metric versions,
selection/freshness context, and exact media/web index hashes. Old revisions stay
immutable, including pinned enrichment records. A new restatement, selection or
enrichment creates a new revision. Corrupt saved inputs/artifacts fail clearly.
`NOTES.md` and deployment state remain human/operational authority.

## Interpretation and input provenance

Reports retain zero-spend inventory and unresolved historical entity references.
Missing conversions, unsupported fields and unknown costs are not measured zero.
Platform spend, clicks, purchases and ROAS do not establish net profit, causal
winners or authorization to change spend. Scoped economics remain an explicit
separate input through the existing analysis workflow; mixed-brand account costs
are never applied globally by these reports.

`--input` expects the collection envelope used by the SDK adapter, not arbitrary
Ads Manager CSV. It needs account identity/currency/timezone, explicit scope,
per-resource coverage/rows, query envelopes and source times. An AI may normalize
authorized exports only when those facts are actually known; mark unavailable
resources explicitly rather than inventing complete coverage. Input bytes are
hashed once and tagged `LOCAL_INPUT`; a declared SDK source is not proof of an
authenticated read on this device.

Indonesian market priors apply only to an explicitly selected ID market. Account
currency, timezone and conversation language do not establish target geography.

## Assets, destinations and recovery

Local import stores verified content-addressed bytes with source provenance.
Copies preserve the original. Explicit moves use a private source claim and
durable journal; destination bytes and index must be verified before cleanup.
Recreated source paths, changed bytes, conflicting journals and existing claims
stop cleanup or require reconciliation. Recovery never overwrites a recreated
source. Repeating a completed unchanged operation is idempotent.

Remote creative images/videos/thumbnails remain labeled references. The local
hash does not prove a Meta image hash or creative association. Destination metadata
includes multiple URLs/native destinations where returned; no page capture,
remote original download, transcription or creative-quality proof is implied.
URL credentials and CSV formula-leading strings are handled defensively.

`adopt` reads only the selected project's operational files, skips credentials,
checks structured account bindings, and hashes the plan. Apply requires that
unchanged plan and writes a reference/result in the reporting workspace. It never
copies deployment state, moves project media or changes the source project.
Full operational cutover, cross-device transfer and source cleanup remain separate
explicitly planned operations.
