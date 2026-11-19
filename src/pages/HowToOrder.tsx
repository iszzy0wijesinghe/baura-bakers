
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import Page from "../components/Page";
import HowToOrderPhone from "../components/how-to-order/HowToOrderPhone";
import howToOrderHeroImage from "../../images/how-to-order/hero-how-to-order.webp";


const steps = [
  {
    number: "01",
    title: "Choose your favourites.",
    text: "Explore the menu, select your bakes, and add them to your bag.",
    icon: ShoppingBag,
  },
  {
    number: "02",
    title: "Make it yours.",
    text: "Review your bag, enter your details, and select a collection method.",
    icon: UserRound,
  },
  {
    number: "03",
    title: "Pick your moment.",
    text: "Choose an available date and time from our bakery calendar.",
    icon: CalendarDays,
  },
  {
    number: "04",
    title: "Leave it with us.",
    text: "Place your order, confirm payment arrangements, and track its progress.",
    icon: PackageCheck,
  },
];

const collectionMethods = [
  {
    number: "01",
    label: "I'LL COLLECT",
    title: "Coming to see us?",
    text: "Collect your freshly prepared order at Baura during your selected collection time.",
    detail: "Personal collection",
    icon: Store,
  },
  {
    number: "02",
    label: "MY COURIER",
    title: "Sending someone instead?",
    text: "Arrange your preferred courier, such as PickMe Flash, to collect your order at the agreed time.",
    detail: "Courier fees and booking handled separately",
    icon: Truck,
  },
  {
    number: "03",
    label: "HELP ME ARRANGE",
    title: "Need a little help?",
    text: "Choose this option at checkout and contact Baura to discuss available collection assistance.",
    detail: "Subject to bakery confirmation",
    icon: MessageCircle,
  },
];

const reminders = [
  {
    icon: CalendarDays,
    title: "Collection availability",
    text: "Only select dates and time slots offered during checkout. Availability depends on our operating calendar.",
  },
  {
    icon: ShoppingBag,
    title: "Check before confirming",
    text: "Review product selections, sizes, quantities, contact details, and collection arrangements.",
  },
  {
    icon: CreditCard,
    title: "Payment confirmation",
    text: "Placing an order does not automatically confirm payment. Follow the instructions on your confirmation page.",
  },
  {
    icon: Truck,
    title: "Courier arrangements",
    text: "Customer-arranged courier bookings and applicable fees are handled directly with the provider.",
  },
];

const questions = [
  {
    question: "Can I still order when delivery is paused?",
    answer:
      "Yes, when online ordering and pickup are available. Choose store pickup or parcel collection, then select an available collection arrangement.",
  },
  {
    question: "Will Baura arrange my courier automatically?",
    answer:
      "No. Selecting My courier means you make the arrangements. If you need assistance, choose Help me arrange and contact Baura.",
  },
  {
    question: "How do I choose my collection time?",
    answer:
      "During checkout, select an available collection date and time. The displayed options reflect bakery availability.",
  },
  {
    question: "How do I confirm payment?",
    answer:
      "After placing your order, follow the payment instructions on the confirmation page. The prepared WhatsApp message helps you contact Baura about payment.",
  },
  {
    question: "How can I track my order?",
    answer:
      "Use the tracking link provided with your order confirmation to view the latest available progress updates.",
  },
  {
    question: "Can I change or cancel my order?",
    answer:
      "Contact Baura promptly with your order reference. Changes, cancellations, and refunds are subject to the applicable terms and order status.",
  },
];

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-ink/45">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-brand-ink sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-xl text-sm leading-6 text-brand-ink/65">
          {description}
        </p>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="how-to-order-title"
      className="relative isolate overflow-hidden bg-[#21150f] text-[#f9f4e0]"
    >
      <div className="absolute inset-0 -z-30">
        <img
          src={howToOrderHeroImage}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[#160e09]/25"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#1b100a]/95 via-[#1b100a]/78 to-[#1b100a]/30"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#170d08]/65 to-transparent"
      />

      <div className="relative mx-auto grid w-full max-w-[1540px] items-center gap-8 px-5 py-10 sm:px-8 sm:py-12 lg:min-h-[660px] lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-12 lg:px-12 lg:py-12">
        <div className="relative z-10 max-w-[650px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f9f4e0]/65">
            HOW TO ORDER AT BAURA
          </p>

          <h1
            id="how-to-order-title"
            className="mt-5 max-w-[650px] text-[clamp(3.2rem,5.3vw,5.5rem)] font-semibold leading-[1.04] tracking-[-0.065em] text-[#f9f4e0]"
          >
            Your favourites.
            <br />
            Your way.
            <br />
            Made simple.
          </h1>

          <p className="mt-5 max-w-[450px] text-sm leading-7 text-[#f9f4e0]/80 sm:text-[15px]">
            From finding your next favourite bake to arranging
            collection, we've made every step simple.
            Here's everything you need to know.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Link
              to="/menu"
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f9f4e0] px-5 py-3 text-xs font-semibold text-[#372619] transition hover:bg-white"
            >
              Explore the menu
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>

            <a
              href="#ordering-process"
              className="group inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#f9f4e0]"
            >
              See how it works
              <ArrowDown
                size={15}
                className="transition-transform group-hover:translate-y-0.5"
              />
            </a>
          </div>
        </div>

        <div className="relative z-10 flex min-w-0 items-center justify-center lg:justify-end">
          <HowToOrderPhone className="w-full max-w-[342px]" />
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-[1540px] flex-wrap items-center justify-between gap-3 px-5 pb-6 text-[10px] font-medium text-[#f9f4e0]/65 sm:px-8 lg:px-12">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#dcc297]" />
          Made with care, collected your way
        </span>
        <a
          href="#ordering-process"
          className="inline-flex items-center gap-2 transition hover:text-white"
        >
          Discover the process
          <ArrowDown size={13} />
        </a>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section id="ordering-process" className="scroll-mt-24">
      <div className="mx-auto w-full max-w-[1540px] px-5 py-12 sm:px-8 sm:py-14 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionTitle
            eyebrow="THE ORDERING PROCESS"
            title="From craving to collection."
            description="Four simple steps between choosing your favourite and enjoying it."
          />
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-ink"
          >
            Browse our menu <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid border-t border-brand-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.number}
                className={[
                  "flex flex-col gap-3 border-b border-brand-ink/10 px-0 py-6 sm:px-5 lg:border-b-0",
                  index > 0 ? "lg:border-l" : "",
                  index === 0 || index === 2 ? "sm:pl-0 lg:pl-5" : "",
                  index === 0 ? "lg:pl-0" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-brand-ink/45">
                    {step.number}
                  </span>
                  <Icon
                    size={19}
                    strokeWidth={1.5}
                    className="text-brand-ink/60"
                  />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-brand-ink">
                  {step.title}
                </h3>
                <p className="max-w-[260px] text-[13px] leading-6 text-brand-ink/65">
                  {step.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Collection() {
  return (
    <section
      id="collection"
      className="scroll-mt-24 border-y border-brand-ink/10 bg-[#f1e9d5]"
    >
      <div className="mx-auto w-full max-w-[1540px] px-5 py-12 sm:px-8 sm:py-14 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionTitle
            eyebrow="COLLECTION OPTIONS"
            title="Collect it your way."
            description="Your order is prepared at Baura. Choose the collection arrangement that suits you."
          />
          <span className="max-w-xs text-xs leading-5 text-brand-ink/55">
            Customer-arranged couriers are separate from Baura's own delivery service.
          </span>
        </div>

        <div className="mt-8 border-t border-brand-ink/15">
          {collectionMethods.map((method) => {
            const Icon = method.icon;
            return (
              <article
                key={method.number}
                className="grid gap-3 border-b border-brand-ink/10 py-5 md:grid-cols-[75px_minmax(0,1fr)_minmax(240px,0.9fr)] md:items-center md:gap-6"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-brand-ink/40">
                    {method.number}
                  </span>
                  <Icon
                    size={20}
                    strokeWidth={1.5}
                    className="text-brand-ink/70"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-ink/45">
                    {method.label}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-brand-ink">
                    {method.title}
                  </h3>
                  <p className="mt-1 text-xs text-brand-ink/50">
                    {method.detail}
                  </p>
                </div>
                <p className="text-[13px] leading-6 text-brand-ink/65">
                  {method.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AfterCheckout() {
  return (
    <section id="payment" className="scroll-mt-24">
      <div className="mx-auto w-full max-w-[1540px] px-5 py-12 sm:px-8 sm:py-14 lg:px-12">
        <SectionTitle
          eyebrow="AFTER CHECKOUT"
          title="Placed your order? Here's what's next."
          description="Confirm the arrangements, then follow your order through the bakery."
        />

        <div className="mt-7 grid overflow-hidden rounded-[18px] border border-brand-ink/10 md:grid-cols-2">
          <article className="bg-[#372619] px-6 py-7 text-[#f9f4e0] sm:px-8 sm:py-8">
            <div className="flex justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                01 / PAYMENT CONFIRMATION
              </span>
              <MessageCircle size={22} />
            </div>
            <h3 className="mt-7 text-2xl font-semibold tracking-tight">
              Let's confirm the details.
            </h3>
            <p className="mt-3 max-w-lg text-[13px] leading-6 text-white/70">
              Follow the instructions on your order confirmation.
              Use the prepared WhatsApp message to contact Baura
              about payment and collection arrangements.
            </p>
            <p className="mt-5 border-t border-white/15 pt-4 text-xs leading-5 text-white/60">
              Your order reference confirms submission, not verified payment.
            </p>
          </article>

          <article className="bg-[#f3eadb] px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex justify-between text-brand-ink/65">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                02 / ORDER TRACKING
              </span>
              <PackageCheck size={22} />
            </div>
            <h3 className="mt-7 text-2xl font-semibold tracking-tight text-brand-ink">
              Know where things stand.
            </h3>
            <p className="mt-3 max-w-lg text-[13px] leading-6 text-brand-ink/65">
              Open the tracking link in your order confirmation to view
              the latest available progress updates.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-brand-ink/10 pt-4 text-xs text-brand-ink/60">
              Received <ArrowRight size={12} />
              Preparing <ArrowRight size={12} />
              Ready for collection
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function ImportantDetails() {
  return (
    <section
      id="good-to-know"
      className="scroll-mt-24 border-t border-brand-ink/10"
    >
      <div className="mx-auto grid w-full max-w-[1540px] gap-8 px-5 py-12 sm:px-8 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14 lg:px-12">
        <div>
          <SectionTitle
            eyebrow="GOOD TO KNOW"
            title="A few things before you order."
            description="The little details that keep your order running smoothly."
          />
          <p className="mt-6 flex items-center gap-2 text-xs text-brand-ink/55">
            <Clock3 size={16} />
            Collection depends on bakery availability.
          </p>
        </div>

        <div className="border-t border-brand-ink/15">
          {reminders.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="grid grid-cols-[25px_1fr] gap-4 border-b border-brand-ink/10 py-4"
              >
                <Icon
                  size={19}
                  strokeWidth={1.5}
                  className="mt-1 text-brand-ink/60"
                />
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-sm font-semibold text-brand-ink">
                      {item.title}
                    </h3>
                    <span className="font-mono text-[10px] text-brand-ink/40">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-6 text-brand-ink/65">
                    {item.text}
                  </p>
                </div>
              </article>
            );
          })}
          <p className="mt-5 text-xs leading-6 text-brand-ink/60">
            Changes, cancellations, refunds and collection arrangements
            depend on Baura's applicable terms and your order status.
            Contact the bakery if you need clarification before ordering.
          </p>
        </div>
      </div>
    </section>
  );
}

function Questions() {
  return (
    <section
      id="questions"
      className="scroll-mt-24 border-y border-brand-ink/10 bg-[#f1e9d5]"
    >
      <div className="mx-auto grid w-full max-w-[1540px] gap-8 px-5 py-12 sm:px-8 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14 lg:px-12">
        <SectionTitle
          eyebrow="YOUR QUESTIONS"
          title="Still wondering?"
          description="A few helpful answers before your first order."
        />

        <div className="border-t border-brand-ink/15">
          {questions.map((item, index) => (
            <details
              key={item.question}
              className="group border-b border-brand-ink/10"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 py-4 [&::-webkit-details-marker]:hidden">
                <span className="mt-1 font-mono text-[10px] text-brand-ink/40">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-[13px] font-semibold leading-6 text-brand-ink">
                  {item.question}
                </span>
                <ChevronDown
                  size={17}
                  className="mt-1 shrink-0 text-brand-ink/60 transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="pb-5 pl-7 pr-5 text-[13px] leading-6 text-brand-ink/65">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto flex w-full max-w-[1540px] flex-col gap-5 px-5 py-10 sm:px-8 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-12">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-ink/45">
          READY FOR SOMETHING DELICIOUS?
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
          Your next favourite is waiting.
        </h2>
      </div>
      <Link
        to="/menu"
        className="group inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-sm font-semibold text-brand-bg transition hover:-translate-y-0.5"
      >
        Explore the menu
        <ArrowRight
          size={17}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </section>
  );
}


export default function HowToOrder() {
  return (
    <Page>
      <main className="w-full min-w-0 bg-brand-bg">
        <Hero />
        <Process />
        <Collection />
        <AfterCheckout />
        <ImportantDetails />
        <Questions />
        <FinalCTA />
      </main>
    </Page>
  );
}