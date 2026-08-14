import { db, schema } from "@dotads/db";
import { eq } from "drizzle-orm";
import assert from "node:assert";

async function runAuditLogSmoke() {
  console.log("Starting Immutable Audit Logging Smoke Test...");

  const [tenant] = await db.select().from(schema.tenants);
  assert.ok(tenant, "Tenant must exist from seed");

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

  console.log("IMMUTABLE AUDIT LOGGING SMOKE TEST PASSED!");
  process.exit(0);
}

runAuditLogSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Audit Log Smoke FAILED:", msg);
  process.exit(1);
});
