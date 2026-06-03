import type { SiteModeRow } from "../../lib/siteModes";
import SystemStatusPage from "./SystemStatusPage";

export default function CriticalBreakPage({
  mode,
  showHomeButton = false,
}: {
  mode?: SiteModeRow | null;
  showHomeButton?: boolean;
}) {
  return (
    <SystemStatusPage
      variant="critical-break"
      mode={mode}
      showHomeButton={showHomeButton}
      title={mode?.title || "Something went wrong"}
      message={
        mode?.message ||
        "We noticed an unexpected issue and temporarily paused the website to keep your experience safe."
      }
    />
  );
}