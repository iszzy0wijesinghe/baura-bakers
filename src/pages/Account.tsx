import type { User } from "@supabase/supabase-js";
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

    const rows = orderRows || [];

    setStats({
      total: rows.length,
      pending: rows.filter((x) => x.payment_status === "PENDING_PAYMENT").length,
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

    try {
      setIsSaving(true);
      setErrorText("");
      setSuccessText("");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formName.trim(),
          phone: formPhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      await supabase.auth.updateUser({
        data: {
          full_name: formName.trim(),
          phone: formPhone.trim(),
        },
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: formName.trim(),
              phone: formPhone.trim() || null,
            }
          : prev,
      );

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
        <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-sm text-brand-ink/70 shadow-sm backdrop-blur">
          Loading your profile...
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-3xl border border-black/10 bg-white/55 shadow-sm backdrop-blur">
          <div className="bg-brand-ink px-6 py-8 text-brand-bg sm:px-8">
            <p className="text-xs font-semibold tracking-[0.3em] text-brand-bg/70">
              MY BAURA ACCOUNT
            </p>

            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Welcome, {profile?.full_name || "Customer"}
                </h1>
                <p className="mt-2 text-sm text-brand-bg/75">
                  Manage your profile details and track your bakery orders.
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-bg/60">
                  Role
                </p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {profile?.role || "customer"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
            <ProfileStat label="Total orders" value={stats.total} />
            <ProfileStat label="Pending payments" value={stats.pending} />
            <ProfileStat label="Paid orders" value={stats.paid} />
            <ProfileStat label="Completed" value={stats.completed} />
          </div>
        </section>

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

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-black/10 bg-white/55 p-6 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold tracking-[0.25em] text-brand-ink/55">
              PROFILE DETAILS
            </p>

            <div className="mt-5 grid gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
                  FULL NAME
                </label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
                  PHONE NUMBER
                </label>
                <input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
                  placeholder="07X XXX XXXX"
                />
              </div>

              <div className="rounded-2xl border border-black/10 bg-brand-bg/70 p-4">
                <p className="text-xs font-semibold tracking-widest text-brand-ink/50">
                  EMAIL
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-ink">
                  {user?.email}
                </p>
                <p className="mt-1 text-xs text-brand-ink/55">
                  Email is used for login and order history.
                </p>
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveProfile}
                className={[
                  "rounded-2xl px-5 py-3 text-sm font-semibold text-brand-bg transition",
                  isSaving
                    ? "cursor-not-allowed bg-brand-ink/50"
                    : "bg-brand-ink hover:bg-brand-ink/95",
                ].join(" ")}
              >
                {isSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-black/10 bg-white/55 p-6 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold tracking-[0.25em] text-brand-ink/55">
                QUICK ACTIONS
              </p>

              <div className="mt-5 grid gap-3">
                <Link
                  to="/orders"
                  className="rounded-2xl bg-brand-ink px-5 py-3 text-center text-sm font-semibold text-brand-bg transition hover:bg-brand-ink/95"
                >
                  My orders
                </Link>

                <Link
                  to="/menu"
                  className="rounded-2xl border border-brand-ink/20 bg-white/60 px-5 py-3 text-center text-sm font-semibold text-brand-ink transition hover:bg-white/80"
                >
                  Browse menu
                </Link>

                <Link
                  to="/cart"
                  className="rounded-2xl border border-brand-ink/20 bg-white/60 px-5 py-3 text-center text-sm font-semibold text-brand-ink transition hover:bg-white/80"
                >
                  View cart
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-brand-bg/70 p-6">
              <p className="text-sm font-semibold text-brand-ink">
                Order note
              </p>
              <p className="mt-2 text-sm leading-relaxed text-brand-ink/65">
                Bank transfer and WhatsApp orders stay pending until Baura
                Bakers confirms the payment slip manually.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Page>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/65 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-ink/50">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-brand-ink">{value}</p>
    </div>
  );
}