import type { SiteModeRow } from "../../lib/siteModes";
import SystemStatusPage from "./SystemStatusPage";

export default function MaintenancePage({
  mode,
  showHomeButton = false,
}: {
  mode?: SiteModeRow | null;
  showHomeButton?: boolean;
}) {
  return (
    <SystemStatusPage
      variant="maintenance"
      mode={mode}
      showHomeButton={showHomeButton}
      title={mode?.title || "We are improving your experience"}
      message={
        mode?.message ||
        "Baura Bakers website is temporarily under maintenance. Please check back soon."
      }
    />
  );
}