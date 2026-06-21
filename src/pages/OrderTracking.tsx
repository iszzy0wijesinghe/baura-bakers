/** @format */

import {
  CheckCircle2,
  Clock3,
  Download,
  Gift,
  Home,
  LogIn,
  MapPin,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import logoUrl from "../assets/logo1.webp";
import {
  getOrderTracking,
  type PublicOrderTracking,
  claimDeviceOrdersForCurrentUser,
} from "../lib/orders";
import { supabase } from "../lib/supabase";

const flow = [
  {
    status: "CONFIRMED",
    label: "Confirmed",
    shortLabel: "Confirmed",
    description: "Your payment/order is confirmed.",
    icon: CheckCircle2,
  },
  {
    status: "PREPARING",
    label: "Preparing",
    shortLabel: "Preparing",
    description: "Your order is being prepared.",
    icon: Clock3,
  },
  {
    status: "READY",
    label: "Ready",
    shortLabel: "Ready",
    description: "Your order is packed and ready.",
    icon: PackageCheck,
  },
  {
    status: "DISPATCHED",
    label: "Dispatched",
    shortLabel: "On the way",
    description: "Your order is on the way.",
    icon: Truck,
  },
  {
    status: "COMPLETED",
    label: "Completed",
    shortLabel: "Completed",
    description: "Your order is completed.",
    icon: CheckCircle2,
  },
];

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function getProgressIndex(status: string) {
  if (status === "NEW") return -1;
  if (status === "CANCELLED") return -1;

  return flow.findIndex((item) => item.status === status);
}

function getFriendlyOrderStatus(status: string) {
  switch (status) {
    case "NEW":
      return "Waiting for confirmation";
    case "CONFIRMED":
      return "Order confirmed";
    case "PREPARING":
      return "Preparing your order";
    case "READY":
      return "Ready for pickup / delivery";
    case "DISPATCHED":
      return "Out for delivery";
    case "COMPLETED":
      return "Order completed";
    case "CANCELLED":
      return "Order cancelled";
    default:
      return status;
  }
}

function getFriendlyPaymentStatus(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Payment pending";
    case "PAYMENT_STARTED":
      return "Payment started";
    case "PAID":
      return "Payment received";
    case "FAILED":
      return "Payment failed";
    case "CANCELLED":
      return "Payment cancelled";
    default:
      return status;
  }
}

function getStatusMessage(order: PublicOrderTracking) {
  if (order.order_status === "CANCELLED") {
    return "This order has been cancelled. Please contact Baura Bakers if you need help.";
  }

  if (order.payment_status !== "PAID") {
    return "Your order is saved. Once payment is confirmed, we will start preparing it.";
  }

  switch (order.order_status) {
    case "NEW":
      return "Your payment is received. We are checking your order before confirming it.";
    case "CONFIRMED":
      return "Your order is confirmed and will move to preparation soon.";
    case "PREPARING":
      return "Fresh bakes take time. Your order is being prepared with care.";
    case "READY":
      return "Your order is packed and ready for delivery or pickup.";
    case "DISPATCHED":
      return "Your order has been dispatched. Please keep your phone nearby.";
    case "COMPLETED":
      return "Thank you for ordering from Baura Bakers. We hope you enjoyed it.";
    default:
      return "Your order status will update here automatically.";
  }
}

function escapeInvoiceValue(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildInvoiceHtml(order: PublicOrderTracking) {
  const rows = order.order_items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #eee;">
            <strong>${escapeInvoiceValue(item.product_name)}</strong>
            <div style="font-size:12px;color:#7a6a5a;margin-top:4px;">
              ${escapeInvoiceValue(item.size_label)} • Sugar: ${escapeInvoiceValue(
                item.sugar_level,
              )}
            </div>
          </td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">
            ${formatLkr(item.unit_price_lkr)}
          </td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">
            <strong>${formatLkr(item.line_total_lkr)}</strong>
          </td>
        </tr>
      `,
    )
    .join("");

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Baura Bakers Invoice - ${escapeInvoiceValue(order.order_no)}</title>
  </head>

  <body style="margin:0;background:#f6efe2;font-family:Arial,Helvetica,sans-serif;color:#372619;">
    <div style="max-width:760px;margin:0 auto;padding:28px;">
      <div style="background:#fffaf1;border:1px solid #eadfce;border-radius:24px;overflow:hidden;">
        <div style="background:#372619;color:#fffaf1;padding:26px;text-align:center;">
          <h1 style="margin:0;font-size:26px;">Baura Bakers Invoice</h1>
          <p style="margin:8px 0 0;color:#fff0d5;">${escapeInvoiceValue(
            order.order_no,
          )}</p>
        </div>

        <div style="padding:26px;">
          <table style="width:100%;margin-bottom:20px;font-size:14px;">
            <tr>
              <td><strong>Order No:</strong></td>
              <td style="text-align:right;">${escapeInvoiceValue(order.order_no)}</td>
            </tr>
            <tr>
              <td><strong>Placed:</strong></td>
              <td style="text-align:right;">${escapeInvoiceValue(
                formatDate(order.created_at),
              )}</td>
            </tr>
            <tr>
              <td><strong>Payment:</strong></td>
              <td style="text-align:right;">${escapeInvoiceValue(
                getFriendlyPaymentStatus(order.payment_status),
              )}</td>
            </tr>
            <tr>
              <td><strong>Status:</strong></td>
              <td style="text-align:right;">${escapeInvoiceValue(
                getFriendlyOrderStatus(order.order_status),
              )}</td>
            </tr>
          </table>

          <h2 style="font-size:18px;margin:0 0 12px;">Items</h2>

          <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;border-radius:16px;overflow:hidden;">
            <thead>
              <tr style="background:#f8eddc;">
                <th style="padding:12px;text-align:left;font-size:12px;">Item</th>
                <th style="padding:12px;text-align:center;font-size:12px;">Qty</th>
                <th style="padding:12px;text-align:right;font-size:12px;">Price</th>
                <th style="padding:12px;text-align:right;font-size:12px;">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div style="margin-top:18px;text-align:right;font-size:20px;font-weight:bold;">
            Total: ${formatLkr(order.subtotal_lkr)}
          </div>

          <div style="margin-top:24px;background:#fff;border:1px solid #eee;border-radius:18px;padding:18px;">
            <h3 style="margin:0 0 10px;font-size:15px;">Delivery Details</h3>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#5f5043;">
              ${escapeInvoiceValue(order.delivery_address)}
            </p>
          </div>

          <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#7a6a5a;text-align:center;">
            Thank you for ordering from Baura Bakers.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
`;
}

export default function OrderTracking() {
  const navigate = useNavigate();
  const { orderNo = "" } = useParams();
  const [params] = useSearchParams();

  const [order, setOrder] = useState<PublicOrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(true);

  const token = params.get("t");

  useEffect(() => {
    let active = true;

    async function redirectLoggedInCustomer() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (user) {
        await claimDeviceOrdersForCurrentUser();

        if (!active) return;

        navigate("/orders", { replace: true });
        return;
      }

      setIsCheckingCustomer(false);
    }

    redirectLoggedInCustomer();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function loadTracking(showLoading = false) {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setErrorText("");

      const result = await getOrderTracking(orderNo, token);

      if (!result) {
        setErrorText(
          "We could not find this order on this device. Open the tracking link from the same device or use the email link.",
        );
        setOrder(null);
        return;
      }

      setOrder(result);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Could not load order tracking.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (isCheckingCustomer) return;

    let active = true;

    async function loadInitial() {
      if (!active) return;
      await loadTracking(true);
    }

    loadInitial();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadTracking(false);
      }
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [orderNo, token, isCheckingCustomer]);

  const progressIndex = useMemo(() => {
    return order ? getProgressIndex(order.order_status) : -1;
  }, [order]);

  const progressPercent = useMemo(() => {
    if (!order || progressIndex < 0) return 0;
    if (flow.length <= 1) return 100;

    return Math.round((progressIndex / (flow.length - 1)) * 100);
  }, [order, progressIndex]);

  function downloadInvoice() {
    if (!order) return;

    const html = buildInvoiceHtml(order);
    const blob = new Blob([html], {
      type: "text/html;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `baura-bakers-invoice-${order.order_no}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  if (isCheckingCustomer || isLoading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,244,214,0.95),transparent_32%),linear-gradient(135deg,#fffaf1_0%,#f5eadc_48%,#efe0cb_100%)] px-4 py-6 text-brand-ink sm:px-6 sm:py-8">
        <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
          <div className="text-center">
            <img
              src={logoUrl}
              alt="Baura Bakers"
              className="mx-auto h-28 w-auto object-contain sm:h-32"
            />

            <div className="mx-auto mt-8 h-12 w-12 animate-spin rounded-full border-4 border-brand-ink/10 border-t-brand-ink" />

            <p className="mt-5 text-sm font-semibold text-brand-ink/65">
              Loading live order tracking...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,244,214,0.95),transparent_32%),linear-gradient(135deg,#fffaf1_0%,#f5eadc_48%,#efe0cb_100%)] px-4 py-6 text-brand-ink sm:px-6 sm:py-8">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <section className="w-full text-center">
            <img
              src={logoUrl}
              alt="Baura Bakers"
              className="mx-auto h-28 w-auto object-contain sm:h-32"
            />

            <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-ink/45">
              Order Tracking
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
              Order not available
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-brand-ink/65 sm:text-base">
              {errorText}
            </p>

            <div className="mx-auto mt-8 grid max-w-xl gap-3 rounded-[2rem] border border-black/10 bg-white/55 p-4 text-left shadow-[0_20px_70px_rgba(55,38,25,0.08)] backdrop-blur sm:p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-ink text-brand-bg">
                  <LogIn size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-brand-ink">
                    Want to see all your orders?
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-brand-ink/60">
                    Login or create an account using the same device to add your
                    guest orders to order history and receive future offers.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/menu"
                className="rounded-2xl bg-brand-ink px-6 py-3 text-sm font-semibold text-brand-bg shadow-[0_16px_38px_rgba(55,38,25,0.18)] hover:bg-brand-ink/95">
                Go to menu
              </Link>

              <Link
                to="/login"
                className="rounded-2xl border border-brand-ink/20 bg-white/65 px-6 py-3 text-sm font-semibold text-brand-ink shadow-sm hover:bg-white">
                Login
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const currentStatus = getFriendlyOrderStatus(order.order_status);
  const paymentStatus = getFriendlyPaymentStatus(order.payment_status);
  const statusMessage = getStatusMessage(order);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,244,214,0.95),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(214,179,125,0.34),transparent_34%),linear-gradient(135deg,#fffaf1_0%,#f5eadc_48%,#efe0cb_100%)] text-brand-ink">
      <div className="pointer-events-none fixed inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(55,38,25,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(55,38,25,.08)_1px,transparent_1px)] [background-size:38px_38px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-3">
            <img
              src={logoUrl}
              alt="Baura Bakers"
              className="h-16 w-auto object-contain sm:h-20"
            />

            <div>
              <p className="text-sm font-semibold leading-none text-brand-ink">
                Baura Bakers
              </p>
              <p className="mt-1 text-[11px] font-medium text-brand-ink/55">
                Live order tracking
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => loadTracking(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-brand-ink/15 bg-white/55 px-4 py-2.5 text-xs font-semibold text-brand-ink shadow-sm backdrop-blur hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw
              size={15}
              className={isRefreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        <section className="grid gap-8 py-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-12">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-brand-ink/45">
              Order #{order.order_no}
            </p>

            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.055em] text-brand-ink sm:text-6xl lg:text-7xl">
              {currentStatus}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-ink/68 sm:text-lg">
              {statusMessage}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadInvoice}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg shadow-[0_18px_48px_rgba(55,38,25,0.22)] hover:bg-brand-ink/95">
                <Download size={17} />
                Download invoice
              </button>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-ink/15 bg-white/60 px-5 py-3 text-sm font-semibold text-brand-ink shadow-sm backdrop-blur hover:bg-white">
                <LogIn size={17} />
                Login for order history
              </Link>
            </div>

            <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
              <InfoMetric label="Payment" value={paymentStatus} />
              <InfoMetric label="Total" value={formatLkr(order.subtotal_lkr)} />
              <InfoMetric label="Placed" value={formatDate(order.created_at)} />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[3rem] bg-brand-ink/5 blur-2xl" />

            <div className="relative rounded-[2.5rem] border border-white/65 bg-white/55 p-5 shadow-[0_30px_90px_rgba(55,38,25,0.13)] backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-ink/45">
                    Live Progress
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">
                    {progressPercent}% complete
                  </h2>
                </div>

                <div className="grid h-14 w-14 place-items-center rounded-3xl bg-brand-ink text-brand-bg shadow-[0_18px_45px_rgba(55,38,25,0.22)]">
                  <Truck size={24} />
                </div>
              </div>

              <div className="mt-8">
                <div className="relative hidden sm:block">
                  <div className="absolute left-6 right-6 top-6 h-1 rounded-full bg-brand-ink/10" />

                  <div
                    className="absolute left-6 top-6 h-1 rounded-full bg-brand-ink transition-all duration-700 ease-out"
                    style={{
                      width: `calc((100% - 48px) * ${progressPercent / 100})`,
                    }}
                  />

                  <div className="relative grid grid-cols-5 gap-2">
                    {flow.map((item, index) => {
                      const Icon = item.icon;
                      const done = index <= progressIndex;
                      const active = index === progressIndex;

                      return (
                        <div key={item.status} className="text-center">
                          <div
                            className={[
                              "mx-auto grid h-12 w-12 place-items-center rounded-2xl border transition-all duration-500",
                              active
                                ? "scale-110 border-brand-ink bg-brand-ink text-brand-bg shadow-[0_18px_42px_rgba(55,38,25,0.22)]"
                                : done
                                  ? "border-brand-ink bg-brand-ink text-brand-bg"
                                  : "border-brand-ink/10 bg-white text-brand-ink/35",
                            ].join(" ")}>
                            <Icon
                              size={19}
                              className={active ? "animate-pulse" : ""}
                            />
                          </div>

                          <p
                            className={[
                              "mt-3 text-xs font-semibold leading-tight",
                              done || active
                                ? "text-brand-ink"
                                : "text-brand-ink/42",
                            ].join(" ")}>
                            {item.shortLabel}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 sm:hidden">
                  {flow.map((item, index) => {
                    const Icon = item.icon;
                    const done = index <= progressIndex;
                    const active = index === progressIndex;

                    return (
                      <div key={item.status} className="relative flex gap-3">
                        {index < flow.length - 1 && (
                          <div
                            className={[
                              "absolute left-5 top-11 h-[calc(100%+2px)] w-0.5 rounded-full",
                              done ? "bg-brand-ink" : "bg-brand-ink/10",
                            ].join(" ")}
                          />
                        )}

                        <div
                          className={[
                            "relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border transition-all duration-500",
                            active
                              ? "border-brand-ink bg-brand-ink text-brand-bg shadow-[0_14px_34px_rgba(55,38,25,0.22)]"
                              : done
                                ? "border-brand-ink bg-brand-ink text-brand-bg"
                                : "border-brand-ink/10 bg-white text-brand-ink/35",
                          ].join(" ")}>
                          <Icon
                            size={17}
                            className={active ? "animate-pulse" : ""}
                          />
                        </div>

                        <div className="pb-1">
                          <p className="text-sm font-semibold text-brand-ink">
                            {item.label}
                          </p>

                          <p className="mt-0.5 text-xs leading-relaxed text-brand-ink/55">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {lastUpdatedAt && (
                <p className="mt-7 text-center text-[11px] font-medium text-brand-ink/45">
                  Auto refresh enabled · Last updated{" "}
                  {formatDate(lastUpdatedAt)}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 pb-10 lg:grid-cols-[1fr_380px]">
          <div className="rounded-[2.4rem] border border-white/65 bg-white/55 p-5 shadow-[0_26px_80px_rgba(55,38,25,0.1)] backdrop-blur-xl sm:p-7">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-ink text-brand-bg">
                <ReceiptText size={22} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-ink/45">
                  Invoice
                </p>

                <h2 className="text-xl font-semibold tracking-tight text-brand-ink">
                  Order summary
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {order.order_items.map((item, index) => (
                <div
                  key={`${item.product_name}-${index}`}
                  className="flex items-start justify-between gap-4 rounded-3xl border border-black/5 bg-white/55 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-ink">
                      {item.product_name}
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-brand-ink/55">
                      {item.size_label} · Sugar: {item.sugar_level} · Qty{" "}
                      {item.quantity}
                    </p>

                    <p className="mt-2 text-xs font-semibold text-brand-ink/55">
                      {formatLkr(item.unit_price_lkr)} each
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold text-brand-ink">
                    {formatLkr(item.line_total_lkr)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-brand-ink/10 pt-5">
              <span className="text-sm font-semibold text-brand-ink/65">
                Invoice total
              </span>

              <span className="text-2xl font-semibold tracking-tight text-brand-ink">
                {formatLkr(order.subtotal_lkr)}
              </span>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2.4rem] border border-white/65 bg-white/55 p-5 shadow-[0_26px_80px_rgba(55,38,25,0.1)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-bg text-brand-ink">
                  <MapPin size={22} />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-ink/45">
                    Delivery
                  </p>

                  <h2 className="text-xl font-semibold tracking-tight text-brand-ink">
                    Address
                  </h2>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-brand-ink/68">
                {order.delivery_address}
              </p>

              {order.delivery_location_url && (
                <a
                  href={order.delivery_location_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-brand-ink/15 bg-white/65 px-4 py-3 text-sm font-semibold text-brand-ink hover:bg-white">
                  Open delivery location
                </a>
              )}
            </div>

            <div className="rounded-[2.4rem] border border-brand-ink/10 bg-brand-ink p-5 text-brand-bg shadow-[0_26px_80px_rgba(55,38,25,0.18)] sm:p-6">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-bg/10">
                  <Gift size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Create an account for more
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-brand-bg/68">
                    Login or register using this same device to add guest orders
                    to your order history and receive future offers from Baura
                    Bakers.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Link
                  to="/register"
                  className="rounded-2xl bg-brand-bg px-5 py-3 text-center text-sm font-semibold text-brand-ink hover:bg-brand-bg/95">
                  Register
                </Link>

                <Link
                  to="/login"
                  className="rounded-2xl border border-brand-bg/20 px-5 py-3 text-center text-sm font-semibold text-brand-bg hover:bg-brand-bg/10">
                  Login
                </Link>
              </div>
            </div>

            <Link
              to="/"
              className="flex items-center justify-center gap-2 rounded-2xl border border-brand-ink/15 bg-white/55 px-5 py-3 text-sm font-semibold text-brand-ink shadow-sm backdrop-blur hover:bg-white">
              <Home size={17} />
              Back to home
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/55 px-4 py-3 shadow-sm backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-ink/42">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-brand-ink">
        {value}
      </p>
    </div>
  );
}
