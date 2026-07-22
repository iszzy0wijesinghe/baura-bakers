/** @format */

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../app/cart";
import Page from "../components/Page";
import {
  getPayHerePaymentStatus,
  type PayHerePaymentStatus,
} from "../lib/payhere";

type PendingPayment = {
  orderNo?: string;
  trackingToken?: string | null;
};

function readPendingPayment(): PendingPayment | null {
  try {
    const raw = localStorage.getItem(
      "baura_pending_payment_v1",
    );

    return raw
      ? (JSON.parse(raw) as PendingPayment)
      : null;
  } catch {
    return null;
  }
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderNo = searchParams.get("orderNo");
  const { clear } = useCart();

  const pendingPayment = useMemo(
    () => readPendingPayment(),
    [],
  );

  const trackingToken =
    pendingPayment?.orderNo === orderNo
      ? pendingPayment.trackingToken || null
      : null;

  const [status, setStatus] =
    useState<PayHerePaymentStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderNo) return;

    let cancelled = false;
    let timer: number | null = null;

    async function checkStatus() {
      try {
        const data = await getPayHerePaymentStatus(
          orderNo!,
          trackingToken,
        );

        if (cancelled) return;

        setStatus(data);
        setError("");

        if (data.payment_status === "PAID") {
          clear();
          localStorage.removeItem(
            "baura_pending_payment_v1",
          );
          return;
        }

        if (
          [
            "FAILED",
            "CANCELLED",
            "CHARGEDBACK",
          ].includes(data.payment_status)
        ) {
          return;
        }

        timer = window.setTimeout(checkStatus, 3000);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Could not check payment status.",
        );
        timer = window.setTimeout(checkStatus, 5000);
      }
    }

    void checkStatus();

    return () => {
      cancelled = true;

      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [orderNo, trackingToken, clear]);

  const paid = status?.payment_status === "PAID";
  const failed = status
    ? ["FAILED", "CANCELLED", "CHARGEDBACK"].includes(
        status.payment_status,
      )
    : false;

  return (
    <Page>
      <div className="mx-auto max-w-xl rounded-3xl border border-black/10 bg-white/60 p-8 text-center shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
          PAYMENT STATUS
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink">
          {paid
            ? "Payment successful"
            : failed
              ? "Payment was not completed"
              : "Checking your payment"}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-brand-ink/70">
          Order No:{" "}
          <span className="font-semibold">
            {orderNo || "-"}
          </span>
        </p>

        {paid ? (
          <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            PayHere confirmed your payment. The MySQL order is
            now marked as paid and confirmed.
          </p>
        ) : failed ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {status?.latest_attempt?.status_message ||
              "The payment was cancelled or unsuccessful. You can try again."}
          </p>
        ) : (
          <p className="mt-4 rounded-2xl bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
            PayHere confirms payments through a secure server
            notification. This page will update automatically.
          </p>
        )}

        {status && (
          <p className="mt-3 text-xs text-brand-ink/55">
            Current status: {status.payment_status}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/orders"
            className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg"
          >
            My orders
          </Link>

          {!paid && (
            <Link
              to="/order"
              className="rounded-2xl border border-brand-ink/20 px-5 py-3 text-sm font-semibold text-brand-ink"
            >
              Try again
            </Link>
          )}

          <Link
            to="/"
            className="rounded-2xl border border-brand-ink/20 px-5 py-3 text-sm font-semibold text-brand-ink"
          >
            Go home
          </Link>
        </div>
      </div>
    </Page>
  );
}
