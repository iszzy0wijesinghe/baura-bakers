import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import ButtonLink from "../components/ButtonLink";
import Section from "../components/Section";
import FadeSentences from "../components/FadeSentences";
import { ChefHat, CakeSlice, Truck } from "lucide-react";
import ProcessSteps from "../components/ProcessSteps";
import { products } from "../content/products";
import { getProductClicks } from "../lib/productClicks";
import { Link } from "react-router-dom";

import heroJarcakes from "../../images/home/hero-jarcakes.webp.webp";
import heroJarcakes2 from "../../images/home/hero-image2.webp";
import heroJarcakes4 from "../../images/home/hero-image5.webp";
import heroJarcakes5 from "../../images/home/hero-image6.1.webp";


const trustPoints = [
  {
    icon: ChefHat,
    title: "Freshly baked daily",
    desc: "Small batches. Always fresh.",
  },
  {
    icon: CakeSlice,
    title: "Custom orders",
    desc: "Perfect for birthdays & events.",
  },
  {
    icon: Truck,
    title: "Pickup & delivery",
    desc: "Fast confirmation. Clear timing.",
  },
];

const heroSentences = [
  "Calm mornings. Fresh bakes. A premium taste you can trust.",
  "Golden layers, soft crumb, and real butter, baked fresh daily.",
  "Made with care, delivered with warmth, always consistent quality.",
  "Signature cakes crafted for celebrations (and quiet cravings).",
  "Fresh from the oven the kind of taste that feels expensive.",
  "Trusted by families for birthdays, events, and everyday treats.",
  "Clean ingredients, balanced sweetness, and a smooth finish.",
  "Order easily, we confirm fast, bake fresh, and deliver on time.",
];

export default function Home() {
  const reduce = useReducedMotion();

  const heroBgImages = useMemo(
    () => [heroJarcakes, heroJarcakes2, heroJarcakes4, heroJarcakes5],
    [],
  );

  const [sentenceIndex, setSentenceIndex] = useState(0);

  // ✅ Change image after every 3 sentence changes
  const bgIndex = reduce
    ? 0
    : Math.floor(sentenceIndex / 2) % heroBgImages.length;

  const bgSrc = heroBgImages[bgIndex];

  const bestSellerProducts = useMemo(() => {
    const clicks = getProductClicks();

    const sorted = [...products].sort((a, b) => {
      const ca = clicks[a.slug] ?? 0;
      const cb = clicks[b.slug] ?? 0;
      return cb - ca;
    });

    // If no one clicked anything yet, show first 4 menu items
    const hasAnyClicks = Object.values(clicks).some((n) => n > 0);
    return (hasAnyClicks ? sorted : products).slice(0, 4);
  }, []);

  return (
    <div className="space-y-14">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-black/10 p-6 shadow-sm sm:p-10">
        {/* Background slideshow */}
        <div className="absolute inset-0" aria-hidden="true">
          {reduce ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${heroBgImages[0]})`,
                backgroundSize: "cover",
                backgroundPosition: "right center",
                backgroundRepeat: "no-repeat",
              }}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={bgSrc}
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${bgSrc})`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </AnimatePresence>
          )}

          {/* 1) Global soft tint (keeps image visible) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(249,244,224,0.55) 0%, rgba(249,244,224,0.22) 55%, rgba(249,244,224,0.08) 100%)",
            }}
          />

          {/* 2) Strong left readability panel (ONLY left side) */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: "62%",
              background:
                "linear-gradient(90deg, rgba(249,244,224,0.98) 0%, rgba(249,244,224,0.92) 38%, rgba(249,244,224,0.66) 68%, rgba(249,244,224,0.00) 100%)",
            }}
          />

          {/* 3) Subtle vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(1000px 420px at 22% 42%, rgba(249,244,224,0.55) 0%, rgba(249,244,224,0.00) 70%)",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative max-w-3xl space-y-5">
          <p className="text-xs font-semibold tracking-widest text-brand-ink/70">
            BAURA BAKERS
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl text-brand-ink [text-shadow:0_2px_16px_rgba(249,244,224,0.85)]">
            <FadeSentences
              sentences={heroSentences}
              intervalMs={3500}
              onIndexChange={setSentenceIndex}
            />
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-brand-ink/90 [text-shadow:0_1px_12px_rgba(249,244,224,0.75)]">
            Baked with care and delivered with warmth
            <br className="hidden sm:block" />
            cakes, pastries, and breads made to feel special, every time.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink to="/order" variant="primary">
              Order now
            </ButtonLink>
            <ButtonLink to="/menu" variant="soft">
              View menu
            </ButtonLink>
          </div>

          <div className="pt-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {trustPoints.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="flex items-stretch gap-3 rounded-2xl border border-black/10 bg-brand-bg/90 p-4 shadow-sm backdrop-blur"
                  >
                    <div className="flex w-10 items-center justify-center text-brand-ink/85">
                      <Icon className="h-full w-6" aria-hidden="true" />
                    </div>

                    <div className="py-0.5">
                      <p className="text-sm font-semibold text-brand-ink">
                        {p.title}
                      </p>
                      <p className="mt-1 text-[11px] leading-snug text-brand-ink/85">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <Section
        eyebrow="OUR FAVORITES"
        title="Best sellers that people come back for"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bestSellerProducts.map((p) => {
            const thumb = (p.thumbnail ?? p.images[0])?.src;

            return (
              <Link
                key={p.slug}
                to={`/menu/${p.slug}`}
                className="group overflow-hidden rounded-2xl border border-black/10 bg-white/50 shadow-sm transition hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
              >
                <div className="aspect-[4/3] overflow-hidden bg-black/5">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>

                <div className="p-5">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="mt-2 text-sm text-brand-ink/75">
                    {p.shortDesc}
                  </p>
                  <p className="mt-4 text-xs font-semibold tracking-wide text-brand-ink/70">
                    {p.sizes?.[0]
                      ? `From LKR ${p.sizes[0].priceLkr.toLocaleString()}`
                      : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="pt-2">
          <ButtonLink to="/order" variant="primary">
            Place an order
          </ButtonLink>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section eyebrow="SIMPLE PROCESS" title="How ordering works">
        <ProcessSteps />
      </Section>

      {/* FINAL CTA */}
      <section className="rounded-3xl bg-brand-ink px-6 py-10 text-brand-bg sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to order something that feels premium?
            </h2>
            <p className="mt-2 text-sm text-brand-bg/80">
              Tell us what you need — we’ll confirm fast and make it fresh.
            </p>
          </div>

          <div className="flex gap-3">
            <ButtonLink
              to="/order"
              unstyled
              className="bg-brand-bg text-brand-ink hover:bg-brand-bg/90"
            >
              Order now
            </ButtonLink>

            <ButtonLink
              to="/contact"
              unstyled
              className="border border-brand-bg/25 bg-transparent text-brand-bg hover:bg-white/10"
            >
              Contact
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
