/** @format */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../app/cart";
import Page from "../components/Page";
import {
  checkCustomerEmailExists,
  createGuestOrder,
  type DeliveryTarget,
} from "../lib/orders";
import { getAuthenticatedUser } from "../lib/accountApi";
import {
  getCheckoutBootstrap,
  getCheckoutQuote,
  type CheckoutQuote,
} from "../lib/checkoutApi";

const WHATSAPP_NUMBER = "94769878770";
const DELIVERY_METHOD = "Regular Baura delivery arrangement";

const BAURA_LAT = 6.832636909688839;
const BAURA_LNG = 79.99981842449598;
const ROAD_DISTANCE_BUFFER = 1.2;
const DELIVERY_PREVIEW_DAYS = 14;
const CUSTOMER_WORKING_DAYS_LIMIT = 4;

type StepNo = 1 | 2 | 3 | 4;

type DeliveryMode = "SCHEDULED" | "EVERYDAY" | "SPECIAL";

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

type OldSpecialDeliveryDate = {
  date: string;
  label: string;
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

type DeliveryDistancePrice = {
  id: string;
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

type FormState = {
  senderName: string;
  senderEmail: string;
  senderContactNumber: string;
  senderAddress: string;
  senderLocationUrl: string;
  senderLat: number | null;
  senderLng: number | null;

  hasDifferentReceiver: boolean;
  isGift: boolean;

  receiverName: string;
  receiverContactNumber: string;
  receiverAddress: string;
  receiverLocationUrl: string;
  receiverLat: number | null;
  receiverLng: number | null;

  deliveryTarget: DeliveryTarget;
  note: string;
};

function makeOrderId() {
  const s = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BB-${s}`;
}

function onlyDigitsPhone(v: string) {
  return v.replace(/[^\d+]/g, "");
}

function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function formatLkr(n: number) {
  return `LKR ${Number(n || 0).toLocaleString()}`;
}

function formatSlot(slot: DeliverySlot | null) {
  if (!slot) return "-";

  return `${slot.slot_date} • ${slot.slot_label} • ${slot.start_time.slice(
    0,
    5,
  )} – ${slot.end_time.slice(0, 5)}`;
}

function readProfileValue(
  profile: Record<string, unknown> | null,
  keys: string[],
) {
  if (!profile) return "";

  for (const key of keys) {
    const value = profile[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function calculateDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  const earthRadiusKm = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function extractLatLngFromGoogleMapsUrl(url: string) {
  const clean = url.trim();

  const qMatch = clean.match(/[?&]q=(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);

  if (qMatch) {
    return {
      lat: Number(qMatch[1]),
      lng: Number(qMatch[3]),
    };
  }

  const atMatch = clean.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);

  if (atMatch) {
    return {
      lat: Number(atMatch[1]),
      lng: Number(atMatch[3]),
    };
  }

  return null;
}

function roundUpDistanceKm(distanceKm: number) {
  return Math.max(1, Math.ceil(distanceKm));
}

function parseJsonList<T = unknown>(value?: string): T[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toLocalIsoDate(date = new Date()) {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;

  return new Date(date.getTime() - timezoneOffsetMs)
    .toISOString()
    .slice(0, 10);
}

function addDaysAsIsoDate(daysToAdd: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return toLocalIsoDate(date);
}

function timeToMinutes(time: string) {
  const clean = time || "00:00";
  const [hours, minutes] = clean.slice(0, 5).split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function slotsOverlap(
  slotStart: string,
  slotEnd: string,
  blockStart: string,
  blockEnd: string,
) {
  const slotStartMinutes = timeToMinutes(slotStart);
  const slotEndMinutes = timeToMinutes(slotEnd);
  const blockStartMinutes = timeToMinutes(blockStart);
  const blockEndMinutes = timeToMinutes(blockEnd);

  return (
    slotStartMinutes < blockEndMinutes && slotEndMinutes > blockStartMinutes
  );
}

function normalizeSpecialDeliverySlots(value?: string): SpecialDeliverySlot[] {
  const rows = parseJsonList<
    Partial<SpecialDeliverySlot> & OldSpecialDeliveryDate
  >(value);

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

function getNoDeliveryBlocks(settings: Record<string, string>) {
  const newBlocks = parseJsonList<NoDeliveryBlock>(
    settings.no_delivery_blocks_json,
  );

  const oldFullDayDates = parseJsonList<string>(
    settings.no_delivery_dates_json,
  );

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

function isSlotBlocked(slot: DeliverySlot, blocks: NoDeliveryBlock[]) {
  return blocks.some((block) => {
    if (block.block_date !== slot.slot_date) return false;

    if (block.full_day) return true;

    return slotsOverlap(
      slot.start_time,
      slot.end_time,
      block.start_time,
      block.end_time,
    );
  });
}

function isPastDeliverySlot(slot: DeliverySlot) {
  const today = toLocalIsoDate();

  if (slot.slot_date < today) return true;
  if (slot.slot_date > today) return false;

  const slotStart = new Date(
    `${slot.slot_date}T${slot.start_time.slice(0, 5)}:00`,
  );

  return slotStart.getTime() <= Date.now();
}

function limitToFirstWorkingDays(slots: DeliverySlot[], maxDays = 4) {
  const workingDates: string[] = [];

  for (const slot of slots) {
    if (!workingDates.includes(slot.slot_date)) {
      workingDates.push(slot.slot_date);
    }

    if (workingDates.length >= maxDays) break;
  }

  return slots.filter((slot) => workingDates.includes(slot.slot_date));
}

function buildSlotsFromDeliverySettings(settings: Record<string, string>) {
  const mode = (settings.delivery_mode || "SCHEDULED") as DeliveryMode;
  const today = toLocalIsoDate();

  if (mode === "EVERYDAY") {
    const dailySlots = parseJsonList<DailyDeliverySlot>(
      settings.daily_delivery_slots_json,
    ).filter((slot) => slot.is_available);

    const generatedSlots: DeliverySlot[] = [];

    for (let i = 0; i < DELIVERY_PREVIEW_DAYS; i += 1) {
      const date = addDaysAsIsoDate(i);

      for (const slot of dailySlots) {
        generatedSlots.push({
          id: `daily-${date}-${slot.id}`,
          slot_date: date,
          slot_label: slot.slot_label,
          start_time: slot.start_time,
          end_time: slot.end_time,
          max_orders: slot.max_orders,
          is_available: slot.is_available,
        });
      }
    }

    return generatedSlots;
  }

  if (mode === "SPECIAL") {
    return normalizeSpecialDeliverySlots(settings.special_delivery_dates_json)
      .filter((slot) => slot.is_available)
      .filter((slot) => slot.slot_date >= today)
      .map((slot) => ({
        id: `special-${slot.slot_date}-${slot.id}`,
        slot_date: slot.slot_date,
        slot_label: slot.slot_label,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_orders: slot.max_orders,
        is_available: slot.is_available,
      }));
  }

  return [];
}

function formatCalendarDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatCalendarDayNumber(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
  });
}

function formatCalendarMonth(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
  });
}

export default function Order() {
  const navigate = useNavigate();
  const { items, clear } = useCart();

  const [step, setStep] = useState<StepNo>(1);
  const stepTopRef = useRef<HTMLDivElement | null>(null);
  const hasMountedStepScroll = useRef(false);

  const [orderId] = useState(() => makeOrderId());

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [submitError, setSubmitError] = useState("");
  const [savedOrderNo, setSavedOrderNo] = useState<string | null>(null);

  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [selectedDeliverySlotId, setSelectedDeliverySlotId] = useState("");
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  const [isExistingCustomerEmail, setIsExistingCustomerEmail] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [dismissLoginPrompt, setDismissLoginPrompt] = useState(false);

  const [vehicleRules, setVehicleRules] = useState<DeliveryVehicleRule[]>([]);
  const [distancePrices, setDistancePrices] = useState<DeliveryDistancePrice[]>(
    [],
  );

  const [deliverySettings, setDeliverySettings] = useState<
    Record<string, string>
  >({});

  const [isLoadingDeliveryPricing, setIsLoadingDeliveryPricing] =
    useState(true);

  const [apiRoadDistanceKm, setApiRoadDistanceKm] = useState<number | null>(
    null,
  );
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceNotice, setDistanceNotice] = useState("");
  const [checkoutQuote, setCheckoutQuote] = useState<CheckoutQuote | null>(null);

  const [form, setForm] = useState<FormState>({
    senderName: "",
    senderEmail: "",
    senderContactNumber: "",
    senderAddress: "",
    senderLocationUrl: "",
    senderLat: null,
    senderLng: null,

    hasDifferentReceiver: false,
    isGift: false,

    receiverName: "",
    receiverContactNumber: "",
    receiverAddress: "",
    receiverLocationUrl: "",
    receiverLat: null,
    receiverLng: null,

    deliveryTarget: "SENDER",
    note: "",
  });

  const selectedDeliverySlot = useMemo(() => {
    return (
      deliverySlots.find((slot) => slot.id === selectedDeliverySlotId) || null
    );
  }, [deliverySlots, selectedDeliverySlotId]);

  const deliveryCalendarDays = useMemo(() => {
    const grouped = new Map<string, DeliverySlot[]>();

    for (const slot of deliverySlots) {
      const current = grouped.get(slot.slot_date) || [];
      current.push(slot);
      grouped.set(slot.slot_date, current);
    }

    return Array.from(grouped.entries()).map(([date, dateSlots]) => ({
      date,
      slots: dateSlots.sort((a, b) =>
        a.start_time.localeCompare(b.start_time),
      ),
    }));
  }, [deliverySlots]);

  const selectedDateSlots = useMemo(() => {
    return (
      deliveryCalendarDays.find((day) => day.date === selectedDeliveryDate)
        ?.slots || []
    );
  }, [deliveryCalendarDays, selectedDeliveryDate]);

  useEffect(() => {
    if (!hasMountedStepScroll.current) {
      hasMountedStepScroll.current = true;
      return;
    }

    window.requestAnimationFrame(() => {
      stepTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [step]);

  useEffect(() => {
    async function loadLoggedInUserDetails() {
      try {
        setIsLoadingUser(true);

        const user = await getAuthenticatedUser();

        if (!user) {
          return;
        }

        setForm((prev) => ({
          ...prev,
          senderName: prev.senderName || user.name || "",
          senderEmail: prev.senderEmail || user.email || "",
          senderContactNumber: prev.senderContactNumber || user.phone || "",
          senderAddress:
            prev.senderAddress || user.default_delivery_address || "",
        }));
      } catch {
        setSubmitError("Could not load your account details.");
      } finally {
        setIsLoadingUser(false);
      }
    }

    void loadLoggedInUserDetails();
  }, []);

  useEffect(() => {
    async function loadDeliverySlots() {
      try {
        setIsLoadingSlots(true);

        const checkout = await getCheckoutBootstrap();
        const availableSlots = checkout.slots
          .filter((slot) => slot.is_available)
          .sort((a, b) => {
            if (a.slot_date !== b.slot_date) {
              return a.slot_date.localeCompare(b.slot_date);
            }

            return a.start_time.localeCompare(b.start_time);
          });

        setDeliverySlots(availableSlots);

        setSelectedDeliverySlotId((current) =>
          availableSlots.some((slot) => slot.id === current) ? current : "",
        );

        setSelectedDeliveryDate((current) => {
          if (
            current &&
            availableSlots.some((slot) => slot.slot_date === current)
          ) {
            return current;
          }

          return availableSlots[0]?.slot_date || "";
        });
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Could not load delivery sessions.",
        );
        setDeliverySlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    void loadDeliverySlots();
  }, []);

  useEffect(() => {
    let active = true;
    const email = form.senderEmail.trim().toLowerCase();

    async function checkEmail() {
      if (!isEmailLike(email)) {
        setIsExistingCustomerEmail(false);
        setIsCheckingEmail(false);
        setDismissLoginPrompt(false);
        return;
      }

      const user = await getAuthenticatedUser();

      if (user) {
        setIsExistingCustomerEmail(false);
        setIsCheckingEmail(false);
        return;
      }

      setIsCheckingEmail(true);

      const exists = await checkCustomerEmailExists(email);

      if (!active) return;

      setIsExistingCustomerEmail(exists);

      if (!exists) {
        setDismissLoginPrompt(false);
      }

      setIsCheckingEmail(false);
    }

    const timer = window.setTimeout(checkEmail, 600);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [form.senderEmail]);

  useEffect(() => {
    setIsLoadingDeliveryPricing(false);
  }, []);

  const totalLkr = useMemo(() => {
    return items.reduce((sum, it) => sum + it.unitPriceLkr * it.quantity, 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const needsReceiver = form.hasDifferentReceiver || form.isGift;

  const senderValid = useMemo(() => {
    return (
      form.senderName.trim().length >= 2 &&
      isEmailLike(form.senderEmail) &&
      onlyDigitsPhone(form.senderContactNumber).trim().length >= 9 &&
      form.senderAddress.trim().length >= 5
    );
  }, [
    form.senderName,
    form.senderEmail,
    form.senderContactNumber,
    form.senderAddress,
  ]);

  const receiverValid = useMemo(() => {
    if (!needsReceiver) return true;

    return (
      form.receiverName.trim().length >= 2 &&
      onlyDigitsPhone(form.receiverContactNumber).trim().length >= 9 &&
      form.receiverAddress.trim().length >= 5
    );
  }, [
    needsReceiver,
    form.receiverName,
    form.receiverContactNumber,
    form.receiverAddress,
  ]);

  const detailsValid = senderValid && receiverValid;

  const effectiveDelivery = useMemo(() => {
    if (form.deliveryTarget === "RECEIVER" && needsReceiver) {
      return {
        name: form.receiverName,
        contactNumber: onlyDigitsPhone(form.receiverContactNumber),
        address: form.receiverAddress,
        locationUrl: form.receiverLocationUrl,
        lat: form.receiverLat,
        lng: form.receiverLng,
      };
    }

    return {
      name: form.senderName,
      contactNumber: onlyDigitsPhone(form.senderContactNumber),
      address: form.senderAddress,
      locationUrl: form.senderLocationUrl,
      lat: form.senderLat,
      lng: form.senderLng,
    };
  }, [form, needsReceiver]);

  const deliveryLocationCoords = useMemo(() => {
    if (effectiveDelivery.lat !== null && effectiveDelivery.lng !== null) {
      return {
        lat: effectiveDelivery.lat,
        lng: effectiveDelivery.lng,
      };
    }

    if (effectiveDelivery.locationUrl.trim()) {
      return extractLatLngFromGoogleMapsUrl(effectiveDelivery.locationUrl);
    }

    return null;
  }, [
    effectiveDelivery.lat,
    effectiveDelivery.lng,
    effectiveDelivery.locationUrl,
  ]);

  const deliveryAddressValid = useMemo(() => {
    return (
      effectiveDelivery.address.trim().length >= 5 &&
      Boolean(deliveryLocationCoords)
    );
  }, [effectiveDelivery.address, deliveryLocationCoords]);

  const selectedVehicleType = checkoutQuote?.vehicle_type || "BIKE";

  const estimatedRoadDistanceKm = useMemo(() => {
    if (!deliveryLocationCoords) return null;

    const straightDistance = calculateDistanceKm(
      BAURA_LAT,
      BAURA_LNG,
      deliveryLocationCoords.lat,
      deliveryLocationCoords.lng,
    );

    return Number((straightDistance * ROAD_DISTANCE_BUFFER).toFixed(2));
  }, [deliveryLocationCoords]);

  useEffect(() => {
    let ignore = false;

    async function calculateRoadDistance() {
      if (!deliveryLocationCoords || totalQuantity < 1) {
        setCheckoutQuote(null);
        setApiRoadDistanceKm(null);
        setDistanceNotice("");
        return;
      }

      setIsCalculatingDistance(true);
      setDistanceNotice("");

      try {
        const quote = await getCheckoutQuote({
          lat: deliveryLocationCoords.lat,
          lng: deliveryLocationCoords.lng,
          totalQuantity,
        });

        if (!ignore) {
          setCheckoutQuote(quote);
          setApiRoadDistanceKm(quote.distance_km);
          setDistanceNotice(
            quote.distance_source === "ESTIMATED"
              ? "Using Laravel's estimated road distance for local testing."
              : "",
          );
        }
      } catch (error) {
        if (!ignore) {
          setCheckoutQuote(null);
          setApiRoadDistanceKm(null);
          setDistanceNotice(
            error instanceof Error
              ? error.message
              : "Could not calculate the delivery fee.",
          );
        }
      } finally {
        if (!ignore) {
          setIsCalculatingDistance(false);
        }
      }
    }

    void calculateRoadDistance();

    return () => {
      ignore = true;
    };
  }, [deliveryLocationCoords, totalQuantity]);

  const roadDistanceKm =
    checkoutQuote?.distance_km ?? apiRoadDistanceKm ?? estimatedRoadDistanceKm;

  const pricingDistanceKm =
    checkoutQuote?.pricing_distance_km ??
    (roadDistanceKm ? roundUpDistanceKm(roadDistanceKm) : null);

  const selectedDistancePrice = checkoutQuote
    ? { normal_price_lkr: checkoutQuote.base_price_lkr }
    : null;

  const deliveryPricingMode = checkoutQuote?.pricing_mode || "NORMAL";
  const deliveryFeeLkr = checkoutQuote?.delivery_fee_lkr || 0;
  const finalTotalLkr = totalLkr + deliveryFeeLkr;

  const deliveryCostValid = Boolean(
    checkoutQuote && roadDistanceKm && pricingDistanceKm && deliveryFeeLkr > 0,
  );

  const scheduleValid = Boolean(selectedDeliverySlot) && deliveryCostValid;

  const cartLines = useMemo(() => {
    return items.map((it, idx) => {
      const lineTotal = it.unitPriceLkr * it.quantity;

      return `${idx + 1}. ${it.productName} • ${it.size.label} • Sugar: ${
        it.sugar
      } • Qty: ${it.quantity} • ${formatLkr(lineTotal)}`;
    });
  }, [items]);

  const whatsappMessage = useMemo(() => {
    const senderPhone = onlyDigitsPhone(form.senderContactNumber);
    const receiverPhone = onlyDigitsPhone(form.receiverContactNumber);

    const locationUrl =
      effectiveDelivery.locationUrl ||
      (deliveryLocationCoords
        ? `https://www.google.com/maps?q=${deliveryLocationCoords.lat},${deliveryLocationCoords.lng}`
        : "");

    return [
      "🧁 *Baura Bakers — WhatsApp Order*",
      `🆔 *Order ID:* ${orderId}`,
      "",
      "👤 *Sender Details*",
      `Name: ${form.senderName || "-"}`,
      `Email: ${form.senderEmail || "-"}`,
      `Contact: ${senderPhone || "-"}`,
      `Address: ${form.senderAddress || "-"}`,
      form.senderLocationUrl
        ? `Sender Location: ${form.senderLocationUrl}`
        : "",
      "",
      needsReceiver
        ? [
            "🎁 *Receiver Details*",
            `Gift Order: ${form.isGift ? "Yes" : "No"}`,
            `Name: ${form.receiverName || "-"}`,
            `Contact: ${receiverPhone || "-"}`,
            `Address: ${form.receiverAddress || "-"}`,
            form.receiverLocationUrl
              ? `Receiver Location: ${form.receiverLocationUrl}`
              : "",
            "",
          ].join("\n")
        : "",
      "🚚 *Delivery Arrangement*",
      `Delivery Method: ${DELIVERY_METHOD}`,
      `Deliver To: ${
        form.deliveryTarget === "RECEIVER"
          ? "Receiver address"
          : "My doorstep / sender address"
      }`,
      `Delivery Address: ${effectiveDelivery.address || "-"}`,
      locationUrl ? `Exact Location: ${locationUrl}` : "",
      selectedDeliverySlot
        ? `Delivery Schedule: ${formatSlot(selectedDeliverySlot)}`
        : "",
      form.note.trim() ? `Note: ${form.note.trim()}` : "",
      "",
      "🛍️ *Order Items*",
      cartLines.length ? cartLines.join("\n") : "(No cart items found)",
      "",
      roadDistanceKm ? `📍 *Road Distance:* ${roadDistanceKm}km` : "",
      pricingDistanceKm ? `📌 *Pricing Distance:* ${pricingDistanceKm}km` : "",
      `🚚 *Delivery Fee:* ${formatLkr(deliveryFeeLkr)}`,
      `💰 *Final Total:* ${formatLkr(finalTotalLkr)}`,
      "",
      "🏦 *Payment Method:* Bank transfer / WhatsApp confirmation",
      "Please confirm availability, delivery arrangement, and payment details.",
    ]
      .filter(Boolean)
      .join("\n");
  }, [
    form,
    orderId,
    needsReceiver,
    effectiveDelivery,
    selectedDeliverySlot,
    deliveryFeeLkr,
    finalTotalLkr,
    cartLines,
    roadDistanceKm,
    pricingDistanceKm,
    deliveryLocationCoords,
  ]);

  const canGoNext =
    step === 1
      ? detailsValid
      : step === 2
        ? deliveryAddressValid
        : step === 3
          ? scheduleValid
          : true;

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDifferentReceiver(value: boolean) {
    setForm((prev) => ({
      ...prev,
      hasDifferentReceiver: value,
      isGift: value ? prev.isGift : false,
      deliveryTarget: value ? prev.deliveryTarget : "SENDER",
    }));
  }

  function toggleGift(value: boolean) {
    setForm((prev) => ({
      ...prev,
      isGift: value,
      hasDifferentReceiver: value ? true : prev.hasDifferentReceiver,
      deliveryTarget: value ? "RECEIVER" : prev.deliveryTarget,
    }));
  }

  function goNext() {
    setSubmitError("");

    if (step === 1 && !detailsValid) {
      setSubmitError(
        "Please complete sender details, a valid email, and receiver details if needed.",
      );
      return;
    }

    if (step === 2 && !deliveryAddressValid) {
      setSubmitError(
        "Please complete the delivery address and add an exact Google Maps location.",
      );
      return;
    }

    if (step === 3 && !scheduleValid) {
      if (!selectedDeliverySlot) {
        setSubmitError("Please select a delivery date and time session.");
        return;
      }

      if (!deliveryCostValid) {
        setSubmitError(
          "Delivery fee is not ready. Please check the map location and delivery pricing.",
        );
        return;
      }

      setSubmitError(
        "Please select a delivery session and make sure delivery fee is calculated.",
      );
      return;
    }

    setStep((prev) => Math.min(prev + 1, 4) as StepNo);
  }

  function goBack() {
    setSubmitError("");
    setStep((prev) => Math.max(prev - 1, 1) as StepNo);
  }

  function copySenderToReceiver() {
    setForm((prev) => ({
      ...prev,
      receiverName: prev.senderName,
      receiverContactNumber: prev.senderContactNumber,
      receiverAddress: prev.senderAddress,
      receiverLocationUrl: prev.senderLocationUrl,
      receiverLat: prev.senderLat,
      receiverLng: prev.senderLng,
    }));
  }

  function useCurrentLocation(target: DeliveryTarget) {
    if (!navigator.geolocation) {
      setSubmitError("Location is not supported by this browser.");
      return;
    }

    setIsLocating(true);
    setSubmitError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(7));
        const lng = Number(position.coords.longitude.toFixed(7));
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        setForm((prev) => {
          if (target === "RECEIVER") {
            return {
              ...prev,
              receiverLat: lat,
              receiverLng: lng,
              receiverLocationUrl: mapUrl,
            };
          }

          return {
            ...prev,
            senderLat: lat,
            senderLng: lng,
            senderLocationUrl: mapUrl,
          };
        });

        setIsLocating(false);
      },
      () => {
        setSubmitError(
          "Could not get your location. Please allow location permission or paste your Google Maps location link.",
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
  }

  function updateLocationUrl(value: string) {
    const coords = extractLatLngFromGoogleMapsUrl(value);

    if (form.deliveryTarget === "RECEIVER") {
      setForm((prev) => ({
        ...prev,
        receiverLocationUrl: value,
        receiverLat: coords?.lat ?? null,
        receiverLng: coords?.lng ?? null,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      senderLocationUrl: value,
      senderLat: coords?.lat ?? null,
      senderLng: coords?.lng ?? null,
    }));
  }

  async function saveOrderOnce(paymentMethod: string) {
    if (savedOrderNo === orderId) {
      return null;
    }

    if (!selectedDeliverySlot) {
      throw new Error("Please select a delivery date and time session.");
    }

    const fallbackLocationUrl = deliveryLocationCoords
      ? `https://www.google.com/maps?q=${deliveryLocationCoords.lat},${deliveryLocationCoords.lng}`
      : "";

    const savedOrder = await createGuestOrder({
      orderNo: orderId,

      senderName: form.senderName,
      senderEmail: form.senderEmail,
      senderContactNumber: onlyDigitsPhone(form.senderContactNumber),
      senderAddress: form.senderAddress,
      senderLocationUrl: form.senderLocationUrl,
      senderLat: form.senderLat,
      senderLng: form.senderLng,

      hasDifferentReceiver: needsReceiver,
      isGift: form.isGift,

      receiverName: form.receiverName,
      receiverContactNumber: onlyDigitsPhone(form.receiverContactNumber),
      receiverAddress: form.receiverAddress,
      receiverLocationUrl: form.receiverLocationUrl,
      receiverLat: form.receiverLat,
      receiverLng: form.receiverLng,

      deliveryTarget: form.deliveryTarget,
      deliveryAddress: effectiveDelivery.address,
      deliveryLocationUrl: effectiveDelivery.locationUrl || fallbackLocationUrl,
      deliveryLat: deliveryLocationCoords?.lat ?? null,
      deliveryLng: deliveryLocationCoords?.lng ?? null,
      deliverySlotId: selectedDeliverySlot.id,

      deliveryDate: selectedDeliverySlot.slot_date,
      deliverySlotLabel: selectedDeliverySlot.slot_label,
      deliverySlotStart: selectedDeliverySlot.start_time,
      deliverySlotEnd: selectedDeliverySlot.end_time,

      deliveryDistanceKm: roadDistanceKm,
      deliveryVehicleType: selectedVehicleType,
      deliveryFeeLkr,
      deliveryPricingMode,

      deliveryApp: DELIVERY_METHOD,
      paymentMethod,
      note: form.note,
      items,
    });

    console.log("Order saved successfully:", savedOrder);
    setSavedOrderNo(orderId);

    return savedOrder;
  }

  async function bankTransferViaWhatsApp() {
    if (
      !detailsValid ||
      !deliveryAddressValid ||
      !scheduleValid ||
      !items.length ||
      isSubmitting
    ) {
      return;
    }

    const whatsappTab = window.open(
      "about:blank",
      "_blank",
      "noopener,noreferrer",
    );

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const savedOrder = await saveOrderOnce("BANK_TRANSFER_WHATSAPP");

      const trackingUrl = savedOrder?.trackingToken
        ? `${window.location.origin}/track/${encodeURIComponent(
            orderId,
          )}?t=${encodeURIComponent(savedOrder.trackingToken)}`
        : `${window.location.origin}/track/${encodeURIComponent(orderId)}`;

      const isLoggedIn = Boolean(await getAuthenticatedUser());

      localStorage.setItem(
        "baura_completed_bank_transfer_v1",
        JSON.stringify({
          orderNo: orderId,
          email: form.senderEmail.trim(),
          trackingUrl,
          savedAt: new Date().toISOString(),
        }),
      );

      clear();

      const finalWhatsappMessage = [
        whatsappMessage,
        "",
        `🔎 *Track Order:* ${trackingUrl}`,
      ].join("\n");

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        finalWhatsappMessage,
      )}`;

      if (whatsappTab) {
        whatsappTab.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }

      if (!isLoggedIn) {
        sessionStorage.setItem(
          "baura_after_login_redirect",
          "/orders",
        );
      }

      navigate("/orders");
    } catch (error) {
      if (whatsappTab) {
        whatsappTab.close();
      }

      console.error("Bank transfer order failed:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Order could not be saved. Please try again.",
      );

      setIsSubmitting(false);
    }
  }


  const currentLocationUrl =
    form.deliveryTarget === "RECEIVER"
      ? form.receiverLocationUrl
      : form.senderLocationUrl;

  const currentMapUrl = deliveryLocationCoords
    ? `https://www.google.com/maps?q=${deliveryLocationCoords.lat},${deliveryLocationCoords.lng}&z=16&output=embed`
    : "";

  const stepMeta = [
    {
      id: 1,
      label: "Details",
      helper: "Sender and receiver",
    },
    {
      id: 2,
      label: "Address",
      helper: "Map location",
    },
    {
      id: 3,
      label: "Schedule",
      helper: "Date and fee",
    },
    {
      id: 4,
      label: "Confirm",
      helper: "WhatsApp confirmation",
    },
  ] as const;


  if (!items.length && !savedOrderNo) {
    return (
      <Page>
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-black/10 bg-white/70 p-6 text-center shadow-sm backdrop-blur sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-ink/45">
            Checkout
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
            Your cart is empty
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-ink/65">
            Add at least one Baura Bakers item before going to checkout.
          </p>

          <Link
            to="/menu"
            className="mt-6 inline-flex rounded-2xl bg-brand-ink px-6 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95"
          >
            Go to menu
          </Link>
        </section>
      </Page>
    );
  }

  return (
    <Page>
      <div ref={stepTopRef} className="space-y-5 scroll-mt-24 sm:space-y-8">
        <header className="rounded-[2rem] border border-black/10 bg-white/55 p-5 shadow-sm backdrop-blur sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.26em] text-brand-ink/55 sm:text-xs sm:tracking-[0.28em]">
                CHECKOUT
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
                Complete your order
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/70">
                Finish in 4 clear steps. Add customer details, pin the delivery
                address, choose a delivery session, and send the order through
                WhatsApp.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-brand-bg/70 px-4 py-3 text-sm text-brand-ink">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-ink/45">
                Order ID
              </p>
              <p className="mt-1 font-bold">{orderId}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className="rounded-[2rem] border border-black/10 bg-white/60 p-4 shadow-sm backdrop-blur sm:p-6 lg:p-8">
            <div className="grid gap-2 sm:grid-cols-4 sm:gap-3">
              {stepMeta.map((item) => {
                const active = step === item.id;
                const done = step > item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === 1) setStep(1);
                      if (item.id === 2 && detailsValid) setStep(2);
                      if (item.id === 3 && detailsValid && deliveryAddressValid)
                        setStep(3);
                      if (
                        item.id === 4 &&
                        detailsValid &&
                        deliveryAddressValid &&
                        scheduleValid
                      ) {
                        setStep(4);
                      }
                    }}
                    className={[
                      "rounded-2xl border px-3 py-3 text-left transition sm:px-4",
                      active
                        ? "border-brand-ink bg-brand-ink text-brand-bg shadow-sm"
                        : done
                          ? "border-brand-ink/20 bg-brand-bg text-brand-ink"
                          : "border-black/10 bg-white/55 text-brand-ink/55 hover:bg-white/80",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          "grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold",
                          active
                            ? "bg-brand-bg/15 text-brand-bg"
                            : done
                              ? "bg-brand-ink text-brand-bg"
                              : "bg-brand-bg text-brand-ink/45",
                        ].join(" ")}
                      >
                        {done ? "✓" : item.id}
                      </span>

                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {item.label}
                        </span>
                        <span
                          className={[
                            "mt-0.5 hidden text-xs sm:block",
                            active ? "text-brand-bg/70" : "text-brand-ink/50",
                          ].join(" ")}
                        >
                          {item.helper}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {submitError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:mt-5">
                {submitError}
              </div>
            )}

            <div className="mt-6">
              {step === 1 && (
                <div className="space-y-5">
                  <StepHeader
                    eyebrow="Step 1"
                    title="Sender and receiver details"
                    description="Start with your contact details. Add receiver details only when this order is for another person or a gift."
                  />

                  {isLoadingUser && (
                    <InfoBox tone="neutral">
                      Checking saved account details...
                    </InfoBox>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Sender name">
                      <input
                        value={form.senderName}
                        onChange={(e) =>
                          updateForm("senderName", e.target.value)
                        }
                        className="input-order"
                        placeholder="Your name"
                        autoComplete="name"
                      />
                    </Field>

                    <Field label="Sender contact number">
                      <input
                        value={form.senderContactNumber}
                        onChange={(e) =>
                          updateForm("senderContactNumber", e.target.value)
                        }
                        className="input-order"
                        placeholder="07X XXX XXXX"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </Field>
                  </div>

                  <Field label="Sender email">
                    <input
                      value={form.senderEmail}
                      onChange={(e) =>
                        updateForm("senderEmail", e.target.value)
                      }
                      className="input-order"
                      placeholder="Required for receipt and order updates"
                      type="email"
                      autoComplete="email"
                    />
                  </Field>

                  {isCheckingEmail && (
                    <p className="text-xs font-medium text-brand-ink/50">
                      Checking customer account...
                    </p>
                  )}

                  {isExistingCustomerEmail && !dismissLoginPrompt && (
                    <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                      <p className="font-semibold">
                        This email already has a Baura Bakers account.
                      </p>

                      <p className="mt-1 leading-relaxed">
                        Login to continue faster, keep this order in your order
                        history, and receive future offers.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          to="/login"
                          className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-semibold text-white"
                        >
                          Login and continue
                        </Link>

                        <button
                          type="button"
                          onClick={() => setDismissLoginPrompt(true)}
                          className="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700"
                        >
                          Continue as guest
                        </button>
                      </div>
                    </div>
                  )}

                  <Field label="Sender address">
                    <textarea
                      value={form.senderAddress}
                      onChange={(e) =>
                        updateForm("senderAddress", e.target.value)
                      }
                      className="input-order min-h-[95px]"
                      placeholder="Your full address"
                    />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ToggleCard
                      active={form.hasDifferentReceiver}
                      title="Different receiver"
                      description="Send this order to another person."
                      onClick={() =>
                        toggleDifferentReceiver(!form.hasDifferentReceiver)
                      }
                    />

                    <ToggleCard
                      active={form.isGift}
                      title="This is a gift"
                      description="Receiver details will be required."
                      onClick={() => toggleGift(!form.isGift)}
                    />
                  </div>

                  {needsReceiver && (
                    <div className="rounded-3xl border border-black/10 bg-brand-bg/70 p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-brand-ink">
                            Receiver details
                          </h3>

                          <p className="mt-1 text-sm text-brand-ink/65">
                            Add the person who will receive the order.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={copySenderToReceiver}
                          className="w-fit rounded-2xl border border-brand-ink/20 bg-white/60 px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-white/80"
                        >
                          Same as sender
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="Receiver name">
                          <input
                            value={form.receiverName}
                            onChange={(e) =>
                              updateForm("receiverName", e.target.value)
                            }
                            className="input-order"
                            placeholder="Receiver name"
                          />
                        </Field>

                        <Field label="Receiver contact number">
                          <input
                            value={form.receiverContactNumber}
                            onChange={(e) =>
                              updateForm(
                                "receiverContactNumber",
                                e.target.value,
                              )
                            }
                            className="input-order"
                            placeholder="07X XXX XXXX"
                            inputMode="tel"
                          />
                        </Field>
                      </div>

                      <div className="mt-4">
                        <Field label="Receiver address">
                          <textarea
                            value={form.receiverAddress}
                            onChange={(e) =>
                              updateForm("receiverAddress", e.target.value)
                            }
                            className="input-order min-h-[95px]"
                            placeholder="Receiver delivery address"
                          />
                        </Field>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <StepHeader
                    eyebrow="Step 2"
                    title="Delivery address and map pin"
                    description="Choose the final delivery address and add an exact Google Maps location. This helps calculate the delivery fee correctly."
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ToggleCard
                      active={form.deliveryTarget === "SENDER"}
                      title="Deliver to sender"
                      description="Use the sender address for delivery."
                      onClick={() => updateForm("deliveryTarget", "SENDER")}
                    />

                    <ToggleCard
                      active={form.deliveryTarget === "RECEIVER"}
                      disabled={!needsReceiver}
                      title="Deliver to receiver"
                      description={
                        needsReceiver
                          ? "Use the receiver address for delivery."
                          : "Enable receiver details in step 1 first."
                      }
                      onClick={() => {
                        if (needsReceiver) {
                          updateForm("deliveryTarget", "RECEIVER");
                        }
                      }}
                    />
                  </div>

                  <div className="rounded-3xl border border-black/10 bg-white/55 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                          SELECTED DELIVERY ADDRESS
                        </p>

                        <p className="mt-2 text-sm leading-6 text-brand-ink/75">
                          {effectiveDelivery.address || "No address added yet."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => useCurrentLocation(form.deliveryTarget)}
                        disabled={isLocating}
                        className={[
                          "rounded-2xl px-4 py-2.5 text-xs font-semibold",
                          isLocating
                            ? "cursor-not-allowed bg-brand-ink/40 text-brand-bg"
                            : "bg-brand-ink text-brand-bg hover:bg-brand-ink/95",
                        ].join(" ")}
                      >
                        {isLocating ? "Getting location..." : "Use my location"}
                      </button>
                    </div>

                    <div className="mt-5">
                      <Field label="Google Maps location link">
                        <input
                          value={currentLocationUrl}
                          onChange={(e) => updateLocationUrl(e.target.value)}
                          className="input-order"
                          placeholder="Paste Google Maps link or use current location"
                        />
                      </Field>
                    </div>

                    {deliveryLocationCoords ? (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white">
                        <iframe
                          title="Delivery location map"
                          className="h-52 w-full sm:h-64"
                          loading="lazy"
                          src={currentMapUrl}
                        />
                      </div>
                    ) : (
                      <InfoBox tone="warning" className="mt-4">
                        Add a valid Google Maps link or use current location to
                        calculate delivery.
                      </InfoBox>
                    )}
                  </div>

                  <Field label="Delivery note optional">
                    <textarea
                      value={form.note}
                      onChange={(e) => updateForm("note", e.target.value)}
                      className="input-order min-h-[85px]"
                      placeholder="Landmarks, gift message, special instructions..."
                    />
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <StepHeader
                    eyebrow="Step 3"
                    title="Select delivery session"
                    description="Choose an available delivery session. Delivery fee is calculated from Baura Bakers to your pinned location."
                  />

                  <div className="rounded-3xl border border-black/10 bg-white/55 p-4 sm:p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                          AVAILABLE DELIVERY DAYS
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-brand-ink/60">
                          Select a delivery day first, then choose an available
                          time slot. Past slots are hidden automatically.
                        </p>
                      </div>

                      <span className="w-fit rounded-2xl border border-brand-ink/10 bg-brand-bg/70 px-3 py-2 text-xs font-semibold text-brand-ink/70">
                        Next 4 working days
                      </span>
                    </div>

                    {isLoadingSlots ? (
                      <InfoBox tone="neutral" className="mt-4">
                        Loading available delivery sessions...
                      </InfoBox>
                    ) : deliveryCalendarDays.length ? (
                      <>
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {deliveryCalendarDays.map((day) => {
                            const active = selectedDeliveryDate === day.date;
                            const selectedSlotInDay = day.slots.some(
                              (slot) => slot.id === selectedDeliverySlotId,
                            );

                            return (
                              <button
                                key={day.date}
                                type="button"
                                onClick={() => {
                                  setSelectedDeliveryDate(day.date);
                                  setSelectedDeliverySlotId("");
                                }}
                                className={[
                                  "rounded-2xl border p-3 text-left transition",
                                  active
                                    ? "border-brand-ink bg-brand-ink text-brand-bg shadow-sm"
                                    : selectedSlotInDay
                                      ? "border-brand-ink/25 bg-brand-bg text-brand-ink"
                                      : "border-black/10 bg-white/70 text-brand-ink hover:border-brand-ink/25 hover:bg-white",
                                ].join(" ")}
                              >
                                <span
                                  className={[
                                    "block text-[10px] font-semibold uppercase tracking-widest",
                                    active
                                      ? "text-brand-bg/65"
                                      : "text-brand-ink/45",
                                  ].join(" ")}
                                >
                                  {formatCalendarMonth(day.date)}
                                </span>

                                <span className="mt-1 block text-2xl font-bold leading-none">
                                  {formatCalendarDayNumber(day.date)}
                                </span>

                                <span
                                  className={[
                                    "mt-2 block text-xs font-semibold",
                                    active
                                      ? "text-brand-bg/80"
                                      : "text-brand-ink/65",
                                  ].join(" ")}
                                >
                                  {formatCalendarDate(day.date)}
                                </span>

                                <span
                                  className={[
                                    "mt-1 block text-[11px]",
                                    active
                                      ? "text-brand-bg/60"
                                      : "text-brand-ink/45",
                                  ].join(" ")}
                                >
                                  {day.slots.length} slot
                                  {day.slots.length === 1 ? "" : "s"}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-5 rounded-3xl border border-black/10 bg-brand-bg/55 p-4">
                          <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                            TIME SLOTS
                          </p>

                          <p className="mt-1 text-sm font-semibold text-brand-ink">
                            {selectedDeliveryDate
                              ? formatCalendarDate(selectedDeliveryDate)
                              : "Select a day"}
                          </p>

                          {selectedDateSlots.length ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              {selectedDateSlots.map((slot) => {
                                const active =
                                  selectedDeliverySlotId === slot.id;

                                return (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() =>
                                      setSelectedDeliverySlotId(slot.id)
                                    }
                                    className={[
                                      "rounded-2xl border p-4 text-left transition",
                                      active
                                        ? "border-brand-ink bg-brand-ink text-brand-bg"
                                        : "border-black/10 bg-white/75 text-brand-ink hover:border-brand-ink/25 hover:bg-white",
                                    ].join(" ")}
                                  >
                                    <div className="flex items-start gap-3">
                                      <span
                                        className={[
                                          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border text-[11px] font-bold",
                                          active
                                            ? "border-brand-bg/45 bg-brand-bg text-brand-ink"
                                            : "border-brand-ink/20 bg-white/70 text-transparent",
                                        ].join(" ")}
                                      >
                                        ✓
                                      </span>

                                      <span>
                                        <span className="block text-sm font-semibold">
                                          {slot.slot_label}
                                        </span>

                                        <span
                                          className={[
                                            "mt-1 block text-xs leading-5",
                                            active
                                              ? "text-brand-bg/75"
                                              : "text-brand-ink/60",
                                          ].join(" ")}
                                        >
                                          {slot.start_time.slice(0, 5)} –{" "}
                                          {slot.end_time.slice(0, 5)} · Max{" "}
                                          {slot.max_orders} orders
                                        </span>
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <InfoBox tone="warning" className="mt-4">
                              No time slots are available for this day.
                            </InfoBox>
                          )}
                        </div>
                      </>
                    ) : (
                      <InfoBox tone="warning" className="mt-4">
                        No delivery sessions are available for the next 4
                        working days. Please contact Baura Bakers before placing
                        this order.
                      </InfoBox>
                    )}
                  </div>

                  {selectedDeliverySlot && (
                    <InfoBox tone="success">
                      <span className="font-semibold">
                        Delivery session selected:
                      </span>{" "}
                      {formatSlot(selectedDeliverySlot)}
                    </InfoBox>
                  )}

                  <div className="rounded-3xl border border-black/10 bg-white/55 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                          REGULAR DELIVERY FEE
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-brand-ink/60">
                          We use one regular delivery table. Distance is rounded
                          up to the next kilometre.
                        </p>
                      </div>

                      {isCalculatingDistance && (
                        <span className="w-fit rounded-2xl border border-black/10 bg-brand-bg/70 px-3 py-2 text-xs font-semibold text-brand-ink/65">
                          Calculating...
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-brand-ink/75 sm:grid-cols-3">
                      <SummaryLine
                        label="Road distance"
                        value={roadDistanceKm ? `${roadDistanceKm}km` : "-"}
                      />

                      <SummaryLine
                        label="Pricing row"
                        value={
                          pricingDistanceKm ? `${pricingDistanceKm}km` : "-"
                        }
                      />

                      <SummaryLine
                        label="Delivery fee"
                        value={
                          deliveryFeeLkr > 0 ? formatLkr(deliveryFeeLkr) : "-"
                        }
                      />
                    </div>

                    <div className="mt-3 rounded-2xl border border-black/10 bg-brand-bg/70 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-brand-ink">
                          Final total
                        </p>
                        <p className="text-lg font-bold text-brand-ink">
                          {formatLkr(finalTotalLkr)}
                        </p>
                      </div>
                    </div>

                    {distanceNotice && (
                      <InfoBox tone="warning" className="mt-4">
                        {distanceNotice}
                      </InfoBox>
                    )}

                    {isLoadingDeliveryPricing && (
                      <InfoBox tone="neutral" className="mt-4">
                        Loading delivery pricing...
                      </InfoBox>
                    )}

                    {pricingDistanceKm && !selectedDistancePrice && (
                      <InfoBox tone="warning" className="mt-4">
                        Delivery price is not configured for this distance and
                        vehicle type. Please contact Baura Bakers before placing
                        this order.
                      </InfoBox>
                    )}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <StepHeader
                    eyebrow="Step 4"
                    title="Confirm and send order"
                    description="Review the order summary, save it securely in MySQL, then open WhatsApp with all order details for confirmation."
                  />

                  <div className="rounded-3xl border border-black/10 bg-brand-bg/75 p-4 sm:p-5">
                    <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                      ORDER ID
                    </p>

                    <p className="mt-1 text-lg font-semibold text-brand-ink">
                      {orderId}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm text-brand-ink/75 sm:grid-cols-2">
                      <SummaryLine label="Sender" value={form.senderName} />

                      {needsReceiver && (
                        <SummaryLine
                          label="Receiver"
                          value={form.receiverName}
                        />
                      )}

                      <SummaryLine
                        label="Gift"
                        value={form.isGift ? "Yes" : "No"}
                      />

                      <SummaryLine
                        label="Deliver to"
                        value={
                          form.deliveryTarget === "RECEIVER"
                            ? "Receiver address"
                            : "Sender address"
                        }
                      />

                      <SummaryLine
                        label="Delivery address"
                        value={effectiveDelivery.address || "-"}
                      />

                      <SummaryLine
                        label="Delivery schedule"
                        value={formatSlot(selectedDeliverySlot)}
                      />

                      <SummaryLine
                        label="Road distance"
                        value={roadDistanceKm ? `${roadDistanceKm}km` : "-"}
                      />

                      <SummaryLine
                        label="Delivery fee"
                        value={formatLkr(deliveryFeeLkr)}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-black/10 bg-white/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-bold text-brand-ink">
                          Final total
                        </p>
                        <p className="text-xl font-bold text-brand-ink">
                          {formatLkr(finalTotalLkr)}
                        </p>
                      </div>
                    </div>

                    <InfoBox tone="neutral" className="mt-4">
                      Your order is saved in MySQL before WhatsApp opens.
                      Baura Bakers will confirm availability, delivery, and bank
                      transfer details through WhatsApp.
                    </InfoBox>
                  </div>

                  <button
                    type="button"
                    onClick={bankTransferViaWhatsApp}
                    disabled={isSubmitting || !items.length}
                    className={[
                      "w-full rounded-2xl border px-5 py-4 text-sm font-semibold",
                      isSubmitting || !items.length
                        ? "cursor-not-allowed border-brand-ink/10 bg-black/5 text-brand-ink/40"
                        : "border-brand-ink/25 bg-brand-ink text-brand-bg hover:bg-brand-ink/95",
                    ].join(" ")}
                  >
                    {isSubmitting
                      ? "Saving order..."
                      : "Place order & open WhatsApp"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/cart")}
                    className="w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
                  >
                    Cancel and return to cart
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-black/10 pt-4 sm:mt-8 sm:pt-5">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1}
                className={[
                  "rounded-2xl border px-4 py-3 text-sm font-semibold sm:px-5",
                  step === 1
                    ? "cursor-not-allowed border-black/10 text-brand-ink/30"
                    : "border-brand-ink/25 text-brand-ink hover:bg-black/5",
                ].join(" ")}
              >
                Back
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canGoNext}
                  className={[
                    "rounded-2xl px-5 py-3 text-sm font-semibold text-brand-bg",
                    canGoNext
                      ? "bg-brand-ink hover:bg-brand-ink/95"
                      : "cursor-not-allowed bg-brand-ink/40",
                  ].join(" ")}
                >
                  Continue
                </button>
              ) : (
                <Link
                  to="/cart"
                  className="rounded-2xl border border-brand-ink/25 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-black/5"
                >
                  Edit cart
                </Link>
              )}
            </div>
          </section>

          <aside className="h-fit rounded-[2rem] border border-black/10 bg-white/60 p-4 shadow-sm backdrop-blur sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold tracking-widest text-brand-ink/60 sm:text-xs">
                ORDER SUMMARY
              </p>

              <Link
                to="/cart"
                className="rounded-xl border border-brand-ink/15 bg-white/45 px-3 py-2 text-xs font-semibold text-brand-ink/80 hover:bg-white/60"
              >
                Edit cart
              </Link>
            </div>

            {items.length ? (
              <div className="mt-4 max-h-[340px] space-y-2.5 overflow-y-auto pr-1 sm:space-y-3">
                {items.map((it) => (
                  <div
                    key={`${it.productSlug}-${it.size.id}-${it.sugar}`}
                    className="rounded-2xl border border-black/10 bg-white/60 p-3 sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-ink">
                          {it.productName}
                        </p>

                        <p className="mt-1 text-xs text-brand-ink/65">
                          {it.size.label} • Sugar: {it.sugar} • Qty:{" "}
                          {it.quantity}
                        </p>
                      </div>

                      <p className="shrink-0 text-xs font-semibold text-brand-ink/75">
                        {formatLkr(it.unitPriceLkr * it.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <InfoBox tone="neutral" className="mt-4">
                Your cart is empty. Please add products before checkout.
              </InfoBox>
            )}

            <div className="mt-4 space-y-2 rounded-2xl border border-black/10 bg-brand-bg/75 px-4 py-3">
              <PriceRow label="Subtotal" value={formatLkr(totalLkr)} />
              <PriceRow
                label="Delivery"
                value={deliveryFeeLkr > 0 ? formatLkr(deliveryFeeLkr) : "-"}
              />

              <div className="border-t border-black/10 pt-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-bold text-brand-ink">
                    Final total
                  </p>
                  <p className="text-base font-bold text-brand-ink">
                    {formatLkr(finalTotalLkr)}
                  </p>
                </div>
              </div>
            </div>

            {selectedDeliverySlot && (
              <div className="mt-4 rounded-2xl border border-black/10 bg-white/55 p-3.5 text-xs leading-relaxed text-brand-ink/65 sm:mt-5 sm:p-4">
                <p className="font-semibold text-brand-ink">
                  Delivery schedule
                </p>
                <p className="mt-1">{formatSlot(selectedDeliverySlot)}</p>
              </div>
            )}

            {roadDistanceKm && (
              <div className="mt-4 rounded-2xl border border-black/10 bg-white/55 p-3.5 text-xs leading-relaxed text-brand-ink/65 sm:mt-5 sm:p-4">
                <p className="font-semibold text-brand-ink">
                  Delivery distance
                </p>
                <p className="mt-1">
                  {roadDistanceKm}km road distance ·{" "}
                  {pricingDistanceKm
                    ? `${pricingDistanceKm}km pricing row`
                    : ""}
                </p>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-black/10 bg-white/55 p-3.5 text-xs leading-relaxed text-brand-ink/65 sm:mt-5 sm:p-4">
              Your cart will clear only after your order is saved successfully.
            </div>
          </aside>
        </div>
      </div>
    </Page>
  );
}

function StepHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-ink/45">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-ink sm:text-2xl">
        {title}
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/65">
        {description}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-ink/60 sm:text-xs">
        {label}
      </label>

      {children}
    </div>
  );
}

function ToggleCard({
  active,
  title,
  description,
  disabled = false,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-2xl border p-4 text-left transition",
        disabled
          ? "cursor-not-allowed border-black/10 bg-black/5 text-brand-ink/35"
          : active
            ? "border-brand-ink bg-brand-ink text-brand-bg"
            : "border-black/10 bg-white/60 text-brand-ink hover:border-brand-ink/25 hover:bg-white/80",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-bold",
            active
              ? "border-brand-bg/45 bg-brand-bg text-brand-ink"
              : "border-brand-ink/20 bg-white/70 text-transparent",
          ].join(" ")}
        >
          ✓
        </span>

        <span>
          <span className="block text-sm font-semibold">{title}</span>

          <span
            className={[
              "mt-1 block text-xs leading-5",
              active ? "text-brand-bg/75" : "text-brand-ink/55",
            ].join(" ")}
          >
            {description}
          </span>
        </span>
      </div>
    </button>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/55 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-ink/45">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-brand-ink">
        {value || "-"}
      </p>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-brand-ink">{label}</p>
      <p className="text-sm font-semibold text-brand-ink">{value}</p>
    </div>
  );
}

function InfoBox({
  children,
  tone,
  className = "",
}: {
  children: ReactNode;
  tone: "neutral" | "success" | "warning";
  className?: string;
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : tone === "warning"
        ? "border-yellow-200 bg-yellow-50 text-yellow-800"
        : "border-black/10 bg-white/60 text-brand-ink/65";

  return (
    <div
      className={[
        "rounded-2xl border px-4 py-3 text-sm leading-relaxed",
        toneClass,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}