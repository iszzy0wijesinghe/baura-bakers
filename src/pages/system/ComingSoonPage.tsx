import type { SiteModeRow } from "../../lib/siteModes";
import SystemStatusPage from "./SystemStatusPage";

export default function ComingSoonPage({
  mode,
  showHomeButton = false,
}: {
  mode?: SiteModeRow | null;
  showHomeButton?: boolean;
}) {
  return (
    <SystemStatusPage
      variant="coming-soon"
      mode={mode}
      showHomeButton={showHomeButton}
      title={mode?.title || "Something sweet is baking"}
      message={
        mode?.message ||
        "Baura Bakers website is almost ready. We are preparing a better online ordering experience for you."
      }
    />
  );
}