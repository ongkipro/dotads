import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db, schema } from "@dotads/db";
import { and, count, eq, sql } from "drizzle-orm";
import { authMiddleware, requirePermission, type AppEnv, type AuthContext } from "../middleware/auth.ts";

const MemberRoleSchema = z.enum(["TENANT_OWNER", "ADMIN", "ADVERTISER", "CUSTOMER_SERVICE"]);
const InvitationRoleSchema = z.enum(["ADMIN", "ADVERTISER", "CUSTOMER_SERVICE"]);
const InvitationStatusSchema = z.enum(["pending", "expired"]);
const InstantSchema = z.string().datetime({ offset: true });
const ErrorSchema = z.object({ error: z.string() });
const DeliverySchema = z.literal("not_configured");

const MemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: MemberRoleSchema,
  createdAt: InstantSchema,
});

const InvitationSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: MemberRoleSchema,
  status: InvitationStatusSchema,
  expiresAt: InstantSchema,
  createdAt: InstantSchema,
  delivery: DeliverySchema,
});

const MemberListSchema = z.object({
  members: z.array(MemberSchema),
  invitations: z.array(InvitationSchema),
});

function isoInstant(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

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

function serializeInvitation(invitation: typeof schema.invitations.$inferSelect) {
  const expiresAt = isoInstant(invitation.expiresAt);
  return InvitationSchema.parse({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.expiresAt.getTime() <= Date.now() ? "expired" : "pending",
    expiresAt,
    createdAt: isoInstant(invitation.createdAt),
    delivery: "not_configured",
  });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

type AuthGuard = typeof authMiddleware;

export function createMembersRouter(authGuard: AuthGuard = authMiddleware) {
  const router = new OpenAPIHono<AppEnv>();
  router.use("*", authGuard);

  router.openapi(
    createRoute({
      method: "get",
      path: "/",
      summary: "List organization members and pending invitations",
      middleware: [requirePermission("members:read")] as const,
      responses: {
        200: { description: "Members and pending invitations", content: { "application/json": { schema: MemberListSchema } } },
      },
    }),
    async (c) => {
      const auth = c.get("auth");
      const [memberRows, invitationRows] = await Promise.all([
        db.select({
          id: schema.members.id,
          userId: schema.members.userId,
          name: schema.users.name,
          email: schema.users.email,
          role: schema.members.role,
          createdAt: schema.members.createdAt,
        }).from(schema.members)
          .innerJoin(schema.users, eq(schema.users.id, schema.members.userId))
          .where(eq(schema.members.organizationId, auth.organizationId)),
        db.select().from(schema.invitations).where(and(
          eq(schema.invitations.organizationId, auth.organizationId),
          eq(schema.invitations.status, "pending")
        )),
      ]);

      return c.json(MemberListSchema.parse({
        members: memberRows.map((member) => ({ ...member, createdAt: isoInstant(member.createdAt) })),
        invitations: invitationRows.map(serializeInvitation),
      }), 200);
    }
  );

  router.openapi(
    createRoute({
      method: "post",
      path: "/invitations",
      summary: "Create a pending organization invitation",
      middleware: [requirePermission("members:create")] as const,
      request: { body: { content: { "application/json": { schema: z.object({
        email: z.string().trim().email().max(255),
        role: InvitationRoleSchema,
      }).strict() } } } },
      responses: {
        201: { description: "Invitation persisted; delivery is not configured", content: { "application/json": { schema: InvitationSchema } } },
        409: { description: "Existing member or pending invitation", content: { "application/json": { schema: ErrorSchema } } },
      },
    }),
    async (c) => {
      const auth = c.get("auth");
      const input = c.req.valid("json");
      const email = normalizeEmail(input.email);
      const result = await db.transaction(async (tx) => {
        // Serialize duplicate detection without requiring a global email constraint.
        // The organization key keeps unrelated tenants independent.
        await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${auth.organizationId}:${email}`}, 0))`);
        const [existingMember] = await tx.select({ id: schema.members.id })
          .from(schema.members)
          .innerJoin(schema.users, eq(schema.users.id, schema.members.userId))
          .where(and(eq(schema.members.organizationId, auth.organizationId), eq(schema.users.email, email)))
          .limit(1);
        if (existingMember) return { kind: "conflict" as const, error: "This email is already an organization member" };

        const [existingInvitation] = await tx.select({ id: schema.invitations.id })
          .from(schema.invitations)
          .where(and(
            eq(schema.invitations.organizationId, auth.organizationId),
            eq(schema.invitations.email, email),
            eq(schema.invitations.status, "pending")
          )).limit(1);
        if (existingInvitation) return { kind: "conflict" as const, error: "A pending invitation already exists for this email" };

        const [invitation] = await tx.insert(schema.invitations).values({
          id: crypto.randomUUID(),
          organizationId: auth.organizationId,
          email,
          role: input.role,
          inviterId: auth.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }).returning();
        await tx.insert(schema.auditLogs).values(auditEntry(
          auth,
          "member.invitation_created",
          "invitation",
          invitation.id,
          { role: invitation.role, expiresAt: isoInstant(invitation.expiresAt), delivery: "not_configured" }
        ));
        return { kind: "created" as const, invitation };
      });
      if (result.kind === "conflict") return c.json({ error: result.error }, 409);
      return c.json(serializeInvitation(result.invitation), 201);
    }
  );

  router.openapi(
    createRoute({
      method: "post",
      path: "/invitations/{id}/resend",
      summary: "Renew a pending or expired invitation",
      middleware: [requirePermission("members:create")] as const,
      request: { params: z.object({ id: z.string().min(1).max(255) }) },
      responses: {
        200: { description: "Invitation renewed; delivery is not configured", content: { "application/json": { schema: InvitationSchema } } },
        404: { description: "Invitation not found", content: { "application/json": { schema: ErrorSchema } } },
        409: { description: "Invitation is no longer pending", content: { "application/json": { schema: ErrorSchema } } },
      },
    }),
    async (c) => {
      const auth = c.get("auth");
      const invitationId = c.req.valid("param").id;
      const result = await db.transaction(async (tx) => {
        const [invitation] = await tx.select().from(schema.invitations).where(and(
          eq(schema.invitations.id, invitationId),
          eq(schema.invitations.organizationId, auth.organizationId)
        )).limit(1);
        if (!invitation) return { kind: "not_found" as const };
        if (invitation.status !== "pending") return { kind: "conflict" as const };
        const [updated] = await tx.update(schema.invitations).set({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          inviterId: auth.userId,
        }).where(and(
          eq(schema.invitations.id, invitationId),
          eq(schema.invitations.organizationId, auth.organizationId),
          eq(schema.invitations.status, "pending")
        )).returning();
        if (!updated) return { kind: "conflict" as const };
        await tx.insert(schema.auditLogs).values(auditEntry(
          auth,
          "member.invitation_resent",
          "invitation",
          invitationId,
          { before: { expiresAt: isoInstant(invitation.expiresAt) }, after: { expiresAt: isoInstant(updated.expiresAt) }, delivery: "not_configured" }
        ));
        return { kind: "updated" as const, invitation: updated };
      });
      if (result.kind === "not_found") return c.json({ error: "Invitation not found" }, 404);
      if (result.kind === "conflict") return c.json({ error: "Only pending invitations can be resent" }, 409);
      return c.json(serializeInvitation(result.invitation), 200);
    }
  );

  router.openapi(
    createRoute({
      method: "delete",
      path: "/invitations/{id}",
      summary: "Cancel a pending invitation",
      middleware: [requirePermission("members:create")] as const,
      request: { params: z.object({ id: z.string().min(1).max(255) }) },
      responses: {
        200: { description: "Invitation cancelled", content: { "application/json": { schema: z.object({ id: z.string(), status: z.literal("canceled") }) } } },
        404: { description: "Invitation not found", content: { "application/json": { schema: ErrorSchema } } },
        409: { description: "Invitation is expired, accepted, rejected, or already cancelled", content: { "application/json": { schema: ErrorSchema } } },
      },
    }),
    async (c) => {
      const auth = c.get("auth");
      const invitationId = c.req.valid("param").id;
      const result = await db.transaction(async (tx) => {
        const [invitation] = await tx.select().from(schema.invitations).where(and(
          eq(schema.invitations.id, invitationId),
          eq(schema.invitations.organizationId, auth.organizationId)
        )).limit(1);
        if (!invitation) return { kind: "not_found" as const };
        if (invitation.status !== "pending" || invitation.expiresAt.getTime() <= Date.now()) {
          return { kind: "conflict" as const };
        }
        const [updated] = await tx.update(schema.invitations).set({ status: "canceled" }).where(and(
          eq(schema.invitations.id, invitationId),
          eq(schema.invitations.organizationId, auth.organizationId),
          eq(schema.invitations.status, "pending")
        )).returning({ id: schema.invitations.id, status: schema.invitations.status });
        if (!updated) return { kind: "conflict" as const };
        await tx.insert(schema.auditLogs).values(auditEntry(
          auth,
          "member.invitation_cancelled",
          "invitation",
          invitationId,
          { before: { status: invitation.status }, after: { status: updated.status } }
        ));
        return { kind: "cancelled" as const, id: updated.id };
      });
      if (result.kind === "not_found") return c.json({ error: "Invitation not found" }, 404);
      if (result.kind === "conflict") return c.json({ error: "Only unexpired pending invitations can be cancelled" }, 409);
      return c.json({ id: result.id, status: "canceled" as const }, 200);
    }
  );

  router.openapi(
    createRoute({
      method: "put",
      path: "/{id}/role",
      summary: "Change an organization member role",
      middleware: [requirePermission("members:update")] as const,
      request: {
        params: z.object({ id: z.string().min(1).max(255) }),
        body: { content: { "application/json": { schema: z.object({ role: MemberRoleSchema }).strict() } } },
      },
      responses: {
        200: { description: "Member role result", content: { "application/json": { schema: z.object({ member: MemberSchema, alreadyApplied: z.boolean() }) } } },
        404: { description: "Member not found", content: { "application/json": { schema: ErrorSchema } } },
        409: { description: "Unsafe owner or self mutation", content: { "application/json": { schema: ErrorSchema } } },
      },
    }),
    async (c) => {
      const auth = c.get("auth");
      const memberId = c.req.valid("param").id;
      const nextRole = c.req.valid("json").role;
      const result = await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${auth.organizationId}, 0))`);
        const [member] = await tx.select({
          id: schema.members.id, userId: schema.members.userId, name: schema.users.name,
          email: schema.users.email, role: schema.members.role, createdAt: schema.members.createdAt,
        }).from(schema.members).innerJoin(schema.users, eq(schema.users.id, schema.members.userId)).where(and(
          eq(schema.members.id, memberId), eq(schema.members.organizationId, auth.organizationId)
        )).limit(1);
        if (!member) return { kind: "not_found" as const };
        if (member.role === nextRole) return { kind: "updated" as const, member, alreadyApplied: true };
        if (member.role === "TENANT_OWNER" && nextRole !== "TENANT_OWNER") {
          const [owners] = await tx.select({ value: count() }).from(schema.members).where(and(
            eq(schema.members.organizationId, auth.organizationId), eq(schema.members.role, "TENANT_OWNER")
          ));
          if (Number(owners?.value ?? 0) <= 1) return { kind: "last_owner" as const };
        }
        if (member.userId === auth.userId) return { kind: "self" as const };
        const [updated] = await tx.update(schema.members).set({ role: nextRole }).where(and(
          eq(schema.members.id, memberId), eq(schema.members.organizationId, auth.organizationId), eq(schema.members.role, member.role)
        )).returning();
        if (!updated) return { kind: "conflict" as const };
        await tx.insert(schema.auditLogs).values(auditEntry(
          auth,
          "member.role_updated",
          "member",
          memberId,
          { before: { role: member.role }, after: { role: updated.role }, userId: member.userId }
        ));
        return { kind: "updated" as const, member: { ...member, role: updated.role }, alreadyApplied: false };
      });
      if (result.kind === "not_found") return c.json({ error: "Member not found" }, 404);
      if (result.kind === "last_owner") return c.json({ error: "The last tenant owner cannot be demoted" }, 409);
      if (result.kind === "self") return c.json({ error: "Use an ownership-transfer workflow to change your own role" }, 409);
      if (result.kind === "conflict") return c.json({ error: "Member changed before the role update completed" }, 409);
      return c.json({
        member: MemberSchema.parse({ ...result.member, createdAt: isoInstant(result.member.createdAt) }),
        alreadyApplied: result.alreadyApplied,
      }, 200);
    }
  );

  router.openapi(
    createRoute({
      method: "delete",
      path: "/{id}",
      summary: "Remove an organization member",
      middleware: [requirePermission("members:delete")] as const,
      request: { params: z.object({ id: z.string().min(1).max(255) }) },
      responses: {
        200: { description: "Member removed", content: { "application/json": { schema: z.object({ id: z.string(), removed: z.literal(true) }) } } },
        404: { description: "Member not found", content: { "application/json": { schema: ErrorSchema } } },
        409: { description: "Unsafe owner or self removal", content: { "application/json": { schema: ErrorSchema } } },
      },
    }),
    async (c) => {
      const auth = c.get("auth");
      const memberId = c.req.valid("param").id;
      const result = await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${auth.organizationId}, 0))`);
        const [member] = await tx.select().from(schema.members).where(and(
          eq(schema.members.id, memberId), eq(schema.members.organizationId, auth.organizationId)
        )).limit(1);
        if (!member) return { kind: "not_found" as const };
        if (member.role === "TENANT_OWNER") {
          const [owners] = await tx.select({ value: count() }).from(schema.members).where(and(
            eq(schema.members.organizationId, auth.organizationId), eq(schema.members.role, "TENANT_OWNER")
          ));
          if (Number(owners?.value ?? 0) <= 1) return { kind: "last_owner" as const };
        }
        if (member.userId === auth.userId) return { kind: "self" as const };
        const [removed] = await tx.delete(schema.members).where(and(
          eq(schema.members.id, memberId), eq(schema.members.organizationId, auth.organizationId)
        )).returning({ id: schema.members.id });
        if (!removed) return { kind: "not_found" as const };
        await tx.insert(schema.auditLogs).values(auditEntry(
          auth,
          "member.removed",
          "member",
          memberId,
          { userId: member.userId, role: member.role }
        ));
        return { kind: "removed" as const, id: removed.id };
      });
      if (result.kind === "not_found") return c.json({ error: "Member not found" }, 404);
      if (result.kind === "last_owner") return c.json({ error: "The last tenant owner cannot be removed" }, 409);
      if (result.kind === "self") return c.json({ error: "You cannot remove your own active membership" }, 409);
      return c.json({ id: result.id, removed: true as const }, 200);
    }
  );

  return router;
}

export const membersRouter = createMembersRouter();
