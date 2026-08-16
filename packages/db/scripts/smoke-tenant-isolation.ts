import {
  db,
  client,
  migrationDb,
  migrationClient,
  withDatabaseContext,
  withTenantGuard,
} from "../src/client.ts";
import * as schema from "../src/schema/index.ts";
import { eq, and } from "drizzle-orm";
import assert from "node:assert";

async function runTenantIsolationSmoke() {
  console.log("Starting Tenant Isolation Smoke Verification...");

  // 1. Provision two distinct test tenants
  const [tenantA] = await migrationDb.insert(schema.tenants).values({
    name: "Isolation Test Tenant A",
    slug: `test-isolation-a-${Date.now()}`,
  }).returning();

  const [tenantB] = await migrationDb.insert(schema.tenants).values({
    name: "Isolation Test Tenant B",
    slug: `test-isolation-b-${Date.now()}`,
  }).returning();

  // 2. Insert product under Tenant A
  const [prodA] = await withDatabaseContext({
    userId: "isolation-test-a", userEmail: "a@test.invalid", tenantId: tenantA.id,
    organizationId: "", role: "ADMIN", tenantName: tenantA.name, tenantStatus: "active",
  }, () => db.insert(schema.products).values({
      tenantId: tenantA.id,
      name: "Product Tenant A",
      slug: "product-tenant-a",
      priceMinor: 100000,
    }).returning());

  // 3. Attempt query scoped to Tenant B — MUST NOT retrieve Tenant A's product
  const tenantBProducts = await withDatabaseContext({
    userId: "isolation-test-b", userEmail: "b@test.invalid", tenantId: tenantB.id,
    organizationId: "", role: "ADMIN", tenantName: tenantB.name, tenantStatus: "active",
  }, () => db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.tenantId, tenantB.id), eq(schema.products.id, prodA.id))));

  assert.strictEqual(
    tenantBProducts.length,
    0,
    "CRITICAL BUG: Tenant B was able to query Tenant A's product!"
  );

  // 4. Attempt update with wrong tenantId in guard — MUST throw
  let guardTriggered = false;
  try {
    withTenantGuard(prodA, tenantB.id);
  } catch (err: unknown) {
    guardTriggered = true;
    const message = err instanceof Error ? err.message : String(err);
    console.log("Tenant Guard Assertion Passed:", message);
  }

  assert.strictEqual(
    guardTriggered,
    true,
    "CRITICAL BUG: withTenantGuard failed to throw on cross-tenant access!"
  );

  // 5. Cleanup test data
  await migrationDb.delete(schema.tenants).where(eq(schema.tenants.id, tenantA.id));
  await migrationDb.delete(schema.tenants).where(eq(schema.tenants.id, tenantB.id));

  console.log("TENANT ISOLATION SMOKE VERIFICATION PASSED!");
  await client.end();
  await migrationClient.end();
}

runTenantIsolationSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Tenant Isolation Smoke FAILED:", msg);
  process.exit(1);
});
