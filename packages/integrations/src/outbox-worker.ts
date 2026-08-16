import { createHash, randomUUID } from "node:crypto";
import { db, schema } from "@dotads/db";
import { asc, eq, and, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { fetchMengantarShippingRates } from "./mengantar.ts";
import { evaluateReceiverRisk } from "./receiver-risk.ts";

export function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function normalizeIndonesianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return `62${digits}`;
}

export function normalizeAndHashPii(userData: { ph?: string[]; em?: string[]; fn?: string[] }) {
  return {
    ph: userData.ph?.map((p) => sha256(normalizeIndonesianPhone(p))) || [],
    em: userData.em?.map((e) => sha256(e)) || [],
    fn: userData.fn?.map((f) => sha256(f)) || [],
  };
}

interface PublicOrderInput {
  tenantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  subdistrictId: string;
  subdistrictName?: string;
  cityName?: string;
  provinceName?: string;
  paymentMethod: string;
  courierCode?: string;
  attribution?: Record<string, string | undefined>;
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
}

export interface PublicOrderIdempotency {
  key: string;
  requestHash: string;
  requestPath: string;
  expiresAt: string;
}

export class IdempotencyConflictError extends Error {}

export function hashPublicOrderRequest(input: PublicOrderInput & { turnstileToken?: string }): string {
  const { turnstileToken: _ignored, ...business } = input;
  const canonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonicalize(item)]));
    }
    return value;
  };
  return createHash("sha256").update(JSON.stringify(canonicalize(business))).digest("hex");
}

export async function readPublicOrderIdempotency(tenantId: string, key: string, requestHash: string, requestPath: string) {
  const [existing] = await db.select().from(schema.idempotencyKeys).where(and(
    eq(schema.idempotencyKeys.tenantId, tenantId), eq(schema.idempotencyKeys.key, key),
  )).limit(1);
  if (!existing) return { kind: "absent" as const };
  if (existing.requestHash !== requestHash || existing.requestPath !== requestPath) {
    throw new IdempotencyConflictError("Idempotency key was already used for a different request");
  }
  if (new Date(existing.expiresAt).getTime() <= Date.now()) {
    throw new IdempotencyConflictError("Idempotency key has expired; submit with a new key");
  }
  if (existing.responseCode && existing.responseJson) {
    return { kind: "response" as const, responseCode: existing.responseCode as 201 | 202, response: existing.responseJson };
  }
  if (existing.state === "ORDER_CREATED" && existing.orderId) {
    const [order] = await db.select({ orderId: schema.orders.id, orderNumber: schema.orders.orderNumber, totalMinor: schema.orders.totalMinor })
      .from(schema.orders).where(and(eq(schema.orders.tenantId, tenantId), eq(schema.orders.id, existing.orderId))).limit(1);
    if (order) return { kind: "resume" as const, ...order };
  }
  throw new IdempotencyConflictError("Idempotency request is still being processed");
}

interface ResolvedOrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantTitle?: string;
  sku?: string;
  priceMinor: number;
  quantity: number;
  weightGrams: number;
}

export function createOrderNumber(now = Date.now(), id = randomUUID()): string {
  return `ORD_${now.toString(36).toUpperCase()}_${id.slice(0, 8).toUpperCase()}`;
}

export async function createOrderWithFanout(orderInput: PublicOrderInput, idempotency?: PublicOrderIdempotency) {
  const resolvedItems: ResolvedOrderItem[] = [];

  for (const requestedItem of orderInput.items) {
    const [product] = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, requestedItem.productId), eq(schema.products.tenantId, orderInput.tenantId)))
      .limit(1);

    if (!product || product.status.toLowerCase() !== "active") {
      throw new Error("Product is unavailable for this store");
    }

    const variantFilters = [
      eq(schema.productVariants.productId, product.id),
      eq(schema.productVariants.tenantId, orderInput.tenantId),
    ];
    if (requestedItem.variantId) {
      variantFilters.push(eq(schema.productVariants.id, requestedItem.variantId));
    }
    const [variant] = await db
      .select()
      .from(schema.productVariants)
      .where(and(...variantFilters))
      .orderBy(asc(schema.productVariants.createdAt), asc(schema.productVariants.id))
      .limit(1);

    if (!variant || variant.stockQuantity < requestedItem.quantity) {
      throw new Error("Selected product variant is unavailable or out of stock");
    }

    resolvedItems.push({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantTitle: variant.title,
      sku: variant.sku ?? undefined,
      priceMinor: variant.priceMinor,
      quantity: requestedItem.quantity,
      weightGrams: variant.weightGrams,
    });
  }

  const weightGrams = resolvedItems.reduce((sum, item) => sum + item.weightGrams * item.quantity, 0);
  const rates = await fetchMengantarShippingRates({
    tenantId: orderInput.tenantId,
    subdistrictId: orderInput.subdistrictId,
    weightGrams,
    courierCode: orderInput.courierCode,
  });
  const eligibleRates = orderInput.paymentMethod === "COD" ? rates.filter((rate) => rate.codAvailable) : rates;
  const selectedRate = eligibleRates.sort((a, b) => a.costMinor - b.costMinor)[0];
  if (!selectedRate) {
    throw new Error("No eligible shipping service is available for this order");
  }

  const subtotalMinor = resolvedItems.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0);
  const shippingCostMinor = selectedRate.costMinor;
  const totalMinor = subtotalMinor + shippingCostMinor;
  const riskScore = evaluateReceiverRisk({
    customerPhone: orderInput.customerPhone,
    shippingAddress: orderInput.shippingAddress,
    subdistrictId: orderInput.subdistrictId,
    orderTotalMinor: totalMinor,
  }).score;
  const orderNumber = createOrderNumber();

  return db.transaction(async (tx) => {
    if (idempotency) {
      const [claimed] = await tx.insert(schema.idempotencyKeys).values({
        tenantId: orderInput.tenantId,
        key: idempotency.key,
        requestPath: idempotency.requestPath,
        requestHash: idempotency.requestHash,
        state: "CLAIMED",
        expiresAt: idempotency.expiresAt,
      }).onConflictDoNothing().returning({ id: schema.idempotencyKeys.id });
      if (!claimed) {
        const [existing] = await tx.select().from(schema.idempotencyKeys).where(and(
          eq(schema.idempotencyKeys.tenantId, orderInput.tenantId),
          eq(schema.idempotencyKeys.key, idempotency.key),
        )).limit(1).for("update");
        if (!existing || existing.requestHash !== idempotency.requestHash || existing.requestPath !== idempotency.requestPath) {
          throw new IdempotencyConflictError("Idempotency key was already used for a different request");
        }
        if (new Date(existing.expiresAt).getTime() <= Date.now()) {
          throw new IdempotencyConflictError("Idempotency key has expired; submit with a new key");
        }
        if (existing.responseCode && existing.responseJson) {
          return { replay: true as const, responseCode: existing.responseCode as 201 | 202, response: existing.responseJson };
        }
        if (existing.orderId) {
          const [existingOrder] = await tx.select({
            orderId: schema.orders.id,
            orderNumber: schema.orders.orderNumber,
            totalMinor: schema.orders.totalMinor,
            riskScore: schema.orders.rtsRiskScore,
          }).from(schema.orders).where(and(
            eq(schema.orders.id, existing.orderId),
            eq(schema.orders.tenantId, orderInput.tenantId),
          )).limit(1);
          if (existingOrder) return { ...existingOrder, replay: true as const, state: existing.state };
        }
        throw new IdempotencyConflictError("Idempotency request is still being processed");
      }
    }
    const [activeTenant] = await tx
      .select({ id: schema.tenants.id })
      .from(schema.tenants)
      .where(and(eq(schema.tenants.id, orderInput.tenantId), eq(schema.tenants.status, "active")))
      .limit(1)
      .for("share");
    if (!activeTenant) throw new Error("Storefront is unavailable");

    const productIds = [...new Set(resolvedItems.map((item) => item.productId))].sort();
    const variantIds = [...new Set(resolvedItems.map((item) => item.variantId))].sort();

    // Catalog mutations use the same product -> variant lock order. Sorting also
    // prevents two multi-product checkouts from deadlocking each other.
    const lockedProducts = await tx.select({
      id: schema.products.id,
      status: schema.products.status,
      priceMinor: schema.products.priceMinor,
      weightGrams: schema.products.weightGrams,
    }).from(schema.products).where(and(
      eq(schema.products.tenantId, orderInput.tenantId),
      inArray(schema.products.id, productIds)
    )).orderBy(schema.products.id).for("update");
    const lockedProductById = new Map(lockedProducts.map((product) => [product.id, product]));
    let lockedVariantById = new Map<string, {
      id: string;
      productId: string;
      priceMinor: number;
      weightGrams: number;
    }>();
    const lockedVariants = await tx.select({
      id: schema.productVariants.id,
      productId: schema.productVariants.productId,
      priceMinor: schema.productVariants.priceMinor,
      weightGrams: schema.productVariants.weightGrams,
    }).from(schema.productVariants).where(and(
      eq(schema.productVariants.tenantId, orderInput.tenantId),
      inArray(schema.productVariants.id, variantIds)
    )).orderBy(schema.productVariants.id).for("update");
    lockedVariantById = new Map(lockedVariants.map((variant) => [variant.id, variant]));

    for (const item of resolvedItems) {
      const lockedProduct = lockedProductById.get(item.productId);
      if (!lockedProduct || lockedProduct.status.toLowerCase() !== "active") {
        throw new Error("Product changed during checkout; retry with current catalog data");
      }
      const lockedVariant = lockedVariantById.get(item.variantId);
      if (!lockedVariant || lockedVariant.productId !== item.productId ||
          lockedVariant.priceMinor !== item.priceMinor || lockedVariant.weightGrams !== item.weightGrams) {
        throw new Error("Product variant changed during checkout; retry with current catalog data");
      }
    }

    for (const item of resolvedItems) {
      const [updatedVariant] = await tx
        .update(schema.productVariants)
        .set({
          stockQuantity: sql`${schema.productVariants.stockQuantity} - ${item.quantity}`,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(schema.productVariants.id, item.variantId),
            eq(schema.productVariants.tenantId, orderInput.tenantId),
            gte(schema.productVariants.stockQuantity, item.quantity)
          )
        )
        .returning();

      if (!updatedVariant) throw new Error("Selected product variant went out of stock");
    }

    const [order] = await tx
      .insert(schema.orders)
      .values({
        tenantId: orderInput.tenantId,
        orderNumber,
        status: orderInput.paymentMethod === "COD" ? "CONFIRMED" : "PENDING_PAYMENT",
        customerName: orderInput.customerName,
        customerPhone: orderInput.customerPhone,
        customerEmail: orderInput.customerEmail || "",
        shippingAddress: orderInput.shippingAddress,
        subdistrictId: orderInput.subdistrictId,
        subdistrictName: orderInput.subdistrictName || "",
        cityName: orderInput.cityName || "",
        provinceName: orderInput.provinceName || "",
        paymentMethod: orderInput.paymentMethod,
        subtotalMinor,
        shippingCostMinor,
        discountMinor: 0,
        totalMinor,
        rtsRiskScore: riskScore,
        courierCode: selectedRate.courierCode,
        courierService: selectedRate.serviceName,
        attributionJson: orderInput.attribution || {},
      })
      .returning();

    await tx.insert(schema.orderItems).values(
      resolvedItems.map((item) => ({
        tenantId: orderInput.tenantId,
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantTitle: item.variantTitle,
        sku: item.sku,
        priceMinor: item.priceMinor,
        quantity: item.quantity,
        subtotalMinor: item.priceMinor * item.quantity,
      }))
    );

    if (orderInput.paymentMethod === "COD") {
      await tx.insert(schema.mengantarDispatchQueue).values({
        tenantId: orderInput.tenantId,
        orderId: order.id,
      });
    }
    const response = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: "PENDING" as const,
      paymentMethod: orderInput.paymentMethod,
      totalMinor,
    };
    if (idempotency) {
      await tx.update(schema.idempotencyKeys).set({
        orderId: order.id,
        state: orderInput.paymentMethod === "COD" ? "COMPLETED" : "ORDER_CREATED",
        responseCode: orderInput.paymentMethod === "COD" ? 201 : null,
        responseJson: orderInput.paymentMethod === "COD" ? response : null,
      }).where(and(
        eq(schema.idempotencyKeys.tenantId, orderInput.tenantId),
        eq(schema.idempotencyKeys.key, idempotency.key),
      ));
    }

    return orderInput.paymentMethod === "COD"
      ? { orderId: order.id, orderNumber: order.orderNumber, totalMinor, riskScore, responseCode: 201 as const, response }
      : { orderId: order.id, orderNumber: order.orderNumber, totalMinor, riskScore, state: "ORDER_CREATED" };
  });
}

export async function enqueuePurchaseEvents(orderId: string): Promise<number> {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!order) throw new Error("Cannot enqueue purchase event for an unknown order");

  const [config] = await db
    .select()
    .from(schema.trackingConfigs)
    .where(eq(schema.trackingConfigs.tenantId, order.tenantId))
    .limit(1);
  if (!config) return 0;

  const attribution = (order.attributionJson ?? {}) as Record<string, string | undefined>;
  const eventId = `evt_purchase_${order.id}`;
  const pii = normalizeAndHashPii({
    ph: [order.customerPhone],
    em: order.customerEmail ? [order.customerEmail] : [],
    fn: [order.customerName],
  });
  const rows: typeof schema.outboxEvents.$inferInsert[] = [];

  if (config.metaEnabled && config.metaPixelId && config.metaCapiToken) {
    rows.push({
      tenantId: order.tenantId,
      platform: "meta",
      destinationId: config.metaPixelId,
      eventId,
      eventName: "Purchase",
      payloadJson: {
        event_name: "Purchase",
        event_id: eventId,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        user_data: {
          ...pii,
          ...(attribution.fbp ? { fbp: attribution.fbp } : {}),
          ...(attribution.fbc ? { fbc: attribution.fbc } : {}),
        },
        custom_data: {
          currency: "IDR",
          value: order.totalMinor,
          order_id: order.id,
          order_number: order.orderNumber,
        },
      },
    });
  }

  if (
    config.googleEnabled &&
    config.googleAdsConversionId &&
    config.googleAdsConversionLabel
  ) {
    rows.push({
      tenantId: order.tenantId,
      platform: "google",
      destinationId: `${config.googleAdsConversionId}/${config.googleAdsConversionLabel}`,
      eventId,
      eventName: "Purchase",
      payloadJson: {
        conversion_date_time: new Date().toISOString(),
        conversion_value: order.totalMinor,
        currency_code: "IDR",
        order_id: order.id,
        user_identifiers: pii,
        gclid: attribution.gclid,
        gbraid: attribution.gbraid,
        wbraid: attribution.wbraid,
      },
    });
  }

  if (config.tiktokEnabled && config.tiktokPixelId && config.tiktokAccessToken) {
    rows.push({
      tenantId: order.tenantId,
      platform: "tiktok",
      destinationId: config.tiktokPixelId,
      eventId,
      eventName: "CompletePayment",
      payloadJson: {
        event: "CompletePayment",
        event_id: eventId,
        timestamp: Math.floor(Date.now() / 1000),
        context: {
          user: {
            phone_number: pii.ph[0],
            email: pii.em[0],
            ttclid: attribution.ttclid,
          },
        },
        properties: { currency: "IDR", value: order.totalMinor },
      },
    });
  }

  if (rows.length === 0) return 0;
  await db.insert(schema.outboxEvents).values(rows).onConflictDoNothing();
  return rows.length;
}

export async function processOutboxEvents() {
  const pendingEvents = await db
    .select()
    .from(schema.outboxEvents)
    .where(
      and(
        eq(schema.outboxEvents.status, "pending"),
        lte(schema.outboxEvents.retryCount, 5),
        or(
          isNull(schema.outboxEvents.nextRetryAt),
          lte(schema.outboxEvents.nextRetryAt, new Date().toISOString())
        )
      )
    )
    .limit(20);

  let processedCount = 0;

  for (const event of pendingEvents) {
    try {
      await db
        .update(schema.outboxEvents)
        .set({ status: "processing" })
        .where(eq(schema.outboxEvents.id, event.id));

      // Do not report delivery until a provider-specific HTTP adapter has
      // acknowledged the event. Silent "sent" transitions lose ad signals.
      throw new Error(`No ${event.platform} delivery adapter is configured`);
    } catch (err: unknown) {
      const retryCount = event.retryCount + 1;
      const exhausted = retryCount >= event.maxAttempts;
      await db
        .update(schema.outboxEvents)
        .set({
          status: exhausted ? "failed" : "pending",
          retryCount,
          lastError: err instanceof Error ? err.message : String(err),
          nextRetryAt: exhausted
            ? null
            : new Date(Date.now() + Math.min(60, 2 ** retryCount) * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.outboxEvents.id, event.id));
    }
  }

  return processedCount;
}
