import assert from "node:assert/strict";
import { getPlatformStats, listPlatformAuditLogs, parsePlatformAuditPage, parsePlatformStats } from "../src/lib/platform-observability.ts";

const stats = { totalTenants: 3, activeTenants: 2, suspendedTenants: 1, totalGmv: 47_800_000, totalOrders: 315, securityAlertsCount: null };
assert.deepEqual(parsePlatformStats(stats), stats);
assert.throws(() => parsePlatformStats({ ...stats, securityAlertsCount: 1 }), /invalid statistics/);

const audit = { id: "log_1", tenantId: null, actorId: "user_1", actorEmail: "operator@dotads.local", actorRole: "SUPER_ADMIN", action: "tenant.create", targetType: "tenant", targetId: "tenant_1", createdAt: "2026-08-16T00:00:00.000Z" };
const page = { items: [audit], pagination: { limit: 25, offset: 0, total: 1 } };
assert.deepEqual(parsePlatformAuditPage(page), page);
assert.throws(() => parsePlatformAuditPage({ ...page, items: [{ ...audit, createdAt: "invalid" }] }), /invalid audit record/);

const calls: string[] = [];
const fetcher = (async (url: string | URL | Request) => {
  calls.push(String(url));
  return new Response(JSON.stringify(String(url).includes("stats") ? stats : page), { status: 200 });
}) as typeof fetch;
assert.equal((await getPlatformStats(fetcher)).activeTenants, 2);
assert.equal((await listPlatformAuditLogs({ limit: 25, offset: 25, action: "tenant.create" }, fetcher)).pagination.total, 1);
assert.equal(calls[0], "/api/v1/platform/stats");
assert.equal(calls[1], "/api/v1/platform/audit-logs?limit=25&offset=25&action=tenant.create");

console.log("PLATFORM OBSERVABILITY CLIENT SMOKE TEST PASSED");
