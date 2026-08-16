import assert from "node:assert/strict";
import { migrationClient, platformClient } from "../src/client.ts";

const EXPECTED_PLATFORM_GRANTS = [
  "audit_logs:INSERT",
  "audit_logs:SELECT",
  "mengantar_dispatch_queue:SELECT",
  "orders:SELECT",
  "tenants:INSERT",
  "tenants:SELECT",
  "tenants:UPDATE",
];
const AUTH_TABLES = ["accounts", "sessions", "users", "verifications"] as const;

function isPermissionDenied(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && error.code === "42501";
}

async function assertPermissionDenied(statement: string, description: string): Promise<void> {
  await assert.rejects(
    () => platformClient.unsafe(statement),
    (error) => isPermissionDenied(error),
    `${description} must fail with PostgreSQL insufficient_privilege`,
  );
}

async function run(): Promise<void> {
  const [identity] = await platformClient<[{ currentUser: string; schemaUsage: boolean }]>`
    select current_user as "currentUser",
      has_schema_privilege(current_user, 'public', 'USAGE') as "schemaUsage"
  `;
  assert.equal(identity.currentUser, "dotads_platform");
  assert.equal(identity.schemaUsage, true, "Platform role must retain public schema usage");

  const grants = await platformClient<Array<{ tableName: string; privilegeType: string }>>`
    select table_name as "tableName", privilege_type as "privilegeType"
    from information_schema.role_table_grants
    where grantee = current_user and table_schema = 'public'
    order by table_name, privilege_type
  `;
  assert.deepEqual(
    grants.map((grant) => `${grant.tableName}:${grant.privilegeType}`),
    EXPECTED_PLATFORM_GRANTS,
    "Platform role table grants must match the executable control-plane surface exactly",
  );

  for (const table of AUTH_TABLES) {
    await assertPermissionDenied(`select * from public.${table} limit 0`, `SELECT on ${table}`);
    await assertPermissionDenied(`insert into public.${table} default values`, `INSERT on ${table}`);
    await assertPermissionDenied(`update public.${table} set id = id where false`, `UPDATE on ${table}`);
    await assertPermissionDenied(`delete from public.${table} where false`, `DELETE on ${table}`);
  }

  await platformClient`select id from public.orders limit 0`;
  await assertPermissionDenied("insert into public.orders default values", "INSERT on orders");
  await assertPermissionDenied("update public.orders set id = id where false", "UPDATE on orders");
  await assertPermissionDenied("delete from public.orders where false", "DELETE on orders");
  await platformClient`select id from public.mengantar_dispatch_queue limit 0`;
  await assertPermissionDenied("insert into public.mengantar_dispatch_queue default values", "INSERT on dispatch queue");
  await assertPermissionDenied("update public.mengantar_dispatch_queue set id = id where false", "UPDATE on dispatch queue");
  await assertPermissionDenied("delete from public.mengantar_dispatch_queue where false", "DELETE on dispatch queue");
  await assertPermissionDenied("delete from public.tenants where false", "DELETE on tenants");
  await assertPermissionDenied("update public.audit_logs set id = id where false", "UPDATE on audit_logs");
  await assertPermissionDenied("delete from public.audit_logs where false", "DELETE on audit_logs");

  const [defaultGrant] = await migrationClient<[{ count: number }]>`
    select count(*)::int as count
    from pg_default_acl defaults
    left join pg_namespace namespace on namespace.oid = defaults.defaclnamespace
    cross join lateral aclexplode(defaults.defaclacl) privilege
    join pg_roles grantee on grantee.oid = privilege.grantee
    where grantee.rolname = 'dotads_platform'
      and defaults.defaclobjtype in ('r', 'S')
      and (namespace.nspname = 'public' or defaults.defaclnamespace = 0)
  `;
  assert.equal(defaultGrant.count, 0, "Future tables and sequences must not default-grant the platform role");

  const [migrationOwner] = await migrationClient<[{ canManageTables: boolean }]>`
    select has_table_privilege(current_user, 'public.users', 'SELECT,INSERT,UPDATE,DELETE')
      and has_table_privilege(current_user, 'public.orders', 'SELECT,INSERT,UPDATE,DELETE')
      as "canManageTables"
  `;
  assert.equal(migrationOwner.canManageTables, true, "Migration owner privileges must remain intact");

  console.log("PLATFORM LEAST-PRIVILEGE SMOKE PASSED: exact grants retained; auth and order mutations denied");
}

run()
  .finally(async () => Promise.all([platformClient.end(), migrationClient.end()]))
  .catch((error: unknown) => {
    console.error("PLATFORM LEAST-PRIVILEGE SMOKE FAILED", error);
    process.exit(1);
  });
