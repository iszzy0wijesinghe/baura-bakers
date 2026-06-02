import { Link } from "react-router-dom";
import { useCart } from "../app/cart";
import Page from "../components/Page";

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

export default function Cart() {
  const { items, updateQty, removeItem, clear, subtotal } = useCart();

  return (
    <Page>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-brand-ink/55">
              YOUR CART
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              Review your order
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/70">
              Check your selected items before continuing to checkout.
            </p>
          </div>

          <Link
            to="/menu"
            className="rounded-2xl border border-brand-ink/20 bg-white/55 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/75"
          >
            Continue shopping
          </Link>
        </header>

        {items.length === 0 ? (
          <section className="rounded-3xl border border-black/10 bg-white/55 p-8 text-center shadow-sm backdrop-blur">
            <h2 className="text-2xl font-semibold text-brand-ink">
              Your cart is empty
            </h2>
            <p className="mt-2 text-sm text-brand-ink/65">
              Add your favorite Baura Bakers items from the menu.
            </p>

            <Link
              to="/menu"
              className="mt-6 inline-flex rounded-2xl bg-brand-ink px-6 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95"
            >
              Browse menu
            </Link>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-black/10 bg-white/55 p-4 shadow-sm backdrop-blur sm:p-5"
                >
                  <div className="grid gap-4 sm:grid-cols-[110px_1fr_auto] sm:items-center">
                    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white/60">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-28 w-full object-cover sm:h-24"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="grid h-28 place-items-center text-xs text-brand-ink/50 sm:h-24">
                          Image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-brand-ink">
                        {item.productName}
                      </h2>

                      <p className="mt-1 text-sm text-brand-ink/65">
                        {item.size.label}
                        {item.size.serves ? ` · Serves ${item.size.serves}` : ""}
                        {" · "}
                        Sugar: {item.sugar}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-brand-ink">
                        {formatLkr(item.unitPriceLkr)} each
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-brand-ink/15 bg-white/55 text-lg text-brand-ink hover:bg-white/80"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>

                        <span className="min-w-8 text-center text-sm font-semibold text-brand-ink">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-brand-ink/15 bg-white/55 text-lg text-brand-ink hover:bg-white/80"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-sm font-semibold text-brand-ink">
                        {formatLkr(item.unitPriceLkr * item.quantity)}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-3xl border border-black/10 bg-white/55 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold tracking-[0.25em] text-brand-ink/55">
                ORDER SUMMARY
              </p>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm text-brand-ink/70">
                  <span>Items</span>
                  <span>{items.length}</span>
                </div>

                <div className="flex items-center justify-between border-t border-black/10 pt-4">
                  <span className="text-sm font-semibold text-brand-ink">
                    Total
                  </span>
                  <span className="text-lg font-semibold text-brand-ink">
                    {formatLkr(subtotal)}
                  </span>
                </div>
              </div>

              <Link
                to="/order"
                className="mt-6 flex w-full justify-center rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95"
              >
                Continue to checkout
              </Link>

              <button
                type="button"
                onClick={clear}
                className="mt-3 w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Clear cart
              </button>
            </aside>
          </div>
        )}
      </div>
    </Page>
  );
}