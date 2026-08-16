import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { app } from "../src/app.ts";
import { client, db, schema, withDatabaseContext } from "@dotads/db";

const tenantId = "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8";
const context = { userId: "public-order-smoke", userEmail: "smoke@invalid", tenantId, organizationId: "", role: "TENANT_OWNER", tenantName: "Store Alpha", tenantStatus: "active" };

async function post(payload: Record<string, unknown>, key: string) {
  const response = await app.request("/api/v1/public/orders", {
    method: "POST",
    headers: { "content-type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(payload),
  });
  return { response, body: await response.json() as Record<string, unknown> };
}

async function run() {
  process.env.NODE_ENV = "test";
  const productId = randomUUID();
  const variantId = randomUUID();
  const variant = await withDatabaseContext(context, async () => {
    await db.insert(schema.products).values({ id: productId, tenantId, name: "Idempotency Smoke Product", slug: `idempotency-${productId}`, status: "active", priceMinor: 100_000, weightGrams: 500 });
    const [created] = await db.insert(schema.productVariants).values({ id: variantId, tenantId, productId, title: "Default", sku: `IDEM-${variantId}`, priceMinor: 100_000, weightGrams: 500, stockQuantity: 10 }).returning({ id: schema.productVariants.id, productId: schema.productVariants.productId, stock: schema.productVariants.stockQuantity });
    return created;
  });
  const base = { tenantId, customerName: "Idempotency Smoke", customerPhone: "081234567890", shippingAddress: "Jl. Smoke 1", subdistrictId: "ID_SUB_1001", paymentMethod: "COD", items: [{ productId: variant.productId, quantity: 1 }] };
  const missingKey = await app.request("/api/v1/public/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(base) });
  assert.equal(missingKey.status, 400);
  const key = randomUUID();
  const [first, replay] = await Promise.all([post(base, key), post(base, key)]);
  assert.deepEqual([first.response.status, replay.response.status], [201, 201]);
  assert.deepEqual(first.body, replay.body);
  globalThis.fetch = async () => { throw new Error("shipping must not run during replay"); };
  const replayWithoutProviders = await post({ ...base, turnstileToken: "INVALID_TOKEN" }, key);
  assert.equal(replayWithoutProviders.response.status, 201);
  assert.deepEqual(replayWithoutProviders.body, first.body, "replay bypasses Turnstile and shipping providers");
  const [after] = await withDatabaseContext(context, () => db.select({ stock: schema.productVariants.stockQuantity }).from(schema.productVariants).where(and(eq(schema.productVariants.tenantId, tenantId), eq(schema.productVariants.id, variant.id))).limit(1));
  assert.equal(after.stock, variant.stock - 1, "concurrent replay decrements stock once");
  const mismatch = await post({ ...base, customerName: "Different" }, key);
  assert.equal(mismatch.response.status, 409);
  const [stored] = await withDatabaseContext(context, () => db.select().from(schema.idempotencyKeys).where(and(eq(schema.idempotencyKeys.tenantId, tenantId), eq(schema.idempotencyKeys.key, key))).limit(1));
  assert.equal(stored.responseCode, 201);
  assert.equal(stored.state, "COMPLETED");
  const retentionMs = new Date(stored.expiresAt).getTime() - new Date(stored.createdAt).getTime();
  assert.ok(retentionMs >= 24 * 60 * 60 * 1000 && retentionMs < 24 * 60 * 60 * 1000 + 10_000);

  process.env.AUTOLARIS_MERCHANT_ID = "smoke-merchant";
  process.env.AUTOLARIS_SECRET = "smoke-secret";
  let providerCalls = 0;
  let providerThrows = false;
  globalThis.fetch = async (input) => {
    if (String(input).includes("autolaris.com")) {
      providerCalls += 1;
      if (providerThrows) throw new Error("ambiguous provider timeout");
      return new Response(JSON.stringify({ data: { transaction_id: `tx-${providerCalls}`, qris_payload: "000201SMOKE" } }), { status: 200 });
    }
    return new Response(JSON.stringify({ data: [] }), { status: 200 });
  };
  const prepaid = { ...base, paymentMethod: "QRIS" };
  const prepaidKey = randomUUID();
  const paid = await post(prepaid, prepaidKey);
  const paidReplay = await post(prepaid, prepaidKey);
  assert.equal(paid.response.status, 201);
  assert.deepEqual(paidReplay.body, paid.body);
  assert.equal(providerCalls, 1, "successful prepaid replay never recalls provider");

  providerThrows = true;
  const ambiguousKey = randomUUID();
  const ambiguous = await post(prepaid, ambiguousKey);
  const ambiguousReplay = await post(prepaid, ambiguousKey);
  assert.equal(ambiguous.response.status, 202);
  assert.deepEqual(ambiguous.body, ambiguousReplay.body);
  assert.equal(ambiguous.body.status, "PAYMENT_PROCESSING");
  assert.deepEqual(Object.keys(ambiguous.body).sort(), ["orderId", "orderNumber", "paymentMethod", "status", "totalMinor"]);
  assert.equal(providerCalls, 2, "ambiguous prepaid replay never recalls provider");
  const [ambiguousStored] = await withDatabaseContext(context, () => db.select().from(schema.idempotencyKeys).where(and(eq(schema.idempotencyKeys.tenantId, tenantId), eq(schema.idempotencyKeys.key, ambiguousKey))).limit(1));
  assert.equal(ambiguousStored.state, "PAYMENT_AMBIGUOUS");
  assert.equal(ambiguousStored.responseCode, 202);
  await withDatabaseContext(context, async () => {
    await db.delete(schema.orders).where(and(
      eq(schema.orders.tenantId, tenantId),
      inArray(schema.orders.id, [first.body.orderId, paid.body.orderId, ambiguous.body.orderId] as string[]),
    ));
    await db.delete(schema.products).where(and(eq(schema.products.tenantId, tenantId), eq(schema.products.id, productId)));
  });
  console.log("public order idempotency smoke: PASS");
}

run().finally(() => client.end());
