import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Gift,
  GraduationCap,
  Handshake,
  HeartHandshake,
  HelpCircle,
  Megaphone,
  PawPrint,
  PlayCircle,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";
import { TACO_AVATAR } from "@/lib/companions/avatar-assets";

export const metadata: Metadata = {
  title: "SitGuru Ambassadors | Share the Pack. Grow Your Impact.",
  description:
    "Become a SitGuru Ambassador — share SitGuru on campus, online, and in your community. Help Pet Parents find care, refer future Gurus, and grow with eligible rewards.",
  alternates: {
    canonical: "/ambassadors",
  },
  openGraph: {
    title: "SitGuru Ambassadors | Share the Pack. Grow Your Impact.",
    description:
      "Love pets? Know people? Help the Pack grow — campus, community, pet pro, and military-connected Ambassador lanes.",
    url: "/ambassadors",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SitGuru Ambassadors | Share the Pack. Grow Your Impact.",
    description:
      "Love pets? Know people? Help the Pack grow — campus, community, pet pro, and military-connected Ambassador lanes.",
  },
};

type AmbassadorLane = {
  title: string;
  eyebrow: string;
  type: string;
  description: string;
  image: string;
  imageAlt: string;
  imagePosition: string;
  icon: ReactNode;
  tags: string[];
};

const ambassadorLanes: AmbassadorLane[] = [
  {
    title: "Student Ambassadors",
    eyebrow: "Campus energy",
    type: "student",
    description:
      "Bring SitGuru to campus, clubs, teams, apartments, group chats, and social circles.",
    image: "/images/ambassadors/student-ambassador2.jpg",
    imageAlt: "Young SitGuru Student Ambassador spending time with a dog",
    imagePosition: "center 35%",
    icon: <GraduationCap size={22} />,
    tags: ["Campus", "Clubs", "Social", "Events"],
  },
  {
    title: "Community Ambassadors",
    eyebrow: "Local connections",
    type: "community",
    description:
      "Share SitGuru with neighborhoods, local groups, pet families, friends, and small businesses.",
    image: "/images/ambassadors/guru-ambassador2.jpg",
    imageAlt: "SitGuru Community Ambassador connecting with local pet families",
    imagePosition: "center 38%",
    icon: <UsersRound size={22} />,
    tags: ["Neighborhoods", "Local groups", "Pet families", "Partners"],
  },
  {
    title: "Pet Pro Ambassadors",
    eyebrow: "Trusted pet voices",
    type: "pet-care-professional",
    description:
      "Vet teams, trainers, groomers, Gurus, and pet professionals can connect people with trusted care.",
    image: "/images/ambassadors/vet-tech-ambassador3.jpg",
    imageAlt: "Veterinary professional representing the SitGuru Ambassador Program",
    imagePosition: "center 35%",
    icon: <PawPrint size={22} />,
    tags: ["Vet teams", "Trainers", "Groomers", "Gurus"],
  },
  {
    title: "Military & Veteran Ambassadors",
    eyebrow: "Mission-driven reach",
    type: "veteran-military",
    description:
      "Help SitGuru grow through military, veteran, spouse, Guard, Reserve, and transition networks.",
    image: "/images/ambassadors/veteran-military-ambassador.jpg",
    imageAlt: "Military-connected SitGuru Ambassador working from a laptop",
    imagePosition: "center 35%",
    icon: <ShieldCheck size={22} />,
    tags: ["Veterans", "Spouses", "Guard", "Reserve"],
  },
];

const ambassadorTypes = [
  ["Guru", "guru"],
  ["Vet Tech", "vet-tech"],
  ["Veterinarian", "veterinarian"],
  ["Trainer", "trainer"],
  ["Groomer", "groomer"],
  ["Rescue & Shelter", "rescue-shelter"],
] as const;

/** Keep aligned with TACO_WHAT_AMBASSADORS_DO_ANSWER / AmbassadorVideoCard */
const whatYouDo = [
  {
    title: "Share the vibe",
    description:
      "Post, text, talk, or use your QR code to introduce people to SitGuru.",
    icon: <Share2 size={22} />,
  },
  {
    title: "Refer great people",
    description:
      "Connect Pet Parents, future Gurus, and local partners with the right SitGuru path.",
    icon: <HeartHandshake size={22} />,
  },
  {
    title: "Show up locally",
    description:
      "Represent SitGuru at campus activities, community events, pet spaces, and local meetups.",
    icon: <Megaphone size={22} />,
  },
  {
    title: "Grow your lane",
    description:
      "Build real outreach, leadership, referral, and community experience as SitGuru grows.",
    icon: <Star size={22} />,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Apply",
    description: "Choose your Ambassador type and tell us where you have reach.",
  },
  {
    step: "02",
    title: "Get your tools",
    description: "Use your referral link, QR code, and simple sharing materials.",
  },
  {
    step: "03",
    title: "Share SitGuru",
    description:
      "Connect with your campus, community, pet network, or social circle.",
  },
  {
    step: "04",
    title: "Track your impact",
    description:
      "Follow eligible referrals, activity, rewards, and recognition opportunities.",
  },
];

const ambassadorPerks = [
  {
    title: "Your own referral tools",
    description:
      "Shareable links, QR codes, and easy ways to introduce SitGuru.",
    icon: <QrCode size={22} />,
  },
  {
    title: "Progress you can see",
    description:
      "Track referrals and activity through your Ambassador experience.",
    icon: <BadgeCheck size={22} />,
  },
  {
    title: "Eligible rewards",
    description:
      "Qualified activity may unlock referral rewards under current program terms.",
    icon: <Sparkles size={22} />,
  },
  {
    title: "Pack Leader recognition",
    description:
      "Standout Ambassadors may be featured with permission as the Pack grows.",
    icon: <Trophy size={22} />,
  },
];

/** Keep in sync with TACO_PUBLIC_MARKETING_FAQS in lib/ai/officer-marketing-faqs.ts */
const faqs = [
  {
    question: "Who can become a SitGuru Ambassador?",
    answer:
      "Students, Gurus, pet professionals, rescue advocates, veterans, military spouses, community leaders, creators, and other trusted local voices can apply.",
  },
  {
    question: "Do I need a huge social following?",
    answer:
      "No. Real connections matter more than follower count. A campus group, clinic, team, neighborhood, rescue network, or active friend circle can all be valuable.",
  },
  {
    question: "Is this the same as becoming a Guru?",
    answer:
      "No. Gurus provide pet care. Ambassadors help people discover SitGuru. Some people may choose to do both through separate approval paths.",
  },
  {
    question: "Are earnings or rewards guaranteed?",
    answer:
      "No. Approval, referral rewards, commissions, bonuses, recognition, and other opportunities depend on current SitGuru terms, eligible activity, and program needs.",
  },
];

function buildAmbassadorApplyHref(type = "community", placement = "page") {
  const params = new URLSearchParams({
    type,
    source: "ambassador_page",
    utm_source: "sitguru",
    utm_medium: "ambassador_program",
    utm_campaign: "ambassador_program",
    utm_content: placement,
  });

  return `/programs/ambassadors/apply?${params.toString()}`;
}

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

export default function AmbassadorsPage() {
  const heroApplyHref = buildAmbassadorApplyHref("community", "hero_primary");

  return (
    <main className="public-page min-h-screen overflow-x-hidden bg-[#f7faf7] pb-[calc(6rem+env(safe-area-inset-bottom))] text-slate-950 sm:pb-0">
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg gap-2">
          <Link
            href={heroApplyHref}
            className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#0D5C3A] px-4 py-3 text-base font-black !text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#09462C]"
          >
            Join the Pack
          </Link>
          <Link
            href="#ambassador-video"
            className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-full border border-emerald-200 bg-white px-4 py-3 text-base font-black text-emerald-900 transition hover:bg-emerald-50"
          >
            Watch
            <PlayCircle size={18} />
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden bg-[#0D5C3A]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <UsersRound className="absolute right-[8%] top-16 h-16 w-16 rotate-12 text-white/10" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12 lg:px-8 lg:py-20">
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
              Love pets? Know people? Help the Pack grow.
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 !text-emerald-50 sm:text-lg">
              Share SitGuru on campus, online, at events, or with people you
              already know. Help Pet Parents find care, help great people become
              Gurus, and build real community experience along the way.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={heroApplyHref}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-black text-emerald-950 shadow-xl shadow-black/15 transition hover:bg-emerald-50 sm:w-auto"
              >
                Join the Pack
                <ArrowRight size={18} />
              </Link>
              <Link
                href="#ambassador-video"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-base font-black !text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
              >
                Watch the video
                <PlayCircle size={18} />
              </Link>
            </div>

            <p className="mt-5 max-w-2xl text-xs font-semibold leading-5 !text-emerald-100/90 sm:text-sm">
              Ambassadors help people discover SitGuru — not provide pet care.
              Want to care for pets too?{" "}
              <Link
                href="/become-a-guru"
                className="font-black !text-white underline underline-offset-2"
              >
                Become a Guru
              </Link>
              .
            </p>
          </div>

          <div id="ambassador-video" className="scroll-mt-24">
            <div className="overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-[0_30px_90px_rgba(2,44,34,0.35)]">
              <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-5 sm:px-6">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                    Watch first
                  </p>
                  <p className="mt-1 text-lg font-black text-emerald-950 sm:text-xl">
                    See what Ambassadors actually do.
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0D5C3A] !text-white">
                  <PlayCircle size={22} />
                </div>
              </div>

              <div className="mx-4 overflow-hidden rounded-[22px] border border-slate-200 bg-slate-950 sm:mx-5">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster="/images/ambassadors/student-ambassador2.jpg"
                  className="aspect-video w-full bg-slate-950 object-cover"
                >
                  <source
                    src="/videos/sitguru-ambassador-promo.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 sm:p-5">
                {["Share", "Refer", "Show up", "Grow"].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-emerald-100 bg-[#f7faf4] px-3 py-3 text-center text-xs font-black text-emerald-900"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel icon={<Megaphone size={16} />}>The role</SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Simple ways to make a real impact.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              You do not need a marketing degree or a massive following. Bring
              your voice, your people, and your love for pets.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whatYouDo.map((item) => (
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

        <section
          aria-label="Meet Taco, your AI Ambassador Advocate"
          className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr] lg:gap-12">
            <div className="mx-auto flex flex-col items-center text-center lg:mx-0">
              <div className="relative h-28 w-28 overflow-hidden rounded-full bg-white shadow-[0_10px_28px_rgba(13,92,58,0.12)] ring-2 ring-[#0D5C3A]/15 sm:h-32 sm:w-32">
                <Image
                  src={TACO_AVATAR.src}
                  alt={TACO_AVATAR.alt}
                  fill
                  className="object-cover"
                  style={{
                    backgroundColor: "#fff",
                    objectPosition: TACO_AVATAR.objectPosition,
                  }}
                  sizes="128px"
                />
              </div>
              <p className="mt-4 text-xl font-black tracking-tight text-emerald-950">
                Taco
              </p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
                Ambassador Advocate
              </p>
            </div>

            <div className="text-center lg:text-left">
              <SectionLabel icon={<HeartHandshake size={16} />}>
                AI Pet Companion
              </SectionLabel>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
                Your personalized outreach partner.
              </h2>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600 sm:text-lg sm:leading-8">
                As a SitGuru Ambassador, you won&apos;t navigate your journey
                alone. You will be assigned Taco, your personalized AI
                Ambassador Advocate companion, to assist you with tracking your
                outreach and growing your impact.
              </p>
            </div>
          </div>
        </section>

        <section
          id="ambassador-paths"
          className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8"
        >
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel icon={<UsersRound size={16} />}>
              Pick your lane
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Start where you already have energy.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              Campus, community, pet care, or military-connected networks —
              choose the path that feels most natural to you.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {ambassadorLanes.map((lane) => (
              <article
                key={lane.title}
                className="group overflow-hidden rounded-[28px] border border-emerald-100 bg-[#f7faf4] transition hover:border-emerald-300 hover:shadow-lg"
              >
                <div className="grid h-full sm:grid-cols-[0.78fr_1.22fr]">
                  <div className="relative min-h-52 overflow-hidden bg-emerald-50 sm:min-h-full">
                    <Image
                      src={lane.image}
                      alt={lane.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, 40vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      style={{ objectPosition: lane.imagePosition }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent sm:bg-gradient-to-r" />
                    <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-800 shadow-lg">
                      {lane.icon}
                    </div>
                  </div>

                  <div className="flex flex-col p-5 sm:p-6">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                      {lane.eyebrow}
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-emerald-950">
                      {lane.title}
                    </h3>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                      {lane.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {lane.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-bold text-emerald-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={buildAmbassadorApplyHref(
                        lane.type,
                        `lane_${lane.type}`,
                      )}
                      className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black !text-white transition hover:bg-[#09462C] sm:mt-auto"
                    >
                      Start this path
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-7 rounded-[26px] border border-emerald-100 bg-[#f7faf4] p-5">
            <p className="text-center text-sm font-black text-emerald-950">
              More ways to join the Pack
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {ambassadorTypes.map(([label, type]) => (
                <Link
                  key={type}
                  href={buildAmbassadorApplyHref(type, `type_${type}`)}
                  className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-50"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel icon={<CheckCircle2 size={16} />}>
              How it works
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Apply. Share. Grow.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              The Ambassador path is built to be easy to start and simple to
              use.
            </p>
          </div>

          <div className="relative mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden h-px bg-emerald-200 lg:block" />
            {howItWorks.map((item) => (
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
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-100">
                Your Ambassador experience
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight !text-white sm:text-4xl">
                Tools to share. Progress to track. Impact to build.
              </h2>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 !text-emerald-50">
                SitGuru gives Ambassadors a clear way to share the brand, follow
                eligible activity, and grow with the community.
              </p>

              <Link
                href={buildAmbassadorApplyHref("community", "perks_primary")}
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-emerald-950 shadow-lg transition hover:bg-emerald-50"
              >
                Apply to become an Ambassador
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {ambassadorPerks.map((perk) => (
                <article
                  key={perk.title}
                  className="rounded-[24px] border border-white/20 bg-white/10 p-5 backdrop-blur"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-800">
                    {perk.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-black !text-white">
                    {perk.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-emerald-50">
                    {perk.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-7 rounded-[22px] border border-white/20 bg-white/10 px-5 py-4 text-xs font-semibold leading-6 !text-emerald-50">
            Referral rewards, commissions, bonuses, recognition, and other
            opportunities are not guaranteed. Eligibility depends on current
            SitGuru terms, approved activity, valid conversions, and program
            needs. Hourly opportunities are rare and require separate written
            approval from SitGuru.
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-[#f7faf4] p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <SectionLabel icon={<Gift size={16} />}>PetPerks</SectionLabel>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl">
                Share SitGuru. Earn when the Pack grows.
              </h2>
              <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-slate-600">
                Ambassadors use referral tools built for outreach. PetPerks is
                the public share-and-earn path for friends, future Gurus, and
                eligible rewards under current terms.
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
              Quick answers
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Ambassador FAQ
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              The basics, without the long read.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-4xl space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-[24px] border border-emerald-100 bg-[#f7faf4] p-5 open:border-emerald-200 open:bg-white open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-black text-emerald-950">
                  {faq.question}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-800 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
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
          <Handshake size={34} className="mx-auto !text-emerald-100" />
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight !text-white sm:text-4xl">
            Ready to bring SitGuru to your people?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base font-semibold leading-7 !text-emerald-50">
            Pick your lane, submit the quick application, and start building
            your impact with the Pack.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={buildAmbassadorApplyHref("community", "final_primary")}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-black text-emerald-950 transition hover:bg-emerald-50"
            >
              Join the Ambassador Program
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/programs"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-base font-black !text-white backdrop-blur transition hover:bg-white/15"
            >
              Explore all programs
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
