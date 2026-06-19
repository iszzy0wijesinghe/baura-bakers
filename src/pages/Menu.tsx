import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Page from "../components/Page";
import Section from "../components/Section";
import allMenuImage from "../assets/picnic-basket.webp";
import {
  getActiveCategories,
  getActiveItems,
  getActiveSubcategories,
  type MenuCategory,
  type MenuItem,
  type MenuSubcategory,
} from "../lib/items";

type IconKind =
  | "all"
  | "cake"
  | "bake"
  | "beverage"
  | "dessert"
  | "offer"
  | "combo"
  | "default";

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function getIconKind(category?: MenuCategory | null): IconKind {
  const key = `${category?.slug || ""} ${category?.name || ""}`.toLowerCase();

  if (key.includes("cake")) return "cake";
  if (key.includes("bake")) return "bake";
  if (key.includes("beverage") || key.includes("drink")) return "beverage";
  if (key.includes("dessert")) return "dessert";
  if (key.includes("offer")) return "offer";
  if (key.includes("combo")) return "combo";

  return "default";
}

function StrokeIcon({
  kind,
  className = "h-5 w-5",
}: {
  kind: IconKind;
  className?: string;
}) {
  if (kind === "all") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3.5v3" />
        <path d="M12 17.5v3" />
        <path d="M4.5 12h3" />
        <path d="M16.5 12h3" />
        <path d="m6.7 6.7 2.1 2.1" />
        <path d="m15.2 15.2 2.1 2.1" />
        <path d="m17.3 6.7-2.1 2.1" />
        <path d="m8.8 15.2-2.1 2.1" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>
    );
  }

  if (kind === "cake") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 8.5h8" />
        <path d="M12 4v4.5" />
        <path d="M11 4.8 12 3.5l1 1.3" />
        <path d="M5.5 12.5h13" />
        <path d="M6.5 12.5v6h11v-6" />
        <path d="M7.5 15.5c1.2 1 2.4 1 3.6 0s2.4-1 3.6 0 2.3 1 3.1.2" />
      </svg>
    );
  }

  if (kind === "bake") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 14c1.5-5 5.5-8 11-7" />
        <path d="M5 14c3.5 3.8 8.5 4.4 14 1.2" />
        <path d="M8 13c1.7-2.5 4.1-4 7.3-4.2" />
        <path d="M10.5 15.5c1.8.7 3.8.6 6-.4" />
        <path d="M4.5 14.2c1.2.7 2 .6 2.6-.2" />
      </svg>
    );
  }

  if (kind === "beverage") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 6.5h9" />
        <path d="M9 6.5 10.2 20h5.6L17 6.5" />
        <path d="M10 10h7" />
        <path d="M14 6.5 17.5 3" />
        <path d="M17.5 3h2" />
      </svg>
    );
  }

  if (kind === "dessert") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 13.5h12" />
        <path d="M7.5 13.5c.4 4 2.5 6 4.5 6s4.1-2 4.5-6" />
        <path d="M9 10.5c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5" />
        <path d="M10 7.4C10.1 5.5 11 4 12 4s1.9 1.5 2 3.4" />
      </svg>
    );
  }

  if (kind === "offer") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4.5 12.5 12.8 4.2h6v6l-8.3 8.3a2 2 0 0 1-2.8 0l-3.2-3.2a2 2 0 0 1 0-2.8Z" />
        <circle cx="16" cy="8" r="1" />
        <path d="M8.5 15.5 15.5 8.5" />
      </svg>
    );
  }

  if (kind === "combo") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 9.5h14" />
        <path d="M6.5 9.5 8 20h8l1.5-10.5" />
        <path d="M9 9.5V7a3 3 0 0 1 6 0v2.5" />
        <path d="M8.5 14.5h7" />
        <path d="M9 17h6" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5h14" />
      <path d="M7 12.5c.5 4.5 2.3 7 5 7s4.5-2.5 5-7" />
      <path d="M8 12.5a4 4 0 0 1 8 0" />
      <path d="M12 4v2" />
    </svg>
  );
}

function MenuIconImage({
  imageUrl,
  label,
  kind,
  size,
}: {
  imageUrl?: string | null;
  label: string;
  kind: IconKind;
  size: "category" | "subcategory";
}) {
  const sizeClass =
    size === "category" ? "h-11 w-11 sm:h-12 sm:w-12" : "h-8 w-8 sm:h-9 sm:w-9";

  const paddingClass = size === "category" ? "p-2" : "p-1.5";
  const fallbackSize = size === "category" ? "h-6 w-6" : "h-4 w-4";

  return (
    <div
      className={[
        "grid shrink-0 place-items-center overflow-hidden rounded-xl border border-brand-ink/10 bg-white/85",
        sizeClass,
      ].join(" ")}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label}
          className={`h-full w-full object-contain ${paddingClass}`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <StrokeIcon
          kind={kind}
          className={`${fallbackSize} text-brand-ink/65`}
        />
      )}
    </div>
  );
}

function ProductCard({ item }: { item: MenuItem }) {
  const image = item.thumbnailUrl || item.images[0]?.imageUrl || "";
  const alt = item.images[0]?.alt || `${item.name} product image`;
  const firstSize = item.sizes[0];

  return (
    <Link
      to={`/menu/${item.slug}`}
      className="group relative overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/60 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-ink/20 hover:bg-white/80 hover:shadow-[0_16px_38px_rgba(55,38,25,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-ink/[0.03]">
        {image ? (
          <img
            src={image}
            alt={alt}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm font-medium text-brand-ink/40">
            Product image
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent opacity-70" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {item.isCombo && (
            <span className="rounded-full border border-white/55 bg-white/85 px-3 py-1 text-[11px] font-semibold text-brand-ink shadow-sm backdrop-blur">
              Combo
            </span>
          )}

          {item.tags.slice(0, 1).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/55 bg-white/85 px-3 py-1 text-[11px] font-semibold text-brand-ink shadow-sm backdrop-blur"
            >
              {tag}
            </span>
          ))}
        </div>

        {firstSize && (
          <div className="absolute bottom-3 right-3 rounded-full border border-white/60 bg-white/90 px-3 py-1 text-xs font-bold text-brand-ink shadow-sm backdrop-blur">
            From {formatLkr(firstSize.priceLkr)}
          </div>
        )}
      </div>

      <div className="space-y-2.5 p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-ink/40">
            {item.subcategory || item.category}
          </p>

          <h3 className="mt-1 text-lg font-semibold leading-snug text-brand-ink">
            {item.name}
          </h3>
        </div>

        {(item.slogan || item.shortDesc) && (
          <p className="line-clamp-2 text-sm leading-relaxed text-brand-ink/65">
            {item.slogan || item.shortDesc}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-brand-ink/10 pt-3">
          <span className="text-xs font-semibold text-brand-ink/45">
            {item.sizes.length > 1
              ? `${item.sizes.length} sizes`
              : "Made fresh"}
          </span>

          <span className="text-xs font-bold text-brand-ink transition group-hover:translate-x-0.5">
            View item →
          </span>
        </div>
      </div>
    </Link>
  );
}

function CategoryCard({
  active,
  name,
  count,
  imageUrl,
  kind,
  onClick,
}: {
  active: boolean;
  name: string;
  count: number;
  imageUrl?: string | null;
  kind: IconKind;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-category-card
      onClick={onClick}
      className={[
        "min-w-[154px] snap-start rounded-[1.05rem] border px-2.5 py-2.5 text-left transition duration-300 sm:min-w-[170px]",
        active
          ? "border-brand-ink bg-brand-ink text-brand-bg shadow-[0_12px_26px_rgba(55,38,25,0.16)]"
          : "border-brand-ink/10 bg-white/60 text-brand-ink hover:border-brand-ink/20 hover:bg-white/80",
      ].join(" ")}
    >
      <div className="flex items-center gap-2.5">
        <MenuIconImage
          imageUrl={imageUrl}
          label={name}
          kind={kind}
          size="category"
        />

        <div className="min-w-0">
          <p
            className={[
              "truncate text-sm font-semibold leading-tight",
              active ? "text-brand-bg" : "text-brand-ink",
            ].join(" ")}
          >
            {name}
          </p>

          <p
            className={[
              "mt-0.5 text-[11px] font-medium",
              active ? "text-brand-bg/70" : "text-brand-ink/45",
            ].join(" ")}
          >
            {count} item{count === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </button>
  );
}

function SubcategoryCard({
  active,
  name,
  count,
  imageUrl,
  kind,
  onClick,
}: {
  active: boolean;
  name: string;
  count: number;
  imageUrl?: string | null;
  kind: IconKind;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-w-[118px] snap-start rounded-[0.9rem] border px-2 py-2 text-left transition duration-300 sm:min-w-[130px]",
        active
          ? "border-brand-ink bg-white text-brand-ink shadow-[0_8px_18px_rgba(55,38,25,0.08)]"
          : "border-brand-ink/10 bg-white/45 text-brand-ink hover:border-brand-ink/20 hover:bg-white/75",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <MenuIconImage
          imageUrl={imageUrl}
          label={name}
          kind={kind}
          size="subcategory"
        />

        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-brand-ink sm:text-sm">
            {name}
          </p>

          <p className="mt-0.5 text-[10px] font-medium text-brand-ink/45">
            {count} item{count === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [subcategories, setSubcategories] = useState<MenuSubcategory[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "ALL">(
    "ALL",
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    number | "ALL"
  >("ALL");

  const [searchText, setSearchText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const categoryRailRef = useRef<HTMLDivElement | null>(null);

  const [categoryScroll, setCategoryScroll] = useState({
    left: false,
    right: false,
  });

  useEffect(() => {
    async function loadItems() {
      try {
        setIsLoading(true);
        setErrorText("");

        const [categoryRows, subcategoryRows, itemRows] = await Promise.all([
          getActiveCategories(),
          getActiveSubcategories(),
          getActiveItems(),
        ]);

        setCategories(categoryRows);
        setSubcategories(subcategoryRows);
        setItems(itemRows);
      } catch (error) {
        setErrorText(
          error instanceof Error ? error.message : "Could not load menu.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadItems();
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateCategoryScrollState);

    function handleResize() {
      updateCategoryScrollState();
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [categories.length, items.length]);

  const categoryCounts = useMemo(() => {
    return items.reduce<Record<number, number>>((acc, item) => {
      acc[item.categoryId] = (acc[item.categoryId] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  const subcategoryCounts = useMemo(() => {
    return items.reduce<Record<number, number>>((acc, item) => {
      if (item.subcategoryId) {
        acc[item.subcategoryId] = (acc[item.subcategoryId] || 0) + 1;
      }

      return acc;
    }, {});
  }, [items]);

  const selectedCategory = useMemo(() => {
    if (selectedCategoryId === "ALL") return null;

    return (
      categories.find((category) => category.id === selectedCategoryId) || null
    );
  }, [categories, selectedCategoryId]);

  const visibleSubcategories = useMemo(() => {
    if (selectedCategoryId === "ALL") return [];

    return subcategories.filter(
      (subcategory) => subcategory.categoryId === selectedCategoryId,
    );
  }, [selectedCategoryId, subcategories]);

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return items.filter((item) => {
      const categoryMatch =
        selectedCategoryId === "ALL" || item.categoryId === selectedCategoryId;

      const subcategoryMatch =
        selectedSubcategoryId === "ALL" ||
        item.subcategoryId === selectedSubcategoryId;

      const searchable = [
        item.name,
        item.slogan || "",
        item.shortDesc || "",
        item.category,
        item.subcategory || "",
        ...item.tags,
      ]
        .join(" ")
        .toLowerCase();

      const searchMatch = !query || searchable.includes(query);

      return categoryMatch && subcategoryMatch && searchMatch;
    });
  }, [items, searchText, selectedCategoryId, selectedSubcategoryId]);

  const grouped = useMemo(() => {
    return filteredItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
      const groupTitle = item.subcategory || item.category || "Other";
      (acc[groupTitle] ||= []).push(item);
      return acc;
    }, {});
  }, [filteredItems]);

  const showSubcategories =
    selectedCategoryId !== "ALL" && visibleSubcategories.length > 0;

  function updateCategoryScrollState() {
    const rail = categoryRailRef.current;

    if (!rail) return;

    const maxScrollLeft = rail.scrollWidth - rail.clientWidth;

    setCategoryScroll({
      left: rail.scrollLeft > 4,
      right: rail.scrollLeft < maxScrollLeft - 4,
    });
  }

  function scrollCategoryRail(direction: "left" | "right") {
    const rail = categoryRailRef.current;

    if (!rail) return;

    const firstCard = rail.querySelector<HTMLElement>("[data-category-card]");
    const cardWidth = firstCard?.offsetWidth || 160;
    const gap = 10;

    rail.scrollBy({
      left: direction === "left" ? -(cardWidth + gap) : cardWidth + gap,
      behavior: "smooth",
    });
  }

  function selectCategory(categoryId: number | "ALL") {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId("ALL");

    window.requestAnimationFrame(() => {
      updateCategoryScrollState();
    });
  }

  function resetFilters() {
    setSelectedCategoryId("ALL");
    setSelectedSubcategoryId("ALL");
    setSearchText("");

    window.requestAnimationFrame(() => {
      updateCategoryScrollState();
    });
  }

  return (
    <Page>
      <div className="space-y-5 sm:space-y-6">
        <header>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-ink/42">
                Baura Bakers
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-brand-ink sm:text-5xl lg:text-6xl">
                Signature Menu
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-ink/62 sm:text-base">
                Fresh cakes, premium bakes, desserts, beverages, offers, and
                combo meals prepared for WhatsApp ordering.
              </p>
            </div>
          </div>
        </header>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        <section className="rounded-[1.4rem] border border-brand-ink/10 bg-white/50 p-3 shadow-[0_14px_36px_rgba(55,38,25,0.04)] backdrop-blur sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_300px] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-ink/38">
                Browse menu
              </p>

              <p className="mt-0.5 text-sm leading-6 text-brand-ink/58">
                Choose a category, then refine by type.
              </p>
            </div>

            <div className="relative">
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-2xl border border-brand-ink/10 bg-white/70 px-4 py-2.5 pr-10 text-sm font-medium text-brand-ink outline-none placeholder:text-brand-ink/32 focus:border-brand-ink/25 focus:bg-white focus:ring-2 focus:ring-brand-ink/8"
                placeholder="Search cakes, buns, juices..."
              />

              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/35"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="6" />
                <path d="m16 16 4 4" />
              </svg>
            </div>
          </div>

          <div className="mt-3 rounded-[1.1rem] border border-brand-ink/10 bg-brand-bg/35 p-2">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-ink/35">
                Categories
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollCategoryRail("left")}
                  disabled={!categoryScroll.left}
                  className={[
                    "grid h-7 w-7 place-items-center rounded-full border transition",
                    categoryScroll.left
                      ? "border-brand-ink/15 bg-white/80 text-brand-ink hover:border-brand-ink/25 hover:bg-white"
                      : "cursor-not-allowed border-brand-ink/5 bg-white/35 text-brand-ink/20",
                  ].join(" ")}
                  aria-label="Scroll categories left"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m15 6-6 6 6 6" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => scrollCategoryRail("right")}
                  disabled={!categoryScroll.right}
                  className={[
                    "grid h-7 w-7 place-items-center rounded-full border transition",
                    categoryScroll.right
                      ? "border-brand-ink/15 bg-white/80 text-brand-ink hover:border-brand-ink/25 hover:bg-white"
                      : "cursor-not-allowed border-brand-ink/5 bg-white/35 text-brand-ink/20",
                  ].join(" ")}
                  aria-label="Scroll categories right"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              ref={categoryRailRef}
              onScroll={updateCategoryScrollState}
              className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <CategoryCard
                active={selectedCategoryId === "ALL"}
                name="All menu"
                count={items.length}
                imageUrl={allMenuImage}
                kind="all"
                onClick={() => selectCategory("ALL")}
              />

              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  active={selectedCategoryId === category.id}
                  name={category.name}
                  count={categoryCounts[category.id] || 0}
                  imageUrl={category.imageUrl}
                  kind={getIconKind(category)}
                  onClick={() => selectCategory(category.id)}
                />
              ))}
            </div>
          </div>

          {showSubcategories && (
            <div className="mt-3 border-t border-brand-ink/10 pt-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-ink/35">
                  {selectedCategory?.name} types
                </p>

                {(selectedSubcategoryId !== "ALL" || searchText.trim()) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-full border border-brand-ink/10 bg-white/55 px-3 py-1.5 text-[11px] font-semibold text-brand-ink/55 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <SubcategoryCard
                  active={selectedSubcategoryId === "ALL"}
                  name="All types"
                  count={categoryCounts[selectedCategoryId] || 0}
                  kind={getIconKind(selectedCategory)}
                  imageUrl={selectedCategory?.imageUrl}
                  onClick={() => setSelectedSubcategoryId("ALL")}
                />

                {visibleSubcategories.map((subcategory) => (
                  <SubcategoryCard
                    key={subcategory.id}
                    active={selectedSubcategoryId === subcategory.id}
                    name={subcategory.name}
                    count={subcategoryCounts[subcategory.id] || 0}
                    imageUrl={
                      subcategory.imageUrl || selectedCategory?.imageUrl
                    }
                    kind={getIconKind(selectedCategory)}
                    onClick={() => setSelectedSubcategoryId(subcategory.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {!showSubcategories &&
            (selectedCategoryId !== "ALL" || searchText.trim()) && (
              <div className="mt-3 flex justify-end border-t border-brand-ink/10 pt-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-brand-ink/10 bg-white/55 px-3 py-1.5 text-[11px] font-semibold text-brand-ink/55 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink"
                >
                  Clear filters
                </button>
              </div>
            )}
        </section>

        {isLoading ? (
          <div className="rounded-3xl border border-brand-ink/10 bg-white/50 p-6 text-sm text-brand-ink/60 shadow-sm backdrop-blur">
            Loading today’s menu...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[2rem] border border-brand-ink/10 bg-white/50 p-8 text-center shadow-sm backdrop-blur">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-brand-ink/10 text-brand-ink/55">
              <StrokeIcon kind="cake" className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-brand-ink">
              No menu items are live yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-ink/60">
              Active products added from the admin product manager will appear
              here.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[2rem] border border-brand-ink/10 bg-white/50 p-8 text-center shadow-sm backdrop-blur">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-brand-ink/10 text-brand-ink/55">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="6" />
                <path d="m16 16 4 4" />
              </svg>
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-brand-ink">
              No matching items found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-ink/60">
              Try another category, subcategory, or search keyword.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-full bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg"
            >
              Reset menu
            </button>
          </div>
        ) : (
          <div id="menu-list" className="space-y-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-ink/38">
                  Today’s selection
                </p>

                <h2 className="mt-1.5 text-3xl font-semibold tracking-tight text-brand-ink">
                  {selectedCategory?.name || "All Baura favorites"}
                </h2>
              </div>

              <p className="rounded-full border border-brand-ink/10 bg-white/45 px-4 py-2 text-sm font-semibold text-brand-ink/55">
                {filteredItems.length} item
                {filteredItems.length === 1 ? "" : "s"} available
              </p>
            </div>

            {Object.entries(grouped).map(([title, list]) => (
              <Section
                key={title}
                eyebrow={`${list.length} ITEM${list.length === 1 ? "" : "S"}`}
                title={title}
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((item) => (
                    <ProductCard key={item.id} item={item} />
                  ))}
                </div>
              </Section>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
