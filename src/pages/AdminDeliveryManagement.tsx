/** @format */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import { supabase } from "../lib/supabase";

type TabKey = "patterns" | "scheduled" | "pricing" | "vehicles" | "settings";

type DeliverySlot = {
  id: string;
  slot_date: string;
  slot_label: string;
  start_time: string;
  end_time: string;
  max_orders: number;
  is_available: boolean;
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

type DeliveryPeakHour = {
  id: string;
  delivery_app: "PICKME_FLASH" | "UBER_PARCEL";
  label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

type DeliverySetting = {
  setting_key: string;
  setting_value: string;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "patterns", label: "Delivery patterns" },
  { key: "scheduled", label: "Scheduled dates" },
  { key: "pricing", label: "Distance pricing" },
  { key: "vehicles", label: "Vehicle rules" },
  { key: "settings", label: "Settings" },
];

const priceTables: {
  key: PriceTableKey;
  label: string;
}[] = [
  {
    key: "PICKME_FLASH",
    label: "PickMe Flash",
  },
  {
    key: "UBER_PARCEL",
    label: "Uber Parcel",
  },
];

function vehicleIcon(type: string) {
  if (type === "BIKE") return "🏍️";
  if (type === "THREE_WHEEL") return "🛺";
  if (type === "CAR") return "🚗";
  if (type === "VAN") return "🚐";
  return "🚚";
}

function parseList(value?: string) {
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

export default function AdminDeliveryManagement() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>("patterns");

  const [activePriceTable, setActivePriceTable] =
    useState<PriceTableKey>("PICKME_FLASH");

  const [peakHours, setPeakHours] = useState<DeliveryPeakHour[]>([]);
  const [showPeakModal, setShowPeakModal] = useState(false);

  const [peakHourForm, setPeakHourForm] = useState({
    id: "",
    delivery_app: "PICKME_FLASH" as "PICKME_FLASH" | "UBER_PARCEL",
    label: "Peak Session",
    start_time: "16:00",
    end_time: "19:00",
    is_active: true,
  });

  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [vehicleRules, setVehicleRules] = useState<DeliveryVehicleRule[]>([]);
  const [distancePrices, setDistancePrices] = useState<DeliveryDistancePrice[]>(
    [],
  );
  const [settings, setSettings] = useState<Record<string, string>>({});

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [saving, setSaving] = useState(false);

  const [showPriceModal, setShowPriceModal] = useState(false);

  const [slotForm, setSlotForm] = useState({
    id: "",
    slot_date: "",
    slot_label: "Morning Delivery",
    start_time: "09:00",
    end_time: "12:00",
    max_orders: 5,
    is_available: true,
  });

  const [priceForm, setPriceForm] = useState({
    id: "",
    price_table_key: "PICKME_FLASH" as PriceTableKey,
    distance_km: 1,
    vehicle_type: "BIKE",
    normal_price_lkr: 0,
    peak_price_lkr: 0,
    is_active: true,
  });

  const [vehicleForm, setVehicleForm] = useState({
    id: "",
    vehicle_type: "BIKE",
    min_quantity: 1,
    max_quantity: "",
    is_active: true,
  });

  const [patternForm, setPatternForm] = useState({
    delivery_mode: "EVERYDAY",
    business_open_time: "09:00",
    business_close_time: "18:00",
    no_delivery_date: "",
    special_delivery_date: "",
    special_delivery_label: "",
  });

  const noDeliveryDates = useMemo(
    () => parseList(settings.no_delivery_dates_json),
    [settings.no_delivery_dates_json],
  );

  const specialDeliveryDates = useMemo(
    () => parseList(settings.special_delivery_dates_json),
    [settings.special_delivery_dates_json],
  );

  async function verifyAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      navigate("/account");
      return false;
    }

    return true;
  }

  async function loadDeliveryData() {
    setErrorText("");

    const isAdmin = await verifyAdmin();
    if (!isAdmin) return;

    const [slotsRes, rulesRes, pricesRes, settingsRes, peakHoursRes] =
      await Promise.all([
        supabase
          .from("delivery_slots")
          .select("*")
          .order("slot_date", { ascending: true })
          .order("start_time", { ascending: true }),

        supabase
          .from("delivery_vehicle_rules")
          .select("*")
          .order("min_quantity", { ascending: true }),

        supabase
          .from("delivery_distance_prices")
          .select("*")
          .order("vehicle_type", { ascending: true })
          .order("distance_km", { ascending: true }),

        supabase.from("delivery_settings").select("setting_key, setting_value"),

        supabase
          .from("delivery_peak_hours")
          .select("*")
          .order("delivery_app", { ascending: true })
          .order("start_time", { ascending: true }),
      ]);

    if (
      slotsRes.error ||
      rulesRes.error ||
      pricesRes.error ||
      settingsRes.error ||
      peakHoursRes.error
    ) {
      setErrorText(
        slotsRes.error?.message ||
          rulesRes.error?.message ||
          pricesRes.error?.message ||
          settingsRes.error?.message ||
          peakHoursRes.error?.message ||
          "Could not load delivery data.",
      );
      return;
    }

    setSlots((slotsRes.data || []) as DeliverySlot[]);
    setVehicleRules((rulesRes.data || []) as DeliveryVehicleRule[]);
    setDistancePrices((pricesRes.data || []) as DeliveryDistancePrice[]);

    setPeakHours((peakHoursRes.data || []) as DeliveryPeakHour[]);

    const map: Record<string, string> = {};
    for (const row of (settingsRes.data || []) as DeliverySetting[]) {
      map[row.setting_key] = row.setting_value;
    }

    setSettings(map);
    setPatternForm((prev) => ({
      ...prev,
      delivery_mode: map.delivery_mode || "EVERYDAY",
      business_open_time: map.business_open_time || "09:00",
      business_close_time: map.business_close_time || "18:00",
    }));
  }

  useEffect(() => {
    loadDeliveryData();
  }, []);

  async function saveSettingRows(rows: DeliverySetting[]) {
    const { error } = await supabase
      .from("delivery_settings")
      .upsert(rows, { onConflict: "setting_key" });

    if (error) {
      setErrorText(error.message);
      return false;
    }

    await loadDeliveryData();
    setSuccessText("Delivery settings updated.");
    return true;
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

  async function addNoDeliveryDate() {
    if (!patternForm.no_delivery_date) return;

    const next = Array.from(
      new Set([...noDeliveryDates, patternForm.no_delivery_date]),
    );

    await saveSettingRows([
      {
        setting_key: "no_delivery_dates_json",
        setting_value: JSON.stringify(next),
      },
    ]);

    setPatternForm((prev) => ({ ...prev, no_delivery_date: "" }));
  }

  async function removeNoDeliveryDate(date: string) {
    const next = noDeliveryDates.filter((x) => x !== date);

    await saveSettingRows([
      {
        setting_key: "no_delivery_dates_json",
        setting_value: JSON.stringify(next),
      },
    ]);
  }

  async function addSpecialDeliveryDate() {
    if (!patternForm.special_delivery_date) return;

    const next = [
      ...specialDeliveryDates,
      {
        date: patternForm.special_delivery_date,
        label: patternForm.special_delivery_label || "Special Delivery",
      },
    ];

    await saveSettingRows([
      {
        setting_key: "special_delivery_dates_json",
        setting_value: JSON.stringify(next),
      },
    ]);

    setPatternForm((prev) => ({
      ...prev,
      special_delivery_date: "",
      special_delivery_label: "",
    }));
  }

  async function removeSpecialDeliveryDate(date: string) {
    const next = specialDeliveryDates.filter((x) => x.date !== date);

    await saveSettingRows([
      {
        setting_key: "special_delivery_dates_json",
        setting_value: JSON.stringify(next),
      },
    ]);
  }

  async function saveSlot() {
    if (!slotForm.slot_date) {
      setErrorText("Please select a delivery date.");
      return;
    }

    setSaving(true);
    setErrorText("");
    setSuccessText("");

    const payload = {
      slot_date: slotForm.slot_date,
      slot_label: slotForm.slot_label,
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
      max_orders: Number(slotForm.max_orders || 0),
      is_available: slotForm.is_available,
    };

    const result = slotForm.id
      ? await supabase
          .from("delivery_slots")
          .update(payload)
          .eq("id", slotForm.id)
      : await supabase.from("delivery_slots").insert(payload);

    setSaving(false);

    if (result.error) {
      setErrorText(result.error.message);
      return;
    }

    setSlotForm({
      id: "",
      slot_date: "",
      slot_label: "Morning Delivery",
      start_time: "09:00",
      end_time: "12:00",
      max_orders: 5,
      is_available: true,
    });

    setSuccessText(
      slotForm.id ? "Delivery slot updated." : "Delivery slot created.",
    );
    loadDeliveryData();
  }

  async function deleteSlot(id: string) {
    if (!window.confirm("Delete this delivery slot?")) return;

    const { error } = await supabase
      .from("delivery_slots")
      .delete()
      .eq("id", id);

    if (error) {
      setErrorText(error.message);
      return;
    }

    loadDeliveryData();
  }

  async function savePrice() {
    setSaving(true);
    setErrorText("");
    setSuccessText("");

    const payload = {
      price_table_key: activePriceTable,
      distance_km: Number(priceForm.distance_km || 0),
      vehicle_type: priceForm.vehicle_type,
      normal_price_lkr: Number(priceForm.normal_price_lkr || 0),
      peak_price_lkr: Number(priceForm.peak_price_lkr || 0),
      is_active: priceForm.is_active,
    };

    const result = priceForm.id
      ? await supabase
          .from("delivery_distance_prices")
          .update(payload)
          .eq("id", priceForm.id)
      : await supabase.from("delivery_distance_prices").insert(payload);

    setSaving(false);

    if (result.error) {
      setErrorText(result.error.message);
      return;
    }

    setPriceForm({
      id: "",
      price_table_key: activePriceTable,
      distance_km: 1,
      vehicle_type: "BIKE",
      normal_price_lkr: 0,
      peak_price_lkr: 0,
      is_active: true,
    });

    setSuccessText(priceForm.id ? "Price row updated." : "Price row created.");
    loadDeliveryData();
  }

  async function deletePrice(id: string) {
    if (!window.confirm("Delete this price row?")) return;

    const { error } = await supabase
      .from("delivery_distance_prices")
      .delete()
      .eq("id", id);

    if (error) {
      setErrorText(error.message);
      return;
    }

    loadDeliveryData();
  }

  async function saveVehicleRule() {
    setSaving(true);
    setErrorText("");
    setSuccessText("");

    const payload = {
      vehicle_type: vehicleForm.vehicle_type,
      min_quantity: Number(vehicleForm.min_quantity || 0),
      max_quantity: vehicleForm.max_quantity
        ? Number(vehicleForm.max_quantity)
        : null,
      is_active: vehicleForm.is_active,
    };

    const result = vehicleForm.id
      ? await supabase
          .from("delivery_vehicle_rules")
          .update(payload)
          .eq("id", vehicleForm.id)
      : await supabase.from("delivery_vehicle_rules").insert(payload);

    setSaving(false);

    if (result.error) {
      setErrorText(result.error.message);
      return;
    }

    setVehicleForm({
      id: "",
      vehicle_type: "BIKE",
      min_quantity: 1,
      max_quantity: "",
      is_active: true,
    });

    setSuccessText(
      vehicleForm.id ? "Vehicle rule updated." : "Vehicle rule created.",
    );
    loadDeliveryData();
  }

  async function deleteVehicleRule(id: string) {
    if (!window.confirm("Delete this vehicle rule?")) return;

    const { error } = await supabase
      .from("delivery_vehicle_rules")
      .delete()
      .eq("id", id);

    if (error) {
      setErrorText(error.message);
      return;
    }

    loadDeliveryData();
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

  const visibleDistancePrices = distancePrices.filter(
    (price) => price.price_table_key === activePriceTable,
  );

  const firstKmPrice =
    visibleDistancePrices.find((price) => price.distance_km === 1)
      ?.normal_price_lkr || 0;

  const secondKmPrice =
    visibleDistancePrices.find((price) => price.distance_km === 2)
      ?.normal_price_lkr || 0;

  const additionalKmPrice =
    firstKmPrice && secondKmPrice ? secondKmPrice - firstKmPrice : 0;

  async function savePeakHour() {
    setSaving(true);
    setErrorText("");
    setSuccessText("");

    const payload = {
      delivery_app: peakHourForm.delivery_app,
      label: peakHourForm.label,
      start_time: peakHourForm.start_time,
      end_time: peakHourForm.end_time,
      is_active: peakHourForm.is_active,
    };

    const result = peakHourForm.id
      ? await supabase
          .from("delivery_peak_hours")
          .update(payload)
          .eq("id", peakHourForm.id)
      : await supabase.from("delivery_peak_hours").insert(payload);

    setSaving(false);

    if (result.error) {
      setErrorText(result.error.message);
      return;
    }

    setPeakHourForm({
      id: "",
      delivery_app: "PICKME_FLASH",
      label: "Peak Session",
      start_time: "16:00",
      end_time: "19:00",
      is_active: true,
    });

    setSuccessText(
      peakHourForm.id ? "Peak hour updated." : "Peak hour created.",
    );
    loadDeliveryData();
  }

  async function deletePeakHour(id: string) {
    if (!window.confirm("Delete this peak hour session?")) return;

    const { error } = await supabase
      .from("delivery_peak_hours")
      .delete()
      .eq("id", id);

    if (error) {
      setErrorText(error.message);
      return;
    }

    loadDeliveryData();
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
                Manage daily delivery, scheduled dates, holiday delivery,
                distance pricing, peak pricing, vehicle rules, and global
                delivery settings.
              </p>
            </div>

            <Link
              to="/admin/dashboard"
              className="w-fit rounded-2xl border border-brand-ink/20 bg-white/70 px-5 py-3 text-sm font-semibold text-brand-ink">
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
                ].join(" ")}>
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

        {activeTab === "patterns" && (
          <section className="rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-brand-ink">
              Delivery patterns
            </h2>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <PatternCard
                active={patternForm.delivery_mode === "EVERYDAY"}
                title="Every day delivery"
                description="Use normal business days with 3 delivery sessions."
                onClick={() =>
                  setPatternForm((p) => ({ ...p, delivery_mode: "EVERYDAY" }))
                }
              />

              <PatternCard
                active={patternForm.delivery_mode === "SCHEDULED"}
                title="Scheduled delivery dates"
                description="Only admin-created delivery dates and slots are shown."
                onClick={() =>
                  setPatternForm((p) => ({ ...p, delivery_mode: "SCHEDULED" }))
                }
              />

              <PatternCard
                active={patternForm.delivery_mode === "SPECIAL"}
                title="Special delivery mode"
                description="Use special holiday/event delivery dates."
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
                  className="w-full rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg">
                  Save pattern
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-black/10 bg-white/60 p-4">
                <h3 className="font-semibold text-brand-ink">
                  No delivery dates / holidays
                </h3>

                <div className="mt-4 flex gap-2">
                  <input
                    type="date"
                    className="input-order"
                    value={patternForm.no_delivery_date}
                    onChange={(e) =>
                      setPatternForm((p) => ({
                        ...p,
                        no_delivery_date: e.target.value,
                      }))
                    }
                  />

                  <button
                    type="button"
                    onClick={addNoDeliveryDate}
                    className="rounded-2xl bg-brand-ink px-4 text-sm font-semibold text-brand-bg">
                    Add
                  </button>
                </div>

                <div className="mt-4 grid gap-2">
                  {noDeliveryDates.map((date) => (
                    <RowShell key={date}>
                      <span className="font-semibold text-brand-ink">
                        {date}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeNoDeliveryDate(date)}
                        className="text-xs font-semibold text-red-600">
                        Delete
                      </button>
                    </RowShell>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white/60 p-4">
                <h3 className="font-semibold text-brand-ink">
                  Special delivery dates
                </h3>

                <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    type="date"
                    className="input-order"
                    value={patternForm.special_delivery_date}
                    onChange={(e) =>
                      setPatternForm((p) => ({
                        ...p,
                        special_delivery_date: e.target.value,
                      }))
                    }
                  />

                  <input
                    className="input-order"
                    placeholder="Label"
                    value={patternForm.special_delivery_label}
                    onChange={(e) =>
                      setPatternForm((p) => ({
                        ...p,
                        special_delivery_label: e.target.value,
                      }))
                    }
                  />

                  <button
                    type="button"
                    onClick={addSpecialDeliveryDate}
                    className="rounded-2xl bg-brand-ink px-4 text-sm font-semibold text-brand-bg">
                    Add
                  </button>
                </div>

                <div className="mt-4 grid gap-2">
                  {specialDeliveryDates.map((item) => (
                    <RowShell key={item.date}>
                      <span>
                        <span className="font-semibold text-brand-ink">
                          {item.date}
                        </span>
                        <span className="ml-2 text-sm text-brand-ink/55">
                          {item.label}
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => removeSpecialDeliveryDate(item.date)}
                        className="text-xs font-semibold text-red-600">
                        Delete
                      </button>
                    </RowShell>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "scheduled" && (
          <section className="rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-brand-ink">
              Scheduled delivery slots
            </h2>

            <div className="mt-5 rounded-3xl border border-black/10 bg-brand-bg/55 p-4">
              <div className="grid gap-3 md:grid-cols-6">
                <input
                  type="date"
                  value={slotForm.slot_date}
                  onChange={(e) =>
                    setSlotForm((p) => ({ ...p, slot_date: e.target.value }))
                  }
                  className="input-order"
                />

                <select
                  value={slotForm.slot_label}
                  onChange={(e) =>
                    setSlotForm((p) => ({ ...p, slot_label: e.target.value }))
                  }
                  className="input-order">
                  <option>Morning Delivery</option>
                  <option>Afternoon Delivery</option>
                  <option>Evening Delivery</option>
                  <option>Special Delivery</option>
                </select>

                <input
                  type="time"
                  value={slotForm.start_time}
                  onChange={(e) =>
                    setSlotForm((p) => ({ ...p, start_time: e.target.value }))
                  }
                  className="input-order"
                />

                <input
                  type="time"
                  value={slotForm.end_time}
                  onChange={(e) =>
                    setSlotForm((p) => ({ ...p, end_time: e.target.value }))
                  }
                  className="input-order"
                />

                <input
                  type="number"
                  min={1}
                  value={slotForm.max_orders}
                  onChange={(e) =>
                    setSlotForm((p) => ({
                      ...p,
                      max_orders: Number(e.target.value),
                    }))
                  }
                  className="input-order"
                />

                <button
                  type="button"
                  onClick={saveSlot}
                  disabled={saving}
                  className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg">
                  {slotForm.id ? "Update" : "Create"}
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-3xl border border-black/10 bg-white/70">
              <table className="min-w-[760px] w-full text-left text-sm">
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
                  {slots.map((slot) => (
                    <tr key={slot.id} className="border-t border-black/10">
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
                        {slot.is_available ? "Available" : "Closed"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
                            onClick={() => setSlotForm(slot)}>
                            Edit
                          </button>
                          <button
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                            onClick={() => deleteSlot(slot.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "pricing" && (
          <section className="rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-brand-ink">
              Distance pricing table
            </h2>

            <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-black/10 bg-brand-bg/60 p-2">
              {priceTables.map((table) => (
                <button
                  key={table.key}
                  type="button"
                  onClick={() => setActivePriceTable(table.key)}
                  className={[
                    "shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition",
                    activePriceTable === table.key
                      ? "bg-brand-ink text-brand-bg"
                      : "bg-white/70 text-brand-ink/65 hover:bg-white",
                  ].join(" ")}>
                  {table.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowPeakModal(true)}
                className="shrink-0 rounded-xl border border-brand-ink/20 bg-white px-4 py-2.5 text-xs font-semibold text-brand-ink">
                Peak hours
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <p className="text-xs font-semibold tracking-widest text-brand-ink/50">
                  FIRST 1KM PRICE
                </p>
                <p className="mt-2 text-xl font-semibold text-brand-ink">
                  {formatLkr(firstKmPrice)}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <p className="text-xs font-semibold tracking-widest text-brand-ink/50">
                  ADDITIONAL 1KM PRICE
                </p>
                <p className="mt-2 text-xl font-semibold text-brand-ink">
                  {formatLkr(additionalKmPrice)}
                </p>
              </div>
            </div>

            <p className="mt-1 text-sm text-brand-ink/60">
              Add per-distance prices. Peak pricing is stored separately in the
              same row.
            </p>

            <div className="mt-5 grid gap-3 rounded-3xl border border-black/10 bg-brand-bg/55 p-4 md:grid-cols-6">
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

              <select
                className="input-order"
                value={priceForm.vehicle_type}
                onChange={(e) =>
                  setPriceForm((p) => ({ ...p, vehicle_type: e.target.value }))
                }>
                <option>BIKE</option>
                <option>THREE_WHEEL</option>
                <option>CAR</option>
                <option>VAN</option>
              </select>

              <input
                type="number"
                className="input-order"
                value={priceForm.normal_price_lkr}
                onChange={(e) =>
                  setPriceForm((p) => ({
                    ...p,
                    normal_price_lkr: Number(e.target.value),
                  }))
                }
                placeholder="Normal price"
              />

              <input
                type="number"
                className="input-order"
                value={priceForm.peak_price_lkr}
                onChange={(e) =>
                  setPriceForm((p) => ({
                    ...p,
                    peak_price_lkr: Number(e.target.value),
                  }))
                }
                placeholder="Peak price"
              />

              <select
                className="input-order"
                value={priceForm.is_active ? "true" : "false"}
                onChange={(e) =>
                  setPriceForm((p) => ({
                    ...p,
                    is_active: e.target.value === "true",
                  }))
                }>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <button
                type="button"
                disabled={saving}
                onClick={savePrice}
                className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg">
                {priceForm.id ? "Update" : "Create"}
              </button>
            </div>

            <div className="mt-5 overflow-x-auto rounded-3xl border border-black/10 bg-white/70">
              <table className="min-w-[820px] w-full text-left text-sm">
                <thead className="bg-brand-bg/70 text-xs uppercase tracking-widest text-brand-ink/55">
                  <tr>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Distance</th>
                    <th className="px-4 py-3">Normal</th>
                    <th className="px-4 py-3">Peak</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleDistancePrices.map((price) => (
                    <tr key={price.id} className="border-t border-black/10">
                      <td className="px-4 py-3 font-semibold text-brand-ink">
                        {vehicleIcon(price.vehicle_type)} {price.vehicle_type}
                      </td>
                      <td className="px-4 py-3">{price.distance_km}km</td>
                      <td className="px-4 py-3">
                        {formatLkr(price.normal_price_lkr)}
                      </td>
                      <td className="px-4 py-3">
                        {formatLkr(price.peak_price_lkr)}
                      </td>
                      <td className="px-4 py-3">
                        {price.is_active ? "Active" : "Inactive"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
                            onClick={() => {
                              setPriceForm(price);
                              setShowPriceModal(true);
                            }}>
                            Edit
                          </button>
                          <button
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                            onClick={() => deletePrice(price.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "vehicles" && (
          <section className="rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-brand-ink">
              Vehicle rules
            </h2>

            <div className="mt-5 grid gap-3 rounded-3xl border border-black/10 bg-brand-bg/55 p-4 md:grid-cols-5">
              <select
                className="input-order"
                value={vehicleForm.vehicle_type}
                onChange={(e) =>
                  setVehicleForm((p) => ({
                    ...p,
                    vehicle_type: e.target.value,
                  }))
                }>
                <option>BIKE</option>
                <option>THREE_WHEEL</option>
                <option>CAR</option>
                <option>VAN</option>
              </select>

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

              <select
                className="input-order"
                value={vehicleForm.is_active ? "true" : "false"}
                onChange={(e) =>
                  setVehicleForm((p) => ({
                    ...p,
                    is_active: e.target.value === "true",
                  }))
                }>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <button
                type="button"
                disabled={saving}
                onClick={saveVehicleRule}
                className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg">
                {vehicleForm.id ? "Update" : "Create"}
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {vehicleRules.map((rule) => (
                <RowShell key={rule.id}>
                  <div>
                    <p className="font-semibold text-brand-ink">
                      {rule.vehicle_type}
                    </p>
                    <p className="text-sm text-brand-ink/60">
                      Quantity {rule.min_quantity} –{" "}
                      {rule.max_quantity ?? "above"} ·{" "}
                      {rule.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
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
                      }>
                      Edit
                    </button>
                    <button
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                      onClick={() => deleteVehicleRule(rule.id)}>
                      Delete
                    </button>
                  </div>
                </RowShell>
              ))}
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <section className="rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-brand-ink">
              Delivery settings
            </h2>

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
                />
              </Field>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={saveCommonSettings}
              className="mt-5 rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg">
              Save settings
            </button>
          </section>
        )}

        {showPeakModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
            <div className="w-full max-w-3xl rounded-[2rem] bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-brand-ink">
                    Peak hours
                  </h3>
                  <p className="mt-1 text-sm text-brand-ink/60">
                    Add, edit, and delete PickMe Flash / Uber Parcel peak
                    sessions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPeakModal(false)}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold">
                  Close
                </button>
              </div>

              <div className="mt-5 grid gap-3 rounded-3xl border border-black/10 bg-brand-bg/60 p-4 md:grid-cols-6">
                <select
                  className="input-order"
                  value={peakHourForm.delivery_app}
                  onChange={(e) =>
                    setPeakHourForm((p) => ({
                      ...p,
                      delivery_app: e.target.value as
                        | "PICKME_FLASH"
                        | "UBER_PARCEL",
                    }))
                  }>
                  <option value="PICKME_FLASH">PickMe Flash</option>
                  <option value="UBER_PARCEL">Uber Parcel</option>
                </select>

                <input
                  className="input-order md:col-span-2"
                  value={peakHourForm.label}
                  onChange={(e) =>
                    setPeakHourForm((p) => ({ ...p, label: e.target.value }))
                  }
                  placeholder="Peak label"
                />

                <input
                  type="time"
                  className="input-order"
                  value={peakHourForm.start_time}
                  onChange={(e) =>
                    setPeakHourForm((p) => ({
                      ...p,
                      start_time: e.target.value,
                    }))
                  }
                />

                <input
                  type="time"
                  className="input-order"
                  value={peakHourForm.end_time}
                  onChange={(e) =>
                    setPeakHourForm((p) => ({ ...p, end_time: e.target.value }))
                  }
                />

                <button
                  type="button"
                  disabled={saving}
                  onClick={savePeakHour}
                  className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg">
                  {peakHourForm.id ? "Update" : "Create"}
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                {peakHours.length ? (
                  peakHours.map((hour) => (
                    <div
                      key={hour.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-brand-bg/50 p-4 text-sm">
                      <div>
                        <p className="font-semibold text-brand-ink">
                          {hour.delivery_app === "PICKME_FLASH"
                            ? "PickMe Flash"
                            : "Uber Parcel"}{" "}
                          — {hour.label}
                        </p>

                        <p className="mt-1 text-brand-ink/60">
                          {hour.start_time.slice(0, 5)} –{" "}
                          {hour.end_time.slice(0, 5)} ·{" "}
                          {hour.is_active ? "Active" : "Inactive"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
                          onClick={() => setPeakHourForm(hour)}>
                          Edit
                        </button>

                        <button
                          type="button"
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                          onClick={() => deletePeakHour(hour.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-black/10 bg-brand-bg/50 p-4 text-sm text-brand-ink/60">
                    No peak hour sessions added yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showPriceModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4">
            <div className="w-full max-w-xl rounded-[2rem] bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-brand-ink">
                    Edit distance price
                  </h3>
                  <p className="mt-1 text-sm text-brand-ink/60">
                    Update distance, vehicle, price, and active status.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold">
                  Close
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                    }>
                    <option>BIKE</option>
                    <option>THREE_WHEEL</option>
                    <option>CAR</option>
                    <option>VAN</option>
                  </select>
                </Field>

                <Field label="Normal price">
                  <input
                    type="number"
                    className="input-order"
                    value={priceForm.normal_price_lkr}
                    onChange={(e) =>
                      setPriceForm((p) => ({
                        ...p,
                        normal_price_lkr: Number(e.target.value),
                      }))
                    }
                  />
                </Field>

                <Field label="Peak price">
                  <input
                    type="number"
                    className="input-order"
                    value={priceForm.peak_price_lkr}
                    onChange={(e) =>
                      setPriceForm((p) => ({
                        ...p,
                        peak_price_lkr: Number(e.target.value),
                      }))
                    }
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
                    }>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </Field>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="rounded-2xl border border-brand-ink/20 px-5 py-3 text-sm font-semibold text-brand-ink">
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    await savePrice();
                    setShowPriceModal(false);
                  }}
                  className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg">
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
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
      ].join(" ")}>
      <p className="text-base font-semibold">{title}</p>
      <p
        className={[
          "mt-2 text-sm leading-relaxed",
          active ? "text-brand-bg/70" : "text-brand-ink/60",
        ].join(" ")}>
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
