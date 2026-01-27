import { Outlet } from "react-router-dom";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import FloatingCartButton from "./FloatingCartButton";

export default function AppLayout() {
  return (
    // <div className="min-h-dvh bg-white text-zinc-900">
    <div className="min-h-dvh bg-brand-bg text-brand-ink">
      {/* Skip link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-10">
        <Outlet />
        <FloatingCartButton />
      </main>

      

      <SiteFooter />
    </div>
  );
}
