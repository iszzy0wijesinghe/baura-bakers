import {
  laravelDelete,
  laravelGet,
  laravelPatch,
  laravelPost,
  laravelPut,
} from "./laravelApi";

export type HeroImagePosition = "left" | "center" | "right";

export type AdminHeroSlide = {
  id: number;
  name: string;
  eyebrow: string | null;
  title: string;
  description: string | null;

  imageUrl: string;
  imagePublicId: string | null;
  imageAlt: string | null;

  backgroundColor: string;
  overlayStrength: number;
  imagePosition: HeroImagePosition;

  primaryButtonLabel: string | null;
  primaryButtonUrl: string | null;

  secondaryButtonLabel: string | null;
  secondaryButtonUrl: string | null;

  sortOrder: number;
  isActive: boolean;

  createdAt: string | null;
  updatedAt: string | null;
};

export type HeroSlideForm = {
  name: string;
  eyebrow: string;
  title: string;
  description: string;

  imageUrl: string;
  imagePublicId: string;
  imageAlt: string;

  backgroundColor: string;
  overlayStrength: number;
  imagePosition: HeroImagePosition;

  primaryButtonLabel: string;
  primaryButtonUrl: string;

  secondaryButtonLabel: string;
  secondaryButtonUrl: string;

  sortOrder: number;
  isActive: boolean;
};

type HeroSlidesResponse = {
  data: {
    heroSlides: AdminHeroSlide[];
  };
};

type HeroSlideResponse = {
  message: string;
  data: {
    heroSlide: AdminHeroSlide;
  };
};

type MessageResponse = {
  message: string;
};

export const EMPTY_HERO_SLIDE: HeroSlideForm = {
  name: "",
  eyebrow: "BAURA BAKERS",
  title: "",
  description: "",

  imageUrl: "",
  imagePublicId: "",
  imageAlt: "",

  backgroundColor: "#1d100a",
  overlayStrength: 60,
  imagePosition: "right",

  primaryButtonLabel: "Explore the menu",
  primaryButtonUrl: "/menu",

  secondaryButtonLabel: "Something special?",
  secondaryButtonUrl: "/contact",

  sortOrder: 0,
  isActive: true,
};

export function heroSlideToForm(
  slide: AdminHeroSlide,
): HeroSlideForm {
  return {
    name: slide.name,
    eyebrow: slide.eyebrow ?? "",
    title: slide.title,
    description: slide.description ?? "",

    imageUrl: slide.imageUrl,
    imagePublicId: slide.imagePublicId ?? "",
    imageAlt: slide.imageAlt ?? "",

    backgroundColor: slide.backgroundColor,
    overlayStrength: slide.overlayStrength,
    imagePosition: slide.imagePosition,

    primaryButtonLabel: slide.primaryButtonLabel ?? "",
    primaryButtonUrl: slide.primaryButtonUrl ?? "",

    secondaryButtonLabel: slide.secondaryButtonLabel ?? "",
    secondaryButtonUrl: slide.secondaryButtonUrl ?? "",

    sortOrder: slide.sortOrder,
    isActive: slide.isActive,
  };
}

function toPayload(form: HeroSlideForm) {
  return {
    name: form.name.trim(),
    eyebrow: form.eyebrow.trim() || null,
    title: form.title.trim(),
    description: form.description.trim() || null,

    image_url: form.imageUrl,
    image_public_id: form.imagePublicId || null,
    image_alt: form.imageAlt.trim() || null,

    background_color: form.backgroundColor,
    overlay_strength: form.overlayStrength,
    image_position: form.imagePosition,

    primary_button_label:
      form.primaryButtonLabel.trim() || null,

    primary_button_url:
      form.primaryButtonUrl.trim() || null,

    secondary_button_label:
      form.secondaryButtonLabel.trim() || null,

    secondary_button_url:
      form.secondaryButtonUrl.trim() || null,

    sort_order: form.sortOrder,
    is_active: form.isActive,
  };
}

export async function getAdminHeroSlides() {
  const response = await laravelGet<HeroSlidesResponse>(
    "/api/v1/admin/hero-slides",
  );

  return response.data.heroSlides;
}

export async function createHeroSlide(
  form: HeroSlideForm,
) {
  const response = await laravelPost<HeroSlideResponse>(
    "/api/v1/admin/hero-slides",
    toPayload(form),
  );

  return response.data.heroSlide;
}

export async function updateHeroSlide(
  id: number,
  form: HeroSlideForm,
) {
  const response = await laravelPut<HeroSlideResponse>(
    `/api/v1/admin/hero-slides/${id}`,
    toPayload(form),
  );

  return response.data.heroSlide;
}

export async function toggleHeroSlide(
  id: number,
  isActive: boolean,
) {
  const response = await laravelPatch<HeroSlideResponse>(
    `/api/v1/admin/hero-slides/${id}/toggle`,
    {
      is_active: isActive,
    },
  );

  return response.data.heroSlide;
}

export async function deleteHeroSlide(id: number) {
  return laravelDelete<MessageResponse>(
    `/api/v1/admin/hero-slides/${id}`,
  );
}