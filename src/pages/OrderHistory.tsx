import { useEffect, useState, type ReactElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import { supabase } from "../lib/supabase";

type OrderRow = {
  id: string;
  order_no: string;
  customer_name: string;
  contact_number: string;
  customer_address: string;
  delivery_address: string;
  delivery_location_url: string | null;
  subtotal_lkr: number;
  payment_status: string;
  order_status: string;
  payment_method: string | null;
  created_at: string;
};

type StepIconProps = {
  active: boolean;
  done: boolean;
};

type OrderStep = {
  status: string;
  label: string;
  shortLabel: string;
  Icon: (props: StepIconProps) => ReactElement;
};

function ConfirmedIcon({ active, done }: StepIconProps) {
  return (
    <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        className={done || active ? "opacity-100" : "opacity-55"}
        d="M32 6c14.4 0 26 11.6 26 26S46.4 58 32 58 6 46.4 6 32 17.6 6 32 6Zm-3.1 36.2 16-16a3 3 0 0 0-4.2-4.2L26.8 35.9l-5.5-5.5a3 3 0 0 0-4.2 4.2l7.6 7.6a3 3 0 0 0 4.2 0Z"
      />
    </svg>
  );
}

function OvenIcon({ active, done }: StepIconProps) {
  return (
    <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden="true">
      <path
        fill="currentColor"
        className={done || active ? "opacity-100" : "opacity-55"}
        d="M13 17h38a6 6 0 0 1 6 6v25a6 6 0 0 1-6 6H13a6 6 0 0 1-6-6V23a6 6 0 0 1 6-6Zm4 10v17h30V27H17Zm32 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-29 10a2 2 0 1 0 0 4h24a2 2 0 1 0 0-4H20Z"
      />

      <path
        fill="currentColor"
        className={active ? "opacity-95 animate-pulse" : "opacity-80"}
        d="M31.2 41c-5-2.8-6.4-7.2-4.3-11.1 1.3-2.4 3.1-3.7 4.2-7 .3-.9 1.6-.9 2 0 1 2.2.8 4.3.3 6.1 1.8-1.1 3-2.8 3.5-4.9.2-.9 1.3-1.1 1.9-.4 3.6 4.5 4.1 10 1.3 14-1.9 2.8-5 4-8.9 3.3Z"
      />

      {active && (
        <path
          fill="currentColor"
          className="opacity-35 animate-pulse"
          d="M22 26h20a2 2 0 0 1 2 2v14H20V28a2 2 0 0 1 2-2Z"
        />
      )}
    </svg>
  );
}

function ReadyIcon({ active, done }: StepIconProps) {
  return (
    <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        className={done || active ? "opacity-100" : "opacity-55"}
        d="M12 25h40v24a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V25Zm-2-10h44a4 4 0 0 1 4 4v6H6v-6a4 4 0 0 1 4-4Zm18 0h8v40h-8V15Zm-9-6c4.1 0 7.4 2.4 9 6h-9a6 6 0 0 1 0-12c4.2 0 7.5 2.6 9 6a10.7 10.7 0 0 0-9 0Zm26 0a6 6 0 0 1 0 12h-9c1.6-3.6 4.9-6 9-6Z"
      />

      {active && (
        <path
          fill="currentColor"
          className="opacity-30 animate-pulse"
          d="M8 20h48v5H8v-5Z"
        />
      )}
    </svg>
  );
}

function DispatchIcon({ active, done }: StepIconProps) {
  return (
    <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden="true">
      <path
        fill="currentColor"
        className={done || active ? "opacity-100" : "opacity-55"}
        d="M6 30h31a5 5 0 0 1 5 5v10h3.6a9 9 0 0 1 17.1 4H61a9 9 0 0 1-18 0H25a9 9 0 0 1-18 0H5a3 3 0 0 1-3-3v-9a7 7 0 0 1 4-6.3V30Zm5 6a3 3 0 0 0-3 3v6h.7a9 9 0 0 1 16.6 0H36v-9H11Zm35 2v7h.7a9 9 0 0 1 14.6 0h1.2l-2.7-5.1A4 4 0 0 0 56.2 38H46ZM16 45a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm36 0a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
      />

      {active && (
        <path
          fill="currentColor"
          className="opacity-35 animate-pulse"
          d="M3 25h17a2 2 0 0 1 0 4H3a2 2 0 0 1 0-4Zm5-8h21a2 2 0 0 1 0 4H8a2 2 0 0 1 0-4Z"
        />
      )}
    </svg>
  );
}

function CompletedIcon({ active, done }: StepIconProps) {
  return (
    <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        className={done || active ? "opacity-100" : "opacity-55"}
        d="M32 4 39 23l20 7-20 7-7 23-7-23-20-7 20-7 7-19Zm18 39 2.8 7.2L60 53l-7.2 2.8L50 63l-2.8-7.2L40 53l7.2-2.8L50 43ZM13 41l2.2 5.8L21 49l-5.8 2.2L13 57l-2.2-5.8L5 49l5.8-2.2L13 41Z"
      />

      {active && (
        <path
          fill="currentColor"
          className="opacity-35 animate-pulse"
          d="M32 13 36.5 25.5 49 30l-12.5 4.5L32 49l-4.5-14.5L15 30l12.5-4.5L32 13Z"
        />
      )}
    </svg>
  );
}

const orderSteps: OrderStep[] = [
  {
    status: "CONFIRMED",
    label: "Order Confirmed",
    shortLabel: "Confirmed",
    Icon: ConfirmedIcon,
  },
  {
    status: "PREPARING",
    label: "Preparing in hot oven",
    shortLabel: "Preparing",
    Icon: OvenIcon,
  },
  {
    status: "READY",
    label: "Packed & Ready",
    shortLabel: "Ready",
    Icon: ReadyIcon,
  },
  {
    status: "DISPATCHED",
    label: "Order Dispatched",
    shortLabel: "Dispatched",
    Icon: DispatchIcon,
  },
  {
    status: "COMPLETED",
    label: "Completed",
    shortLabel: "Completed",
    Icon: CompletedIcon,
  },
];

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function getStepIndex(status: string) {
  return orderSteps.findIndex((step) => step.status === status);
}

function getPaymentClass(status: string) {
  switch (status) {
    case "PAID":
      return "border-green-200 bg-green-50 text-green-700";
    case "FAILED":
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";
    case "PAYMENT_STARTED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-yellow-200 bg-yellow-50 text-yellow-800";
  }
}

function getOrderStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "border-green-200 bg-green-50 text-green-700";
    case "DISPATCHED":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "READY":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CONFIRMED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "PREPARING":
      return "border-yellow-200 bg-yellow-50 text-yellow-800";
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-black/10 bg-white/70 text-brand-ink/65";
  }
}

function canViewReceipt(order: OrderRow) {
  return (
    order.payment_status === "PAID" &&
    ["CONFIRMED", "PREPARING", "READY", "DISPATCHED", "COMPLETED"].includes(
      order.order_status,
    )
  );
}

function OrderProgressStepper({ status }: { status: string }) {
  const currentIndex = getStepIndex(status);

  if (status === "CANCELLED") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
        This order has been cancelled.
      </div>
    );
  }

  if (currentIndex < 0) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-800">
        Waiting for Baura Bakers to confirm your order.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-ink/10 bg-white/55 px-3 py-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold tracking-[0.22em] text-brand-ink/45">
          ORDER PROGRESS
        </p>

        <p className="rounded-full bg-brand-bg/80 px-2.5 py-1 text-[11px] font-semibold text-brand-ink/75">
          {orderSteps[currentIndex]?.label}
        </p>
      </div>

      <div className="grid grid-cols-5 items-start gap-1">
        {orderSteps.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const pending = index > currentIndex;
          const Icon = step.Icon;

          return (
            <div key={step.status} className="relative text-center">
              {index > 0 && (
                <div
                  className={[
                    "absolute right-1/2 top-[18px] h-[3px] w-full -translate-y-1/2 rounded-full",
                    index <= currentIndex
                      ? "bg-brand-ink/65"
                      : "bg-brand-ink/15",
                  ].join(" ")}
                />
              )}

              <div
                className={[
                  "relative z-10 mx-auto grid h-9 w-9 place-items-center rounded-2xl transition-all duration-300",
                  done
                    ? "bg-brand-ink text-brand-bg shadow-sm"
                    : active
                      ? "scale-105 bg-brand-bg text-brand-ink shadow-md ring-1 ring-brand-ink/20"
                      : "bg-white text-brand-ink/50 ring-1 ring-brand-ink/15",
                ].join(" ")}
              >
                {active && (
                  <span className="absolute inset-0 rounded-2xl bg-brand-ink/10 animate-ping" />
                )}

                <span
                  className={[
                    "relative z-10 grid place-items-center",
                    active ? "animate-pulse" : "",
                  ].join(" ")}
                >
                  <Icon active={active} done={done} />
                </span>
              </div>

              <p
                className={[
                  "mt-1.5 text-[9.5px] font-semibold leading-tight",
                  done || active ? "text-brand-ink" : "text-brand-ink/55",
                ].join(" ")}
              >
                {pending ? "Pending" : step.shortLabel}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderHistory() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadOrders() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_no, customer_name, contact_number, customer_address, delivery_address, delivery_location_url, subtotal_lkr, payment_status, order_status, payment_method, created_at",
        )
        .order("created_at", { ascending: false });

      if (error) {
        setErrorText(error.message);
      } else {
        setOrders((data || []) as OrderRow[]);
      }

      setIsLoading(false);
    }

    loadOrders();
  }, [navigate]);

  return (
    <Page>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-brand-ink/55">
              MY ORDERS
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">
              Order history
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-brand-ink/65">
              Track your recent Baura Bakers orders and open receipts.
            </p>
          </div>
        </header>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-black/10 bg-white/55 p-5 text-sm text-brand-ink/70">
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white/55 p-7 text-center">
            <h2 className="text-xl font-semibold text-brand-ink">
              No orders yet
            </h2>

            <p className="mt-2 text-sm text-brand-ink/65">
              Your future orders will appear here after checkout.
            </p>

            <Link
              to="/menu"
              className="mt-5 inline-flex rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95"
            >
              Browse menu
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-black/10 bg-white/55 p-4 shadow-sm backdrop-blur"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-brand-ink">
                        {order.order_no}
                      </h2>

                      <span
                        className={[
                          "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                          getOrderStatusClass(order.order_status),
                        ].join(" ")}
                      >
                        {formatStatus(order.order_status)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-brand-ink/55">
                      {formatDate(order.created_at)}
                    </p>

                    <p className="mt-1 line-clamp-1 text-xs text-brand-ink/65">
                      {order.delivery_address}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-semibold text-brand-ink">
                      {formatLkr(order.subtotal_lkr)}
                    </p>

                    <span
                      className={[
                        "mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                        getPaymentClass(order.payment_status),
                      ].join(" ")}
                    >
                      {formatStatus(order.payment_status)}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <OrderProgressStepper status={order.order_status} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {canViewReceipt(order) && (
                    <Link
                      to={`/receipt/${order.order_no}`}
                      className="rounded-xl bg-brand-ink px-4 py-2 text-xs font-semibold text-brand-bg hover:bg-brand-ink/95"
                    >
                      View receipt
                    </Link>
                  )}

                  {order.delivery_location_url && (
                    <a
                      href={order.delivery_location_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-brand-ink/20 bg-white/55 px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-white/75"
                    >
                      Delivery location
                    </a>
                  )}

                  <span className="text-xs text-brand-ink/45">
                    {order.payment_method || "Manual order"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
