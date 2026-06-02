import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Page from "../components/Page";
import Section from "../components/Section";
import { getActiveItems, type MenuItem } from "../lib/items";

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadItems() {
      try {
        setIsLoading(true);
        setErrorText("");

        const result = await getActiveItems();
        setItems(result);
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

  const grouped = useMemo(() => {
    return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
      const category = item.category || "Other";
      (acc[category] ||= []).push(item);
      return acc;
    }, {});
  }, [items]);

  return (
    <Page>
      <div className="space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
            Menu
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-brand-ink/75">
            Calm, fresh, premium bakes — choose your favorites and open a
            product for full details.
          </p>
        </header>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-sm text-brand-ink/70 shadow-sm backdrop-blur">
            Loading menu...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-center shadow-sm backdrop-blur">
            <h2 className="text-xl font-semibold text-brand-ink">
              No active products
            </h2>
            <p className="mt-2 text-sm text-brand-ink/65">
              Products added by admin will appear here.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, list]) => (
            <Section key={cat} eyebrow={cat.toUpperCase()} title={`Our ${cat}`}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((item) => {
                  const image =
                    item.thumbnailUrl || item.images[0]?.imageUrl || "";

                  const alt =
                    item.images[0]?.alt || `${item.name} product image`;

                  const firstSize = item.sizes[0];

                  return (
                    <Link
                      key={item.id}
                      to={`/menu/${item.slug}`}
                      className="group overflow-hidden rounded-2xl border border-brand-ink/15 bg-white/40 shadow-sm transition hover:bg-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-black/5">
                        {image ? (
                          <img
                            src={image}
                            alt={alt}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-sm text-brand-ink/55">
                            Product image
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-brand-ink">
                              {item.name}
                            </p>
                            <p className="mt-1 text-xs text-brand-ink/70">
                              {item.slogan}
                            </p>
                          </div>

                          <span className="shrink-0 text-[11px] font-semibold text-brand-ink/60">
                            {firstSize
                              ? `From ${formatLkr(firstSize.priceLkr)}`
                              : ""}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-brand-ink/75">
                          {item.shortDesc}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-brand-ink/15 bg-brand-bg/60 px-2 py-1 text-[11px] text-brand-ink/70"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <p className="mt-5 text-xs font-semibold text-brand-ink/70 group-hover:text-brand-ink">
                          View details →
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Section>
          ))
        )}
      </div>
    </Page>
  );
}