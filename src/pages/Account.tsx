import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  LogOut,
  Mail,
  Phone,
  Save,
  ShoppingBag,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import {
  claimAccountOrders,
  getAccountSummary,
  updateAccountProfile,
  type AccountStats,
  type LaravelUser,
} from "../lib/accountApi";
import { logout } from "../lib/auth";
import { getBauraDeviceId } from "../lib/device";
import { LaravelApiError } from "../lib/laravelApi";

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  role: "customer" | "admin";
  default_delivery_address: string | null;
};

function toProfile(user: LaravelUser): ProfileRow {
  return {
    id: String(user.id),
    full_name: user.name,
    phone: user.phone,
    role: user.role,
    default_delivery_address: user.default_delivery_address,
  };
}

export default function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState<LaravelUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");

  const [stats, setStats] = useState<AccountStats>({
    total: 0,
    pending: 0,
    paid: 0,
    completed: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  useEffect(() => {
    void loadAccount();
  }, []);

  async function loadAccount() {
    setIsLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      await claimAccountOrders(getBauraDeviceId());
      const account = await getAccountSummary();

      if (account.user.role === "admin") {
        navigate("/admin/dashboard");
        return;
      }

      const nextProfile = toProfile(account.user);

      setUser(account.user);
      setProfile(nextProfile);
      setFormName(nextProfile.full_name);
      setFormPhone(nextProfile.phone || "");
      setStats(account.stats);
    } catch (error) {
      if (error instanceof LaravelApiError && error.status === 401) {
        navigate("/login");
        return;
      }

      setErrorText(
        error instanceof Error ? error.message : "Could not load account.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!user) return;

    const cleanName = formName.trim();
    const cleanPhone = formPhone.trim();

    if (!cleanName) {
      setErrorText("Please enter your full name.");
      setSuccessText("");
      return;
    }

    try {
      setIsSaving(true);
      setErrorText("");
      setSuccessText("");

      const updatedUser = await updateAccountProfile({
        name: cleanName,
        phone: cleanPhone || null,
        default_delivery_address:
          profile?.default_delivery_address || null,
      });

      const updatedProfile = toProfile(updatedUser);

      setUser(updatedUser);
      setProfile(updatedProfile);
      setFormName(updatedProfile.full_name);
      setFormPhone(updatedProfile.phone || "");
      setSuccessText("Profile updated successfully.");
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Could not update profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  if (isLoading) {
    return (
      <Page>
        <div className="mx-auto max-w-3xl rounded-2xl border border-black/10 bg-white/70 p-3 text-sm font-semibold text-brand-ink/65 shadow-sm sm:p-4">
          Loading your account...
        </div>
      </Page>
    );
  }

  const displayName = profile?.full_name || "Customer";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Page>
      <div className="mx-auto max-w-5xl space-y-3 pb-4 sm:space-y-4 sm:pb-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-ink/45 sm:text-[10px] sm:tracking-[0.26em]">
              Account
            </p>

            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-brand-ink sm:mt-1 sm:text-2xl">
              My profile
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-700 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-full sm:px-3 sm:py-2 sm:text-xs sm:font-semibold"
            aria-label="Logout"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 sm:px-4 sm:py-3">
            {errorText}
          </div>
        )}

        {successText && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700 sm:px-4 sm:py-3">
            {successText}
          </div>
        )}

        <section className="grid gap-3 sm:gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-[1.35rem] border border-black/10 bg-white/75 p-3 shadow-[0_14px_36px_rgba(47,31,22,0.07)] backdrop-blur sm:rounded-[1.6rem] sm:p-4 sm:shadow-[0_18px_45px_rgba(47,31,22,0.08)]">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-ink text-sm font-semibold text-brand-bg shadow-sm sm:h-14 sm:w-14 sm:text-lg">
                  {initials || <UserRound size={22} />}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-brand-ink sm:text-lg">
                    {displayName}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] font-medium text-brand-ink/55 sm:text-xs">
                    {user?.email}
                  </p>

                  <span className="mt-1.5 inline-flex rounded-full bg-brand-bg px-2.5 py-1 text-[9px] font-semibold capitalize text-brand-ink/65 sm:mt-2 sm:px-3 sm:text-[10px]">
                    {profile?.role || "customer"}
                  </span>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProfile();
              }}
              className="rounded-[1.35rem] border border-black/10 bg-white/75 p-3 shadow-[0_14px_36px_rgba(47,31,22,0.07)] backdrop-blur sm:rounded-[1.6rem] sm:p-5 sm:shadow-[0_18px_45px_rgba(47,31,22,0.08)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-ink/45 sm:text-[10px] sm:tracking-[0.22em]">
                    Edit Details
                  </p>

                  <h2 className="mt-0.5 text-base font-semibold text-brand-ink sm:mt-1 sm:text-lg">
                    Personal information
                  </h2>
                </div>

                <div className="hidden h-10 w-10 place-items-center rounded-2xl bg-brand-bg text-brand-ink sm:grid">
                  <UserRound size={19} />
                </div>
              </div>

              <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3">
                <ProfileInput
                  label="Full name"
                  icon={UserRound}
                  value={formName}
                  placeholder="Your full name"
                  onChange={setFormName}
                />

                <ProfileInput
                  label="Phone number"
                  icon={Phone}
                  value={formPhone}
                  placeholder="07X XXX XXXX"
                  onChange={setFormPhone}
                />

                <div className="rounded-2xl border border-black/10 bg-brand-bg/70 p-2.5 sm:p-3">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/80 text-brand-ink sm:h-9 sm:w-9">
                      <Mail size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-ink/45 sm:text-[10px] sm:tracking-[0.2em]">
                        Email
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-brand-ink">
                        {user?.email}
                      </p>

                      <p className="mt-1 text-[11px] leading-relaxed text-brand-ink/55 sm:text-xs">
                        Email is used for login and cannot be changed here.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className={[
                    "mt-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-brand-bg transition sm:px-5 sm:py-3",
                    isSaving
                      ? "cursor-not-allowed bg-brand-ink/50"
                      : "bg-brand-ink hover:bg-brand-ink/95",
                  ].join(" ")}
                >
                  <Save size={16} />
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-3 sm:space-y-4">
            <div className="rounded-[1.35rem] border border-black/10 bg-white/75 p-3 shadow-[0_14px_36px_rgba(47,31,22,0.07)] backdrop-blur sm:rounded-[1.6rem] sm:p-5 sm:shadow-[0_18px_45px_rgba(47,31,22,0.08)]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-ink/45 sm:text-[10px] sm:tracking-[0.22em]">
                Quick Actions
              </p>

              <div className="mt-3 grid gap-2 sm:mt-4">
                <ActionLink
                  to="/orders"
                  label="My orders"
                  description="Track recent orders"
                  icon={ClipboardList}
                  dark
                />

                <ActionLink
                  to="/menu"
                  label="Browse menu"
                  description="Choose fresh bakes"
                  icon={ShoppingBag}
                />

                <ActionLink
                  to="/cart"
                  label="View cart"
                  description="Continue checkout"
                  icon={ShoppingCart}
                />
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-black/10 bg-white/75 p-3 shadow-[0_14px_36px_rgba(47,31,22,0.07)] backdrop-blur sm:rounded-[1.6rem] sm:p-5 sm:shadow-[0_18px_45px_rgba(47,31,22,0.08)]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-ink/45 sm:text-[10px] sm:tracking-[0.22em]">
                Order Summary
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4">
                <StatCard
                  label="Total"
                  value={stats.total}
                  icon={ClipboardList}
                />

                <StatCard label="Pending" value={stats.pending} icon={Clock3} />

                <StatCard
                  label="Paid"
                  value={stats.paid}
                  icon={CheckCircle2}
                />

                <StatCard
                  label="Completed"
                  value={stats.completed}
                  icon={CheckCircle2}
                />
              </div>
            </div>
          </aside>
        </section>
      </div>
    </Page>
  );
}

function ProfileInput({
  label,
  icon: Icon,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-ink/45 sm:text-[10px] sm:tracking-[0.2em]">
        {label}
      </span>

      <span className="mt-1.5 flex items-center gap-2.5 rounded-2xl border border-black/10 bg-white px-2.5 py-2.5 shadow-sm focus-within:border-brand-ink/30 focus-within:ring-2 focus-within:ring-brand-ink/10 sm:gap-3 sm:px-3 sm:py-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-brand-bg text-brand-ink/70 sm:h-8 sm:w-8">
          <Icon size={15} />
        </span>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-brand-ink outline-none placeholder:text-brand-ink/35"
          placeholder={placeholder}
        />
      </span>
    </label>
  );
}

function ActionLink({
  to,
  label,
  description,
  icon: Icon,
  dark = false,
}: {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  dark?: boolean;
}) {
  return (
    <Link
      to={to}
      className={[
        "group flex items-center justify-between gap-2.5 rounded-2xl border px-2.5 py-2.5 transition sm:gap-3 sm:px-3 sm:py-3",
        dark
          ? "border-brand-ink bg-brand-ink text-brand-bg hover:bg-brand-ink/95"
          : "border-black/10 bg-white text-brand-ink hover:bg-white/90",
      ].join(" ")}
    >
      <span className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <span
          className={[
            "grid h-9 w-9 shrink-0 place-items-center rounded-2xl sm:h-10 sm:w-10",
            dark ? "bg-brand-bg/10 text-brand-bg" : "bg-brand-bg text-brand-ink",
          ].join(" ")}
        >
          <Icon size={17} />
        </span>

        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-tight">
            {label}
          </span>

          <span
            className={[
              "mt-0.5 block truncate text-[11px] sm:text-xs",
              dark ? "text-brand-bg/60" : "text-brand-ink/50",
            ].join(" ")}
          >
            {description}
          </span>
        </span>
      </span>

      <ChevronRight
        size={16}
        className={dark ? "text-brand-bg/70" : "text-brand-ink/35"}
      />
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-2.5 sm:p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-ink/45 sm:text-[10px] sm:tracking-[0.14em]">
          {label}
        </p>

        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand-bg text-brand-ink/65 sm:h-7 sm:w-7 sm:rounded-xl">
          <Icon size={13} />
        </span>
      </div>

      <p className="mt-1.5 text-lg font-semibold leading-none text-brand-ink sm:mt-2 sm:text-xl">
        {value}
      </p>
    </div>
  );
}