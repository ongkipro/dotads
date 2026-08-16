export const PLATFORM_TENANTS_PATH = "/api/v1/platform/tenants";

export type TenantStatus = "active" | "suspended" | "cancelled" | "provisioning";
export type TenantTier = "STARTER" | "PRO" | "ENTERPRISE";

export interface PlatformTenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  tier: TenantTier;
  customDomain: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformTenantInput {
  name: string;
  slug: string;
  tier: TenantTier;
  customDomain?: string;
}

export interface UpdateTenantStatusInput {
  status: Exclude<TenantStatus, "provisioning">;
  reason: string;
}

type Fetcher = typeof fetch;

const statuses = new Set<TenantStatus>(["active", "suspended", "cancelled", "provisioning"]);
const tiers = new Set<TenantTier>(["STARTER", "PRO", "ENTERPRISE"]);

function parseTenant(value: unknown): PlatformTenant {
  if (!value || typeof value !== "object") throw new Error("Platform API returned an invalid tenant record.");
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    typeof item.name !== "string" ||
    typeof item.slug !== "string" ||
    typeof item.status !== "string" ||
    !statuses.has(item.status as TenantStatus) ||
    typeof item.tier !== "string" ||
    !tiers.has(item.tier.toUpperCase() as TenantTier) ||
    !(typeof item.customDomain === "string" || item.customDomain === null) ||
    typeof item.createdAt !== "string" ||
    Number.isNaN(Date.parse(item.createdAt)) ||
    typeof item.updatedAt !== "string" ||
    Number.isNaN(Date.parse(item.updatedAt))
  ) {
    throw new Error("Platform API returned an invalid tenant record.");
  }

  return { ...item, tier: item.tier.toUpperCase() } as unknown as PlatformTenant;
}

async function parseResponse(response: Response): Promise<unknown> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const apiMessage = payload && typeof payload === "object" && typeof (payload as { error?: unknown }).error === "string"
      ? (payload as { error: string }).error
      : null;
    throw new Error(apiMessage || `Platform API request failed (${response.status}).`);
  }
  return payload;
}

export async function listPlatformTenants(fetcher: Fetcher = fetch): Promise<PlatformTenant[]> {
  const response = await fetcher(PLATFORM_TENANTS_PATH, { cache: "no-store", credentials: "same-origin" });
  const payload = await parseResponse(response);
  if (!Array.isArray(payload)) throw new Error("Platform API returned an invalid tenant list.");
  return payload.map(parseTenant);
}

export async function createPlatformTenant(input: CreatePlatformTenantInput, fetcher: Fetcher = fetch): Promise<PlatformTenant> {
  const response = await fetcher(PLATFORM_TENANTS_PATH, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseTenant(await parseResponse(response));
}

export async function updatePlatformTenantStatus(
  tenantId: string,
  input: UpdateTenantStatusInput,
  fetcher: Fetcher = fetch,
): Promise<PlatformTenant> {
  const response = await fetcher(`${PLATFORM_TENANTS_PATH}/${encodeURIComponent(tenantId)}/status`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseTenant(await parseResponse(response));
}
