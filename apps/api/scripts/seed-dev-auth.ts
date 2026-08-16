import { auth } from "@dotads/auth";
import { client, migrationClient, migrationDb, platformClient, schema } from "@dotads/db";
import { and, eq } from "drizzle-orm";

const DEV_EMAIL = "merchant@dotads.local";
const DEV_USER_ID = "usr_dev_tenant_owner_01";
const DEV_ACCOUNT_ID = "acc_dev_tenant_owner_01";
const DEV_MEMBER_ID = "mem_dev_tenant_owner_01";
const DEV_SUPERADMIN_EMAIL = "admin@dotads.local";
const DEV_SUPERADMIN_USER_ID = "usr_dev_super_admin_01";
const DEV_SUPERADMIN_ACCOUNT_ID = "acc_dev_super_admin_01";
const DEV_SECOND_ORGANIZATION_ID = "org_dev_merchant_second_01";
const DEV_SECOND_MEMBER_ID = "mem_dev_merchant_second_01";
const DEV_SUSPENDED_TENANT_ID = "5f5ca823-46bf-4ab5-a5fe-61a49d175fa1";
const DEV_SUSPENDED_ORGANIZATION_ID = "org_dev_merchant_suspended_01";
const DEV_SUSPENDED_MEMBER_ID = "mem_dev_merchant_suspended_01";

async function seedDevAuth() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development auth fixture is disabled in production");
  }
  const password = process.env.DOTADS_DEV_TENANT_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("DOTADS_DEV_TENANT_PASSWORD with at least 8 characters is required");
  }
  const superAdminPassword = process.env.DOTADS_DEV_SUPERADMIN_PASSWORD;
  if (!superAdminPassword || superAdminPassword.length < 4) {
    throw new Error("DOTADS_DEV_SUPERADMIN_PASSWORD with at least 4 characters is required");
  }

  const [tenant] = await migrationDb
    .select({ id: schema.tenants.id })
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, "store-alpha"))
    .limit(1);
  if (!tenant) throw new Error("Run db:seed before creating the development auth fixture");
  const [organization] = await migrationDb
    .select({ id: schema.organizations.id })
    .from(schema.organizations)
    .where(eq(schema.organizations.tenantId, tenant.id))
    .limit(1);
  if (!organization) throw new Error("Seeded Store Alpha organization is missing");

  const passwordHash = await (await auth.$context).password.hash(password);
  const superAdminPasswordHash = await (await auth.$context).password.hash(superAdminPassword);
  await migrationDb.transaction(async (tx) => {
    await tx.insert(schema.users).values({
      id: DEV_SUPERADMIN_USER_ID,
      name: "Local Super Admin",
      email: DEV_SUPERADMIN_EMAIL,
      emailVerified: true,
      role: "SUPER_ADMIN",
    }).onConflictDoUpdate({
      target: schema.users.id,
      set: { name: "Local Super Admin", email: DEV_SUPERADMIN_EMAIL, role: "SUPER_ADMIN", updatedAt: new Date() },
    });
    await tx.insert(schema.accounts).values({
      id: DEV_SUPERADMIN_ACCOUNT_ID,
      accountId: DEV_SUPERADMIN_USER_ID,
      providerId: "credential",
      userId: DEV_SUPERADMIN_USER_ID,
      password: superAdminPasswordHash,
    }).onConflictDoUpdate({
      target: schema.accounts.id,
      set: { password: superAdminPasswordHash, updatedAt: new Date() },
    });
    await tx.insert(schema.users).values({
      id: DEV_USER_ID,
      name: "Local Tenant Admin",
      email: DEV_EMAIL,
      emailVerified: true,
      role: "TENANT_OWNER",
    }).onConflictDoUpdate({
      target: schema.users.id,
      set: { name: "Local Tenant Admin", email: DEV_EMAIL, role: "TENANT_OWNER", updatedAt: new Date() },
    });
    await tx.insert(schema.accounts).values({
      id: DEV_ACCOUNT_ID,
      accountId: DEV_USER_ID,
      providerId: "credential",
      userId: DEV_USER_ID,
      password: passwordHash,
    }).onConflictDoUpdate({
      target: schema.accounts.id,
      set: { password: passwordHash, updatedAt: new Date() },
    });
    const [membership] = await tx.select({ id: schema.members.id }).from(schema.members).where(and(
      eq(schema.members.organizationId, organization.id),
      eq(schema.members.userId, DEV_USER_ID)
    )).limit(1);
    if (!membership) {
      await tx.insert(schema.members).values({
        id: DEV_MEMBER_ID,
        organizationId: organization.id,
        userId: DEV_USER_ID,
        role: "TENANT_OWNER",
      });
    }
    if (process.env.DOTADS_DEV_AMBIGUOUS_WORKSPACES === "true") {
      await tx.insert(schema.organizations).values({
        id: DEV_SECOND_ORGANIZATION_ID,
        tenantId: tenant.id,
        name: "Store Alpha Secondary Workspace",
        slug: "store-alpha-secondary-dev",
      }).onConflictDoUpdate({
        target: schema.organizations.id,
        set: { name: "Store Alpha Secondary Workspace" },
      });
      await tx.insert(schema.members).values({
        id: DEV_SECOND_MEMBER_ID,
        organizationId: DEV_SECOND_ORGANIZATION_ID,
        userId: DEV_USER_ID,
        role: "ADMIN",
      }).onConflictDoNothing();
      await tx.insert(schema.tenants).values({
        id: DEV_SUSPENDED_TENANT_ID,
        name: "Suspended Merchant Workspace",
        slug: "suspended-merchant-dev",
        status: "suspended",
        tier: "starter",
      }).onConflictDoUpdate({
        target: schema.tenants.id,
        set: { name: "Suspended Merchant Workspace", status: "suspended" },
      });
      await tx.insert(schema.organizations).values({
        id: DEV_SUSPENDED_ORGANIZATION_ID,
        tenantId: DEV_SUSPENDED_TENANT_ID,
        name: "Suspended Merchant Organization",
        slug: "suspended-merchant-org-dev",
      }).onConflictDoUpdate({
        target: schema.organizations.id,
        set: { name: "Suspended Merchant Organization" },
      });
      await tx.insert(schema.members).values({
        id: DEV_SUSPENDED_MEMBER_ID,
        organizationId: DEV_SUSPENDED_ORGANIZATION_ID,
        userId: DEV_USER_ID,
        role: "TENANT_OWNER",
      }).onConflictDoNothing();
    }
  });

  const mode = process.env.DOTADS_DEV_AMBIGUOUS_WORKSPACES === "true" ? "ambiguous workspace picker" : "single workspace";
  console.log(`Development logins ready: admin (${DEV_SUPERADMIN_EMAIL}) and merchant (${DEV_EMAIL}); ${mode}; passwords loaded from dev environment`);
}

seedDevAuth()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => Promise.all([client.end(), platformClient.end(), migrationClient.end()]));
