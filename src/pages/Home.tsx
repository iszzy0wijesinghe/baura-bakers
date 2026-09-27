import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import Page from "../components/Page";
import ProductCard from "../components/ProductCard";
import {
  getActiveItems,
  type MenuItem,
} from "../lib/items";
import { getProductClicks } from "../lib/productClicks";
import {
  getStorefrontBootstrap,
  type StorefrontHeroSlide,
} from "../lib/storefrontApi";

import heroMain from "../../images/home/hero-jarcakes.webp.webp";
import imageTwo from "../../images/home/hero-image2.webp";
import imageThree from "../../images/home/hero-image5.webp";
import imageFour from "../../images/home/hero-image6.webp";

const ease = [0.22, 1, 0.36, 1] as const;
const HERO_INTERVAL_MS = 6500;

const fallbackHeroSlide: StorefrontHeroSlide = {
  id: -1,
  name: "Default Baura Hero",
  eyebrow: "BAURA BAKERS",
  title: "Freshly baked.\nSeriously delicious.",
  description:
    "Cakes, desserts and bakery favourites made for cravings, celebrations and those “just one more bite” moments.",
  imageUrl: heroMain,
  imageAlt: "Fresh desserts from Baura Bakers",
  backgroundColor: "#17120f",
  overlayStrength: 24,
  imagePosition: "right",
  primaryButtonLabel: "Explore the menu",
  primaryButtonUrl: "/menu",
  secondaryButtonLabel: "Something special?",
  secondaryButtonUrl: "/contact",
};

type HeroCSSProperties = CSSProperties & {
  "--baura-hero-overlay"?: string;
  "--baura-hero-image"?: string;
  "--baura-hero-image-position"?: string;
  "--baura-hero-mobile-position"?: string;
};

function getHeroImageUrl(imageUrl: string) {
  return `url(${JSON.stringify(imageUrl)})`;
}

function getHeroOverlay(overlayStrength: number) {
  const value = Number.isFinite(overlayStrength)
    ? overlayStrength
    : 0;

  return Math.min(100, Math.max(0, value)) / 100;
}

function isOfferItem(item: MenuItem) {
  const offerPattern =
    /\b(offers?|deals?|promos?|promotions?|discounts?|sales?)\b/i;

  return [
    item.category,
    item.categorySlug,
    item.subcategory,
    item.subcategorySlug,
    ...item.tags,
  ].some((value) => offerPattern.test(value || ""));
}

export default function Home() {
  const reduceMotion = Boolean(useReducedMotion());

  const [items, setItems] = useState<MenuItem[]>([]);
  const [heroSlides, setHeroSlides] =
    useState<StorefrontHeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [storefront, products] = await Promise.all([
          getStorefrontBootstrap(),
          getActiveItems(),
        ]);

        if (!active) return;

        setHeroSlides(storefront.heroSlides ?? []);
        setItems(products);
      } catch (error) {
        console.error(
          "Failed to load Baura storefront:",
          error,
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const rankedProducts = useMemo(() => {
    const activeProducts = items.filter(
      (item) => item.isActive,
    );

    const clicks = getProductClicks();

    const hasClickData = Object.values(clicks).some(
      (value) => value > 0,
    );

    if (!hasClickData) {
      return activeProducts;
    }

    return [...activeProducts].sort(
      (a, b) =>
        (clicks[b.slug] ?? 0) -
        (clicks[a.slug] ?? 0),
    );
  }, [items]);

  const freshProducts = useMemo(() => {
    const regularProducts = rankedProducts.filter(
      (item) => !isOfferItem(item),
    );

    return (
      regularProducts.length > 0
        ? regularProducts
        : rankedProducts
    ).slice(0, 3);
  }, [rankedProducts]);

  const offerProducts = useMemo(() => {
    return rankedProducts
      .filter(isOfferItem)
      .slice(0, 3);
  }, [rankedProducts]);

  const featuredProducts = useMemo(() => {
    const freshSlugs = new Set(
      freshProducts.map((item) => item.slug),
    );

    const remainingProducts = rankedProducts.filter(
      (item) =>
        !freshSlugs.has(item.slug) &&
        !isOfferItem(item),
    );

    if (remainingProducts.length > 0) {
      return remainingProducts.slice(0, 6);
    }

    const regularProducts = rankedProducts.filter(
      (item) => !isOfferItem(item),
    );

    return (
      regularProducts.length > 0
        ? regularProducts
        : rankedProducts
    ).slice(0, 6);
  }, [rankedProducts, freshProducts]);

  const visibleHeroSlides =
    heroSlides.length > 0
      ? heroSlides
      : [fallbackHeroSlide];

  return (
    <Page>
      <main className="baura-home">
        <Hero
          slides={visibleHeroSlides}
          reduceMotion={reduceMotion}
        />

        <FreshFromBaura
          products={freshProducts}
          loading={loading}
        />

        <OffersSection
          products={offerProducts}
          loading={loading}
        />

        <FeaturedMenu
          products={featuredProducts}
          loading={loading}
        />

        <FreshComposition
          reduceMotion={reduceMotion}
        />

        <Celebration
          reduceMotion={reduceMotion}
        />

        <FinalOrder />
      </main>
    </Page>
  );
}

/* =======================================================
   HERO — FINALIZED / UNCHANGED
======================================================= */

function Hero({
  slides,
  reduceMotion,
}: {
  slides: StorefrontHeroSlide[];
  reduceMotion: boolean;
}) {
  const navigate = useNavigate();

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setActiveSlide((current) =>
      Math.min(
        current,
        Math.max(0, slides.length - 1),
      ),
    );
  }, [slides.length]);

  useEffect(() => {
    if (reduceMotion || slides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveSlide(
        (current) => (current + 1) % slides.length,
      );
    }, HERO_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [reduceMotion, slides.length]);

  const slide = slides[activeSlide] ?? slides[0];

  if (!slide) return null;

  const overlay = getHeroOverlay(
    slide.overlayStrength,
  );

  const heroStyle: HeroCSSProperties = {
    "--baura-hero-overlay": overlay.toFixed(3),
  };

  function openAction(url: string | null) {
    if (!url) return;

    if (
      url.startsWith("/") &&
      !url.startsWith("//")
    ) {
      navigate(url);
      return;
    }

    window.location.assign(url);
  }

  return (
    <section
      className="baura-hero"
      style={heroStyle}
    >
      <div className="baura-hero__slides">
        <AnimatePresence
          initial={false}
          mode="sync"
        >
          <motion.div
            key={slide.id}
            className="baura-hero__slide"
            initial={
              reduceMotion
                ? false
                : { opacity: 0 }
            }
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: reduceMotion ? 0 : 0.9,
              ease,
            }}
          >
            <AdaptiveHeroArtwork slide={slide} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="baura-hero__darkness"
        aria-hidden="true"
      />

      <div
        className="baura-hero__header-shade"
        aria-hidden="true"
      />

      <div
        className={[
          "baura-hero__text-shade",
          slide.imagePosition === "left"
            ? "baura-hero__text-shade--right"
            : "baura-hero__text-shade--left",
        ].join(" ")}
        aria-hidden="true"
      />

      <div
        className="baura-hero__bottom-shade"
        aria-hidden="true"
      />

      <div
        className={[
          "baura-hero__content",
          slide.imagePosition === "left"
            ? "baura-hero__content--image-left"
            : "",
        ].join(" ")}
      >
        <AnimatePresence
          mode="wait"
          initial={false}
        >
          <motion.div
            key={`copy-${slide.id}`}
            className="baura-hero__copy"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 12,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={
              reduceMotion
                ? undefined
                : {
                    opacity: 0,
                    y: -8,
                  }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.5,
              ease,
            }}
          >
            {slide.eyebrow ? (
              <span className="baura-hero__eyebrow">
                {slide.eyebrow}
              </span>
            ) : null}

            <h1>
              {renderHeroTitle(slide.title)}
            </h1>

            {slide.description ? (
              <p>{slide.description}</p>
            ) : null}

            {(slide.primaryButtonLabel ||
              slide.secondaryButtonLabel) && (
              <div className="baura-hero__actions">
                {slide.primaryButtonLabel &&
                slide.primaryButtonUrl ? (
                  <button
                    type="button"
                    className="baura-button baura-button--light"
                    onClick={() =>
                      openAction(
                        slide.primaryButtonUrl,
                      )
                    }
                  >
                    {slide.primaryButtonLabel}

                    <ArrowRight
                      size={17}
                      strokeWidth={1.8}
                    />
                  </button>
                ) : null}

                {slide.secondaryButtonLabel &&
                slide.secondaryButtonUrl ? (
                  <button
                    type="button"
                    className="baura-hero__secondary"
                    onClick={() =>
                      openAction(
                        slide.secondaryButtonUrl,
                      )
                    }
                  >
                    {slide.secondaryButtonLabel}

                    <ChevronRight size={16} />
                  </button>
                ) : null}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="baura-hero__bottom">
          <div className="baura-hero__fresh">
            <span />
            Freshly prepared with care
          </div>

          <div className="baura-hero__slide-status">
            {slides.length > 1 ? (
              <div
                className="baura-hero__progress"
                aria-label={`Hero slide ${
                  activeSlide + 1
                } of ${slides.length}`}
              >
                {slides.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      activeSlide === index
                        ? "is-active"
                        : ""
                    }
                    onClick={() =>
                      setActiveSlide(index)
                    }
                    aria-label={`Show hero slide ${
                      index + 1
                    }`}
                    aria-current={
                      activeSlide === index
                        ? "true"
                        : undefined
                    }
                  >
                    <span />
                  </button>
                ))}
              </div>
            ) : null}

            <span className="baura-hero__number">
              {String(
                activeSlide + 1,
              ).padStart(2, "0")}

              <span>/</span>

              {String(
                slides.length,
              ).padStart(2, "0")}
            </span>

            <a
              href="#discover-baura"
              className="baura-hero__discover"
            >
              Discover

              <ArrowDown size={15} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =======================================================
   HERO ARTWORK — FINALIZED / UNCHANGED
======================================================= */

function AdaptiveHeroArtwork({
  slide,
}: {
  slide: StorefrontHeroSlide;
}) {
  const imagePosition =
    slide.imagePosition === "left"
      ? "left"
      : slide.imagePosition === "center"
        ? "center"
        : "right";

  const desktopPosition =
    imagePosition === "left"
      ? "left center"
      : imagePosition === "center"
        ? "center center"
        : "right center";

  const mobilePosition =
    imagePosition === "left"
      ? "32% center"
      : imagePosition === "center"
        ? "center center"
        : "68% center";

  const imageStyle: HeroCSSProperties = {
    "--baura-hero-image": getHeroImageUrl(
      slide.imageUrl,
    ),
    "--baura-hero-image-position":
      desktopPosition,
    "--baura-hero-mobile-position":
      mobilePosition,
  };

  return (
    <div
      className={[
        "baura-hero__artwork",
        `baura-hero__artwork--${imagePosition}`,
      ].join(" ")}
      style={imageStyle}
    >
      <div
        className="baura-hero__photo-blur"
        aria-hidden="true"
      />

      <div
        className="baura-hero__photo"
        role="img"
        aria-label={
          slide.imageAlt || slide.name
        }
      />
    </div>
  );
}

function renderHeroTitle(title: string) {
  const lines = title
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines.map((line, index) => (
      <span
        key={`${line}-${index}`}
        className="baura-hero__title-line"
      >
        {line}
      </span>
    ));
  }

  return title;
}

/* =======================================================
   REUSABLE SECTION HEADING
======================================================= */

function HomeSectionHeading({
  eyebrow,
  title,
  description,
  linkLabel = "Explore the menu",
  linkTo = "/menu",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  linkLabel?: string;
  linkTo?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.23em] text-brand-ink/45">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-brand-ink sm:text-4xl">
          {title}
        </h2>

        {description && (
          <p className="mt-2 max-w-xl text-sm leading-6 text-brand-ink/60">
            {description}
          </p>
        )}
      </div>

      <Link
        to={linkTo}
        className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-brand-ink/15 bg-white/65 px-4 py-2.5 text-xs font-semibold text-brand-ink transition hover:border-brand-ink/25 hover:bg-white sm:self-auto"
      >
        {linkLabel}

        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </div>
  );
}

/* =======================================================
   PRODUCT GRID
======================================================= */

function ProductGrid({
  products,
  loading,
}: {
  products: MenuItem[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/50"
          >
            <div className="aspect-[4/3] animate-pulse bg-brand-ink/[0.06]" />

            <div className="space-y-3 p-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-brand-ink/10" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-brand-ink/10" />
              <div className="h-3 w-full animate-pulse rounded bg-brand-ink/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((item) => (
        <ProductCard
          key={item.id}
          item={item}
        />
      ))}
    </div>
  );
}

/* =======================================================
   FRESH FROM BAURA
======================================================= */

function FreshFromBaura({
  products,
  loading,
}: {
  products: MenuItem[];
  loading: boolean;
}) {
  return (
    <section
      id="discover-baura"
      className="mx-auto w-full max-w-[1540px] px-5 py-12 sm:px-8 sm:py-14 lg:px-12 lg:py-16"
    >
      <div className="mb-7 grid gap-4 border-b border-brand-ink/10 pb-7 lg:grid-cols-[1fr_390px] lg:items-end lg:gap-12">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-ink/45">
            FRESH FROM BAURA
          </p>

          <h2 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-brand-ink sm:text-4xl lg:text-[2.7rem]">
            Made to look good.
            <br />
            Made to taste even better.
          </h2>
        </div>

        <p className="max-w-md text-sm leading-6 text-brand-ink/65">
          From an afternoon craving to the cake at
          the centre of a celebration, we make the
          sweet part worth looking forward to.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-brand-ink sm:text-2xl">
            A taste of Baura
          </h3>

          <p className="mt-1 text-xs leading-5 text-brand-ink/55 sm:text-sm">
            A few favourites from our menu.
          </p>
        </div>

        <Link
          to="/menu"
          className="group inline-flex items-center gap-2 text-xs font-semibold text-brand-ink sm:text-sm"
        >
          See what’s baking

          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <ProductGrid
        products={products}
        loading={loading}
      />

      {!loading && products.length === 0 && (
        <p className="rounded-2xl border border-brand-ink/10 bg-white/50 px-5 py-6 text-sm text-brand-ink/60">
          Our menu items will appear here when
          they become available.
        </p>
      )}
    </section>
  );
}

/* =======================================================
   OFFERS — BEFORE FEATURED MENU
======================================================= */

function OffersSection({
  products,
  loading,
}: {
  products: MenuItem[];
  loading: boolean;
}) {
  return (
    <section className="border-y border-brand-ink/10 bg-[#f1e9d5]">
      <div className="mx-auto w-full max-w-[1540px] px-5 py-12 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <HomeSectionHeading
          eyebrow="A LITTLE EXTRA FROM BAURA"
          title="Offers worth exploring."
          description="Explore our currently listed offers and special menu selections."
          linkLabel="Browse all offers"
        />

        {loading || products.length > 0 ? (
          <ProductGrid
            products={products}
            loading={loading}
          />
        ) : (
          <div className="rounded-[1.4rem] border border-brand-ink/10 bg-white/50 px-5 py-7 sm:px-7">
            <p className="text-sm font-semibold text-brand-ink">
              Nothing on offer right now.
            </p>

            <p className="mt-1 text-sm leading-6 text-brand-ink/60">
              Check back for new offers, or explore
              our complete menu in the meantime.
            </p>

            <Link
              to="/menu"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-ink"
            >
              View the menu

              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/* =======================================================
   FEATURED MENU
======================================================= */

function FeaturedMenu({
  products,
  loading,
}: {
  products: MenuItem[];
  loading: boolean;
}) {
  return (
    <section className="mx-auto w-full max-w-[1540px] px-5 py-12 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <HomeSectionHeading
        eyebrow="THE BAURA EDIT"
        title="Featured menu."
        description="More cakes, desserts and bakery favourites to discover."
        linkLabel="Explore the full menu"
      />

      {loading || products.length > 0 ? (
        <ProductGrid
          products={products}
          loading={loading}
        />
      ) : (
        <div className="rounded-[1.4rem] border border-brand-ink/10 bg-white/50 px-5 py-7">
          <p className="text-sm text-brand-ink/60">
            More featured items will appear here
            as our menu grows.
          </p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="mt-7 flex justify-center">
          <Link
            to="/menu"
            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-xs font-semibold text-brand-bg transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(55,38,25,0.16)]"
          >
            View complete menu

            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      )}
    </section>
  );
}

/* =======================================================
   FRESHNESS — COMPACT DESIGN
======================================================= */

function FreshComposition({
  reduceMotion,
}: {
  reduceMotion: boolean;
}) {
  return (
    <section className="border-y border-brand-ink/10 bg-white/35">
      <div className="mx-auto grid w-full max-w-[1540px] gap-7 px-5 py-12 sm:px-8 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14 lg:px-12 lg:py-16">
        <motion.div
          className="relative"
          initial={
            reduceMotion
              ? false
              : { opacity: 0, y: 18 }
          }
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.15,
          }}
          transition={{
            duration: reduceMotion ? 0 : 0.6,
            ease,
          }}
        >
          <div className="overflow-hidden rounded-[1.4rem] bg-[#e9dfca]">
            <img
              src={imageTwo}
              alt="Freshly prepared Baura Bakers treats"
              className="h-64 w-full object-cover sm:h-[340px] lg:h-[390px]"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="absolute -bottom-4 right-5 hidden w-32 overflow-hidden rounded-2xl border-[5px] border-[#f9f4e0] bg-[#e9dfca] shadow-[0_16px_38px_rgba(55,38,25,0.12)] lg:block">
            <img
              src={imageThree}
              alt="Baura Bakers cake"
              className="h-40 w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </motion.div>

        <motion.div
          className="max-w-xl"
          initial={
            reduceMotion
              ? false
              : { opacity: 0, y: 18 }
          }
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: reduceMotion ? 0 : 0.6,
            ease,
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-ink/45">
            FRESHNESS FIRST
          </p>

          <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-brand-ink sm:text-4xl">
            That first bite should
            <br className="hidden sm:block" />
            {" "}be worth it.
          </h2>

          <p className="mt-4 max-w-lg text-sm leading-7 text-brand-ink/65">
            Soft cake, smooth cream, rich chocolate
            and freshly finished favourites. We want
            every Baura order to feel like something
            you were actually excited to open.
          </p>

          <Link
            to="/about-us"
            className="group mt-5 inline-flex items-center gap-2 rounded-full border border-brand-ink/15 bg-white/70 px-4 py-2.5 text-xs font-semibold text-brand-ink transition hover:border-brand-ink/25 hover:bg-white"
          >
            Our story

            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* =======================================================
   CELEBRATION — COMPACT DESIGN
======================================================= */

function Celebration({
  reduceMotion,
}: {
  reduceMotion: boolean;
}) {
  return (
    <section className="relative isolate min-h-[360px] overflow-hidden bg-[#24150e] sm:min-h-[390px]">
      <img
        src={imageFour}
        alt="Celebration cake from Baura Bakers"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />

      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#190d08]/90 via-[#190d08]/65 to-[#190d08]/20" />

      <motion.div
        className="mx-auto flex min-h-[360px] w-full max-w-[1540px] flex-col items-start justify-center px-5 py-12 text-[#f9f4e0] sm:min-h-[390px] sm:px-8 lg:px-12"
        initial={
          reduceMotion
            ? false
            : { opacity: 0, y: 18 }
        }
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          amount: 0.2,
        }}
        transition={{
          duration: reduceMotion ? 0 : 0.6,
          ease,
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f9f4e0]/65">
          SOMETHING TO CELEBRATE?
        </p>

        <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[#f9f4e0] sm:text-4xl lg:text-[2.7rem]">
          Bring the cake.
          <br />
          Make the memory.
        </h2>

        <p className="mt-3 max-w-md text-sm leading-6 text-[#f9f4e0]/75">
          Birthdays, surprises, gifts or simply
          a good day made better.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            to="/menu"
            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f9f4e0] px-5 py-3 text-xs font-semibold text-[#372619] transition hover:-translate-y-0.5 hover:bg-white"
          >
            Find your cake

            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>

          <Link
            to="/contact"
            className="group inline-flex items-center gap-1 text-xs font-semibold text-[#f9f4e0]"
          >
            Talk to Baura

            <ChevronRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* =======================================================
   FINAL CTA — COMPACT DESIGN
======================================================= */

function FinalOrder() {
  return (
    <section className="mx-auto flex w-full max-w-[1540px] flex-col gap-6 px-5 py-12 sm:px-8 sm:py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-12 lg:py-16">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-ink/45">
          READY FOR SOMETHING DELICIOUS?
        </p>

        <h2 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-brand-ink sm:text-4xl">
          Your next favourite might
          <br className="hidden sm:block" />
          {" "}be one bite away.
        </h2>
      </div>

      <Link
        to="/menu"
        className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-brand-ink px-6 py-3 text-sm font-semibold text-brand-bg transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(55,38,25,0.16)] lg:self-auto"
      >
        <ShoppingBag size={17} />

        Explore the menu

        <ArrowRight
          size={17}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </section>
  );
}