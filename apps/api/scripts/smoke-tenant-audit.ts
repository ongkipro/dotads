import assert from "node:assert/strict";
import { and, count, eq } from "drizzle-orm";
import { client, db, migrationClient, migrationDb, platformClient, schema, withDatabaseContext } from "@dotads/db";
import { app } from "../src/app.ts";
import type { Role } from "@dotads/auth";

process.env.NODE_ENV = "test";

const tenantId = crypto.randomUUID();
const otherTenantId = crypto.randomUUID();

function headers(role: Role, scopedTenantId = tenantId) {
  return {
    "x-session-token": "test-superadmin-token",
    "x-user-role": role,
    "x-user-id": `audit-${role.toLowerCase()}`,
    "x-user-email": `${role.toLowerCase()}@audit.invalid`,
    "x-tenant-id": scopedTenantId,
  };
}

async function request(path: string, role: Role = "TENANT_OWNER", scopedTenantId = tenantId) {
  const response = await app.request(path, { headers: headers(role, scopedTenantId) });
  return { response, body: await response.json() as Record<string, any> };
}

function exactKeys(value: Record<string, unknown>, keys: string[]) {
  assert.deepEqual(Object.keys(value).sort(), keys.toSorted());
}

async function run() {
  await migrationDb.insert(schema.tenants).values([
    { id: tenantId, name: "Audit Alpha", slug: `audit-alpha-${tenantId.slice(0, 8)}` },
    { id: otherTenantId, name: "Audit Beta", slug: `audit-beta-${otherTenantId.slice(0, 8)}` },
  ]);
  const recent = new Date(Date.now() - 60_000).toISOString();
  const older = new Date(Date.now() - 40 * 86_400_000).toISOString();
  await migrationDb.insert(schema.auditLogs).values([
    {
      tenantId, actorId: "owner-a", actorEmail: "owner-a@audit.invalid", actorRole: "TENANT_OWNER",
      action: "order.cancel", targetType: "order", targetId: "literal%target",
      metadataJson: { reason: "must never leave the API" }, ipAddress: "203.0.113.10",
      userAgent: "sensitive-user-agent", createdAt: recent,
    },
    {
      tenantId, actorId: "admin-a", actorEmail: "admin-a@audit.invalid", actorRole: "ADMIN",
      action: "member.invitation_created", targetType: "invitation", targetId: crypto.randomUUID(), createdAt: recent,
    },
    {
      tenantId, actorId: "owner-a", actorEmail: "owner-a@audit.invalid", actorRole: "TENANT_OWNER",
      action: "domain.create", targetType: "tenant_domain", targetId: crypto.randomUUID(), createdAt: older,
    },
    {
      tenantId: otherTenantId, actorId: "owner-b", actorEmail: "owner-b@audit.invalid", actorRole: "TENANT_OWNER",
      action: "order.cancel", targetType: "order", targetId: crypto.randomUUID(), createdAt: recent,
    },
  ]);

  const unauthenticated = await app.request("/api/v1/admin/audit-logs");
  assert.equal(unauthenticated.status, 401);
  assert.equal((await request("/api/v1/admin/audit-logs", "ADVERTISER")).response.status, 403);
  assert.equal((await request("/api/v1/admin/audit-logs", "CUSTOMER_SERVICE")).response.status, 403);
  const superAdmin = await request("/api/v1/admin/audit-logs", "SUPER_ADMIN");
  assert.equal(superAdmin.response.status, 403);
  assert.deepEqual(superAdmin.body, { error: "Forbidden: Active tenant context required" });

  for (const path of [
    "/api/v1/admin/audit-logs?limit=0",
    "/api/v1/admin/audit-logs?limit=101",
    "/api/v1/admin/audit-logs?offset=10001",
    "/api/v1/admin/audit-logs?days=8",
    "/api/v1/admin/audit-logs?q=",
    "/api/v1/admin/audit-logs?extra=1",
  ]) {
    const invalid = await request(path);
    assert.equal(invalid.response.status, 400, path);
    assert.deepEqual(invalid.body, { error: "Invalid audit query" });
  }

  for (const role of ["TENANT_OWNER", "ADMIN"] as const) {
    const page = await request("/api/v1/admin/audit-logs?limit=2", role);
    assert.equal(page.response.status, 200);
    exactKeys(page.body, ["items", "pagination", "filters"]);
    assert.deepEqual(page.body.pagination, { limit: 2, offset: 0, total: 3 });
    assert.deepEqual(page.body.filters.actions, ["domain.create", "member.invitation_created", "order.cancel"]);
    assert.equal(page.body.items.length, 2);
    for (const item of page.body.items) {
      exactKeys(item, ["id", "action", "actor", "target", "createdAt"]);
      exactKeys(item.actor, ["email", "role"]);
      exactKeys(item.target, ["type", "id"]);
      assert.notEqual(item.actor.email, "owner-b@audit.invalid");
      assert.equal("metadata" in item, false);
      assert.equal("ipAddress" in item, false);
      assert.equal("userAgent" in item, false);
      assert.equal("actorId" in item, false);
    }
  }

  const secondPage = await request("/api/v1/admin/audit-logs?limit=2&offset=2");
  assert.equal(secondPage.body.items.length, 1);
  assert.equal(secondPage.body.pagination.total, 3);
  const recentOnly = await request("/api/v1/admin/audit-logs?days=7");
  assert.equal(recentOnly.body.pagination.total, 2);
  const actionOnly = await request("/api/v1/admin/audit-logs?action=domain.create");
  assert.equal(actionOnly.body.pagination.total, 1);
  assert.equal(actionOnly.body.items[0].action, "domain.create");
  const literalWildcard = await request("/api/v1/admin/audit-logs?q=%25");
  assert.equal(literalWildcard.body.pagination.total, 1, "search wildcard characters must be treated literally");
  assert.equal(literalWildcard.body.items[0].target.id, "literal%target");
  const noMatch = await request("/api/v1/admin/audit-logs?q=owner-b");
  assert.equal(noMatch.body.pagination.total, 0, "foreign tenant records must not be searchable");

  const scopedCount = await withDatabaseContext({
    userId: "audit-owner-a", userEmail: "owner-a@audit.invalid", tenantId,
    organizationId: "audit-org-a", role: "TENANT_OWNER", tenantName: "Audit Alpha", tenantStatus: "active",
  }, async () => {
    const [row] = await db.select({ value: count(schema.auditLogs.id) }).from(schema.auditLogs)
      .where(and(eq(schema.auditLogs.tenantId, tenantId), eq(schema.auditLogs.action, "order.cancel")));
    const [foreign] = await db.select({ value: count(schema.auditLogs.id) }).from(schema.auditLogs)
      .where(eq(schema.auditLogs.tenantId, otherTenantId));
    return { own: Number(row?.value ?? 0), foreign: Number(foreign?.value ?? 0) };
  });
  assert.deepEqual(scopedCount, { own: 1, foreign: 0 });

  const spec = await (await app.request("/api/v1/openapi.json")).json() as any;
  const contract = spec.paths["/api/v1/admin/audit-logs"]?.get;
  assert.equal(contract.operationId, "listTenantAuditLogs");
  assert.deepEqual(Object.keys(contract.responses).sort(), ["200", "400", "401", "403", "409", "500"]);
  assert.equal(contract.responses["200"].content["application/json"].schema.additionalProperties, false);
  assert.deepEqual(contract.responses["200"].content["application/json"].schema.required.sort(), ["filters", "items", "pagination"]);
  for (const status of ["400", "401", "403", "500"]) {
    assert.equal(contract.responses[status].content["application/json"].schema.additionalProperties, false);
  }

  console.log("TENANT AUDIT LOG HTTP/DB SMOKE PASSED");
}

run().then(async () => {
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
}).catch(async (error: unknown) => {
  console.error("Tenant audit smoke failed:", error instanceof Error ? error.message : String(error));
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
  process.exitCode = 1;
});
