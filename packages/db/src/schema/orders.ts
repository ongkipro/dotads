import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants.ts";
import { products, productVariants } from "./products.ts";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderNumber: varchar("order_number", { length: 50 }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("PENDING_PAYMENT"), // PENDING_PAYMENT, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
    paymentStatus: varchar("payment_status", { length: 30 }).notNull().default("UNPAID"), // UNPAID, PAID, REFUNDED, FAILED
    fulfillmentStatus: varchar("fulfillment_status", { length: 30 }).notNull().default("UNFULFILLED"), // UNFULFILLED, PICKUP_REQUESTED, IN_TRANSIT, DELIVERED, RETURNED, FAILED
    paymentMethod: varchar("payment_method", { length: 30 }).notNull().default("COD"), // COD, QRIS, VA_BCA, VA_MANDIRI, VA_BRI, VA_BNI, VA_PERMATA
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
    shippingAddress: text("shipping_address").notNull(),
    subdistrictId: varchar("subdistrict_id", { length: 50 }),
    subdistrictName: varchar("subdistrict_name", { length: 255 }),
    cityId: varchar("city_id", { length: 50 }),
    cityName: varchar("city_name", { length: 255 }),
    provinceId: varchar("province_id", { length: 50 }),
    provinceName: varchar("province_name", { length: 255 }),
    postalCode: varchar("postal_code", { length: 20 }),
    subtotalMinor: integer("subtotal_minor").notNull().default(0),
    shippingCostMinor: integer("shipping_cost_minor").notNull().default(0),
    discountMinor: integer("discount_minor").notNull().default(0),
    totalMinor: integer("total_minor").notNull().default(0),
    cnoteNo: varchar("cnote_no", { length: 100 }), // Mengantar Tracking Receipt Number
    courierCode: varchar("courier_code", { length: 50 }), // JNE, SICEPAT, J&T, SAP
    courierService: varchar("courier_service", { length: 50 }),
    rtsRiskScore: integer("rts_risk_score").default(0), // Receiver RTS risk score (0-100)
    attributionJson: jsonb("attribution_json").notNull().default({}), // _fbp, _fbc, gclid, wbraid, gbraid, ttclid, utm_*
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_orders_tenant").on(table.tenantId),
    index("idx_orders_tenant_created_at").on(table.tenantId, table.createdAt),
    index("idx_orders_cnote").on(table.cnoteNo),
    uniqueIndex("uniq_orders_cnote_no").on(table.cnoteNo).where(sql`${table.cnoteNo} is not null`),
    uniqueIndex("uniq_tenant_order_num").on(table.tenantId, table.orderNumber),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productName: varchar("product_name", { length: 255 }).notNull(),
    variantTitle: varchar("variant_title", { length: 255 }),
    sku: varchar("sku", { length: 100 }),
    priceMinor: integer("price_minor").notNull(),
    quantity: integer("quantity").notNull().default(1),
    subtotalMinor: integer("subtotal_minor").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_order_items_tenant").on(table.tenantId),
    index("idx_order_items_order").on(table.orderId),
  ]
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    event: varchar("event", { length: 50 }).notNull(), // ORDER_CREATED, PAYMENT_RECEIVED, DISPATCHED, DELIVERED, CANCELLED
    actor: varchar("actor", { length: 255 }).notNull(),
    metadataJson: jsonb("metadata_json").notNull().default({}),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_order_events_tenant").on(table.tenantId),
    index("idx_order_events_order").on(table.orderId),
  ]
);
