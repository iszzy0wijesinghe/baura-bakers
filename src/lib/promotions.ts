import { supabase } from "./supabase";
import type { CartItem } from "../app/cart";

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

type RawPromotionTarget = {
  id: string;
  target_type: PromotionTargetType;
  target_id: string | null;
};

type RawPromotion = {
  id: string;
  title: string;
  description: string | null;
  promotion_type: PromotionType;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_lkr: number | null;
  min_order_lkr: number | null;
  coupon_code: string | null;
  qr_code: string | null;
  starts_at: string | null;
  ends_at: string | null;
  happy_hour_start: string | null;
  happy_hour_end: string | null;
  active_days: number[] | null;
  usage_limit: number | null;
  used_count: number | null;
  stackable: boolean | null;
  is_active: boolean | null;
  promotion_targets?: RawPromotionTarget[];
};

function browserUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function normalizePromotion(row: RawPromotion): Promotion {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    promotionType: row.promotion_type,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value || 0),
    maxDiscountLkr:
      row.max_discount_lkr == null ? null : Number(row.max_discount_lkr),
    minOrderLkr: Number(row.min_order_lkr || 0),
    couponCode: row.coupon_code,
    qrCode: row.qr_code,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    happyHourStart: row.happy_hour_start,
    happyHourEnd: row.happy_hour_end,
    activeDays: row.active_days || [0, 1, 2, 3, 4, 5, 6],
    usageLimit: row.usage_limit,
    usedCount: row.used_count || 0,
    stackable: row.stackable ?? false,
    isActive: row.is_active ?? true,
    targets: (row.promotion_targets || []).map((target) => ({
      id: target.id,
      targetType: target.target_type,
      targetId: target.target_id,
    })),
  };
}

const promotionSelect = `
  id,
  title,
  description,
  promotion_type,
  discount_type,
  discount_value,
  max_discount_lkr,
  min_order_lkr,
  coupon_code,
  qr_code,
  starts_at,
  ends_at,
  happy_hour_start,
  happy_hour_end,
  active_days,
  usage_limit,
  used_count,
  stackable,
  is_active,
  promotion_targets (
    id,
    target_type,
    target_id
  )
`;

export function generateCouponCode(prefix = "BAURA") {
  const cleanPrefix =
    prefix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "BAURA";

  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${cleanPrefix}${suffix}`;
}

export async function getAdminPromotions() {
  const { data, error } = await supabase
    .from("promotions")
    .select(promotionSelect)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data || []) as RawPromotion[]).map(normalizePromotion);
}

export async function savePromotion(input: PromotionPayload) {
  if (!input.title.trim()) {
    throw new Error("Promotion title is required.");
  }

  const promotionId = input.id || browserUuid();

  const payload = {
    id: promotionId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    promotion_type: input.promotionType,
    discount_type: input.discountType,
    discount_value: Number(input.discountValue || 0),
    max_discount_lkr: input.maxDiscountLkr || null,
    min_order_lkr: Number(input.minOrderLkr || 0),
    coupon_code: input.couponCode?.trim().toUpperCase() || null,
    qr_code: input.qrCode?.trim().toUpperCase() || null,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    happy_hour_start: input.happyHourStart || null,
    happy_hour_end: input.happyHourEnd || null,
    active_days: input.activeDays.length
      ? input.activeDays
      : [0, 1, 2, 3, 4, 5, 6],
    usage_limit: input.usageLimit || null,
    stackable: input.stackable,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  const { error: promoError } = input.id
    ? await supabase.from("promotions").update(payload).eq("id", promotionId)
    : await supabase.from("promotions").insert(payload);

  if (promoError) throw new Error(promoError.message);

  const { error: deleteError } = await supabase
    .from("promotion_targets")
    .delete()
    .eq("promotion_id", promotionId);

  if (deleteError) throw new Error(deleteError.message);

  const targets = input.targets.length
    ? input.targets
    : [{ targetType: "ALL" as const, targetId: null }];

  const { error: targetError } = await supabase
    .from("promotion_targets")
    .insert(
      targets.map((target) => ({
        promotion_id: promotionId,
        target_type: target.targetType,
        target_id: target.targetType === "ALL" ? null : target.targetId,
      })),
    );

  if (targetError) throw new Error(targetError.message);

  return promotionId;
}

async function getEligibleSubtotal(promotion: Promotion, items: CartItem[]) {
  const targets = promotion.targets.length
    ? promotion.targets
    : [{ targetType: "ALL" as const, targetId: null }];

  if (targets.some((target) => target.targetType === "ALL")) {
    return items.reduce(
      (sum, item) => sum + item.unitPriceLkr * item.quantity,
      0,
    );
  }

  const itemIds = [...new Set(items.map((item) => item.itemId))];

  if (!itemIds.length) return 0;

  const { data, error } = await supabase
    .from("items")
    .select("id, category_id, subcategory_id")
    .in("id", itemIds);

  if (error) throw new Error(error.message);

  const meta = new Map(
    ((data || []) as {
      id: string;
      category_id: number;
      subcategory_id: number | null;
    }[]).map((row) => [
      row.id,
      {
        categoryId: String(row.category_id),
        subcategoryId:
          row.subcategory_id == null ? null : String(row.subcategory_id),
      },
    ]),
  );

  return items.reduce((sum, item) => {
    const itemMeta = meta.get(item.itemId);
    const lineTotal = item.unitPriceLkr * item.quantity;

    const eligible = targets.some((target) => {
      if (target.targetType === "PRODUCT") {
        return target.targetId === item.itemId;
      }

      if (target.targetType === "CATEGORY") {
        return target.targetId === itemMeta?.categoryId;
      }

      if (target.targetType === "SUBCATEGORY") {
        return target.targetId === itemMeta?.subcategoryId;
      }

      return false;
    });

    return eligible ? sum + lineTotal : sum;
  }, 0);
}

export async function validateCouponForCart(code: string, items: CartItem[]) {
  const cleanCode = code.trim().toUpperCase();

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPriceLkr * item.quantity,
    0,
  );

  if (!cleanCode) {
    return {
      ok: false,
      message: "Enter a coupon code.",
      discountLkr: 0,
      promotion: null as Promotion | null,
    };
  }

  const { data, error } = await supabase
    .from("promotions")
    .select(promotionSelect)
    .eq("coupon_code", cleanCode)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    return {
      ok: false,
      message: "Coupon not found or inactive.",
      discountLkr: 0,
      promotion: null as Promotion | null,
    };
  }

  const promotion = normalizePromotion(data as RawPromotion);
  const now = new Date();

  if (promotion.startsAt && now < new Date(promotion.startsAt)) {
    return {
      ok: false,
      message: "This coupon has not started yet.",
      discountLkr: 0,
      promotion,
    };
  }

  if (promotion.endsAt && now > new Date(promotion.endsAt)) {
    return {
      ok: false,
      message: "This coupon has expired.",
      discountLkr: 0,
      promotion,
    };
  }

  if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
    return {
      ok: false,
      message: "This coupon usage limit is already reached.",
      discountLkr: 0,
      promotion,
    };
  }

  if (subtotal < promotion.minOrderLkr) {
    return {
      ok: false,
      message: `Minimum order should be LKR ${promotion.minOrderLkr.toLocaleString()}.`,
      discountLkr: 0,
      promotion,
    };
  }

  const targetSubtotal = await getEligibleSubtotal(promotion, items);

  if (targetSubtotal <= 0) {
    return {
      ok: false,
      message: "This coupon is not valid for the selected cart items.",
      discountLkr: 0,
      promotion,
    };
  }

  let discountLkr = 0;

  if (promotion.discountType === "PERCENT") {
    discountLkr = Math.round((targetSubtotal * promotion.discountValue) / 100);

    if (promotion.maxDiscountLkr) {
      discountLkr = Math.min(discountLkr, promotion.maxDiscountLkr);
    }
  }

  if (promotion.discountType === "FIXED_LKR") {
    discountLkr = Math.round(promotion.discountValue);
  }

  discountLkr = Math.max(0, Math.min(discountLkr, subtotal));

  return {
    ok: discountLkr > 0,
    message:
      discountLkr > 0
        ? "Coupon applied."
        : "This coupon does not create a discount for the current cart.",
    discountLkr,
    promotion,
  };
}