/** @format */

import {
  LaravelApiError,
  laravelGet,
  laravelPatch,
  laravelPost,
} from "./laravelApi";

export type LaravelUserRole = "admin" | "customer";

export type LaravelUser = {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  phone: string | null;
  default_delivery_address: string | null;
  role: LaravelUserRole;
  is_active: boolean;
};

export type AccountStats = {
  total: number;
  pending: number;
  paid: number;
  completed: number;
};

export type AccountOrderItem = {
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

export type AccountOrder = {
  id: string;
  order_no: string;
  customer_name: string;
  customer_email: string | null;
  contact_number: string;
  customer_address: string;
  is_gift: boolean;
  has_different_receiver: boolean;
  delivery_target: "SENDER" | "RECEIVER";
  receiver_name: string | null;
  receiver_contact_number: string | null;
  receiver_address: string | null;
  receiver_location_url: string | null;
  receiver_lat: number | null;
  receiver_lng: number | null;
  delivery_address: string;
  delivery_location_url: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_app: string | null;
  delivery_date: string | null;
  delivery_slot_label: string | null;
  delivery_slot_start: string | null;
  delivery_slot_end: string | null;
  delivery_distance_km: number | null;
  delivery_vehicle_type: string | null;
  delivery_pricing_mode: string | null;
  subtotal_lkr: number;
  discount_lkr: number;
  delivery_fee_lkr: number;
  order_total_lkr: number;
  coupon_code: string | null;
  payment_method: string;
  payment_status: string;
  order_status: string;
  delivery_status: string;
  delivery_tracking_url: string | null;
  delivery_schedule_note: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  order_items?: AccountOrderItem[];
};

const AUTH_CACHE_MS = 30_000;

let authenticatedUserCache: LaravelUser | null = null;
let authenticatedUserCacheKnown = false;
let authenticatedUserCacheExpiresAt = 0;
let authenticatedUserRequest: Promise<LaravelUser | null> | null = null;

function cacheAuthenticatedUser(user: LaravelUser | null) {
  authenticatedUserCache = user;
  authenticatedUserCacheKnown = true;
  authenticatedUserCacheExpiresAt = Date.now() + AUTH_CACHE_MS;
}

export function clearAuthenticatedUserCache() {
  authenticatedUserCache = null;
  authenticatedUserCacheKnown = false;
  authenticatedUserCacheExpiresAt = 0;
  authenticatedUserRequest = null;
}

type UserResponse = {
  data: {
    user: LaravelUser;
  };
};

type AccountResponse = {
  data: {
    user: LaravelUser;
    stats: AccountStats;
  };
};

type OrdersResponse = {
  data: {
    orders: AccountOrder[];
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
    order: AccountOrder;
  };
};

export async function loginAccount(
  email: string,
  password: string,
  remember = false,
) {
  const response = await laravelPost<UserResponse>(
    "/api/v1/auth/login",
    {
      email,
      password,
      remember,
    },
  );

  cacheAuthenticatedUser(response.data.user);

  return response.data.user;
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}) {
  const response = await laravelPost<UserResponse>(
    "/api/v1/auth/register",
    input,
  );

  cacheAuthenticatedUser(response.data.user);

  return response.data.user;
}

export async function logoutAccount() {
  try {
    await laravelPost<{ message: string }>("/api/v1/auth/logout");
  } finally {
    clearAuthenticatedUserCache();
  }
}

export async function getAuthenticatedUser(forceRefresh = false) {
  if (
    !forceRefresh &&
    authenticatedUserCacheKnown &&
    authenticatedUserCacheExpiresAt > Date.now()
  ) {
    return authenticatedUserCache;
  }

  if (!forceRefresh && authenticatedUserRequest) {
    return authenticatedUserRequest;
  }

  authenticatedUserRequest = laravelGet<UserResponse>(
    "/api/v1/auth/user",
  )
    .then((response) => {
      cacheAuthenticatedUser(response.data.user);
      return response.data.user;
    })
    .catch((error) => {
      if (error instanceof LaravelApiError && error.status === 401) {
        cacheAuthenticatedUser(null);
        return null;
      }

      throw error;
    })
    .finally(() => {
      authenticatedUserRequest = null;
    });

  return authenticatedUserRequest;
}

export async function getAccountSummary() {
  const response = await laravelGet<AccountResponse>("/api/v1/account");

  return response.data;
}

export async function updateAccountProfile(input: {
  name: string;
  phone: string | null;
  default_delivery_address: string | null;
}) {
  const response = await laravelPatch<UserResponse>(
    "/api/v1/account/profile",
    input,
  );

  cacheAuthenticatedUser(response.data.user);

  return response.data.user;
}

export async function claimAccountOrders(deviceId: string | null) {
  const response = await laravelPost<{
    data: {
      claimed: number;
      stats: AccountStats;
    };
  }>("/api/v1/account/orders/claim", {
    device_id: deviceId,
  });

  return response.data;
}

export async function getAccountOrders(page = 1, perPage = 50) {
  return laravelGet<OrdersResponse>(
    `/api/v1/account/orders?page=${page}&per_page=${perPage}`,
  );
}

export async function getAllAccountOrders() {
  const firstPage = await getAccountOrders(1, 50);
  const orders = [...firstPage.data.orders];

  for (let page = 2; page <= firstPage.meta.last_page; page += 1) {
    const response = await getAccountOrders(page, 50);
    orders.push(...response.data.orders);
  }

  return orders;
}

export async function getAccountOrder(orderNo: string) {
  const response = await laravelGet<OrderResponse>(
    `/api/v1/account/orders/${encodeURIComponent(orderNo)}`,
  );

  return response.data.order;
}
