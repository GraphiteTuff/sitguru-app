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
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserCheck,
  UsersRound,
} from "lucide-react";

type ProgramDefinition = {
  key: "military-hire" | "student-hire" | "community-hire";
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  href: string;
  applyHref: string;
  icon: ReactNode;
  heroLine: string;
  audience: string[];
  benefits: string[];
  steps: string[];
  partnerTypes: string[];
};

const programs: ProgramDefinition[] = [
  {
    key: "military-hire",
    title: "Military Hire Program",
    shortTitle: "Military",
    eyebrow: "Military-connected Guru pathway",
    description:
      "SitGuru welcomes veterans, eligible service members, National Guard, reservists, military spouses, and qualified dependents over 18 who want to turn their love for pets into meaningful local pet care opportunities.",
    href: "/programs/military-hire",
    applyHref: "/programs/apply?program=military-hire",
    icon: <Medal size={28} />,
    heroLine:
      "Bring your reliability, care, and service mindset to families who need trusted pet care. Productive participants who meet SitGuru standards can grow into full Guru status.",
    audience: [
      "Veterans",
      "Eligible service members",
      "National Guard and reservists",
      "Military spouses",
      "Qualified dependents over 18",
    ],
    benefits: [
      "A guided pathway toward becoming a SitGuru Guru",
      "Flexible pet care opportunities",
      "Supportive onboarding and training",
      "A way to serve your local community",
      "A chance to grow through strong performance",
    ],
    steps: [
      "Apply through the Military Hire Program",
      "Complete your SitGuru profile",
      "Complete required onboarding, training, and checks",
      "Build readiness and work toward full Guru status",
    ],
    partnerTypes: [
      "Military transition offices",
      "Veteran organizations",
      "Military spouse support networks",
      "Base community partners",
    ],
  },
  {
    key: "student-hire",
    title: "Student Hire Program",
    shortTitle: "Student",
    eyebrow: "Current students, recent grads, and summer work",
    description:
      "SitGuru helps current students, recent graduates, and students looking for summer work find responsible, flexible pet care opportunities while building real-world experience, communication skills, and local community trust.",
    href: "/programs/student-hire",
    applyHref: "/programs/apply?program=student-hire",
    icon: <GraduationCap size={28} />,
    heroLine:
      "A flexible way for students and recent grads to earn, gain experience, find summer work, help pet families nearby, and grow into full Guru status when they are productive and a strong SitGuru fit.",
    audience: [
      "Current college students",
      "Trade school students",
      "Recent graduates",
      "Students looking for summer work",
      "Responsible student workers",
      "Students seeking flexible opportunities",
    ],
    benefits: [
      "A guided pathway toward becoming a SitGuru Guru",
      "Flexible scheduling potential",
      "Summer work and school-break opportunities",
      "Local pet care opportunities",
      "A positive way to build trust and references",
      "Support while getting started",
    ],
    steps: [
      "Apply through the Student Hire Program",
      "Tell us about your pet care experience and availability",
      "Share whether you are looking for semester, part-time, or summer opportunities",
      "Complete onboarding, training, and trust requirements",
      "Build a track record and work toward full Guru status",
    ],
    partnerTypes: [
      "Universities",
      "Career centers",
      "Student organizations",
      "Local education partners",
      "Summer work programs",
    ],
  },
  {
    key: "community-hire",
    title: "Community Hire Program",
    shortTitle: "Community",
    eyebrow: "Community workforce Guru pathway",
    description:
      "SitGuru partners with city, state, federal, nonprofit, and community workforce programs to welcome qualified people who need work and are ready to provide trusted pet care services.",
    href: "/programs/community-hire",
    applyHref: "/programs/apply?program=community-hire",
    icon: <Building2 size={28} />,
    heroLine:
      "A welcoming pathway for qualified people who want to work, grow, support pet families, and graduate into full Guru status through reliability and strong performance.",
    audience: [
      "People needing work",
      "Workforce program participants",
      "Job training participants",
      "Community re-entry participants",
      "Local nonprofit referrals",
    ],
    benefits: [
      "A guided pathway toward becoming a SitGuru Guru",
      "Supportive program onboarding",
      "Local opportunities with pet families",
      "A chance to build income and confidence",
      "Connection through community partners",
    ],
    steps: [
      "Apply through the Community Hire Program",
      "Share your program or partner source",
      "Complete onboarding, training, and trust requirements",
      "Show reliability and work toward full Guru status",
    ],
    partnerTypes: [
      "City workforce programs",
      "State employment programs",
      "Federal workforce programs",
      "Nonprofit workforce partners",
      "Community training organizations",
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

function ProgramCard({ program }: { program: ProgramDefinition }) {
  return (
    <section
      id={program.key}
      className="rounded-[34px] border border-[#e3ece5] bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-green-800 text-white shadow-lg shadow-emerald-900/15">
            {program.icon}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
              {program.eyebrow}
            </p>

            <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
              {program.title}
            </h2>

            <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-600">
              {program.description}
            </p>

            <p className="mt-4 max-w-4xl rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-black leading-6 text-green-950">
              {program.heroLine}
            </p>
          </div>
        </div>

        <Link
          href={program.applyHref}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-green-800 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
        >
          Apply Now
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <InfoList title="Who this program welcomes" items={program.audience} />
        <InfoList title="Why join SitGuru" items={program.benefits} />
        <InfoList title="How it works" items={program.steps} />
        <InfoList title="Community partners" items={program.partnerTypes} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Pill>Supportive onboarding</Pill>
        <Pill>Training and guidance</Pill>
        <Pill>Background checks required</Pill>
        <Pill>Pet care opportunities</Pill>
        <Pill>Pathway to full Guru status</Pill>
      </div>
    </section>
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

function StepCard({
  numberLabel,
  title,
  description,
  icon,
}: {
  numberLabel: string;
  title: string;
  description: string;
  icon: ReactNode;
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>

      <h3 className="text-lg font-black text-slate-950">{title}</h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

export default function ProgramsPage() {
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
              <HeartHandshake size={15} />
              SitGuru Programs
            </div>

            <h1 className="max-w-5xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Join SitGuru and grow into a trusted Guru.
            </h1>

            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-white/85">
              SitGuru welcomes military families, current students, recent
              graduates, students looking for summer work, and community
              workforce participants who want to help pet parents with trusted,
              caring, reliable pet services. Our programs are designed to train,
              support, and guide qualified participants toward full Guru status.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/programs/apply"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-green-950 shadow-xl shadow-black/20 transition hover:bg-green-50"
              >
                Apply to a Program
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/partners"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                Become a Program Partner
                <Handshake size={18} />
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Military welcome
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Students and recent grads
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Summer work pathways
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Community focused
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Pathway to Guru status
              </span>
            </div>
          </div>

          <div className="rounded-[34px] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="rounded-[28px] bg-white p-6 text-slate-950">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <Sparkles size={24} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                    Why Join SitGuru
                  </p>
                  <h2 className="text-2xl font-black text-green-950">
                    Train. Grow. Graduate to Guru.
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Start through a program that fits your background",
                  "Receive onboarding, training, and support",
                  "Build reliability, communication, and pet care confidence",
                  "Graduate to full Guru status when you meet SitGuru standards",
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
                Start Your Application
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            icon={<UsersRound size={22} />}
            title="Welcoming pathways"
            description="Choose the SitGuru program that best matches your background, goals, schedule, or referral source."
          />
          <FeatureCard
            icon={<ShieldCheck size={22} />}
            title="Safety matters"
            description="SitGuru uses onboarding, trust, safety, and background check steps to help protect pet families."
          />
          <FeatureCard
            icon={<BadgeCheck size={22} />}
            title="Train with support"
            description="We help program participants understand service quality, communication, profile readiness, and SitGuru expectations."
          />
          <FeatureCard
            icon={<Trophy size={22} />}
            title="Graduate to Guru"
            description="Productive participants who are reliable, professional, and a strong fit can graduate into full SitGuru Guru status."
          />
        </section>

        <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Pathway to Guru Status
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
                Programs are a guided path into becoming a full SitGuru Guru.
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                Each SitGuru program is designed as a limited-time pathway where
                qualified participants receive onboarding, training, support, and
                guidance while they build readiness. Participants who demonstrate
                reliability, professionalism, strong communication, productivity,
                customer care, and a good fit for SitGuru may graduate into full
                Guru status.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoList
                title="What SitGuru supports"
                items={[
                  "Onboarding guidance",
                  "Profile readiness",
                  "Service expectations",
                  "Communication standards",
                  "Trust and safety steps",
                ]}
              />

              <InfoList
                title="What helps you graduate"
                items={[
                  "Reliability",
                  "Productivity",
                  "Professional communication",
                  "Positive pet family experience",
                  "Strong SitGuru fit",
                ]}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Program Overview
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
                Three ways to get started with SitGuru.
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                Whether you are military-connected, a current student, a recent
                graduate, looking for summer work, or connected through a
                community workforce program, SitGuru wants to create a welcoming
                path for qualified people who care about pets and want to help
                families.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {programs.map((program) => (
                <Link
                  key={program.key}
                  href={`#${program.key}`}
                  className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 transition hover:border-green-200 hover:bg-green-50"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-800 text-white">
                    {program.icon}
                  </div>
                  <p className="text-sm font-black text-green-950">
                    {program.shortTitle}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    Learn more →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          {programs.map((program) => (
            <ProgramCard key={program.key} program={program} />
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-4">
          <StepCard
            numberLabel="01"
            icon={<BriefcaseBusiness size={22} />}
            title="Choose a program"
            description="Select the SitGuru program that best matches your background, schedule, or referral source."
          />
          <StepCard
            numberLabel="02"
            icon={<UserCheck size={22} />}
            title="Apply"
            description="Submit your application so SitGuru can learn more about you, your availability, and your interest in pet care."
          />
          <StepCard
            numberLabel="03"
            icon={<ShieldCheck size={22} />}
            title="Train and get support"
            description="Complete onboarding, profile, trust, safety, training, and background check steps required by SitGuru."
          />
          <StepCard
            numberLabel="04"
            icon={<Trophy size={22} />}
            title="Graduate to full Guru"
            description="Productive participants who meet SitGuru standards and are a strong fit can graduate into full Guru status."
          />
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
                Workforce programs, military support organizations, schools,
                nonprofits, and community partners can refer qualified people who
                may be a great fit for trusted pet care and can grow into full
                SitGuru Gurus through training, support, and strong performance.
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
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoList
                title="Good partner fits"
                items={[
                  "Military transition programs",
                  "Student career centers",
                  "Summer work programs",
                  "Workforce programs",
                  "Nonprofit job programs",
                ]}
              />
              <InfoList
                title="What applications support"
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
      </div>
    </main>
  );
}