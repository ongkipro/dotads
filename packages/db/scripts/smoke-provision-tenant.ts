import { provisionTenantTransaction } from "../src/services/provisioning.ts";
import { client, migrationDb, migrationClient } from "../src/client.ts";
import * as schema from "../src/schema/index.ts";
import { eq } from "drizzle-orm";
import assert from "node:assert";

async function runProvisionTenantSmoke() {
  console.log("Starting Transactional Tenant Provisioning Smoke Test...");

  const idempotencyKey = `idemp_test_${Date.now()}`;
  const input = {
    tenantName: "Smoke Test Store",
    tenantSlug: `smoke-store-${Date.now()}`,
    ownerName: "Smoke Store Owner",
    ownerEmail: `owner-${Date.now()}@smokestore.com`,
    idempotencyKey,
    customDomain: `smokestore-${Date.now()}.com`,
  };

  // 1. First invocation — MUST create new tenant graph
  const res1 = await provisionTenantTransaction(input);
  assert.strictEqual(res1.isIdempotentReplay, false, "First call should not be replay!");
  assert.ok(res1.tenant.id, "Tenant ID should be populated!");
  assert.strictEqual(res1.tenant.slug, input.tenantSlug);
  assert.strictEqual(res1.member.role, "TENANT_OWNER");

  // 2. Re-run with SAME idempotency key — MUST return exact same result & isIdempotentReplay = true
  const res2 = await provisionTenantTransaction(input);
  assert.strictEqual(res2.isIdempotentReplay, true, "Second call MUST be idempotent replay!");
  assert.strictEqual(res2.tenant.id, res1.tenant.id, "Replay tenant ID MUST match original!");

  // 3. New call with DIFFERENT idempotency key — MUST create second distinct tenant
  const input2 = {
    ...input,
    tenantName: "Smoke Store 2",
    tenantSlug: `smoke-store-2-${Date.now()}`,
    ownerEmail: `owner-2-${Date.now()}@smokestore.com`,
    idempotencyKey: `idemp_test_2_${Date.now()}`,
  };

  const res3 = await provisionTenantTransaction(input2);
  assert.strictEqual(res3.isIdempotentReplay, false);
  assert.notStrictEqual(res3.tenant.id, res1.tenant.id, "New key MUST create a distinct tenant!");

  // 4. Clean up test data
  await migrationDb.delete(schema.tenants).where(eq(schema.tenants.id, res1.tenant.id));
  await migrationDb.delete(schema.tenants).where(eq(schema.tenants.id, res3.tenant.id));

  console.log("TRANSACTIONAL TENANT PROVISIONING SMOKE VERIFICATION PASSED!");
  await client.end();
  await migrationClient.end();
}

runProvisionTenantSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Provision Tenant Smoke FAILED:", msg);
  process.exit(1);
});
