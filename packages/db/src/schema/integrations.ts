import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.ts";
import { orders } from "./orders.ts";

export const mengantarConfigs = pgTable(
  "mengantar_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    apiKey: text("api_key").notNull(),
    sandbox: boolean("sandbox").notNull().default(false),
    defaultCourier: varchar("default_courier", { length: 50 }).notNull().default("JNE"),
    autoDispatchCod: boolean("auto_dispatch_cod").notNull().default(true),
    rtsThresholdScore: integer("rts_threshold_score").notNull().default(50),
    senderName: varchar("sender_name", { length: 255 }),
    senderPhone: varchar("sender_phone", { length: 50 }),
    senderAddress: text("sender_address"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_mengantar_config_tenant").on(table.tenantId),
    uniqueIndex("uniq_tenant_mengantar").on(table.tenantId),
  ]
);

export const mengantarDispatchQueue = pgTable(
  "mengantar_dispatch_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, completed, failed
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    nextRetryAt: timestamp("next_retry_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_mengantar_queue_tenant").on(table.tenantId),
    index("idx_mengantar_queue_status").on(table.status),
    index("idx_mengantar_queue_retry").on(table.nextRetryAt),
    uniqueIndex("uniq_mengantar_queue_tenant_order").on(table.tenantId, table.orderId),
  ]
);

export const mengantarLocations = pgTable(
  "mengantar_locations",
  {
    subdistrictId: varchar("subdistrict_id", { length: 50 }).primaryKey(),
    subdistrictName: varchar("subdistrict_name", { length: 255 }).notNull(),
    cityName: varchar("city_name", { length: 255 }).notNull(),
    provinceName: varchar("province_name", { length: 255 }).notNull(),
    postalCode: varchar("postal_code", { length: 20 }),
    zoneGroup: varchar("zone_group", { length: 50 }).notNull().default("ZONE_1"), // ZONE_1, ZONE_2, ZONE_3, REMOTE
    isActive: boolean("is_active").notNull().default(true),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_mengantar_loc_search").on(table.subdistrictName, table.cityName),
  ]
);

export const autolarisConfigs = pgTable(
  "autolaris_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    apiSecret: text("api_secret").notNull(),
    merchantId: varchar("merchant_id", { length: 100 }).notNull(),
    sandbox: boolean("sandbox").notNull().default(false),
    qrisEnabled: boolean("qris_enabled").notNull().default(true),
    vaEnabled: boolean("va_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_autolaris_config_tenant").on(table.tenantId),
    uniqueIndex("uniq_tenant_autolaris").on(table.tenantId),
  ]
);

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    gateway: varchar("gateway", { length: 50 }).notNull().default("AUTOLARIS"), // AUTOLARIS, MANUAL_COD
    transactionId: varchar("transaction_id", { length: 255 }),
    amountMinor: integer("amount_minor").notNull(),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("PENDING"), // PENDING, SUCCESS, EXPIRED, FAILED
    qrUrl: text("qr_url"),
    vaNumber: varchar("va_number", { length: 100 }),
    bankCode: varchar("bank_code", { length: 50 }),
    rawCallbackJson: jsonb("raw_callback_json"),
    paidAt: timestamp("paid_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_payments_tenant").on(table.tenantId),
    index("idx_payments_order").on(table.orderId),
    uniqueIndex("uniq_gateway_trans").on(table.gateway, table.transactionId),
    uniqueIndex("uniq_payment_tenant_gateway_order").on(table.tenantId, table.gateway, table.orderId),
  ]
);
