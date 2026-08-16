# DotAds Engine v2

DotAds Engine v2 is a multi-tenant direct-response commerce system for Indonesian sellers and agencies. The repository contains an admin CMS, public storefront, API, shared database/auth/contracts, an embedded form runtime, and provider integrations.

## Repository Layout

```text
apps/
  admin/        Admin CMS and platform workspace
  api/          Hono API and generated API documentation
  storefront/   Astro storefront and landing-page renderer
packages/
  auth/         Authentication and authorization
  config/       Shared configuration
  contracts/    Shared validation and domain contracts
  db/           PostgreSQL schema, migrations, and seeds
  form-runtime/ Embedded form Web Component
  integrations/ Provider adapters and delivery workers
```

Runtime versions and available commands are owned by the checked-in package manifests and lockfile; this README does not pin or promise a framework major.

## Local Development

```bash
pnpm install
docker compose up -d db
pnpm --filter @dotads/db db:migrate
pnpm --filter @dotads/db db:seed
pnpm dev
```

Use the scripts in the current `package.json` files as executable truth. Do not access secrets, call live providers, deploy, or mutate a remote database without explicit approval.

## Documentation

Root-level documents are canonical. Same-name files under `docs/` are byte-identical compatibility mirrors.

Start with `INDEX.md`. Product requirements live in `PRD.md`; implementation work in `TASKS.md`; current state and dated evidence in `STATUS.md` and `BUILD-LOG.md`. System and operational contracts are owned by `ARCHITECTURE.md`, `DECISIONS.md`, `DATA-MODEL.md`, `IAM.md`, `SECURITY.md`, `PRIVACY.md`, `BILLING.md`, `OBSERVABILITY.md`, and `RELEASE.md`.

Documentation uses **Observed**, **Target**, and **Unknown**. A requirement or design statement is not evidence that the feature is implemented or production-ready.
