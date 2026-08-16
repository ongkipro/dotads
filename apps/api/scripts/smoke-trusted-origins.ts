import assert from "node:assert";
import { app } from "../src/app.ts";
import { client, migrationClient, platformClient } from "@dotads/db";

async function run() {
  assert.strictEqual(process.env.NODE_ENV, "development", "Origin smoke must run with development CSRF checks");
  const password = process.env.DOTADS_DEV_TENANT_PASSWORD;
  assert.ok(password);
  const body = JSON.stringify({ email: "merchant@dotads.local", password });
  const rejected = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://attacker.invalid" },
    body,
  });
  assert.strictEqual(rejected.status, 403, "Unknown browser origins must be rejected");
  const accepted = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3100" },
    body,
  });
  assert.strictEqual(accepted.status, 200, "Localhost admin origin must be accepted in development");
  const loopbackAccepted = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:3100" },
    body,
  });
  assert.strictEqual(loopbackAccepted.status, 200, "Loopback admin origin must be accepted in development");

  const patchPreflight = await app.request("/api/v1/catalog/products/11111111-1111-4111-8111-111111111111", {
    method: "OPTIONS",
    headers: {
      origin: "http://localhost:3100",
      "access-control-request-method": "PATCH",
      "access-control-request-headers": "content-type,x-session-token",
    },
  });
  assert.strictEqual(patchPreflight.status, 204, "Trusted Catalog PATCH preflight must succeed");
  assert.strictEqual(patchPreflight.headers.get("access-control-allow-origin"), "http://localhost:3100");
  assert.match(patchPreflight.headers.get("access-control-allow-methods") || "", /(?:^|,\s*)PATCH(?:,|$)/);

  const loopbackPatchPreflight = await app.request("/api/v1/catalog/products/11111111-1111-4111-8111-111111111111", {
    method: "OPTIONS",
    headers: { origin: "http://127.0.0.1:3100", "access-control-request-method": "PATCH" },
  });
  assert.strictEqual(loopbackPatchPreflight.headers.get("access-control-allow-origin"), "http://127.0.0.1:3100");

  const rejectedPreflight = await app.request("/api/v1/catalog/products/11111111-1111-4111-8111-111111111111", {
    method: "OPTIONS",
    headers: {
      origin: "https://attacker.invalid",
      "access-control-request-method": "PATCH",
    },
  });
  assert.strictEqual(rejectedPreflight.headers.has("access-control-allow-origin"), false,
    "Unknown origins must not receive a CORS allow-origin response");
  console.log("BETTER AUTH TRUSTED ORIGINS SMOKE PASSED!");
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => Promise.all([client.end(), platformClient.end(), migrationClient.end()]));
