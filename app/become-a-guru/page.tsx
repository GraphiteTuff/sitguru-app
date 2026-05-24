import Link from "next/link";

const guruApplyLink = "/signup?type=guru";

const providerTypes = [
  "Pet sitters",
  "Dog walkers",
  "Boarding providers",
  "Drop-in caregivers",
  "Dog trainers",
  "Groomers",
  "Experienced pet parents",
  "Students",
  "Retirees",
  "Trusted local helpers",
  "Small pet care businesses",
  "Independent providers",
];

const benefits = [
  {
    icon: "📣",
    title: "Get discovered by more Pet Parents",
    description:
      "Create a friendly Guru profile that gives local Pet Parents another trusted way to find your pet care services.",
  },
  {
    icon: "🐾",
    title: "Offer the services you enjoy",
    description:
      "Show Pet Parents whether you offer walking, drop-ins, sitting, boarding, training, grooming, or other trusted pet care support.",
  },
  {
    icon: "📅",
    title: "Choose availability that fits your life",
    description:
      "Use SitGuru to support open time slots, weekends, holidays, seasonal availability, or flexible local care opportunities.",
  },
  {
    icon: "📍",
    title: "Set your local service area",
    description:
      "Focus on the neighborhoods, towns, or nearby communities that make sense for you and the pet care services you want to provide.",
  },
  {
    icon: "⭐",
    title: "Build trust with every great experience",
    description:
      "Profiles, reviews, care details, and trust signals help Pet Parents feel more confident choosing a local Guru.",
  },
  {
    icon: "💚",
    title: "Built for new and experienced providers",
    description:
      "Whether you already provide pet care or want to start locally, SitGuru helps you present your services in a clear, professional way.",
  },
];

const steps = [
  {
    step: "01",
    title: "Join Free",
    description:
      "Create your Guru account and share the basic services you want Pet Parents to know about.",
  },
  {
    step: "02",
    title: "Build Your Profile",
    description:
      "Add your experience, service area, pet care style, photos, and details that help families feel comfortable choosing you.",
  },
  {
    step: "03",
    title: "Complete Trust Steps",
    description:
      "Finish simple trust and safety steps designed to help protect pets, families, Gurus, and the SitGuru community.",
  },
  {
    step: "04",
    title: "Start Getting Discovered",
    description:
      "Once approved and active, use SitGuru as another trusted way to connect with local Pet Parents looking for care.",
  },
];

const trustPoints = [
  "Free to join",
  "Choose your services",
  "Choose your availability",
  "Choose your local service area",
  "Helpful profile setup",
  "Trust and safety steps",
  "Pet Parent confidence tools",
  "Reviews and badges help approved Gurus stand out",
];

const quickBenefits = [
  "More visibility",
  "Local Pet Parent connections",
  "Flexible availability",
  "Easy profile sharing",
  "Trust-focused experience",
  "Helpful for open time slots",
];

const launchFit = [
  {
    title: "Students",
    description:
      "Great for students who love pets and want flexible local opportunities around classes, campus life, or breaks.",
  },
  {
    title: "Community helpers",
    description:
      "Ideal for trusted local caregivers, retirees, neighbors, and pet lovers who want to support families nearby.",
  },
  {
    title: "Military & veteran families",
    description:
      "A strong fit for veterans, military spouses, and transitioning service members who value flexible, community-based work.",
  },
];

const warmGallery = [
  {
    title: "More ways to be discovered",
    caption:
      "Give local Pet Parents another trusted place to find your pet care services.",
    image:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Flexible local opportunities",
    caption:
      "Use SitGuru to support open spots, weekends, holidays, and extra availability.",
    image:
      "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "A profile built for trust",
    caption:
      "Show Pet Parents who you are, what you offer, and why they can feel confident choosing you.",
    image:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function BecomeAGuruPage() {
  return (
    <main className="public-page min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#f1f5f9_100%)] pb-24 !text-slate-950 sm:pb-0">
      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        <Link
          href={guruApplyLink}
          className="flex min-h-14 w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-4 text-base font-black !text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          Join Free as a Guru
        </Link>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute right-0 top-8 h-72 w-72 rounded-full bg-slate-300/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-18 lg:px-8 lg:py-24">
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="relative z-10">
              <div className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-4 py-1.5 text-sm font-bold !text-emerald-800 shadow-sm">
                For Sitters, Walkers, Trainers & Pet Care Providers
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.03] tracking-[-0.04em] !text-slate-950 sm:text-5xl lg:text-6xl">
                Become a trusted local Pet Guru.
              </h1>

              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 !text-slate-800 sm:text-xl">
                Join SitGuru free and create a friendly profile that helps Pet
                Parents find your dog walking, pet sitting, drop-in, boarding,
                training, grooming, or local pet care services.
              </p>

              <div className="mt-6 rounded-[28px] border border-emerald-200 bg-white/95 p-5 shadow-[0_20px_55px_rgba(15,23,42,0.10)] sm:p-6">
                <p className="text-sm font-black uppercase tracking-[0.18em] !text-emerald-700">
                  Start here
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] !text-slate-950 sm:text-3xl">
                  Create a profile Pet Parents can trust.
                </h2>

                <p className="mt-3 text-base font-semibold leading-7 !text-slate-700">
                  Set up your Guru profile, choose the services you want to
                  offer, highlight your care style, and help nearby families
                  understand why you may be the right fit for their pets.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href={guruApplyLink}
                    className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-emerald-600 px-7 py-4 text-base font-black !text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 sm:w-auto"
                  >
                    Join Free as a Guru
                  </Link>

                  <Link
                    href="/guru/login"
                    className="inline-flex min-h-14 w-full items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-black !text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto"
                  >
                    Guru Login
                  </Link>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-black !text-slate-700">
                    Free to join
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-black !text-slate-700">
                    Choose services
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-black !text-slate-700">
                    Local connections
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 !text-slate-600 sm:text-base">
                SitGuru is designed for independent local Pet Gurus who want a
                simple, trusted way to present their services and connect with
                Pet Parents in their community.
              </p>
            </div>

            <div className="public-dark-section rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#0b1220_45%,#111827)] p-5 !text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-7">
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] !text-emerald-300">
                What is a Guru?
              </div>

              <h2 className="mt-4 text-2xl font-black !text-white sm:text-3xl">
                A trusted pet care provider Pet Parents can feel good about.
              </h2>

              <p className="mt-4 text-base leading-7 !text-slate-200">
                A Guru is a local pet care provider who helps Pet Parents with
                services such as walks, sitting, drop-ins, boarding, grooming,
                training, or reliable everyday pet care support.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold !text-white">
                    Choose your services
                  </p>
                  <p className="mt-1 text-sm !text-slate-300">
                    Show Pet Parents what care you offer and what types of pets
                    you enjoy helping.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold !text-white">
                    Choose your availability
                  </p>
                  <p className="mt-1 text-sm !text-slate-300">
                    Support care opportunities that fit your life, schedule, and
                    preferred local area.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold !text-white">
                    Build trust faster
                  </p>
                  <p className="mt-1 text-sm !text-slate-300">
                    A clear profile helps families understand your experience,
                    personality, and care style.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold !text-white">
                    Stay local
                  </p>
                  <p className="mt-1 text-sm !text-slate-300">
                    Focus on the neighborhoods and communities that make sense
                    for the way you provide care.
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <Link
                  href={guruApplyLink}
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-4 text-base font-black !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  Start Free Guru Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fast mobile signup reminder */}
      <section className="bg-white py-8 sm:hidden">
        <div className="mx-auto max-w-7xl px-4">
          <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 text-center shadow-sm">
            <h2 className="text-2xl font-black tracking-[-0.03em] !text-slate-950">
              Love pets and want to help local families?
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
              Join free and create a Guru profile that helps Pet Parents learn
              about your care services.
            </p>
            <Link
              href={guruApplyLink}
              className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-4 text-base font-black !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
              Join Free Now
            </Link>
          </div>
        </div>
      </section>

      {/* Quick benefits */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold !text-slate-700">
              Built for modern pet care providers
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.035em] !text-slate-950 sm:text-4xl">
              More visibility. More trust. More ways to connect.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
              SitGuru helps turn your pet care experience into a clear,
              mobile-friendly profile that Pet Parents can understand quickly.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickBenefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-black !text-slate-800 shadow-sm"
              >
                {benefit}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href={guruApplyLink}
              className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-emerald-600 px-7 py-4 text-base font-black !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
            >
              Join Free as a Guru
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-semibold !text-slate-700">
              Why join SitGuru?
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.035em] !text-slate-950 sm:text-4xl">
              A simple way to grow your local pet care presence
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
              Whether you are experienced, just getting started, or looking for
              another trusted place to share your services, SitGuru makes it
              easier for Pet Parents to learn about you.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg"
              >
                <div className="text-3xl">{benefit.icon}</div>
                <h3 className="mt-4 text-xl font-black !text-slate-950">
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
      <section className="bg-slate-50 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold !text-slate-700">
                How it works
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-[-0.035em] !text-slate-950 sm:text-4xl">
                Create your free profile and start getting discovered
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
                Join free, build your Guru profile, complete simple trust and
                safety steps, then use SitGuru as another way to connect with
                Pet Parents looking for local care.
              </p>

              <div className="mt-6 rounded-[28px] border border-emerald-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-[0.16em] !text-emerald-700">
                  Independent provider friendly
                </p>
                <p className="mt-2 text-sm font-semibold leading-7 !text-slate-700 sm:text-base">
                  Pet Gurus are independent local providers who choose the
                  services they offer, the availability they share, and the
                  local areas they want to serve.
                </p>
              </div>

              <div className="mt-6">
                <Link
                  href={guruApplyLink}
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-emerald-600 px-7 py-4 text-base font-black !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
                >
                  Join Free as a Guru
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-6"
                >
                  <div className="flex gap-4">
                    <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold !text-white">
                      {item.step}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-black !text-slate-950">
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

      {/* Provider types */}
      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-semibold !text-slate-700">
              Who can join?
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.035em] !text-slate-950 sm:text-4xl">
              If you love helping pets, SitGuru can help Pet Parents find you
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
              SitGuru is for experienced providers, new providers, and trusted
              local caregivers who want a simple way to be discovered by Pet
              Parents.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providerTypes.map((type) => (
              <div
                key={type}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-md"
              >
                <p className="text-base font-semibold !text-slate-900">
                  {type}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href={guruApplyLink}
              className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-emerald-600 px-7 py-4 text-base font-black !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
            >
              Start Free Guru Profile
            </Link>
          </div>
        </div>
      </section>

      {/* Program fit */}
      <section className="bg-emerald-50 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-sm font-semibold !text-emerald-800">
              Local programs
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.035em] !text-slate-950 sm:text-4xl">
              A flexible fit for students, communities, and military families
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
              SitGuru is building a local-first pet care community with simple
              pathways for people who want to help pets and families nearby.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {launchFit.map((item) => (
              <div
                key={item.title}
                className="rounded-[28px] border border-emerald-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-black !text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 !text-slate-700">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Warm image gallery */}
      <section className="bg-slate-50 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold !text-slate-700">
              A better way to present your services
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.035em] !text-slate-950 sm:text-4xl">
              Make it easier for Pet Parents to choose you
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
              A friendly, clear Guru profile helps Pet Parents understand your
              personality, services, and experience faster.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {warmGallery.map((item) => (
              <div
                key={item.title}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-56 w-full overflow-hidden sm:h-64">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black !text-slate-950">
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

      {/* Dark trust section */}
      <section className="public-dark-section bg-slate-950 py-12 !text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold !text-emerald-300">
                The SitGuru standard
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-[-0.035em] !text-white sm:text-4xl">
                More opportunity, with trust built in.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 !text-slate-200 sm:text-lg">
                SitGuru is built to help local pet care providers connect with
                Pet Parents while keeping the experience clear, friendly, and
                trust-focused for pets, families, and Gurus.
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
      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-6 shadow-sm sm:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-4 py-1.5 text-sm font-semibold !text-emerald-800">
                Ready to connect with more Pet Parents?
              </div>

              <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.035em] !text-slate-950 sm:text-4xl">
                Join SitGuru free and create a profile Pet Parents can find.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
                Show your services, choose your local focus, and give nearby Pet
                Parents another trusted place to learn about you.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href={guruApplyLink}
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-emerald-600 px-7 py-4 text-base font-black !text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
                >
                  Join Free as a Guru
                </Link>

                <Link
                  href="/guru/login"
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-black !text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto"
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
