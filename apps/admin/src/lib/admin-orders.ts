export const ADMIN_ORDERS_PATH = "/api/v1/admin/orders";
export const COMPACT_ORDER_LIMIT = 5;

export type OrderStatus = "PENDING_PAYMENT" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "FAILED";
export type FulfillmentStatus = "UNFULFILLED" | "PICKUP_REQUESTED" | "IN_TRANSIT" | "DELIVERED" | "RETURNED" | "FAILED";
export type DispatchStatus = "pending" | "processing" | "completed" | "failed" | "dlq";

export interface OrderSummary {
  id: string; orderNumber: string; status: OrderStatus; paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus; currency: "IDR"; paymentMethod: string;
  customerName: string; customerPhone: string; totalMinor: number;
  cnoteNo: string | null; courierCode: string | null; courierService: string | null;
  rtsRiskScore: number | null; createdAt: string; updatedAt: string;
}
export interface OrderDispatch { id: string; status: DispatchStatus; attempts: number; nextRetryAt: string | null; createdAt: string; updatedAt: string }
export interface OrderItem { id: string; productId: string | null; variantId: string | null; productName: string; variantTitle: string | null; sku: string | null; priceMinor: number; quantity: number; subtotalMinor: number }
export interface OrderEvent { id: string; event: string; actor: string; createdAt: string }
export interface OrderDetail extends OrderSummary {
  shippingAddress: string;
  customerEmail: string | null; subdistrictId: string | null; subdistrictName: string | null;
  cityName: string | null; provinceName: string | null; postalCode: string | null;
  subtotalMinor: number; shippingCostMinor: number; discountMinor: number; notes: string | null;
  items: OrderItem[]; events: OrderEvent[]; dispatch: OrderDispatch | null;
}
export interface OrderPage { items: OrderSummary[]; pagination: { limit: number; offset: number; total: number } }
export interface OrderFilters { limit?: number; offset?: number; status?: OrderStatus; paymentStatus?: PaymentStatus; fulfillmentStatus?: FulfillmentStatus; query?: string; createdFrom?: string; createdTo?: string }
export interface DispatchResult { orderId: string; dispatch: OrderDispatch; alreadyQueued: boolean }
export interface TransitionResult { order: OrderSummary; alreadyApplied: boolean }

export class AdminOrdersError extends Error {
  readonly status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

const ORDER_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;
const FULFILLMENT_STATUSES = ["UNFULFILLED", "PICKUP_REQUESTED", "IN_TRANSIT", "DELIVERED", "RETURNED", "FAILED"] as const;
const DISPATCH_STATUSES = ["pending", "processing", "completed", "failed", "dlq"] as const;
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isNullableString = (value: unknown): value is string | null => value === null || isString(value);
const isInteger = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;
const isDate = (value: unknown): value is string => isString(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && !Number.isNaN(Date.parse(value));
const isOneOf = <T extends readonly string[]>(value: unknown, values: T): value is T[number] => isString(value) && values.includes(value as T[number]);

function invalid(): never { throw new Error("API pesanan mengembalikan data yang tidak valid."); }
function parseSummary(value: unknown): OrderSummary {
  if (!isObject(value) || !isString(value.id) || !isString(value.orderNumber) || !isOneOf(value.status, ORDER_STATUSES) ||
    !isOneOf(value.paymentStatus, PAYMENT_STATUSES) || !isOneOf(value.fulfillmentStatus, FULFILLMENT_STATUSES) || value.currency !== "IDR" ||
    !isString(value.paymentMethod) || !isString(value.customerName) || !isString(value.customerPhone) || !isInteger(value.totalMinor) ||
    !isNullableString(value.cnoteNo) || !isNullableString(value.courierCode) || !isNullableString(value.courierService) ||
    !(value.rtsRiskScore === null || (isInteger(value.rtsRiskScore) && value.rtsRiskScore <= 100)) || !isDate(value.createdAt) || !isDate(value.updatedAt)) invalid();
  return value as unknown as OrderSummary;
}
function parseDispatch(value: unknown): OrderDispatch {
  if (!isObject(value) || !isString(value.id) || !isOneOf(value.status, DISPATCH_STATUSES) || !isInteger(value.attempts) ||
    !(value.nextRetryAt === null || isDate(value.nextRetryAt)) || !isDate(value.createdAt) || !isDate(value.updatedAt)) invalid();
  return value as unknown as OrderDispatch;
}
export function parseOrderPage(value: unknown): OrderPage {
  if (!isObject(value) || !Array.isArray(value.items) || !isObject(value.pagination) || !isInteger(value.pagination.limit) ||
    !isInteger(value.pagination.offset) || !isInteger(value.pagination.total)) invalid();
  return { items: value.items.map(parseSummary), pagination: value.pagination as unknown as OrderPage["pagination"] };
}
export function parseOrderDetail(value: unknown): OrderDetail {
  const summary = parseSummary(value);
  if (!isObject(value) || !isString(value.shippingAddress) || !isNullableString(value.customerEmail) || !isNullableString(value.subdistrictId) || !isNullableString(value.subdistrictName) ||
    !isNullableString(value.cityName) || !isNullableString(value.provinceName) || !isNullableString(value.postalCode) || !isInteger(value.subtotalMinor) ||
    !isInteger(value.shippingCostMinor) || !isInteger(value.discountMinor) || !isNullableString(value.notes) || !Array.isArray(value.items) || !Array.isArray(value.events)) invalid();
  const items = value.items.map((item) => {
    if (!isObject(item) || !isString(item.id) || !isNullableString(item.productId) || !isNullableString(item.variantId) || !isString(item.productName) ||
      !isNullableString(item.variantTitle) || !isNullableString(item.sku) || !isInteger(item.priceMinor) || !isInteger(item.quantity) || item.quantity < 1 || !isInteger(item.subtotalMinor)) invalid();
    return item as unknown as OrderItem;
  });
  const events = value.events.map((event) => {
    if (!isObject(event) || !isString(event.id) || !isString(event.event) || !isString(event.actor) || !isDate(event.createdAt)) invalid();
    return event as unknown as OrderEvent;
  });
  return { ...summary, ...(value as unknown as Omit<OrderDetail, keyof OrderSummary>), items, events, dispatch: value.dispatch === null ? null : parseDispatch(value.dispatch) };
}
async function payload(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isObject(body) && isString(body.error) ? body.error : `Permintaan pesanan gagal (${response.status}).`;
    throw new AdminOrdersError(message, response.status);
  }
  return body;
}
export async function listOrders(filters: OrderFilters, fetcher: typeof fetch = fetch): Promise<OrderPage> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  return parseOrderPage(await payload(await fetcher(`${ADMIN_ORDERS_PATH}?${params}`, { cache: "no-store", credentials: "same-origin" })));
}
export async function listCompactOrders(fetcher: typeof fetch = fetch): Promise<OrderPage> {
  const page = await listOrders({ limit: COMPACT_ORDER_LIMIT, offset: 0 }, fetcher);
  if (page.pagination.limit !== COMPACT_ORDER_LIMIT || page.pagination.offset !== 0 || page.items.length > COMPACT_ORDER_LIMIT) invalid();
  return page;
}
export async function getOrder(id: string, fetcher: typeof fetch = fetch): Promise<OrderDetail> {
  return parseOrderDetail(await payload(await fetcher(`${ADMIN_ORDERS_PATH}/${encodeURIComponent(id)}`, { cache: "no-store", credentials: "same-origin" })));
}
export async function dispatchOrder(id: string, fetcher: typeof fetch = fetch): Promise<DispatchResult> {
  const body = await payload(await fetcher(`${ADMIN_ORDERS_PATH}/${encodeURIComponent(id)}/dispatch`, {
    method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: "{}",
  }));
  if (!isObject(body) || !isString(body.orderId) || typeof body.alreadyQueued !== "boolean") invalid();
  return { orderId: body.orderId, alreadyQueued: body.alreadyQueued, dispatch: parseDispatch(body.dispatch) };
}
export async function transitionOrder(id: string, input: { action: "start_processing" } | { action: "cancel"; reason: string }, fetcher: typeof fetch = fetch): Promise<TransitionResult> {
  const body = await payload(await fetcher(`${ADMIN_ORDERS_PATH}/${encodeURIComponent(id)}/transitions`, {
    method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  }));
  if (!isObject(body) || typeof body.alreadyApplied !== "boolean") invalid();
  return { alreadyApplied: body.alreadyApplied, order: parseSummary(body.order) };
}
