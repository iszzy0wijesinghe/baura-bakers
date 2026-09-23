/** @format */

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Page from "../components/Page";
import { getCurrentUser, logout } from "../lib/auth";
import { getAdminDashboardStats } from "../lib/adminOrdersApi";

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
      try {
        const user = await getCurrentUser();

        if (!user) {
          navigate("/login");
          return;
        }

        if (user.role !== "admin") {
          navigate("/account");
          return;
        }

        setAdminName(user.name || "Admin");
        setStats(await getAdminDashboardStats());
      } catch (error) {
        setErrorText(
          error instanceof Error
            ? error.message
            : "Could not load the admin dashboard.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
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
            <p className="text-xs font-semibold tracking-[0.22em] text-brand-ink/55">
              ADMIN DASHBOARD
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-brand-ink sm:text-4xl">
              Welcome, {adminName}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/70">
              Manage orders, storefront content, products, promotions, delivery,
              and site controls from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100">
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

              <StatCard
                label="Pending payments"
                value={stats.pendingPayments}
              />

              <StatCard label="Paid orders" value={stats.paidOrders} />

              <StatCard label="Completed" value={stats.completedOrders} />
            </section>

            <section>
              <div className="mb-4">
                <p className="text-xs font-semibold tracking-[0.18em] text-brand-ink/50">
                  STOREFRONT
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.015em] text-brand-ink">
                  Website content
                </h2>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <AdminLinkCard
                  to="/admin/hero-slides"
                  eyebrow="HERO MANAGEMENT"
                  title="Home hero slides"
                  description="Create, edit, reorder, activate, and deactivate home page hero slides with Cloudinary artwork and custom wording."
                />

                <AdminLinkCard
                  to="/admin/products"
                  eyebrow="PRODUCT MANAGEMENT"
                  title="Products & categories"
                  description="Manage menu products, categories, subcategories, prices, availability, and product imagery."
                />

                <AdminLinkCard
                  to="/admin/promotions"
                  eyebrow="PROMOTION MANAGEMENT"
                  title="Offers & coupons"
                  description="Manage coupon codes, QR offers, happy-hour offers, and category or product campaigns."
                />

                <AdminLinkCard
                  to="/admin/site-settings"
                  eyebrow="SITE SETTINGS"
                  title="Site switch modes"
                  description="Control Coming Soon, Maintenance, and Critical Break modes for the storefront."
                />
              </div>
            </section>

            <section>
              <div className="mb-4">
                <p className="text-xs font-semibold tracking-[0.18em] text-brand-ink/50">
                  OPERATIONS
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.015em] text-brand-ink">
                  Orders & delivery
                </h2>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <AdminLinkCard
                  to="/admin/orders"
                  eyebrow="ORDER MANAGEMENT"
                  title="Manage orders"
                  description="View customer orders, review payments, and update preparation and fulfilment status."
                />

                <AdminLinkCard
                  to="/admin/delivery"
                  eyebrow="DELIVERY MANAGEMENT"
                  title="Delivery schedule"
                  description="Manage available delivery dates, morning and afternoon slots, pricing, and delivery settings."
                />
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
      <p className="text-xs font-semibold tracking-[0.14em] text-brand-ink/55">
        {label.toUpperCase()}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-brand-ink">
        {value}
      </p>
    </div>
  );
}

function AdminLinkCard({
  to,
  eyebrow,
  title,
  description,
}: {
  to: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-3xl border border-black/10 bg-white/60 p-6 text-brand-ink shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-brand-ink/55">
          {eyebrow}
        </p>

        <span
          className="text-lg text-brand-ink/45 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      </div>

      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-brand-ink">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-brand-ink/65">
        {description}
      </p>
    </Link>
  );
}
