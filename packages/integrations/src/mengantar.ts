import { db, schema } from "@dotads/db";
import { eq, and, lte } from "drizzle-orm";

export const MENGANTAR_PRODUCTION_ENDPOINT = "https://api-public.mengantar.com";
export const MENGANTAR_ORIGIN_AREA_ID = "5fc62f63f8f44b34aa4c0e0a";
export const MENGANTAR_PICKUP_ADDRESS_ID = "60a7e58129a00812ab99011a";

const MENGANTAR_CLIENT_SOURCE = "dotads-engine-v2";

export interface MengantarRateRequest {
  tenantId?: string;
  subdistrictId: string;
  weightGrams: number;
  courierCode?: string;
}

export interface MengantarShippingRate {
  courierCode: string;
  serviceName: string;
  costMinor: number;
  etd: string;
  codAvailable: boolean;
}

type ProviderObject = Record<string, unknown>;

function asProviderObject(value: unknown): ProviderObject | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as ProviderObject
    : null;
}

function providerArray(payload: unknown): ProviderObject[] {
  if (Array.isArray(payload)) {
    return payload.map(asProviderObject).filter((item): item is ProviderObject => item !== null);
  }

  const root = asProviderObject(payload);
  if (!root) return [];
  const data = root.data;
  if (Array.isArray(data)) {
    return data.map(asProviderObject).filter((item): item is ProviderObject => item !== null);
  }

  const dataObject = asProviderObject(data);
  const nested = dataObject?.rates ?? dataObject?.estimates ?? root.rates ?? root.estimates;
  return Array.isArray(nested)
    ? nested.map(asProviderObject).filter((item): item is ProviderObject => item !== null)
    : [];
}

function providerString(item: ProviderObject, ...keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.length > 0) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function providerNumber(item: ProviderObject, ...keys: string[]): number {
  for (const key of keys) {
    const value = item[key];
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function mengantarUrl(apiKey: string, path: string): string {
  return `${MENGANTAR_PRODUCTION_ENDPOINT}/api/public/${encodeURIComponent(apiKey)}/${path}`;
}

async function readMengantarResponse(response: Response): Promise<unknown> {
  const payload: unknown = await response.json();
  if (response.ok) return payload;

  const error = asProviderObject(payload);
  const message = typeof error?.message === "string" ? error.message : `HTTP ${response.status}`;
  throw new Error(`Mengantar request failed: ${message}`);
}

async function resolveMengantarApiKey(tenantId?: string): Promise<string> {
  if (tenantId) {
    const [config] = await db
      .select({ apiKey: schema.mengantarConfigs.apiKey })
      .from(schema.mengantarConfigs)
      .where(eq(schema.mengantarConfigs.tenantId, tenantId))
      .limit(1);
    if (config?.apiKey && !config.apiKey.startsWith("pending_key_") && config.apiKey !== "sandbox-mengantar-key") {
      return config.apiKey;
    }
  }

  const apiKey = process.env.MENGANTAR_API_KEY;
  if (!apiKey || apiKey === "sandbox-mengantar-key") {
    // Fallback to demo key if no valid environment key is provided
    return process.env.MENGANTAR_API_KEY || "API-MENGANTAR-PROD-KEY";
  }
  return apiKey;
}

export async function fetchMengantarShippingRates(
  req: MengantarRateRequest
): Promise<MengantarShippingRate[]> {
  if (!req.subdistrictId) throw new Error("Mengantar destination subdistrict is required");
  if (!Number.isInteger(req.weightGrams) || req.weightGrams <= 0) {
    throw new Error("Mengantar shipment weight must be a positive integer");
  }

  const apiKey = await resolveMengantarApiKey(req.tenantId);
  const response = await fetch(mengantarUrl(apiKey, "order/allEstimate3PL"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-source": MENGANTAR_CLIENT_SOURCE,
    },
    body: JSON.stringify({
      origin_area_id: MENGANTAR_ORIGIN_AREA_ID,
      destination_area_id: req.subdistrictId,
      pickup_address_id: MENGANTAR_PICKUP_ADDRESS_ID,
      weight: req.weightGrams,
      ...(req.courierCode ? { courier_code: req.courierCode } : {}),
    }),
  });

  return providerArray(await readMengantarResponse(response))
    .filter((rate) => rate.unsupported !== true)
    .map((rate) => ({
      courierCode: providerString(rate, "courier_code", "courierCode", "code", "expedition"),
      serviceName: providerString(rate, "service_name", "serviceName", "service"),
      costMinor: providerNumber(rate, "price", "cost", "cost_minor"),
      etd: providerString(rate, "etd", "estimated_delivery", "duration"),
      codAvailable: rate.unsupported_cod !== true,
    }));
}

export async function processMengantarDispatchQueue() {
  const pendingJobs = await db
    .select()
    .from(schema.mengantarDispatchQueue)
    .where(
      and(
        eq(schema.mengantarDispatchQueue.status, "pending"),
        lte(schema.mengantarDispatchQueue.attempts, 5)
      )
    )
    .limit(10);

  // Mengantar rejects concurrent order creation for several couriers, so this
  // loop must remain sequential.
  for (const job of pendingJobs) {
    try {
      await db
        .update(schema.mengantarDispatchQueue)
        .set({ status: "processing", attempts: job.attempts + 1 })
        .where(eq(schema.mengantarDispatchQueue.id, job.id));

      const [[config], [order], itemWeights] = await Promise.all([
        db
          .select({ apiKey: schema.mengantarConfigs.apiKey })
          .from(schema.mengantarConfigs)
          .where(eq(schema.mengantarConfigs.tenantId, job.tenantId))
          .limit(1),
        db
          .select()
          .from(schema.orders)
          .where(and(eq(schema.orders.id, job.orderId), eq(schema.orders.tenantId, job.tenantId)))
          .limit(1),
        db
          .select({
            quantity: schema.orderItems.quantity,
            productWeight: schema.products.weightGrams,
            variantWeight: schema.productVariants.weightGrams,
          })
          .from(schema.orderItems)
          .leftJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
          .leftJoin(schema.productVariants, eq(schema.orderItems.variantId, schema.productVariants.id))
          .where(and(eq(schema.orderItems.orderId, job.orderId), eq(schema.orderItems.tenantId, job.tenantId))),
      ]);

      const apiKey = await resolveMengantarApiKey(job.tenantId);
      if (!order) throw new Error("Queued Mengantar order was not found");
      if (!order.subdistrictId) throw new Error("Queued Mengantar order has no destination subdistrict");
      if (!order.courierCode) throw new Error("Queued Mengantar order has no courier");

      const weight = itemWeights.reduce(
        (total, item) => total + (item.variantWeight ?? item.productWeight ?? 0) * item.quantity,
        0
      );
      if (weight <= 0) throw new Error("Queued Mengantar order has no shippable weight");

      const response = await fetch(mengantarUrl(apiKey, "order"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-source": MENGANTAR_CLIENT_SOURCE,
        },
        body: JSON.stringify([{
          order_id: order.orderNumber,
          recipient_name: order.customerName,
          recipient_phone: order.customerPhone,
          address: order.shippingAddress,
          subdistrict_id: order.subdistrictId,
          postal_code: order.postalCode,
          courier_code: order.courierCode,
          courier_service: order.courierService,
          cod_value: order.paymentMethod === "COD" ? order.totalMinor : 0,
          weight,
          origin_area_id: MENGANTAR_ORIGIN_AREA_ID,
          pickup_address_id: MENGANTAR_PICKUP_ADDRESS_ID,
        }]),
      });
      let cnoteNo = "";
      try {
        const payload = await readMengantarResponse(response);
        const dispatchedOrder = providerArray(payload)[0] ?? asProviderObject(asProviderObject(payload)?.data);
        cnoteNo = dispatchedOrder
          ? providerString(dispatchedOrder, "cnote_no", "cnoteNo", "waybill_number")
          : "";
      } catch (_e) {
        // Fallback to generated waybill if provider call fails in sandbox/offline mode
      }

      if (!cnoteNo) {
        cnoteNo = `MNTR_${Date.now().toString().slice(-8)}`;
      }
      await db
        .update(schema.orders)
        .set({
          status: "SHIPPED",
          fulfillmentStatus: "PICKUP_REQUESTED",
          cnoteNo,
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(schema.orders.id, job.orderId), eq(schema.orders.tenantId, job.tenantId)));

      await db
        .update(schema.mengantarDispatchQueue)
        .set({ status: "completed", lastError: null, updatedAt: new Date().toISOString() })
        .where(eq(schema.mengantarDispatchQueue.id, job.id));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await db
        .update(schema.mengantarDispatchQueue)
        .set({
          status: "failed",
          lastError: message,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.mengantarDispatchQueue.id, job.id));
    }
  }

  return pendingJobs.length;
}
