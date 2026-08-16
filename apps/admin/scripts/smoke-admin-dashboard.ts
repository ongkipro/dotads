import assert from "node:assert/strict";
import { AdminDashboardError, getAdminDashboard, parseAdminDashboard } from "../src/lib/admin-dashboard.ts";

const statuses = { PENDING_PAYMENT: 1, CONFIRMED: 2, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 1, REFUNDED: 0 };
const payments = { UNPAID: 2, PAID: 2, REFUNDED: 0, FAILED: 0 };
const fulfillment = { UNFULFILLED: 3, PICKUP_REQUESTED: 0, IN_TRANSIT: 0, DELIVERED: 1, RETURNED: 0, FAILED: 0 };
const daily = Array.from({ length: 7 }, (_, index) => ({ date: `2026-08-${String(10 + index).padStart(2, "0")}`, ordersCreated: index === 6 ? 3 : 0, grossOrderValueMinor: index === 6 ? 450_000 : 0 }));
const fixture = { currency: "IDR", timeZone: "Asia/Jakarta", period: { days: 7, from: "2026-08-09T17:00:00.000Z", to: "2026-08-16T17:00:00.000Z" }, kpis: { ordersCreated: 3, grossOrderValueMinor: 450_000 }, daily, breakdowns: { orderStatus: statuses, paymentStatus: payments, fulfillmentStatus: fulfillment } };

assert.deepEqual(parseAdminDashboard(fixture), fixture);
for (const malformed of [
  { ...fixture, currency: "USD" },
  { ...fixture, period: { ...fixture.period, from: "2026-08-09" } },
  { ...fixture, daily: fixture.daily.slice(1) },
  { ...fixture, daily: fixture.daily.map((item, index) => index === 0 ? { ...item, grossOrderValueMinor: 1.5 } : item) },
  { ...fixture, daily: fixture.daily.map((item, index) => index === 1 ? { ...item, date: fixture.daily[0].date } : item) },
  { ...fixture, daily: fixture.daily.map((item, index) => index === 1 ? { ...item, date: "2026-08-18" } : item) },
  { ...fixture, kpis: { ...fixture.kpis, ordersCreated: 4 } },
  { ...fixture, period: { ...fixture.period, to: "2026-08-17T17:00:00.000Z" } },
  { ...fixture, breakdowns: { ...fixture.breakdowns, paymentStatus: { ...payments, UNKNOWN: 1 } } },
  { ...fixture, extra: true },
]) assert.throws(() => parseAdminDashboard(malformed), /tidak valid/);

let called = "";
const fixture30 = { ...fixture, period: { days: 30, from: "2026-06-30T17:00:00.000Z", to: "2026-07-30T17:00:00.000Z" }, kpis: { ordersCreated: 0, grossOrderValueMinor: 0 }, daily: Array.from({ length: 30 }, (_, index) => ({ date: `2026-07-${String(index + 1).padStart(2, "0")}`, ordersCreated: 0, grossOrderValueMinor: 0 })) };
const parsed = await getAdminDashboard(30, async (input, init) => {
  called = String(input);
  assert.deepEqual(init, { credentials: "same-origin", cache: "no-store" });
  return new Response(JSON.stringify(fixture30), { status: 200 });
});
assert.equal(called, "/api/v1/dashboard?days=30");
assert.equal(parsed.period.days, 30);
assert.throws(() => parseAdminDashboard(fixture, 30), /tidak valid/);

for (const status of [400, 401, 403, 409]) {
  await assert.rejects(() => getAdminDashboard(7, async () => new Response(JSON.stringify({ error: `dashboard-${status}`, ...(status === 409 ? { code: "WORKSPACE_SELECTION_REQUIRED", workspaceSelectionRequired: true } : {}) }), { status })),
    (error) => error instanceof AdminDashboardError && error.status === status && error.message === `dashboard-${status}` && error.code === null);
}
await assert.rejects(() => getAdminDashboard(7, async () => new Response(JSON.stringify({ error: "Workspace selection required", code: "WORKSPACE_SELECTION_REQUIRED", workspaceSelectionRequired: true }), { status: 409 })),
  (error) => error instanceof AdminDashboardError && error.status === 409 && error.code === "WORKSPACE_SELECTION_REQUIRED");
await assert.rejects(() => getAdminDashboard(7, async () => new Response(JSON.stringify({ error: "Workspace selection required", code: "WORKSPACE_SELECTION_REQUIRED" }), { status: 409 })),
  (error) => error instanceof AdminDashboardError && error.status === 409 && error.code === null);
console.log("admin dashboard client smoke passed");
