# DotAds Engine v2 - Build & Verification Audit Log

## Log Entry - 2026-08-14: Logistics Exponential Backoff Auto-Retry (DLQ) & Local High-Availability Docker Spec
- **Action:** Enhanced Mengantar logistics queue processing with exponential backoff retries (`nextRetryAt` timestamp calculation: 10s, 20s, 40s) and automatic transition to Dead-Letter Queue (`status: "dlq"`) after 3 failed attempts.
- **Docker & Infrastructure Spec (`docker-compose.coolify.yml`):** Added PgBouncer connection pooler container spec (`edoburu/pgbouncer:latest` on port 6432) configured for transaction pooling to handle high-concurrency Meta Ads traffic spikes. (Local/git spec updated; live VPS upload to Coolify deferred per user instruction).
- **Automated DB Backup Script (`scripts/backup-db.sh`):** Created executable script for PostgreSQL logical database dump backup with `.sql.gz` compression.

---

## Overall System Build & Release Status Matrix
- **Monorepo Build (`pnpm build`):** **PASS** (10/10 Workspace Packages/Apps clean compilation).
- **Next.js Admin Static Pre-render (`pnpm --filter @dotads/admin build`):** **PASS** (25/25 Static Routes prerendered clean).
- **Astro Storefront Build (`pnpm --filter @dotads/storefront build`):** **PASS** (Zero-JS static HTML prerendered clean).
- **Release Smoke Test (`pnpm run smoke:release`):** **PASS** (7/7 E2E smoke checks verified).
- **GitHub Sync (`ongkipro/dotads`):** **100% Synced** on `main` branch.
