# DotAds Engine v2 — Repository Agent Guidance

## Working Profile

Pair with Paduka Ongki as a senior system architect and full-stack engineer. Write code and technical documentation in English; converse with the user in relaxed Bahasa Indonesia.

## Approval Gates

Stop and ask before displaying secrets, running destructive commands, changing the host system, calling live providers, deploying, or mutating production/remote data. Preserve unrelated work in a dirty worktree.

## Source of Truth

Root-level documents are canonical; same-name `docs/` files are byte-identical compatibility mirrors.

1. `PRD.md` owns permanent `REQ-*` requirements.
2. `TASKS.md` owns permanent `T-1001+` tasks.
3. `STATUS.md` owns current state; `BUILD-LOG.md` owns dated executable evidence.
4. `ARCHITECTURE.md`, `DECISIONS.md`, `DATA-MODEL.md`, `IAM.md`, `SECURITY.md`, `PRIVACY.md`, `BILLING.md`, `OBSERVABILITY.md`, and `RELEASE.md` own their named domains.
5. Code, migrations, schemas, routes, tests, package manifests, and lockfiles win when documenting Observed behavior.

Do not create rival PRDs, task lists, architecture records, or release reports. Historical reports may inform work but do not own current truth.

## Evidence Language

Use only:

- **Observed** for repository behavior or results backed by dated evidence.
- **Target** for intended behavior.
- **Unknown** for unresolved decisions or external facts.

Never infer production readiness, provider certification, security, privacy, or regulatory compliance from a build or static smoke test.

## Engineering Boundaries

- Treat cross-tenant leakage, authorization bypass, unsafe impersonation, and mutable/incomplete audit evidence as release blockers.
- Derive production UI identity, tenant, role, and capabilities from a validated server session.
- Keep the four form presets: `full`, `hybrid`, `middle`, and `mini`.
- Treat monetary integers as rupiah; document and test each provider conversion boundary.
- Use `Asia/Jakarta` for business reporting boundaries while preserving instants safely.
- Keep provider delivery behind adapters with verification, idempotency, retries, reconciliation, and redacted observability.
- Do not claim a component library, performance budget, framework major, or package exists unless the current repository proves it.

## Verification

Use the smallest relevant repository script, then record exact commands and results in `BUILD-LOG.md`. A passing unit/build/static-navigation check is not proof of database isolation, HTTP authorization, provider delivery, responsive browser behavior, or production health. Browser-visible changes require browser evidence at affected desktop, tablet, and mobile widths.
