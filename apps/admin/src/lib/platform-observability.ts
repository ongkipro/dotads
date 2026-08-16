export const PLATFORM_STATS_PATH = "/api/v1/platform/stats";
export const PLATFORM_AUDIT_PATH = "/api/v1/platform/audit-logs";

export interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalGmv: number;
  totalOrders: number;
  securityAlertsCount: null;
}

export interface PlatformAuditItem {
  id: string;
  tenantId: string | null;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

export interface PlatformAuditPage {
  items: PlatformAuditItem[];
  pagination: { limit: number; offset: number; total: number };
}

export interface PlatformAuditFilters {
  limit?: number;
  offset?: number;
  tenantId?: string;
  action?: string;
  actorId?: string;
}

async function parseResponse(response: Response): Promise<unknown> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload === "object" && typeof (payload as { error?: unknown }).error === "string"
      ? (payload as { error: string }).error
      : `Platform API request failed (${response.status}).`;
    throw new Error(message);
  }
  return payload;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function parsePlatformStats(value: unknown): PlatformStats {
  if (!value || typeof value !== "object") throw new Error("Platform API returned invalid statistics.");
  const item = value as Record<string, unknown>;
  if (
    !isNonNegativeNumber(item.totalTenants) ||
    !isNonNegativeNumber(item.activeTenants) ||
    !isNonNegativeNumber(item.suspendedTenants) ||
    !isNonNegativeNumber(item.totalGmv) ||
    !isNonNegativeNumber(item.totalOrders) ||
    item.securityAlertsCount !== null
  ) throw new Error("Platform API returned invalid statistics.");
  return item as unknown as PlatformStats;
}

function parseAuditItem(value: unknown): PlatformAuditItem {
  if (!value || typeof value !== "object") throw new Error("Platform API returned an invalid audit record.");
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    !(item.tenantId === null || typeof item.tenantId === "string") ||
    typeof item.actorId !== "string" ||
    typeof item.actorEmail !== "string" ||
    typeof item.actorRole !== "string" ||
    typeof item.action !== "string" ||
    typeof item.targetType !== "string" ||
    typeof item.targetId !== "string" ||
    typeof item.createdAt !== "string" ||
    Number.isNaN(Date.parse(item.createdAt))
  ) throw new Error("Platform API returned an invalid audit record.");
  return item as unknown as PlatformAuditItem;
}

export function parsePlatformAuditPage(value: unknown): PlatformAuditPage {
  if (!value || typeof value !== "object") throw new Error("Platform API returned an invalid audit page.");
  const page = value as { items?: unknown; pagination?: unknown };
  const pagination = page.pagination && typeof page.pagination === "object" ? page.pagination as Record<string, unknown> : null;
  if (
    !Array.isArray(page.items) ||
    !pagination ||
    !isNonNegativeNumber(pagination.limit) ||
    !isNonNegativeNumber(pagination.offset) ||
    !isNonNegativeNumber(pagination.total)
  ) throw new Error("Platform API returned an invalid audit page.");
  return { items: page.items.map(parseAuditItem), pagination: pagination as unknown as PlatformAuditPage["pagination"] };
}

export async function getPlatformStats(fetcher: typeof fetch = fetch): Promise<PlatformStats> {
  const response = await fetcher(PLATFORM_STATS_PATH, { cache: "no-store", credentials: "same-origin" });
  return parsePlatformStats(await parseResponse(response));
}

export async function listPlatformAuditLogs(filters: PlatformAuditFilters = {}, fetcher: typeof fetch = fetch): Promise<PlatformAuditPage> {
  const params = new URLSearchParams();
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));
  if (filters.tenantId) params.set("tenantId", filters.tenantId);
  if (filters.action) params.set("action", filters.action);
  if (filters.actorId) params.set("actorId", filters.actorId);
  const response = await fetcher(`${PLATFORM_AUDIT_PATH}?${params}`, { cache: "no-store", credentials: "same-origin" });
  return parsePlatformAuditPage(await parseResponse(response));
}
