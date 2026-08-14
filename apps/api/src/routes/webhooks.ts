import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db, schema } from "@dotads/db";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { reconcilePaymentStatus, verifyAutoLarisSignature } from "@dotads/integrations";

export const webhooksRouter = new OpenAPIHono();

// Mengantar Logistics Tracking & Status Callback
webhooksRouter.openapi(
  createRoute({
    method: "post",
    path: "/mengantar",
    summary: "Mengantar Logistics Status Webhook Callback",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              waybill_number: z.string(),
              status: z.string(),
              tracking_history: z.array(z.record(z.unknown())).optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Webhook processed",
        content: {
          "application/json": {
            schema: z.object({ status: z.string() }),
          },
        },
      },
      400: {
        description: "Missing parameters",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
    },
  }),
  async (c) => {
    const body = await c.req.json();
    const { waybill_number, status, tracking_history } = body;

    if (!waybill_number || !status) {
      return c.json({ error: "Missing waybill_number or status" }, 400);
    }

    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.cnoteNo, waybill_number));

    if (order) {
      const nextFulfillmentStatus =
        status === "DELIVERED"
          ? "DELIVERED"
          : status === "ON_PROCESS" || status === "IN_TRANSIT"
          ? "IN_TRANSIT"
          : "PROCESSING";

      await db
        .update(schema.orders)
        .set({
          fulfillmentStatus: nextFulfillmentStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.orders.id, order.id));

      await db.insert(schema.orderEvents).values({
        tenantId: order.tenantId,
        orderId: order.id,
        event: `COURIER_${status}`,
        actor: "SYSTEM_MENGANTAR_WEBHOOK",
        metadataJson: { waybill_number, tracking_history: tracking_history || [] },
      });
    }

    return c.json({ status: "success" }, 200);
  }
);

// AutoLaris Payment Callback H2H Endpoint
webhooksRouter.openapi(
  createRoute({
    method: "post",
    path: "/autolaris",
    summary: "AutoLaris H2H Payment Callback Webhook",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              transaction_id: z.string().optional(),
              order_id: z.string(),
              status: z.string(),
              amount: z.number().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Payment callback processed idempotently",
        content: {
          "application/json": {
            schema: z.object({ status: z.string() }),
          },
        },
      },
      400: {
        description: "Invalid HMAC signature or payload",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
      404: {
        description: "Order not found",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
      401: {
        description: "Unauthorized: Invalid or missing HMAC signature",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
    },
  }),
  async (c) => {
    const rawBodyText = await c.req.text();
    const signatureHeader = c.req.header("x-autolaris-signature") || c.req.header("x-signature");

    if (!signatureHeader) {
      return c.json({ error: "Unauthorized: Missing HMAC signature header" }, 401);
    }

    let body: any;
    try {
      body = JSON.parse(rawBodyText);
    } catch {
      return c.json({ error: "Invalid JSON payload" }, 400);
    }

    const { transaction_id, order_id, status, amount } = body;

    if (!order_id || !status) {
      return c.json({ error: "Missing required callback parameters" }, 400);
    }

    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, order_id));

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    if (amount && Number(amount) !== order.totalMinor) {
      console.warn(`[AutoLaris Webhook] Amount mismatch for order ${order.id}: expected ${order.totalMinor}, got ${amount}`);
      return c.json({ error: "Financial payload mismatch" }, 400);
    }

    // Verify HMAC Signature against tenant's AutoLaris API Secret
    const [config] = await db
      .select()
      .from(schema.autolarisConfigs)
      .where(eq(schema.autolarisConfigs.tenantId, order.tenantId));

    const secret = config?.apiSecret || process.env.AUTOLARIS_SECRET;
    if (!secret) {
      return c.json({ error: "Tenant payment secret not configured" }, 500);
    }

    const isValidSignature = verifyAutoLarisSignature(rawBodyText, signatureHeader, secret);
    if (!isValidSignature) {
      return c.json({ error: "Invalid HMAC signature" }, 401);
    }

    // Reconcile payment status idempotently
    await reconcilePaymentStatus(transaction_id || `tx_${order.id}`, status);

    return c.json({ status: "success" }, 200);
  }
);
