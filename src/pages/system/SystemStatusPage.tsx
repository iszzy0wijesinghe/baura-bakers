import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock3,
  RefreshCw,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { SiteModeRow } from "../../lib/siteModes";
import logo from "../../../images/logos/logo.webp";

type Variant = "coming-soon" | "maintenance" | "critical-break";

type Props = {
  variant: Variant;
  title: string;
  message: string;
  mode?: SiteModeRow | null;
  showHomeButton?: boolean;
};

const variantConfig: Record<
  Variant,
  {
    eyebrow: string;
    riskLabel: string;
    icon: LucideIcon;
    shell: string;
    iconBox: string;
    iconRing: string;
    badge: string;
    badgeIcon: string;
    primaryButton: string;
    glowOne: string;
    glowTwo: string;
    glowThree: string;
    progress: string;
  }
> = {
  "coming-soon": {
    eyebrow: "Coming Soon",
    riskLabel: "Not a risk",
    icon: Sparkles,
    shell: "border-emerald-200/70 bg-emerald-50/75",
    iconBox: "bg-emerald-600 text-white",
    iconRing: "bg-emerald-500/15",
    badge: "border-emerald-200 bg-white/70 text-emerald-800",
    badgeIcon: "bg-emerald-100 text-emerald-700",
    primaryButton: "bg-emerald-700 text-white hover:bg-emerald-800",
    glowOne: "bg-emerald-200/80",
    glowTwo: "bg-lime-200/55",
    glowThree: "bg-white/75",
    progress: "bg-emerald-500",
  },
  maintenance: {
    eyebrow: "Site Maintenance",
    riskLabel: "Normal attention",
    icon: Wrench,
    shell: "border-amber-200/80 bg-amber-50/80",
    iconBox: "bg-amber-600 text-white",
    iconRing: "bg-amber-500/15",
    badge: "border-amber-200 bg-white/70 text-amber-900",
    badgeIcon: "bg-amber-100 text-amber-700",
    primaryButton: "bg-amber-700 text-white hover:bg-amber-800",
    glowOne: "bg-amber-200/80",
    glowTwo: "bg-orange-200/45",
    glowThree: "bg-white/75",
    progress: "bg-amber-500",
  },
  "critical-break": {
    eyebrow: "Critical Notice",
    riskLabel: "Risk detected",
    icon: AlertTriangle,
    shell: "border-red-200/80 bg-red-50/80",
    iconBox: "bg-red-700 text-white",
    iconRing: "bg-red-500/15",
    badge: "border-red-200 bg-white/70 text-red-900",
    badgeIcon: "bg-red-100 text-red-700",
    primaryButton: "bg-red-700 text-white hover:bg-red-800",
    glowOne: "bg-red-200/80",
    glowTwo: "bg-rose-200/50",
    glowThree: "bg-white/75",
    progress: "bg-red-500",
  },
};

function formatDate(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SystemStatusPage({
  variant,
  title,
  message,
  mode,
}: Props) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const startsAt = formatDate(mode?.starts_at);
  const endsAt = formatDate(mode?.ends_at);

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-brand-bg px-4 py-8 text-brand-ink">
      <motion.div
        className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full ${config.glowOne} blur-3xl`}
        animate={{ scale: [1, 1.12, 1], x: [0, -12, 0], y: [0, 10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className={`pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full ${config.glowTwo} blur-3xl`}
        animate={{ scale: [1, 1.15, 1], x: [0, 16, 0], y: [0, -12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className={`pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full ${config.glowThree} blur-3xl`}
        animate={{ opacity: [0.45, 0.8, 0.45], scale: [0.95, 1.08, 0.95] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 190, damping: 22 }}
        className={`relative w-full max-w-3xl overflow-hidden rounded-[2rem] border p-5 shadow-[0_24px_80px_rgba(47,31,22,0.16)] backdrop-blur sm:p-8 ${config.shell}`}
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

          <div className="flex items-start justify-between gap-4">
            <motion.div
              initial={{ rotate: -10, scale: 0.85 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.08, type: "spring", stiffness: 260 }}
              className="relative"
            >
              <motion.div
                className={`absolute inset-0 rounded-3xl ${config.iconRing}`}
                animate={{ scale: [1, 1.45, 1], opacity: [0.9, 0, 0.9] }}
                transition={{ duration: 2.8, repeat: Infinity }}
              />
              <div
                className={`relative grid h-14 w-14 place-items-center rounded-2xl shadow-sm sm:h-16 sm:w-16 ${config.iconBox}`}
              >
                <Icon size={28} />
              </div>
            </motion.div>

            <div
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] sm:text-xs ${config.badge}`}
            >
              {config.riskLabel}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-ink/50 sm:text-xs">
              {config.eyebrow}
            </p>

            <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
              {title}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-brand-ink/70 sm:text-base">
              {message}
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-black/10 bg-white/65 p-4">
            <div className="flex items-start gap-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${config.badgeIcon}`}
              >
                <Clock3 size={18} />
              </span>

              <div>
                <p className="text-sm font-semibold text-brand-ink">
                  {startsAt || endsAt
                    ? "Scheduled website status"
                    : "Current website status"}
                </p>

                <p className="mt-1 text-xs leading-relaxed text-brand-ink/60">
                  {startsAt || endsAt ? (
                    <>
                      {startsAt ? `Started: ${startsAt}` : "Started already"}
                      {" • "}
                      {endsAt
                        ? `Expected until: ${endsAt}`
                        : "Until further notice"}
                    </>
                  ) : (
                    "Please check again shortly. Thank you for your patience."
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/10">
              <motion.div
                className={`h-full rounded-full ${config.progress}`}
                initial={{ width: "18%" }}
                animate={{ width: ["18%", "82%", "18%"] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition sm:w-auto ${config.primaryButton}`}
            >
              <RefreshCw size={17} />
              Refresh page
            </button>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-brand-ink/50">
            Baura Bakers is working to keep the website safe, stable, and easy
            to use.
          </p>
        </div>
      </motion.section>
    </div>
  );
}
