import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, PawPrint, ShieldCheck } from "lucide-react";

const pillars = [
  {
    title: "Local Care, Wherever You Are",
    description:
      "Whether care happens in a city, small town, suburb, neighborhood, or township, SitGuru is built to support trusted local pet care connections.",
  },
  {
    title: "Pet Parents Helping Pet Parents",
    description:
      "We are local Pet Parents too. SitGuru is shaped around the same concerns families have when choosing someone to care for a pet they love.",
  },
  {
    title: "Trust Before Transactions",
    description:
      "Pet care should feel personal, clear, and reassuring. SitGuru is built to help Pet Parents choose with confidence and help Gurus stand out through trust.",
  },
];

const values = [
  {
    title: "Trust",
    description:
      "Pet Parents should feel confident in the people, process, and platform behind every care connection.",
  },
  {
    title: "Care",
    description:
      "Every feature should support the well-being of pets and the peace of mind of the people who love them.",
  },
  {
    title: "Community",
    description:
      "SitGuru is built to support local care relationships across states, neighborhoods, towns, and townships.",
  },
  {
    title: "Clarity",
    description:
      "Pet Parents and Gurus deserve a platform that feels simple, organized, transparent, and easy to use.",
  },
  {
    title: "Connection",
    description:
      "The best care grows through communication, consistency, trust, and relationships that build over time.",
  },
];

const steps = [
  {
    number: "01",
    title: "Find local care",
    description:
      "Pet Parents can discover Gurus nearby and compare services, profiles, and care options that fit their pet’s needs.",
  },
  {
    number: "02",
    title: "Connect with confidence",
    description:
      "Clear profiles, helpful details, and trust-focused tools help Pet Parents feel better about who they choose.",
  },
  {
    number: "03",
    title: "Build trusted relationships",
    description:
      "SitGuru is designed to support better communication, repeat care, and stronger long-term pet care connections.",
  },
];

const audience = [
  {
    title: "For Pet Parents",
    description:
      "SitGuru helps Pet Parents find trusted local pet care with more confidence. Whether you live in a city, suburb, small town, or township, the goal is the same: help you connect with reliable Gurus who care.",
    points: [
      "Find care with greater confidence",
      "Connect with trusted local Gurus",
      "Keep pet care details easier to manage",
      "Build repeat relationships with providers you trust",
    ],
  },
  {
    title: "For Gurus",
    description:
      "A Guru is an expert pet care provider — a sitter, walker, trainer, groomer, boarding provider, drop-in caregiver, or experienced pet person who helps Pet Parents care for their pets.",
    points: [
      "Create a trusted professional presence",
      "Help Pet Parents understand your services",
      "Get discovered in your local community",
      "Grow through communication, consistency, and care",
    ],
  },
];

const localSupportPoints = [
  "Every state",
  "Every community",
  "Every city",
  "Every town",
  "Every township",
  "Every trusted local care connection",
];

const pets = [
  {
    name: "Scout",
    type: "German Shorthaired Pointer",
    image: "/about/scout.jpeg",
    alt: "Scout the German Shorthaired Pointer",
  },
  {
    name: "Rogue",
    type: "German Shorthaired Pointer",
    image: "/about/rogue.jpeg",
    alt: "Rogue the German Shorthaired Pointer",
  },
  {
    name: "Delilah",
    type: "American Cocker Spaniel",
    image: "/about/delilah.jpeg",
    alt: "Delilah the American Cocker Spaniel",
  },
  {
    name: "Taco",
    type: "Cat",
    image: "/about/Taco.jpeg",
    alt: "Taco the cat",
  },
  {
    name: "Belle",
    type: "Cat",
    image: "/about/belle.jpeg",
    alt: "Belle the cat",
  },
];

function SectionEyebrow({
  icon = "paw",
  children,
}: {
  icon?: "paw" | "heart" | "map" | "shield";
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        {icon === "heart" ? (
          <Heart className="h-4 w-4" />
        ) : icon === "map" ? (
          <MapPin className="h-4 w-4" />
        ) : icon === "shield" ? (
          <ShieldCheck className="h-4 w-4" />
        ) : (
          <PawPrint className="h-4 w-4" />
        )}
      </span>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700 sm:tracking-[0.28em]">
        {children}
      </p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fffb_0%,#f3fbf7_48%,#ffffff_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <PawPrint className="absolute left-[6%] top-28 h-10 w-10 rotate-[-18deg] text-emerald-200/70" />
        <Heart className="absolute right-[8%] top-44 h-8 w-8 text-emerald-200/70" />
        <PawPrint className="absolute right-[10%] top-[24%] h-12 w-12 rotate-[12deg] text-emerald-100" />
        <Heart className="absolute left-[8%] top-[42%] h-8 w-8 text-emerald-100" />
        <PawPrint className="absolute left-[12%] top-[64%] h-10 w-10 rotate-[8deg] text-emerald-100" />
        <Heart className="absolute right-[12%] top-[78%] h-8 w-8 text-emerald-200/70" />
        <PawPrint className="absolute right-[6%] bottom-24 h-12 w-12 rotate-[-10deg] text-emerald-100" />
      </div>

      <section className="relative border-b border-emerald-100 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,_#f7fffb_0%,_#effcf5_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-5xl text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Heart className="h-4 w-4" />
              </span>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-700 sm:tracking-[0.32em]">
                About SitGuru
              </p>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <PawPrint className="h-4 w-4" />
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Built by Pet Parents. Made for trusted local pet care.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-700 sm:text-lg">
              SitGuru is a pet care marketplace helping Pet Parents connect with
              trusted local Gurus — expert pet care providers who lead with
              care, communication, reliability, and heart.
            </p>

            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              We support Pet Parents and Gurus no matter which state, community,
              city, town, or township they call home. Because at the heart of
              SitGuru, we are local Pet Parents too.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-emerald-600 px-7 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
              >
                Join SitGuru Free
              </Link>

              <Link
                href="/become-a-guru"
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-emerald-200 bg-white px-7 py-4 text-base font-black text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
              >
                Become a Guru
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <div
              key={pillar.title}
              className="relative rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
            >
              <span className="absolute right-5 top-5 text-emerald-200">
                {index === 0 ? (
                  <MapPin className="h-5 w-5" />
                ) : index === 1 ? (
                  <Heart className="h-5 w-5" />
                ) : (
                  <PawPrint className="h-5 w-5" />
                )}
              </span>
              <h2 className="pr-8 text-xl font-black text-slate-900">
                {pillar.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
            <SectionEyebrow icon="paw">Why SitGuru Exists</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Pet care should feel personal, local, and supported.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Choosing care for a beloved pet should never feel rushed,
              confusing, or disconnected. Pet Parents deserve to feel confident
              in who they choose, and Gurus deserve a place where real care,
              professionalism, and communication can stand out.
            </p>
            <p className="mt-5 text-base leading-8 text-slate-600">
              SitGuru was built from a Pet Parent perspective. We know what it
              feels like to love pets deeply, worry about their routine, and
              want someone dependable nearby who will treat them with genuine
              care.
            </p>
          </div>

          <div className="rounded-[32px] border border-emerald-200 bg-emerald-50 p-6 shadow-[0_10px_30px_rgba(16,185,129,0.08)] sm:p-8">
            <SectionEyebrow icon="map">Local Support</SectionEyebrow>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Wherever care happens, SitGuru is built to support it.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-700">
              Pet care is local. It happens between real people in real
              communities. SitGuru is here to support Pet Parents and Gurus
              across the places they live, work, walk, visit, and provide care.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {localSupportPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <SectionEyebrow icon="shield">What Is a Guru?</SectionEyebrow>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                A Guru is an expert pet care provider.
              </h2>
            </div>

            <div>
              <p className="text-base leading-8 text-slate-600">
                On SitGuru, a Guru can be a sitter, walker, trainer, groomer,
                boarding provider, drop-in caregiver, or experienced pet person
                who helps Pet Parents care for their pets.
              </p>
              <p className="mt-5 text-base leading-8 text-slate-600">
                Gurus are more than available helpers. They are people who lead
                with reliability, communication, compassion, and respect for
                each pet’s routine, personality, and needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {audience.map((group, index) => (
            <div
              key={group.title}
              className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-8"
            >
              <SectionEyebrow icon={index === 0 ? "heart" : "paw"}>
                {group.title}
              </SectionEyebrow>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                {group.description}
              </p>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
                {group.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
          <div className="max-w-2xl">
            <SectionEyebrow icon="paw">How SitGuru Works</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              A simpler way to connect Pet Parents and trusted Gurus.
            </h2>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-[24px] border border-emerald-100 bg-emerald-50/50 p-6"
              >
                <p className="text-sm font-black tracking-[0.24em] text-emerald-700">
                  {step.number}
                </p>
                <h3 className="mt-4 text-xl font-black text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#f0fdf4_50%,#ffffff_100%)] p-6 shadow-[0_10px_30px_rgba(16,185,129,0.08)] sm:p-8 lg:p-10">
          <SectionEyebrow icon="heart">Built on Human Connection</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Technology should make pet care feel more human, not less.
          </h2>
          <p className="mt-5 max-w-4xl text-base leading-8 text-slate-700">
            SitGuru is built around real people, real pets, and real local
            communities. The platform can make discovery, profiles, and booking
            easier, but the heart of care will always be human connection.
          </p>
          <p className="mt-5 max-w-4xl text-base leading-8 text-slate-700">
            When questions or concerns come up, Pet Parents and Gurus should not
            feel alone. Our goal is to build an experience that feels
            thoughtful, responsive, and supportive from the first search to the
            last update.
          </p>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <SectionEyebrow icon="paw">Our Values</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              The principles shaping SitGuru.
            </h2>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="relative rounded-[24px] border border-emerald-100 bg-emerald-50/50 p-6"
              >
                <span className="absolute right-4 top-4 text-emerald-200">
                  {index % 2 === 0 ? (
                    <PawPrint className="h-4 w-4" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {value.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6 lg:p-8">
          <div className="sr-only">
            <h2>The People Behind SitGuru</h2>
            <p>
              Built by Pet Parents who believe care should feel more human.
              SitGuru is locally owned and operated form Quakertown, PA, and is being built by husband-and-wife founders Jason and
              Danette. Their shared vision is to create a more trusted,
              thoughtful, and community-centered experience for pet care — one
              where pets come first, communication matters, and people who truly
              care can stand out.
            </p>
          </div>

          <Image
            src="/about/people-behind-sitguru.png"
            alt="The People Behind SitGuru graphic featuring founders Jason and Danette, their roles, and the SitGuru mission."
            width={1600}
            height={1000}
            priority
            className="h-auto w-full rounded-[24px] border border-emerald-100"
          />
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <SectionEyebrow icon="paw">
              Meet the Pets Behind the Mission
            </SectionEyebrow>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Our own pet family helps shape the heart behind SitGuru.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              SitGuru is personal to us because we are Pet Parents too. Our
              family includes Scout and Rogue, our German Shorthaired Pointers,
              Delilah, our American Cocker Spaniel, and our cats, Taco and
              Belle. They remind us every day that every pet has a unique
              personality, routine, comfort zone, and need for thoughtful care.
            </p>
          </div>

          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {pets.map((pet) => (
              <div
                key={pet.name}
                className="overflow-hidden rounded-[24px] border border-emerald-100 bg-emerald-50/40"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={pet.image}
                    alt={pet.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 20vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black text-slate-950">
                    {pet.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{pet.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-6 text-center shadow-[0_10px_30px_rgba(16,185,129,0.08)] sm:p-10">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Heart className="h-4 w-4" />
            </span>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700 sm:tracking-[0.28em]">
              Join SitGuru
            </p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <PawPrint className="h-4 w-4" />
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Be part of a more trusted local pet care marketplace.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
            SitGuru is built for Pet Parents who want confidence and for Gurus
            who want to connect with families in the communities they serve.
            Wherever pet care happens, our goal is to make it feel more trusted,
            more personal, and more supported.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-emerald-600 px-7 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
            >
              Join SitGuru Free
            </Link>

            <Link
              href="/become-a-guru"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-emerald-200 bg-white px-7 py-4 text-base font-black text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
            >
              Become a Guru
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}