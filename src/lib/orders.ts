import type { CartItem } from "../app/cart";
import { createClientUuid, getBauraDeviceId } from "./device";
import { supabase } from "./supabase";

export type DeliveryTarget = "SENDER" | "RECEIVER";

export type PublicOrderItem = {
  product_name: string;
  size_label: string;
  sugar_level: string;
  quantity: number;
  unit_price_lkr: number;
  line_total_lkr: number;
};

export type PublicOrderTracking = {
  id: string;
  order_no: string;
  customer_name: string;
  delivery_address: string;
  delivery_location_url: string | null;
  subtotal_lkr: number;
  payment_status: string;
  order_status: string;
  payment_method: string | null;
  created_at: string;
  order_items: PublicOrderItem[];
};

type CreateGuestOrderInput = {
  orderNo: string;

  senderName: string;
  senderEmail?: string;
  senderContactNumber: string;
  senderAddress: string;
  senderLocationUrl?: string;
  senderLat?: number | null;
  senderLng?: number | null;

  hasDifferentReceiver: boolean;
  isGift: boolean;

  receiverName?: string;
  receiverContactNumber?: string;
  receiverAddress?: string;
  receiverLocationUrl?: string;
  receiverLat?: number | null;
  receiverLng?: number | null;

  deliveryTarget: DeliveryTarget;
  deliveryAddress: string;
  deliveryLocationUrl?: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;

  deliveryApp: string;
  paymentMethod?: string;
  note?: string;
  items: CartItem[];
};

function createTrackingToken() {
  return createClientUuid().replaceAll("-", "") + createClientUuid().slice(0, 8);
}

export async function createGuestOrder(input: CreateGuestOrderInput) {
  if (!input.items.length) {
    throw new Error("Cart is empty.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;
  const deviceId = getBauraDeviceId();
  const orderId = createClientUuid();
  const trackingToken = createTrackingToken();

  const subtotalLkr = input.items.reduce(
    (sum, item) => sum + item.unitPriceLkr * item.quantity,
    0,
  );

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    order_no: input.orderNo,
    user_id: user?.id ?? null,
    order_device_id: deviceId,
    tracking_token: trackingToken,

    customer_name: input.senderName.trim(),
    customer_email: input.senderEmail?.trim() || user?.email || null,
    contact_number: input.senderContactNumber.trim(),
    customer_address: input.senderAddress.trim(),

    delivery_address: input.deliveryAddress.trim(),
    delivery_location_url: input.deliveryLocationUrl?.trim() || null,
    delivery_lat: input.deliveryLat ?? null,
    delivery_lng: input.deliveryLng ?? null,
    delivery_app: input.deliveryApp,

    is_gift: input.isGift,
    has_different_receiver: input.hasDifferentReceiver,
    delivery_target: input.deliveryTarget,

    receiver_name: input.hasDifferentReceiver
      ? input.receiverName?.trim() || null
      : null,
    receiver_contact_number: input.hasDifferentReceiver
      ? input.receiverContactNumber?.trim() || null
      : null,
    receiver_address: input.hasDifferentReceiver
      ? input.receiverAddress?.trim() || null
      : null,
    receiver_location_url: input.hasDifferentReceiver
      ? input.receiverLocationUrl?.trim() || null
      : null,
    receiver_lat: input.hasDifferentReceiver ? input.receiverLat ?? null : null,
    receiver_lng: input.hasDifferentReceiver ? input.receiverLng ?? null : null,

    payment_method: input.paymentMethod || "BANK_TRANSFER_WHATSAPP",
    note: input.note?.trim() || null,
    subtotal_lkr: subtotalLkr,
    payment_status: "PENDING_PAYMENT",
    order_status: "NEW",
  });

  if (orderError) {
    throw new Error(orderError.message);
  }

  const orderItems = input.items.map((item) => ({
    order_id: orderId,
    product_slug: item.productSlug,
    product_name: item.productName,
    size_label: item.size.label,
    sugar_level: item.sugar,
    quantity: item.quantity,
    unit_price_lkr: item.unitPriceLkr,
    line_total_lkr: item.unitPriceLkr * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return {
    orderId,
    orderNo: input.orderNo,
    trackingToken,
  };
}

export async function claimDeviceOrdersForCurrentUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return 0;

  const deviceId = getBauraDeviceId();

  const { data, error } = await supabase.rpc("claim_device_orders", {
    p_device_id: deviceId,
  });

  if (error) {
    console.warn("Could not claim device orders:", error.message);
    return 0;
  }

  return Number(data || 0);
}

export async function getOrderTracking(orderNo: string, token?: string | null) {
  const deviceId = getBauraDeviceId();

  const { data, error } = await supabase.rpc("get_order_tracking", {
    p_order_no: orderNo,
    p_device_id: deviceId,
    p_tracking_token: token || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data || null) as PublicOrderTracking | null;
}

// import type { CartItem } from "../app/cart";
// import { supabase } from "./supabase";

// export type DeliveryTarget = "SENDER" | "RECEIVER";

// type CreateGuestOrderInput = {
//   orderNo: string;

//   senderName: string;
//   senderEmail?: string;
//   senderContactNumber: string;
//   senderAddress: string;
//   senderLocationUrl?: string;
//   senderLat?: number | null;
//   senderLng?: number | null;

//   hasDifferentReceiver: boolean;
//   isGift: boolean;

//   receiverName?: string;
//   receiverContactNumber?: string;
//   receiverAddress?: string;
//   receiverLocationUrl?: string;
//   receiverLat?: number | null;
//   receiverLng?: number | null;

//   deliveryTarget: DeliveryTarget;
//   deliveryAddress: string;
//   deliveryLocationUrl?: string;
//   deliveryLat?: number | null;
//   deliveryLng?: number | null;

//   deliveryApp: string;
//   paymentMethod?: string;
//   note?: string;
//   items: CartItem[];
// };

// function createBrowserUuid() {
//   if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
//     return crypto.randomUUID();
//   }

//   return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
//     const r = (Math.random() * 16) | 0;
//     const v = c === "x" ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// }

// export async function createGuestOrder(input: CreateGuestOrderInput) {
//   if (!input.items.length) {
//     throw new Error("Cart is empty.");
//   }

//   const {
//     data: { session },
//   } = await supabase.auth.getSession();

//   const user = session?.user;

//   if (!user) {
//     throw new Error(
//       "Please login or create an account before completing your order.",
//     );
//   }

//   const orderId = createBrowserUuid();

//   const subtotalLkr = input.items.reduce(
//     (sum, item) => sum + item.unitPriceLkr * item.quantity,
//     0,
//   );

//   const { error: orderError } = await supabase.from("orders").insert({
//     id: orderId,
//     order_no: input.orderNo,
//     user_id: user.id,

//     customer_name: input.senderName.trim(),
//     customer_email: input.senderEmail?.trim() || user.email || null,
//     contact_number: input.senderContactNumber.trim(),
//     customer_address: input.senderAddress.trim(),

//     delivery_address: input.deliveryAddress.trim(),
//     delivery_location_url: input.deliveryLocationUrl?.trim() || null,
//     delivery_lat: input.deliveryLat ?? null,
//     delivery_lng: input.deliveryLng ?? null,
//     delivery_app: input.deliveryApp,

//     is_gift: input.isGift,
//     has_different_receiver: input.hasDifferentReceiver,
//     delivery_target: input.deliveryTarget,

//     receiver_name: input.hasDifferentReceiver
//       ? input.receiverName?.trim() || null
//       : null,
//     receiver_contact_number: input.hasDifferentReceiver
//       ? input.receiverContactNumber?.trim() || null
//       : null,
//     receiver_address: input.hasDifferentReceiver
//       ? input.receiverAddress?.trim() || null
//       : null,
//     receiver_location_url: input.hasDifferentReceiver
//       ? input.receiverLocationUrl?.trim() || null
//       : null,
//     receiver_lat: input.hasDifferentReceiver ? input.receiverLat ?? null : null,
//     receiver_lng: input.hasDifferentReceiver ? input.receiverLng ?? null : null,

//     payment_method: input.paymentMethod || "BANK_TRANSFER_WHATSAPP",
//     note: input.note?.trim() || null,
//     subtotal_lkr: subtotalLkr,
//     payment_status: "PENDING_PAYMENT",
//     order_status: "NEW",
//   });

//   if (orderError) {
//     throw new Error(orderError.message);
//   }

//   const orderItems = input.items.map((item) => ({
//     order_id: orderId,
//     product_slug: item.productSlug,
//     product_name: item.productName,
//     size_label: item.size.label,
//     sugar_level: item.sugar,
//     quantity: item.quantity,
//     unit_price_lkr: item.unitPriceLkr,
//     line_total_lkr: item.unitPriceLkr * item.quantity,
//   }));

//   const { error: itemsError } = await supabase
//     .from("order_items")
//     .insert(orderItems);

//   if (itemsError) {
//     throw new Error(itemsError.message);
//   }

//   return {
//     orderId,
//     orderNo: input.orderNo,
//   };
// }
