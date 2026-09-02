import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Medal,
  PawPrint,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";
import { CareersJobBoard } from "@/components/careers/CareersJobBoard";
import { listPublishedCareerJobs } from "@/lib/careers/jobs";
import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers, Internships & Opportunities | SitGuru",
  description:
    "Search SitGuru careers and paid internships, or grow as a Guru through Student Hire, Community Hire, and Veterans & Military Families pathways.",
  openGraph: {
    title: "Careers, Internships & Opportunities | SitGuru",
    description:
      "Open company roles, SitGuru Internship Program postings, marketplace Guru paths, and guided hire programs.",
  },
};

type OpportunityCard = {
  title: string;
  eyebrow: string;
  description: string;
  icon: ReactNode;
  href: string;
  cta: string;
  highlights: string[];
  featured?: boolean;
};

const guruOpportunities: OpportunityCard[] = [
  {
    title: "Become a SitGuru Guru",
    eyebrow: "Primary path · Marketplace",
    description:
      "Join SitGuru as a Guru — an independent pet care provider who connects with Pet Parents looking for trusted local care.",
    icon: <PawPrint size={28} />,
    href: "/become-a-guru",
    cta: "Become a Guru",
    featured: true,
    highlights: [
      "Connect with Pet Parents nearby",
      "Build a trusted local profile",
      "Offer services you already provide",
      "Grow through reliable care",
    ],
  },
  {
    title: "Student Hire Program",
    eyebrow: "Guided pathway · Students",
    description:
      "For current students, recent graduates, and summer workers who want flexible pet care opportunities and a supported path toward Guru status — not a traditional campus job board listing.",
    icon: <GraduationCap size={28} />,
    href: "/programs/apply?program=student-hire",
    cta: "Apply Today",
    highlights: [
      "Current students welcome",
      "Recent grads welcome",
      "Summer-friendly flexibility",
      "Supportive Guru pathway",
    ],
  },
  {
    title: "Community Hire Program",
    eyebrow: "Guided pathway · Community",
    description:
      "For qualified people connected through city, state, federal, nonprofit, and community workforce programs who are ready to learn and grow into SitGuru Gurus.",
    icon: <Building2 size={28} />,
    href: "/programs/apply?program=community-hire",
    cta: "Apply Today",
    highlights: [
      "Workforce program pathways",
      "Community partner referrals",
      "Training and guidance",
      "Grow into Guru status",
    ],
  },
  {
    title: VETERANS_MILITARY_FAMILIES_PROGRAM.displayName,
    eyebrow: VETERANS_MILITARY_FAMILIES_PROGRAM.eyebrow,
    description:
      "For veterans, eligible service members, National Guard, reservists, military spouses, and qualified dependents over 18 who want to grow into trusted SitGuru Gurus.",
    icon: <Medal size={28} />,
    href: VETERANS_MILITARY_FAMILIES_PROGRAM.applyHref,
    cta: "Apply Today",
    highlights: [
      "Veterans and military families welcome",
      "Training and support",
      "Trust and safety check required",
      "Pathway to Guru status",
    ],
  },
];

const opportunityTypes = [
  {
    title: "Marketplace Guru",
    description:
      "Independent pet care providers who build a profile, complete trust steps, and connect with Pet Parents on SitGuru.",
  },
  {
    title: "Guided programs",
    description:
      "Student Hire, Community Hire, and Veterans & Military Families — structured on-ramps toward Guru status.",
  },
  {
    title: "Company careers & internships",
    description:
      "Paid SitGuru roles and the SitGuru Internship Program — searchable below. Interns support a paid manager and can earn college credit.",
  },
];

const quickStats = [
  "Open careers",
  "Paid internships",
  "Guru opportunities",
  "Student Hire",
  "Community Hire",
  VETERANS_MILITARY_FAMILIES_PROGRAM.shortName,
];

const providerServices = [
  "Pet sitting",
  "Dog walking",
  "Boarding",
  "Drop-ins",
  "Day care",
  "Training support",
  "Grooming support",
  "Custom pet care",
];

const futureCompanyAreas = [
  "Customer support",
  "Guru operations",
  "Partnerships",
  "Trust and safety",
  "Marketing",
  "Technology",
];

const partnerFits = [
  "Student career centers",
  "Community workforce programs",
  "Military transition programs",
  "Nonprofit job programs",
  "Local community partners",
];

const applicationSupport = [
  "Program source tracking",
  "Applicant review",
  "Onboarding progress",
  "Guru pathway support",
];

function OpportunityCard({ opportunity }: { opportunity: OpportunityCard }) {
  return (
    <article
      className={`rounded-[32px] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${
        opportunity.featured
          ? "border-emerald-200 bg-emerald-50"
          : "border-[#e3ece5] bg-white hover:border-green-200"
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-green-800 text-white shadow-lg shadow-emerald-900/15">
        {opportunity.icon}
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-green-700">
        {opportunity.eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-black tracking-tight text-green-950">
        {opportunity.title}
      </h2>

      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {opportunity.description}
      </p>

      <div className="mt-5 space-y-2">
        {opportunity.highlights.map((highlight) => (
          <div
            key={highlight}
            className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-600"
          >
            <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={15} />
            <span>{highlight}</span>
          </div>
        ))}
      </div>

      <Link
        href={opportunity.href}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
      >
        {opportunity.cta}
        <ArrowRight size={17} />
      </Link>
    </article>
  );
}

function StepCard({
  numberLabel,
  icon,
  title,
  description,
}: {
  numberLabel: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
          {icon}
        </div>

        <span className="rounded-full bg-[#f7faf4] px-3 py-1 text-xs font-black text-green-900">
          {numberLabel}
        </span>
      </div>

      <h3 className="text-lg font-black text-slate-950">{title}</h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-green-800">
        {title}
      </p>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-600"
          >
            <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={15} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CareersPage() {
  const openJobs = await listPublishedCareerJobs();

  return (
    <main className="min-h-screen bg-[#f9faf5] pb-[calc(8.5rem+env(safe-area-inset-bottom))] text-slate-950 sm:pb-0">
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="#open-roles"
            className="flex min-h-12 items-center justify-center rounded-full border border-emerald-200 bg-white px-3 text-sm font-black text-green-900"
          >
            Search jobs
          </Link>
          <Link
            href="/become-a-guru"
            className="flex min-h-12 items-center justify-center gap-1 rounded-full bg-green-800 px-3 text-sm font-black text-white"
          >
            Become a Guru
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <section
        className="public-dark-section relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        data-brand-green
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-emerald-300 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] !text-white">
              <BriefcaseBusiness size={15} />
              Careers &amp; Opportunities
            </div>

            <h1 className="max-w-5xl text-4xl font-black leading-[1.05] tracking-tight !text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
              Search SitGuru careers, internships, and Guru pathways.
            </h1>

            <p className="mt-5 max-w-3xl text-base font-semibold leading-8 !text-white/90 sm:text-lg">
              Open company roles and the SitGuru Internship Program are posted
              here. Most marketplace opportunities still start with becoming a
              Guru — plus Student Hire, Community Hire, and{" "}
              {VETERANS_MILITARY_FAMILIES_PROGRAM.shortName}.
            </p>

            <p className="mt-4 max-w-3xl text-base font-semibold leading-8 !text-white/80">
              Internships are paid hourly and academic-credit eligible. They
              support a paid Social Media &amp; Community Growth Manager — they
              do not replace that hire.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="#open-roles"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-black text-green-950 shadow-xl shadow-black/20 transition hover:bg-green-50 sm:w-auto"
              >
                Search open roles
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/become-a-guru"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-black !text-white transition hover:bg-white/15 sm:w-auto"
              >
                Become a Guru
                <PawPrint size={18} />
              </Link>

              <Link
                href="/programs/apply"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-black !text-white transition hover:bg-white/15 sm:w-auto"
              >
                Apply to a Program
                <Sparkles size={18} />
              </Link>

              <Link
                href="/programs"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-black !text-white transition hover:bg-white/15 sm:w-auto"
              >
                View Programs
                <UsersRound size={18} />
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {quickStats.map((label) => (
                <span
                  key={label}
                  className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-5">
            <div className="rounded-[28px] bg-white p-5 text-slate-950 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <Trophy size={24} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                    Opportunity Path
                  </p>
                  <h2 className="text-2xl font-black text-green-950">
                    Start. Serve. Grow.
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Search paid careers and internships below",
                  "Or start as a Guru / apply to a hire program",
                  "Interns get mentoring, portfolio work, and college credit options",
                  "The best interns can grow into paid SitGuru roles",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 text-sm font-bold text-slate-600"
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-green-700"
                      size={17}
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/programs/apply"
                className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Apply to a Program
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-5 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
              Three ways to grow
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
              Careers here means open jobs, internships, Guru paths, and programs.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              Search live SitGuru postings first. Guru work and guided hire
              programs remain the main marketplace paths. Company roles and
              internships are listed when HR publishes them.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {opportunityTypes.map((item) => (
              <div
                key={item.title}
                className="rounded-[26px] border border-[#e3ece5] bg-[#fbfcf9] p-5"
              >
                <h3 className="text-lg font-black text-green-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="open-roles"
          className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8"
        >
          <div className="mb-5 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
              Career search
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
              Open SitGuru careers and internships
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              Filter by careers or internships. These listings are managed by
              SitGuru HR and go live as soon as they are published.
            </p>
          </div>
          <CareersJobBoard jobs={openJobs} />
        </section>

        <section className="rounded-[32px] border border-green-100 bg-emerald-50 p-5 shadow-sm sm:p-6 lg:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
            SitGuru Internship Program
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
            Paid, remote, academic-credit eligible — not free labor.
          </h2>
          <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-600">
            Interns work 8–12 hours a week with SitGuru leadership and support
            the Social Media &amp; Community Growth Manager. Preferred model:
            paid hourly plus college credit through the student&apos;s school
            (for example Bucks County Community College MKTG-280). Semester
            rotations keep the program educational and recurring.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              "Social Media & Digital Marketing",
              "Community Partnerships",
              "Pet Event Marketing",
              "Graphic Design / Content",
              "Software Development",
              "Data / Analytics",
            ].map((track) => (
              <div
                key={track}
                className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-black text-green-950"
              >
                {track}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StepCard
            numberLabel="01"
            icon={<PawPrint size={22} />}
            title="Become a Guru"
            description="Create a Guru profile and connect with Pet Parents looking for trusted local pet care."
          />
          <StepCard
            numberLabel="02"
            icon={<GraduationCap size={22} />}
            title="Student Hire"
            description="A pathway for students, recent grads, and summer workers interested in flexible pet care opportunities."
          />
          <StepCard
            numberLabel="03"
            icon={<HeartHandshake size={22} />}
            title="Community Hire"
            description="A pathway for qualified applicants connected through workforce, nonprofit, and community programs."
          />
          <StepCard
            numberLabel="04"
            icon={<Medal size={22} />}
            title={VETERANS_MILITARY_FAMILIES_PROGRAM.shortName}
            description="A pathway for veterans, military families, and eligible military-connected applicants."
          />
        </section>

        <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Careers at SitGuru
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                Most opportunities today start with becoming a Guru.
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                SitGuru’s first growth focus is building a strong marketplace of
                trusted Gurus who help Pet Parents find reliable care. As
                SitGuru grows, future company roles may include operations,
                support, partnerships, marketing, technology, trust and safety,
                and customer experience — listed separately when available.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/become-a-guru"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  Become a Guru
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/programs"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  Learn About Programs
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoList title="Guru services" items={providerServices} />
              <InfoList
                title="Future company areas"
                items={futureCompanyAreas}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
              Open Pathways
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
              Choose how you want to start with SitGuru.
            </h2>

            <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-600">
              Whether you already provide pet care or you want a guided program
              pathway, SitGuru helps qualified people take the next step toward
              connecting with Pet Parents.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {guruOpportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.title}
                opportunity={opportunity}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-[#e3ece5] bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Program Partners
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                Help people discover SitGuru opportunities.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                Student career centers, community workforce programs, military
                support organizations, nonprofits, and local partners can refer
                qualified people who may be a strong fit for trusted pet care and
                Guru growth.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/partners"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  Partner with SitGuru
                  <Handshake size={17} />
                </Link>

                <Link
                  href="/programs"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  View Programs
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoList title="Partner fits" items={partnerFits} />
              <InfoList
                title="Application support"
                items={applicationSupport}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-green-100 bg-green-950 p-6 text-white shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-200">
                Ready to start?
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight !text-white sm:text-4xl">
                Search a role, apply as a Guru, or start an internship.
              </h2>

              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 !text-white/85 sm:text-base sm:leading-7">
                Become a Guru, apply through Student Hire, Community Hire, or{" "}
                {VETERANS_MILITARY_FAMILIES_PROGRAM.shortName}, or help someone
                you know discover a SitGuru opportunity.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/become-a-guru"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-green-950 transition hover:bg-green-50"
              >
                Become a Guru
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/programs/apply"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-black !text-white transition hover:bg-white/15"
              >
                Apply to Program
                <Sparkles size={17} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
