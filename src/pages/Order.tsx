/** @format */

import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useCart } from "../app/cart";
import Page from "../components/Page";
import { createGuestOrder } from "../lib/orders";
// import { startPayHerePayment } from "../lib/payhere";

const WHATSAPP_NUMBER = "94769878770";
const DELIVERY_METHOD = "Baura Bakers delivery arrangement";

type StepNo = 1 | 2 | 3;

type FormState = {
  customerName: string;
  customerEmail: string;
  contactNumber: string;
  billingAddress: string;
  deliveryAddress: string;
  deliveryLocationUrl: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  note: string;
};

function makeOrderId() {
  const s = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BB-${s}`;
}

function onlyDigitsPhone(v: string) {
  return v.replace(/[^\d+]/g, "");
}

function formatLkr(n: number) {
  return `LKR ${n.toLocaleString()}`;
}

export default function Order() {
  const navigate = useNavigate();
  const { items, clear } = useCart();

  const [step, setStep] = useState<StepNo>(1);
  const [orderId] = useState(() => makeOrderId());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [savedOrderNo, setSavedOrderNo] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    customerName: "",
    customerEmail: "",
    contactNumber: "",
    billingAddress: "",
    deliveryAddress: "",
    deliveryLocationUrl: "",
    deliveryLat: null,
    deliveryLng: null,
    note: "",
  });

  const totalLkr = useMemo(() => {
    return items.reduce((sum, it) => sum + it.unitPriceLkr * it.quantity, 0);
  }, [items]);

  const billingValid = useMemo(() => {
    return (
      form.customerName.trim().length >= 2 &&
      onlyDigitsPhone(form.contactNumber).trim().length >= 9 &&
      form.billingAddress.trim().length >= 5
    );
  }, [form]);

  const deliveryValid = useMemo(() => {
    return form.deliveryAddress.trim().length >= 5;
  }, [form.deliveryAddress]);

  const cartLines = useMemo(() => {
    return items.map((it, idx) => {
      const lineTotal = it.unitPriceLkr * it.quantity;
      return `${idx + 1}. ${it.productName} • ${it.size.label} • Sugar: ${
        it.sugar
      } • Qty: ${it.quantity} • ${formatLkr(lineTotal)}`;
    });
  }, [items]);

  const whatsappMessage = useMemo(() => {
    const safePhone = onlyDigitsPhone(form.contactNumber);

    return [
      "🧁 *Baura Bakers — Bank Transfer Order*",
      `🆔 *Order ID:* ${orderId}`,
      "",
      "👤 *Billing Details*",
      `Name: ${form.customerName || "-"}`,
      `Email: ${form.customerEmail || "-"}`,
      `Contact: ${safePhone || "-"}`,
      `Billing Address: ${form.billingAddress || "-"}`,
      "",
      "🚚 *Delivery Details*",
      `Delivery Address: ${form.deliveryAddress || "-"}`,
      form.deliveryLocationUrl
        ? `Exact Location: ${form.deliveryLocationUrl}`
        : "",
      form.note.trim() ? `Note: ${form.note.trim()}` : "",
      "",
      "🛍️ *Order Items*",
      cartLines.length ? cartLines.join("\n") : "(No cart items found)",
      "",
      `💰 *Total:* ${formatLkr(totalLkr)}`,
      "",
      "🏦 *Payment Method:* Bank transfer",
      "Please share bank transfer details and I will send the payment slip here.",
    ]
      .filter(Boolean)
      .join("\n");
  }, [form, orderId, cartLines, totalLkr]);

  const canGoNext =
    step === 1 ? billingValid : step === 2 ? deliveryValid : true;

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function goNext() {
    setSubmitError("");

    if (step === 1 && !billingValid) {
      setSubmitError("Please complete your billing details.");
      return;
    }

    if (step === 2 && !deliveryValid) {
      setSubmitError("Please complete your delivery address.");
      return;
    }

    setStep((prev) => Math.min(prev + 1, 3) as StepNo);
  }

  function goBack() {
    setSubmitError("");
    setStep((prev) => Math.max(prev - 1, 1) as StepNo);
  }

  function copyBillingToDelivery() {
    setForm((prev) => ({
      ...prev,
      deliveryAddress: prev.billingAddress,
    }));
  }

  function useCurrentLocation() {
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

        setForm((prev) => ({
          ...prev,
          deliveryLat: lat,
          deliveryLng: lng,
          deliveryLocationUrl: mapUrl,
        }));

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

  async function saveOrderOnce(paymentMethod: string) {
    if (savedOrderNo === orderId) {
      return;
    }

    const savedOrder = await createGuestOrder({
      orderNo: orderId,
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      contactNumber: onlyDigitsPhone(form.contactNumber),
      customerAddress: form.billingAddress,
      deliveryAddress: form.deliveryAddress,
      deliveryLocationUrl: form.deliveryLocationUrl,
      deliveryLat: form.deliveryLat,
      deliveryLng: form.deliveryLng,
      deliveryApp: DELIVERY_METHOD,
      paymentMethod,
      note: form.note,
      items,
    });

    console.log("Order saved successfully:", savedOrder);
    setSavedOrderNo(orderId);
  }

  async function payOnline() {
    setSubmitError(
      "Online card payment is coming soon. Please use Bank Transfer via WhatsApp for now.",
    );
  }

  async function bankTransferViaWhatsApp() {
    if (!billingValid || !deliveryValid || !items.length || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      await saveOrderOnce("BANK_TRANSFER_WHATSAPP");

      localStorage.setItem(
        "baura_completed_bank_transfer_v1",
        JSON.stringify({
          orderNo: orderId,
          savedAt: new Date().toISOString(),
        }),
      );

      clear();

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        whatsappMessage,
      )}`;

      window.location.href = url;
    } catch (error) {
      console.error("Bank transfer order failed:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Order could not be saved. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  const stepMeta = [
    {
      id: 1,
      label: "Step 1",
      title: "Billing details",
      shortTitle: "Billing",
    },
    {
      id: 2,
      label: "Step 2",
      title: "Delivery details",
      shortTitle: "Delivery",
    },
    {
      id: 3,
      label: "Step 3",
      title: "Confirm & pay",
      shortTitle: "Pay",
    },
  ] as const;

  return (
    <Page>
      <div className="space-y-5 sm:space-y-8">
        <header className="space-y-1.5 sm:space-y-2">
          <p className="text-[10px] font-semibold tracking-[0.26em] text-brand-ink/55 sm:text-xs sm:tracking-[0.28em]">
            CHECKOUT
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
            Complete your order
          </h1>
          <p className="hidden max-w-2xl text-sm leading-relaxed text-brand-ink/70 sm:block">
            Follow the steps below. Your cart will be cleared after the order is
            saved successfully.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr] lg:gap-6">
          <section className="rounded-3xl border border-black/10 bg-white/55 p-4 shadow-sm backdrop-blur sm:p-8">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {stepMeta.map((item) => {
                const active = step === item.id;
                const done = step > item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === 1) setStep(1);
                      if (item.id === 2 && billingValid) setStep(2);
                      if (item.id === 3 && billingValid && deliveryValid) {
                        setStep(3);
                      }
                    }}
                    className={[
                      "rounded-2xl border px-2 py-2.5 text-left transition sm:px-4 sm:py-3",
                      active
                        ? "border-brand-ink/35 bg-brand-ink text-brand-bg"
                        : done
                          ? "border-brand-ink/20 bg-brand-bg/80 text-brand-ink"
                          : "border-black/10 bg-white/45 text-brand-ink/55",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 sm:block">
                      <span
                        className={[
                          "grid h-7 w-7 shrink-0 place-items-center rounded-xl text-[11px] font-bold sm:hidden",
                          active
                            ? "bg-brand-bg/15 text-brand-bg"
                            : done
                              ? "bg-brand-ink text-brand-bg"
                              : "bg-white/70 text-brand-ink/50",
                        ].join(" ")}
                      >
                        {done ? "✓" : item.id}
                      </span>

                      <div className="min-w-0">
                        <p className="hidden text-[11px] font-semibold tracking-widest opacity-80 sm:block">
                          {item.label}
                        </p>
                        <p className="truncate text-[11px] font-semibold sm:mt-1 sm:text-sm">
                          <span className="sm:hidden">{item.shortTitle}</span>
                          <span className="hidden sm:inline">
                            {item.title}
                          </span>
                        </p>
                      </div>
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

            <div className="mt-5 sm:mt-6">
              {step === 1 && (
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-brand-ink sm:text-xl">
                      Billing details
                    </h2>
                    <p className="mt-1 text-sm text-brand-ink/65">
                      Used for order confirmation and receipt.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold tracking-widest text-brand-ink/60 sm:text-xs">
                        CUSTOMER NAME
                      </label>
                      <input
                        value={form.customerName}
                        onChange={(e) =>
                          updateForm("customerName", e.target.value)
                        }
                        className="w-full rounded-2xl border border-black/10 bg-white/65 px-3.5 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10 sm:px-4"
                        placeholder="Your name"
                        autoComplete="name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold tracking-widest text-brand-ink/60 sm:text-xs">
                        CONTACT NUMBER
                      </label>
                      <input
                        value={form.contactNumber}
                        onChange={(e) =>
                          updateForm("contactNumber", e.target.value)
                        }
                        className="w-full rounded-2xl border border-black/10 bg-white/65 px-3.5 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10 sm:px-4"
                        placeholder="07X XXXX XXX"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold tracking-widest text-brand-ink/60 sm:text-xs">
                      EMAIL OPTIONAL
                    </label>
                    <input
                      value={form.customerEmail}
                      onChange={(e) =>
                        updateForm("customerEmail", e.target.value)
                      }
                      className="w-full rounded-2xl border border-black/10 bg-white/65 px-3.5 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10 sm:px-4"
                      placeholder="For receipt and order updates"
                      type="email"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold tracking-widest text-brand-ink/60 sm:text-xs">
                      BILLING ADDRESS
                    </label>
                    <textarea
                      value={form.billingAddress}
                      onChange={(e) =>
                        updateForm("billingAddress", e.target.value)
                      }
                      className="min-h-[95px] w-full rounded-2xl border border-black/10 bg-white/65 px-3.5 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10 sm:min-h-[110px] sm:px-4"
                      placeholder="Your billing address"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-brand-ink sm:text-xl">
                      Delivery details
                    </h2>
                    <p className="mt-1 text-sm text-brand-ink/65">
                      Add delivery address and exact location.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyBillingToDelivery}
                    className="rounded-2xl border border-brand-ink/20 bg-white/55 px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-white/70"
                  >
                    Use billing address
                  </button>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold tracking-widest text-brand-ink/60 sm:text-xs">
                      DELIVERY ADDRESS
                    </label>
                    <textarea
                      value={form.deliveryAddress}
                      onChange={(e) =>
                        updateForm("deliveryAddress", e.target.value)
                      }
                      className="min-h-[100px] w-full rounded-2xl border border-black/10 bg-white/65 px-3.5 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10 sm:min-h-[120px] sm:px-4"
                      placeholder="Where should we deliver?"
                    />
                  </div>

                  <div className="rounded-3xl border border-black/10 bg-white/55 p-3.5 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-semibold tracking-widest text-brand-ink/60 sm:text-xs">
                          EXACT LOCATION
                        </p>
                        <p className="mt-1 text-xs text-brand-ink/65">
                          Use current location or paste a Google Maps link.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={useCurrentLocation}
                        disabled={isLocating}
                        className={[
                          "w-full rounded-2xl px-4 py-2.5 text-xs font-semibold sm:w-auto sm:py-2",
                          isLocating
                            ? "cursor-not-allowed bg-brand-ink/40 text-brand-bg"
                            : "bg-brand-ink text-brand-bg hover:bg-brand-ink/95",
                        ].join(" ")}
                      >
                        {isLocating ? "Getting location..." : "Use my location"}
                      </button>
                    </div>

                    <input
                      value={form.deliveryLocationUrl}
                      onChange={(e) =>
                        updateForm("deliveryLocationUrl", e.target.value)
                      }
                      className="mt-3 w-full rounded-2xl border border-black/10 bg-white/70 px-3.5 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10 sm:mt-4 sm:px-4"
                      placeholder="Paste Google Maps location link"
                    />

                    {form.deliveryLat && form.deliveryLng && (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white">
                        <iframe
                          title="Delivery location map"
                          className="h-48 w-full sm:h-56"
                          loading="lazy"
                          src={`https://www.google.com/maps?q=${form.deliveryLat},${form.deliveryLng}&z=16&output=embed`}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold tracking-widest text-brand-ink/60 sm:text-xs">
                      DELIVERY NOTE OPTIONAL
                    </label>
                    <textarea
                      value={form.note}
                      onChange={(e) => updateForm("note", e.target.value)}
                      className="min-h-[85px] w-full rounded-2xl border border-black/10 bg-white/65 px-3.5 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10 sm:min-h-[90px] sm:px-4"
                      placeholder="Landmarks, preferred time, special instructions..."
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-brand-ink sm:text-xl">
                      Confirm and choose payment
                    </h2>
                    <p className="mt-1 text-sm text-brand-ink/65">
                      Review and continue with payment.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-black/10 bg-brand-bg/75 p-4 sm:p-5">
                    <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                      ORDER ID
                    </p>
                    <p className="mt-1 text-lg font-semibold text-brand-ink">
                      {orderId}
                    </p>

                    <div className="mt-4 rounded-2xl border border-black/10 bg-white/55 p-3.5 text-sm text-brand-ink/75 sm:p-4">
                      Delivery will be arranged after order confirmation. For
                      bank transfer, continue to WhatsApp and send the payment
                      slip there.
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={payOnline}
                      disabled={isSubmitting || !items.length}
                      className={[
                        "rounded-2xl px-5 py-3.5 text-sm font-semibold text-brand-bg sm:py-4",
                        isSubmitting || !items.length
                          ? "cursor-not-allowed bg-brand-ink/50"
                          : "bg-brand-ink hover:bg-brand-ink/95",
                      ].join(" ")}
                    >
                      {isSubmitting ? "Starting..." : "Proceed to Pay Online"}
                    </button>

                    <button
                      type="button"
                      onClick={bankTransferViaWhatsApp}
                      disabled={isSubmitting || !items.length}
                      className={[
                        "rounded-2xl border px-5 py-3.5 text-sm font-semibold sm:py-4",
                        isSubmitting || !items.length
                          ? "cursor-not-allowed border-brand-ink/10 bg-black/5 text-brand-ink/40"
                          : "border-brand-ink/25 bg-white/55 text-brand-ink hover:bg-white/75",
                      ].join(" ")}
                    >
                      Bank Transfer via WhatsApp
                    </button>
                  </div>

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

              {step < 3 ? (
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

          <aside className="rounded-3xl border border-black/10 bg-white/55 p-4 shadow-sm backdrop-blur sm:p-8">
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
              <div className="mt-4 space-y-2.5 sm:space-y-3">
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
              <div className="mt-4 rounded-2xl border border-black/10 bg-white/60 p-4 text-sm text-brand-ink/70">
                Your cart is empty. Please add products before checkout.
              </div>
            )}

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-black/10 bg-brand-bg/75 px-4 py-3">
              <p className="text-sm font-semibold text-brand-ink">Total</p>
              <p className="text-sm font-semibold text-brand-ink">
                {formatLkr(totalLkr)}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-black/10 bg-white/55 p-3.5 text-xs leading-relaxed text-brand-ink/65 sm:mt-5 sm:p-4">
              Your cart will clear only after your order is saved successfully.
            </div>
          </aside>
        </div>
      </div>
    </Page>
  );
}