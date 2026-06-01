import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import { loginWithGoogle, registerWithEmail } from "../lib/auth";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setErrorText("Please enter name, email and a password with at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorText("");
      setMessage("");

      await registerWithEmail(email.trim(), password, fullName.trim(), phone.trim());

      setMessage("Account created. If email confirmation is enabled, please check your email.");
      setTimeout(() => navigate("/account"), 1000);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Could not create account.",
      );
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
          BAURA ACCOUNT
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink">
          Create your account
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-brand-ink/70">
          Save your details and view your past Baura Bakers orders.
        </p>

        {errorText && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
              FULL NAME
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white/65 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
              PHONE OPTIONAL
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white/65 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
              placeholder="07X XXX XXXX"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

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
              placeholder="Minimum 6 characters"
              type="password"
              autoComplete="new-password"
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
            ].join(" ")}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="mt-3 w-full rounded-2xl border border-brand-ink/20 bg-white/55 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/75"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-brand-ink/65">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-ink underline">
            Login
          </Link>
        </p>
      </div>
    </Page>
  );
}