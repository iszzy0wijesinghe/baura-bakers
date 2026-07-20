/** @format */

import {
  getStorefrontBootstrap,
  getStorefrontProductBySlug,
} from "./storefrontApi";

export type {
  MenuCategory,
  MenuItem,
  MenuItemImage,
  MenuItemSize,
  MenuSubcategory,
  MenuSugarLevel,
} from "./storefrontApi";

export async function getActiveCategories() {
  const storefront = await getStorefrontBootstrap();

  return storefront.categories;
}

export async function getActiveSubcategories() {
  const storefront = await getStorefrontBootstrap();

  return storefront.subcategories;
}

export async function getActiveItems() {
  const storefront = await getStorefrontBootstrap();

  return storefront.products;
}

export async function getItemBySlug(slug: string) {
  return getStorefrontProductBySlug(slug);
}
