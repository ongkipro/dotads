import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import {
  client,
  db,
  migrationClient,
  migrationDb,
  platformClient,
  resolveOrderTenantById,
  resolveOrderTenantByWaybill,
  withDatabaseContext,
  type DatabaseSessionContext,
} from "../src/client.ts";
import * as schema from "../src/schema/index.ts";

const tenantA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function context(tenantId: string, role = "ADMIN"): DatabaseSessionContext {
  return {
    userId: `test:${tenantId}`,
    userEmail: "rls-test@dotads.invalid",
    tenantId,
    organizationId: "",
    role,
    tenantName: "RLS Test",
    tenantStatus: "active",
  };
}

function postgresErrorCode(error: unknown): string | undefined {
  const seen = new Set<unknown>();
  let current = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if ("code" in current && typeof current.code === "string") return current.code;
    current = "cause" in current ? current.cause : undefined;
  }
  return undefined;
}

async function run() {
  await migrationDb.insert(schema.tenants).values([
    { id: tenantA, name: "RLS Tenant A", slug: "rls-tenant-a" },
    { id: tenantB, name: "RLS Tenant B", slug: "rls-tenant-b" },
  ]);
  await migrationDb.insert(schema.products).values([
    { tenantId: tenantA, name: "Product A", slug: "product-a", priceMinor: 100_000 },
    { tenantId: tenantB, name: "Product B", slug: "product-b", priceMinor: 200_000 },
  ]);
  await migrationDb.insert(schema.users).values([
    { id: "rls-user-a", name: "RLS User A", email: "rls-a@dotads.invalid" },
    { id: "rls-user-b", name: "RLS User B", email: "rls-b@dotads.invalid" },
  ]);
  await migrationDb.insert(schema.organizations).values([
    { id: "rls-org-a", tenantId: tenantA, name: "RLS Org A", slug: "rls-org-a" },
    { id: "rls-org-b", tenantId: tenantB, name: "RLS Org B", slug: "rls-org-b" },
  ]);
  await migrationDb.insert(schema.members).values([
    { id: "rls-member-a", organizationId: "rls-org-a", userId: "rls-user-a", role: "ADMIN" },
    { id: "rls-member-b", organizationId: "rls-org-b", userId: "rls-user-b", role: "ADMIN" },
  ]);
  const [orderA, orderB] = await migrationDb.insert(schema.orders).values([
    {
      tenantId: tenantA, orderNumber: "RLS-A", customerName: "A", customerPhone: "0800000001",
      shippingAddress: "Address A", cnoteNo: "WAYBILL-A",
    },
    {
      tenantId: tenantB, orderNumber: "RLS-B", customerName: "B", customerPhone: "0800000002",
      shippingAddress: "Address B", cnoteNo: "WAYBILL-B",
    },
  ]).returning({ id: schema.orders.id, tenantId: schema.orders.tenantId });

  assert.equal(await resolveOrderTenantById(orderA.id), tenantA);
  assert.equal(await resolveOrderTenantByWaybill("WAYBILL-B"), tenantB);
  assert.equal(await resolveOrderTenantById("cccccccc-cccc-4ccc-8ccc-cccccccccccc"), null);
  assert.equal(await resolveOrderTenantByWaybill("FORGED-WAYBILL"), null);

  const roleRows = await db.execute<{
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
    where role.rolname = current_user and namespace.nspname = 'public' and table_info.relname = 'tenants'
  `);
  assert.deepEqual(roleRows[0], {
    currentUser: "dotads_app",
    sessionUser: "dotads_app",
    isSuperuser: false,
    bypassRls: false,
    ownsTenantTable: false,
  });

  const unscoped = await db.select().from(schema.products);
  assert.equal(unscoped.length, 0, "No tenant context must expose zero tenant rows");

  await withDatabaseContext(context(tenantA), async () => {
    const visible = await db.select().from(schema.products);
    assert.deepEqual(visible.map((product) => product.tenantId), [tenantA]);
    const visibleOrders = await db.select().from(schema.orders);
    assert.deepEqual(visibleOrders.map((order) => order.tenantId), [tenantA]);
    const visibleMembers = await db.select().from(schema.members);
    assert.deepEqual(visibleMembers.map((member) => member.organizationId), ["rls-org-a"]);

    const updated = await db
      .update(schema.products)
      .set({ name: "Cross-tenant update" })
      .where(sql`${schema.products.tenantId} = ${tenantB}`)
      .returning();
    assert.equal(updated.length, 0, "Cross-tenant update must affect zero rows");

    await assert.rejects(
      db.transaction((tx) => tx.insert(schema.products).values({
          tenantId: tenantB,
          name: "Forged Product",
          slug: "forged-product",
          priceMinor: 1,
        })),
      (error: unknown) => postgresErrorCode(error) === "42501"
    );

    await assert.rejects(
      db.transaction((tx) => tx.insert(schema.orderItems).values({
        tenantId: tenantA,
        orderId: orderB.id,
        productName: "Forged cross-tenant item",
        priceMinor: 1,
        quantity: 1,
        subtotalMinor: 1,
      })),
      (error: unknown) => postgresErrorCode(error) === "42501"
    );

    await assert.rejects(
      db.transaction((tx) => tx.insert(schema.invitations).values({
        id: "rls-forged-invitation",
        organizationId: "rls-org-b",
        email: "forged@dotads.invalid",
        role: "ADMIN",
        inviterId: "rls-user-a",
        expiresAt: new Date(Date.now() + 60_000),
      })),
      (error: unknown) => postgresErrorCode(error) === "42501"
    );

    await db.execute(sql`reset role`);
    const [{ currentUser }] = await db.execute<{ currentUser: string }>(sql`select current_user as "currentUser"`);
    assert.equal(currentUser, "dotads_app", "RESET ROLE must not escalate the runtime login");
    await assert.rejects(db.transaction((tx) => tx.execute(sql`set role dotads_platform`)));
  });

  await withDatabaseContext(context("", "SUPER_ADMIN"), async () => {
    const visibleTenants = await db.select({ id: schema.tenants.id }).from(schema.tenants);
    const visibleOrders = await db.select({ tenantId: schema.orders.tenantId }).from(schema.orders);
    const tenantIds = new Set(visibleTenants.map((tenant) => tenant.id));
    const orderTenantIds = new Set(visibleOrders.map((order) => order.tenantId));
    assert.ok(tenantIds.has(tenantA) && tenantIds.has(tenantB), "Explicit SUPER_ADMIN context must see both test tenants");
    assert.ok(orderTenantIds.has(tenantA) && orderTenantIds.has(tenantB), "Explicit SUPER_ADMIN context must aggregate orders across test tenants");
  });

  const protectedTables = await migrationClient<{
    tableName: string;
    enabled: boolean;
    forced: boolean;
    policyCount: number;
  }[]>`
    select class.relname as "tableName", class.relrowsecurity as enabled,
      class.relforcerowsecurity as forced, count(policy.polname)::int as "policyCount"
    from pg_class class
    join pg_namespace namespace on namespace.oid = class.relnamespace
    left join pg_policy policy on policy.polrelid = class.oid
    where namespace.nspname = 'public'
      and class.relkind = 'r'
      and (class.relname in ('tenants', 'members', 'invitations') or exists (
        select 1 from pg_attribute attribute
        where attribute.attrelid = class.oid and attribute.attname = 'tenant_id' and not attribute.attisdropped
      ))
    group by class.oid
    order by class.relname
  `;
  assert.equal(protectedTables.length, 23);
  assert.ok(protectedTables.every((table) => table.enabled && table.forced && table.policyCount === 1));

  console.log("TENANT RLS SMOKE PASSED: 20 direct tenant tables + tenants/members/invitations; cross-tenant reads/writes denied");
}

run()
  .finally(async () => {
    await migrationDb.delete(schema.tenants).where(sql`${schema.tenants.id} in (${tenantA}, ${tenantB})`);
    await client.end();
    await platformClient.end();
    await migrationClient.end();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
