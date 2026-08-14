import { createHash } from "node:crypto";
import { db, schema } from "@dotads/db";
import { eq, and, lte } from "drizzle-orm";

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

export async function createOrderWithFanout(orderInput: any, riskScore: number) {
  const orderNumber = `ORD_${Date.now().toString().slice(-6)}`;
  const totalMinor = orderInput.subtotalMinor + orderInput.shippingCostMinor - (orderInput.discountMinor || 0);

  const [order] = await db
    .insert(schema.orders)
    .values({
      tenantId: orderInput.tenantId,
      orderNumber,
      customerName: orderInput.customerName,
      customerPhone: orderInput.customerPhone,
      customerEmail: orderInput.customerEmail || "",
      shippingAddress: orderInput.shippingAddress,
      subdistrictId: orderInput.subdistrictId,
      subdistrictName: orderInput.subdistrictName || "",
      cityName: orderInput.cityName || "",
      provinceName: orderInput.provinceName || "",
      paymentMethod: orderInput.paymentMethod,
      subtotalMinor: orderInput.subtotalMinor,
      shippingCostMinor: orderInput.shippingCostMinor,
      totalMinor,
      rtsRiskScore: riskScore,
      courierCode: orderInput.courierCode || "JNE",
      attributionJson: orderInput.attribution || {},
    })
    .returning();

  for (const item of orderInput.items || []) {
    const itemPrice = typeof item.priceMinor === "number" ? item.priceMinor : (orderInput.subtotalMinor || 299000);
    const itemQuantity = typeof item.quantity === "number" ? item.quantity : 1;
    const itemSubtotal = itemPrice * itemQuantity;

    await db.insert(schema.orderItems).values({
      tenantId: orderInput.tenantId,
      orderId: order.id,
      productId: item.productId,
      productName: item.productName || "Alpha Premium Gadget",
      priceMinor: itemPrice,
      quantity: itemQuantity,
      subtotalMinor: itemSubtotal,
    });
  }

  const eventId = `purchase_${order.id}`;
  const pii = normalizeAndHashPii({
    ph: [orderInput.customerPhone],
    em: orderInput.customerEmail ? [orderInput.customerEmail] : [],
    fn: [orderInput.customerName],
  });

  const attribution = orderInput.attribution || {};
  const metaUserData: Record<string, any> = {
    ...pii,
    client_ip_address: orderInput.clientIp || "127.0.0.1",
    client_user_agent: orderInput.userAgent || "Mozilla/5.0",
  };
  if (attribution.fbp || attribution._fbp) metaUserData.fbp = attribution.fbp || attribution._fbp;
  if (attribution.fbc || attribution._fbc) metaUserData.fbc = attribution.fbc || attribution._fbc;

  const payload = {
    event_name: "Purchase",
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    user_data: metaUserData,
    custom_data: {
      currency: "IDR",
      value: totalMinor / 100, // Value in IDR major units
      order_id: order.id,
      order_number: order.orderNumber,
      attribution: {
        gclid: attribution.gclid,
        wbraid: attribution.wbraid,
        gbraid: attribution.gbraid,
        ttclid: attribution.ttclid,
      },
    },
  };
  await db.insert(schema.outboxEvents).values([
    {
      tenantId: orderInput.tenantId,
      platform: "meta",
      destinationId: "pixel_default",
      eventId,
      eventName: "Purchase",
      payloadJson: payload,
    },
    {
      tenantId: orderInput.tenantId,
      platform: "google",
      destinationId: "g_default",
      eventId,
      eventName: "Purchase",
      payloadJson: payload,
    },
    {
      tenantId: orderInput.tenantId,
      platform: "tiktok",
      destinationId: "tt_default",
      eventId,
      eventName: "Purchase",
      payloadJson: payload,
    },
  ]);

  if (orderInput.paymentMethod === "COD") {
    await db.insert(schema.mengantarDispatchQueue).values({
      tenantId: orderInput.tenantId,
      orderId: order.id,
    });
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
  };
}

export async function processOutboxEvents() {
  const pendingEvents = await db
    .select()
    .from(schema.outboxEvents)
    .where(
      and(
        eq(schema.outboxEvents.status, "pending"),
        lte(schema.outboxEvents.retryCount, 5)
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

      await db
        .update(schema.outboxEvents)
        .set({ status: "sent", updatedAt: new Date().toISOString() })
        .where(eq(schema.outboxEvents.id, event.id));

      processedCount++;
    } catch (err: any) {
      await db
        .update(schema.outboxEvents)
        .set({
          status: "failed",
          retryCount: event.retryCount + 1,
          lastError: err.message,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.outboxEvents.id, event.id));
    }
  }

  return processedCount;
}
