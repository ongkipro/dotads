import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.ts";

export const formSchemas = pgTable(
  "form_schemas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    mode: varchar("mode", { length: 20 }).notNull().default("hybrid"), // hybrid, full, mini
    publishedVersion: integer("published_version").default(0),
    draftSchemaJson: jsonb("draft_schema_json").notNull().default({}),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_forms_tenant").on(table.tenantId),
    uniqueIndex("uniq_tenant_form_slug").on(table.tenantId, table.slug),
  ]
);

export const formSchemaVersions = pgTable(
  "form_schema_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    formId: uuid("form_id").notNull().references(() => formSchemas.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    schemaJson: jsonb("schema_json").notNull(),
    publishedBy: text("published_by").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_form_versions_tenant").on(table.tenantId),
    index("idx_form_versions_form").on(table.formId),
    uniqueIndex("uniq_form_version").on(table.formId, table.version),
  ]
);

export const landingPages = pgTable(
  "landing_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, published, archived
    publishedVersion: integer("published_version").default(0),
    draftComponentsJson: jsonb("draft_components_json").notNull().default([]),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    ogImage: text("og_image"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_pages_tenant").on(table.tenantId),
    uniqueIndex("uniq_tenant_page_slug").on(table.tenantId, table.slug),
  ]
);

export const landingPageVersions = pgTable(
  "landing_page_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    pageId: uuid("page_id").notNull().references(() => landingPages.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    componentsJson: jsonb("components_json").notNull(),
    publishedBy: text("published_by").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_page_versions_tenant").on(table.tenantId),
    index("idx_page_versions_page").on(table.pageId),
    uniqueIndex("uniq_page_version").on(table.pageId, table.version),
  ]
);

export const draftLeads = pgTable(
  "draft_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    customerName: varchar("customer_name", { length: 255 }),
    customerPhone: varchar("customer_phone", { length: 50 }),
    draftDataJson: jsonb("draft_data_json").notNull().default({}),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_draft_leads_tenant").on(table.tenantId),
    index("idx_draft_leads_phone").on(table.customerPhone),
  ]
);
