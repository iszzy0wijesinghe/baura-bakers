import ButtonLink from "../components/ButtonLink";
import Section from "../components/Section";
import DeliveryBadges from "../components/DeliveryBadges";
import { Heart, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import Page from "../components/Page";

const values = [
  {
    icon: Sparkles,
    title: "Premium taste, calm finish",
    desc: "Balanced sweetness, smooth textures, and clean flavors that feel comforting — not heavy.",
  },
  {
    icon: Heart,
    title: "Made with care",
    desc: "Small-batch mindset, consistent quality, and a warm experience from order to delivery.",
  },
  {
    icon: Leaf,
    title: "Fresh ingredients",
    desc: "We keep it simple and fresh — focusing on what makes each bite feel special.",
  },
  {
    icon: ShieldCheck,
    title: "Trust you can rely on",
    desc: "Clear confirmations, careful packing, and reliable handover through delivery partners.",
  },
];

export default function About() {
  return (
    <Page>
    <div className="space-y-12">
      {/* HERO */}
      <section className="rounded-3xl border border-black/10 bg-white/50 p-6 shadow-sm backdrop-blur sm:p-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
            ABOUT BAURA BAKERS
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Calm, premium bakes - made for real moments.
          </h1>

          <p className="text-sm leading-relaxed text-brand-ink/80 sm:text-base">
            Baura Bakers began with a small home oven - chasing that warm{" "}
            <span className="font-semibold">oven’s aura</span> until every bake
            felt perfect. What started as a quiet passion became our craft:
            desserts made with love, trust, and a premium, delicious finish -
            built to lift your mood and leave you feeling refreshed.
            <br className="hidden sm:block" />
            <br className="hidden sm:block" />
            Established in <span className="font-semibold">2025</span>, we’re
            here to change the “less for more money” culture in Sri Lanka’s
            bakery space. We respect every customer, and we believe everyone
            deserves truly high-quality food - carefully made, beautifully
            presented, and priced fairly.
          </p>

          <div className="pt-2">
            <DeliveryBadges />
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <ButtonLink to="/menu" variant="primary">
              View menu
            </ButtonLink>
            <ButtonLink to="/order" variant="soft">
              Order now
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <Section eyebrow="OUR PROMISE" title="What we stand for">
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="rounded-3xl border border-black/10 bg-white/50 p-6 shadow-sm backdrop-blur"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-brand-bg/70 text-brand-ink/80">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{v.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-brand-ink/75">
                      {v.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* STORY */}
      <Section eyebrow="BAURA STANDARD" title="Why us?">
        <div className="grid gap-4 lg:grid-cols-[.95fr_1.05fr]">
          {/* Right-side “promise” card */}
          <div className="order-2 rounded-3xl border border-black/10 bg-white/55 p-6 shadow-sm backdrop-blur lg:order-1">
            <p className="text-sm leading-relaxed text-brand-ink/80 sm:text-base">
              We’re not trying to be the loudest bakery - we’re trying to be the
              most <span className="font-semibold">reliable</span>. From the
              first mix to the final seal, our goal is simple: desserts that
              feel premium, taste comforting, and stay balanced (not overly
              sweet).
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-brand-bg/70 p-4">
                <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                  THE PERFECTION LOOP
                </p>
                <p className="mt-2 text-sm text-brand-ink/80">
                  Test → adjust → repeat until the texture and finish feel
                  “right”.
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-brand-bg/70 p-4">
                <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                  CUSTOMER-FIRST
                </p>
                <p className="mt-2 text-sm text-brand-ink/80">
                  Respect, quick replies, and honest portions - every time.
                </p>
              </div>
            </div>
          </div>

          {/* Left-side “origin + mission” card */}
          <div className="order-1 rounded-3xl border border-black/10 bg-brand-bg/75 p-6 shadow-sm lg:order-2">
            <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
              FROM A HOME OVEN • EST. 2025
            </p>

            <p className="mt-3 text-sm leading-relaxed text-brand-ink/85 sm:text-base">
              Baura Bakers began with a small home oven and a big obsession: the
              calm “oven aura” moment when a bake comes out perfect. We kept
              refining until our flavors felt clean, our layers looked
              beautiful, and the bite felt worth it.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-brand-ink/85 sm:text-base">
              We want to raise the standard in Sri Lanka - moving away from
              "less quality for more money". If you trust us with your
              celebration (or your quiet craving), we'll treat it like it
              matters - because it does.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink to="/menu" variant="soft">
                View menu
              </ButtonLink>
              <ButtonLink to="/order" variant="primary">
                Place an order
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="rounded-3xl bg-brand-ink px-6 py-10 text-brand-bg sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Want something premium — without the fuss?
            </h2>
            <p className="mt-2 text-sm text-brand-bg/80">
              Open the menu, choose your favorite jar cake, and order in a calm,
              simple way.
            </p>
          </div>

          <div className="flex gap-3">
            <ButtonLink
              to="/menu"
              unstyled
              className="bg-brand-bg text-brand-ink hover:bg-brand-bg/90"
            >
              View menu
            </ButtonLink>
            <ButtonLink
              to="/order"
              unstyled
              className="border border-brand-bg/25 bg-transparent text-brand-bg hover:bg-white/10"
            >
              Order now
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
    </Page>
  );
}
