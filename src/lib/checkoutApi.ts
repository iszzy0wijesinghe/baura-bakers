/** @format */

import { laravelGet, laravelPost } from "./laravelApi";

export type FulfillmentType = "PICKUP" | "DELIVERY";
export type CollectionArrangement = "SELF_PICKUP" | "CUSTOMER_COURIER" | "BAKERY_ASSISTED_COURIER";
export type CourierProvider = "PICKME_FLASH" | "UBER_PARCEL";

export type CheckoutDeliverySlot = {
  id: string;
  slot_date: string;
  slot_label: string;
  start_time: string;
  end_time: string;
  max_orders: number;
  remaining_orders: number;
  is_available: boolean;
};

export type CheckoutPickupDay = {
  date: string;
  weekday: number;
  isOpen: boolean;
  openingTime: string | null;
  closingTime: string | null;
  source: "WEEKLY" | "EXCEPTION";
  reason: string | null;
};

export type CheckoutBootstrap = {
  configuration_version: number;
  delivery_mode: "SCHEDULED" | "EVERYDAY" | "SPECIAL";
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  pickup_time_zone: "Asia/Colombo";
  pickup_calendar: CheckoutPickupDay[];
  /** Legacy settings; do not use these for pickup schedule decisions. */
  business_open_time: string;
  business_close_time: string;
  pickup_preview_days: number;
  max_delivery_distance_km: number;
  slots: CheckoutDeliverySlot[];
};

export type CheckoutQuote = {
  distance_km: number;
  pricing_distance_km: number;
  distance_source: string;
  duration: string | null;
  vehicle_type: string;
  pricing_mode: string;
  base_price_lkr: number;
  delivery_fee_lkr: number;
  max_delivery_distance_km: number;
};

export type CheckoutOrderItemInput = {
  product_id: string;
  product_size_id: string;
  sugar_level_id: number | null;
  quantity: number;
};

export type CreateCheckoutOrderInput = {
  order_no?: string | null;
  idempotency_key?: string | null;
  device_id?: string | null;
  fulfillment_type: FulfillmentType;
  pickup_date?: string | null;
  pickup_start_time?: string | null;
  pickup_end_time?: string | null;
  collection_arrangement?: CollectionArrangement | null;
  courier_provider?: CourierProvider | null;
  sender_name: string;
  sender_email: string;
  sender_contact_number: string;
  sender_address: string;
  has_different_receiver: boolean;
  is_gift: boolean;
  delivery_target: "SENDER" | "RECEIVER";
  receiver_name?: string | null;
  receiver_contact_number?: string | null;
  receiver_address?: string | null;
  receiver_location_url?: string | null;
  receiver_lat?: number | null;
  receiver_lng?: number | null;
  delivery_address?: string | null;
  delivery_location_url?: string | null;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  delivery_slot_id?: string | null;
  payment_method: "BANK_TRANSFER_WHATSAPP" | "PAYHERE";
  note?: string | null;
  items: CheckoutOrderItemInput[];
};

export type CreatedCheckoutOrder = {
  id: string;
  order_no: string;
  fulfillment_type?: FulfillmentType;
  collection_arrangement?: CollectionArrangement | null;
  courier_provider?: CourierProvider | null;
  pickup_date?: string | null;
  pickup_start_time?: string | null;
  pickup_end_time?: string | null;
  user_id?: number | null;
  subtotal_lkr: number;
  delivery_fee_lkr: number;
  order_total_lkr: number;
  payment_status: string;
  order_status: string;
};

type CheckoutBootstrapResponse = { data: CheckoutBootstrap };
type CheckoutQuoteResponse = { data: { quote: CheckoutQuote } };
type EmailExistsResponse = { data: { exists: boolean } };
type CreateCheckoutOrderResponse = {
  message: string;
  data: { order: CreatedCheckoutOrder; tracking_token: string; replayed?: boolean };
};
type TimedValue<T> = { expiresAt: number; value: T };

const BOOTSTRAP_CACHE_MS = 15_000;
const QUOTE_CACHE_MS = 30_000;
const EMAIL_CACHE_MS = 5 * 60_000;
let bootstrapCache: TimedValue<CheckoutBootstrap> | null = null;
let bootstrapRequest: Promise<CheckoutBootstrap> | null = null;
const quoteCache = new Map<string, TimedValue<CheckoutQuote>>();
const quoteRequests = new Map<string, Promise<CheckoutQuote>>();
const emailCache = new Map<string, TimedValue<boolean>>();
const emailRequests = new Map<string, Promise<boolean>>();

export function invalidateCheckoutBootstrap() {
  bootstrapCache = null;
  bootstrapRequest = null;
  quoteCache.clear();
}

function quoteKey(input: { lat: number; lng: number; totalQuantity: number }) {
  return [input.lat.toFixed(5), input.lng.toFixed(5), String(input.totalQuantity)].join(":");
}

export async function getCheckoutBootstrap(forceRefresh = false) {
  if (!forceRefresh && bootstrapCache && bootstrapCache.expiresAt > Date.now()) return bootstrapCache.value;
  if (!forceRefresh && bootstrapRequest) return bootstrapRequest;
  const request = laravelGet<CheckoutBootstrapResponse>("/api/v1/checkout/bootstrap")
    .then((response) => {
      bootstrapCache = { expiresAt: Date.now() + BOOTSTRAP_CACHE_MS, value: response.data };
      return response.data;
    })
    .finally(() => { if (bootstrapRequest === request) bootstrapRequest = null; });
  bootstrapRequest = request;
  return request;
}

export async function getCheckoutQuote(input: { lat: number; lng: number; totalQuantity: number }) {
  const key = quoteKey(input);
  const cached = quoteCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const existing = quoteRequests.get(key);
  if (existing) return existing;
  const request = laravelPost<CheckoutQuoteResponse>("/api/v1/checkout/quote", {
    lat: input.lat, lng: input.lng, total_quantity: input.totalQuantity,
  }).then((response) => {
    quoteCache.set(key, { expiresAt: Date.now() + QUOTE_CACHE_MS, value: response.data.quote });
    if (quoteCache.size > 40) {
      const oldestKey = quoteCache.keys().next().value;
      if (oldestKey) quoteCache.delete(oldestKey);
    }
    return response.data.quote;
  }).finally(() => { quoteRequests.delete(key); });
  quoteRequests.set(key, request);
  return request;
}

export async function checkCheckoutEmailExists(email: string) {
  const key = email.trim().toLowerCase();
  const cached = emailCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const existing = emailRequests.get(key);
  if (existing) return existing;
  const request = laravelPost<EmailExistsResponse>("/api/v1/checkout/email-exists", { email: key })
    .then((response) => {
      emailCache.set(key, { expiresAt: Date.now() + EMAIL_CACHE_MS, value: response.data.exists });
      return response.data.exists;
    }).finally(() => { emailRequests.delete(key); });
  emailRequests.set(key, request);
  return request;
}

export async function createCheckoutOrder(input: CreateCheckoutOrderInput) {
  const response = await laravelPost<CreateCheckoutOrderResponse>("/api/v1/checkout/orders", input);
  invalidateCheckoutBootstrap();
  return response.data;
}
