import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
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
    priceMinor: integer("price_minor").notNull(), // IDR in minor units (e.g. 150000)
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
  ]
);
