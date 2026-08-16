import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { auth } from "@dotads/auth";
import { listUserWorkspaces, selectSessionWorkspace } from "@dotads/db";

export const workspacesRouter = new OpenAPIHono();
const WorkspaceRoleSchema = z.enum(["TENANT_OWNER", "ADMIN", "ADVERTISER", "CUSTOMER_SERVICE"]);
const TenantStatusSchema = z.enum(["active", "suspended", "cancelled"]);

async function getIdentity(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  return session?.user ? session : null;
}

workspacesRouter.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List workspaces available to the authenticated user",
    responses: {
      200: {
        description: "Bounded workspace choices",
        content: { "application/json": { schema: z.object({
          workspaces: z.array(z.object({
            organizationId: z.string(),
            organizationName: z.string().min(1).max(255),
            tenantName: z.string(),
            tenantStatus: TenantStatusSchema,
            role: WorkspaceRoleSchema,
          })).max(100),
        }) } },
      },
      401: { description: "Unauthenticated" },
    },
  }),
  async (c) => {
    const identity = await getIdentity(c.req.raw.headers);
    if (!identity) return c.json({ error: "Unauthorized" }, 401);
    return c.json({ workspaces: await listUserWorkspaces(identity.user.id) }, 200);
  }
);

workspacesRouter.openapi(
  createRoute({
    method: "post",
    path: "/select",
    summary: "Select an active workspace for the current session",
    request: {
      body: { content: { "application/json": { schema: z.object({ organizationId: z.string().min(1).max(255) }) } } },
    },
    responses: {
      200: {
        description: "Selected tenant session context",
        content: { "application/json": { schema: z.object({
          userId: z.string(), userEmail: z.string().email(), tenantId: z.string(),
          organizationId: z.string(), role: WorkspaceRoleSchema, tenantName: z.string(), tenantStatus: z.literal("active"),
        }) } },
      },
      401: { description: "Unauthenticated" },
      403: { description: "Workspace is inactive or the user is not a member" },
    },
  }),
  async (c) => {
    const identity = await getIdentity(c.req.raw.headers);
    if (!identity) return c.json({ error: "Unauthorized" }, 401);
    const { organizationId } = c.req.valid("json");
    const selected = await selectSessionWorkspace(identity.user.id, identity.session.id, organizationId);
    if (!selected) return c.json({ error: "Forbidden: Active workspace membership required" }, 403);
    return c.json({
      userId: identity.user.id,
      userEmail: identity.user.email,
      ...selected,
    }, 200);
  }
);
