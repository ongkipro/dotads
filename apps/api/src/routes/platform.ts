import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db, schema } from "@dotads/db";
import { authMiddleware, requirePermission } from "../middleware/auth.ts";

export const platformRouter = new OpenAPIHono();

// Middleware guard: platform routes require SUPER_ADMIN
platformRouter.use("*", authMiddleware, requirePermission("*"));

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
  const tenants = await db.select().from(schema.tenants);
  return c.json(tenants as any[], 200);
});
