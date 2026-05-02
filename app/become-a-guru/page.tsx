import Link from "next/link";

const guruApplyLink = "/signup?type=guru";

const guruTypes = [
  "Pet sitters",
  "Dog walkers",
  "Boarding providers",
  "Drop-in caregivers",
  "Trainers",
  "Experienced pet parents",
  "Students",
  "Professionals",
  "Neighbors and trusted local helpers",
];

const benefits = [
  {
    icon: "📍",
    title: "Build your local presence",
    description:
      "Create a profile that helps pet parents understand who you are, what you offer, and why they can trust you.",
  },
  {
    icon: "🐾",
    title: "Offer flexible services",
    description:
      "Choose the kinds of pet care you want to provide, from walking and sitting to boarding, drop-ins, and more.",
  },
  {
    icon: "✨",
    title: "Grow with better visibility",
    description:
      "SitGuru helps trusted caregivers stand out with clearer profiles, trust signals, reviews, and a stronger first impression.",
  },
  {
    icon: "💻",
    title: "Work within a modern platform",
    description:
      "Use a cleaner experience that supports your services, bookings, profile, and professionalism as SitGuru grows.",
  },
];

const steps = [
  {
    step: "01",
    title: "Apply Free",
    description:
      "Start your SitGuru Guru application at no cost. Share your experience, services, location, and basic profile details.",
  },
  {
    step: "02",
    title: "Get Approved",
    description:
      "SitGuru reviews your profile and guides you through the trust and safety steps needed before accepting bookings.",
  },
  {
    step: "03",
    title: "Complete verification",
    description:
      "Before becoming bookable, approved Gurus may complete identity verification, background screening, and safety agreement approval.",
  },
  {
    step: "04",
    title: "Get Booked",
    description:
      "Once approved and active, manage your Guru dashboard, receive booking activity, and begin caring for pets in your area.",
  },
];

const trustPoints = [
  "Apply free with no upfront application cost",
  "No upfront screening fee to start your application",
  "Screening costs may be deducted from your first completed booking",
  "Identity and background screening before accepting bookings",
  "Trust badges help approved Gurus stand out",
  "A cleaner profile experience for modern pet care providers",
];

const warmGallery = [
  {
    title: "Warm, local care",
    caption:
      "Trusted one-on-one attention for pets and peace of mind for owners.",
    image:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Friendly dog walking",
    caption:
      "Show your personality, reliability, and love for animals from the first glance.",
    image:
      "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Pet-friendly and inviting",
    caption:
      "A warmer presentation helps pet parents trust the experience faster.",
    image:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function BecomeAGuruPage() {
  return (
    <main className="public-page min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#f1f5f9_100%)] !text-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute right-0 top-8 h-72 w-72 rounded-full bg-slate-300/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="relative z-10">
              <div className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-4 py-1.5 text-sm font-semibold !text-emerald-800 shadow-sm">
                Founding Guru Program
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight !text-slate-950 sm:text-5xl">
                Apply Free. Get Approved. Get Booked.
              </h1>

              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 !text-slate-800 sm:text-xl">
                Turn your love for pets into extra income. Join SitGuru as a
                trusted local pet care Guru and start building your pet care
                profile at no cost.
              </p>

              <p className="mt-4 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg sm:leading-8">
                Apply free today. Once your profile is reviewed and
                pre-approved, SitGuru will guide you through verification so you
                can begin accepting pet care bookings in your area.
              </p>

              <div className="mt-5 rounded-[26px] border border-emerald-200 bg-white/90 p-5 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-[0.18em] !text-emerald-700">
                  No upfront screening fee
                </p>
                <p className="mt-2 text-base leading-7 !text-slate-700">
                  No upfront screening fee to apply. If approved, screening
                  costs may be deducted from your first completed SitGuru
                  booking.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={guruApplyLink}
                  className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
                >
                  Apply Free
                </Link>

                <Link
                  href="/guru/login"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold !text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto"
                >
                  Guru Login
                </Link>

                <Link
                  href="/search"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold !text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto"
                >
                  See the Marketplace
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold !text-slate-700 shadow-sm">
                  Apply at no cost
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold !text-slate-700 shadow-sm">
                  Founding Guru badge
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold !text-slate-700 shadow-sm">
                  Flexible services
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold !text-slate-700 shadow-sm">
                  Built for trust
                </span>
              </div>
            </div>

            <div className="public-dark-section rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#0b1220_45%,#111827)] p-6 !text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-7">
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] !text-emerald-300">
                What makes a Guru?
              </div>

              <h2 className="mt-4 text-2xl font-bold !text-white sm:text-3xl">
                More than a sitter. More than a walker.
              </h2>

              <p className="mt-4 text-base leading-7 !text-slate-200">
                A Guru is someone pet parents can trust. The role is flexible on
                purpose because trusted care can come from many real-life
                backgrounds and service styles.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold !text-white">
                    Apply free
                  </p>
                  <p className="mt-1 text-sm !text-slate-300">
                    Start your application without an upfront application cost.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold !text-white">
                    Flexible service types
                  </p>
                  <p className="mt-1 text-sm !text-slate-300">
                    Walking, sitting, drop-ins, boarding, training, and more.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold !text-white">
                    Built for trust
                  </p>
                  <p className="mt-1 text-sm !text-slate-300">
                    Verification and stronger first impressions for pet parents.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold !text-white">
                    Get booked
                  </p>
                  <p className="mt-1 text-sm !text-slate-300">
                    Approved Gurus can manage activity from the Guru dashboard.
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <Link
                  href={guruApplyLink}
                  className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  Start Free Application
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Warm image gallery */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-semibold !text-slate-700">
              A warmer first impression
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight !text-slate-950 sm:text-4xl">
              Pet-friendly, welcoming, and built around trust
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
              The Guru experience should feel human from the first glance. Warm
              visuals help pet parents connect faster and help providers feel
              more approachable and trustworthy.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {warmGallery.map((item) => (
              <div
                key={item.title}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold !text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 !text-slate-700">
                    {item.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is a Guru */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold !text-slate-700">
              What is a Guru?
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight !text-slate-950 sm:text-4xl">
              A trusted local caregiver with room to grow
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
              SitGuru uses the word{" "}
              <span className="font-semibold !text-emerald-700">Guru</span> to
              create a broader and more human way to describe pet care
              providers. It supports a range of real services and real people,
              while still feeling trustworthy, modern, and professional.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guruTypes.map((type) => (
              <div
                key={type}
                className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-base font-semibold !text-slate-900">
                  {type}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-semibold !text-slate-700">
              Why join as a Guru?
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight !text-slate-950 sm:text-4xl">
              Join a platform built to help care providers feel visible and
              trusted
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
              SitGuru is meant to help local caregivers present themselves more
              clearly, connect with pet parents more confidently, and grow with
              a stronger professional presence.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="text-3xl">{benefit.icon}</div>
                <h3 className="mt-4 text-xl font-bold !text-slate-950">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-7 !text-slate-700">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold !text-slate-700">
                How it works
              </div>

              <h2 className="mt-5 text-3xl font-bold tracking-tight !text-slate-950 sm:text-4xl">
                Clear path from free application to first booking
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
                The Guru journey should feel simple and low-friction. Apply
                free, get reviewed, complete verification when approved, then
                manage your Guru activity inside SitGuru.
              </p>

              <div className="mt-5 rounded-[26px] border border-emerald-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-[0.18em] !text-emerald-700">
                  Option B built in
                </p>
                <p className="mt-2 text-sm leading-7 !text-slate-700 sm:text-base">
                  No upfront screening fee to apply. If approved, screening
                  costs may be deducted from your first completed booking.
                </p>
              </div>

              <div className="mt-8">
                <Link
                  href={guruApplyLink}
                  className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
                >
                  Apply Free
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold !text-white">
                      {item.step}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold !text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 !text-slate-700 sm:text-base">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dark trust section */}
      <section className="public-dark-section bg-slate-950 py-16 !text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold !text-emerald-300">
                The SitGuru standard
              </div>

              <h2 className="mt-5 text-3xl font-bold tracking-tight !text-white sm:text-4xl">
                Not one type of person. One standard of care.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 !text-slate-200 sm:text-lg">
                A Guru can come from many backgrounds, but the expectation is
                consistent: trustworthy, caring, responsive, and professional.
                SitGuru is meant to support providers who want to show up well
                and deliver real peace of mind.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold !text-slate-100"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-8 shadow-sm sm:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-4 py-1.5 text-sm font-semibold !text-emerald-800">
                Ready to become a Guru?
              </div>

              <h2 className="mt-5 text-3xl font-bold leading-tight !text-slate-950 sm:text-4xl">
                Apply Free. Get Approved. Get Booked.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
                Start your SitGuru Guru application at no cost. Once reviewed
                and approved, complete verification and begin accepting pet care
                bookings through your Guru dashboard.
              </p>

              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 !text-slate-600 sm:text-base">
                No upfront screening fee to apply. If approved, screening costs
                may be deducted from your first completed SitGuru booking.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href={guruApplyLink}
                  className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
                >
                  Apply Free
                </Link>

                <Link
                  href="/guru/login"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold !text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto"
                >
                  Guru Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
