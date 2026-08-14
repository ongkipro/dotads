# DotAds Engine v2 — PRD: Public Authentication, Tenant Onboarding & Gate Hardening

## Goals
1. Implement production-grade, secure, self-service authentication and tenant onboarding workflows for DotAds Engine v2.
2. Provide seamless user login (`/login`), merchant store signup (`/register`), and safe first-time Super Admin bootstrap (`/super-admin/setup`).
3. Fully close all developer bypass gates (`test-superadmin-token` header overrides) in non-test environments.
4. Mount `better-auth` handlers natively on Hono (`/api/auth/*`) and secure Next.js Admin App routes with session middleware.

## Non-Goals
- Supporting passwordless SMS/OTP login (email + password & session cookie / OAuth organization flow is canonical).
- Allowing unauthenticated creation of Super Admin accounts after initial setup is bootstrapped.

## Detailed Requirements

### R1. API Mount & Gate Hardening (`apps/api`)
- **R1.1**: Mount Better-Auth HTTP handler on `app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))` in `apps/api/src/app.ts`.
- **R1.2**: Guard `test-superadmin-token` bypass in `apps/api/src/middleware/auth.ts` strictly with `process.env.NODE_ENV === "test"`. Deny `test-superadmin-token` in `production` or `development`.
- **R1.3**: Eliminate `x-tenant-id` header override fallback for production API requests. Derive tenant identity exclusively from authenticated user session organization or domain host resolution.

### R2. Public Self-Service Registration APIs (`apps/api`)
- **R2.1**: **Public Merchant Registration Endpoint (`POST /api/v1/public/auth/register-merchant`)**:
  - Accepts `storeName`, `storeSlug`, `ownerName`, `email`, `password`.
  - Atomically creates Tenant record, User record, Organization record, and assigns `TENANT_OWNER` role.
  - Returns authenticated session cookie / token.
- **R2.2**: **Super Admin First-Time Bootstrap Endpoint (`POST /api/v1/public/auth/bootstrap-superadmin`)**:
  - Checks if any user with `role === "SUPER_ADMIN"` exists in the database.
  - If count === 0: allows creating initial Super Admin account (`name`, `email`, `password`) and sets `role = "SUPER_ADMIN"`.
  - If count > 0: permanently fails closed with HTTP 403 Forbidden ("Super Admin account already bootstrapped").

### R3. Admin Dashboard Authentication & Onboarding UI (`apps/admin`)
- **R3.1**: **Login Screen (`apps/admin/src/app/login/page.tsx`)**:
  - Responsive, dark-mode ready Tailwind UI for email/password authentication.
  - Connects to `/api/auth/sign-in/email`, sets session cookie, redirects user to `/admin` or `/super-admin` based on role.
- **R3.2**: **Merchant Registration Screen (`apps/admin/src/app/register/page.tsx`)**:
  - 2-step onboarding form (Store Details -> Owner Account Details).
  - Calls `POST /api/v1/public/auth/register-merchant`, provisions tenant store, and navigates to `/admin`.
- **R3.3**: **Super Admin Setup Screen (`apps/admin/src/app/super-admin/setup/page.tsx`)**:
  - Visible only when platform is unbootstrapped. Allows claiming root Super Admin user.
- **R3.4**: **Next.js Auth Guard Middleware (`apps/admin/src/middleware.ts`)**:
  - Protects `/admin/*` and `/super-admin/*` routes. Redirects unauthenticated visitors to `/login`.
