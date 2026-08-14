import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db, schema } from "@dotads/db";
import { authMiddleware, requirePermission } from "../middleware/auth.ts";
import { eq, desc, count, sum } from "drizzle-orm";

export const platformRouter = new OpenAPIHono();

// Middleware guard: platform routes require SUPER_ADMIN
platformRouter.use("*", authMiddleware, requirePermission("*"));

// 1. List Tenants Route
export const listTenantsRoute = createRoute({
  method: "get",
  path: "/tenants",
  summary: "List all tenant stores",
  responses: {
    200: {
      description: "List of tenants",
      content: { "application/json": { schema: z.array(z.any()) } },
    },
  },
});

platformRouter.openapi(listTenantsRoute, async (c) => {
  const tenantsList = await db.select().from(schema.tenants).orderBy(desc(schema.tenants.createdAt));
  return c.json(tenantsList as any[], 200);
});

// 2. Platform Stats Route
export const getStatsRoute = createRoute({
  method: "get",
  path: "/stats",
  summary: "Get platform-wide fleet metrics",
  responses: {
    200: {
      description: "Fleet statistics",
      content: {
        "application/json": {
          schema: z.object({
            totalTenants: z.number(),
            activeTenants: z.number(),
            suspendedTenants: z.number(),
            totalGmv: z.number(),
            totalOrders: z.number(),
            securityAlertsCount: z.number(),
          }),
        },
      },
    },
  },
});

platformRouter.openapi(getStatsRoute, async (c) => {
  const allTenants = await db.select().from(schema.tenants);
  const activeCount = allTenants.filter((t) => t.status === "active").length;
  const suspendedCount = allTenants.filter((t) => t.status === "suspended").length;

  const ordersAggregate = await db
    .select({
      totalOrdersCount: count(schema.orders.id),
      totalGmvSum: sum(schema.orders.totalMinor),
    })
    .from(schema.orders);

  const totalOrders = Number(ordersAggregate[0]?.totalOrdersCount || 0);
  const totalGmv = Number(ordersAggregate[0]?.totalGmvSum || 0);

  return c.json(
    {
      totalTenants: allTenants.length,
      activeTenants: activeCount,
      suspendedTenants: suspendedCount,
      totalGmv,
      totalOrders,
      securityAlertsCount: 1,
    },
    200
  );
});

// 3. Create Tenant Route
export const createTenantRoute = createRoute({
  method: "post",
  path: "/tenants",
  summary: "Provision a new tenant store",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().min(2),
            slug: z.string().min(2),
            tier: z.enum(["STARTER", "PRO", "ENTERPRISE"]).default("PRO"),
            customDomain: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Tenant provisioned successfully",
      content: { "application/json": { schema: z.any() } },
    },
  },
});

platformRouter.openapi(createTenantRoute, async (c) => {
  const body = await c.req.json();
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      name: body.name,
      slug: body.slug,
      tier: body.tier || "PRO",
      customDomain: body.customDomain || null,
      status: "active",
    })
    .returning();

  // Insert audit log
  await db.insert(schema.auditLogs).values({
    tenantId: tenant.id,
    actorId: "superadmin_system",
    actorEmail: "superadmin@dotads.com",
    actorRole: "SUPER_ADMIN",
    action: "tenant.create",
    targetType: "tenant",
    targetId: tenant.id,
    metadataJson: { name: tenant.name, slug: tenant.slug, tier: tenant.tier },
  });

  return c.json(tenant, 201);
});

// 4. Mutate Tenant Status Route
export const mutateTenantStatusRoute = createRoute({
  method: "patch",
  path: "/tenants/{id}/status",
  summary: "Suspend or activate a tenant store",
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.enum(["active", "suspended", "cancelled"]),
            reason: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Tenant status updated",
      content: { "application/json": { schema: z.any() } },
    },
  },
});

platformRouter.openapi(mutateTenantStatusRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { status, reason } = await c.req.json();

  const [updated] = await db
    .update(schema.tenants)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(schema.tenants.id, id))
    .returning();

  // Audit log entry
  await db.insert(schema.auditLogs).values({
    tenantId: id,
    actorId: "superadmin_system",
    actorEmail: "superadmin@dotads.com",
    actorRole: "SUPER_ADMIN",
    action: `tenant.${status}`,
    targetType: "tenant",
    targetId: id,
    metadataJson: { status, reason: reason || "Manual operator action" },
  });

  return c.json(updated, 200);
});

// 5. Impersonate Tenant Route
export const impersonateTenantRoute = createRoute({
  method: "post",
  path: "/tenants/{id}/impersonate",
  summary: "Generate impersonation token for tenant support",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "Impersonation session established",
      content: {
        "application/json": {
          schema: z.object({
            impersonationToken: z.string(),
            targetTenantId: z.string(),
            expiresAt: z.string(),
          }),
        },
      },
    },
  },
});

platformRouter.openapi(impersonateTenantRoute, async (c) => {
  const { id } = c.req.valid("param");

  await db.insert(schema.auditLogs).values({
    tenantId: id,
    actorId: "superadmin_system",
    actorEmail: "superadmin@dotads.com",
    actorRole: "SUPER_ADMIN",
    action: "tenant.impersonate",
    targetType: "tenant",
    targetId: id,
    metadataJson: { mode: "SUPER_ADMIN_OPERATOR_IMPERSONATION" },
  });

  return c.json(
    {
      impersonationToken: `imp_${Date.now()}_${id}`,
      targetTenantId: id,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    },
    200
  );
});

// 6. Platform Audit Logs Route
export const getAuditLogsRoute = createRoute({
  method: "get",
  path: "/audit-logs",
  summary: "List platform audit logs",
  responses: {
    200: {
      description: "List of audit log entries",
      content: { "application/json": { schema: z.array(z.any()) } },
    },
  },
});

platformRouter.openapi(getAuditLogsRoute, async (c) => {
  const logs = await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(100);
  return c.json(logs as any[], 200);
});
