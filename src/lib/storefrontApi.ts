/** @format */

import { laravelGet } from "./laravelApi";

export type MenuItemSize = {
  id: string;
  label: string;
  serves: string | null;
  priceLkr: number;
  sortOrder: number;
};

export type MenuSugarLevel = {
  id: number;
  name: string;
};

export type MenuItemImage = {
  id: number;
  imageUrl: string;
  alt: string | null;
  sortOrder: number;
};

export type MenuCategory = {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type MenuSubcategory = {
  id: number;
  categoryId: number;
  name: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  categoryId: number;
  subcategoryId: number | null;

  category: string;
  categorySlug: string | null;
  categoryImageUrl: string | null;
  categoryImagePublicId: string | null;

  subcategory: string | null;
  subcategorySlug: string | null;
  subcategoryImageUrl: string | null;
  subcategoryImagePublicId: string | null;

  slug: string;
  name: string;
  slogan: string | null;
  shortDesc: string | null;
  description: string | null;
  thumbnailUrl: string | null;

  isActive: boolean;
  isCombo: boolean;
  comboConfig: Record<string, unknown> | null;

  sortOrder: number;

  sizes: MenuItemSize[];
  images: MenuItemImage[];
  tags: string[];
  sugarLevels: MenuSugarLevel[];
};

export type SiteModeKey =
  | "COMING_SOON"
  | "MAINTENANCE"
  | "CRITICAL_BREAK";

export type SiteModeRow = {
  id: string;
  mode: SiteModeKey;
  is_enabled: boolean;
  starts_at: string | null;
  ends_at: string | null;
  title: string;
  message: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type StorefrontBootstrap = {
  categories: MenuCategory[];
  subcategories: MenuSubcategory[];
  products: MenuItem[];
  activeSiteMode: SiteModeRow | null;
};

type StorefrontBootstrapResponse = {
  data: StorefrontBootstrap;
};

type StorefrontProductResponse = {
  data: {
    product: MenuItem;
  };
};

const BOOTSTRAP_CACHE_MS = 30_000;

let cachedBootstrap:
  | {
      expiresAt: number;
      value: StorefrontBootstrap;
    }
  | null = null;

let bootstrapRequest: Promise<StorefrontBootstrap> | null = null;

export async function getStorefrontBootstrap(
  forceRefresh = false,
): Promise<StorefrontBootstrap> {
  const now = Date.now();

  if (
    !forceRefresh &&
    cachedBootstrap &&
    cachedBootstrap.expiresAt > now
  ) {
    return cachedBootstrap.value;
  }

  if (!forceRefresh && bootstrapRequest) {
    return bootstrapRequest;
  }

  bootstrapRequest = laravelGet<StorefrontBootstrapResponse>(
    "/api/v1/storefront/bootstrap",
  )
    .then((response) => {
      cachedBootstrap = {
        expiresAt: Date.now() + BOOTSTRAP_CACHE_MS,
        value: response.data,
      };

      return response.data;
    })
    .finally(() => {
      bootstrapRequest = null;
    });

  return bootstrapRequest;
}

export async function getStorefrontProductBySlug(
  slug: string,
): Promise<MenuItem> {
  const response = await laravelGet<StorefrontProductResponse>(
    `/api/v1/storefront/products/${encodeURIComponent(slug)}`,
  );

  return response.data.product;
}

export function clearStorefrontCache() {
  cachedBootstrap = null;
  bootstrapRequest = null;
}
