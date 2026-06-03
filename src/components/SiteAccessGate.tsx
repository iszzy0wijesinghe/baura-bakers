import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { getActiveSiteMode, type SiteModeRow } from "../lib/siteModes";
import { useAuthSession } from "../lib/useAuthSession";
import ComingSoonPage from "../pages/system/ComingSoonPage";
import CriticalBreakPage from "../pages/system/CriticalBreakPage";
import MaintenancePage from "../pages/system/MaintenancePage";
import BakingLoader from "./BakingLoader";

const MIN_LOADER_TIME_MS = 2300;

const adminBypassPrefixes = ["/login", "/admin"];

function canAdminBypassPath(pathname: string) {
  return adminBypassPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function renderModePage(mode: SiteModeRow) {
  if (mode.mode === "CRITICAL_BREAK") {
    return <CriticalBreakPage mode={mode} />;
  }

  if (mode.mode === "MAINTENANCE") {
    return <MaintenancePage mode={mode} />;
  }

  return <ComingSoonPage mode={mode} />;
}

export default function SiteAccessGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAdmin, isLoading: isAuthLoading } = useAuthSession();

  const [activeMode, setActiveMode] = useState<SiteModeRow | null>(null);
  const [isModeLoading, setIsModeLoading] = useState(true);
  const [minimumLoaderDone, setMinimumLoaderDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMinimumLoaderDone(true);
    }, MIN_LOADER_TIME_MS);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadMode() {
      try {
        setIsModeLoading(true);
        const mode = await getActiveSiteMode();

        if (mounted) {
          setActiveMode(mode);
        }
      } catch (error) {
        console.error("Failed to load site mode:", error);

        if (mounted) {
          setActiveMode({
            id: "runtime-critical-break",
            mode: "CRITICAL_BREAK",
            is_enabled: true,
            starts_at: null,
            ends_at: null,
            title: "Something went wrong",
            message:
              "The website could not check its current availability. We temporarily paused access to keep the experience safe.",
            updated_at: new Date().toISOString(),
            updated_by: null,
          });
        }
      } finally {
        if (mounted) {
          setIsModeLoading(false);
        }
      }
    }

    loadMode();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  const adminBypass = isAdmin && canAdminBypassPath(location.pathname);

  if (isModeLoading || isAuthLoading || !minimumLoaderDone) {
    return <BakingLoader />;
  }

  if (activeMode && !adminBypass) {
    return renderModePage(activeMode);
  }

  return <>{children}</>;
}