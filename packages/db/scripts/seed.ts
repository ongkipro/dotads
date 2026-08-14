import { db, client } from "../src/client.ts";
import * as schema from "../src/schema/index.ts";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export async function seedDatabase() {
  console.log("Seeding deterministic development data...");

  // 1. Create Super Admin User
  await db
    .insert(schema.users)
    .values({
      id: "usr_super_admin_01",
      name: "Platform Super Admin",
      email: "superadmin@dotads.com",
      emailVerified: true,
    })
    .onConflictDoNothing();

  // 2. Create Tenant 1: Store Alpha
  const [tenantAlpha] = await db
    .insert(schema.tenants)
    .values({
      name: "Store Alpha",
      slug: "store-alpha",
      status: "active",
      tier: "pro",
      customDomain: "store-alpha.com",
    })
    .onConflictDoUpdate({
      target: schema.tenants.slug,
      set: { name: "Store Alpha" },
    })
    .returning();

  await db.insert(schema.tenantDomains).values({
    tenantId: tenantAlpha.id,
    hostname: "store-alpha.com",
    isPrimary: true,
    status: "verified",
    verificationToken: "token_alpha_verified_123",
  }).onConflictDoNothing();

  const [orgAlpha] = await db.insert(schema.organizations).values({
    id: "org_alpha_01",
    tenantId: tenantAlpha.id,
    name: "Store Alpha Org",
    slug: "store-alpha-org",
  }).onConflictDoNothing().returning();

  const [userAlphaOwner] = await db.insert(schema.users).values({
    id: "usr_alpha_owner_01",
    name: "Alpha Tenant Owner",
    email: "owner@store-alpha.com",
    emailVerified: true,
  }).onConflictDoNothing().returning();

  if (orgAlpha && userAlphaOwner) {
    await db.insert(schema.members).values({
      id: "mem_alpha_owner_01",
      organizationId: orgAlpha.id,
      userId: userAlphaOwner.id,
      role: "TENANT_OWNER",
    }).onConflictDoNothing();
  }

  // Seed Product for Tenant Alpha
  await db.insert(schema.products).values({
    tenantId: tenantAlpha.id,
    name: "Alpha Premium Gadget",
    slug: "alpha-premium-gadget",
    description: "Best gadget for direct-response ads",
    priceMinor: 299000,
    compareAtPriceMinor: 499000,
    status: "active",
    gtin: "8991234567890",
  }).onConflictDoNothing();

  // Seed Mengantar & Tracking Config for Tenant Alpha
  await db.insert(schema.mengantarConfigs).values({
    tenantId: tenantAlpha.id,
    apiKey: "sandbox-mengantar-alpha-key",
    sandbox: true,
    defaultCourier: "JNE",
  }).onConflictDoNothing();

  await db.insert(schema.trackingConfigs).values({
    tenantId: tenantAlpha.id,
    metaPixelId: "123456789012345",
    metaCapiToken: "mock_capi_token_alpha",
    googleTagId: "G-ALPHA12345",
    tiktokPixelId: "C123456789012345",
  }).onConflictDoNothing();

  // 3. Create Tenant 2: Store Beta
  const [tenantBeta] = await db
    .insert(schema.tenants)
    .values({
      name: "Store Beta",
      slug: "store-beta",
      status: "active",
      tier: "starter",
      customDomain: "store-beta.com",
    })
    .onConflictDoUpdate({
      target: schema.tenants.slug,
      set: { name: "Store Beta" },
    })
    .returning();

  await db.insert(schema.tenantDomains).values({
    tenantId: tenantBeta.id,
    hostname: "store-beta.com",
    isPrimary: true,
    status: "verified",
    verificationToken: "token_beta_verified_456",
  }).onConflictDoNothing();

  console.log("Deterministic seed completed successfully!");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => client.end())
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Seeding failed:", msg);
      process.exit(1);
    });
}
