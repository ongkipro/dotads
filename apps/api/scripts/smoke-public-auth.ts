import { app } from "../src/app.ts";
import assert from "node:assert";

async function runPublicAuthSmoke() {
  console.log("Starting Public Authentication & Gate Hardening Smoke Test...");

  // 1. GET /api/auth/get-session (Verify Better Auth handler is mounted)
  const getSessionRes = await app.request("/api/auth/get-session", { method: "GET" });
  assert.strictEqual(getSessionRes.status, 200, "Better Auth get-session route must return 200");

  // 2. POST /api/v1/public/auth/register-merchant (Atomic Merchant Onboarding)
  const uniqueStoreSlug = `smoke-store-${Date.now()}`;
  const uniqueEmail = `owner-${Date.now()}@test.com`;

  const regRes = await app.request("/api/v1/public/auth/register-merchant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      storeName: "Smoke Merchant Store",
      storeSlug: uniqueStoreSlug,
      ownerName: "Smoke Store Owner",
      email: uniqueEmail,
      password: "SecurePassword123!",
    }),
  });

  assert.strictEqual(regRes.status, 201, "Merchant registration must return 201 Created");
  const regData = await regRes.json();
  assert.ok(regData.tenant?.id, "Response must include provisioned tenant ID");
  assert.strictEqual(regData.tenant?.slug, uniqueStoreSlug, "Tenant slug must match requested slug");
  assert.strictEqual(regData.user?.role, "TENANT_OWNER", "Provisioned user role must be TENANT_OWNER");

  // 3. Test Duplicate Registration Collision (409 Conflict)
  const dupRes = await app.request("/api/v1/public/auth/register-merchant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      storeName: "Smoke Merchant Store Duplicate",
      storeSlug: uniqueStoreSlug, // Duplicate slug
      ownerName: "Smoke Store Owner",
      email: uniqueEmail, // Duplicate email
      password: "SecurePassword123!",
    }),
  });
  assert.strictEqual(dupRes.status, 409, "Duplicate registration must return 409 Conflict");

  // 4. Test Super Admin Bootstrap Route
  const bootstrapRes = await app.request("/api/v1/public/auth/bootstrap-superadmin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Root Platform Super Admin",
      email: `superadmin-${Date.now()}@dotads.com`,
      password: "SuperAdminPassword123!",
    }),
  });

  // Either 201 (if 0 superadmins in DB) or 403 (if already bootstrapped)
  assert.ok(
    bootstrapRes.status === 201 || bootstrapRes.status === 403,
    "Bootstrap endpoint must return 201 (created) or 403 (already bootstrapped)"
  );
  if (bootstrapRes.status === 403) {
    const errData = await bootstrapRes.json();
    assert.strictEqual(errData.error, "Super Admin already bootstrapped", "Must fail closed with correct message");
  }

  // 5. Gate Hardening Test: Verify test token is blocked in non-test mode
  const origEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    const bypassRes = await app.request("/api/v1/platform/tenants", {
      method: "GET",
      headers: { "Authorization": "Bearer test-superadmin-token" },
    });
    assert.strictEqual(bypassRes.status, 401, "Bypass token must be rejected in production environment");
  } finally {
    process.env.NODE_ENV = origEnv;
  }

  console.log("PUBLIC AUTH & GATE HARDENING SMOKE TEST PASSED!");
  process.exit(0);
}

runPublicAuthSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Public Auth Smoke FAILED:", msg);
  process.exit(1);
});
