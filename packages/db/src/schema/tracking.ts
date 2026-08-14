import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.ts";

export const trackingConfigs = pgTable(
  "tracking_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    metaPixelId: varchar("meta_pixel_id", { length: 100 }),
    metaCapiToken: text("meta_capi_token"),
    metaEnabled: boolean("meta_enabled").notNull().default(true),
    googleTagId: varchar("google_tag_id", { length: 100 }),
    googleAdsConversionId: varchar("google_ads_conversion_id", { length: 100 }),
    googleAdsConversionLabel: varchar("google_ads_conversion_label", { length: 100 }),
    googleEnabled: boolean("google_enabled").notNull().default(true),
    tiktokPixelId: varchar("tiktok_pixel_id", { length: 100 }),
    tiktokAccessToken: text("tiktok_access_token"),
    tiktokEnabled: boolean("tiktok_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_tracking_config_tenant").on(table.tenantId),
    uniqueIndex("uniq_tenant_tracking").on(table.tenantId),
  ]
);

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    platform: varchar("platform", { length: 20 }).notNull(), // meta, google, tiktok
    destinationId: varchar("destination_id", { length: 100 }).notNull(), // pixel_id / conversion_action_id
    eventId: varchar("event_id", { length: 255 }).notNull(), // Deduplication key (e.g. purchase:ORD_1001)
    eventName: varchar("event_name", { length: 100 }).notNull(), // Purchase, Lead, AddToCart, ViewContent
    payloadJson: jsonb("payload_json").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, sent, failed
    retryCount: integer("retry_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    lastError: text("last_error"),
    nextRetryAt: timestamp("next_retry_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_outbox_tenant").on(table.tenantId),
    index("idx_outbox_status_platform").on(table.status, table.platform),
    index("idx_outbox_retry").on(table.nextRetryAt),
    uniqueIndex("uniq_tenant_platform_event").on(table.tenantId, table.platform, table.eventId),
  ]
);
