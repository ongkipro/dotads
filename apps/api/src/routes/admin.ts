import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db, schema } from "@dotads/db";
import { eq, and, desc, lte } from "drizzle-orm";
import { authMiddleware, type AppEnv } from "../middleware/auth.ts";
import { hasPermission } from "@dotads/auth";
import {
  CreateFormSchemaContract,
  CreateLandingPageContract,
} from "@dotads/contracts";

export const adminRouter = new OpenAPIHono<AppEnv>();

adminRouter.use("*", authMiddleware);

// Members endpoints
adminRouter.openapi(
  createRoute({
    method: "get",
    path: "/members",
    summary: "List organization members",
    responses: {
      200: {
        description: "List of members",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    if (!auth.organizationId) return c.json([], 200);
    const members = await db
      .select()
      .from(schema.members)
      .where(eq(schema.members.organizationId, auth.organizationId));
    return c.json(members, 200);
  }
);

adminRouter.openapi(
  createRoute({
    method: "post",
    path: "/members/invite",
    summary: "Invite member to organization",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              email: z.string().email(),
              role: z.enum(["ADMIN", "ADVERTISER", "CUSTOMER_SERVICE"]),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Invitation created",
        content: { "application/json": { schema: z.any() } },
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    if (!hasPermission(auth.role, "member:create")) {
      return c.json({ error: "Forbidden: Missing member:create permission" }, 403);
    }
    const body = await c.req.json();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const [invite] = await db
      .insert(schema.invitations)
      .values({
        id: crypto.randomUUID(),
        organizationId: auth.organizationId,
        email: body.email,
        role: body.role,
        inviterId: auth.userId,
        expiresAt,
      })
      .returning();

    return c.json(invite, 201);
  }
);

// Domains endpoints
adminRouter.openapi(
  createRoute({
    method: "get",
    path: "/domains",
    summary: "List custom domains",
    responses: {
      200: {
        description: "List of custom domains",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const domains = await db
      .select()
      .from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.tenantId, auth.tenantId));
    return c.json(domains, 200);
  }
);

adminRouter.openapi(
  createRoute({
    method: "post",
    path: "/domains",
    summary: "Add custom domain",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              hostname: z.string().min(3),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Domain added",
        content: { "application/json": { schema: z.any() } },
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    if (!hasPermission(auth.role, "tenant:update")) {
      return c.json({ error: "Forbidden: Missing tenant:update permission" }, 403);
    }
    const body = await c.req.json();

    const [domain] = await db
      .insert(schema.tenantDomains)
      .values({
        tenantId: auth.tenantId,
        hostname: body.hostname.toLowerCase().trim(),
        verificationToken: `txt_${Math.random().toString(36).slice(2)}`,
        status: "pending",
      })
      .returning();

    return c.json(domain, 201);
  }
);

// Audit logs endpoint
adminRouter.openapi(
  createRoute({
    method: "get",
    path: "/audit-logs",
    summary: "Get audit logs",
    responses: {
      200: {
        description: "Audit log history",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const logs = await db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.tenantId, auth.tenantId));
    return c.json(logs, 200);
  }
);

// Form Builder Endpoints
adminRouter.openapi(
  createRoute({
    method: "get",
    path: "/forms",
    summary: "List form schemas",
    responses: {
      200: {
        description: "List of tenant form schemas",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const forms = await db
      .select()
      .from(schema.formSchemas)
      .where(eq(schema.formSchemas.tenantId, auth.tenantId));
    return c.json(forms, 200);
  }
);

adminRouter.openapi(
  createRoute({
    method: "post",
    path: "/forms",
    summary: "Create form schema draft",
    request: {
      body: { content: { "application/json": { schema: CreateFormSchemaContract } } },
    },
    responses: {
      201: {
        description: "Form schema created",
        content: { "application/json": { schema: z.any() } },
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    if (!hasPermission(auth.role, "product:create")) {
      return c.json({ error: "Forbidden: Missing product:create permission" }, 403);
    }
    const body = await c.req.json();

    const [form] = await db
      .insert(schema.formSchemas)
      .values({
        tenantId: auth.tenantId,
        name: body.title,
        slug: body.slug,
        mode: body.mode,
        draftSchemaJson: body.schemaJson,
      })
      .returning();

    return c.json(form, 201);
  }
);

adminRouter.openapi(
  createRoute({
    method: "post",
    path: "/forms/{id}/publish",
    summary: "Publish form schema version",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Form version published",
        content: { "application/json": { schema: z.any() } },
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
      404: {
        description: "Form schema not found",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    if (!hasPermission(auth.role, "product:update")) {
      return c.json({ error: "Forbidden: Missing product:update permission" }, 403);
    }
    const formId = c.req.param("id");

    const [form] = await db
      .select()
      .from(schema.formSchemas)
      .where(and(eq(schema.formSchemas.id, formId), eq(schema.formSchemas.tenantId, auth.tenantId)));

    if (!form) return c.json({ error: "Form schema not found" }, 404);

    const nextVersion = (form.publishedVersion || 0) + 1;

    const [version] = await db
      .insert(schema.formSchemaVersions)
      .values({
        tenantId: auth.tenantId,
        formId: form.id,
        version: nextVersion,
        schemaJson: form.draftSchemaJson,
        publishedBy: auth.userEmail,
      })
      .returning();

    await db
      .update(schema.formSchemas)
      .set({ publishedVersion: nextVersion, updatedAt: new Date().toISOString() })
      .where(eq(schema.formSchemas.id, form.id));

    return c.json(version, 200);
  }
);

adminRouter.openapi(
  createRoute({
    method: "get",
    path: "/forms/{id}/versions",
    summary: "List form schema version history",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Version history",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const formId = c.req.param("id");

    const versions = await db
      .select()
      .from(schema.formSchemaVersions)
      .where(and(eq(schema.formSchemaVersions.formId, formId), eq(schema.formSchemaVersions.tenantId, auth.tenantId)))
      .orderBy(desc(schema.formSchemaVersions.version));

    return c.json(versions, 200);
  }
);

// Landing Page Builder Endpoints
adminRouter.openapi(
  createRoute({
    method: "get",
    path: "/pages",
    summary: "List landing pages",
    responses: {
      200: {
        description: "List of landing pages",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const pages = await db
      .select()
      .from(schema.landingPages)
      .where(eq(schema.landingPages.tenantId, auth.tenantId));
    return c.json(pages, 200);
  }
);

adminRouter.openapi(
  createRoute({
    method: "post",
    path: "/pages",
    summary: "Create landing page draft",
    request: {
      body: { content: { "application/json": { schema: CreateLandingPageContract } } },
    },
    responses: {
      201: {
        description: "Landing page created",
        content: { "application/json": { schema: z.any() } },
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    if (!hasPermission(auth.role, "product:create")) {
      return c.json({ error: "Forbidden: Missing product:create permission" }, 403);
    }
    const body = await c.req.json();

    const [page] = await db
      .insert(schema.landingPages)
      .values({
        tenantId: auth.tenantId,
        title: body.title,
        slug: body.slug,
        draftComponentsJson: body.pageJson.blocks,
        metaTitle: body.pageJson.seo?.title || body.title,
        metaDescription: body.pageJson.seo?.description || "",
        ogImage: body.pageJson.seo?.ogImage || "",
      })
      .returning();

    return c.json(page, 201);
  }
);

adminRouter.openapi(
  createRoute({
    method: "post",
    path: "/pages/{id}/publish",
    summary: "Publish landing page version",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Landing page version published",
        content: { "application/json": { schema: z.any() } },
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
      404: {
        description: "Landing page not found",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    if (!hasPermission(auth.role, "product:update")) {
      return c.json({ error: "Forbidden: Missing product:update permission" }, 403);
    }
    const pageId = c.req.param("id");

    const [page] = await db
      .select()
      .from(schema.landingPages)
      .where(and(eq(schema.landingPages.id, pageId), eq(schema.landingPages.tenantId, auth.tenantId)));

    if (!page) return c.json({ error: "Landing page not found" }, 404);

    const nextVersion = (page.publishedVersion || 0) + 1;

    const [version] = await db
      .insert(schema.landingPageVersions)
      .values({
        tenantId: auth.tenantId,
        pageId: page.id,
        version: nextVersion,
        componentsJson: page.draftComponentsJson,
        publishedBy: auth.userEmail,
      })
      .returning();

    await db
      .update(schema.landingPages)
      .set({
        publishedVersion: nextVersion,
        status: "published",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.landingPages.id, page.id));

    return c.json(version, 200);
  }
);

adminRouter.openapi(
  createRoute({
    method: "get",
    path: "/pages/{id}/versions",
    summary: "List landing page version history",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Version history",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const pageId = c.req.param("id");

    const versions = await db
      .select()
      .from(schema.landingPageVersions)
      .where(and(eq(schema.landingPageVersions.pageId, pageId), eq(schema.landingPageVersions.tenantId, auth.tenantId)))
      .orderBy(desc(schema.landingPageVersions.version));

    return c.json(versions, 200);
  }
);
// List Admin Orders
adminRouter.openapi(
  createRoute({
    method: "get",
    path: "/orders",
    summary: "List tenant merchant orders",
    responses: {
      200: {
        description: "List of orders",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const ordersList = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.tenantId, auth.tenantId))
      .orderBy(desc(schema.orders.createdAt));

    return c.json(ordersList, 200);
  }
);

// Stale & Abandoned Order Cleanup Cron Endpoint (Orders > 7 Days)
adminRouter.openapi(
  createRoute({
    method: "delete",
    path: "/orders/cleanup",
    summary: "Purge unpaid and abandoned orders older than 7 days",
    responses: {
      200: {
        description: "Stale orders cleanup result",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              purgedCount: z.number(),
              message: z.string(),
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const staleOrders = await db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.tenantId, auth.tenantId),
          lte(schema.orders.createdAt, sevenDaysAgo)
        )
      );

    const staleIds = staleOrders.map((o) => o.id);
    if (staleIds.length === 0) {
      return c.json({ success: true, purgedCount: 0, message: "Tidak ada pesanan usang untuk dibersihkan." }, 200);
    }

    for (const orderId of staleIds) {
      await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
      await db.delete(schema.outboxEvents).where(eq(schema.outboxEvents.eventId, `purchase_${orderId}`));
      await db.delete(schema.orders).where(eq(schema.orders.id, orderId));
    }

    return c.json({
      success: true,
      purgedCount: staleIds.length,
      message: `Berhasil membersihkan ${staleIds.length} pesanan usang (> 7 hari).`,
    }, 200);
  }
);

// Delete Single Order
adminRouter.openapi(
  createRoute({
    method: "delete",
    path: "/orders/{id}",
    summary: "Delete single merchant order",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: {
        description: "Order deleted successfully",
        content: { "application/json": { schema: z.object({ success: z.boolean() }) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const orderId = c.req.param("id");

    await db.delete(schema.orderItems).where(and(eq(schema.orderItems.tenantId, auth.tenantId), eq(schema.orderItems.orderId, orderId)));
    await db.delete(schema.orders).where(and(eq(schema.orders.tenantId, auth.tenantId), eq(schema.orders.id, orderId)));

    return c.json({ success: true }, 200);
  }
);

// Bulk Delete Merchant Orders
adminRouter.openapi(
  createRoute({
    method: "post",
    path: "/orders/bulk-delete",
    summary: "Bulk delete merchant orders",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({ orderIds: z.array(z.string()) }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Bulk order deletion result",
        content: {
          "application/json": {
            schema: z.object({ success: z.boolean(), deletedCount: z.number() }),
          },
        },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const body = await c.req.json();
    const orderIds = body.orderIds || [];

    for (const orderId of orderIds) {
      await db.delete(schema.orderItems).where(and(eq(schema.orderItems.tenantId, auth.tenantId), eq(schema.orderItems.orderId, orderId)));
      await db.delete(schema.orders).where(and(eq(schema.orders.tenantId, auth.tenantId), eq(schema.orders.id, orderId)));
    }

    return c.json({ success: true, deletedCount: orderIds.length }, 200);
  }
);
