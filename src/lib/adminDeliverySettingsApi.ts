/** @format */

import {
  laravelGet,
  laravelPatch,
  laravelPost,
  laravelRequest,
} from "./laravelApi";

export type DeliverySettingRow = {
  setting_key: string;
  setting_value: string;
};

export type AdminDeliveryData = {
  slots: Array<{
    id: string;
    slot_date: string;
    slot_label: string;
    start_time: string;
    end_time: string;
    max_orders: number;
    is_available: boolean;
  }>;
  vehicleRules: Array<{
    id: string;
    vehicle_type: string;
    min_quantity: number;
    max_quantity: number | null;
    is_active: boolean;
  }>;
  distancePrices: Array<{
    id: string;
    price_table_key: "PICKME_FLASH" | "UBER_PARCEL";
    distance_km: number;
    vehicle_type: string;
    normal_price_lkr: number;
    peak_price_lkr: number;
    is_active: boolean;
  }>;
  settings: Record<string, string>;
};

type DeliveryResponse = { data: AdminDeliveryData };

export type AdminSiteMode = {
  id: string;
  mode: "COMING_SOON" | "MAINTENANCE" | "CRITICAL_BREAK";
  title: string | null;
  message: string | null;
  is_enabled: boolean;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
};

export async function getAdminDeliveryData() {
  const response = await laravelGet<DeliveryResponse>(
    "/api/v1/admin/delivery",
  );

  return response.data;
}

export async function saveAdminDeliverySettings(
  rows: DeliverySettingRow[],
) {
  const response = await laravelPatch<DeliveryResponse>(
    "/api/v1/admin/delivery/settings",
    { rows },
  );

  return response.data;
}

export async function createAdminDeliverySlots(
  slots: AdminDeliveryData["slots"],
) {
  return laravelPost<{
    data: { slots: AdminDeliveryData["slots"] };
  }>("/api/v1/admin/delivery/slots", { slots });
}

export async function deleteAdminDeliverySlot(id: string) {
  await laravelRequest(`/api/v1/admin/delivery/slots/${encodeURIComponent(id)}`, {
    method: "DELETE",
    csrf: true,
  });
}

export async function saveAdminDistancePrice(input: {
  id?: string;
  price_table_key: string;
  distance_km: number;
  vehicle_type: string;
  normal_price_lkr: number;
  peak_price_lkr: number;
  is_active: boolean;
}) {
  const path = input.id
    ? `/api/v1/admin/delivery/distance-prices/${encodeURIComponent(input.id)}`
    : "/api/v1/admin/delivery/distance-prices";

  const body = {
    price_table_key: input.price_table_key,
    distance_km: input.distance_km,
    vehicle_type: input.vehicle_type,
    normal_price_lkr: input.normal_price_lkr,
    peak_price_lkr: input.peak_price_lkr,
    is_active: input.is_active,
  };

  return input.id
    ? laravelPatch(path, body)
    : laravelPost(path, body);
}

export async function deleteAdminDistancePrice(id: string) {
  await laravelRequest(
    `/api/v1/admin/delivery/distance-prices/${encodeURIComponent(id)}`,
    { method: "DELETE", csrf: true },
  );
}

export async function saveAdminVehicleRule(input: {
  id?: string;
  vehicle_type: string;
  min_quantity: number;
  max_quantity: number | null;
  is_active: boolean;
}) {
  const path = input.id
    ? `/api/v1/admin/delivery/vehicle-rules/${encodeURIComponent(input.id)}`
    : "/api/v1/admin/delivery/vehicle-rules";

  const body = {
    vehicle_type: input.vehicle_type,
    min_quantity: input.min_quantity,
    max_quantity: input.max_quantity,
    is_active: input.is_active,
  };

  return input.id
    ? laravelPatch(path, body)
    : laravelPost(path, body);
}

export async function deleteAdminVehicleRule(id: string) {
  await laravelRequest(
    `/api/v1/admin/delivery/vehicle-rules/${encodeURIComponent(id)}`,
    { method: "DELETE", csrf: true },
  );
}

export async function getAdminSiteModes() {
  const response = await laravelGet<{
    data: { modes: AdminSiteMode[] };
  }>("/api/v1/admin/site-modes");

  return response.data.modes;
}

export async function updateAdminSiteMode(
  mode: AdminSiteMode["mode"],
  enabled: boolean,
) {
  const response = await laravelPatch<{
    data: { mode: AdminSiteMode };
  }>(`/api/v1/admin/site-modes/${mode}`, {
    is_enabled: enabled,
  });

  return response.data.mode;
}

export async function resetAdminSiteModes() {
  const response = await laravelPost<{
    data: { modes: AdminSiteMode[] };
  }>("/api/v1/admin/site-modes/reset");

  return response.data.modes;
}
