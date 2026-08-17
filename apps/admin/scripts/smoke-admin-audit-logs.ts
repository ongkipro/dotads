import assert from "node:assert/strict";
import { listTenantAuditLogs, parseTenantAuditLogPage } from "../src/lib/admin-audit-logs.ts";

const fixture = {
  items: [{ id: "1a1a1a1a-1111-4111-8111-111111111111", action: "order.cancel", actor: { email: "owner@example.id", role: "TENANT_OWNER" }, target: { type: "order", id: "order_1" }, createdAt: "2026-08-17T01:00:00.000Z" }],
  pagination: { limit: 25, offset: 0, total: 1 },
  filters: { actions: ["order.cancel"] },
};

assert.deepEqual(parseTenantAuditLogPage(fixture), fixture);
assert.throws(() => parseTenantAuditLogPage({ ...fixture, unexpected: true }), /tidak valid/);
assert.throws(() => parseTenantAuditLogPage({ ...fixture, items: [{ ...fixture.items[0], ipAddress: "127.0.0.1" }] }), /tidak valid/);
assert.throws(() => parseTenantAuditLogPage({ ...fixture, pagination: { limit: 101, offset: 0, total: 1 } }), /tidak valid/);
assert.throws(() => parseTenantAuditLogPage({ ...fixture, items: [{ ...fixture.items[0], actor: { email: "bukan-email", role: "ADMIN" } }] }), /tidak valid/);

let requested = "";
const page = await listTenantAuditLogs({ offset: 25, q: "literal%target", action: "order.cancel", days: 7 }, async (input, init) => {
  requested = String(input);
  assert.equal(init?.credentials, "include");
  assert.equal(init?.cache, "no-store");
  return new Response(JSON.stringify({ ...fixture, pagination: { limit: 25, offset: 25, total: 26 } }), { status: 200, headers: { "content-type": "application/json" } });
});
assert.equal(page.pagination.offset, 25);
const url = new URL(requested, "http://local.test");
assert.equal(url.pathname, "/api/v1/admin/audit-logs");
assert.deepEqual(Object.fromEntries(url.searchParams), { limit: "25", offset: "25", q: "literal%target", action: "order.cancel", days: "7" });

await assert.rejects(() => listTenantAuditLogs({}, async () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })), (error: unknown) => error instanceof Error && error.message === "Peran Anda tidak memiliki akses ke log aktivitas toko.");
await assert.rejects(() => listTenantAuditLogs({}, async () => new Response(JSON.stringify({ error: "Workspace selection required" }), { status: 409 })), (error: unknown) => error instanceof Error && error.message === "Pilih satu workspace aktif sebelum membuka log aktivitas.");
console.log("ADMIN AUDIT LOG CLIENT SMOKE PASSED");
