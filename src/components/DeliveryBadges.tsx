// const pickmeFoodLogo = "../../images/logos/pickme-food2.webp";
// const uberEatsLogo = "../../images/logos/ubereats.webp";

import pickmeFoodLogo from "../../images/logos/pickme-food2.webp";
import uberEatsLogo from "../../images/logos/ubereats.webp";
import pickmeFlashLogo from "../../images/logos/pickme-logo.webp";
import uberParcelLogo from "../../images/logos/uber-icon.webp";

type Props = {
  compact?: boolean;
};

export default function DeliveryBadges({ compact = false }: Props) {
  return (
    <div
      className={[
        "rounded-2xl border border-brand-ink/15 bg-white/45 shadow-sm",
        compact ? "p-3" : "p-4",
      ].join(" ")}
    >
      <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
        DELIVERY OPTIONS
      </p>

      <div
        className={
          compact
            ? "mt-2 flex items-center gap-3"
            : "mt-3 flex items-center gap-3"
        }
      >
        <div className="flex items-center gap-2 rounded-xl border border-brand-ink/15 bg-brand-bg/70 px-3 py-2">
          <img
            src={pickmeFlashLogo}
            alt="PickMe Food"
            className="h-10 w-auto"
            loading="lazy"
            decoding="async"
          />
          <span className="text-xs font-semibold text-brand-ink/75">
            PickMe Flash
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-brand-ink/15 bg-brand-bg/70 px-3 py-2">
          <img
            src={uberParcelLogo}
            alt="Uber Eats"
            className="h-10 w-auto"
            loading="lazy"
            decoding="async"
          />
          <span className="text-xs font-semibold text-brand-ink/75">
            Uber Parcel
          </span>
        </div>
      </div>

      <p
        className={
          compact
            ? "mt-2 text-[11px] leading-snug text-brand-ink/75"
            : "mt-3 text-xs leading-relaxed text-brand-ink/75"
        }
      >
        Every order is carefully packed to keep your treats fresh and safe
        during delivery. At the moment, we arrange deliveries through{" "}
        <span className="font-semibold">PickMe Flash</span> or{" "}
        <span className="font-semibold">Uber Parcel</span>.{" "}
        <span className="font-semibold">PickMe Food</span> and{" "}
        <span className="font-semibold">Uber Eats</span> ordering will be
        available soon.
      </p>

      <p
        className={
          compact
            ? "mt-2 text-sm font-semibold text-brand-ink"
            : "mt-3 text-base font-semibold text-brand-ink"
        }
      >
        100% delivery guaranteed.
      </p>
    </div>
  );
}
