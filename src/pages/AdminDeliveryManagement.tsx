/** @format */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import { getCurrentUser } from "../lib/auth";
import {
  createAdminDeliverySlots,
  deleteAdminDeliverySlot,
  deleteAdminDistancePrice,
  deleteAdminVehicleRule,
  getAdminDeliveryData,
  saveAdminDeliverySettings,
  saveAdminDistancePrice,
  saveAdminVehicleRule,
} from "../lib/adminDeliverySettingsApi";

type TabKey = "availability" | "pricing" | "vehicles" | "settings";

type DeliveryMode = "SCHEDULED" | "EVERYDAY" | "SPECIAL";
type RecurrenceMode = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

type DeliverySlot = {
  id: string;
  slot_date: string;
  slot_label: string;
  start_time: string;
  end_time: string;
  max_orders: number;
  is_available: boolean;
};

type DailyDeliverySlot = {
  id: string;
  slot_label: string;
  start_time: string;
  end_time: string;
  max_orders: number;
  is_available: boolean;
};

type SpecialDeliverySlot = {
  id: string;
  slot_date: string;
  slot_label: string;
  start_time: string;
  end_time: string;
  max_orders: number;
  is_available: boolean;
};

type NoDeliveryBlock = {
  id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  full_day: boolean;
};

type DeliveryVehicleRule = {
  id: string;
  vehicle_type: string;
  min_quantity: number;
  max_quantity: number | null;
  is_active: boolean;
};

type PriceTableKey = "PICKME_FLASH" | "UBER_PARCEL";

type DeliveryDistancePrice = {
  id: string;
  price_table_key: PriceTableKey;
  distance_km: number;
  vehicle_type: string;
  normal_price_lkr: number;
  peak_price_lkr: number;
  is_active: boolean;
};

type DeliverySetting = {
  setting_key: string;
  setting_value: string;
};

type OldSpecialDeliveryDate = {
  date: string;
  label: string;
};

const REGULAR_PRICE_TABLE_KEY: PriceTableKey = "PICKME_FLASH";

const tabs: { key: TabKey; label: string }[] = [
  { key: "availability", label: "Availability & schedule" },
  { key: "pricing", label: "Regular pricing" },
  { key: "vehicles", label: "Vehicle rules" },
  { key: "settings", label: "Settings" },
];

function vehicleIcon(type: string) {
  if (type === "BIKE") return "🏍️";
  if (type === "THREE_WHEEL") return "🛺";
  if (type === "CAR") return "🚗";
  if (type === "VAN") return "🚐";
  return "🚚";
}

function vehicleName(type: string) {
  if (type === "BIKE") return "Bike";
  if (type === "THREE_WHEEL") return "Three wheel";
  if (type === "CAR") return "Car";
  if (type === "VAN") return "Van";
  return type;
}

function parseList<T = unknown>(value?: string): T[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function generateRecurringDates({
  startDate,
  endDate,
  recurrence,
}: {
  startDate: string;
  endDate: string;
  recurrence: RecurrenceMode;
}) {
  if (!startDate) return [];

  const start = new Date(`${startDate}T00:00:00`);
  const end = endDate
    ? new Date(`${endDate}T00:00:00`)
    : new Date(`${startDate}T00:00:00`);

  if (end < start) return [startDate];

  const dates: string[] = [];
  let cursor = start;

  while (cursor <= end && dates.length < 366) {
    dates.push(toIsoDate(cursor));

    if (recurrence === "DAILY") {
      cursor = addDays(cursor, 1);
    } else if (recurrence === "WEEKLY") {
      cursor = addDays(cursor, 7);
    } else if (recurrence === "MONTHLY") {
      cursor = addMonths(cursor, 1);
    } else {
      break;
    }
  }

  return dates;
}

function resetPriceForm() {
  return {
    id: "",
    price_table_key: REGULAR_PRICE_TABLE_KEY,
    distance_km: 1,
    vehicle_type: "BIKE",
    normal_price_lkr: 0,
    peak_price_lkr: 0,
    is_active: true,
  };
}

function resetVehicleForm() {
  return {
    id: "",
    vehicle_type: "BIKE",
    min_quantity: 1,
    max_quantity: "",
    is_active: true,
  };
}

function normalizeSpecialSlots(value?: string): SpecialDeliverySlot[] {
  const rows = parseList<Partial<SpecialDeliverySlot> & OldSpecialDeliveryDate>(
    value,
  );

  return rows
    .map((row, index) => {
      const slotDate = row.slot_date || row.date || "";
      const slotLabel = row.slot_label || row.label || "Special Delivery";

      if (!slotDate) return null;

      return {
        id: row.id || `old-special-${slotDate}-${index}`,
        slot_date: slotDate,
        slot_label: slotLabel,
        start_time: row.start_time || "09:00",
        end_time: row.end_time || "12:00",
        max_orders: Number(row.max_orders || 10),
        is_available: row.is_available ?? true,
      };
    })
    .filter(Boolean) as SpecialDeliverySlot[];
}

function normalizeNoDeliveryBlocks(settings: Record<string, string>) {
  const newBlocks = parseList<NoDeliveryBlock>(
    settings.no_delivery_blocks_json,
  );

  const oldFullDayDates = parseList<string>(settings.no_delivery_dates_json);

  const migratedOldBlocks: NoDeliveryBlock[] = oldFullDayDates.map((date) => ({
    id: `old-${date}`,
    block_date: date,
    start_time: "",
    end_time: "",
    reason: "No delivery",
    full_day: true,
  }));

  return [...newBlocks, ...migratedOldBlocks];
}

export default function AdminDeliveryManagement() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>("availability");

  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [vehicleRules, setVehicleRules] = useState<DeliveryVehicleRule[]>([]);
  const [distancePrices, setDistancePrices] = useState<DeliveryDistancePrice[]>(
    [],
  );
  const [settings, setSettings] = useState<Record<string, string>>({});

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [saving, setSaving] = useState(false);

  const [priceForm, setPriceForm] = useState(resetPriceForm());

  const [vehicleForm, setVehicleForm] = useState(resetVehicleForm());

  const [patternForm, setPatternForm] = useState({
    delivery_mode: "SCHEDULED" as DeliveryMode,
    business_open_time: "09:00",
    business_close_time: "18:00",
  });

  const [manualScheduleForm, setManualScheduleForm] = useState({
    slot_date: "",
    end_date: "",
    recurrence: "NONE" as RecurrenceMode,
    slot_label: "Morning Delivery",
    start_time: "09:00",
    end_time: "12:00",
    max_orders: 5,
    is_available: true,
  });

  const [dailySlotForm, setDailySlotForm] = useState({
    id: "",
    slot_label: "Morning Delivery",
    start_time: "09:00",
    end_time: "12:00",
    max_orders: 10,
    is_available: true,
  });

  const [specialSlotForm, setSpecialSlotForm] = useState({
    id: "",
    slot_date: "",
    slot_label: "Special Delivery",
    start_time: "09:00",
    end_time: "12:00",
    max_orders: 10,
    is_available: true,
  });

  const [noDeliveryBlockForm, setNoDeliveryBlockForm] = useState({
    id: "",
    block_date: "",
    start_time: "",
    end_time: "",
    reason: "",
    full_day: true,
  });

  const dailyDeliverySlots = useMemo(
    () => parseList<DailyDeliverySlot>(settings.daily_delivery_slots_json),
    [settings.daily_delivery_slots_json],
  );

  const specialDeliverySlots = useMemo(
    () => normalizeSpecialSlots(settings.special_delivery_dates_json),
    [settings.special_delivery_dates_json],
  );

  const noDeliveryBlocks = useMemo(
    () => normalizeNoDeliveryBlocks(settings),
    [settings],
  );

  const visibleDistancePrices = useMemo(() => {
    return distancePrices
      .filter((price) => price.price_table_key === REGULAR_PRICE_TABLE_KEY)
      .sort((a, b) => {
        if (a.vehicle_type !== b.vehicle_type) {
          return a.vehicle_type.localeCompare(b.vehicle_type);
        }

        return a.distance_km - b.distance_km;
      });
  }, [distancePrices]);

  const activePriceRows = visibleDistancePrices.filter(
    (price) => price.is_active,
  ).length;

  const minDistanceKm =
    visibleDistancePrices.length > 0
      ? Math.min(...visibleDistancePrices.map((price) => price.distance_km))
      : 0;

  const maxDistanceKm =
    visibleDistancePrices.length > 0
      ? Math.max(...visibleDistancePrices.map((price) => price.distance_km))
      : 0;

  const todayIso = new Date().toISOString().slice(0, 10);

  const upcomingManualSlots = slots.filter(
    (slot) => slot.is_available && slot.slot_date >= todayIso,
  ).length;


async function verifyAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    navigate("/login");
    return false;
  }

  if (user.role !== "admin" || !user.is_active) {
    navigate("/account");
    return false;
  }

  return true;
}


async function loadDeliveryData() {
  setErrorText("");

  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) return;

    const data = await getAdminDeliveryData();

    setSlots(data.slots as DeliverySlot[]);
    setVehicleRules(data.vehicleRules as DeliveryVehicleRule[]);
    setDistancePrices(data.distancePrices as DeliveryDistancePrice[]);
    setSettings(data.settings);

    setPatternForm((prev) => ({
      ...prev,
      delivery_mode: (data.settings.delivery_mode ||
        "SCHEDULED") as DeliveryMode,
      business_open_time:
        data.settings.business_open_time || "09:00",
      business_close_time:
        data.settings.business_close_time || "18:00",
    }));
  } catch (error) {
    setErrorText(
      error instanceof Error
        ? error.message
        : "Could not load delivery data.",
    );
  }
}

  useEffect(() => {
    loadDeliveryData();
  }, []);


async function saveSettingRows(rows: DeliverySetting[]) {
  try {
    const data = await saveAdminDeliverySettings(rows);

    setSlots(data.slots as DeliverySlot[]);
    setVehicleRules(data.vehicleRules as DeliveryVehicleRule[]);
    setDistancePrices(data.distancePrices as DeliveryDistancePrice[]);
    setSettings(data.settings);
    setSuccessText("Delivery settings updated.");
    return true;
  } catch (error) {
    setErrorText(
      error instanceof Error
        ? error.message
        : "Could not update delivery settings.",
    );
    return false;
  }
}

  async function savePatternSettings() {
    setSaving(true);
    setErrorText("");
    setSuccessText("");

    await saveSettingRows([
      {
        setting_key: "delivery_mode",
        setting_value: patternForm.delivery_mode,
      },
      {
        setting_key: "business_open_time",
        setting_value: patternForm.business_open_time,
      },
      {
        setting_key: "business_close_time",
        setting_value: patternForm.business_close_time,
      },
    ]);

    setSaving(false);
  }


async function saveManualSchedule() {
  if (!manualScheduleForm.slot_date) {
    setErrorText("Please select a start date.");
    return;
  }

  if (
    manualScheduleForm.recurrence !== "NONE" &&
    !manualScheduleForm.end_date
  ) {
    setErrorText("Please select an end date for recurring delivery sessions.");
    return;
  }

  const dates = generateRecurringDates({
    startDate: manualScheduleForm.slot_date,
    endDate: manualScheduleForm.end_date,
    recurrence: manualScheduleForm.recurrence,
  });

  if (!dates.length) {
    setErrorText("No valid delivery dates found.");
    return;
  }

  setSaving(true);
  setErrorText("");
  setSuccessText("");

  try {
    await createAdminDeliverySlots(
      dates.map((date) => ({
        id: "",
        slot_date: date,
        slot_label: manualScheduleForm.slot_label,
        start_time: manualScheduleForm.start_time,
        end_time: manualScheduleForm.end_time,
        max_orders: Number(manualScheduleForm.max_orders || 0),
        is_available: manualScheduleForm.is_available,
      })),
    );

    setManualScheduleForm({
      slot_date: "",
      end_date: "",
      recurrence: "NONE",
      slot_label: "Morning Delivery",
      start_time: "09:00",
      end_time: "12:00",
      max_orders: 5,
      is_available: true,
    });

    setSuccessText(
      dates.length === 1
        ? "Delivery session created."
        : `${dates.length} delivery sessions created.`,
    );

    await loadDeliveryData();
  } catch (error) {
    setErrorText(
      error instanceof Error
        ? error.message
        : "Could not create delivery sessions.",
    );
  } finally {
    setSaving(false);
  }
}


async function deleteSlot(id: string) {
  if (!window.confirm("Delete this delivery slot?")) return;

  try {
    await deleteAdminDeliverySlot(id);
    setSuccessText("Delivery slot deleted.");
    await loadDeliveryData();
  } catch (error) {
    setErrorText(
      error instanceof Error
        ? error.message
        : "Could not delete the delivery slot.",
    );
  }
}

  async function saveDailySlot() {
    if (!dailySlotForm.slot_label.trim()) {
      setErrorText("Please add a daily slot label.");
      return;
    }

    if (!dailySlotForm.start_time || !dailySlotForm.end_time) {
      setErrorText("Please add start and end time.");
      return;
    }

    const nextSlot: DailyDeliverySlot = {
      id: dailySlotForm.id || makeId("daily"),
      slot_label: dailySlotForm.slot_label,
      start_time: dailySlotForm.start_time,
      end_time: dailySlotForm.end_time,
      max_orders: Number(dailySlotForm.max_orders || 0),
      is_available: dailySlotForm.is_available,
    };

    const next = dailySlotForm.id
      ? dailyDeliverySlots.map((slot) =>
          slot.id === dailySlotForm.id ? nextSlot : slot,
        )
      : [...dailyDeliverySlots, nextSlot];

    const saved = await saveSettingRows([
      {
        setting_key: "daily_delivery_slots_json",
        setting_value: JSON.stringify(next),
      },
    ]);

    if (!saved) return;

    setDailySlotForm({
      id: "",
      slot_label: "Morning Delivery",
      start_time: "09:00",
      end_time: "12:00",
      max_orders: 10,
      is_available: true,
    });
  }

  async function deleteDailySlot(id: string) {
    const next = dailyDeliverySlots.filter((slot) => slot.id !== id);

    await saveSettingRows([
      {
        setting_key: "daily_delivery_slots_json",
        setting_value: JSON.stringify(next),
      },
    ]);
  }

  async function saveSpecialSlot() {
    if (!specialSlotForm.slot_date) {
      setErrorText("Please select a special delivery date.");
      return;
    }

    if (!specialSlotForm.slot_label.trim()) {
      setErrorText("Please add a special delivery label.");
      return;
    }

    const nextSlot: SpecialDeliverySlot = {
      id: specialSlotForm.id || makeId("special"),
      slot_date: specialSlotForm.slot_date,
      slot_label: specialSlotForm.slot_label,
      start_time: specialSlotForm.start_time,
      end_time: specialSlotForm.end_time,
      max_orders: Number(specialSlotForm.max_orders || 0),
      is_available: specialSlotForm.is_available,
    };

    const next = specialSlotForm.id
      ? specialDeliverySlots.map((slot) =>
          slot.id === specialSlotForm.id ? nextSlot : slot,
        )
      : [...specialDeliverySlots, nextSlot];

    const saved = await saveSettingRows([
      {
        setting_key: "special_delivery_dates_json",
        setting_value: JSON.stringify(next),
      },
    ]);

    if (!saved) return;

    setSpecialSlotForm({
      id: "",
      slot_date: "",
      slot_label: "Special Delivery",
      start_time: "09:00",
      end_time: "12:00",
      max_orders: 10,
      is_available: true,
    });
  }

  async function deleteSpecialSlot(id: string) {
    const next = specialDeliverySlots.filter((slot) => slot.id !== id);

    await saveSettingRows([
      {
        setting_key: "special_delivery_dates_json",
        setting_value: JSON.stringify(next),
      },
    ]);
  }

  async function saveNoDeliveryBlock() {
    if (!noDeliveryBlockForm.block_date) {
      setErrorText("Please select a no-delivery date.");
      return;
    }

    if (
      !noDeliveryBlockForm.full_day &&
      (!noDeliveryBlockForm.start_time || !noDeliveryBlockForm.end_time)
    ) {
      setErrorText("Please add start and end time, or mark it as full day.");
      return;
    }

    const nextBlock: NoDeliveryBlock = {
      id: noDeliveryBlockForm.id || makeId("block"),
      block_date: noDeliveryBlockForm.block_date,
      start_time: noDeliveryBlockForm.full_day
        ? ""
        : noDeliveryBlockForm.start_time,
      end_time: noDeliveryBlockForm.full_day
        ? ""
        : noDeliveryBlockForm.end_time,
      reason: noDeliveryBlockForm.reason || "No delivery",
      full_day: noDeliveryBlockForm.full_day,
    };

    const newOnlyBlocks = parseList<NoDeliveryBlock>(
      settings.no_delivery_blocks_json,
    );

    const next = noDeliveryBlockForm.id
      ? newOnlyBlocks.map((block) =>
          block.id === noDeliveryBlockForm.id ? nextBlock : block,
        )
      : [...newOnlyBlocks, nextBlock];

    const saved = await saveSettingRows([
      {
        setting_key: "no_delivery_blocks_json",
        setting_value: JSON.stringify(next),
      },
    ]);

    if (!saved) return;

    setNoDeliveryBlockForm({
      id: "",
      block_date: "",
      start_time: "",
      end_time: "",
      reason: "",
      full_day: true,
    });
  }

  async function deleteNoDeliveryBlock(id: string) {
    const newOnlyBlocks = parseList<NoDeliveryBlock>(
      settings.no_delivery_blocks_json,
    );

    const next = newOnlyBlocks.filter((block) => block.id !== id);

    await saveSettingRows([
      {
        setting_key: "no_delivery_blocks_json",
        setting_value: JSON.stringify(next),
      },
    ]);
  }


async function savePrice() {
  if (!priceForm.distance_km || Number(priceForm.distance_km) < 1) {
    setErrorText("Distance must be at least 1km.");
    return;
  }

  if (!priceForm.normal_price_lkr || Number(priceForm.normal_price_lkr) <= 0) {
    setErrorText("Please enter a valid regular delivery fee.");
    return;
  }

  setSaving(true);
  setErrorText("");
  setSuccessText("");

  try {
    const regularPrice = Number(priceForm.normal_price_lkr || 0);

    await saveAdminDistancePrice({
      id: priceForm.id || undefined,
      price_table_key: REGULAR_PRICE_TABLE_KEY,
      distance_km: Number(priceForm.distance_km || 0),
      vehicle_type: priceForm.vehicle_type,
      normal_price_lkr: regularPrice,
      peak_price_lkr: regularPrice,
      is_active: priceForm.is_active,
    });

    const wasEditing = Boolean(priceForm.id);
    setPriceForm(resetPriceForm());
    setSuccessText(wasEditing ? "Price row updated." : "Price row created.");
    await loadDeliveryData();
  } catch (error) {
    setErrorText(
      error instanceof Error
        ? error.message
        : "Could not save the delivery price.",
    );
  } finally {
    setSaving(false);
  }
}


async function deletePrice(id: string) {
  if (!window.confirm("Delete this price row?")) return;

  try {
    await deleteAdminDistancePrice(id);
    setSuccessText("Price row deleted.");
    await loadDeliveryData();
  } catch (error) {
    setErrorText(
      error instanceof Error
        ? error.message
        : "Could not delete the price row.",
    );
  }
}


async function saveVehicleRule() {
  if (!vehicleForm.min_quantity || Number(vehicleForm.min_quantity) < 1) {
    setErrorText("Minimum quantity must be at least 1.");
    return;
  }

  setSaving(true);
  setErrorText("");
  setSuccessText("");

  try {
    await saveAdminVehicleRule({
      id: vehicleForm.id || undefined,
      vehicle_type: vehicleForm.vehicle_type,
      min_quantity: Number(vehicleForm.min_quantity || 0),
      max_quantity: vehicleForm.max_quantity
        ? Number(vehicleForm.max_quantity)
        : null,
      is_active: vehicleForm.is_active,
    });

    const wasEditing = Boolean(vehicleForm.id);
    setVehicleForm(resetVehicleForm());
    setSuccessText(
      wasEditing ? "Vehicle rule updated." : "Vehicle rule created.",
    );
    await loadDeliveryData();
  } catch (error) {
    setErrorText(
      error instanceof Error
        ? error.message
        : "Could not save the vehicle rule.",
    );
  } finally {
    setSaving(false);
  }
}


async function deleteVehicleRule(id: string) {
  if (!window.confirm("Delete this vehicle rule?")) return;

  try {
    await deleteAdminVehicleRule(id);
    setSuccessText("Vehicle rule deleted.");
    await loadDeliveryData();
  } catch (error) {
    setErrorText(
      error instanceof Error
        ? error.message
        : "Could not delete the vehicle rule.",
    );
  }
}

  async function saveCommonSettings() {
    setSaving(true);
    setErrorText("");
    setSuccessText("");

    await saveSettingRows([
      {
        setting_key: "safety_margin_percent",
        setting_value: settings.safety_margin_percent || "0",
      },
      {
        setting_key: "round_to_lkr",
        setting_value: settings.round_to_lkr || "50",
      },
    ]);

    setSaving(false);
  }

  return (
    <Page>
      <div className="space-y-5">
        <header className="rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.3em] text-brand-ink/50 sm:text-xs">
                DELIVERY MANAGEMENT
              </p>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
                Delivery control center
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/65">
                Manage delivery mode, customer-visible sessions, blocked dates,
                regular distance pricing, vehicle rules, and global delivery
                settings.
              </p>
            </div>

            <Link
              to="/admin/dashboard"
              className="w-fit rounded-2xl border border-brand-ink/20 bg-white/70 px-5 py-3 text-sm font-semibold text-brand-ink"
            >
              Dashboard
            </Link>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-black/10 bg-brand-bg/60 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition",
                  activeTab === tab.key
                    ? "bg-brand-ink text-brand-bg shadow-sm"
                    : "bg-white/60 text-brand-ink/65 hover:bg-white",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        {successText && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {successText}
          </div>
        )}

        {activeTab === "availability" && (
          <section className="rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-brand-ink">
                  Delivery availability & schedule
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/65">
                  Choose how customers can select delivery sessions. The order
                  page will show sessions from the selected delivery mode only.
                </p>
              </div>

              <span className="w-fit rounded-2xl border border-brand-ink/10 bg-brand-bg/70 px-4 py-2 text-xs font-semibold text-brand-ink/70">
                Current mode: {patternForm.delivery_mode}
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <PatternCard
                active={patternForm.delivery_mode === "SCHEDULED"}
                title="Manual delivery sessions"
                description="Create slots for exact dates. Supports daily, weekly, and monthly repeating creation."
                onClick={() =>
                  setPatternForm((p) => ({ ...p, delivery_mode: "SCHEDULED" }))
                }
              />

              <PatternCard
                active={patternForm.delivery_mode === "EVERYDAY"}
                title="Daily delivery allowed"
                description="Create daily time slots once. They continue every day automatically."
                onClick={() =>
                  setPatternForm((p) => ({ ...p, delivery_mode: "EVERYDAY" }))
                }
              />

              <PatternCard
                active={patternForm.delivery_mode === "SPECIAL"}
                title="Special date delivery"
                description="Create delivery slots only for selected special dates."
                onClick={() =>
                  setPatternForm((p) => ({ ...p, delivery_mode: "SPECIAL" }))
                }
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Field label="Business open time">
                <input
                  type="time"
                  className="input-order"
                  value={patternForm.business_open_time}
                  onChange={(e) =>
                    setPatternForm((p) => ({
                      ...p,
                      business_open_time: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Business close time">
                <input
                  type="time"
                  className="input-order"
                  value={patternForm.business_close_time}
                  onChange={(e) =>
                    setPatternForm((p) => ({
                      ...p,
                      business_close_time: e.target.value,
                    }))
                  }
                />
              </Field>

              <div className="flex items-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={savePatternSettings}
                  className="w-full rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg disabled:cursor-not-allowed disabled:bg-brand-ink/40"
                >
                  {saving ? "Saving..." : "Save mode"}
                </button>
              </div>
            </div>

            {patternForm.delivery_mode === "SCHEDULED" && (
              <div className="mt-6 rounded-3xl border border-black/10 bg-brand-bg/55 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-brand-ink">
                      Manual scheduled delivery sessions
                    </h3>

                    <p className="mt-1 text-sm text-brand-ink/60">
                      Create delivery sessions for exact dates. Use repeat to
                      generate many sessions at once.
                    </p>
                  </div>

                  <span className="w-fit rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold text-brand-ink/70">
                    {upcomingManualSlots} upcoming manual slots
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-8">
                  <Field label="Start date">
                    <input
                      type="date"
                      value={manualScheduleForm.slot_date}
                      onChange={(e) =>
                        setManualScheduleForm((p) => ({
                          ...p,
                          slot_date: e.target.value,
                        }))
                      }
                      className="input-order"
                    />
                  </Field>

                  <Field label="End date">
                    <input
                      type="date"
                      value={manualScheduleForm.end_date}
                      onChange={(e) =>
                        setManualScheduleForm((p) => ({
                          ...p,
                          end_date: e.target.value,
                        }))
                      }
                      className="input-order"
                    />
                  </Field>

                  <Field label="Repeat">
                    <select
                      className="input-order"
                      value={manualScheduleForm.recurrence}
                      onChange={(e) =>
                        setManualScheduleForm((p) => ({
                          ...p,
                          recurrence: e.target.value as RecurrenceMode,
                        }))
                      }
                    >
                      <option value="NONE">No repeat</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </Field>

                  <Field label="Slot label">
                    <input
                      value={manualScheduleForm.slot_label}
                      onChange={(e) =>
                        setManualScheduleForm((p) => ({
                          ...p,
                          slot_label: e.target.value,
                        }))
                      }
                      className="input-order"
                    />
                  </Field>

                  <Field label="Start time">
                    <input
                      type="time"
                      value={manualScheduleForm.start_time}
                      onChange={(e) =>
                        setManualScheduleForm((p) => ({
                          ...p,
                          start_time: e.target.value,
                        }))
                      }
                      className="input-order"
                    />
                  </Field>

                  <Field label="End time">
                    <input
                      type="time"
                      value={manualScheduleForm.end_time}
                      onChange={(e) =>
                        setManualScheduleForm((p) => ({
                          ...p,
                          end_time: e.target.value,
                        }))
                      }
                      className="input-order"
                    />
                  </Field>

                  <Field label="Max orders">
                    <input
                      type="number"
                      min={1}
                      value={manualScheduleForm.max_orders}
                      onChange={(e) =>
                        setManualScheduleForm((p) => ({
                          ...p,
                          max_orders: Number(e.target.value),
                        }))
                      }
                      className="input-order"
                    />
                  </Field>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={saveManualSchedule}
                      disabled={saving}
                      className="w-full rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg disabled:cursor-not-allowed disabled:bg-brand-ink/40"
                    >
                      {saving ? "Creating..." : "Create"}
                    </button>
                  </div>
                </div>

                <label className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-ink/70">
                  <input
                    type="checkbox"
                    checked={manualScheduleForm.is_available}
                    onChange={(e) =>
                      setManualScheduleForm((p) => ({
                        ...p,
                        is_available: e.target.checked,
                      }))
                    }
                  />
                  Available for customers
                </label>

                <div className="mt-5 overflow-x-auto rounded-3xl border border-black/10 bg-white/70">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-brand-bg/70 text-xs uppercase tracking-widest text-brand-ink/55">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Session</th>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Max</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {slots.length ? (
                        slots.map((slot) => (
                          <tr
                            key={slot.id}
                            className="border-t border-black/10"
                          >
                            <td className="px-4 py-3 font-semibold text-brand-ink">
                              {slot.slot_date}
                            </td>

                            <td className="px-4 py-3">{slot.slot_label}</td>

                            <td className="px-4 py-3">
                              {slot.start_time.slice(0, 5)} –{" "}
                              {slot.end_time.slice(0, 5)}
                            </td>

                            <td className="px-4 py-3">{slot.max_orders}</td>

                            <td className="px-4 py-3">
                              <span
                                className={[
                                  "rounded-full px-3 py-1 text-xs font-semibold",
                                  slot.is_available
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700",
                                ].join(" ")}
                              >
                                {slot.is_available ? "Available" : "Closed"}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                                  onClick={() => deleteSlot(slot.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-sm text-brand-ink/55"
                          >
                            No manual delivery sessions created yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {patternForm.delivery_mode === "EVERYDAY" && (
              <div className="mt-6 rounded-3xl border border-black/10 bg-brand-bg/55 p-4">
                <h3 className="font-semibold text-brand-ink">
                  Daily repeating delivery slots
                </h3>

                <p className="mt-1 text-sm text-brand-ink/60">
                  These slots repeat every day automatically. No need to create
                  delivery dates one by one.
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-6">
                  <Field label="Slot label">
                    <input
                      className="input-order"
                      value={dailySlotForm.slot_label}
                      onChange={(e) =>
                        setDailySlotForm((p) => ({
                          ...p,
                          slot_label: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Start time">
                    <input
                      type="time"
                      className="input-order"
                      value={dailySlotForm.start_time}
                      onChange={(e) =>
                        setDailySlotForm((p) => ({
                          ...p,
                          start_time: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="End time">
                    <input
                      type="time"
                      className="input-order"
                      value={dailySlotForm.end_time}
                      onChange={(e) =>
                        setDailySlotForm((p) => ({
                          ...p,
                          end_time: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Max orders">
                    <input
                      type="number"
                      min={1}
                      className="input-order"
                      value={dailySlotForm.max_orders}
                      onChange={(e) =>
                        setDailySlotForm((p) => ({
                          ...p,
                          max_orders: Number(e.target.value),
                        }))
                      }
                    />
                  </Field>

                  <Field label="Status">
                    <select
                      className="input-order"
                      value={dailySlotForm.is_available ? "true" : "false"}
                      onChange={(e) =>
                        setDailySlotForm((p) => ({
                          ...p,
                          is_available: e.target.value === "true",
                        }))
                      }
                    >
                      <option value="true">Available</option>
                      <option value="false">Closed</option>
                    </select>
                  </Field>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={saveDailySlot}
                      disabled={saving}
                      className="w-full rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg disabled:cursor-not-allowed disabled:bg-brand-ink/40"
                    >
                      {dailySlotForm.id ? "Update" : "Add"}
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {dailyDeliverySlots.length ? (
                    dailyDeliverySlots.map((slot) => (
                      <RowShell key={slot.id}>
                        <div>
                          <p className="font-semibold text-brand-ink">
                            {slot.slot_label}
                          </p>

                          <p className="text-sm text-brand-ink/60">
                            {slot.start_time} – {slot.end_time} · Max{" "}
                            {slot.max_orders} ·{" "}
                            {slot.is_available ? "Available" : "Closed"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
                            onClick={() => setDailySlotForm(slot)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                            onClick={() => deleteDailySlot(slot.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </RowShell>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                      No daily delivery slots added yet. Customers will not see
                      delivery sessions until you add at least one daily slot.
                    </div>
                  )}
                </div>
              </div>
            )}

            {patternForm.delivery_mode === "SPECIAL" && (
              <div className="mt-6 rounded-3xl border border-black/10 bg-brand-bg/55 p-4">
                <h3 className="font-semibold text-brand-ink">
                  Special date delivery slots
                </h3>

                <p className="mt-1 text-sm text-brand-ink/60">
                  Add exact dates and time slots for special delivery days.
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-7">
                  <Field label="Date">
                    <input
                      type="date"
                      className="input-order"
                      value={specialSlotForm.slot_date}
                      onChange={(e) =>
                        setSpecialSlotForm((p) => ({
                          ...p,
                          slot_date: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Label">
                    <input
                      className="input-order"
                      value={specialSlotForm.slot_label}
                      onChange={(e) =>
                        setSpecialSlotForm((p) => ({
                          ...p,
                          slot_label: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Start time">
                    <input
                      type="time"
                      className="input-order"
                      value={specialSlotForm.start_time}
                      onChange={(e) =>
                        setSpecialSlotForm((p) => ({
                          ...p,
                          start_time: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="End time">
                    <input
                      type="time"
                      className="input-order"
                      value={specialSlotForm.end_time}
                      onChange={(e) =>
                        setSpecialSlotForm((p) => ({
                          ...p,
                          end_time: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Max">
                    <input
                      type="number"
                      min={1}
                      className="input-order"
                      value={specialSlotForm.max_orders}
                      onChange={(e) =>
                        setSpecialSlotForm((p) => ({
                          ...p,
                          max_orders: Number(e.target.value),
                        }))
                      }
                    />
                  </Field>

                  <Field label="Status">
                    <select
                      className="input-order"
                      value={specialSlotForm.is_available ? "true" : "false"}
                      onChange={(e) =>
                        setSpecialSlotForm((p) => ({
                          ...p,
                          is_available: e.target.value === "true",
                        }))
                      }
                    >
                      <option value="true">Available</option>
                      <option value="false">Closed</option>
                    </select>
                  </Field>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={saveSpecialSlot}
                      disabled={saving}
                      className="w-full rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg disabled:cursor-not-allowed disabled:bg-brand-ink/40"
                    >
                      {specialSlotForm.id ? "Update" : "Add"}
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {specialDeliverySlots.length ? (
                    specialDeliverySlots.map((slot) => (
                      <RowShell key={slot.id}>
                        <div>
                          <p className="font-semibold text-brand-ink">
                            {slot.slot_date} — {slot.slot_label}
                          </p>

                          <p className="text-sm text-brand-ink/60">
                            {slot.start_time} – {slot.end_time} · Max{" "}
                            {slot.max_orders} ·{" "}
                            {slot.is_available ? "Available" : "Closed"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
                            onClick={() => setSpecialSlotForm(slot)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                            onClick={() => deleteSpecialSlot(slot.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </RowShell>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                      No special delivery slots added yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 rounded-3xl border border-black/10 bg-white/60 p-4">
              <h3 className="font-semibold text-brand-ink">
                No delivery dates and times
              </h3>

              <p className="mt-1 text-sm text-brand-ink/60">
                Block a full day or only a specific time range. These blocks
                apply to manual, daily, and special delivery modes.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-7">
                <Field label="Date">
                  <input
                    type="date"
                    className="input-order"
                    value={noDeliveryBlockForm.block_date}
                    onChange={(e) =>
                      setNoDeliveryBlockForm((p) => ({
                        ...p,
                        block_date: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Block type">
                  <select
                    className="input-order"
                    value={noDeliveryBlockForm.full_day ? "true" : "false"}
                    onChange={(e) =>
                      setNoDeliveryBlockForm((p) => ({
                        ...p,
                        full_day: e.target.value === "true",
                      }))
                    }
                  >
                    <option value="true">Full day</option>
                    <option value="false">Time range</option>
                  </select>
                </Field>

                <Field label="Start time">
                  <input
                    type="time"
                    className="input-order"
                    disabled={noDeliveryBlockForm.full_day}
                    value={noDeliveryBlockForm.start_time}
                    onChange={(e) =>
                      setNoDeliveryBlockForm((p) => ({
                        ...p,
                        start_time: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="End time">
                  <input
                    type="time"
                    className="input-order"
                    disabled={noDeliveryBlockForm.full_day}
                    value={noDeliveryBlockForm.end_time}
                    onChange={(e) =>
                      setNoDeliveryBlockForm((p) => ({
                        ...p,
                        end_time: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Reason">
                  <input
                    className="input-order"
                    placeholder="Holiday, break..."
                    value={noDeliveryBlockForm.reason}
                    onChange={(e) =>
                      setNoDeliveryBlockForm((p) => ({
                        ...p,
                        reason: e.target.value,
                      }))
                    }
                  />
                </Field>

                <div className="flex items-end md:col-span-2">
                  <button
                    type="button"
                    onClick={saveNoDeliveryBlock}
                    disabled={saving}
                    className="w-full rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg disabled:cursor-not-allowed disabled:bg-brand-ink/40"
                  >
                    {noDeliveryBlockForm.id ? "Update block" : "Add block"}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {noDeliveryBlocks.length ? (
                  noDeliveryBlocks.map((block) => (
                    <RowShell key={block.id}>
                      <div>
                        <p className="font-semibold text-brand-ink">
                          {block.block_date} — {block.reason || "No delivery"}
                        </p>

                        <p className="text-sm text-brand-ink/60">
                          {block.full_day
                            ? "Full day blocked"
                            : `${block.start_time} – ${block.end_time}`}
                        </p>
                      </div>

                      {!block.id.startsWith("old-") && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
                            onClick={() => setNoDeliveryBlockForm(block)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                            onClick={() => deleteNoDeliveryBlock(block.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </RowShell>
                  ))
                ) : (
                  <div className="rounded-2xl border border-black/10 bg-brand-bg/50 p-4 text-sm text-brand-ink/55">
                    No delivery blocks added.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "pricing" && (
          <section className="rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-brand-ink">
                  Regular delivery pricing
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/65">
                  Use one simple pricing table for customers. Add a price for
                  each vehicle and distance. Example: if the road distance is
                  4.2km, the order page uses the 5km pricing row.
                </p>
              </div>

              <span className="w-fit rounded-2xl border border-brand-ink/10 bg-brand-bg/70 px-4 py-2 text-xs font-semibold text-brand-ink/70">
                One regular table only
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Active price rows"
                value={String(activePriceRows)}
              />

              <StatCard
                label="Distance coverage"
                value={
                  visibleDistancePrices.length
                    ? `${minDistanceKm}km – ${maxDistanceKm}km`
                    : "-"
                }
              />

              <StatCard label="Pricing mode" value="Regular delivery" />
            </div>

            <div className="mt-5 grid gap-3 rounded-3xl border border-black/10 bg-brand-bg/55 p-4 md:grid-cols-6">
              <Field label="Distance km">
                <input
                  type="number"
                  min={1}
                  className="input-order"
                  value={priceForm.distance_km}
                  onChange={(e) =>
                    setPriceForm((p) => ({
                      ...p,
                      distance_km: Number(e.target.value),
                    }))
                  }
                  placeholder="Distance km"
                />
              </Field>

              <Field label="Vehicle">
                <select
                  className="input-order"
                  value={priceForm.vehicle_type}
                  onChange={(e) =>
                    setPriceForm((p) => ({
                      ...p,
                      vehicle_type: e.target.value,
                    }))
                  }
                >
                  <option value="BIKE">Bike</option>
                  <option value="THREE_WHEEL">Three wheel</option>
                  <option value="CAR">Car</option>
                  <option value="VAN">Van</option>
                </select>
              </Field>

              <Field label="Regular fee">
                <input
                  type="number"
                  className="input-order"
                  value={priceForm.normal_price_lkr}
                  onChange={(e) =>
                    setPriceForm((p) => ({
                      ...p,
                      normal_price_lkr: Number(e.target.value),
                      peak_price_lkr: Number(e.target.value),
                    }))
                  }
                  placeholder="Regular fee"
                />
              </Field>

              <Field label="Status">
                <select
                  className="input-order"
                  value={priceForm.is_active ? "true" : "false"}
                  onChange={(e) =>
                    setPriceForm((p) => ({
                      ...p,
                      is_active: e.target.value === "true",
                    }))
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </Field>

              <div className="flex items-end md:col-span-2">
                <div className="grid w-full grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={savePrice}
                    className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg disabled:cursor-not-allowed disabled:bg-brand-ink/40"
                  >
                    {priceForm.id ? "Update" : "Create"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriceForm(resetPriceForm())}
                    className="rounded-2xl border border-brand-ink/20 bg-white/70 px-5 py-3 text-sm font-semibold text-brand-ink"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-3xl border border-black/10 bg-white/70">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-brand-bg/70 text-xs uppercase tracking-widest text-brand-ink/55">
                  <tr>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Distance</th>
                    <th className="px-4 py-3">Regular fee</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleDistancePrices.length ? (
                    visibleDistancePrices.map((price) => (
                      <tr key={price.id} className="border-t border-black/10">
                        <td className="px-4 py-3 font-semibold text-brand-ink">
                          {vehicleIcon(price.vehicle_type)}{" "}
                          {vehicleName(price.vehicle_type)}
                        </td>

                        <td className="px-4 py-3">{price.distance_km}km</td>

                        <td className="px-4 py-3">
                          {formatLkr(price.normal_price_lkr)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={[
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              price.is_active
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700",
                            ].join(" ")}
                          >
                            {price.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
                              onClick={() =>
                                setPriceForm({
                                  id: price.id,
                                  price_table_key: REGULAR_PRICE_TABLE_KEY,
                                  distance_km: price.distance_km,
                                  vehicle_type: price.vehicle_type,
                                  normal_price_lkr: price.normal_price_lkr,
                                  peak_price_lkr: price.normal_price_lkr,
                                  is_active: price.is_active,
                                })
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                              onClick={() => deletePrice(price.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-sm text-brand-ink/55"
                      >
                        No regular delivery prices created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "vehicles" && (
          <section className="rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-brand-ink">
                  Vehicle rules
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/65">
                  Choose which vehicle type should be used based on the total
                  item quantity in the cart.
                </p>
              </div>

              <span className="w-fit rounded-2xl border border-brand-ink/10 bg-brand-bg/70 px-4 py-2 text-xs font-semibold text-brand-ink/70">
                {vehicleRules.filter((rule) => rule.is_active).length} active
                rules
              </span>
            </div>

            <div className="mt-5 grid gap-3 rounded-3xl border border-black/10 bg-brand-bg/55 p-4 md:grid-cols-6">
              <Field label="Vehicle">
                <select
                  className="input-order"
                  value={vehicleForm.vehicle_type}
                  onChange={(e) =>
                    setVehicleForm((p) => ({
                      ...p,
                      vehicle_type: e.target.value,
                    }))
                  }
                >
                  <option value="BIKE">Bike</option>
                  <option value="THREE_WHEEL">Three wheel</option>
                  <option value="CAR">Car</option>
                  <option value="VAN">Van</option>
                </select>
              </Field>

              <Field label="Min qty">
                <input
                  type="number"
                  className="input-order"
                  value={vehicleForm.min_quantity}
                  onChange={(e) =>
                    setVehicleForm((p) => ({
                      ...p,
                      min_quantity: Number(e.target.value),
                    }))
                  }
                  placeholder="Min qty"
                />
              </Field>

              <Field label="Max qty optional">
                <input
                  type="number"
                  className="input-order"
                  value={vehicleForm.max_quantity}
                  onChange={(e) =>
                    setVehicleForm((p) => ({
                      ...p,
                      max_quantity: e.target.value,
                    }))
                  }
                  placeholder="Max qty optional"
                />
              </Field>

              <Field label="Status">
                <select
                  className="input-order"
                  value={vehicleForm.is_active ? "true" : "false"}
                  onChange={(e) =>
                    setVehicleForm((p) => ({
                      ...p,
                      is_active: e.target.value === "true",
                    }))
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </Field>

              <div className="flex items-end md:col-span-2">
                <div className="grid w-full grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveVehicleRule}
                    className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg disabled:cursor-not-allowed disabled:bg-brand-ink/40"
                  >
                    {vehicleForm.id ? "Update" : "Create"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setVehicleForm(resetVehicleForm())}
                    className="rounded-2xl border border-brand-ink/20 bg-white/70 px-5 py-3 text-sm font-semibold text-brand-ink"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {vehicleRules.length ? (
                vehicleRules.map((rule) => (
                  <RowShell key={rule.id}>
                    <div>
                      <p className="font-semibold text-brand-ink">
                        {vehicleIcon(rule.vehicle_type)}{" "}
                        {vehicleName(rule.vehicle_type)}
                      </p>

                      <p className="text-sm text-brand-ink/60">
                        Quantity {rule.min_quantity} –{" "}
                        {rule.max_quantity ?? "above"} ·{" "}
                        {rule.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
                        onClick={() =>
                          setVehicleForm({
                            id: rule.id,
                            vehicle_type: rule.vehicle_type,
                            min_quantity: rule.min_quantity,
                            max_quantity: rule.max_quantity
                              ? String(rule.max_quantity)
                              : "",
                            is_active: rule.is_active,
                          })
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                        onClick={() => deleteVehicleRule(rule.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </RowShell>
                ))
              ) : (
                <EmptyState text="No vehicle rules created yet." />
              )}
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <section className="rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-brand-ink">
              Delivery settings
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/65">
              These settings are applied after the regular delivery price is
              selected from the distance table.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Safety margin percentage">
                <input
                  type="number"
                  className="input-order"
                  value={settings.safety_margin_percent || "0"}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      safety_margin_percent: e.target.value,
                    }))
                  }
                  placeholder="Example: 10"
                />
              </Field>

              <Field label="Round final delivery fee to LKR">
                <input
                  type="number"
                  className="input-order"
                  value={settings.round_to_lkr || "50"}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      round_to_lkr: e.target.value,
                    }))
                  }
                  placeholder="Example: 50"
                />
              </Field>
            </div>

            <div className="mt-5 rounded-3xl border border-black/10 bg-brand-bg/60 p-4 text-sm leading-relaxed text-brand-ink/65">
              Example: if regular fee is LKR 480, safety margin is 10%, and
              rounding is 50, the customer delivery fee becomes LKR 550.
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={saveCommonSettings}
              className="mt-5 rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg disabled:cursor-not-allowed disabled:bg-brand-ink/40"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </section>
        )}
      </div>
    </Page>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-brand-ink/55">
        {label}
      </span>
      {children}
    </label>
  );
}

function PatternCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-3xl border p-5 text-left transition",
        active
          ? "border-brand-ink bg-brand-ink text-brand-bg"
          : "border-black/10 bg-white/70 text-brand-ink hover:bg-white",
      ].join(" ")}
    >
      <p className="text-base font-semibold">{title}</p>

      <p
        className={[
          "mt-2 text-sm leading-relaxed",
          active ? "text-brand-bg/70" : "text-brand-ink/60",
        ].join(" ")}
      >
        {description}
      </p>
    </button>
  );
}

function RowShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm">
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
      <p className="text-xs font-semibold tracking-widest text-brand-ink/50">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-brand-ink">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-brand-bg/50 p-4 text-sm text-brand-ink/55">
      {text}
    </div>
  );
}