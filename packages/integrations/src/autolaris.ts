import { createHmac, timingSafeEqual } from "node:crypto";
import { db, schema } from "@dotads/db";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { enqueuePurchaseEvents } from "./outbox-worker.ts";

export const AUTOLARIS_PRODUCTION_ENDPOINT = "https://api-h2h.autolaris.com";

const AUTOLARIS_PAYMENT_PATH = "/payment/create";

type AutoLarisObject = Record<string, unknown>;

function asAutoLarisObject(value: unknown): AutoLarisObject | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as AutoLarisObject
    : null;
}

function firstString(object: AutoLarisObject, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

export function formatLiveQrisPayload(payload: string): string {
  const trimmed = payload.trim();
  if (!trimmed) throw new Error("AutoLaris returned an empty QRIS payload");
  if (/^(?:https:\/\/|data:image\/)/i.test(trimmed)) return trimmed;

  const compact = trimmed.replace(/\s+/g, "");
  if (compact.startsWith("000201")) return compact;
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) {
    return `data:image/png;base64,${compact}`;
  }

  throw new Error("AutoLaris returned an unsupported QRIS payload format");
}

function autoLarisData(payload: unknown): AutoLarisObject {
  const root = asAutoLarisObject(payload);
  if (!root) throw new Error("AutoLaris returned an invalid response");

  const responseCode = firstString(root, "rc", "response_code", "code");
  if (responseCode && !["00", "0000", "200", "201"].includes(responseCode)) {
    throw new Error(`AutoLaris request failed: ${firstString(root, "ket", "message") ?? responseCode}`);
  }

  return asAutoLarisObject(root.data) ?? root;
}

export interface CreateAutoLarisSessionRequest {
  tenantId: string;
  orderId: string;
  amountMinor: number;
  paymentMethod: "QRIS" | "VA_BCA" | "VA_MANDIRI" | "VA_BRI" | "VA_BNI" | "VA_PERMATA";
  idempotencyKey: string;
  orderNumber: string;
}

export function verifyAutoLarisSignature(rawBody: string, signature: string, secretKey: string): boolean {
  if (!signature || !secretKey) return false;

  const receivedHex = signature.trim().replace(/^sha256=/i, "");
  if (!/^[a-f\d]{64}$/i.test(receivedHex)) return false;

  const expected = createHmac("sha256", secretKey).update(rawBody).digest();
  const received = Buffer.from(receivedHex, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function createAutoLarisPaymentSession(req: CreateAutoLarisSessionRequest) {
  if (!Number.isInteger(req.amountMinor) || req.amountMinor <= 0) {
    throw new Error("AutoLaris payment amount must be a positive integer");
  }

  const [config] = await db
    .select({
      merchantId: schema.autolarisConfigs.merchantId,
      apiSecret: schema.autolarisConfigs.apiSecret,
      qrisEnabled: schema.autolarisConfigs.qrisEnabled,
      vaEnabled: schema.autolarisConfigs.vaEnabled,
    })
    .from(schema.autolarisConfigs)
    .where(eq(schema.autolarisConfigs.tenantId, req.tenantId))
    .limit(1);

  const merchantId = config?.merchantId ?? process.env.AUTOLARIS_MERCHANT_ID;
  const apiSecret = config?.apiSecret ?? process.env.AUTOLARIS_SECRET;
  if (!merchantId || !apiSecret) {
    throw new Error("AutoLaris production credentials are not configured");
  }
  if (req.paymentMethod === "QRIS" && config?.qrisEnabled === false) {
    throw new Error("AutoLaris QRIS is disabled for this tenant");
  }
  if (req.paymentMethod !== "QRIS" && config?.vaEnabled === false) {
    throw new Error("AutoLaris virtual accounts are disabled for this tenant");
  }

  const requestBody = JSON.stringify({
    merchant_id: merchantId,
    reference_id: req.orderId,
    amount: req.amountMinor,
    payment_method: req.paymentMethod,
  });
  const signature = createHmac("sha256", apiSecret).update(requestBody).digest("hex");
  const processingResponse = {
    orderId: req.orderId,
    orderNumber: req.orderNumber,
    status: "PAYMENT_PROCESSING" as const,
    paymentMethod: req.paymentMethod,
    totalMinor: req.amountMinor,
  };
  const boundary = await db.transaction(async (tx) => {
    const [key] = await tx.select().from(schema.idempotencyKeys).where(and(
      eq(schema.idempotencyKeys.tenantId, req.tenantId),
      eq(schema.idempotencyKeys.key, req.idempotencyKey),
    )).limit(1).for("update");
    if (!key) throw new Error("Idempotency claim is missing");
    if (key.responseCode && key.responseJson && key.state !== "ORDER_CREATED") {
      return { callProvider: false as const, responseCode: key.responseCode as 201 | 202, response: key.responseJson };
    }
    if (key.state !== "ORDER_CREATED") {
      return { callProvider: false as const, responseCode: 202 as const, response: processingResponse };
    }
    await tx.insert(schema.paymentTransactions).values({
      tenantId: req.tenantId,
      orderId: req.orderId,
      gateway: "autolaris",
      transactionId: null,
      paymentMethod: req.paymentMethod,
      amountMinor: req.amountMinor,
      status: "PAYMENT_REQUESTING",
    }).onConflictDoNothing();
    await tx.update(schema.idempotencyKeys).set({
      state: "PAYMENT_REQUESTING",
      responseCode: 202,
      responseJson: processingResponse,
    }).where(eq(schema.idempotencyKeys.id, key.id));
    return { callProvider: true as const, responseCode: 202 as const, response: processingResponse };
  });
  if (!boundary.callProvider) return boundary;

  try {
  const response = await fetch(`${AUTOLARIS_PRODUCTION_ENDPOINT}${AUTOLARIS_PAYMENT_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "merchant-id": merchantId,
      "merchant-key": apiSecret,
      "id": req.orderId,
      "id-cst": req.tenantId,
      "sg": signature,
    },
    body: requestBody,
  });

  const payload: unknown = await response.json();
  if (!response.ok) throw new Error(`AutoLaris request failed: HTTP ${response.status}`);
  const data = autoLarisData(payload);
  const transactionId = firstString(
    data,
    "transaction_id",
    "transactionId",
    "trx_id",
    "reference_id"
  );
  if (!transactionId) throw new Error("AutoLaris did not return a transaction ID");

  let qrString: string | undefined;
  let vaNumber: string | undefined;
  if (req.paymentMethod === "QRIS") {
    const livePayload = firstString(
      data,
      "qris_payload",
      "qr_payload",
      "qr_string",
      "qr_content",
      "qris",
      "qr_url"
    );
    if (!livePayload) throw new Error("AutoLaris did not return a QRIS payload");
    qrString = formatLiveQrisPayload(livePayload);
  } else {
    vaNumber = firstString(data, "va_number", "virtual_account", "account_number");
    if (!vaNumber) throw new Error("AutoLaris did not return a virtual account number");
  }

  const successResponse = {
    orderId: req.orderId,
    orderNumber: req.orderNumber,
    status: "PENDING" as const,
    paymentMethod: req.paymentMethod,
    totalMinor: req.amountMinor,
    ...(qrString ? { qrUrl: qrString } : {}),
    ...(vaNumber ? { vaNumber } : {}),
  };
  await db.transaction(async (tx) => {
    await tx.update(schema.paymentTransactions).set({
      transactionId,
      status: "PENDING",
      qrUrl: qrString,
      vaNumber,
      bankCode: req.paymentMethod.startsWith("VA_") ? req.paymentMethod.slice(3) : undefined,
      updatedAt: new Date().toISOString(),
    }).where(and(
      eq(schema.paymentTransactions.tenantId, req.tenantId),
      eq(schema.paymentTransactions.orderId, req.orderId),
      eq(schema.paymentTransactions.gateway, "autolaris"),
      eq(schema.paymentTransactions.status, "PAYMENT_REQUESTING"),
    ));
    await tx.update(schema.idempotencyKeys).set({ state: "COMPLETED", responseCode: 201, responseJson: successResponse })
      .where(and(eq(schema.idempotencyKeys.tenantId, req.tenantId), eq(schema.idempotencyKeys.key, req.idempotencyKey)));
  });
  return { callProvider: true as const, responseCode: 201 as const, response: successResponse };
  } catch {
    await db.update(schema.idempotencyKeys).set({ state: "PAYMENT_AMBIGUOUS" }).where(and(
      eq(schema.idempotencyKeys.tenantId, req.tenantId),
      eq(schema.idempotencyKeys.key, req.idempotencyKey),
      eq(schema.idempotencyKeys.state, "PAYMENT_REQUESTING"),
    ));
    return { callProvider: true as const, responseCode: 202 as const, response: processingResponse };
  }
}

export type AutoLarisCallbackStatus = "PAID" | "SUCCESS" | "EXPIRED" | "FAILED";

export interface ReconcilePaymentInput {
  tenantId: string;
  transactionId: string;
  orderId: string;
  amountMinor: number;
  status: AutoLarisCallbackStatus;
}

export interface ReconcilePaymentResult {
  outcome: "transitioned" | "idempotent" | "stale" | "conflict" | "not_found";
  purchaseEligible: boolean;
}

export async function reconcilePaymentStatus(input: ReconcilePaymentInput): Promise<ReconcilePaymentResult> {
  const finalStatus = input.status === "PAID" ? "SUCCESS" : input.status;
  const result = await db.transaction(async (dbTx): Promise<ReconcilePaymentResult> => {
    const [payment] = await dbTx
      .select()
      .from(schema.paymentTransactions)
      .where(and(
        eq(schema.paymentTransactions.tenantId, input.tenantId),
        eq(schema.paymentTransactions.orderId, input.orderId),
        eq(schema.paymentTransactions.transactionId, input.transactionId),
        eq(schema.paymentTransactions.amountMinor, input.amountMinor),
        sql`lower(${schema.paymentTransactions.gateway}) = 'autolaris'`,
      ))
      .limit(1)
      .for("update");
    if (!payment) return { outcome: "not_found", purchaseEligible: false };

    const [order] = await dbTx
      .select()
      .from(schema.orders)
      .where(and(
        eq(schema.orders.id, input.orderId),
        eq(schema.orders.tenantId, input.tenantId),
        eq(schema.orders.totalMinor, input.amountMinor),
      ))
      .limit(1)
      .for("update");
    if (!order) return { outcome: "not_found", purchaseEligible: false };
    if (payment.status === finalStatus) return { outcome: "idempotent", purchaseEligible: false };
    if (payment.status !== "PENDING") return { outcome: "stale", purchaseEligible: false };
    if (finalStatus === "SUCCESS" && (
      ["CANCELLED", "REFUNDED"].includes(order.status) || order.paymentStatus === "REFUNDED"
    )) {
      return { outcome: "conflict", purchaseEligible: false };
    }

    const now = new Date().toISOString();
    const [updatedPayment] = await dbTx.update(schema.paymentTransactions).set({
      status: finalStatus,
      paidAt: finalStatus === "SUCCESS" ? now : null,
      updatedAt: now,
    }).where(and(
      eq(schema.paymentTransactions.id, payment.id),
      eq(schema.paymentTransactions.status, "PENDING"),
    )).returning();
    if (!updatedPayment) return { outcome: "stale", purchaseEligible: false };

    let afterOrder = order;
    if (finalStatus === "SUCCESS") {
      const [updatedOrder] = await dbTx.update(schema.orders).set({
        status: order.status === "PENDING_PAYMENT" ? "CONFIRMED" : order.status,
        paymentStatus: "PAID",
        updatedAt: now,
      }).where(and(
        eq(schema.orders.id, order.id),
        eq(schema.orders.tenantId, input.tenantId),
        notInArray(schema.orders.status, ["CANCELLED", "REFUNDED"]),
        notInArray(schema.orders.paymentStatus, ["PAID", "REFUNDED"]),
      )).returning();
      if (!updatedOrder) throw new Error("Order lifecycle changed during payment reconciliation");
      afterOrder = updatedOrder;

      if (order.paymentMethod !== "COD") {
        await dbTx.insert(schema.mengantarDispatchQueue).values({
          tenantId: input.tenantId,
          orderId: order.id,
        }).onConflictDoNothing();
      }
    } else {
      const [updatedOrder] = await dbTx.update(schema.orders).set({
        paymentStatus: "FAILED",
        updatedAt: now,
      }).where(and(
        eq(schema.orders.id, order.id),
        eq(schema.orders.tenantId, input.tenantId),
        eq(schema.orders.status, "PENDING_PAYMENT"),
        eq(schema.orders.paymentStatus, "UNPAID"),
      )).returning();
      if (updatedOrder) afterOrder = updatedOrder;
    }

    const event = finalStatus === "SUCCESS" ? "PAYMENT_RECEIVED" : `PAYMENT_${finalStatus}`;
    await dbTx.insert(schema.orderEvents).values({
      tenantId: input.tenantId,
      orderId: order.id,
      event,
      actor: "SYSTEM_AUTOLARIS_WEBHOOK",
      metadataJson: { transactionId: input.transactionId, status: finalStatus, amountMinor: input.amountMinor },
    });
    await dbTx.insert(schema.auditLogs).values({
      tenantId: input.tenantId,
      actorId: "webhook:autolaris",
      actorEmail: "autolaris@webhook.dotads.invalid",
      actorRole: "SYSTEM_WEBHOOK",
      action: finalStatus === "SUCCESS" ? "payment.received" : `payment.${finalStatus.toLowerCase()}`,
      targetType: "order",
      targetId: order.id,
      metadataJson: {
        transactionId: input.transactionId,
        amountMinor: input.amountMinor,
        before: { paymentTransactionStatus: payment.status, orderStatus: order.status, paymentStatus: order.paymentStatus },
        after: { paymentTransactionStatus: updatedPayment.status, orderStatus: afterOrder.status, paymentStatus: afterOrder.paymentStatus },
      },
    });
    return { outcome: "transitioned", purchaseEligible: finalStatus === "SUCCESS" };
  });

  if (result.purchaseEligible) await enqueuePurchaseEvents(input.orderId);
  return result;
}
