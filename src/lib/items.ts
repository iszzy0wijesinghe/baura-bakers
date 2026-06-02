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

export type MenuItem = {
  id: string;
  categoryId: number;
  category: string;
  slug: string;
  name: string;
  slogan: string | null;
  shortDesc: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  isActive: boolean;
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

type RawItem = {
  id: string;
  category_id: number;
  slug: string;
  name: string;
  slogan: string | null;
  short_desc: string | null;
  description: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  sort_order: number;
  item_categories?: { name: string } | { name: string }[] | null;
  item_sizes?: {
    id: string;
    label: string;
    serves: string | null;
    price_lkr: number;
    sort_order: number;
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

function getCategoryName(raw: RawItem) {
  const category = raw.item_categories;

  if (Array.isArray(category)) {
    return category[0]?.name || "Other";
  }

  return category?.name || "Other";
}

function getSugarLevel(row: RawSugarLevelRow) {
  const level = row.sugar_levels;

  if (Array.isArray(level)) {
    return level[0] || null;
  }

  return level || null;
}

function normalizeItem(raw: RawItem): MenuItem {
  const sizes = (raw.item_sizes || [])
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
    category: getCategoryName(raw),
    slug: raw.slug,
    name: raw.name,
    slogan: raw.slogan,
    shortDesc: raw.short_desc,
    description: raw.description,
    thumbnailUrl: raw.thumbnail_url,
    isActive: raw.is_active,
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
  slug,
  name,
  slogan,
  short_desc,
  description,
  thumbnail_url,
  is_active,
  sort_order,
  item_categories (
    name
  ),
  item_sizes (
    id,
    label,
    serves,
    price_lkr,
    sort_order
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

export async function getActiveItems() {
  const { data, error } = await supabase
    .from("items")
    .select(itemSelect)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

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