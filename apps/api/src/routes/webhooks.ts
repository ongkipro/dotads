import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  resolveAutoLarisPaymentTenant,
  resolveOrderTenantByWaybill,
  withDatabaseContext,
  type DatabaseSessionContext,
} from "@dotads/db";
import {
  enqueuePurchaseEvents,
  reconcileMengantarStatus,
  reconcilePaymentStatus,
  verifyAutoLarisSignature,
} from "@dotads/integrations";

export const webhooksRouter = new OpenAPIHono();

const ErrorSchema = z.object({ error: z.string().max(255) }).strict();
const SuccessSchema = z.object({ status: z.literal("success") }).strict();
const TrackingEntrySchema = z.object({
  status: z.string().trim().min(1).max(50),
  timestamp: z.string().trim().min(1).max(64).optional(),
  description: z.string().trim().min(1).max(500).optional(),
}).strict();
const MengantarWebhookSchema = z.object({
  waybill_number: z.string().trim().min(1).max(100),
  status: z.enum(["ON_PROCESS", "IN_TRANSIT", "DELIVERED", "RETURNED", "FAILED"]),
  tracking_history: z.array(TrackingEntrySchema).max(20).optional(),
}).strict();
const AutoLarisWebhookSchema = z.object({
  transaction_id: z.string().trim().min(1).max(255),
  order_id: z.string().uuid(),
  status: z.enum(["PAID", "SUCCESS", "EXPIRED", "FAILED"]),
  amount: z.number().int().nonnegative().max(2_147_483_647),
}).strict();

function webhookDatabaseContext(tenantId: string, provider: string): DatabaseSessionContext {
  return {
    userId: `webhook:${provider}`,
    userEmail: `${provider}@webhook.dotads.invalid`,
    tenantId,
    organizationId: "",
    role: "END_BUYER",
    tenantName: "",
    tenantStatus: "active",
  };
}

function parseSignedJson<T>(rawBody: string, schema: z.ZodType<T>): T | null {
  try {
    const parsed: unknown = JSON.parse(rawBody);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

webhooksRouter.use("/mengantar", async (c, next) => {
  const secret = process.env.MENGANTAR_WEBHOOK_SECRET;
  if (!secret) return c.json({ error: "Mengantar webhook verification is not configured" }, 503);
  const signature = c.req.header("x-mengantar-signature");
  const rawBody = await c.req.text();
  if (!signature || !verifyAutoLarisSignature(rawBody, signature, secret)) {
    return c.json({ error: "Invalid or missing HMAC signature" }, 401);
  }
  return next();
});

webhooksRouter.use("/autolaris", async (c, next) => {
  const secret = process.env.AUTOLARIS_SECRET;
  if (!secret) return c.json({ error: "Payment webhook verification is not configured" }, 503);
  const signature = c.req.header("x-autolaris-signature") || c.req.header("x-signature");
  const rawBody = await c.req.text();
  if (!signature || !verifyAutoLarisSignature(rawBody, signature, secret)) {
    return c.json({ error: "Invalid or missing HMAC signature" }, 401);
  }
  return next();
});

webhooksRouter.openapi(
  createRoute({
    method: "post",
    path: "/mengantar",
    summary: "Process a signed, bounded Mengantar fulfillment callback",
    request: { body: { required: true, content: { "application/json": { schema: MengantarWebhookSchema } } } },
    responses: {
      200: { description: "Callback accepted idempotently", content: { "application/json": { schema: SuccessSchema } } },
      400: { description: "Invalid callback payload", content: { "application/json": { schema: ErrorSchema } } },
      401: { description: "Invalid or missing signature", content: { "application/json": { schema: ErrorSchema } } },
      404: { description: "Waybill not uniquely bound to an order", content: { "application/json": { schema: ErrorSchema } } },
      503: { description: "Webhook verification is not configured", content: { "application/json": { schema: ErrorSchema } } },
    },
  }),
  async (c) => {
    const rawBody = await c.req.text();
    const body = parseSignedJson(rawBody, MengantarWebhookSchema);
    if (!body) return c.json({ error: "Invalid callback payload" }, 400);

    const tenantId = await resolveOrderTenantByWaybill(body.waybill_number);
    if (!tenantId) return c.json({ error: "Waybill not found" }, 404);
    const latest = body.tracking_history?.at(-1);
    const result = await withDatabaseContext(webhookDatabaseContext(tenantId, "mengantar"), async () => {
      const reconciled = await reconcileMengantarStatus({
        tenantId,
        waybillNumber: body.waybill_number,
        status: body.status,
        trackingSummary: {
          count: body.tracking_history?.length ?? 0,
          ...(latest?.status ? { latestStatus: latest.status } : {}),
          ...(latest?.timestamp ? { latestTimestamp: latest.timestamp } : {}),
          ...(latest?.description ? { latestDescription: latest.description } : {}),
        },
      });
      if (reconciled.purchaseEligible && reconciled.orderId) {
        await enqueuePurchaseEvents(reconciled.orderId);
      }
      return reconciled;
    });
    if (result.outcome === "not_found") return c.json({ error: "Waybill not found" }, 404);
    return c.json({ status: "success" as const }, 200);
  }
);

webhooksRouter.openapi(
  createRoute({
    method: "post",
    path: "/autolaris",
    summary: "Process a signed, financially bound AutoLaris callback",
    request: { body: { required: true, content: { "application/json": { schema: AutoLarisWebhookSchema } } } },
    responses: {
      200: { description: "Callback accepted idempotently", content: { "application/json": { schema: SuccessSchema } } },
      400: { description: "Invalid callback payload", content: { "application/json": { schema: ErrorSchema } } },
      401: { description: "Invalid or missing signature", content: { "application/json": { schema: ErrorSchema } } },
      404: { description: "Bound payment transaction not found", content: { "application/json": { schema: ErrorSchema } } },
      409: { description: "Order is terminal and cannot be revived", content: { "application/json": { schema: ErrorSchema } } },
      503: { description: "Webhook verification is not configured", content: { "application/json": { schema: ErrorSchema } } },
    },
  }),
  async (c) => {
    const rawBody = await c.req.text();
    const body = parseSignedJson(rawBody, AutoLarisWebhookSchema);
    if (!body) return c.json({ error: "Invalid callback payload" }, 400);

    const tenantId = await resolveAutoLarisPaymentTenant(body.transaction_id, body.order_id, body.amount);
    if (!tenantId) return c.json({ error: "Payment transaction not found" }, 404);
    const result = await withDatabaseContext(webhookDatabaseContext(tenantId, "autolaris"), () =>
      reconcilePaymentStatus({
        tenantId,
        transactionId: body.transaction_id,
        orderId: body.order_id,
        amountMinor: body.amount,
        status: body.status,
      })
    );
    if (result.outcome === "not_found") return c.json({ error: "Payment transaction not found" }, 404);
    if (result.outcome === "conflict") return c.json({ error: "Order is terminal" }, 409);
    return c.json({ status: "success" as const }, 200);
  }
);
