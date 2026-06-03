import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  LockKeyhole,
  MailQuestion,
  RefreshCw,
  ServerCrash,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import logo from "../../../images/logos/logo.webp";

type Props = {
  statusCode?: number;
  title?: string;
  message?: string;
};

type ErrorTone = {
  riskLabel: string;
  icon: LucideIcon;
  shell: string;
  iconBox: string;
  badge: string;
  primaryButton: string;
  glowOne: string;
  glowTwo: string;
  progress: string;
};

function getStatusText(status: number) {
  if (status === 400) {
    return {
      title: "Bad request",
      message:
        "The request could not be completed because something in the page request was not valid.",
    };
  }

  if (status === 401) {
    return {
      title: "Login required",
      message: "Please log in before opening this page.",
    };
  }

  if (status === 403) {
    return {
      title: "Access denied",
      message: "You do not have permission to open this page.",
    };
  }

  if (status === 404) {
    return {
      title: "Page not found",
      message:
        "The page you are looking for may have been moved, renamed, or removed.",
    };
  }

  if (status >= 500) {
    return {
      title: "Server error",
      message:
        "The website had trouble completing this request. Please try again shortly.",
    };
  }

  return {
    title: "Something went wrong",
    message:
      "The website could not complete this request. Please try again shortly.",
  };
}

function getTone(status: number): ErrorTone {
  if (status >= 500) {
    return {
      riskLabel: "High risk",
      icon: ServerCrash,
      shell: "border-red-200/80 bg-red-50/80",
      iconBox: "bg-red-700 text-white",
      badge: "border-red-200 bg-white/70 text-red-900",
      primaryButton: "bg-red-700 text-white hover:bg-red-800",
      glowOne: "bg-red-200/80",
      glowTwo: "bg-rose-200/50",
      progress: "bg-red-500",
    };
  }

  if (status === 401) {
    return {
      riskLabel: "Login needed",
      icon: LockKeyhole,
      shell: "border-blue-200/80 bg-blue-50/80",
      iconBox: "bg-blue-700 text-white",
      badge: "border-blue-200 bg-white/70 text-blue-900",
      primaryButton: "bg-blue-700 text-white hover:bg-blue-800",
      glowOne: "bg-blue-200/80",
      glowTwo: "bg-sky-200/50",
      progress: "bg-blue-500",
    };
  }

  if (status === 403) {
    return {
      riskLabel: "Restricted",
      icon: ShieldAlert,
      shell: "border-amber-200/80 bg-amber-50/80",
      iconBox: "bg-amber-700 text-white",
      badge: "border-amber-200 bg-white/70 text-amber-900",
      primaryButton: "bg-amber-700 text-white hover:bg-amber-800",
      glowOne: "bg-amber-200/80",
      glowTwo: "bg-orange-200/45",
      progress: "bg-amber-500",
    };
  }

  if (status === 404) {
    return {
      riskLabel: "Not a risk",
      icon: MailQuestion,
      shell: "border-emerald-200/70 bg-emerald-50/75",
      iconBox: "bg-emerald-700 text-white",
      badge: "border-emerald-200 bg-white/70 text-emerald-900",
      primaryButton: "bg-emerald-700 text-white hover:bg-emerald-800",
      glowOne: "bg-emerald-200/80",
      glowTwo: "bg-lime-200/45",
      progress: "bg-emerald-500",
    };
  }

  if (status === 400) {
    return {
      riskLabel: "Normal attention",
      icon: Ban,
      shell: "border-amber-200/80 bg-amber-50/80",
      iconBox: "bg-amber-700 text-white",
      badge: "border-amber-200 bg-white/70 text-amber-900",
      primaryButton: "bg-amber-700 text-white hover:bg-amber-800",
      glowOne: "bg-amber-200/80",
      glowTwo: "bg-orange-200/45",
      progress: "bg-amber-500",
    };
  }

  return {
    riskLabel: "Attention needed",
    icon: AlertTriangle,
    shell: "border-amber-200/80 bg-amber-50/80",
    iconBox: "bg-amber-700 text-white",
    badge: "border-amber-200 bg-white/70 text-amber-900",
    primaryButton: "bg-amber-700 text-white hover:bg-amber-800",
    glowOne: "bg-amber-200/80",
    glowTwo: "bg-orange-200/45",
    progress: "bg-amber-500",
  };
}

export default function ErrorStatusPage({ statusCode, title, message }: Props) {
  const routeError = useRouteError();

  const routeStatus = isRouteErrorResponse(routeError)
    ? routeError.status
    : undefined;

  const status = statusCode || routeStatus || 500;
  const content = getStatusText(status);
  const tone = getTone(status);
  const Icon = tone.icon;

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-brand-bg px-4 py-8 text-brand-ink">
      <motion.div
        className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full ${tone.glowOne} blur-3xl`}
        animate={{ scale: [1, 1.12, 1], x: [0, -12, 0], y: [0, 10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className={`pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full ${tone.glowTwo} blur-3xl`}
        animate={{ scale: [1, 1.15, 1], x: [0, 16, 0], y: [0, -12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 190, damping: 22 }}
        className={`relative w-full max-w-2xl overflow-hidden rounded-[2rem] border p-5 text-center shadow-[0_24px_80px_rgba(47,31,22,0.16)] backdrop-blur sm:p-8 ${tone.shell}`}
      >
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/55 blur-3xl" />

        <div className="relative">
          <div className="mb-6 flex items-center justify-center">
            <img
              src={logo}
              alt="Baura Bakers"
              className="h-20 w-20 object-contain sm:h-24 sm:w-24"
              loading="eager"
              decoding="async"
            />
          </div>
          <motion.div
            initial={{ rotate: -8, scale: 0.85 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 260 }}
            className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl shadow-sm ${tone.iconBox}`}
          >
            <Icon size={30} />
          </motion.div>

          <div
            className={`mx-auto mt-5 w-fit rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] sm:text-xs ${tone.badge}`}
          >
            {tone.riskLabel}
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/45">
            Error {status}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
            {title || content.title}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-ink/65 sm:text-base">
            {message || content.message}
          </p>

          <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-full bg-black/10">
            <motion.div
              className={`h-1.5 rounded-full ${tone.progress}`}
              initial={{ width: "20%" }}
              animate={{ width: ["20%", "82%", "20%"] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition sm:w-auto ${tone.primaryButton}`}
            >
              <RefreshCw size={17} />
              Try again
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
