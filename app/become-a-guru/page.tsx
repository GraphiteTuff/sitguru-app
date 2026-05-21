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
      "SitGuru gives you another trusted place where local Pet Parents can find your pet care services.",
  },
  {
    icon: "🐾",
    title: "Connect with families looking for care",
    description:
      "Pet Parents need sitters, walkers, trainers, boarding, drop-ins, grooming, and reliable help. SitGuru helps them connect with providers like you.",
  },
  {
    icon: "📅",
    title: "Fill open availability",
    description:
      "Use SitGuru to help fill slower days, open time slots, weekends, holidays, or extra availability.",
  },
  {
    icon: "⚡",
    title: "Make it easier for Pet Parents to choose you",
    description:
      "A clear Guru profile helps Pet Parents quickly understand your services, experience, location, and care style.",
  },
  {
    icon: "⭐",
    title: "Build trust faster",
    description:
      "Profiles, reviews, badges, and trust signals help Pet Parents feel more confident reaching out and booking care.",
  },
  {
    icon: "💚",
    title: "Built for providers already doing pet care",
    description:
      "SitGuru is not just for beginners. It is for sitters, walkers, trainers, groomers, and caregivers who want another way to connect with Pet Parents.",
  },
];

const steps = [
  {
    step: "01",
    title: "Join Free",
    description:
      "Create your free Guru account and tell Pet Parents what services you offer.",
  },
  {
    step: "02",
    title: "Build Your Profile",
    description:
      "Add your experience, location, services, photos, and details that help Pet Parents feel comfortable choosing you.",
  },
  {
    step: "03",
    title: "Trust & Safety",
    description:
      "Complete simple trust and safety steps that help protect pets, families, Gurus, and the SitGuru community.",
  },
  {
    step: "04",
    title: "Get Connected",
    description:
      "Once approved and active, use SitGuru as another way to connect with Pet Parents looking for trusted care.",
  },
];

const trustPoints = [
  "Free to join",
  "Built for expert pet care providers",
  "Connect with Pet Parents",
  "Helpful for filling open availability",
  "Simple Guru profile setup",
  "Trust and safety steps help protect the community",
  "Clear profiles help Pet Parents feel confident",
  "Reviews and badges help approved Gurus stand out",
];

const quickBenefits = [
  "More visibility",
  "More Pet Parent connections",
  "More booking opportunities",
  "Easier profile sharing",
  "Helpful for open availability",
  "Built around trust",
];

const warmGallery = [
  {
    title: "More ways to be discovered",
    caption:
      "Give local Pet Parents another trusted place to find your services.",
    image:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "More flexible booking opportunities",
    caption:
      "Use SitGuru to help fill open spots, weekends, holidays, and extra availability.",
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
                Get discovered by more Pet Parents with SitGuru.
              </h1>

              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 !text-slate-800 sm:text-xl">
                Already a sitter, walker, trainer, groomer, boarding provider,
                or trusted caregiver? SitGuru helps you connect with Pet Parents
                looking for reliable pet care in their area.
              </p>

              <div className="mt-6 rounded-[28px] border border-emerald-200 bg-white/95 p-5 shadow-[0_20px_55px_rgba(15,23,42,0.10)] sm:p-6">
                <p className="text-sm font-black uppercase tracking-[0.18em] !text-emerald-700">
                  Start here
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] !text-slate-950 sm:text-3xl">
                  Create a profile Pet Parents can find.
                </h2>

                <p className="mt-3 text-base font-semibold leading-7 !text-slate-700">
                  You do not have to start from scratch. Create your free Guru
                  profile, show what you already offer, and give more Pet
                  Parents a trusted way to connect with you.
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
                    More visibility
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-black !text-slate-700">
                    Pet Parent connections
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 !text-slate-600 sm:text-base">
                SitGuru uses a simple review process and trust and safety steps
                to help Pet Parents feel confident and help approved Gurus stand
                out.
              </p>
            </div>

            <div className="public-dark-section rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#0b1220_45%,#111827)] p-5 !text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-7">
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] !text-emerald-300">
                What is a Guru?
              </div>

              <h2 className="mt-4 text-2xl font-black !text-white sm:text-3xl">
                An expert pet care provider Pet Parents can trust.
              </h2>

              <p className="mt-4 text-base leading-7 !text-slate-200">
                A Guru is an expert pet care provider. On SitGuru, that can mean
                a sitter, walker, trainer, groomer, boarding provider, drop-in
                caregiver, or experienced pet person who helps Pet Parents find
                trusted care.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold !text-white">
                    Connect with Pet Parents
                  </p>
                  <p className="mt-1 text-sm !text-slate-300">
                    Give local families another trusted way to find your care
                    services.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold !text-white">
                    Fill open availability
                  </p>
                  <p className="mt-1 text-sm !text-slate-300">
                    Use SitGuru to help fill slower days, weekends, holidays,
                    and open time slots.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold !text-white">
                    Build trust faster
                  </p>
                  <p className="mt-1 text-sm !text-slate-300">
                    A clear profile helps Pet Parents understand why they should
                    choose you.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold !text-white">
                    Keep it convenient
                  </p>
                  <p className="mt-1 text-sm !text-slate-300">
                    Create your profile once and use it to support new booking
                    opportunities.
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
              Want more Pet Parents to find you?
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
              Join free and create a Guru profile that helps Pet Parents connect
              with your care services.
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
              Built for busy pet care providers
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.035em] !text-slate-950 sm:text-4xl">
              More visibility. More convenience. More ways to connect.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
              SitGuru helps you turn your existing experience into a clearer,
              easier-to-find profile that can connect you with new Pet Parents.
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
              A simple way to connect with more Pet Parents
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
              Whether you are already booked often or just want extra
              opportunities, SitGuru gives you another trusted place to show
              your services and reach Pet Parents nearby.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm"
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
                Pet Parents looking for care.
              </p>

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
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
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
              If you provide pet care, SitGuru can help Pet Parents find you
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 !text-slate-700 sm:text-lg">
              SitGuru is for experienced providers, new providers, and trusted
              local caregivers who want another way to be discovered by Pet
              Parents.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providerTypes.map((type) => (
              <div
                key={type}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm"
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
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
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
                SitGuru is built to help expert pet care providers connect with
                Pet Parents while keeping the experience safe, clear, and
                trusted for pets, families, and Gurus.
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
                Create your Guru profile, show your services, and give local Pet
                Parents another trusted place to connect with you.
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