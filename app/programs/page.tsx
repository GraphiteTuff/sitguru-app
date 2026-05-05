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
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCheck,
} from "lucide-react";

type ProgramKey =
  | "student-hire"
  | "community-hire"
  | "military-hire"
  | "skillbridge-interest";

type ProgramDefinition = {
  key: ProgramKey;
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
    key: "student-hire",
    title: "Student Hire Program",
    shortTitle: "Student",
    eyebrow: "Extra cash for students",
    description:
      "Broke between classes? SitGuru helps students, recent grads, high school seniors 18+, trade school students, gap-year students, and summer workers apply for flexible pet care opportunities that can fit around school, breaks, weekends, and summer.",
    href: "/programs/student-hire",
    applyHref: "/programs/apply?program=student-hire",
    icon: <GraduationCap size={28} />,
    heroLine:
      "Make extra cash after class, between classes, on weekends, during school breaks, or all summer. Walk dogs, do drop-ins, pet sit, help local pet parents, build your resume, and grow toward full Guru status when approved, onboarded, booked, and a strong SitGuru fit.",
    audience: [
      "Students who want extra cash",
      "High school seniors 18+",
      "College students",
      "Trade school and certificate program students",
      "Recent grads",
      "Students looking for summer money, break money, or after-class money",
      "Pet lovers who want flexible earning around school",
    ],
    benefits: [
      "A fun way to earn around your schedule",
      "Great summer, break, weekend, and after-class money",
      "Work with pets instead of boring busywork",
      "Build real-world customer service experience",
      "Boost your resume with local service experience",
      "Tell friends, classmates, teammates, and roommates",
      "Potential for greater commissions as you grow",
    ],
    steps: [
      "Apply through Student Hire",
      "Tell us your school schedule, summer availability, and goals",
      "Pick the pet care services you’re interested in",
      "Upload a resume, profile link, or supporting docs if you have them",
      "Complete onboarding and Checkr background check steps when eligible",
      "Earn, learn, tell friends, and grow toward full Guru status",
    ],
    partnerTypes: [
      "Universities",
      "High schools and student groups",
      "Career centers",
      "Student organizations",
      "Athletic teams and clubs",
      "Local education partners",
      "Summer work programs",
    ],
  },
  {
    key: "community-hire",
    title: "Community Hire Program",
    shortTitle: "Community",
    eyebrow: "Community workforce pathway",
    description:
      "Community Hire is a supported pathway for qualified applicants connected through workforce programs, nonprofits, city, state, federal, community organizations, re-entry support programs, job-readiness programs, and local employment-support partners.",
    href: "/programs/community-hire",
    applyHref: "/programs/apply?program=community-hire",
    icon: <Building2 size={28} />,
    heroLine:
      "Need a flexible way to build income and experience? Community Hire helps qualified applicants apply for local pet care opportunities with SitGuru. This is not full-time employment, part-time employment, or guaranteed job placement.",
    audience: [
      "Workforce program participants",
      "Nonprofit partner referrals",
      "City, state, and federal program referrals",
      "Job-readiness program participants",
      "Re-entry support program participants",
      "Community organization referrals",
      "People seeking flexible local work opportunities",
      "Applicants ready to learn, communicate, and show reliability",
    ],
    benefits: [
      "A supported pathway toward becoming a full SitGuru Guru",
      "Local pet care opportunities with onboarding guidance",
      "A chance to build income, confidence, and service experience",
      "Connection through workforce and community partners",
      "Fair, consistent, role-related background check review",
      "Potential for greater commissions as you grow",
      "Future SitGuru benefits as programs expand",
    ],
    steps: [
      "Apply through the Community Hire Program",
      "Share your workforce, nonprofit, or community partner source",
      "Upload a resume, profile link, or supporting documents if available",
      "Complete onboarding and training guidance",
      "Complete a fair, role-related Checkr background check process when required",
      "Grow toward full Guru status through reliability and performance",
    ],
    partnerTypes: [
      "Workforce development boards",
      "CareerLink and job centers",
      "City workforce programs",
      "State employment programs",
      "Federal workforce programs",
      "Nonprofit workforce partners",
      "Re-entry support organizations",
      "Community training organizations",
      "Faith-based and community organizations",
    ],
  },
  {
    key: "military-hire",
    title: "Military Hire Program",
    shortTitle: "Military",
    eyebrow: "Military-connected Guru pathway",
    description:
      "SitGuru welcomes veterans, transitioning service members, eligible service members, National Guard, reservists, military spouses, and qualified military-connected applicants over 18 who want to turn their love for pets into meaningful local pet care opportunities.",
    href: "/programs/military-hire",
    applyHref: "/programs/apply?program=military-hire",
    icon: <Medal size={28} />,
    heroLine:
      "Bring your reliability, accountability, care, and service mindset to families who need trusted pet care. Qualified participants can apply, complete onboarding, complete a Checkr background check, and grow toward full Guru status over time.",
    audience: [
      "Veterans",
      "Transitioning service members",
      "Eligible service members",
      "National Guard and reservists",
      "Military spouses",
      "Qualified dependents over 18",
      "Military-connected applicants ready to work, learn, and grow",
    ],
    benefits: [
      "A guided pathway toward becoming a full SitGuru Guru",
      "Flexible pet care opportunities",
      "Supportive onboarding and training",
      "A way to serve local pet families",
      "Potential for greater commissions as you grow",
      "Future SitGuru benefits as programs expand",
    ],
    steps: [
      "Apply through the Military Hire Program",
      "Complete your SitGuru applicant profile",
      "Share transferable experience you would like SitGuru to consider",
      "Complete onboarding, training, and a Checkr background check",
      "Begin building reliability, communication, and trust",
      "Work toward full Guru status with greater earning potential",
    ],
    partnerTypes: [
      "Military transition offices",
      "Veteran organizations",
      "Military spouse support networks",
      "Base community partners",
      "Guard and reserve networks",
    ],
  },
  {
    key: "skillbridge-interest",
    title: "SkillBridge Interest List",
    shortTitle: "SkillBridge",
    eyebrow: "Exploring future SkillBridge pathway",
    description:
      "SitGuru is exploring a future SkillBridge-style training pathway for active-duty transitioning service members interested in pet care operations, trust and safety, customer experience, local services, and post-transition opportunities.",
    href: "/programs/skillbridge-interest",
    applyHref: "/programs/apply?program=skillbridge-interest",
    icon: <ShieldCheck size={28} />,
    heroLine:
      "Join the interest list to share your transition goals, background, and areas of interest. SitGuru may use this list to explore future training pathways, provider partnerships, and post-transition opportunities.",
    audience: [
      "Active-duty transitioning service members",
      "Service members exploring civilian pet care operations",
      "Applicants interested in customer trust and safety",
      "Applicants interested in local services and operations",
      "Transitioning service members with command approval when applicable",
      "People planning post-transition flexible opportunities",
    ],
    benefits: [
      "Early interest list for future SkillBridge-style pathways",
      "Explore pet care operations and local services",
      "Share transition goals and transferable experience",
      "Learn about future SitGuru training possibilities",
      "Potential connection to future onboarding pathways",
    ],
    steps: [
      "Join the SkillBridge Interest List",
      "Share your transition timeline and transferable experience",
      "Upload optional supporting documents if you choose",
      "Receive updates if SitGuru launches or partners on a SkillBridge pathway",
      "Explore future onboarding, training, and post-transition opportunities",
    ],
    partnerTypes: [
      "Transition assistance programs",
      "Military education offices",
      "SkillBridge providers",
      "Veteran transition partners",
      "Local workforce partners",
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

function ProgramCard({ program }: { program: ProgramDefinition }) {
  const isStudent = program.key === "student-hire";
  const isCommunity = program.key === "community-hire";
  const isSkillBridge = program.key === "skillbridge-interest";

  return (
    <section
      id={program.key}
      className={`rounded-[28px] border bg-white p-4 shadow-sm sm:rounded-[34px] sm:p-5 ${
        isStudent ? "border-amber-200" : "border-[#e3ece5]"
      }`}
    >
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl shadow-lg sm:h-16 sm:w-16 ${
              isStudent
                ? "bg-amber-400 text-amber-950 shadow-amber-900/10"
                : "bg-green-800 text-white shadow-emerald-900/15"
            }`}
          >
            {program.icon}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
              {program.eyebrow}
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-green-950 sm:text-4xl">
              {program.title}
            </h2>

            <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
              {program.description}
            </p>

            <p
              className={`mt-4 max-w-4xl rounded-2xl border px-4 py-3 text-sm font-black leading-6 ${
                isStudent
                  ? "border-amber-200 bg-amber-50 text-amber-950"
                  : "border-green-100 bg-green-50 text-green-950"
              }`}
            >
              {program.heroLine}
            </p>
          </div>
        </div>

        <Link
          href={program.applyHref}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black shadow-lg transition ${
            isStudent
              ? "bg-amber-400 text-amber-950 shadow-amber-900/10 hover:bg-amber-300"
              : "bg-green-800 text-white shadow-emerald-900/15 hover:bg-green-900"
          }`}
        >
          {isStudent
            ? "Start Earning"
            : isSkillBridge
              ? "Join Interest List"
              : "Apply Now"}
          <ArrowRight size={18} />
        </Link>
      </div>

      {isStudent ? (
        <div className="mt-6 rounded-[26px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-green-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
              <Sparkles size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-green-950">
                Extra cash. Pets. Flexible schedule. Summer-ready.
              </h3>

              <p className="mt-2 text-sm font-bold leading-7 text-slate-700">
                Student Hire is built to feel easy, exciting, and useful: after
                class, between classes, school breaks, weekends, and summer.
                Apply, pick the services you’re interested in, and tell your
                friends.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "Earn after class",
                  "Make money between classes",
                  "Great summer side hustle",
                  "Perfect for school breaks",
                  "Work with pets",
                  "Tell friends and roommates",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm font-black text-green-950"
                  >
                    <CheckCircle2 size={16} className="text-green-700" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isCommunity ? (
        <div className="mt-6 rounded-[26px] border border-blue-200 bg-blue-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-800 shadow-sm">
              <ShieldCheck size={24} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">
                Background check fairness
              </p>

              <h3 className="mt-1 text-xl font-black text-blue-950">
                SitGuru follows EEOC guidance for fair review.
              </h3>

              <p className="mt-2 text-sm font-bold leading-7 text-blue-950">
                A background check through Checkr may be part of the approval
                process. SitGuru reviews background check information fairly,
                consistently, and in relation to pet care responsibilities, home
                access, safety, trust, and customer needs.
              </p>

              <p className="mt-2 text-sm font-bold leading-7 text-blue-950">
                Background check information is reviewed in context and does not
                automatically disqualify every applicant. When appropriate,
                SitGuru may consider the nature of the information, how much
                time has passed, its relationship to the services requested, and
                any additional context the applicant provides.
              </p>

              <p className="mt-3 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-xs font-black leading-6 text-blue-900">
                Community Hire is a referral and readiness pathway, not
                full-time employment, part-time employment, or guaranteed job
                placement.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <InfoList title="Who this program welcomes" items={program.audience} />
        <InfoList title="Why join SitGuru" items={program.benefits} />
        <InfoList title="How it works" items={program.steps} />
        <InfoList title="Community partners" items={program.partnerTypes} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {isStudent ? (
          <>
            <Pill>Extra cash</Pill>
            <Pill>After class</Pill>
            <Pill>Summer money</Pill>
            <Pill>Tell your friends</Pill>
          </>
        ) : isCommunity ? (
          <>
            <Pill>Workforce-friendly pathway</Pill>
            <Pill>EEOC-guided review</Pill>
            <Pill>Fair background process</Pill>
            <Pill>Not guaranteed employment</Pill>
          </>
        ) : isSkillBridge ? (
          <>
            <Pill>Interest list</Pill>
            <Pill>Future pathway</Pill>
            <Pill>Transition support</Pill>
            <Pill>Training exploration</Pill>
          </>
        ) : (
          <>
            <Pill>Military-connected pathway</Pill>
            <Pill>Supportive onboarding</Pill>
            <Pill>Training and guidance</Pill>
            <Pill>Pet care opportunities</Pill>
          </>
        )}

        <Pill>Background checks required when applicable</Pill>
        <Pill>Pathway to full Guru status</Pill>
      </div>
    </section>
  );
}

export default function ProgramsPage() {
  return (
    <main className="min-h-screen bg-[#f9faf5]">
      <section
        className="relative overflow-hidden px-4 py-10 text-white sm:px-6 sm:py-14 lg:px-8 lg:py-16"
        style={{
          background:
            "linear-gradient(135deg, #04331f 0%, #07572f 52%, #047857 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-25">
          <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-emerald-300 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-10">
          <div>
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] shadow-sm backdrop-blur sm:tracking-[0.18em]"
              style={{ color: "#ffffff" }}
            >
              <HeartHandshake size={15} />
              SitGuru Programs
            </div>

            <h1
              className="max-w-5xl text-[2.55rem] font-black leading-[0.98] tracking-tight drop-shadow-sm sm:text-5xl sm:leading-[0.95] lg:text-6xl"
              style={{
                color: "#ffffff",
                textShadow: "0 2px 18px rgba(0,0,0,0.28)",
              }}
            >
              Student first. Community next. Military supported. SkillBridge
              explored.
            </h1>

            <p
              className="mt-5 max-w-3xl text-base font-bold leading-7 sm:text-lg sm:leading-8 lg:text-xl"
              style={{
                color: "#ecfdf5",
                textShadow: "0 1px 10px rgba(0,0,0,0.24)",
              }}
            >
              SitGuru programs help qualified applicants find the right pathway
              into trusted local pet care opportunities. Student Hire helps
              students earn extra cash around school and summer. Community Hire
              supports workforce and community pathways. Military Hire welcomes
              military-connected applicants. SkillBridge Interest helps SitGuru
              explore future transition pathways.
            </p>

            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/programs/apply?program=student-hire"
                className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-4 text-sm font-black text-amber-950 shadow-xl shadow-black/20 transition hover:bg-amber-300 sm:w-auto"
              >
                Start Student Hire
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/partners"
                className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/15 px-6 py-4 text-sm font-black text-white shadow-sm transition hover:bg-white/20 sm:w-auto"
              >
                Become a Program Partner
                <Handshake size={18} />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950 shadow-sm">
                Student extra cash
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950 shadow-sm">
                Community workforce pathway
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950 shadow-sm">
                Military welcome
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950 shadow-sm">
                SkillBridge interest
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950 shadow-sm">
                Pathway to Guru status
              </span>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/20 bg-white/15 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:rounded-[34px] sm:p-5">
            <div className="rounded-[24px] bg-white p-5 text-slate-950 sm:rounded-[28px] sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <Sparkles size={24} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                    Why Join SitGuru
                  </p>
                  <h2 className="text-2xl font-black leading-tight text-green-950 sm:text-3xl">
                    Apply. Onboard. Grow into Guru status.
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Start through a program that fits your background",
                  "Receive onboarding, training, and support",
                  "Build reliability, communication, and pet care confidence",
                  "Grow toward full Guru status when you meet SitGuru standards",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 text-sm font-bold leading-6 text-slate-600"
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
                href="/programs/apply?program=student-hire"
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
            icon={<GraduationCap size={22} />}
            title="Student Hire first"
            description="Students can apply for flexible pet care opportunities around class, breaks, weekends, and summer."
          />
          <FeatureCard
            icon={<Building2 size={22} />}
            title="Community pathway"
            description="Community Hire supports qualified workforce and community applicants without promising employment or placement."
          />
          <FeatureCard
            icon={<ShieldCheck size={22} />}
            title="Fair review matters"
            description="SitGuru follows EEOC guidance for fair, consistent, role-related background check review."
          />
          <FeatureCard
            icon={<Trophy size={22} />}
            title="Grow over time"
            description="Productive participants who are reliable, professional, and a strong fit can work toward full Guru status."
          />
        </section>

        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:rounded-[32px]">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Pathway to Guru Status
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-green-950 sm:text-3xl">
                Programs are a guided path into becoming a full SitGuru Guru.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                Each SitGuru program is designed as a pathway where qualified
                applicants can receive onboarding, support, and guidance while
                building readiness. Participants who demonstrate reliability,
                professionalism, strong communication, productivity, customer
                care, and a good fit for SitGuru may grow into full Guru status.
              </p>

              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-900">
                Approved Gurus provide services as independent contractors.
                Applying through a program does not guarantee approval, bookings,
                earnings, employment, commissions, benefits, placement, or full
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
                title="What helps you grow"
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

        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:rounded-[32px]">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Program Overview
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-green-950 sm:text-3xl">
                Four ways to get started with SitGuru.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                Start with Student Hire, then Community Hire, Military Hire, and
                SkillBridge Interest. Each program routes applicants to the exact
                application pathway so SitGuru can review fit, availability,
                documents, onboarding needs, and next steps.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            title="Review and onboard"
            description="Complete onboarding, profile, trust, safety, training, and background check steps required by SitGuru."
          />
          <StepCard
            numberLabel="04"
            icon={<Trophy size={22} />}
            title="Grow toward full Guru"
            description="Productive participants who meet SitGuru standards and are a strong fit can grow into full Guru status."
          />
        </section>

        <section className="rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Program Partners
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-green-950 sm:text-3xl">
                Help people discover SitGuru opportunities.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Schools, workforce programs, military support organizations,
                nonprofits, re-entry support organizations, job-readiness
                programs, and community partners can refer qualified people who
                may be a great fit for trusted pet care and can grow toward full
                SitGuru Guru status through onboarding, support, and strong
                performance.
              </p>

              <p className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold leading-6 text-blue-900">
                SitGuru Community Hire is a referral and readiness pathway, not
                a direct employment placement program. SitGuru follows EEOC
                guidance for fair, consistent, role-related background check
                review.
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
                  "Student career centers",
                  "Summer work programs",
                  "Workforce programs",
                  "Nonprofit job programs",
                  "Re-entry support organizations",
                  "Military transition programs",
                ]}
              />

              <InfoList
                title="What applications support"
                items={[
                  "Program source tracking",
                  "Applicant review",
                  "Onboarding progress",
                  "Fair background check process",
                  "Guru growth tracking",
                ]}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}