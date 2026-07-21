/** @format */

import { laravelGet, laravelPatch } from "./laravelApi";

export type AdminOrderItem = {
  id: string;
  product_slug: string | null;
  product_name: string;
  size_label: string;
  sugar_level: string | null;
  quantity: number;
  unit_price_lkr: number;
  line_total_lkr: number;
  created_at: string | null;
};

export type AdminOrder = {
  id: string;
  mysql_id: number;
  order_no: string;
  user_id: number | null;
  customer_name: string;
  customer_email: string | null;
  contact_number: string;
  customer_address: string;
  delivery_address: string;
  delivery_location_url: string | null;
  delivery_date: string | null;
  delivery_slot_label: string | null;
  delivery_distance_km: number | null;
  delivery_vehicle_type: string | null;
  delivery_pricing_mode: string | null;
  subtotal_lkr: number;
  discount_lkr: number;
  delivery_fee_lkr: number;
  order_total_lkr: number;
  payment_status: string;
  order_status: string;
  payment_method: string | null;
  admin_note: string | null;
  note: string | null;
  confirmation_email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  order_items: AdminOrderItem[];
};

export type AdminDashboardStats = {
  totalOrders: number;
  pendingPayments: number;
  paidOrders: number;
  completedOrders: number;
};

type DashboardResponse = {
  data: {
    stats: AdminDashboardStats;
  };
};

type OrdersResponse = {
  data: {
    orders: AdminOrder[];
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

type OrderResponse = {
  data: {
    order: AdminOrder;
  };
};

export async function getAdminDashboardStats() {
  const response = await laravelGet<DashboardResponse>(
    "/api/v1/admin/dashboard",
  );

  return response.data.stats;
}

export async function getAdminOrders(page = 1, perPage = 100) {
  return laravelGet<OrdersResponse>(
    `/api/v1/admin/orders?page=${page}&per_page=${perPage}`,
  );
}

export async function getAllAdminOrders() {
  const firstPage = await getAdminOrders(1, 100);
  const orders = [...firstPage.data.orders];

  for (let page = 2; page <= firstPage.meta.last_page; page += 1) {
    const response = await getAdminOrders(page, 100);
    orders.push(...response.data.orders);
  }

  return orders;
}

export async function updateAdminOrder(
  orderId: string,
  updates: {
    payment_status?: string;
    order_status?: string;
    admin_note?: string | null;
  },
) {
  const response = await laravelPatch<OrderResponse>(
    `/api/v1/admin/orders/${encodeURIComponent(orderId)}`,
    updates,
  );

  return response.data.order;
}
