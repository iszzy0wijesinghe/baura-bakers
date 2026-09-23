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
import imageFour from "../../images/home/hero-image6.1.webp";

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

function getHeroOverlay(
  overlayStrength: number,
) {
  const value = Number.isFinite(
    overlayStrength,
  )
    ? overlayStrength
    : 0;

  return (
    Math.min(
      100,
      Math.max(0, value),
    ) / 100
  );
}

export default function Home() {
  const reduceMotion = Boolean(
    useReducedMotion(),
  );

  const [items, setItems] = useState<
    MenuItem[]
  >([]);

  const [heroSlides, setHeroSlides] =
    useState<StorefrontHeroSlide[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [storefront, products] =
          await Promise.all([
            getStorefrontBootstrap(),
            getActiveItems(),
          ]);

        if (!active) {
          return;
        }

        setHeroSlides(
          storefront.heroSlides ?? [],
        );

        setItems(products);
      } catch (error) {
        console.error(
          "Failed to load Baura storefront:",
          error,
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const featured = useMemo(() => {
    const clicks = getProductClicks();

    const hasClickData = Object.values(
      clicks,
    ).some((value) => value > 0);

    if (!hasClickData) {
      return items.slice(0, 4);
    }

    return [...items]
      .sort(
        (a, b) =>
          (clicks[b.slug] ?? 0) -
          (clicks[a.slug] ?? 0),
      )
      .slice(0, 4);
  }, [items]);

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

        <OpeningStatement />

        <FreshComposition
          reduceMotion={reduceMotion}
        />

        {!loading &&
        featured.length > 0 ? (
          <FeaturedProducts
            products={featured}
            reduceMotion={reduceMotion}
          />
        ) : null}

        <Celebration
          reduceMotion={reduceMotion}
        />

        <FinalOrder />
      </main>
    </Page>
  );
}

/* =======================================================
   HERO
======================================================= */

function Hero({
  slides,
  reduceMotion,
}: {
  slides: StorefrontHeroSlide[];
  reduceMotion: boolean;
}) {
  const navigate = useNavigate();

  const [
    activeSlide,
    setActiveSlide,
  ] = useState(0);

  useEffect(() => {
    setActiveSlide((current) =>
      Math.min(
        current,
        Math.max(
          0,
          slides.length - 1,
        ),
      ),
    );
  }, [slides.length]);

  useEffect(() => {
    if (
      reduceMotion ||
      slides.length <= 1
    ) {
      return;
    }

    const interval =
      window.setInterval(() => {
        setActiveSlide(
          (current) =>
            (current + 1) %
            slides.length,
        );
      }, HERO_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    reduceMotion,
    slides.length,
  ]);

  const slide =
    slides[activeSlide] ??
    slides[0];

  if (!slide) {
    return null;
  }

  const overlay = getHeroOverlay(
    slide.overlayStrength,
  );

  const heroStyle:
    HeroCSSProperties = {
    "--baura-hero-overlay":
      overlay.toFixed(3),
  };

  function openAction(
    url: string | null,
  ) {
    if (!url) {
      return;
    }

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
              duration: reduceMotion
                ? 0
                : 0.9,
              ease,
            }}
          >
            <AdaptiveHeroArtwork
              slide={slide}
            />
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
              duration: reduceMotion
                ? 0
                : 0.5,
              ease,
            }}
          >
            {slide.eyebrow ? (
              <span className="baura-hero__eyebrow">
                {slide.eyebrow}
              </span>
            ) : null}

            <h1>
              {renderHeroTitle(
                slide.title,
              )}
            </h1>

            {slide.description ? (
              <p>
                {slide.description}
              </p>
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
                    {
                      slide.primaryButtonLabel
                    }

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
                    {
                      slide.secondaryButtonLabel
                    }

                    <ChevronRight
                      size={16}
                    />
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
                {slides.map(
                  (
                    item,
                    index,
                  ) => (
                    <button
                      key={item.id}
                      type="button"
                      className={
                        activeSlide ===
                        index
                          ? "is-active"
                          : ""
                      }
                      onClick={() =>
                        setActiveSlide(
                          index,
                        )
                      }
                      aria-label={`Show hero slide ${
                        index + 1
                      }`}
                      aria-current={
                        activeSlide ===
                        index
                          ? "true"
                          : undefined
                      }
                    >
                      <span />
                    </button>
                  ),
                )}
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
   HERO ARTWORK
======================================================= */

function AdaptiveHeroArtwork({
  slide,
}: {
  slide: StorefrontHeroSlide;
}) {
  const imagePosition =
    slide.imagePosition === "left"
      ? "left"
      : slide.imagePosition ===
          "center"
        ? "center"
        : "right";

  const desktopPosition =
    imagePosition === "left"
      ? "left center"
      : imagePosition === "center"
        ? "center center"
        : "right center";

  /*
   * The same 16:9 image is used on mobile.
   *
   * For left/right artwork we bias the crop toward the
   * selected side so the subject survives the narrower
   * mobile viewport.
   */
  const mobilePosition =
    imagePosition === "left"
      ? "32% center"
      : imagePosition === "center"
        ? "center center"
        : "68% center";

  const imageStyle:
    HeroCSSProperties = {
    "--baura-hero-image":
      getHeroImageUrl(
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
          slide.imageAlt ||
          slide.name
        }
      />
    </div>
  );
}

function renderHeroTitle(
  title: string,
) {
  const lines = title
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines.map(
      (line, index) => (
        <span
          key={`${line}-${index}`}
          className="baura-hero__title-line"
        >
          {line}
        </span>
      ),
    );
  }

  return title;
}

/* =======================================================
   OPENING
======================================================= */

function OpeningStatement() {
  return (
    <section
      className="baura-opening"
      id="discover-baura"
    >
      <div className="baura-opening__small">
        <span>
          FRESH FROM BAURA
        </span>
      </div>

      <div className="baura-opening__statement">
        <h2>
          Made to look good.
          <br />
          Made to taste even
          better.
        </h2>

        <div className="baura-opening__side">
          <p>
            From an afternoon
            craving to the cake
            at the centre of a
            celebration, we make
            the sweet part worth
            looking forward to.
          </p>

          <Link
            to="/menu"
            className="baura-text-link"
          >
            See what’s baking

            <ArrowRight
              size={16}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =======================================================
   FRESH COMPOSITION
======================================================= */

function FreshComposition({
  reduceMotion,
}: {
  reduceMotion: boolean;
}) {
  return (
    <section className="baura-fresh">
      <motion.div
        className="baura-fresh__primary"
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 24,
              }
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
          duration: 0.7,
          ease,
        }}
      >
        <img
          src={imageTwo}
          alt="Freshly prepared Baura Bakers treats"
          loading="lazy"
          decoding="async"
        />
      </motion.div>

      <motion.div
        className="baura-fresh__copy"
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 20,
              }
        }
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          amount: 0.25,
        }}
        transition={{
          duration: 0.65,
          ease,
        }}
      >
        <span className="baura-mini-label">
          FRESHNESS FIRST
        </span>

        <h2>
          That first bite
          <br />
          should be worth it.
        </h2>

        <p>
          Soft cake, smooth
          cream, rich chocolate
          and freshly finished
          favourites. We want
          every Baura order to
          feel like something you
          were actually excited
          to open.
        </p>

        <Link
          to="/about-us"
          className="baura-text-link"
        >
          Our story

          <ArrowRight
            size={16}
          />
        </Link>
      </motion.div>

      <motion.div
        className="baura-fresh__secondary"
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 32,
              }
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
          duration: 0.75,
          delay: 0.08,
          ease,
        }}
      >
        <img
          src={imageThree}
          alt="Baura Bakers cake"
          loading="lazy"
          decoding="async"
        />
      </motion.div>
    </section>
  );
}

/* =======================================================
   FEATURED PRODUCTS
======================================================= */

function FeaturedProducts({
  products,
  reduceMotion,
}: {
  products: MenuItem[];
  reduceMotion: boolean;
}) {
  const first = products[0];

  const rest = products.slice(
    1,
    4,
  );

  if (!first) {
    return null;
  }

  return (
    <section className="baura-products">
      <div className="baura-products__heading">
        <div>
          <span className="baura-mini-label">
            CURRENT FAVOURITES
          </span>

          <h2>
            Start with
            <br />
            something good.
          </h2>
        </div>

        <Link
          to="/menu"
          className="baura-text-link"
        >
          View everything

          <ArrowRight
            size={16}
          />
        </Link>
      </div>

      <div className="baura-products__composition">
        <FeaturedProduct
          product={first}
          large
          reduceMotion={
            reduceMotion
          }
        />

        {rest.length > 0 ? (
          <div className="baura-products__side">
            {rest.map(
              (
                product,
                index,
              ) => (
                <FeaturedProduct
                  key={
                    product.slug
                  }
                  product={
                    product
                  }
                  reduceMotion={
                    reduceMotion
                  }
                  delay={
                    (index + 1) *
                    0.06
                  }
                />
              ),
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FeaturedProduct({
  product,
  large = false,
  reduceMotion,
  delay = 0,
}: {
  product: MenuItem;
  large?: boolean;
  reduceMotion: boolean;
  delay?: number;
}) {
  const image =
    product.thumbnailUrl ||
    product.images?.[0]
      ?.imageUrl ||
    "";

  const firstSize =
    product.sizes?.[0];

  return (
    <motion.article
      className={
        large
          ? "baura-featured-product baura-featured-product--large"
          : "baura-featured-product"
      }
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 20,
            }
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
        duration: 0.6,
        delay,
        ease,
      }}
    >
      <Link
        to={`/menu/${product.slug}`}
        className="baura-featured-product__image"
        aria-label={`View ${product.name}`}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="baura-featured-product__fallback">
            <span>
              BAURA
            </span>
          </div>
        )}

        <span className="baura-featured-product__go">
          <ArrowRight
            size={18}
          />
        </span>
      </Link>

      <div className="baura-featured-product__info">
        <div>
          <h3>
            {product.name}
          </h3>

          <p>
            {product.shortDesc ||
              product.slogan ||
              "Freshly prepared by Baura Bakers."}
          </p>
        </div>

        {firstSize ? (
          <strong>
            LKR{" "}
            {firstSize.priceLkr.toLocaleString()}
          </strong>
        ) : null}
      </div>
    </motion.article>
  );
}

/* =======================================================
   CELEBRATION
======================================================= */

function Celebration({
  reduceMotion,
}: {
  reduceMotion: boolean;
}) {
  return (
    <section className="baura-celebration">
      <div className="baura-celebration__image">
        <motion.img
          src={imageFour}
          alt="Celebration cake from Baura Bakers"
          loading="lazy"
          decoding="async"
          initial={
            reduceMotion
              ? false
              : {
                  opacity:
                    0.96,
                }
          }
          whileInView={{
            opacity: 1,
          }}
          viewport={{
            once: true,
            amount: 0.1,
          }}
          transition={{
            duration: 1,
            ease,
          }}
        />
      </div>

      <div className="baura-celebration__shade" />

      <motion.div
        className="baura-celebration__copy"
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 24,
              }
        }
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          amount: 0.25,
        }}
        transition={{
          duration: 0.7,
          ease,
        }}
      >
        <span>
          SOMETHING TO
          CELEBRATE?
        </span>

        <h2>
          Bring the cake.
          <br />
          Make the memory.
        </h2>

        <p>
          Birthdays, surprises,
          gifts or simply a good
          day made better.
        </p>

        <div className="baura-celebration__actions">
          <Link
            to="/menu"
            className="baura-button baura-button--light"
          >
            Find your cake

            <ArrowRight
              size={17}
            />
          </Link>

          <Link
            to="/contact"
            className="baura-celebration__link"
          >
            Talk to Baura

            <ChevronRight
              size={16}
            />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* =======================================================
   FINAL
======================================================= */

function FinalOrder() {
  return (
    <section className="baura-final">
      <div className="baura-final__copy">
        <span>
          READY FOR SOMETHING
          DELICIOUS?
        </span>

        <h2>
          Your next favourite
          <br />
          might be one bite away.
        </h2>
      </div>

      <Link
        to="/menu"
        className="baura-button baura-button--dark"
      >
        <ShoppingBag
          size={17}
        />

        Explore the menu

        <ArrowRight
          size={17}
        />
      </Link>
    </section>
  );
}