import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { auth, isTrustedAuthOrigin } from "@dotads/auth";
import { acceptTenantInvitationForSession } from "@dotads/db";

const AcceptedRoleSchema = z.enum(["ADMIN", "ADVERTISER", "CUSTOMER_SERVICE"]);
const ErrorSchema = z.object({ error: z.string(), code: z.string() }).strict();
const InternalErrorSchema = z.object({ error: z.literal("Internal Server Error") }).strict();
const AcceptanceSchema = z.object({
  membershipId: z.string(),
  organizationId: z.string(),
  role: AcceptedRoleSchema,
  alreadyAccepted: z.boolean(),
}).strict();

export const invitationsRouter = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid request", code: "INVALID_REQUEST" }, 400);
    }
  },
});

invitationsRouter.openapi(
  createRoute({
    method: "post",
    path: "/{id}/accept",
    summary: "Accept a tenant invitation for the authenticated session",
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: z.object({}).strict() } } },
    },
    responses: {
      200: { description: "Invitation accepted or already accepted by this member", content: { "application/json": { schema: AcceptanceSchema } } },
      400: { description: "Malformed invitation id or request body", content: { "application/json": { schema: ErrorSchema } } },
      401: { description: "Valid Better Auth session required", content: { "application/json": { schema: ErrorSchema } } },
      403: { description: "Untrusted browser origin", content: { "application/json": { schema: ErrorSchema } } },
      404: { description: "Invitation not found for this session identity", content: { "application/json": { schema: ErrorSchema } } },
      409: { description: "Invitation or tenant is not eligible for acceptance", content: { "application/json": { schema: ErrorSchema } } },
      500: { description: "Unexpected internal failure", content: { "application/json": { schema: InternalErrorSchema } } },
    },
  }),
  async (c) => {
    const origin = c.req.header("origin");
    if (origin && !isTrustedAuthOrigin(origin)) {
      return c.json({ error: "Forbidden", code: "UNTRUSTED_ORIGIN" }, 403);
    }

    const identity = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!identity?.user) {
      return c.json({ error: "Unauthorized", code: "SESSION_REQUIRED" }, 401);
    }

    const result = await acceptTenantInvitationForSession(
      c.req.valid("param").id,
      identity.session.id
    );
    if (result.outcome === "UNAUTHENTICATED") {
      return c.json({ error: "Unauthorized", code: "SESSION_REQUIRED" }, 401);
    }
    if (result.outcome === "NOT_FOUND") {
      return c.json({ error: "Invitation not found", code: "INVITATION_NOT_FOUND" }, 404);
    }
    if (result.outcome === "CONFLICT") {
      return c.json({ error: "Invitation cannot be accepted", code: "INVITATION_NOT_ACCEPTABLE" }, 409);
    }
    if (!result.membershipId || !result.organizationId ||
      !AcceptedRoleSchema.safeParse(result.role).success) {
      throw new Error("Invitation acceptance returned an invalid bounded result");
    }

    return c.json(AcceptanceSchema.parse({
      membershipId: result.membershipId,
      organizationId: result.organizationId,
      role: result.role,
      alreadyAccepted: result.outcome === "ALREADY_ACCEPTED",
    }), 200);
  }
);
