import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import { supabase } from "../lib/supabase";

type OrderItemRow = {
  id: string;
  product_name: string;
  size_label: string;
  sugar_level: string;
  quantity: number;
  unit_price_lkr: number;
  line_total_lkr: number;
};

type AdminOrder = {
  id: string;
  order_no: string;
  customer_name: string;
  customer_email: string | null;
  contact_number: string;
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
  order_items?: OrderItemRow[];
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

function toWhatsappPhone(value: string) {
  const digits = value.replace(/[^\d]/g, "");

  if (digits.startsWith("0")) {
    return `94${digits.slice(1)}`;
  }

  return digits;
}

function getStatusClass(status: string) {
  switch (status) {
    case "PAID":
    case "COMPLETED":
    case "READY":
      return "bg-green-50 text-green-700 border-green-200";
    case "PENDING_PAYMENT":
    case "NEW":
    case "PREPARING":
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case "FAILED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    case "CONFIRMED":
    case "PAYMENT_STARTED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-white/70 text-brand-ink/70 border-black/10";
  }
}

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [orderFilter, setOrderFilter] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState("");

  async function verifyAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      navigate("/account");
      return false;
    }

    return true;
  }

  async function loadOrders() {
    setIsLoading(true);
    setErrorText("");

    const isAdmin = await verifyAdmin();
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_no,
        customer_name,
        customer_email,
        contact_number,
        customer_address,
        delivery_address,
        delivery_location_url,
        subtotal_lkr,
        payment_status,
        order_status,
        payment_method,
        admin_note,
        note,
        created_at,
        order_items (
          id,
          product_name,
          size_label,
          sugar_level,
          quantity,
          unit_price_lkr,
          line_total_lkr
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorText(error.message);
      setIsLoading(false);
      return;
    }

    const rows = (data || []) as AdminOrder[];
    setOrders(rows);

    if (!selectedId && rows.length > 0) {
      setSelectedId(rows[0].id);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesPayment =
        paymentFilter === "ALL" || order.payment_status === paymentFilter;

      const matchesOrder =
        orderFilter === "ALL" || order.order_status === orderFilter;

      const text = [
        order.order_no,
        order.customer_name,
        order.customer_email || "",
        order.contact_number,
        order.delivery_address,
        order.payment_method || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || text.includes(q);

      return matchesPayment && matchesOrder && matchesSearch;
    });
  }, [orders, searchText, paymentFilter, orderFilter]);

  const selectedOrder = useMemo(() => {
    return (
      orders.find((order) => order.id === selectedId) ||
      filteredOrders[0] ||
      null
    );
  }, [orders, selectedId, filteredOrders]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((x) => x.payment_status === "PENDING_PAYMENT")
        .length,
      paid: orders.filter((x) => x.payment_status === "PAID").length,
      completed: orders.filter((x) => x.order_status === "COMPLETED").length,
    };
  }, [orders]);

  async function updateOrder(
    orderId: string,
    updates: Partial<
      Pick<AdminOrder, "payment_status" | "order_status" | "admin_note">
    >,
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
      <div className="space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/55 p-6 shadow-sm backdrop-blur lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-brand-ink/55">
              ADMIN ORDERS
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              Manage orders
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/70">
              Search customer orders, confirm bank transfers, update preparation
              status, and view delivery details.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/dashboard"
              className="rounded-2xl border border-brand-ink/20 bg-white/60 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/80"
            >
              Dashboard
            </Link>

            <button
              type="button"
              onClick={loadOrders}
              className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95"
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStat label="Total orders" value={stats.total} />
          <AdminStat label="Pending payment" value={stats.pending} />
          <AdminStat label="Paid" value={stats.paid} />
          <AdminStat label="Completed" value={stats.completed} />
        </section>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        <section className="rounded-3xl border border-black/10 bg-white/55 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-sm text-brand-ink outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
              placeholder="Search order no, customer, phone, email, delivery..."
            />

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-sm font-semibold text-brand-ink outline-none"
            >
              <option value="ALL">All payments</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
              className="rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-sm font-semibold text-brand-ink outline-none"
            >
              <option value="ALL">All order status</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-sm text-brand-ink/70">
            Loading orders...
          </div>
        ) : (
          <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-black/10 bg-white/55 shadow-sm backdrop-blur">
              <div className="border-b border-black/10 px-5 py-4">
                <p className="text-sm font-semibold text-brand-ink">
                  Orders list
                </p>
                <p className="mt-1 text-xs text-brand-ink/55">
                  Showing {filteredOrders.length} of {orders.length}
                </p>
              </div>

              <div className="max-h-[720px] overflow-y-auto p-3">
                {filteredOrders.length === 0 ? (
                  <div className="rounded-2xl border border-black/10 bg-white/60 p-6 text-center">
                    <p className="text-sm font-semibold text-brand-ink">
                      No matching orders
                    </p>
                    <p className="mt-1 text-xs text-brand-ink/55">
                      Try changing the search or filters.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {filteredOrders.map((order) => {
                      const active = selectedOrder?.id === order.id;

                      return (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => setSelectedId(order.id)}
                          className={[
                            "rounded-2xl border p-4 text-left transition",
                            active
                              ? "border-brand-ink/30 bg-brand-bg shadow-sm"
                              : "border-black/10 bg-white/60 hover:bg-white/80",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-brand-ink">
                                {order.order_no}
                              </p>
                              <p className="mt-1 truncate text-xs text-brand-ink/65">
                                {order.customer_name} · {order.contact_number}
                              </p>
                              <p className="mt-1 text-[11px] text-brand-ink/50">
                                {formatDate(order.created_at)}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-semibold text-brand-ink">
                              {formatLkr(order.subtotal_lkr)}
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={[
                                "rounded-full border px-3 py-1 text-[10px] font-semibold",
                                getStatusClass(order.payment_status),
                              ].join(" ")}
                            >
                              {order.payment_status}
                            </span>

                            <span
                              className={[
                                "rounded-full border px-3 py-1 text-[10px] font-semibold",
                                getStatusClass(order.order_status),
                              ].join(" ")}
                            >
                              {order.order_status}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <OrderDetailsPanel
              order={selectedOrder}
              savingId={savingId}
              onUpdate={updateOrder}
            />
          </section>
        )}
      </div>
    </Page>
  );
}

function AdminStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/55 p-5 shadow-sm backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-ink/50">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-brand-ink">{value}</p>
    </div>
  );
}

function OrderDetailsPanel({
  order,
  savingId,
  onUpdate,
}: {
  order: AdminOrder | null;
  savingId: string | null;
  onUpdate: (
    orderId: string,
    updates: Partial<
      Pick<AdminOrder, "payment_status" | "order_status" | "admin_note">
    >,
  ) => void;
}) {
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    setNoteDraft(order?.admin_note || "");
  }, [order?.id]);

  if (!order) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-center shadow-sm backdrop-blur">
        <p className="text-sm font-semibold text-brand-ink">
          Select an order
        </p>
        <p className="mt-1 text-xs text-brand-ink/55">
          Order details will appear here.
        </p>
      </div>
    );
  }

  const isSaving = savingId === order.id;
  const whatsappPhone = toWhatsappPhone(order.contact_number);

  return (
    <div className="rounded-3xl border border-black/10 bg-white/55 shadow-sm backdrop-blur">
      <div className="border-b border-black/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-brand-ink/55">
              ORDER DETAILS
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-brand-ink">
              {order.order_no}
            </h2>
            <p className="mt-1 text-xs text-brand-ink/55">
              {formatDate(order.created_at)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xl font-semibold text-brand-ink">
              {formatLkr(order.subtotal_lkr)}
            </p>
            <p className="mt-1 text-xs text-brand-ink/55">
              {order.payment_method || "Manual order"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard
            label="Customer"
            value={order.customer_name}
            subValue={`${order.contact_number}${
              order.customer_email ? ` · ${order.customer_email}` : ""
            }`}
          />

          <InfoCard
            label="Customer note"
            value={order.note || "-"}
            subValue="Shown from checkout form"
          />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
          <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
            DELIVERY ADDRESS
          </p>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink/75">
            {order.delivery_address}
          </p>

          {order.delivery_location_url && (
            <a
              href={order.delivery_location_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-full border border-brand-ink/20 bg-white/70 px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-white"
            >
              Open delivery location
            </a>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
              PAYMENT STATUS
            </label>
            <select
              value={order.payment_status}
              disabled={isSaving}
              onChange={(e) =>
                onUpdate(order.id, {
                  payment_status: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-sm font-semibold text-brand-ink outline-none"
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
              disabled={isSaving}
              onChange={(e) =>
                onUpdate(order.id, {
                  order_status: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-sm font-semibold text-brand-ink outline-none"
            >
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
          <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
            ORDER ITEMS
          </p>

          <div className="mt-3 divide-y divide-black/10">
            {(order.order_items || []).map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-ink">
                    {item.product_name}
                  </p>
                  <p className="mt-1 text-xs text-brand-ink/55">
                    {item.size_label} · {item.sugar_level} · Qty {item.quantity}
                  </p>
                </div>

                <p className="text-sm font-semibold text-brand-ink">
                  {formatLkr(item.line_total_lkr)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
            ADMIN NOTE
          </label>
          <textarea
            value={noteDraft}
            disabled={isSaving}
            onChange={(e) => setNoteDraft(e.target.value)}
            className="min-h-[110px] w-full rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
            placeholder="Slip received, delivery instruction, customer called..."
          />

          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              onUpdate(order.id, {
                admin_note: noteDraft,
              })
            }
            className={[
              "rounded-2xl px-4 py-2 text-xs font-semibold text-brand-bg",
              isSaving
                ? "cursor-not-allowed bg-brand-ink/50"
                : "bg-brand-ink hover:bg-brand-ink/95",
            ].join(" ")}
          >
            {isSaving ? "Saving..." : "Save note"}
          </button>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-black/10 pt-5">
          <a
            href={`https://wa.me/${whatsappPhone}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95"
          >
            WhatsApp customer
          </a>

          <a
            href={`tel:${order.contact_number}`}
            className="rounded-2xl border border-brand-ink/20 bg-white/60 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/80"
          >
            Call customer
          </a>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
      <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-brand-ink">{value}</p>
      {subValue && <p className="mt-1 text-xs text-brand-ink/55">{subValue}</p>}
    </div>
  );
}