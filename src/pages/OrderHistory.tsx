import { useEffect, useState } from "react";
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

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
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
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-brand-ink/55">
              MY ORDERS
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              Order history
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/70">
              View your previous Baura Bakers orders and open receipts.
            </p>
          </div>

          <Link
            to="/account"
            className="rounded-2xl border border-brand-ink/20 bg-white/55 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/75"
          >
            Back to account
          </Link>
        </header>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-sm text-brand-ink/70">
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-center">
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
          <div className="grid gap-4">
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
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      <span className="rounded-full bg-yellow-50 px-3 py-1 text-[11px] font-semibold text-yellow-800">
                        {order.payment_status}
                      </span>
                      <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-brand-ink/70">
                        {order.order_status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                    <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
                      DELIVERY ADDRESS
                    </p>
                    <p className="mt-1 text-sm text-brand-ink/75">
                      {order.delivery_address}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                    <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
                      PAYMENT METHOD
                    </p>
                    <p className="mt-1 text-sm text-brand-ink/75">
                      {order.payment_method || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to={`/receipt/${order.order_no}`}
                    className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95"
                  >
                    View receipt
                  </Link>

                  {order.delivery_location_url && (
                    <a
                      href={order.delivery_location_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-brand-ink/20 bg-white/55 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/75"
                    >
                      Open delivery location
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}