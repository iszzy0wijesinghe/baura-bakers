import { Link} from "react-router-dom";
import { X } from "lucide-react";
import { useCart } from "../app/cart";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

const WHATSAPP_NUMBER = "94764433616"; // ✅ no + for wa.me

const pickmeFoodLogo = "../../images/logos/pickme-food2.webp";
const uberEatsLogo = "../../images/logos/ubereats.webp";

type FormState = {
  customerName: string;
  contactNumber: string;
  customerAddress: string;
  deliveryAddress: string;
  note: string;
};

type DeliveryApp = "PickMe Food" | "Uber Eats";

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
  const { items } = useCart();

  const totalLkr = useMemo(() => {
    return items.reduce((sum, it) => sum + it.unitPriceLkr * it.quantity, 0);
  }, [items]);

  const [open, setOpen] = useState(false);
  const [orderId] = useState(() => makeOrderId());
  const [deliveryApp, setDeliveryApp] = useState<DeliveryApp>("PickMe Food");

  const [form, setForm] = useState<FormState>({
    customerName: "",
    contactNumber: "",
    customerAddress: "",
    deliveryAddress: "",
    note: "",
  });

  // lock scroll when modal open (prevents weird gaps / scroll bleed)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const canSubmit = useMemo(() => {
    return (
      form.customerName.trim().length >= 2 &&
      onlyDigitsPhone(form.contactNumber).trim().length >= 9 &&
      form.customerAddress.trim().length >= 5 &&
      form.deliveryAddress.trim().length >= 5
    );
  }, [form]);

  const cartLines = useMemo(() => {
    return items.map((it, idx) => {
      const lineTotal = it.unitPriceLkr * it.quantity;
      return `${idx + 1}. ${it.productName} • ${it.size.label} • Sugar: ${
        it.sugar
      } • Qty: ${it.quantity} • ${formatLkr(lineTotal)}`;
    });
  }, [items]);

  const message = useMemo(() => {
    const safePhone = onlyDigitsPhone(form.contactNumber);

    return [
      "🧁 *Baura Bakers — New Order*",
      `🆔 *Order ID:* ${orderId}`,
      "",
      "👤 *Customer Details*",
      `Name: ${form.customerName || "-"}`,
      `Contact: ${safePhone || "-"}`,
      `Address: ${form.customerAddress || "-"}`,
      `Delivery Address: ${form.deliveryAddress || "-"}`,
      `Delivery app: ${deliveryApp}`,
      form.note.trim() ? `Note: ${form.note.trim()}` : "",
      "",
      "🛍️ *Order Items*",
      cartLines.length ? cartLines.join("\n") : "(No cart items found)",
      "",
      `💰 *Total:* ${formatLkr(totalLkr)}`,
      "",
      "🚚 *Delivery:* PickMe Food / Uber Eats (in-range) • PickMe Flash (WhatsApp)",
    ]
      .filter(Boolean)
      .join("\n");
  }, [form, orderId, cartLines, totalLkr, deliveryApp]);

  function openModal() {
    setOpen(true);
  }

  function placeViaWhatsApp() {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message,
    )}`;
    window.location.href = url;
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Order
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-ink/75">
          Calm, simple ordering. Fill your details — we’ll confirm fast via
          WhatsApp.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        {/* FORM */}
        <section className="rounded-3xl border border-black/10 bg-white/50 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="grid gap-5">
            {/* Customer name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
                CUSTOMER NAME
              </label>
              <input
                value={form.customerName}
                onChange={(e) =>
                  setForm((s) => ({ ...s, customerName: e.target.value }))
                }
                className="w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            {/* Contact number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
                CONTACT NUMBER
              </label>
              <input
                value={form.contactNumber}
                onChange={(e) =>
                  setForm((s) => ({ ...s, contactNumber: e.target.value }))
                }
                className="w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
                placeholder="07X XXXX XXX (or +94...)"
                inputMode="tel"
                autoComplete="tel"
              />
              <p className="text-[11px] text-brand-ink/60">
                Tip: Use WhatsApp number for faster confirmation.
              </p>
            </div>

            {/* Customer address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
                CUSTOMER ADDRESS
              </label>
              <textarea
                value={form.customerAddress}
                onChange={(e) =>
                  setForm((s) => ({ ...s, customerAddress: e.target.value }))
                }
                className="min-h-[92px] w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
                placeholder="Your home address"
              />
            </div>

            {/* Delivery address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
                DELIVERY ADDRESS
              </label>
              <textarea
                value={form.deliveryAddress}
                onChange={(e) =>
                  setForm((s) => ({ ...s, deliveryAddress: e.target.value }))
                }
                className="min-h-[92px] w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
                placeholder="Where should we deliver?"
              />
              <p className="text-[11px] text-brand-ink/60">
                Delivery is arranged via PickMe Food / Uber Eats. Out of range →
                PickMe Flash via WhatsApp.
              </p>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
                NOTE (OPTIONAL)
              </label>
              <textarea
                value={form.note}
                onChange={(e) =>
                  setForm((s) => ({ ...s, note: e.target.value }))
                }
                className="min-h-[80px] w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
                placeholder="Any preferences? time, toppings, message, etc."
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link to="/menu" className="text-sm text-brand-ink/70 underline">
                ← View menu
              </Link>

              <button
                type="button"
                onClick={openModal}
                disabled={!canSubmit}
                className={[
                  "rounded-2xl px-5 py-3 text-sm font-semibold transition",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
                  canSubmit
                    ? "bg-brand-ink text-brand-bg hover:bg-brand-ink/95"
                    : "cursor-not-allowed bg-black/10 text-brand-ink/40",
                ].join(" ")}
              >
                Order now
              </button>
            </div>

            {!canSubmit && (
              <p className="text-[11px] text-brand-ink/60">
                Please fill name, contact number, and both addresses to
                continue.
              </p>
            )}
          </div>
        </section>
        {/* SUMMARY */}
        <aside className="rounded-3xl border border-black/10 bg-white/50 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                ORDER SUMMARY
              </p>

              {/* ✅ Edit order -> Cart */}
              <Link
                to="/cart"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-ink/15 bg-white/45 px-3 py-2 text-xs font-semibold text-brand-ink/80 hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
              >
                Edit order
              </Link>
            </div>

            {items.length ? (
              <div className="space-y-3">
                {items.map((it) => (
                  <div
                    key={`${it.productSlug}-${it.size.id}-${it.sugar}`}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-black/10 bg-white/55 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">{it.productName}</p>
                      <p className="mt-1 text-xs text-brand-ink/70">
                        {it.size.label} • Sugar: {it.sugar} • Qty: {it.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-brand-ink/70">
                      {formatLkr(it.unitPriceLkr * it.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-black/10 bg-white/55 p-4 text-sm text-brand-ink/70">
                Your cart is empty. You can still place a custom order via
                WhatsApp.
              </div>
            )}

            <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-brand-bg/70 px-4 py-3">
              <p className="text-sm font-semibold text-brand-ink">Total</p>
              <p className="text-sm font-semibold text-brand-ink">
                {formatLkr(totalLkr)}
              </p>
            </div>

            <p className="text-[11px] text-brand-ink/60">
              Need to change items? Click{" "}
              <span className="font-semibold">Edit order</span> to go to the
              cart.
              <br />
              After you click <span className="font-semibold">Order now</span>,
              we’ll open WhatsApp with your full order details.
            </p>
          </div>
        </aside>
      </div>

      {/* MODAL (PORTAL to body to guarantee full-screen overlay) */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[2147483647] bg-black/60"
            style={{ width: "100vw", height: "100dvh" }}
            role="dialog"
            aria-modal="true"
            aria-label="Place order"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="grid h-full w-full place-items-center p-4 sm:p-6">
              <div className="w-full max-w-xl rounded-3xl border border-black/10 bg-brand-bg p-5 shadow-xl sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-ink">
                      Choose delivery option
                    </p>
                    <p className="mt-1 text-xs text-brand-ink/70">
                      PickMe Food / Uber Eats (in-range). PickMe Flash via
                      WhatsApp (out of range).
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-xl p-2 text-brand-ink/70 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Delivery app options */}
                <div className="mt-4 rounded-2xl border border-black/10 bg-white/55 p-4">
                  <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                    DELIVERY APP
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryApp("PickMe Food")}
                      className={[
                        "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
                        deliveryApp === "PickMe Food"
                          ? "border-brand-ink/35 bg-brand-bg/80"
                          : "border-brand-ink/15 bg-white/40 hover:bg-white/55",
                      ].join(" ")}
                    >
                      <img
                        src={pickmeFoodLogo}
                        alt="PickMe Food"
                        className="h-10 w-auto"
                        loading="lazy"
                        decoding="async"
                      />
                      <div>
                        <p className="text-sm font-semibold text-brand-ink">
                          PickMe Food
                        </p>
                        <p className="text-[11px] text-brand-ink/70">
                          Order via app (in-range)
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryApp("Uber Eats")}
                      className={[
                        "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
                        deliveryApp === "Uber Eats"
                          ? "border-brand-ink/35 bg-brand-bg/80"
                          : "border-brand-ink/15 bg-white/40 hover:bg-white/55",
                      ].join(" ")}
                    >
                      <img
                        src={uberEatsLogo}
                        alt="Uber Eats"
                        className="h-10 w-auto"
                        loading="lazy"
                        decoding="async"
                      />
                      <div>
                        <p className="text-sm font-semibold text-brand-ink">
                          Uber Eats
                        </p>
                        <p className="text-[11px] text-brand-ink/70">
                          Order via app (in-range)
                        </p>
                      </div>
                    </button>
                  </div>

                  <p className="mt-3 text-[11px] text-brand-ink/70">
                    Out of range? We’ll arrange{" "}
                    <span className="font-semibold">PickMe Flash</span> via
                    WhatsApp.
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-black/10 bg-white/55 p-4 text-xs text-brand-ink/80">
                  <p className="font-semibold">Order ID: {orderId}</p>
                  <p className="mt-2 text-brand-ink/70">
                    When you tap the button below, WhatsApp will open with your
                    full order details ready to send.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={placeViaWhatsApp}
                    className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
                  >
                    Order Via WhatsApp for PickMe Flash orders
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-brand-ink/25 bg-transparent px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
                  >
                    Back to edit
                  </button>
                </div>

                <p className="mt-4 text-[11px] text-brand-ink/60">
                  Note: WhatsApp message content is generated from your form +
                  cart items.
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// import { Link, useNavigate } from "react-router-dom";
// import { X } from "lucide-react";
// import { useCart } from "../app/cart";

// import { createPortal } from "react-dom";
// import { useEffect, useMemo, useState } from "react";

// const WHATSAPP_NUMBER = "94764433616"; // ✅ no + for wa.me

// const pickmeFoodLogo = "/images/logos/pickme-food2.webp";
// const uberEatsLogo = "/images/logos/ubereats.webp";

// type FormState = {
//   customerName: string;
//   contactNumber: string;
//   customerAddress: string;
//   deliveryAddress: string;
//   note: string;
// };

// type DeliveryApp = "PickMe Food" | "Uber Eats";

// function makeOrderId() {
//   const s = Math.random().toString(36).slice(2, 8).toUpperCase();
//   return `BB-${s}`;
// }

// function onlyDigitsPhone(v: string) {
//   return v.replace(/[^\d+]/g, "");
// }

// function formatLkr(n: number) {
//   return `LKR ${n.toLocaleString()}`;
// }

// export default function Order() {
//   const nav = useNavigate();
//   const { items } = useCart();

//   const totalLkr = useMemo(() => {
//     return items.reduce((sum, it) => sum + it.unitPriceLkr * it.quantity, 0);
//   }, [items]);

//   const [open, setOpen] = useState(false);
//   const [orderId] = useState(() => makeOrderId());
//   const [deliveryApp, setDeliveryApp] = useState<DeliveryApp>("PickMe Food");

//   const [form, setForm] = useState<FormState>({
//     customerName: "",
//     contactNumber: "",
//     customerAddress: "",
//     deliveryAddress: "",
//     note: "",
//   });

//   // lock scroll when modal open (prevents weird gaps / scroll bleed)
//   useEffect(() => {
//     if (!open) return;
//     const prev = document.body.style.overflow;
//     document.body.style.overflow = "hidden";
//     return () => {
//       document.body.style.overflow = prev;
//     };
//   }, [open]);

//   const canSubmit = useMemo(() => {
//     return (
//       form.customerName.trim().length >= 2 &&
//       onlyDigitsPhone(form.contactNumber).trim().length >= 9 &&
//       form.customerAddress.trim().length >= 5 &&
//       form.deliveryAddress.trim().length >= 5
//     );
//   }, [form]);

//   const cartLines = useMemo(() => {
//     return items.map((it, idx) => {
//       const lineTotal = it.unitPriceLkr * it.quantity;
//       return `${idx + 1}. ${it.productName} • ${it.size.label} • Sugar: ${
//         it.sugar
//       } • Qty: ${it.quantity} • ${formatLkr(lineTotal)}`;
//     });
//   }, [items]);

//   const message = useMemo(() => {
//     const safePhone = onlyDigitsPhone(form.contactNumber);

//     return [
//       "🧁 *Baura Bakers — New Order*",
//       `🆔 *Order ID:* ${orderId}`,
//       "",
//       "👤 *Customer Details*",
//       `Name: ${form.customerName || "-"}`,
//       `Contact: ${safePhone || "-"}`,
//       `Address: ${form.customerAddress || "-"}`,
//       `Delivery Address: ${form.deliveryAddress || "-"}`,
//       `Delivery app: ${deliveryApp}`,
//       form.note.trim() ? `Note: ${form.note.trim()}` : "",
//       "",
//       "🛍️ *Order Items*",
//       cartLines.length ? cartLines.join("\n") : "(No cart items found)",
//       "",
//       `💰 *Total:* ${formatLkr(totalLkr)}`,
//       "",
//       "🚚 *Delivery:* PickMe Food / Uber Eats (in-range) • PickMe Flash (WhatsApp)",
//     ]
//       .filter(Boolean)
//       .join("\n");
//   }, [form, orderId, cartLines, totalLkr, deliveryApp]);

//   function openModal() {
//     setOpen(true);
//   }

//   function placeViaWhatsApp() {
//     const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
//       message
//     )}`;
//     window.location.href = url;
//   }

//   return (
//     <div className="space-y-10">
//       <header className="space-y-2">
//         <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
//           Order
//         </h1>
//         <p className="max-w-2xl text-sm leading-relaxed text-brand-ink/75">
//           Calm, simple ordering. Fill your details — we’ll confirm fast via
//           WhatsApp.
//         </p>
//       </header>

//       <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
//         {/* FORM */}
//         <section className="rounded-3xl border border-black/10 bg-white/50 p-6 shadow-sm backdrop-blur sm:p-8">
//           <div className="grid gap-5">
//             {/* Customer name */}
//             <div className="space-y-1.5">
//               <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
//                 CUSTOMER NAME
//               </label>
//               <input
//                 value={form.customerName}
//                 onChange={(e) =>
//                   setForm((s) => ({ ...s, customerName: e.target.value }))
//                 }
//                 className="w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
//                 placeholder="Your name"
//                 autoComplete="name"
//               />
//             </div>

//             {/* Contact number */}
//             <div className="space-y-1.5">
//               <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
//                 CONTACT NUMBER
//               </label>
//               <input
//                 value={form.contactNumber}
//                 onChange={(e) =>
//                   setForm((s) => ({ ...s, contactNumber: e.target.value }))
//                 }
//                 className="w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
//                 placeholder="07X XXXX XXX (or +94...)"
//                 inputMode="tel"
//                 autoComplete="tel"
//               />
//               <p className="text-[11px] text-brand-ink/60">
//                 Tip: Use WhatsApp number for faster confirmation.
//               </p>
//             </div>

//             {/* Customer address */}
//             <div className="space-y-1.5">
//               <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
//                 CUSTOMER ADDRESS
//               </label>
//               <textarea
//                 value={form.customerAddress}
//                 onChange={(e) =>
//                   setForm((s) => ({ ...s, customerAddress: e.target.value }))
//                 }
//                 className="min-h-[92px] w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
//                 placeholder="Your home address"
//               />
//             </div>

//             {/* Delivery address */}
//             <div className="space-y-1.5">
//               <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
//                 DELIVERY ADDRESS
//               </label>
//               <textarea
//                 value={form.deliveryAddress}
//                 onChange={(e) =>
//                   setForm((s) => ({ ...s, deliveryAddress: e.target.value }))
//                 }
//                 className="min-h-[92px] w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
//                 placeholder="Where should we deliver?"
//               />
//               <p className="text-[11px] text-brand-ink/60">
//                 Delivery is arranged via PickMe Food / Uber Eats. Out of range →
//                 PickMe Flash via WhatsApp.
//               </p>
//             </div>

//             {/* Note */}
//             <div className="space-y-1.5">
//               <label className="text-xs font-semibold tracking-widest text-brand-ink/60">
//                 NOTE (OPTIONAL)
//               </label>
//               <textarea
//                 value={form.note}
//                 onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
//                 className="min-h-[80px] w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm outline-none placeholder:text-brand-ink/40 focus:border-brand-ink/30 focus:ring-2 focus:ring-brand-ink/10"
//                 placeholder="Any preferences? time, toppings, message, etc."
//               />
//             </div>

//             <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
//               <Link to="/menu" className="text-sm text-brand-ink/70 underline">
//                 ← View menu
//               </Link>

//               <button
//                 type="button"
//                 onClick={openModal}
//                 disabled={!canSubmit}
//                 className={[
//                   "rounded-2xl px-5 py-3 text-sm font-semibold transition",
//                   "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
//                   canSubmit
//                     ? "bg-brand-ink text-brand-bg hover:bg-brand-ink/95"
//                     : "cursor-not-allowed bg-black/10 text-brand-ink/40",
//                 ].join(" ")}
//               >
//                 Order now
//               </button>
//             </div>

//             {!canSubmit && (
//               <p className="text-[11px] text-brand-ink/60">
//                 Please fill name, contact number, and both addresses to continue.
//               </p>
//             )}
//           </div>
//         </section>

//         {/* SUMMARY */}
//         <aside className="rounded-3xl border border-black/10 bg-white/50 p-6 shadow-sm backdrop-blur sm:p-8">
//           <div className="space-y-4">
//             <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
//               ORDER SUMMARY
//             </p>

//             {items.length ? (
//               <div className="space-y-3">
//                 {items.map((it) => (
//                   <div
//                     key={`${it.productSlug}-${it.size.id}-${it.sugar}`}
//                     className="flex items-start justify-between gap-3 rounded-2xl border border-black/10 bg-white/55 p-4"
//                   >
//                     <div>
//                       <p className="text-sm font-semibold">{it.productName}</p>
//                       <p className="mt-1 text-xs text-brand-ink/70">
//                         {it.size.label} • Sugar: {it.sugar} • Qty: {it.quantity}
//                       </p>
//                     </div>
//                     <p className="text-xs font-semibold text-brand-ink/70">
//                       {formatLkr(it.unitPriceLkr * it.quantity)}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="rounded-2xl border border-black/10 bg-white/55 p-4 text-sm text-brand-ink/70">
//                 Your cart is empty. You can still place a custom order via WhatsApp.
//               </div>
//             )}

//             <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-brand-bg/70 px-4 py-3">
//               <p className="text-sm font-semibold text-brand-ink">Total</p>
//               <p className="text-sm font-semibold text-brand-ink">
//                 {formatLkr(totalLkr)}
//               </p>
//             </div>

//             <p className="text-[11px] text-brand-ink/60">
//               After you click <span className="font-semibold">Order now</span>, we’ll
//               open WhatsApp with your full order details.
//             </p>
//           </div>
//         </aside>
//       </div>

//       {/* MODAL (PORTAL to body to guarantee full-screen overlay) */}
//       {open &&
//         createPortal(
//           <div
//             className="fixed inset-0 z-[2147483647] bg-black/60"
//             style={{ width: "100vw", height: "100dvh" }}
//             role="dialog"
//             aria-modal="true"
//             aria-label="Place order"
//             onMouseDown={(e) => {
//               if (e.target === e.currentTarget) setOpen(false);
//             }}
//           >
//             <div className="grid h-full w-full place-items-center p-4 sm:p-6">
//               <div className="w-full max-w-xl rounded-3xl border border-black/10 bg-brand-bg p-5 shadow-xl sm:p-6">
//                 <div className="flex items-start justify-between gap-3">
//                   <div>
//                     <p className="text-sm font-semibold text-brand-ink">
//                       Choose delivery option
//                     </p>
//                     <p className="mt-1 text-xs text-brand-ink/70">
//                       PickMe Food / Uber Eats (in-range). PickMe Flash via WhatsApp
//                       (out of range).
//                     </p>
//                   </div>

//                   <button
//                     type="button"
//                     className="rounded-xl p-2 text-brand-ink/70 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
//                     onClick={() => setOpen(false)}
//                     aria-label="Close"
//                   >
//                     <X className="h-5 w-5" aria-hidden="true" />
//                   </button>
//                 </div>

//                 {/* Delivery app options */}
//                 <div className="mt-4 rounded-2xl border border-black/10 bg-white/55 p-4">
//                   <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
//                     DELIVERY APP
//                   </p>

//                   <div className="mt-3 grid gap-2 sm:grid-cols-2">
//                     <button
//                       type="button"
//                       onClick={() => setDeliveryApp("PickMe Food")}
//                       className={[
//                         "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
//                         "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
//                         deliveryApp === "PickMe Food"
//                           ? "border-brand-ink/35 bg-brand-bg/80"
//                           : "border-brand-ink/15 bg-white/40 hover:bg-white/55",
//                       ].join(" ")}
//                     >
//                       <img
//                         src={pickmeFoodLogo}
//                         alt="PickMe Food"
//                         className="h-10 w-auto"
//                         loading="lazy"
//                         decoding="async"
//                       />
//                       <div>
//                         <p className="text-sm font-semibold text-brand-ink">PickMe Food</p>
//                         <p className="text-[11px] text-brand-ink/70">
//                           Order via app (in-range)
//                         </p>
//                       </div>
//                     </button>

//                     <button
//                       type="button"
//                       onClick={() => setDeliveryApp("Uber Eats")}
//                       className={[
//                         "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
//                         "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
//                         deliveryApp === "Uber Eats"
//                           ? "border-brand-ink/35 bg-brand-bg/80"
//                           : "border-brand-ink/15 bg-white/40 hover:bg-white/55",
//                       ].join(" ")}
//                     >
//                       <img
//                         src={uberEatsLogo}
//                         alt="Uber Eats"
//                         className="h-10 w-auto"
//                         loading="lazy"
//                         decoding="async"
//                       />
//                       <div>
//                         <p className="text-sm font-semibold text-brand-ink">Uber Eats</p>
//                         <p className="text-[11px] text-brand-ink/70">
//                           Order via app (in-range)
//                         </p>
//                       </div>
//                     </button>
//                   </div>

//                   <p className="mt-3 text-[11px] text-brand-ink/70">
//                     Out of range? We’ll arrange{" "}
//                     <span className="font-semibold">PickMe Flash</span> via WhatsApp.
//                   </p>
//                 </div>

//                 <div className="mt-4 rounded-2xl border border-black/10 bg-white/55 p-4 text-xs text-brand-ink/80">
//                   <p className="font-semibold">Order ID: {orderId}</p>
//                   <p className="mt-2 text-brand-ink/70">
//                     When you tap the button below, WhatsApp will open with your full
//                     order details ready to send.
//                   </p>
//                 </div>

//                 <div className="mt-5 flex flex-wrap gap-3">
//                   <button
//                     type="button"
//                     onClick={placeViaWhatsApp}
//                     className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
//                   >
//                     Order Via WhatsApp for PickMe Flash orders
//                   </button>

//                   <button
//                     type="button"
//                     onClick={() => setOpen(false)}
//                     className="rounded-2xl border border-brand-ink/25 bg-transparent px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
//                   >
//                     Back to edit
//                   </button>
//                 </div>

//                 <p className="mt-4 text-[11px] text-brand-ink/60">
//                   Note: WhatsApp message content is generated from your form + cart items.
//                 </p>
//               </div>
//             </div>
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// }
