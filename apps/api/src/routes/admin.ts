import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db, schema } from "@dotads/db";
import { eq, and, asc, desc, lte, gte, count, or, sql, isNull, inArray, type SQL } from "drizzle-orm";
import { authMiddleware, type AppEnv, type AuthContext } from "../middleware/auth.ts";
import { hasPermission } from "@dotads/auth";
import {
  CreateFormSchemaContract,
  CreateLandingPageContract,
} from "@dotads/contracts";

export const adminRouter = new OpenAPIHono<AppEnv>();

function auditEntry(
  auth: AuthContext,
  action: string,
  targetType: string,
  targetId: string,
  metadataJson: Record<string, unknown> = {}
) {
  return {
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorEmail: auth.userEmail,
    actorRole: auth.role,
    action,
    targetType,
    targetId,
    metadataJson,
  };
}

adminRouter.use("*", authMiddleware);

export function requiredAdminPermission(method: string, path: string): string | undefined {
  const routePath = path.replace(/^\/api\/v1\/admin/, "");

  if (method === "GET" && routePath === "/members") return "members:read";
  if (method === "POST" && routePath === "/members/invite") return "members:create";
  if (method === "GET" && routePath === "/domains") return "tenant:update";
  if (method === "POST" && routePath === "/domains") return "tenant:update";
  if (method === "GET" && routePath === "/audit-logs") return "tenant:read";
  if (method === "GET" && /^\/forms(?:\/[^/]+\/versions)?$/.test(routePath)) return "builders:read";
  if (method === "POST" && routePath === "/forms") return "builders:update";
  if (method === "POST" && /^\/forms\/[^/]+\/publish$/.test(routePath)) return "builders:update";
  if (method === "GET" && /^\/pages(?:\/[^/]+\/versions)?$/.test(routePath)) return "builders:read";
  if (method === "POST" && routePath === "/pages") return "builders:update";
  if (method === "POST" && /^\/pages\/[^/]+\/publish$/.test(routePath)) return "builders:update";
  if (method === "GET" && routePath === "/orders") return "orders:read";
  if (method === "GET" && /^\/orders\/[^/]+$/.test(routePath)) return "orders:read";
  if (method === "POST" && /^\/orders\/[^/]+\/dispatch$/.test(routePath)) return "orders:update";
  if (method === "POST" && /^\/orders\/[^/]+\/transitions$/.test(routePath)) return "orders:update";
  if (method === "DELETE" && routePath === "/orders/cleanup") return "orders:delete";
  if (method === "DELETE" && /^\/orders\/[^/]+$/.test(routePath)) return "orders:delete";
  if (method === "POST" && routePath === "/orders/bulk-delete") return "orders:delete";

  return undefined;
}

adminRouter.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") return next();

  const permission = requiredAdminPermission(c.req.method, c.req.path);
  if (!permission) {
    return c.json({ error: "Forbidden: Admin route has no authorization policy" }, 403);
  }

  const auth = c.get("auth");
  if (!hasPermission(auth.role, permission)) {
    return c.json({ error: `Forbidden: Missing ${permission} permission` }, 403);
  }

  return next();
});

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
    const body = c.req.valid("json");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(schema.invitations)
        .values({
          id: crypto.randomUUID(),
          organizationId: auth.organizationId,
          email: body.email.toLowerCase(),
          role: body.role,
          inviterId: auth.userId,
          expiresAt,
        })
        .returning();
      await tx.insert(schema.auditLogs).values(
        auditEntry(auth, "member.invite", "invitation", created.id, { email: created.email, role: created.role })
      );
      return created;
    });

    return c.json(invite, 201);
  }
);

const TENANT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DomainStatusSchema = z.enum(["pending", "verified", "failed"]);
const DomainVerificationSchema = z.object({
  record: z.object({
    type: z.literal("TXT"),
    name: z.literal("_dotads-challenge"),
    value: z.string().min(1).max(255),
  }).strict(),
  automatedCheck: z.literal("unavailable"),
}).strict();
const DomainItemSchema = z.object({
  id: z.string().uuid(),
  hostname: z.string().min(3).max(253),
  isPrimary: z.boolean(),
  status: DomainStatusSchema,
  verification: DomainVerificationSchema.nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
}).strict();
const DomainPageSchema = z.object({
  items: z.array(DomainItemSchema).max(100),
  pagination: z.object({
    limit: z.number().int().min(1).max(100),
    offset: z.number().int().min(0).max(10_000),
    total: z.number().int().safe().nonnegative(),
  }).strict(),
}).strict();
const DomainErrorSchema = z.object({ error: z.string() }).strict();
const DomainWorkspaceSelectionErrorSchema = z.object({
  error: z.literal("Workspace selection required"),
  code: z.literal("WORKSPACE_SELECTION_REQUIRED"),
  workspaceSelectionRequired: z.literal(true),
}).strict();
const DomainQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
}).strict();
const DomainHostnameInputSchema = z.string().trim().min(3).max(254)
  .regex(/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}\.?$/);

function normalizeDomainHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

function serializeDomain(domain: typeof schema.tenantDomains.$inferSelect) {
  const status = domain.status === "verified" || domain.status === "failed" ? domain.status : "pending";
  return DomainItemSchema.parse({
    id: domain.id,
    hostname: domain.hostname,
    isPrimary: domain.isPrimary,
    status,
    verification: status === "verified" ? null : {
      record: { type: "TXT", name: "_dotads-challenge", value: domain.verificationToken },
      automatedCheck: "unavailable",
    },
    createdAt: isoInstant(domain.createdAt),
    updatedAt: isoInstant(domain.updatedAt),
  });
}

function isUniqueViolation(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 4 && typeof current === "object" && current !== null; depth++) {
    if ("code" in current && current.code === "23505") return true;
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}

// Domain governance is intentionally limited to registration and manual DNS instructions.
adminRouter.openapi(
  createRoute({
    method: "get",
    path: "/domains",
    operationId: "listTenantDomains",
    tags: ["Tenant domains"],
    summary: "List registered tenant domains",
    request: { query: DomainQuerySchema },
    responses: {
      200: {
        description: "Registered tenant domains",
        content: { "application/json": { schema: DomainPageSchema } },
      },
      400: { description: "Invalid domain query", content: { "application/json": { schema: DomainErrorSchema } } },
      401: { description: "Unauthenticated", content: { "application/json": { schema: DomainErrorSchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: DomainErrorSchema } } },
      409: { description: "Workspace selection required", content: { "application/json": { schema: DomainWorkspaceSelectionErrorSchema } } },
      500: { description: "Internal server error", content: { "application/json": { schema: DomainErrorSchema } } },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    if (auth.role !== "TENANT_OWNER" || !TENANT_ID_PATTERN.test(auth.tenantId)) {
      return c.json({ error: "Forbidden: Tenant owner context required" }, 403);
    }
    const query = c.req.valid("query");
    const result = await db.transaction(async (tx) => {
      const items = await tx.select().from(schema.tenantDomains)
        .where(eq(schema.tenantDomains.tenantId, auth.tenantId))
        .orderBy(asc(schema.tenantDomains.hostname), asc(schema.tenantDomains.id))
        .limit(query.limit).offset(query.offset);
      const [aggregate] = await tx.select({ total: count(schema.tenantDomains.id) })
        .from(schema.tenantDomains).where(eq(schema.tenantDomains.tenantId, auth.tenantId));
      return { items, total: Number(aggregate?.total ?? 0) };
    });
    return c.json(DomainPageSchema.parse({
      items: result.items.map(serializeDomain),
      pagination: { limit: query.limit, offset: query.offset, total: result.total },
    }), 200);
  },
  (result, c) => {
    if (!result.success) return c.json({ error: "Invalid domain query" }, 400);
  }
);

adminRouter.openapi(
  createRoute({
    method: "post",
    path: "/domains",
    operationId: "createTenantDomain",
    tags: ["Tenant domains"],
    summary: "Register a tenant domain for manual DNS verification",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({ hostname: DomainHostnameInputSchema }).strict(),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Domain registered with manual TXT instructions",
        content: { "application/json": { schema: DomainItemSchema } },
      },
      400: { description: "Invalid domain registration", content: { "application/json": { schema: DomainErrorSchema } } },
      401: { description: "Unauthenticated", content: { "application/json": { schema: DomainErrorSchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: DomainErrorSchema } } },
      409: { description: "Domain already registered or workspace selection required", content: { "application/json": { schema: z.union([DomainErrorSchema, DomainWorkspaceSelectionErrorSchema]) } } },
      500: { description: "Internal server error", content: { "application/json": { schema: DomainErrorSchema } } },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    if (auth.role !== "TENANT_OWNER" || !TENANT_ID_PATTERN.test(auth.tenantId)) {
      return c.json({ error: "Forbidden: Tenant owner context required" }, 403);
    }
    const body = c.req.valid("json");
    const hostname = normalizeDomainHostname(body.hostname);

    try {
      const domain = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(schema.tenantDomains)
          .values({
            tenantId: auth.tenantId,
            hostname,
            verificationToken: `txt_${crypto.randomUUID().replaceAll("-", "")}`,
            status: "pending",
          })
          .returning();
        await tx.insert(schema.auditLogs).values(
          auditEntry(auth, "domain.create", "tenant_domain", created.id, { hostname: created.hostname })
        );
        return created;
      });

      return c.json(serializeDomain(domain), 201);
    } catch (error) {
      if (isUniqueViolation(error)) return c.json({ error: "Domain is already registered" }, 409);
      throw error;
    }
  },
  (result, c) => {
    if (!result.success) return c.json({ error: "Invalid domain registration" }, 400);
  }
);

const AuditLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
  q: z.string().trim().min(1).max(100).optional(),
  action: z.string().trim().min(1).max(100).optional(),
  days: z.enum(["7", "30"]).optional(),
}).strict();
const AuditLogItemSchema = z.object({
  id: z.string().uuid(),
  action: z.string().min(1).max(100),
  actor: z.object({
    email: z.string().email().max(255),
    role: z.string().min(1).max(50),
  }).strict(),
  target: z.object({
    type: z.string().min(1).max(50),
    id: z.string().min(1).max(500),
  }).strict(),
  createdAt: z.string().datetime({ offset: true }),
}).strict();
const AuditLogPageSchema = z.object({
  items: z.array(AuditLogItemSchema).max(100),
  pagination: z.object({
    limit: z.number().int().min(1).max(100),
    offset: z.number().int().min(0).max(10_000),
    total: z.number().int().safe().nonnegative(),
  }).strict(),
  filters: z.object({
    actions: z.array(z.string().min(1).max(100)).max(100),
  }).strict(),
}).strict();
const AdminErrorSchema = z.object({ error: z.string() }).strict();
const AdminWorkspaceSelectionErrorSchema = z.object({
  error: z.literal("Workspace selection required"),
  code: z.literal("WORKSPACE_SELECTION_REQUIRED"),
  workspaceSelectionRequired: z.literal(true),
}).strict();
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

// Tenant audit history is read-only, bounded, and omits arbitrary metadata and request fingerprints.
adminRouter.openapi(
  createRoute({
    method: "get",
    path: "/audit-logs",
    operationId: "listTenantAuditLogs",
    tags: ["Tenant audit"],
    summary: "List bounded tenant audit history",
    request: { query: AuditLogQuerySchema },
    responses: {
      200: {
        description: "Newest tenant audit events",
        content: { "application/json": { schema: AuditLogPageSchema } },
      },
      400: { description: "Invalid audit query", content: { "application/json": { schema: AdminErrorSchema } } },
      401: { description: "Unauthenticated", content: { "application/json": { schema: AdminErrorSchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: AdminErrorSchema } } },
      409: { description: "Workspace selection required", content: { "application/json": { schema: AdminWorkspaceSelectionErrorSchema } } },
      500: { description: "Internal server error", content: { "application/json": { schema: AdminErrorSchema } } },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    if (auth.role === "SUPER_ADMIN" || !TENANT_ID_PATTERN.test(auth.tenantId)) {
      return c.json({ error: "Forbidden: Active tenant context required" }, 403);
    }
    const query = c.req.valid("query");
    const filters: SQL[] = [eq(schema.auditLogs.tenantId, auth.tenantId)];
    if (query.action) filters.push(eq(schema.auditLogs.action, query.action));
    if (query.days) {
      filters.push(gte(schema.auditLogs.createdAt, new Date(Date.now() - Number(query.days) * 86_400_000).toISOString()));
    }
    if (query.q) {
      const pattern = `%${escapeLikePattern(query.q)}%`;
      filters.push(or(
        sql`${schema.auditLogs.action} ILIKE ${pattern} ESCAPE '\\'`,
        sql`${schema.auditLogs.actorEmail} ILIKE ${pattern} ESCAPE '\\'`,
        sql`${schema.auditLogs.targetType} ILIKE ${pattern} ESCAPE '\\'`,
        sql`${schema.auditLogs.targetId} ILIKE ${pattern} ESCAPE '\\'`
      )!);
    }
    const where = and(...filters);
    const result = await db.transaction(async (tx) => {
      const items = await tx.select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        actorEmail: schema.auditLogs.actorEmail,
        actorRole: schema.auditLogs.actorRole,
        targetType: schema.auditLogs.targetType,
        targetId: schema.auditLogs.targetId,
        createdAt: schema.auditLogs.createdAt,
      }).from(schema.auditLogs).where(where)
        .orderBy(desc(schema.auditLogs.createdAt), desc(schema.auditLogs.id))
        .limit(query.limit).offset(query.offset);
      const [aggregate] = await tx.select({ total: count(schema.auditLogs.id) })
        .from(schema.auditLogs).where(where);
      const actions = await tx.selectDistinct({ action: schema.auditLogs.action })
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.tenantId, auth.tenantId))
        .orderBy(asc(schema.auditLogs.action))
        .limit(100);
      return { items, total: Number(aggregate?.total ?? 0), actions };
    });

    return c.json(AuditLogPageSchema.parse({
      items: result.items.map((item) => ({
        id: item.id,
        action: item.action,
        actor: { email: item.actorEmail, role: item.actorRole },
        target: { type: item.targetType, id: item.targetId },
        createdAt: isoInstant(item.createdAt),
      })),
      pagination: { limit: query.limit, offset: query.offset, total: result.total },
      filters: { actions: result.actions.map((item) => item.action) },
    }), 200);
  },
  (result, c) => {
    if (!result.success) return c.json({ error: "Invalid audit query" }, 400);
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
    const body = c.req.valid("json");

    const form = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(schema.formSchemas)
        .values({
          tenantId: auth.tenantId,
          name: body.title,
          slug: body.slug,
          mode: body.mode,
          draftSchemaJson: body.schemaJson,
        })
        .returning();
      await tx.insert(schema.auditLogs).values(
        auditEntry(auth, "form.create", "form_schema", created.id, { slug: created.slug, mode: created.mode })
      );
      return created;
    });

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
    const formId = c.req.param("id");

    const [form] = await db
      .select()
      .from(schema.formSchemas)
      .where(and(eq(schema.formSchemas.id, formId), eq(schema.formSchemas.tenantId, auth.tenantId)));

    if (!form) return c.json({ error: "Form schema not found" }, 404);

    const nextVersion = (form.publishedVersion || 0) + 1;

    const version = await db.transaction(async (tx) => {
      const [published] = await tx
        .insert(schema.formSchemaVersions)
        .values({
          tenantId: auth.tenantId,
          formId: form.id,
          version: nextVersion,
          schemaJson: form.draftSchemaJson,
          publishedBy: auth.userEmail,
        })
        .returning();
      await tx
        .update(schema.formSchemas)
        .set({ publishedVersion: nextVersion, updatedAt: new Date().toISOString() })
        .where(and(eq(schema.formSchemas.id, form.id), eq(schema.formSchemas.tenantId, auth.tenantId)));
      await tx.insert(schema.auditLogs).values(
        auditEntry(auth, "form.publish", "form_schema", form.id, { version: nextVersion })
      );
      return published;
    });

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
    const body = c.req.valid("json");

    const page = await db.transaction(async (tx) => {
      const [created] = await tx
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
      await tx.insert(schema.auditLogs).values(
        auditEntry(auth, "page.create", "landing_page", created.id, { slug: created.slug })
      );
      return created;
    });

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
    const pageId = c.req.param("id");

    const [page] = await db
      .select()
      .from(schema.landingPages)
      .where(and(eq(schema.landingPages.id, pageId), eq(schema.landingPages.tenantId, auth.tenantId)));

    if (!page) return c.json({ error: "Landing page not found" }, 404);

    const nextVersion = (page.publishedVersion || 0) + 1;

    const version = await db.transaction(async (tx) => {
      const [published] = await tx
        .insert(schema.landingPageVersions)
        .values({
          tenantId: auth.tenantId,
          pageId: page.id,
          version: nextVersion,
          componentsJson: page.draftComponentsJson,
          publishedBy: auth.userEmail,
        })
        .returning();
      await tx
        .update(schema.landingPages)
        .set({
          publishedVersion: nextVersion,
          status: "published",
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(schema.landingPages.id, page.id), eq(schema.landingPages.tenantId, auth.tenantId)));
      await tx.insert(schema.auditLogs).values(
        auditEntry(auth, "page.publish", "landing_page", page.id, { version: nextVersion })
      );
      return published;
    });

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
const OrderStatusSchema = z.enum(["PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]);
const PaymentStatusSchema = z.enum(["UNPAID", "PAID", "REFUNDED", "FAILED"]);
const FulfillmentStatusSchema = z.enum(["UNFULFILLED", "PICKUP_REQUESTED", "IN_TRANSIT", "DELIVERED", "RETURNED", "FAILED"]);
const DispatchStatusSchema = z.enum(["pending", "processing", "completed", "failed", "dlq"]);
const InstantSchema = z.string().datetime({ offset: true });
const OrderSummarySchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string().max(50),
  status: OrderStatusSchema,
  paymentStatus: PaymentStatusSchema,
  fulfillmentStatus: FulfillmentStatusSchema,
  currency: z.literal("IDR"),
  paymentMethod: z.string().max(30),
  customerName: z.string().max(255),
  customerPhone: z.string().max(50),
  totalMinor: z.number().int().nonnegative(),
  cnoteNo: z.string().max(100).nullable(),
  courierCode: z.string().max(50).nullable(),
  courierService: z.string().max(50).nullable(),
  rtsRiskScore: z.number().int().min(0).max(100).nullable(),
  createdAt: InstantSchema,
  updatedAt: InstantSchema,
});
const OrderItemResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid().nullable(),
  variantId: z.string().uuid().nullable(),
  productName: z.string().max(255),
  variantTitle: z.string().max(255).nullable(),
  sku: z.string().max(100).nullable(),
  priceMinor: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  subtotalMinor: z.number().int().nonnegative(),
});
const OrderEventResponseSchema = z.object({
  id: z.string().uuid(),
  event: z.string().max(50),
  actor: z.string().max(255),
  createdAt: InstantSchema,
});
const DispatchResponseSchema = z.object({
  id: z.string().uuid(),
  status: DispatchStatusSchema,
  attempts: z.number().int().nonnegative(),
  nextRetryAt: InstantSchema.nullable(),
  createdAt: InstantSchema,
  updatedAt: InstantSchema,
});
const OrderDetailSchema = OrderSummarySchema.extend({
  shippingAddress: z.string().max(5_000),
  customerEmail: z.string().email().max(255).nullable(),
  subdistrictId: z.string().max(50).nullable(),
  subdistrictName: z.string().max(255).nullable(),
  cityName: z.string().max(255).nullable(),
  provinceName: z.string().max(255).nullable(),
  postalCode: z.string().max(20).nullable(),
  subtotalMinor: z.number().int().nonnegative(),
  shippingCostMinor: z.number().int().nonnegative(),
  discountMinor: z.number().int().nonnegative(),
  notes: z.string().max(5_000).nullable(),
  items: z.array(OrderItemResponseSchema),
  events: z.array(OrderEventResponseSchema),
  dispatch: DispatchResponseSchema.nullable(),
});
const orderSelection = {
  id: schema.orders.id,
  orderNumber: schema.orders.orderNumber,
  status: schema.orders.status,
  paymentStatus: schema.orders.paymentStatus,
  fulfillmentStatus: schema.orders.fulfillmentStatus,
  paymentMethod: schema.orders.paymentMethod,
  customerName: schema.orders.customerName,
  customerPhone: schema.orders.customerPhone,
  totalMinor: schema.orders.totalMinor,
  cnoteNo: schema.orders.cnoteNo,
  courierCode: schema.orders.courierCode,
  courierService: schema.orders.courierService,
  rtsRiskScore: schema.orders.rtsRiskScore,
  createdAt: schema.orders.createdAt,
  updatedAt: schema.orders.updatedAt,
};

function isoInstant(value: string | Date | null): string | null {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value.replace(" ", "T")}Z`;
  return new Date(normalized).toISOString();
}

function serializeOrderSummary(order: typeof schema.orders.$inferSelect) {
  return OrderSummarySchema.parse({
    ...order,
    currency: "IDR",
    createdAt: isoInstant(order.createdAt),
    updatedAt: isoInstant(order.updatedAt),
  });
}

function serializeDispatch(dispatch: typeof schema.mengantarDispatchQueue.$inferSelect) {
  return DispatchResponseSchema.parse({
    ...dispatch,
    nextRetryAt: isoInstant(dispatch.nextRetryAt),
    createdAt: isoInstant(dispatch.createdAt),
    updatedAt: isoInstant(dispatch.updatedAt),
  });
}

adminRouter.openapi(
  createRoute({
    method: "get",
    path: "/orders",
    summary: "List tenant merchant orders",
    request: {
      query: z.object({
        limit: z.coerce.number().int().min(1).max(100).default(25),
        offset: z.coerce.number().int().min(0).max(10_000).default(0),
        status: OrderStatusSchema.optional(),
        paymentStatus: PaymentStatusSchema.optional(),
        fulfillmentStatus: FulfillmentStatusSchema.optional(),
        query: z.string().trim().min(1).max(100).optional(),
        createdFrom: InstantSchema.optional(),
        createdTo: InstantSchema.optional(),
      }).refine((value) => !value.createdFrom || !value.createdTo || Date.parse(value.createdFrom) <= Date.parse(value.createdTo), {
        message: "createdFrom must be before or equal to createdTo",
      }),
    },
    responses: {
      200: {
        description: "Paginated tenant orders",
        content: { "application/json": { schema: z.object({
          items: z.array(OrderSummarySchema),
          pagination: z.object({ limit: z.number().int(), offset: z.number().int(), total: z.number().int().nonnegative() }),
        }) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const { limit, offset, status, paymentStatus, fulfillmentStatus, query, createdFrom, createdTo } = c.req.valid("query");
    const filters: SQL[] = [eq(schema.orders.tenantId, auth.tenantId)];
    if (status) filters.push(eq(schema.orders.status, status));
    if (paymentStatus) filters.push(eq(schema.orders.paymentStatus, paymentStatus));
    if (fulfillmentStatus) filters.push(eq(schema.orders.fulfillmentStatus, fulfillmentStatus));
    if (createdFrom) filters.push(gte(schema.orders.createdAt, new Date(createdFrom).toISOString()));
    if (createdTo) filters.push(lte(schema.orders.createdAt, new Date(createdTo).toISOString()));
    if (query) filters.push(or(
      sql<boolean>`position(lower(${query}) in lower(${schema.orders.orderNumber})) > 0`,
      sql<boolean>`position(lower(${query}) in lower(${schema.orders.customerName})) > 0`,
      sql<boolean>`position(lower(${query}) in lower(${schema.orders.customerPhone})) > 0`
    )!);
    const where = and(...filters);
    const ordersList = await db
      .select(orderSelection)
      .from(schema.orders)
      .where(where)
      .orderBy(desc(schema.orders.createdAt), desc(schema.orders.id))
      .limit(limit)
      .offset(offset);
    const [aggregate] = await db.select({ total: count(schema.orders.id) }).from(schema.orders).where(where);

    return c.json({
      items: ordersList.map((order) => serializeOrderSummary(order as typeof schema.orders.$inferSelect)),
      pagination: { limit, offset, total: Number(aggregate?.total || 0) },
    }, 200);
  }
);

// Tenant-scoped Order Detail
adminRouter.openapi(
  createRoute({
    method: "get",
    path: "/orders/{id}",
    summary: "Get a persisted tenant order",
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: "Order detail", content: { "application/json": { schema: OrderDetailSchema } } },
      404: { description: "Order not found", content: { "application/json": { schema: z.object({ error: z.string() }) } } },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const orderId = c.req.valid("param").id;
    const detail = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(schema.orders).where(and(
        eq(schema.orders.id, orderId), eq(schema.orders.tenantId, auth.tenantId)
      )).limit(1);
      if (!order) return null;
      const items = await tx.select({
        id: schema.orderItems.id, productId: schema.orderItems.productId, variantId: schema.orderItems.variantId,
        productName: schema.orderItems.productName, variantTitle: schema.orderItems.variantTitle,
        sku: schema.orderItems.sku, priceMinor: schema.orderItems.priceMinor,
        quantity: schema.orderItems.quantity, subtotalMinor: schema.orderItems.subtotalMinor,
      }).from(schema.orderItems).where(and(
        eq(schema.orderItems.orderId, orderId), eq(schema.orderItems.tenantId, auth.tenantId)
      ));
      const events = await tx.select({
        id: schema.orderEvents.id, event: schema.orderEvents.event,
        actor: schema.orderEvents.actor, createdAt: schema.orderEvents.createdAt,
      }).from(schema.orderEvents).where(and(
        eq(schema.orderEvents.orderId, orderId), eq(schema.orderEvents.tenantId, auth.tenantId)
      )).orderBy(desc(schema.orderEvents.createdAt), desc(schema.orderEvents.id));
      const [dispatch] = await tx.select({
        id: schema.mengantarDispatchQueue.id, status: schema.mengantarDispatchQueue.status,
        attempts: schema.mengantarDispatchQueue.attempts,
        nextRetryAt: schema.mengantarDispatchQueue.nextRetryAt, createdAt: schema.mengantarDispatchQueue.createdAt,
        updatedAt: schema.mengantarDispatchQueue.updatedAt,
      }).from(schema.mengantarDispatchQueue).where(and(
        eq(schema.mengantarDispatchQueue.orderId, orderId), eq(schema.mengantarDispatchQueue.tenantId, auth.tenantId)
      )).orderBy(desc(schema.mengantarDispatchQueue.createdAt)).limit(1);
      return OrderDetailSchema.parse({
        ...serializeOrderSummary(order),
        shippingAddress: order.shippingAddress,
        customerEmail: order.customerEmail?.trim() || null,
        subdistrictId: order.subdistrictId,
        subdistrictName: order.subdistrictName,
        cityName: order.cityName,
        provinceName: order.provinceName,
        postalCode: order.postalCode,
        subtotalMinor: order.subtotalMinor,
        shippingCostMinor: order.shippingCostMinor,
        discountMinor: order.discountMinor,
        notes: order.notes,
        items,
        events: events.map((event) => ({ ...event, createdAt: isoInstant(event.createdAt) })),
        dispatch: dispatch ? serializeDispatch(dispatch as typeof schema.mengantarDispatchQueue.$inferSelect) : null,
      });
    });
    if (!detail) return c.json({ error: "Order not found" }, 404);
    return c.json(detail, 200);
  }
);

// Guarded merchant lifecycle transitions
adminRouter.openapi(
  createRoute({
    method: "post",
    path: "/orders/{id}/transitions",
    summary: "Apply a guarded order lifecycle transition",
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: z.discriminatedUnion("action", [
        z.object({ action: z.literal("start_processing") }).strict(),
        z.object({ action: z.literal("cancel"), reason: z.string().trim().min(3).max(500) }).strict(),
      ]) } } },
    },
    responses: {
      200: { description: "Transition result", content: { "application/json": { schema: z.object({ order: OrderSummarySchema, alreadyApplied: z.boolean() }) } } },
      404: { description: "Order not found", content: { "application/json": { schema: z.object({ error: z.string() }) } } },
      409: { description: "Invalid lifecycle transition", content: { "application/json": { schema: z.object({ error: z.string() }) } } },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const orderId = c.req.valid("param").id;
    const input = c.req.valid("json");
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${auth.tenantId}:${orderId}`}, 0))`);
      const [order] = await tx.select().from(schema.orders).where(and(
        eq(schema.orders.id, orderId), eq(schema.orders.tenantId, auth.tenantId)
      )).limit(1);
      if (!order) return { kind: "not_found" as const };
      if (input.action === "start_processing") {
        if (order.status === "PROCESSING") return { kind: "applied" as const, order, alreadyApplied: true };
        if (order.status !== "CONFIRMED" || order.fulfillmentStatus !== "UNFULFILLED" ||
            (order.paymentMethod !== "COD" && order.paymentStatus !== "PAID")) {
          return { kind: "conflict" as const, error: "Only paid or COD confirmed, unfulfilled orders can start processing" };
        }
        const [updated] = await tx.update(schema.orders).set({
          status: "PROCESSING", updatedAt: new Date().toISOString(),
        }).where(and(
          eq(schema.orders.id, orderId), eq(schema.orders.tenantId, auth.tenantId),
          eq(schema.orders.status, "CONFIRMED"), eq(schema.orders.fulfillmentStatus, "UNFULFILLED"),
          or(eq(schema.orders.paymentMethod, "COD"), eq(schema.orders.paymentStatus, "PAID"))
        )).returning();
        if (!updated) return { kind: "conflict" as const, error: "Order changed before processing could start" };
        await tx.insert(schema.orderEvents).values({ tenantId: auth.tenantId, orderId, event: "PROCESSING_STARTED", actor: auth.userEmail });
        await tx.insert(schema.auditLogs).values(auditEntry(auth, "order.processing_started", "order", orderId, {
          before: { status: order.status, paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus },
          after: { status: updated.status, paymentStatus: updated.paymentStatus, fulfillmentStatus: updated.fulfillmentStatus },
        }));
        return { kind: "applied" as const, order: updated, alreadyApplied: false };
      }
      if (order.status === "CANCELLED") return { kind: "applied" as const, order, alreadyApplied: true };
      if (order.paymentStatus !== "UNPAID" || order.fulfillmentStatus !== "UNFULFILLED" || order.cnoteNo ||
          !["PENDING_PAYMENT", "CONFIRMED"].includes(order.status)) {
        return { kind: "conflict" as const, error: "Only unpaid, unfulfilled, undispatched orders can be cancelled" };
      }
      const [activeDispatch] = await tx.select({ id: schema.mengantarDispatchQueue.id })
        .from(schema.mengantarDispatchQueue)
        .where(and(
          eq(schema.mengantarDispatchQueue.tenantId, auth.tenantId),
          eq(schema.mengantarDispatchQueue.orderId, orderId),
          inArray(schema.mengantarDispatchQueue.status, ["pending", "processing"])
        )).limit(1);
      if (activeDispatch) return { kind: "conflict" as const, error: "Order has an active dispatch request" };
      const [updated] = await tx.update(schema.orders).set({
        status: "CANCELLED", updatedAt: new Date().toISOString(),
      }).where(and(
        eq(schema.orders.id, orderId), eq(schema.orders.tenantId, auth.tenantId),
        inArray(schema.orders.status, ["PENDING_PAYMENT", "CONFIRMED"]),
        eq(schema.orders.paymentStatus, "UNPAID"), eq(schema.orders.fulfillmentStatus, "UNFULFILLED"),
        isNull(schema.orders.cnoteNo)
      )).returning();
      if (!updated) return { kind: "conflict" as const, error: "Order changed before cancellation could complete" };
      await tx.insert(schema.orderEvents).values({
        tenantId: auth.tenantId, orderId, event: "ORDER_CANCELLED", actor: auth.userEmail,
        metadataJson: { reason: input.reason },
      });
      await tx.insert(schema.auditLogs).values(auditEntry(auth, "order.cancel", "order", orderId, {
        reason: input.reason,
        before: { status: order.status, paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus },
        after: { status: updated.status, paymentStatus: updated.paymentStatus, fulfillmentStatus: updated.fulfillmentStatus },
      }));
      return { kind: "applied" as const, order: updated, alreadyApplied: false };
    });
    if (result.kind === "not_found") return c.json({ error: "Order not found" }, 404);
    if (result.kind === "conflict") return c.json({ error: result.error }, 409);
    return c.json({ order: serializeOrderSummary(result.order), alreadyApplied: result.alreadyApplied }, 200);
  }
);

// Queue Mengantar Dispatch (provider worker remains asynchronous)
adminRouter.openapi(
  createRoute({
    method: "post",
    path: "/orders/{id}/dispatch",
    summary: "Queue an eligible order for Mengantar dispatch",
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: z.object({}).strict() } } },
    },
    responses: {
      200: { description: "Dispatch was already queued", content: { "application/json": { schema: z.object({ orderId: z.string().uuid(), dispatch: DispatchResponseSchema, alreadyQueued: z.literal(true) }) } } },
      202: { description: "Dispatch queued", content: { "application/json": { schema: z.object({ orderId: z.string().uuid(), dispatch: DispatchResponseSchema, alreadyQueued: z.literal(false) }) } } },
      404: { description: "Order not found", content: { "application/json": { schema: z.object({ error: z.string() }) } } },
      409: { description: "Order is not eligible for dispatch", content: { "application/json": { schema: z.object({ error: z.string() }) } } },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const orderId = c.req.valid("param").id;
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${auth.tenantId}:${orderId}`}, 0))`);
      const [order] = await tx.select().from(schema.orders).where(and(
        eq(schema.orders.id, orderId), eq(schema.orders.tenantId, auth.tenantId)
      )).limit(1);
      if (!order) return { kind: "not_found" as const };
      const [existing] = await tx.select().from(schema.mengantarDispatchQueue).where(and(
        eq(schema.mengantarDispatchQueue.orderId, orderId), eq(schema.mengantarDispatchQueue.tenantId, auth.tenantId)
      )).orderBy(desc(schema.mengantarDispatchQueue.createdAt)).limit(1);
      if (existing && ["failed", "dlq"].includes(existing.status)) {
        return { kind: "conflict" as const, error: "Dispatch requires operator recovery before it can be queued again" };
      }
      if (existing) return { kind: "existing" as const, dispatch: serializeDispatch(existing) };
      if (order.fulfillmentStatus !== "UNFULFILLED" || order.cnoteNo || !["CONFIRMED", "PROCESSING"].includes(order.status)) {
        return { kind: "conflict" as const, error: "Order lifecycle is not eligible for dispatch" };
      }
      if (order.paymentMethod !== "COD" && order.paymentStatus !== "PAID") {
        return { kind: "conflict" as const, error: "Non-COD orders must be paid before dispatch" };
      }
      if (!order.subdistrictId || !order.courierCode) {
        return { kind: "conflict" as const, error: "Order requires destination and courier before dispatch" };
      }
      const itemWeights = await tx.select({
        quantity: schema.orderItems.quantity,
        productWeight: schema.products.weightGrams,
        variantWeight: schema.productVariants.weightGrams,
      }).from(schema.orderItems)
        .leftJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
        .leftJoin(schema.productVariants, eq(schema.orderItems.variantId, schema.productVariants.id))
        .where(and(eq(schema.orderItems.orderId, orderId), eq(schema.orderItems.tenantId, auth.tenantId)));
      const weightGrams = itemWeights.reduce(
        (total, item) => total + (item.variantWeight ?? item.productWeight ?? 0) * item.quantity,
        0
      );
      if (weightGrams <= 0) {
        return { kind: "conflict" as const, error: "Order has no positive shippable weight" };
      }
      const [queued] = await tx.insert(schema.mengantarDispatchQueue).values({
        tenantId: auth.tenantId, orderId,
      }).returning();
      await tx.insert(schema.orderEvents).values({
        tenantId: auth.tenantId, orderId, event: "DISPATCH_QUEUED", actor: auth.userEmail,
      });
      await tx.insert(schema.auditLogs).values(auditEntry(
        auth, "order.dispatch_queued", "order", orderId, {
          dispatchQueueId: queued.id,
          before: { status: order.status, paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus },
          after: { dispatchStatus: queued.status },
        }
      ));
      return { kind: "queued" as const, dispatch: serializeDispatch(queued) };
    });
    if (result.kind === "not_found") return c.json({ error: "Order not found" }, 404);
    if (result.kind === "conflict") return c.json({ error: result.error }, 409);
    if (result.kind === "existing") return c.json({ orderId, dispatch: result.dispatch, alreadyQueued: true as const }, 200);
    return c.json({ orderId, dispatch: result.dispatch, alreadyQueued: false as const }, 202);
  }
);

// Stale & Abandoned Order Cleanup (soft-cancel only; commerce records are retained)
adminRouter.openapi(
  createRoute({
    method: "delete",
    path: "/orders/cleanup",
    summary: "Cancel unpaid and abandoned orders older than 7 days",
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
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const staleOrders = await db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.tenantId, auth.tenantId),
          eq(schema.orders.paymentStatus, "UNPAID"),
          eq(schema.orders.status, "PENDING_PAYMENT"),
          eq(schema.orders.fulfillmentStatus, "UNFULFILLED"),
          lte(schema.orders.createdAt, sevenDaysAgo)
        )
      );

    const staleIds = staleOrders.map((o) => o.id);
    if (staleIds.length === 0) {
      return c.json({ success: true, purgedCount: 0, message: "Tidak ada pesanan usang untuk dibersihkan." }, 200);
    }

    for (const orderId of staleIds) {
      await db.transaction(async (tx) => {
        await tx
          .update(schema.orders)
          .set({ status: "CANCELLED", updatedAt: new Date().toISOString() })
          .where(and(eq(schema.orders.tenantId, auth.tenantId), eq(schema.orders.id, orderId)));
        await tx.insert(schema.orderEvents).values({
          tenantId: auth.tenantId,
          orderId,
          event: "CANCELLED_STALE_UNPAID",
          actor: auth.userEmail,
        });
        await tx.insert(schema.auditLogs).values(
          auditEntry(auth, "order.cancel_stale", "order", orderId)
        );
      });
    }

    return c.json({
      success: true,
      purgedCount: staleIds.length,
      message: `${staleIds.length} pesanan usang dibatalkan tanpa menghapus riwayat.`,
    }, 200);
  }
);

// Delete Single Order
adminRouter.openapi(
  createRoute({
    method: "delete",
    path: "/orders/{id}",
    summary: "Cancel an unfulfilled unpaid merchant order",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Order cancelled successfully",
        content: { "application/json": { schema: z.object({ success: z.boolean() }) } },
      },
      409: {
        description: "Order lifecycle no longer permits cancellation",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
    },
  }),
  async (c) => {
    const auth = c.get("auth");
    const orderId = c.req.param("id");

    const order = await db.transaction(async (tx) => {
      const [cancelled] = await tx
        .update(schema.orders)
        .set({ status: "CANCELLED", updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(schema.orders.tenantId, auth.tenantId),
            eq(schema.orders.id, orderId),
            eq(schema.orders.paymentStatus, "UNPAID"),
            eq(schema.orders.fulfillmentStatus, "UNFULFILLED")
          )
        )
        .returning();
      if (!cancelled) return null;

      await tx.insert(schema.orderEvents).values({
        tenantId: auth.tenantId,
        orderId,
        event: "ORDER_CANCELLED",
        actor: auth.userEmail,
      });
      await tx.insert(schema.auditLogs).values(
        auditEntry(auth, "order.cancel", "order", orderId)
      );
      return cancelled;
    });
    if (!order) return c.json({ error: "Only unpaid, unfulfilled orders can be cancelled" }, 409);

    return c.json({ success: true }, 200);
  }
);

// Bulk Delete Merchant Orders
adminRouter.openapi(
  createRoute({
    method: "post",
    path: "/orders/bulk-delete",
    summary: "Bulk cancel unfulfilled unpaid merchant orders",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({ orderIds: z.array(z.string().uuid()).min(1).max(100) }),
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
    const body = c.req.valid("json");
    const orderIds = body.orderIds || [];

    const cancelledCount = await db.transaction(async (tx) => {
      let count = 0;
      for (const orderId of orderIds) {
        const [order] = await tx
          .update(schema.orders)
          .set({ status: "CANCELLED", updatedAt: new Date().toISOString() })
          .where(
            and(
              eq(schema.orders.tenantId, auth.tenantId),
              eq(schema.orders.id, orderId),
              eq(schema.orders.paymentStatus, "UNPAID"),
              eq(schema.orders.fulfillmentStatus, "UNFULFILLED")
            )
          )
          .returning();
        if (!order) continue;
        count++;
        await tx.insert(schema.orderEvents).values({
          tenantId: auth.tenantId,
          orderId,
          event: "ORDER_CANCELLED_BULK",
          actor: auth.userEmail,
        });
        await tx.insert(schema.auditLogs).values(
          auditEntry(auth, "order.cancel_bulk", "order", orderId)
        );
      }
      return count;
    });

    return c.json({ success: true, deletedCount: cancelledCount }, 200);
  }
);
