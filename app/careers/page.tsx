import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Medal,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserCheck,
  UsersRound,
} from "lucide-react";

type OpportunityCard = {
  title: string;
  eyebrow: string;
  description: string;
  icon: ReactNode;
  href: string;
  cta: string;
  highlights: string[];
};

const guruOpportunities: OpportunityCard[] = [
  {
    title: "Become a SitGuru Guru",
    eyebrow: "Pet care provider pathway",
    description:
      "Join SitGuru as a trusted pet care Guru and offer services like dog walking, pet sitting, boarding, drop-ins, day care, training support, and custom care.",
    icon: <PawPrint size={28} />,
    href: "/become-a-guru",
    cta: "Become a Guru",
    highlights: [
      "Offer pet care services",
      "Build a trusted local profile",
      "Support pet families nearby",
      "Grow through great service",
    ],
  },
  {
    title: "Military Hire Program",
    eyebrow: "Military-connected Guru pathway",
    description:
      "For veterans, eligible service members, National Guard, reservists, military spouses, and qualified dependents over 18 who want to grow into trusted SitGuru Gurus.",
    icon: <Medal size={28} />,
    href: "/programs/apply?program=military-hire",
    cta: "Apply Today",
    highlights: [
      "Veterans and military families welcome",
      "Training and support",
      "Background checks required",
      "Pathway to full Guru status",
    ],
  },
  {
    title: "Student Hire Program",
    eyebrow: "Current students, recent grads, summer work",
    description:
      "For current students, recent graduates, and students looking for summer work who want flexible pet care opportunities and a path to full Guru status.",
    icon: <GraduationCap size={28} />,
    href: "/programs/apply?program=student-hire",
    cta: "Apply Today",
    highlights: [
      "Current students welcome",
      "Recent grads welcome",
      "Summer work opportunities",
      "Supportive Guru pathway",
    ],
  },
  {
    title: "Community Hire Program",
    eyebrow: "Community workforce Guru pathway",
    description:
      "For qualified people connected through city, state, federal, nonprofit, and community workforce programs who are ready to work, learn, and grow with SitGuru.",
    icon: <Building2 size={28} />,
    href: "/programs/apply?program=community-hire",
    cta: "Apply Today",
    highlights: [
      "Workforce program pathways",
      "Community partner referrals",
      "Training and guidance",
      "Grow into full Guru status",
    ],
  },
];

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
      {children}
    </span>
  );
}

function OpportunityCard({ opportunity }: { opportunity: OpportunityCard }) {
  return (
    <article className="rounded-[32px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
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
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
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

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-[#f9faf5]">
      <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-emerald-300 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
              <BriefcaseBusiness size={15} />
              SitGuru Careers
            </div>

            <h1 className="max-w-5xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Grow with SitGuru as a Guru, program participant, or future team member.
            </h1>

            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-white/85">
              SitGuru is building a trusted pet care marketplace and a welcoming
              pathway for people who want to help pet families. Start as a Guru,
              apply through a program, or follow future SitGuru company career
              opportunities as we grow.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/become-a-guru"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-green-950 shadow-xl shadow-black/20 transition hover:bg-green-50"
              >
                Become a Guru
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/programs"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                View Programs
                <Sparkles size={18} />
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Guru opportunities
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Military welcome
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Student pathways
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Community workforce
              </span>
            </div>
          </div>

          <div className="rounded-[34px] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="rounded-[28px] bg-white p-6 text-slate-950">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <Trophy size={24} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                    Guru Growth Path
                  </p>
                  <h2 className="text-2xl font-black text-green-950">
                    Train. Serve. Grow.
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Apply as a Guru or program participant",
                  "Complete onboarding, trust, safety, and background check steps",
                  "Build a strong profile and service readiness",
                  "Grow with SitGuru through reliability and great pet care",
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
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Apply to a Program
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StepCard
            numberLabel="01"
            icon={<PawPrint size={22} />}
            title="Become a Guru"
            description="Offer trusted pet care services and build a local profile that helps pet families find you."
          />
          <StepCard
            numberLabel="02"
            icon={<HeartHandshake size={22} />}
            title="Join a program"
            description="Military, Student, and Community Hire programs help qualified applicants train and grow."
          />
          <StepCard
            numberLabel="03"
            icon={<ShieldCheck size={22} />}
            title="Complete checks"
            description="SitGuru uses onboarding, trust, safety, and background check steps to support pet family confidence."
          />
          <StepCard
            numberLabel="04"
            icon={<Trophy size={22} />}
            title="Grow with SitGuru"
            description="Productive, reliable participants who fit SitGuru standards can grow into full Guru status."
          />
        </section>

        <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Careers at SitGuru
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
                Most opportunities today start with becoming a Guru.
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                SitGuru’s first growth focus is building a strong network of
                trusted pet care Gurus. As SitGuru grows, future company roles
                may include operations, support, partnerships, marketing,
                technology, trust and safety, and customer experience.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/become-a-guru"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  Become a Guru
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/programs"
                  className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  Learn About Programs
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoList
                title="Guru pathways"
                items={[
                  "Pet sitting",
                  "Dog walking",
                  "Boarding",
                  "Drop-ins",
                  "Day care",
                  "Training support",
                ]}
              />

              <InfoList
                title="Future company areas"
                items={[
                  "Customer support",
                  "Guru operations",
                  "Partnerships",
                  "Trust and safety",
                  "Marketing",
                  "Technology",
                ]}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
              Open Pathways
            </p>

            <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
              Choose how you want to start with SitGuru.
            </h2>

            <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-600">
              Whether you already want to become a Guru or you are looking for a
              guided program pathway, SitGuru wants to help qualified people get
              started with pet care opportunities.
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

        <section className="rounded-[32px] border border-[#e3ece5] bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Program Partners
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
                Help people discover SitGuru opportunities.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Military support organizations, student career centers,
                workforce programs, nonprofits, and community partners can refer
                qualified people who may be a strong fit for trusted pet care and
                Guru growth.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/partners"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  Partner with SitGuru
                  <Handshake size={17} />
                </Link>

                <Link
                  href="/programs"
                  className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  View Programs
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoList
                title="Partner fits"
                items={[
                  "Military transition programs",
                  "Student career centers",
                  "Summer work programs",
                  "Workforce programs",
                  "Nonprofit job programs",
                ]}
              />
              <InfoList
                title="Application support"
                items={[
                  "Program source tracking",
                  "Applicant review",
                  "Onboarding progress",
                  "Guru graduation tracking",
                ]}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-green-100 bg-green-950 p-6 text-white shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                Ready to start?
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight">
                Apply today and take the first step with SitGuru.
              </h2>

              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-white/75">
                Start as a Guru, apply through a program, or help someone you
                know discover a SitGuru opportunity.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/become-a-guru"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-green-950 transition hover:bg-green-50"
              >
                Become a Guru
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/programs/apply"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
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