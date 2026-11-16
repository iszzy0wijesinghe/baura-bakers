/** @format */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  FileText,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
} from "lucide-react";

import logoUrl from "../assets/logo1.webp";
import { getAuthenticatedUser } from "../lib/accountApi";
import {
  claimDeviceOrdersForCurrentUser, getOrderTracking,
  type PublicOrderTracking,
} from "../lib/orders";

const WHATSAPP_NUMBER = "94769878770";
const COURIER_LOGOS = {
  PICKME_FLASH: "/checkout-partners/pickme-logo.webp",
  UBER_PARCEL: "/checkout-partners/uber-icon.webp",
} as const;
type Provider = keyof typeof COURIER_LOGOS;
type Arrangement = "SELF_PICKUP" | "CUSTOMER_COURIER" | "BAKERY_ASSISTED_COURIER";

const milestones = [
  { status: "NEW", title: "Order received", description: "Your order was successfully placed" },
  { status: "CONFIRMED", title: "Order confirmed", description: "Payment verified and order accepted" },
  { status: "PREPARING", title: "Being prepared", description: "Our team is preparing your order" },
  { status: "READY", title: "Ready for collection", description: "Your order is ready for handover" },
  { status: "COMPLETED", title: "Completed", description: "Your order has been fulfilled" },
] as const;

function money(n: unknown) { return `LKR ${Number(n ?? 0).toLocaleString("en-LK", { maximumFractionDigits: 2 })}`; }
function dateTime(value?: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
  }).format(date);
}
function scheduleDate(value?: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(`${value.slice(0, 10)}T12:00:00+05:30`);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo", weekday: "short", month: "short", day: "numeric", year: "numeric",
  }).format(date);
}
function timeLabel(value?: string | null) {
  if (!value) return "";
  const match = /^(\d{1,2}):(\d\d)/.exec(value);
  if (!match) return value;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
}
function paymentLabel(value: string) {
  return ({ PENDING_PAYMENT: "Payment pending", PAYMENT_STARTED: "Payment processing", PAID: "Payment verified", FAILED: "Payment unsuccessful", CANCELLED: "Payment cancelled" } as Record<string, string>)[value] ?? value.replaceAll("_", " ");
}
function statusLabel(value: string) {
  return ({ NEW: "Order received", CONFIRMED: "Order confirmed", PREPARING: "Being prepared", READY: "Ready for collection", DISPATCHED: "Dispatched", COMPLETED: "Completed", CANCELLED: "Cancelled" } as Record<string, string>)[value] ?? value.replaceAll("_", " ");
}
function collectionLabel(order: PublicOrderTracking) {
  if (order.fulfillment_type === "DELIVERY") return "Baura delivery";
  const type = order.collection_arrangement as Arrangement | null | undefined;
  if (type === "SELF_PICKUP") return "I'll collect";
  if (type === "CUSTOMER_COURIER") return "My courier";
  if (type === "BAKERY_ASSISTED_COURIER") return "Baura-assisted courier";
  return "Store pickup · arrangement not recorded";
}
function providerLabel(provider: string | null | undefined) {
  if (provider === "PICKME_FLASH") return "PickMe Flash";
  if (provider === "UBER_PARCEL") return "Uber Parcel";
  return null;
}
function escapeHtml(value: unknown) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function receiptHtml(order: PublicOrderTracking) {
  const paid = order.payment_status === "PAID";
  const isDelivery = order.fulfillment_type === "DELIVERY";
  const title = paid ? "Payment receipt" : "Order summary · payment pending";
  const rows = order.order_items.map(item => `<tr><td>${escapeHtml(item.product_name)}<small>${escapeHtml(item.size_label)} · ${escapeHtml(item.sugar_level || "Standard")}</small></td><td>${escapeHtml(item.quantity)}</td><td style="text-align:right">${escapeHtml(money(item.line_total_lkr))}</td></tr>`).join("");
  const subtotal = Number(order.subtotal_lkr || 0);
  const deliveryFee = Number(order.delivery_fee_lkr || 0);
  const total = order.order_total_lkr == null ? subtotal + deliveryFee : Number(order.order_total_lkr);
  const pickupSchedule = `${scheduleDate(order.pickup_date)} ${timeLabel(order.pickup_start_time)}`;
  const collection = collectionLabel(order);
  const provider = !isDelivery && order.collection_arrangement !== "SELF_PICKUP"
    ? providerLabel(order.courier_provider)
    : null;
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} ${escapeHtml(order.order_no)}</title><style>body{font-family:Arial,sans-serif;color:#38261b;background:#fff;padding:26px;max-width:760px;margin:auto}header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #38261b;padding-bottom:20px}h1{font-size:24px;margin:0}small{display:block;color:#887c70;margin-top:5px}table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:12px 6px;border-bottom:1px solid #e6ddd0;text-align:left;font-size:13px}p{line-height:1.6}dl{display:grid;grid-template-columns:150px 1fr;gap:10px;font-size:13px}dt{color:#887c70}dd{margin:0}footer{border-top:1px solid #e6ddd0;padding-top:15px;font-size:12px;color:#887c70}@media print{body{padding:0}}</style></head><body><header><div><h1>Baura Bakers</h1><p>${escapeHtml(title)}</p></div><strong>${escapeHtml(order.order_no)}</strong></header><p>Placed ${escapeHtml(dateTime(order.created_at))}<br>Payment: <strong>${escapeHtml(paymentLabel(order.payment_status))}</strong><br>Order status: ${escapeHtml(statusLabel(order.order_status))}</p><h2 style="font-size:16px">${isDelivery ? "Delivery details" : "Collection details"}</h2><dl><dt>Method</dt><dd>${escapeHtml(collection)}</dd>${provider ? `<dt>Courier</dt><dd>${escapeHtml(provider)}</dd>` : ""}<dt>Schedule</dt><dd>${escapeHtml(isDelivery ? `${order.delivery_date || ""} ${order.delivery_slot_label || ""}` : pickupSchedule)}</dd>${isDelivery ? `<dt>Address</dt><dd>${escapeHtml(order.delivery_address || "Not specified")}</dd>` : ""}</dl><h2 style="font-size:16px;margin-top:25px">Items</h2><table><thead><tr><th>Item</th><th>Qty</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table><dl><dt>Subtotal</dt><dd>${escapeHtml(money(subtotal))}</dd><dt>${isDelivery ? "Baura delivery fee" : "Bakery collection fee"}</dt><dd>${escapeHtml(isDelivery ? money(deliveryFee) : "Free")}</dd><dt><strong>Order total</strong></dt><dd><strong>${escapeHtml(money(total))}</strong></dd></dl>${!isDelivery && provider ? "<p><small>Third-party courier charges are paid separately by the customer and are not included above.</small></p>" : ""}${!paid ? "<p><strong>Payment is not yet verified.</strong> This is an order summary, not proof of payment.</p>" : ""}<footer>Thank you for choosing Baura Bakers. Order details are accurate as of the time this document was generated.</footer></body></html>`;
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return <div className="mb-3"><h2 className="text-[15px] font-semibold tracking-tight text-brand-ink sm:text-lg">{title}</h2>{subtitle && <p className="mt-0.5 text-[11px] text-brand-ink/55 sm:text-xs">{subtitle}</p>}</div>;
}
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex min-w-0 items-start justify-between gap-4 py-2.5 text-[12px] sm:text-sm"><span className="shrink-0 text-brand-ink/50">{label}</span><span className="min-w-0 text-right font-medium text-brand-ink">{children}</span></div>;
}

export default function OrderTracking() {
  const navigate = useNavigate();
  const { orderNo = "" } = useParams();
  const [params] = useSearchParams();
  const token = params.get("t");
  const [order, setOrder] = useState<PublicOrderTracking | null>(null);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [showItems, setShowItems] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await getAuthenticatedUser();
        if (!active) return;
        if (user) {
          await claimDeviceOrdersForCurrentUser();
          if (active) navigate("/orders", { replace: true });
          return;
        }
      } catch { /* Tracking remains available to guests with their valid link. */ }
      if (active) setCheckingAccount(false);
    })();
    return () => { active = false; };
  }, [navigate]);

  const loadOrder = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try {
      const value = await getOrderTracking(orderNo, token);
      setOrder(value ?? null);
      setError(value ? "" : "This order is not accessible with the current device or tracking link.");
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your order.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderNo, token]);

  useEffect(() => {
    if (checkingAccount) return;
    void loadOrder(true);
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadOrder(false);
    }, 15000);
    return () => window.clearInterval(id);
  }, [checkingAccount, loadOrder]);

  const paid = order?.payment_status === "PAID";
  const cancelled = order?.order_status === "CANCELLED";
  const delivery = order?.fulfillment_type === "DELIVERY";
  const provider = order?.courier_provider;
  const providerName = !delivery && order?.collection_arrangement !== "SELF_PICKUP" ? providerLabel(provider) : null;
  const progress = useMemo(() => {
    if (!order || cancelled) return -1;
    if (order.order_status === "DISPATCHED") return 3;
    return milestones.findIndex(item => item.status === order.order_status);
  }, [order, cancelled]);

  function downloadSummary() {
    if (!order) return;
    const documentHtml = receiptHtml(order);
    const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `baura-${order.payment_status === "PAID" ? "payment-receipt" : "order-summary"}-${order.order_no}.html`;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (checkingAccount || loading) return <main className="min-h-screen bg-brand-bg px-4 py-16 text-brand-ink"><div className="mx-auto max-w-3xl"><img src={logoUrl} alt="Baura Bakers" className="h-16 w-auto"/><div className="mt-10 h-1 w-full overflow-hidden rounded-full bg-brand-ink/10"><div className="h-full w-1/3 animate-pulse rounded-full bg-brand-ink"/></div><p className="mt-4 text-xs text-brand-ink/55">Loading your order…</p></div></main>;
  if (!order) return <main className="min-h-screen bg-brand-bg px-4 py-12 text-brand-ink"><div className="mx-auto max-w-xl"><img src={logoUrl} alt="Baura Bakers" className="h-16 w-auto"/><h1 className="mt-7 text-2xl font-semibold">Order unavailable</h1><p className="mt-3 text-sm leading-6 text-brand-ink/60">{error || "We couldn't find this order."}</p><div className="mt-6 flex flex-wrap gap-2"><button onClick={() => void loadOrder(true)} className="min-h-11 rounded-lg bg-brand-ink px-5 text-sm font-semibold text-brand-bg">Try again</button><Link to="/menu" className="inline-flex min-h-11 items-center rounded-lg border border-brand-ink/15 px-5 text-sm font-semibold">Back to menu</Link></div></div></main>;

  const total = order.order_total_lkr == null ? Number(order.subtotal_lkr || 0) + Number(order.delivery_fee_lkr || 0) : Number(order.order_total_lkr);
  const whatsappText = `Hello Baura Bakers, I need help with order ${order.order_no}. Payment status: ${paymentLabel(order.payment_status)}.`;
  return <main className="min-h-screen bg-brand-bg text-brand-ink">
    <header className="border-b border-brand-ink/10 bg-[#fffdf8]/65"><div className="mx-auto flex max-w-[1040px] items-center justify-between gap-3 px-4 py-3 sm:px-6"><Link to="/" className="flex items-center gap-2"><img src={logoUrl} alt="Baura Bakers" className="h-12 w-auto sm:h-14"/></Link><button type="button" onClick={() => void loadOrder(false)} disabled={refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-brand-ink/15 px-3 text-[12px] font-medium disabled:opacity-50"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""}/>Refresh</button></div></header>
    <div className="mx-auto max-w-[1040px] px-4 pb-12 pt-5 sm:px-6 sm:pt-8">
      <Link to="/menu" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-ink/60 hover:text-brand-ink"><ArrowLeft size={15}/> Back to menu</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-b border-brand-ink/10 pb-5 sm:pb-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-ink/40">Order details</p><div className="mt-1 flex items-center gap-2"><h1 className="text-[25px] font-semibold tracking-tight sm:text-[34px]">{order.order_no}</h1><button type="button" aria-label="Copy order number" onClick={() => { void navigator.clipboard?.writeText(order.order_no); setCopied(true); }} className="rounded-md p-2 text-brand-ink/50 hover:bg-brand-ink/5"><Copy size={14}/></button></div><p className="mt-1 text-[11px] text-brand-ink/50">Placed {dateTime(order.created_at)} {copied ? "· Copied" : ""}</p></div><div className="flex items-center gap-1.5 rounded-full bg-[#eee4d4] px-3 py-1.5 text-[11px] font-semibold"><Clock3 size={13}/>{cancelled ? "Cancelled" : statusLabel(order.order_status)}</div></div>
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-9">
        <div className="min-w-0 space-y-7">
          <section className="border-b border-brand-ink/10 pb-6"><SectionHeading title="Order progress" subtitle={cancelled ? "This order was cancelled" : !paid ? "Payment verification is required before preparation" : "Track how your order is progressing"}/>{cancelled ? <p className="text-[12px] text-brand-ink/65">Contact the bakery if you need assistance with this cancelled order.</p> : <ol className="space-y-0">{milestones.map((item, index) => { const complete = index <= progress; const active = index === progress; const pendingPayment = index === 1 && !paid; return <li key={item.status} className="relative flex min-h-[58px] gap-3 pb-3 last:min-h-0 last:pb-0"><div className="relative flex w-6 shrink-0 justify-center"><span className={`relative z-10 mt-0.5 grid h-5 w-5 place-items-center rounded-full border ${complete ? "border-brand-ink bg-brand-ink text-brand-bg" : "border-brand-ink/20 bg-brand-bg text-brand-ink/40"}`}>{complete ? <Check size={12}/> : <span className="h-1 w-1 rounded-full bg-current"/>}</span>{index < milestones.length-1 && <span className={`absolute left-[11px] top-5 bottom-0 w-px ${index < progress ? "bg-brand-ink" : "bg-brand-ink/15"}`}/>}</div><div className="min-w-0"><p className={`text-[12px] font-semibold sm:text-[13px] ${active || complete ? "text-brand-ink" : "text-brand-ink/45"}`}>{item.title}</p><p className="mt-0.5 text-[11px] leading-4 text-brand-ink/50">{pendingPayment ? "Waiting for verified payment" : item.description}</p></div></li>; })}</ol>}</section>
          <section className="border-b border-brand-ink/10 pb-6"><SectionHeading title={delivery ? "Delivery details" : "Collection details"}/><div className="divide-y divide-brand-ink/10"><DetailRow label="Method"><span className="inline-flex items-center justify-end gap-2">{delivery ? <Truck size={15}/> : <Store size={15}/>} {collectionLabel(order)}</span></DetailRow>{providerName && <DetailRow label="Courier"><span className="inline-flex items-center justify-end gap-2">{provider && provider in COURIER_LOGOS && <img src={COURIER_LOGOS[provider as Provider]} alt="" className="h-6 w-6 rounded-md border border-brand-ink/10 bg-white object-contain p-0.5"/>}{providerName}</span></DetailRow>}<DetailRow label="Scheduled for"><span className="inline-flex items-center justify-end gap-1.5"><CalendarClock size={14}/>{delivery ? `${scheduleDate(order.delivery_date)} ${order.delivery_slot_label || ""}` : `${scheduleDate(order.pickup_date)} · ${timeLabel(order.pickup_start_time)}`}</span></DetailRow>{delivery && order.delivery_address && <DetailRow label="Address">{order.delivery_address}</DetailRow>}</div>{!delivery && order.collection_arrangement !== "SELF_PICKUP" && providerName && <p className="mt-3 text-[11px] leading-5 text-brand-ink/55">Third-party courier charges are payable by the customer separately and are not part of the bakery total.</p>}{delivery && order.delivery_location_url && <a href={order.delivery_location_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-4"><MapPin size={14}/> Open location <ArrowUpRight size={13}/></a>}</section>
          <section><button type="button" aria-expanded={showItems} onClick={() => setShowItems(v => !v)} className="flex min-h-10 w-full items-center justify-between text-left"><h2 className="text-[15px] font-semibold sm:text-lg">Order summary</h2><span className="flex items-center gap-2 text-[11px] text-brand-ink/55">{order.order_items.length} items {showItems ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}</span></button>{showItems && <><div className="mt-2 divide-y divide-brand-ink/10 border-b border-brand-ink/10">{order.order_items.map((item,index) => <div key={`${index}-${item.product_name}`} className="flex items-start justify-between gap-3 py-3"><div className="min-w-0"><p className="text-[12px] font-semibold sm:text-[13px]">{item.product_name}</p><p className="mt-1 text-[11px] text-brand-ink/55">{item.size_label} · Qty {item.quantity}{item.sugar_level ? ` · ${item.sugar_level}` : ""}</p></div><strong className="shrink-0 text-[12px]">{money(item.line_total_lkr)}</strong></div>)}</div><div className="mt-2 divide-y divide-brand-ink/10"><DetailRow label="Subtotal">{money(order.subtotal_lkr)}</DetailRow><DetailRow label={delivery ? "Baura delivery fee" : "Bakery collection fee"}>{delivery ? money(order.delivery_fee_lkr) : "Free"}</DetailRow><DetailRow label="Total"><strong className="text-[16px]">{money(total)}</strong></DetailRow></div></>}</section>
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start"><div className="rounded-xl border border-brand-ink/10 bg-[#fffdf8] p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] text-brand-ink/50">Bakery order total</p><p className="mt-1 text-[25px] font-semibold tracking-tight">{money(total)}</p></div><FileText size={20} className="text-brand-ink/45"/></div><div className="mt-4 border-t border-brand-ink/10 pt-3"><p className="flex items-center gap-2 text-[12px] font-semibold"><ShieldCheck size={16}/>{paymentLabel(order.payment_status)}</p><p className="mt-1 text-[11px] leading-5 text-brand-ink/60">{paid ? "Payment verified. Refer to the order progress for preparation and collection status." : "Order saved, but payment has not been verified. Send your bank-transfer slip to the Baura Bakers team."}</p></div>{!paid && !cancelled && <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Baura Bakers, I would like to confirm payment for order ${order.order_no}. I will send my payment slip here.`)}`} target="_blank" rel="noopener noreferrer" className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-ink px-3 text-[12px] font-semibold text-brand-bg"><MessageCircle size={16}/>Confirm payment on WhatsApp <ArrowUpRight size={14}/></a>}<button type="button" onClick={downloadSummary} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand-ink/15 text-[12px] font-semibold"><FileText size={16}/>{paid ? "Download payment receipt" : "Download order summary"}</button><a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noopener noreferrer" className="mt-2 flex min-h-11 items-center justify-center gap-2 text-[12px] font-medium text-brand-ink/65"><UserRound size={15}/>Get order support</a></div>{lastUpdated && <p className="mt-2 text-center text-[10px] text-brand-ink/45">Auto-updating · Last checked {dateTime(lastUpdated)}</p>}{error && <p role="status" className="mt-2 text-xs text-amber-800">Refresh unsuccessful: {error}</p>}</aside>
      </div>
    </div>
  </main>;
}
