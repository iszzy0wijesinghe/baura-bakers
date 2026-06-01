import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import { supabase } from "../lib/supabase";

type AdminOrder = {
  id: string;
  order_no: string;
  customer_name: string;
  contact_number: string;
  customer_email: string | null;
  customer_address: string;
  delivery_address: string;
  delivery_location_url: string | null;
  subtotal_lkr: number;
  payment_status: string;
  order_status: string;
  payment_method: string | null;
  admin_note: string | null;
  note: string | null;
  created_at: string;
};

const paymentStatuses = [
  "PENDING_PAYMENT",
  "PAYMENT_STARTED",
  "PAID",
  "FAILED",
  "CANCELLED",
];

const orderStatuses = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
];

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function checkAdminAccess() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return false;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || profile?.role !== "admin") {
      navigate("/account");
      return false;
    }

    return true;
  }

  async function loadOrders() {
    setIsLoading(true);
    setErrorText("");

    const isAdmin = await checkAdminAccess();

    if (!isAdmin) return;

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_no, customer_name, contact_number, customer_email, customer_address, delivery_address, delivery_location_url, subtotal_lkr, payment_status, order_status, payment_method, admin_note, note, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorText(error.message);
    } else {
      setOrders((data || []) as AdminOrder[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateOrder(
    orderId: string,
    updates: Partial<Pick<AdminOrder, "payment_status" | "order_status" | "admin_note">>,
  ) {
    try {
      setSavingId(orderId);
      setErrorText("");

      const { error } = await supabase
        .from("orders")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        throw new Error(error.message);
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, ...updates } : order,
        ),
      );
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Could not update order.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Page>
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-brand-ink/55">
              ADMIN PORTAL
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              Orders
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/70">
              View WhatsApp and bank transfer orders. Manually update payment
              and preparation status.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="rounded-2xl border border-brand-ink/20 bg-white/55 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/75"
          >
            Refresh
          </button>
        </header>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-sm text-brand-ink/70">
            Loading admin orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-center">
            <h2 className="text-xl font-semibold text-brand-ink">
              No orders found
            </h2>
          </div>
        ) : (
          <div className="grid gap-5">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-3xl border border-black/10 bg-white/55 p-5 shadow-sm backdrop-blur"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
                      ORDER NO
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-brand-ink">
                      {order.order_no}
                    </h2>
                    <p className="mt-1 text-xs text-brand-ink/60">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-brand-ink">
                      {formatLkr(order.subtotal_lkr)}
                    </p>
                    <p className="mt-1 text-xs text-brand-ink/60">
                      {order.payment_method || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                    <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
                      CUSTOMER
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-ink">
                      {order.customer_name}
                    </p>
                    <p className="mt-1 text-xs text-brand-ink/70">
                      {order.contact_number}
                    </p>
                    {order.customer_email && (
                      <p className="mt-1 text-xs text-brand-ink/70">
                        {order.customer_email}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                    <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
                      DELIVERY
                    </p>
                    <p className="mt-1 text-sm text-brand-ink/75">
                      {order.delivery_address}
                    </p>
                    {order.delivery_location_url && (
                      <a
                        href={order.delivery_location_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-xs font-semibold text-brand-ink underline"
                      >
                        Open location
                      </a>
                    )}
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                    <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
                      CUSTOMER NOTE
                    </p>
                    <p className="mt-1 text-sm text-brand-ink/75">
                      {order.note || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
                      PAYMENT STATUS
                    </label>
                    <select
                      value={order.payment_status}
                      disabled={savingId === order.id}
                      onChange={(e) =>
                        updateOrder(order.id, {
                          payment_status: e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold text-brand-ink outline-none"
                    >
                      {paymentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
                      ORDER STATUS
                    </label>
                    <select
                      value={order.order_status}
                      disabled={savingId === order.id}
                      onChange={(e) =>
                        updateOrder(order.id, {
                          order_status: e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold text-brand-ink outline-none"
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
                    ADMIN NOTE
                  </label>
                  <textarea
                    value={order.admin_note || ""}
                    disabled={savingId === order.id}
                    onChange={(e) =>
                      setOrders((prev) =>
                        prev.map((x) =>
                          x.id === order.id
                            ? { ...x, admin_note: e.target.value }
                            : x,
                        ),
                      )
                    }
                    className="min-h-[80px] w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none"
                    placeholder="Internal note, slip confirmed, delivery update..."
                  />

                  <button
                    type="button"
                    disabled={savingId === order.id}
                    onClick={() =>
                      updateOrder(order.id, {
                        admin_note: order.admin_note || "",
                      })
                    }
                    className={[
                      "rounded-2xl px-4 py-2 text-xs font-semibold text-brand-bg",
                      savingId === order.id
                        ? "cursor-not-allowed bg-brand-ink/50"
                        : "bg-brand-ink hover:bg-brand-ink/95",
                    ].join(" ")}
                  >
                    {savingId === order.id ? "Saving..." : "Save admin note"}
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to={`/receipt/${order.order_no}`}
                    className="rounded-2xl border border-brand-ink/20 bg-white/55 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/75"
                  >
                    View receipt
                  </Link>

                  <a
                    href={`https://wa.me/${order.contact_number.replace(
                      /[^\d]/g,
                      "",
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95"
                  >
                    Contact customer
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}