import assert from "node:assert/strict";
import { OpenAPIHono } from "@hono/zod-openapi";
import { client, migrationClient, migrationDb, platformClient, schema } from "@dotads/db";
import { app as mountedApp } from "../src/app.ts";
import { createDashboardRouter } from "../src/routes/dashboard.ts";
import type { AppEnv } from "../src/middleware/auth.ts";

process.env.NODE_ENV = "test";

const now = new Date("2026-08-17T12:00:00.000Z");
const tenantId = crypto.randomUUID();
const otherTenantId = crypto.randomUUID();
const emptyTenantId = crypto.randomUUID();
const isolatedApp = new OpenAPIHono<AppEnv>();
isolatedApp.route("/api/v1/dashboard", createDashboardRouter(() => now));

const expectedKeys = (value: Record<string, unknown>, keys: string[]) =>
  assert.deepEqual(Object.keys(value).sort(), keys.toSorted());

function headers(role: string, scopedTenantId = tenantId) {
  return {
    "x-session-token": "test-superadmin-token",
    "x-user-role": role,
    "x-user-id": `dashboard-${role.toLowerCase()}`,
    "x-user-email": `${role.toLowerCase()}@dashboard.invalid`,
    "x-tenant-id": scopedTenantId,
  };
}

async function request(path: string, role = "TENANT_OWNER", scopedTenantId = tenantId) {
  const response = await isolatedApp.request(path, { headers: headers(role, scopedTenantId) });
  return { response, body: await response.json() as Record<string, any> };
}

async function assertUtc(pool: typeof client, label: string) {
  const [row] = await pool<{ TimeZone: string }[]>`show timezone`;
  assert.equal(row?.TimeZone, "UTC", `${label} pool must force UTC for every session`);
}

async function createOrder(
  scopedTenantId: string,
  createdAt: string,
  values: Partial<typeof schema.orders.$inferInsert> = {}
) {
  await migrationDb.insert(schema.orders).values({
    tenantId: scopedTenantId,
    orderNumber: `DASH-${crypto.randomUUID()}`,
    status: "CONFIRMED",
    paymentStatus: "UNPAID",
    fulfillmentStatus: "UNFULFILLED",
    paymentMethod: "COD",
    customerName: "Dashboard fixture",
    customerPhone: "6281234567890",
    customerEmail: "",
    shippingAddress: "Dashboard fixture address",
    subtotalMinor: 100_000,
    shippingCostMinor: 0,
    totalMinor: 100_000,
    createdAt,
    updatedAt: createdAt,
    ...values,
  });
}

async function run() {
  await Promise.all([
    assertUtc(client, "app"),
    assertUtc(platformClient, "platform"),
    assertUtc(migrationClient, "migration"),
  ]);
  await migrationDb.insert(schema.tenants).values([
    { id: tenantId, name: "Dashboard Alpha", slug: `dashboard-alpha-${tenantId.slice(0, 8)}` },
    { id: otherTenantId, name: "Dashboard Beta", slug: `dashboard-beta-${otherTenantId.slice(0, 8)}` },
    { id: emptyTenantId, name: "Dashboard Empty", slug: `dashboard-empty-${emptyTenantId.slice(0, 8)}` },
  ]);
  await createOrder(tenantId, "2026-08-16T16:59:59.000Z", { totalMinor: 100_000, paymentStatus: "PAID" });
  await createOrder(tenantId, "2026-08-16T17:00:00.000Z", {
    status: "PROCESSING", fulfillmentStatus: "PICKUP_REQUESTED", totalMinor: 200_000,
  });
  await createOrder(tenantId, "2026-08-16T18:00:00.000Z", { status: "CANCELLED", totalMinor: 300_000 });
  await createOrder(tenantId, "2026-08-16T19:00:00.000Z", {
    status: "REFUNDED", paymentStatus: "REFUNDED", totalMinor: 400_000,
  });
  await createOrder(otherTenantId, "2026-08-16T17:00:00.000Z", { totalMinor: 999_000 });

  const unauthorized = await isolatedApp.request("/api/v1/dashboard?days=7");
  assert.equal(unauthorized.status, 401);
  expectedKeys(await unauthorized.json() as Record<string, unknown>, ["error"]);
  assert.equal((await request("/api/v1/dashboard?days=7", "ADVERTISER")).response.status, 403);
  const invalidDays = await request("/api/v1/dashboard?days=8");
  assert.equal(invalidDays.response.status, 400);
  assert.deepEqual(invalidDays.body, { error: "Invalid dashboard query" });
  assert.equal((await request("/api/v1/dashboard?days=7&extra=1")).response.status, 400);
  const superAdmin = await request("/api/v1/dashboard?days=7", "SUPER_ADMIN");
  assert.equal(superAdmin.response.status, 403);
  assert.deepEqual(superAdmin.body, { error: "Forbidden: Active tenant context required" });
  const databaseUrl = process.env.DATABASE_URL;
  let invalidTenant;
  try {
    delete process.env.DATABASE_URL;
    invalidTenant = await request("/api/v1/dashboard?days=7", "TENANT_OWNER", "not-a-uuid");
  } finally {
    if (databaseUrl) process.env.DATABASE_URL = databaseUrl;
  }
  assert.equal(invalidTenant.response.status, 403);
  assert.deepEqual(invalidTenant.body, { error: "Forbidden: Active tenant context required" });

  const seven = await request("/api/v1/dashboard?days=7");
  assert.equal(seven.response.status, 200);
  expectedKeys(seven.body, ["currency", "timeZone", "period", "kpis", "daily", "breakdowns"]);
  expectedKeys(seven.body.period, ["days", "from", "to"]);
  expectedKeys(seven.body.kpis, ["ordersCreated", "grossOrderValueMinor"]);
  expectedKeys(seven.body.breakdowns, ["orderStatus", "paymentStatus", "fulfillmentStatus"]);
  expectedKeys(seven.body.breakdowns.orderStatus, [
    "PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
  ]);
  expectedKeys(seven.body.breakdowns.paymentStatus, ["UNPAID", "PAID", "REFUNDED", "FAILED"]);
  expectedKeys(seven.body.breakdowns.fulfillmentStatus, [
    "UNFULFILLED", "PICKUP_REQUESTED", "IN_TRANSIT", "DELIVERED", "RETURNED", "FAILED",
  ]);
  assert.equal(seven.body.currency, "IDR");
  assert.equal(seven.body.timeZone, "Asia/Jakarta");
  assert.deepEqual(seven.body.period, {
    days: 7,
    from: "2026-08-10T17:00:00.000Z",
    to: "2026-08-17T17:00:00.000Z",
  });
  assert.deepEqual(seven.body.kpis, { ordersCreated: 2, grossOrderValueMinor: 300_000 });
  assert.equal(seven.body.daily.length, 7);
  assert.deepEqual(seven.body.daily.find((row: { date: string }) => row.date === "2026-08-16"), {
    date: "2026-08-16", ordersCreated: 1, grossOrderValueMinor: 100_000,
  });
  assert.deepEqual(seven.body.daily.find((row: { date: string }) => row.date === "2026-08-17"), {
    date: "2026-08-17", ordersCreated: 1, grossOrderValueMinor: 200_000,
  });
  assert.equal(seven.body.breakdowns.orderStatus.CANCELLED, 1);
  assert.equal(seven.body.breakdowns.orderStatus.REFUNDED, 1);
  assert.equal(seven.body.breakdowns.paymentStatus.PAID, 1);
  assert.equal(seven.body.breakdowns.fulfillmentStatus.PICKUP_REQUESTED, 1);
  assert.equal(seven.body.breakdowns.orderStatus.DELIVERED, 0);
  for (const row of seven.body.daily) {
    expectedKeys(row, ["date", "ordersCreated", "grossOrderValueMinor"]);
    assert.ok(Number.isInteger(row.ordersCreated) && row.ordersCreated >= 0);
    assert.ok(Number.isInteger(row.grossOrderValueMinor) && row.grossOrderValueMinor >= 0);
  }

  const thirty = await request("/api/v1/dashboard?days=30");
  assert.equal(thirty.response.status, 200);
  assert.equal(thirty.body.period.days, 30);
  assert.equal(thirty.body.daily.length, 30);
  assert.equal(thirty.body.daily[0].date, "2026-07-19");
  assert.equal(thirty.body.daily.at(-1).date, "2026-08-17");

  const empty = await request("/api/v1/dashboard?days=7", "CUSTOMER_SERVICE", emptyTenantId);
  assert.equal(empty.response.status, 200);
  assert.deepEqual(empty.body.kpis, { ordersCreated: 0, grossOrderValueMinor: 0 });
  assert.equal(empty.body.daily.length, 7);
  assert.ok(empty.body.daily.every((row: { ordersCreated: number; grossOrderValueMinor: number }) =>
    row.ordersCreated === 0 && row.grossOrderValueMinor === 0
  ));
  assert.ok(Object.values(empty.body.breakdowns.orderStatus).every((value) => value === 0));
  assert.ok(Object.values(empty.body.breakdowns.paymentStatus).every((value) => value === 0));
  assert.ok(Object.values(empty.body.breakdowns.fulfillmentStatus).every((value) => value === 0));

  const mountedOpenApi = await (await mountedApp.request("/api/v1/openapi.json")).json() as any;
  const mountedContract = mountedOpenApi.paths["/api/v1/dashboard"]?.get;
  assert.ok(mountedContract, "mounted OpenAPI must expose GET /api/v1/dashboard");
  assert.deepEqual(Object.keys(mountedContract.responses ?? {}).sort(), ["200", "400", "401", "403", "409", "500"]);
  assert.equal(mountedContract.responses["200"].content["application/json"].schema.additionalProperties, false);
  for (const status of ["400", "401", "403", "500"]) {
    const errorSchema = mountedContract.responses[status].content["application/json"].schema;
    assert.equal(errorSchema.additionalProperties, false);
    assert.deepEqual(errorSchema.required, ["error"]);
  }
  const workspaceErrorSchema = mountedContract.responses["409"].content["application/json"].schema;
  assert.equal(workspaceErrorSchema.additionalProperties, false);
  assert.deepEqual(workspaceErrorSchema.required, ["error", "code", "workspaceSelectionRequired"]);
  const mountedUnauthorized = await mountedApp.request("/api/v1/dashboard?days=7");
  assert.equal(mountedUnauthorized.status, 401);
  expectedKeys(await mountedUnauthorized.json() as Record<string, unknown>, ["error"]);
  const mountedTenant = await mountedApp.request("/api/v1/dashboard?days=7", { headers: headers("TENANT_OWNER") });
  assert.equal(mountedTenant.status, 200);
  expectedKeys(await mountedTenant.json() as Record<string, unknown>, [
    "currency", "timeZone", "period", "kpis", "daily", "breakdowns",
  ]);
  const mountedSuperAdmin = await mountedApp.request("/api/v1/dashboard?days=7", {
    headers: headers("SUPER_ADMIN"),
  });
  assert.equal(mountedSuperAdmin.status, 403);
  assert.deepEqual(await mountedSuperAdmin.json(), { error: "Forbidden: Active tenant context required" });

  console.log("DASHBOARD TENANT AGGREGATE SMOKE PASSED");
}

run().then(async () => {
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
}).catch(async (error: unknown) => {
  console.error("Dashboard smoke failed:", error instanceof Error ? error.message : String(error));
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
  process.exitCode = 1;
});
