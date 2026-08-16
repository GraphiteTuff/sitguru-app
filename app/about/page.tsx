import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Gift,
  Handshake,
  Heart,
  HeartHandshake,
  HelpCircle,
  MapPin,
  PawPrint,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About SitGuru | Trusted Pet Care. Simplified.",
  description:
    "SitGuru is a trusted pet care marketplace built by Pet Parents. Connect with local Gurus, grow as an Ambassador, join Programs, earn PetPerks, and partner with the pack.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About SitGuru | Trusted Pet Care. Simplified.",
    description:
      "Trusted local pet care for Pet Parents, Gurus, Ambassadors, and partners — built by Pet Parents who get it.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About SitGuru | Trusted Pet Care. Simplified.",
    description:
      "Trusted local pet care for Pet Parents, Gurus, Ambassadors, and partners — built by Pet Parents who get it.",
  },
};

const audiences = [
  {
    title: "Pet Parents",
    description:
      "Find local Gurus you can trust — for walks, sitting, boarding, drop-ins, and more — then build care relationships that stick.",
    href: "/signup",
    cta: "Join Free",
    icon: <Heart size={22} />,
    points: [
      "Discover trusted Gurus nearby",
      "Compare services and profiles",
      "Book with clearer expectations",
      "Keep care details easier to manage",
    ],
  },
  {
    title: "Gurus",
    description:
      "Gurus are expert pet care providers — sitters, walkers, trainers, groomers, boarding hosts, and experienced caregivers who lead with reliability.",
    href: "/become-a-guru",
    cta: "Become a Guru",
    icon: <PawPrint size={22} />,
    points: [
      "Build a trusted local profile",
      "Get discovered by Pet Parents",
      "Show services clearly",
      "Grow through consistent care",
    ],
  },
  {
    title: "Ambassadors",
    description:
      "Help SitGuru grow by introducing Pet Parents, future Gurus, and local partners through real community connections.",
    href: "/programs/ambassadors",
    cta: "Explore Ambassadors",
    icon: <HeartHandshake size={22} />,
    points: [
      "Share SitGuru with your network",
      "Support community outreach",
      "Earn eligible recognition",
      "Pair with PetPerks referrals",
    ],
  },
  {
    title: "Partners & Programs",
    description:
      "Schools, workforce groups, military orgs, rescues, local businesses, and brands can refer people or collaborate with SitGuru.",
    href: "/partners",
    cta: "Partner with Us",
    icon: <Handshake size={22} />,
    points: [
      "Student, Community & Veterans pathways",
      "Local and national partner options",
      "Clear referral and application routes",
      "Grow trusted care in your community",
    ],
  },
];

const careSteps = [
  {
    number: "01",
    title: "Find local care",
    description:
      "Pet Parents discover Gurus nearby and compare services that fit their pet’s routine and personality.",
  },
  {
    number: "02",
    title: "Connect with confidence",
    description:
      "Clear profiles, helpful details, and trust-focused steps make choosing care feel more personal and reassuring.",
  },
  {
    number: "03",
    title: "Build lasting relationships",
    description:
      "SitGuru supports communication, repeat care, and the kind of trust that grows visit after visit.",
  },
];

const trustPoints = [
  {
    title: "Trust before transactions",
    description:
      "Profiles, clarity, and care standards come first — so Pet Parents can choose with confidence and Gurus can stand out for the right reasons.",
  },
  {
    title: "Human support when it matters",
    description:
      "Technology makes discovery and booking easier, but real people still need real help. Our goal is responsive, thoughtful support.",
  },
  {
    title: "Local care, everywhere it happens",
    description:
      "Whether care is in a city, suburb, town, or township, SitGuru is built for the communities where pets actually live.",
  },
];

const growthPaths = [
  {
    title: "Become a Guru",
    description: "The primary path for independent pet care providers.",
    href: "/become-a-guru",
    cta: "Start here",
    icon: <PawPrint size={20} />,
  },
  {
    title: "Programs",
    description: "Student, Community, Veterans & Military Families, and Ambassadors.",
    href: "/programs",
    cta: "View programs",
    icon: <UsersRound size={20} />,
  },
  {
    title: "PetPerks",
    description: "Share SitGuru, refer friends or future Gurus, and earn rewards.",
    href: "/petperks",
    cta: "See rewards",
    icon: <Gift size={20} />,
  },
  {
    title: "Careers",
    description: "Marketplace paths today, guided programs, and future team roles.",
    href: "/careers",
    cta: "Explore careers",
    icon: <Sparkles size={20} />,
  },
];

const values = [
  {
    title: "Trust",
    description: "Confidence in the people, process, and platform behind every care connection.",
  },
  {
    title: "Care",
    description: "Every feature should support pets and the peace of mind of the people who love them.",
  },
  {
    title: "Community",
    description: "Local relationships across neighborhoods, towns, cities, and townships.",
  },
  {
    title: "Clarity",
    description: "Simple, organized, transparent experiences for Pet Parents and Gurus.",
  },
  {
    title: "Connection",
    description: "Communication and consistency that turn one booking into lasting care.",
  },
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
    type: "German Shorthaired Pointer · SitGuru mascot energy",
    image: "/about/rogue.jpeg",
    alt: "Rogue the German Shorthaired Pointer, SitGuru mascot",
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

const faqs = [
  {
    q: "What is SitGuru?",
    a: "SitGuru is a trusted pet care marketplace that helps Pet Parents connect with local Gurus — expert caregivers for walks, sitting, boarding, training support, and more. Tagline: Trusted Pet Care. Simplified.",
  },
  {
    q: "What is a Guru?",
    a: "A Guru is an expert pet care provider on SitGuru — a sitter, walker, trainer, groomer, boarding host, drop-in caregiver, or experienced pet person who leads with reliability and heart.",
  },
  {
    q: "Is SitGuru only for big cities?",
    a: "No. Pet care is local everywhere. SitGuru is built to support Pet Parents and Gurus across cities, suburbs, towns, and townships.",
  },
  {
    q: "How do Ambassadors, Programs, and PetPerks fit in?",
    a: "Programs are guided pathways into SitGuru. Ambassadors help the pack grow through outreach. PetPerks is the public share-and-earn referral program; PawPerks is where Pet Parents track rewards after signing in.",
  },
  {
    q: "Who built SitGuru?",
    a: "SitGuru is locally owned and operated from Quakertown, PA, and is being built by husband-and-wife founders Jason and Danette — Pet Parents who wanted care to feel more trusted, personal, and community-centered.",
  },
  {
    q: "How do I get started?",
    a: "Pet Parents can join free and find local care. Providers can become a Guru or apply through Programs. Partners can explore the Partner Network. Ambassadors can apply through the Ambassador Program.",
  },
];

function SectionLabel({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      {icon ? (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
          {icon}
        </span>
      ) : null}
      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
        {children}
      </p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7faf7] pb-[calc(6rem+env(safe-area-inset-bottom))] text-slate-950 sm:pb-0">
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg gap-2">
          <Link
            href="/signup"
            className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#0D5C3A] px-4 py-3 text-base font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#09462C]"
          >
            Join Free
          </Link>
          <Link
            href="/become-a-guru"
            className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-full border border-emerald-200 bg-white px-4 py-3 text-base font-black text-emerald-900 transition hover:bg-emerald-50"
          >
            Become a Guru
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden bg-[#0D5C3A]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <PawPrint className="absolute right-[8%] top-16 h-16 w-16 rotate-12 text-white/10" />
          <Heart className="absolute bottom-20 left-[6%] h-10 w-10 text-white/10" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-20">
          <div
            data-brand-green
            className="public-dark-section"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] !text-white backdrop-blur">
              <Image
                src="/images/sitguru-logo-cropped.png"
                alt=""
                width={22}
                height={22}
                className="h-5 w-5 object-contain mix-blend-multiply brightness-0 invert"
              />
              SitGuru — Trusted Pet Care. Simplified.
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.045em] !text-white sm:text-5xl lg:text-6xl">
              Built by Pet Parents for trusted local pet care.
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 !text-emerald-50 sm:text-lg">
              SitGuru connects Pet Parents with local Gurus — expert caregivers
              who lead with reliability, communication, and heart.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/signup"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-black text-emerald-950 shadow-xl shadow-black/15 transition hover:bg-emerald-50 sm:w-auto"
              >
                Join SitGuru Free
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/become-a-guru"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-base font-black !text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
              >
                Become a Guru
                <PawPrint size={18} />
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/20 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-5">
            <div className="overflow-hidden rounded-[26px] bg-white">
              <div className="relative aspect-[5/4] w-full">
                <Image
                  src="/about/rogue.jpeg"
                  alt="Rogue, SitGuru’s high-energy German Shorthaired Pointer mascot"
                  fill
                  priority
                  className="object-cover object-[center_30%]"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
              <div className="bg-white p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Meet Rogue
                </p>
                <h2 className="mt-1 text-2xl font-black text-emerald-950">
                  GSP energy. Pack heart.
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Rogue — our German Shorthaired Pointer — captures the spirit
                  behind SitGuru: loyal, high-energy, and fiercely loving about
                  pets and the people who care for them.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Pet Parents", "Gurus", "Ambassadors", "Partners"].map(
                    (label) => (
                      <span
                        key={label}
                        className="rounded-full bg-[#f7faf4] px-3 py-1 text-xs font-black text-emerald-900"
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <SectionLabel icon={<MapPin size={16} />}>Our story</SectionLabel>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
                Pet care should feel personal, local, and supported.
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                Choosing care for a beloved pet should never feel rushed or
                confusing. Pet Parents deserve confidence in who they choose.
                Gurus deserve a place where real care and communication stand
                out.
              </p>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                SitGuru was built from a Pet Parent perspective — by people who
                know what it feels like to love pets deeply, protect their
                routines, and want someone dependable nearby.
              </p>
            </div>

            <div className="rounded-[28px] border border-emerald-100 bg-[#f8fcf8] p-5 sm:p-6">
              <SectionLabel icon={<Heart size={16} />}>Mission</SectionLabel>
              <h3 className="mt-2 text-2xl font-black text-emerald-950">
                Make trusted pet care simpler — without making it less human.
              </h3>
              <ul className="mt-5 space-y-3">
                {[
                  "Help Pet Parents find local care they can trust",
                  "Help Gurus grow through clarity and consistency",
                  "Strengthen community connections around pets",
                  "Keep technology in service of real relationships",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-700"
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-emerald-700"
                      size={16}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 max-w-3xl">
            <SectionLabel icon={<UsersRound size={16} />}>
              Who we serve
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              One pack. Different ways to belong.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              SitGuru is for Pet Parents seeking care, Gurus providing it,
              Ambassadors growing the community, and partners who help people
              find the right path in.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {audiences.map((audience) => (
              <article
                key={audience.title}
                className="flex flex-col rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0D5C3A] text-white">
                  {audience.icon}
                </div>
                <h3 className="mt-4 text-xl font-black text-emerald-950">
                  {audience.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {audience.description}
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {audience.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-700"
                    >
                      <CheckCircle2
                        className="mt-0.5 shrink-0 text-emerald-700"
                        size={15}
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={audience.href}
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white transition hover:bg-[#09462C]"
                >
                  {audience.cta}
                  <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="max-w-3xl">
            <SectionLabel icon={<PawPrint size={16} />}>
              How care works
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              A clearer path from search to trusted care.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {careSteps.map((step) => (
              <div
                key={step.number}
                className="rounded-[26px] border border-[#e3ece5] bg-[#fbfcf9] p-5"
              >
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-900">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-black text-emerald-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-6 max-w-3xl">
            <SectionLabel icon={<ShieldCheck size={16} />}>
              Trust &amp; safety
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Confidence is part of the product.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              SitGuru is designed so Pet Parents can choose with more clarity —
              and Gurus can earn trust through professionalism, communication,
              and care that shows.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {trustPoints.map((item) => (
              <div
                key={item.title}
                className="rounded-[26px] border border-[#e3ece5] bg-[#fbfcf9] p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <BadgeCheck size={20} />
                </div>
                <h3 className="mt-4 text-lg font-black text-emerald-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-6 max-w-3xl">
            <SectionLabel icon={<Sparkles size={16} />}>
              Grow with SitGuru
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Pathways for providers, advocates, and partners.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              Whether you already provide care, want a guided on-ramp, love
              referring friends, or represent an organization — there is a clear
              next step.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {growthPaths.map((path) => (
              <Link
                key={path.title}
                href={path.href}
                className="group rounded-[26px] border border-[#e3ece5] bg-[#fbfcf9] p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0D5C3A] text-white">
                  {path.icon}
                </div>
                <h3 className="mt-4 text-lg font-black text-emerald-950">
                  {path.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {path.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-emerald-800">
                  {path.cta}
                  <ArrowRight
                    size={15}
                    className="transition group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <SectionLabel icon={<Heart size={16} />}>Our values</SectionLabel>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
            What shapes every SitGuru decision.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-[24px] border border-[#e3ece5] bg-[#fbfcf9] p-5"
              >
                <h3 className="text-lg font-black text-emerald-950">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="sr-only">
            <h2>The People Behind SitGuru</h2>
            <p>
              Built by Pet Parents who believe care should feel more human.
              SitGuru is locally owned and operated from Quakertown, PA, and is
              being built by husband-and-wife founders Jason and Danette. Their
              shared vision is to create a more trusted, thoughtful, and
              community-centered experience for pet care — one where pets come
              first, communication matters, and people who truly care can stand
              out.
            </p>
          </div>
          <Image
            src="/about/people-behind-sitguru.png"
            alt="The People Behind SitGuru graphic featuring founders Jason and Danette, their roles, and the SitGuru mission."
            width={1600}
            height={1000}
            className="h-auto w-full rounded-[24px] border border-emerald-100"
          />
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="max-w-3xl">
            <SectionLabel icon={<PawPrint size={16} />}>
              Meet the pets behind the mission
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Our pet family keeps the mission real.
            </h2>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
              SitGuru is personal because we are Pet Parents too. Scout and
              Rogue (our GSPs), Delilah, Taco, and Belle remind us daily that
              every pet has a unique personality, routine, and need for
              thoughtful care.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {pets.map((pet) => (
              <div
                key={pet.name}
                className="overflow-hidden rounded-[24px] border border-emerald-100 bg-[#f8fcf8]"
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
                <div className="p-4">
                  <h3 className="text-lg font-black text-emerald-950">
                    {pet.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {pet.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
              <HelpCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
                FAQ
              </p>
              <h2 className="text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl">
                Quick answers about SitGuru
              </h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-5"
              >
                <h3 className="text-base font-black text-emerald-950">
                  {item.q}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          data-brand-green
          className="public-dark-section rounded-[32px] bg-[#0D5C3A] p-6 text-white shadow-sm sm:p-8"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-100">
                Ready to join the pack?
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight !text-white sm:text-4xl">
                Trusted pet care starts with the right local connection.
              </h2>
              <p className="mt-3 max-w-3xl text-base font-semibold leading-7 !text-white/85">
                Join free as a Pet Parent, become a Guru, explore Programs, or
                partner with SitGuru — and help make local pet care feel more
                trusted, personal, and supported.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-50 sm:w-auto"
              >
                Join Free
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/become-a-guru"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-black !text-white transition hover:bg-white/15 sm:w-auto"
              >
                Become a Guru
                <PawPrint size={17} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
