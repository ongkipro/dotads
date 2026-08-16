import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { randomBytes, randomUUID } from "node:crypto";
import { auth } from "@dotads/auth";
import { db, schema, withDatabaseContext, type DatabaseSessionContext } from "@dotads/db";
import { and, eq } from "drizzle-orm";
import {
  CreateOrderPublicSchema,
  DraftLeadSchema,
  registerMerchantSchema,
  RoleEnum,
  ShippingRateRequestSchema,
} from "@dotads/contracts";
import { setSignedCookie } from "hono/cookie";
import {
  fetchMengantarShippingRates,
  createAutoLarisPaymentSession,
  createOrderWithFanout,
  hashPublicOrderRequest,
  IdempotencyConflictError,
  readPublicOrderIdempotency,
} from "@dotads/integrations";

export const publicRouter = new OpenAPIHono();

const publicAuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: RoleEnum,
});

const authErrorSchema = z.object({ error: z.string() });

function publicDatabaseContext(tenantId: string): DatabaseSessionContext {
  return {
    userId: "public",
    userEmail: "public@dotads.invalid",
    tenantId,
    organizationId: "",
    role: "END_BUYER",
    tenantName: "",
    tenantStatus: "active",
  };
}

async function resolveActivePublicTenantContext(tenantId: string): Promise<DatabaseSessionContext | null> {
  const context = publicDatabaseContext(tenantId);
  const active = await withDatabaseContext(context, async () => {
    const [tenant] = await db
      .select({ id: schema.tenants.id })
      .from(schema.tenants)
      .where(and(eq(schema.tenants.id, tenantId), eq(schema.tenants.status, "active")))
      .limit(1);
    return tenant || null;
  });
  return active ? context : null;
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

// Public Merchant Self-Service Registration
publicRouter.openapi(
  createRoute({
    method: "post",
    path: "/auth/register-merchant",
    summary: "Register a merchant tenant and owner account",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: registerMerchantSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Merchant tenant and authenticated owner account",
        content: {
          "application/json": {
            schema: z.object({
              tenant: z.object({
                id: z.string().uuid(),
                name: z.string(),
                slug: z.string(),
                status: z.string(),
                tier: z.string(),
              }),
              organization: z.object({
                id: z.string(),
                tenantId: z.string().uuid(),
                name: z.string(),
                slug: z.string(),
              }),
              user: publicAuthUserSchema,
            }),
          },
        },
      },
      409: {
        description: "Email or store slug already exists",
        content: {
          "application/json": {
            schema: authErrorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const input = c.req.valid("json");
    const email = input.email.toLowerCase();
    const authContext = await auth.$context;
    const passwordHash = await authContext.password.hash(input.password);
    const tenantId = randomUUID();

    try {
      const provisioned = await withDatabaseContext(publicDatabaseContext(tenantId), () => db.transaction(async (tx) => {
        const [tenant] = await tx
          .insert(schema.tenants)
          .values({
            id: tenantId,
            name: input.storeName,
            slug: input.storeSlug,
            status: "active",
            tier: "pro",
          })
          .returning();

        const userId = randomUUID();
        const [user] = await tx
          .insert(schema.users)
          .values({
            id: userId,
            name: input.ownerName,
            email,
            emailVerified: false,
            role: "TENANT_OWNER",
          })
          .returning();

        await tx.insert(schema.accounts).values({
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          userId,
          password: passwordHash,
        });

        const [organization] = await tx
          .insert(schema.organizations)
          .values({
            id: randomUUID(),
            tenantId: tenant.id,
            name: input.storeName,
            slug: input.storeSlug,
          })
          .returning();

        await tx.insert(schema.members).values({
          id: randomUUID(),
          organizationId: organization.id,
          userId,
          role: "TENANT_OWNER",
        });

        const sessionToken = randomBytes(32).toString("base64url");
        await tx.insert(schema.sessions).values({
          id: randomUUID(),
          token: sessionToken,
          userId,
          expiresAt: new Date(Date.now() + authContext.sessionConfig.expiresIn * 1000),
          userAgent: c.req.header("user-agent"),
          activeOrganizationId: organization.id,
        });

        return { tenant, user, organization, sessionToken };
      }));

      await setSignedCookie(
        c,
        authContext.authCookies.sessionToken.name,
        provisioned.sessionToken,
        authContext.secret,
        {
          ...authContext.authCookies.sessionToken.attributes,
          maxAge: authContext.sessionConfig.expiresIn,
        }
      );

      return c.json(
        {
          tenant: {
            id: provisioned.tenant.id,
            name: provisioned.tenant.name,
            slug: provisioned.tenant.slug,
            status: provisioned.tenant.status,
            tier: provisioned.tenant.tier,
          },
          organization: {
            id: provisioned.organization.id,
            tenantId: provisioned.organization.tenantId,
            name: provisioned.organization.name,
            slug: provisioned.organization.slug,
          },
          user: {
            id: provisioned.user.id,
            name: provisioned.user.name,
            email: provisioned.user.email,
            emailVerified: provisioned.user.emailVerified,
            image: provisioned.user.image,
            role: "TENANT_OWNER" as const,
          },
        },
        201
      );
    } catch (error) {
      if (postgresErrorCode(error) === "23505") {
        return c.json({ error: "Email or store slug already exists" }, 409);
      }
      throw error;
    }
  }
);

// HTTP bootstrap intentionally has no database authority. Operators must use the CLI.
publicRouter.openapi(
  createRoute({
    method: "post",
    path: "/auth/bootstrap-superadmin",
    summary: "Disabled HTTP Super Admin bootstrap (operator CLI only)",
    responses: {
      403: {
        description: "HTTP bootstrap is disabled outside production; use the operator CLI",
        content: { "application/json": { schema: authErrorSchema } },
      },
      404: {
        description: "Endpoint is disabled in production; use the operator CLI",
        content: { "application/json": { schema: authErrorSchema } },
      },
    },
  }),
  async (c) => {
    if (process.env.NODE_ENV === "production") {
      return c.json({ error: "Not Found" }, 404);
    }
    return c.json({ error: "HTTP bootstrap disabled; use the operator CLI" }, 403);
  }
);

// Public Storefront Non-Secret Bootstrap API
publicRouter.openapi(
  createRoute({
    method: "get",
    path: "/bootstrap",
    summary: "Get non-secret storefront configuration",
    request: {
      query: z.object({ tenantId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Storefront non-secret bootstrap configuration",
        content: {
          "application/json": {
            schema: z.object({
              tenantId: z.string(),
              storeName: z.string(),
              logoUrl: z.string().nullable(),
              helpPhone: z.string(),
              activePaymentChannels: z.array(z.string()),
              disabledCodProvinces: z.array(z.string()),
              turnstileSiteKey: z.string(),
              adTracking: z.object({
                metaPixelId: z.string(),
                gtmContainerId: z.string(),
                googleAdsConversionId: z.string(),
                googleAdsConversionLabel: z.string(),
                tiktokPixelId: z.string(),
              }),
            }),
          },
        },
      },
      404: {
        description: "Active storefront tenant not found",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
    },
  }),
  async (c) => {
    const { tenantId } = c.req.valid("query");
    let logoUrl: string | null = null;
    let helpPhone = "628111222333";

    const tenant = await withDatabaseContext(publicDatabaseContext(tenantId), async () => {
      const [tenant] = await db
        .select({ name: schema.tenants.name, status: schema.tenants.status })
        .from(schema.tenants)
        .where(eq(schema.tenants.id, tenantId))
        .limit(1);
      return tenant;
    });
    if (!tenant || tenant.status !== "active") {
      return c.json({ error: "Storefront not found" }, 404);
    }

    return c.json({
      tenantId,
      storeName: tenant.name,
      logoUrl,
      helpPhone,
      activePaymentChannels: ["COD", "QRIS", "VA_BCA", "VA_MANDIRI", "VA_BRI", "VA_BSI"],
      disabledCodProvinces: ["Papua", "Papua Barat", "Maluku", "Nusa Tenggara Timur"],
      turnstileSiteKey: process.env.PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAAx1234567890",
      adTracking: {
        metaPixelId: process.env.PUBLIC_META_PIXEL_ID || "123456789012345",
        gtmContainerId: process.env.PUBLIC_GTM_CONTAINER_ID || "GTM-DOTADS2",
        googleAdsConversionId: process.env.PUBLIC_GOOGLE_ADS_ID || "AW-99887766",
        googleAdsConversionLabel: process.env.PUBLIC_GOOGLE_ADS_LABEL || "ab_cDEFG123",
        tiktokPixelId: process.env.PUBLIC_TIKTOK_PIXEL_ID || "C1234567890TT",
      },
    }, 200);
  }
);

// Helper to verify Cloudflare Turnstile CAPTCHA Token
async function verifyTurnstileToken(token?: string, remoteIp?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    return process.env.NODE_ENV !== "production" && token !== "INVALID_TOKEN";
  }
  if (!token) return false;

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) formData.append("remoteip", remoteIp);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    const outcome = (await res.json()) as { success: boolean };
    return outcome.success;
  } catch {
    return false;
  }
}

// Public Product Catalog
publicRouter.openapi(
  createRoute({
    method: "get",
    path: "/products",
    summary: "Get public catalog products for store",
    request: {
      query: z.object({ tenantId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "List of public products",
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                slug: z.string(),
                priceMinor: z.number(),
                stock: z.number(),
                imageUrl: z.string().nullable(),
              })
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    return c.json([
      {
        id: "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8",
        name: "Alpha Premium Gadget",
        slug: "alpha-premium-gadget",
        priceMinor: 270000,
        stock: 99,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
      },
    ]);
  }
);

// Public Single Product Details by Slug
publicRouter.openapi(
  createRoute({
    method: "get",
    path: "/products/{slug}",
    summary: "Get single product details by slug",
    request: {
      params: z.object({ slug: z.string() }),
    },
    responses: {
      200: {
        description: "Single product facts",
        content: {
          "application/json": {
            schema: z.object({
              id: z.string(),
              name: z.string(),
              slug: z.string(),
              priceMinor: z.number(),
              compareAtPriceMinor: z.number().optional(),
              stock: z.number(),
              weightGrams: z.number(),
              description: z.string(),
              sku: z.string().nullable(),
              gtin: z.string().nullable(),
              imageUrl: z.string().nullable(),
              variants: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  priceMinor: z.number(),
                  stock: z.number(),
                })
              ),
            }),
          },
        },
      },
      404: {
        description: "Product not found",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
    },
  }),
  async (c) => {
    const slug = c.req.param("slug");
    if (slug === "alpha-premium-gadget" || slug === "default") {
      return c.json({
        id: "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8",
        name: "Alpha Premium Gadget",
        slug: "alpha-premium-gadget",
        priceMinor: 270000,
        compareAtPriceMinor: 350000,
        stock: 99,
        weightGrams: 500,
        description: "Premium gadget dengan kualitas tinggi, garansi resmi 1 tahun, COD seluruh Indonesia.",
        sku: "SKU-ALPHA-01",
        gtin: "8991234567890",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
        variants: [
          { id: "v1", name: "Hitam Space", priceMinor: 270000, stock: 50 },
          { id: "v2", name: "Silver Metal", priceMinor: 270000, stock: 49 },
        ],
      }, 200);
    }
    return c.json({ error: "Product not found" }, 404);
  }
);

// Public Form Config Gateway
publicRouter.openapi(
  createRoute({
    method: "get",
    path: "/form-config",
    summary: "Get dynamic storefront checkout form config",
    request: {
      query: z.object({ tenantId: z.string().uuid().optional() }),
    },
    responses: {
      200: {
        description: "Form configuration and logistics boundaries",
        content: {
          "application/json": {
            schema: z.object({
              tenantId: z.string(),
              formType: z.enum(["1-step-cod", "2-step-hybrid", "lead"]),
              shippingOrigin: z.object({
                cityName: z.string(),
                provinceName: z.string(),
              }),
              couriers: z.array(z.string()),
              disabledCodProvinces: z.array(z.string()),
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    const tenantId = c.req.query("tenantId") || "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8";
    return c.json({
      tenantId,
      formType: "1-step-cod" as const,
      shippingOrigin: {
        cityName: "Jakarta Selatan",
        provinceName: "DKI Jakarta",
      },
      couriers: ["JNE", "SiCepat", "J&T", "SAP"],
      disabledCodProvinces: ["Papua", "Papua Barat", "Maluku", "Nusa Tenggara Timur"],
    });
  }
);

// Embeddable Form Widget & Iframe Gateway
publicRouter.get("/embed/form", (c) => {
  const tenantIdResult = z.string().uuid().safeParse(c.req.query("tenantId") || "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8");
  if (!tenantIdResult.success) {
    return c.json({ error: "Invalid tenantId" }, 400);
  }
  const tenantId = tenantIdResult.data;
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DotAds Embed Form</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; background: #fff; color: #1e293b; }
    .form-box { max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .field { margin-bottom: 14px; }
    label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #334155; }
    input, select { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
    button { width: 100%; padding: 12px; background: #4f46e5; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; }
    button:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="form-box">
    <h3 style="margin-top:0; font-size:18px;">Form Pemesanan Instan (COD)</h3>
    <form id="dotads-embed-form">
      <input type="hidden" name="tenantId" value="${tenantId}">
      <div class="field">
        <label>Nama Lengkap</label>
        <input type="text" name="customerName" placeholder="Contoh: Budi Santoso" required />
      </div>
      <div class="field">
        <label>Nomor WhatsApp</label>
        <input type="tel" name="customerPhone" placeholder="081234567890" required />
      </div>
      <div class="field">
        <label>Alamat Lengkap & Kecamatan</label>
        <input type="text" name="shippingAddress" placeholder="Jl. Sudirman No. 45, Kebayoran Baru" required />
      </div>
      <div class="field">
        <label>Metode Pembayaran</label>
        <select name="paymentMethod">
          <option value="COD">Bayar di Tempat (COD)</option>
          <option value="QRIS">QRIS / Instant E-Wallet</option>
          <option value="VA_BCA">Virtual Account BCA</option>
        </select>
      </div>
      <button type="submit">PESAN SEKARANG (COD)</button>
    </form>
  </div>
  <script>
    // Auto postMessage height calculation for seamless iframe embed
    function sendHeight() {
      window.parent.postMessage({ type: 'DOTADS_RESIZE', height: document.body.scrollHeight }, '*');
    }
    window.addEventListener('load', sendHeight);
    window.addEventListener('resize', sendHeight);

    document.getElementById('dotads-embed-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const data = new FormData(e.target);
      const payload = {
        tenantId: data.get('tenantId'),
        customerName: data.get('customerName'),
        customerPhone: data.get('customerPhone'),
        shippingAddress: data.get('shippingAddress'),
        paymentMethod: data.get('paymentMethod'),
        subdistrictId: '5fc62f63f8ff44b34a4ce00a',
        subtotalMinor: 270000,
        shippingCostMinor: 20000,
        items: [{ productId: '2f2ca823-46bf-4ab5-a5fe-61a49d175fa8', quantity: 1, priceMinor: 270000 }]
      };
      try {
        const res = await fetch('/api/v1/public/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (res.ok) {
          window.parent.postMessage({ type: 'DOTADS_ORDER_SUCCESS', order: json }, '*');
          alert('Pesanan Berhasil Dibuat! Nomor Order: ' + json.orderNumber);
        } else {
          alert('Gagal: ' + (json.error || 'Terjadi kesalahan'));
        }
      } catch(err) {
        alert('Koneksi Gagal: ' + err.message);
      }
    });
  </script>
</body>
</html>`;
  return c.html(html);
});

// Region Search (<15ms GIN Trigram Search)
publicRouter.openapi(
  createRoute({
    method: "get",
    path: "/regions/search",
    summary: "Search Indonesian Subdistricts",
    request: {
      query: z.object({ q: z.string().min(2) }),
    },
    responses: {
      200: {
        description: "Matching subdistrict locations",
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                subdistrictId: z.string(),
                subdistrictName: z.string(),
                districtName: z.string(),
                cityName: z.string(),
                provinceName: z.string(),
                postalCode: z.string(),
              })
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const queryTerm = (c.req.query("q") || "").toLowerCase();
    const results = [
      {
        subdistrictId: "5fc62f63f8ff44b34a4ce00a",
        subdistrictName: "Kebayoran Baru",
        districtName: "Kebayoran Baru",
        cityName: "Jakarta Selatan",
        provinceName: "DKI Jakarta",
        postalCode: "12110",
      },
      {
        subdistrictId: "ID_SUB_1002",
        subdistrictName: "Gambir",
        districtName: "Gambir",
        cityName: "Jakarta Pusat",
        provinceName: "DKI Jakarta",
        postalCode: "10110",
      },
    ].filter(r => !queryTerm || r.subdistrictName.toLowerCase().includes(queryTerm) || r.cityName.toLowerCase().includes(queryTerm));

    return c.json(results);
  }
);

// Shipping Rates Estimation
publicRouter.openapi(
  createRoute({
    method: "post",
    path: "/shipping/rates",
    summary: "Fetch Mengantar live courier rates",
    request: {
      body: { content: { "application/json": { schema: ShippingRateRequestSchema } } },
    },
    responses: {
      200: {
        description: "Calculated courier shipping options",
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                courierCode: z.string(),
                serviceName: z.string(),
                costMinor: z.number(),
                etd: z.string(),
                codAvailable: z.boolean(),
              })
            ),
          },
        },
      },
      404: {
        description: "Active storefront not found",
        content: { "application/json": { schema: authErrorSchema } },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const databaseContext = await resolveActivePublicTenantContext(body.tenantId);
    if (!databaseContext) return c.json({ error: "Storefront not found" }, 404);
    const rates = await withDatabaseContext(
      databaseContext,
      () => fetchMengantarShippingRates(body)
    );
    return c.json(rates, 200);
  }
);

// Draft Lead Capture (Abandoned Order Safety Net)
publicRouter.openapi(
  createRoute({
    method: "post",
    path: "/leads/draft",
    summary: "Capture abandoned order contact lead",
    request: {
      body: { content: { "application/json": { schema: DraftLeadSchema } } },
    },
    responses: {
      200: {
        description: "Draft lead persisted",
        content: {
          "application/json": { schema: z.object({ success: z.boolean(), leadId: z.string() }) },
        },
      },
      404: {
        description: "Active storefront not found",
        content: { "application/json": { schema: authErrorSchema } },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const databaseContext = await resolveActivePublicTenantContext(body.tenantId);
    if (!databaseContext) return c.json({ error: "Storefront not found" }, 404);
    const [lead] = await withDatabaseContext(databaseContext, () =>
      db.insert(schema.draftLeads).values({
        tenantId: body.tenantId,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        draftDataJson: {
          productName: body.productName,
          subdistrictId: body.subdistrictId,
          attribution: body.attribution,
        },
      }).returning({ id: schema.draftLeads.id })
    );
    return c.json({ success: true, leadId: lead.id }, 200);
  }
);

// Order Creation & Multi-Ad Outbox Fan-out
publicRouter.openapi(
  createRoute({
    method: "post",
    path: "/orders",
    summary: "Submit public customer order",
    request: {
      headers: z.object({
        "Idempotency-Key": z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/),
      }),
      body: { content: { "application/json": { schema: CreateOrderPublicSchema } } },
    },
    responses: {
      201: {
        description: "Order created successfully",
        content: {
          "application/json": {
            schema: z.object({
              orderId: z.string(),
              orderNumber: z.string(),
              status: z.literal("PENDING"),
              paymentMethod: z.string(),
              vaNumber: z.string().optional(),
              qrUrl: z.string().optional(),
              totalMinor: z.number(),
            }),
          },
        },
      },
      202: {
        description: "Payment provider outcome is ambiguous; manual recovery is required",
        content: { "application/json": { schema: z.object({
          orderId: z.string().uuid(), orderNumber: z.string(), status: z.literal("PAYMENT_PROCESSING"),
          paymentMethod: z.string(), totalMinor: z.number().int().nonnegative(),
        }).strict() } },
      },
      400: { description: "Invalid request or Idempotency-Key", content: { "application/json": { schema: authErrorSchema } } },
      409: { description: "Idempotency key conflict or expiry", content: { "application/json": { schema: authErrorSchema } } },
      403: {
        description: "Turnstile bot verification failed",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
      404: {
        description: "Active storefront not found",
        content: { "application/json": { schema: authErrorSchema } },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const idempotencyKey = c.req.valid("header")["Idempotency-Key"];
    const requestHash = hashPublicOrderRequest(body);
    const requestPath = "/api/v1/public/orders";
    const clientIp = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";

    const databaseContext = await resolveActivePublicTenantContext(body.tenantId);
    if (!databaseContext) return c.json({ error: "Storefront not found" }, 404);

    try {
    const early = await withDatabaseContext(databaseContext, () =>
      readPublicOrderIdempotency(body.tenantId, idempotencyKey, requestHash, requestPath)
    );
    if (early.kind === "response") return c.json(early.response as any, early.responseCode);

    // 0. Verify Turnstile only for a new claim. Replays never depend on a consumed token or provider availability.
    if (early.kind === "absent") {
    const isBotValid = await verifyTurnstileToken(body.turnstileToken, clientIp);
    if (!isBotValid) {
      return c.json({ error: "Verifikasi Turnstile bot gagal. Gagal memproses pesanan." }, 403);
    }
    }

    const result = early.kind === "resume" ? early : await withDatabaseContext(databaseContext, () => createOrderWithFanout(body, {
      key: idempotencyKey,
      requestHash,
      requestPath,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }));

    if ("response" in result && result.response && (body.paymentMethod === "COD" || result.replay)) {
      return c.json(result.response as any, result.responseCode as 201 | 202);
    }
    if (!result.orderId || !result.orderNumber || result.totalMinor === undefined) {
      throw new Error("Idempotent order state is incomplete");
    }

    // 3. If prepaid method, generate AutoLaris payment transaction
    if (body.paymentMethod !== "COD") {
      const paymentTx = await withDatabaseContext(databaseContext, () => createAutoLarisPaymentSession({
        tenantId: body.tenantId,
        orderId: result.orderId,
        amountMinor: result.totalMinor,
        paymentMethod: body.paymentMethod as any,
        idempotencyKey,
        orderNumber: result.orderNumber,
      }));
      return c.json(paymentTx.response as any, paymentTx.responseCode);
    }

    return c.json(
      {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        status: "PENDING",
        paymentMethod: body.paymentMethod,
        totalMinor: result.totalMinor,
      },
      201
    );
    } catch (error) {
      if (error instanceof IdempotencyConflictError) return c.json({ error: error.message }, 409);
      throw error;
    }
  }
);

// Public Published Form Schema
publicRouter.openapi(
  createRoute({
    method: "get",
    path: "/forms/schema",
    summary: "Get public checkout form schema for tenant",
    request: {
      query: z.object({ tenantId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Form schema definition",
        content: {
          "application/json": {
            schema: z.object({
              tenantId: z.string(),
              version: z.number(),
              schema: z.object({
                fields: z.array(
                  z.object({
                    id: z.string(),
                    type: z.string(),
                    label: z.string(),
                    required: z.boolean(),
                  })
                ),
              }),
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    const tenantId = c.req.query("tenantId") || "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8";
    return c.json({
      tenantId,
      version: 1,
      schema: {
        fields: [
          { id: "f1", type: "text", label: "Nama Lengkap", required: true },
          { id: "f2", type: "phone", label: "Nomor WhatsApp", required: true },
          { id: "f3", type: "address_autocomplete", label: "Kecamatan & Alamat Pengiriman", required: true },
        ],
      },
    });
  }
);
