/** @format */

import type { CartItem } from "../app/cart";
import { claimAccountOrders } from "./accountApi";
import { checkCheckoutEmailExists, createCheckoutOrder, type FulfillmentType } from "./checkoutApi";
import { getBauraDeviceId } from "./device";
import { laravelGet } from "./laravelApi";

export type DeliveryTarget = "SENDER" | "RECEIVER";
export type PublicOrderItem = {
  product_name: string;
  size_label: string;
  sugar_level: string | null;
  quantity: number;
  unit_price_lkr: number;
  line_total_lkr: number;
};
export type PublicOrderTracking = {
  id: string;
  order_no: string;
  fulfillment_type?: FulfillmentType;
  pickup_date?: string | null;
  pickup_start_time?: string | null;
  pickup_end_time?: string | null;
  customer_name: string;
  delivery_address: string | null;
  delivery_location_url: string | null;
  delivery_date?: string | null;
  delivery_slot_label?: string | null;
  delivery_slot_start?: string | null;
  delivery_slot_end?: string | null;
  subtotal_lkr: number;
  delivery_distance_km: number | null;
  delivery_vehicle_type: string | null;
  delivery_fee_lkr: number | null;
  delivery_pricing_mode: string | null;
  order_total_lkr: number | null;
  payment_status: string;
  order_status: string;
  delivery_status?: string;
  payment_method: string | null;
  delivery_tracking_url?: string | null;
  delivery_schedule_note?: string | null;
  created_at: string;
  order_items: PublicOrderItem[];
};

type CreateGuestOrderInput = {
  orderNo: string;
  fulfillmentType: FulfillmentType;
  pickupDate?: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
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
  deliveryAddress?: string;
  deliveryLocationUrl?: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  deliverySlotId?: string;
  deliveryDate?: string;
  deliverySlotLabel?: string;
  deliverySlotStart?: string;
  deliverySlotEnd?: string;
  deliveryDistanceKm?: number | null;
  deliveryVehicleType?: string | null;
  deliveryFeeLkr?: number;
  deliveryPricingMode?: string | null;
  deliveryApp?: string;
  paymentMethod?: string;
  note?: string;
  items: CartItem[];
};

export async function createGuestOrder(input: CreateGuestOrderInput) {
  if (!input.items.length) throw new Error("Cart is empty.");
  const pickup = input.fulfillmentType === "PICKUP";
  if (pickup && (!input.pickupDate || !input.pickupStartTime || !input.pickupEndTime)) {
    throw new Error("Choose your pickup date and collection time.");
  }
  if (!pickup && (input.deliveryLat == null || input.deliveryLng == null || !input.deliverySlotId)) {
    throw new Error("Add your exact delivery location and choose a delivery time.");
  }
  const needsReceiver = !pickup && (input.hasDifferentReceiver || input.isGift);
  const result = await createCheckoutOrder({
    order_no: input.orderNo,
    idempotency_key: input.orderNo,
    device_id: getBauraDeviceId(),
    fulfillment_type: input.fulfillmentType,
    pickup_date: pickup ? input.pickupDate : null,
    pickup_start_time: pickup ? input.pickupStartTime : null,
    pickup_end_time: pickup ? input.pickupEndTime : null,
    sender_name: input.senderName.trim(),
    sender_email: input.senderEmail?.trim().toLowerCase() || "",
    sender_contact_number: input.senderContactNumber.trim(),
    sender_address: input.senderAddress.trim(),
    has_different_receiver: needsReceiver,
    is_gift: needsReceiver && input.isGift,
    delivery_target: needsReceiver && input.deliveryTarget === "RECEIVER" ? "RECEIVER" : "SENDER",
    receiver_name: needsReceiver ? input.receiverName?.trim() || null : null,
    receiver_contact_number: needsReceiver ? input.receiverContactNumber?.trim() || null : null,
    receiver_address: needsReceiver ? input.receiverAddress?.trim() || null : null,
    receiver_location_url: needsReceiver ? input.receiverLocationUrl?.trim() || null : null,
    receiver_lat: needsReceiver ? input.receiverLat ?? null : null,
    receiver_lng: needsReceiver ? input.receiverLng ?? null : null,
    delivery_address: pickup ? null : input.deliveryAddress?.trim() || null,
    delivery_location_url: pickup ? null : input.deliveryLocationUrl?.trim() || null,
    delivery_lat: pickup ? null : input.deliveryLat,
    delivery_lng: pickup ? null : input.deliveryLng,
    delivery_slot_id: pickup ? null : input.deliverySlotId,
    payment_method: input.paymentMethod === "PAYHERE" ? "PAYHERE" : "BANK_TRANSFER_WHATSAPP",
    note: input.note?.trim() || null,
    items: input.items.map((item) => ({
      product_id: item.itemId,
      product_size_id: item.itemSizeId,
      sugar_level_id: item.sugarLevelId,
      quantity: item.quantity,
    })),
  });
  return {
    orderId: result.order.id,
    orderNo: result.order.order_no,
    trackingToken: result.tracking_token,
  };
}

export async function claimDeviceOrdersForCurrentUser() {
  try {
    const result = await claimAccountOrders(getBauraDeviceId());
    return result.claimed;
  } catch (error) {
    console.warn("Could not claim device orders:", error);
    return 0;
  }
}

export async function getOrderTracking(orderNo: string, token?: string | null) {
  const params = new URLSearchParams();
  const deviceId = getBauraDeviceId();
  if (deviceId) params.set("device_id", deviceId);
  if (token) params.set("token", token);
  const query = params.toString();
  const response = await laravelGet<{ data: { order: PublicOrderTracking } }>(
    `/api/v1/orders/${encodeURIComponent(orderNo)}/track${query ? `?${query}` : ""}`,
  );
  return response.data.order;
}

export async function checkCustomerEmailExists(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) return false;
  try {
    return await checkCheckoutEmailExists(cleanEmail);
  } catch (error) {
    console.warn("Could not check customer email:", error);
    return false;
  }
}
