import Link from "next/link";
import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

const guruLoginLink = "/login?role=guru&next=/guru/dashboard";

function buildGuruApplyLink(refCode?: string | null) {
  const params = new URLSearchParams({
    role: "guru",
    next: "/guru/dashboard",
  });

  const cleaned = typeof refCode === "string" ? refCode.trim() : "";
  if (cleaned) {
    params.set("ref", cleaned);
    params.set("type", "guru");
  }

  return `/signup?${params.toString()}`;
}

const coreBenefits = [
  {
    icon: "📍",
    title: "Get discovered locally",
    description:
      "Create a public Guru profile that helps nearby Pet Parents find your approved pet care services.",
  },
  {
    icon: "📅",
    title: "Stay in control",
    description:
      "Choose the services, availability, rates, and local service areas that work for you.",
  },
  {
    icon: "💚",
    title: "Build repeat relationships",
    description:
      "Keep care details, messages, PawReports, reviews, and rebooking activity connected through SitGuru.",
  },
];

const guruTools = [
  {
    icon: "👤",
    title: "Professional Guru profile",
    description: "Show your experience, photos, care style, and service details.",
  },
  {
    icon: "🐾",
    title: "Services and pricing",
    description: "Choose the care services you offer and enter your rates.",
  },
  {
    icon: "📍",
    title: "Service area",
    description: "Focus on the neighborhoods and communities you want to serve.",
  },
  {
    icon: "🗓️",
    title: "Availability",
    description: "Share the days and times that fit your schedule.",
  },
  {
    icon: "💬",
    title: "Pet Parent messaging",
    description: "Keep booking conversations and care details in one place.",
  },
  {
    icon: "📋",
    title: "PawReport updates",
    description: "Share walk progress, photos, notes, and completed care reports.",
  },
  {
    icon: "⭐",
    title: "Reviews and rebooking",
    description: "Build trust through completed care and repeat relationships.",
  },
  {
    icon: "💵",
    title: "Earnings and payouts",
    description: "Review booking earnings and complete required payout setup.",
  },
];

const steps = [
  {
    step: "1",
    title: "Create your account",
    description: "Tell us who you are and where you plan to provide care.",
  },
  {
    step: "2",
    title: "Build your profile",
    description:
      "Add your services, rates, availability, experience, photos, and local area.",
  },
  {
    step: "3",
    title: "Complete trust steps",
    description:
      "Finish the required identity, safety, account, and payout setup.",
  },
  {
    step: "4",
    title: "Start accepting bookings",
    description:
      "Review requests and accept the care opportunities that work for you.",
  },
];

const controlPoints = [
  "Choose which services you offer",
  "Set your rates",
  "Select your availability",
  "Choose your local service area",
  "Review requests before accepting",
  "See booking details before confirming",
  "Keep messages and care records organized",
  "Track earnings from your Guru dashboard",
];

const serviceTypes = [
  "Dog Walking",
  "Drop-In Visits",
  "Pet Sitting",
  "Boarding",
  "Doggy Day Care",
  "Training Support",
];

const faqs = [
  {
    question: "Is it free to apply?",
    answer:
      "Yes. Creating your Guru account and submitting your profile is free. You will complete the required profile and trust steps before becoming fully bookable.",
  },
  {
    question: "What services can I offer?",
    answer:
      "Available services may include dog walking, drop-in visits, pet sitting, boarding, doggy day care, training support, and other approved pet care services.",
  },
  {
    question: "Can I choose my schedule and service area?",
    answer:
      "Yes. You choose the availability and local service areas shown through your Guru profile.",
  },
  {
    question: "Can I set my own rates?",
    answer:
      "Yes. You can enter rates for the services you offer. Booking details and applicable platform charges should be reviewed before you accept a request.",
  },
  {
    question: "How do payments and payouts work?",
    answer:
      "Eligible paid bookings and Guru payouts are handled through SitGuru after the required payout setup is completed.",
  },
  {
    question: "Do I need professional pet care experience?",
    answer:
      "You should describe your experience honestly. SitGuru welcomes experienced providers and responsible local pet lovers who are prepared to complete all required profile and trust steps.",
  },
  {
    question: "What happens after I apply?",
    answer:
      "You will complete your profile, services, pricing, availability, trust requirements, and payout setup. Your profile must be approved and active before Pet Parents can fully book you.",
  },
];

function PrimaryButton({
  href,
  label = "Start Free Guru Profile",
  className = "",
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-14 items-center justify-center rounded-full bg-emerald-600 px-7 py-4 text-base font-black !text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 ${className}`}
    >
      {label}
    </Link>
  );
}

function GuruLoginButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href={guruLoginLink}
      className={`inline-flex min-h-14 items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-black !text-slate-800 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100 ${className}`}
    >
      Guru Login
    </Link>
  );
}

function GuruProfilePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="absolute -bottom-8 -right-8 h-44 w-44 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative overflow-hidden rounded-[34px] border border-white/15 bg-white shadow-[0_30px_90px_rgba(2,44,34,0.32)]">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-700 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] !text-emerald-200">
                Your Guru profile
              </p>
              <p className="mt-1 text-sm font-semibold !text-white/80">
                What Pet Parents can discover
              </p>
            </div>

            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] !text-white">
              Profile Preview
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-emerald-100 to-sky-100 text-4xl shadow-inner">
              🐕
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black tracking-[-0.04em] !text-slate-950">
                  Your Name
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] !text-emerald-800">
                  Guru
                </span>
              </div>

              <p className="mt-1 text-sm font-black !text-emerald-700">
                Dog Walking · Drop-Ins
              </p>
              <p className="mt-1 text-sm font-semibold !text-slate-500">
                Your local area
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              ["$25", "Starting rate"],
              ["4.9", "Example rating"],
              ["Open", "Availability"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center"
              >
                <p className="text-lg font-black !text-slate-950">{value}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] !text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] !text-emerald-800">
              Profile highlights
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                "Services and rates",
                "Availability",
                "Experience and photos",
                "Care area and reviews",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black !text-emerald-700 shadow-sm">
                    ✓
                  </span>
                  <span className="text-xs font-bold !text-slate-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3">
            <div>
              <p className="text-xs font-black !text-white">
                Ready for local bookings
              </p>
              <p className="mt-0.5 text-[10px] font-semibold !text-slate-300">
                After profile approval and required setup
              </p>
            </div>
            <span className="text-xl">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function BecomeAGuruPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved: Record<string, string | string[] | undefined> =
    (await Promise.resolve(searchParams)) || {};
  const rawRef = resolved.ref;
  const refCode = Array.isArray(rawRef) ? rawRef[0] : rawRef;
  const guruApplyLink = buildGuruApplyLink(refCode);

  return (
    <main className="public-page min-h-screen bg-white pb-24 !text-slate-950 sm:pb-0">
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        <PrimaryButton href={guruApplyLink} className="w-full" />
      </div>

      <section className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-white via-emerald-50/45 to-sky-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-sky-200/25 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] !text-emerald-800 shadow-sm sm:text-xs">
                Flexible local pet care
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.055em] !text-slate-950 sm:text-5xl lg:text-6xl">
                Earn on your schedule caring for pets.
              </h1>

              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 !text-slate-700 sm:text-xl">
                Choose your services, rates, availability, and local area.
                SitGuru helps nearby Pet Parents discover, book, and rebook you.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PrimaryButton href={guruApplyLink} className="w-full sm:w-auto" />
                <GuruLoginButton className="w-full sm:w-auto" />
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {[
                  "Free to apply",
                  "Choose your schedule",
                  "Set your services and rates",
                  "Keep bookings organized",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-2xl border border-white bg-white/80 px-4 py-3 text-sm font-black !text-slate-700 shadow-sm"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs !text-emerald-700">
                      ✓
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <p className="mt-5 max-w-2xl text-xs font-semibold leading-5 !text-slate-500 sm:text-sm">
                Pet Gurus are independent providers who choose the services they
                offer and the booking requests they accept.
              </p>
            </div>

            <GuruProfilePreview />
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] !text-emerald-700 sm:text-xs">
              Built around your goals
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] !text-slate-950 sm:text-4xl">
              Grow your pet care business your way.
            </h2>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {coreBenefits.map((benefit) => (
              <article
                key={benefit.title}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_20px_45px_rgba(15,23,42,0.10)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                  {benefit.icon}
                </div>
                <h3 className="mt-5 text-xl font-black tracking-[-0.03em] !text-slate-950">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-6 !text-slate-600">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] !text-emerald-700 sm:text-xs">
                Your Guru workspace
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] !text-slate-950 sm:text-4xl">
                Everything you need in one place.
              </h2>
              <p className="mt-4 max-w-xl text-base font-semibold leading-7 !text-slate-700">
                Build your profile, organize care details, communicate with Pet
                Parents, complete PawReports, and follow your Guru activity
                through SitGuru.
              </p>

              <div className="mt-6">
                <PrimaryButton href={guruApplyLink} className="w-full sm:w-auto" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {guruTools.map((tool) => (
                <article
                  key={tool.title}
                  className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
                    {tool.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-black !text-slate-950">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-slate-600">
                    {tool.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] !text-emerald-700 sm:text-xs">
              Simple from the start
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] !text-slate-950 sm:text-4xl">
              Start in four steps.
            </h2>
          </div>

          <div className="relative mt-10 grid gap-4 lg:grid-cols-4">
            <div className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden h-px bg-emerald-200 lg:block" />

            {steps.map((item) => (
              <article
                key={item.step}
                className="relative rounded-[26px] border border-slate-200 bg-white p-5 text-center shadow-sm"
              >
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-lg font-black !text-white shadow-lg shadow-emerald-700/20">
                  {item.step}
                </div>
                <h3 className="mt-5 text-lg font-black !text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 !text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-dark-section bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 py-12 !text-white sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] !text-emerald-200 sm:text-xs">
                Independent provider control
              </p>
              <h2
                className="mt-3 text-3xl font-black tracking-[-0.045em] !text-white sm:text-4xl"
                style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
              >
                You decide how you work.
              </h2>
              <p className="mt-4 max-w-xl text-base font-semibold leading-7 !text-emerald-50">
                SitGuru gives you a structured way to present your services and
                review local booking opportunities without giving up control of
                your schedule.
              </p>

              <div className="mt-6">
                <PrimaryButton href={guruApplyLink} className="w-full bg-emerald-400 !text-emerald-950 hover:bg-emerald-300 sm:w-auto" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {controlPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black !text-emerald-800">
                    ✓
                  </span>
                  <span className="text-sm font-black !text-white">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[34px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.07)] sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] !text-emerald-700 sm:text-xs">
                  Who can become a Guru?
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] !text-slate-950 sm:text-4xl">
                  Pet experience comes in many forms.
                </h2>
                <p className="mt-4 text-base font-semibold leading-7 !text-slate-700">
                  SitGuru welcomes experienced pet care providers and
                  responsible local pet lovers who are prepared to describe
                  their experience honestly and complete the required profile
                  and trust steps.
                </p>

                <Link
                  href="/programs"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-black !text-emerald-700 transition hover:!text-emerald-800 hover:underline"
                >
                  Looking for a specialized pathway? Explore SitGuru Programs →
                </Link>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Includes student, community, and optional{" "}
                  <Link
                    href={VETERANS_MILITARY_FAMILIES_PROGRAM.programsAnchorHref}
                    className="font-black text-emerald-700 hover:underline"
                  >
                    {VETERANS_MILITARY_FAMILIES_PROGRAM.shortName}
                  </Link>
                  .
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] !text-slate-500">
                  Common Guru services
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {serviceTypes.map((service) => (
                    <div
                      key={service}
                      className="flex min-h-20 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center text-sm font-black !text-slate-800 shadow-sm"
                    >
                      {service}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] !text-emerald-700 sm:text-xs">
              Guru questions
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] !text-slate-950 sm:text-4xl">
              Know what to expect before you start.
            </h2>
          </div>

          <div className="mt-9 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm open:border-emerald-200 open:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                  <span className="text-base font-black !text-slate-950 sm:text-lg">
                    {faq.question}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-black !text-emerald-800 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 !text-slate-600 sm:text-base">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[34px] bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-10 text-center shadow-[0_24px_70px_rgba(6,78,59,0.24)] sm:px-10 sm:py-14">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] !text-emerald-200 sm:text-xs">
              Ready to get started?
            </p>
            <h2
              className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-[-0.045em] !text-white sm:text-4xl"
              style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
            >
              Earn caring for pets and build trusted local relationships.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 !text-emerald-50">
              Create your free Guru profile, choose how you want to provide
              care, and complete the steps required to become bookable.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryButton href={guruApplyLink} className="w-full bg-emerald-400 !text-emerald-950 hover:bg-emerald-300 sm:w-auto" />
              <GuruLoginButton className="w-full border-white/30 bg-white/10 !text-white hover:bg-white/15 sm:w-auto" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}