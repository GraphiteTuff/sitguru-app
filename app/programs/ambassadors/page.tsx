import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Gift,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Megaphone,
  MessageCircleHeart,
  PawPrint,
  Radio,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Trophy,
  UsersRound,
} from "lucide-react";

const primaryAmbassadorPaths = [
  {
    title: "Student Ambassadors",
    eyebrow: "Student Hire",
    description:
      "Students can help SitGuru grow across campuses, clubs, sports teams, classmates, friends, family, and local communities while building real-world marketing, leadership, and referral experience.",
    icon: <GraduationCap size={24} />,
    image: "/images/ambassadors/student-ambassador2.jpg",
    imageAlt: "Student Ambassador with a dog",
    imagePosition: "center 35%",
    highlights: [
      "Campus awareness",
      "Student groups",
      "Social sharing",
      "Resume-friendly experience",
      "Local pet care referrals",
    ],
  },
  {
    title: "Community Ambassadors",
    eyebrow: "Community Hire",
    description:
      "Community Ambassadors help introduce SitGuru to neighborhoods, local groups, pet families, small businesses, friends, family, and trusted referral circles.",
    icon: <UsersRound size={24} />,
    image: "/images/ambassadors/rescue-shelter-ambassador2.jpg",
    imageAlt: "Community Ambassador helping local pet families discover SitGuru",
    imagePosition: "center 35%",
    highlights: [
      "Neighborhood reach",
      "Local referrals",
      "Pet Parent introductions",
      "Small business connections",
      "Community trust",
    ],
  },
  {
    title: "Military & Veteran Ambassadors",
    eyebrow: "Military Hire",
    description:
      "Veterans, military spouses, Guard and Reserve members, transitioning service members, and military-connected advocates can help SitGuru reach trusted local networks and mission-driven communities.",
    icon: <ShieldCheck size={24} />,
    image: "/images/ambassadors/veteran-military-ambassador.jpg",
    imageAlt: "Veteran and military-connected SitGuru Ambassador",
    imagePosition: "center 35%",
    highlights: [
      "Veteran-friendly outreach",
      "Military spouse networks",
      "PA CareerLink alignment",
      "Local leadership",
      "Mission-driven growth",
    ],
  },
];

const ambassadorTypes = [
  {
    title: "Guru Ambassadors",
    eyebrow: "Trusted service voices",
    description:
      "Experienced or aspiring Gurus who help represent SitGuru, share the brand, refer new users, and support local trust in pet care.",
    icon: <PawPrint size={24} />,
    image: "/images/ambassadors/guru-ambassador2.jpg",
    imageAlt: "SitGuru Guru Ambassador with a dog",
    imagePosition: "center 35%",
    examples: [
      "Active Gurus",
      "Referral leaders",
      "Pet care advocates",
      "Local service voices",
      "Trusted community helpers",
    ],
  },
  {
    title: "Student Ambassadors",
    eyebrow: "Campus energy",
    description:
      "High school, college, and university students who help spread SitGuru across campuses, clubs, student groups, sports teams, friends and family, and local communities.",
    icon: <GraduationCap size={24} />,
    image: "/images/ambassadors/student-ambassador2.jpg",
    imageAlt: "Student Ambassador with a dog",
    imagePosition: "center 35%",
    examples: [
      "Campus promoters",
      "Student groups",
      "Club leaders",
      "Athletes",
      "Social students",
    ],
  },
  {
    title: "Vet Tech Ambassadors",
    eyebrow: "Clinic-side trust",
    description:
      "Vet Techs and veterinary team members can help Pet Parents, friends and family discover dependable care beyond the clinic while encouraging responsible animal lovers to become Gurus.",
    icon: <Stethoscope size={24} />,
    image: "/images/ambassadors/vet-tech-ambassador3.jpg",
    imageAlt: "Vet Tech Ambassador with pets",
    imagePosition: "center 35%",
    examples: [
      "Vet Techs",
      "Vet assistants",
      "Animal clinic teams",
      "Medical pet care voices",
      "Trusted support staff",
    ],
  },
  {
    title: "Veterinarian Ambassadors",
    eyebrow: "Professional pet guidance",
    description:
      "Veterinarians and clinic leaders can help Pet Parents, friends and family connect with a trusted pet care community built around safety, support, and local relationships.",
    icon: <ShieldCheck size={24} />,
    image: "/images/ambassadors/veterinarian-ambassador2.jpg",
    imageAlt: "Veterinarian Ambassador with a pet",
    imagePosition: "center 35%",
    examples: [
      "Veterinarians",
      "Clinic leaders",
      "Animal hospitals",
      "Wellness advocates",
      "Trusted local experts",
    ],
  },
  {
    title: "Trainer Ambassadors",
    eyebrow: "Routine and confidence",
    description:
      "Trainers help pets, Pet Parents, friends and family build structure. SitGuru Ambassadors can help families keep that progress going with reliable local care.",
    icon: <PawPrint size={24} />,
    image: "/images/ambassadors/trainer-ambassador2.jpg",
    imageAlt: "Dog Trainer Ambassador with a dog",
    imagePosition: "center 35%",
    examples: [
      "Dog trainers",
      "Obedience instructors",
      "Behavior specialists",
      "Training teams",
      "Pet routine coaches",
    ],
  },
  {
    title: "Groomer Ambassadors",
    eyebrow: "Regular Pet Parent connection",
    description:
      "Groomers often have trusted relationships with Pet Parents, friends and family. SitGuru gives groomers a warm way to connect families with dependable care.",
    icon: <Scissors size={24} />,
    image: "/images/ambassadors/groomer-ambassador2.jpg",
    imageAlt: "Groomer Ambassador with a dog",
    imagePosition: "center 35%",
    examples: [
      "Dog groomers",
      "Cat groomers",
      "Pet salons",
      "Grooming teams",
      "Pet care professionals",
    ],
  },
  {
    title: "Veteran Ambassadors",
    eyebrow: "Mission-driven reach",
    description:
      "Veterans, military spouses, military-connected advocates, Guard and Reserve members, and transition-minded leaders can help SitGuru reach military families, friends, and communities.",
    icon: <ShieldCheck size={24} />,
    image: "/images/ambassadors/veteran-military-ambassador.jpg",
    imageAlt: "Veteran and military-connected SitGuru Ambassador",
    imagePosition: "center 35%",
    examples: [
      "Veterans",
      "Military spouses",
      "Transition advocates",
      "Guard and Reserve networks",
      "Military community voices",
    ],
  },
  {
    title: "Rescue & Shelter Ambassadors",
    eyebrow: "Animal welfare connection",
    description:
      "Rescue and shelter advocates can help adopters, fosters, volunteers, Pet Parents, friends and family discover trusted support throughout pet ownership.",
    icon: <HeartHandshake size={24} />,
    image: "/images/ambassadors/rescue-shelter-ambassador2.jpg",
    imageAlt: "Rescue and Shelter Ambassador with a pet",
    imagePosition: "center 35%",
    examples: [
      "Shelter volunteers",
      "Rescue advocates",
      "Foster families",
      "Animal welfare supporters",
      "Adoption communities",
    ],
  },
];

const benefits = [
  "Help more pet families discover trusted local pet care.",
  "Support student, community, and military-friendly growth in your area.",
  "Share SitGuru through friends, family, campus groups, neighborhoods, pet care circles, military networks, and social communities.",
  "Refer future Gurus, Pet Parents, partners, and community supporters.",
  "Build leadership, local visibility, and real-world community engagement around a pet-friendly brand.",
  "Grow with SitGuru through referrals, commission-based opportunities, recognition, local outreach, and Ambassador opportunities. Hourly opportunities are rare and separately approved by SitGuru in writing.",
];

const howItWorks = [
  {
    step: "01",
    title: "Choose your path",
    description:
      "Start with the Ambassador path that fits you best: Student Hire, Community Hire, or Military Hire. SitGuru can also route pet professionals and local advocates into the right fit.",
  },
  {
    step: "02",
    title: "Tell us your reach",
    description:
      "Share where you have connection — campus, neighborhood, military community, clinic, grooming salon, training network, pet groups, events, social media, or local circles.",
  },
  {
    step: "03",
    title: "Share SitGuru",
    description:
      "Ambassadors help promote SitGuru through trusted referrals, social posts, community conversations, QR codes, events, campus sharing, professional circles, and local introductions. The program is generally referral-based and commission-based, with hourly opportunities only by rare SitGuru-approved exception.",
  },
  {
    step: "04",
    title: "Help the Pack grow",
    description:
      "As SitGuru expands, Ambassadors can support local campaigns, Pet Parent awareness, Guru recruiting, partner introductions, and community visibility.",
  },
];

const ambassadorActivities = [
  "Share SitGuru with Pet Parents",
  "Share with friends and family",
  "Refer future Pet Gurus",
  "Promote Student Hire",
  "Promote Community Hire",
  "Promote Military Hire",
  "Spread campus awareness",
  "Support community events",
  "Introduce local partners",
  "Create social content",
  "Use QR and referral links",
  "Help grow trusted referrals",
  "Commission/referral focused",
];


const packLeaderGrowth = [
  "Referred Gurus",
  "Referred Pet Parents",
  "Local partners",
  "Community awareness",
  "Qualified bookings",
];

const packLeaderTracking = [
  "Referral source",
  "Ambassador type",
  "Local campaign",
  "Booking conversion",
  "Pack Leader eligibility",
];

const trustPoints = [
  {
    title: "People-powered growth",
    description:
      "Ambassadors help SitGuru grow through real relationships, trusted recommendations, friends and family sharing, and community connection.",
    icon: <UsersRound size={22} />,
  },
  {
    title: "Clear, honest promotion",
    description:
      "Ambassadors should share SitGuru accurately, professionally, and in a way that builds trust with Pet Parents, Gurus, friends, family, and partners.",
    icon: <ClipboardCheck size={22} />,
  },
  {
    title: "Community-first brand",
    description:
      "SitGuru is built around pet families, local service, flexible opportunities, and trusted community reach.",
    icon: <HeartHandshake size={22} />,
  },
];

const faqs = [
  {
    question: "Who is the Ambassador Program for?",
    answer:
      "The Ambassador Program is for students, community advocates, veterans, military spouses, Gurus, Vet Techs, veterinarians, trainers, groomers, rescue advocates, campus leaders, friends, family, and trusted local voices who want to help represent and grow SitGuru.",
  },
  {
    question: "Is this the same as becoming a Guru?",
    answer:
      "No. Becoming a Guru is for people who want to provide pet care services. The Ambassador Program is for people who want to help promote, refer, represent, and grow SitGuru. Some people may do both.",
  },
  {
    question: "Is this the same as the Affiliate Program?",
    answer:
      "Not exactly. Affiliates are usually promotional channels, creators, influencers, bloggers, or marketers. Ambassadors are people-based advocates who represent SitGuru in communities, campuses, neighborhoods, professional circles, friends and family networks, and personal networks.",
  },
  {
    question: "Can PA CareerLink, schools, or local groups share this?",
    answer:
      "Yes. The Ambassador Program can support student, community, and military-friendly outreach. SitGuru can use this page as a simple destination for local partners, PA CareerLink contacts, campus groups, and community organizations that want to share the opportunity.",
  },
];

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-sm">
      {children}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
      {children}
    </span>
  );
}

function buildAmbassadorSignupHref({
  program = "community",
  campaign = "ambassador_program",
  placement,
}: {
  program?: string;
  campaign?: string;
  placement: string;
}) {
  const params = new URLSearchParams({
    role: "ambassador",
    program,
    source: "ambassador_program_page",
    platform: "web",
    campaign,
    utm_source: "sitguru",
    utm_medium: "ambassador_program",
    utm_campaign: campaign,
    utm_content: placement,
  });

  return `/signup?${params.toString()}`;
}

function getPrimaryAmbassadorProgram(title: string) {
  if (title.startsWith("Student")) return "student";
  if (title.startsWith("Military")) return "military";
  return "community";
}

export default function AmbassadorProgramPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <section className="overflow-hidden border-b border-emerald-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              <Sparkles size={15} />
              SitGuru Ambassador Program
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Help SitGuru grow through trusted people, local communities, and
              pet-loving connections.
            </h1>

            <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              SitGuru Ambassadors help introduce Pet Parents, future Pet Gurus,
              students, local partners, military-connected families, friends,
              family, and community groups to a trusted pet care marketplace
              built around real relationships.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={buildAmbassadorSignupHref({
                  program: "community",
                  campaign: "ambassador_program_general",
                  placement: "hero_primary",
                })}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900"
              >
                Join the Ambassador Program
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/programs"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                Explore SitGuru Programs
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {primaryAmbassadorPaths.map((path) => (
                <div
                  key={path.eyebrow}
                  className="rounded-2xl border border-emerald-100 bg-[#f8fff9] p-4 shadow-sm"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
                    {path.eyebrow}
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-950">
                    {path.title}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Pill>Student Hire</Pill>
              <Pill>Community Hire</Pill>
              <Pill>Military Hire</Pill>
              <Pill>Referral growth</Pill>
              <Pill>QR sharing</Pill>
              <Pill>Local awareness</Pill>
              <Pill>Pet Parent introductions</Pill>
              <Pill>Future Guru referrals</Pill>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/50 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-200/60 blur-3xl" />

            <div className="relative rounded-[2rem] border border-emerald-100 bg-[#f8fff9] p-5 shadow-2xl shadow-emerald-950/10">
              <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm">
                <div className="relative aspect-[16/11] w-full overflow-hidden sm:aspect-[16/10] lg:aspect-[16/11]">
                  <Image
                    src="/images/ambassadors/guru-ambassador2.jpg"
                    alt="SitGuru Ambassador helping connect pet families with trusted care"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    style={{ objectPosition: "center 35%" }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="max-w-[92%] rounded-3xl border border-white/20 bg-black/60 p-4 shadow-2xl backdrop-blur-sm">
                      <p
                        className="text-xs font-black uppercase tracking-[0.18em]"
                        style={{
                          color: "#d1fae5",
                          WebkitTextFillColor: "#d1fae5",
                          textShadow: "0 2px 8px rgba(0,0,0,0.85)",
                        }}
                      >
                        Community voices matter
                      </p>

                      <h2
                        className="mt-2 text-2xl font-black leading-tight sm:text-3xl"
                        style={{
                          color: "#ffffff",
                          WebkitTextFillColor: "#ffffff",
                          textShadow: "0 3px 12px rgba(0,0,0,0.95)",
                        }}
                      >
                        Help SitGuru grow where people already trust you.
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  {[
                    [
                      "Share",
                      "Tell Pet Parents, friends, family, and future Gurus about SitGuru.",
                    ],
                    ["Refer", "Help trusted people discover the right SitGuru path."],
                    ["Represent", "Support SitGuru in your community."],
                    ["Grow", "Build local reach through real relationships."],
                  ].map(([title, description]) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
                    >
                      <p className="text-sm font-black text-emerald-950">
                        {title}
                      </p>
                      <p className="mt-1 text-xs font-bold leading-5 text-emerald-800">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-emerald-800 p-4 text-white">
                  <GraduationCap size={22} />
                  <p className="mt-3 text-2xl font-black">Student</p>
                  <p className="mt-1 text-xs font-bold text-emerald-50">
                    Share SitGuru through campus, clubs, and social circles.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950 p-4 text-white">
                  <UsersRound size={22} />
                  <p className="mt-3 text-2xl font-black">Community</p>
                  <p className="mt-1 text-xs font-bold text-slate-200">
                    Help pet families discover trusted local care.
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-400 p-4 text-slate-950">
                  <ShieldCheck size={22} />
                  <p className="mt-3 text-2xl font-black">Military</p>
                  <p className="mt-1 text-xs font-bold text-amber-950">
                    Support mission-driven, military-friendly outreach.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="bg-[#fbfaf6] px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-xl shadow-emerald-950/5 sm:p-7 lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800 shadow-sm">
                  <Radio size={15} />
                  Ambassador video
                </div>

                <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Help Pets, Help Neighbors — Become a SitGuru Ambassador Today
                </h2>

                <p className="mt-5 text-base font-semibold leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  SitGuru Ambassadors help grow trusted local pet care by
                  connecting Pet Parents, future Gurus, community partners,
                  students, military-connected families, and local pet lovers
                  with the SitGuru Pet Community.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={buildAmbassadorSignupHref({
                      program: "community",
                      campaign: "ambassador_program_video",
                      placement: "video_primary",
                    })}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900"
                  >
                    Apply as an Ambassador
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    href="#ambassador-paths"
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                  >
                    Explore Ambassador Programs
                    <ArrowRight size={17} />
                  </Link>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    "Promote trusted local pet care",
                    "Support Pet Parents and Gurus",
                    "Build community connections",
                    "Help grow the SitGuru Pet Community",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        ✓
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 shadow-2xl shadow-emerald-950/10">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full bg-slate-950 object-cover"
                >
                  <source
                    src="/videos/sitguru-ambassador-promo.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10"
        id="ambassador-paths"
      >
        <SectionHeader
          eyebrow="Ambassador paths"
          title="Choose the path that matches your community."
          description="SitGuru keeps the Ambassador Program simple: students help grow campus and social awareness, community voices help grow local trust, and military-connected advocates help reach veteran and military family networks."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {primaryAmbassadorPaths.map((path) => (
            <div
              key={path.title}
              className="group overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/10"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-emerald-50">
                <Image
                  src={path.image}
                  alt={path.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  style={{ objectPosition: path.imagePosition }}
                />
                <div className="absolute left-4 top-4">
                  <IconBadge>{path.icon}</IconBadge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/20 bg-black/55 p-4 backdrop-blur-sm">
                  <p
                    className="text-xs font-black uppercase tracking-[0.16em]"
                    style={{
                      color: "#d1fae5",
                      WebkitTextFillColor: "#d1fae5",
                    }}
                  >
                    {path.eyebrow}
                  </p>
                  <h3
                    className="mt-1 text-2xl font-black"
                    style={{
                      color: "#ffffff",
                      WebkitTextFillColor: "#ffffff",
                    }}
                  >
                    {path.title}
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <p className="text-sm font-semibold leading-6 text-slate-600">
                  {path.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {path.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                <Link
                  href={buildAmbassadorSignupHref({
                    program: getPrimaryAmbassadorProgram(path.title),
                    campaign: `ambassador_program_${getPrimaryAmbassadorProgram(
                      path.title,
                    )}`,
                    placement: `primary_path_${getPrimaryAmbassadorProgram(
                      path.title,
                    )}`,
                  })}
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-900"
                >
                  Start this path
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeader
            eyebrow="Why become an Ambassador"
            title="Ambassadors help SitGuru grow through real trust, local reach, and personal connection."
            description="The best Ambassadors are people who naturally share, refer, encourage, and connect. SitGuru gives them a pet-friendly brand that is easy to talk about and meaningful to friends, family, and communities."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-[1.5rem] border border-emerald-100 bg-[#fbfaf6] p-5 shadow-sm"
              >
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" />
                  <p className="text-sm font-bold leading-6 text-slate-700">
                    {benefit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              What Ambassadors can do
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Simple, social, local ways to help SitGuru grow.
            </h2>
            <p className="mt-5 text-base font-semibold leading-7 text-slate-600">
              Ambassadors can support SitGuru through friends and family
              referrals, local conversations, campus energy, social posts,
              community groups, professional care networks, pet-friendly events,
              QR code sharing, and introductions to future Gurus, Pet Parents,
              partners, and affiliates.
            </p>

            <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-sm">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src="/images/ambassadors/rescue-shelter-ambassador2.jpg"
                  alt="SitGuru grows through trusted people and pet-loving communities"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                  style={{ objectPosition: "center 35%" }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-sm font-black text-white">
                    SitGuru grows through trusted people, friends, family, and
                    pet-loving communities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ambassadorActivities.map((activity) => (
              <div
                key={activity}
                className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm"
              >
                <div className="flex gap-3">
                  <MessageCircleHeart className="mt-0.5 shrink-0 text-emerald-700" />
                  <p className="text-sm font-black leading-6 text-slate-800">
                    {activity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#eef8f1_0%,#f8fbf8_100%)] py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeader
            eyebrow="How it works"
            title="A simple path from supporter to SitGuru Ambassador."
            description="The Ambassador Program is designed to be flexible for people who want to help promote, refer, represent, and grow SitGuru with friends, family, local organizations, campuses, and their own communities."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {howItWorks.map((item) => (
              <div
                key={item.step}
                className="rounded-[1.5rem] border border-emerald-100 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-black text-emerald-700">
                  {item.step}
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeader
            eyebrow="More Ambassador voices"
            title="Pet professionals, Gurus, rescues, and referral leaders can all help SitGuru grow."
            description="Student, Community, and Military Hire are the main program paths. These additional Ambassador voices help SitGuru reach more trusted pet care circles."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {ambassadorTypes.map((type) => (
              <div
                key={type.title}
                className="group overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-[#fbfaf6] shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-emerald-50 sm:aspect-[16/9] xl:aspect-[16/10]">
                  <Image
                    src={type.image}
                    alt={type.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    style={{ objectPosition: type.imagePosition }}
                  />
                  <div className="absolute left-4 top-4">
                    <IconBadge>{type.icon}</IconBadge>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                    {type.eyebrow}
                  </p>

                  <h3 className="mt-2 text-xl font-black text-slate-950">
                    {type.title}
                  </h3>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    {type.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {type.examples.map((example) => (
                      <span
                        key={example}
                        className="rounded-full border border-white bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section
        className="py-14"
        style={{
          background:
            "linear-gradient(135deg, #14532d 0%, #166534 46%, #047857 100%)",
          color: "#ffffff",
        }}
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div className="flex flex-col justify-center">
            <p
              className="text-xs font-black uppercase tracking-[0.22em]"
              style={{
                color: "#ffffff",
                WebkitTextFillColor: "#ffffff",
              }}
            >
              Pack Leader Recognition
            </p>

            <h2
              className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl"
              style={{
                color: "#ffffff",
                WebkitTextFillColor: "#ffffff",
                textShadow: "0 2px 10px rgba(0,0,0,0.22)",
              }}
            >
              <span
                className="text-white"
                style={{
                  color: "#ffffff",
                  WebkitTextFillColor: "#ffffff",
                }}
              >
                Top Ambassadors should be rewarded, recognized, and celebrated.
              </span>
            </h2>

            <p
              className="mt-5 max-w-3xl text-base font-semibold leading-7 sm:text-lg"
              style={{
                color: "#f0fdf4",
                WebkitTextFillColor: "#f0fdf4",
              }}
            >
              Ambassadors who help SitGuru grow can be recognized for the real
              value they bring to the community. With consent, standout
              Ambassadors may be featured as Pack Leaders across SitGuru
              community highlights, social content, and future recognition
              spaces.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={buildAmbassadorSignupHref({
                  program: "community",
                  campaign: "ambassador_program_pack_leader",
                  placement: "pack_leader_primary",
                })}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-50"
              >
                Become an Ambassador
                <Handshake size={17} />
              </Link>

              <Link
                href="#ambassador-paths"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-sm font-black text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15"
              >
                See Ambassador Roles
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/80 bg-white p-6 shadow-xl shadow-emerald-950/15">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">
                What Ambassadors can help grow
              </p>

              <div className="mt-5 space-y-4">
                {packLeaderGrowth.map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" />
                    <p className="text-base font-black text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/80 bg-white p-6 shadow-xl shadow-emerald-950/15">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">
                What SitGuru can track
              </p>

              <div className="mt-5 space-y-4">
                {packLeaderTracking.map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" />
                    <p className="text-base font-black text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-3">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm"
            >
              <IconBadge>{point.icon}</IconBadge>
              <h3 className="mt-5 text-2xl font-black text-slate-950">
                {point.title}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="py-14"
        style={{
          background:
            "linear-gradient(135deg, #022c22 0%, #064e3b 48%, #0f766e 100%)",
          color: "#ffffff",
        }}
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p
              className="text-xs font-black uppercase tracking-[0.22em]"
              style={{
                color: "#bbf7d0",
                WebkitTextFillColor: "#bbf7d0",
              }}
            >
              Program clarity
            </p>

            <h2
              className="mt-3 text-3xl font-black tracking-tight sm:text-5xl"
              style={{
                color: "#ffffff",
                WebkitTextFillColor: "#ffffff",
              }}
            >
              Ambassadors represent. Affiliates promote. Partners collaborate.
            </h2>

            <p
              className="mt-5 text-base font-semibold leading-7"
              style={{
                color: "#ecfdf5",
                WebkitTextFillColor: "#ecfdf5",
              }}
            >
              SitGuru has multiple growth pathways, but each one serves a
              different purpose. Ambassadors are people-based advocates who help
              spread SitGuru through trust, referrals, friends and family,
              campus energy, professional relationships, community reach, and
              local leadership.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              [
                "Ambassadors",
                "Students, community advocates, military-connected advocates, Gurus, pet professionals, friends, family, and local referral leaders.",
                <Gift key="ambassador" size={22} />,
              ],
              [
                "Affiliates",
                "Creators, influencers, bloggers, promoters, and content channels.",
                <Megaphone key="affiliate" size={22} />,
              ],
              [
                "Partners",
                "Organizations, schools, pet care businesses, nonprofits, brands, and community groups.",
                <Handshake key="partner" size={22} />,
              ],
            ].map(([title, description, icon]) => (
              <div
                key={String(title)}
                className="rounded-[1.5rem] border p-5 shadow-sm"
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderColor: "rgba(255,255,255,0.22)",
                }}
              >
                <div
                  style={{
                    color: "#bbf7d0",
                  }}
                >
                  {icon}
                </div>

                <h3
                  className="mt-4 text-xl font-black"
                  style={{
                    color: "#ffffff",
                    WebkitTextFillColor: "#ffffff",
                  }}
                >
                  {title}
                </h3>

                <p
                  className="mt-2 text-sm font-semibold leading-6"
                  style={{
                    color: "#ecfdf5",
                    WebkitTextFillColor: "#ecfdf5",
                  }}
                >
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <SectionHeader
          eyebrow="Questions"
          title="Ambassador Program FAQ"
          description="A few quick answers to help students, community advocates, military-connected leaders, pet professionals, friends, family, and local referral voices understand where the Ambassador Program fits."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-[1.5rem] border border-emerald-100 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-black text-slate-950">
                {faq.question}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="join-ambassador-program"
        className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 lg:px-10"
      >
        <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
                <Trophy size={15} />
                Join the Ambassador Program
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Help SitGuru grow through referrals, commission-based opportunities, community trust, and
                pet-friendly local energy.
              </h2>

              <p className="mt-5 text-base font-semibold leading-7 text-slate-600">
                If you are a student, community advocate, military-connected
                advocate, Guru, Vet Tech, veterinarian, trainer, groomer, rescue
                advocate, campus leader, referral leader, friend, family member,
                or pet-loving local voice, the SitGuru Ambassador Program may be
                a strong fit.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Student Ambassadors",
                  "Community Ambassadors",
                  "Military and Veteran Ambassadors",
                  "Guru and pet care voices",
                  "Vet Tech and veterinarian voices",
                  "Trainer and groomer connections",
                  "Rescue and shelter advocates",
                  "Friends and family referrals",
                  "Campus and local awareness",
                  "Pet Parent introductions",
                  "Future Guru referrals",
                  "Partner and affiliate introductions",
                ].map((item) => (
                  <div key={item} className="flex gap-2">
                    <BadgeCheck className="mt-0.5 shrink-0 text-emerald-700" />
                    <p className="text-sm font-bold text-slate-700">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={buildAmbassadorSignupHref({
                    program: "community",
                    campaign: "ambassador_program_join",
                    placement: "join_section_primary",
                  })}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900"
                >
                  Create Ambassador Account
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/programs"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                >
                  Explore Programs
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="bg-[#f8fff9] p-6 sm:p-8 lg:p-10">
              <div className="overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-sm">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src="/images/ambassadors/vet-tech-ambassador3.jpg"
                    alt="Trusted people with real community reach"
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                    style={{ objectPosition: "center 35%" }}
                    loading="lazy"
                  />
                </div>

                <div className="p-6">
                  <Star className="text-emerald-800" size={34} />

                  <h3 className="mt-5 text-2xl font-black text-slate-950">
                    Built for trusted people with real community reach.
                  </h3>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    Ambassadors can help SitGuru grow by sharing the brand,
                    referring Pet Parents, encouraging future Gurus, supporting
                    student, community, and military-friendly programs, and
                    helping SitGuru become visible with friends, family, and
                    trusted local spaces.
                  </p>

                  <div className="mt-6 space-y-3">
                    {[
                      [
                        "Student Hire",
                        "Spread SitGuru through campus and social circles.",
                      ],
                      [
                        "Community Hire",
                        "Help local pet families discover SitGuru.",
                      ],
                      [
                        "Military Hire",
                        "Support veteran and military-connected awareness.",
                      ],
                      ["Gurus", "Represent the brand and refer trusted people."],
                      [
                        "Pet professionals",
                        "Help Pet Parents discover dependable support.",
                      ],
                      [
                        "Friends and family",
                        "Share SitGuru with people who already trust you.",
                      ],
                      [
                        "Referral leaders",
                        "Introduce Pet Parents, Gurus, and partners.",
                      ],
                    ].map(([title, description]) => (
                      <div
                        key={title}
                        className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
                      >
                        <p className="text-sm font-black text-emerald-950">
                          {title}
                        </p>
                        <p className="mt-1 text-xs font-bold leading-5 text-emerald-800">
                          {description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-100 bg-[#fbfaf6] p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">
                  Sharing from PA CareerLink, a college group, or a local
                  community page?
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                  Send people directly to this page so they can choose the
                  Ambassador path that fits them best.
                </p>
              </div>

              <Link
                href="#ambassador-paths"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                View Ambassador paths
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}