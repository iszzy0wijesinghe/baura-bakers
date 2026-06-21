/** @format */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import { supabase } from "../lib/supabase";

type SiteMode = {
  id: string;
  mode: "COMING_SOON" | "MAINTENANCE" | "CRITICAL_BREAK";
  title: string | null;
  message: string | null;
  is_enabled: boolean;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
};

const modeLabels: Record<SiteMode["mode"], string> = {
  COMING_SOON: "Coming Soon",
  MAINTENANCE: "Maintenance",
  CRITICAL_BREAK: "Critical Break",
};

const modeDescriptions: Record<SiteMode["mode"], string> = {
  COMING_SOON: "Show coming soon screen before public launch.",
  MAINTENANCE: "Temporarily close the site for updates or fixes.",
  CRITICAL_BREAK: "Emergency mode for serious issue or business pause.",
};

export default function AdminSiteSettings() {
  const navigate = useNavigate();

  const [modes, setModes] = useState<SiteMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMode, setSavingMode] = useState("");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

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

  async function loadModes() {
    setLoading(true);
    setErrorText("");

    const isAdmin = await verifyAdmin();
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from("site_modes")
      .select("*")
      .order("mode", { ascending: true });

    setLoading(false);

    if (error) {
      setErrorText(error.message);
      return;
    }

    setModes((data || []) as SiteMode[]);
  }

  useEffect(() => {
    loadModes();
  }, []);

  async function sendModeEmail(mode: SiteMode["mode"], enabled: boolean) {
    const { error } = await supabase.functions.invoke("send-site-mode-alert", {
      body: {
        mode,
        enabled,
        siteUrl: window.location.origin,
      },
    });

    if (error) {
      console.warn("Mode email failed:", error.message);
    }
  }

  async function toggleMode(mode: SiteMode) {
    setSavingMode(mode.mode);
    setErrorText("");
    setSuccessText("");

    const nextEnabled = !mode.is_enabled;

    const { error } = await supabase
      .from("site_modes")
      .update({
        is_enabled: nextEnabled,
        starts_at: null,
        ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("mode", mode.mode);

    setSavingMode("");

    if (error) {
      setErrorText(error.message);
      return;
    }

    if (nextEnabled) {
      await sendModeEmail(mode.mode, true);
    }

    setSuccessText(
      `${modeLabels[mode.mode]} ${nextEnabled ? "enabled" : "disabled"}.`,
    );

    loadModes();
  }

  async function resetAllModes() {
    if (!window.confirm("Turn off all site modes?")) return;

    setSavingMode("RESET_ALL");
    setErrorText("");
    setSuccessText("");

    const { error } = await supabase.from("site_modes").update({
      is_enabled: false,
      starts_at: null,
      ends_at: null,
      updated_at: new Date().toISOString(),
    });

    setSavingMode("");

    if (error) {
      setErrorText(error.message);
      return;
    }

    setSuccessText("All site modes turned off.");
    loadModes();
  }

  return (
    <Page>
      <div className="space-y-5">
        <header className="rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.3em] text-brand-ink/50 sm:text-xs">
                SITE SETTINGS
              </p>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
                Site switch modes
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/65">
                Control public website modes such as Coming Soon, Maintenance,
                and Critical Break.
              </p>
            </div>

            <Link
              to="/admin/dashboard"
              className="w-fit rounded-2xl border border-brand-ink/20 bg-white/70 px-5 py-3 text-sm font-semibold text-brand-ink">
              Dashboard
            </Link>
          </div>
        </header>

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

        {loading ? (
          <div className="rounded-3xl border border-black/10 bg-white/60 p-6 text-sm text-brand-ink/60">
            Loading site modes...
          </div>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-3">
              {modes.map((mode) => (
                <div
                  key={mode.id}
                  className={[
                    "rounded-[2rem] border p-5 shadow-sm",
                    mode.is_enabled
                      ? "border-red-200 bg-red-50"
                      : "border-black/10 bg-white/60",
                  ].join(" ")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-widest text-brand-ink/50">
                        {mode.mode}
                      </p>

                      <h2 className="mt-2 text-xl font-semibold text-brand-ink">
                        {modeLabels[mode.mode]}
                      </h2>
                    </div>

                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        mode.is_enabled
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700",
                      ].join(" ")}>
                      {mode.is_enabled ? "ON" : "OFF"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-brand-ink/65">
                    {mode.message || modeDescriptions[mode.mode]}
                  </p>

                  <button
                    type="button"
                    disabled={savingMode === mode.mode}
                    onClick={() => toggleMode(mode)}
                    className={[
                      "mt-5 w-full rounded-2xl px-5 py-3 text-sm font-semibold",
                      mode.is_enabled
                        ? "bg-red-700 text-white hover:bg-red-800"
                        : "bg-brand-ink text-brand-bg hover:bg-brand-ink/95",
                    ].join(" ")}>
                    {savingMode === mode.mode
                      ? "Saving..."
                      : mode.is_enabled
                        ? "Turn off"
                        : "Turn on"}
                  </button>
                </div>
              ))}
            </section>

            <section className="rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-brand-ink">
                Emergency reset
              </h2>

              <p className="mt-2 text-sm text-brand-ink/60">
                This turns off Coming Soon, Maintenance, and Critical Break
                together.
              </p>

              <button
                type="button"
                disabled={savingMode === "RESET_ALL"}
                onClick={resetAllModes}
                className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100">
                {savingMode === "RESET_ALL" ? "Resetting..." : "Turn off all modes"}
              </button>
            </section>
          </>
        )}
      </div>
    </Page>
  );
}