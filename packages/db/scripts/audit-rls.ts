import { client } from "../src/client.ts";

interface TenantTablePolicy {
  tableName: string;
  rlsEnabled: boolean;
  rlsForced: boolean;
}

async function auditTenantRls() {
  const tables = await client<TenantTablePolicy[]>`
    select
      class.relname as "tableName",
      class.relrowsecurity as "rlsEnabled",
      class.relforcerowsecurity as "rlsForced"
    from pg_class class
    join pg_namespace namespace on namespace.oid = class.relnamespace
    join pg_attribute attribute on attribute.attrelid = class.oid
    where namespace.nspname = 'public'
      and class.relkind = 'r'
      and attribute.attname = 'tenant_id'
      and not attribute.attisdropped
    order by class.relname
  `;

  const unprotected = tables.filter((table) => !table.rlsEnabled || !table.rlsForced);
  if (unprotected.length > 0) {
    throw new Error(
      `Tenant RLS missing or not forced on: ${unprotected.map((table) => table.tableName).join(", ")}`
    );
  }

  console.log(`TENANT RLS AUDIT PASSED (${tables.length} tenant-owned tables)`);
  await client.end();
}

auditTenantRls().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`TENANT RLS AUDIT FAILED: ${message}`);
  await client.end();
  process.exit(1);
});
