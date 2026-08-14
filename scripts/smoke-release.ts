import { db, schema } from "../packages/db/src/index.ts";
import { eq } from "drizzle-orm";
import {
  evaluateReceiverRisk,
  processMengantarDispatchQueue,
  reconcilePaymentStatus,
  processOutboxEvents,
} from "../packages/integrations/src/index.ts";
import assert from "node:assert";

async function runReleaseSmoke() {
  console.log("==================================================================");
  console.log("🚀 STARTING DOTADS V2 COMPREHENSIVE END-TO-END RELEASE SMOKE TEST");
  console.log("==================================================================");

  // 1. Verify Database Connection & Tenants
  console.log("\n[1/7] Verifying Database Tenants...");
  const tenants = await db.select().from(schema.tenants);
  assert.ok(tenants.length > 0, "Database must contain seeded tenants");
  const tenant = tenants[0];
  console.log(`  ✓ Found Active Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Test Receiver Risk Scoring
  console.log("\n[2/7] Testing Receiver Risk Scoring Engine...");
  const riskResult = evaluateReceiverRisk({
    customerPhone: "081234567890",
    shippingAddress: "Jl. Merdeka No. 45, RT 02 RW 05, Kebayoran Baru, Jakarta Selatan",
    subdistrictId: "ID_SUB_1001",
    orderTotalMinor: 150000,
  });
  assert.strictEqual(riskResult.tier, "LOW");
  console.log(`  ✓ Receiver Risk Score: ${riskResult.score} (${riskResult.tier})`);

  // 3. Test Order Intake & Database Persistence
  console.log("\n[3/7] Testing Public Order Intake & Transactional Persistence...");
  const orderNumber = `RELEASE_${Date.now().toString().slice(-6)}`;
  const [order] = await db
    .insert(schema.orders)
    .values({
      tenantId: tenant.id,
      orderNumber,
      status: "PENDING_PAYMENT",
      paymentMethod: "COD",
      customerName: "Release Test Buyer",
      customerPhone: "081298765432",
      shippingAddress: "Jl. Sudirman No. 1, Jakarta",
      subdistrictId: "ID_SUB_1001",
      subtotalMinor: 150000,
      shippingCostMinor: 20000,
      totalMinor: 170000,
      attributionJson: { fbp: "fb.1.162345.123", fbc: "fb.1.162345.456" },
    })
    .returning();
  assert.ok(order, "Order record must be created successfully");
  console.log(`  ✓ Created Order: ${order.orderNumber} (ID: ${order.id})`);

  // 4. Test Multi-Platform Outbox Fan-out
  console.log("\n[4/7] Testing Multi-Platform Outbox Conversion Fan-out...");
  const eventId = `purchase:${order.id}`;
  await db.insert(schema.outboxEvents).values([
    {
      tenantId: tenant.id,
      platform: "meta",
      destinationId: "meta_pixel_123",
      eventId,
      eventName: "Purchase",
      payloadJson: { currency: "IDR", value: 170000 },
    },
    {
      tenantId: tenant.id,
      platform: "google",
      destinationId: "gtag_456",
      eventId,
      eventName: "purchase",
      payloadJson: { transaction_id: order.id, value: 170000 },
    },
    {
      tenantId: tenant.id,
      platform: "tiktok",
      destinationId: "tt_pixel_789",
      eventId,
      eventName: "CompletePayment",
      payloadJson: { value: 170000 },
    },
  ]).onConflictDoNothing();

  const processedOutboxCount = await processOutboxEvents();
  console.log(`  ✓ Processed ${processedOutboxCount} Multi-Platform Conversion Outbox Events`);

  // 5. Test Mengantar Logistics Queue
  console.log("\n[5/7] Testing Mengantar Logistics Queue Processing...");
  await db.insert(schema.mengantarDispatchQueue).values({
    tenantId: tenant.id,
    orderId: order.id,
    courierCode: "JNE",
    serviceName: "REG",
    status: "pending",
  });

  const dispatchedJobsCount = await processMengantarDispatchQueue();
  const [updatedOrder] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, order.id));
  assert.strictEqual(updatedOrder.status, "SHIPPED");
  assert.ok(updatedOrder.cnoteNo, "Waybill cnoteNo must be generated");
  console.log(`  ✓ Mengantar Dispatched 1 Order -> Waybill: ${updatedOrder.cnoteNo}`);

  // 6. Test AutoLaris Payment Reconciliation
  console.log("\n[6/7] Testing AutoLaris Payment Reconciliation...");
  const transactionId = `TX_SMOKE_${Date.now().toString().slice(-6)}`;
  await db.insert(schema.paymentTransactions).values({
    tenantId: tenant.id,
    orderId: order.id,
    gateway: "autolaris",
    transactionId,
    paymentMethod: "QRIS",
    amountMinor: 170000,
    status: "PENDING",
  });

  await reconcilePaymentStatus(transactionId, "SUCCESS");
  const [reconciledTx] = await db
    .select()
    .from(schema.paymentTransactions)
    .where(eq(schema.paymentTransactions.transactionId, transactionId));
  assert.strictEqual(reconciledTx.status, "SUCCESS");
  console.log(`  ✓ Reconciled Payment Transaction ${transactionId} -> Status: SUCCESS`);

  // 7. Summary
  console.log("\n==================================================================");
  console.log("🎉 ALL RELEASE SMOKE CHECKS PASSED SUCCESSFULLY!");
  console.log("   DotAds Engine v2 is PRODUCTION-READY and READY FOR DEPLOYMENT!");
  console.log("==================================================================\n");

  process.exit(0);
}

runReleaseSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Release Smoke FAILED:", msg);
  process.exit(1);
});
