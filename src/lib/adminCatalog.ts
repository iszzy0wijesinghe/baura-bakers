/** @format */

import { laravelGet, laravelPatch, laravelPost } from "./laravelApi";

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type AdminSubcategory = {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type AdminSugarLevel = {
  id: number;
  name: string;
};

export type AdminProductSize = {
  id?: string;
  label: string;
  serves: string | null;
  priceLkr: number;
  sortOrder: number;
  isActive?: boolean;
};

export type AdminProductImage = {
  id?: number;
  imageUrl: string;
  imagePublicId?: string | null;
  alt: string | null;
  sortOrder: number;
};

export type AdminProduct = {
  id: string;
  categoryId: number;
  subcategoryId: number | null;
  categoryName: string;
  subcategoryName: string | null;
  slug: string;
  name: string;
  slogan: string | null;
  shortDesc: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  thumbnailPublicId: string | null;
  isActive: boolean;
  isCombo: boolean;
  comboConfig: Record<string, unknown> | null;
  sortOrder: number;
  sizes: AdminProductSize[];
  images: AdminProductImage[];
  tags: string[];
  sugarLevelIds: number[];
};

export type ProductPayload = {
  id?: string;
  categoryId: number;
  subcategoryId: number | null;
  slug: string;
  name: string;
  slogan: string;
  shortDesc: string;
  description: string;
  thumbnailUrl: string;
  thumbnailPublicId: string;
  isActive: boolean;
  isCombo: boolean;
  comboConfig: Record<string, unknown> | null;
  sortOrder: number;
  sizes: AdminProductSize[];
  images: AdminProductImage[];
  tags: string[];
  sugarLevelIds: number[];
};

export type CategoryPayload = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  isActive: boolean;
  sortOrder: number;
};

export type SubcategoryPayload = {
  id?: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  isActive: boolean;
  sortOrder: number;
};

type AdminCatalogData = {
  categories: AdminCategory[];
  subcategories: AdminSubcategory[];
  sugarLevels: AdminSugarLevel[];
  products: AdminProduct[];
};

type AdminCatalogResponse = {
  data: AdminCatalogData;
};

type CategoryResponse = {
  data: { category: AdminCategory };
};

type SubcategoryResponse = {
  data: { subcategory: AdminSubcategory };
};

type ProductResponse = {
  data: { product: AdminProduct };
};

let catalogRequest: Promise<AdminCatalogData> | null = null;
let catalogCache: AdminCatalogData | null = null;

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function productToPayload(product: AdminProduct): ProductPayload {
  return {
    id: product.id,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    slug: product.slug,
    name: product.name,
    slogan: product.slogan || "",
    shortDesc: product.shortDesc || "",
    description: product.description || "",
    thumbnailUrl: product.thumbnailUrl || "",
    thumbnailPublicId: product.thumbnailPublicId || "",
    isActive: product.isActive,
    isCombo: product.isCombo,
    comboConfig: product.comboConfig,
    sortOrder: product.sortOrder,
    sizes: product.sizes.length
      ? product.sizes
      : [{ label: "Regular", serves: "1", priceLkr: 0, sortOrder: 0 }],
    images: product.images,
    tags: product.tags,
    sugarLevelIds: product.sugarLevelIds,
  };
}

function clearAdminCatalogCache() {
  catalogCache = null;
  catalogRequest = null;
}

async function getAdminCatalog(forceRefresh = false) {
  if (!forceRefresh && catalogCache) return catalogCache;
  if (!forceRefresh && catalogRequest) return catalogRequest;

  catalogRequest = laravelGet<AdminCatalogResponse>("/api/v1/admin/catalog")
    .then((response) => {
      catalogCache = response.data;
      return response.data;
    })
    .finally(() => {
      catalogRequest = null;
    });

  return catalogRequest;
}

export async function getAdminCategories() {
  return (await getAdminCatalog()).categories;
}

export async function getAdminSubcategories() {
  return (await getAdminCatalog()).subcategories;
}

export async function getAdminSugarLevels() {
  return (await getAdminCatalog()).sugarLevels;
}

export async function getAdminProducts() {
  return (await getAdminCatalog()).products;
}

export async function saveCategory(payload: CategoryPayload) {
  const body = {
    name: payload.name.trim(),
    slug: slugify(payload.slug || payload.name),
    description: payload.description.trim() || null,
    imageUrl: payload.imageUrl.trim() || null,
    imagePublicId: payload.imagePublicId.trim() || null,
    isActive: payload.isActive,
    sortOrder: Number(payload.sortOrder || 0),
  };

  const response = payload.id
    ? await laravelPatch<CategoryResponse>(
        `/api/v1/admin/catalog/categories/${payload.id}`,
        body,
      )
    : await laravelPost<CategoryResponse>(
        "/api/v1/admin/catalog/categories",
        body,
      );

  clearAdminCatalogCache();
  return response.data.category;
}

export async function saveSubcategory(payload: SubcategoryPayload) {
  const body = {
    categoryId: payload.categoryId,
    name: payload.name.trim(),
    slug: slugify(payload.slug || payload.name),
    description: payload.description.trim() || null,
    imageUrl: payload.imageUrl.trim() || null,
    imagePublicId: payload.imagePublicId.trim() || null,
    isActive: payload.isActive,
    sortOrder: Number(payload.sortOrder || 0),
  };

  const response = payload.id
    ? await laravelPatch<SubcategoryResponse>(
        `/api/v1/admin/catalog/subcategories/${payload.id}`,
        body,
      )
    : await laravelPost<SubcategoryResponse>(
        "/api/v1/admin/catalog/subcategories",
        body,
      );

  clearAdminCatalogCache();
  return response.data.subcategory;
}

export async function saveProduct(payload: ProductPayload) {
  const sizes = payload.sizes
    .filter((size) => size.label.trim())
    .map((size, index) => ({
      id: size.id,
      label: size.label.trim(),
      serves: size.serves?.trim() || null,
      priceLkr: Number(size.priceLkr || 0),
      sortOrder: index,
    }));

  if (!sizes.length) {
    throw new Error("Add at least one price/size row.");
  }

  const body = {
    categoryId: payload.categoryId,
    subcategoryId: payload.subcategoryId || null,
    slug: slugify(payload.slug || payload.name),
    name: payload.name.trim(),
    slogan: payload.slogan.trim() || null,
    shortDesc: payload.shortDesc.trim() || null,
    description: payload.description.trim() || null,
    thumbnailUrl: payload.thumbnailUrl.trim() || null,
    thumbnailPublicId: payload.thumbnailPublicId.trim() || null,
    isActive: payload.isActive,
    isCombo: payload.isCombo,
    comboConfig: payload.isCombo ? payload.comboConfig || {} : null,
    sortOrder: Number(payload.sortOrder || 0),
    sizes,
    images: payload.images
      .filter((image) => image.imageUrl.trim())
      .map((image, index) => ({
        imageUrl: image.imageUrl.trim(),
        imagePublicId: image.imagePublicId?.trim() || null,
        alt: image.alt?.trim() || payload.name.trim(),
        sortOrder: index,
      })),
    tags: [...new Set(payload.tags.map((tag) => tag.trim()).filter(Boolean))],
    sugarLevelIds: [...new Set(payload.sugarLevelIds.map(Number))],
  };

  const response = payload.id
    ? await laravelPatch<ProductResponse>(
        `/api/v1/admin/catalog/products/${encodeURIComponent(payload.id)}`,
        body,
      )
    : await laravelPost<ProductResponse>(
        "/api/v1/admin/catalog/products",
        body,
      );

  clearAdminCatalogCache();
  return response.data.product;
}
