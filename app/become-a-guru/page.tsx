import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Gift,
  GraduationCap,
  Handshake,
  HeartHandshake,
  HelpCircle,
  MapPinned,
  MessageSquare,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
import { SCOUT_AVATAR } from "@/lib/companions/avatar-assets";
import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

export const metadata: Metadata = {
  title: "Become a Guru | Earn Caring for Pets on SitGuru",
  description:
    "Become a SitGuru Guru — build a trusted local profile, set your services and rates, share PawReports, get discovered by Pet Parents, and earn on your schedule.",
  alternates: {
    canonical: "/become-a-guru",
  },
  openGraph: {
    title: "Become a Guru | Earn Caring for Pets on SitGuru",
    description:
      "More than a sitter. Build your pet care business with SitGuru — local discovery, schedule control, PawReports, and payouts.",
    url: "/become-a-guru",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Become a Guru | Earn Caring for Pets on SitGuru",
    description:
      "More than a sitter. Build your pet care business with SitGuru — local discovery, schedule control, PawReports, and payouts.",
  },
};

const guruLoginLink = "/login?role=guru&next=/guru/dashboard";
const addGuruToExistingAccountLink =
  "/login?next=/become-a-sitter";

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

const promisePoints = [
  {
    title: "Get discovered locally",
    description:
      "A professional Guru profile helps nearby Pet Parents find the care you already love providing.",
    icon: <MapPinned size={22} />,
  },
  {
    title: "Stay in full control",
    description:
      "You choose services, rates, availability, service area, and which booking requests to accept.",
    icon: <CalendarDays size={22} />,
  },
  {
    title: "Win trust with PawReports",
    description:
      "Share photos, notes, walk progress, and live visit updates that turn one booking into repeat care.",
    icon: <PawPrint size={22} />,
  },
  {
    title: "Earn your way",
    description:
      "Track earnings, complete payout setup, and grow through reliable care — not a rigid 9-to-5.",
    icon: <Banknote size={22} />,
  },
];

const toolkit = [
  {
    title: "Public Guru profile",
    description:
      "Show experience, photos, care style, services, and the neighborhoods you serve.",
    icon: <BadgeCheck size={20} />,
  },
  {
    title: "Services, rates & availability",
    description:
      "Offer walking, sitting, boarding, drop-ins, and more — on the days and times that work for you.",
    icon: <CalendarDays size={20} />,
  },
  {
    title: "Messaging & bookings",
    description:
      "Keep Pet Parent conversations, booking details, and care notes organized in one workspace.",
    icon: <MessageSquare size={20} />,
  },
  {
    title: "PawReport Live",
    description:
      "Send live walk updates, GPS progress, photos, and completed care reports Pet Parents love.",
    icon: <Sparkles size={20} />,
  },
  {
    title: "Reviews & rebooking",
    description:
      "Build a reputation through completed care so local Pet Parents come back to you.",
    icon: <Star size={20} />,
  },
  {
    title: "Earnings & payouts",
    description:
      "Review booking earnings and complete required Stripe or PayPal payout setup.",
    icon: <Banknote size={20} />,
  },
  {
    title: "Guru Academy",
    description:
      "Optional SitGuru University. Earn a Certified Guru badge — not required to go bookable.",
    icon: <GraduationCap size={20} />,
  },
  {
    title: "Success Center",
    description:
      "Practical guides for profile, bookings, PawReports, payments, safety, and referrals.",
    icon: <Handshake size={20} />,
  },
];

const steps = [
  {
    step: "01",
    title: "Create your account",
    description: "Tell us who you are and where you plan to provide care.",
  },
  {
    step: "02",
    title: "Build your profile",
    description:
      "Add services, rates, availability, experience, photos, and your local area.",
  },
  {
    step: "03",
    title: "Complete trust steps",
    description:
      "Finish required identity, safety, account, and payout setup.",
  },
  {
    step: "04",
    title: "Start accepting bookings",
    description:
      "Review requests and accept the care opportunities that fit your life.",
  },
];

const controlPoints = [
  "Choose which services you offer",
  "Set your own rates",
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

const pawReportMoments = [
  {
    src: "/images/pawreport/scout-park-entrance.jpg",
    alt: "Scout at the park entrance during a PawReport visit",
    label: "Arrive with confidence",
    caption: "Start the visit strong — Pet Parents see you show up.",
  },
  {
    src: "/images/pawreport/scout-on-trail.jpg",
    alt: "Scout on the trail during a live PawReport walk",
    label: "Share the journey",
    caption: "Live updates and photos turn ordinary walks into trust.",
  },
  {
    src: "/images/pawreport/scout-resting-after-walk.jpg",
    alt: "Scout resting after a walk in a PawReport update",
    label: "Close the loop",
    caption: "Finish with notes and care details that invite rebooking.",
  },
];

/** Keep in sync with `SCOUT_PUBLIC_MARKETING_FAQS` in lib/ai/officer-marketing-faqs.ts */
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
      "You will complete your profile, services, pricing, availability, trust requirements, and payout setup. Your profile must be approved and active before Pet Parents can fully book you. Guru Academy is optional and unlocks a Certified Guru badge.",
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
      className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-7 py-4 text-base font-black !text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#09462C] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${className}`}
    >
      {label}
      <ArrowRight size={18} />
    </Link>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      <div className="absolute -left-6 -top-8 h-40 w-40 rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="absolute -bottom-10 -right-4 h-48 w-48 rounded-full bg-white/15 blur-3xl" />

      <div className="relative overflow-hidden rounded-[32px] border border-white/25 bg-white shadow-[0_30px_90px_rgba(2,44,34,0.35)]">
        <div className="relative aspect-[5/4] w-full">
          <Image
            src="/images/pawreport/scout-on-trail.jpg"
            alt="A SitGuru walk moment Pet Parents can follow through PawReport Live"
            fill
            priority
            className="object-cover object-[center_35%]"
            sizes="(max-width: 1024px) 100vw, 42vw"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5 pt-16">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] !text-emerald-200">
              PawReport Live
            </p>
            <p className="mt-1 text-lg font-black !text-white">
              Care they can see. Trust that sticks.
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white ring-2 ring-emerald-100">
              <Image
                src={SCOUT_AVATAR.src}
                alt=""
                fill
                className="object-cover"
                style={{ objectPosition: SCOUT_AVATAR.objectPosition }}
                sizes="48px"
              />
            </div>
            <div>
              <p className="text-sm font-black text-emerald-950">
                Scout is with you from day one
              </p>
              <p className="text-xs font-semibold text-slate-600">
                Your Guru Matching Officer guides setup and local matching.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ["Free", "to apply"],
              ["Yours", "schedule"],
              ["Local", "Pet Parents"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-emerald-100 bg-[#f7faf4] px-2 py-3 text-center"
              >
                <p className="text-sm font-black text-emerald-950">{value}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BecomeAGuruPageContent({
  guruApplyLink,
}: {
  guruApplyLink: string;
}) {
  return (
    <main className="public-page min-h-screen overflow-x-hidden bg-[#f7faf7] pb-[calc(6rem+env(safe-area-inset-bottom))] text-slate-950 sm:pb-0">
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg gap-2">
          <Link
            href={guruApplyLink}
            className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#0D5C3A] px-4 py-3 text-base font-black !text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#09462C]"
          >
            Start Free
          </Link>
          <Link
            href={guruLoginLink}
            className="flex min-h-12 flex-1 items-center justify-center rounded-full border border-emerald-200 bg-white px-4 py-3 text-base font-black text-emerald-900 transition hover:bg-emerald-50"
          >
            Guru Login
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden bg-[#0D5C3A]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <PawPrint className="absolute right-[8%] top-16 h-16 w-16 rotate-12 text-white/10" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:px-8 lg:py-20">
          <div data-brand-green className="public-dark-section">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-black uppercase tracking-[0.16em] !text-white backdrop-blur">
              <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-white/50">
                <Image
                  src="/images/sitguru-logo-mark.png"
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="28px"
                />
              </span>
              SitGuru — Trusted Pet Care. Simplified.
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.045em] !text-white sm:text-5xl lg:text-6xl">
              More than a sitter. Become a SitGuru Guru.
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 !text-emerald-50 sm:text-lg">
              Earn on your schedule caring for pets — with a trusted local
              profile, PawReports that win Pet Parents, and tools built to grow
              repeat relationships.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={guruApplyLink}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-black text-emerald-950 shadow-xl shadow-black/15 transition hover:bg-emerald-50 sm:w-auto"
              >
                Start Free Guru Profile
                <ArrowRight size={18} />
              </Link>
              <Link
                href={guruLoginLink}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-base font-black !text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
              >
                Guru Login
              </Link>
            </div>

            <p className="mt-5 max-w-2xl text-xs font-semibold leading-5 !text-emerald-100/90 sm:text-sm">
              Gurus are independent providers who choose the services they offer
              and the booking requests they accept. Already a Pet Parent?{" "}
              <Link
                href={addGuruToExistingAccountLink}
                className="underline decoration-white/50 underline-offset-2 !text-white"
              >
                Add Guru to your existing SitGuru login
              </Link>{" "}
              instead of creating a second email.
            </p>
          </div>

          <HeroVisual />
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel icon={<Sparkles size={16} />}>
              Why Gurus choose SitGuru
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Built to help great caregivers get found — and stay booked.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              SitGuru is more than a listing. It is a workspace for discovery,
              communication, live care updates, and trusted local growth.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {promisePoints.map((item) => (
              <article
                key={item.title}
                className="rounded-[24px] border border-emerald-100 bg-[#f7faf4] p-5"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-800 shadow-sm">
                  {item.icon}
                </span>
                <h3 className="mt-4 text-lg font-black text-emerald-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="p-5 sm:p-6 lg:p-8">
              <SectionLabel icon={<PawPrint size={16} />}>
                PawReport Live
              </SectionLabel>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
                Show Pet Parents the care they can feel.
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                PawReports turn every visit into proof — photos, notes, walk
                progress, and live updates that build confidence and invite
                rebooking. That is how SitGuru helps Gurus grow beyond one-off
                gigs.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Live walk updates Pet Parents can follow",
                  "Photos and notes that feel personal",
                  "Completed care reports that support reviews",
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-3 text-sm font-bold text-slate-700"
                  >
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-700"
                    />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <PrimaryButton href={guruApplyLink} />
              </div>
            </div>

            <div className="grid gap-3 bg-[#0D5C3A]/5 p-4 sm:p-5 lg:grid-cols-3 lg:p-6">
              {pawReportMoments.map((moment) => (
                <article
                  key={moment.src}
                  className="overflow-hidden rounded-[24px] bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/5] w-full">
                    <Image
                      src={moment.src}
                      alt={moment.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 18vw"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
                      {moment.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">
                      {moment.caption}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-label="Meet Scout, your AI Pet Companion"
          className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr] lg:gap-12">
            <div className="mx-auto flex flex-col items-center text-center lg:mx-0">
              <div className="relative h-28 w-28 overflow-hidden rounded-full bg-white shadow-[0_10px_28px_rgba(13,92,58,0.12)] ring-2 ring-[#0D5C3A]/15 sm:h-32 sm:w-32">
                <Image
                  src={SCOUT_AVATAR.src}
                  alt={SCOUT_AVATAR.alt}
                  fill
                  className="object-cover"
                  style={{
                    backgroundColor: "#fff",
                    objectPosition: SCOUT_AVATAR.objectPosition,
                  }}
                  sizes="128px"
                />
              </div>
              <p className="mt-4 text-xl font-black tracking-tight text-emerald-950">
                Scout
              </p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
                Guru Matching Officer
              </p>
            </div>

            <div className="text-center lg:text-left">
              <SectionLabel icon={<HeartHandshake size={16} />}>
                AI Pet Companion
              </SectionLabel>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
                Your personalized guide from day one.
              </h2>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Every Pet Guru receives their own personalized AI Pet Companion
                to guide them along the way. Meet Scout, your dedicated Guru
                Matching Officer, ready to help pair you with local Pet Parents.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <SectionLabel icon={<UsersRound size={16} />}>
                Your Guru workspace
              </SectionLabel>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
                Everything you need to run trusted local care.
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                From profile to payouts, SitGuru keeps discovery, messaging,
                bookings, PawReports, learning, and earnings in one place.
              </p>
              <div className="mt-6">
                <PrimaryButton href={guruApplyLink} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {toolkit.map((tool) => (
                <article
                  key={tool.title}
                  className="rounded-[22px] border border-emerald-100 bg-[#f7faf4] p-5"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm">
                    {tool.icon}
                  </span>
                  <h3 className="mt-3 text-base font-black text-emerald-950">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {tool.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel icon={<CheckCircle2 size={16} />}>
              Simple from the start
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Start in four clear steps.
            </h2>
          </div>

          <div className="relative mt-9 grid gap-4 lg:grid-cols-4">
            <div className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden h-px bg-emerald-200 lg:block" />
            {steps.map((item) => (
              <article
                key={item.step}
                className="relative rounded-[24px] border border-emerald-100 bg-[#f7faf4] p-5 text-center"
              >
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0D5C3A] text-sm font-black !text-white shadow-lg shadow-emerald-900/20">
                  {item.step}
                </div>
                <h3 className="mt-5 text-lg font-black text-emerald-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          data-brand-green
          className="public-dark-section rounded-[32px] bg-[#0D5C3A] p-6 !text-white shadow-sm sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-100">
                Independent provider control
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight !text-white sm:text-4xl">
                You decide how you work.
              </h2>
              <p className="mt-4 max-w-xl text-base font-semibold leading-7 !text-emerald-50">
                SitGuru gives you a structured way to present your services and
                review local booking opportunities — without giving up control
                of your schedule.
              </p>
              <div className="mt-6">
                <Link
                  href={guruApplyLink}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-base font-black text-emerald-950 transition hover:bg-emerald-50"
                >
                  Start Free Guru Profile
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {controlPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-800">
                    <CheckCircle2 size={16} />
                  </span>
                  <span className="text-sm font-black !text-white">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionLabel icon={<ShieldCheck size={16} />}>
                Who can become a Guru?
              </SectionLabel>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
                Pet experience comes in many forms.
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                SitGuru welcomes experienced pet care providers and responsible
                local pet lovers who are prepared to describe their experience
                honestly and complete required profile and trust steps.
              </p>
              <Link
                href="/programs"
                className="mt-6 inline-flex items-center gap-2 text-sm font-black text-emerald-800 transition hover:text-emerald-950 hover:underline"
              >
                Looking for a specialized pathway? Explore SitGuru Programs
                <ArrowRight size={16} />
              </Link>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Includes student, community, and optional{" "}
                <Link
                  href={VETERANS_MILITARY_FAMILIES_PROGRAM.programsAnchorHref}
                  className="font-black text-emerald-800 hover:underline"
                >
                  {VETERANS_MILITARY_FAMILIES_PROGRAM.shortName}
                </Link>
                .
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Common Guru services
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {serviceTypes.map((service) => (
                  <div
                    key={service}
                    className="flex min-h-20 items-center justify-center rounded-2xl border border-emerald-100 bg-[#f7faf4] px-3 py-4 text-center text-sm font-black text-emerald-950"
                  >
                    {service}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-[#f7faf4] p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <SectionLabel icon={<Gift size={16} />}>PetPerks</SectionLabel>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl">
                Grow the pack — and earn when great Gurus join.
              </h2>
              <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-slate-600">
                Share SitGuru with friends and future caregivers. Eligible Guru
                referrals can earn rewards after approval and a first eligible
                paid booking.
              </p>
            </div>
            <Link
              href="/petperks"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
            >
              See PetPerks
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel icon={<HelpCircle size={16} />}>
              Guru questions
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Know what to expect before you start.
            </h2>
          </div>

          <div className="mx-auto mt-8 max-w-4xl space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-[24px] border border-emerald-100 bg-[#f7faf4] p-5 open:border-emerald-200 open:bg-white open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                  <span className="text-base font-black text-emerald-950 sm:text-lg">
                    {faq.question}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-800 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section
          data-brand-green
          className="public-dark-section rounded-[32px] bg-[#0D5C3A] p-6 text-center !text-white shadow-sm sm:p-10"
        >
          <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-100">
            Ready to get started?
          </p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight !text-white sm:text-4xl">
            Earn caring for pets and build trusted local relationships.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 !text-emerald-50">
            Create your free Guru profile, choose how you want to provide care,
            and complete the steps required to become bookable.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={guruApplyLink}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-base font-black text-emerald-950 transition hover:bg-emerald-50"
            >
              Start Free Guru Profile
              <ArrowRight size={18} />
            </Link>
            <Link
              href={guruLoginLink}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-7 py-4 text-base font-black !text-white backdrop-blur transition hover:bg-white/15"
            >
              Guru Login
            </Link>
          </div>
        </section>
      </div>
    </main>
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

  return <BecomeAGuruPageContent guruApplyLink={guruApplyLink} />;
}
