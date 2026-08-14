import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, suspended, cancelled
  tier: varchar("tier", { length: 50 }).notNull().default("pro"), // starter, pro, enterprise
  customDomain: varchar("custom_domain", { length: 255 }),
  settingsJson: jsonb("settings_json").notNull().default({}),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const tenantDomains = pgTable(
  "tenant_domains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    hostname: varchar("hostname", { length: 255 }).notNull().unique(),
    isPrimary: boolean("is_primary").notNull().default(false),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, verified, failed
    verificationToken: varchar("verification_token", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_tenant_domains_tenant").on(table.tenantId),
    uniqueIndex("uniq_tenant_hostname").on(table.hostname),
  ]
);
