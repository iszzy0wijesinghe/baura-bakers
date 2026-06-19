import type { CartItem } from "../app/cart";
import { supabase } from "./supabase";

export type DeliveryTarget = "SENDER" | "RECEIVER";

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

function createBrowserUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createGuestOrder(input: CreateGuestOrderInput) {
  if (!input.items.length) {
    throw new Error("Cart is empty.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) {
    throw new Error(
      "Please login or create an account before completing your order.",
    );
  }

  const orderId = createBrowserUuid();

  const subtotalLkr = input.items.reduce(
    (sum, item) => sum + item.unitPriceLkr * item.quantity,
    0,
  );

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    order_no: input.orderNo,
    user_id: user.id,

    customer_name: input.senderName.trim(),
    customer_email: input.senderEmail?.trim() || user.email || null,
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
  };
}


// import type { CartItem } from "../app/cart";
// import { supabase } from "./supabase";

// type CreateGuestOrderInput = {
//   orderNo: string;
//   customerName: string;
//   customerEmail?: string;
//   contactNumber: string;
//   customerAddress: string;
//   deliveryAddress: string;
//   deliveryLocationUrl?: string;
//   deliveryLat?: number | null;
//   deliveryLng?: number | null;
//   deliveryApp: string;
//   paymentMethod?: string;
//   note?: string;

//   couponCode?: string | null;
//   promotionId?: string | null;
//   discountLkr?: number;
//   grandTotalLkr?: number;

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

//   const discountLkr = Number(input.discountLkr || 0);
//   const grandTotalLkr = Number(input.grandTotalLkr ?? subtotalLkr - discountLkr);

//   const { error: orderError } = await supabase.from("orders").insert({
//     id: orderId,
//     order_no: input.orderNo,
//     user_id: user.id,

//     customer_name: input.customerName.trim(),
//     customer_email: input.customerEmail?.trim() || user.email || null,
//     contact_number: input.contactNumber.trim(),
//     customer_address: input.customerAddress.trim(),

//     delivery_address: input.deliveryAddress.trim(),
//     delivery_location_url: input.deliveryLocationUrl?.trim() || null,
//     delivery_lat: input.deliveryLat ?? null,
//     delivery_lng: input.deliveryLng ?? null,
//     delivery_app: input.deliveryApp,

//     payment_method: input.paymentMethod || "WHATSAPP_ORDER",
//     note: input.note?.trim() || null,

//     subtotal_lkr: subtotalLkr,
//     coupon_code: input.couponCode?.trim().toUpperCase() || null,
//     promotion_id: input.promotionId || null,
//     discount_lkr: discountLkr,
//     grand_total_lkr: grandTotalLkr,

//     payment_status: "PENDING_PAYMENT",
//     order_status: "NEW",
//   });

//   if (orderError) {
//     throw new Error(orderError.message);
//   }

//   const orderItems = input.items.map((item) => ({
//     order_id: orderId,

//     item_id: item.itemId,
//     item_size_id: item.itemSizeId,

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