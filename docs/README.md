# Maintainer notes

Start with the [index](INDEX.md) for specification read order and the
[workspace guidance](AGENTS.md) for operating boundaries. Architecture,
requirements and current milestones belong to the documents listed there.

## Quick Start
```bash
# 1. Clone and install
git clone <repo-url> && cd dotads
pnpm install

# 2. Start local PostgreSQL and run migrations
docker compose up -d db
pnpm --filter @dotads/db db:generate
pnpm --filter @dotads/db db:migrate
pnpm --filter @dotads/db db:seed

# 3. Start development servers
pnpm dev
```

## External reference bundle

The [Bahasa Indonesia operator guide](references/dotads-meta/GUIDE.id.md),
[English AI terminal contract](references/dotads-meta/references/terminal-control.md),
[AI skill entrypoint](references/dotads-meta/SKILL.md),
[account reporting runtime](references/dotads-meta/references/account-workspace-runtime.md),
[historical workspace design](references/dotads-meta/references/account-workspace-guide.md),
and [bundle manifest](references/dotads-meta/mirror.json) provide the complete mirrored
`dotads-meta` documentation. Read these on demand for CLI account reporting and
workspace organization. The maintained source is the `meta-ads-cli` skill in
`ongkipro/dotfiles`; the manifest pins each mirrored file by content hash.

This bundle documents the separate dotfiles CLI. It does not add reporting
functionality or tenant access to the DotAds application. Existing product requirements, tenant authorization and
monetary rules remain authoritative. An ad account ID does not establish tenant
access, and no private account data or credentials belong in this reference bundle.
