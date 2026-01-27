import { Link } from "react-router-dom";
import { useCart } from "../app/cart";

export default function Cart() {
  const { items, subtotal, updateQty, removeItem, clear } = useCart();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Cart</h1>
          <p className="mt-1 text-sm text-brand-ink/75">
            Review items, then continue to order.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-sm font-semibold text-brand-ink/70 underline hover:text-brand-ink"
          >
            Clear cart
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-brand-ink/15 bg-white/40 p-6">
          <p className="text-sm text-brand-ink/75">Your cart is empty.</p>
          <Link to="/menu" className="mt-3 inline-block text-sm font-semibold underline">
            Browse menu →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="rounded-3xl border border-brand-ink/15 bg-white/40 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{it.productName}</p>
                    <p className="text-xs text-brand-ink/70">
                      Size: {it.size.label} • Sugar: {it.sugar}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    LKR {(it.unitPriceLkr * it.quantity).toLocaleString()}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="h-9 w-9 rounded-xl border border-brand-ink/15 bg-white/30 hover:bg-white/45"
                      onClick={() => updateQty(it.id, it.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <div className="min-w-10 text-center text-sm font-semibold">
                      {it.quantity}
                    </div>
                    <button
                      className="h-9 w-9 rounded-xl border border-brand-ink/15 bg-white/30 hover:bg-white/45"
                      onClick={() => updateQty(it.id, it.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="text-sm font-semibold text-brand-ink/70 underline hover:text-brand-ink"
                    onClick={() => removeItem(it.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-3xl border border-brand-ink/15 bg-white/40 p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-widest text-brand-ink/60">SUMMARY</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-brand-ink/80">Subtotal</p>
              <p className="text-sm font-semibold">LKR {subtotal.toLocaleString()}</p>
            </div>

            <p className="mt-3 text-[11px] text-brand-ink/60">
              Delivery fee may apply depending on location.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/order"
                className="rounded-xl bg-brand-ink px-4 py-2.5 text-center text-sm font-semibold text-brand-bg hover:bg-brand-ink/95"
              >
                Continue to order
              </Link>
              <Link
                to="/menu"
                className="rounded-xl bg-black/5 px-4 py-2.5 text-center text-sm font-semibold text-brand-ink hover:bg-black/10"
              >
                Add more items
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
