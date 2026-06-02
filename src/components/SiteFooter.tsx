import { APP_VERSION } from "../lib/appVersion";

function short(thing: string, n: number) {
  return thing ? thing.slice(0, n) : "";
}

export default function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-brand-ink">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 text-brand-bg">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-base font-semibold tracking-tight">Baura Bakers</p>
          <span className="text-[11px] font-medium text-brand-bg/55">
            {APP_VERSION}
          </span>
        </div>

        <p className="mt-1 text-sm text-brand-bg/80">
          Fresh baked daily • Custom orders • Pickup & Delivery
        </p>

        <p className="mt-4 text-xs text-brand-bg/60">
          © {new Date().getFullYear()} Baura Bakers. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
