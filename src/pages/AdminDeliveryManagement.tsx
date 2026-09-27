/** @format */

import {
  Ban,
  Bike,
  CalendarDays,
  Car,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Gauge,
  MapPin,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
  X,
} from "lucide-react";
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

const tabs: {
  key: TabKey;
  label: string;
  description: string;
  icon: typeof CalendarDays;
}[] = [
  {
    key: "availability",
    label: "Schedule",
    description: "Delivery days & times",
    icon: CalendarDays,
  },
  {
    key: "pricing",
    label: "Pricing",
    description: "Distance based fees",
    icon: CircleDollarSign,
  },
  {
    key: "vehicles",
    label: "Vehicles",
    description: "Quantity rules",
    icon: Truck,
  },
  {
    key: "settings",
    label: "Settings",
    description: "Limits & fee rules",
    icon: Settings2,
  },
];

function vehicleIcon(type: string) {
  if (type === "BIKE") return Bike;
  if (type === "CAR") return Car;
  return Truck;
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

  const oldFullDayDates = parseList<string>(
    settings.no_delivery_dates_json,
  );

  const migratedOldBlocks: NoDeliveryBlock[] = oldFullDayDates.map(
    (date) => ({
      id: `old-${date}`,
      block_date: date,
      start_time: "",
      end_time: "",
      reason: "No delivery",
      full_day: true,
    }),
  );

  return [...newBlocks, ...migratedOldBlocks];
}

function modeLabel(mode: DeliveryMode) {
  if (mode === "SCHEDULED") return "Manual schedule";
  if (mode === "EVERYDAY") return "Every day";
  return "Special dates";
}

export default function AdminDeliveryManagement() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState<TabKey>("availability");

  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [vehicleRules, setVehicleRules] = useState<
    DeliveryVehicleRule[]
  >([]);
  const [distancePrices, setDistancePrices] = useState<
    DeliveryDistancePrice[]
  >([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
    () =>
      parseList<DailyDeliverySlot>(
        settings.daily_delivery_slots_json,
      ),
    [settings.daily_delivery_slots_json],
  );

  const specialDeliverySlots = useMemo(
    () =>
      normalizeSpecialSlots(
        settings.special_delivery_dates_json,
      ),
    [settings.special_delivery_dates_json],
  );

  const noDeliveryBlocks = useMemo(
    () => normalizeNoDeliveryBlocks(settings),
    [settings],
  );

  const visibleDistancePrices = useMemo(() => {
    return distancePrices
      .filter(
        (price) =>
          price.price_table_key === REGULAR_PRICE_TABLE_KEY,
      )
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
      ? Math.min(
          ...visibleDistancePrices.map(
            (price) => price.distance_km,
          ),
        )
      : 0;

  const maxDistanceKm =
    visibleDistancePrices.length > 0
      ? Math.max(
          ...visibleDistancePrices.map(
            (price) => price.distance_km,
          ),
        )
      : 0;

  const maxDeliveryDistanceKm = Number(
    settings.max_delivery_distance_km || "25",
  );

  const pricingCoverageWarning =
    maxDistanceKm > 0 &&
    maxDeliveryDistanceKm > maxDistanceKm;

  const todayIso = new Date().toISOString().slice(0, 10);

  const upcomingManualSlots = slots.filter(
    (slot) =>
      slot.is_available && slot.slot_date >= todayIso,
  ).length;

  const activeVehicleRules = vehicleRules.filter(
    (rule) => rule.is_active,
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
      setVehicleRules(
        data.vehicleRules as DeliveryVehicleRule[],
      );
      setDistancePrices(
        data.distancePrices as DeliveryDistancePrice[],
      );
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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeliveryData();
  }, []);

  async function saveSettingRows(rows: DeliverySetting[]) {
    try {
      const data = await saveAdminDeliverySettings(rows);

      setSlots(data.slots as DeliverySlot[]);
      setVehicleRules(
        data.vehicleRules as DeliveryVehicleRule[],
      );
      setDistancePrices(
        data.distancePrices as DeliveryDistancePrice[],
      );
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
      setErrorText(
        "Please select an end date for recurring delivery sessions.",
      );
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
          max_orders: Number(
            manualScheduleForm.max_orders || 0,
          ),
          is_available:
            manualScheduleForm.is_available,
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

    if (
      !dailySlotForm.start_time ||
      !dailySlotForm.end_time
    ) {
      setErrorText("Please add start and end time.");
      return;
    }

    const nextSlot: DailyDeliverySlot = {
      id: dailySlotForm.id || makeId("daily"),
      slot_label: dailySlotForm.slot_label,
      start_time: dailySlotForm.start_time,
      end_time: dailySlotForm.end_time,
      max_orders: Number(
        dailySlotForm.max_orders || 0,
      ),
      is_available: dailySlotForm.is_available,
    };

    const next = dailySlotForm.id
      ? dailyDeliverySlots.map((slot) =>
          slot.id === dailySlotForm.id
            ? nextSlot
            : slot,
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
    const next = dailyDeliverySlots.filter(
      (slot) => slot.id !== id,
    );

    await saveSettingRows([
      {
        setting_key: "daily_delivery_slots_json",
        setting_value: JSON.stringify(next),
      },
    ]);
  }

  async function saveSpecialSlot() {
    if (!specialSlotForm.slot_date) {
      setErrorText(
        "Please select a special delivery date.",
      );
      return;
    }

    if (!specialSlotForm.slot_label.trim()) {
      setErrorText(
        "Please add a special delivery label.",
      );
      return;
    }

    const nextSlot: SpecialDeliverySlot = {
      id: specialSlotForm.id || makeId("special"),
      slot_date: specialSlotForm.slot_date,
      slot_label: specialSlotForm.slot_label,
      start_time: specialSlotForm.start_time,
      end_time: specialSlotForm.end_time,
      max_orders: Number(
        specialSlotForm.max_orders || 0,
      ),
      is_available: specialSlotForm.is_available,
    };

    const next = specialSlotForm.id
      ? specialDeliverySlots.map((slot) =>
          slot.id === specialSlotForm.id
            ? nextSlot
            : slot,
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
    const next = specialDeliverySlots.filter(
      (slot) => slot.id !== id,
    );

    await saveSettingRows([
      {
        setting_key: "special_delivery_dates_json",
        setting_value: JSON.stringify(next),
      },
    ]);
  }

  async function saveNoDeliveryBlock() {
    if (!noDeliveryBlockForm.block_date) {
      setErrorText(
        "Please select a no-delivery date.",
      );
      return;
    }

    if (
      !noDeliveryBlockForm.full_day &&
      (!noDeliveryBlockForm.start_time ||
        !noDeliveryBlockForm.end_time)
    ) {
      setErrorText(
        "Please add start and end time, or mark it as full day.",
      );
      return;
    }

    const nextBlock: NoDeliveryBlock = {
      id:
        noDeliveryBlockForm.id ||
        makeId("block"),
      block_date: noDeliveryBlockForm.block_date,
      start_time: noDeliveryBlockForm.full_day
        ? ""
        : noDeliveryBlockForm.start_time,
      end_time: noDeliveryBlockForm.full_day
        ? ""
        : noDeliveryBlockForm.end_time,
      reason:
        noDeliveryBlockForm.reason ||
        "No delivery",
      full_day: noDeliveryBlockForm.full_day,
    };

    const newOnlyBlocks =
      parseList<NoDeliveryBlock>(
        settings.no_delivery_blocks_json,
      );

    const next = noDeliveryBlockForm.id
      ? newOnlyBlocks.map((block) =>
          block.id === noDeliveryBlockForm.id
            ? nextBlock
            : block,
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
    const newOnlyBlocks =
      parseList<NoDeliveryBlock>(
        settings.no_delivery_blocks_json,
      );

    const next = newOnlyBlocks.filter(
      (block) => block.id !== id,
    );

    await saveSettingRows([
      {
        setting_key: "no_delivery_blocks_json",
        setting_value: JSON.stringify(next),
      },
    ]);
  }

  async function savePrice() {
    if (
      !priceForm.distance_km ||
      Number(priceForm.distance_km) < 1
    ) {
      setErrorText(
        "Distance must be at least 1km.",
      );
      return;
    }

    if (
      !priceForm.normal_price_lkr ||
      Number(priceForm.normal_price_lkr) <= 0
    ) {
      setErrorText(
        "Please enter a valid regular delivery fee.",
      );
      return;
    }

    setSaving(true);
    setErrorText("");
    setSuccessText("");

    try {
      const regularPrice = Number(
        priceForm.normal_price_lkr || 0,
      );

      await saveAdminDistancePrice({
        id: priceForm.id || undefined,
        price_table_key:
          REGULAR_PRICE_TABLE_KEY,
        distance_km: Number(
          priceForm.distance_km || 0,
        ),
        vehicle_type:
          priceForm.vehicle_type,
        normal_price_lkr: regularPrice,
        peak_price_lkr: regularPrice,
        is_active: priceForm.is_active,
      });

      const wasEditing = Boolean(priceForm.id);

      setPriceForm(resetPriceForm());

      setSuccessText(
        wasEditing
          ? "Price row updated."
          : "Price row created.",
      );

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
    if (!window.confirm("Delete this price row?"))
      return;

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
    if (
      !vehicleForm.min_quantity ||
      Number(vehicleForm.min_quantity) < 1
    ) {
      setErrorText(
        "Minimum quantity must be at least 1.",
      );
      return;
    }

    if (
      vehicleForm.max_quantity &&
      Number(vehicleForm.max_quantity) <
        Number(vehicleForm.min_quantity)
    ) {
      setErrorText(
        "Maximum quantity cannot be lower than the minimum quantity.",
      );
      return;
    }

    setSaving(true);
    setErrorText("");
    setSuccessText("");

    try {
      await saveAdminVehicleRule({
        id: vehicleForm.id || undefined,
        vehicle_type:
          vehicleForm.vehicle_type,
        min_quantity: Number(
          vehicleForm.min_quantity || 0,
        ),
        max_quantity:
          vehicleForm.max_quantity
            ? Number(
                vehicleForm.max_quantity,
              )
            : null,
        is_active: vehicleForm.is_active,
      });

      const wasEditing = Boolean(
        vehicleForm.id,
      );

      setVehicleForm(resetVehicleForm());

      setSuccessText(
        wasEditing
          ? "Vehicle rule updated."
          : "Vehicle rule created.",
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
    if (
      !window.confirm(
        "Delete this vehicle rule?",
      )
    ) {
      return;
    }

    try {
      await deleteAdminVehicleRule(id);
      setSuccessText(
        "Vehicle rule deleted.",
      );
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
    const maxDistance = Number(
      settings.max_delivery_distance_km ||
        "25",
    );

    const safetyMargin = Number(
      settings.safety_margin_percent || "0",
    );

    const rounding = Number(
      settings.round_to_lkr || "50",
    );

    if (
      !Number.isFinite(maxDistance) ||
      maxDistance <= 0
    ) {
      setErrorText(
        "Maximum delivery distance must be greater than 0 km.",
      );
      return;
    }

    if (
      !Number.isFinite(safetyMargin) ||
      safetyMargin < 0
    ) {
      setErrorText(
        "Safety margin cannot be negative.",
      );
      return;
    }

    if (
      !Number.isFinite(rounding) ||
      rounding < 1
    ) {
      setErrorText(
        "Delivery fee rounding must be at least LKR 1.",
      );
      return;
    }

    setSaving(true);
    setErrorText("");
    setSuccessText("");

    await saveSettingRows([
      {
        setting_key:
          "max_delivery_distance_km",
        setting_value: String(maxDistance),
      },
      {
        setting_key:
          "safety_margin_percent",
        setting_value: String(safetyMargin),
      },
      {
        setting_key: "round_to_lkr",
        setting_value: String(rounding),
      },
    ]);

    setSaving(false);
  }

  if (loading) {
    return (
      <Page>
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-medium text-brand-ink/55">
            <RefreshCw
              size={17}
              className="animate-spin"
            />
            Loading delivery controls...
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="mx-auto w-full max-w-[1380px] pb-10">
        {/* HEADER */}

        <header className="border-b border-brand-ink/10 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-ink/40">
                <Truck size={14} />
                Delivery management
              </div>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
                Delivery control center
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-ink/55">
                Control where Baura delivers,
                when customers can receive orders
                and how delivery fees are
                calculated.
              </p>
            </div>

            <Link
              to="/admin/dashboard"
              className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-brand-ink/10 bg-white/55 px-4 text-xs font-semibold text-brand-ink transition hover:border-brand-ink/20 hover:bg-white/80"
            >
              Dashboard
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* STATUS STRIP */}

          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStatus
              icon={<MapPin size={15} />}
              label="Delivery radius"
              value={`${maxDeliveryDistanceKm} km`}
            />

            <MiniStatus
              icon={<Clock3 size={15} />}
              label="Delivery mode"
              value={modeLabel(
                patternForm.delivery_mode,
              )}
            />

            <MiniStatus
              icon={<CircleDollarSign size={15} />}
              label="Pricing coverage"
              value={
                maxDistanceKm
                  ? `Up to ${maxDistanceKm} km`
                  : "Not configured"
              }
              warning={pricingCoverageWarning}
            />

            <MiniStatus
              icon={<Truck size={15} />}
              label="Vehicle rules"
              value={`${activeVehicleRules} active`}
            />
          </div>
        </header>

        {/* NAVIGATION */}

        <nav className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active =
              activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  setActiveTab(tab.key)
                }
                className={[
                  "flex min-h-[74px] items-center gap-3 rounded-[1.1rem] border px-4 text-left transition",
                  active
                    ? "border-brand-ink bg-brand-ink text-brand-bg shadow-[0_10px_24px_rgba(55,38,25,0.10)]"
                    : "border-brand-ink/10 bg-white/45 text-brand-ink hover:border-brand-ink/20 hover:bg-white/70",
                ].join(" ")}
              >
                <div
                  className={[
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                    active
                      ? "bg-white/10"
                      : "bg-brand-ink/[0.05]",
                  ].join(" ")}
                >
                  <Icon size={17} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {tab.label}
                  </p>

                  <p
                    className={[
                      "mt-0.5 hidden truncate text-[11px] sm:block",
                      active
                        ? "text-brand-bg/60"
                        : "text-brand-ink/45",
                    ].join(" ")}
                  >
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* MESSAGES */}

        {errorText && (
          <Alert
            tone="error"
            onClose={() => setErrorText("")}
          >
            {errorText}
          </Alert>
        )}

        {successText && (
          <Alert
            tone="success"
            onClose={() => setSuccessText("")}
          >
            {successText}
          </Alert>
        )}

        {/* AVAILABILITY */}

        {activeTab === "availability" && (
          <div className="mt-5 space-y-5">
            <Panel>
              <PanelHeader
                eyebrow="DELIVERY MODE"
                title="When can customers receive orders?"
                description="Choose one delivery schedule mode. Only the selected mode is shown during checkout."
                aside={
                  <StatusBadge>
                    {modeLabel(
                      patternForm.delivery_mode,
                    )}
                  </StatusBadge>
                }
              />

              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <ModeCard
                  active={
                    patternForm.delivery_mode ===
                    "SCHEDULED"
                  }
                  icon={
                    <CalendarDays size={20} />
                  }
                  title="Manual schedule"
                  description="Create exact delivery dates and sessions. Useful when availability changes week by week."
                  onClick={() =>
                    setPatternForm((p) => ({
                      ...p,
                      delivery_mode:
                        "SCHEDULED",
                    }))
                  }
                />

                <ModeCard
                  active={
                    patternForm.delivery_mode ===
                    "EVERYDAY"
                  }
                  icon={
                    <RefreshCw size={20} />
                  }
                  title="Every day"
                  description="Create repeating time windows once and make them available every day."
                  onClick={() =>
                    setPatternForm((p) => ({
                      ...p,
                      delivery_mode:
                        "EVERYDAY",
                    }))
                  }
                />

                <ModeCard
                  active={
                    patternForm.delivery_mode ===
                    "SPECIAL"
                  }
                  icon={<Store size={20} />}
                  title="Special dates"
                  description="Only accept deliveries on selected dates and time windows."
                  onClick={() =>
                    setPatternForm((p) => ({
                      ...p,
                      delivery_mode:
                        "SPECIAL",
                    }))
                  }
                />
              </div>

              <div className="mt-5 grid gap-3 border-t border-brand-ink/10 pt-5 md:grid-cols-[1fr_1fr_auto]">
                <Field label="Business opens">
                  <input
                    type="time"
                    className="input-order"
                    value={
                      patternForm.business_open_time
                    }
                    onChange={(e) =>
                      setPatternForm((p) => ({
                        ...p,
                        business_open_time:
                          e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Business closes">
                  <input
                    type="time"
                    className="input-order"
                    value={
                      patternForm.business_close_time
                    }
                    onChange={(e) =>
                      setPatternForm((p) => ({
                        ...p,
                        business_close_time:
                          e.target.value,
                      }))
                    }
                  />
                </Field>

                <div className="flex items-end">
                  <PrimaryButton
                    disabled={saving}
                    onClick={savePatternSettings}
                  >
                    {saving
                      ? "Saving..."
                      : "Save delivery mode"}
                  </PrimaryButton>
                </div>
              </div>
            </Panel>

            {patternForm.delivery_mode ===
              "SCHEDULED" && (
              <Panel>
                <PanelHeader
                  eyebrow="MANUAL SESSIONS"
                  title="Create delivery sessions"
                  description="Add one date or generate recurring sessions across a date range."
                  aside={
                    <StatusBadge>
                      {upcomingManualSlots} upcoming
                    </StatusBadge>
                  }
                />

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Field label="Start date">
                    <input
                      type="date"
                      value={
                        manualScheduleForm.slot_date
                      }
                      onChange={(e) =>
                        setManualScheduleForm(
                          (p) => ({
                            ...p,
                            slot_date:
                              e.target.value,
                          }),
                        )
                      }
                      className="input-order"
                    />
                  </Field>

                  <Field label="End date">
                    <input
                      type="date"
                      value={
                        manualScheduleForm.end_date
                      }
                      onChange={(e) =>
                        setManualScheduleForm(
                          (p) => ({
                            ...p,
                            end_date:
                              e.target.value,
                          }),
                        )
                      }
                      className="input-order"
                    />
                  </Field>

                  <Field label="Repeat">
                    <select
                      className="input-order"
                      value={
                        manualScheduleForm.recurrence
                      }
                      onChange={(e) =>
                        setManualScheduleForm(
                          (p) => ({
                            ...p,
                            recurrence:
                              e.target
                                .value as RecurrenceMode,
                          }),
                        )
                      }
                    >
                      <option value="NONE">
                        No repeat
                      </option>
                      <option value="DAILY">
                        Daily
                      </option>
                      <option value="WEEKLY">
                        Weekly
                      </option>
                      <option value="MONTHLY">
                        Monthly
                      </option>
                    </select>
                  </Field>

                  <Field label="Session name">
                    <input
                      value={
                        manualScheduleForm.slot_label
                      }
                      onChange={(e) =>
                        setManualScheduleForm(
                          (p) => ({
                            ...p,
                            slot_label:
                              e.target.value,
                          }),
                        )
                      }
                      className="input-order"
                    />
                  </Field>

                  <Field label="Start time">
                    <input
                      type="time"
                      value={
                        manualScheduleForm.start_time
                      }
                      onChange={(e) =>
                        setManualScheduleForm(
                          (p) => ({
                            ...p,
                            start_time:
                              e.target.value,
                          }),
                        )
                      }
                      className="input-order"
                    />
                  </Field>

                  <Field label="End time">
                    <input
                      type="time"
                      value={
                        manualScheduleForm.end_time
                      }
                      onChange={(e) =>
                        setManualScheduleForm(
                          (p) => ({
                            ...p,
                            end_time:
                              e.target.value,
                          }),
                        )
                      }
                      className="input-order"
                    />
                  </Field>

                  <Field label="Maximum orders">
                    <input
                      type="number"
                      min={1}
                      value={
                        manualScheduleForm.max_orders
                      }
                      onChange={(e) =>
                        setManualScheduleForm(
                          (p) => ({
                            ...p,
                            max_orders: Number(
                              e.target.value,
                            ),
                          }),
                        )
                      }
                      className="input-order"
                    />
                  </Field>

                  <div className="flex items-end">
                    <PrimaryButton
                      disabled={saving}
                      onClick={
                        saveManualSchedule
                      }
                      icon={<Plus size={15} />}
                    >
                      {saving
                        ? "Creating..."
                        : "Create session"}
                    </PrimaryButton>
                  </div>
                </div>

                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-brand-ink/60">
                  <input
                    type="checkbox"
                    checked={
                      manualScheduleForm.is_available
                    }
                    onChange={(e) =>
                      setManualScheduleForm(
                        (p) => ({
                          ...p,
                          is_available:
                            e.target.checked,
                        }),
                      )
                    }
                  />
                  Available to customers
                </label>

                <div className="mt-5 overflow-x-auto rounded-[1.1rem] border border-brand-ink/10">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-brand-ink/[0.035] text-[10px] uppercase tracking-[0.16em] text-brand-ink/45">
                      <tr>
                        <th className="px-4 py-3">
                          Date
                        </th>
                        <th className="px-4 py-3">
                          Session
                        </th>
                        <th className="px-4 py-3">
                          Time
                        </th>
                        <th className="px-4 py-3">
                          Capacity
                        </th>
                        <th className="px-4 py-3">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {slots.length ? (
                        slots.map((slot) => (
                          <tr
                            key={slot.id}
                            className="border-t border-brand-ink/10"
                          >
                            <td className="px-4 py-3 font-semibold text-brand-ink">
                              {slot.slot_date}
                            </td>

                            <td className="px-4 py-3 text-brand-ink/70">
                              {slot.slot_label}
                            </td>

                            <td className="px-4 py-3 text-brand-ink/60">
                              {slot.start_time.slice(
                                0,
                                5,
                              )}{" "}
                              –{" "}
                              {slot.end_time.slice(
                                0,
                                5,
                              )}
                            </td>

                            <td className="px-4 py-3 text-brand-ink/60">
                              {slot.max_orders}
                            </td>

                            <td className="px-4 py-3">
                              <AvailabilityBadge
                                active={
                                  slot.is_available
                                }
                              />
                            </td>

                            <td className="px-4 py-3 text-right">
                              <DeleteButton
                                onClick={() =>
                                  deleteSlot(
                                    slot.id,
                                  )
                                }
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-10 text-center text-sm text-brand-ink/45"
                          >
                            No manual delivery
                            sessions yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {patternForm.delivery_mode ===
              "EVERYDAY" && (
              <Panel>
                <PanelHeader
                  eyebrow="DAILY DELIVERY"
                  title="Repeating delivery sessions"
                  description="These time windows repeat automatically every day."
                />

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <Field label="Session name">
                    <input
                      className="input-order"
                      value={
                        dailySlotForm.slot_label
                      }
                      onChange={(e) =>
                        setDailySlotForm((p) => ({
                          ...p,
                          slot_label:
                            e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Start time">
                    <input
                      type="time"
                      className="input-order"
                      value={
                        dailySlotForm.start_time
                      }
                      onChange={(e) =>
                        setDailySlotForm((p) => ({
                          ...p,
                          start_time:
                            e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="End time">
                    <input
                      type="time"
                      className="input-order"
                      value={
                        dailySlotForm.end_time
                      }
                      onChange={(e) =>
                        setDailySlotForm((p) => ({
                          ...p,
                          end_time:
                            e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Maximum orders">
                    <input
                      type="number"
                      min={1}
                      className="input-order"
                      value={
                        dailySlotForm.max_orders
                      }
                      onChange={(e) =>
                        setDailySlotForm((p) => ({
                          ...p,
                          max_orders: Number(
                            e.target.value,
                          ),
                        }))
                      }
                    />
                  </Field>

                  <Field label="Status">
                    <select
                      className="input-order"
                      value={
                        dailySlotForm.is_available
                          ? "true"
                          : "false"
                      }
                      onChange={(e) =>
                        setDailySlotForm((p) => ({
                          ...p,
                          is_available:
                            e.target.value ===
                            "true",
                        }))
                      }
                    >
                      <option value="true">
                        Available
                      </option>
                      <option value="false">
                        Closed
                      </option>
                    </select>
                  </Field>
                </div>

                <div className="mt-4 flex gap-2">
                  <PrimaryButton
                    disabled={saving}
                    onClick={saveDailySlot}
                    icon={<Plus size={15} />}
                  >
                    {dailySlotForm.id
                      ? "Update session"
                      : "Add session"}
                  </PrimaryButton>

                  {dailySlotForm.id && (
                    <SecondaryButton
                      onClick={() =>
                        setDailySlotForm({
                          id: "",
                          slot_label:
                            "Morning Delivery",
                          start_time: "09:00",
                          end_time: "12:00",
                          max_orders: 10,
                          is_available: true,
                        })
                      }
                    >
                      Cancel edit
                    </SecondaryButton>
                  )}
                </div>

                <div className="mt-5 space-y-2">
                  {dailyDeliverySlots.length ? (
                    dailyDeliverySlots.map(
                      (slot) => (
                        <RowShell key={slot.id}>
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-ink/[0.05]">
                              <Clock3
                                size={16}
                              />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-brand-ink">
                                {
                                  slot.slot_label
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-brand-ink/50">
                                {
                                  slot.start_time
                                }{" "}
                                – {slot.end_time} ·
                                Max{" "}
                                {
                                  slot.max_orders
                                }
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <AvailabilityBadge
                              active={
                                slot.is_available
                              }
                            />

                            <EditButton
                              onClick={() =>
                                setDailySlotForm(
                                  slot,
                                )
                              }
                            />

                            <DeleteButton
                              onClick={() =>
                                deleteDailySlot(
                                  slot.id,
                                )
                              }
                            />
                          </div>
                        </RowShell>
                      ),
                    )
                  ) : (
                    <EmptyState text="No daily delivery sessions have been added." />
                  )}
                </div>
              </Panel>
            )}

            {patternForm.delivery_mode ===
              "SPECIAL" && (
              <Panel>
                <PanelHeader
                  eyebrow="SPECIAL DELIVERY"
                  title="Special date sessions"
                  description="Create delivery availability only for specific dates."
                />

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                  <Field label="Date">
                    <input
                      type="date"
                      className="input-order"
                      value={
                        specialSlotForm.slot_date
                      }
                      onChange={(e) =>
                        setSpecialSlotForm(
                          (p) => ({
                            ...p,
                            slot_date:
                              e.target.value,
                          }),
                        )
                      }
                    />
                  </Field>

                  <Field label="Session name">
                    <input
                      className="input-order"
                      value={
                        specialSlotForm.slot_label
                      }
                      onChange={(e) =>
                        setSpecialSlotForm(
                          (p) => ({
                            ...p,
                            slot_label:
                              e.target.value,
                          }),
                        )
                      }
                    />
                  </Field>

                  <Field label="Start time">
                    <input
                      type="time"
                      className="input-order"
                      value={
                        specialSlotForm.start_time
                      }
                      onChange={(e) =>
                        setSpecialSlotForm(
                          (p) => ({
                            ...p,
                            start_time:
                              e.target.value,
                          }),
                        )
                      }
                    />
                  </Field>

                  <Field label="End time">
                    <input
                      type="time"
                      className="input-order"
                      value={
                        specialSlotForm.end_time
                      }
                      onChange={(e) =>
                        setSpecialSlotForm(
                          (p) => ({
                            ...p,
                            end_time:
                              e.target.value,
                          }),
                        )
                      }
                    />
                  </Field>

                  <Field label="Maximum orders">
                    <input
                      type="number"
                      min={1}
                      className="input-order"
                      value={
                        specialSlotForm.max_orders
                      }
                      onChange={(e) =>
                        setSpecialSlotForm(
                          (p) => ({
                            ...p,
                            max_orders: Number(
                              e.target.value,
                            ),
                          }),
                        )
                      }
                    />
                  </Field>

                  <Field label="Status">
                    <select
                      className="input-order"
                      value={
                        specialSlotForm.is_available
                          ? "true"
                          : "false"
                      }
                      onChange={(e) =>
                        setSpecialSlotForm(
                          (p) => ({
                            ...p,
                            is_available:
                              e.target.value ===
                              "true",
                          }),
                        )
                      }
                    >
                      <option value="true">
                        Available
                      </option>
                      <option value="false">
                        Closed
                      </option>
                    </select>
                  </Field>
                </div>

                <div className="mt-4 flex gap-2">
                  <PrimaryButton
                    disabled={saving}
                    onClick={saveSpecialSlot}
                    icon={<Plus size={15} />}
                  >
                    {specialSlotForm.id
                      ? "Update session"
                      : "Add special session"}
                  </PrimaryButton>

                  {specialSlotForm.id && (
                    <SecondaryButton
                      onClick={() =>
                        setSpecialSlotForm({
                          id: "",
                          slot_date: "",
                          slot_label:
                            "Special Delivery",
                          start_time: "09:00",
                          end_time: "12:00",
                          max_orders: 10,
                          is_available: true,
                        })
                      }
                    >
                      Cancel edit
                    </SecondaryButton>
                  )}
                </div>

                <div className="mt-5 space-y-2">
                  {specialDeliverySlots.length ? (
                    specialDeliverySlots.map(
                      (slot) => (
                        <RowShell key={slot.id}>
                          <div>
                            <p className="text-sm font-semibold text-brand-ink">
                              {slot.slot_date} ·{" "}
                              {
                                slot.slot_label
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-brand-ink/50">
                              {
                                slot.start_time
                              }{" "}
                              – {slot.end_time} ·
                              Max{" "}
                              {
                                slot.max_orders
                              }
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <AvailabilityBadge
                              active={
                                slot.is_available
                              }
                            />

                            <EditButton
                              onClick={() =>
                                setSpecialSlotForm(
                                  slot,
                                )
                              }
                            />

                            <DeleteButton
                              onClick={() =>
                                deleteSpecialSlot(
                                  slot.id,
                                )
                              }
                            />
                          </div>
                        </RowShell>
                      ),
                    )
                  ) : (
                    <EmptyState text="No special delivery sessions have been added." />
                  )}
                </div>
              </Panel>
            )}

            {/* BLOCKED DELIVERY */}

            <Panel>
              <PanelHeader
                eyebrow="DELIVERY BLOCKS"
                title="Block unavailable dates or times"
                description="Prevent checkout from offering delivery during holidays, breaks or other unavailable periods."
                aside={
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-700">
                    <Ban size={16} />
                  </div>
                }
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Field label="Date">
                  <input
                    type="date"
                    className="input-order"
                    value={
                      noDeliveryBlockForm.block_date
                    }
                    onChange={(e) =>
                      setNoDeliveryBlockForm(
                        (p) => ({
                          ...p,
                          block_date:
                            e.target.value,
                        }),
                      )
                    }
                  />
                </Field>

                <Field label="Block">
                  <select
                    className="input-order"
                    value={
                      noDeliveryBlockForm.full_day
                        ? "true"
                        : "false"
                    }
                    onChange={(e) =>
                      setNoDeliveryBlockForm(
                        (p) => ({
                          ...p,
                          full_day:
                            e.target.value ===
                            "true",
                        }),
                      )
                    }
                  >
                    <option value="true">
                      Full day
                    </option>
                    <option value="false">
                      Time range
                    </option>
                  </select>
                </Field>

                <Field label="Start time">
                  <input
                    type="time"
                    className="input-order"
                    disabled={
                      noDeliveryBlockForm.full_day
                    }
                    value={
                      noDeliveryBlockForm.start_time
                    }
                    onChange={(e) =>
                      setNoDeliveryBlockForm(
                        (p) => ({
                          ...p,
                          start_time:
                            e.target.value,
                        }),
                      )
                    }
                  />
                </Field>

                <Field label="End time">
                  <input
                    type="time"
                    className="input-order"
                    disabled={
                      noDeliveryBlockForm.full_day
                    }
                    value={
                      noDeliveryBlockForm.end_time
                    }
                    onChange={(e) =>
                      setNoDeliveryBlockForm(
                        (p) => ({
                          ...p,
                          end_time:
                            e.target.value,
                        }),
                      )
                    }
                  />
                </Field>

                <Field label="Reason">
                  <input
                    className="input-order"
                    placeholder="Holiday, break..."
                    value={
                      noDeliveryBlockForm.reason
                    }
                    onChange={(e) =>
                      setNoDeliveryBlockForm(
                        (p) => ({
                          ...p,
                          reason:
                            e.target.value,
                        }),
                      )
                    }
                  />
                </Field>
              </div>

              <div className="mt-4 flex gap-2">
                <PrimaryButton
                  disabled={saving}
                  onClick={saveNoDeliveryBlock}
                  icon={<Ban size={15} />}
                >
                  {noDeliveryBlockForm.id
                    ? "Update block"
                    : "Add delivery block"}
                </PrimaryButton>

                {noDeliveryBlockForm.id && (
                  <SecondaryButton
                    onClick={() =>
                      setNoDeliveryBlockForm({
                        id: "",
                        block_date: "",
                        start_time: "",
                        end_time: "",
                        reason: "",
                        full_day: true,
                      })
                    }
                  >
                    Cancel edit
                  </SecondaryButton>
                )}
              </div>

              <div className="mt-5 space-y-2">
                {noDeliveryBlocks.length ? (
                  noDeliveryBlocks.map(
                    (block) => (
                      <RowShell key={block.id}>
                        <div>
                          <p className="text-sm font-semibold text-brand-ink">
                            {block.block_date}
                          </p>

                          <p className="mt-0.5 text-xs text-brand-ink/50">
                            {block.reason ||
                              "No delivery"}{" "}
                            ·{" "}
                            {block.full_day
                              ? "Full day"
                              : `${block.start_time} – ${block.end_time}`}
                          </p>
                        </div>

                        {!block.id.startsWith(
                          "old-",
                        ) && (
                          <div className="flex gap-2">
                            <EditButton
                              onClick={() =>
                                setNoDeliveryBlockForm(
                                  block,
                                )
                              }
                            />

                            <DeleteButton
                              onClick={() =>
                                deleteNoDeliveryBlock(
                                  block.id,
                                )
                              }
                            />
                          </div>
                        )}
                      </RowShell>
                    ),
                  )
                ) : (
                  <EmptyState text="No delivery dates or times are currently blocked." />
                )}
              </div>
            </Panel>
          </div>
        )}

        {/* PRICING */}

        {activeTab === "pricing" && (
          <div className="mt-5 space-y-5">
            <Panel>
              <PanelHeader
                eyebrow="REGULAR DELIVERY"
                title="Distance pricing"
                description="Set the delivery charge for each vehicle and distance. Checkout rounds the road distance up to the matching distance row."
                aside={
                  <StatusBadge>
                    {activePriceRows} active rows
                  </StatusBadge>
                }
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatCard
                  icon={<CircleDollarSign size={17} />}
                  label="Active rows"
                  value={String(
                    activePriceRows,
                  )}
                />

                <StatCard
                  icon={<Gauge size={17} />}
                  label="Price coverage"
                  value={
                    visibleDistancePrices.length
                      ? `${minDistanceKm} – ${maxDistanceKm} km`
                      : "Not configured"
                  }
                />

                <StatCard
                  icon={<MapPin size={17} />}
                  label="Delivery limit"
                  value={`${maxDeliveryDistanceKm} km`}
                  warning={
                    pricingCoverageWarning
                  }
                />
              </div>

              {pricingCoverageWarning && (
                <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                  Your delivery radius is{" "}
                  <strong>
                    {maxDeliveryDistanceKm} km
                  </strong>
                  , but the pricing table currently
                  only reaches{" "}
                  <strong>
                    {maxDistanceKm} km
                  </strong>
                  . Add price rows up to the
                  delivery limit so customers
                  within your service area can
                  receive a valid quote.
                </div>
              )}

              <div className="mt-5 rounded-[1.2rem] border border-brand-ink/10 bg-brand-ink/[0.025] p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1.3fr_1fr_1fr_auto]">
                  <Field label="Distance">
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        className="input-order pr-10"
                        value={
                          priceForm.distance_km
                        }
                        onChange={(e) =>
                          setPriceForm((p) => ({
                            ...p,
                            distance_km:
                              Number(
                                e.target
                                  .value,
                              ),
                          }))
                        }
                      />

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-ink/35">
                        km
                      </span>
                    </div>
                  </Field>

                  <Field label="Vehicle">
                    <select
                      className="input-order"
                      value={
                        priceForm.vehicle_type
                      }
                      onChange={(e) =>
                        setPriceForm((p) => ({
                          ...p,
                          vehicle_type:
                            e.target.value,
                        }))
                      }
                    >
                      <option value="BIKE">
                        Bike
                      </option>
                      <option value="THREE_WHEEL">
                        Three wheel
                      </option>
                      <option value="CAR">
                        Car
                      </option>
                      <option value="VAN">
                        Van
                      </option>
                    </select>
                  </Field>

                  <Field label="Delivery fee">
                    <input
                      type="number"
                      min={1}
                      className="input-order"
                      value={
                        priceForm.normal_price_lkr
                      }
                      onChange={(e) =>
                        setPriceForm((p) => ({
                          ...p,
                          normal_price_lkr:
                            Number(
                              e.target
                                .value,
                            ),
                          peak_price_lkr:
                            Number(
                              e.target
                                .value,
                            ),
                        }))
                      }
                    />
                  </Field>

                  <Field label="Status">
                    <select
                      className="input-order"
                      value={
                        priceForm.is_active
                          ? "true"
                          : "false"
                      }
                      onChange={(e) =>
                        setPriceForm((p) => ({
                          ...p,
                          is_active:
                            e.target.value ===
                            "true",
                        }))
                      }
                    >
                      <option value="true">
                        Active
                      </option>
                      <option value="false">
                        Inactive
                      </option>
                    </select>
                  </Field>

                  <div className="flex items-end gap-2">
                    <PrimaryButton
                      disabled={saving}
                      onClick={savePrice}
                    >
                      {priceForm.id
                        ? "Update"
                        : "Add price"}
                    </PrimaryButton>

                    {priceForm.id && (
                      <IconButton
                        label="Cancel edit"
                        onClick={() =>
                          setPriceForm(
                            resetPriceForm(),
                          )
                        }
                      >
                        <X size={15} />
                      </IconButton>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto rounded-[1.1rem] border border-brand-ink/10">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-brand-ink/[0.035] text-[10px] uppercase tracking-[0.16em] text-brand-ink/45">
                    <tr>
                      <th className="px-4 py-3">
                        Vehicle
                      </th>
                      <th className="px-4 py-3">
                        Distance
                      </th>
                      <th className="px-4 py-3">
                        Fee
                      </th>
                      <th className="px-4 py-3">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleDistancePrices.length ? (
                      visibleDistancePrices.map(
                        (price) => {
                          const Icon =
                            vehicleIcon(
                              price.vehicle_type,
                            );

                          return (
                            <tr
                              key={price.id}
                              className="border-t border-brand-ink/10"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 font-semibold text-brand-ink">
                                  <Icon
                                    size={15}
                                  />
                                  {vehicleName(
                                    price.vehicle_type,
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-3 font-medium text-brand-ink/65">
                                {
                                  price.distance_km
                                }{" "}
                                km
                              </td>

                              <td className="px-4 py-3 font-semibold text-brand-ink">
                                {formatLkr(
                                  price.normal_price_lkr,
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <AvailabilityBadge
                                  active={
                                    price.is_active
                                  }
                                  activeText="Active"
                                  inactiveText="Inactive"
                                />
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <EditButton
                                    onClick={() =>
                                      setPriceForm(
                                        {
                                          id: price.id,
                                          price_table_key:
                                            REGULAR_PRICE_TABLE_KEY,
                                          distance_km:
                                            price.distance_km,
                                          vehicle_type:
                                            price.vehicle_type,
                                          normal_price_lkr:
                                            price.normal_price_lkr,
                                          peak_price_lkr:
                                            price.normal_price_lkr,
                                          is_active:
                                            price.is_active,
                                        },
                                      )
                                    }
                                  />

                                  <DeleteButton
                                    onClick={() =>
                                      deletePrice(
                                        price.id,
                                      )
                                    }
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        },
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-sm text-brand-ink/45"
                        >
                          No delivery prices
                          configured.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* VEHICLES */}

        {activeTab === "vehicles" && (
          <div className="mt-5">
            <Panel>
              <PanelHeader
                eyebrow="VEHICLE SELECTION"
                title="Vehicle rules"
                description="Choose which delivery vehicle should be used according to the total quantity in the customer's cart."
                aside={
                  <StatusBadge>
                    {activeVehicleRules} active
                  </StatusBadge>
                }
              />

              <div className="mt-5 rounded-[1.2rem] border border-brand-ink/10 bg-brand-ink/[0.025] p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
                  <Field label="Vehicle">
                    <select
                      className="input-order"
                      value={
                        vehicleForm.vehicle_type
                      }
                      onChange={(e) =>
                        setVehicleForm((p) => ({
                          ...p,
                          vehicle_type:
                            e.target.value,
                        }))
                      }
                    >
                      <option value="BIKE">
                        Bike
                      </option>
                      <option value="THREE_WHEEL">
                        Three wheel
                      </option>
                      <option value="CAR">
                        Car
                      </option>
                      <option value="VAN">
                        Van
                      </option>
                    </select>
                  </Field>

                  <Field label="Minimum quantity">
                    <input
                      type="number"
                      min={1}
                      className="input-order"
                      value={
                        vehicleForm.min_quantity
                      }
                      onChange={(e) =>
                        setVehicleForm((p) => ({
                          ...p,
                          min_quantity:
                            Number(
                              e.target
                                .value,
                            ),
                        }))
                      }
                    />
                  </Field>

                  <Field label="Maximum quantity">
                    <input
                      type="number"
                      min={1}
                      className="input-order"
                      value={
                        vehicleForm.max_quantity
                      }
                      onChange={(e) =>
                        setVehicleForm((p) => ({
                          ...p,
                          max_quantity:
                            e.target.value,
                        }))
                      }
                      placeholder="No maximum"
                    />
                  </Field>

                  <Field label="Status">
                    <select
                      className="input-order"
                      value={
                        vehicleForm.is_active
                          ? "true"
                          : "false"
                      }
                      onChange={(e) =>
                        setVehicleForm((p) => ({
                          ...p,
                          is_active:
                            e.target.value ===
                            "true",
                        }))
                      }
                    >
                      <option value="true">
                        Active
                      </option>
                      <option value="false">
                        Inactive
                      </option>
                    </select>
                  </Field>

                  <div className="flex items-end gap-2">
                    <PrimaryButton
                      disabled={saving}
                      onClick={saveVehicleRule}
                    >
                      {vehicleForm.id
                        ? "Update"
                        : "Add rule"}
                    </PrimaryButton>

                    {vehicleForm.id && (
                      <IconButton
                        label="Cancel edit"
                        onClick={() =>
                          setVehicleForm(
                            resetVehicleForm(),
                          )
                        }
                      >
                        <X size={15} />
                      </IconButton>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {vehicleRules.length ? (
                  vehicleRules.map((rule) => {
                    const Icon =
                      vehicleIcon(
                        rule.vehicle_type,
                      );

                    return (
                      <RowShell key={rule.id}>
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-ink/[0.05] text-brand-ink">
                            <Icon size={17} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-brand-ink">
                              {vehicleName(
                                rule.vehicle_type,
                              )}
                            </p>

                            <p className="mt-0.5 text-xs text-brand-ink/50">
                              {rule.max_quantity ===
                              null
                                ? `${rule.min_quantity}+ items`
                                : `${rule.min_quantity} – ${rule.max_quantity} items`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <AvailabilityBadge
                            active={
                              rule.is_active
                            }
                            activeText="Active"
                            inactiveText="Inactive"
                          />

                          <EditButton
                            onClick={() =>
                              setVehicleForm({
                                id: rule.id,
                                vehicle_type:
                                  rule.vehicle_type,
                                min_quantity:
                                  rule.min_quantity,
                                max_quantity:
                                  rule.max_quantity
                                    ? String(
                                        rule.max_quantity,
                                      )
                                    : "",
                                is_active:
                                  rule.is_active,
                              })
                            }
                          />

                          <DeleteButton
                            onClick={() =>
                              deleteVehicleRule(
                                rule.id,
                              )
                            }
                          />
                        </div>
                      </RowShell>
                    );
                  })
                ) : (
                  <EmptyState text="No vehicle rules have been configured." />
                )}
              </div>
            </Panel>
          </div>
        )}

        {/* SETTINGS */}

        {activeTab === "settings" && (
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
            <Panel>
              <PanelHeader
                eyebrow="SERVICE AREA"
                title="Delivery limits"
                description="Control how far Baura accepts delivery orders and how the final delivery fee is adjusted."
                aside={
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-ink text-brand-bg">
                    <MapPin size={17} />
                  </div>
                }
              />

              {/* DISTANCE CONTROL */}

              <div className="mt-5 rounded-[1.3rem] border border-brand-ink/10 bg-brand-ink/[0.025] p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin
                        size={16}
                        className="text-brand-ink/55"
                      />

                      <p className="text-sm font-semibold text-brand-ink">
                        Maximum delivery
                        distance
                      </p>
                    </div>

                    <p className="mt-1.5 max-w-md text-xs leading-5 text-brand-ink/50">
                      Customers beyond this road
                      distance should not be able
                      to receive a delivery quote
                      or place a delivery order.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={
                        settings.max_delivery_distance_km ||
                        "25"
                      }
                      onChange={(e) =>
                        setSettings((p) => ({
                          ...p,
                          max_delivery_distance_km:
                            e.target.value,
                        }))
                      }
                      className="h-12 w-24 rounded-xl border border-brand-ink/15 bg-white/80 px-3 text-right text-xl font-semibold text-brand-ink outline-none transition focus:border-brand-ink/35"
                    />

                    <span className="text-sm font-semibold text-brand-ink/50">
                      km
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <input
                    type="range"
                    min={1}
                    max={100}
                    step={1}
                    value={Math.min(
                      100,
                      Math.max(
                        1,
                        maxDeliveryDistanceKm,
                      ),
                    )}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        max_delivery_distance_km:
                          e.target.value,
                      }))
                    }
                    className="w-full accent-[#38281d]"
                    aria-label="Maximum delivery distance"
                  />

                  <div className="mt-1 flex justify-between text-[10px] font-semibold text-brand-ink/35">
                    <span>1 km</span>
                    <span>25 km</span>
                    <span>50 km</span>
                    <span>75 km</span>
                    <span>100 km</span>
                  </div>
                </div>
              </div>

              {/* FEE SETTINGS */}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Safety margin">
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      className="input-order pr-10"
                      value={
                        settings.safety_margin_percent ||
                        "0"
                      }
                      onChange={(e) =>
                        setSettings((p) => ({
                          ...p,
                          safety_margin_percent:
                            e.target.value,
                        }))
                      }
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-ink/40">
                      %
                    </span>
                  </div>

                  <p className="mt-1.5 text-[11px] leading-4 text-brand-ink/40">
                    Percentage added to the
                    selected regular delivery
                    price.
                  </p>
                </Field>

                <Field label="Round final fee">
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      className="input-order pl-12"
                      value={
                        settings.round_to_lkr ||
                        "50"
                      }
                      onChange={(e) =>
                        setSettings((p) => ({
                          ...p,
                          round_to_lkr:
                            e.target.value,
                        }))
                      }
                    />

                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-ink/40">
                      LKR
                    </span>
                  </div>

                  <p className="mt-1.5 text-[11px] leading-4 text-brand-ink/40">
                    Round the calculated delivery
                    fee to this amount.
                  </p>
                </Field>
              </div>

              <div className="mt-5 border-t border-brand-ink/10 pt-5">
                <PrimaryButton
                  disabled={saving}
                  onClick={saveCommonSettings}
                  icon={
                    <PackageCheck size={15} />
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save delivery settings"}
                </PrimaryButton>
              </div>
            </Panel>

            {/* SETTINGS SUMMARY */}

            <div className="space-y-5">
              <Panel>
                <PanelHeader
                  eyebrow="CURRENT CONFIGURATION"
                  title="How checkout will behave"
                  description="A quick view of the active delivery configuration."
                />

                <div className="mt-5 space-y-1">
                  <ConfigRow
                    icon={<MapPin size={15} />}
                    label="Maximum distance"
                    value={`${maxDeliveryDistanceKm} km`}
                  />

                  <ConfigRow
                    icon={<Gauge size={15} />}
                    label="Price table coverage"
                    value={
                      maxDistanceKm
                        ? `${maxDistanceKm} km`
                        : "Not configured"
                    }
                    warning={
                      pricingCoverageWarning
                    }
                  />

                  <ConfigRow
                    icon={<Clock3 size={15} />}
                    label="Delivery mode"
                    value={modeLabel(
                      patternForm.delivery_mode,
                    )}
                  />

                  <ConfigRow
                    icon={<Truck size={15} />}
                    label="Vehicle rules"
                    value={`${activeVehicleRules} active`}
                  />

                  <ConfigRow
                    icon={
                      <CircleDollarSign
                        size={15}
                      />
                    }
                    label="Safety margin"
                    value={`${
                      settings.safety_margin_percent ||
                      "0"
                    }%`}
                  />

                  <ConfigRow
                    icon={
                      <CircleDollarSign
                        size={15}
                      />
                    }
                    label="Fee rounding"
                    value={`LKR ${
                      settings.round_to_lkr ||
                      "50"
                    }`}
                  />
                </div>
              </Panel>

              {pricingCoverageWarning ? (
                <div className="rounded-[1.3rem] border border-amber-200 bg-amber-50 p-5">
                  <div className="flex gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
                      <Gauge size={16} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Pricing coverage is too
                        short
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-800/80">
                        Delivery is allowed up to{" "}
                        {maxDeliveryDistanceKm} km,
                        but your price table only
                        covers up to{" "}
                        {maxDistanceKm} km. Add
                        pricing rows before using
                        the larger delivery radius.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab("pricing")
                        }
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900"
                      >
                        Open pricing
                        <ChevronRight
                          size={13}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.3rem] border border-green-200 bg-green-50 p-5">
                  <div className="flex gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-100 text-green-700">
                      <ShieldCheck
                        size={16}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-green-900">
                        Delivery coverage looks
                        consistent
                      </p>

                      <p className="mt-1 text-xs leading-5 text-green-800/75">
                        Your pricing table covers
                        the configured service
                        radius.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

/* =======================================================
   UI COMPONENTS
======================================================= */

function Panel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.4rem] border border-brand-ink/10 bg-white/50 p-4 shadow-[0_10px_30px_rgba(55,38,25,0.035)] sm:p-5">
      {children}
    </section>
  );
}

function PanelHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-ink/40">
          {eyebrow}
        </p>

        <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-brand-ink">
          {title}
        </h2>

        <p className="mt-1.5 max-w-2xl text-xs leading-5 text-brand-ink/50 sm:text-sm">
          {description}
        </p>
      </div>

      {aside && (
        <div className="shrink-0">
          {aside}
        </div>
      )}
    </div>
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
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-ink/45">
        {label}
      </span>

      {children}
    </label>
  );
}

function ModeCard({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group rounded-[1.2rem] border p-4 text-left transition",
        active
          ? "border-brand-ink bg-brand-ink text-brand-bg shadow-[0_10px_24px_rgba(55,38,25,0.10)]"
          : "border-brand-ink/10 bg-white/55 text-brand-ink hover:border-brand-ink/20 hover:bg-white/80",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={[
            "grid h-9 w-9 place-items-center rounded-xl",
            active
              ? "bg-white/10"
              : "bg-brand-ink/[0.05]",
          ].join(" ")}
        >
          {icon}
        </div>

        <div
          className={[
            "grid h-5 w-5 place-items-center rounded-full border",
            active
              ? "border-white/25 bg-white/10"
              : "border-brand-ink/15",
          ].join(" ")}
        >
          {active && (
            <Check size={12} />
          )}
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold">
        {title}
      </p>

      <p
        className={[
          "mt-1.5 text-xs leading-5",
          active
            ? "text-brand-bg/65"
            : "text-brand-ink/50",
        ].join(" ")}
      >
        {description}
      </p>
    </button>
  );
}

function MiniStatus({
  icon,
  label,
  value,
  warning = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-[1rem] border px-3.5 py-3",
        warning
          ? "border-amber-200 bg-amber-50"
          : "border-brand-ink/10 bg-white/40",
      ].join(" ")}
    >
      <div
        className={[
          "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
          warning
            ? "bg-amber-100 text-amber-800"
            : "bg-brand-ink/[0.05] text-brand-ink/60",
        ].join(" ")}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-ink/35">
          {label}
        </p>

        <p
          className={[
            "mt-0.5 truncate text-xs font-semibold",
            warning
              ? "text-amber-900"
              : "text-brand-ink",
          ].join(" ")}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  warning = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[1.1rem] border p-4",
        warning
          ? "border-amber-200 bg-amber-50"
          : "border-brand-ink/10 bg-white/55",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span
          className={
            warning
              ? "text-amber-800"
              : "text-brand-ink/45"
          }
        >
          {icon}
        </span>

        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-ink/40">
          {label}
        </p>
      </div>

      <p
        className={[
          "mt-2 text-lg font-semibold tracking-tight",
          warning
            ? "text-amber-900"
            : "text-brand-ink",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function ConfigRow({
  icon,
  label,
  value,
  warning = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-brand-ink/10 py-3 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="text-brand-ink/40">
          {icon}
        </span>

        <span className="text-xs font-medium text-brand-ink/55">
          {label}
        </span>
      </div>

      <span
        className={[
          "text-xs font-semibold",
          warning
            ? "text-amber-700"
            : "text-brand-ink",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex rounded-full border border-brand-ink/10 bg-brand-bg/60 px-3 py-1.5 text-[11px] font-semibold text-brand-ink/60">
      {children}
    </span>
  );
}

function AvailabilityBadge({
  active,
  activeText = "Available",
  inactiveText = "Closed",
}: {
  active: boolean;
  activeText?: string;
  inactiveText?: string;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
        active
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700",
      ].join(" ")}
    >
      {active ? activeText : inactiveText}
    </span>
  );
}

function RowShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-brand-ink/10 bg-white/55 px-4 py-3">
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-ink px-4 py-2.5 text-xs font-semibold text-brand-bg transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(55,38,25,0.14)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-none"
    >
      {icon}
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-ink/10 bg-white/60 px-4 py-2.5 text-xs font-semibold text-brand-ink transition hover:border-brand-ink/20 hover:bg-white/80"
    >
      {children}
    </button>
  );
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-brand-ink/10 bg-white/60 text-brand-ink/55 transition hover:border-brand-ink/20 hover:bg-white hover:text-brand-ink"
    >
      {children}
    </button>
  );
}

function EditButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Edit"
      title="Edit"
      className="grid h-8 w-8 place-items-center rounded-lg border border-brand-ink/10 bg-white/60 text-brand-ink/50 transition hover:border-brand-ink/20 hover:text-brand-ink"
    >
      <Pencil size={13} />
    </button>
  );
}

function DeleteButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Delete"
      title="Delete"
      className="grid h-8 w-8 place-items-center rounded-lg border border-red-100 bg-red-50/70 text-red-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
    >
      <Trash2 size={13} />
    </button>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-[1rem] border border-dashed border-brand-ink/15 bg-brand-ink/[0.02] px-4 py-8 text-center text-xs text-brand-ink/45">
      {text}
    </div>
  );
}

function Alert({
  children,
  tone,
  onClose,
}: {
  children: React.ReactNode;
  tone: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div
      className={[
        "mt-4 flex items-start justify-between gap-3 rounded-[1rem] border px-4 py-3 text-xs font-medium",
        tone === "success"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-700",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        {tone === "success" ? (
          <Check
            size={15}
            className="mt-0.5 shrink-0"
          />
        ) : (
          <X
            size={15}
            className="mt-0.5 shrink-0"
          />
        )}

        <span>{children}</span>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 opacity-60 transition hover:opacity-100"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}