import Page from "../components/Page";

export default function Contact() {
  const phoneDisplay = "0769878770";
  const phoneE164 = "+94769878770";
  const email = "baura.bakers@gmail.com";
  const address = "320/3, Katuwana, Homagama, Sri Lanka";

  return (
    <Page>
      <section className="space-y-8">
        {/* Header */}
        <header className="rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
          <p className="text-xs font-semibold tracking-widest text-zinc-600">
            BAURA BAKERS
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
            Contact us
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-700">
            Order cakes, jar cakes, and baked goodness — we reply fastest on
            WhatsApp. Share your date, quantity, and a reference photo if you
            have one.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/${phoneE164.replace("+", "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-ink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              WhatsApp us
            </a>
            <a
              href={`tel:${phoneE164}`}
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-brand-ink shadow-sm transition hover:bg-zinc-50"
            >
              Call now
            </a>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-brand-ink shadow-sm transition hover:bg-zinc-50"
            >
              Email
            </a>
          </div>
        </header>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* WhatsApp / Phone */}
          <div className="group rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-ink">
                  Call / WhatsApp
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-zinc-900">
                  {phoneDisplay}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Fastest replies on WhatsApp
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                Priority
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`https://wa.me/${phoneE164.replace("+", "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-brand-ink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                WhatsApp
              </a>
              <a
                href={`tel:${phoneE164}`}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-brand-ink shadow-sm transition hover:bg-zinc-50"
              >
                Call
              </a>
            </div>
          </div>

          {/* Email */}
          <div className="group rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm font-semibold text-brand-ink">Email</p>
            <p className="mt-2 break-all text-lg font-semibold tracking-tight text-zinc-900">
              {email}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Best for detailed requests
            </p>

            <div className="mt-5">
              <a
                href={`mailto:${email}`}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-brand-ink shadow-sm transition hover:bg-zinc-50"
              >
                Send an email
              </a>
            </div>
          </div>

          {/* Address */}
          <div className="group rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm font-semibold text-brand-ink">Address</p>
            <p className="mt-2 text-zinc-900">{address}</p>
            <p className="mt-1 text-sm text-zinc-600">
              Homagama • Katuwana
            </p>

            <div className="mt-5">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  address
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-brand-ink shadow-sm transition hover:bg-zinc-50"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Helpful note */}
        <div className="rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
          <h2 className="text-sm font-semibold text-brand-ink">
            To order faster 🍰
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-700">
            <li>Date & time you need the order</li>
            <li>Item (cake / jar cake / cupcakes) + quantity</li>
            <li>Theme / colors + any reference photo</li>
            <li>Delivery or pickup</li>
          </ul>
        </div>
      </section>
    </Page>
  );
}
