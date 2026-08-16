import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { COMPACT_ORDER_LIMIT, listCompactOrders } from "../src/lib/admin-orders.ts";

const order = { id: "10000000-0000-4000-8000-000000000001", orderNumber: "ORD-001", status: "CONFIRMED", paymentStatus: "UNPAID", fulfillmentStatus: "UNFULFILLED", currency: "IDR", paymentMethod: "COD", customerName: "Pelanggan", customerPhone: "08123456789", totalMinor: 1499000, cnoteNo: null, courierCode: "JNE", courierService: "REG", rtsRiskScore: 20, createdAt: "2026-08-16T01:00:00.000Z", updatedAt: "2026-08-16T01:00:00.000Z" };
let request = "";
const page = await listCompactOrders(async (input, init) => {
  request = String(input);
  assert.deepEqual(init, { cache: "no-store", credentials: "same-origin" });
  return new Response(JSON.stringify({ items: [order], pagination: { limit: 5, offset: 0, total: 12 } }), { status: 200 });
});
assert.equal(COMPACT_ORDER_LIMIT, 5);
assert.equal(request, "/api/v1/admin/orders?limit=5&offset=0");
assert.equal(page.items.length, 1);
await assert.rejects(() => listCompactOrders(async () => new Response(JSON.stringify({ items: [order], pagination: { limit: 25, offset: 0, total: 1 } }), { status: 200 })), /tidak valid/);

const source = await readFile(new URL("../src/components/OrderDataTable.tsx", import.meta.url), "utf8");
const compact = source.slice(source.indexOf("function CompactOrderSummary"), source.indexOf("function FullOrderDataTable"));
assert.match(compact, /Lihat semua pesanan/);
for (const forbidden of ["dispatchOrder", "transitionOrder", "OrderDrawer", "Pagination", "setSelectedId", "<form"]) assert.equal(compact.includes(forbidden), false, `compact mode must not include ${forbidden}`);
console.log("compact orders smoke passed");
