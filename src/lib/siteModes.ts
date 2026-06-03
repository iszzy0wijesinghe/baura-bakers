import { supabase } from "./supabase";

export type SiteModeKey = "COMING_SOON" | "MAINTENANCE" | "CRITICAL_BREAK";

export type SiteModeRow = {
  id: string;
  mode: SiteModeKey;
  is_enabled: boolean;
  starts_at: string | null;
  ends_at: string | null;
  title: string;
  message: string | null;
  updated_at: string;
  updated_by: string | null;
};

const priority: SiteModeKey[] = [
  "CRITICAL_BREAK",
  "MAINTENANCE",
  "COMING_SOON",
];

function isInsideDateRange(row: SiteModeRow) {
  if (!row.is_enabled) return false;

  const now = new Date();
  const start = row.starts_at ? new Date(row.starts_at) : null;
  const end = row.ends_at ? new Date(row.ends_at) : null;

  if (start && now < start) return false;
  if (end && now > end) return false;

  return true;
}

export async function getActiveSiteMode() {
  const { data, error } = await supabase
    .from("site_modes")
    .select(
      "id, mode, is_enabled, starts_at, ends_at, title, message, updated_at, updated_by",
    );

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []) as SiteModeRow[];

  for (const mode of priority) {
    const row = rows.find((item) => item.mode === mode);
    if (row && isInsideDateRange(row)) return row;
  }

  return null;
}