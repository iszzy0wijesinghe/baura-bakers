/** @format */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gift,
  LocateFixed,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
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
  type CheckoutQuote,
} from "../lib/checkoutApi";

const WHATSAPP_NUMBER = "94769878770";
const DELIVERY_METHOD = "Regular Baura delivery arrangement";

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
    | "deliverySlot",
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

  const qMatch = clean.match(
    /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
  );

  if (qMatch) {
    return {
      lat: Number(qMatch[1]),
      lng: Number(qMatch[2]),
    };
  }

  const atMatch = clean.match(
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  );

  if (atMatch) {
    return {
      lat: Number(atMatch[1]),
      lng: Number(atMatch[2]),
    };
  }

  return null;
}

function stepTitle(step: StepNo) {
  if (step === 1) return "Customer details";
  if (step === 2) return "Delivery location";
  if (step === 3) return "Delivery schedule";
  return "Review order";
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [savedOrderNo, setSavedOrderNo] = useState<string | null>(null);

  const savedOrderRef = useRef<
    Awaited<ReturnType<typeof createGuestOrder>> | null
  >(null);

  const saveOrderPromiseRef = useRef<
    Promise<Awaited<ReturnType<typeof createGuestOrder>>> | null
  >(null);

  const [deliverySlots, setDeliverySlots] = useState<
    CheckoutDeliverySlot[]
  >([]);

  const [selectedDeliverySlotId, setSelectedDeliverySlotId] =
    useState("");

  const [selectedDeliveryDate, setSelectedDeliveryDate] =
    useState("");

  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  const [maxDeliveryDistanceKm, setMaxDeliveryDistanceKm] =
    useState<number | null>(null);

  const [isExistingCustomerEmail, setIsExistingCustomerEmail] =
    useState(false);

  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const [dismissLoginPrompt, setDismissLoginPrompt] =
    useState(false);

  const [checkoutQuote, setCheckoutQuote] =
    useState<CheckoutQuote | null>(null);

  const [isCalculatingDistance, setIsCalculatingDistance] =
    useState(false);

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
    return items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
  }, [items]);

  const needsReceiver =
    form.hasDifferentReceiver || form.isGift;

  const selectedDeliverySlot = useMemo(() => {
    return (
      deliverySlots.find(
        (slot) => slot.id === selectedDeliverySlotId,
      ) || null
    );
  }, [deliverySlots, selectedDeliverySlotId]);

  const deliveryCalendarDays = useMemo(() => {
    const grouped = new Map<
      string,
      CheckoutDeliverySlot[]
    >();

    for (const slot of deliverySlots) {
      const current = grouped.get(slot.slot_date) || [];

      current.push(slot);
      grouped.set(slot.slot_date, current);
    }

    return Array.from(grouped.entries()).map(
      ([date, slots]) => ({
        date,
        slots: [...slots].sort((a, b) =>
          a.start_time.localeCompare(b.start_time),
        ),
      }),
    );
  }, [deliverySlots]);

  const selectedDateSlots = useMemo(() => {
    return (
      deliveryCalendarDays.find(
        (day) => day.date === selectedDeliveryDate,
      )?.slots || []
    );
  }, [deliveryCalendarDays, selectedDeliveryDate]);

  const effectiveDelivery = useMemo(() => {
    if (
      form.deliveryTarget === "RECEIVER" &&
      needsReceiver
    ) {
      return {
        name: form.receiverName,
        contactNumber: onlyDigitsPhone(
          form.receiverContactNumber,
        ),
        address: form.receiverAddress,
        locationUrl: form.receiverLocationUrl,
        lat: form.receiverLat,
        lng: form.receiverLng,
      };
    }

    return {
      name: form.senderName,
      contactNumber: onlyDigitsPhone(
        form.senderContactNumber,
      ),
      address: form.senderAddress,
      locationUrl: form.senderLocationUrl,
      lat: form.senderLat,
      lng: form.senderLng,
    };
  }, [form, needsReceiver]);

  const deliveryLocationCoords = useMemo(() => {
    if (
      effectiveDelivery.lat !== null &&
      effectiveDelivery.lng !== null
    ) {
      return {
        lat: effectiveDelivery.lat,
        lng: effectiveDelivery.lng,
      };
    }

    if (effectiveDelivery.locationUrl.trim()) {
      return extractLatLngFromGoogleMapsUrl(
        effectiveDelivery.locationUrl,
      );
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
      onlyDigitsPhone(
        form.senderContactNumber,
      ).trim().length >= 9 &&
      form.senderAddress.trim().length >= 5;

    if (!needsReceiver) {
      return senderValid;
    }

    const receiverValid =
      form.receiverName.trim().length >= 2 &&
      onlyDigitsPhone(
        form.receiverContactNumber,
      ).trim().length >= 9 &&
      form.receiverAddress.trim().length >= 5;

    return senderValid && receiverValid;
  }, [form, needsReceiver]);

  const deliveryAddressValid =
    effectiveDelivery.address.trim().length >= 5 &&
    Boolean(deliveryLocationCoords);

  const deliveryFeeLkr =
    checkoutQuote?.delivery_fee_lkr || 0;

  const finalTotalLkr = totalLkr + deliveryFeeLkr;

  const deliveryCostValid = Boolean(checkoutQuote);

  const scheduleValid =
    Boolean(selectedDeliverySlot) &&
    deliveryCostValid;

  const currentLocationUrl =
    form.deliveryTarget === "RECEIVER"
      ? form.receiverLocationUrl
      : form.senderLocationUrl;

  const currentMapUrl = deliveryLocationCoords
    ? `https://www.google.com/maps?q=${deliveryLocationCoords.lat},${deliveryLocationCoords.lng}&z=16&output=embed`
    : "";

  const cartLines = useMemo(() => {
    return items.map((item, index) => {
      const lineTotal =
        item.unitPriceLkr * item.quantity;

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
    async function loadLoggedInUserDetails() {
      try {
        setIsLoadingUser(true);

        const user = await getAuthenticatedUser();

        if (!user) return;

        setForm((previous) => ({
          ...previous,
          senderName:
            previous.senderName || user.name || "",
          senderEmail:
            previous.senderEmail || user.email || "",
          senderContactNumber:
            previous.senderContactNumber ||
            user.phone ||
            "",
          senderAddress:
            previous.senderAddress ||
            user.default_delivery_address ||
            "",
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

        const checkout =
          await getCheckoutBootstrap();

        setMaxDeliveryDistanceKm(
          checkout.max_delivery_distance_km,
        );

        const availableSlots = checkout.slots
          .filter(
            (slot) =>
              slot.is_available &&
              slot.remaining_orders > 0,
          )
          .sort((a, b) => {
            if (a.slot_date !== b.slot_date) {
              return a.slot_date.localeCompare(
                b.slot_date,
              );
            }

            return a.start_time.localeCompare(
              b.start_time,
            );
          });

        setDeliverySlots(availableSlots);

        setSelectedDeliverySlotId((current) =>
          availableSlots.some(
            (slot) => slot.id === current,
          )
            ? current
            : "",
        );

        setSelectedDeliveryDate((current) => {
          if (
            current &&
            availableSlots.some(
              (slot) =>
                slot.slot_date === current,
            )
          ) {
            return current;
          }

          return availableSlots[0]?.slot_date || "";
        });
      } catch (error) {
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

    const email = form.senderEmail
      .trim()
      .toLowerCase();

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

        const exists =
          await checkCustomerEmailExists(email);

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

    const timer = window.setTimeout(
      checkEmail,
      600,
    );

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [form.senderEmail]);

  useEffect(() => {
    let ignore = false;

    async function calculateDeliveryQuote() {
      if (
        !deliveryLocationCoords ||
        totalQuantity < 1
      ) {
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

        if (
          quote.distance_source === "ESTIMATED"
        ) {
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
  }, [deliveryLocationCoords, totalQuantity]);

  const whatsappMessage = useMemo(() => {
    const senderPhone = onlyDigitsPhone(
      form.senderContactNumber,
    );

    const receiverPhone = onlyDigitsPhone(
      form.receiverContactNumber,
    );

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
            `Gift Order: ${
              form.isGift ? "Yes" : "No"
            }`,
            `Name: ${form.receiverName || "-"}`,
            `Contact: ${receiverPhone || "-"}`,
            `Address: ${
              form.receiverAddress || "-"
            }`,
            "",
          ].join("\n")
        : "",
      "🚚 *Delivery*",
      `Deliver To: ${
        form.deliveryTarget === "RECEIVER"
          ? "Receiver"
          : "Sender"
      }`,
      `Address: ${
        effectiveDelivery.address || "-"
      }`,
      locationUrl
        ? `Location: ${locationUrl}`
        : "",
      selectedDeliverySlot
        ? `Schedule: ${formatSlot(
            selectedDeliverySlot,
          )}`
        : "",
      form.note.trim()
        ? `Note: ${form.note.trim()}`
        : "",
      "",
      "🛍️ *Items*",
      cartLines.length
        ? cartLines.join("\n")
        : "(No items)",
      "",
      checkoutQuote
        ? `📍 *Distance:* ${checkoutQuote.distance_km}km`
        : "",
      `🚚 *Delivery Fee:* ${formatLkr(
        deliveryFeeLkr,
      )}`,
      `💰 *Order Total:* ${formatLkr(
        finalTotalLkr,
      )}`,
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
  ]);

  function updateForm<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSubmitError("");
  }

  function clearFieldError(
    key: keyof FieldErrors,
  ) {
    setFieldErrors((previous) => {
      if (!previous[key]) return previous;

      const next = { ...previous };
      delete next[key];

      return next;
    });
  }

  function toggleDifferentReceiver(
    value: boolean,
  ) {
    setForm((previous) => ({
      ...previous,
      hasDifferentReceiver: value,
      isGift: value ? previous.isGift : false,
      deliveryTarget: value
        ? previous.deliveryTarget
        : "SENDER",
    }));

    setSubmitError("");
  }

  function toggleGift(value: boolean) {
    setForm((previous) => ({
      ...previous,
      isGift: value,
      hasDifferentReceiver: value
        ? true
        : previous.hasDifferentReceiver,
      deliveryTarget: value
        ? "RECEIVER"
        : previous.deliveryTarget,
    }));

    setSubmitError("");
  }

  function validateDetails() {
    const errors: FieldErrors = {};

    if (form.senderName.trim().length < 2) {
      errors.senderName =
        "Please enter your name.";
    }

    if (!isEmailLike(form.senderEmail)) {
      errors.senderEmail =
        "Enter a valid email address.";
    }

    if (
      onlyDigitsPhone(
        form.senderContactNumber,
      ).trim().length < 9
    ) {
      errors.senderContactNumber =
        "Enter a valid contact number.";
    }

    if (form.senderAddress.trim().length < 5) {
      errors.senderAddress =
        "Please enter your full address.";
    }

    if (needsReceiver) {
      if (
        form.receiverName.trim().length < 2
      ) {
        errors.receiverName =
          "Please enter the receiver's name.";
      }

      if (
        onlyDigitsPhone(
          form.receiverContactNumber,
        ).trim().length < 9
      ) {
        errors.receiverContactNumber =
          "Enter a valid receiver contact number.";
      }

      if (
        form.receiverAddress.trim().length < 5
      ) {
        errors.receiverAddress =
          "Please enter the receiver's address.";
      }
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function validateDelivery() {
    if (
      effectiveDelivery.address.trim().length < 5
    ) {
      setFieldErrors({
        deliveryLocation:
          "Add a complete delivery address before continuing.",
      });

      return false;
    }

    if (!deliveryLocationCoords) {
      setFieldErrors({
        deliveryLocation:
          "Add an exact map location using your current location or a Google Maps coordinate link.",
      });

      return false;
    }

    setFieldErrors({});

    return true;
  }

  function validateSchedule() {
    if (!selectedDeliverySlot) {
      setFieldErrors({
        deliverySlot:
          "Choose a delivery time before continuing.",
      });

      return false;
    }

    if (!checkoutQuote) {
      setSubmitError(
        "Your delivery fee is not ready yet. Check the delivery location and try again.",
      );

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

    if (step === 2 && !validateDelivery()) {
      return;
    }

    if (step === 3 && !validateSchedule()) {
      return;
    }

    setStep(
      (previous) =>
        Math.min(previous + 1, 4) as StepNo,
    );
  }

  function goBack() {
    setSubmitError("");
    setFieldErrors({});

    setStep(
      (previous) =>
        Math.max(previous - 1, 1) as StepNo,
    );
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

    if (
      target >= 3 &&
      !deliveryAddressValid
    ) {
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
      receiverContactNumber:
        previous.senderContactNumber,
      receiverAddress: previous.senderAddress,
      receiverLocationUrl:
        previous.senderLocationUrl,
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

  function useCurrentLocation(
    target: DeliveryTarget,
  ) {
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
        const lat = Number(
          position.coords.latitude.toFixed(7),
        );

        const lng = Number(
          position.coords.longitude.toFixed(7),
        );

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
    const coords =
      extractLatLngFromGoogleMapsUrl(value);

    if (
      form.deliveryTarget === "RECEIVER"
    ) {
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

  async function saveOrderOnce(
    paymentMethod: string,
  ) {
    if (savedOrderRef.current) {
      return savedOrderRef.current;
    }

    if (saveOrderPromiseRef.current) {
      return saveOrderPromiseRef.current;
    }

    if (!selectedDeliverySlot) {
      throw new Error(
        "Please choose a delivery time.",
      );
    }

    if (!deliveryLocationCoords) {
      throw new Error(
        "Please add an exact delivery location.",
      );
    }

    if (!checkoutQuote) {
      throw new Error(
        "Delivery pricing is not ready yet.",
      );
    }

    const fallbackLocationUrl =
      `https://www.google.com/maps?q=${deliveryLocationCoords.lat},${deliveryLocationCoords.lng}`;

    const request = createGuestOrder({
      orderNo: orderId,

      senderName: form.senderName,
      senderEmail: form.senderEmail,
      senderContactNumber: onlyDigitsPhone(
        form.senderContactNumber,
      ),
      senderAddress: form.senderAddress,
      senderLocationUrl:
        form.senderLocationUrl,
      senderLat: form.senderLat,
      senderLng: form.senderLng,

      hasDifferentReceiver: needsReceiver,
      isGift: form.isGift,

      receiverName: form.receiverName,
      receiverContactNumber: onlyDigitsPhone(
        form.receiverContactNumber,
      ),
      receiverAddress: form.receiverAddress,
      receiverLocationUrl:
        form.receiverLocationUrl,
      receiverLat: form.receiverLat,
      receiverLng: form.receiverLng,

      deliveryTarget: form.deliveryTarget,
      deliveryAddress:
        effectiveDelivery.address,
      deliveryLocationUrl:
        effectiveDelivery.locationUrl ||
        fallbackLocationUrl,
      deliveryLat: deliveryLocationCoords.lat,
      deliveryLng: deliveryLocationCoords.lng,
      deliverySlotId:
        selectedDeliverySlot.id,

      deliveryDate:
        selectedDeliverySlot.slot_date,
      deliverySlotLabel:
        selectedDeliverySlot.slot_label,
      deliverySlotStart:
        selectedDeliverySlot.start_time,
      deliverySlotEnd:
        selectedDeliverySlot.end_time,

      deliveryDistanceKm:
        checkoutQuote.distance_km,
      deliveryVehicleType:
        checkoutQuote.vehicle_type,
      deliveryFeeLkr:
        checkoutQuote.delivery_fee_lkr,
      deliveryPricingMode:
        checkoutQuote.pricing_mode,

      deliveryApp: DELIVERY_METHOD,
      paymentMethod,
      note: form.note,
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
    if (
      isSubmitting ||
      !items.length
    ) {
      return;
    }

    if (!validateDetails()) {
      setStep(1);
      return;
    }

    if (!validateDelivery()) {
      setStep(2);
      return;
    }

    if (!validateSchedule()) {
      setStep(3);
      return;
    }

    const whatsappTab = window.open(
      "about:blank",
      "_blank",
    );

    if (whatsappTab) {
      whatsappTab.opener = null;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const savedOrder = await saveOrderOnce(
        "BANK_TRANSFER_WHATSAPP",
      );

      const savedOrderNoForTracking =
        savedOrder.orderNo;

      const trackingUrl = savedOrder.trackingToken
        ? `${
            window.location.origin
          }/track/${encodeURIComponent(
            savedOrderNoForTracking,
          )}?t=${encodeURIComponent(
            savedOrder.trackingToken,
          )}`
        : `${
            window.location.origin
          }/track/${encodeURIComponent(
            savedOrderNoForTracking,
          )}`;

      const isLoggedIn =
        await getAuthenticatedUser()
          .then(Boolean)
          .catch(() => false);

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

      const whatsappUrl =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
          finalWhatsappMessage,
        )}`;

      clear();

      if (whatsappTab) {
        whatsappTab.location.href = whatsappUrl;
      } else {
        window.open(
          whatsappUrl,
          "_blank",
          "noopener,noreferrer",
        );
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

      console.error(
        "Bank transfer order failed:",
        error,
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn't save your order. Your cart is still safe — please try again.",
      );

      setIsSubmitting(false);
    }
  }

  const canGoNext =
    step === 1
      ? detailsValid
      : step === 2
        ? deliveryAddressValid
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
      label: "Delivery",
      icon: <MapPin size={15} />,
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

  if (!items.length && !savedOrderNo) {
    return (
      <Page>
        <section className="mx-auto max-w-xl rounded-[1.75rem] border border-brand-ink/10 bg-white/65 px-5 py-10 text-center shadow-sm backdrop-blur sm:px-8 sm:py-12">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-ink text-brand-bg">
            <ShoppingBag
              size={21}
              strokeWidth={1.8}
            />
          </div>

          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-ink/40">
            Checkout
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">
            Your cart is empty
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-brand-ink/60">
            Pick something delicious from the menu
            and come back when you're ready.
          </p>

          <Link
            to="/menu"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg transition hover:bg-brand-ink/90"
          >
            Explore menu
            <ChevronRight size={16} />
          </Link>
        </section>
      </Page>
    );
  }

  return (
    <Page>
      <div
        ref={stepTopRef}
        className="scroll-mt-24 pb-24 lg:pb-0"
      >
        <header className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-ink/40">
              Secure checkout
            </p>

            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">
              {stepTitle(step)}
            </h1>

            <p className="mt-1.5 max-w-xl text-sm leading-6 text-brand-ink/60">
              Complete your Baura order in four
              quick steps.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-brand-ink/10 bg-white/55 px-3 py-2 sm:self-auto">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink/40">
              Order
            </span>

            <span className="text-xs font-bold text-brand-ink">
              {orderId}
            </span>
          </div>
        </header>

        <div className="mb-5 overflow-x-auto pb-1 sm:mb-6">
          <div className="grid min-w-[520px] grid-cols-4 gap-2 sm:min-w-0">
            {stepMeta.map((item) => {
              const active = step === item.id;
              const done = step > item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    goToStep(item.id)
                  }
                  className={[
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition",
                    active
                      ? "border-brand-ink bg-brand-ink text-brand-bg shadow-sm"
                      : done
                        ? "border-brand-ink/15 bg-brand-bg/80 text-brand-ink"
                        : "border-brand-ink/10 bg-white/45 text-brand-ink/45 hover:bg-white/70",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                      active
                        ? "bg-white/10"
                        : done
                          ? "bg-brand-ink text-brand-bg"
                          : "bg-brand-ink/[0.05]",
                    ].join(" ")}
                  >
                    {done ? (
                      <Check size={14} />
                    ) : (
                      item.icon
                    )}
                  </span>

                  <span>
                    <span
                      className={[
                        "block text-[9px] font-semibold uppercase tracking-wider",
                        active
                          ? "text-brand-bg/55"
                          : "text-brand-ink/35",
                      ].join(" ")}
                    >
                      Step {item.id}
                    </span>

                    <span className="block text-xs font-semibold">
                      {item.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <main className="min-w-0">
            {submitError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
                {submitError}
              </div>
            )}

            <section className="rounded-[1.65rem] border border-brand-ink/10 bg-white/60 p-4 shadow-sm backdrop-blur sm:p-6">
              {step === 1 && (
                <div className="space-y-5">
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Your name"
                      error={fieldErrors.senderName}
                    >
                      <input
                        value={form.senderName}
                        onChange={(event) => {
                          updateForm(
                            "senderName",
                            event.target.value,
                          );
                          clearFieldError(
                            "senderName",
                          );
                        }}
                        className={inputClass(
                          Boolean(
                            fieldErrors.senderName,
                          ),
                        )}
                        placeholder="Full name"
                        autoComplete="name"
                      />
                    </Field>

                    <Field
                      label="Contact number"
                      error={
                        fieldErrors.senderContactNumber
                      }
                    >
                      <input
                        value={
                          form.senderContactNumber
                        }
                        onChange={(event) => {
                          updateForm(
                            "senderContactNumber",
                            event.target.value,
                          );
                          clearFieldError(
                            "senderContactNumber",
                          );
                        }}
                        className={inputClass(
                          Boolean(
                            fieldErrors.senderContactNumber,
                          ),
                        )}
                        placeholder="07X XXX XXXX"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </Field>
                  </div>

                  <Field
                    label="Email address"
                    error={fieldErrors.senderEmail}
                  >
                    <input
                      value={form.senderEmail}
                      onChange={(event) => {
                        updateForm(
                          "senderEmail",
                          event.target.value,
                        );
                        clearFieldError(
                          "senderEmail",
                        );
                      }}
                      className={inputClass(
                        Boolean(
                          fieldErrors.senderEmail,
                        ),
                      )}
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

                  {isExistingCustomerEmail &&
                    !dismissLoginPrompt && (
                      <div className="rounded-2xl border border-brand-ink/10 bg-brand-bg/70 p-4">
                        <p className="text-sm font-semibold text-brand-ink">
                          Welcome back
                        </p>

                        <p className="mt-1 text-xs leading-5 text-brand-ink/60">
                          There's already an account
                          using this email. You can sign
                          in for faster checkout or
                          continue as a guest.
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            to="/login"
                            className="rounded-xl bg-brand-ink px-4 py-2 text-xs font-semibold text-brand-bg"
                          >
                            Sign in
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              setDismissLoginPrompt(
                                true,
                              )
                            }
                            className="rounded-xl border border-brand-ink/15 bg-white/60 px-4 py-2 text-xs font-semibold text-brand-ink"
                          >
                            Continue as guest
                          </button>
                        </div>
                      </div>
                    )}

                  <Field
                    label="Your address"
                    error={
                      fieldErrors.senderAddress
                    }
                  >
                    <textarea
                      value={form.senderAddress}
                      onChange={(event) => {
                        updateForm(
                          "senderAddress",
                          event.target.value,
                        );
                        clearFieldError(
                          "senderAddress",
                        );
                      }}
                      className={`${inputClass(
                        Boolean(
                          fieldErrors.senderAddress,
                        ),
                      )} min-h-[88px] resize-y`}
                      placeholder="House number, street, city"
                      autoComplete="street-address"
                    />
                  </Field>

                  <div className="border-t border-brand-ink/10 pt-5">
                    <p className="text-sm font-semibold text-brand-ink">
                      Is someone else receiving it?
                    </p>

                    <p className="mt-1 text-xs leading-5 text-brand-ink/55">
                      Add receiver details for gifts or
                      deliveries to another person.
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <ToggleCard
                        active={
                          form.hasDifferentReceiver
                        }
                        icon={
                          <UserRound size={17} />
                        }
                        title="Different receiver"
                        description="Send the order to someone else."
                        onClick={() =>
                          toggleDifferentReceiver(
                            !form.hasDifferentReceiver,
                          )
                        }
                      />

                      <ToggleCard
                        active={form.isGift}
                        icon={<Gift size={17} />}
                        title="This is a gift"
                        description="We'll use the receiver's details."
                        onClick={() =>
                          toggleGift(
                            !form.isGift,
                          )
                        }
                      />
                    </div>
                  </div>

                  {needsReceiver && (
                    <div className="rounded-2xl border border-brand-ink/10 bg-brand-bg/55 p-4 sm:p-5">
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
                          onClick={
                            copySenderToReceiver
                          }
                          className="w-fit rounded-xl border border-brand-ink/15 bg-white/65 px-3 py-2 text-xs font-semibold text-brand-ink transition hover:bg-white"
                        >
                          Copy sender details
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Receiver name"
                          error={
                            fieldErrors.receiverName
                          }
                        >
                          <input
                            value={
                              form.receiverName
                            }
                            onChange={(event) => {
                              updateForm(
                                "receiverName",
                                event.target.value,
                              );
                              clearFieldError(
                                "receiverName",
                              );
                            }}
                            className={inputClass(
                              Boolean(
                                fieldErrors.receiverName,
                              ),
                            )}
                            placeholder="Full name"
                            autoComplete="off"
                          />
                        </Field>

                        <Field
                          label="Receiver contact"
                          error={
                            fieldErrors.receiverContactNumber
                          }
                        >
                          <input
                            value={
                              form.receiverContactNumber
                            }
                            onChange={(event) => {
                              updateForm(
                                "receiverContactNumber",
                                event.target.value,
                              );
                              clearFieldError(
                                "receiverContactNumber",
                              );
                            }}
                            className={inputClass(
                              Boolean(
                                fieldErrors.receiverContactNumber,
                              ),
                            )}
                            placeholder="07X XXX XXXX"
                            inputMode="tel"
                            autoComplete="off"
                          />
                        </Field>
                      </div>

                      <div className="mt-4">
                        <Field
                          label="Receiver address"
                          error={
                            fieldErrors.receiverAddress
                          }
                        >
                          <textarea
                            value={
                              form.receiverAddress
                            }
                            onChange={(event) => {
                              updateForm(
                                "receiverAddress",
                                event.target.value,
                              );
                              clearFieldError(
                                "receiverAddress",
                              );
                            }}
                            className={`${inputClass(
                              Boolean(
                                fieldErrors.receiverAddress,
                              ),
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
                <div className="space-y-5">
                  <StepHeader
                    eyebrow="Delivery"
                    title="Where should we deliver?"
                    description="Choose the recipient and pin the exact delivery location."
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ToggleCard
                      active={
                        form.deliveryTarget ===
                        "SENDER"
                      }
                      icon={<UserRound size={17} />}
                      title="My address"
                      description={
                        form.senderAddress ||
                        "Sender address"
                      }
                      onClick={() => {
                        updateForm(
                          "deliveryTarget",
                          "SENDER",
                        );
                        clearFieldError(
                          "deliveryLocation",
                        );
                      }}
                    />

                    <ToggleCard
                      active={
                        form.deliveryTarget ===
                        "RECEIVER"
                      }
                      disabled={!needsReceiver}
                      icon={<Gift size={17} />}
                      title="Receiver address"
                      description={
                        needsReceiver
                          ? form.receiverAddress ||
                            "Receiver address"
                          : "Add a receiver in step 1 first."
                      }
                      onClick={() => {
                        if (!needsReceiver) return;

                        updateForm(
                          "deliveryTarget",
                          "RECEIVER",
                        );

                        clearFieldError(
                          "deliveryLocation",
                        );
                      }}
                    />
                  </div>

                  <div className="rounded-2xl border border-brand-ink/10 bg-brand-bg/55 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-ink text-brand-bg">
                        <MapPin size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-ink/40">
                          Delivery address
                        </p>

                        <p className="mt-1 text-sm font-semibold leading-6 text-brand-ink">
                          {effectiveDelivery.address ||
                            "No address added"}
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
                          Use your device location or
                          paste a Google Maps coordinate
                          link.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          useCurrentLocation(
                            form.deliveryTarget,
                          )
                        }
                        disabled={isLocating}
                        className={[
                          "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition",
                          isLocating
                            ? "cursor-not-allowed bg-brand-ink/30 text-brand-bg"
                            : "bg-brand-ink text-brand-bg hover:bg-brand-ink/90",
                        ].join(" ")}
                      >
                        <LocateFixed size={15} />

                        {isLocating
                          ? "Locating…"
                          : "Use my location"}
                      </button>
                    </div>

                    <div className="mt-3">
                      <input
                        value={currentLocationUrl}
                        onChange={(event) =>
                          updateLocationUrl(
                            event.target.value,
                          )
                        }
                        className={inputClass(
                          Boolean(
                            fieldErrors.deliveryLocation,
                          ),
                        )}
                        placeholder="Google Maps coordinate link"
                        inputMode="url"
                      />

                      {fieldErrors.deliveryLocation && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          {
                            fieldErrors.deliveryLocation
                          }
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
                          <Check
                            size={14}
                            className="text-green-700"
                          />
                          Location added
                        </div>

                        <span className="text-[11px] text-brand-ink/40">
                          {deliveryLocationCoords.lat.toFixed(
                            5,
                          )}
                          ,{" "}
                          {deliveryLocationCoords.lng.toFixed(
                            5,
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-brand-ink/15 bg-white/35 px-5 py-8 text-center">
                      <MapPin
                        size={22}
                        className="mx-auto text-brand-ink/30"
                      />

                      <p className="mt-2 text-sm font-semibold text-brand-ink/70">
                        No map location yet
                      </p>

                      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-brand-ink/50">
                        An exact location is needed to
                        calculate your delivery fee.
                      </p>
                    </div>
                  )}

                  {isCalculatingDistance && (
                    <InfoBox tone="neutral">
                      Calculating delivery to this
                      location…
                    </InfoBox>
                  )}

                  {!isCalculatingDistance &&
                    checkoutQuote && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <MiniStat
                          label="Distance"
                          value={`${checkoutQuote.distance_km} km`}
                        />

                        <MiniStat
                          label="Delivery"
                          value={formatLkr(
                            checkoutQuote.delivery_fee_lkr,
                          )}
                        />

                        <MiniStat
                          label="Vehicle"
                          value={
                            checkoutQuote.vehicle_type
                          }
                        />
                      </div>
                    )}

                  {distanceNotice && (
                    <InfoBox tone="warning">
                      {distanceNotice}
                    </InfoBox>
                  )}

                  {maxDeliveryDistanceKm && (
                    <p className="text-xs leading-5 text-brand-ink/45">
                      Delivery is currently available
                      within{" "}
                      {maxDeliveryDistanceKm} km of
                      Baura Bakers.
                    </p>
                  )}

                  <Field label="Order note — optional">
                    <textarea
                      value={form.note}
                      onChange={(event) =>
                        updateForm(
                          "note",
                          event.target.value,
                        )
                      }
                      className={`${inputClass(
                        false,
                      )} min-h-[82px] resize-y`}
                      placeholder="Landmark, gift message or special delivery instruction"
                    />
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <StepHeader
                    eyebrow="Schedule"
                    title="When should it arrive?"
                    description="Choose one of the currently available delivery sessions."
                  />

                  {fieldErrors.deliverySlot && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {fieldErrors.deliverySlot}
                    </div>
                  )}

                  {isLoadingSlots ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[1, 2, 3, 4].map(
                        (item) => (
                          <div
                            key={item}
                            className="h-24 animate-pulse rounded-2xl border border-brand-ink/5 bg-brand-ink/[0.04]"
                          />
                        ),
                      )}
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
                            {
                              deliveryCalendarDays.length
                            }{" "}
                            days
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
                          {deliveryCalendarDays.map(
                            (day) => {
                              const active =
                                selectedDeliveryDate ===
                                day.date;

                              return (
                                <button
                                  key={day.date}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDeliveryDate(
                                      day.date,
                                    );

                                    setSelectedDeliverySlotId(
                                      "",
                                    );

                                    clearFieldError(
                                      "deliverySlot",
                                    );
                                  }}
                                  className={[
                                    "rounded-2xl border p-3 text-left transition",
                                    active
                                      ? "border-brand-ink bg-brand-ink text-brand-bg shadow-sm"
                                      : "border-brand-ink/10 bg-white/55 text-brand-ink hover:border-brand-ink/20 hover:bg-white/80",
                                  ].join(" ")}
                                >
                                  <span
                                    className={[
                                      "text-[9px] font-semibold uppercase tracking-[0.18em]",
                                      active
                                        ? "text-brand-bg/55"
                                        : "text-brand-ink/35",
                                    ].join(" ")}
                                  >
                                    {formatCalendarMonth(
                                      day.date,
                                    )}
                                  </span>

                                  <span className="mt-1 block text-2xl font-bold leading-none">
                                    {formatCalendarDayNumber(
                                      day.date,
                                    )}
                                  </span>

                                  <span
                                    className={[
                                      "mt-2 block text-[11px] font-medium",
                                      active
                                        ? "text-brand-bg/75"
                                        : "text-brand-ink/55",
                                    ].join(" ")}
                                  >
                                    {formatCalendarDate(
                                      day.date,
                                    )}
                                  </span>
                                </button>
                              );
                            },
                          )}
                        </div>
                      </div>

                      <div className="border-t border-brand-ink/10 pt-5">
                        <p className="text-sm font-semibold text-brand-ink">
                          Available times
                        </p>

                        <p className="mt-1 text-xs text-brand-ink/50">
                          {selectedDeliveryDate
                            ? formatCalendarDate(
                                selectedDeliveryDate,
                              )
                            : "Select a delivery day"}
                        </p>

                        {selectedDateSlots.length ? (
                          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                            {selectedDateSlots.map(
                              (slot) => {
                                const active =
                                  selectedDeliverySlotId ===
                                  slot.id;

                                return (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedDeliverySlotId(
                                        slot.id,
                                      );

                                      clearFieldError(
                                        "deliverySlot",
                                      );
                                    }}
                                    className={[
                                      "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                                      active
                                        ? "border-brand-ink bg-brand-ink text-brand-bg shadow-sm"
                                        : "border-brand-ink/10 bg-white/55 text-brand-ink hover:border-brand-ink/20 hover:bg-white/80",
                                    ].join(" ")}
                                  >
                                    <span
                                      className={[
                                        "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border",
                                        active
                                          ? "border-brand-bg/30 bg-brand-bg text-brand-ink"
                                          : "border-brand-ink/15 bg-white/60 text-transparent",
                                      ].join(" ")}
                                    >
                                      <Check
                                        size={13}
                                      />
                                    </span>

                                    <span className="min-w-0">
                                      <span className="block text-sm font-semibold">
                                        {
                                          slot.slot_label
                                        }
                                      </span>

                                      <span
                                        className={[
                                          "mt-1 block text-xs",
                                          active
                                            ? "text-brand-bg/70"
                                            : "text-brand-ink/50",
                                        ].join(" ")}
                                      >
                                        {slot.start_time.slice(
                                          0,
                                          5,
                                        )}{" "}
                                        –{" "}
                                        {slot.end_time.slice(
                                          0,
                                          5,
                                        )}
                                      </span>

                                      <span
                                        className={[
                                          "mt-1.5 block text-[10px] font-medium",
                                          active
                                            ? "text-brand-bg/55"
                                            : "text-brand-ink/35",
                                        ].join(" ")}
                                      >
                                        {
                                          slot.remaining_orders
                                        }{" "}
                                        place
                                        {slot.remaining_orders ===
                                        1
                                          ? ""
                                          : "s"}{" "}
                                        remaining
                                      </span>
                                    </span>
                                  </button>
                                );
                              },
                            )}
                          </div>
                        ) : (
                          <InfoBox
                            tone="warning"
                            className="mt-3"
                          >
                            No delivery times are
                            available on this date.
                          </InfoBox>
                        )}
                      </div>
                    </>
                  ) : (
                    <InfoBox tone="warning">
                      There are no delivery sessions
                      available right now. Please contact
                      Baura Bakers before placing your
                      order.
                    </InfoBox>
                  )}

                  <div className="border-t border-brand-ink/10 pt-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-brand-ink/10 bg-brand-bg/60 p-4">
                        <div className="flex items-center gap-2">
                          <Truck
                            size={16}
                            className="text-brand-ink/55"
                          />

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
                              {formatLkr(
                                deliveryFeeLkr,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-brand-ink/50">
                              {
                                checkoutQuote.distance_km
                              }{" "}
                              km delivery distance
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
                          {formatLkr(
                            finalTotalLkr,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-brand-bg/60">
                          Including delivery
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedDeliverySlot && (
                    <InfoBox tone="success">
                      <span className="font-semibold">
                        Selected:
                      </span>{" "}
                      {formatSlot(
                        selectedDeliverySlot,
                      )}
                    </InfoBox>
                  )}

                  {distanceNotice && (
                    <InfoBox tone="warning">
                      {distanceNotice}
                    </InfoBox>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <StepHeader
                    eyebrow="Review"
                    title="Everything look right?"
                    description="Review the important details before confirming your order."
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReviewCard
                      icon={
                        <UserRound size={17} />
                      }
                      title="Customer"
                    >
                      <p>{form.senderName}</p>
                      <p className="mt-1 text-brand-ink/55">
                        {form.senderContactNumber}
                      </p>
                      <p className="mt-1 break-all text-brand-ink/55">
                        {form.senderEmail}
                      </p>
                    </ReviewCard>

                    <ReviewCard
                      icon={<MapPin size={17} />}
                      title="Delivery"
                    >
                      <p>
                        {effectiveDelivery.name}
                      </p>

                      <p className="mt-1 text-brand-ink/55">
                        {
                          effectiveDelivery.address
                        }
                      </p>
                    </ReviewCard>

                    <ReviewCard
                      icon={<Clock3 size={17} />}
                      title="Schedule"
                    >
                      <p>
                        {formatSlot(
                          selectedDeliverySlot,
                        )}
                      </p>
                    </ReviewCard>

                    <ReviewCard
                      icon={<Truck size={17} />}
                      title="Delivery fee"
                    >
                      <p>
                        {formatLkr(
                          deliveryFeeLkr,
                        )}
                      </p>

                      {checkoutQuote && (
                        <p className="mt-1 text-brand-ink/55">
                          {
                            checkoutQuote.distance_km
                          }{" "}
                          km
                        </p>
                      )}
                    </ReviewCard>
                  </div>

                  {form.isGift && (
                    <div className="flex items-center gap-3 rounded-2xl border border-brand-ink/10 bg-brand-bg/60 px-4 py-3">
                      <Gift
                        size={17}
                        className="shrink-0 text-brand-ink/60"
                      />

                      <div>
                        <p className="text-sm font-semibold text-brand-ink">
                          Gift order
                        </p>

                        <p className="mt-0.5 text-xs text-brand-ink/55">
                          Delivering to{" "}
                          {form.receiverName}.
                        </p>
                      </div>
                    </div>
                  )}

                  {form.note.trim() && (
                    <ReviewCard
                      icon={
                        <MessageCircle
                          size={17}
                        />
                      }
                      title="Order note"
                    >
                      <p>{form.note.trim()}</p>
                    </ReviewCard>
                  )}

                  <div className="rounded-2xl border border-brand-ink/10 bg-brand-bg/65 p-4 sm:p-5">
                    <div className="space-y-2">
                      <PriceRow
                        label="Subtotal"
                        value={formatLkr(totalLkr)}
                      />

                      <PriceRow
                        label="Delivery"
                        value={formatLkr(
                          deliveryFeeLkr,
                        )}
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
                        {formatLkr(
                          finalTotalLkr,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-brand-ink/10 bg-white/50 p-4">
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
                          Your order will be saved first.
                          WhatsApp will then open with
                          your order details so Baura
                          Bakers can provide the bank
                          transfer details and confirm
                          your order.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      bankTransferViaWhatsApp
                    }
                    disabled={
                      isSubmitting ||
                      !items.length ||
                      !scheduleValid
                    }
                    className={[
                      "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition",
                      isSubmitting ||
                      !items.length ||
                      !scheduleValid
                        ? "cursor-not-allowed bg-brand-ink/30 text-brand-bg"
                        : "bg-brand-ink text-brand-bg shadow-sm hover:bg-brand-ink/90",
                    ].join(" ")}
                  >
                    <MessageCircle size={18} />

                    {isSubmitting
                      ? "Confirming your order…"
                      : "Confirm order & continue to WhatsApp"}
                  </button>

                  <p className="text-center text-[11px] leading-5 text-brand-ink/45">
                    Your cart is cleared only after the
                    order has been saved successfully.
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
                  ].join(" ")}
                >
                  <ChevronLeft size={16} />
                  Back
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-ink px-5 py-2.5 text-sm font-semibold text-brand-bg transition hover:bg-brand-ink/90"
                  >
                    Continue
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <Link
                    to="/cart"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-ink/15 px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:bg-brand-ink/[0.04]"
                  >
                    Edit cart
                  </Link>
                )}
              </div>
            </section>
          </main>

          <aside className="h-fit rounded-[1.65rem] border border-brand-ink/10 bg-white/60 p-4 shadow-sm backdrop-blur sm:p-5 lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-ink/40">
                  Your order
                </p>

                <p className="mt-1 text-sm font-semibold text-brand-ink">
                  {totalQuantity} item
                  {totalQuantity === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <Link
                to="/cart"
                className="rounded-lg border border-brand-ink/10 px-3 py-1.5 text-[11px] font-semibold text-brand-ink/65 transition hover:bg-brand-ink/[0.04]"
              >
                Edit
              </Link>
            </div>

            <div className="mt-4 max-h-[310px] space-y-2 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={`${item.productSlug}-${item.size.id}-${item.sugar}`}
                  className="rounded-xl border border-brand-ink/8 bg-white/45 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-brand-ink">
                        {item.productName}
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-brand-ink/50">
                        {item.size.label} ·{" "}
                        {item.sugar} sugar · Qty{" "}
                        {item.quantity}
                      </p>
                    </div>

                    <p className="shrink-0 text-xs font-semibold text-brand-ink">
                      {formatLkr(
                        item.unitPriceLkr *
                          item.quantity,
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-brand-ink/10 pt-4">
              <div className="space-y-2">
                <PriceRow
                  label="Subtotal"
                  value={formatLkr(totalLkr)}
                />

                <PriceRow
                  label="Delivery"
                  value={
                    checkoutQuote
                      ? formatLkr(deliveryFeeLkr)
                      : "Not calculated"
                  }
                  muted={!checkoutQuote}
                />
              </div>

              <div className="mt-4 flex items-end justify-between gap-3 border-t border-brand-ink/10 pt-4">
                <p className="text-sm font-bold text-brand-ink">
                  Total
                </p>

                <p className="text-lg font-bold text-brand-ink">
                  {formatLkr(finalTotalLkr)}
                </p>
              </div>
            </div>

            {selectedDeliverySlot && (
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
                      {formatSlot(
                        selectedDeliverySlot,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {checkoutQuote && (
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
                      {formatLkr(
                        deliveryFeeLkr,
                      )}{" "}
                      · {checkoutQuote.distance_km} km
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-ink/10 bg-brand-bg/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-brand-ink/15 bg-white/60 text-brand-ink"
                aria-label="Go back"
              >
                <ChevronLeft size={19} />
              </button>
            )}

            <div className="min-w-0 flex-1">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-ink px-5 text-sm font-semibold text-brand-bg"
                >
                  Continue
                  <ChevronRight size={17} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={
                    bankTransferViaWhatsApp
                  }
                  disabled={
                    isSubmitting ||
                    !items.length ||
                    !scheduleValid
                  }
                  className={[
                    "flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold",
                    isSubmitting ||
                    !items.length ||
                    !scheduleValid
                      ? "cursor-not-allowed bg-brand-ink/30 text-brand-bg"
                      : "bg-brand-ink text-brand-bg",
                  ].join(" ")}
                >
                  <MessageCircle size={17} />

                  {isSubmitting
                    ? "Confirming…"
                    : "Confirm & WhatsApp"}
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
    "w-full rounded-xl border bg-white/65 px-3.5 py-3 text-sm text-brand-ink outline-none transition placeholder:text-brand-ink/30 focus:bg-white focus:ring-2",
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
    <div className="border-b border-brand-ink/10 pb-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-ink/40">
        {eyebrow}
      </p>

      <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-brand-ink sm:text-2xl">
        {title}
      </h2>

      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-brand-ink/60">
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
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-brand-ink/65">
        {label}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
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
        "flex min-h-[86px] items-start gap-3 rounded-2xl border p-3.5 text-left transition",
        disabled
          ? "cursor-not-allowed border-brand-ink/5 bg-brand-ink/[0.02] text-brand-ink/30"
          : active
            ? "border-brand-ink bg-brand-ink text-brand-bg shadow-sm"
            : "border-brand-ink/10 bg-white/50 text-brand-ink hover:border-brand-ink/20 hover:bg-white/75",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
          active
            ? "bg-white/10 text-brand-bg"
            : "bg-brand-ink/[0.05] text-brand-ink/55",
        ].join(" ")}
      >
        {icon}
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {title}

          {active && (
            <Check
              size={14}
              className="shrink-0"
            />
          )}
        </span>

        <span
          className={[
            "mt-1 block line-clamp-2 text-xs leading-5",
            active
              ? "text-brand-bg/65"
              : "text-brand-ink/50",
          ].join(" ")}
        >
          {description}
        </span>
      </span>
    </button>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-brand-ink/10 bg-white/50 px-3.5 py-3">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-brand-ink/35">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-brand-ink">
        {value}
      </p>
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
    <div className="rounded-2xl border border-brand-ink/10 bg-white/50 p-4">
      <div className="flex items-center gap-2 text-brand-ink/50">
        {icon}

        <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">
          {title}
        </p>
      </div>

      <div className="mt-3 break-words text-sm font-medium leading-6 text-brand-ink">
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
      <p className="text-xs font-medium text-brand-ink/55">
        {label}
      </p>

      <p
        className={[
          "text-xs font-semibold",
          muted
            ? "text-brand-ink/40"
            : "text-brand-ink",
        ].join(" ")}
      >
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
        "rounded-xl border px-4 py-3 text-xs leading-5 sm:text-sm sm:leading-6",
        toneClass,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}