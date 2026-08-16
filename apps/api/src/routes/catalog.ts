import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db, schema } from "@dotads/db";
import { hasPermission } from "@dotads/auth";
import {
  CatalogPrimaryVariantSchema,
  CatalogProductSchema,
  CreateCatalogProductSchema,
  ProductImageSchema,
  ProductStatusSchema,
  UpdateCatalogProductSchema,
} from "@dotads/contracts";
import { and, asc, count, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { authMiddleware, type AppEnv, type AuthContext } from "../middleware/auth.ts";

export const catalogRouter = new OpenAPIHono<AppEnv>();

const ErrorSchema = z.object({ error: z.string() });
const StaleWriteSchema = z.object({
  error: z.string(),
  code: z.literal("STALE_WRITE"),
  current: CatalogProductSchema,
});
const ProductListSchema = z.object({
  items: z.array(CatalogProductSchema),
  pagination: z.object({
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
});

function requiredCatalogPermission(method: string, path: string): "catalog:read" | "catalog:update" | undefined {
  const routePath = path.replace(/^\/api\/v1\/catalog/, "");
  if (method === "GET" && /^\/products(?:\/[^/]+)?$/.test(routePath)) return "catalog:read";
  if (method === "POST" && routePath === "/products") return "catalog:update";
  if (method === "PATCH" && /^\/products\/[^/]+$/.test(routePath)) return "catalog:update";
  if (method === "POST" && /^\/products\/[^/]+\/archive$/.test(routePath)) return "catalog:update";
  return undefined;
}

function auditEntry(
  auth: AuthContext,
  action: string,
  productId: string,
  metadataJson: Record<string, unknown>
) {
  return {
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorEmail: auth.userEmail,
    actorRole: auth.role,
    action,
    targetType: "product",
    targetId: productId,
    metadataJson,
  };
}

function isoInstant(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value.replace(" ", "T")}Z`;
  return new Date(normalized).toISOString();
}

function normalizedNullable(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function normalizeSku(value: string | null | undefined): string | null {
  return normalizedNullable(value)?.toUpperCase() || null;
}

function serializeVariant(variant: typeof schema.productVariants.$inferSelect | null) {
  if (!variant) return null;
  return CatalogPrimaryVariantSchema.parse({
    id: variant.id,
    title: variant.title,
    sku: variant.sku,
    stockQuantity: variant.stockQuantity,
    priceMinor: variant.priceMinor,
    compareAtPriceMinor: variant.compareAtPriceMinor,
    weightGrams: variant.weightGrams,
    createdAt: isoInstant(variant.createdAt),
    updatedAt: isoInstant(variant.updatedAt),
  });
}

function serializeProduct(
  product: typeof schema.products.$inferSelect,
  primaryVariant: typeof schema.productVariants.$inferSelect | null
) {
  const images = z.array(ProductImageSchema).max(20).safeParse(product.imagesJson);
  return CatalogProductSchema.parse({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    status: product.status,
    currency: "IDR",
    priceMinor: product.priceMinor,
    compareAtPriceMinor: product.compareAtPriceMinor,
    weightGrams: product.weightGrams,
    images: images.success ? images.data : [],
    googleCategoryId: product.googleCategoryId,
    googleCategoryName: product.googleCategoryName,
    gtin: product.gtin,
    mpn: product.mpn,
    brand: product.brand,
    primaryVariant: serializeVariant(primaryVariant),
    createdAt: isoInstant(product.createdAt),
    updatedAt: latestInstant(product.updatedAt, primaryVariant?.updatedAt),
  });
}

function latestInstant(productUpdatedAt: string | Date, variantUpdatedAt?: string | Date): string {
  const productInstant = isoInstant(productUpdatedAt);
  if (!variantUpdatedAt) return productInstant;
  const variantInstant = isoInstant(variantUpdatedAt);
  return Date.parse(variantInstant) > Date.parse(productInstant) ? variantInstant : productInstant;
}

function catalogAuditSnapshot(
  product: typeof schema.products.$inferSelect,
  primaryVariant: typeof schema.productVariants.$inferSelect | null
) {
  const serialized = serializeProduct(product, primaryVariant);
  return {
    name: serialized.name,
    slug: serialized.slug,
    description: serialized.description,
    status: serialized.status,
    priceMinor: serialized.priceMinor,
    compareAtPriceMinor: serialized.compareAtPriceMinor,
    weightGrams: serialized.weightGrams,
    images: serialized.images,
    googleCategoryId: serialized.googleCategoryId,
    googleCategoryName: serialized.googleCategoryName,
    gtin: serialized.gtin,
    mpn: serialized.mpn,
    brand: serialized.brand,
    primaryVariant: serialized.primaryVariant ? {
      title: serialized.primaryVariant.title,
      sku: serialized.primaryVariant.sku,
      stockQuantity: serialized.primaryVariant.stockQuantity,
      priceMinor: serialized.primaryVariant.priceMinor,
      compareAtPriceMinor: serialized.primaryVariant.compareAtPriceMinor,
      weightGrams: serialized.primaryVariant.weightGrams,
    } : null,
  };
}

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof current !== "object" || current === null) return false;
    if ("code" in current && current.code === "23505") return true;
    current = "cause" in current ? current.cause : null;
  }
  return false;
}

async function loadPrimaryVariant(
  executor: Pick<typeof db, "select">,
  tenantId: string,
  productId: string,
  lock = false
) {
  const query = executor.select().from(schema.productVariants).where(and(
    eq(schema.productVariants.tenantId, tenantId),
    eq(schema.productVariants.productId, productId)
  )).orderBy(asc(schema.productVariants.createdAt), asc(schema.productVariants.id)).limit(1);
  const [variant] = lock ? await query.for("update") : await query;
  return variant || null;
}

catalogRouter.use("*", authMiddleware);
catalogRouter.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") return next();
  const permission = requiredCatalogPermission(c.req.method, c.req.path);
  if (!permission) return c.json({ error: "Forbidden: Catalog route has no authorization policy" }, 403);
  if (!hasPermission(c.get("auth").role, permission)) {
    return c.json({ error: `Forbidden: Missing ${permission} permission` }, 403);
  }
  return next();
});

catalogRouter.openapi(createRoute({
  method: "get",
  path: "/products",
  operationId: "listCatalogProducts",
  tags: ["Catalog"],
  summary: "List persisted tenant products",
  request: { query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    offset: z.coerce.number().int().min(0).max(10_000).default(0),
    status: ProductStatusSchema.optional(),
    query: z.string().trim().min(1).max(100).optional(),
  }) },
  responses: {
    200: { description: "Paginated catalog products", content: { "application/json": { schema: ProductListSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
  },
}), async (c) => {
  const auth = c.get("auth");
  const { limit, offset, status, query } = c.req.valid("query");
  const filters: SQL[] = [eq(schema.products.tenantId, auth.tenantId)];
  if (status) filters.push(eq(schema.products.status, status));
  if (query) filters.push(or(
    sql<boolean>`position(lower(${query}) in lower(${schema.products.name})) > 0`,
    sql<boolean>`position(lower(${query}) in lower(${schema.products.slug})) > 0`,
    sql<boolean>`position(lower(${query}) in lower(coalesce(${schema.products.gtin}, ''))) > 0`,
    sql<boolean>`exists (
      select 1 from product_variants search_variant
      where search_variant.tenant_id = ${auth.tenantId}::uuid
        and search_variant.product_id = ${schema.products.id}
        and position(lower(${query}) in lower(coalesce(search_variant.sku, ''))) > 0
    )`
  )!);
  const where = and(...filters);
  const result = await db.transaction(async (tx) => {
    const products = await tx.select().from(schema.products).where(where)
      .orderBy(desc(schema.products.updatedAt), desc(schema.products.id)).limit(limit).offset(offset);
    const [aggregate] = await tx.select({ total: count(schema.products.id) }).from(schema.products).where(where);
    const variants = products.length === 0 ? [] : await tx.select().from(schema.productVariants).where(and(
      eq(schema.productVariants.tenantId, auth.tenantId),
      inArray(schema.productVariants.productId, products.map((product) => product.id))
    )).orderBy(asc(schema.productVariants.productId), asc(schema.productVariants.createdAt), asc(schema.productVariants.id));
    const primaryByProduct = new Map<string, typeof schema.productVariants.$inferSelect>();
    for (const variant of variants) if (!primaryByProduct.has(variant.productId)) primaryByProduct.set(variant.productId, variant);
    return {
      items: products.map((product) => serializeProduct(product, primaryByProduct.get(product.id) || null)),
      pagination: { limit, offset, total: Number(aggregate?.total || 0) },
    };
  });
  return c.json(ProductListSchema.parse(result), 200);
});

catalogRouter.openapi(createRoute({
  method: "get",
  path: "/products/{id}",
  operationId: "getCatalogProduct",
  tags: ["Catalog"],
  summary: "Get a persisted tenant product",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: "Catalog product detail", content: { "application/json": { schema: CatalogProductSchema } } },
    404: { description: "Product not found", content: { "application/json": { schema: ErrorSchema } } },
  },
}), async (c) => {
  const auth = c.get("auth");
  const productId = c.req.valid("param").id;
  const result = await db.transaction(async (tx) => {
    const [product] = await tx.select().from(schema.products).where(and(
      eq(schema.products.id, productId), eq(schema.products.tenantId, auth.tenantId)
    )).limit(1);
    if (!product) return null;
    return serializeProduct(product, await loadPrimaryVariant(tx, auth.tenantId, productId));
  });
  return result ? c.json(result, 200) : c.json({ error: "Product not found" }, 404);
});

catalogRouter.openapi(createRoute({
  method: "post",
  path: "/products",
  operationId: "createCatalogProduct",
  tags: ["Catalog"],
  summary: "Create a product with one primary variant",
  request: { body: { required: true, content: { "application/json": { schema: CreateCatalogProductSchema } } } },
  responses: {
    201: { description: "Product created", content: { "application/json": { schema: CatalogProductSchema } } },
    409: { description: "Slug, SKU, or GTIN conflict", content: { "application/json": { schema: ErrorSchema } } },
  },
}), async (c) => {
  const auth = c.get("auth");
  const input = c.req.valid("json");
  try {
    const created = await db.transaction(async (tx) => {
      const [product] = await tx.insert(schema.products).values({
        tenantId: auth.tenantId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        status: input.status,
        priceMinor: input.priceMinor,
        compareAtPriceMinor: input.compareAtPriceMinor,
        weightGrams: input.weightGrams,
        imagesJson: input.images,
        googleCategoryId: input.googleCategoryId,
        googleCategoryName: input.googleCategoryName,
        gtin: input.gtin,
        mpn: input.mpn,
        brand: input.brand,
      }).returning();
      const [variant] = await tx.insert(schema.productVariants).values({
        tenantId: auth.tenantId,
        productId: product.id,
        title: input.primaryVariant.title,
        sku: normalizeSku(input.primaryVariant.sku),
        stockQuantity: input.primaryVariant.stockQuantity,
        priceMinor: product.priceMinor,
        compareAtPriceMinor: product.compareAtPriceMinor,
        weightGrams: product.weightGrams,
      }).returning();
      await tx.insert(schema.auditLogs).values(auditEntry(auth, "catalog.product_created", product.id, {
        after: catalogAuditSnapshot(product, variant),
      }));
      return serializeProduct(product, variant);
    });
    return c.json(created, 201);
  } catch (error) {
    if (isUniqueViolation(error)) return c.json({ error: "Product slug, GTIN, or SKU already exists in this tenant" }, 409);
    throw error;
  }
});

catalogRouter.openapi(createRoute({
  method: "patch",
  path: "/products/{id}",
  operationId: "updateCatalogProduct",
  tags: ["Catalog"],
  summary: "Update a product and its primary variant",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { required: true, content: { "application/json": { schema: UpdateCatalogProductSchema } } },
  },
  responses: {
    200: { description: "Product updated", content: { "application/json": { schema: CatalogProductSchema } } },
    404: { description: "Product not found", content: { "application/json": { schema: ErrorSchema } } },
    409: { description: "Conflict or stale write", content: { "application/json": { schema: z.union([ErrorSchema, StaleWriteSchema]) } } },
  },
}), async (c) => {
  const auth = c.get("auth");
  const productId = c.req.valid("param").id;
  const input = c.req.valid("json");
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${auth.tenantId}:${productId}`}, 0))`);
      const [before] = await tx.select().from(schema.products).where(and(
        eq(schema.products.id, productId), eq(schema.products.tenantId, auth.tenantId)
      )).limit(1).for("update");
      if (!before) return null;
      const existingVariant = await loadPrimaryVariant(tx, auth.tenantId, productId, true);
      if (latestInstant(before.updatedAt, existingVariant?.updatedAt) !== new Date(input.expectedUpdatedAt).toISOString()) {
        return { stale: true as const, current: serializeProduct(before, existingVariant) };
      }
      const nextPrice = input.priceMinor ?? before.priceMinor;
      const nextCompare = input.compareAtPriceMinor === undefined ? before.compareAtPriceMinor : input.compareAtPriceMinor;
      if (nextCompare !== null && nextCompare < nextPrice) return { conflict: true as const };
      const nextWeight = input.weightGrams ?? before.weightGrams;
      const [product] = await tx.update(schema.products).set({
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.slug === undefined ? {} : { slug: input.slug }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.status === undefined ? {} : { status: input.status }),
        priceMinor: nextPrice,
        compareAtPriceMinor: nextCompare,
        weightGrams: nextWeight,
        ...(input.images === undefined ? {} : { imagesJson: input.images }),
        ...(input.googleCategoryId === undefined ? {} : { googleCategoryId: input.googleCategoryId }),
        ...(input.googleCategoryName === undefined ? {} : { googleCategoryName: input.googleCategoryName }),
        ...(input.gtin === undefined ? {} : { gtin: input.gtin }),
        ...(input.mpn === undefined ? {} : { mpn: input.mpn }),
        ...(input.brand === undefined ? {} : { brand: input.brand }),
        updatedAt: new Date().toISOString(),
      }).where(and(
        eq(schema.products.id, productId), eq(schema.products.tenantId, auth.tenantId),
        eq(schema.products.updatedAt, before.updatedAt)
      )).returning();
      if (!product) return { stale: true as const, current: serializeProduct(before, existingVariant) };
      const variantValues = {
        title: input.primaryVariant?.title ?? existingVariant?.title ?? "Default Title",
        sku: input.primaryVariant?.sku === undefined ? existingVariant?.sku ?? null : normalizeSku(input.primaryVariant.sku),
        stockQuantity: input.primaryVariant?.stockQuantity ?? existingVariant?.stockQuantity ?? 0,
        priceMinor: product.priceMinor,
        compareAtPriceMinor: product.compareAtPriceMinor,
        weightGrams: product.weightGrams,
        updatedAt: new Date().toISOString(),
      };
      const [variant] = existingVariant
        ? await tx.update(schema.productVariants).set(variantValues).where(and(
            eq(schema.productVariants.id, existingVariant.id),
            eq(schema.productVariants.productId, productId),
            eq(schema.productVariants.tenantId, auth.tenantId)
          )).returning()
        : await tx.insert(schema.productVariants).values({
            tenantId: auth.tenantId, productId, ...variantValues,
          }).returning();
      if (!variant) return { conflict: true as const };
      await tx.insert(schema.auditLogs).values(auditEntry(auth, "catalog.product_updated", productId, {
        before: catalogAuditSnapshot(before, existingVariant),
        after: catalogAuditSnapshot(product, variant),
      }));
      return { product: serializeProduct(product, variant) };
    });
    if (!result) return c.json({ error: "Product not found" }, 404);
    if ("stale" in result) return c.json({
      error: "Product changed since it was loaded; reload before saving",
      code: "STALE_WRITE" as const,
      current: result.current,
    }, 409);
    if ("conflict" in result) return c.json({ error: "Product changed or has inconsistent price data" }, 409);
    return c.json(result.product, 200);
  } catch (error) {
    if (isUniqueViolation(error)) return c.json({ error: "Product slug, GTIN, or SKU already exists in this tenant" }, 409);
    throw error;
  }
});

catalogRouter.openapi(createRoute({
  method: "post",
  path: "/products/{id}/archive",
  operationId: "archiveCatalogProduct",
  tags: ["Catalog"],
  summary: "Archive a product without deleting commerce history",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { required: true, content: { "application/json": { schema: z.object({
      expectedUpdatedAt: z.string().datetime({ offset: true }),
    }).strict() } } },
  },
  responses: {
    200: { description: "Product archived", content: { "application/json": { schema: z.object({ product: CatalogProductSchema, alreadyArchived: z.boolean() }) } } },
    404: { description: "Product not found", content: { "application/json": { schema: ErrorSchema } } },
    409: { description: "Stale write", content: { "application/json": { schema: StaleWriteSchema } } },
  },
}), async (c) => {
  const auth = c.get("auth");
  const productId = c.req.valid("param").id;
  const input = c.req.valid("json");
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${auth.tenantId}:${productId}`}, 0))`);
    const [before] = await tx.select().from(schema.products).where(and(
      eq(schema.products.id, productId), eq(schema.products.tenantId, auth.tenantId)
    )).limit(1).for("update");
    if (!before) return null;
    const variant = await loadPrimaryVariant(tx, auth.tenantId, productId, true);
    if (latestInstant(before.updatedAt, variant?.updatedAt) !== new Date(input.expectedUpdatedAt).toISOString()) {
      return { kind: "stale" as const, current: serializeProduct(before, variant) };
    }
    if (before.status === "archived") return {
      kind: "success" as const, product: serializeProduct(before, variant), alreadyArchived: true,
    };
    const [product] = await tx.update(schema.products).set({ status: "archived", updatedAt: new Date().toISOString() })
      .where(and(
        eq(schema.products.id, productId), eq(schema.products.tenantId, auth.tenantId),
        eq(schema.products.status, before.status), eq(schema.products.updatedAt, before.updatedAt)
      )).returning();
    if (!product) return null;
    await tx.insert(schema.auditLogs).values(auditEntry(auth, "catalog.product_archived", productId, {
      before: catalogAuditSnapshot(before, variant),
      after: catalogAuditSnapshot(product, variant),
    }));
    return { kind: "success" as const, product: serializeProduct(product, variant), alreadyArchived: false };
  });
  if (!result) return c.json({ error: "Product not found" }, 404);
  if (result.kind === "stale") return c.json({
    error: "Product changed since it was loaded; reload before archiving",
    code: "STALE_WRITE" as const,
    current: result.current,
  }, 409);
  return c.json({ product: result.product, alreadyArchived: result.alreadyArchived }, 200);
});
