/** @format */

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gift,
  LocateFixed,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
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
  type CheckoutDeliverySlot,
  type CheckoutPickupDay,
  type CheckoutQuote,
  type FulfillmentType,
} from "../lib/checkoutApi";

const WHATSAPP_NUMBER = "94769878770";
const DELIVERY_METHOD = "Regular Baura delivery arrangement";
const COURIER_LOGOS = {
  PICKME_FLASH: "/checkout-partners/pickme-logo.webp",
  UBER_PARCEL: "/checkout-partners/uber-icon.webp",
} as const;
type CourierProvider = keyof typeof COURIER_LOGOS;
const COURIER_LABELS: Record<CourierProvider, string> = {
  PICKME_FLASH: "PickMe Flash",
  UBER_PARCEL: "Uber Parcel",
};
function CourierBrand({ provider, compact = false }: { provider: CourierProvider; compact?: boolean }) {
  return <span className="inline-flex min-w-0 items-center gap-2">
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-lg border border-brand-ink/10 bg-white ${compact ? "h-6 w-6 sm:h-7 sm:w-7" : "h-8 w-8 sm:h-10 sm:w-10"}`}>
      <img src={COURIER_LOGOS[provider]} alt="" className="h-full w-full object-contain p-1" />
    </span>
    <span className="text-[10px] font-semibold sm:text-xs">{COURIER_LABELS[provider]}</span>
  </span>;
}

type StepNo = 1 | 2 | 3 | 4;

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

type FieldErrors = Partial<
  Record<
    | "senderName"
    | "senderEmail"
    | "senderContactNumber"
    | "senderAddress"
    | "receiverName"
    | "receiverContactNumber"
    | "receiverAddress"
    | "deliveryLocation"
    | "deliverySlot"
    | "pickupDate"
    | "pickupTime",
    string
  >
>;

function makeOrderId() {
  const value = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BB-${value}`;
}

function onlyDigitsPhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function isValidSriLankanMobile(value: string): boolean {
  const clean = value.replace(/[\s()-]/g, "");
  return /^(?:07\d{8}|\+947\d{8}|947\d{8})$/.test(clean);
}

function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function formatSlot(slot: CheckoutDeliverySlot | null) {
  if (!slot) return "-";

  return `${formatCalendarDate(slot.slot_date)} • ${slot.slot_label} • ${slot.start_time.slice(
    0,
    5,
  )} – ${slot.end_time.slice(0, 5)}`;
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

function extractLatLngFromGoogleMapsUrl(url: string) {
  const clean = url.trim();

  const qMatch = clean.match(/[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);

  if (qMatch) {
    return {
      lat: Number(qMatch[1]),
      lng: Number(qMatch[2]),
    };
  }

  const atMatch = clean.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);

  if (atMatch) {
    return {
      lat: Number(atMatch[1]),
      lng: Number(atMatch[2]),
    };
  }

  return null;
}

function stepTitle(step: StepNo, isPickup: boolean) {
  if (step === 1) return "Customer details";
  if (step === 2) return "Receive your order";
  if (step === 3) return isPickup ? "Collection schedule" : "Delivery schedule";
  return "Review order";
}

export default function Order() {
  const { items, clear } = useCart();

  const [step, setStep] = useState<StepNo>(1);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("PICKUP");
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [pickupCalendar, setPickupCalendar] = useState<CheckoutPickupDay[]>([]);
  const [pickupPreviewDays, setPickupPreviewDays] = useState(14);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupStartTime, setPickupStartTime] = useState("");
  const pickupEndTime = pickupStartTime ? addTenMinutes(pickupStartTime) : "";
  const isPickup = fulfillmentType === "PICKUP";
  const stepTopRef = useRef<HTMLDivElement | null>(null);
  const hasMountedStepScroll = useRef(false);

  const [orderId] = useState(() => makeOrderId());

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [errorFocusRequest, setErrorFocusRequest] = useState(0);

  function requestErrorFocus() {
    setErrorFocusRequest((current) => current + 1);
  }

  const [savedOrderNo, setSavedOrderNo] = useState<string | null>(null);
  const [completedTrackingUrl, setCompletedTrackingUrl] = useState("");
  const [completedWhatsappUrl, setCompletedWhatsappUrl] = useState("");
  const [courierArrangement, setCourierArrangement] = useState<"SELF_PICKUP" | "CUSTOMER_COURIER" | "BAKERY_ASSISTED_COURIER">("SELF_PICKUP");
  const [courierProvider, setCourierProvider] = useState<CourierProvider | null>(null);
  const [successDetailsVisible, setSuccessDetailsVisible] = useState(false);
  const [successSheetOpen, setSuccessSheetOpen] = useState(true);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<{ subtotal: number; deliveryFee: number; total: number; itemCount: number } | null>(null);

  useEffect(() => {
    if (!savedOrderNo || !successSheetOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSuccessSheetOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [savedOrderNo, successSheetOpen]);

  const savedOrderRef = useRef<Awaited<
    ReturnType<typeof createGuestOrder>
  > | null>(null);

  const saveOrderPromiseRef = useRef<Promise<
    Awaited<ReturnType<typeof createGuestOrder>>
  > | null>(null);

  const [deliverySlots, setDeliverySlots] = useState<CheckoutDeliverySlot[]>(
    [],
  );

  const [selectedDeliverySlotId, setSelectedDeliverySlotId] = useState("");

  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState("");

  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  const [maxDeliveryDistanceKm, setMaxDeliveryDistanceKm] = useState<
    number | null
  >(null);

  const [isExistingCustomerEmail, setIsExistingCustomerEmail] = useState(false);

  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const [dismissLoginPrompt, setDismissLoginPrompt] = useState(false);

  const [checkoutQuote, setCheckoutQuote] = useState<CheckoutQuote | null>(
    null,
  );

  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const [distanceNotice, setDistanceNotice] = useState("");

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

  const totalLkr = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.unitPriceLkr * item.quantity,
      0,
    );
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const needsReceiver = !isPickup && (form.hasDifferentReceiver || form.isGift);

  const selectedDeliverySlot = useMemo(() => {
    return (
      deliverySlots.find((slot) => slot.id === selectedDeliverySlotId) || null
    );
  }, [deliverySlots, selectedDeliverySlotId]);

  const deliveryCalendarDays = useMemo(() => {
    const grouped = new Map<string, CheckoutDeliverySlot[]>();

    for (const slot of deliverySlots) {
      const current = grouped.get(slot.slot_date) || [];

      current.push(slot);
      grouped.set(slot.slot_date, current);
    }

    return Array.from(grouped.entries()).map(([date, slots]) => ({
      date,
      slots: [...slots].sort((a, b) =>
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

  const detailsValid = useMemo(() => {
    const senderValid =
      form.senderName.trim().length >= 2 &&
      isEmailLike(form.senderEmail) &&
      isValidSriLankanMobile(form.senderContactNumber) &&
      (isPickup || form.senderAddress.trim().length >= 5);

    if (!needsReceiver) {
      return senderValid;
    }

    const receiverValid =
      form.receiverName.trim().length >= 2 &&
      isValidSriLankanMobile(form.receiverContactNumber) &&
      form.receiverAddress.trim().length >= 5;

    return senderValid && receiverValid;
  }, [form, needsReceiver, isPickup]);

  const deliveryAddressValid =
    effectiveDelivery.address.trim().length >= 5 &&
    Boolean(deliveryLocationCoords);

  const deliveryFeeLkr = isPickup ? 0 : checkoutQuote?.delivery_fee_lkr || 0;
  const pickupToday = sriLankaToday();
  const pickupLastDate = pickupCalendar[pickupCalendar.length - 1]?.date || pickupToday;
  const selectedPickupDay = useMemo(
    () => pickupCalendar.find((day) => day.date === pickupDate) || null,
    [pickupCalendar, pickupDate],
  );
  const pickupTimeChoices = useMemo(
    () => selectedPickupDay ? pickupTimeOptions(selectedPickupDay) : [],
    [selectedPickupDay],
  );
  const pickupScheduleValid = Boolean(
    pickupEnabled &&
    selectedPickupDay?.isOpen &&
    pickupDate &&
    pickupStartTime &&
    pickupEndTime &&
    pickupDate >= pickupToday &&
    pickupDate <= pickupLastDate &&
    pickupTimeChoices.includes(pickupStartTime) &&
    new Date(`${pickupDate}T${pickupStartTime}:00+05:30`).getTime() > Date.now() &&
    pickupEndTime === addTenMinutes(pickupStartTime),
  );

  const finalTotalLkr = totalLkr + deliveryFeeLkr;

  const deliveryCostValid = Boolean(checkoutQuote);

  const scheduleValid = isPickup ? pickupScheduleValid : Boolean(selectedDeliverySlot) && deliveryCostValid;

  const currentLocationUrl =
    form.deliveryTarget === "RECEIVER"
      ? form.receiverLocationUrl
      : form.senderLocationUrl;

  const currentMapUrl = deliveryLocationCoords
    ? `https://www.google.com/maps?q=${deliveryLocationCoords.lat},${deliveryLocationCoords.lng}&z=16&output=embed`
    : "";

  const courierLabel = courierArrangement === "SELF_PICKUP"
    ? "I'll collect in person"
    : courierArrangement === "CUSTOMER_COURIER"
      ? `My courier · ${courierProvider ? COURIER_LABELS[courierProvider] : "Not selected"}`
      : `Baura-assisted courier · ${courierProvider ? COURIER_LABELS[courierProvider] : "Not selected"}`;
  const courierValid = !isPickup || courierArrangement === "SELF_PICKUP" || Boolean(courierProvider);

  const cartLines = useMemo(() => {
    return items.map((item, index) => {
      const lineTotal = item.unitPriceLkr * item.quantity;

      return `${index + 1}. ${item.productName} • ${
        item.size.label
      } • Sugar: ${item.sugar} • Qty: ${
        item.quantity
      } • ${formatLkr(lineTotal)}`;
    });
  }, [items]);

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
    if (errorFocusRequest === 0) return;

    const frame = window.requestAnimationFrame(() => {
      const container = stepTopRef.current;

      if (!container) return;

      const errorContainer = container.querySelector<HTMLElement>(
        '[data-checkout-error="true"]',
      );

      if (!errorContainer) return;

      const field = errorContainer.querySelector<HTMLElement>(
        "input, textarea, select, button",
      );

      const target = field || errorContainer;

      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      target.focus({
        preventScroll: true,
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [errorFocusRequest, step]);

  useEffect(() => {
    async function loadLoggedInUserDetails() {
      try {
        setIsLoadingUser(true);

        const user = await getAuthenticatedUser();

        if (!user) return;

        setForm((previous) => ({
          ...previous,
          senderName: previous.senderName || user.name || "",
          senderEmail: previous.senderEmail || user.email || "",
          senderContactNumber: previous.senderContactNumber || user.phone || "",
          senderAddress:
            previous.senderAddress || user.default_delivery_address || "",
        }));
      } catch {
        setSubmitError(
          "We couldn't load your saved account details. You can still enter them below.",
        );
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

        setMaxDeliveryDistanceKm(checkout.max_delivery_distance_km);
        setDeliveryEnabled(checkout.delivery_enabled === true);
        setPickupEnabled(checkout.pickup_enabled === true);
        const erpDays = checkout.pickup_calendar || [];
        setPickupCalendar(erpDays);
        setPickupDate((current) =>
          erpDays.some((day) => day.date === current && day.isOpen) ? current : "",
        );
        setPickupStartTime("");
        setPickupPreviewDays(Math.max(1, checkout.pickup_preview_days || 14));
        setFulfillmentType((current) => {
          if (current === "DELIVERY" && !checkout.delivery_enabled) return "PICKUP";
          if (current === "PICKUP" && !checkout.pickup_enabled && checkout.delivery_enabled) return "DELIVERY";
          return current;
        });
        setCheckoutReady(true);

        const availableSlots = checkout.slots
          .filter((slot) => slot.is_available && slot.remaining_orders > 0)
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
        setCheckoutReady(false);
        setPickupEnabled(false);
        setPickupCalendar([]);
        setPickupDate("");
        setPickupStartTime("");
        setDeliverySlots([]);

        setSubmitError(
          error instanceof Error
            ? error.message
            : "We couldn't load the available delivery times.",
        );
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

      try {
        const user = await getAuthenticatedUser();

        if (!active) return;

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
      } catch {
        if (!active) return;

        setIsExistingCustomerEmail(false);
      } finally {
        if (active) {
          setIsCheckingEmail(false);
        }
      }
    }

    const timer = window.setTimeout(checkEmail, 600);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [form.senderEmail]);

  useEffect(() => {
    let ignore = false;

    async function calculateDeliveryQuote() {
      if (isPickup || !deliveryEnabled || !deliveryLocationCoords || totalQuantity < 1) {
        setCheckoutQuote(null);
        setDistanceNotice("");
        setIsCalculatingDistance(false);
        return;
      }

      try {
        setIsCalculatingDistance(true);
        setDistanceNotice("");

        const quote = await getCheckoutQuote({
          lat: deliveryLocationCoords.lat,
          lng: deliveryLocationCoords.lng,
          totalQuantity,
        });

        if (ignore) return;

        setCheckoutQuote(quote);

        if (quote.distance_source === "ESTIMATED") {
          setDistanceNotice(
            "The delivery distance is currently estimated. Your fee is still calculated by Baura Bakers.",
          );
        }
      } catch (error) {
        if (ignore) return;

        setCheckoutQuote(null);

        setDistanceNotice(
          error instanceof Error
            ? error.message
            : "We couldn't calculate delivery for this location.",
        );
      } finally {
        if (!ignore) {
          setIsCalculatingDistance(false);
        }
      }
    }

    void calculateDeliveryQuote();

    return () => {
      ignore = true;
    };
  }, [deliveryLocationCoords, totalQuantity, isPickup, deliveryEnabled]);

  const whatsappMessage = useMemo(() => {
    const senderPhone = onlyDigitsPhone(form.senderContactNumber);

    const receiverPhone = onlyDigitsPhone(form.receiverContactNumber);

    const locationUrl =
      effectiveDelivery.locationUrl ||
      (deliveryLocationCoords
        ? `https://www.google.com/maps?q=${deliveryLocationCoords.lat},${deliveryLocationCoords.lng}`
        : "");

    return [
      "🧁 *Baura Bakers — Order Confirmation*",
      `🆔 *Order ID:* ${orderId}`,
      "",
      "👤 *Sender Details*",
      `Name: ${form.senderName || "-"}`,
      `Email: ${form.senderEmail || "-"}`,
      `Contact: ${senderPhone || "-"}`,
      `Address: ${form.senderAddress || "-"}`,
      "",
      needsReceiver
        ? [
            "🎁 *Receiver Details*",
            `Gift Order: ${form.isGift ? "Yes" : "No"}`,
            `Name: ${form.receiverName || "-"}`,
            `Contact: ${receiverPhone || "-"}`,
            `Address: ${form.receiverAddress || "-"}`,
            "",
          ].join("\n")
        : "",
      isPickup ? "🏬 *Store Pickup*" : "🚚 *Delivery*",
      isPickup ? `Collection: ${pickupDate} at ${formatHour(pickupStartTime)}` : "",
      isPickup ? `Collection arrangement: ${courierLabel}` : "",
      isPickup && courierArrangement !== "SELF_PICKUP" ? "Courier charges are payable by the customer separately." : "",
      !isPickup ? `Deliver To: ${
        form.deliveryTarget === "RECEIVER" ? "Receiver" : "Sender"
      }` : "",
      !isPickup ? `Address: ${effectiveDelivery.address || "-"}` : "",
      !isPickup && locationUrl ? `Location: ${locationUrl}` : "",
      !isPickup && selectedDeliverySlot
        ? `Schedule: ${formatSlot(selectedDeliverySlot)}`
        : "",
      form.note.trim() ? `Note: ${form.note.trim()}` : "",
      "",
      "🛍️ *Items*",
      cartLines.length ? cartLines.join("\n") : "(No items)",
      "",
      !isPickup && checkoutQuote ? `📍 *Distance:* ${checkoutQuote.distance_km}km` : "",
      isPickup ? "🏬 *Collection Fee:* FREE" : `🚚 *Delivery Fee:* ${formatLkr(deliveryFeeLkr)}`,
      `💰 *Order Total:* ${formatLkr(finalTotalLkr)}`,
      "",
      "🏦 *Payment:* Bank transfer / WhatsApp confirmation",
      "Please confirm the order and payment details.",
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
    checkoutQuote,
    deliveryLocationCoords,
    isPickup, pickupDate, pickupStartTime, pickupEndTime, courierArrangement, courierLabel,
  ]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSubmitError("");
  }

  function clearFieldError(key: keyof FieldErrors) {
    setFieldErrors((previous) => {
      if (!previous[key]) return previous;

      const next = { ...previous };
      delete next[key];

      return next;
    });
  }

  function toggleDifferentReceiver(value: boolean) {
    setForm((previous) => ({
      ...previous,
      hasDifferentReceiver: value,
      isGift: value ? previous.isGift : false,
      deliveryTarget: value ? previous.deliveryTarget : "SENDER",
    }));

    setSubmitError("");
  }

  function toggleGift(value: boolean) {
    setForm((previous) => ({
      ...previous,
      isGift: value,
      hasDifferentReceiver: value ? true : previous.hasDifferentReceiver,
      deliveryTarget: value ? "RECEIVER" : previous.deliveryTarget,
    }));

    setSubmitError("");
  }

  function validateDetails() {
    const errors: FieldErrors = {};

    if (form.senderName.trim().length < 2) {
      errors.senderName = "Please enter your name.";
    }

    if (!isEmailLike(form.senderEmail)) {
      errors.senderEmail = "Enter a valid email address.";
    }

    if (!isValidSriLankanMobile(form.senderContactNumber)) {
      errors.senderContactNumber = "Enter a valid contact number.";
    }

    if (!isPickup && form.senderAddress.trim().length < 5) {
      errors.senderAddress = "Please enter your full address.";
    }

    if (needsReceiver) {
      if (form.receiverName.trim().length < 2) {
        errors.receiverName = "Please enter the receiver's name.";
      }

      if (!isValidSriLankanMobile(form.receiverContactNumber)) {
        errors.receiverContactNumber = "Enter a valid receiver contact number.";
      }

      if (form.receiverAddress.trim().length < 5) {
        errors.receiverAddress = "Please enter the receiver's address.";
      }
    }

    setFieldErrors(errors);

    const isValid = Object.keys(errors).length === 0;

    if (!isValid) {
      requestErrorFocus();
    }

    return isValid;
  }

  function validateDelivery() {
    if (isPickup) {
      if (!courierValid) {
        setSubmitError("Choose PickMe Flash or Uber Parcel for your courier arrangement.");
        return false;
      }
      return true;
    }
    if (effectiveDelivery.address.trim().length < 5) {
      setFieldErrors({
        deliveryLocation: "Add a complete delivery address before continuing.",
      });

      requestErrorFocus();
      return false;
    }

    if (!deliveryLocationCoords) {
      setFieldErrors({
        deliveryLocation:
          "Add an exact map location using your current location or a Google Maps coordinate link.",
      });

      requestErrorFocus();
      return false;
    }

    setFieldErrors({});

    return true;
  }

  function validateSchedule() {
    if (isPickup) {
      const errors: FieldErrors = {};
      if (!selectedPickupDay?.isOpen || pickupDate < pickupToday || pickupDate > pickupLastDate) {
        errors.pickupDate = "Choose an open collection date from the ERP calendar.";
      }
      if (!pickupScheduleValid) {
        errors.pickupTime = "Choose a future collection time within the hours for that date.";
      }
      setFieldErrors(errors);
      if (Object.keys(errors).length) requestErrorFocus();
      return Object.keys(errors).length === 0;
    }
    if (!selectedDeliverySlot) {
      setFieldErrors({
        deliverySlot: "Choose a delivery time before continuing.",
      });

      requestErrorFocus();
      return false;
    }

    if (!checkoutQuote) {
      setSubmitError(
        "Your delivery fee is not ready yet. Check the delivery location and try again.",
      );

      requestErrorFocus();
      return false;
    }

    setFieldErrors({});

    return true;
  }

  function goNext() {
    setSubmitError("");

    if (step === 1 && !validateDetails()) {
      return;
    }

    if (step === 2 && !checkoutReady) {
      setSubmitError("Loading collection and delivery availability. Please try again.");
      return;
    }
    if (step === 2 && !detailsValid) {
      setStep(1);
      validateDetails();
      return;
    }
    if (step === 2 && !validateDelivery()) {
      return;
    }

    if (step === 3 && !validateSchedule()) {
      return;
    }

    setStep((previous) => Math.min(previous + 1, 4) as StepNo);
  }

  function goBack() {
    setSubmitError("");
    setFieldErrors({});

    setStep((previous) => Math.max(previous - 1, 1) as StepNo);
  }

  function goToStep(target: StepNo) {
    if (target === step) return;

    if (target < step) {
      setSubmitError("");
      setFieldErrors({});
      setStep(target);
      return;
    }

    if (target >= 2 && !detailsValid) {
      setStep(1);
      validateDetails();
      return;
    }

    if (target >= 3 && !courierValid) {
      setStep(2);
      validateDelivery();
      return;
    }
    if (target >= 3 && !isPickup && !deliveryAddressValid) {
      setStep(2);
      validateDelivery();
      return;
    }

    if (target >= 4 && !scheduleValid) {
      setStep(3);
      validateSchedule();
      return;
    }

    setSubmitError("");
    setFieldErrors({});
    setStep(target);
  }

  function copySenderToReceiver() {
    setForm((previous) => ({
      ...previous,
      receiverName: previous.senderName,
      receiverContactNumber: previous.senderContactNumber,
      receiverAddress: previous.senderAddress,
      receiverLocationUrl: previous.senderLocationUrl,
      receiverLat: previous.senderLat,
      receiverLng: previous.senderLng,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      receiverName: undefined,
      receiverContactNumber: undefined,
      receiverAddress: undefined,
    }));
  }

  function useCurrentLocation(target: DeliveryTarget) {
    if (!navigator.geolocation) {
      setSubmitError(
        "Location sharing isn't supported by this browser. Please paste your Google Maps location instead.",
      );
      return;
    }

    setIsLocating(true);
    setSubmitError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(7));

        const lng = Number(position.coords.longitude.toFixed(7));

        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        setForm((previous) => {
          if (target === "RECEIVER") {
            return {
              ...previous,
              receiverLat: lat,
              receiverLng: lng,
              receiverLocationUrl: mapUrl,
            };
          }

          return {
            ...previous,
            senderLat: lat,
            senderLng: lng,
            senderLocationUrl: mapUrl,
          };
        });

        clearFieldError("deliveryLocation");
        setIsLocating(false);
      },
      () => {
        setSubmitError(
          "We couldn't get your current location. Allow location access or paste a Google Maps coordinate link.",
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
      setForm((previous) => ({
        ...previous,
        receiverLocationUrl: value,
        receiverLat: coords?.lat ?? null,
        receiverLng: coords?.lng ?? null,
      }));
    } else {
      setForm((previous) => ({
        ...previous,
        senderLocationUrl: value,
        senderLat: coords?.lat ?? null,
        senderLng: coords?.lng ?? null,
      }));
    }

    if (coords) {
      clearFieldError("deliveryLocation");
    }
  }

  async function saveOrderOnce(paymentMethod: string) {
    if (savedOrderRef.current) {
      return savedOrderRef.current;
    }

    if (saveOrderPromiseRef.current) {
      return saveOrderPromiseRef.current;
    }

    if (!checkoutReady) throw new Error("Checkout availability has not loaded. Please refresh and try again.");
    if (isPickup && !pickupEnabled) throw new Error("Store pickup is currently unavailable.");
    if (!isPickup && !deliveryEnabled) throw new Error("Delivery is currently unavailable.");
    if (isPickup && !pickupScheduleValid) throw new Error("Please choose an available pickup time.");
    if (!courierValid) throw new Error("Choose the courier service for your collection arrangement.");
    if (!isPickup && (!selectedDeliverySlot || !deliveryLocationCoords || !checkoutQuote)) {
      throw new Error("Please finish your delivery location, quote and schedule.");
    }
    const fallbackLocationUrl = deliveryLocationCoords
      ? `https://www.google.com/maps?q=${deliveryLocationCoords.lat},${deliveryLocationCoords.lng}`
      : "";

    const request = createGuestOrder({
      orderNo: orderId,
      fulfillmentType,
      pickupDate: isPickup ? pickupDate : undefined,
      pickupStartTime: isPickup ? pickupStartTime : undefined,
      pickupEndTime: isPickup ? pickupEndTime : undefined,
      collectionArrangement: isPickup ? courierArrangement : null,
      courierProvider: isPickup && courierArrangement !== "SELF_PICKUP" ? courierProvider : null,

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
      deliveryLocationUrl: isPickup ? "" : effectiveDelivery.locationUrl || fallbackLocationUrl,
      deliveryLat: isPickup ? null : deliveryLocationCoords?.lat,
      deliveryLng: isPickup ? null : deliveryLocationCoords?.lng,
      deliverySlotId: isPickup ? undefined : selectedDeliverySlot?.id,

      deliveryDate: selectedDeliverySlot?.slot_date,
      deliverySlotLabel: selectedDeliverySlot?.slot_label,
      deliverySlotStart: selectedDeliverySlot?.start_time,
      deliverySlotEnd: selectedDeliverySlot?.end_time,

      deliveryDistanceKm: isPickup ? null : checkoutQuote?.distance_km,
      deliveryVehicleType: isPickup ? null : checkoutQuote?.vehicle_type,
      deliveryFeeLkr,
      deliveryPricingMode: isPickup ? null : checkoutQuote?.pricing_mode,

      deliveryApp: DELIVERY_METHOD,
      paymentMethod,
      note: [
        isPickup ? `Collection arrangement: ${courierLabel}.` : "",
        isPickup && courierArrangement !== "SELF_PICKUP" ? `Courier service: ${courierProvider ? COURIER_LABELS[courierProvider] : "Not selected"}. Third-party courier fees are the customer's responsibility and are not included in the order total.` : "",
        form.note.trim(),
      ].filter(Boolean).join("\n"),
      items,
    })
      .then((savedOrder) => {
        savedOrderRef.current = savedOrder;
        setSavedOrderNo(savedOrder.orderNo);

        return savedOrder;
      })
      .finally(() => {
        saveOrderPromiseRef.current = null;
      });

    saveOrderPromiseRef.current = request;

    return request;
  }

  async function bankTransferViaWhatsApp() {
    if (isSubmitting || !items.length) {
      return;
    }

    if (!validateDetails()) {
      setStep(1);
      return;
    }

    if (!detailsValid) {
      setStep(1);
      validateDetails();
      return;
    }
    if (!isPickup && !validateDelivery()) {
      setStep(2);
      return;
    }

    if (!validateSchedule()) {
      setStep(3);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const savedOrder = await saveOrderOnce("BANK_TRANSFER_WHATSAPP");

      const savedOrderNoForTracking = savedOrder.orderNo;

      const trackingUrl = savedOrder.trackingToken
        ? `${window.location.origin}/track/${encodeURIComponent(
            savedOrderNoForTracking,
          )}?t=${encodeURIComponent(savedOrder.trackingToken)}`
        : `${window.location.origin}/track/${encodeURIComponent(
            savedOrderNoForTracking,
          )}`;

      localStorage.setItem(
        "baura_completed_bank_transfer_v1",
        JSON.stringify({
          orderNo: savedOrderNoForTracking,
          email: form.senderEmail.trim(),
          trackingUrl,
          savedAt: new Date().toISOString(),
        }),
      );

      const finalWhatsappMessage = [
        whatsappMessage,
        "",
        `🔎 *Track Order:* ${trackingUrl}`,
      ].join("\n");

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        finalWhatsappMessage,
      )}`;

      // Keep the receipt independent of cart state; clear() empties items immediately.
      setCompletedReceipt({ subtotal: totalLkr, deliveryFee: deliveryFeeLkr, total: finalTotalLkr, itemCount: totalQuantity });
      setCompletedTrackingUrl(trackingUrl);
      setCompletedWhatsappUrl(whatsappUrl);
      setSavedOrderNo(savedOrderNoForTracking);
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Bank transfer order failed:", error);

      const message = error instanceof Error ? error.message : "";
      setSubmitError(
        /items\.\d+\.sugar_level_id/.test(message)
          ? "One item has an unavailable sugar selection. Please return to your cart and select a valid option, or try again after the catalogue is updated."
          : message || "We couldn't save your order. Your cart is still safe — please try again.",
      );
      requestErrorFocus();

      setIsSubmitting(false);
    }
  }

  const canGoNext =
    step === 1
      ? detailsValid
      : step === 2
        ? (isPickup ? courierValid : deliveryAddressValid)
        : step === 3
          ? scheduleValid
          : true;

  const stepMeta: Array<{
    id: StepNo;
    label: string;
    icon: ReactNode;
  }> = [
    {
      id: 1,
      label: "Details",
      icon: <UserRound size={15} />,
    },
    {
      id: 2,
      label: "Method",
      icon: isPickup ? <Store size={15} /> : <MapPin size={15} />,
    },
    {
      id: 3,
      label: "Schedule",
      icon: <Clock3 size={15} />,
    },
    {
      id: 4,
      label: "Review",
      icon: <Check size={15} />,
    },
  ];

  if (savedOrderNo) {
    const trackPath = completedTrackingUrl
      ? new URL(completedTrackingUrl).pathname + new URL(completedTrackingUrl).search
      : `/track/${encodeURIComponent(savedOrderNo)}`;
    const receiptTotal = completedReceipt?.total ?? 0;
    const receiptSubtotal = completedReceipt?.subtotal ?? 0;
    const receiptDelivery = completedReceipt?.deliveryFee ?? 0;
    return (
      <Page>
        <div className="mx-auto max-w-5xl pb-20 pt-6 sm:pt-12">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-brand-ink/10 pb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40">Baura Bakers / Checkout</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">Order received</h1>
            </div>
            <span className="rounded-full bg-white/65 px-3 py-2 text-xs font-semibold text-brand-ink/70">{savedOrderNo}</span>
          </div>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_290px]">
            <section className="rounded-[1.5rem] border border-brand-ink/10 bg-white/65 p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-brand-ink" size={22} strokeWidth={1.8} />
                <div><h2 className="text-base font-semibold text-brand-ink">Your order is safely received</h2><p className="mt-1 text-xs text-brand-ink/55">Awaiting payment verification before preparation</p></div>
              </div>
              <div className="mt-6 divide-y divide-brand-ink/10 border-t border-brand-ink/10">
                <div className="grid grid-cols-[110px_1fr] gap-4 py-4 text-sm sm:grid-cols-[150px_1fr]"><span className="text-brand-ink/50">Collection</span><div className="font-medium text-brand-ink">{isPickup ? courierLabel : 'Baura delivery'}{isPickup && courierProvider && courierArrangement !== 'SELF_PICKUP' && <div className="mt-2"><CourierBrand provider={courierProvider} compact /></div>}</div></div>
                <div className="grid grid-cols-[110px_1fr] gap-4 py-4 text-sm sm:grid-cols-[150px_1fr]"><span className="text-brand-ink/50">Scheduled for</span><strong className="font-medium text-brand-ink">{isPickup ? `${formatCalendarDate(pickupDate)} · ${formatHour(pickupStartTime)}` : formatSlot(selectedDeliverySlot)}</strong></div>
                <div className="grid grid-cols-[110px_1fr] gap-4 py-4 text-sm sm:grid-cols-[150px_1fr]"><span className="text-brand-ink/50">Items</span><strong className="font-medium text-brand-ink">{completedReceipt?.itemCount ?? 0}</strong></div>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-brand-ink/10 pt-5"><span className="text-sm font-medium text-brand-ink/60">Bakery order total</span><strong className="text-2xl font-semibold tracking-tight text-brand-ink">{formatLkr(receiptTotal)}</strong></div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={completedWhatsappUrl || `https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-ink px-4 text-xs font-semibold text-brand-bg"><MessageCircle size={16}/> Confirm payment on WhatsApp</a>
                <Link to={trackPath} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-ink/15 px-4 text-xs font-semibold text-brand-ink"><PackageCheck size={16}/> Track order</Link>
              </div>
              {isPickup && courierArrangement !== 'SELF_PICKUP' && <p className="mt-3 text-xs leading-5 text-brand-ink/55">Third-party courier charges are paid separately by the customer.</p>}
            </section>
            <aside className="hidden lg:block h-fit rounded-[1.5rem] border border-brand-ink/10 bg-white/45 p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-brand-ink/40">Next steps</p>
              <ol className="mt-5 space-y-5">
                {[['01', 'Arrange your payment'], ['02', 'Send the slip via WhatsApp'], ['03', 'Wait for payment confirmation']].map(([number, label]) => <li key={number} className="flex items-start gap-3"><span className="text-xs font-bold text-brand-ink/40">{number}</span><span className="text-sm leading-5 text-brand-ink/80">{label}</span></li>)}
              </ol>
              <Link to={trackPath} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-ink/15 text-xs font-semibold text-brand-ink transition hover:bg-white sm:text-sm"><PackageCheck size={16} /> Track order</Link>
            </aside>
          </div>
        </div>
        {successSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5">
            <style>{`
              @keyframes bauraSheetIn { from { opacity:.7; transform:translateY(42px) } to { opacity:1; transform:translateY(0) } }
              @keyframes bauraSpark { 0% { opacity:0; transform:translate(0,0) scale(.3) rotate(0deg) } 15% { opacity:1 } 100% { opacity:0; transform:translate(var(--dx),var(--dy)) scale(.65) rotate(160deg) } }
              .baura-sheet-enter { animation:bauraSheetIn .36s cubic-bezier(.19,1,.22,1) both; }
              .baura-sheet-confetti { position:absolute; top:50%; left:50%; width:5px; height:9px; border-radius:1px; pointer-events:none; animation:bauraSpark 1.3s ease-out both; }
              .baura-hide-scrollbar { scrollbar-width:none; -ms-overflow-style:none; }
              .baura-hide-scrollbar::-webkit-scrollbar { display:none; }
              @media (prefers-reduced-motion:reduce) { .baura-sheet-enter { animation:none; } .baura-sheet-confetti { display:none; } }
            `}</style>
            <button
              type="button"
              aria-label="Close confirmation and view receipt"
              onClick={() => setSuccessSheetOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-[#24160f]/45 backdrop-blur-[3px]"
            />
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="checkout-success-title"
              aria-describedby="checkout-success-description"
              className="baura-sheet-enter relative z-10 flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[24px] border border-brand-ink/10 bg-[#fffdf8] shadow-[0_-15px_60px_rgba(30,18,10,.15)] sm:max-h-[min(760px,calc(100dvh-40px))] sm:max-w-[470px] sm:rounded-[22px] sm:shadow-[0_25px_85px_rgba(30,18,10,.24)]"
            >
              <div className="relative shrink-0 px-4 pt-3 sm:px-7 sm:pt-5">
                <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-brand-ink/20 sm:hidden" />
                <div className="flex items-center justify-between gap-2">
                  <span className="relative inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-ink sm:text-xs">
                    <span className="relative grid h-6 w-6 place-items-center rounded-full bg-brand-ink text-brand-bg">
                      <Check size={14} strokeWidth={2.2} />
                      {Array.from({ length: 14 }, (_, index) => {
                        const angle = index * (Math.PI * 2 / 14);
                        const distance = 65 + index % 3 * 11;
                        return <i key={index} aria-hidden="true" className="baura-sheet-confetti" style={{ '--dx': `${Math.cos(angle) * distance}px`, '--dy': `${Math.sin(angle) * distance}px`, backgroundColor: ['#bc9457', '#a46b4d', '#6c8867', '#d7bb85'][index % 4], animationDelay: `${index % 4 * 50}ms` } as CSSProperties} />;
                      })}
                    </span>
                    Order received
                  </span>
                  <button type="button" onClick={() => setSuccessSheetOpen(false)} className="min-h-9 rounded-lg px-3 text-[11px] font-medium text-brand-ink/55 transition hover:bg-brand-ink/5 hover:text-brand-ink" aria-label="View full receipt">View receipt <span aria-hidden="true">×</span></button>
                </div>
                <h2 id="checkout-success-title" className="mt-2 text-[22px] font-semibold leading-tight tracking-tight text-brand-ink sm:mt-3 sm:text-[30px]">Your order is in!</h2>
                <p id="checkout-success-description" className="mt-1 text-[11px] leading-[1.5] text-brand-ink/60 sm:mt-2 sm:text-[13px]">Order saved. Send your payment slip on WhatsApp to have it confirmed.</p>
              </div>

              <div className="baura-hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-3 sm:px-7 sm:pb-4 sm:pt-5">
                <div className="flex items-center justify-between gap-3 border-y border-brand-ink/10 py-2.5 sm:py-3">
                  <div className="min-w-0"><p className="text-[10px] text-brand-ink/45">Order number</p><p className="mt-0.5 text-[14px] font-bold text-brand-ink sm:text-base">{savedOrderNo}</p></div>
                  <button type="button" onClick={() => { void navigator.clipboard?.writeText(savedOrderNo); setCopiedOrderNo(true); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-brand-ink/15 px-3 text-[11px] font-semibold text-brand-ink"><Copy size={13}/>{copiedOrderNo ? 'Copied' : 'Copy'}</button>
                </div>
                <div className="flex items-end justify-between gap-3 py-3">
                  <div><p className="text-[10px] text-brand-ink/50">Bakery order total</p><p className="mt-0.5 text-[22px] font-semibold tracking-tight text-brand-ink sm:text-[26px]">{formatLkr(receiptTotal)}</p></div>
                  <div className="pb-0.5 text-right"><p className="text-[10px] text-brand-ink/50">Payment</p><p className="mt-0.5 text-[11px] font-semibold text-brand-ink">Awaiting verification</p></div>
                </div>
                {isPickup && courierArrangement !== 'SELF_PICKUP' && courierProvider && <div className="flex items-center justify-between gap-2 border-t border-brand-ink/10 py-2.5"><div className="min-w-0"><p className="text-[10px] text-brand-ink/50">Collection</p><p className="mt-0.5 text-[11px] font-medium text-brand-ink">{courierArrangement === 'CUSTOMER_COURIER' ? 'You arrange the courier' : 'Baura helps arrange'}</p></div><CourierBrand provider={courierProvider} compact /></div>}
                <div className="flex items-start gap-2.5 rounded-lg bg-[#f4eedf] px-3 py-2.5 sm:py-3">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-ink/75" strokeWidth={1.8}/>
                  <div><p className="text-[12px] font-semibold text-brand-ink">Payment required to confirm</p><p className="mt-0.5 text-[11px] leading-[1.5] text-brand-ink/65">Preparation begins after payment verification. Please send your bank-transfer slip to Baura Bakers.</p></div>
                </div>
                <button type="button" aria-expanded={successDetailsVisible} onClick={() => setSuccessDetailsVisible(visible => !visible)} className="mt-3 flex min-h-9 w-full items-center justify-between border-b border-brand-ink/10 pb-1 text-left text-[11px] font-medium text-brand-ink/65"><span>{successDetailsVisible ? 'Hide' : 'View'} order breakdown</span><ChevronRight size={15} className={successDetailsVisible ? 'rotate-90' : ''}/></button>
                {successDetailsVisible && <div className="space-y-2 py-3 text-[11px] leading-5 text-brand-ink/75"><div className="flex justify-between gap-3"><span>Items subtotal</span><strong>{formatLkr(receiptSubtotal)}</strong></div><div className="flex justify-between gap-3"><span>{isPickup ? "Bakery collection fee" : "Baura delivery fee"}</span><strong>{formatLkr(receiptDelivery)}</strong></div><div className="flex justify-between gap-3 border-t border-brand-ink/10 pt-2"><span>Total</span><strong>{formatLkr(receiptTotal)}</strong></div><p><strong>Collection:</strong> {isPickup ? courierLabel : 'Baura delivery'}</p><p><strong>When:</strong> {isPickup ? `${formatCalendarDate(pickupDate)} at ${formatHour(pickupStartTime)}` : formatSlot(selectedDeliverySlot)}</p>{isPickup && courierArrangement !== 'SELF_PICKUP' && <p>Third-party courier charges are paid separately by the customer.</p>}</div>}
              </div>

              <div className="shrink-0 border-t border-brand-ink/10 bg-[#fffdf8] px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-5">
                <a href={completedWhatsappUrl || `https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-ink px-3 text-[12px] font-semibold text-brand-bg transition hover:bg-brand-ink/90 sm:text-sm"><MessageCircle size={16} strokeWidth={1.8}/> Confirm payment on WhatsApp <ArrowRight size={15} className="ml-auto"/></a>
                <Link to={trackPath} className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-ink/15 text-[12px] font-semibold text-brand-ink transition hover:bg-brand-ink/5 sm:text-sm"><PackageCheck size={16} strokeWidth={1.8}/> Track my order</Link>
                <p className="mt-2 text-center text-[10px] leading-4 text-brand-ink/45">WhatsApp opens only when tapped · <Link to="/order-policies" className="underline underline-offset-2">Ordering policies</Link></p>
              </div>
            </section>
          </div>
        )}
      </Page>
    );
  }

  if (!items.length && !savedOrderNo) {
    return (
      <Page>
        <section className="mx-auto max-w-xl rounded-[1.75rem] border border-brand-ink/10 bg-white/65 px-5 py-10 text-center shadow-sm backdrop-blur sm:px-8 sm:py-12">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-ink text-brand-bg">
            <ShoppingBag size={21} strokeWidth={1.8} />
          </div>

          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-ink/40">
            Checkout
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">
            Your cart is empty
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-brand-ink/60">
            Pick something delicious from the menu and come back when you're
            ready.
          </p>

          <Link
            to="/menu"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg transition hover:bg-brand-ink/90">
            Explore menu
            <ChevronRight size={16} />
          </Link>
        </section>
      </Page>
    );
  }

  return (
    <Page>
      <div ref={stepTopRef} className="mx-auto max-w-[1120px] scroll-mt-20 pb-20 lg:pb-12">
        <header className="mb-3 flex flex-col gap-1.5 sm:mb-5 sm:gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-ink/40">
              Secure checkout
            </p>

            <h1 className="mt-1 text-[21px] font-semibold tracking-tight text-brand-ink sm:mt-1.5 sm:text-3xl">
              {stepTitle(step, isPickup)}
            </h1>

            <p className="mt-1 max-w-xl text-[12px] leading-[1.5] text-brand-ink/60 sm:mt-1.5 sm:text-sm sm:leading-6">
              A few details, your preferred collection time, then you’re done.
            </p>
          </div>

          <div className="hidden items-center gap-2 self-start rounded-xl border border-brand-ink/10 bg-white/55 px-3 py-2 sm:flex sm:self-auto">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink/40">
              Order
            </span>

            <span className="text-xs font-bold text-brand-ink">{orderId}</span>
          </div>
        </header>

        <nav aria-label="Checkout steps" className="mb-3 border-b border-brand-ink/10 sm:mb-4">
          <ol className="grid grid-cols-4 gap-1 sm:gap-2">
            {stepMeta.map((item) => {
              const active = step === item.id;
              const done = step > item.id;
              return <li key={item.id} className="min-w-0">
                <button type="button" onClick={() => goToStep(item.id)} aria-current={active ? 'step' : undefined}
                  className={`flex min-h-[40px] w-full items-center justify-center gap-1 border-b-2 px-0.5 pb-1.5 pt-1 text-[11px] font-semibold transition sm:min-h-[46px] sm:justify-start sm:gap-2 sm:border-b-[3px] sm:px-3 sm:pb-2 sm:text-xs ${active ? 'border-brand-ink text-brand-ink' : done ? 'border-brand-ink/30 text-brand-ink/75 hover:border-brand-ink/60' : 'border-transparent text-brand-ink/40 hover:text-brand-ink/65'}`}>
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] sm:h-6 sm:w-6 sm:text-xs ${active ? 'bg-brand-ink text-brand-bg' : done ? 'bg-brand-ink/10 text-brand-ink' : 'bg-white/60 text-brand-ink/40'}`}>
                    {done ? <Check size={15} strokeWidth={2}/> : item.id}
                  </span>
                  <span className="truncate text-[10px] sm:text-[13px]">{item.label}</span>
                </button>
              </li>;
            })}
          </ol>
        </nav>

        <div className="grid items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_310px] xl:grid-cols-[minmax(0,1fr)_330px]">
          <main className="min-w-0">
            {submitError && (
              <div
                data-checkout-error="true"
                tabIndex={-1}
                role="alert"
                className="mb-4 scroll-mt-28 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700 outline-none">
                {submitError}
              </div>
            )}

            <section className="bg-transparent px-0 py-1 sm:rounded-[1.15rem] sm:border sm:border-brand-ink/10 sm:bg-[#fffdf8]/85 sm:p-5">
              {step === 1 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="rounded-xl bg-brand-bg/40 px-2.5 py-3 sm:rounded-2xl sm:border sm:border-brand-ink/10 sm:bg-brand-bg/55 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-ink/45">Receive your order</p>
                    <div className="mt-2 grid gap-2 sm:mt-3 sm:grid-cols-2">
                      <ToggleCard active={isPickup} icon={<Store size={17} />} title="Store pickup / parcel collection" description="Collect yourself or arrange a courier" disabled={!pickupEnabled} onClick={() => { setFulfillmentType("PICKUP"); setFieldErrors({}); }} />
                      <ToggleCard active={!isPickup} icon={<Truck size={17} />} title="Delivery" description={deliveryEnabled ? "Address-based delivery" : "Currently unavailable"} disabled={!deliveryEnabled} onClick={() => { setFulfillmentType("DELIVERY"); setFieldErrors({}); }} />
                    </div>
                  </div>
                  <StepHeader
                    eyebrow="Customer details"
                    title="Who is placing the order?"
                    description="We'll use these details for your receipt and order updates."
                  />

                  {isLoadingUser && (
                    <InfoBox tone="neutral">
                      Loading your saved details…
                    </InfoBox>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <Field label="Your name" error={fieldErrors.senderName}>
                      <input
                        value={form.senderName}
                        onChange={(event) => {
                          updateForm("senderName", event.target.value);
                          clearFieldError("senderName");
                        }}
                        className={inputClass(Boolean(fieldErrors.senderName))}
                        placeholder="Full name"
                        autoComplete="name"
                      />
                    </Field>

                    <Field
                      label="Contact number"
                      error={fieldErrors.senderContactNumber}>
                      <input
                        value={form.senderContactNumber}
                        onChange={(event) => {
                          updateForm("senderContactNumber", event.target.value);
                          clearFieldError("senderContactNumber");
                        }}
                        className={inputClass(
                          Boolean(fieldErrors.senderContactNumber),
                        )}
                        placeholder="07X XXX XXXX"
                        inputMode="tel"
                        maxLength={16}
                          aria-invalid={Boolean(fieldErrors.senderContactNumber)}
                          onBlur={() => {
                            if (form.senderContactNumber.trim() && !isValidSriLankanMobile(form.senderContactNumber)) {
                              setFieldErrors((current) => ({
                                ...current,
                                senderContactNumber: "Enter a valid Sri Lankan mobile number.",
                              }));
                            }
                          }}
                          autoComplete="tel"
                      />
                    </Field>
                  </div>

                  <Field label="Email address" error={fieldErrors.senderEmail}>
                    <input
                      value={form.senderEmail}
                      onChange={(event) => {
                        updateForm("senderEmail", event.target.value);
                        clearFieldError("senderEmail");
                      }}
                      className={inputClass(Boolean(fieldErrors.senderEmail))}
                      placeholder="you@example.com"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                    />
                  </Field>

                  {isCheckingEmail && (
                    <p className="text-xs text-brand-ink/45">
                      Checking your email…
                    </p>
                  )}

                  {isExistingCustomerEmail && !dismissLoginPrompt && (
                    <div className="rounded-2xl border border-brand-ink/10 bg-brand-bg/70 p-4">
                      <p className="text-sm font-semibold text-brand-ink">
                        Welcome back
                      </p>

                      <p className="mt-1 text-xs leading-5 text-brand-ink/60">
                        There's already an account using this email. You can
                        sign in for faster checkout or continue as a guest.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          to="/login"
                          className="rounded-xl bg-brand-ink px-4 py-2 text-xs font-semibold text-brand-bg">
                          Sign in
                        </Link>

                        <button
                          type="button"
                          onClick={() => setDismissLoginPrompt(true)}
                          className="rounded-xl border border-brand-ink/15 bg-white/60 px-4 py-2 text-xs font-semibold text-brand-ink">
                          Continue as guest
                        </button>
                      </div>
                    </div>
                  )}

                  {!isPickup && <Field label="Your address" error={fieldErrors.senderAddress}>
                    <textarea
                      value={form.senderAddress}
                      onChange={(event) => {
                        updateForm("senderAddress", event.target.value);
                        clearFieldError("senderAddress");
                      }}
                      className={`${inputClass(
                        Boolean(fieldErrors.senderAddress),
                      )} min-h-[88px] resize-y`}
                      placeholder="House number, street, city"
                      autoComplete="street-address"
                    />
                  </Field>}

                  {!isPickup && <div className="border-t border-brand-ink/10 pt-5">
                    <p className="text-sm font-semibold text-brand-ink">
                      Is someone else receiving it?
                    </p>

                    <p className="mt-1 text-xs leading-5 text-brand-ink/55">
                      Add receiver details for gifts or deliveries to another
                      person.
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <ToggleCard
                        active={form.hasDifferentReceiver}
                        icon={<UserRound size={17} />}
                        title="Different receiver"
                        description="Send the order to someone else."
                        onClick={() =>
                          toggleDifferentReceiver(!form.hasDifferentReceiver)
                        }
                      />

                      <ToggleCard
                        active={form.isGift}
                        icon={<Gift size={17} />}
                        title="This is a gift"
                        description="We'll use the receiver's details."
                        onClick={() => toggleGift(!form.isGift)}
                      />
                    </div>
                  </div>}

                  {!isPickup && needsReceiver && (
                    <div className="rounded-xl bg-brand-bg/40 px-2.5 py-3 sm:rounded-2xl sm:border sm:border-brand-ink/10 sm:bg-brand-bg/55 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-brand-ink">
                            Receiver
                          </p>

                          <p className="mt-1 text-xs text-brand-ink/55">
                            Who will receive this order?
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={copySenderToReceiver}
                          className="w-fit rounded-xl border border-brand-ink/15 bg-white/65 px-3 py-2 text-xs font-semibold text-brand-ink transition hover:bg-white">
                          Copy sender details
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Receiver name"
                          error={fieldErrors.receiverName}>
                          <input
                            value={form.receiverName}
                            onChange={(event) => {
                              updateForm("receiverName", event.target.value);
                              clearFieldError("receiverName");
                            }}
                            className={inputClass(
                              Boolean(fieldErrors.receiverName),
                            )}
                            placeholder="Full name"
                            autoComplete="off"
                          />
                        </Field>

                        <Field
                          label="Receiver contact"
                          error={fieldErrors.receiverContactNumber}>
                          <input
                            value={form.receiverContactNumber}
                            onChange={(event) => {
                              updateForm(
                                "receiverContactNumber",
                                event.target.value,
                              );
                              clearFieldError("receiverContactNumber");
                            }}
                            className={inputClass(
                              Boolean(fieldErrors.receiverContactNumber),
                            )}
                            placeholder="07X XXX XXXX"
                            inputMode="tel"
                            maxLength={16}
                          aria-invalid={Boolean(fieldErrors.receiverContactNumber)}
                          onBlur={() => {
                            if (form.receiverContactNumber.trim() && !isValidSriLankanMobile(form.receiverContactNumber)) {
                              setFieldErrors((current) => ({
                                ...current,
                                receiverContactNumber: "Enter a valid Sri Lankan mobile number.",
                              }));
                            }
                          }}
                          autoComplete="off"
                          />
                        </Field>
                      </div>

                      <div className="mt-4">
                        <Field
                          label="Receiver address"
                          error={fieldErrors.receiverAddress}>
                          <textarea
                            value={form.receiverAddress}
                            onChange={(event) => {
                              updateForm("receiverAddress", event.target.value);
                              clearFieldError("receiverAddress");
                            }}
                            className={`${inputClass(
                              Boolean(fieldErrors.receiverAddress),
                            )} min-h-[88px] resize-y`}
                            placeholder="House number, street, city"
                          />
                        </Field>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3 sm:space-y-4">
                  {!checkoutReady && <InfoBox tone="warning">Checkout availability has not loaded. Check that the Laravel API is running and refresh this page.</InfoBox>}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-ink/10 pb-2 sm:pb-3">
                    <div><p className="text-base font-semibold text-brand-ink">{isPickup ? 'Collection method' : 'Delivery details'}</p><p className="mt-0.5 text-xs text-brand-ink/55">{isPickup ? 'Choose who will collect your bakery order.' : 'Confirm the delivery recipient and exact location.'}</p></div>
                    <button type="button" onClick={() => setStep(1)} className="min-h-9 rounded-lg border border-brand-ink/15 px-3 text-xs font-semibold text-brand-ink">Change method</button>
                  </div>
                  {isPickup && <div>
                    <div className="mb-3"><p className="text-sm font-semibold text-brand-ink">Who will collect your order?</p><p className="mt-1 text-xs leading-5 text-brand-ink/55">Bakery collection is free. Courier fees are paid separately.</p></div>
                    <div className="overflow-hidden rounded-lg border border-brand-ink/15 bg-white/55 sm:rounded-xl">
                      {([
                        { id: "SELF_PICKUP", title: "I'll collect", detail: "Collect at the bakery", icon: <Store size={18} strokeWidth={1.7}/> },
                        { id: "CUSTOMER_COURIER", title: "My courier", detail: "I book and pay the driver", icon: <Truck size={18} strokeWidth={1.7}/> },
                        { id: "BAKERY_ASSISTED_COURIER", title: "Help me arrange", detail: "Baura coordinates; I pay", icon: <PackageCheck size={18} strokeWidth={1.7}/> },
                      ] as const).map((option, index) => {
                        const active = courierArrangement === option.id;
                        return <button key={option.id} type="button" aria-pressed={active} onClick={() => { setCourierArrangement(option.id); if (option.id === 'SELF_PICKUP') setCourierProvider(null); setSubmitError(''); }} className={`flex w-full min-h-[54px] items-center gap-2.5 px-3 py-2 text-left transition sm:min-h-[64px] sm:gap-3 sm:px-3.5 sm:py-2.5 ${index ? 'border-t border-brand-ink/10' : ''} ${active ? 'bg-[#f4eddf]' : 'hover:bg-white/80'}`}>
                          <span className="shrink-0 text-brand-ink/70">{option.icon}</span>
                          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-brand-ink">{option.title}</span><span className="mt-0.5 block text-[11px] leading-[1.4] text-brand-ink/55 sm:text-xs">{option.detail}</span></span>
                          <span className={`grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full border ${active ? 'border-brand-ink bg-brand-ink text-brand-bg' : 'border-brand-ink/25'}`}>{active && <Check size={12}/>}</span>
                        </button>;
                      })}
                    </div>
                    {courierArrangement !== 'SELF_PICKUP' && <div className="mt-4">
                      <p className="text-sm font-semibold text-brand-ink">Courier service</p>
                      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:gap-2">
                        {(['PICKME_FLASH', 'UBER_PARCEL'] as const).map(provider => {
                          const active = courierProvider === provider;
                          return <button key={provider} type="button" aria-pressed={active} onClick={() => { setCourierProvider(provider); setSubmitError(''); }} className={`flex min-h-[46px] min-w-0 items-center justify-between gap-1 rounded-lg border px-2 py-1.5 text-left transition sm:min-h-[52px] sm:rounded-xl sm:px-3 sm:py-2 ${active ? 'border-brand-ink bg-[#f4eddf]' : 'border-brand-ink/15 bg-white/60 hover:bg-white'}`}><CourierBrand provider={provider}/><span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border ${active ? 'border-brand-ink bg-brand-ink text-brand-bg' : 'border-brand-ink/25'}`}>{active && <Check size={11}/>}</span></button>;
                        })}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-brand-ink/55">{courierArrangement === 'CUSTOMER_COURIER' ? 'Book your driver only after payment is confirmed. You pay the driver.' : 'Baura can help coordinate a driver, subject to availability. Courier charges are yours to pay.'}</p>
                    </div>}
                  </div>}
                  {isPickup && <Field label="Order note — optional"><textarea value={form.note} onChange={(e) => updateForm("note", e.target.value)} className={`${inputClass(false)} min-h-[82px] resize-y`} placeholder="Collection instructions or other notes" /></Field>}
                  {!isPickup && <div className="space-y-5 border-t border-brand-ink/10 pt-5">
                  <StepHeader
                    eyebrow="Delivery"
                    title="Where should we deliver?"
                    description="Choose the recipient and pin the exact delivery location."
                  />

                  <div className="grid gap-2 sm:grid-cols-2">
                    <ToggleCard
                      active={form.deliveryTarget === "SENDER"}
                      icon={<UserRound size={17} />}
                      title="My address"
                      description={form.senderAddress || "Sender address"}
                      onClick={() => {
                        updateForm("deliveryTarget", "SENDER");
                        clearFieldError("deliveryLocation");
                      }}
                    />

                    <ToggleCard
                      active={form.deliveryTarget === "RECEIVER"}
                      disabled={!needsReceiver}
                      icon={<Gift size={17} />}
                      title="Receiver address"
                      description={
                        needsReceiver
                          ? form.receiverAddress || "Receiver address"
                          : "Add a receiver in step 1 first."
                      }
                      onClick={() => {
                        if (!needsReceiver) return;

                        updateForm("deliveryTarget", "RECEIVER");

                        clearFieldError("deliveryLocation");
                      }}
                    />
                  </div>

                  <div className="rounded-xl bg-brand-bg/40 px-2.5 py-3 sm:rounded-2xl sm:border sm:border-brand-ink/10 sm:bg-brand-bg/55 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-ink text-brand-bg">
                        <MapPin size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-ink/40">
                          Delivery address
                        </p>

                        <p className="mt-1 text-sm font-semibold leading-6 text-brand-ink">
                          {effectiveDelivery.address || "No address added"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-brand-ink">
                          Exact map location
                        </p>

                        <p className="mt-1 text-xs leading-5 text-brand-ink/55">
                          Use your device location or paste a Google Maps
                          coordinate link.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => useCurrentLocation(form.deliveryTarget)}
                        disabled={isLocating}
                        className={[
                          "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition",
                          isLocating
                            ? "cursor-not-allowed bg-brand-ink/30 text-brand-bg"
                            : "bg-brand-ink text-brand-bg hover:bg-brand-ink/90",
                        ].join(" ")}>
                        <LocateFixed size={15} />

                        {isLocating ? "Locating…" : "Use my location"}
                      </button>
                    </div>

                    <div className="mt-3">
                      <input
                        value={currentLocationUrl}
                        onChange={(event) =>
                          updateLocationUrl(event.target.value)
                        }
                        className={inputClass(
                          Boolean(fieldErrors.deliveryLocation),
                        )}
                        placeholder="Google Maps coordinate link"
                        inputMode="url"
                      />

                      {fieldErrors.deliveryLocation && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          {fieldErrors.deliveryLocation}
                        </p>
                      )}
                    </div>
                  </div>

                  {deliveryLocationCoords ? (
                    <div className="overflow-hidden rounded-2xl border border-brand-ink/10 bg-white">
                      <iframe
                        title="Delivery location"
                        className="h-56 w-full sm:h-64"
                        loading="lazy"
                        src={currentMapUrl}
                      />

                      <div className="flex flex-col gap-2 border-t border-brand-ink/10 bg-white/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-brand-ink/65">
                          <Check size={14} className="text-green-700" />
                          Location added
                        </div>

                        <span className="text-[11px] text-brand-ink/40">
                          {deliveryLocationCoords.lat.toFixed(5)},{" "}
                          {deliveryLocationCoords.lng.toFixed(5)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-brand-ink/15 bg-white/35 px-5 py-8 text-center">
                      <MapPin size={22} className="mx-auto text-brand-ink/30" />

                      <p className="mt-2 text-sm font-semibold text-brand-ink/70">
                        No map location yet
                      </p>

                      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-brand-ink/50">
                        An exact location is needed to calculate your delivery
                        fee.
                      </p>
                    </div>
                  )}

                  {isCalculatingDistance && (
                    <InfoBox tone="neutral">
                      Calculating delivery to this location…
                    </InfoBox>
                  )}

                  {!isCalculatingDistance && checkoutQuote && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MiniStat
                        label="Distance"
                        value={`${checkoutQuote.distance_km} km`}
                      />

                      <MiniStat
                        label="Delivery"
                        value={formatLkr(checkoutQuote.delivery_fee_lkr)}
                      />

                      <MiniStat
                        label="Vehicle"
                        value={checkoutQuote.vehicle_type}
                      />
                    </div>
                  )}

                  {distanceNotice && (
                    <InfoBox tone="warning">{distanceNotice}</InfoBox>
                  )}

                  {maxDeliveryDistanceKm && (
                    <p className="text-xs leading-5 text-brand-ink/45">
                      Delivery is currently available within{" "}
                      {maxDeliveryDistanceKm} km of Baura Bakers.
                    </p>
                  )}

                  <Field label="Order note — optional">
                    <textarea
                      value={form.note}
                      onChange={(event) =>
                        updateForm("note", event.target.value)
                      }
                      className={`${inputClass(false)} min-h-[82px] resize-y`}
                      placeholder="Landmark, gift message or special delivery instruction"
                    />
                  </Field>
                  </div>}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3 sm:space-y-4">
                  {isPickup ? <>
                    <StepHeader eyebrow="COLLECTION" title="Choose your pickup time" description="Select a convenient collection window during our opening hours." />
                    <div className="border-b border-brand-ink/10 bg-transparent px-0 pb-3 pt-1 sm:rounded-[1.4rem] sm:border sm:border-brand-ink/10 sm:bg-white/65 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-brand-ink">Choose a collection day</p>
                          <p className="mt-1 text-xs text-brand-ink/50">Only available dates in the next {pickupPreviewDays} days</p>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-brand-ink/10 bg-brand-bg px-3 py-2 text-xs font-semibold text-brand-ink/70">
                          <Clock3 size={14} /> {selectedPickupDay?.isOpen && selectedPickupDay.openingTime && selectedPickupDay.closingTime ? `${formatHour(selectedPickupDay.openingTime)} – ${formatHour(selectedPickupDay.closingTime)}` : "Hours vary by day"}
                        </span>
                      </div>
                      <PickupCalendar
                        days={pickupCalendar}
                        selected={pickupDate}
                        onSelect={(value) => {
                          setPickupDate(value);
                          setPickupStartTime("");
                          clearFieldError("pickupDate");
                          clearFieldError("pickupTime");
                        }}
                      />
                      {pickupCalendar.length === 0 && (
                        <InfoBox tone="warning" className="mt-3">
                          Collection dates are unavailable. Please try again when the bakery calendar is connected.
                        </InfoBox>
                      )}
                      {selectedPickupDay?.source === "EXCEPTION" && (
                        <InfoBox tone="neutral" className="mt-3">
                          Special opening hours apply{selectedPickupDay.reason ? `: ${selectedPickupDay.reason}` : "."}
                        </InfoBox>
                      )}
                      {fieldErrors.pickupDate && <p data-checkout-error="true" className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.pickupDate}</p>}
                    </div>
                    <div className="border-b border-brand-ink/10 bg-transparent px-0 pb-3 pt-1 sm:rounded-[1.4rem] sm:border sm:border-brand-ink/10 sm:bg-white/65 sm:p-5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-brand-ink">Select your pickup time</p>
                          <p className="mt-1 text-xs text-brand-ink/50">Times are shown in Sri Lanka time</p>
                        </div>
                        <Clock3 size={18} className="text-brand-ink/45" />
                      </div>
                      {!pickupDate ? (
                        <p className="mt-4 rounded-xl bg-brand-bg/70 p-4 text-sm text-brand-ink/60">Select an open day above to see collection times.</p>
                      ) : pickupTimeChoices.length === 0 ? (
                        <p className="mt-4 rounded-xl bg-brand-bg/70 p-4 text-sm text-brand-ink/60">No collection times remain on this day. Choose another date.</p>
                      ) : (
                        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mt-4 sm:grid-cols-4 sm:gap-2 lg:grid-cols-5">
                          {pickupTimeChoices.map((time) => (
                            <button key={time} type="button" onClick={() => { setPickupStartTime(time); clearFieldError("pickupTime"); }}
                              aria-pressed={pickupStartTime === time}
                              className={`min-h-10 rounded-lg border px-1 py-2 text-[11px] font-semibold transition sm:min-h-11 sm:rounded-xl sm:px-2 sm:py-2.5 sm:text-sm ${pickupStartTime === time ? "border-brand-ink bg-brand-ink text-brand-bg shadow-sm" : "border-brand-ink/10 bg-brand-bg/45 text-brand-ink hover:border-brand-ink/30 hover:bg-white"}`}>
                              {formatHour(time)}
                            </button>
                          ))}
                        </div>
                      )}
                      {fieldErrors.pickupTime && <p data-checkout-error="true" className="mt-3 text-xs font-semibold text-red-600">{fieldErrors.pickupTime}</p>}
                      {pickupScheduleValid && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-bg/75 px-3 py-3 text-xs leading-5 text-brand-ink/75">
                          <Check size={16} className="mt-0.5 shrink-0" />
                          <span>Your collection time is <strong>{formatHour(pickupStartTime)}</strong>. Please arrive on time.</span>
                        </div>
                      )}
                    </div>
                    <InfoBox tone={pickupScheduleValid ? "success" : "neutral"}>
                      {pickupScheduleValid ? `Collection: ${formatCalendarDate(pickupDate)} at ${formatHour(pickupStartTime)} (10-minute window)` : "Choose a collection date and time above. Pickup is free."}
                    </InfoBox>
                    <div className="rounded-2xl border border-brand-ink/10 bg-brand-bg/60 p-4">
                      <PriceRow label="Store pickup" value="FREE" />
                      <div className="mt-3 border-t border-brand-ink/10 pt-3"><PriceRow label="Order total" value={formatLkr(totalLkr)} /></div>
                    </div>
                  </> : <>
                  <StepHeader
                    eyebrow="Schedule"
                    title="When should it arrive?"
                    description="Choose one of the currently available delivery sessions."
                  />

                  {fieldErrors.deliverySlot && (
                    <div
                      data-checkout-error="true"
                      tabIndex={-1}
                      role="alert"
                      className="scroll-mt-28 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 outline-none">
                      {fieldErrors.deliverySlot}
                    </div>
                  )}

                  {isLoadingSlots ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[1, 2, 3, 4].map((item) => (
                        <div
                          key={item}
                          className="h-24 animate-pulse rounded-2xl border border-brand-ink/5 bg-brand-ink/[0.04]"
                        />
                      ))}
                    </div>
                  ) : deliveryCalendarDays.length ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-brand-ink">
                              Delivery day
                            </p>

                            <p className="mt-1 text-xs text-brand-ink/50">
                              Choose an available date.
                            </p>
                          </div>

                          <span className="rounded-lg bg-brand-ink/[0.05] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-ink/45">
                            {deliveryCalendarDays.length} days
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
                          {deliveryCalendarDays.map((day) => {
                            const active = selectedDeliveryDate === day.date;

                            return (
                              <button
                                key={day.date}
                                type="button"
                                onClick={() => {
                                  setSelectedDeliveryDate(day.date);

                                  setSelectedDeliverySlotId("");

                                  clearFieldError("deliverySlot");
                                }}
                                className={[
                                  "rounded-2xl border p-3 text-left transition",
                                  active
                                    ? "border-brand-ink bg-brand-ink text-brand-bg shadow-sm"
                                    : "border-brand-ink/10 bg-white/55 text-brand-ink hover:border-brand-ink/20 hover:bg-white/80",
                                ].join(" ")}>
                                <span
                                  className={[
                                    "text-[9px] font-semibold uppercase tracking-[0.18em]",
                                    active
                                      ? "text-brand-bg/55"
                                      : "text-brand-ink/35",
                                  ].join(" ")}>
                                  {formatCalendarMonth(day.date)}
                                </span>

                                <span className="mt-1 block text-2xl font-bold leading-none">
                                  {formatCalendarDayNumber(day.date)}
                                </span>

                                <span
                                  className={[
                                    "mt-2 block text-[11px] font-medium",
                                    active
                                      ? "text-brand-bg/75"
                                      : "text-brand-ink/55",
                                  ].join(" ")}>
                                  {formatCalendarDate(day.date)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t border-brand-ink/10 pt-5">
                        <p className="text-sm font-semibold text-brand-ink">
                          Available times
                        </p>

                        <p className="mt-1 text-xs text-brand-ink/50">
                          {selectedDeliveryDate
                            ? formatCalendarDate(selectedDeliveryDate)
                            : "Select a delivery day"}
                        </p>

                        {selectedDateSlots.length ? (
                          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                            {selectedDateSlots.map((slot) => {
                              const active = selectedDeliverySlotId === slot.id;

                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDeliverySlotId(slot.id);

                                    clearFieldError("deliverySlot");
                                  }}
                                  className={[
                                    "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                                    active
                                      ? "border-brand-ink bg-brand-ink text-brand-bg shadow-sm"
                                      : "border-brand-ink/10 bg-white/55 text-brand-ink hover:border-brand-ink/20 hover:bg-white/80",
                                  ].join(" ")}>
                                  <span
                                    className={[
                                      "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border",
                                      active
                                        ? "border-brand-bg/30 bg-brand-bg text-brand-ink"
                                        : "border-brand-ink/15 bg-white/60 text-transparent",
                                    ].join(" ")}>
                                    <Check size={13} />
                                  </span>

                                  <span className="min-w-0">
                                    <span className="block text-sm font-semibold">
                                      {slot.slot_label}
                                    </span>

                                    <span
                                      className={[
                                        "mt-1 block text-xs",
                                        active
                                          ? "text-brand-bg/70"
                                          : "text-brand-ink/50",
                                      ].join(" ")}>
                                      {slot.start_time.slice(0, 5)} –{" "}
                                      {slot.end_time.slice(0, 5)}
                                    </span>

                                    <span
                                      className={[
                                        "mt-1.5 block text-[10px] font-medium",
                                        active
                                          ? "text-brand-bg/55"
                                          : "text-brand-ink/35",
                                      ].join(" ")}>
                                      {slot.remaining_orders} place
                                      {slot.remaining_orders === 1
                                        ? ""
                                        : "s"}{" "}
                                      remaining
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <InfoBox tone="warning" className="mt-3">
                            No delivery times are available on this date.
                          </InfoBox>
                        )}
                      </div>
                    </>
                  ) : (
                    <InfoBox tone="warning">
                      There are no delivery sessions available right now. Please
                      contact Baura Bakers before placing your order.
                    </InfoBox>
                  )}

                  <div className="border-t border-brand-ink/10 pt-5">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border border-brand-ink/10 bg-brand-bg/60 p-4">
                        <div className="flex items-center gap-2">
                          <Truck size={16} className="text-brand-ink/55" />

                          <p className="text-xs font-semibold uppercase tracking-wider text-brand-ink/45">
                            Delivery
                          </p>
                        </div>

                        {isCalculatingDistance ? (
                          <p className="mt-3 text-sm font-semibold text-brand-ink/60">
                            Calculating…
                          </p>
                        ) : checkoutQuote ? (
                          <>
                            <p className="mt-3 text-xl font-bold text-brand-ink">
                              {formatLkr(deliveryFeeLkr)}
                            </p>

                            <p className="mt-1 text-xs text-brand-ink/50">
                              {checkoutQuote.distance_km} km delivery distance
                            </p>
                          </>
                        ) : (
                          <p className="mt-3 text-sm text-brand-ink/55">
                            Delivery quote unavailable
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-brand-ink/10 bg-brand-ink p-4 text-brand-bg">
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-bg/50">
                          Order total
                        </p>

                        <p className="mt-3 text-xl font-bold">
                          {formatLkr(finalTotalLkr)}
                        </p>

                        <p className="mt-1 text-xs text-brand-bg/60">
                          Including delivery
                        </p>
                      </div>
                    </div>
                  </div>

                  {!isPickup && selectedDeliverySlot && (
                    <InfoBox tone="success">
                      <span className="font-semibold">Selected:</span>{" "}
                      {formatSlot(selectedDeliverySlot)}
                    </InfoBox>
                  )}

                  {distanceNotice && (
                    <InfoBox tone="warning">{distanceNotice}</InfoBox>
                  )}
                  </>}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3 sm:space-y-4">
                  <StepHeader
                    eyebrow="Review"
                    title="Everything look right?"
                    description="Review the important details before confirming your order."
                  />

                  <div className="grid gap-2 sm:grid-cols-2">
                    <ReviewCard icon={<UserRound size={17} />} title="Customer">
                      <p>{form.senderName}</p>
                      <p className="mt-1 text-brand-ink/55">
                        {form.senderContactNumber}
                      </p>
                      <p className="mt-1 break-all text-brand-ink/55">
                        {form.senderEmail}
                      </p>
                    </ReviewCard>

                    <ReviewCard icon={isPickup ? <Store size={17} /> : <MapPin size={17} />} title={isPickup ? "Collection" : "Delivery"}>
                      {isPickup ? <><p>{courierLabel}</p>{courierProvider && courierArrangement !== "SELF_PICKUP" && <div className="mt-2"><CourierBrand provider={courierProvider} compact /></div>}<p className="mt-2 text-xs text-brand-ink/50">{courierArrangement === "SELF_PICKUP" ? "Collect at Baura Bakers" : courierArrangement === "CUSTOMER_COURIER" ? "Courier booked and paid by customer" : "Baura assists; customer pays courier"}</p></> : <><p>{effectiveDelivery.name}</p><p className="mt-1 text-brand-ink/55">{effectiveDelivery.address}</p></>}
                    </ReviewCard>

                    <ReviewCard icon={<Clock3 size={17} />} title="Schedule">
                      <p>{isPickup ? `${formatCalendarDate(pickupDate)} at ${formatHour(pickupStartTime)}` : formatSlot(selectedDeliverySlot)}</p>
                    </ReviewCard>

                    <ReviewCard icon={isPickup ? <Store size={17} /> : <Truck size={17} />} title={isPickup ? "Collection fee" : "Delivery fee"}>
                      <p>{isPickup ? "FREE bakery pickup" : formatLkr(deliveryFeeLkr)}</p>
                      {isPickup && courierArrangement !== "SELF_PICKUP" && <p className="mt-1 text-xs text-brand-ink/50">Courier charge paid separately by you</p>}

                      {checkoutQuote && (
                        <p className="mt-1 text-brand-ink/55">
                          {checkoutQuote.distance_km} km
                        </p>
                      )}
                    </ReviewCard>
                  </div>

                  {!isPickup && form.isGift && (
                    <div className="flex items-center gap-3 rounded-2xl border border-brand-ink/10 bg-brand-bg/60 px-4 py-3">
                      <Gift size={17} className="shrink-0 text-brand-ink/60" />

                      <div>
                        <p className="text-sm font-semibold text-brand-ink">
                          Gift order
                        </p>

                        <p className="mt-0.5 text-xs text-brand-ink/55">
                          Delivering to {form.receiverName}.
                        </p>
                      </div>
                    </div>
                  )}

                  {form.note.trim() && (
                    <ReviewCard
                      icon={<MessageCircle size={17} />}
                      title="Order note">
                      <p>{form.note.trim()}</p>
                    </ReviewCard>
                  )}

                  <div className="border-y border-brand-ink/10 bg-brand-bg/35 px-3 py-3 sm:rounded-2xl sm:border sm:border-brand-ink/10 sm:bg-brand-bg/65 sm:p-5">
                    <div className="space-y-2">
                      <PriceRow label="Subtotal" value={formatLkr(totalLkr)} />

                      <PriceRow
                        label={isPickup ? "Collection" : "Delivery"}
                        value={isPickup ? "FREE" : formatLkr(deliveryFeeLkr)}
                      />
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4 border-t border-brand-ink/10 pt-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-ink/40">
                          Total
                        </p>

                        <p className="mt-1 text-xs text-brand-ink/50">
                          Order {orderId}
                        </p>
                      </div>

                      <p className="text-xl font-bold text-brand-ink sm:text-2xl">
                        {formatLkr(finalTotalLkr)}
                      </p>
                    </div>
                  </div>

                  <div className="border-b border-brand-ink/10 bg-transparent px-0 py-2.5 sm:rounded-xl sm:border sm:bg-white/40 sm:p-3.5">
                    <div className="flex items-start gap-3">
                      <PackageCheck
                        size={19}
                        className="mt-0.5 shrink-0 text-brand-ink/55"
                      />

                      <div>
                        <p className="text-sm font-semibold text-brand-ink">
                          What happens next?
                        </p>

                        <p className="mt-1 text-xs leading-5 text-brand-ink/55">
                          Your order will be saved first. WhatsApp will then
                          open with your order details so Baura Bakers can
                          provide the bank transfer details and confirm your
                          order.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/75 px-4 py-3 text-xs leading-5 text-amber-950">Your order is confirmed for preparation only after we verify successful payment. After placing it, use the WhatsApp button on the success screen to send your bank-transfer slip.</div>
                  <p className="text-xs leading-6 text-brand-ink/55">Please read our <Link to="/order-policies" className="font-semibold underline underline-offset-4">ordering, payment and courier policies</Link> before placing your order.</p>
                  <button
                    type="button"
                    onClick={bankTransferViaWhatsApp}
                    disabled={isSubmitting || !items.length || !scheduleValid}
                    className={[
                      "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition",
                      isSubmitting || !items.length || !scheduleValid
                        ? "cursor-not-allowed bg-brand-ink/30 text-brand-bg"
                        : "bg-brand-ink text-brand-bg shadow-sm hover:bg-brand-ink/90",
                    ].join(" ")}>
                    <MessageCircle size={18} />

                    {isSubmitting
                      ? "Confirming your order…"
                      : "Place order"}
                  </button>

                  <p className="text-center text-[11px] leading-5 text-brand-ink/45">
                    Placing an order does not confirm payment. Your cart clears only after the order is saved.
                  </p>
                </div>
              )}

              <div className="mt-6 hidden items-center justify-between gap-3 border-t border-brand-ink/10 pt-5 lg:flex">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 1}
                  className={[
                    "inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                    step === 1
                      ? "cursor-not-allowed border-brand-ink/5 text-brand-ink/25"
                      : "border-brand-ink/15 text-brand-ink hover:bg-brand-ink/[0.04]",
                  ].join(" ")}>
                  <ChevronLeft size={16} />
                  Back
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-ink px-5 py-2.5 text-sm font-semibold text-brand-bg transition hover:bg-brand-ink/90">
                    Continue
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <Link
                    to="/cart"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-ink/15 px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:bg-brand-ink/[0.04]">
                    Edit cart
                  </Link>
                )}
              </div>
            </section>
          </main>

          <aside className="hidden lg:block h-fit rounded-[1.5rem] border border-brand-ink/10 bg-[#fffdf8]/80 p-4 shadow-sm sm:p-5 lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-ink/40">
                  Your order
                </p>

                <p className="mt-1 text-sm font-semibold text-brand-ink">
                  {totalQuantity} item
                  {totalQuantity === 1 ? "" : "s"}
                </p>
              </div>

              <Link
                to="/cart"
                className="rounded-lg border border-brand-ink/10 px-3 py-1.5 text-[11px] font-semibold text-brand-ink/65 transition hover:bg-brand-ink/[0.04]">
                Edit
              </Link>
            </div>

            <div className="mt-4 max-h-[310px] space-y-2 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={`${item.productSlug}-${item.size.id}-${item.sugar}`}
                  className="rounded-xl border border-brand-ink/8 bg-white/45 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-brand-ink">
                        {item.productName}
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-brand-ink/50">
                        {item.size.label} · {item.sugar ? `${item.sugar} sugar · ` : ""}Qty{" "}
                        {item.quantity}
                      </p>
                    </div>

                    <p className="shrink-0 text-xs font-semibold text-brand-ink">
                      {formatLkr(item.unitPriceLkr * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-brand-ink/10 pt-4">
              <div className="space-y-2">
                <PriceRow label="Subtotal" value={formatLkr(totalLkr)} />

                <PriceRow
                  label={isPickup ? "Bakery collection" : "Baura delivery"}
                  value={
                    isPickup ? "FREE" : checkoutQuote ? formatLkr(deliveryFeeLkr) : "Not calculated"
                  }
                  muted={!isPickup && !checkoutQuote}
                />
              </div>

              <div className="mt-4 flex items-end justify-between gap-3 border-t border-brand-ink/10 pt-4">
                <p className="text-sm font-bold text-brand-ink">Total</p>

                <p className="text-lg font-bold text-brand-ink">
                  {formatLkr(finalTotalLkr)}
                </p>
              </div>
            </div>

            {!isPickup && selectedDeliverySlot && (
              <div className="mt-4 rounded-xl bg-brand-bg/70 p-3">
                <div className="flex items-start gap-2.5">
                  <Clock3
                    size={15}
                    className="mt-0.5 shrink-0 text-brand-ink/45"
                  />

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink/40">
                      Delivery
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-brand-ink/70">
                      {formatSlot(selectedDeliverySlot)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isPickup && checkoutQuote && (
              <div className="mt-2 rounded-xl bg-brand-bg/70 p-3">
                <div className="flex items-start gap-2.5">
                  <Truck
                    size={15}
                    className="mt-0.5 shrink-0 text-brand-ink/45"
                  />

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink/40">
                      Delivery fee
                    </p>

                    <p className="mt-1 text-xs font-semibold text-brand-ink/70">
                      {formatLkr(deliveryFeeLkr)} · {checkoutQuote.distance_km}{" "}
                      km
                    </p>
                  </div>
                </div>
              </div>
            )}
            {isPickup && courierArrangement !== "SELF_PICKUP" && courierProvider && <div className="mt-3 rounded-xl border border-brand-ink/10 bg-white/65 p-3"><p className="mb-2 text-[10px] uppercase tracking-wider text-brand-ink/40">Courier arrangement</p><CourierBrand provider={courierProvider} compact /><p className="mt-1 text-[11px] text-brand-ink/50">{courierArrangement === "CUSTOMER_COURIER" ? "You will arrange and pay" : "Baura can assist; you pay"}</p></div>}
            {isPickup && pickupScheduleValid && <div className="mt-4 rounded-xl bg-brand-bg/70 p-3 text-xs font-medium text-brand-ink/70">
              <Store size={15} className="mb-2" /> Collect {formatCalendarDate(pickupDate)} at {formatHour(pickupStartTime)}
            </div>}
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-ink/10 bg-brand-bg/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-brand-ink/15 bg-white/60 text-brand-ink"
                aria-label="Go back">
                <ChevronLeft size={19} />
              </button>
            )}

            <div className="min-w-0 flex-1">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-brand-bg">
                  Continue
                  <ChevronRight size={17} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={bankTransferViaWhatsApp}
                  disabled={isSubmitting || !items.length || !scheduleValid}
                  className={[
                    "flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold",
                    isSubmitting || !items.length || !scheduleValid
                      ? "cursor-not-allowed bg-brand-ink/30 text-brand-bg"
                      : "bg-brand-ink text-brand-bg",
                  ].join(" ")}>
                  <MessageCircle size={17} />

                  {isSubmitting ? "Confirming…" : "Place order"}
                </button>
              )}
            </div>

            <div className="shrink-0 px-1 text-right">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-brand-ink/35">
                Total
              </p>

              <p className="text-xs font-bold text-brand-ink">
                {formatLkr(finalTotalLkr)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

function inputClass(error: boolean) {
  return [
    "w-full rounded-lg border bg-white/65 px-3 py-2.5 text-[13px] text-brand-ink outline-none transition placeholder:text-brand-ink/30 focus:bg-white focus:ring-2 sm:rounded-xl sm:px-3.5 sm:py-3 sm:text-sm",
    error
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-brand-ink/10 focus:border-brand-ink/25 focus:ring-brand-ink/5",
  ].join(" ");
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
    <div className="border-b border-brand-ink/10 pb-3 sm:pb-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-ink/40">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-brand-ink sm:mt-1.5 sm:text-2xl">
        {title}
      </h2>

      <p className="mt-1 max-w-2xl text-[12px] leading-[1.5] text-brand-ink/60 sm:mt-1.5 sm:text-sm sm:leading-6">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-checkout-error={error ? "true" : undefined}
      tabIndex={error ? -1 : undefined}
      className="scroll-mt-28">
      <label className="mb-1 block text-[11px] font-semibold text-brand-ink/65 sm:mb-1.5 sm:text-xs">
        {label}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

function ToggleCard({
  active,
  icon,
  title,
  description,
  disabled = false,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
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
        "flex min-h-[64px] items-center gap-2.5 rounded-lg border p-2.5 text-left transition sm:min-h-[86px] sm:items-start sm:gap-3 sm:rounded-2xl sm:p-3.5",
        disabled
          ? "cursor-not-allowed border-brand-ink/5 bg-brand-ink/[0.02] text-brand-ink/30"
          : active
            ? "border-brand-ink bg-brand-ink text-brand-bg shadow-sm"
            : "border-brand-ink/10 bg-white/50 text-brand-ink hover:border-brand-ink/20 hover:bg-white/75",
      ].join(" ")}>
      <span
        className={[
          "grid h-7 w-7 shrink-0 place-items-center rounded-lg sm:h-8 sm:w-8 sm:rounded-xl",
          active
            ? "bg-white/10 text-brand-bg"
            : "bg-brand-ink/[0.05] text-brand-ink/55",
        ].join(" ")}>
        {icon}
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {title}

          {active && <Check size={14} className="shrink-0" />}
        </span>

        <span
          className={[
            "mt-0.5 block line-clamp-2 text-[11px] leading-[1.4] sm:mt-1 sm:text-xs sm:leading-5",
            active ? "text-brand-bg/65" : "text-brand-ink/50",
          ].join(" ")}>
          {description}
        </span>
      </span>
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-ink/10 bg-white/50 px-3.5 py-3">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-brand-ink/35">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-brand-ink">{value}</p>
    </div>
  );
}

function ReviewCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-brand-ink/10 bg-transparent px-0 py-2.5 sm:rounded-xl sm:border sm:bg-white/40 sm:p-3.5">
      <div className="flex items-center gap-2 text-brand-ink/50">
        {icon}

        <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">
          {title}
        </p>
      </div>

      <div className="mt-1.5 break-words text-[12px] font-medium leading-[1.5] text-brand-ink sm:mt-2 sm:text-sm sm:leading-6">
        {children}
      </div>
    </div>
  );
}

function PriceRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-medium text-brand-ink/55">{label}</p>

      <p
        className={[
          "text-xs font-semibold",
          muted ? "text-brand-ink/40" : "text-brand-ink",
        ].join(" ")}>
        {value}
      </p>
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
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-brand-ink/10 bg-white/55 text-brand-ink/60";

  return (
    <div
      className={[
        "rounded-lg border px-3 py-2.5 text-[11px] leading-[1.5] sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6",
        toneClass,
        className,
      ].join(" ")}>
      {children}
    </div>
  );
}

function minutesOfDay(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minuteToTime(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function addTenMinutes(value: string): string {
  return minuteToTime(minutesOfDay(value) + 10);
}

function formatHour(value: string): string {
  if (!value) return "—";
  const hours = Math.floor(minutesOfDay(value) / 60);
  return `${String(hours % 12 || 12)}:${value.slice(3, 5)} ${hours < 12 ? "AM" : "PM"}`;
}

function sriLankaToday(): string {
  const values = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const lookup = Object.fromEntries(values.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function pickupTimeOptions(day: CheckoutPickupDay): string[] {
  if (!day.isOpen || !day.openingTime || !day.closingTime) return [];
  const open = minutesOfDay(day.openingTime);
  const close = minutesOfDay(day.closingTime);
  if (!Number.isFinite(open) || !Number.isFinite(close) || open >= close) return [];
  const choices: string[] = [];
  for (let minute = Math.ceil(open / 15) * 15; minute + 10 <= close; minute += 15) {
    const time = minuteToTime(minute);
    if (new Date(`${day.date}T${time}:00+05:30`).getTime() > Date.now()) choices.push(time);
  }
  return choices;
}

function PickupCalendar({
  days,
  selected,
  onSelect,
}: {
  days: CheckoutPickupDay[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const groups = days.reduce<Array<{ month: string; days: CheckoutPickupDay[] }>>((result, day) => {
    const month = day.date.slice(0, 7);
    if (result[result.length - 1]?.month !== month) result.push({ month, days: [] });
    result[result.length - 1].days.push(day);
    return result;
  }, []);

  return (
    <div className="mt-3 space-y-4 sm:mt-4 sm:space-y-5">
      {groups.map((group) => {
        const first = group.days[0].date;
        const offset = new Date(`${first}T00:00:00Z`).getUTCDay();
        const monthLabel = new Date(`${first}T12:00:00+05:30`).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "Asia/Colombo",
        });
        return (
          <div key={group.month}>
            <p className="mb-3 text-sm font-semibold text-brand-ink">{monthLabel}</p>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name) => (
                <div key={name} className="py-1 text-center text-[10px] font-semibold text-brand-ink/40">{name}</div>
              ))}
              {Array.from({ length: offset }, (_, index) => <div key={`offset-${index}`} />)}
              {group.days.map((day) => {
                const active = selected === day.date;
                const today = day.date === sriLankaToday();
                const hasTime = pickupTimeOptions(day).length > 0;
                const available = day.isOpen && hasTime;
                const date = new Date(`${day.date}T12:00:00+05:30`);
                const label = date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  timeZone: "Asia/Colombo",
                });
                return (
                  <button
                    key={day.date}
                    type="button"
                    disabled={!available}
                    onClick={() => onSelect(day.date)}
                    aria-pressed={active}
                    aria-label={`${label}${available ? "" : " unavailable"}${day.reason ? `, ${day.reason}` : ""}`}
                    title={!day.isOpen ? day.reason || "Bakery closed" : !hasTime ? "No remaining collection times" : day.source === "EXCEPTION" ? "Special opening hours" : undefined}
                    className={`flex aspect-square min-h-9 flex-col items-center justify-center rounded-lg border px-0.5 text-[11px] font-semibold transition sm:min-h-12 sm:rounded-xl sm:text-sm ${
                      active
                        ? "border-brand-ink bg-brand-ink text-brand-bg shadow-sm"
                        : available
                          ? "border-brand-ink/10 bg-brand-bg/35 text-brand-ink hover:border-brand-ink/30 hover:bg-white"
                          : "cursor-not-allowed border-brand-ink/5 bg-brand-ink/[0.03] text-brand-ink/25"
                    }`}
                  >
                    <span>{date.getUTCDate()}</span>
                    {today && <span className={`mt-0.5 text-[8px] ${active ? "text-brand-bg/75" : "text-brand-ink/40"}`}>Today</span>}
                    {!day.isOpen && <span className="mt-0.5 text-[8px]">Closed</span>}
                    {available && day.source === "EXCEPTION" && (
                      <span className={`mt-0.5 text-[8px] ${active ? "text-brand-bg/75" : "text-brand-ink/50"}`}>Special</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
