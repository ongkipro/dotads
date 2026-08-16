import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { app } from "../src/app.ts";
import { client, db, migrationClient, migrationDb, platformClient, schema, withDatabaseContext } from "@dotads/db";
import { createOrderWithFanout } from "../../../packages/integrations/src/outbox-worker.ts";

const alphaTenantId = "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8";
const betaTenantId = "3f3ca823-46bf-4ab5-a5fe-61a49d175fa9";
const tenantContext = {
  userId: "smoke-catalog-checkout", userEmail: "checkout@catalog.invalid", tenantId: alphaTenantId,
  organizationId: "org_alpha_01", role: "TENANT_OWNER", tenantName: "Store Alpha", tenantStatus: "active",
};

function headers(role = "TENANT_OWNER") {
  return {
    "x-session-token": "test-superadmin-token",
    "x-user-role": role,
    "x-user-id": `catalog-${role.toLowerCase()}`,
    "x-user-email": `${role.toLowerCase()}@catalog.invalid`,
    "x-tenant-id": alphaTenantId,
    "content-type": "application/json",
  };
}

async function request(path: string, init: RequestInit = {}, role = "TENANT_OWNER") {
  const response = await app.request(path, { ...init, headers: { ...headers(role), ...init.headers } });
  const body = await response.json() as Record<string, any>;
  return { response, body };
}

function hasDatabaseErrorCode(error: unknown, expectedCode: string): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof current !== "object" || current === null) return false;
    if ("code" in current && current.code === expectedCode) return true;
    current = "cause" in current ? current.cause : null;
  }
  return false;
}

async function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`Concurrent Catalog/checkout operation exceeded ${milliseconds}ms`)), milliseconds);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

const baseInput = {
  name: "Catalog Smoke Product",
  slug: "catalog-smoke-product",
  description: "Persisted catalog regression fixture",
  status: "draft",
  priceMinor: 250_000,
  compareAtPriceMinor: 300_000,
  weightGrams: 750,
  images: ["/images/products/catalog-smoke.webp"],
  googleCategoryId: null,
  googleCategoryName: null,
  gtin: "4006381333931",
  mpn: "SMOKE-MPN",
  brand: "DotAds Smoke",
  primaryVariant: { title: "Default Title", sku: "smoke-sku-001", stockQuantity: 10 },
};

async function run() {
  process.env.NODE_ENV = "test";

  const invalidGtin = await request("/api/v1/catalog/products", {
    method: "POST", body: JSON.stringify({ ...baseInput, slug: "bad-gtin", gtin: "8991234567890" }),
  });
  assert.equal(invalidGtin.response.status, 400);
  assert.equal((await request("/api/v1/catalog/products", {
    method: "POST", body: JSON.stringify({ ...baseInput, slug: "bad-stock", gtin: null, primaryVariant: { ...baseInput.primaryVariant, sku: "BAD-STOCK", stockQuantity: -1 } }),
  })).response.status, 400);
  assert.equal((await request("/api/v1/catalog/products", {
    method: "POST", body: JSON.stringify({ ...baseInput, slug: "bad-compare", gtin: null, priceMinor: 300_000, compareAtPriceMinor: 200_000, primaryVariant: { ...baseInput.primaryVariant, sku: "BAD-COMPARE" } }),
  })).response.status, 400);
  assert.equal((await request("/api/v1/catalog/products", {
    method: "POST", body: JSON.stringify({ ...baseInput, slug: "bad-image", gtin: null, images: ["data:image/png;base64,AAAA"], primaryVariant: { ...baseInput.primaryVariant, sku: "BAD-IMAGE" } }),
  })).response.status, 400);

  const created = await request("/api/v1/catalog/products", { method: "POST", body: JSON.stringify(baseInput) });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.currency, "IDR");
  assert.equal(created.body.primaryVariant.sku, "SMOKE-SKU-001");
  assert.equal(created.body.primaryVariant.stockQuantity, 10);
  assert.equal(created.body.primaryVariant.priceMinor, created.body.priceMinor);
  assert.equal(created.body.primaryVariant.weightGrams, created.body.weightGrams);
  assert.match(created.body.updatedAt, /Z$/);

  assert.equal((await request("/api/v1/catalog/products", {
    method: "POST", body: JSON.stringify({ ...baseInput, gtin: null, primaryVariant: { ...baseInput.primaryVariant, sku: "OTHER-SKU" } }),
  })).response.status, 409, "Tenant slug must be unique");
  assert.equal((await request("/api/v1/catalog/products", {
    method: "POST", body: JSON.stringify({ ...baseInput, slug: "duplicate-sku", gtin: null }),
  })).response.status, 409, "Tenant SKU must be unique case-insensitively");
  assert.equal((await request("/api/v1/catalog/products", {
    method: "POST", body: JSON.stringify({ ...baseInput, slug: "duplicate-gtin", primaryVariant: { ...baseInput.primaryVariant, sku: "OTHER-SKU" } }),
  })).response.status, 409, "Tenant product GTIN must be unique");

  const advertiserList = await request("/api/v1/catalog/products?query=smoke-sku-001", {}, "ADVERTISER");
  assert.equal(advertiserList.response.status, 200);
  assert.ok(advertiserList.body.items.some((product: { id: string }) => product.id === created.body.id));
  assert.equal((await request(`/api/v1/catalog/products/${created.body.id}`, {}, "CUSTOMER_SERVICE")).response.status, 200);
  assert.equal((await request(`/api/v1/catalog/products/${created.body.id}`, {
    method: "PATCH", body: JSON.stringify({ expectedUpdatedAt: created.body.updatedAt, name: "Forbidden" }),
  }, "ADVERTISER")).response.status, 403);
  assert.equal((await request(`/api/v1/catalog/products/${created.body.id}`, {
    method: "PATCH", body: JSON.stringify({ expectedUpdatedAt: created.body.updatedAt, name: "Forbidden" }),
  }, "CUSTOMER_SERVICE")).response.status, 403);

  const [betaProduct] = await migrationDb.insert(schema.products).values({
    tenantId: betaTenantId, name: "Beta Private", slug: `beta-private-${Date.now()}`,
    status: "draft", priceMinor: 1_000, weightGrams: 100,
  }).returning();
  assert.equal((await request(`/api/v1/catalog/products/${betaProduct.id}`)).response.status, 404);
  assert.equal((await request(`/api/v1/catalog/products/${betaProduct.id}`, {
    method: "PATCH", body: JSON.stringify({ expectedUpdatedAt: new Date().toISOString(), name: "Cross tenant" }),
  })).response.status, 404);
  await assert.rejects(
    migrationDb.insert(schema.productVariants).values({
      tenantId: alphaTenantId, productId: betaProduct.id, title: "Invalid parent",
      priceMinor: 1_000, weightGrams: 100, stockQuantity: 1,
    }),
    (error: unknown) => hasDatabaseErrorCode(error, "23503")
  );

  const activated = await request(`/api/v1/catalog/products/${created.body.id}`, {
    method: "PATCH",
    body: JSON.stringify({ expectedUpdatedAt: created.body.updatedAt, status: "active" }),
  });
  assert.equal(activated.response.status, 200);

  const originalFetch = globalThis.fetch;
  let pauseNextRate = true;
  let releaseRate!: () => void;
  let markRateStarted!: () => void;
  const rateStarted = new Promise<void>((resolve) => { markRateStarted = resolve; });
  const rateRelease = new Promise<void>((resolve) => { releaseRate = resolve; });
  globalThis.fetch = async (input) => {
    if (!String(input).startsWith("https://api-public.mengantar.com/")) return originalFetch(input);
    if (pauseNextRate) {
      pauseNextRate = false;
      markRateStarted();
      await rateRelease;
    }
    return new Response(JSON.stringify([{
      provider: "JNE", service_name: "REG", price: 18_000, etd: "2-3 hari", is_cod: true,
    }]), { status: 200, headers: { "content-type": "application/json" } });
  };
  const checkout = () => withDatabaseContext(tenantContext, () => createOrderWithFanout({
    tenantId: alphaTenantId,
    customerName: "Catalog Concurrency Buyer",
    customerPhone: "081234567890",
    shippingAddress: "Jl. Catalog Concurrency No. 1",
    subdistrictId: "5fc62f63f8ff44b34a4ce00a",
    paymentMethod: "QRIS",
    courierCode: "JNE",
    items: [{ productId: created.body.id, variantId: created.body.primaryVariant.id, quantity: 1 }],
  }));

  const checkoutDuringRateLookup = checkout();
  await withTimeout(rateStarted, 2_000);
  const changedDuringRateLookup = await request(`/api/v1/catalog/products/${created.body.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      expectedUpdatedAt: activated.body.updatedAt,
      priceMinor: 260_000,
      compareAtPriceMinor: 310_000,
      weightGrams: 775,
    }),
  });
  assert.equal(changedDuringRateLookup.response.status, 200,
    "Catalog mutation must not be blocked while checkout awaits an external rate");
  releaseRate();
  await assert.rejects(
    withTimeout(checkoutDuringRateLookup, 5_000),
    /changed during checkout; retry with current catalog data/
  );

  await checkout();
  const stale = await request(`/api/v1/catalog/products/${created.body.id}`, {
    method: "PATCH",
    body: JSON.stringify({ expectedUpdatedAt: changedDuringRateLookup.body.updatedAt, priceMinor: 275_000, primaryVariant: { stockQuantity: 7 } }),
  });
  assert.equal(stale.response.status, 409);
  assert.equal(stale.body.code, "STALE_WRITE");
  assert.equal(stale.body.current.primaryVariant.stockQuantity, 9, "Checkout must invalidate stale stock editors");
  assert.ok(Date.parse(stale.body.current.updatedAt) >= Date.parse(changedDuringRateLookup.body.updatedAt) + 1,
    "Checkout must advance the API-visible concurrency token by at least one millisecond");

  const updated = await request(`/api/v1/catalog/products/${created.body.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      expectedUpdatedAt: stale.body.current.updatedAt,
      name: "Catalog Smoke Product Updated",
      priceMinor: 275_000,
      compareAtPriceMinor: 325_000,
      weightGrams: 800,
      primaryVariant: { stockQuantity: 7 },
    }),
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.primaryVariant.stockQuantity, 7);
  assert.equal(updated.body.primaryVariant.priceMinor, 275_000);
  assert.equal(updated.body.primaryVariant.compareAtPriceMinor, 325_000);
  assert.equal(updated.body.primaryVariant.weightGrams, 800);

  const [concurrentPatch, concurrentCheckout] = await withTimeout(Promise.all([
    request(`/api/v1/catalog/products/${created.body.id}`, {
      method: "PATCH",
      body: JSON.stringify({ expectedUpdatedAt: updated.body.updatedAt, primaryVariant: { stockQuantity: 12 } }),
    }),
    checkout(),
  ]), 5_000);
  assert.ok(concurrentCheckout.orderId, "Concurrent checkout must commit without deadlock");
  assert.ok([200, 409].includes(concurrentPatch.response.status), "Concurrent Catalog edit must succeed or report a stale token");
  if (concurrentPatch.response.status === 409) assert.equal(concurrentPatch.body.code, "STALE_WRITE");
  const afterInterleaving = await request(`/api/v1/catalog/products/${created.body.id}`);
  assert.equal(afterInterleaving.response.status, 200);
  assert.ok([6, 11].includes(afterInterleaving.body.primaryVariant.stockQuantity),
    "Interleaving must preserve checkout decrement without deadlock or stock resurrection");

  const parityProduct = await request("/api/v1/catalog/products", {
    method: "POST",
    body: JSON.stringify({
      ...baseInput,
      name: "Default Variant Checkout Parity",
      slug: `default-variant-parity-${Date.now()}`,
      status: "active",
      gtin: null,
      priceMinor: 123_000,
      compareAtPriceMinor: null,
      weightGrams: 625,
      primaryVariant: { title: "Default", sku: `PARITY-${Date.now()}`, stockQuantity: 2 },
    }),
  });
  assert.equal(parityProduct.response.status, 201);
  const parityOrder = (variantId?: string) => withDatabaseContext(tenantContext, () => createOrderWithFanout({
    tenantId: alphaTenantId,
    customerName: "Default Variant Buyer",
    customerPhone: "081234567890",
    shippingAddress: "Jl. Default Variant No. 1",
    subdistrictId: "5fc62f63f8ff44b34a4ce00a",
    paymentMethod: "COD",
    courierCode: "JNE",
    items: [{ productId: parityProduct.body.id, ...(variantId ? { variantId } : {}), quantity: 1 }],
  }));
  const explicitVariantOrder = await parityOrder(parityProduct.body.primaryVariant.id);
  const omittedVariantOrder = await parityOrder();
  assert.equal(omittedVariantOrder.totalMinor, explicitVariantOrder.totalMinor,
    "Omitted and explicit primary variants must use identical server-side pricing");
  const persistedParityItems = await withDatabaseContext(tenantContext, () => db
    .select({ variantId: schema.orderItems.variantId })
    .from(schema.orderItems)
    .where(and(
      eq(schema.orderItems.tenantId, alphaTenantId),
      eq(schema.orderItems.productId, parityProduct.body.id),
    )));
  assert.equal(persistedParityItems.length, 2);
  assert.ok(persistedParityItems.every((item) => item.variantId === parityProduct.body.primaryVariant.id),
    "Omitted variant orders must persist the resolved primary variant identity");
  const parityAfterOrders = await request(`/api/v1/catalog/products/${parityProduct.body.id}`);
  assert.equal(parityAfterOrders.body.primaryVariant.stockQuantity, 0,
    "Explicit and omitted variants must both decrement stock");
  await assert.rejects(parityOrder(), /unavailable or out of stock/);

  const noVariantProduct = await withDatabaseContext(tenantContext, async () => {
    const [product] = await db.insert(schema.products).values({
      tenantId: alphaTenantId,
      name: "No Variant Product",
      slug: `no-variant-${Date.now()}`,
      status: "active",
      priceMinor: 99_000,
      weightGrams: 500,
    }).returning();
    return product;
  });
  await assert.rejects(withDatabaseContext(tenantContext, () => createOrderWithFanout({
    tenantId: alphaTenantId,
    customerName: "No Variant Buyer",
    customerPhone: "081234567890",
    shippingAddress: "Jl. No Variant No. 1",
    subdistrictId: "5fc62f63f8ff44b34a4ce00a",
    paymentMethod: "COD",
    courierCode: "JNE",
    items: [{ productId: noVariantProduct.id, quantity: 1 }],
  })), /unavailable or out of stock/, "Products without variants must be rejected");
  globalThis.fetch = originalFetch;

  const staleArchive = await request(`/api/v1/catalog/products/${created.body.id}/archive`, {
    method: "POST", body: JSON.stringify({ expectedUpdatedAt: updated.body.updatedAt }),
  });
  assert.equal(staleArchive.response.status, 409);
  const archived = await request(`/api/v1/catalog/products/${created.body.id}/archive`, {
    method: "POST", body: JSON.stringify({ expectedUpdatedAt: staleArchive.body.current.updatedAt }),
  });
  assert.equal(archived.response.status, 200);
  assert.equal(archived.body.product.status, "archived");
  assert.equal(archived.body.alreadyArchived, false);
  const repeatedArchive = await request(`/api/v1/catalog/products/${created.body.id}/archive`, {
    method: "POST", body: JSON.stringify({ expectedUpdatedAt: archived.body.product.updatedAt }),
  });
  assert.equal(repeatedArchive.response.status, 200);
  assert.equal(repeatedArchive.body.alreadyArchived, true);

  {
    const [persisted] = await migrationDb.select().from(schema.products).where(and(
      eq(schema.products.tenantId, alphaTenantId), eq(schema.products.id, created.body.id)
    ));
    assert.equal(persisted.status, "archived", "Archive must retain the persisted product row");
    const audit = await migrationDb.select().from(schema.auditLogs).where(and(
      eq(schema.auditLogs.tenantId, alphaTenantId), eq(schema.auditLogs.targetId, created.body.id)
    ));
    assert.equal(audit.filter((entry) => entry.action === "catalog.product_created").length, 1);
    assert.equal(audit.filter((entry) => entry.action === "catalog.product_archived").length, 1);
    const updates = audit.filter((entry) => entry.action === "catalog.product_updated");
    assert.ok(updates.length >= 2);
    const expectedAuditKeys = [
      "brand", "compareAtPriceMinor", "description", "googleCategoryId", "googleCategoryName", "gtin",
      "images", "mpn", "name", "priceMinor", "primaryVariant", "slug", "status", "weightGrams",
    ];
    for (const entry of updates) {
      const metadata = entry.metadataJson as { before?: Record<string, unknown>; after?: Record<string, unknown> };
      assert.deepEqual(Object.keys(metadata.before || {}).sort(), expectedAuditKeys);
      assert.deepEqual(Object.keys(metadata.after || {}).sort(), expectedAuditKeys);
    }
    assert.ok(audit.every((entry) => entry.actorEmail.endsWith("@catalog.invalid")));
  }

  const openapi = await (await app.request("/api/v1/openapi.json")).json() as { paths: Record<string, unknown> };
  for (const path of ["/api/v1/catalog/products", "/api/v1/catalog/products/{id}", "/api/v1/catalog/products/{id}/archive"]) {
    assert.ok(openapi.paths[path], `OpenAPI must export ${path}`);
  }
  console.log("CATALOG API + PERSISTENCE SMOKE PASSED");
}

run().then(async () => {
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
}).catch(async (error) => {
  console.error("Catalog smoke failed:", error instanceof Error ? error.message : String(error));
  await Promise.all([client.end(), platformClient.end(), migrationClient.end()]);
  process.exitCode = 1;
});
