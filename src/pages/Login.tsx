/** @format */

import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import { loginWithEmail, loginWithGoogle } from "../lib/auth";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorText("");

      await loginWithEmail(email.trim(), password);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await import("../lib/supabase").then((m) =>
          m.supabase.from("profiles").select("role").eq("id", user.id).single(),
        );

        if (profile?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/account");
        }
      }
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Could not login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setIsSubmitting(true);
      setErrorText("");
      await loginWithGoogle();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Google login failed.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <Page>
      <div className="mx-auto max-w-lg rounded-3xl border border-black/10 bg-white/55 p-6 shadow-sm backdrop-blur sm:p-8">
        <p className="text-xs font-semibold tracking-[0.28em] text-brand-ink/55">
          WELCOME BACK
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink">
          Login to Baura Bakers
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-brand-ink/70">
          Access your saved details and order history.
        </p>

        {errorText && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
              EMAIL
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white/65 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
              PASSWORD
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white/65 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
              placeholder="Your password"
              type="password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={[
              "w-full rounded-2xl px-5 py-3 text-sm font-semibold text-brand-bg",
              isSubmitting
                ? "cursor-not-allowed bg-brand-ink/50"
                : "bg-brand-ink hover:bg-brand-ink/95",
            ].join(" ")}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="mt-3 w-full rounded-2xl border border-brand-ink/20 bg-white/55 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/75">
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-brand-ink/65">
          New to Baura Bakers?{" "}
          <Link
            to="/register"
            className="font-semibold text-brand-ink underline">
            Create account
          </Link>
        </p>
      </div>
    </Page>
  );
}
