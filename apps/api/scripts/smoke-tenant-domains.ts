import assert from "node:assert/strict";
import { count, eq } from "drizzle-orm";
import { client, db, migrationClient, migrationDb, platformClient, schema, withDatabaseContext } from "@dotads/db";
import type { Role } from "@dotads/auth";
import { app } from "../src/app.ts";

process.env.NODE_ENV = "test";

const tenantId = crypto.randomUUID();
const otherTenantId = crypto.randomUUID();

function headers(role: Role, scopedTenantId = tenantId, json = false) {
  return {
    "x-session-token": "test-superadmin-token",
    "x-user-role": role,
    "x-user-id": `domains-${role.toLowerCase()}`,
    "x-user-email": `${role.toLowerCase()}@domains.invalid`,
    "x-tenant-id": scopedTenantId,
    ...(json ? { "content-type": "application/json" } : {}),
  };
}

async function get(path: string, role: Role = "TENANT_OWNER", scopedTenantId = tenantId) {
  const response = await app.request(path, { headers: headers(role, scopedTenantId) });
  return { response, body: await response.json() as Record<string, any> };
}

async function post(body: unknown, role: Role = "TENANT_OWNER", scopedTenantId = tenantId) {
  const response = await app.request("/api/v1/admin/domains", {
    method: "POST", headers: headers(role, scopedTenantId, true), body: JSON.stringify(body),
  });
  return { response, body: await response.json() as Record<string, any> };
}

function exactKeys(value: Record<string, unknown>, keys: string[]) {
  assert.deepEqual(Object.keys(value).sort(), keys.toSorted());
}

async function run() {
  await migrationDb.insert(schema.tenants).values([
    { id: tenantId, name: "Domains Alpha", slug: `domains-alpha-${tenantId.slice(0, 8)}` },
    { id: otherTenantId, name: "Domains Beta", slug: `domains-beta-${otherTenantId.slice(0, 8)}` },
  ]);

  assert.equal((await app.request("/api/v1/admin/domains")).status, 401);
  for (const role of ["ADMIN", "ADVERTISER", "CUSTOMER_SERVICE", "SUPER_ADMIN"] as const) {
    assert.equal((await get("/api/v1/admin/domains", role)).response.status, 403, `${role} list`);
    assert.equal((await post({ hostname: "blocked.example.com" }, role)).response.status, 403, `${role} create`);
  }
  for (const path of [
    "/api/v1/admin/domains?limit=0",
    "/api/v1/admin/domains?limit=101",
    "/api/v1/admin/domains?offset=10001",
    "/api/v1/admin/domains?extra=1",
  ]) {
    const invalid = await get(path);
    assert.equal(invalid.response.status, 400, path);
    assert.deepEqual(invalid.body, { error: "Invalid domain query" });
  }
  for (const body of [
    {},
    { hostname: "https://promo.example.com" },
    { hostname: "promo.example.com/path" },
    { hostname: "localhost" },
    { hostname: "promo.example.com", extra: true },
  ]) {
    const invalid = await post(body);
    assert.equal(invalid.response.status, 400, JSON.stringify(body));
    assert.deepEqual(invalid.body, { error: "Invalid domain registration" });
  }

  const unique = crypto.randomUUID().slice(0, 8);
  const normalizedHostname = `promo-${unique}.example.com`;
  const created = await post({ hostname: `  PROMO-${unique}.EXAMPLE.COM.  ` });
  assert.equal(created.response.status, 201);
  exactKeys(created.body, ["id", "hostname", "isPrimary", "status", "verification", "createdAt", "updatedAt"]);
  assert.equal(created.body.hostname, normalizedHostname);
  assert.equal(created.body.status, "pending");
  assert.equal(created.body.isPrimary, false);
  exactKeys(created.body.verification, ["record", "automatedCheck"]);
  exactKeys(created.body.verification.record, ["type", "name", "value"]);
  assert.deepEqual({
    type: created.body.verification.record.type,
    name: created.body.verification.record.name,
    automatedCheck: created.body.verification.automatedCheck,
  }, { type: "TXT", name: "_dotads-challenge", automatedCheck: "unavailable" });
  assert.match(created.body.verification.record.value, /^txt_[0-9a-f]{32}$/);
  assert.equal("tenantId" in created.body, false);
  assert.equal("verificationToken" in created.body, false);

  const duplicate = await post({ hostname: normalizedHostname });
  assert.equal(duplicate.response.status, 409);
  assert.deepEqual(duplicate.body, { error: "Domain is already registered" });
  const crossTenantDuplicate = await post({ hostname: normalizedHostname }, "TENANT_OWNER", otherTenantId);
  assert.equal(crossTenantDuplicate.response.status, 409);
  assert.deepEqual(crossTenantDuplicate.body, { error: "Domain is already registered" });

  const page = await get("/api/v1/admin/domains?limit=1&offset=0");
  assert.equal(page.response.status, 200);
  exactKeys(page.body, ["items", "pagination"]);
  assert.deepEqual(page.body.pagination, { limit: 1, offset: 0, total: 1 });
  assert.equal(page.body.items.length, 1);
  assert.deepEqual(page.body.items[0], created.body);
  const emptyForeignPage = await get("/api/v1/admin/domains", "TENANT_OWNER", otherTenantId);
  assert.equal(emptyForeignPage.response.status, 200);
  assert.equal(emptyForeignPage.body.pagination.total, 0);
  assert.deepEqual(emptyForeignPage.body.items, []);

  const [auditAggregate] = await migrationDb.select({ value: count(schema.auditLogs.id) })
    .from(schema.auditLogs).where(eq(schema.auditLogs.targetId, created.body.id));
  assert.equal(Number(auditAggregate?.value ?? 0), 1, "create and audit must commit exactly once");
  const [persisted] = await migrationDb.select().from(schema.tenantDomains)
    .where(eq(schema.tenantDomains.id, created.body.id));
  assert.equal(persisted?.tenantId, tenantId);
  assert.equal(persisted?.hostname, normalizedHostname);

  const scoped = await withDatabaseContext({
    userId: "domains-owner-a", userEmail: "owner@domains.invalid", tenantId,
    organizationId: "domains-org-a", role: "TENANT_OWNER", tenantName: "Domains Alpha", tenantStatus: "active",
  }, async () => {
    const own = await db.select({ id: schema.tenantDomains.id }).from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.tenantId, tenantId));
    const foreign = await db.select({ id: schema.tenantDomains.id }).from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.tenantId, otherTenantId));
    return { own, foreign };
  });
  assert.equal(scoped.own.length, 1);
  assert.equal(scoped.foreign.length, 0);

  const spec = await (await app.request("/api/v1/openapi.json")).json() as any;
  const path = spec.paths["/api/v1/admin/domains"];
  assert.equal(path.get.operationId, "listTenantDomains");
  assert.equal(path.post.operationId, "createTenantDomain");
  assert.deepEqual(Object.keys(path.get.responses).sort(), ["200", "400", "401", "403", "409", "500"]);
  assert.deepEqual(Object.keys(path.post.responses).sort(), ["201", "400", "401", "403", "409", "500"]);
  assert.equal(path.get.responses["200"].content["application/json"].schema.additionalProperties, false);
  assert.equal(path.post.responses["201"].content["application/json"].schema.additionalProperties, false);
  assert.equal(path.post.requestBody.content["application/json"].schema.additionalProperties, false);
  for (const method of [path.get, path.post]) {
    for (const status of ["400", "401", "403", "500"]) {
      assert.equal(method.responses[status].content["application/json"].schema.additionalProperties, false);
    }
  }

  console.log("TENANT DOMAIN OWNER/RLS HTTP/DB SMOKE PASSED");
}

run().then(async () => {
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
}).catch(async (error: unknown) => {
  console.error("Tenant domain smoke failed:", error instanceof Error ? error.message : String(error));
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
  process.exitCode = 1;
});
