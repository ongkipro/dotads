import type { Context, Next } from "hono";
import { auth, hasPermission, type Role } from "@dotads/auth";
import { db, schema } from "@dotads/db";
import { and, eq } from "drizzle-orm";

export interface AuthContext {
  userId: string;
  userEmail: string;
  tenantId: string;
  organizationId: string;
  role: Role;
}

export type AppEnv = {
  Variables: {
    auth: AuthContext;
  };
};

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const sessionToken = c.req.header("Authorization")?.replace("Bearer ", "") || c.req.header("x-session-token");

  if (!sessionToken) {
    return c.json({ error: "Unauthorized: Missing session token" }, 401);
  }

  // Dev/Smoke Test Session Bypass
  if (sessionToken === "test-superadmin-token") {
    const role = (c.req.header("x-user-role") as Role) || "SUPER_ADMIN";
    c.set("auth", {
      userId: c.req.header("x-user-id") || "usr_superadmin_01",
      userEmail: c.req.header("x-user-email") || "superadmin@dotads.com",
      tenantId: c.req.header("x-tenant-id") || "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8",
      organizationId: "org_superadmin_01",
      role,
    });
    return await next();
  }

  // Parse session with better-auth
  const sessionRes = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!sessionRes || !sessionRes.user) {
    return c.json({ error: "Unauthorized: Invalid or expired session" }, 401);
  }

  const userId = sessionRes.user.id;
  const activeOrgId = sessionRes.session.activeOrganizationId;
  // Resolve tenantId and Role
  let tenantId = "";
  let role: Role = "END_BUYER";

  if (activeOrgId) {
    const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, activeOrgId));
    if (org) {
      tenantId = org.tenantId;
    }

    const [member] = await db
      .select()
      .from(schema.members)
      .where(and(eq(schema.members.organizationId, activeOrgId), eq(schema.members.userId, userId)));

    if (member) {
      role = member.role as Role;
    }
  }

  // Header override for dev smoke tests if x-tenant-id provided
  const headerTenant = c.req.header("x-tenant-id");
  if (headerTenant && !tenantId) {
    tenantId = headerTenant;
  }

  c.set("auth", {
    userId,
    userEmail: sessionRes.user.email,
    tenantId,
    organizationId: activeOrgId || "",
    role,
  });

  await next();
}

export function requirePermission(permission: string) {
  return async (c: Context<AppEnv>, next: Next) => {
    const authData = c.get("auth");
    if (!authData) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Platform routes guard
    if (c.req.path.startsWith("/api/v1/platform") && authData.role !== "SUPER_ADMIN") {
      return c.json({ error: "Forbidden: Super Admin access required" }, 403);
    }

    if (!hasPermission(authData.role, permission)) {
      return c.json({ error: `Forbidden: Missing required permission ${permission}` }, 403);
    }

    await next();
  };
}
