import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { migrationDb, migrationClient, schema, client, platformClient } from "@dotads/db";
import { processMengantarDispatchQueue } from "../../../packages/integrations/src/mengantar.ts";
import { app } from "../src/app.ts";

const alphaTenantId = "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8";
const betaTenantId = "3f3ca823-46bf-4ab5-a5fe-61a49d175fa9";
const productId = "22222222-2222-2222-2222-222222222222";
const headers = {
  "x-session-token": "test-superadmin-token",
  "x-user-role": "TENANT_OWNER",
  "x-user-id": "usr_alpha_owner_01",
  "x-user-email": "owner@store-alpha.com",
  "x-tenant-id": alphaTenantId,
  "content-type": "application/json",
};
async function jsonRequest(path: string, init: RequestInit = {}) {
  const response = await app.request(path, { ...init, headers: { ...headers, ...init.headers } });
  const body = await response.json() as Record<string, any>;
  return { response, body };
}

async function createOrder(tenantId: string, values: Partial<typeof schema.orders.$inferInsert> = {}) {
  return migrationDb.transaction(async (tx) => {
    const [order] = await tx.insert(schema.orders).values({
      tenantId,
      orderNumber: `SMOKE-${crypto.randomUUID()}`,
      status: "CONFIRMED",
      paymentStatus: "UNPAID",
      fulfillmentStatus: "UNFULFILLED",
      paymentMethod: "COD",
      customerName: "Order Smoke",
      customerPhone: "6281234567890",
      customerEmail: "",
      shippingAddress: "Jl. Smoke Test No. 1",
      subdistrictId: "5fc62f63f8ff44b34a4ce00a",
      courierCode: "JNE",
      courierService: "REG",
      subtotalMinor: 100_000,
      shippingCostMinor: 10_000,
      totalMinor: 110_000,
      ...values,
    }).returning();
    await tx.insert(schema.orderItems).values({
      tenantId, orderId: order.id, productId: tenantId === alphaTenantId ? productId : null,
      productName: "Smoke Product", quantity: 1, priceMinor: 100_000, subtotalMinor: 100_000,
    });
    return order;
  });
}

async function run() {
  process.env.NODE_ENV = "test";

  const eligible = await createOrder(alphaTenantId, { paymentMethod: "QRIS", paymentStatus: "PAID" });
  const unpaidPrepaid = await createOrder(alphaTenantId, { paymentMethod: "QRIS", paymentStatus: "UNPAID" });
  const cancellable = await createOrder(alphaTenantId);
  const activeDispatch = await createOrder(alphaTenantId);
  const crossTenant = await createOrder(betaTenantId);

  const list = await jsonRequest(`/api/v1/admin/orders?limit=2&offset=0&createdFrom=2020-01-01T00:00:00Z&createdTo=2099-01-01T00:00:00Z`);
  assert.equal(list.response.status, 200);
  assert.equal(list.body.items.length, 2);
  assert.equal(list.body.pagination.limit, 2);
  assert.equal(list.body.items[0].currency, "IDR");
  assert.equal("shippingAddress" in list.body.items[0], false, "Order list must minimize address PII");
  assert.equal("lifecycleStatus" in list.body.items[0], false, "Order list must expose canonical status axes only");
  assert.match(list.body.items[0].createdAt, /Z$/);
  assert.equal((await jsonRequest("/api/v1/admin/orders?limit=101")).response.status, 400);
  assert.equal((await jsonRequest("/api/v1/admin/orders?createdFrom=2099-01-01T00:00:00Z&createdTo=2020-01-01T00:00:00Z")).response.status, 400);

  const detail = await jsonRequest(`/api/v1/admin/orders/${eligible.id}`);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.customerEmail, null, "Persisted empty email must normalize to null");
  assert.equal(detail.body.shippingAddress, "Jl. Smoke Test No. 1");
  assert.equal(detail.body.dispatch, null);
  assert.equal("attributionJson" in detail.body, false);
  assert.equal((await jsonRequest(`/api/v1/admin/orders/${crossTenant.id}`)).response.status, 404);

  const unpaidStart = await jsonRequest(`/api/v1/admin/orders/${unpaidPrepaid.id}/transitions`, {
    method: "POST", body: JSON.stringify({ action: "start_processing" }),
  });
  assert.equal(unpaidStart.response.status, 409, "Unpaid prepaid orders must not start processing");

  const start = await jsonRequest(`/api/v1/admin/orders/${eligible.id}/transitions`, {
    method: "POST", body: JSON.stringify({ action: "start_processing" }),
  });
  assert.equal(start.response.status, 200);
  assert.equal(start.body.order.status, "PROCESSING");
  assert.equal(start.body.alreadyApplied, false);
  const repeatedStart = await jsonRequest(`/api/v1/admin/orders/${eligible.id}/transitions`, {
    method: "POST", body: JSON.stringify({ action: "start_processing" }),
  });
  assert.equal(repeatedStart.body.alreadyApplied, true);

  const queued = await jsonRequest(`/api/v1/admin/orders/${eligible.id}/dispatch`, {
    method: "POST", body: "{}",
  });
  assert.equal(queued.response.status, 202);
  assert.equal(queued.body.alreadyQueued, false);
  assert.equal("lastError" in queued.body.dispatch, false);
  const repeatedQueue = await jsonRequest(`/api/v1/admin/orders/${eligible.id}/dispatch`, {
    method: "POST", body: "{}",
  });
  assert.equal(repeatedQueue.response.status, 200);
  assert.equal(repeatedQueue.body.dispatch.id, queued.body.dispatch.id);

  const activeQueued = await jsonRequest(`/api/v1/admin/orders/${activeDispatch.id}/dispatch`, {
    method: "POST", body: "{}",
  });
  assert.equal(activeQueued.response.status, 202);
  const cancelActive = await jsonRequest(`/api/v1/admin/orders/${activeDispatch.id}/transitions`, {
    method: "POST", body: JSON.stringify({ action: "cancel", reason: "Customer request" }),
  });
  assert.equal(cancelActive.response.status, 409, "Active dispatch must block cancellation");

  const cancel = await jsonRequest(`/api/v1/admin/orders/${cancellable.id}/transitions`, {
    method: "POST", body: JSON.stringify({ action: "cancel", reason: "Customer request" }),
  });
  assert.equal(cancel.response.status, 200);
  assert.equal(cancel.body.order.status, "CANCELLED");
  assert.equal((await jsonRequest(`/api/v1/admin/orders/${cancellable.id}/transitions`, {
    method: "POST", body: JSON.stringify({ action: "cancel", reason: "Customer request" }),
  })).body.alreadyApplied, true);

  await migrationDb.update(schema.mengantarDispatchQueue).set({ status: "dlq" })
    .where(eq(schema.mengantarDispatchQueue.id, activeQueued.body.dispatch.id));
  assert.equal((await jsonRequest(`/api/v1/admin/orders/${activeDispatch.id}/dispatch`, {
    method: "POST", body: "{}",
  })).response.status, 409, "DLQ dispatch must require explicit recovery");

  assert.equal(await processMengantarDispatchQueue(), 1, "Mock worker must claim the eligible pending dispatch");
  const completed = await jsonRequest(`/api/v1/admin/orders/${eligible.id}`);
  assert.equal(completed.body.status, "SHIPPED");
  assert.equal(completed.body.fulfillmentStatus, "PICKUP_REQUESTED");
  assert.equal(completed.body.dispatch.status, "completed");
  assert.equal("lastError" in completed.body.dispatch, false);
  assert.ok(completed.body.events.some((event: { event: string }) => event.event === "DISPATCH_COMPLETED"));

  {
    const queueRows = await migrationDb.select().from(schema.mengantarDispatchQueue).where(and(
      eq(schema.mengantarDispatchQueue.tenantId, alphaTenantId),
      eq(schema.mengantarDispatchQueue.orderId, eligible.id)
    ));
    assert.equal(queueRows.length, 1, "Unique queue invariant must leave one mutable row per tenant/order");
    const audits = await migrationDb.select().from(schema.auditLogs).where(and(
      eq(schema.auditLogs.tenantId, alphaTenantId), eq(schema.auditLogs.targetId, eligible.id)
    ));
    assert.ok(audits.some((entry) => entry.action === "order.processing_started"));
    assert.ok(audits.some((entry) => entry.action === "order.dispatch_queued"));
    assert.ok(audits.some((entry) => entry.action === "order.dispatch_completed"));
  }

  console.log("ORDERS API + MENGANTAR QUEUE SMOKE PASSED");
}

run().then(async () => {
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
}).catch(async (error) => {
  console.error("Orders smoke failed:", error instanceof Error ? error.message : String(error));
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
  process.exitCode = 1;
});
