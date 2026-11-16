/** @format */

import { Link } from "react-router-dom";
import { Banknote, Clock3, MessageCircle, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import Page from "../components/Page";

const sections = [
  {
    title: "Placing and confirming an order",
    Icon: PackageCheck,
    details: [
      "Submitting checkout successfully records an order request and provides an order number. It does not mean payment has been received, accepted, or verified.",
      "For bank-transfer orders, contact Baura Bakers using the WhatsApp confirmation action, follow the payment instructions provided by our team, and send a clear transfer receipt or payment slip together with your order number.",
      "Orders are confirmed for preparation and fulfillment only after Baura Bakers verifies successful payment and confirms the order. A screenshot or transfer slip alone is not conclusive proof of cleared funds.",
    ],
  },
  {
    title: "Payment, prices and receipts",
    Icon: Banknote,
    details: [
      "Product prices and the order total shown at checkout exclude independent third-party courier fees unless a separate fee is expressly itemized.",
      "Follow only payment instructions confirmed through Baura Bakers' verified communication channels. Keep your order number and transaction reference for support.",
      "If payment cannot be verified or an order cannot be fulfilled, Baura Bakers will contact you to resolve the issue in accordance with applicable consumer law.",
    ],
  },
  {
    title: "Bakery pickup and collection windows",
    Icon: Clock3,
    details: [
      "Available pickup dates and times are based on the bakery's published business calendar and may change for holidays, special hours or operational closures.",
      "A selected pickup time is a requested collection window, not a guarantee of readiness before payment confirmation. Wait for the team to confirm preparation or collection arrangements.",
      "Bring your order number when collecting, or provide it to an authorized person or courier collecting on your behalf.",
    ],
  },
  {
    title: "PickMe Flash, Uber Parcel and other third-party couriers",
    Icon: Truck,
    details: [
      "Customers may arrange their own available parcel courier, or request assistance from Baura Bakers to coordinate a pickup. Courier availability, service areas, timings and acceptance are controlled by the independent provider.",
      "The customer is responsible for the third-party courier cost, whether the courier is booked by the customer or coordinated with Baura Bakers. Unless specifically agreed otherwise, these charges are paid separately and are not included in the bakery order total.",
      "A courier should only be sent after Baura Bakers confirms the order is paid and ready. Share the order number and courier details with our team to coordinate handover.",
      "Third-party courier transport terms, tracking, delays and claims are governed by the relevant courier provider, subject to any legal rights you may have against Baura Bakers.",
    ],
  },
  {
    title: "Changes, cancellations and refunds",
    Icon: ShieldCheck,
    details: [
      "Contact Baura Bakers as early as possible if you need to amend or cancel an order. Changes depend on whether payment has been confirmed, preparation has begun and whether the requested items can still be modified.",
      "Personalized, made-to-order and perishable bakery products may have different cancellation or return limitations. Any restrictions will be applied subject to applicable Sri Lankan consumer protection law and mandatory customer rights.",
      "Where a refund is required by law or agreed by Baura Bakers, the team will communicate the applicable method and timeline. Third-party courier charges are subject to the courier's own rules and any applicable law.",
    ],
  },
  {
    title: "Questions and order support",
    Icon: MessageCircle,
    details: [
      "Use the Track Order link to review the order's recorded status. Tracking and order placement do not, by themselves, constitute payment confirmation.",
      "For questions about bank transfers, pickup times or courier coordination, contact Baura Bakers on WhatsApp and include your order number.",
    ],
  },
] as const;

export default function OrderPolicies() {
  return (
    <Page>
      <main className="mx-auto max-w-5xl pb-20">
        <header className="rounded-[1.75rem] border border-brand-ink/10 bg-white/65 px-5 py-9 shadow-sm sm:px-9">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-ink/45">Customer information</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">Ordering, payment & delivery policies</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-ink/65">How we handle online orders, payment confirmation, bakery collection and independent parcel couriers. Please review these terms before placing an order.</p>
          <p className="mt-3 text-xs text-brand-ink/45">Last updated: 16 November 2026</p>
        </header>
        <div className="mt-5 grid gap-4">
          {sections.map(({ title, Icon, details }, index) => (
            <section key={title} className="rounded-2xl border border-brand-ink/10 bg-white/60 p-5 sm:p-7">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-ink text-brand-bg"><Icon size={19} /></span><div><p className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink/40">Policy {String(index + 1).padStart(2, "0")}</p><h2 className="text-lg font-semibold text-brand-ink">{title}</h2></div></div>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-brand-ink/70">{details.map((detail) => <li key={detail} className="pl-4 [text-indent:-1rem]"><span className="mr-2 font-bold text-brand-ink/40">•</span>{detail}</li>)}</ul>
            </section>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3"><Link to="/order" className="inline-flex rounded-xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg">Return to checkout</Link><a href="https://wa.me/94769878770" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl border border-brand-ink/15 bg-white/70 px-5 py-3 text-sm font-semibold text-brand-ink">Ask us on WhatsApp</a></div>
        <p className="mt-6 text-xs leading-6 text-brand-ink/45">These website policies are draft customer-facing terms for business review. They do not replace legally required disclosures, any separate privacy policy, or mandatory rights under applicable law.</p>
      </main>
    </Page>
  );
}
