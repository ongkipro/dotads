import type { Context, Next } from "hono";
import { auth, hasPermission, type Role } from "@dotads/auth";
import { db, schema } from "@dotads/db";
import { eq } from "drizzle-orm";

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
      .where(eq(schema.members.organizationId, activeOrgId));

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
