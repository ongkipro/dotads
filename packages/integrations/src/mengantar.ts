import { db, schema, withDatabaseContext, type DatabaseSessionContext } from "@dotads/db";
import { eq, and, lte, or, isNull, inArray } from "drizzle-orm";

export const MENGANTAR_PRODUCTION_ENDPOINT = "https://api-public.mengantar.com";
export const MENGANTAR_ORIGIN_AREA_ID = "5fc62f63f8f44b34aa4c0e0a";
export const MENGANTAR_PICKUP_ADDRESS_ID = "60a7e58129a00812ab99011a";

const MENGANTAR_CLIENT_SOURCE = "dotads-engine-v2";
const WORKER_ID = "system:mengantar-dispatch-worker";
const WORKER_EMAIL = "mengantar-worker@dotads.invalid";

function workerContext(tenantId: string, platform = false): DatabaseSessionContext {
  return {
    userId: WORKER_ID,
    userEmail: WORKER_EMAIL,
    tenantId: platform ? "" : tenantId,
    organizationId: "",
    role: platform ? "SUPER_ADMIN" : "TENANT_OWNER",
    tenantName: platform ? "DotAds Platform" : "Mengantar worker tenant",
    tenantStatus: "active",
  };
}

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

export type MengantarWebhookStatus = "ON_PROCESS" | "IN_TRANSIT" | "DELIVERED" | "RETURNED" | "FAILED";

export interface MengantarTrackingSummary {
  count: number;
  latestStatus?: string;
  latestTimestamp?: string;
  latestDescription?: string;
}

export interface ReconcileMengantarInput {
  tenantId: string;
  waybillNumber: string;
  status: MengantarWebhookStatus;
  trackingSummary: MengantarTrackingSummary;
}

export interface ReconcileMengantarResult {
  outcome: "transitioned" | "idempotent" | "stale" | "not_found";
  purchaseEligible: boolean;
  orderId?: string;
}

export function toIntegerRupiah(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("IDR amount must be a non-negative number");
  }
  return Math.round(value);
}

type ProviderObject = Record<string, unknown>;

function asProviderObject(value: unknown): ProviderObject | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as ProviderObject;
  }
  return null;
}

function providerArray(payload: unknown): ProviderObject[] {
  if (Array.isArray(payload)) {
    return payload.map(asProviderObject).filter((item): item is ProviderObject => item !== null);
  }
  const root = asProviderObject(payload);
  if (!root) return [];
  const nested = root.data ?? root.results;
  if (Array.isArray(nested)) {
    return nested.map(asProviderObject).filter((item): item is ProviderObject => item !== null);
  }
  return [];
}

function providerString(item: ProviderObject, ...keys: string[]): string {
  for (const key of keys) {
    const val = item[key];
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
    if (typeof val === "number") return String(val);
  }
  return "";
}

function providerNumber(item: ProviderObject, ...keys: string[]): number {
  for (const key of keys) {
    const val = item[key];
    if (typeof val === "number" && !Number.isNaN(val)) return val;
    if (typeof val === "string" && val.trim().length > 0) {
      const parsed = Number(val);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

function mengantarUrl(apiKey: string, path: string): string {
  return `${MENGANTAR_PRODUCTION_ENDPOINT}/api/public/${encodeURIComponent(apiKey)}/${path}`;
}

async function readMengantarResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function resolveMengantarApiKey(tenantId?: string): Promise<string> {
  if (tenantId) {
    const [config] = await db
      .select({ apiKey: schema.mengantarConfigs.apiKey })
      .from(schema.mengantarConfigs)
      .where(eq(schema.mengantarConfigs.tenantId, tenantId))
      .limit(1);

    if (config?.apiKey) return config.apiKey;
  }
  const apiKey = process.env.MENGANTAR_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MENGANTAR_API_KEY is required in production");
    }
    return "sandbox-mengantar-key";
  }
  return apiKey;
}

export async function fetchMengantarShippingRates(
  req: MengantarRateRequest
): Promise<MengantarShippingRate[]> {
  if (!req.subdistrictId) {
    throw new Error("Queued Mengantar order has no destination subdistrict");
  }

  const apiKey = await resolveMengantarApiKey(req.tenantId);
  const targetCourier = req.courierCode || "JNE";

  try {
    const response = await fetch(mengantarUrl(apiKey, `order/allEstimate3PL`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-source": MENGANTAR_CLIENT_SOURCE,
      },
      body: JSON.stringify({
        subdistrict_id: req.subdistrictId,
        weight: req.weightGrams || 1000,
        origin_area_id: MENGANTAR_ORIGIN_AREA_ID,
        pickup_address_id: MENGANTAR_PICKUP_ADDRESS_ID,
      }),
    });

    const payload = await readMengantarResponse(response);
    const providers = providerArray(payload);

    const rates: MengantarShippingRate[] = [];
    for (const item of providers) {
      const courierCode = providerString(item, "provider", "courier_code", "code").toUpperCase();
      if (req.courierCode && courierCode !== req.courierCode.toUpperCase()) continue;

      const serviceName = providerString(item, "service_name", "service", "name") || "REG";
      const cost = providerNumber(item, "price", "rate", "cost", "total_price");
      const etd = providerString(item, "etd", "estimated_days", "delivery_time") || "2-3 hari";
      const codAvailable = Boolean(item.is_cod ?? item.cod_supported ?? true);

      if (cost > 0) {
        rates.push({
          courierCode: courierCode || targetCourier,
          serviceName,
          // IDR is stored as integer rupiah (zero-decimal currency).
          costMinor: toIntegerRupiah(cost),
          etd,
          codAvailable,
        });
      }
    }

    if (rates.length > 0) return rates;
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    // Offline rates are intentionally limited to local/test environments.
  }

  return [
    {
      courierCode: targetCourier,
      serviceName: "REG",
      costMinor: 18000,
      etd: "2-3 Hari",
      codAvailable: true,
    },
    {
      courierCode: targetCourier,
      serviceName: "YES / Express",
      costMinor: 26000,
      etd: "1 Hari",
      codAvailable: true,
    },
  ];
}

export async function reconcileMengantarStatus(input: ReconcileMengantarInput): Promise<ReconcileMengantarResult> {
  const nextFulfillmentStatus = input.status === "ON_PROCESS" ? "IN_TRANSIT" : input.status;
  const result = await db.transaction(async (tx): Promise<ReconcileMengantarResult> => {
    const [order] = await tx.select().from(schema.orders).where(and(
      eq(schema.orders.tenantId, input.tenantId),
      eq(schema.orders.cnoteNo, input.waybillNumber),
    )).limit(1).for("update");
    if (!order) return { outcome: "not_found", purchaseEligible: false };
    if (order.fulfillmentStatus === nextFulfillmentStatus) {
      return { outcome: "idempotent", purchaseEligible: false, orderId: order.id };
    }
    if (["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status) ||
        ["DELIVERED", "RETURNED", "FAILED"].includes(order.fulfillmentStatus)) {
      return { outcome: "stale", purchaseEligible: false, orderId: order.id };
    }

    const allowedPrevious: Record<string, string[]> = {
      IN_TRANSIT: ["UNFULFILLED", "PICKUP_REQUESTED"],
      DELIVERED: ["PICKUP_REQUESTED", "IN_TRANSIT"],
      RETURNED: ["PICKUP_REQUESTED", "IN_TRANSIT"],
      FAILED: ["PICKUP_REQUESTED", "IN_TRANSIT"],
    };
    if (order.status !== "SHIPPED" || !allowedPrevious[nextFulfillmentStatus]?.includes(order.fulfillmentStatus)) {
      return { outcome: "stale", purchaseEligible: false, orderId: order.id };
    }

    const now = new Date().toISOString();
    const delivered = nextFulfillmentStatus === "DELIVERED";
    const [updatedOrder] = await tx.update(schema.orders).set({
      status: delivered ? "DELIVERED" : order.status,
      fulfillmentStatus: nextFulfillmentStatus,
      paymentStatus: delivered && order.paymentMethod === "COD" ? "PAID" : order.paymentStatus,
      updatedAt: now,
    }).where(and(
      eq(schema.orders.id, order.id),
      eq(schema.orders.tenantId, input.tenantId),
      eq(schema.orders.status, "SHIPPED"),
      eq(schema.orders.fulfillmentStatus, order.fulfillmentStatus),
      eq(schema.orders.paymentStatus, order.paymentStatus),
    )).returning();
    if (!updatedOrder) return { outcome: "stale", purchaseEligible: false, orderId: order.id };

    await tx.insert(schema.orderEvents).values({
      tenantId: input.tenantId,
      orderId: order.id,
      event: `COURIER_${input.status}`,
      actor: "SYSTEM_MENGANTAR_WEBHOOK",
      metadataJson: {
        waybillNumber: input.waybillNumber,
        providerStatus: input.status,
        trackingSummary: input.trackingSummary,
      },
    });
    await tx.insert(schema.auditLogs).values({
      tenantId: input.tenantId,
      actorId: "webhook:mengantar",
      actorEmail: "mengantar@webhook.dotads.invalid",
      actorRole: "SYSTEM_WEBHOOK",
      action: "order.fulfillment_updated",
      targetType: "order",
      targetId: order.id,
      metadataJson: {
        waybillNumber: input.waybillNumber,
        providerStatus: input.status,
        before: { orderStatus: order.status, paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus },
        after: { orderStatus: updatedOrder.status, paymentStatus: updatedOrder.paymentStatus, fulfillmentStatus: updatedOrder.fulfillmentStatus },
      },
    });
    return {
      outcome: "transitioned",
      purchaseEligible: delivered && order.paymentMethod === "COD",
      orderId: order.id,
    };
  });

  return result;
}

export async function processMengantarDispatchQueue() {
  const nowIso = new Date().toISOString();
  const pendingJobs = await withDatabaseContext(workerContext("", true), () =>
    db
      .select()
      .from(schema.mengantarDispatchQueue)
      .where(
        and(
          eq(schema.mengantarDispatchQueue.status, "pending"),
          lte(schema.mengantarDispatchQueue.attempts, 2),
          or(
            isNull(schema.mengantarDispatchQueue.nextRetryAt),
            lte(schema.mengantarDispatchQueue.nextRetryAt, nowIso)
          )
        )
      )
      .limit(10)
  );

  let claimedJobs = 0;
  for (const job of pendingJobs) {
    await withDatabaseContext(workerContext(job.tenantId), async () => {
      const currentAttempts = job.attempts + 1;
      const [claimed] = await db
        .update(schema.mengantarDispatchQueue)
        .set({ status: "processing", attempts: currentAttempts, updatedAt: new Date().toISOString() })
        .where(and(
          eq(schema.mengantarDispatchQueue.id, job.id),
          eq(schema.mengantarDispatchQueue.tenantId, job.tenantId),
          eq(schema.mengantarDispatchQueue.status, "pending")
        ))
        .returning();
      if (!claimed) return;
      claimedJobs += 1;

      try {
        const [[order], itemWeights] = await Promise.all([
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

        let cnoteNo = "";
        if (process.env.NODE_ENV === "test" || process.env.MENGANTAR_MOCK === "true") {
          cnoteNo = `MNTR_TEST_${Date.now().toString().slice(-8)}`;
        } else {
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
              cod_value: order.paymentMethod === "COD" ? toIntegerRupiah(order.totalMinor) : 0,
              weight,
              origin_area_id: MENGANTAR_ORIGIN_AREA_ID,
              pickup_address_id: MENGANTAR_PICKUP_ADDRESS_ID,
            }]),
          });
          if (!response.ok) throw new Error(`Mengantar dispatch failed: HTTP ${response.status}`);

          const payload = await readMengantarResponse(response);
          const dispatchedOrder = providerArray(payload)[0] ?? asProviderObject(asProviderObject(payload)?.data);
          cnoteNo = dispatchedOrder
            ? providerString(dispatchedOrder, "cnote_no", "cnoteNo", "waybill_number")
            : "";

          if (!cnoteNo) throw new Error("Mengantar API did not return a valid cnote_no waybill number");
        }

        await db.transaction(async (tx) => {
          const [updatedOrder] = await tx.update(schema.orders).set({
            status: "SHIPPED", fulfillmentStatus: "PICKUP_REQUESTED", cnoteNo,
            updatedAt: new Date().toISOString(),
          }).where(and(
            eq(schema.orders.id, job.orderId), eq(schema.orders.tenantId, job.tenantId),
            inArray(schema.orders.status, ["CONFIRMED", "PROCESSING"]),
            eq(schema.orders.fulfillmentStatus, "UNFULFILLED"), isNull(schema.orders.cnoteNo)
          )).returning();
          if (!updatedOrder) throw new Error("Order lifecycle changed before dispatch completion");
          await tx.update(schema.mengantarDispatchQueue).set({
            status: "completed", lastError: null, nextRetryAt: null, updatedAt: new Date().toISOString(),
          }).where(and(eq(schema.mengantarDispatchQueue.id, job.id), eq(schema.mengantarDispatchQueue.tenantId, job.tenantId)));
          await tx.insert(schema.orderEvents).values({
            tenantId: job.tenantId, orderId: job.orderId, event: "DISPATCH_COMPLETED", actor: WORKER_EMAIL,
            metadataJson: { dispatchQueueId: job.id },
          });
          await tx.insert(schema.auditLogs).values({
            tenantId: job.tenantId, actorId: WORKER_ID, actorEmail: WORKER_EMAIL, actorRole: "SYSTEM_WORKER",
            action: "order.dispatch_completed", targetType: "order", targetId: job.orderId,
            metadataJson: {
              dispatchQueueId: job.id, attempts: currentAttempts,
              before: { status: order.status, paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus },
              after: { status: updatedOrder.status, paymentStatus: updatedOrder.paymentStatus, fulfillmentStatus: updatedOrder.fulfillmentStatus },
            },
          });
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const exhausted = currentAttempts >= 3;
        const nextRetryAt = exhausted
          ? null
          : new Date(Date.now() + Math.pow(2, currentAttempts) * 5_000).toISOString();

        await db.transaction(async (tx) => {
          await tx.update(schema.mengantarDispatchQueue).set({
            status: exhausted ? "dlq" : "pending", attempts: currentAttempts,
            lastError: message.slice(0, 2_000), nextRetryAt, updatedAt: new Date().toISOString(),
          }).where(and(eq(schema.mengantarDispatchQueue.id, job.id), eq(schema.mengantarDispatchQueue.tenantId, job.tenantId)));
          await tx.insert(schema.orderEvents).values({
            tenantId: job.tenantId, orderId: job.orderId,
            event: exhausted ? "DISPATCH_FAILED" : "DISPATCH_RETRY_SCHEDULED", actor: WORKER_EMAIL,
            metadataJson: { dispatchQueueId: job.id, attempts: currentAttempts },
          });
          await tx.insert(schema.auditLogs).values({
            tenantId: job.tenantId, actorId: WORKER_ID, actorEmail: WORKER_EMAIL, actorRole: "SYSTEM_WORKER",
            action: exhausted ? "order.dispatch_failed" : "order.dispatch_retry_scheduled",
            targetType: "order", targetId: job.orderId,
            metadataJson: { dispatchQueueId: job.id, attempts: currentAttempts },
          });
        });
      }
    });
  }

  return claimedJobs;
}
