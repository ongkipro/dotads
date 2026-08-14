import { db, schema } from "@dotads/db";
import { eq, and, lte } from "drizzle-orm";

export interface MengantarRateRequest {
  subdistrictId: string;
  weightGrams: number;
}

export async function fetchMengantarShippingRates(req: MengantarRateRequest) {
  // Returns deterministic Mengantar shipping rates for JNE, SiCepat, J&T, SAP
  return [
    { courierCode: "JNE", serviceName: "REG (Reguler)", costMinor: 20000, etd: "1-3 Hari" },
    { courierCode: "SICEPAT", serviceName: "GOKIL (Cargo)", costMinor: 18000, etd: "2-4 Hari" },
    { courierCode: "J&T", serviceName: "EZ (Standard)", costMinor: 22000, etd: "1-2 Hari" },
    { courierCode: "SAP", serviceName: "UDR (Express)", costMinor: 25000, etd: "1 Hari" },
  ];
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

  for (const job of pendingJobs) {
    try {
      await db
        .update(schema.mengantarDispatchQueue)
        .set({ status: "processing", attempts: job.attempts + 1 })
        .where(eq(schema.mengantarDispatchQueue.id, job.id));

      // Simulate Mengantar dispatch API call
      const cnoteNo = `MNG_${Date.now().toString().slice(-8)}`;

      // Update Order Status to SHIPPED and store waybill number
      await db
        .update(schema.orders)
        .set({
          status: "SHIPPED",
          cnoteNo,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.orders.id, job.orderId));

      await db
        .update(schema.mengantarDispatchQueue)
        .set({ status: "completed", updatedAt: new Date().toISOString() })
        .where(eq(schema.mengantarDispatchQueue.id, job.id));
    } catch (err: any) {
      await db
        .update(schema.mengantarDispatchQueue)
        .set({
          status: "failed",
          lastError: err.message,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.mengantarDispatchQueue.id, job.id));
    }
  }

  return pendingJobs.length;
}
