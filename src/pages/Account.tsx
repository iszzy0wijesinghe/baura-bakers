import type { User } from "@supabase/supabase-js";
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
import { logout } from "../lib/auth";
import { supabase } from "../lib/supabase";

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
};

type OrderStats = {
  total: number;
  pending: number;
  paid: number;
  completed: number;
};

type OrderStatsRow = {
  payment_status: string;
  order_status: string;
};

export default function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");

  const [stats, setStats] = useState<OrderStats>({
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
    loadAccount();
  }, []);

  async function loadAccount() {
    setIsLoading(true);
    setErrorText("");
    setSuccessText("");

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .eq("id", currentUser.id)
      .single();

    if (profileError) {
      setErrorText(profileError.message);
      setIsLoading(false);
      return;
    }

    if (profileRow?.role === "admin") {
      navigate("/admin/dashboard");
      return;
    }

    const { data: orderRows } = await supabase
      .from("orders")
      .select("payment_status, order_status")
      .eq("user_id", currentUser.id);

    const rows = (orderRows || []) as OrderStatsRow[];

    setStats({
      total: rows.length,
      pending: rows.filter((x) => x.payment_status === "PENDING_PAYMENT")
        .length,
      paid: rows.filter((x) => x.payment_status === "PAID").length,
      completed: rows.filter((x) => x.order_status === "COMPLETED").length,
    });

    setUser(currentUser);
    setProfile(profileRow as ProfileRow);
    setFormName(profileRow?.full_name || "");
    setFormPhone(profileRow?.phone || "");
    setIsLoading(false);
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

      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          phone: cleanPhone || null,
        })
        .eq("id", user.id)
        .select("id, full_name, phone, role")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
          phone: cleanPhone,
        },
      });

      setProfile(updatedProfile as ProfileRow);
      setFormName(updatedProfile?.full_name || "");
      setFormPhone(updatedProfile?.phone || "");
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
        <div className="mx-auto max-w-3xl rounded-2xl border border-black/10 bg-white/70 p-4 text-sm font-semibold text-brand-ink/65 shadow-sm">
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
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-ink/45">
              Account
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-brand-ink">
              My profile
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        {successText && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {successText}
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-[1.6rem] border border-black/10 bg-white/75 p-4 shadow-[0_18px_45px_rgba(47,31,22,0.08)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-ink text-lg font-semibold text-brand-bg shadow-sm">
                  {initials || <UserRound size={23} />}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-brand-ink">
                    {displayName}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-medium text-brand-ink/55">
                    {user?.email}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-brand-bg px-3 py-1 text-[10px] font-semibold capitalize text-brand-ink/65">
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
              className="rounded-[1.6rem] border border-black/10 bg-white/75 p-4 shadow-[0_18px_45px_rgba(47,31,22,0.08)] backdrop-blur sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-ink/45">
                    Edit Details
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-brand-ink">
                    Personal information
                  </h2>
                </div>

                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-bg text-brand-ink">
                  <UserRound size={19} />
                </div>
              </div>

              <div className="mt-4 grid gap-3">
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

                <div className="rounded-2xl border border-black/10 bg-brand-bg/70 p-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/80 text-brand-ink">
                      <Mail size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-ink/45">
                        Email
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-brand-ink">
                        {user?.email}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-brand-ink/55">
                        Email is used for login and cannot be changed here.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className={[
                    "mt-1 flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-brand-bg transition",
                    isSaving
                      ? "cursor-not-allowed bg-brand-ink/50"
                      : "bg-brand-ink hover:bg-brand-ink/95",
                  ].join(" ")}
                >
                  <Save size={17} />
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.6rem] border border-black/10 bg-white/75 p-4 shadow-[0_18px_45px_rgba(47,31,22,0.08)] backdrop-blur sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-ink/45">
                Quick Actions
              </p>

              <div className="mt-4 grid gap-2">
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

            <div className="rounded-[1.6rem] border border-black/10 bg-white/75 p-4 shadow-[0_18px_45px_rgba(47,31,22,0.08)] backdrop-blur sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-ink/45">
                Order Summary
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <StatCard label="Total" value={stats.total} icon={ClipboardList} />
                <StatCard label="Pending" value={stats.pending} icon={Clock3} />
                <StatCard label="Paid" value={stats.paid} icon={CheckCircle2} />
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
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-ink/45">
        {label}
      </span>

      <span className="mt-1.5 flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-3 shadow-sm focus-within:border-brand-ink/30 focus-within:ring-2 focus-within:ring-brand-ink/10">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-bg text-brand-ink/70">
          <Icon size={16} />
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
        "group flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 transition",
        dark
          ? "border-brand-ink bg-brand-ink text-brand-bg hover:bg-brand-ink/95"
          : "border-black/10 bg-white text-brand-ink hover:bg-white/90",
      ].join(" ")}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={[
            "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
            dark ? "bg-brand-bg/10 text-brand-bg" : "bg-brand-bg text-brand-ink",
          ].join(" ")}
        >
          <Icon size={18} />
        </span>

        <span className="min-w-0">
          <span className="block text-sm font-semibold">{label}</span>
          <span
            className={[
              "block truncate text-xs",
              dark ? "text-brand-bg/60" : "text-brand-ink/50",
            ].join(" ")}
          >
            {description}
          </span>
        </span>
      </span>

      <ChevronRight
        size={17}
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
    <div className="rounded-2xl border border-black/10 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-ink/45">
          {label}
        </p>

        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-brand-bg text-brand-ink/65">
          <Icon size={14} />
        </span>
      </div>

      <p className="mt-2 text-xl font-semibold leading-none text-brand-ink">
        {value}
      </p>
    </div>
  );
}