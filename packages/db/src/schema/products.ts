import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, index, uniqueIndex, check, foreignKey } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.ts";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("active"), // draft, active, archived
    priceMinor: integer("price_minor").notNull(), // Integer rupiah; IDR is a zero-decimal currency.
    compareAtPriceMinor: integer("compare_at_price_minor"),
    weightGrams: integer("weight_grams").notNull().default(1000),
    imagesJson: jsonb("images_json").notNull().default([]),
    googleCategoryId: integer("google_category_id"),
    googleCategoryName: varchar("google_category_name", { length: 255 }),
    gtin: varchar("gtin", { length: 14 }), // EAN-13 / GTIN-14 Barcode
    mpn: varchar("mpn", { length: 70 }),
    brand: varchar("brand", { length: 100 }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_products_tenant").on(table.tenantId),
    uniqueIndex("uniq_tenant_product_slug").on(table.tenantId, table.slug),
    uniqueIndex("uniq_products_tenant_id").on(table.tenantId, table.id),
    uniqueIndex("uniq_tenant_product_gtin").on(table.tenantId, table.gtin).where(sql`${table.gtin} is not null`),
    check("products_status_check", sql`${table.status} in ('draft', 'active', 'archived')`),
    check("products_price_check", sql`${table.priceMinor} >= 0`),
    check("products_compare_price_check", sql`${table.compareAtPriceMinor} is null or ${table.compareAtPriceMinor} >= ${table.priceMinor}`),
    check("products_weight_check", sql`${table.weightGrams} > 0`),
  ]
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(), // e.g. "Merah / XL"
    sku: varchar("sku", { length: 100 }),
    priceMinor: integer("price_minor").notNull(),
    compareAtPriceMinor: integer("compare_at_price_minor"),
    weightGrams: integer("weight_grams").notNull().default(1000),
    stockQuantity: integer("stock_quantity").notNull().default(100),
    gtin: varchar("gtin", { length: 14 }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_variants_tenant").on(table.tenantId),
    index("idx_variants_product").on(table.productId),
    uniqueIndex("uniq_tenant_variant_sku").on(table.tenantId, sql`upper(${table.sku})`).where(sql`${table.sku} is not null`),
    uniqueIndex("uniq_tenant_variant_gtin").on(table.tenantId, table.gtin).where(sql`${table.gtin} is not null`),
    check("variants_price_check", sql`${table.priceMinor} >= 0`),
    check("variants_compare_price_check", sql`${table.compareAtPriceMinor} is null or ${table.compareAtPriceMinor} >= ${table.priceMinor}`),
    check("variants_weight_check", sql`${table.weightGrams} > 0`),
    check("variants_stock_check", sql`${table.stockQuantity} >= 0`),
    foreignKey({
      name: "variants_tenant_product_fk",
      columns: [table.tenantId, table.productId],
      foreignColumns: [products.tenantId, products.id],
    }).onDelete("cascade"),
  ]
);
