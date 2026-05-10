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
  Trophy,
  UserCheck,
  UsersRound,
} from "lucide-react";

type ProgramKey =
  | "student-hire"
  | "community-hire"
  | "veterans-hire"
  | "ambassador-program";

type ProgramDefinition = {
  key: ProgramKey;
  title: string;
  shortTitle: string;
  campaign: string;
  eyebrow: string;
  description: string;
  href: string;
  applyHref: string;
  imageSrc: string;
  imageAlt: string;
  icon: ReactNode;
  heroLine: string;
  audience: string[];
  benefits: string[];
  steps: string[];
  partnerTypes: string[];
  badges: string[];
};

const programs: ProgramDefinition[] = [
  {
    key: "student-hire",
    title: "Student Hire Program",
    shortTitle: "Student Hire",
    campaign: "Earn with the Pack",
    eyebrow: "Flexible earning for students",
    description:
      "SitGuru helps students, recent grads, high school seniors 18+, trade school students, gap-year students, and summer workers apply for flexible pet care opportunities that can fit around school, breaks, weekends, and summer.",
    href: "#student-hire",
    applyHref: "/programs/apply?program=student-hire",
    imageSrc: "/images/programs/student-hire.jpg",
    imageAlt: "Student walking a dog on campus for the SitGuru Student Hire Program",
    icon: <GraduationCap size={28} />,
    heroLine:
      "Make extra cash after class, between classes, on weekends, during school breaks, or all summer. Student Hire is designed to be SitGuru’s largest and easiest pathway for students who love pets and want flexible earning opportunities.",
    audience: [
      "Students who want extra cash",
      "High school seniors 18+",
      "College students",
      "Trade school and certificate program students",
      "Recent grads",
      "Gap-year students",
      "Summer workers",
      "Pet lovers who want flexible earning around school",
    ],
    benefits: [
      "Earn around class, weekends, and school breaks",
      "Great summer and part-time-style opportunity",
      "Work with pets instead of boring busywork",
      "Build real customer service experience",
      "Grow toward full Guru status when approved",
      "Share SitGuru with classmates, roommates, and friends",
      "Explore Student Ambassador opportunities",
    ],
    steps: [
      "Apply through Student Hire",
      "Tell SitGuru about your school schedule and availability",
      "Choose the pet care services you are interested in",
      "Complete onboarding and profile readiness steps",
      "Complete SitGuru trust and safety review steps when required",
      "Grow through reliability, communication, and strong performance",
    ],
    partnerTypes: [
      "Universities",
      "High schools",
      "Career centers",
      "Student organizations",
      "Athletic teams and clubs",
      "Apartment communities",
      "Campus ambassadors",
      "Summer work programs",
    ],
    badges: [
      "Student extra cash",
      "After class",
      "Weekend friendly",
      "Summer ready",
      "Campus growth",
    ],
  },
  {
    key: "community-hire",
    title: "Community Hire Program",
    shortTitle: "Community Hire",
    campaign: "Work with the Pack",
    eyebrow: "Community workforce pathway",
    description:
      "Community Hire is a supported pathway for qualified applicants connected through workforce programs, nonprofits, city, state, federal, community organizations, re-entry support programs, job-readiness programs, and local employment-support partners.",
    href: "#community-hire",
    applyHref: "/programs/apply",
    imageSrc: "/images/programs/community-hire.jpg",
    imageAlt: "Friendly local dog walker representing the SitGuru Community Hire Program",
    icon: <Building2 size={28} />,
    heroLine:
      "Community Hire helps qualified applicants apply for local pet care opportunities while giving SitGuru a way to track program source, readiness, onboarding, trust and safety, and progress toward full Guru status.",
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
      "A supported pathway toward becoming a SitGuru Guru",
      "Local pet care opportunities with onboarding guidance",
      "A chance to build income, confidence, and service experience",
      "Connection through workforce and community partners",
      "Trust and safety review when applicable",
      "Community-based opportunity tracking",
      "Future SitGuru benefits as programs expand",
    ],
    steps: [
      "Apply through the Community Hire Program",
      "Share your workforce, nonprofit, or community partner source",
      "Upload a resume, profile link, or supporting documents if available",
      "Complete onboarding and training guidance",
      "Complete SitGuru trust and safety review steps when required",
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
      "Faith-based and community organizations",
    ],
    badges: [
      "Workforce-friendly",
      "Community pathway",
      "Partner referrals",
      "Fair review",
      "Local opportunity",
    ],
  },
  {
    key: "veterans-hire",
    title: "Veterans Hire Program",
    shortTitle: "Veterans Hire",
    campaign: "Serve with the Pack",
    eyebrow: "Veterans and military-connected pathway",
    description:
      "Veterans Hire brings the previous Military Hire Program and SkillBridge Interest List into one stronger SitGuru pathway for veterans, military spouses, Guard, Reserve, dependents over 18, and transitioning service members.",
    href: "#veterans-hire",
    applyHref: "/programs/apply?program=veterans-hire",
    imageSrc: "/images/programs/veterans-hire.jpg",
    imageAlt: "Military-connected family with a dog representing the SitGuru Veterans Hire Program",
    icon: <Medal size={28} />,
    heroLine:
      "Bring reliability, accountability, care, and a service mindset to families who need trusted pet care. Veterans Hire includes Military Hire and SkillBridge Interest tracking inside one clean program.",
    audience: [
      "Veterans",
      "Transitioning service members",
      "Eligible service members",
      "National Guard and reservists",
      "Military spouses",
      "Qualified dependents over 18",
      "SkillBridge-interested active-duty service members",
      "Military-connected applicants ready to work, learn, and grow",
    ],
    benefits: [
      "A guided pathway toward becoming a full SitGuru Guru",
      "Flexible pet care opportunities",
      "Supportive onboarding and training",
      "A way to serve local Pet Parents",
      "Military-connected community support",
      "Veteran Ambassador opportunity",
      "SkillBridge interest tracking for future planning",
    ],
    steps: [
      "Apply through the Veterans Hire Program",
      "Share your military-connected background or transition interest",
      "Select Military Hire, SkillBridge Interest, or Veteran Ambassador interest when applicable",
      "Complete your SitGuru applicant profile",
      "Complete onboarding and SitGuru trust and safety review steps when required",
      "Grow toward full Guru status or Ambassador growth opportunities",
    ],
    partnerTypes: [
      "Military transition offices",
      "Veteran organizations",
      "Military spouse support networks",
      "Base community partners",
      "Guard and reserve networks",
      "Transition assistance programs",
      "Military education offices",
      "SkillBridge-related transition partners",
    ],
    badges: [
      "Military Hire included",
      "SkillBridge Interest included",
      "Veterans welcome",
      "Military spouses",
      "Serve with the Pack",
    ],
  },
  {
    key: "ambassador-program",
    title: "Ambassador Program",
    shortTitle: "Ambassadors",
    campaign: "Lead the Pack",
    eyebrow: "Referral growth and Pack Leader recognition",
    description:
      "The SitGuru Ambassador Program is a profession-based community growth network for students, Vet Techs, veterinarians, trainers, groomers, rescue advocates, veterans, military spouses, community leaders, and existing Gurus who help grow trusted pet care.",
    href: "#ambassador-program",
    applyHref: "/programs/apply?program=ambassador-program",
    imageSrc: "/images/programs/ambassador-program.jpg",
    imageAlt: "Veterinary professional with a pet representing the SitGuru Ambassador Program",
    icon: <HeartHandshake size={28} />,
    heroLine:
      "Ambassadors help refer Gurus and Pet Parents, promote SitGuru in their own communities, and may become eligible for referral rewards, commission opportunities, bonuses, badges, and Pack Leader recognition with consent.",
    audience: [
      "Student Ambassadors",
      "Vet Tech Ambassadors",
      "Veterinarian Ambassadors",
      "Trainer Ambassadors",
      "Groomer and pet care professional Ambassadors",
      "Rescue and shelter advocates",
      "Veteran and military community Ambassadors",
      "Community leaders",
      "Existing Guru Ambassadors",
      "Medical and pet-care professionals who support responsible pet care",
    ],
    benefits: [
      "Help Pet Parents find trusted care",
      "Help qualified people become Gurus",
      "Promote SitGuru in your profession or community",
      "Use referral links, QR codes, flyers, and social posts",
      "Track referrals and qualified bookings",
      "May earn referral rewards or commission opportunities",
      "Top performers may be featured as Pack Leaders with consent",
    ],
    steps: [
      "Apply to become a SitGuru Ambassador",
      "Choose your Ambassador type and referral focus",
      "Receive or request a referral code and promotional tools",
      "Refer Gurus, Pet Parents, and local partners",
      "Qualified referrals and bookings are tracked by SitGuru",
      "Top performers may be rewarded and recognized as Pack Leaders",
    ],
    partnerTypes: [
      "Veterinary clinics",
      "Animal hospitals",
      "Training businesses",
      "Grooming businesses",
      "Pet stores",
      "Shelters and rescues",
      "Campus organizations",
      "Military and veteran groups",
      "Local community groups",
      "Existing SitGuru Gurus",
    ],
    badges: [
      "Lead the Pack",
      "Grow the Pack",
      "Referral rewards",
      "Commission tracking",
      "Pack Leader recognition",
    ],
  },
];

const ambassadorTypes = [
  {
    title: "Vet Tech Ambassadors",
    phrase: "Guide the Pack",
    description:
      "Vet Techs talk with Pet Parents every day about routines, wellness, follow-up care, and daily pet support. Their trusted voice can help connect families with SitGuru.",
  },
  {
    title: "Veterinarian Ambassadors",
    phrase: "Strengthen the Pack",
    description:
      "Veterinarians are trusted voices for Pet Parents. Their recommendations can help families discover reliable local pet care support beyond the clinic.",
  },
  {
    title: "Trainer Ambassadors",
    phrase: "Shape the Pack",
    description:
      "Trainers help pets and Pet Parents build trust, structure, and better routines while introducing families to dependable SitGuru support.",
  },
  {
    title: "Groomer Ambassadors",
    phrase: "Connect the Pack",
    description:
      "Groomers and pet care professionals regularly see Pet Parents and can help families find trusted pet care when life gets busy.",
  },
  {
    title: "Student Ambassadors",
    phrase: "Grow the Pack",
    description:
      "Students can share SitGuru on campus, in apartments, with friends, clubs, teammates, and local Pet Parents.",
  },
  {
    title: "Veteran & Military Ambassadors",
    phrase: "Serve the Pack",
    description:
      "Veterans, spouses, and military-connected families can help grow SitGuru through strong service networks and trusted local relationships.",
  },
  {
    title: "Rescue & Shelter Ambassadors",
    phrase: "Protect the Pack",
    description:
      "Rescue and shelter advocates can help adopters, volunteers, and animal lovers discover trusted pet care support through SitGuru.",
  },
  {
    title: "Guru Ambassadors",
    phrase: "Build the Pack",
    description:
      "Existing Gurus can refer great pet lovers, Pet Parents, and local partners while helping SitGuru grow in their service area.",
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

function ProgramImage({
  src,
  alt,
  isStudent,
}: {
  src: string;
  alt: string;
  isStudent: boolean;
}) {
  return (
    <div
      className={`relative min-h-[260px] overflow-hidden rounded-[26px] border ${
        isStudent ? "border-amber-200" : "border-green-100"
      } bg-gradient-to-br from-green-100 via-white to-amber-50`}
    >
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
    </div>
  );
}

function ProgramCard({ program }: { program: ProgramDefinition }) {
  const isStudent = program.key === "student-hire";
  const isCommunity = program.key === "community-hire";
  const isVeterans = program.key === "veterans-hire";
  const isAmbassador = program.key === "ambassador-program";

  return (
    <section
      id={program.key}
      className={`scroll-mt-28 rounded-[28px] border bg-white p-4 shadow-sm sm:rounded-[34px] sm:p-5 ${
        isStudent ? "border-amber-200" : "border-[#e3ece5]"
      }`}
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <ProgramImage
          src={program.imageSrc}
          alt={program.imageAlt}
          isStudent={isStudent}
        />

        <div className="flex flex-col justify-between gap-5">
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

              <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-amber-700">
                {program.campaign}
              </p>

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

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={program.applyHref}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black shadow-lg transition ${
                isStudent
                  ? "bg-amber-400 text-amber-950 shadow-amber-900/10 hover:bg-amber-300"
                  : "bg-green-800 text-white shadow-emerald-900/15 hover:bg-green-900"
              }`}
            >
              {isStudent
                ? "Start Student Hire"
                : isAmbassador
                  ? "Become an Ambassador"
                  : "Apply Now"}
              <ArrowRight size={18} />
            </Link>

            <Link
              href={program.href}
              className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-6 py-4 text-sm font-black text-green-900 transition hover:bg-green-50"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {isStudent ? (
        <div className="mt-6 rounded-[26px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-green-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
              <Sparkles size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-green-950">
                Student Hire is positioned as SitGuru’s largest growth pathway.
              </h3>

              <p className="mt-2 text-sm font-bold leading-7 text-slate-700">
                Student Hire should feel easy, exciting, and useful: after
                class, between classes, school breaks, weekends, and summer.
                Students can also become Student Ambassadors and help grow the
                Pack on campus.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "Earn after class",
                  "Make money between classes",
                  "Great summer side hustle",
                  "Perfect for school breaks",
                  "Work with pets",
                  "Grow the Pack on campus",
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
                Trust and safety review
              </p>

              <h3 className="mt-1 text-xl font-black text-blue-950">
                SitGuru uses trust and safety review steps when applicable.
              </h3>

              <p className="mt-2 text-sm font-bold leading-7 text-blue-950">
                SitGuru may require trust and safety review steps before eligible
                opportunities. Reviews are handled consistently and in relation
                to pet care responsibilities, home access, safety, trust, and
                customer needs.
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

      {isVeterans ? (
        <div className="mt-6 rounded-[26px] border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
              <Medal size={24} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">
                Military Hire + SkillBridge Interest
              </p>

              <h3 className="mt-1 text-xl font-black text-amber-950">
                One stronger Veterans Hire Program.
              </h3>

              <p className="mt-2 text-sm font-bold leading-7 text-amber-950">
                Veterans Hire now includes the previous Military Hire pathway
                and the SkillBridge Interest List. SkillBridge is tracked as an
                interest list unless SitGuru later creates or joins a formally
                approved SkillBridge training program.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {isAmbassador ? (
        <div className="mt-6 rounded-[26px] border border-green-200 bg-green-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-green-800 shadow-sm">
              <Trophy size={24} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                Pack Leader recognition
              </p>

              <h3 className="mt-1 text-xl font-black text-green-950">
                Top Ambassadors can be rewarded and celebrated.
              </h3>

              <p className="mt-2 text-sm font-bold leading-7 text-green-950">
                Ambassadors who help SitGuru grow may be eligible for referral
                rewards, commission opportunities, bonuses, badges, and public
                recognition as Pack Leaders. Public photos, testimonials, and
                performance highlights should only be shown with consent.
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
        {program.badges.map((badge) => (
          <Pill key={badge}>{badge}</Pill>
        ))}

        <Pill>Trust and safety review when applicable</Pill>
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
              Join the Pack and grow trusted pet care.
            </h1>

            <p
              className="mt-5 max-w-3xl text-base font-bold leading-7 sm:text-lg sm:leading-8 lg:text-xl"
              style={{
                color: "#ecfdf5",
                textShadow: "0 1px 10px rgba(0,0,0,0.24)",
              }}
            >
              SitGuru programs help students, community members, veterans,
              military-connected families, and Ambassadors find the right
              pathway to earn, serve, refer, and grow a trusted pet care network
              for Pet Parents and Gurus.
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
                href="#ambassador-program"
                className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/15 px-6 py-4 text-sm font-black text-white shadow-sm transition hover:bg-white/20 sm:w-auto"
              >
                Become an Ambassador
                <HeartHandshake size={18} />
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
                Earn with the Pack
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950 shadow-sm">
                Work with the Pack
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950 shadow-sm">
                Serve with the Pack
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950 shadow-sm">
                Lead the Pack
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
                    Why Join the Pack
                  </p>
                  <h2 className="text-2xl font-black leading-tight text-green-950 sm:text-3xl">
                    Apply. Refer. Onboard. Grow.
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Students can earn through flexible pet care opportunities",
                  "Community applicants can apply through supported pathways",
                  "Veterans and military-connected applicants can serve local Pet Parents",
                  "Ambassadors can refer Gurus and Pet Parents while helping SitGuru grow",
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
            icon={<Medal size={22} />}
            title="Veterans Hire"
            description="Veterans Hire includes Military Hire and SkillBridge Interest inside one stronger military-connected pathway."
          />
          <FeatureCard
            icon={<HeartHandshake size={22} />}
            title="Ambassador growth"
            description="Ambassadors help refer Gurus and Pet Parents while growing SitGuru as a trusted pet care community."
          />
        </section>

        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:rounded-[32px]">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Join the Pack
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-green-950 sm:text-3xl">
                Four ways to get started with SitGuru.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                Start with Student Hire, Community Hire, Veterans Hire, or the
                Ambassador Program. Each pathway routes applicants to the right
                application flow so SitGuru can track source, availability,
                documents, onboarding needs, referrals, rewards, and next steps.
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

                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-amber-700">
                    {program.campaign}
                  </p>

                  <p className="mt-2 text-xs font-bold text-slate-500">
                    Learn more →
                  </p>
                </Link>
              ))}
            </div>
          </div>
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
                SitGuru programs are designed as pathways where qualified
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
                  "Positive Pet Parent experience",
                  "Strong SitGuru fit",
                ]}
              />
            </div>
          </div>
        </section>

        <section className="space-y-5">
          {programs.map((program) => (
            <ProgramCard key={program.key} program={program} />
          ))}
        </section>

        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:rounded-[32px]">
          <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Ambassador Types
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-green-950 sm:text-3xl">
                Lead the Pack through your profession or community.
              </h2>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                The Ambassador Program should not be cookie-cutter. Each
                Ambassador type has a specific role in helping foster,
                encourage, and promote SitGuru while talking with Pet Parents,
                Gurus, students, clients, patients, families, and local networks.
              </p>
            </div>

            <Link
              href="#ambassador-program"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
            >
              Explore Ambassador Program
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ambassadorTypes.map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                  {item.phrase}
                </p>

                <h3 className="mt-1 text-lg font-black text-green-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-4">
          <StepCard
            numberLabel="01"
            icon={<BriefcaseBusiness size={22} />}
            title="Choose a program"
            description="Select the SitGuru program that best matches your background, schedule, profession, or referral source."
          />
          <StepCard
            numberLabel="02"
            icon={<UserCheck size={22} />}
            title="Apply"
            description="Submit your application so SitGuru can learn more about your availability, interest, community reach, and fit."
          />
          <StepCard
            numberLabel="03"
            icon={<ShieldCheck size={22} />}
            title="Review and onboard"
            description="Complete onboarding, profile, trust, safety, training, and review steps required by SitGuru."
          />
          <StepCard
            numberLabel="04"
            icon={<Trophy size={22} />}
            title="Grow with the Pack"
            description="Qualified participants can grow toward full Guru status, Ambassador recognition, referrals, and Pack Leader opportunities."
          />
        </section>

        <section className="rounded-[28px] border border-green-100 bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 p-5 text-white shadow-sm sm:rounded-[32px] sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-100">
                Pack Leader Recognition
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Top Ambassadors should be rewarded, recognized, and celebrated.
              </h2>

              <p className="mt-3 text-sm font-bold leading-7 text-green-50 sm:text-base">
                Ambassadors who help SitGuru grow may be eligible for monetary
                rewards, referral incentives, commission opportunities, bonuses,
                and public recognition. With consent, top performers can be
                featured on SitGuru’s homepage carousel or community section as
                Pack Leaders.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/programs/apply?program=ambassador-program"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-green-950 transition hover:bg-green-50"
                >
                  Become an Ambassador
                  <HeartHandshake size={17} />
                </Link>

                <Link
                  href="#ambassador-program"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  See Ambassador Roles
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoList
                title="What Ambassadors can help grow"
                items={[
                  "Referred Gurus",
                  "Referred Pet Parents",
                  "Local partners",
                  "Community awareness",
                  "Qualified bookings",
                ]}
              />

              <InfoList
                title="What SitGuru can track"
                items={[
                  "Referral source",
                  "Ambassador type",
                  "Commission cost",
                  "Booking conversion",
                  "Pack Leader eligibility",
                ]}
              />
            </div>
          </div>
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
                programs, veterinary offices, trainers, groomers, rescues,
                shelters, and community partners can refer qualified people who
                may be a great fit for trusted pet care.
              </p>

              <p className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold leading-6 text-blue-900">
                SitGuru Community Hire is a referral and readiness pathway, not
                a direct employment placement program. SitGuru follows EEOC
                guidance for fair, consistent, role-related trust and safety review.
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
                  "Workforce programs",
                  "Veterinary clinics",
                  "Trainer and groomer networks",
                  "Rescue and shelter groups",
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
                  "Referral and Ambassador tracking",
                ]}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}