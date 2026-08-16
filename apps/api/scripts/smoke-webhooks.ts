import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { app } from "../src/app.ts";
import { client, migrationClient, migrationDb, platformClient, schema } from "@dotads/db";

const alphaTenantId = "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8";
const betaTenantId = "3f3ca823-46bf-4ab5-a5fe-61a49d175fa9";
const autoSecret = "ephemeral-autolaris-webhook-secret";
const mengantarSecret = "ephemeral-mengantar-webhook-secret";
process.env.AUTOLARIS_SECRET = autoSecret;
process.env.MENGANTAR_WEBHOOK_SECRET = mengantarSecret;
process.env.NODE_ENV = "test";

function signature(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function webhook(provider: "autolaris" | "mengantar", payload: unknown) {
  const body = JSON.stringify(payload);
  return app.request(`/api/v1/webhooks/${provider}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [provider === "autolaris" ? "x-autolaris-signature" : "x-mengantar-signature"]:
        signature(body, provider === "autolaris" ? autoSecret : mengantarSecret),
    },
    body,
  });
}

async function createOrder(tenantId: string, values: Partial<typeof schema.orders.$inferInsert> = {}) {
  const [order] = await migrationDb.insert(schema.orders).values({
    tenantId,
    orderNumber: `WEBHOOK-${randomUUID()}`,
    status: "PENDING_PAYMENT",
    paymentStatus: "UNPAID",
    fulfillmentStatus: "UNFULFILLED",
    paymentMethod: "QRIS",
    customerName: "Webhook Smoke",
    customerPhone: "6281234567890",
    customerEmail: "webhook@example.invalid",
    shippingAddress: "Jl. Webhook Smoke No. 1",
    subtotalMinor: 100_000,
    shippingCostMinor: 11_000,
    totalMinor: 111_000,
    ...values,
  }).returning();
  return order;
}

async function orderEvidence(tenantId: string, orderId: string) {
  const [order] = await migrationDb.select().from(schema.orders).where(and(
    eq(schema.orders.tenantId, tenantId), eq(schema.orders.id, orderId),
  ));
  const events = await migrationDb.select().from(schema.orderEvents).where(and(
    eq(schema.orderEvents.tenantId, tenantId), eq(schema.orderEvents.orderId, orderId),
  ));
  const audits = await migrationDb.select().from(schema.auditLogs).where(and(
    eq(schema.auditLogs.tenantId, tenantId), eq(schema.auditLogs.targetId, orderId),
  ));
  const queues = await migrationDb.select().from(schema.mengantarDispatchQueue).where(and(
    eq(schema.mengantarDispatchQueue.tenantId, tenantId), eq(schema.mengantarDispatchQueue.orderId, orderId),
  ));
  const purchases = await migrationDb.select().from(schema.outboxEvents).where(and(
    eq(schema.outboxEvents.tenantId, tenantId), eq(schema.outboxEvents.eventId, `evt_purchase_${orderId}`),
  ));
  return { order, events, audits, queues, purchases };
}

async function run() {
  const invalidUnsigned = await app.request("/api/v1/webhooks/autolaris", {
    method: "POST", headers: { "content-type": "application/json" }, body: "{}",
  });
  assert.equal(invalidUnsigned.status, 401, "Signature verification must precede payload validation");

  const paymentOrder = await createOrder(alphaTenantId);
  const transactionId = `AUTO-${randomUUID()}`;
  await migrationDb.insert(schema.paymentTransactions).values({
    tenantId: alphaTenantId,
    orderId: paymentOrder.id,
    gateway: "autolaris",
    transactionId,
    amountMinor: paymentOrder.totalMinor,
    paymentMethod: "QRIS",
    status: "PENDING",
  });
  assert.equal((await webhook("autolaris", {
    transaction_id: transactionId, order_id: paymentOrder.id, status: "UNKNOWN", amount: paymentOrder.totalMinor,
  })).status, 400, "Unknown AutoLaris statuses must be rejected");
  assert.equal((await webhook("autolaris", {
    transaction_id: transactionId, order_id: paymentOrder.id, status: "SUCCESS", amount: paymentOrder.totalMinor, extra: true,
  })).status, 400, "Extra AutoLaris fields must be rejected");
  assert.equal((await webhook("autolaris", {
    transaction_id: transactionId, order_id: paymentOrder.id, status: "SUCCESS", amount: paymentOrder.totalMinor + 1,
  })).status, 404, "Amount mismatch must fail closed");

  const unrelatedOrder = await createOrder(alphaTenantId);
  assert.equal((await webhook("autolaris", {
    transaction_id: transactionId, order_id: unrelatedOrder.id, status: "SUCCESS", amount: paymentOrder.totalMinor,
  })).status, 404, "Transaction/order mismatch must fail closed");
  const betaOrder = await createOrder(betaTenantId);
  const betaTransaction = `AUTO-BETA-${randomUUID()}`;
  await migrationDb.insert(schema.paymentTransactions).values({
    tenantId: betaTenantId, orderId: betaOrder.id, gateway: "autolaris", transactionId: betaTransaction,
    amountMinor: betaOrder.totalMinor, paymentMethod: "QRIS", status: "PENDING",
  });
  assert.equal((await webhook("autolaris", {
    transaction_id: betaTransaction, order_id: paymentOrder.id, status: "SUCCESS", amount: paymentOrder.totalMinor,
  })).status, 404, "Cross-tenant transaction/order binding must fail closed");

  const successfulPayload = {
    transaction_id: transactionId, order_id: paymentOrder.id, status: "SUCCESS", amount: paymentOrder.totalMinor,
  };
  assert.equal((await webhook("autolaris", successfulPayload)).status, 200);
  let paymentEvidence = await orderEvidence(alphaTenantId, paymentOrder.id);
  assert.equal(paymentEvidence.order.status, "CONFIRMED");
  assert.equal(paymentEvidence.order.paymentStatus, "PAID");
  assert.equal(paymentEvidence.events.filter((event) => event.event === "PAYMENT_RECEIVED").length, 1);
  assert.equal(paymentEvidence.audits.filter((audit) => audit.action === "payment.received").length, 1);
  assert.equal(paymentEvidence.queues.length, 1);
  const purchaseCount = paymentEvidence.purchases.length;
  assert.equal((await webhook("autolaris", successfulPayload)).status, 200);
  assert.equal((await webhook("autolaris", { ...successfulPayload, status: "FAILED" })).status, 200);
  paymentEvidence = await orderEvidence(alphaTenantId, paymentOrder.id);
  assert.equal(paymentEvidence.order.paymentStatus, "PAID", "Duplicate/stale callbacks must not regress payment");
  assert.equal(paymentEvidence.events.filter((event) => event.event === "PAYMENT_RECEIVED").length, 1);
  assert.equal(paymentEvidence.audits.filter((audit) => audit.action === "payment.received").length, 1);
  assert.equal(paymentEvidence.queues.length, 1);
  assert.equal(paymentEvidence.purchases.length, purchaseCount, "Purchase must enqueue only on the first success");

  const cancelledPaymentOrder = await createOrder(alphaTenantId, { status: "CANCELLED" });
  const cancelledTransaction = `AUTO-CANCELLED-${randomUUID()}`;
  await migrationDb.insert(schema.paymentTransactions).values({
    tenantId: alphaTenantId, orderId: cancelledPaymentOrder.id, gateway: "autolaris",
    transactionId: cancelledTransaction, amountMinor: cancelledPaymentOrder.totalMinor,
    paymentMethod: "QRIS", status: "PENDING",
  });
  assert.equal((await webhook("autolaris", {
    transaction_id: cancelledTransaction, order_id: cancelledPaymentOrder.id,
    status: "SUCCESS", amount: cancelledPaymentOrder.totalMinor,
  })).status, 409, "Cancelled orders must never be revived by payment callbacks");
  const [cancelledPayment] = await migrationDb.select().from(schema.paymentTransactions)
    .where(eq(schema.paymentTransactions.transactionId, cancelledTransaction));
  assert.equal(cancelledPayment.status, "PENDING");
  assert.equal((await orderEvidence(alphaTenantId, cancelledPaymentOrder.id)).events.length, 0);

  const racingOrder = await createOrder(alphaTenantId);
  const racingTransaction = `AUTO-RACE-${randomUUID()}`;
  await migrationDb.insert(schema.paymentTransactions).values({
    tenantId: alphaTenantId, orderId: racingOrder.id, gateway: "autolaris",
    transactionId: racingTransaction, amountMinor: racingOrder.totalMinor,
    paymentMethod: "QRIS", status: "PENDING",
  });
  const racingPayload = JSON.stringify({
    transaction_id: racingTransaction, order_id: racingOrder.id,
    status: "SUCCESS", amount: racingOrder.totalMinor,
  });
  const [paymentRaceResponse, cancellationRaceResponse] = await Promise.all([
    app.request("/api/v1/webhooks/autolaris", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-autolaris-signature": signature(racingPayload, autoSecret),
      },
      body: racingPayload,
    }),
    app.request(`/api/v1/admin/orders/${racingOrder.id}/transitions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-session-token": "test-superadmin-token",
        "x-user-role": "TENANT_OWNER",
        "x-user-id": "webhook-race-owner",
        "x-user-email": "webhook-race-owner@example.invalid",
        "x-tenant-id": alphaTenantId,
      },
      body: JSON.stringify({ action: "cancel", reason: "Concurrent payment cancellation smoke" }),
    }),
  ]);
  assert.ok([200, 409].includes(paymentRaceResponse.status));
  assert.ok([200, 409].includes(cancellationRaceResponse.status));
  const [racedOrder] = await migrationDb.select().from(schema.orders).where(eq(schema.orders.id, racingOrder.id));
  const [racedPayment] = await migrationDb.select().from(schema.paymentTransactions)
    .where(eq(schema.paymentTransactions.transactionId, racingTransaction));
  assert.ok(
    (racedOrder.status === "CONFIRMED" && racedOrder.paymentStatus === "PAID" && racedPayment.status === "SUCCESS") ||
    (racedOrder.status === "CANCELLED" && racedOrder.paymentStatus === "UNPAID" && racedPayment.status === "PENDING"),
    "Cancellation/payment race must commit one coherent terminal outcome",
  );

  const waybill = `WB-${randomUUID()}`;
  const codOrder = await createOrder(alphaTenantId, {
    status: "SHIPPED", paymentMethod: "COD", fulfillmentStatus: "PICKUP_REQUESTED", cnoteNo: waybill,
  });
  const transitPayload = {
    waybill_number: waybill,
    status: "IN_TRANSIT",
    tracking_history: [{ status: "IN_TRANSIT", timestamp: "2026-08-17T00:00:00Z", description: "Courier transit" }],
  };
  assert.equal((await webhook("mengantar", { ...transitPayload, status: "UNKNOWN" })).status, 400);
  assert.equal((await webhook("mengantar", { ...transitPayload, raw_provider_payload: {} })).status, 400);
  assert.equal((await webhook("mengantar", { ...transitPayload, waybill_number: "FOREIGN-WAYBILL" })).status, 404);
  assert.equal((await webhook("mengantar", transitPayload)).status, 200);
  assert.equal((await webhook("mengantar", { ...transitPayload, status: "ON_PROCESS" })).status, 200);
  let codEvidence = await orderEvidence(alphaTenantId, codOrder.id);
  assert.equal(codEvidence.order.fulfillmentStatus, "IN_TRANSIT");
  assert.equal(codEvidence.events.length, 1, "Equivalent duplicate transit callbacks must emit one event");
  const eventMetadata = codEvidence.events[0].metadataJson as Record<string, unknown>;
  assert.ok("trackingSummary" in eventMetadata);
  assert.equal("tracking_history" in eventMetadata, false, "Raw tracking history must not be persisted");

  const deliveredPayload = { waybill_number: waybill, status: "DELIVERED", tracking_history: [{ status: "DELIVERED" }] };
  assert.equal((await webhook("mengantar", deliveredPayload)).status, 200);
  codEvidence = await orderEvidence(alphaTenantId, codOrder.id);
  assert.equal(codEvidence.order.status, "DELIVERED");
  assert.equal(codEvidence.order.paymentStatus, "PAID");
  assert.equal(codEvidence.order.fulfillmentStatus, "DELIVERED");
  assert.equal(codEvidence.events.length, 2);
  assert.equal(codEvidence.audits.filter((audit) => audit.action === "order.fulfillment_updated").length, 2);
  const codPurchaseCount = codEvidence.purchases.length;
  assert.equal((await webhook("mengantar", deliveredPayload)).status, 200);
  assert.equal((await webhook("mengantar", transitPayload)).status, 200);
  codEvidence = await orderEvidence(alphaTenantId, codOrder.id);
  assert.equal(codEvidence.events.length, 2, "Duplicate/out-of-order callbacks must not add evidence");
  assert.equal(codEvidence.purchases.length, codPurchaseCount, "COD Purchase must enqueue only once");

  const cancelledWaybill = `WB-CANCELLED-${randomUUID()}`;
  const cancelledCod = await createOrder(alphaTenantId, {
    status: "CANCELLED", paymentMethod: "COD", fulfillmentStatus: "PICKUP_REQUESTED", cnoteNo: cancelledWaybill,
  });
  assert.equal((await webhook("mengantar", { waybill_number: cancelledWaybill, status: "DELIVERED" })).status, 200);
  const cancelledCodEvidence = await orderEvidence(alphaTenantId, cancelledCod.id);
  assert.equal(cancelledCodEvidence.order.status, "CANCELLED");
  assert.equal(cancelledCodEvidence.order.paymentStatus, "UNPAID");
  assert.equal(cancelledCodEvidence.events.length, 0);
  assert.equal(cancelledCodEvidence.audits.length, 0);

  await assert.rejects(createOrder(betaTenantId, {
    status: "SHIPPED", paymentMethod: "COD", fulfillmentStatus: "PICKUP_REQUESTED", cnoteNo: waybill,
  }), (error: any) => error?.cause?.code === "23505" || error?.code === "23505",
  "Database must reject ambiguous cross-tenant waybills");

  console.log("SIGNED FINANCIAL + LOGISTICS WEBHOOK SMOKE PASSED");
}

run().then(async () => {
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
}).catch(async (error) => {
  console.error("Webhook smoke failed:", error);
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
  process.exitCode = 1;
});
