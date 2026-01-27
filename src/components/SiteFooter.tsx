import { buildInfo } from "../lib/buildInfo";

function short(thing: string, n: number) {
  return thing ? thing.slice(0, n) : "";
}

function buildVersion() {
  // V1.<deployId(4)>.<commit(4)>.<commit(4)>
  // looks like: V1.9f3a.a12b.c34d
  const a = short(buildInfo.deployId.replace(/[^a-zA-Z0-9]/g, ""), 4) || "0";
  const b = short(buildInfo.commit, 4) || "0";
  const c = short(buildInfo.commit.slice(4), 4) || "0";
  return `V1.${a}.${b}.${c}`;
}

export default function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-brand-ink">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 text-brand-bg">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-base font-semibold tracking-tight">Baura Bakers</p>
          <span className="text-[11px] font-medium text-brand-bg/55">
            {buildVersion()}
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



