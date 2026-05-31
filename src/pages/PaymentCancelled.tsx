import { Link, useSearchParams } from "react-router-dom";
import Page from "../components/Page";

export default function PaymentCancelled() {
  const [searchParams] = useSearchParams();
  const orderNo = searchParams.get("orderNo");

  return (
    <Page>
      <div className="mx-auto max-w-xl rounded-3xl border border-black/10 bg-white/60 p-8 text-center shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
          PAYMENT CANCELLED
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink">
          Payment was not completed
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-brand-ink/70">
          Order No: <span className="font-semibold">{orderNo || "-"}</span>
        </p>

        <p className="mt-4 rounded-2xl bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
          Your cart is still saved. You can return and try payment again or
          continue with WhatsApp ordering.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/order"
            className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg"
          >
            Try again
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