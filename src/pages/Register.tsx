
/** @format */

import {
  type FormEvent,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import { registerWithEmail } from "../lib/auth";

type Field = "fullName" | "email" | "password";
type FieldErrors = Partial<Record<Field, string>>;

const inputClass =
  "w-full rounded-2xl border bg-white/65 px-4 py-3 text-sm outline-none transition-colors placeholder:text-brand-ink/40 focus:ring-2";

function getInputClass(hasError: boolean) {
  return [
    inputClass,
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-black/10 focus:border-brand-ink/30 focus:ring-brand-ink/10",
  ].join(" ");
}

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  function clearFieldError(field: Field) {
    setErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function focusInvalidField(field: Field) {
    const refs = {
      fullName: nameRef,
      email: emailRef,
      password: passwordRef,
    };

    requestAnimationFrame(() => {
      const element = refs[field].current;
      if (!element) return;

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      element.focus({ preventScroll: true });
    });
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};

    if (!fullName.trim()) {
      next.fullName = "Please enter your full name.";
    }

    if (!email.trim()) {
      next.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Please enter a valid email address.";
    }

    if (!password) {
      next.password = "Please enter a password.";
    } else if (password.length < 8) {
      next.password = "Password must contain at least 8 characters.";
    }

    return next;
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isSubmitting) return;

    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setErrorText("");

      const firstField = (["fullName", "email", "password"] as Field[])
        .find((field) => Boolean(nextErrors[field]));

      if (firstField) focusInvalidField(firstField);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      setErrorText("");

      await registerWithEmail(
        email.trim(),
        password,
        fullName.trim(),
        phone,
      );

      const customerRedirect = sessionStorage.getItem(
        "baura_after_login_redirect",
      );

      if (customerRedirect) {
        sessionStorage.removeItem("baura_after_login_redirect");
      }

      navigate(customerRedirect || "/account");
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Could not create account. Please try again.",
      );

      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        errorRef.current?.focus({ preventScroll: true });
      });
    } finally {
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
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 outline-none"
          >
            {errorText}
          </div>
        )}

        <form
          onSubmit={handleRegister}
          noValidate
          className="mt-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="register-name"
              className="text-xs font-semibold tracking-widest text-brand-ink/60"
            >
              FULL NAME
            </label>

            <input
              ref={nameRef}
              id="register-name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearFieldError("fullName");
              }}
              className={getInputClass(Boolean(errors.fullName))}
              placeholder="Your name"
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={
                errors.fullName ? "register-name-error" : undefined
              }
            />

            {errors.fullName && (
              <p
                id="register-name-error"
                className="text-xs font-medium text-red-700"
              >
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="register-phone"
              className="text-xs font-semibold tracking-widest text-brand-ink/60"
            >
              PHONE OPTIONAL
            </label>

            <input
              id="register-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={getInputClass(false)}
              placeholder="07X XXX XXXX"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="register-email"
              className="text-xs font-semibold tracking-widest text-brand-ink/60"
            >
              EMAIL
            </label>

            <input
              ref={emailRef}
              id="register-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              className={getInputClass(Boolean(errors.email))}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "register-email-error" : undefined
              }
            />

            {errors.email && (
              <p
                id="register-email-error"
                className="text-xs font-medium text-red-700"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="register-password"
              className="text-xs font-semibold tracking-widest text-brand-ink/60"
            >
              PASSWORD
            </label>

            <input
              ref={passwordRef}
              id="register-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              className={getInputClass(Boolean(errors.password))}
              placeholder="Minimum 8 characters"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "register-password-error" : undefined
              }
            />

            {errors.password && (
              <p
                id="register-password-error"
                className="text-xs font-medium text-red-700"
              >
                {errors.password}
              </p>
            )}
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

        <p className="mt-4 text-center text-xs leading-relaxed text-brand-ink/50">
          Google registration is temporarily paused during the Laravel migration.
        </p>

        <p className="mt-6 text-center text-sm text-brand-ink/65">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-ink underline"
          >
            Login
          </Link>
        </p>
      </div>
    </Page>
  );
}
