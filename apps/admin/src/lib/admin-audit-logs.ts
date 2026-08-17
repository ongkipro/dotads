export const ADMIN_AUDIT_LOGS_PATH = "/api/v1/admin/audit-logs";

export interface TenantAuditLog {
  id: string;
  action: string;
  actor: { email: string; role: string };
  target: { type: string; id: string };
  createdAt: string;
}

export interface TenantAuditLogPage {
  items: TenantAuditLog[];
  pagination: { limit: number; offset: number; total: number };
  filters: { actions: string[] };
}

export class TenantAuditLogError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const exact = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).sort().join(",") === [...keys].sort().join(",");
const string = (value: unknown): value is string => typeof value === "string" && value.length > 0;

function parseItem(value: unknown): TenantAuditLog {
  if (!isObject(value) || !exact(value, ["id", "action", "actor", "target", "createdAt"]) ||
      !string(value.id) || !UUID.test(value.id) || !string(value.action) || value.action.length > 100 || !string(value.createdAt) ||
      !INSTANT.test(value.createdAt) || Number.isNaN(Date.parse(value.createdAt)) ||
      !isObject(value.actor) || !exact(value.actor, ["email", "role"]) || !string(value.actor.email) || value.actor.email.length > 255 || !EMAIL.test(value.actor.email) || !string(value.actor.role) || value.actor.role.length > 50 ||
      !isObject(value.target) || !exact(value.target, ["type", "id"]) || !string(value.target.type) || value.target.type.length > 50 || !string(value.target.id) || value.target.id.length > 500) {
    throw new Error("API log aktivitas mengembalikan data yang tidak valid.");
  }
  return { id: value.id, action: value.action, actor: { email: value.actor.email, role: value.actor.role }, target: { type: value.target.type, id: value.target.id }, createdAt: value.createdAt };
}

export function parseTenantAuditLogPage(value: unknown): TenantAuditLogPage {
  if (!isObject(value) || !exact(value, ["items", "pagination", "filters"]) || !Array.isArray(value.items) || value.items.length > 100 ||
      !isObject(value.pagination) || !exact(value.pagination, ["limit", "offset", "total"]) ||
      !Number.isInteger(value.pagination.limit) || !Number.isInteger(value.pagination.offset) || !Number.isSafeInteger(value.pagination.total) ||
      (value.pagination.limit as number) < 1 || (value.pagination.limit as number) > 100 || (value.pagination.offset as number) < 0 || (value.pagination.offset as number) > 10_000 || (value.pagination.total as number) < 0 ||
      !isObject(value.filters) || !exact(value.filters, ["actions"]) || !Array.isArray(value.filters.actions) || value.filters.actions.length > 100 || !value.filters.actions.every((action) => string(action) && action.length <= 100)) {
    throw new Error("API log aktivitas mengembalikan data yang tidak valid.");
  }
  return {
    items: value.items.map(parseItem),
    pagination: value.pagination as unknown as TenantAuditLogPage["pagination"],
    filters: { actions: value.filters.actions as string[] },
  };
}

export async function listTenantAuditLogs(input: { limit?: number; offset?: number; q?: string; action?: string; days?: 7 | 30 } = {}, fetcher: typeof fetch = fetch): Promise<TenantAuditLogPage> {
  const query = new URLSearchParams({ limit: String(input.limit ?? 25), offset: String(input.offset ?? 0) });
  if (input.q) query.set("q", input.q);
  if (input.action) query.set("action", input.action);
  if (input.days) query.set("days", String(input.days));
  const response = await fetcher(`${ADMIN_AUDIT_LOGS_PATH}?${query}`, { credentials: "include", cache: "no-store" });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = response.status === 400 ? "Filter log aktivitas tidak valid. Periksa kata pencarian dan periode."
      : response.status === 401 ? "Sesi Anda berakhir. Masuk kembali untuk melihat log aktivitas."
      : response.status === 403 ? "Peran Anda tidak memiliki akses ke log aktivitas toko."
      : response.status === 409 ? "Pilih satu workspace aktif sebelum membuka log aktivitas."
      : response.status >= 500 ? "Layanan log aktivitas sedang bermasalah. Coba lagi nanti."
      : isObject(body) && typeof body.error === "string" ? body.error : `Permintaan log aktivitas gagal (${response.status}).`;
    throw new TenantAuditLogError(message, response.status);
  }
  return parseTenantAuditLogPage(body);
}
