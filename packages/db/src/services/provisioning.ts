import { db, resolveIdempotencyTenant, withDatabaseContext, type DatabaseSessionContext } from "../client.ts";
import * as schema from "../schema/index.ts";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export interface ProvisionTenantInput {
  tenantName: string;
  tenantSlug: string;
  ownerName: string;
  ownerEmail: string;
  idempotencyKey: string;
  customDomain?: string;
}

export interface ProvisionTenantResult {
  tenant: typeof schema.tenants.$inferSelect;
  organization: typeof schema.organizations.$inferSelect;
  user: typeof schema.users.$inferSelect;
  member: typeof schema.members.$inferSelect;
  isIdempotentReplay: boolean;
}

export async function provisionTenantTransaction(
  input: ProvisionTenantInput
): Promise<ProvisionTenantResult> {
  const requestPath = "/api/v1/admin/provision";
  const existingTenantId = await resolveIdempotencyTenant(input.idempotencyKey, requestPath);
  const tenantId = existingTenantId || randomUUID();
  const context: DatabaseSessionContext = {
    userId: "tenant-provisioner",
    userEmail: "provisioner@dotads.invalid",
    tenantId,
    organizationId: "",
    role: "END_BUYER",
    tenantName: input.tenantName,
    tenantStatus: "active",
  };

  return withDatabaseContext(context, async () => {
  // 1. Check idempotency record
  const [existingKey] = await db
    .select()
    .from(schema.idempotencyKeys)
    .where(eq(schema.idempotencyKeys.key, input.idempotencyKey));

  if (existingKey) {
    const cachedResponse = existingKey.responseJson as unknown as ProvisionTenantResult;
    return { ...cachedResponse, isIdempotentReplay: true };
  }

  // 2. Run transactional provisioning
  return await db.transaction(async (tx) => {
    // Create Tenant
    const [tenant] = await tx
      .insert(schema.tenants)
      .values({
        id: tenantId,
        name: input.tenantName,
        slug: input.tenantSlug,
        status: "active",
        tier: "pro",
        customDomain: input.customDomain,
      })
      .returning();

    // Create primary domain record if provided
    if (input.customDomain) {
      await tx.insert(schema.tenantDomains).values({
        tenantId: tenant.id,
        hostname: input.customDomain,
        isPrimary: true,
        status: "pending",
        verificationToken: `token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      }).onConflictDoNothing();
    }

    // Create User (Owner)
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const [user] = await tx
      .insert(schema.users)
      .values({
        id: userId,
        name: input.ownerName,
        email: input.ownerEmail.toLowerCase(),
        emailVerified: true,
      })
      .returning();

    // Create Organization
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const [organization] = await tx
      .insert(schema.organizations)
      .values({
        id: orgId,
        tenantId: tenant.id,
        name: `${input.tenantName} Org`,
        slug: `${input.tenantSlug}-org`,
      })
      .returning();

    // Create Organization Membership with TENANT_OWNER role
    const memberId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const [member] = await tx
      .insert(schema.members)
      .values({
        id: memberId,
        organizationId: organization.id,
        userId: user.id,
        role: "TENANT_OWNER",
      })
      .returning();

    // Create default tenant tracking and mengantar configs
    await tx.insert(schema.trackingConfigs).values({
      tenantId: tenant.id,
      metaEnabled: true,
      googleEnabled: true,
      tiktokEnabled: true,
    });

    await tx.insert(schema.mengantarConfigs).values({
      tenantId: tenant.id,
      apiKey: `pending_key_${tenant.id}`,
      sandbox: true,
      defaultCourier: "JNE",
    });

    const result: ProvisionTenantResult = {
      tenant,
      organization,
      user,
      member,
      isIdempotentReplay: false,
    };

    // Save Idempotency Record
    await tx.insert(schema.idempotencyKeys).values({
      tenantId: tenant.id,
      key: input.idempotencyKey,
      requestPath,
      responseCode: 201,
      responseJson: result as unknown as Record<string, unknown>,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    return result;
  });
  });
}
