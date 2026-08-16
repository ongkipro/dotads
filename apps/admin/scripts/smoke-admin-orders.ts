import assert from "node:assert/strict";
import { AdminOrdersError, dispatchOrder, listOrders, parseOrderDetail, parseOrderPage, transitionOrder } from "../src/lib/admin-orders.ts";

const summary = {
  id: "10000000-0000-4000-8000-000000000001", orderNumber: "ORD-001", status: "CONFIRMED", paymentStatus: "UNPAID",
  fulfillmentStatus: "UNFULFILLED", currency: "IDR", paymentMethod: "COD", customerName: "Pelanggan",
  customerPhone: "08123456789", totalMinor: 1499000, cnoteNo: null, courierCode: "JNE",
  courierService: "REG", rtsRiskScore: 20, createdAt: "2026-08-16T01:00:00.000Z", updatedAt: "2026-08-16T01:00:00.000Z",
};
const pagination = { limit: 25, offset: 0, total: 1 };
assert.equal(parseOrderPage({ items: [summary], pagination }).items[0]?.totalMinor, 1499000);
assert.throws(() => parseOrderPage({ items: [{ ...summary, currency: "USD" }], pagination }), /tidak valid/);
assert.throws(() => parseOrderPage({ items: [{ ...summary, totalMinor: 14.99 }], pagination }), /tidak valid/);
assert.throws(() => parseOrderPage({ items: [{ ...summary, createdAt: "2026-08-16" }], pagination }), /tidak valid/);
assert.throws(() => parseOrderPage({ items: [{ ...summary, createdAt: "2026-08-16T01:00:00" }], pagination }), /tidak valid/);
assert.equal(parseOrderDetail({ ...summary, shippingAddress: "Jakarta", customerEmail: null, subdistrictId: "1", subdistrictName: "Setiabudi", cityName: "Jakarta Selatan", provinceName: "DKI Jakarta", postalCode: "12910", subtotalMinor: 1499000, shippingCostMinor: 0, discountMinor: 0, notes: null, items: [], events: [], dispatch: null }).subdistrictName, "Setiabudi");

let requested = "";
await listOrders({ limit: 25, query: "ORD-001", paymentStatus: "UNPAID" }, async (input, init) => {
  requested = String(input); assert.equal(init?.credentials, "same-origin");
  return new Response(JSON.stringify({ items: [summary], pagination }), { status: 200, headers: { "content-type": "application/json" } });
});
assert.match(requested, /query=ORD-001/); assert.match(requested, /paymentStatus=UNPAID/);

let dispatchBody: BodyInit | null | undefined;
await dispatchOrder(summary.id, async (_input, init) => {
  assert.equal(init?.method, "POST"); assert.deepEqual(init?.headers, { "content-type": "application/json" }); dispatchBody = init?.body;
  return new Response(JSON.stringify({ orderId: summary.id, alreadyQueued: false, dispatch: { id: "20000000-0000-4000-8000-000000000001", status: "pending", attempts: 0, nextRetryAt: null, createdAt: summary.createdAt, updatedAt: summary.updatedAt } }), { status: 202 });
});
assert.equal(dispatchBody, "{}");
await assert.rejects(() => dispatchOrder(summary.id, async () => new Response(JSON.stringify({ error: "conflict" }), { status: 409 })), (error) => error instanceof AdminOrdersError && error.status === 409);
let transitionBody = "";
await transitionOrder(summary.id, { action: "cancel", reason: "Permintaan pelanggan" }, async (_input, init) => {
  transitionBody = String(init?.body); return new Response(JSON.stringify({ order: { ...summary, status: "CANCELLED" }, alreadyApplied: false }), { status: 200 });
});
assert.deepEqual(JSON.parse(transitionBody), { action: "cancel", reason: "Permintaan pelanggan" });
console.log("admin orders smoke passed");
