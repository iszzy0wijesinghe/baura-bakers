/** @format */

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import Page from "../components/Page";

import {
  logout,
} from "../lib/auth";

import {
  useAuthSession,
} from "../lib/useAuthSession";

import {
  getAdminDashboardStats,
} from "../lib/adminOrdersApi";

type Stats = {
  totalOrders: number;
  pendingPayments: number;
  paidOrders: number;
  completedOrders: number;
};

type DashboardModule = {
  to: string;
  permission: string;
  eyebrow: string;
  title: string;
  description: string;
};

const storefrontModules: DashboardModule[] = [
  {
    to:
      "/admin/hero-slides",

    permission:
      "website-admin.hero-slides.read",

    eyebrow:
      "HERO MANAGEMENT",

    title:
      "Home hero slides",

    description:
      "View and manage home page hero slides, artwork, visibility, and presentation.",
  },

  {
    to:
      "/admin/products",

    permission:
      "website-admin.catalog.read",

    eyebrow:
      "PRODUCT MANAGEMENT",

    title:
      "Products & categories",

    description:
      "View and manage menu products, categories, subcategories, prices, availability, and product imagery.",
  },

  {
    to:
      "/admin/promotions",

    permission:
      "website-admin.promotions.read",

    eyebrow:
      "PROMOTION MANAGEMENT",

    title:
      "Offers & coupons",

    description:
      "View and manage coupon codes, offers, and product or category promotions.",
  },

  {
    to:
      "/admin/site-settings",

    permission:
      "website-admin.site-mode.read",

    eyebrow:
      "SITE SETTINGS",

    title:
      "Site switch modes",

    description:
      "View website operating mode and manage Coming Soon, Maintenance, and Critical Break states when permitted.",
  },
];

const operationsModules: DashboardModule[] = [
  {
    to:
      "/admin/orders",

    permission:
      "website-admin.orders.read",

    eyebrow:
      "ORDER MANAGEMENT",

    title:
      "Manage orders",

    description:
      "View customer orders, payments, preparation progress, and fulfilment information.",
  },

  {
    to:
      "/admin/delivery",

    permission:
      "website-admin.delivery.read",

    eyebrow:
      "DELIVERY MANAGEMENT",

    title:
      "Delivery schedule",

    description:
      "View delivery dates, slots, pricing, vehicle rules, and delivery configuration.",
  },
];

const administrationModules: DashboardModule[] = [
  {
    to:
      "/admin/users",

    permission:
      "website-admin.users.read",

    eyebrow:
      "USER MANAGEMENT",

    title:
      "Users & staff",

    description:
      "View customer and staff accounts, assigned roles, contact information, and account status.",
  },

  {
    to:
      "/admin/access",

    permission:
      "website-admin.roles.read",

    eyebrow:
      "ROLE MANAGEMENT",

    title:
      "Roles & permissions",

    description:
      "Manage staff roles and control the permissions assigned to each role.",
  },
];

export default function AdminDashboard() {
  const navigate =
    useNavigate();

  const {
    user,
    profile,
    isLoading:
      isAuthLoading,
    hasPermission,
  } = useAuthSession();

  const [
    stats,
    setStats,
  ] = useState<Stats>({
    totalOrders: 0,
    pendingPayments: 0,
    paidOrders: 0,
    completedOrders: 0,
  });

  const [
    isStatsLoading,
    setIsStatsLoading,
  ] = useState(false);

  const [
    errorText,
    setErrorText,
  ] = useState("");

  const canReadOrders =
    hasPermission(
      "website-admin.orders.read",
    );

  const visibleStorefrontModules =
    useMemo(
      () =>
        storefrontModules.filter(
          (module) =>
            hasPermission(
              module.permission,
            ),
        ),
      [hasPermission],
    );

  const visibleOperationsModules =
    useMemo(
      () =>
        operationsModules.filter(
          (module) =>
            hasPermission(
              module.permission,
            ),
        ),
      [hasPermission],
    );

  const visibleAdministrationModules =
    useMemo(
      () =>
        administrationModules.filter(
          (module) =>
            hasPermission(
              module.permission,
            ),
        ),
      [hasPermission],
    );

  useEffect(() => {
    if (
      isAuthLoading ||
      !user ||
      !canReadOrders
    ) {
      return;
    }

    let cancelled =
      false;

    async function loadStats() {
      setIsStatsLoading(
        true,
      );

      setErrorText("");

      try {
        const nextStats =
          await getAdminDashboardStats();

        if (!cancelled) {
          setStats(
            nextStats,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setErrorText(
            error instanceof Error
              ? error.message
              : "Could not load order statistics.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsStatsLoading(
            false,
          );
        }
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [
    user,
    canReadOrders,
    isAuthLoading,
  ]);

  async function handleLogout() {
    await logout();

    navigate("/");
  }

  if (isAuthLoading) {
    return (
      <Page>
        <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-sm text-brand-ink/70">
          Loading dashboard...
        </div>
      </Page>
    );
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
              Welcome,{" "}
              {user?.name ||
                "Staff"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/70">
              Access the website
              administration tools
              available to your account.
            </p>

            {profile?.roleLabel && (
              <div className="mt-4 inline-flex rounded-full border border-black/10 bg-white/65 px-3 py-1.5 text-xs font-semibold text-brand-ink/65">
                {
                  profile.roleLabel
                }
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              void handleLogout()
            }
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Logout
          </button>
        </header>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        {canReadOrders && (
          <section>
            <div className="mb-4">
              <p className="text-xs font-semibold tracking-[0.18em] text-brand-ink/50">
                ORDER OVERVIEW
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.015em] text-brand-ink">
                Current orders
              </h2>
            </div>

            {isStatsLoading ? (
              <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-sm text-brand-ink/70">
                Loading order
                statistics...
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total orders"
                  value={
                    stats.totalOrders
                  }
                />

                <StatCard
                  label="Pending payments"
                  value={
                    stats.pendingPayments
                  }
                />

                <StatCard
                  label="Paid orders"
                  value={
                    stats.paidOrders
                  }
                />

                <StatCard
                  label="Completed"
                  value={
                    stats.completedOrders
                  }
                />
              </div>
            )}
          </section>
        )}

        {visibleStorefrontModules.length >
          0 && (
          <DashboardSection
            eyebrow="STOREFRONT"
            title="Website content"
            modules={
              visibleStorefrontModules
            }
          />
        )}

        {visibleOperationsModules.length >
          0 && (
          <DashboardSection
            eyebrow="OPERATIONS"
            title="Orders & delivery"
            modules={
              visibleOperationsModules
            }
          />
        )}

        {visibleAdministrationModules.length >
          0 && (
          <DashboardSection
            eyebrow="ADMINISTRATION"
            title="Users & access"
            modules={
              visibleAdministrationModules
            }
          />
        )}

        {visibleStorefrontModules.length ===
          0 &&
          visibleOperationsModules.length ===
            0 &&
          visibleAdministrationModules.length ===
            0 && (
            <div className="rounded-3xl border border-black/10 bg-white/60 p-8">
              <p className="text-sm font-semibold text-brand-ink">
                No management tools are
                currently available to this
                account.
              </p>

              <p className="mt-2 text-sm leading-6 text-brand-ink/65">
                Your account can access
                website administration,
                but its assigned role does
                not currently include
                permission to view any
                management modules.
              </p>
            </div>
          )}
      </div>
    </Page>
  );
}

function DashboardSection({
  eyebrow,
  title,
  modules,
}: {
  eyebrow: string;
  title: string;
  modules: DashboardModule[];
}) {
  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-brand-ink/50">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-xl font-semibold tracking-[-0.015em] text-brand-ink">
          {title}
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {modules.map(
          (module) => (
            <AdminLinkCard
              key={
                module.to
              }
              to={
                module.to
              }
              eyebrow={
                module.eyebrow
              }
              title={
                module.title
              }
              description={
                module.description
              }
            />
          ),
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
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
      className="group rounded-3xl border border-black/10 bg-white/60 p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md"
    >
      <p className="text-xs font-semibold tracking-[0.16em] text-brand-ink/50">
        {eyebrow}
      </p>

      <h3 className="mt-3 text-lg font-semibold tracking-[-0.015em] text-brand-ink">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-brand-ink/65">
        {description}
      </p>

      <p className="mt-5 text-sm font-semibold text-brand-ink transition group-hover:translate-x-1">
        Open management →
      </p>
    </Link>
  );
}