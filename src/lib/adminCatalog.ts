import { supabase } from "./supabase";

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

type RawRelation<T> = T | T[] | null;

type RawCategory = {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  image_public_id: string | null;
  is_active: boolean | null;
  sort_order: number | null;
};

type RawSubcategory = {
  id: number;
  category_id: number;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  image_public_id: string | null;
  is_active: boolean | null;
  sort_order: number | null;
};

type RawProduct = {
  id: string;
  category_id: number;
  subcategory_id: number | null;

  slug: string;
  name: string;
  slogan: string | null;
  short_desc: string | null;
  description: string | null;

  thumbnail_url: string | null;
  thumbnail_public_id: string | null;

  is_active: boolean;
  is_combo: boolean | null;
  combo_config: Record<string, unknown> | null;

  sort_order: number | null;

  item_categories: RawRelation<{
    name: string;
  }>;

  item_subcategories: RawRelation<{
    name: string;
  }>;

  item_sizes?: {
    id: string;
    label: string;
    serves: string | null;
    price_lkr: number;
    sort_order: number | null;
    is_active?: boolean | null;
  }[];

  item_images?: {
    id: number;
    image_url: string;
    image_public_id: string | null;
    alt: string | null;
    sort_order: number | null;
  }[];

  item_tags?: {
    tag: string;
  }[];

  item_sugar_levels?: {
    sugar_levels:
      | {
          id: number;
          name: string;
        }
      | {
          id: number;
          name: string;
        }[]
      | null;
  }[];
};

function firstRelation<T>(value: RawRelation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategory(row: RawCategory): AdminCategory {
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug || "",
    description: row.description,
    imageUrl: row.image_url,
    imagePublicId: row.image_public_id,
    isActive: row.is_active ?? true,
    sortOrder: row.sort_order ?? 0,
  };
}

function normalizeSubcategory(row: RawSubcategory): AdminSubcategory {
  return {
    id: Number(row.id),
    categoryId: Number(row.category_id),
    name: row.name,
    slug: row.slug || "",
    description: row.description,
    imageUrl: row.image_url,
    imagePublicId: row.image_public_id,
    isActive: row.is_active ?? true,
    sortOrder: row.sort_order ?? 0,
  };
}

function normalizeProduct(row: RawProduct): AdminProduct {
  const category = firstRelation(row.item_categories);
  const subcategory = firstRelation(row.item_subcategories);

  const sizes = (row.item_sizes || [])
    .filter((size) => size.is_active ?? true)
    .map((size) => ({
      id: size.id,
      label: size.label,
      serves: size.serves,
      priceLkr: Number(size.price_lkr || 0),
      sortOrder: size.sort_order ?? 0,
      isActive: size.is_active ?? true,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const images = (row.item_images || [])
    .map((image) => ({
      id: image.id,
      imageUrl: image.image_url,
      imagePublicId: image.image_public_id,
      alt: image.alt,
      sortOrder: image.sort_order ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const tags = (row.item_tags || []).map((tag) => tag.tag);

  const sugarLevelIds = (row.item_sugar_levels || [])
    .map((link) => firstRelation(link.sugar_levels)?.id)
    .filter(Boolean) as number[];

  return {
    id: row.id,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,

    categoryName: category?.name || "Other",
    subcategoryName: subcategory?.name || null,

    slug: row.slug,
    name: row.name,
    slogan: row.slogan,
    shortDesc: row.short_desc,
    description: row.description,

    thumbnailUrl: row.thumbnail_url,
    thumbnailPublicId: row.thumbnail_public_id,

    isActive: row.is_active,
    isCombo: row.is_combo ?? false,
    comboConfig: row.combo_config,

    sortOrder: row.sort_order ?? 0,

    sizes,
    images,
    tags,
    sugarLevelIds,
  };
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

const adminProductSelect = `
  id,
  category_id,
  subcategory_id,
  slug,
  name,
  slogan,
  short_desc,
  description,
  thumbnail_url,
  thumbnail_public_id,
  is_active,
  is_combo,
  combo_config,
  sort_order,
  item_categories (
    name
  ),
  item_subcategories (
    name
  ),
item_sizes (
  id,
  label,
  serves,
  price_lkr,
  sort_order,
  is_active
),
  item_images (
    id,
    image_url,
    image_public_id,
    alt,
    sort_order
  ),
  item_tags (
    tag
  ),
  item_sugar_levels (
    sugar_levels (
      id,
      name
    )
  )
`;

export async function getAdminCategories() {
  const { data, error } = await supabase
    .from("item_categories")
    .select(
      "id, name, slug, description, image_url, image_public_id, is_active, sort_order",
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as RawCategory[]).map(normalizeCategory);
}

export async function getAdminSubcategories() {
  const { data, error } = await supabase
    .from("item_subcategories")
    .select(
      "id, category_id, name, slug, description, image_url, image_public_id, is_active, sort_order",
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as RawSubcategory[]).map(normalizeSubcategory);
}

export async function getAdminSugarLevels() {
  const { data, error } = await supabase
    .from("sugar_levels")
    .select("id, name")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as AdminSugarLevel[];
}

export async function getAdminProducts() {
  const { data, error } = await supabase
    .from("items")
    .select(adminProductSelect)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as RawProduct[]).map(normalizeProduct);
}

export async function saveCategory(payload: CategoryPayload) {
  if (!payload.name.trim()) {
    throw new Error("Category name is required.");
  }

  const body = {
    name: payload.name.trim(),
    slug: slugify(payload.slug || payload.name),
    description: payload.description.trim() || null,
    image_url: payload.imageUrl.trim() || null,
    image_public_id: payload.imagePublicId.trim() || null,
    is_active: payload.isActive,
    sort_order: Number(payload.sortOrder || 0),
    updated_at: new Date().toISOString(),
  };

  if (payload.id) {
    const { error } = await supabase
      .from("item_categories")
      .update(body)
      .eq("id", payload.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("item_categories").insert(body);

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveSubcategory(payload: SubcategoryPayload) {
  if (!payload.categoryId) {
    throw new Error("Parent category is required.");
  }

  if (!payload.name.trim()) {
    throw new Error("Subcategory name is required.");
  }

  const body = {
    category_id: payload.categoryId,
    name: payload.name.trim(),
    slug: slugify(payload.slug || payload.name),
    description: payload.description.trim() || null,
    image_url: payload.imageUrl.trim() || null,
    image_public_id: payload.imagePublicId.trim() || null,
    is_active: payload.isActive,
    sort_order: Number(payload.sortOrder || 0),
    updated_at: new Date().toISOString(),
  };

  if (payload.id) {
    const { error } = await supabase
      .from("item_subcategories")
      .update(body)
      .eq("id", payload.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("item_subcategories").insert(body);

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveProduct(payload: ProductPayload) {
  if (!payload.categoryId) {
    throw new Error("Product category is required.");
  }

  if (!payload.name.trim()) {
    throw new Error("Product name is required.");
  }

  const validSizes = payload.sizes
    .filter((size) => size.label.trim())
    .map((size, index) => ({
      label: size.label.trim(),
      serves: size.serves?.trim() || null,
      price_lkr: Number(size.priceLkr || 0),
      sort_order: index,
    }));

  if (!validSizes.length) {
    throw new Error("Add at least one price/size row.");
  }

  const itemBody = {
    category_id: payload.categoryId,
    subcategory_id: payload.subcategoryId || null,
    slug: slugify(payload.slug || payload.name),
    name: payload.name.trim(),
    slogan: payload.slogan.trim() || null,
    short_desc: payload.shortDesc.trim() || null,
    description: payload.description.trim() || null,
    thumbnail_url: payload.thumbnailUrl.trim() || null,
    thumbnail_public_id: payload.thumbnailPublicId.trim() || null,
    is_active: payload.isActive,
    is_combo: payload.isCombo,
    combo_config: payload.isCombo ? payload.comboConfig || {} : null,
    sort_order: Number(payload.sortOrder || 0),
    updated_at: new Date().toISOString(),
  };

  let productId = payload.id;

  if (productId) {
    const { error } = await supabase
      .from("items")
      .update(itemBody)
      .eq("id", productId);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { data, error } = await supabase
      .from("items")
      .insert(itemBody)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    productId = data.id as string;
  }

  if (!productId) {
    throw new Error("Product could not be saved.");
  }

  const deleteResults = await Promise.all([
    supabase.from("item_images").delete().eq("item_id", productId),
    supabase.from("item_tags").delete().eq("item_id", productId),
    supabase.from("item_sugar_levels").delete().eq("item_id", productId),
  ]);

  const deleteError = deleteResults.find((result) => result.error)?.error;

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: deactivateSizesError } = await supabase
    .from("item_sizes")
    .update({ is_active: false })
    .eq("item_id", productId);

  if (deactivateSizesError) {
    throw new Error(deactivateSizesError.message);
  }

  for (const size of payload.sizes
    .filter((size) => size.label.trim())
    .map((size, index) => ({
      ...size,
      sortOrder: index,
    }))) {
    const sizeBody = {
      item_id: productId,
      label: size.label.trim(),
      serves: size.serves?.trim() || null,
      price_lkr: Number(size.priceLkr || 0),
      sort_order: Number(size.sortOrder || 0),
      is_active: true,
    };

    if (size.id) {
      const { error } = await supabase
        .from("item_sizes")
        .update(sizeBody)
        .eq("id", size.id)
        .eq("item_id", productId);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase.from("item_sizes").insert(sizeBody);

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  const imageRows = payload.images
    .filter((image) => image.imageUrl.trim())
    .map((image, index) => ({
      item_id: productId,
      image_url: image.imageUrl.trim(),
      image_public_id: image.imagePublicId?.trim() || null,
      alt: image.alt?.trim() || payload.name.trim(),
      sort_order: index,
    }));

  if (imageRows.length) {
    const { error } = await supabase.from("item_images").insert(imageRows);

    if (error) {
      throw new Error(error.message);
    }
  }

  const tagRows = payload.tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => ({
      item_id: productId,
      tag,
    }));

  if (tagRows.length) {
    const { error } = await supabase.from("item_tags").insert(tagRows);

    if (error) {
      throw new Error(error.message);
    }
  }

  const sugarRows = payload.sugarLevelIds.map((sugarLevelId) => ({
    item_id: productId,
    sugar_level_id: sugarLevelId,
  }));

  if (sugarRows.length) {
    const { error } = await supabase
      .from("item_sugar_levels")
      .insert(sugarRows);

    if (error) {
      throw new Error(error.message);
    }
  }
}
