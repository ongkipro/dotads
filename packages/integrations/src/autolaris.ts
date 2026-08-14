import { createHmac } from "node:crypto";
import { db, schema } from "@dotads/db";
import { eq } from "drizzle-orm";

export interface CreateAutoLarisSessionRequest {
  tenantId: string;
  orderId: string;
  amountMinor: number;
  paymentMethod: "QRIS" | "VA_BCA" | "VA_MANDIRI" | "VA_BRI" | "VA_BNI" | "VA_PERMATA";
}

export function verifyAutoLarisSignature(rawBody: string, signature: string, secretKey: string): boolean {
  if (!signature || !secretKey) return false;
  const expectedHash = createHmac("sha256", secretKey).update(rawBody).digest("hex");
  return expectedHash.toLowerCase() === signature.toLowerCase();
}

export async function createAutoLarisPaymentSession(req: CreateAutoLarisSessionRequest) {
  const transactionId = `TX_${Date.now().toString().slice(-8)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  let qrString: string | undefined = undefined;
  let vaNumber: string | undefined = undefined;

  if (req.paymentMethod === "QRIS") {
    qrString = "00020101021226670016COM.AUTOLARIS.WWW01189360091430000000000215200453995303360540" + req.amountMinor;
  } else {
    vaNumber = `88001${Math.floor(1000000000 + Math.random() * 9000000000)}`;
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
