import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.ts";
import { orders } from "./orders.ts";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // Nullable for Super Admin platform logs
    actorId: text("actor_id").notNull(),
    actorEmail: varchar("actor_email", { length: 255 }).notNull(),
    actorRole: varchar("actor_role", { length: 50 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(), // tenant.create, order.update, member.invite, etc.
    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: text("target_id").notNull(),
    metadataJson: jsonb("metadata_json").notNull().default({}),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_audit_tenant").on(table.tenantId),
    index("idx_audit_actor").on(table.actorId),
    index("idx_audit_action").on(table.action),
  ]
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 255 }).notNull(),
    requestPath: varchar("request_path", { length: 255 }).notNull(),
    requestHash: varchar("request_hash", { length: 64 }),
    state: varchar("state", { length: 30 }).notNull().default("LEGACY_COMPLETED"),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
    responseCode: integer("response_code"),
    responseJson: jsonb("response_json"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  },
  (table) => [
    index("idx_idempotency_tenant").on(table.tenantId),
    index("idx_idempotency_tenant_state").on(table.tenantId, table.state),
    uniqueIndex("uniq_tenant_idempotency_key").on(table.tenantId, table.key),
  ]
);
