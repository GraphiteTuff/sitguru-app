import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Medal,
  PawPrint,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

export const metadata: Metadata = {
  title: "SitGuru Programs | Student, Community, Veterans & Ambassadors",
  description:
    "Find your SitGuru path: Student, Community, Veterans & Military Families, or Ambassador. Programs are readiness and referral pathways — not employment. Apply or become a Guru directly.",
  alternates: {
    canonical: "/programs",
  },
};

type ProgramKey =
  | "student-hire"
  | "community-hire"
  | "veterans-hire"
  | "ambassador-program";

type ProgramDefinition = {
  key: ProgramKey;
  title: string;
  campaign: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition: string;
  icon: ReactNode;
  applyHref: string;
  learnHref?: string;
  idealFor: string[];
  highlights: string[];
};

const programs: ProgramDefinition[] = [
  {
    key: "student-hire",
    title: "Student Pathway",
    campaign: "Join the Pack",
    description:
      "A flexible way for students and recent graduates to explore local pet care opportunities around school, weekends, breaks, and summer.",
    imageSrc: "/images/programs/student-hire.jpg",
    imageAlt: "Student walking a dog near a college campus",
    imagePosition: "center 36%",
    icon: <GraduationCap size={24} />,
    applyHref: "/programs/apply?program=student-hire",
    idealFor: [
      "College and trade school students",
      "High school seniors age 18+",
      "Recent graduates and gap-year applicants",
    ],
    highlights: [
      "Flexible availability",
      "Local pet care experience",
      "Path toward Guru approval",
    ],
  },
  {
    key: "community-hire",
    title: "Community Pathway",
    campaign: "Grow with the Pack",
    description:
      "A supported application path for people referred by workforce programs, nonprofits, community groups, and local organizations.",
    imageSrc: "/images/programs/community-hire.jpg",
    imageAlt: "Local pet caregiver walking a dog in the community",
    imagePosition: "center 34%",
    icon: <Building2 size={24} />,
    applyHref: "/programs/apply?program=community-hire",
    idealFor: [
      "Community and workforce referrals",
      "Nonprofit and local-program applicants",
      "People seeking flexible local opportunities",
    ],
    highlights: [
      "Guided application",
      "Partner-source tracking",
      "Readiness and onboarding support",
    ],
  },
  {
    key: "veterans-hire",
    title: VETERANS_MILITARY_FAMILIES_PROGRAM.displayName,
    campaign: "Serve the Pack",
    description: VETERANS_MILITARY_FAMILIES_PROGRAM.description,
    imageSrc: "/images/programs/veterans-hire.jpg",
    imageAlt: "Military-connected family spending time with a dog",
    imagePosition: "center 34%",
    icon: <Medal size={24} />,
    applyHref: VETERANS_MILITARY_FAMILIES_PROGRAM.applyHref,
    idealFor: [
      "Veterans and transitioning service members",
      "Military spouses and qualified dependents",
      "Guard and Reserve members",
    ],
    highlights: [
      "Military-friendly onboarding",
      "Transferable experience",
      "SkillBridge interest tracking",
    ],
  },
  {
    key: "ambassador-program",
    title: "Ambassador Program",
    campaign: "Lead the Pack",
    description:
      "Help SitGuru grow by introducing Pet Parents, future Gurus, and local partners through trusted community connections.",
    imageSrc: "/images/programs/ambassador-program.jpg",
    imageAlt: "Pet professional representing the SitGuru Ambassador Program",
    imagePosition: "center 34%",
    icon: <HeartHandshake size={24} />,
    applyHref: "/programs/ambassadors/apply",
    learnHref: "/programs/ambassadors",
    idealFor: [
      "Students and community advocates",
      "Pet professionals and existing Gurus",
      "Military, rescue, and local leaders",
    ],
    highlights: [
      "Referral tools",
      "Community outreach",
      "Eligible rewards and recognition",
    ],
  },
];

const sharedSteps = [
  {
    number: "01",
    title: "Choose your path",
    description: "Pick the program that best matches your background and goal.",
  },
  {
    number: "02",
    title: "Submit one application",
    description: "Share the information SitGuru needs to route your application.",
  },
  {
    number: "03",
    title: "Complete review",
    description: "Finish any onboarding, profile, or trust and safety steps.",
  },
  {
    number: "04",
    title: "Grow with SitGuru",
    description: "Approved participants receive next-step guidance for their path.",
  },
];

const faqs = [
  {
    question: "Is a SitGuru program the same as employment?",
    answer:
      "No. Programs are application, referral, and readiness pathways. Approved Gurus provide services as independent contractors, and applying does not guarantee approval, bookings, earnings, employment, benefits, or placement.",
  },
  {
    question: "What’s the difference between Programs and becoming a Guru?",
    answer:
      "Programs help route you through a specialized path (student, community, military-connected, or Ambassador). If you already know you want to provide pet care and don’t need a specialized pathway, use Become a Guru directly.",
  },
  {
    question: "Can I apply directly to become a Guru?",
    answer:
      "Yes. Applicants who do not need a student, community, or military-connected pathway can use the standard Become a Guru application.",
  },
  {
    question: "How is the Ambassador Program different?",
    answer:
      "Ambassadors help SitGuru grow through outreach and referrals. Pet-care pathways focus on becoming a Guru. You can explore Ambassadors even if you’re also interested in providing care.",
  },
  {
    question: "Is SitGuru an approved SkillBridge program?",
    answer:
      "No formal approval is represented here. SitGuru currently tracks SkillBridge interest for future planning and possible partnerships.",
  },
  {
    question: "Can an organization refer applicants?",
    answer:
      "Yes. Schools, workforce programs, military organizations, nonprofits, rescues, veterinary offices, and other community groups can connect people with the appropriate SitGuru pathway — or explore Partners if your organization wants a formal partnership.",
  },
];

function ProgramCard({ program }: { program: ProgramDefinition }) {
  return (
    <article
      id={program.key}
      className="scroll-mt-28 overflow-hidden rounded-[30px] border border-emerald-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
    >
      <div className="relative h-52 overflow-hidden bg-emerald-50 sm:h-60">
        <Image
          src={program.imageSrc}
          alt={program.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          style={{ objectPosition: program.imagePosition }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

        <div className="absolute bottom-4 left-4 right-4">
          <p
            className="text-xs font-black uppercase tracking-[0.18em]"
            style={{ color: "#d1fae5", WebkitTextFillColor: "#d1fae5" }}
          >
            {program.campaign}
          </p>
          <h2
            className="mt-1 text-2xl font-black sm:text-3xl"
            style={{
              color: "#ffffff",
              WebkitTextFillColor: "#ffffff",
              textShadow: "0 2px 12px rgba(0,0,0,0.75)",
            }}
          >
            {program.title}
          </h2>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0D5C3A] text-white">
          {program.icon}
        </div>

        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          {program.description}
        </p>

        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
            A strong fit for
          </p>
          <div className="mt-3 space-y-2">
            {program.idealFor.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <span className="text-sm font-bold leading-5 text-slate-700">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {program.highlights.map((highlight) => (
            <span
              key={highlight}
              className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800"
            >
              {highlight}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={program.applyHref}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[#09462C]"
          >
            Apply
            <ArrowRight size={17} />
          </Link>

          {program.learnHref ? (
            <Link
              href={program.learnHref}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
            >
              Learn more
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function ProgramsPage() {
  return (
    <main className="min-h-screen bg-[#f7faf7] text-slate-950">
      <section
        data-brand-green
        className="public-dark-section relative overflow-hidden bg-[#0D5C3A]"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] !text-white backdrop-blur">
              <Sparkles size={15} />
              SitGuru Programs
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.045em] !text-white sm:text-5xl lg:text-6xl">
              Find your path into the SitGuru pack.
            </h1>

            <p className="mt-5 max-w-3xl text-base font-semibold leading-7 !text-emerald-50 sm:text-lg">
              Programs are guided pathways into SitGuru — provide pet care,
              grow as an Ambassador, or help your organization refer people to
              the right opportunity. They are not job offers or employment.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#pet-care-pathways"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-emerald-950 shadow-xl shadow-black/15 transition hover:bg-emerald-50"
              >
                I want to provide pet care
                <PawPrint size={18} />
              </Link>

              <Link
                href="#ambassador-program"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-sm font-black !text-white backdrop-blur transition hover:bg-white/15"
              >
                I want to help SitGuru grow
                <UsersRound size={18} />
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/20 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="rounded-[26px] bg-white p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Which path fits me?
              </p>

              <div className="mt-4 space-y-3">
                {[
                  {
                    icon: <GraduationCap size={19} />,
                    title: "Student",
                    text: "Flexible pet care around school and summer.",
                    href: "#student-hire",
                  },
                  {
                    icon: <Building2 size={19} />,
                    title: "Community",
                    text: "A guided pathway through a local partner.",
                    href: "#community-hire",
                  },
                  {
                    icon: <Medal size={19} />,
                    title: VETERANS_MILITARY_FAMILIES_PROGRAM.shortName,
                    text: "A pathway built around transferable experience.",
                    href: "#veterans-hire",
                  },
                  {
                    icon: <HeartHandshake size={19} />,
                    title: "Ambassador",
                    text: "Refer people and grow community awareness.",
                    href: "#ambassador-program",
                  },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-[#f8fcf8] p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0D5C3A] text-white">
                      {item.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-emerald-950">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-600">
                        {item.text}
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      className="ml-auto shrink-0 text-emerald-700"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-emerald-100 bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Programs at a glance
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
              Two goals. Four pathways.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              Most people come here for one of two reasons: provide pet care, or
              help SitGuru grow. Pick the lane that matches you — then choose
              the pathway below.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-emerald-100 bg-[#f8fcf8] p-6">
              <PawPrint className="text-emerald-800" size={28} />
              <h3 className="mt-4 text-xl font-black text-slate-950">
                Provide pet care
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Student, Community, and Veterans & Military Families pathways
                help you move toward becoming an independent SitGuru Guru.
              </p>
              <ul className="mt-4 space-y-2 text-sm font-bold text-slate-700">
                <li className="flex gap-2">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />
                  Flexible local care opportunities
                </li>
                <li className="flex gap-2">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />
                  Guided applications when partners refer you
                </li>
                <li className="flex gap-2">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />
                  Or apply directly via Become a Guru
                </li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-emerald-100 bg-[#f8fcf8] p-6">
              <UsersRound className="text-emerald-800" size={28} />
              <h3 className="mt-4 text-xl font-black text-slate-950">
                Help SitGuru grow
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Ambassadors introduce Pet Parents, future Gurus, and local
                partners through trusted community connections and referral
                tools.
              </p>
              <ul className="mt-4 space-y-2 text-sm font-bold text-slate-700">
                <li className="flex gap-2">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />
                  Outreach and referral pathways
                </li>
                <li className="flex gap-2">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />
                  Eligible rewards and recognition when available
                </li>
                <li className="flex gap-2">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />
                  Pair with{" "}
                  <Link
                    href="/petperks"
                    className="font-black text-emerald-800 underline"
                  >
                    PetPerks
                  </Link>{" "}
                  sharing tools
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section
        id="pet-care-pathways"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Choose your path
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Four clear ways to get started.
          </h2>
          <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
            Choose the option that best matches your background. Each path
            sends you to the right application — SitGuru reviews next steps
            after you submit.
          </p>
        </div>

        <div className="mt-9 grid gap-6 md:grid-cols-2">
          {programs.map((program) => (
            <ProgramCard key={program.key} program={program} />
          ))}
        </div>
      </section>

      <section className="border-y border-emerald-100 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
              One simple process.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Every pathway follows the same rhythm: choose, apply, complete
              review, then get next-step guidance if approved.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sharedSteps.map((step) => (
              <div
                key={step.number}
                className="rounded-[26px] border border-emerald-100 bg-[#f8fcf8] p-5"
              >
                <span className="text-sm font-black text-emerald-700">
                  {step.number}
                </span>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[26px] border border-amber-200 bg-amber-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <ShieldCheck size={26} className="shrink-0 text-amber-800" />
              <div>
                <h3 className="text-lg font-black text-amber-950">
                  Clear expectations
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
                  Applying does not guarantee approval, bookings, earnings,
                  employment, benefits, placement, referral rewards, or full
                  Guru status. Approved Gurus provide services as independent
                  contractors. Trust and safety review may be required based on
                  the pathway and responsibilities involved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div
            data-brand-green
            className="public-dark-section rounded-[32px] bg-[#0D5C3A] p-6 sm:p-8 lg:col-span-1"
          >
            <Handshake size={30} className="!text-emerald-100" />
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] !text-emerald-100">
              Program partners
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] !text-white sm:text-3xl">
              Refer applicants the right way.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 !text-emerald-50">
              Schools, workforce groups, military organizations, nonprofits,
              rescues, and local pet businesses can point people to the matching
              pathway — or explore a formal SitGuru partnership.
            </p>
            <Link
              href="/partners"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
            >
              Partner with SitGuru
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="rounded-[32px] border border-emerald-100 bg-white p-6 sm:p-8 lg:col-span-1">
            <BadgeCheck size={30} className="text-emerald-700" />
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Direct Guru path
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">
              Ready to provide pet care directly?
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
              Skip specialized pathways when you don’t need student, community,
              or military-connected routing. Apply to become a Guru.
            </p>
            <Link
              href="/become-a-guru"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white transition hover:bg-[#09462C]"
            >
              Become a Guru
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="rounded-[32px] border border-emerald-100 bg-white p-6 sm:p-8 lg:col-span-1">
            <Sparkles size={30} className="text-emerald-700" />
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Share & earn
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">
              Growing the pack with PetPerks?
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
              Ambassadors and community sharers can also learn how PetPerks
              referrals and PawPerks rewards work for Pet Parents.
            </p>
            <Link
              href="/petperks"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
            >
              Explore PetPerks
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-emerald-100 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Questions
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
              Program FAQ
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-[22px] border border-emerald-100 bg-[#f8fcf8] p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-black text-slate-950">
                  {faq.question}
                  <span className="text-xl text-emerald-700 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7faf7] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-emerald-100 bg-white p-6 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-9">
          <UsersRound size={34} className="mx-auto text-emerald-700" />
          <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Choose your path and join the Pack.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
            Start with the pathway that fits you best. SitGuru will route your
            application to the appropriate review and next steps.
          </p>
          <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="#pet-care-pathways"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-6 py-3 text-sm font-black text-white transition hover:bg-[#09462C] sm:w-auto"
            >
              View programs
              <ArrowRight size={17} />
            </Link>
            <Link
              href="/become-a-guru"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50 sm:w-auto"
            >
              Become a Guru
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
