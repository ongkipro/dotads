import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db, schema } from "@dotads/db";
import { and, count, eq, gte, lt, notInArray, sql } from "drizzle-orm";
import { authMiddleware, requirePermission, type AppEnv } from "../middleware/auth.ts";

const ORDER_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;
const FULFILLMENT_STATUSES = ["UNFULFILLED", "PICKUP_REQUESTED", "IN_TRANSIT", "DELIVERED", "RETURNED", "FAILED"] as const;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const TENANT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CountSchema = z.number().int().safe().nonnegative();
const OrderStatusBreakdownSchema = z.object(Object.fromEntries(
  ORDER_STATUSES.map((status) => [status, CountSchema])
) as Record<(typeof ORDER_STATUSES)[number], typeof CountSchema>).strict();
const PaymentStatusBreakdownSchema = z.object(Object.fromEntries(
  PAYMENT_STATUSES.map((status) => [status, CountSchema])
) as Record<(typeof PAYMENT_STATUSES)[number], typeof CountSchema>).strict();
const FulfillmentStatusBreakdownSchema = z.object(Object.fromEntries(
  FULFILLMENT_STATUSES.map((status) => [status, CountSchema])
) as Record<(typeof FULFILLMENT_STATUSES)[number], typeof CountSchema>).strict();

const ErrorSchema = z.object({ error: z.string() }).strict();
const WorkspaceSelectionErrorSchema = z.object({
  error: z.literal("Workspace selection required"),
  code: z.literal("WORKSPACE_SELECTION_REQUIRED"),
  workspaceSelectionRequired: z.literal(true),
}).strict();

const DashboardSchema = z.object({
  currency: z.literal("IDR"),
  timeZone: z.literal("Asia/Jakarta"),
  period: z.object({
    days: z.union([z.literal(7), z.literal(30)]),
    from: z.string().datetime({ offset: true }),
    to: z.string().datetime({ offset: true }),
  }).strict(),
  kpis: z.object({
    ordersCreated: CountSchema,
    grossOrderValueMinor: CountSchema,
  }).strict(),
  daily: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    ordersCreated: CountSchema,
    grossOrderValueMinor: CountSchema,
  }).strict()).max(30),
  breakdowns: z.object({
    orderStatus: OrderStatusBreakdownSchema,
    paymentStatus: PaymentStatusBreakdownSchema,
    fulfillmentStatus: FulfillmentStatusBreakdownSchema,
  }).strict(),
}).strict();

function wibPeriod(now: Date, days: 7 | 30) {
  const wibClock = new Date(now.getTime() + WIB_OFFSET_MS);
  const currentWibDate = Date.UTC(wibClock.getUTCFullYear(), wibClock.getUTCMonth(), wibClock.getUTCDate());
  const firstWibDate = currentWibDate - (days - 1) * DAY_MS;
  const from = new Date(firstWibDate - WIB_OFFSET_MS).toISOString();
  const to = new Date(currentWibDate + DAY_MS - WIB_OFFSET_MS).toISOString();
  const dates = Array.from({ length: days }, (_, index) =>
    new Date(firstWibDate + index * DAY_MS).toISOString().slice(0, 10)
  );
  return { from, to, dates };
}

function zeroBreakdown<const T extends readonly string[]>(values: T): Record<T[number], number> {
  return Object.fromEntries(values.map((value) => [value, 0])) as Record<T[number], number>;
}

export function createDashboardRouter(now: () => Date = () => new Date()) {
  const router = new OpenAPIHono<AppEnv>();
  router.use("*", authMiddleware);

  router.openapi(createRoute({
    method: "get",
    path: "/",
    operationId: "getTenantDashboard",
    tags: ["Dashboard"],
    summary: "Get bounded tenant order aggregates",
    middleware: [requirePermission("orders:read")] as const,
    request: {
      query: z.object({
        days: z.enum(["7", "30"]).default("7"),
      }).strict(),
    },
    responses: {
      200: { description: "Tenant dashboard aggregates", content: { "application/json": { schema: DashboardSchema } } },
      400: { description: "Invalid dashboard query", content: { "application/json": { schema: ErrorSchema } } },
      401: { description: "Unauthenticated", content: { "application/json": { schema: ErrorSchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
      409: { description: "Workspace selection required", content: { "application/json": { schema: WorkspaceSelectionErrorSchema } } },
      500: { description: "Internal server error", content: { "application/json": { schema: ErrorSchema } } },
    },
  }), async (c) => {
    const auth = c.get("auth");
    if (auth.role === "SUPER_ADMIN" || !TENANT_ID_PATTERN.test(auth.tenantId)) {
      return c.json({ error: "Forbidden: Active tenant context required" }, 403);
    }
    const days = Number(c.req.valid("query").days) as 7 | 30;
    const period = wibPeriod(now(), days);
    const periodFilter = and(
      eq(schema.orders.tenantId, auth.tenantId),
      gte(schema.orders.createdAt, period.from),
      lt(schema.orders.createdAt, period.to)
    );
    const includedFilter = and(
      periodFilter,
      notInArray(schema.orders.status, ["CANCELLED", "REFUNDED"])
    );
    const wibDate = sql<string>`to_char(timezone('Asia/Jakarta', ${schema.orders.createdAt} AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`;

    const result = await db.transaction(async (tx) => {
      const [kpis] = await tx.select({
        ordersCreated: count(schema.orders.id),
        grossOrderValueMinor: sql<number>`coalesce(sum(${schema.orders.totalMinor}), 0)`,
      }).from(schema.orders).where(includedFilter);
      const dailyRows = await tx.select({
        date: wibDate,
        ordersCreated: count(schema.orders.id),
        grossOrderValueMinor: sql<number>`coalesce(sum(${schema.orders.totalMinor}), 0)`,
      }).from(schema.orders).where(includedFilter).groupBy(wibDate).orderBy(wibDate);
      const orderRows = await tx.select({ status: schema.orders.status, value: count(schema.orders.id) })
        .from(schema.orders).where(periodFilter).groupBy(schema.orders.status);
      const paymentRows = await tx.select({ status: schema.orders.paymentStatus, value: count(schema.orders.id) })
        .from(schema.orders).where(periodFilter).groupBy(schema.orders.paymentStatus);
      const fulfillmentRows = await tx.select({ status: schema.orders.fulfillmentStatus, value: count(schema.orders.id) })
        .from(schema.orders).where(periodFilter).groupBy(schema.orders.fulfillmentStatus);
      return { kpis, dailyRows, orderRows, paymentRows, fulfillmentRows };
    });

    const dailyByDate = new Map(result.dailyRows.map((row) => [row.date, {
      ordersCreated: Number(row.ordersCreated),
      grossOrderValueMinor: Number(row.grossOrderValueMinor),
    }]));
    const orderStatus = zeroBreakdown(ORDER_STATUSES);
    const paymentStatus = zeroBreakdown(PAYMENT_STATUSES);
    const fulfillmentStatus = zeroBreakdown(FULFILLMENT_STATUSES);
    for (const row of result.orderRows) if (ORDER_STATUSES.includes(row.status as typeof ORDER_STATUSES[number])) {
      orderStatus[row.status as typeof ORDER_STATUSES[number]] = Number(row.value);
    }
    for (const row of result.paymentRows) if (PAYMENT_STATUSES.includes(row.status as typeof PAYMENT_STATUSES[number])) {
      paymentStatus[row.status as typeof PAYMENT_STATUSES[number]] = Number(row.value);
    }
    for (const row of result.fulfillmentRows) if (FULFILLMENT_STATUSES.includes(row.status as typeof FULFILLMENT_STATUSES[number])) {
      fulfillmentStatus[row.status as typeof FULFILLMENT_STATUSES[number]] = Number(row.value);
    }

    return c.json(DashboardSchema.parse({
      currency: "IDR",
      timeZone: "Asia/Jakarta",
      period: { days, from: period.from, to: period.to },
      kpis: {
        ordersCreated: Number(result.kpis?.ordersCreated ?? 0),
        grossOrderValueMinor: Number(result.kpis?.grossOrderValueMinor ?? 0),
      },
      daily: period.dates.map((date) => ({ date, ...(dailyByDate.get(date) ?? {
        ordersCreated: 0,
        grossOrderValueMinor: 0,
      }) })),
      breakdowns: { orderStatus, paymentStatus, fulfillmentStatus },
    }), 200);
  }, (result, c) => {
    if (!result.success) return c.json({ error: "Invalid dashboard query" }, 400);
  });

  return router;
}

export const dashboardRouter = createDashboardRouter();
