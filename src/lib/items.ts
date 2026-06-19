import { supabase } from "./supabase";

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

type RawSugarLevelRow = {
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
};

type RawCategory = {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
};

type RawSubcategory = {
  id: number;
  category_id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
};

type RawItem = {
  id: string;
  category_id: number;
  subcategory_id?: number | null;

  slug: string;
  name: string;
  slogan: string | null;
  short_desc: string | null;
  description: string | null;
  thumbnail_url: string | null;

  is_active: boolean;
  is_combo?: boolean | null;
  combo_config?: Record<string, unknown> | null;

  sort_order: number;

  item_categories?: RawCategory | RawCategory[] | null;
  item_subcategories?: RawSubcategory | RawSubcategory[] | null;

  item_sizes?: {
    id: string;
    label: string;
    serves: string | null;
    price_lkr: number;
    sort_order: number;
    is_active?: boolean | null;
  }[];

  item_images?: {
    id: number;
    image_url: string;
    alt: string | null;
    sort_order: number;
  }[];

  item_tags?: {
    tag: string;
  }[];

  item_sugar_levels?: RawSugarLevelRow[];
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function getSugarLevel(row: RawSugarLevelRow) {
  return firstRelation(row.sugar_levels);
}

function normalizeCategory(raw: RawCategory): MenuCategory {
  return {
    id: Number(raw.id),
    name: raw.name,
    slug: raw.slug ?? null,
    description: raw.description ?? null,
    imageUrl: raw.image_url ?? null,
    imagePublicId: raw.image_public_id ?? null,
    isActive: raw.is_active ?? true,
    sortOrder: raw.sort_order ?? 0,
  };
}

function normalizeSubcategory(raw: RawSubcategory): MenuSubcategory {
  return {
    id: Number(raw.id),
    categoryId: Number(raw.category_id),
    name: raw.name,
    slug: raw.slug ?? null,
    description: raw.description ?? null,
    imageUrl: raw.image_url ?? null,
    imagePublicId: raw.image_public_id ?? null,
    isActive: raw.is_active ?? true,
    sortOrder: raw.sort_order ?? 0,
  };
}

export function normalizeItem(raw: RawItem): MenuItem {
  const category = firstRelation(raw.item_categories);
  const subcategory = firstRelation(raw.item_subcategories);

  const sizes = (raw.item_sizes || [])
    .filter((size) => size.is_active ?? true)
    .map((size) => ({
      id: size.id,
      label: size.label,
      serves: size.serves,
      priceLkr: Number(size.price_lkr || 0),
      sortOrder: size.sort_order || 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const images = (raw.item_images || [])
    .map((image) => ({
      id: image.id,
      imageUrl: image.image_url,
      alt: image.alt,
      sortOrder: image.sort_order || 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const tags = (raw.item_tags || []).map((tag) => tag.tag);

  const sugarLevels = (raw.item_sugar_levels || [])
    .map(getSugarLevel)
    .filter(Boolean) as MenuSugarLevel[];

  return {
    id: raw.id,
    categoryId: raw.category_id,
    subcategoryId: raw.subcategory_id ?? null,

    category: category?.name || "Other",
    categorySlug: category?.slug ?? null,
    categoryImageUrl: category?.image_url ?? null,
    categoryImagePublicId: category?.image_public_id ?? null,

    subcategory: subcategory?.name ?? null,
    subcategorySlug: subcategory?.slug ?? null,
    subcategoryImageUrl: subcategory?.image_url ?? null,
    subcategoryImagePublicId: subcategory?.image_public_id ?? null,

    slug: raw.slug,
    name: raw.name,
    slogan: raw.slogan,
    shortDesc: raw.short_desc,
    description: raw.description,
    thumbnailUrl: raw.thumbnail_url,

    isActive: raw.is_active,
    isCombo: raw.is_combo ?? false,
    comboConfig: raw.combo_config ?? null,

    sortOrder: raw.sort_order || 0,

    sizes,
    images,
    tags,
    sugarLevels,
  };
}

const itemSelect = `
  id,
  category_id,
  subcategory_id,
  slug,
  name,
  slogan,
  short_desc,
  description,
  thumbnail_url,
  is_active,
  is_combo,
  combo_config,
  sort_order,
  item_categories (
    id,
    name,
    slug,
    description,
    image_url,
    image_public_id,
    is_active,
    sort_order
  ),
  item_subcategories (
    id,
    category_id,
    name,
    slug,
    description,
    image_url,
    image_public_id,
    is_active,
    sort_order
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

export async function getActiveCategories() {
  const { data, error } = await supabase
    .from("item_categories")
    .select(
      "id, name, slug, description, image_url, image_public_id, is_active, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as RawCategory[]).map(normalizeCategory);
}

export async function getActiveSubcategories() {
  const { data, error } = await supabase
    .from("item_subcategories")
    .select(
      "id, category_id, name, slug, description, image_url, image_public_id, is_active, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as RawSubcategory[]).map(normalizeSubcategory);
}

export async function getActiveItems() {
  const { data, error } = await supabase
    .from("items")
    .select(itemSelect)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as RawItem[]).map(normalizeItem);
}

export async function getItemBySlug(slug: string) {
  const { data, error } = await supabase
    .from("items")
    .select(itemSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeItem(data as RawItem);
}
