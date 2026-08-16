# DotAds Engine v2 — Public Authentication & Gate Hardening Task List

> **Historical/superseded record — 2026-08-16.** This task list is superseded by permanent `T-1001+` tasks in `TASKS.md`; completion and evidence are owned by `STATUS.md` and `BUILD-LOG.md`.

## Phase 1: API Route Mounting & Security Gate Hardening
- [ ] **Task 1**: Mount `betterAuth` HTTP handler on `/api/auth/*` in `apps/api/src/app.ts` so `better-auth` API routes are live.
- [ ] **Task 2**: Guard `test-superadmin-token` bypass in `apps/api/src/middleware/auth.ts` to require `process.env.NODE_ENV === "test"`.
- [ ] **Task 3**: Remove `x-tenant-id` header override fallback for production requests in `authMiddleware`.

## Phase 2: Public Registration & Super Admin Bootstrap API Routes
- [ ] **Task 4**: Create `POST /api/v1/public/auth/register-merchant` route in `apps/api/src/routes/public.ts` for atomic Tenant + Owner User provisioning.
- [ ] **Task 5**: Create `POST /api/v1/public/auth/bootstrap-superadmin` route in `apps/api/src/routes/public.ts` with database count check (fails closed if Super Admin exists).
- [ ] **Task 6**: Add Zod schemas and OpenAPI contract definitions for login, signup, and superadmin bootstrap in `@dotads/contracts`.

## Phase 3: Admin UI Authentication Pages & Middleware
- [ ] **Task 7**: Create Login Page (`apps/admin/src/app/login/page.tsx`) with dark-mode styling and error feedback.
- [ ] **Task 8**: Create Merchant Register Page (`apps/admin/src/app/register/page.tsx`) with store slug validation and auto-redirect.
- [ ] **Task 9**: Create Super Admin Bootstrap Setup Page (`apps/admin/src/app/super-admin/setup/page.tsx`).
- [ ] **Task 10**: Implement Next.js Auth Guard Middleware (`apps/admin/src/middleware.ts`) to secure `/admin/*` and `/super-admin/*`.

## Phase 4: Verification & E2E Testing
- [ ] **Task 11**: Create automated smoke script (`apps/api/scripts/smoke-public-auth.ts`) testing registration, login, superadmin bootstrap, and gate hardening.
- [ ] **Task 12**: Run `pnpm build` and `pnpm test` to verify 100% build pass and zero regressions.
