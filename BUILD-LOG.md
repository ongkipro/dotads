# DotAds Engine v2 - Build & Verification Audit Log

## Log Entry - 2026-08-14: Phase 8 - Turnstile Bot Shield & IP Rate Limiting Integration
- **Action:** Integrated Cloudflare Turnstile CAPTCHA verification for public order submissions and strict dynamic IP rate-limiting middleware in Hono API.
- **Contract & Schema (`@dotads/contracts`):** Added `turnstileToken: z.string().optional()` field to `CreateOrderPublicSchema`.
- **Public API Route (`/api/v1/public/orders`):** Added `verifyTurnstileToken()` verification helper. Validates Cloudflare Turnstile token via siteverify endpoint; returns HTTP 403 Forbidden on bot verification failure.
- **Rate Limit Middleware (`apps/api/src/middleware/rate-limit.ts`):** Enforces 120 requests/minute global ceiling with `X-RateLimit-*` headers and HTTP 429 Too Many Requests response.

---

## Overall System Build & Release Status Matrix
- **Hono API Build (`pnpm --filter @dotads/api build`):** **PASS** (Clean TypeScript compilation).
- **Monorepo Build (`pnpm build`):** **PASS** (10/10 Workspace Packages/Apps clean compilation).
- **Next.js Admin Static Pre-render (`pnpm --filter @dotads/admin build`):** **PASS** (25/25 Static Routes prerendered clean).
- **Release Smoke Test (`pnpm run smoke:release`):** **PASS** (7/7 E2E smoke checks verified).
- **GitHub Sync (`ongkipro/dotads`):** **100% Synced** on `main` branch.
