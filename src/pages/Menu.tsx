import { Link } from "react-router-dom";
import Section from "../components/Section";
import { products } from "../content/products";

export default function Menu() {
  const grouped = products.reduce<Record<string, typeof products>>((acc, p) => {
    (acc[p.category] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Menu
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-ink/75">
          Calm, fresh, premium bakes — choose your favorites and open a product
          for full details.
        </p>
      </header>

      {Object.entries(grouped).map(([cat, list]) => (
        <Section key={cat} eyebrow={cat.toUpperCase()} title={`Our ${cat}`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <Link
                key={p.slug}
                to={`/menu/${p.slug}`}
                className="group overflow-hidden rounded-2xl border border-brand-ink/15 bg-white/40 shadow-sm transition hover:bg-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden bg-black/5">
                  <img
                    src={(p.thumbnail ?? p.images[0])?.src}
                    alt={(p.thumbnail ?? p.images[0])?.alt ?? p.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="mt-1 text-xs text-brand-ink/70">
                        {p.slogan}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-brand-ink/60">
                      {p.sizes[0]
                        ? `From LKR ${p.sizes[0].priceLkr.toLocaleString()}`
                        : ""}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-brand-ink/75">
                    {p.shortDesc}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(p.tags || []).slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-brand-ink/15 bg-brand-bg/60 px-2 py-1 text-[11px] text-brand-ink/70"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <p className="mt-5 text-xs font-semibold text-brand-ink/70 group-hover:text-brand-ink">
                    View details →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}
