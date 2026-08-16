import type { Context, Next } from "hono";
import { auth, hasPermission, type Role } from "@dotads/auth";
import {
  resolveDatabaseSessionContext,
  resolveUniqueSessionWorkspace,
  withDatabaseContext,
} from "@dotads/db";

export interface AuthContext {
  userId: string;
  userEmail: string;
  tenantId: string;
  organizationId: string;
  role: Role;
  tenantName: string;
  tenantStatus: string;
}

export type AppEnv = {
  Variables: {
    auth: AuthContext;
  };
};

export function resolveEffectiveRole(globalRole: unknown, memberRole?: unknown): Role {
  if (globalRole === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (
    memberRole === "TENANT_OWNER" ||
    memberRole === "ADMIN" ||
    memberRole === "ADVERTISER" ||
    memberRole === "CUSTOMER_SERVICE" ||
    memberRole === "END_BUYER"
  ) {
    return memberRole;
  }
  return "END_BUYER";
}

export function tenantStatusAllowsAccess(status: unknown): boolean {
  return status === "active";
}

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const sessionToken = c.req.header("Authorization")?.replace("Bearer ", "") || c.req.header("x-session-token");

  // Test-only session bypass
  if (process.env.NODE_ENV === "test" && sessionToken === "test-superadmin-token") {
    const role = (c.req.header("x-user-role") as Role) || "SUPER_ADMIN";
    const testContext: AuthContext = {
      userId: c.req.header("x-user-id") || "usr_superadmin_01",
      userEmail: c.req.header("x-user-email") || "superadmin@dotads.com",
      tenantId: c.req.header("x-tenant-id") || "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8",
      organizationId: "org_superadmin_01",
      role,
      tenantName: "Test Tenant",
      tenantStatus: "active",
    };
    c.set("auth", testContext);
    return process.env.DATABASE_URL ? withDatabaseContext(testContext, next) : next();
  }

  // Parse session with better-auth
  const sessionRes = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!sessionRes || !sessionRes.user) {
    const sessionCookieName = (await auth.$context).authCookies.sessionToken.name;
    const hasSessionCookie = c.req.header("cookie")?.includes(`${sessionCookieName}=`);
    const message =
      !sessionToken && !hasSessionCookie
        ? "Unauthorized: Missing session token"
        : "Unauthorized: Invalid or expired session";
    return c.json({ error: message }, 401);
  }

  const userId = sessionRes.user.id;
  let activeOrgId = sessionRes.session.activeOrganizationId;
  // Resolve tenant identity and organization-scoped role. Super Admin is global.
  let tenantId = "";
  let role = resolveEffectiveRole(sessionRes.user.role);
  let tenantName = "";
  let tenantStatus = "";

  if (!activeOrgId && role !== "SUPER_ADMIN") {
    const resolution = await resolveUniqueSessionWorkspace(userId, sessionRes.session.id);
    if (resolution.workspaceCount > 1) {
      return c.json({
        error: "Workspace selection required",
        code: "WORKSPACE_SELECTION_REQUIRED",
        workspaceSelectionRequired: true,
      }, 409);
    }
    if (resolution.workspaceCount === 1 && resolution.organizationId && resolution.tenantId) {
      activeOrgId = resolution.organizationId;
      tenantId = resolution.tenantId;
      tenantName = resolution.tenantName || "";
      tenantStatus = resolution.tenantStatus || "";
      role = resolveEffectiveRole(role, resolution.role);
    }
  }

  if (activeOrgId && !tenantId) {
    const sessionContext = await resolveDatabaseSessionContext(userId, activeOrgId);
    tenantId = sessionContext?.tenantId || "";
    tenantName = sessionContext?.tenantName || "";
    tenantStatus = sessionContext?.tenantStatus || "";
    role = resolveEffectiveRole(role, sessionContext?.role);

    if (role !== "SUPER_ADMIN") {
      if (!sessionContext) {
        return c.json({ error: "Forbidden: Active tenant membership required" }, 403);
      }
      if (!tenantStatusAllowsAccess(sessionContext.tenantStatus)) {
        return c.json({ error: "Forbidden: Tenant is not active" }, 403);
      }
    }
  }

  // Test-only tenant override
  const headerTenant = c.req.header("x-tenant-id");
  if (process.env.NODE_ENV === "test" && headerTenant && !tenantId) {
    tenantId = headerTenant;
  }

  const authContext: AuthContext = {
    userId,
    userEmail: sessionRes.user.email,
    tenantId,
    organizationId: activeOrgId || "",
    role,
    tenantName,
    tenantStatus,
  };
  c.set("auth", authContext);

  if (role !== "SUPER_ADMIN" && !tenantId) {
    return c.json({ error: "Forbidden: Active tenant organization required" }, 403);
  }

  return withDatabaseContext(authContext, next);
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
