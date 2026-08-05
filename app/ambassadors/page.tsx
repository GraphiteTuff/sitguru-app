import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  GraduationCap,
  Handshake,
  HeartHandshake,
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
import AIDelilahCompanion from "@/components/officers/AIDelilahCompanion";
import { DELILAH_AVATAR } from "@/lib/companions/avatar-assets";

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

const whatYouDo = [
  {
    title: "Share the vibe",
    description:
      "Post, text, talk, or use your QR code to introduce people to SitGuru.",
    icon: <Share2 size={23} />,
  },
  {
    title: "Refer great people",
    description:
      "Connect Pet Parents, future Gurus, and local partners with the right SitGuru path.",
    icon: <HeartHandshake size={23} />,
  },
  {
    title: "Show up locally",
    description:
      "Represent SitGuru at campus activities, community events, pet spaces, and local meetups.",
    icon: <Megaphone size={23} />,
  },
  {
    title: "Grow your lane",
    description:
      "Build real outreach, leadership, referral, and community experience as SitGuru grows.",
    icon: <Star size={23} />,
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
    description: "Connect with your campus, community, pet network, or social circle.",
  },
  {
    step: "04",
    title: "Track your impact",
    description: "Follow eligible referrals, activity, rewards, and recognition opportunities.",
  },
];

const ambassadorPerks = [
  {
    title: "Your own referral tools",
    description: "Shareable links, QR codes, and easy ways to introduce SitGuru.",
    icon: <QrCode size={22} />,
  },
  {
    title: "Progress you can see",
    description: "Track referrals and activity through your Ambassador experience.",
    icon: <BadgeCheck size={22} />,
  },
  {
    title: "Eligible rewards",
    description: "Qualified activity may unlock referral rewards under current program terms.",
    icon: <Sparkles size={22} />,
  },
  {
    title: "Pack Leader recognition",
    description: "Standout Ambassadors may be featured with permission as the Pack grows.",
    icon: <Trophy size={22} />,
  },
];

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

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = true,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base font-semibold leading-7 text-slate-600 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

export default function AmbassadorsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8faf7] text-slate-950">
      <section className="relative overflow-hidden border-b border-emerald-100 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-emerald-200/45 blur-3xl" />
          <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-amber-200/35 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              <Sparkles size={15} />
              SitGuru Ambassador Program
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
              Love pets? Know people? Help the Pack grow.
            </h1>

            <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Share SitGuru on campus, online, at events, or with people you
              already know. Help Pet Parents find care, help great people become
              Gurus, and build real community experience along the way.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={buildAmbassadorApplyHref("community", "hero_primary")}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:bg-emerald-900"
              >
                Join the Pack
                <ArrowRight size={18} />
              </Link>

              <Link
                href="#ambassador-video"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                Watch the video
                <PlayCircle size={18} />
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {["Campus", "Social", "Events", "Referrals", "Pet community"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div id="ambassador-video" className="scroll-mt-24">
            <div className="rounded-[30px] border border-emerald-100 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.13)] sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-3 px-2 pt-1">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                    Watch first
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950 sm:text-xl">
                    See what Ambassadors actually do.
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-white">
                  <PlayCircle size={23} />
                </div>
              </div>

              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-950">
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

              <div className="grid grid-cols-2 gap-2 pt-3 sm:grid-cols-4">
                {["Share", "Refer", "Show up", "Grow"].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-center text-xs font-black text-emerald-900"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Meet Delilah, your AI Ambassador Advocate"
        className="border-b border-emerald-100 bg-gradient-to-b from-[#f8faf7] via-white to-[#f8faf7] py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-[0_18px_50px_rgba(13,92,58,0.08)]">
            <div className="grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[auto_1fr] lg:gap-12">
              <div className="mx-auto flex flex-col items-center text-center lg:mx-0">
                <div className="relative h-28 w-28 overflow-hidden rounded-full bg-white shadow-[0_10px_28px_rgba(13,92,58,0.12)] ring-2 ring-[#0D5C3A]/15 sm:h-32 sm:w-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={DELILAH_AVATAR.src}
                    alt={DELILAH_AVATAR.alt}
                    width={128}
                    height={128}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                      backgroundColor: "#fff",
                      objectPosition: DELILAH_AVATAR.objectPosition,
                    }}
                  />
                </div>
                <p className="mt-4 text-xl font-black tracking-tight text-slate-950">
                  Delilah
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
                  Ambassador Advocate
                </p>
              </div>

              <div className="text-center lg:text-left">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                  AI Pet Companion
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                  Your personalized outreach partner.
                </h2>
                <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  As a SitGuru Ambassador, you won&apos;t navigate your journey
                  alone. You will be assigned Delilah, your personalized AI
                  Ambassador Advocate companion, to assist you with tracking
                  your outreach and growing your impact!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow="The role"
          title="Simple ways to make a real impact."
          description="You do not need a marketing degree or a massive following. Bring your voice, your people, and your love for pets."
        />

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whatYouDo.map((item) => (
            <article
              key={item.title}
              className="rounded-[26px] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                {item.icon}
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-950">
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
        id="ambassador-paths"
        className="border-y border-emerald-100 bg-white py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Pick your lane"
            title="Start where you already have energy."
            description="Campus, community, pet care, or military-connected networks — choose the path that feels most natural to you."
          />

          <div className="mt-9 grid gap-5 md:grid-cols-2">
            {ambassadorLanes.map((lane) => (
              <article
                key={lane.title}
                className="group overflow-hidden rounded-[28px] border border-emerald-100 bg-[#fbfdfb] shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
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
                    <h3 className="mt-2 text-2xl font-black text-slate-950">
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
                      className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-900 sm:mt-auto"
                    >
                      Start this path
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-7 rounded-[26px] border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-center text-sm font-black text-emerald-950">
              More ways to join the Pack
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {ambassadorTypes.map(([label, type]) => (
                <Link
                  key={type}
                  href={buildAmbassadorApplyHref(type, `type_${type}`)}
                  className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Apply. Share. Grow."
          description="The Ambassador path is built to be easy to start and simple to use."
        />

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((item) => (
            <article
              key={item.step}
              className="rounded-[26px] border border-emerald-100 bg-white p-5 shadow-sm"
            >
              <span className="text-sm font-black text-emerald-700">
                {item.step}
              </span>
              <h3 className="mt-2 text-xl font-black text-slate-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-700 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                Your Ambassador experience
              </p>
              <h2
                className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl"
                style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
              >
                Tools to share. Progress to track. Impact to build.
              </h2>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-emerald-50">
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
                  <h3 className="mt-4 text-lg font-black text-white">
                    {perk.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">
                    {perk.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-7 rounded-[22px] border border-white/20 bg-white/10 px-5 py-4 text-xs font-semibold leading-6 text-emerald-50">
            Referral rewards, commissions, bonuses, recognition, and other
            opportunities are not guaranteed. Eligibility depends on current
            SitGuru terms, approved activity, valid conversions, and program
            needs. Hourly opportunities are rare and require separate written
            approval from SitGuru.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow="Quick answers"
          title="Ambassador FAQ"
          description="The basics, without the long read."
        />

        <div className="mt-8 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-[22px] border border-emerald-100 bg-white p-5 shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-black text-slate-950">
                {faq.question}
                <span className="text-xl text-emerald-700 transition group-open:rotate-45">
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

      <section className="px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-emerald-100 bg-white p-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.1)] sm:p-9">
          <Handshake size={34} className="mx-auto text-emerald-700" />
          <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Ready to bring SitGuru to your people?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
            Pick your lane, submit the quick application, and start building
            your impact with the Pack.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={buildAmbassadorApplyHref("community", "final_primary")}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-900"
            >
              Join the Ambassador Program
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/programs"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
            >
              Explore all programs
            </Link>
          </div>
        </div>
      </section>
      <AIDelilahCompanion />
    </main>
  );
}