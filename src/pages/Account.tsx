/** @format */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import { getCurrentUser, logout } from "../lib/auth";

type AccountUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
  };
};

export default function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState<AccountUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        navigate("/login");
        return;
      }

      const { data: profile } = await import("../lib/supabase").then((m) =>
        m.supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single(),
      );

      if (profile?.role === "admin") {
        navigate("/admin/dashboard");
        return;
      }

      setUser(currentUser as AccountUser);
      setIsLoading(false);
    }

    loadUser();
  }, [navigate]);

  async function handleLogout() {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Could not logout.",
      );
    }
  }

  if (isLoading) {
    return (
      <Page>
        <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-brand-ink">
          Loading account...
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="mx-auto max-w-2xl rounded-3xl border border-black/10 bg-white/55 p-6 shadow-sm backdrop-blur sm:p-8">
        <p className="text-xs font-semibold tracking-[0.28em] text-brand-ink/55">
          MY ACCOUNT
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink">
          Welcome
          {user?.user_metadata?.full_name
            ? `, ${user.user_metadata.full_name}`
            : ""}
        </h1>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
            <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
              EMAIL
            </p>
            <p className="mt-1 text-sm font-semibold text-brand-ink">
              {user?.email || "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
            <p className="text-xs font-semibold tracking-widest text-brand-ink/55">
              PHONE
            </p>
            <p className="mt-1 text-sm font-semibold text-brand-ink">
              {user?.user_metadata?.phone || "-"}
            </p>
          </div>
        </div>

        {errorText && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/orders"
            className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95">
            My orders
          </Link>

          <Link
            to="/order"
            className="rounded-2xl border border-brand-ink/20 bg-white/55 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/75">
            Continue checkout
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100">
            Logout
          </button>
        </div>
      </div>
    </Page>
  );
}
