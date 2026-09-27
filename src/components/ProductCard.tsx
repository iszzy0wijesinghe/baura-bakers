import { Link } from "react-router-dom";
import type { MenuItem } from "../lib/items";

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

export default function ProductCard({ item }: { item: MenuItem }) {
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