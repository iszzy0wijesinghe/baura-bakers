import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Page from "../components/Page";
import { supabase } from "../lib/supabase";
import { logout } from "../lib/auth";

type Stats = {
  totalOrders: number;
  pendingPayments: number;
  paidOrders: number;
  completedOrders: number;
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [adminName, setAdminName] = useState("Admin");
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingPayments: 0,
    paidOrders: 0,
    completedOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        navigate("/account");
        return;
      }

      setAdminName(profile.full_name || "Admin");

      const { data: orders, error } = await supabase
        .from("orders")
        .select("payment_status, order_status");

      if (error) {
        setErrorText(error.message);
        setIsLoading(false);
        return;
      }

      const rows = orders || [];

      setStats({
        totalOrders: rows.length,
        pendingPayments: rows.filter(
          (x) => x.payment_status === "PENDING_PAYMENT",
        ).length,
        paidOrders: rows.filter((x) => x.payment_status === "PAID").length,
        completedOrders: rows.filter((x) => x.order_status === "COMPLETED")
          .length,
      });

      setIsLoading(false);
    }

    loadDashboard();
  }, [navigate]);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <Page>
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-brand-ink/55">
              ADMIN DASHBOARD
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              Welcome, {adminName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/70">
              Manage customer orders, payment confirmations, and delivery
              preparation from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Logout
          </button>
        </header>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-sm text-brand-ink/70">
            Loading dashboard...
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total orders" value={stats.totalOrders} />
              <StatCard label="Pending payments" value={stats.pendingPayments} />
              <StatCard label="Paid orders" value={stats.paidOrders} />
              <StatCard label="Completed" value={stats.completedOrders} />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Link
                to="/admin/orders"
                className="rounded-3xl border border-black/10 bg-white/60 p-6 shadow-sm transition hover:bg-white/75"
              >
                <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
                  ORDER MANAGEMENT
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-brand-ink">
                  Manage orders
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-brand-ink/65">
                  View WhatsApp/bank transfer orders, mark payments as paid, and
                  update preparation status.
                </p>
              </Link>

              <div className="rounded-3xl border border-black/10 bg-white/60 p-6 shadow-sm">
                <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
                  NEXT MODULE
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-brand-ink">
                  Products & reports
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-brand-ink/65">
                  Product management and sales reports can be added after order
                  management is stable.
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </Page>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/60 p-5 shadow-sm">
      <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
        {label.toUpperCase()}
      </p>
      <p className="mt-3 text-3xl font-semibold text-brand-ink">{value}</p>
    </div>
  );
}