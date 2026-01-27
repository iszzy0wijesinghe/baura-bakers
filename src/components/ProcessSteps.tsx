import { motion, useReducedMotion } from "framer-motion";
import { ClipboardList, Send, Truck } from "lucide-react";

type Step = {
  step: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const steps: Step[] = [
  {
    step: "01",
    title: "Choose items",
    desc: "Pick from best sellers or the full menu.",
    icon: ClipboardList,
  },
  {
    step: "02",
    title: "Send details",
    desc: "Fill the order form and we confirm quickly.",
    icon: Send,
  },
  {
    step: "03",
    title: "Pickup or delivery",
    desc: "Enjoy fresh bakes at the right time.",
    icon: Truck,
  },
];

function Arrow({ delay = 0 }: { delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  const lineDuration = 0.9;

  return (
    <div className="hidden h-full items-center justify-center sm:flex" aria-hidden="true">
      <svg
        width="120"
        height="28"
        viewBox="0 0 120 28"
        className="block opacity-80"
        style={{ overflow: "visible" }}
      >
        {/* dashed line reveals progressively */}
        <motion.path
          d="M8 14 H94"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="10 10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: lineDuration, ease: "linear", delay },
            opacity: { duration: 0.2, ease: "easeOut", delay },
          }}
        />

        {/* solid arrow head appears after line */}
        <motion.polygon
          points="94,7 114,14 94,21"
          fill="currentColor"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.25,
            ease: "easeOut",
            delay: delay + lineDuration + 0.05,
          }}
        />
      </svg>
    </div>
  );
}

export default function ProcessSteps() {
  const reduce = useReducedMotion();

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch">
      {steps.map((s, idx) => {
        const stepDelay = reduce ? 0 : idx * 1.25;
        const Icon = s.icon;

        return (
          <div key={s.step} className="contents">
            <motion.div
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              whileInView={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: stepDelay }}
              className="rounded-2xl border border-brand-bg/18 bg-brand-ink/85 p-5 text-brand-bg shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-semibold tracking-widest text-brand-bg/70">
                  {s.step}
                </p>
                <Icon className="h-4 w-4 text-brand-bg/80" aria-hidden={true} />
              </div>

              <p className="mt-2 text-sm font-semibold">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-brand-bg/75">{s.desc}</p>
            </motion.div>

            {/* Arrow between steps (desktop) */}
            {idx < steps.length - 1 && (
              <motion.div
                className="hidden h-full text-brand-ink/60 sm:flex sm:items-center sm:justify-center"
                initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.2, ease: "easeOut", delay: stepDelay + 0.55 }}
              >
                <Arrow delay={stepDelay + 0.65} />
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
