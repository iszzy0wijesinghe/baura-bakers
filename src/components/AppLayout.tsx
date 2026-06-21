import { AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import FloatingCartButton from "./FloatingCartButton";
import ScrollToTop from "./ScrollToTop";
import SiteAccessGate from "./SiteAccessGate";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-brand-bg text-brand-ink">
      <SiteAccessGate>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow"
        >
          Skip to content
        </a>

        <SiteHeader />
        <ScrollToTop />

        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-10">
          <AnimatePresence mode="wait">
            <Outlet key={location.pathname} />
          </AnimatePresence>

          <FloatingCartButton />
        </main>

        <SiteFooter />
      </SiteAccessGate>
    </div>
  );
}


