import { createHmac, timingSafeEqual } from "node:crypto";
import { db, schema } from "@dotads/db";
import { eq } from "drizzle-orm";

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

  const [tx] = await db
    .insert(schema.paymentTransactions)
    .values({
      tenantId: req.tenantId,
      orderId: req.orderId,
      gateway: "autolaris",
      transactionId,
      paymentMethod: req.paymentMethod,
      amountMinor: req.amountMinor,
      status: "PENDING",
      qrUrl: qrString,
      vaNumber,
      bankCode: req.paymentMethod.startsWith("VA_") ? req.paymentMethod.slice(3) : undefined,
    })
    .returning();

  return tx;
}

export async function reconcilePaymentStatus(transactionId: string, status: "PAID" | "SUCCESS" | "EXPIRED" | "FAILED") {
  const [tx] = await db
    .select()
    .from(schema.paymentTransactions)
    .where(eq(schema.paymentTransactions.transactionId, transactionId));

  if (!tx) return null;

  const finalStatus = status === "PAID" ? "SUCCESS" : status;

  await db
    .update(schema.paymentTransactions)
    .set({ status: finalStatus, updatedAt: new Date().toISOString() })
    .where(eq(schema.paymentTransactions.id, tx.id));

  if (finalStatus === "SUCCESS") {
    await db
      .update(schema.orders)
      .set({ status: "CONFIRMED", paymentStatus: "PAID", updatedAt: new Date().toISOString() })
      .where(eq(schema.orders.id, tx.orderId));
  }

  return tx;
}
