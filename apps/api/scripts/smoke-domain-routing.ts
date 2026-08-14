import { db, schema } from "@dotads/db";
import { eq } from "drizzle-orm";
import assert from "node:assert";

async function runDomainRoutingSmoke() {
  console.log("Starting Custom Domain Routing & Resolution Smoke Test...");

  const [tenant] = await db.select().from(schema.tenants);
  assert.ok(tenant, "Tenant must exist from seed");

  const hostname = `smoke-domain-${Date.now()}.com`;

  // Insert custom domain
  const [domain] = await db
    .insert(schema.tenantDomains)
    .values({
      tenantId: tenant.id,
      hostname,
      isPrimary: false,
      status: "active",
      verificationToken: "token_smoke_123",
    })
    .returning();

  assert.strictEqual(domain.hostname, hostname);

  // Resolve tenant by hostname
  const [resolvedDomain] = await db
    .select()
    .from(schema.tenantDomains)
    .where(eq(schema.tenantDomains.hostname, hostname));

  assert.ok(resolvedDomain, "Domain must be resolvable");
  assert.strictEqual(resolvedDomain.tenantId, tenant.id);

  console.log("CUSTOM DOMAIN ROUTING SMOKE TEST PASSED!");
  process.exit(0);
}

runDomainRoutingSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Domain Routing Smoke FAILED:", msg);
  process.exit(1);
});
