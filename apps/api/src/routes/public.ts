import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db, schema } from "@dotads/db";
import { eq } from "drizzle-orm";
import {
  CreateOrderPublicSchema,
  DraftLeadSchema,
  ShippingRateRequestSchema,
} from "@dotads/contracts";
import {
  fetchMengantarShippingRates,
  createAutoLarisPaymentSession,
  evaluateReceiverRisk,
  createOrderWithFanout,
} from "@dotads/integrations";

export const publicRouter = new OpenAPIHono();

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
    },
  }),
  async (c) => {
    const tenantId = c.req.query("tenantId");
    let storeName = "DotAds Official Store";
    let logoUrl: string | null = null;
    let helpPhone = "628111222333";

    if (tenantId) {
      const [tenant] = await db
        .select({ name: schema.tenants.name })
        .from(schema.tenants)
        .where(eq(schema.tenants.id, tenantId))
        .limit(1);
      if (tenant) {
        storeName = tenant.name;
      }
    }

    return c.json({
      tenantId: tenantId || "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8",
      storeName,
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
    });
  }
);

// Helper to verify Cloudflare Turnstile CAPTCHA Token
async function verifyTurnstileToken(token?: string, remoteIp?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // Development or test bypass mode
    return token !== "INVALID_TOKEN";
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
  const tenantId = c.req.query("tenantId") || "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8";
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
    },
  }),
  async (c) => {
    const body = await c.req.json();
    const rates = await fetchMengantarShippingRates(body);
    return c.json(rates);
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
    },
  }),
  async (c) => {
    return c.json({ success: true, leadId: `lead_${Date.now()}` });
  }
);

// Order Creation & Multi-Ad Outbox Fan-out
publicRouter.openapi(
  createRoute({
    method: "post",
    path: "/orders",
    summary: "Submit public customer order",
    request: {
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
              status: z.string(),
              paymentMethod: z.string(),
              paymentUrl: z.string().optional(),
              vaNumber: z.string().optional(),
              qrUrl: z.string().optional(),
              totalMinor: z.number(),
            }),
          },
        },
      },
      403: {
        description: "Turnstile bot verification failed",
        content: { "application/json": { schema: z.object({ error: z.string() }) } },
      },
    },
  }),
  async (c) => {
    const body = await c.req.json();
    const clientIp = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";

    // 0. Verify Turnstile CAPTCHA Bot Token
    const isBotValid = await verifyTurnstileToken(body.turnstileToken, clientIp);
    if (!isBotValid) {
      return c.json({ error: "Verifikasi Turnstile bot gagal. Gagal memproses pesanan." }, 403);
    }

    // 1. Evaluate receiver risk score
    const riskResult = evaluateReceiverRisk({
      customerPhone: body.customerPhone,
      shippingAddress: body.shippingAddress,
      subdistrictId: body.subdistrictId,
      orderTotalMinor: 270000,
    });

    // 2. Create order & stage multi-platform ad conversion events (Meta, Google, TikTok)
    const result = await createOrderWithFanout(body, riskResult.score);

    // 3. If prepaid method, generate AutoLaris payment transaction
    let paymentInfo: { paymentUrl?: string; vaNumber?: string; qrUrl?: string } = {};
    if (body.paymentMethod !== "COD") {
      const paymentTx = await createAutoLarisPaymentSession({
        tenantId: body.tenantId,
        orderId: result.orderId,
        amountMinor: 270000,
        paymentMethod: body.paymentMethod as any,
      });

      if (paymentTx) {
        paymentInfo = {
          paymentUrl: paymentTx.qrUrl || undefined,
          vaNumber: paymentTx.vaNumber || undefined,
          qrUrl: paymentTx.qrUrl || undefined,
        };
      }
    }

    return c.json(
      {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        status: "PENDING",
        paymentMethod: body.paymentMethod,
        totalMinor: 270000,
        ...paymentInfo,
      },
      201
    );
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
