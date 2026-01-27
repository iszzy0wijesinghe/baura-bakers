import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../app/cart";

export default function FloatingCartButton() {
  // ✅ Always call hooks first (never return before hooks)
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { items } = useCart();

  const count = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity, 0),
    [items],
  );

  // ✅ Now decide whether to show it
  const shouldHide =
    pathname === "/cart" ||
    pathname.startsWith("/cart/") ||
    pathname === "/order" ||
    pathname.startsWith("/order/");

  if (shouldHide) return null;

  return (
    <button
      type="button"
      onClick={() => nav("/cart")}
      className={[
        "fixed bottom-5 right-5 z-[99999]",
        "flex items-center gap-2 rounded-2xl px-4 py-3",
        "bg-brand-ink text-brand-bg shadow-xl",
        "border border-black/10",
        "hover:bg-brand-ink/95 active:scale-[0.99] transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
      ].join(" ")}
      aria-label="Open cart"
    >
      <span className="relative grid place-items-center">
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />

        {/* Badge */}
        <span
          className={[
            "absolute -right-2 -top-2",
            "min-w-5 h-5 px-1",
            "rounded-full",
            "bg-brand-bg text-brand-ink",
            "text-[10px] font-bold",
            "grid place-items-center",
            "border border-black/10",
          ].join(" ")}
        >
          {count}
        </span>
      </span>

      <span className="text-sm font-semibold tracking-tight">Cart</span>
    </button>
  );
}
