import {
  client,
  db,
  migrationClient,
  platformClient,
  schema,
  withDatabaseContext,
  type DatabaseSessionContext,
} from "../packages/db/src/index.ts";
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
  const platformContext: DatabaseSessionContext = {
    userId: "smoke:release",
    userEmail: "release-smoke@dotads.invalid",
    tenantId: "",
    organizationId: "",
    role: "SUPER_ADMIN",
    tenantName: "DotAds Platform",
    tenantStatus: "active",
  };
  const tenants = await withDatabaseContext(platformContext, () => db.select().from(schema.tenants));
  assert.ok(tenants.length > 0, "Database must contain seeded tenants");
  const tenant = tenants[0];
  console.log(`  ✓ Found Active Tenant: ${tenant.name} (${tenant.id})`);

  const tenantContext: DatabaseSessionContext = {
    ...platformContext,
    tenantId: tenant.id,
    role: "TENANT_OWNER",
    tenantName: tenant.name,
  };

  const dispatchedOrderId = await withDatabaseContext(tenantContext, async () => {

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
      status: "CONFIRMED",
      paymentMethod: "COD",
      customerName: "Release Test Buyer",
      customerPhone: "081298765432",
      shippingAddress: "Jl. Sudirman No. 1, Jakarta",
      subdistrictId: "ID_SUB_1001",
      courierCode: "JNE",
      courierService: "REG",
      subtotalMinor: 150000,
      shippingCostMinor: 20000,
      totalMinor: 170000,
      attributionJson: { fbp: "fb.1.162345.123", fbc: "fb.1.162345.456" },
    })
    .returning();
  assert.ok(order, "Order record must be created successfully");
  console.log(`  ✓ Created Order: ${order.orderNumber} (ID: ${order.id})`);

  let [seededProduct] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.tenantId, tenant.id))
    .limit(1);

  if (!seededProduct) {
    [seededProduct] = await db
      .insert(schema.products)
      .values({
        tenantId: tenant.id,
        name: "Test Gadget Alpha",
        slug: `test-gadget-${Date.now()}`,
        priceMinor: 150000,
        weightGrams: 500,
        status: "ACTIVE",
      })
      .returning();
  }
  assert.ok(seededProduct, "Database must contain at least one product for weight lookup");
  await db.insert(schema.orderItems).values({
    tenantId: tenant.id,
    orderId: order.id,
    productId: seededProduct.id,
    productName: seededProduct.name,
    sku: seededProduct.gtin ?? undefined,
    priceMinor: seededProduct.priceMinor,
    quantity: 1,
    subtotalMinor: seededProduct.priceMinor,
  });
  console.log(`  ✓ Attached Order Item: ${seededProduct.name} (${seededProduct.weightGrams}g)`);

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
    status: "pending",
  });
  return order.id;
  });

  const dispatchedJobsCount = await processMengantarDispatchQueue();
  assert.ok(dispatchedJobsCount >= 1, "Mengantar worker must claim at least the queued release-smoke order");
  await withDatabaseContext(tenantContext, async () => {
  const [updatedOrder] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, dispatchedOrderId));
  assert.strictEqual(updatedOrder.status, "SHIPPED");
  assert.ok(updatedOrder.cnoteNo, "Waybill cnoteNo must be generated");
  console.log(`  ✓ Mengantar processed ${dispatchedJobsCount} queued order(s); release order waybill: ${updatedOrder.cnoteNo}`);

  // 6. Test AutoLaris Payment Reconciliation
  console.log("\n[6/7] Testing AutoLaris Payment Reconciliation...");
  const transactionId = `TX_SMOKE_${Date.now().toString().slice(-6)}`;
  await db.insert(schema.paymentTransactions).values({
    tenantId: tenant.id,
    orderId: dispatchedOrderId,
    gateway: "autolaris",
    transactionId,
    paymentMethod: "QRIS",
    amountMinor: 170000,
    status: "PENDING",
  });

  await reconcilePaymentStatus({
    tenantId: tenant.id,
    transactionId,
    orderId: dispatchedOrderId,
    amountMinor: 170000,
    status: "SUCCESS",
  });
  const [reconciledTx] = await db
    .select()
    .from(schema.paymentTransactions)
    .where(eq(schema.paymentTransactions.transactionId, transactionId));
  assert.strictEqual(reconciledTx.status, "SUCCESS");
  console.log(`  ✓ Reconciled Payment Transaction ${transactionId} -> Status: SUCCESS`);

  // 7. Summary
  console.log("\n==================================================================");
  console.log("🎉 ALL RELEASE SMOKE CHECKS PASSED SUCCESSFULLY!");
  console.log("   This smoke result is not a production-readiness or deployment certification.");
  console.log("==================================================================\n");
  });
}

runReleaseSmoke()
  .catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Release Smoke FAILED:", msg);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
  });
