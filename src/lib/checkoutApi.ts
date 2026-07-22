/** @format */

import { laravelGet, laravelPost } from "./laravelApi";

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

export type CheckoutBootstrap = {
  configuration_version: number;
  delivery_mode: "SCHEDULED" | "EVERYDAY" | "SPECIAL";
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
  sugar_level_id: number;
  quantity: number;
};

export type CreateCheckoutOrderInput = {
  order_no?: string | null;
  idempotency_key?: string | null;
  device_id?: string | null;
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
  delivery_address: string;
  delivery_location_url?: string | null;
  delivery_lat: number;
  delivery_lng: number;
  delivery_slot_id: string;
  payment_method: "BANK_TRANSFER_WHATSAPP" | "PAYHERE";
  note?: string | null;
  items: CheckoutOrderItemInput[];
};

export type CreatedCheckoutOrder = {
  id: string;
  order_no: string;
  user_id?: number | null;
  subtotal_lkr: number;
  delivery_fee_lkr: number;
  order_total_lkr: number;
  payment_status: string;
  order_status: string;
};

type CheckoutBootstrapResponse = {
  data: CheckoutBootstrap;
};

type CheckoutQuoteResponse = {
  data: {
    quote: CheckoutQuote;
  };
};

type EmailExistsResponse = {
  data: {
    exists: boolean;
  };
};

type CreateCheckoutOrderResponse = {
  message: string;
  data: {
    order: CreatedCheckoutOrder;
    tracking_token: string;
    replayed: boolean;
  };
};

export async function getCheckoutBootstrap() {
  const response = await laravelGet<CheckoutBootstrapResponse>(
    "/api/v1/checkout/bootstrap",
  );

  return response.data;
}

export async function getCheckoutQuote(input: {
  lat: number;
  lng: number;
  totalQuantity: number;
}) {
  const response = await laravelPost<CheckoutQuoteResponse>(
    "/api/v1/checkout/quote",
    {
      lat: input.lat,
      lng: input.lng,
      total_quantity: input.totalQuantity,
    },
  );

  return response.data.quote;
}

export async function checkCheckoutEmailExists(email: string) {
  const response = await laravelPost<EmailExistsResponse>(
    "/api/v1/checkout/email-exists",
    { email },
  );

  return response.data.exists;
}

export async function createCheckoutOrder(input: CreateCheckoutOrderInput) {
  const response = await laravelPost<CreateCheckoutOrderResponse>(
    "/api/v1/checkout/orders",
    input,
  );

  return response.data;
}
