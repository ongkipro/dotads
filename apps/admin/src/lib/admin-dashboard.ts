export const ADMIN_DASHBOARD_PATH = "/api/v1/dashboard";

export type DashboardDays = 7 | 30;
export type OrderStatus = "PENDING_PAYMENT" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "FAILED";
export type FulfillmentStatus = "UNFULFILLED" | "PICKUP_REQUESTED" | "IN_TRANSIT" | "DELIVERED" | "RETURNED" | "FAILED";

export interface AdminDashboard {
  currency: "IDR";
  timeZone: "Asia/Jakarta";
  period: { days: DashboardDays; from: string; to: string };
  kpis: { ordersCreated: number; grossOrderValueMinor: number };
  daily: Array<{ date: string; ordersCreated: number; grossOrderValueMinor: number }>;
  breakdowns: {
    orderStatus: Record<OrderStatus, number>;
    paymentStatus: Record<PaymentStatus, number>;
    fulfillmentStatus: Record<FulfillmentStatus, number>;
  };
}

export class AdminDashboardError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const ORDER_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const PAYMENT_STATUSES: PaymentStatus[] = ["UNPAID", "PAID", "REFUNDED", "FAILED"];
const FULFILLMENT_STATUSES: FulfillmentStatus[] = ["UNFULFILLED", "PICKUP_REQUESTED", "IN_TRANSIT", "DELIVERED", "RETURNED", "FAILED"];
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function onlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const expected = new Set(keys);
  return Object.keys(value).length === keys.length && Object.keys(value).every((key) => expected.has(key));
}

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isInstant(value: unknown): value is string {
  return typeof value === "string" && INSTANT.test(value) && !Number.isNaN(Date.parse(value));
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE.exec(value);
  if (!match) return false;
  return new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function wibDateString(instant: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Jakarta" }).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function parseBreakdown<T extends string>(value: unknown, keys: readonly T[]): Record<T, number> {
  if (!isObject(value) || !onlyKeys(value, keys) || keys.some((key) => !isCount(value[key]))) invalid();
  return value as Record<T, number>;
}

function invalid(): never {
  throw new Error("API dashboard mengembalikan data yang tidak valid.");
}

export function parseAdminDashboard(value: unknown, requestedDays?: DashboardDays): AdminDashboard {
  if (!isObject(value) || !onlyKeys(value, ["currency", "timeZone", "period", "kpis", "daily", "breakdowns"]) ||
      value.currency !== "IDR" || value.timeZone !== "Asia/Jakarta" || !isObject(value.period) ||
      !onlyKeys(value.period, ["days", "from", "to"]) || (value.period.days !== 7 && value.period.days !== 30) ||
      (requestedDays !== undefined && value.period.days !== requestedDays) ||
      !isInstant(value.period.from) || !isInstant(value.period.to) || Date.parse(value.period.from) >= Date.parse(value.period.to) ||
      !isObject(value.kpis) || !onlyKeys(value.kpis, ["ordersCreated", "grossOrderValueMinor"]) ||
      !isCount(value.kpis.ordersCreated) || !isCount(value.kpis.grossOrderValueMinor) ||
      !Array.isArray(value.daily) || value.daily.length !== value.period.days || !isObject(value.breakdowns) ||
      !onlyKeys(value.breakdowns, ["orderStatus", "paymentStatus", "fulfillmentStatus"])) invalid();

  const daily = value.daily.map((item) => {
    if (!isObject(item) || !onlyKeys(item, ["date", "ordersCreated", "grossOrderValueMinor"]) ||
        !isDate(item.date) || !isCount(item.ordersCreated) || !isCount(item.grossOrderValueMinor)) invalid();
    return { date: item.date, ordersCreated: item.ordersCreated, grossOrderValueMinor: item.grossOrderValueMinor };
  });
  const periodMs = Date.parse(value.period.to) - Date.parse(value.period.from);
  const expectedLastDate = wibDateString(new Date(Date.parse(value.period.to) - 1).toISOString());
  if (periodMs !== value.period.days * 86_400_000 || daily[0]?.date !== wibDateString(value.period.from) ||
      daily.at(-1)?.date !== expectedLastDate || daily.some((item, index) => index > 0 &&
        item.date !== new Date(Date.parse(`${daily[index - 1].date}T00:00:00.000Z`) + 86_400_000).toISOString().slice(0, 10)) ||
      daily.reduce((sum, item) => sum + item.ordersCreated, 0) !== value.kpis.ordersCreated ||
      daily.reduce((sum, item) => sum + item.grossOrderValueMinor, 0) !== value.kpis.grossOrderValueMinor) invalid();

  return {
    currency: "IDR",
    timeZone: "Asia/Jakarta",
    period: { days: value.period.days, from: value.period.from, to: value.period.to },
    kpis: { ordersCreated: value.kpis.ordersCreated, grossOrderValueMinor: value.kpis.grossOrderValueMinor },
    daily,
    breakdowns: {
      orderStatus: parseBreakdown(value.breakdowns.orderStatus, ORDER_STATUSES),
      paymentStatus: parseBreakdown(value.breakdowns.paymentStatus, PAYMENT_STATUSES),
      fulfillmentStatus: parseBreakdown(value.breakdowns.fulfillmentStatus, FULFILLMENT_STATUSES),
    },
  };
}

export async function getAdminDashboard(days: DashboardDays, fetcher: typeof fetch = fetch): Promise<AdminDashboard> {
  const response = await fetcher(`${ADMIN_DASHBOARD_PATH}?days=${days}`, { credentials: "same-origin", cache: "no-store" });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const object = isObject(payload) ? payload : null;
    const message = object && typeof object.error === "string" ? object.error : `Dashboard gagal dimuat (${response.status}).`;
    const code = response.status === 409 && object && onlyKeys(object, ["error", "code", "workspaceSelectionRequired"]) &&
      object.error === "Workspace selection required" && object.code === "WORKSPACE_SELECTION_REQUIRED" &&
      object.workspaceSelectionRequired === true ? "WORKSPACE_SELECTION_REQUIRED" : null;
    throw new AdminDashboardError(message, response.status, code);
  }
  return parseAdminDashboard(payload, days);
}
