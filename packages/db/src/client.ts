import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { AsyncLocalStorage } from "node:async_hooks";
import * as schema from "./schema/index.ts";

const configuredDatabaseUrl = process.env.DATABASE_URL;
const configuredPlatformDatabaseUrl = process.env.PLATFORM_DATABASE_URL;

if (process.env.NODE_ENV === "production" && (!configuredDatabaseUrl || !configuredPlatformDatabaseUrl)) {
  throw new Error("DATABASE_URL and PLATFORM_DATABASE_URL are required in production");
}

const connectionString = configuredDatabaseUrl || "postgres://dotads_user:dotads_password@localhost:5432/dotads_db";
const platformConnectionString = configuredPlatformDatabaseUrl || connectionString;

const migrationConnectionString = process.env.MIGRATION_DATABASE_URL || connectionString;

if (
  process.env.NODE_ENV === "production" &&
  process.env.MIGRATION_DATABASE_URL &&
  (process.env.MIGRATION_DATABASE_URL === configuredDatabaseUrl ||
    process.env.MIGRATION_DATABASE_URL === configuredPlatformDatabaseUrl)
) {
  throw new Error("Runtime database URLs must be distinct from MIGRATION_DATABASE_URL");
}
if (
  process.env.NODE_ENV === "production" &&
  configuredDatabaseUrl === configuredPlatformDatabaseUrl
) {
  throw new Error("DATABASE_URL and PLATFORM_DATABASE_URL must use distinct login roles");
}

export const client = postgres(connectionString, {
  connection: { application_name: "dotads-api", TimeZone: "UTC" },
});
const runtimeDb = drizzle(client, { schema });

export const platformClient = postgres(platformConnectionString, {
  connection: { application_name: "dotads-platform", TimeZone: "UTC" },
});
const platformDb = drizzle(platformClient, { schema });

export const migrationClient = postgres(migrationConnectionString, {
  connection: { application_name: "dotads-migrations", TimeZone: "UTC" },
});
export const migrationDb = drizzle(migrationClient, { schema });

type RuntimeDatabase = typeof runtimeDb;
const databaseContext = new AsyncLocalStorage<RuntimeDatabase>();
let runtimeRoleCheck: Promise<void> | undefined;
let platformRoleCheck: Promise<void> | undefined;

export interface DatabaseSessionContext {
  userId: string;
  userEmail: string;
  tenantId: string;
  organizationId: string;
  role: string;
  tenantName: string;
  tenantStatus: string;
}

export async function resolveDatabaseSessionContext(
  userId: string,
  organizationId: string
): Promise<Omit<DatabaseSessionContext, "userId" | "userEmail"> | null> {
  const rows = await runtimeDb.execute<{
    tenantId: string;
    organizationId: string;
    role: string;
    tenantName: string;
    tenantStatus: string;
  }>(sql`select * from resolve_database_session_context(${userId}, ${organizationId})`);
  return rows[0] || null;
}

export interface SessionWorkspaceResolution extends Record<string, unknown> {
  workspaceCount: number;
  tenantId: string | null;
  organizationId: string | null;
  role: string | null;
  tenantName: string | null;
  tenantStatus: string | null;
}

export async function resolveUniqueSessionWorkspace(
  userId: string,
  sessionId: string
): Promise<SessionWorkspaceResolution> {
  const rows = await runtimeDb.execute<SessionWorkspaceResolution>(
    sql`select * from resolve_unique_session_workspace(${userId}, ${sessionId})`
  );
  return rows[0] || {
    workspaceCount: 0,
    tenantId: null,
    organizationId: null,
    role: null,
    tenantName: null,
    tenantStatus: null,
  };
}

export interface UserWorkspace extends Record<string, unknown> {
  organizationId: string;
  organizationName: string;
  tenantName: string;
  tenantStatus: string;
  role: string;
}

export async function listUserWorkspaces(userId: string): Promise<UserWorkspace[]> {
  return runtimeDb.execute<UserWorkspace>(sql`select * from list_user_workspaces(${userId})`);
}

export async function selectSessionWorkspace(
  userId: string,
  sessionId: string,
  organizationId: string
): Promise<Omit<DatabaseSessionContext, "userId" | "userEmail"> | null> {
  const rows = await runtimeDb.execute<{
    tenantId: string;
    organizationId: string;
    role: string;
    tenantName: string;
    tenantStatus: string;
  }>(sql`select * from select_session_workspace(${userId}, ${sessionId}, ${organizationId})`);
  return rows[0] || null;
}

export type InvitationAcceptanceOutcome =
  | "ACCEPTED"
  | "ALREADY_ACCEPTED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHENTICATED";

export interface InvitationAcceptanceResult extends Record<string, unknown> {
  outcome: InvitationAcceptanceOutcome;
  membershipId: string | null;
  organizationId: string | null;
  tenantId: string | null;
  role: string | null;
}

export async function acceptTenantInvitationForSession(
  invitationId: string,
  sessionId: string
): Promise<InvitationAcceptanceResult> {
  const rows = await runtimeDb.execute<InvitationAcceptanceResult>(sql`
    select * from accept_tenant_invitation_for_session(${invitationId}::uuid, ${sessionId})
  `);
  return rows[0] || {
    outcome: "NOT_FOUND",
    membershipId: null,
    organizationId: null,
    tenantId: null,
    role: null,
  };
}

export async function resolveOrderTenantById(orderId: string): Promise<string | null> {
  const rows = await runtimeDb.execute<{ tenantId: string | null }>(
    sql`select resolve_order_tenant_by_id(${orderId}::uuid) as "tenantId"`
  );
  return rows[0]?.tenantId || null;
}

export async function resolveOrderTenantByWaybill(waybill: string): Promise<string | null> {
  const rows = await runtimeDb.execute<{ tenantId: string | null }>(
    sql`select resolve_order_tenant_by_waybill(${waybill}) as "tenantId"`
  );
  return rows[0]?.tenantId || null;
}

export async function resolveAutoLarisPaymentTenant(
  transactionId: string,
  orderId: string,
  amountMinor: number
): Promise<string | null> {
  const rows = await runtimeDb.execute<{ tenantId: string | null }>(sql`
    select resolve_autolaris_payment_tenant(
      ${transactionId}, ${orderId}::uuid, ${amountMinor}::integer
    ) as "tenantId"
  `);
  return rows[0]?.tenantId || null;
}

export async function resolveIdempotencyTenant(key: string, requestPath: string): Promise<string | null> {
  const rows = await runtimeDb.execute<{ tenantId: string | null }>(
    sql`select resolve_idempotency_tenant(${key}, ${requestPath}) as "tenantId"`
  );
  return rows[0]?.tenantId || null;
}

function contextValue(value: string): string {
  if (value.includes("\u0000")) throw new Error("Database context values cannot contain null bytes");
  return value;
}

async function assertDatabaseRole(targetDb: RuntimeDatabase, expectedRole: "dotads_app" | "dotads_platform"): Promise<void> {
  const rows = await targetDb.execute<{
      currentUser: string;
      sessionUser: string;
      isSuperuser: boolean;
      bypassRls: boolean;
      ownsTenantTable: boolean;
    }>(sql`
      select current_user as "currentUser", session_user as "sessionUser",
        role.rolsuper as "isSuperuser", role.rolbypassrls as "bypassRls",
        pg_get_userbyid(table_info.relowner) = current_user as "ownsTenantTable"
      from pg_roles role
      cross join pg_class table_info
      join pg_namespace namespace on namespace.oid = table_info.relnamespace
      where role.rolname = current_user
        and namespace.nspname = 'public'
        and table_info.relname = 'tenants'
    `);
  const role = rows[0];
  if (
      !role || role.currentUser !== expectedRole ||
      role.sessionUser !== role.currentUser ||
      role.isSuperuser ||
      role.bypassRls ||
      role.ownsTenantTable
    ) {
    throw new Error(`Unsafe database role: expected distinct ${expectedRole} LOGIN with NOSUPERUSER NOBYPASSRLS and no table ownership`);
  }
}

async function assertRuntimeRole(platform: boolean): Promise<void> {
  if (platform) {
    platformRoleCheck ||= assertDatabaseRole(platformDb, "dotads_platform");
    return platformRoleCheck;
  }
  runtimeRoleCheck ||= assertDatabaseRole(runtimeDb, "dotads_app");
  return runtimeRoleCheck;
}

export async function withDatabaseContext<T>(
  context: DatabaseSessionContext,
  operation: () => Promise<T>
): Promise<T> {
  const platform = context.role === "SUPER_ADMIN";
  await assertRuntimeRole(platform);
  if (context.role !== "SUPER_ADMIN" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(context.tenantId)) {
    throw new Error("A valid tenantId is required for tenant database access");
  }

  const targetDb = platform ? platformDb : runtimeDb;
  return targetDb.transaction(async (tx) => {
    await tx.execute(sql`select
      set_config('app.user_id', ${contextValue(context.userId)}, true),
      set_config('app.user_email', ${contextValue(context.userEmail)}, true),
      set_config('app.tenant_id', ${contextValue(context.tenantId)}, true),
      set_config('app.organization_id', ${contextValue(context.organizationId)}, true),
      set_config('app.user_role', ${contextValue(context.role)}, true)`);

    return databaseContext.run(tx as unknown as RuntimeDatabase, operation);
  });
}

export const db = new Proxy(runtimeDb, {
  get(target, property, receiver) {
    const activeDb = databaseContext.getStore() || target;
    return Reflect.get(activeDb, property, activeDb === target ? receiver : activeDb);
  },
});

export function withTenantGuard<T extends { tenantId: string }>(
  data: T,
  expectedTenantId: string
): T {
  if (data.tenantId !== expectedTenantId) {
    throw new Error(
      `Tenant Isolation Violation: Data tenantId (${data.tenantId}) does not match expected tenantId (${expectedTenantId})`
    );
  }
  return data;
}
