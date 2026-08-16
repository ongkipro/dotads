import { migrationDb as db, schema } from "@dotads/db";
import { eq } from "drizzle-orm";
import assert from "node:assert";

function errorChainIncludes(error: unknown, expected: string): boolean {
  const seen = new Set<unknown>();
  let current = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if ("message" in current && String(current.message).includes(expected)) return true;
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}

async function runAuditLogSmoke() {
  console.log("Starting Immutable Audit Logging Smoke Test...");

  let [tenant] = await db.select().from(schema.tenants).limit(1);
  if (!tenant) {
    [tenant] = await db
      .insert(schema.tenants)
      .values({
        name: "Audit Smoke Tenant",
        slug: `audit-smoke-${Date.now()}`,
      })
      .returning();
  }
  assert.ok(tenant, "Audit smoke must have a tenant fixture");

  const action = "domain.verified";

  // Insert audit log
  const [log] = await db
    .insert(schema.auditLogs)
    .values({
      tenantId: tenant.id,
      actorId: "usr_admin_1001",
      actorEmail: "admin@store-alpha.com",
      actorRole: "ADMIN",
      action,
      targetType: "tenant_domain",
      targetId: "dom_1001",
      metadataJson: { verificationType: "DNS_TXT" },
    })
    .returning();

  assert.strictEqual(log.action, action);
  assert.strictEqual(log.tenantId, tenant.id);
  assert.strictEqual(log.actorRole, "ADMIN");

  // Retrieve audit log
  const logs = await db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.tenantId, tenant.id));

  assert.ok(logs.length > 0, "Audit logs must contain inserted record");

  // Database enforcement, not application convention, must reject mutation.
  await assert.rejects(
    db.update(schema.auditLogs).set({ action: "tampered" }).where(eq(schema.auditLogs.id, log.id)),
    (error) => errorChainIncludes(error, "audit_logs is append-only")
  );
  await assert.rejects(
    db.delete(schema.auditLogs).where(eq(schema.auditLogs.id, log.id)),
    (error) => errorChainIncludes(error, "audit_logs is append-only")
  );

  const [preserved] = await db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.id, log.id));
  assert.strictEqual(preserved.action, action, "Rejected mutations must preserve the original audit record");

  console.log("IMMUTABLE AUDIT LOGGING SMOKE TEST PASSED!");
  process.exit(0);
}

runAuditLogSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Audit Log Smoke FAILED:", msg);
  process.exit(1);
});
