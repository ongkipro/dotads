import assert from "node:assert";
import { app } from "../src/app.ts";
import { client, migrationClient, platformClient } from "@dotads/db";

async function run() {
  const password = process.env.DOTADS_DEV_TENANT_PASSWORD;
  assert.ok(password, "DOTADS_DEV_TENANT_PASSWORD is required");
  const superAdminPassword = process.env.DOTADS_DEV_SUPERADMIN_PASSWORD;
  assert.ok(superAdminPassword, "DOTADS_DEV_SUPERADMIN_PASSWORD is required");
  const superAdminSignIn = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3100" },
    body: JSON.stringify({ email: "admin@dotads.local", password: superAdminPassword }),
  });
  assert.strictEqual(superAdminSignIn.status, 200, "Development super-admin fixture must sign in");
  const superAdminCookie = superAdminSignIn.headers.get("set-cookie")?.split(";")[0];
  assert.ok(superAdminCookie);
  const superAdminSession = await app.request("/api/v1/session", { headers: { cookie: superAdminCookie } });
  assert.strictEqual(superAdminSession.status, 200);
  assert.strictEqual((await superAdminSession.json()).role, "SUPER_ADMIN");
  const signIn = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:3100" },
    body: JSON.stringify({ email: "merchant@dotads.local", password }),
  });
  assert.strictEqual(signIn.status, 200, "Development tenant fixture must sign in");
  const cookie = signIn.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  const session = await app.request("/api/v1/session", { headers: { cookie } });
  assert.strictEqual(session.status, 200);
  const context = await session.json();
  assert.strictEqual(context.userEmail, "merchant@dotads.local");
  assert.strictEqual(context.role, "TENANT_OWNER");
  assert.ok(context.tenantId);
  console.log("DEVELOPMENT TENANT AUTH FIXTURE SMOKE PASSED!");
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => Promise.all([client.end(), platformClient.end(), migrationClient.end()]));
