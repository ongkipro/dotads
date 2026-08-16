import { migrationDb as db, migrationClient as client } from "../src/client.ts";
import * as schema from "../src/schema/index.ts";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export async function seedDatabase() {
  console.log("==================================================================");
  console.log("🚀 STARTING DOTADS V2 COMPREHENSIVE DUMMY DATA SEEDING");
  console.log("==================================================================");

  // 1. Super Admin User
  console.log("\n[1/9] Seeding Platform Super Admin User...");
  await db
    .insert(schema.users)
    .values({
      id: "usr_super_admin_01",
      name: "Platform Super Admin",
      email: "superadmin@dotads.com",
      emailVerified: true,
      role: "SUPER_ADMIN",
    })
    .onConflictDoNothing();
  console.log("  ✓ Created Super Admin: superadmin@dotads.com");

  // 2. Tenant 1: Store Alpha (Physical Gadgets)
  console.log("\n[2/9] Seeding Tenant 1: Store Alpha Gadget...");
  const [tenantAlpha] = await db
    .insert(schema.tenants)
    .values({
      id: "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8",
      name: "Store Alpha Gadget",
      slug: "store-alpha",
      status: "active",
      tier: "pro",
      customDomain: "order.alphagadget.com",
    })
    .onConflictDoUpdate({
      target: schema.tenants.slug,
      set: { name: "Store Alpha Gadget" },
    })
    .returning();

  await db.insert(schema.tenantDomains).values({
    tenantId: tenantAlpha.id,
    hostname: "order.alphagadget.com",
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
    role: "TENANT_OWNER",
  }).onConflictDoNothing().returning();

  if (orgAlpha && userAlphaOwner) {
    await db.insert(schema.members).values({
      id: "mem_alpha_owner_01",
      organizationId: orgAlpha.id,
      userId: userAlphaOwner.id,
      role: "TENANT_OWNER",
    }).onConflictDoNothing();
  }

  // 3. Products for Store Alpha with WebP Images
  console.log("\n[3/9] Seeding Products & WebP Media for Store Alpha...");
  const [prodHeadphone] = await db.insert(schema.products).values({
    id: "22222222-2222-2222-2222-222222222222",
    tenantId: tenantAlpha.id,
    name: "Headphone Pro Max Wireless ANC",
    slug: "headphone-pro-max",
    description: "Headphone noise-cancelling premium untuk penikmat audio tinggi. Baterai tahan 40 jam.",
    priceMinor: 1499000,
    compareAtPriceMinor: 1999000,
    status: "active",
    gtin: "8991234567884",
    imagesJson: ["/images/products/gadget-headphone-pro.webp"],
  }).onConflictDoNothing().returning();

  const [prodWatch] = await db.insert(schema.products).values({
    id: "33333333-3333-3333-3333-333333333333",
    tenantId: tenantAlpha.id,
    name: "SmartWatch Ultra V2 Fitness",
    slug: "smartwatch-ultra-v2",
    description: "Smartwatch tahan air IP68 dengan Amoled display & pelacakan detak jantung real-time.",
    priceMinor: 899000,
    compareAtPriceMinor: 1299000,
    status: "active",
    gtin: "8991234567891",
    imagesJson: ["/images/products/smartwatch-ultra-v2.webp"],
  }).onConflictDoNothing().returning();
  console.log("  ✓ Seeded WebP Product Images");

  // 4. Integrations & Tracking Configs
  console.log("\n[4/9] Seeding Mengantar Logistics & Meta/Google/TikTok CAPI Configs...");
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

  // 5. Tenant 2: Store Beta & Tenant 3: Store Gamma
  console.log("\n[5/9] Seeding Tenant 2 (Digital) & Tenant 3 (Skincare)...");
  const [tenantBeta] = await db
    .insert(schema.tenants)
    .values({
      id: "3f3ca823-46bf-4ab5-a5fe-61a49d175fa9",
      name: "Store Beta Digital",
      slug: "store-beta",
      status: "active",
      tier: "starter",
      customDomain: "class.betadigital.id",
    })
    .onConflictDoUpdate({
      target: schema.tenants.slug,
      set: { name: "Store Beta Digital" },
    })
    .returning();

  await db.insert(schema.tenantDomains).values({
    tenantId: tenantBeta.id,
    hostname: "class.betadigital.id",
    isPrimary: true,
    status: "verified",
    verificationToken: "token_beta_verified_456",
  }).onConflictDoNothing();

  const [tenantGamma] = await db
    .insert(schema.tenants)
    .values({
      id: "4f4ca823-46bf-4ab5-a5fe-61a49d175fa0",
      name: "Gamma Skincare Official",
      slug: "gamma-skincare",
      status: "active",
      tier: "pro",
      customDomain: "glow.gammaskincare.co.id",
    })
    .onConflictDoUpdate({
      target: schema.tenants.slug,
      set: { name: "Gamma Skincare Official" },
    })
    .returning();

  // 6. Form Schemas with ALL 4 Presets (FULL, HYBRID, MIDDLE, MINI)
  console.log("\n[6/9] Seeding Form Schemas with 4 Mode Presets...");
  const presets = [
    { mode: "full", slug: "form-full-cod", name: "Form COD 1-Step Direct" },
    { mode: "hybrid", slug: "form-hybrid-stepper", name: "Form Progressive 2-Step Stepper" },
    { mode: "middle", slug: "form-middle-drawer", name: "Form Compact 1.5-Step Drawer" },
    { mode: "mini", slug: "form-mini-wa", name: "Form WhatsApp Lead Instant" },
  ];

  for (const preset of presets) {
    await db.insert(schema.formSchemas).values({
      tenantId: tenantAlpha.id,
      name: preset.name,
      slug: preset.slug,
      mode: preset.mode,
      draftSchemaJson: {
        preset: preset.mode,
        fields: ["customerName", "customerPhone", "shippingAddress", "subdistrictId", "courierCode", "paymentMethod"],
      },
    }).onConflictDoNothing();
  }
  console.log("  ✓ Seeded 4 Form Mode Presets (FULL, HYBRID, MIDDLE, MINI)");

  // 7. Seed Draft Leads (Blur Capture)
  console.log("\n[7/9] Seeding Draft WhatsApp Leads Captured on Blur...");
  const dummyLeads = [
    { name: "Budi Santoso", phone: "081234567890" },
    { name: "Siti Rahmawati", phone: "085711223344" },
    { name: "Agus Pratama", phone: "082199887766" },
    { name: "Dewi Lestari", phone: "081388776655" },
    { name: "Rudi Hermawan", phone: "087855443322" },
  ];

  for (const lead of dummyLeads) {
    await db.insert(schema.draftLeads).values({
      tenantId: tenantAlpha.id,
      customerName: lead.name,
      customerPhone: lead.phone,
      draftDataJson: { shippingAddress: "Jl. Merdeka No. 45" },
    }).onConflictDoNothing();
  }
  console.log("  ✓ Seeded Draft WhatsApp Lead Records");

  // 8. Seed Comprehensive Orders across All Statuses
  console.log("\n[8/9] Seeding Orders & Order Items across All Statuses...");
  const dummyOrders = [
    { num: "ORD-ALPHA-1001", status: "CONFIRMED", payStatus: "PAID", fulStatus: "UNFULFILLED", method: "QRIS", courier: "JNE", total: 1499000, risk: 15 },
    { num: "ORD-ALPHA-1002", status: "SHIPPED", payStatus: "UNPAID", fulStatus: "IN_TRANSIT", method: "COD", courier: "SICEPAT", total: 899000, risk: 20 },
    { num: "ORD-ALPHA-1003", status: "PENDING_PAYMENT", payStatus: "UNPAID", fulStatus: "UNFULFILLED", method: "VA_BCA", courier: "J&T", total: 1499000, risk: 45 },
    { num: "ORD-ALPHA-1004", status: "DELIVERED", payStatus: "PAID", fulStatus: "DELIVERED", method: "COD", courier: "JNE", total: 2398000, risk: 10 },
    { num: "ORD-ALPHA-1005", status: "CANCELLED", payStatus: "UNPAID", fulStatus: "RETURNED", method: "COD", courier: "SAP", total: 899000, risk: 85 },
  ];

  for (const o of dummyOrders) {
    const [orderRow] = await db.insert(schema.orders).values({
      tenantId: tenantAlpha.id,
      orderNumber: o.num,
      status: o.status,
      paymentStatus: o.payStatus,
      fulfillmentStatus: o.fulStatus,
      paymentMethod: o.method,
      customerName: "Budi Santoso",
      customerPhone: "081234567890",
      shippingAddress: "Jl. Sudirman No. 10, Kebayoran Baru, Jakarta Selatan",
      subdistrictId: "5fc62f63f8ff44b34a4ce00a",
      courierCode: o.courier,
      courierService: "REG",
      subtotalMinor: o.total - 10000,
      shippingCostMinor: 10000,
      totalMinor: o.total,
      cnoteNo: o.status === "SHIPPED" || o.status === "DELIVERED" ? `MNTR_${Date.now()}` : null,
      rtsRiskScore: o.risk,
      attributionJson: { _fbp: "fb.1.162345.123", _fbc: "fb.1.162345.456", gclid: "Cj0KCQj..." },
    }).onConflictDoNothing().returning();

    if (orderRow) {
      await db.insert(schema.orderItems).values({
        tenantId: tenantAlpha.id,
        orderId: orderRow.id,
        productId: prodHeadphone ? prodHeadphone.id : "22222222-2222-2222-2222-222222222222",
        productName: "Headphone Pro Max Wireless ANC",
        quantity: 1,
        priceMinor: o.total - 10000,
        subtotalMinor: o.total - 10000,
      }).onConflictDoNothing();
    }
  }
  console.log("  ✓ Seeded 5 Full Orders with Items, Risk Scores, and Attribution");

  // 9. Seed Multi-Platform Outbox Events & Audit Trail
  console.log("\n[9/9] Seeding Multi-Platform Tracking Outbox Events & Audit Trail...");
  const events = ["Purchase", "Lead", "AddToCart"];
  for (const evt of events) {
    await db.insert(schema.outboxEvents).values({
      tenantId: tenantAlpha.id,
      platform: "meta",
      destinationId: "123456789012345",
      eventName: evt,
      eventId: `evt_meta_${evt.toLowerCase()}_${Date.now()}`,
      payloadJson: {
        event_name: evt,
        event_time: Math.floor(Date.now() / 1000),
        user_data: { fn: "budi", ph: "081234567890" },
        custom_data: { currency: "IDR", value: 1499000 },
      },
      status: "pending",
    }).onConflictDoNothing();

    await db.insert(schema.outboxEvents).values({
      tenantId: tenantAlpha.id,
      platform: "google",
      destinationId: "G-ALPHA12345",
      eventName: evt,
      eventId: `evt_google_${evt.toLowerCase()}_${Date.now()}`,
      payloadJson: {
        event_name: evt,
        conversion_value: 1499000,
      },
      status: "pending",
    }).onConflictDoNothing();
  }

  await db.insert(schema.auditLogs).values({
    tenantId: tenantAlpha.id,
    action: "domain.verified",
    actorId: "usr_alpha_owner_01",
    actorEmail: "owner@store-alpha.com",
    actorRole: "TENANT_OWNER",
    targetType: "domain",
    targetId: "order.alphagadget.com",
    metadataJson: { hostname: "order.alphagadget.com", ip: "127.0.0.1" },
  }).onConflictDoNothing();

  await db.insert(schema.auditLogs).values({
    tenantId: tenantAlpha.id,
    action: "member.invited",
    actorId: "usr_alpha_owner_01",
    actorEmail: "owner@store-alpha.com",
    actorRole: "TENANT_OWNER",
    targetType: "member",
    targetId: "mem_admin_02",
    metadataJson: { invitedEmail: "admin@store-alpha.com", role: "ADMIN" },
  }).onConflictDoNothing();

  console.log("\n==================================================================");
  console.log("🎉 ALL DUMMY DATA SEEDED SUCCESSFULLY FOR DOTADS ENGINE V2!");
  console.log("==================================================================");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => client.end())
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("❌ Seeding failed:", msg);
      process.exit(1);
    });
}
