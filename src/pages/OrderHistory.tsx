import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Package,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  Search,
  Store,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import Page from "../components/Page";
import {
  claimAccountOrders,
  getAllAccountOrders,
  type AccountOrder,
} from "../lib/accountApi";
import { getBauraDeviceId } from "../lib/device";
import { LaravelApiError } from "../lib/laravelApi";

type CollectionArrangement =
  | "SELF_PICKUP"
  | "CUSTOMER_COURIER"
  | "BAKERY_ASSISTED_COURIER";

type CourierProvider = "PICKME_FLASH" | "UBER_PARCEL";
type OrderFilter = "all" | "active" | "past";

type OrderItem = {
  product_name: string;
  size_label?: string | null;
  quantity: number;
  unit_price_lkr?: number;
  line_total_lkr: number;
};

type OrderRow = AccountOrder & {
  fulfillment_type?: "PICKUP" | "DELIVERY" | null;
  collection_arrangement?: CollectionArrangement | null;
  courier_provider?: CourierProvider | null;
  pickup_date?: string | null;
  pickup_start_time?: string | null;
  pickup_end_time?: string | null;
  delivery_date?: string | null;
  delivery_slot_label?: string | null;
  order_total_lkr?: number | null;
  delivery_fee_lkr?: number | null;
  discount_lkr?: number | null;
  order_items?: OrderItem[];
};

const courierDetails: Record<
  CourierProvider,
  { name: string; logo: string }
> = {
  PICKME_FLASH: {
    name: "PickMe Flash",
    logo: "/checkout-partners/pickme-logo.webp",
  },
  UBER_PARCEL: {
    name: "Uber Parcel",
    logo: "/checkout-partners/uber-icon.webp",
  },
};

function formatMoney(value?: number | null): string {
  return `LKR ${Number(value ?? 0).toLocaleString("en-LK", {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "Date not available";

  const raw = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00+05:30`
    : value;

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });
}

function formatTime(value?: string | null): string {
  if (!value) return "";

  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return value;

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${
    hours < 12 ? "AM" : "PM"
  }`;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    NEW: "Order received",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    READY: "Ready",
    DISPATCHED: "Dispatched",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  return labels[status] ?? status.replace(/_/g, " ");
}

function paymentLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: "Payment pending",
    PAYMENT_STARTED: "Payment processing",
    PAID: "Paid",
    FAILED: "Payment failed",
    CANCELLED: "Payment cancelled",
    CHARGEDBACK: "Payment reversed",
    UNKNOWN: "Payment unverified",
  };

  return labels[status] ?? status.replace(/_/g, " ");
}

function isActive(order: OrderRow): boolean {
  return !["COMPLETED", "CANCELLED"].includes(order.order_status);
}

function canViewReceipt(order: OrderRow): boolean {
  return (
    order.payment_status === "PAID" &&
    ["CONFIRMED", "PREPARING", "READY", "DISPATCHED", "COMPLETED"].includes(
      order.order_status
    )
  );
}

function collectionLabel(order: OrderRow): string {
  if (order.fulfillment_type === "DELIVERY") {
    return "Baura delivery";
  }

  switch (order.collection_arrangement) {
    case "SELF_PICKUP":
      return "Personal collection";
    case "CUSTOMER_COURIER":
      return "Your own courier";
    case "BAKERY_ASSISTED_COURIER":
      return "Baura-assisted courier";
    default:
      return order.fulfillment_type === "PICKUP"
        ? "Pickup arrangement unavailable"
        : "Fulfillment details unavailable";
  }
}

function collectionSubtitle(order: OrderRow): string {
  if (order.fulfillment_type === "DELIVERY") {
    return order.delivery_address || "Delivery address unavailable";
  }

  const courier = order.courier_provider &&
    ["CUSTOMER_COURIER", "BAKERY_ASSISTED_COURIER"].includes(order.collection_arrangement ?? "")
    ? courierDetails[order.courier_provider]
    : null;

  if (courier && order.collection_arrangement !== "SELF_PICKUP") {
    return courier.name;
  }

  if (order.collection_arrangement === "SELF_PICKUP") {
    return "Collect from Baura Bakers";
  }

  return "Courier details unavailable";
}

function scheduledTime(order: OrderRow): string | null {
  if (order.fulfillment_type === "PICKUP" && order.pickup_date) {
    const start = formatTime(order.pickup_start_time);
    const end = formatTime(order.pickup_end_time);

    return [
      formatDate(order.pickup_date),
      [start, end].filter(Boolean).join(" – "),
    ].filter(Boolean).join(" · ");
  }

  if (order.fulfillment_type === "DELIVERY" && order.delivery_date) {
    return [
      formatDate(order.delivery_date),
      order.delivery_slot_label,
    ].filter(Boolean).join(" · ");
  }

  return null;
}

function StatusIndicator({ order }: { order: OrderRow }) {
  const cancelled = order.order_status === "CANCELLED";
  const complete = order.order_status === "COMPLETED";

  const color = cancelled
    ? "bg-red-600"
    : complete
      ? "bg-emerald-700"
      : "bg-[#a27a49]";

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-ink/65">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {statusLabel(order.order_status)}
    </span>
  );
}

function CourierDisplay({ provider }: { provider: CourierProvider }) {
  const courier = courierDetails[provider];
  if (!courier) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg border border-brand-ink/10 bg-white p-1">
        <img
          src={courier.logo}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain"
        />
      </div>
      <span className="text-xs font-semibold text-brand-ink">
        {courier.name}
      </span>
    </div>
  );
}

function DetailLine({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-xs">
      <span className="shrink-0 text-brand-ink/55">{label}</span>
      <span className="min-w-0 text-right font-medium text-brand-ink">
        {children}
      </span>
    </div>
  );
}

function OrderDetails({ order }: { order: OrderRow }) {
  const pickup = order.fulfillment_type === "PICKUP";
  const courierCollection =
    pickup &&
    (order.collection_arrangement === "CUSTOMER_COURIER" ||
      order.collection_arrangement === "BAKERY_ASSISTED_COURIER");

  const schedule = scheduledTime(order);
  const items = order.order_items ?? [];
  const total = order.order_total_lkr ?? order.subtotal_lkr;
  const deliveryFee = Number(order.delivery_fee_lkr ?? 0);
  const discount = Number(order.discount_lkr ?? 0);

  return (
    <div className="border-t border-brand-ink/10 bg-[#fbf7f0]/75 px-4 py-4 sm:px-5">
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center gap-2">
            {pickup ? <Store size={16} /> : <Truck size={16} />}
            <h3 className="text-xs font-semibold text-brand-ink">
              {pickup ? "Collection details" : "Delivery details"}
            </h3>
          </div>

          <div className="rounded-xl border border-brand-ink/10 bg-white/65 p-3">
            <p className="text-[13px] font-semibold text-brand-ink">
              {collectionLabel(order)}
            </p>

            <p className="mt-1 text-xs text-brand-ink/60">
              {collectionSubtitle(order)}
            </p>

            {courierCollection && order.courier_provider && (
              <div className="mt-3">
                <CourierDisplay provider={order.courier_provider} />
              </div>
            )}

            {schedule && (
              <div className="mt-3 flex items-start gap-2 border-t border-brand-ink/10 pt-3">
                <CalendarDays
                  size={15}
                  className="mt-0.5 shrink-0 text-brand-ink/55"
                />
                <div>
                  <p className="text-[11px] text-brand-ink/50">
                    {pickup ? "Scheduled collection" : "Delivery schedule"}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-brand-ink">
                    {schedule}
                  </p>
                </div>
              </div>
            )}

            {courierCollection && (
              <p className="mt-3 border-t border-brand-ink/10 pt-3 text-[11px] leading-5 text-brand-ink/60">
                Third-party courier charges are paid separately by the
                customer and are not included in the bakery total.
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-brand-ink/55">
              Payment status
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink">
              {order.payment_status === "PAID" ? (
                <CheckCircle2 size={15} />
              ) : (
                <Clock3 size={15} />
              )}
              {paymentLabel(order.payment_status)}
            </span>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Package size={16} />
            <h3 className="text-xs font-semibold text-brand-ink">
              Order summary
            </h3>
          </div>

          <div className="rounded-xl border border-brand-ink/10 bg-white/65 p-3">
            {items.length > 0 ? (
              <div className="space-y-3 pb-3">
                {items.map((item, index) => (
                  <div
                    key={`${item.product_name}-${index}`}
                    className="flex justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-brand-ink">
                        {item.product_name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-brand-ink/50">
                        {item.quantity} × {item.size_label || "Standard"}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium text-brand-ink">
                      {formatMoney(item.line_total_lkr)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pb-3 text-xs text-brand-ink/55">
                Item details are unavailable in this response.
              </p>
            )}

            <div className="border-t border-brand-ink/10 pt-2">
              <DetailLine label="Subtotal">
                {formatMoney(order.subtotal_lkr)}
              </DetailLine>

              {discount > 0 && (
                <DetailLine label="Discount">
                  −{formatMoney(discount)}
                </DetailLine>
              )}

              {pickup ? (
                <DetailLine label="Bakery collection fee">
                  Free
                </DetailLine>
              ) : (
                <DetailLine label="Baura delivery fee">
                  {formatMoney(deliveryFee)}
                </DetailLine>
              )}

              <div className="mt-2 flex justify-between gap-3 border-t border-brand-ink/10 pt-3">
                <span className="text-sm font-semibold text-brand-ink">
                  Order total
                </span>
                <strong className="text-sm text-brand-ink">
                  {formatMoney(total)}
                </strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canViewReceipt(order) ? (
          <Link
            to={`/receipt/${encodeURIComponent(order.order_no)}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-ink px-4 text-xs font-semibold text-brand-bg transition hover:opacity-90"
          >
            <ReceiptText size={15} />
            View receipt
            <ArrowRight size={14} />
          </Link>
        ) : (
          <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-brand-ink/10 bg-white/50 px-3 text-[11px] text-brand-ink/60">
            <Wallet size={15} />
            Receipt available after payment verification
          </span>
        )}

        <Link
          to="/order-policies"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-brand-ink/15 px-4 text-xs font-medium text-brand-ink transition hover:bg-white/70"
        >
          <CircleHelp size={15} />
          Ordering policies
        </Link>
      </div>
    </div>
  );
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);

      try {
        const data = await getAllAccountOrders();
        setOrders(data as OrderRow[]);
        setError("");
      } catch (caught) {
        if (caught instanceof LaravelApiError && caught.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load your orders."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await claimAccountOrders(getBauraDeviceId());
      } catch (caught) {
        if (caught instanceof LaravelApiError && caught.status === 401) {
          if (active) navigate("/login", { replace: true });
          return;
        }
      }

      if (active) await loadOrders(true);
    }

    void initialize();

    const refresh = () => {
      if (document.visibilityState === "visible") {
        void loadOrders(true);
      }
    };

    const timer = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadOrders, navigate]);

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      if (filter === "active" && !isActive(order)) return false;
      if (filter === "past" && isActive(order)) return false;

      if (!term) return true;

      return [
        order.order_no,
        order.order_status,
        collectionLabel(order),
        order.courier_provider
          ? courierDetails[order.courier_provider]?.name
          : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [orders, filter, search]);

  const activeCount = orders.filter(isActive).length;
  const pastCount = orders.length - activeCount;

  const filters: Array<{
    id: OrderFilter;
    label: string;
    count: number;
  }> = [
    { id: "all", label: "All", count: orders.length },
    { id: "active", label: "Active", count: activeCount },
    { id: "past", label: "Past", count: pastCount },
  ];

  return (
    <Page>
      <div className="mx-auto max-w-[980px] pb-20 pt-2 sm:pt-5">
        <header className="flex items-start justify-between gap-3 border-b border-brand-ink/10 pb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-ink/45">
              Your account
            </p>
            <h1 className="mt-1 text-[25px] font-semibold tracking-tight text-brand-ink sm:text-[32px]">
              My orders
            </h1>
            <p className="mt-1 text-xs text-brand-ink/60 sm:text-sm">
              Track orders, collection arrangements and payments.
            </p>
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => void loadOrders()}
            aria-label="Refresh orders"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-brand-ink/15 text-brand-ink transition hover:bg-white/70 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </header>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 border-b border-brand-ink/10">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`min-h-10 border-b-2 px-3.5 text-xs font-semibold transition ${
                  filter === item.id
                    ? "border-brand-ink text-brand-ink"
                    : "border-transparent text-brand-ink/45 hover:text-brand-ink"
                }`}
              >
                {item.label}
                <span className="ml-1.5 text-[10px] opacity-60">
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          <div role="search" className="flex h-10 items-center gap-2 rounded-lg border border-brand-ink/10 bg-white/60 px-3 sm:w-64">
            <Search size={15} className="shrink-0 text-brand-ink/45" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search orders"
              placeholder="Search orders"
              className="min-w-0 flex-1 bg-transparent text-xs text-brand-ink outline-none placeholder:text-brand-ink/40"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="text-brand-ink/50 hover:text-brand-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-brand-ink/5"
              />
            ))}
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="py-16 text-center">
            <PackageCheck
              size={30}
              className="mx-auto text-brand-ink/35"
            />
            <h2 className="mt-3 text-base font-semibold text-brand-ink">
              {orders.length ? "No matching orders" : "No orders yet"}
            </h2>
            <p className="mt-1 text-xs text-brand-ink/55">
              {orders.length
                ? "Try a different search or filter."
                : "Your orders will appear here after checkout."}
            </p>
            {!orders.length && (
              <Link
                to="/menu"
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-ink px-4 text-xs font-semibold text-brand-bg"
              >
                Browse menu
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-3 divide-y divide-brand-ink/10 overflow-hidden rounded-xl border border-brand-ink/10 bg-[#fffdf8]/80">
            {visibleOrders.map((order) => {
              const key = String(order.id);
              const open = expanded === key;
              const schedule = scheduledTime(order);
              const amount =
                order.order_total_lkr ?? order.subtotal_lkr;

              return (
                <article key={key}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setExpanded(open ? null : key)}
                    className={`flex w-full items-start gap-3 px-3 py-4 text-left transition sm:items-center sm:px-5 ${
                      open ? "bg-[#f8f1e6]/70" : "hover:bg-white/70"
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#f2e9da] text-brand-ink">
                      {order.fulfillment_type === "DELIVERY" ? (
                        <Truck size={18} strokeWidth={1.7} />
                      ) : (
                        <Store size={18} strokeWidth={1.7} />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <strong className="text-[13px] font-semibold text-brand-ink sm:text-sm">
                          {order.order_no}
                        </strong>
                        <StatusIndicator order={order} />
                      </span>

                      <span className="mt-1 block text-[11px] text-brand-ink/60">
                        {collectionLabel(order)}
                        {order.courier_provider && order.collection_arrangement !== "SELF_PICKUP" &&
                          ` · ${courierDetails[order.courier_provider]?.name ?? order.courier_provider}`}
                      </span>

                      <span className="mt-1 block text-[11px] text-brand-ink/45">
                        Ordered {formatDate(order.created_at)}
                      </span>

                      {schedule && (
                        <span className="mt-1 flex items-center gap-1.5 text-[11px] text-brand-ink/55">
                          <CalendarDays size={12} />
                          {schedule}
                        </span>
                      )}

                      {order.payment_status !== "PAID" && (
                        <span className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#946c3b]">
                          <Clock3 size={12} />
                          {paymentLabel(order.payment_status)}
                        </span>
                      )}
                    </span>

                    <span className="flex shrink-0 flex-col items-end gap-2">
                      <strong className="whitespace-nowrap text-[13px] font-semibold text-brand-ink sm:text-sm">
                        {formatMoney(amount)}
                      </strong>
                      <ChevronDown
                        size={16}
                        className={`text-brand-ink/50 transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>

                  {open && <OrderDetails order={order} />}
                </article>
              );
            })}
          </div>
        )}

        {!loading && orders.length > 0 && (
          <p className="mt-3 text-[11px] text-brand-ink/45">
            Showing {visibleOrders.length} of {orders.length} orders.
            Order statuses refresh automatically.
          </p>
        )}
      </div>
    </Page>
  );
}
