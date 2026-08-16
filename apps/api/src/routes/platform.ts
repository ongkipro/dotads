import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db, schema } from "@dotads/db";
import { authMiddleware, requirePermission, type AppEnv } from "../middleware/auth.ts";
import { and, eq, desc, count, sum, sql, type SQL } from "drizzle-orm";

export const platformRouter = new OpenAPIHono<AppEnv>();

// Middleware guard: platform routes require SUPER_ADMIN
platformRouter.use("*", authMiddleware, requirePermission("*"));

const TenantStatusSchema = z.enum(["active", "suspended", "cancelled"]);
const TenantResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  status: TenantStatusSchema,
  tier: z.string().min(1).max(50),
  customDomain: z.string().max(255).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
const tenantSelection = {
  id: schema.tenants.id,
  name: schema.tenants.name,
  slug: schema.tenants.slug,
  status: schema.tenants.status,
  tier: schema.tenants.tier,
  customDomain: schema.tenants.customDomain,
  createdAt: schema.tenants.createdAt,
  updatedAt: schema.tenants.updatedAt,
};
const serializeTenant = (tenant: unknown) => TenantResponseSchema.parse(tenant);
const AuditLogResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().nullable(),
  actorId: z.string().max(255),
  actorEmail: z.string().email().max(255),
  actorRole: z.string().max(50),
  action: z.string().max(100),
  targetType: z.string().max(50),
  targetId: z.string().max(255),
  createdAt: z.string(),
});

// 1. List Tenants Route
export const listTenantsRoute = createRoute({
  method: "get",
  path: "/tenants",
  summary: "List all tenant stores",
  responses: {
    200: {
      description: "List of tenants",
      content: { "application/json": { schema: z.array(TenantResponseSchema) } },
    },
  },
});

platformRouter.openapi(listTenantsRoute, async (c) => {
  const tenantsList = await db.select(tenantSelection).from(schema.tenants).orderBy(desc(schema.tenants.createdAt));
  return c.json(tenantsList.map(serializeTenant), 200);
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
            securityAlertsCount: z.null().describe("Unavailable until audit records have a defined security severity/classification"),
          }),
        },
      },
    },
  },
});

platformRouter.openapi(getStatsRoute, async (c) => {
  const [tenantAggregate] = await db.select({
    totalTenants: count(schema.tenants.id),
    activeTenants: sql<number>`count(*) filter (where ${schema.tenants.status} = 'active')`,
    suspendedTenants: sql<number>`count(*) filter (where ${schema.tenants.status} = 'suspended')`,
  }).from(schema.tenants);

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
      totalTenants: Number(tenantAggregate?.totalTenants || 0),
      activeTenants: Number(tenantAggregate?.activeTenants || 0),
      suspendedTenants: Number(tenantAggregate?.suspendedTenants || 0),
      totalGmv,
      totalOrders,
      securityAlertsCount: null,
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
      content: { "application/json": { schema: TenantResponseSchema } },
    },
  },
});

platformRouter.openapi(createTenantRoute, async (c) => {
  const body = c.req.valid("json");
  const actor = c.get("auth");
  const tenant = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(schema.tenants)
      .values({
        name: body.name,
        slug: body.slug,
        tier: body.tier || "PRO",
        customDomain: body.customDomain || null,
        status: "active",
      })
      .returning();

    await tx.insert(schema.auditLogs).values({
      tenantId: created.id,
      actorId: actor.userId,
      actorEmail: actor.userEmail,
      actorRole: actor.role,
      action: "tenant.create",
      targetType: "tenant",
      targetId: created.id,
      metadataJson: { name: created.name, slug: created.slug, tier: created.tier },
    });
    return created;
  });

  return c.json(serializeTenant(tenant), 201);
});

// 4. Mutate Tenant Status Route
export const mutateTenantStatusRoute = createRoute({
  method: "patch",
  path: "/tenants/{id}/status",
  summary: "Suspend or activate a tenant store",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.enum(["active", "suspended", "cancelled"]),
            reason: z.string().trim().min(3).max(500),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Tenant status updated",
      content: { "application/json": { schema: TenantResponseSchema } },
    },
    404: {
      description: "Tenant not found",
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
    },
  },
});

platformRouter.openapi(mutateTenantStatusRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { status, reason } = c.req.valid("json");
  const actor = c.get("auth");

  const updated = await db.transaction(async (tx) => {
    const [tenant] = await tx
      .update(schema.tenants)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(schema.tenants.id, id))
      .returning();
    if (!tenant) return null;

    await tx.insert(schema.auditLogs).values({
      tenantId: id,
      actorId: actor.userId,
      actorEmail: actor.userEmail,
      actorRole: actor.role,
      action: `tenant.${status}`,
      targetType: "tenant",
      targetId: id,
      metadataJson: { status, reason },
    });
    return tenant;
  });

  if (!updated) return c.json({ error: "Tenant not found" }, 404);

  return c.json(serializeTenant(updated), 200);
});

// 5. Impersonate Tenant Route
export const impersonateTenantRoute = createRoute({
  method: "post",
  path: "/tenants/{id}/impersonate",
  summary: "Generate impersonation token for tenant support",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ reason: z.string().trim().min(10).max(500) }),
        },
      },
    },
  },
  responses: {
    501: {
      description: "Impersonation is disabled until signed scoped sessions are implemented",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    404: {
      description: "Tenant not found",
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
    },
  },
});

platformRouter.openapi(impersonateTenantRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { reason } = c.req.valid("json");
  const actor = c.get("auth");

  const [tenant] = await db.select({ id: schema.tenants.id }).from(schema.tenants).where(eq(schema.tenants.id, id));
  if (!tenant) return c.json({ error: "Tenant not found" }, 404);

  await db.insert(schema.auditLogs).values({
    tenantId: id,
    actorId: actor.userId,
    actorEmail: actor.userEmail,
    actorRole: actor.role,
    action: "tenant.impersonation.denied_unavailable",
    targetType: "tenant",
    targetId: id,
    metadataJson: { reason },
  });

  return c.json({ error: "Impersonation is disabled until signed scoped sessions are implemented" }, 501);
});

// 6. Platform Audit Logs Route
export const getAuditLogsRoute = createRoute({
  method: "get",
  path: "/audit-logs",
  summary: "List platform audit logs",
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).default(25),
      offset: z.coerce.number().int().min(0).max(10_000).default(0),
      tenantId: z.string().uuid().optional(),
      action: z.string().trim().min(1).max(100).optional(),
      actorId: z.string().trim().min(1).max(255).optional(),
    }),
  },
  responses: {
    200: {
      description: "List of audit log entries",
      content: { "application/json": { schema: z.object({
        items: z.array(AuditLogResponseSchema),
        pagination: z.object({
          limit: z.number().int().min(1).max(100),
          offset: z.number().int().min(0).max(10_000),
          total: z.number().int().nonnegative(),
        }),
      }) } },
    },
  },
});

platformRouter.openapi(getAuditLogsRoute, async (c) => {
  const { limit, offset, tenantId, action, actorId } = c.req.valid("query");
  const filters: SQL[] = [];
  if (tenantId) filters.push(eq(schema.auditLogs.tenantId, tenantId));
  if (action) filters.push(eq(schema.auditLogs.action, action));
  if (actorId) filters.push(eq(schema.auditLogs.actorId, actorId));
  const where = filters.length > 0 ? and(...filters) : undefined;
  const selection = {
    id: schema.auditLogs.id,
    tenantId: schema.auditLogs.tenantId,
    actorId: schema.auditLogs.actorId,
    actorEmail: schema.auditLogs.actorEmail,
    actorRole: schema.auditLogs.actorRole,
    action: schema.auditLogs.action,
    targetType: schema.auditLogs.targetType,
    targetId: schema.auditLogs.targetId,
    createdAt: schema.auditLogs.createdAt,
  };
  const items = await db.select(selection).from(schema.auditLogs)
    .where(where)
    .orderBy(desc(schema.auditLogs.createdAt), desc(schema.auditLogs.id))
    .limit(limit)
    .offset(offset);
  const [aggregate] = await db.select({ total: count(schema.auditLogs.id) }).from(schema.auditLogs).where(where);
  return c.json({ items, pagination: { limit, offset, total: Number(aggregate?.total || 0) } }, 200);
});
