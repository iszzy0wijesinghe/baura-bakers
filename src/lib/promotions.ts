/** @format */

import type { CartItem } from "../app/cart";
import { laravelGet, laravelPatch, laravelPost } from "./laravelApi";

export type PromotionType =
  | "COUPON"
  | "QR"
  | "HAPPY_HOUR"
  | "DAY_OFFER"
  | "MONTH_OFFER"
  | "YEAR_OFFER"
  | "AUTO_OFFER";

export type DiscountType = "PERCENT" | "FIXED_LKR" | "FREE_ITEM";
export type PromotionTargetType = "ALL" | "CATEGORY" | "SUBCATEGORY" | "PRODUCT";

export type PromotionTarget = {
  id?: string;
  targetType: PromotionTargetType;
  targetId: string | null;
};

export type Promotion = {
  id: string;
  title: string;
  description: string | null;
  promotionType: PromotionType;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountLkr: number | null;
  minOrderLkr: number;
  couponCode: string | null;
  qrCode: string | null;
  startsAt: string | null;
  endsAt: string | null;
  happyHourStart: string | null;
  happyHourEnd: string | null;
  activeDays: number[];
  usageLimit: number | null;
  usedCount: number;
  stackable: boolean;
  isActive: boolean;
  targets: PromotionTarget[];
};

export type PromotionPayload = Omit<
  Promotion,
  "id" | "usedCount" | "targets"
> & {
  id?: string;
  targets: PromotionTarget[];
};

type PromotionsResponse = {
  data: { promotions: Promotion[] };
};

type PromotionResponse = {
  data: { promotion: Promotion };
};

type CouponValidationResponse = {
  data: {
    ok: boolean;
    message: string;
    discountLkr: number;
    promotion: Promotion | null;
  };
};

export function generateCouponCode(prefix = "BAURA") {
  const cleanPrefix =
    prefix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "BAURA";
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${cleanPrefix}${suffix}`;
}

export async function getAdminPromotions() {
  const response = await laravelGet<PromotionsResponse>(
    "/api/v1/admin/promotions",
  );

  return response.data.promotions;
}

export async function savePromotion(input: PromotionPayload) {
  const body = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    promotionType: input.promotionType,
    discountType: input.discountType,
    discountValue: Number(input.discountValue || 0),
    maxDiscountLkr: input.maxDiscountLkr || null,
    minOrderLkr: Number(input.minOrderLkr || 0),
    couponCode: input.couponCode?.trim().toUpperCase() || null,
    qrCode: input.qrCode?.trim().toUpperCase() || null,
    startsAt: input.startsAt || null,
    endsAt: input.endsAt || null,
    happyHourStart: input.happyHourStart || null,
    happyHourEnd: input.happyHourEnd || null,
    activeDays: input.activeDays.length
      ? input.activeDays
      : [0, 1, 2, 3, 4, 5, 6],
    usageLimit: input.usageLimit || null,
    stackable: input.stackable,
    isActive: input.isActive,
    targets: input.targets.length
      ? input.targets
      : [{ targetType: "ALL" as const, targetId: null }],
  };

  const response = input.id
    ? await laravelPatch<PromotionResponse>(
        `/api/v1/admin/promotions/${encodeURIComponent(input.id)}`,
        body,
      )
    : await laravelPost<PromotionResponse>("/api/v1/admin/promotions", body);

  return response.data.promotion.id;
}

export async function validateCouponForCart(code: string, items: CartItem[]) {
  const response = await laravelPost<CouponValidationResponse>(
    "/api/v1/promotions/validate",
    {
      code: code.trim().toUpperCase(),
      items: items.map((item) => ({
        productId: item.itemId,
        productSizeId: item.itemSizeId,
        quantity: item.quantity,
      })),
    },
  );

  return response.data;
}
