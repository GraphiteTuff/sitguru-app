import type { Metadata } from "next";
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
  HelpCircle,
  Megaphone,
  MessageCircleHeart,
  PawPrint,
  PlayCircle,
  Radio,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Trophy,
  UsersRound,
} from "lucide-react";
import { VETERANS_MILITARY_FAMILIES_PROGRAM } from "@/lib/programs/veterans-military-families";

export const metadata: Metadata = {
  title: "Ambassador Program | Student, Community & Military Pathways | SitGuru",
  description:
    "Join the SitGuru Ambassador Program — help grow trusted local pet care through campus, community, military-connected, Guru, and pet-pro pathways. Referral tools, recognition, and Pack Leader opportunities.",
  alternates: {
    canonical: "/programs/ambassadors",
  },
  openGraph: {
    title: "Ambassador Program | SitGuru",
    description:
      "Help SitGuru grow through trusted people, local communities, and pet-loving connections.",
    url: "/programs/ambassadors",
    type: "website",
  },
};

const primaryAmbassadorPaths = [
  {
    title: "Student Ambassadors",
    eyebrow: "Student Hire",
    description:
      "Students can help SitGuru grow across campuses, clubs, sports teams, classmates, friends, family, and local communities while building real-world marketing, leadership, and referral experience.",
    icon: <GraduationCap size={22} />,
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
    icon: <UsersRound size={22} />,
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
    eyebrow: VETERANS_MILITARY_FAMILIES_PROGRAM.shortName,
    description:
      "Veterans, military spouses, Guard and Reserve members, transitioning service members, and military-connected advocates can help SitGuru reach trusted local networks and mission-driven communities.",
    icon: <ShieldCheck size={22} />,
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
    icon: <PawPrint size={22} />,
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
    icon: <GraduationCap size={22} />,
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
    icon: <Stethoscope size={22} />,
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
    icon: <ShieldCheck size={22} />,
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
    icon: <PawPrint size={22} />,
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
    icon: <Scissors size={22} />,
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
    icon: <ShieldCheck size={22} />,
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
    icon: <HeartHandshake size={22} />,
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
    description: `Start with the Ambassador path that fits you best: Student Hire, Community Hire, or ${VETERANS_MILITARY_FAMILIES_PROGRAM.shortName}. SitGuru can also route pet professionals and local advocates into the right fit.`,
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
  `Promote ${VETERANS_MILITARY_FAMILIES_PROGRAM.shortName}`,
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

export default function AmbassadorProgramPage() {
  const heroApplyHref = buildAmbassadorSignupHref({
    program: "community",
    campaign: "ambassador_program_general",
    placement: "hero_primary",
  });

  return (
    <main className="public-page min-h-screen overflow-x-hidden bg-[#f7faf7] pb-[calc(6rem+env(safe-area-inset-bottom))] text-slate-950 sm:pb-0">
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg gap-2">
          <Link
            href={heroApplyHref}
            className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#0D5C3A] px-4 py-3 text-base font-black !text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#09462C]"
          >
            Join
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

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-8 lg:py-20">
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
              Help SitGuru grow through trusted people and pet-loving
              communities.
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 !text-emerald-50 sm:text-lg">
              SitGuru Ambassadors introduce Pet Parents, future Gurus, students,
              local partners, military-connected families, friends, and
              community groups to a trusted pet care marketplace built on real
              relationships.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={heroApplyHref}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-black text-emerald-950 shadow-xl shadow-black/15 transition hover:bg-emerald-50 sm:w-auto"
              >
                Join the Ambassador Program
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

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Student Hire",
                "Community Hire",
                VETERANS_MILITARY_FAMILIES_PROGRAM.shortName,
                "Referral growth",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black !text-white"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-[0_30px_90px_rgba(2,44,34,0.35)]">
            <div className="relative aspect-[5/4] w-full">
              <Image
                src="/images/ambassadors/guru-ambassador2.jpg"
                alt="SitGuru Ambassador helping connect pet families with trusted care"
                fill
                priority
                className="object-cover"
                style={{ objectPosition: "center 35%" }}
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 pt-16">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] !text-emerald-200">
                  Community voices matter
                </p>
                <p className="mt-1 text-lg font-black !text-white sm:text-xl">
                  Help SitGuru grow where people already trust you.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              {[
                ["Student", <GraduationCap key="s" size={18} />],
                ["Community", <UsersRound key="c" size={18} />],
                ["Military", <ShieldCheck key="m" size={18} />],
              ].map(([label, icon]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl border border-emerald-100 bg-[#f7faf4] px-2 py-3 text-center"
                >
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm">
                    {icon}
                  </div>
                  <p className="mt-2 text-xs font-black text-emerald-950">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section
          id="ambassador-video"
          className="scroll-mt-24 overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm"
        >
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="p-5 sm:p-6 lg:p-8">
              <SectionLabel icon={<Radio size={16} />}>
                Ambassador video
              </SectionLabel>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
                Help Pets, Help Neighbors — Become a SitGuru Ambassador Today
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                SitGuru Ambassadors help grow trusted local pet care by
                connecting Pet Parents, future Gurus, community partners,
                students, military-connected families, and local pet lovers with
                the SitGuru Pet Community.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={buildAmbassadorSignupHref({
                    program: "community",
                    campaign: "ambassador_program_video",
                    placement: "video_primary",
                  })}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black !text-white transition hover:bg-[#09462C]"
                >
                  Apply as an Ambassador
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="#ambassador-paths"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
                >
                  Explore paths
                </Link>
              </div>
            </div>

            <div className="bg-[#0D5C3A]/5 p-4 sm:p-5 lg:p-6">
              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-950 shadow-lg">
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
            </div>
          </div>
        </section>

        <section
          id="ambassador-paths"
          className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8"
        >
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel icon={<Sparkles size={16} />}>
              Ambassador paths
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Choose the path that matches your community.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              Students grow campus awareness, community voices grow local trust,
              and military-connected advocates reach veteran and military family
              networks.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {primaryAmbassadorPaths.map((path) => (
              <article
                key={path.title}
                className="group overflow-hidden rounded-[28px] border border-emerald-100 bg-[#f7faf4] transition hover:border-emerald-300 hover:shadow-lg"
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
                  <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-800 shadow-lg">
                    {path.icon}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] !text-emerald-200">
                      {path.eyebrow}
                    </p>
                    <h3 className="mt-1 text-xl font-black !text-white">
                      {path.title}
                    </h3>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm font-semibold leading-6 text-slate-600">
                    {path.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {path.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-bold text-emerald-800"
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
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black !text-white transition hover:bg-[#09462C]"
                  >
                    Start this path
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel icon={<CheckCircle2 size={16} />}>
              Why become an Ambassador
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Real trust. Local reach. Personal connection.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              The best Ambassadors naturally share, refer, encourage, and
              connect — with a pet-friendly brand that is easy to talk about.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex gap-3 rounded-[22px] border border-emerald-100 bg-[#f7faf4] p-4"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <p className="text-sm font-bold leading-6 text-slate-700">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <SectionLabel icon={<MessageCircleHeart size={16} />}>
                What Ambassadors can do
              </SectionLabel>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
                Simple, social, local ways to help SitGuru grow.
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                Support SitGuru through friends and family referrals, campus
                energy, social posts, community groups, professional care
                networks, events, QR sharing, and introductions to future Gurus,
                Pet Parents, and partners.
              </p>
              <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-[24px]">
                <Image
                  src="/images/ambassadors/rescue-shelter-ambassador2.jpg"
                  alt="SitGuru grows through trusted people and pet-loving communities"
                  fill
                  className="object-cover"
                  style={{ objectPosition: "center 35%" }}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ambassadorActivities.map((activity) => (
                <div
                  key={activity}
                  className="flex gap-3 rounded-[20px] border border-emerald-100 bg-[#f7faf4] p-4"
                >
                  <MessageCircleHeart
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />
                  <p className="text-sm font-black leading-6 text-slate-800">
                    {activity}
                  </p>
                </div>
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
              A simple path from supporter to SitGuru Ambassador.
            </h2>
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

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel icon={<UsersRound size={16} />}>
              More Ambassador voices
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Pet professionals, Gurus, rescues, and referral leaders.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              Student, Community, and {VETERANS_MILITARY_FAMILIES_PROGRAM.shortName}{" "}
              are the main program paths. These additional voices help SitGuru
              reach more trusted pet care circles.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {ambassadorTypes.map((type) => (
              <article
                key={type.title}
                className="group overflow-hidden rounded-[24px] border border-emerald-100 bg-[#f7faf4] transition hover:border-emerald-300 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-emerald-50">
                  <Image
                    src={type.image}
                    alt={type.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    style={{ objectPosition: type.imagePosition }}
                  />
                  <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-800 shadow">
                    {type.icon}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
                    {type.eyebrow}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-emerald-950">
                    {type.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {type.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {type.examples.slice(0, 3).map((example) => (
                      <span
                        key={example}
                        className="rounded-full border border-emerald-100 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          data-brand-green
          className="public-dark-section rounded-[32px] bg-[#0D5C3A] p-6 !text-white shadow-sm sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-100">
                Pack Leader Recognition
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight !text-white sm:text-4xl">
                Top Ambassadors should be rewarded, recognized, and celebrated.
              </h2>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 !text-emerald-50">
                With consent, standout Ambassadors may be featured as Pack
                Leaders across SitGuru community highlights, social content, and
                future recognition spaces.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={buildAmbassadorSignupHref({
                    program: "community",
                    campaign: "ambassador_program_pack_leader",
                    placement: "pack_leader_primary",
                  })}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
                >
                  Become an Ambassador
                  <Handshake size={17} />
                </Link>
                <Link
                  href="#ambassador-paths"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-black !text-white transition hover:bg-white/15"
                >
                  See Ambassador Roles
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/80 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
                  What Ambassadors can help grow
                </p>
                <div className="mt-4 space-y-3">
                  {packLeaderGrowth.map((item) => (
                    <div key={item} className="flex gap-2">
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-emerald-700"
                      />
                      <p className="text-sm font-black text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/80 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
                  What SitGuru can track
                </p>
                <div className="mt-4 space-y-3">
                  {packLeaderTracking.map((item) => (
                    <div key={item} className="flex gap-2">
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-emerald-700"
                      />
                      <p className="text-sm font-black text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {trustPoints.map((point) => (
              <article
                key={point.title}
                className="rounded-[24px] border border-emerald-100 bg-[#f7faf4] p-5"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-800 shadow-sm">
                  {point.icon}
                </span>
                <h3 className="mt-4 text-xl font-black text-emerald-950">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {point.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          data-brand-green
          className="public-dark-section rounded-[32px] bg-[#0D5C3A] p-6 !text-white shadow-sm sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] !text-emerald-100">
                Program clarity
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight !text-white sm:text-4xl">
                Ambassadors represent. Affiliates promote. Partners collaborate.
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 !text-emerald-50">
                Ambassadors are people-based advocates who spread SitGuru through
                trust, referrals, campus energy, professional relationships, and
                local leadership.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/ambassadors"
                  className="inline-flex items-center gap-2 text-sm font-black !text-white underline underline-offset-2"
                >
                  Public Ambassadors overview
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/partners"
                  className="inline-flex items-center gap-2 text-sm font-black !text-emerald-100 underline underline-offset-2"
                >
                  Partner Network
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [
                  "Ambassadors",
                  "Students, community advocates, military-connected advocates, Gurus, pet professionals, friends, family, and local referral leaders.",
                  <Gift key="a" size={20} />,
                ],
                [
                  "Affiliates",
                  "Creators, influencers, bloggers, promoters, and content channels.",
                  <Megaphone key="f" size={20} />,
                ],
                [
                  "Partners",
                  "Organizations, schools, pet care businesses, nonprofits, brands, and community groups.",
                  <Handshake key="p" size={20} />,
                ],
              ].map(([title, description, icon]) => (
                <div
                  key={String(title)}
                  className="rounded-[22px] border border-white/20 bg-white/10 p-4 backdrop-blur"
                >
                  <div className="!text-emerald-100">{icon}</div>
                  <h3 className="mt-3 text-lg font-black !text-white">{title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-emerald-50">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel icon={<HelpCircle size={16} />}>
              Questions
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Ambassador Program FAQ
            </h2>
          </div>
          <div className="mx-auto mt-8 grid max-w-5xl gap-3 lg:grid-cols-2">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-[24px] border border-emerald-100 bg-[#f7faf4] p-5 open:border-emerald-200 open:bg-white open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-left text-base font-black text-emerald-950">
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
          id="join-ambassador-program"
          data-brand-green
          className="public-dark-section scroll-mt-24 rounded-[32px] bg-[#0D5C3A] p-6 !text-white shadow-sm sm:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] !text-white">
                <Trophy size={15} />
                Join the Ambassador Program
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight !text-white sm:text-4xl">
                Help SitGuru grow through referrals, community trust, and
                pet-friendly local energy.
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 !text-emerald-50">
                Students, community advocates, military-connected voices, Gurus,
                pet professionals, rescue advocates, friends, and family — if you
                have trust and reach, this program may fit.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={buildAmbassadorSignupHref({
                    program: "community",
                    campaign: "ambassador_program_join",
                    placement: "join_section_primary",
                  })}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-black text-emerald-950 transition hover:bg-emerald-50"
                >
                  Create Ambassador Account
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/programs"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-base font-black !text-white transition hover:bg-white/15"
                >
                  Explore Programs
                </Link>
              </div>
              <p className="mt-5 text-xs font-semibold leading-5 !text-emerald-100/90">
                Sharing from PA CareerLink, a college group, or a local community
                page? Send people here so they can choose the Ambassador path that
                fits them best.
              </p>
            </div>

            <div className="overflow-hidden rounded-[28px] bg-white p-5 text-slate-950 shadow-xl">
              <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-[20px]">
                <Image
                  src="/images/ambassadors/vet-tech-ambassador3.jpg"
                  alt="Trusted people with real community reach"
                  fill
                  className="object-cover"
                  style={{ objectPosition: "center 35%" }}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
              <Star className="text-emerald-800" size={28} />
              <h3 className="mt-3 text-xl font-black text-emerald-950">
                Built for trusted people with real community reach.
              </h3>
              <div className="mt-4 space-y-2">
                {[
                  ["Student Hire", "Campus and social circles"],
                  ["Community Hire", "Local pet families"],
                  [
                    VETERANS_MILITARY_FAMILIES_PROGRAM.shortName,
                    "Veteran and military-connected awareness",
                  ],
                  ["Pet professionals", "Clinic, training, and grooming trust"],
                ].map(([title, description]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-emerald-100 bg-[#f7faf4] px-4 py-3"
                  >
                    <p className="text-sm font-black text-emerald-950">{title}</p>
                    <p className="mt-0.5 text-xs font-bold text-emerald-800">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">
                Prefer the lighter overview? Visit{" "}
                <Link
                  href="/ambassadors"
                  className="font-black text-emerald-800 underline"
                >
                  /ambassadors
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
