/** @format */

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

const BAURA_LOGO = "/logos/logo.webp";
const PRODUCT_IMAGE = "/how-to-order/sapphire-gild-birthday-cake.webp";
const PICKME_LOGO = "/checkout-partners/pickme-logo.webp";

const PHONE_WIDTH = 342;
const PHONE_HEIGHT = 520;

const orderingJourney = [
  {
    label: "Welcome",
    title: "Something good starts here.",
    description: "Find your next favourite, freshly made at Baura.",
  },
  {
    label: "Browse",
    title: "Find your favourite.",
    description: "Explore the menu and discover your perfect treat.",
  },
  {
    label: "Product",
    title: "Make it yours.",
    description: "Choose your cake and add it to your bag.",
  },
  {
    label: "Bag",
    title: "A bag full of good things.",
    description: "Review your favourites before checkout.",
  },
  {
    label: "Details",
    title: "A few details, please.",
    description: "Tell us who is placing the order.",
  },
  {
    label: "Collection",
    title: "Collect it your way.",
    description: "Choose personal collection or a courier arrangement.",
  },
  {
    label: "Schedule",
    title: "Pick your moment.",
    description: "Select an available date and time.",
  },
  {
    label: "Review",
    title: "One last look.",
    description: "Check everything before placing your order.",
  },
  {
    label: "WhatsApp",
    title: "Let's confirm the details.",
    description: "Contact Baura about payment through WhatsApp.",
  },
  {
    label: "Tracking",
    title: "Follow the good stuff.",
    description: "Keep an eye on your order's progress.",
  },
] as const;

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#9c8d7e]">
      {children}
    </p>
  );
}

function Action({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <button
      type="button"
      data-demo-action
      className={[
        "flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-[11px] font-semibold transition-transform active:scale-[0.98]",
        light
          ? "border border-[#e5dbce] bg-white text-[#38271d]"
          : "bg-[#38271d] text-white",
      ].join(" ")}>
      {children}
    </button>
  );
}

function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{eyebrow}</Label>
      <h3 className="text-[19px] font-bold leading-tight tracking-tight text-[#38271d]">
        {title}
      </h3>
      {description && (
        <p className="text-[10px] leading-relaxed text-[#918478]">
          {description}
        </p>
      )}
    </div>
  );
}

function Product({ small = false }: { small?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e9dfd2] bg-white p-3">
      <div className="overflow-hidden rounded-lg bg-[#f4eadf]">
        <img
          src={PRODUCT_IMAGE}
          alt="Sapphire Gild Birthday Cake"
          loading="lazy"
          className={`w-full object-cover ${small ? "h-24" : "h-44"}`}
        />
      </div>
      <p className="mt-2 text-[11px] font-semibold text-[#39291f]">
        Sapphire Gild Birthday Cake
      </p>
      <p className="mt-1 text-[10px] text-[#8e8073]">
        A beautifully crafted birthday cake.
      </p>
      <p className="mt-2 text-[11px] font-bold text-[#39291f]">1.5 kg</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-semibold text-[#89796a]">{label}</span>
      <div className="rounded-xl border border-[#e9dfd2] bg-white px-3 py-2.5 text-[11px] text-[#39291f]">
        {value}
      </div>
    </div>
  );
}

function CheckoutProgress({ active }: { active: number }) {
  const labels = ["Details", "Method", "Schedule", "Review"];

  return (
    <div className="mt-5 grid grid-cols-4 gap-1 border-b border-[#e8dfd4] pb-3">
      {labels.map((label, index) => (
        <div key={label} className="flex flex-col items-center gap-1">
          <span
            className={[
              "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
              index + 1 <= active
                ? "bg-[#38271d] text-white"
                : "bg-white text-[#a69b8e]",
            ].join(" ")}>
            {index + 1}
          </span>
          <span className="text-[8px] text-[#887b70]">{label}</span>
        </div>
      ))}
    </div>
  );
}

function Choice({
  icon,
  title,
  subtitle,
  active = false,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border p-3",
        active
          ? "border-[#38271d] bg-[#38271d] text-white"
          : "border-[#e7ded2] bg-white text-[#39291f]",
      ].join(" ")}>
      <div
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-white/15" : "bg-[#f4ede3]",
        ].join(" ")}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold">{title}</p>
        {subtitle && (
          <p
            className={`mt-0.5 text-[9px] ${
              active ? "text-white/65" : "text-[#928477]"
            }`}>
            {subtitle}
          </p>
        )}
      </div>
      {active && <Check size={14} />}
    </div>
  );
}

function HomepageScreen() {
  return (
    <div className="pb-6">
      <div className="-mx-4 -mt-4">
        <div className="relative h-[370px] overflow-hidden bg-[#362217]">
          <img
            src={PRODUCT_IMAGE}
            alt="Baura Bakers birthday cake"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#20120c]/95 via-[#20120c]/45 to-[#20120c]/10" />
          <div className="absolute inset-x-5 bottom-8">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/65">
              BAURA BAKERS
            </p>
            <h2 className="mt-3 text-[30px] font-semibold leading-[1.06] tracking-[-0.04em] text-white">
              Freshly baked.
              <br />
              Seriously
              <br />
              delicious.
            </h2>
            <p className="mt-3 max-w-[230px] text-[10px] leading-[1.7] text-white/75">
              Discover the little things that make every celebration sweeter.
            </p>
          </div>
        </div>
      </div>

      <div className="px-1 pb-7 pt-7">
        <Label>FRESH FROM BAURA</Label>
        <h3 className="mt-3 text-[21px] font-semibold leading-[1.15] tracking-tight text-[#38271d]">
          Made to look good.
          <br />
          Made to taste better.
        </h3>
        <p className="mt-3 text-[11px] leading-[1.8] text-[#887668]">
          Thoughtful ingredients, beautifully finished bakes, and something
          delicious for every occasion.
        </p>
      </div>

      <div className="space-y-3 border-t border-[#e9dfd3] py-6">
        <div className="flex items-end justify-between">
          <div>
            <Label>THE BAURA COLLECTION</Label>
            <h3 className="mt-2 text-[19px] font-semibold tracking-tight text-[#38271d]">
              Our favourites
            </h3>
          </div>
          <span className="text-[9px] font-medium text-[#8c7664]">
            Made fresh
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {["Signature cakes", "Sweet treats"].map((name, index) => (
            <div
              key={name}
              className="overflow-hidden rounded-xl border border-[#e8ded1] bg-white">
              <img
                src={PRODUCT_IMAGE}
                alt=""
                className={`h-[145px] w-full object-cover ${
                  index === 1 ? "scale-110" : ""
                }`}
              />
              <div className="relative bg-white p-2.5">
                <p className="text-[11px] font-semibold text-[#38271d]">
                  {name}
                </p>
                <p className="mt-1 text-[9px] text-[#948477]">
                  {index === 0 ? "For celebrations" : "A little indulgence"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#e9dfd3] py-7 text-center">
        <Label>THE BAURA EXPERIENCE</Label>
        <h3 className="mx-auto mt-3 max-w-[250px] text-[24px] font-semibold leading-[1.1] tracking-tight text-[#38271d]">
          That first bite
          <br />
          should be worth it.
        </h3>
        <p className="mx-auto mt-3 max-w-[245px] text-[10px] leading-[1.8] text-[#887668]">
          From freshly baked favourites to something made for a special day.
        </p>
      </div>

      <div className="rounded-2xl bg-[#ece0ce] px-4 py-6 text-center">
        <Label>READY FOR SOMETHING SWEET?</Label>
        <h3 className="mt-3 text-[23px] font-semibold leading-tight tracking-tight text-[#38271d]">
          Find your next
          <br />
          favourite.
        </h3>
        <p className="mx-auto mt-3 max-w-[230px] text-[10px] leading-[1.7] text-[#806e5e]">
          Browse the Signature Menu and choose what you'll love.
        </p>
        <button
          type="button"
          data-demo-action
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#38271d] px-4 py-3.5 text-[11px] font-semibold text-white">
          Explore the menu <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function MenuScreen() {
  return (
    <div className="space-y-4">
      <Heading
        eyebrow="BAURA BAKERS"
        title="Signature Menu"
        description="Fresh cakes, premium bakes, desserts, and more."
      />
      <div className="rounded-xl border border-[#eadfce] bg-[#f8f1e6] p-3">
        <Label>Browse menu</Label>
        <div className="mt-2 rounded-lg bg-white px-3 py-2.5 text-[10px] text-[#b1a497]">
          Search cakes, desserts...
        </div>
        <div className="mt-3 flex gap-2">
          <span className="rounded-lg bg-[#38271d] px-3 py-2 text-[10px] text-white">
            All items
          </span>
          <span className="rounded-lg bg-white px-3 py-2 text-[10px] text-[#766759]">
            Cakes
          </span>
        </div>
      </div>
      <Label>Today's selection</Label>
      <Product />
      <Action>
        View product <ArrowRight size={13} />
      </Action>
    </div>
  );
}

function ProductScreen() {
  return (
    <div className="space-y-4">
      <Heading
        eyebrow="OUR CAKES"
        title="Your next favourite"
        description="Take a closer look before adding it to your bag."
      />
      <Product />
      <div className="space-y-3 rounded-xl bg-[#f7f0e5] p-3">
        <Label>Select your size</Label>
        <div className="rounded-lg border border-[#6b4d36] bg-white px-3 py-2 text-[11px] font-semibold text-[#38271d]">
          1.5 kg <Check size={12} className="float-right" />
        </div>
        <Label>Quantity</Label>
        <div className="inline-flex gap-5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#38271d]">
          <span>−</span>
          <span>1</span>
          <span>+</span>
        </div>
        <Action>
          <ShoppingBag size={13} /> Add to bag
        </Action>
      </div>
    </div>
  );
}

function BagScreen() {
  return (
    <div className="space-y-4">
      <Heading
        eyebrow="YOUR BAG"
        title="Your Baura bag"
        description="Everything looks good? You're just a few steps away."
      />
      <Label>Your items</Label>
      <div className="flex gap-3 rounded-xl border border-[#e9dfd2] bg-white p-3">
        <img
          src={PRODUCT_IMAGE}
          alt=""
          className="h-20 w-20 rounded-lg object-cover"
        />
        <div className="flex-1 space-y-2">
          <p className="text-[11px] font-semibold text-[#38271d]">
            Sapphire Gild Birthday Cake
          </p>
          <p className="text-[9px] text-[#9a8d80]">1.5 kg · Qty 1</p>
          <p className="text-[11px] font-bold text-[#38271d]">
            Ready for checkout
          </p>
        </div>
      </div>
      <div className="rounded-xl bg-[#f7f0e5] p-4">
        <div className="flex justify-between text-[11px] text-[#6c5c4e]">
          <span>Collection</span>
          <span>FREE</span>
        </div>
        <p className="mt-3 border-t border-[#e3d8ca] pt-3 text-xs font-bold text-[#38271d]">
          Review your total at checkout
        </p>
      </div>
      <Action>
        Checkout <ArrowRight size={13} />
      </Action>
    </div>
  );
}

function DetailsScreen() {
  return (
    <div className="space-y-4">
      <Heading
        eyebrow="SECURE CHECKOUT"
        title="Customer details"
        description="A few details, your preferred collection time, then you're done."
      />
      <CheckoutProgress active={1} />
      <Label>Receive your order</Label>
      <Choice
        icon={<Store size={15} />}
        title="Store pickup / parcel collection"
        subtitle="Collect yourself or arrange a courier"
        active
      />
      <Choice
        icon={<Truck size={15} />}
        title="Delivery"
        subtitle="Currently unavailable"
      />
      <Label>Who is placing the order?</Label>
      <Field label="Your name" value="Alex Perera (demo)" />
      <Field label="Contact number" value="07X XXX XXXX" />
      <Field label="Email" value="example@email.com" />
      <Action>
        Continue <ArrowRight size={12} />
      </Action>
    </div>
  );
}

function CollectionScreen() {
  return (
    <div className="space-y-4">
      <Heading
        eyebrow="SECURE CHECKOUT"
        title="Receive your order"
        description="Choose how your order will reach you."
      />
      <CheckoutProgress active={2} />
      <Label>Collection method</Label>
      <Choice
        icon={<UserRound size={15} />}
        title="I'll collect"
        subtitle="Pick up at the bakery"
      />
      <Choice
        icon={<Truck size={15} />}
        title="My courier"
        subtitle="Arrange your preferred courier"
        active
      />
      <Choice
        icon={<MessageCircle size={15} />}
        title="Help me arrange"
        subtitle="Ask Baura for assistance"
      />
      <Label>Courier provider</Label>
      <div className="flex items-center justify-between rounded-xl border border-[#dfd4c4] bg-white p-3">
        <div className="flex items-center gap-2">
          <img
            src={PICKME_LOGO}
            alt="PickMe Flash"
            className="h-6 w-6 rounded object-contain"
          />
          <span className="text-[11px] font-semibold text-[#38271d]">
            PickMe Flash
          </span>
        </div>
        <CheckCircle2 size={16} className="text-[#4a7952]" />
      </div>
      <p className="text-[10px] leading-relaxed text-[#897a6e]">
        Courier charges are arranged separately.
      </p>
      <Action>
        Continue <ArrowRight size={12} />
      </Action>
    </div>
  );
}

function ScheduleScreen() {
  return (
    <div className="space-y-4">
      <Heading
        eyebrow="SECURE CHECKOUT"
        title="Choose your pickup time"
        description="Select an available collection date and time."
      />
      <CheckoutProgress active={3} />
      <Label>Choose a collection day</Label>
      <div className="rounded-xl border border-[#e8dfd3] bg-white p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-[#38271d]">
            Example calendar
          </p>
          <CalendarDays size={14} className="text-[#867362]" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
            <span
              key={index}
              className="py-1 text-center text-[9px] text-[#a29587]">
              {day}
            </span>
          ))}
          {Array.from({ length: 21 }, (_, index) => (
            <span
              key={index}
              className={[
                "flex aspect-square items-center justify-center rounded-lg text-[10px]",
                index === 9
                  ? "bg-[#38271d] font-bold text-white"
                  : "bg-[#f8f3ea] text-[#6a584b]",
              ].join(" ")}>
              {index + 1}
            </span>
          ))}
        </div>
      </div>
      <Label>Select your pickup time</Label>
      <div className="grid grid-cols-2 gap-2">
        <span className="rounded-xl bg-[#38271d] p-3 text-center text-[10px] font-semibold text-white">
          10:00 AM
        </span>
        <span className="rounded-xl border border-[#e8dfd3] bg-white p-3 text-center text-[10px] text-[#6a584b]">
          11:00 AM
        </span>
      </div>
      <Action>
        Continue <ArrowRight size={12} />
      </Action>
    </div>
  );
}

function ReviewScreen() {
  return (
    <div className="space-y-4">
      <Heading
        eyebrow="REVIEW ORDER"
        title="Everything look right?"
        description="Review your order before confirming."
      />
      <CheckoutProgress active={4} />
      <div className="space-y-3 rounded-xl border border-[#e9dfd2] bg-white p-4">
        <div className="flex gap-2">
          <ShoppingBag size={14} className="text-[#84674e]" />
          <div>
            <Label>Your order</Label>
            <p className="mt-1 text-[11px] font-semibold text-[#38271d]">
              Sapphire Gild Birthday Cake
            </p>
          </div>
        </div>
        <div className="border-t border-[#eee6dd] pt-3">
          <div className="flex gap-2">
            <Truck size={14} className="text-[#84674e]" />
            <div>
              <Label>Collection</Label>
              <p className="mt-1 text-[11px] text-[#38271d]">
                My courier · PickMe Flash
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-[#eee6dd] pt-3">
          <div className="flex gap-2">
            <Clock3 size={14} className="text-[#84674e]" />
            <div>
              <Label>Schedule</Label>
              <p className="mt-1 text-[11px] text-[#38271d]">
                Selected date · 10:00 AM
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-[#f6eee3] p-3 text-[10px] leading-5 text-[#786455]">
        Follow the payment instructions after submitting your order.
      </div>
      <Action>
        Place order <ArrowRight size={12} />
      </Action>
    </div>
  );
}

function WhatsAppScreen() {
  return (
    <div className="flex h-full flex-col bg-[#e8e6dc]">
      <div className="flex h-14 shrink-0 items-center gap-3 bg-[#075e54] px-4 text-white">
        <ChevronLeft size={19} />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
          <img src={BAURA_LOGO} alt="" className="h-7 w-7 object-contain" />
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-semibold">Baura Bakers</p>
          <p className="text-[9px] text-white/70">Demo conversation</p>
        </div>
        <MessageCircle size={18} />
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-hidden p-4"
        style={{
          backgroundImage:
            "radial-gradient(#c8c7bd 0.65px, transparent 0.65px)",
          backgroundSize: "18px 18px",
        }}>
        <div className="mx-auto mb-5 w-fit rounded-lg bg-[#d8e9f1] px-3 py-1.5 text-[9px] text-[#536b75]">
          Today
        </div>
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="ml-auto max-w-[94%] rounded-xl rounded-tr-sm bg-[#dcf8c6] p-3 shadow-sm">
          <p className="text-[11px] font-bold leading-5 text-[#263f2b]">
            Baura Bakers — Order Confirmation
          </p>
          <p className="mt-2 text-[10px] leading-[1.8] text-[#304233]">
            Hello Baura Bakers!
            <br />
            I've placed an order through your website.
            <br />
            <br />
            <strong>Order:</strong> BB-DEMO-001
            <br />
            <strong>Collection:</strong> My courier
            <br />
            <strong>Courier:</strong> PickMe Flash
            <br />
            <br />
            I'd like to confirm payment and collection arrangements.
          </p>
          <div className="mt-3 rounded-md border-l-[3px] border-[#4d947b] bg-white/45 p-2">
            <p className="text-[10px] font-semibold text-[#315f4c]">
              Track your order
            </p>
            <p className="mt-1 break-all text-[9px] text-[#45816b]">
              baurabakers.com/order/track
            </p>
            <p className="mt-1 text-[8px] text-[#657a6c]">
              Example link — not an actual order
            </p>
          </div>
          <p className="mt-2 text-right text-[9px] text-[#719179]">10:42 ✓✓</p>
        </motion.div>
        <p className="mt-4 text-center text-[9px] text-[#657466]">
          Simulated WhatsApp message
        </p>
      </div>

      <div className="flex h-14 shrink-0 items-center gap-2 border-t border-[#e0ded5] bg-[#f6f5f1] px-3">
        <span className="flex-1 rounded-full bg-white px-4 py-2.5 text-[10px] text-[#9b9b9b]">
          Message
        </span>
        <button
          type="button"
          data-demo-action
          aria-label="Continue demonstration to order tracking"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#128c7e] text-white">
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

function TrackingScreen() {
  const statuses = [
    ["Order received", "We've received your request."],
    ["Awaiting payment confirmation", "Confirm details with the bakery."],
    ["Preparing your order", "Updates appear when the status changes."],
    ["Ready for collection", "Collect at the arranged time."],
  ];

  return (
    <div className="space-y-4">
      <Heading
        eyebrow="ORDER TRACKING"
        title="Track your Baura order"
        description="See the latest status using your tracking link."
      />
      <div className="rounded-xl border border-[#e8dfd3] bg-white p-4">
        <Label>Order reference</Label>
        <p className="mt-1 text-base font-bold text-[#38271d]">BB-DEMO-001</p>
        <div className="mt-5 space-y-5">
          {statuses.map(([title, description], index) => (
            <div key={title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    index === 0
                      ? "bg-[#477a53] text-white"
                      : "border border-[#d8cfc3] text-[#b2a495]"
                  }`}>
                  {index === 0 ? (
                    <Check size={12} />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </div>
                {index !== statuses.length - 1 && (
                  <div className="mt-1 h-8 w-px bg-[#e5dcd0]" />
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#38271d]">
                  {title}
                </p>
                <p className="mt-1 text-[9px] text-[#8b7d70]">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Action>
        <PackageCheck size={13} />
        Order tracking
      </Action>
      <p className="text-center text-[9px] text-[#968779]">
        Example only — no live order data.
      </p>
    </div>
  );
}

function Screen({ step }: { step: number }) {
  switch (step) {
    case 0:
      return <HomepageScreen />;
    case 1:
      return <MenuScreen />;
    case 2:
      return <ProductScreen />;
    case 3:
      return <BagScreen />;
    case 4:
      return <DetailsScreen />;
    case 5:
      return <CollectionScreen />;
    case 6:
      return <ScheduleScreen />;
    case 7:
      return <ReviewScreen />;
    case 8:
      return <WhatsAppScreen />;
    default:
      return <TrackingScreen />;
  }
}

type TapPosition = {
  x: number;
  y: number;
  key: number;
};

function PhoneFrame({
  step,
  active,
  reduceMotion,
  onAdvance,
}: {
  step: number;
  active: boolean;
  reduceMotion: boolean;
  onAdvance: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const advanceRef = useRef(onAdvance);
  const [tap, setTap] = useState<TapPosition | null>(null);
  const whatsapp = step === 8;

  useEffect(() => {
    advanceRef.current = onAdvance;
  }, [onAdvance]);

  useEffect(() => {
    const screen = scrollRef.current;
    if (!screen) return;

    screen.scrollTop = 0;
    if (!active || reduceMotion) return;

    const timers: number[] = [];
    let cancelled = false;

    function schedule(callback: () => void, delay: number) {
      const id = window.setTimeout(() => {
        if (!cancelled) callback();
      }, delay);
      timers.push(id);
    }

    function findAction() {
      const actions =
        screen!.querySelectorAll<HTMLElement>("[data-demo-action]");
      return actions[actions.length - 1] ?? null;
    }

    function scrollToFraction(fraction: number) {
      const maximum = Math.max(0, screen!.scrollHeight - screen!.clientHeight);
      screen!.scrollTo({
        top: maximum * fraction,
        behavior: "smooth",
      });
    }

    function scrollToAction() {
      const action = findAction();
      if (!action) return;

      const screenRect = screen!.getBoundingClientRect();
      const actionRect = action.getBoundingClientRect();
      const target =
        screen!.scrollTop +
        actionRect.top -
        screenRect.top -
        screen!.clientHeight * 0.68 +
        actionRect.height / 2;

      screen!.scrollTo({
        top: Math.max(0, target),
        behavior: "smooth",
      });
    }

    function showTap() {
      const action = findAction();
      const viewport = viewportRef.current;
      if (!action || !viewport) return;

      const actionRect = action.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();

      const x = actionRect.left + actionRect.width / 2 - viewportRect.left;
      const y = actionRect.top + actionRect.height / 2 - viewportRect.top;

      if (x < 0 || x > viewportRect.width || y < 0 || y > viewportRect.height) {
        return;
      }

      setTap({ x, y, key: step + 1 });
    }

    if (step === 0) {
      schedule(() => scrollToFraction(0.26), 1400);
      schedule(() => scrollToFraction(0.53), 3500);
      schedule(() => scrollToFraction(0.76), 5600);
      schedule(scrollToAction, 7400);
      schedule(showTap, 9050);
      schedule(() => advanceRef.current(), 10000);
    } else if (whatsapp) {
      schedule(showTap, 4500);
      schedule(() => advanceRef.current(), 6200);
    } else {
      schedule(() => scrollToFraction(0.45), 1500);
      schedule(scrollToAction, 3900);
      schedule(showTap, 5400);
      schedule(() => advanceRef.current(), 6700);
    }

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [step, active, reduceMotion, whatsapp]);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest("[data-demo-action]")) {
      advanceRef.current();
    }
  }

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: PHONE_WIDTH }}>
      <div className="rounded-[34px] border-[5px] border-[#241b17] bg-[#241b17] p-[4px] shadow-[0_28px_75px_-20px_rgba(47,31,18,0.40)]">
        <div className="relative overflow-hidden rounded-[26px] bg-[#fbf5e7]">
          <div className="relative z-20 flex h-8 items-center justify-between bg-[#241b17] px-6 text-[10px] font-semibold text-white">
            <span>9:41</span>
            <div className="absolute left-1/2 top-0 h-[23px] w-[87px] -translate-x-1/2 rounded-b-2xl bg-[#100e0d]" />
            <span className="tracking-wide">● ▰</span>
          </div>

          <div
            ref={viewportRef}
            className="relative overflow-hidden bg-[#fbf5e7]"
            style={{ height: PHONE_HEIGHT }}>
            <div className="absolute inset-0 flex flex-col">
              {!whatsapp && (
                <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#ede2d4] bg-[#fbf6eb] px-4">
                  <img
                    src={BAURA_LOGO}
                    alt="Baura Bakers"
                    className="h-9 w-auto max-w-[95px] object-contain"
                  />
                  <div className="flex items-center gap-3 text-[#38271d]">
                    <ShoppingBag size={15} />
                    <span className="text-lg leading-none">☰</span>
                  </div>
                </div>
              )}

              <div
                ref={scrollRef}
                onClick={handleClick}
                className={`min-h-0 flex-1 overflow-x-hidden overscroll-contain ${
                  whatsapp ? "overflow-y-hidden" : "overflow-y-auto"
                }`}
                style={{
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch",
                }}>
                <div
                  className={whatsapp ? "h-full" : "min-h-full px-4 pb-8 pt-4"}>
                  <Screen step={step} />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {tap && !reduceMotion && (
                <motion.div
                  key={tap.key}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{
                    opacity: [0, 0.9, 0.65, 0],
                    scale: [0.3, 0.7, 1.55, 1.9],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.9,
                    times: [0, 0.2, 0.65, 1],
                  }}
                  className="pointer-events-none absolute z-30 h-10 w-10 rounded-full border-2 border-[#b58d62] bg-[#d8b287]/50"
                  style={{
                    left: tap.x - 20,
                    top: tap.y - 20,
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="flex h-6 items-center justify-center bg-[#fbf6eb]">
            <div className="h-1 w-24 rounded-full bg-[#37281e]" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-5 left-1/2 h-7 w-3/4 -translate-x-1/2 rounded-full bg-[#38271d]/15 blur-xl" />
    </div>
  );
}

type HowToOrderPhoneProps = {
  onStepChange?: (step: number) => void;
  className?: string;
};

export default function HowToOrderPhone({
  onStepChange,
  className = "",
}: HowToOrderPhoneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.25 });
  const reduceMotion = Boolean(useReducedMotion());
  const [step, setStep] = useState(0);

  const advance = useCallback(() => {
    setStep((current) =>
      current >= orderingJourney.length - 1 ? 0 : current + 1,
    );
  }, []);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  return (
    <div
      ref={rootRef}
      className={className}
      aria-label="Animated Baura Bakers ordering demonstration">
      <PhoneFrame
        key={step}
        step={step}
        active={inView}
        reduceMotion={reduceMotion}
        onAdvance={advance}
      />
    </div>
  );
}
