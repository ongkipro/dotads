import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db, schema } from "@dotads/db";
import { eq, and, ilike, or } from "drizzle-orm";
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

// Public Product Catalog
publicRouter.openapi(
  createRoute({
    method: "get",
    path: "/products",
    summary: "Fetch public product catalog for tenant",
    request: {
      query: z.object({
        tenantId: z.string().uuid().optional(),
        slug: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: "List of products",
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  slug: z.string(),
                  priceMinor: z.number(),
                  compareAtPriceMinor: z.number().nullable().optional(),
                  imagesJson: z.array(z.string()),
                  gtin: z.string().nullable().optional(),
                })
              ),
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    const tenantId = c.req.query("tenantId");
    if (!tenantId) {
      return c.json({ data: [] });
    }

    const productsList = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.tenantId, tenantId), eq(schema.products.status, "active")));

    const mapped = productsList.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceMinor: p.priceMinor,
      compareAtPriceMinor: p.compareAtPriceMinor,
      imagesJson: Array.isArray(p.imagesJson) ? (p.imagesJson as string[]) : [],
      gtin: p.gtin,
    }));

    return c.json({ data: mapped });
  }
);

// Region Search (<15ms GIN Trigram Search)
publicRouter.openapi(
  createRoute({
    method: "get",
    path: "/regions/search",
    summary: "Search Indonesian subdistricts",
    request: {
      query: z.object({
        q: z.string().min(2),
      }),
    },
    responses: {
      200: {
        description: "List of matching subdistricts",
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                id: z.string(),
                subdistrictName: z.string(),
                districtName: z.string(),
                cityName: z.string(),
                provinceName: z.string(),
                postalCode: z.string().nullable(),
              })
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const query = c.req.query("q") || "";
    const results = await db
      .select({
        id: schema.mengantarLocations.subdistrictId,
        subdistrictName: schema.mengantarLocations.subdistrictName,
        districtName: schema.mengantarLocations.cityName,
        cityName: schema.mengantarLocations.cityName,
        provinceName: schema.mengantarLocations.provinceName,
        postalCode: schema.mengantarLocations.postalCode,
      })
      .from(schema.mengantarLocations)
      .where(
        or(
          ilike(schema.mengantarLocations.subdistrictName, `%${query}%`),
          ilike(schema.mengantarLocations.cityName, `%${query}%`)
        )
      )
      .limit(15);

    return c.json(results);
  }
);

// Shipping Rates Estimation
publicRouter.openapi(
  createRoute({
    method: "post",
    path: "/shipping/rates",
    summary: "Fetch instant courier rates",
    request: {
      body: { content: { "application/json": { schema: ShippingRateRequestSchema } } },
    },
    responses: {
      200: {
        description: "List of available courier shipping rates",
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                courierCode: z.string(),
                serviceName: z.string(),
                costMinor: z.number(),
                etd: z.string(),
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
    summary: "Save draft lead before checkout completion",
    request: {
      body: { content: { "application/json": { schema: DraftLeadSchema } } },
    },
    responses: {
      200: {
        description: "Lead saved",
        content: { "application/json": { schema: z.object({ id: z.string(), status: z.string() }) } },
      },
    },
  }),
  async (c) => {
    const body = await c.req.json();
    const [lead] = await db
      .insert(schema.draftLeads)
      .values({
        tenantId: body.tenantId,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        draftDataJson: body.draftDataJson || {},
      })
      .returning();

    return c.json({ id: lead.id, status: "saved" });
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
    },
  }),
  async (c) => {
    const body = await c.req.json();

    // 1. Evaluate receiver risk score
    const riskResult = evaluateReceiverRisk({
      customerPhone: body.customerPhone,
      shippingAddress: body.shippingAddress,
      subdistrictId: body.subdistrictId,
      orderTotalMinor: body.subtotalMinor + body.shippingCostMinor,
    });

    // 2. Create order & stage multi-platform ad conversion events (Meta, Google, TikTok)
    const result = await createOrderWithFanout(body, riskResult.score);

    // 3. If prepaid method, generate AutoLaris payment transaction
    let paymentInfo: { paymentUrl?: string; vaNumber?: string; qrUrl?: string } = {};
    if (body.paymentMethod !== "COD") {
      const paymentTx = await createAutoLarisPaymentSession({
        tenantId: body.tenantId,
        orderId: result.orderId,
        amountMinor: body.subtotalMinor + body.shippingCostMinor,
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
        totalMinor: body.subtotalMinor + body.shippingCostMinor,
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
    path: "/forms/published",
    summary: "Fetch published form schema for direct-response checkout",
    request: {
      query: z.object({
        tenantId: z.string().uuid().optional(),
      }),
    },
    responses: {
      200: {
        description: "Published form schema",
        content: {
          "application/json": {
            schema: z.object({
              form: z.record(z.unknown()).nullable(),
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    const tenantId = c.req.query("tenantId");
    if (!tenantId) {
      return c.json({ form: null });
    }

    const formRecords = await db
      .select()
      .from(schema.formSchemas)
      .where(eq(schema.formSchemas.tenantId, tenantId))
      .limit(1);

    if (formRecords.length === 0) {
      return c.json({ form: null });
    }

    return c.json({ form: (formRecords[0].draftSchemaJson as Record<string, unknown>) || null });
  }
);
