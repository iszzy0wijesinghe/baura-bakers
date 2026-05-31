import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../app/cart";
import Page from "../components/Page";

type OrderStatus = {
  order_no: string;
  payment_status: string;
  order_status: string;
  subtotal_lkr: number;
};

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderNo = searchParams.get("orderNo");
  const { clear } = useCart();

  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderNo) return;

    let cancelled = false;

    async function checkStatus() {
      try {
        const response = await fetch(
          `/api/order-status?orderNo=${encodeURIComponent(orderNo!)}`,
        );

        if (!response.ok) {
          throw new Error("Could not check payment status.");
        }

        const data = (await response.json()) as OrderStatus;

        if (cancelled) return;

        setStatus(data);

        if (data.payment_status === "PAID") {
          clear();
          localStorage.removeItem("baura_pending_payment_v1");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not check payment status.",
          );
        }
      }
    }

    checkStatus();
    const timer = window.setInterval(checkStatus, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [orderNo, clear]);

  return (
    <Page>
      <div className="mx-auto max-w-xl rounded-3xl border border-black/10 bg-white/60 p-8 text-center shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
          PAYMENT STATUS
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink">
          {status?.payment_status === "PAID"
            ? "Payment successful"
            : "Checking your payment"}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-brand-ink/70">
          Order No: <span className="font-semibold">{orderNo || "-"}</span>
        </p>

        {status?.payment_status === "PAID" ? (
          <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            Your order is confirmed. Your cart has been cleared.
          </p>
        ) : (
          <p className="mt-4 rounded-2xl bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
            Please wait. PayHere is confirming your payment. Do not worry if
            this takes a few seconds.
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/"
            className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg"
          >
            Go home
          </Link>

          <Link
            to="/cart"
            className="rounded-2xl border border-brand-ink/20 px-5 py-3 text-sm font-semibold text-brand-ink"
          >
            View cart
          </Link>
        </div>
      </div>
    </Page>
  );
}