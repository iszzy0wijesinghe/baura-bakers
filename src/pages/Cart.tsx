import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../app/cart";
import Page from "../components/Page";

function formatLkr(value: number) {
  return `LKR ${Number(
    value || 0,
  ).toLocaleString()}`;
}

export default function Cart() {
  const {
    items,
    updateQty,
    removeItem,
    clear,
    subtotal,
  } = useCart();

  const totalQuantity = items.reduce(
    (total, item) =>
      total + item.quantity,
    0,
  );

  return (
    <Page>
      <main className="pb-28 lg:pb-10">
        <div className="mx-auto w-full max-w-[1380px]">
          <header className="border-b border-brand-ink/10 pb-5 sm:pb-6">
            <Link
              to="/menu"
              className="group inline-flex items-center gap-2 text-xs font-semibold text-brand-ink/55 transition hover:text-brand-ink"
            >
              <ArrowLeft
                size={15}
                className="transition-transform group-hover:-translate-x-0.5"
              />

              Back to menu
            </Link>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-ink/40">
                  YOUR ORDER
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
                  Your Baura bag
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-brand-ink/60">
                  Review your favourites,
                  adjust quantities and
                  continue when everything
                  looks right.
                </p>
              </div>

              {items.length > 0 && (
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-ink/10 bg-white/55 px-3.5 py-2 text-xs font-semibold text-brand-ink/55">
                  <ShoppingBag size={14} />

                  {totalQuantity}{" "}
                  {totalQuantity === 1
                    ? "item"
                    : "items"}
                </div>
              )}
            </div>
          </header>

          {items.length === 0 ? (
            <section className="mx-auto flex max-w-xl flex-col items-center py-16 text-center sm:py-20">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-brand-ink/10 bg-white/55 text-brand-ink shadow-sm">
                <ShoppingBag
                  size={25}
                  strokeWidth={1.6}
                />
              </div>

              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.23em] text-brand-ink/40">
                Nothing here yet
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">
                Your bag is waiting.
              </h2>

              <p className="mt-3 max-w-sm text-sm leading-6 text-brand-ink/60">
                Browse the Baura menu and
                add something delicious to
                get your order started.
              </p>

              <Link
                to="/menu"
                className="group mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(55,38,25,0.16)]"
              >
                Explore the menu

                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </section>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-brand-ink">
                      Your items
                    </h2>

                    <p className="mt-0.5 text-xs text-brand-ink/50">
                      Make any final changes
                      before checkout.
                    </p>
                  </div>

                  <Link
                    to="/menu"
                    className="hidden items-center gap-1.5 text-xs font-semibold text-brand-ink/60 transition hover:text-brand-ink sm:inline-flex"
                  >
                    Add more

                    <Plus size={14} />
                  </Link>
                </div>

                <div className="overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/45 shadow-[0_12px_32px_rgba(55,38,25,0.035)]">
                  {items.map(
                    (item, index) => {
                      const lineTotal =
                        item.unitPriceLkr *
                        item.quantity;

                      return (
                        <article
                          key={item.id}
                          className={[
                            "p-3.5 sm:p-4",
                            index > 0
                              ? "border-t border-brand-ink/10"
                              : "",
                          ].join(" ")}
                        >
                          <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-3.5 sm:grid-cols-[104px_minmax(0,1fr)_auto] sm:gap-4">
                            <div className="overflow-hidden rounded-[1rem] border border-brand-ink/10 bg-brand-ink/[0.03]">
                              {item.image ? (
                                <img
                                  src={
                                    item.image
                                  }
                                  alt={
                                    item.productName
                                  }
                                  className="aspect-square h-full min-h-[84px] w-full object-cover sm:min-h-[104px]"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <div className="grid aspect-square min-h-[84px] place-items-center px-2 text-center text-[11px] font-medium text-brand-ink/35 sm:min-h-[104px]">
                                  Product
                                  image
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 self-center">
                              <h3 className="truncate text-[15px] font-semibold leading-snug text-brand-ink sm:text-base">
                                {
                                  item.productName
                                }
                              </h3>

                              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-brand-ink/50">
                                <span>
                                  {
                                    item.size
                                      .label
                                  }
                                </span>

                                {item.size
                                  .serves && (
                                  <>
                                    <span
                                      className="h-1 w-1 rounded-full bg-brand-ink/25"
                                      aria-hidden="true"
                                    />

                                    <span>
                                      Serves{" "}
                                      {
                                        item
                                          .size
                                          .serves
                                      }
                                    </span>
                                  </>
                                )}

                                {item.sugar && (
                                  <>
                                    <span
                                      className="h-1 w-1 rounded-full bg-brand-ink/25"
                                      aria-hidden="true"
                                    />

                                    <span>
                                      {
                                        item.sugar
                                      }
                                    </span>
                                  </>
                                )}
                              </div>

                              <p className="mt-2 text-xs font-semibold text-brand-ink/55">
                                {formatLkr(
                                  item.unitPriceLkr,
                                )}{" "}
                                each
                              </p>

                              <div className="mt-3 flex items-center justify-between gap-3 sm:hidden">
                                <QuantityControl
                                  quantity={
                                    item.quantity
                                  }
                                  onDecrease={() =>
                                    updateQty(
                                      item.id,
                                      item.quantity -
                                        1,
                                    )
                                  }
                                  onIncrease={() =>
                                    updateQty(
                                      item.id,
                                      item.quantity +
                                        1,
                                    )
                                  }
                                  productName={
                                    item.productName
                                  }
                                />

                                <p className="text-sm font-bold text-brand-ink">
                                  {formatLkr(
                                    lineTotal,
                                  )}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    item.id,
                                  )
                                }
                                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-ink/40 transition hover:text-red-700"
                              >
                                <Trash2
                                  size={13}
                                />

                                Remove
                              </button>
                            </div>

                            <div className="hidden min-w-[138px] flex-col items-end justify-center sm:flex">
                              <QuantityControl
                                quantity={
                                  item.quantity
                                }
                                onDecrease={() =>
                                  updateQty(
                                    item.id,
                                    item.quantity -
                                      1,
                                  )
                                }
                                onIncrease={() =>
                                  updateQty(
                                    item.id,
                                    item.quantity +
                                      1,
                                  )
                                }
                                productName={
                                  item.productName
                                }
                              />

                              <p className="mt-3 text-sm font-bold text-brand-ink">
                                {formatLkr(
                                  lineTotal,
                                )}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>

                <Link
                  to="/menu"
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-ink/10 bg-white/45 px-4 text-xs font-semibold text-brand-ink transition hover:border-brand-ink/20 hover:bg-white/70 sm:hidden"
                >
                  <Plus size={14} />

                  Add something else
                </Link>
              </section>

              <aside className="hidden lg:block">
                <div className="sticky top-24 overflow-hidden rounded-[1.4rem] border border-brand-ink/10 bg-white/60 shadow-[0_14px_36px_rgba(55,38,25,0.05)] backdrop-blur">
                  <div className="p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-ink/40">
                      ORDER SUMMARY
                    </p>

                    <h2 className="mt-1.5 text-xl font-semibold text-brand-ink">
                      Almost there.
                    </h2>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-brand-ink/55">
                          Items
                        </span>

                        <span className="font-semibold text-brand-ink">
                          {totalQuantity}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-brand-ink/55">
                          Subtotal
                        </span>

                        <span className="font-semibold text-brand-ink">
                          {formatLkr(
                            subtotal,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-brand-ink/10 pt-4">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold text-brand-ink/45">
                            Order total
                          </p>

                          <p className="mt-0.5 text-[11px] text-brand-ink/40">
                            Before any
                            delivery charges
                          </p>
                        </div>

                        <strong className="text-xl font-semibold tracking-tight text-brand-ink">
                          {formatLkr(
                            subtotal,
                          )}
                        </strong>
                      </div>
                    </div>

                    <Link
                      to="/order"
                      className="group mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(55,38,25,0.18)]"
                    >
                      Continue to
                      checkout

                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>

                    <p className="mt-3 text-center text-[11px] leading-5 text-brand-ink/45">
                      You can review your
                      details before
                      submitting the order.
                    </p>
                  </div>

                  <div className="border-t border-brand-ink/10 bg-brand-bg/30 px-5 py-3.5">
                    <button
                      type="button"
                      onClick={clear}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-ink/45 transition hover:text-red-700"
                    >
                      <Trash2 size={13} />

                      Clear entire bag
                    </button>
                  </div>
                </div>
              </aside>

              <section className="rounded-[1.4rem] border border-brand-ink/10 bg-white/55 p-4 shadow-sm lg:hidden">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-ink/40">
                      ORDER TOTAL
                    </p>

                    <p className="mt-1 text-xl font-semibold text-brand-ink">
                      {formatLkr(
                        subtotal,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clear}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-ink/40 transition hover:text-red-700"
                  >
                    <Trash2 size={13} />

                    Clear bag
                  </button>
                </div>

                <p className="mt-2 text-[11px] leading-5 text-brand-ink/45">
                  {totalQuantity}{" "}
                  {totalQuantity === 1
                    ? "item"
                    : "items"}{" "}
                  · Before any delivery
                  charges
                </p>
              </section>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-ink/10 bg-[#f9f4e0]/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_35px_rgba(55,38,25,0.08)] backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex max-w-[1380px] items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-ink/40">
                  TOTAL
                </p>

                <p className="truncate text-lg font-semibold tracking-tight text-brand-ink">
                  {formatLkr(
                    subtotal,
                  )}
                </p>
              </div>

              <Link
                to="/order"
                className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-ink px-5 text-sm font-semibold text-brand-bg shadow-[0_8px_24px_rgba(55,38,25,0.15)]"
              >
                Checkout

                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        )}
      </main>
    </Page>
  );
}

function QuantityControl({
  quantity,
  onDecrease,
  onIncrease,
  productName,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  productName: string;
}) {
  return (
    <div className="inline-flex h-9 items-center overflow-hidden rounded-full border border-brand-ink/10 bg-white/70">
      <button
        type="button"
        onClick={onDecrease}
        className="grid h-full w-9 place-items-center text-brand-ink/65 transition hover:bg-brand-ink/[0.06] hover:text-brand-ink"
        aria-label={`Decrease ${productName} quantity`}
      >
        <Minus
          size={14}
          strokeWidth={2}
        />
      </button>

      <span
        className="min-w-8 text-center text-xs font-bold tabular-nums text-brand-ink"
        aria-label={`Quantity ${quantity}`}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        className="grid h-full w-9 place-items-center text-brand-ink/65 transition hover:bg-brand-ink/[0.06] hover:text-brand-ink"
        aria-label={`Increase ${productName} quantity`}
      >
        <Plus
          size={14}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}