import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  HandHeart,
  Medal,
  PawPrint,
  Scissors,
  ShieldCheck,
  Stethoscope,
  Trophy,
  UsersRound,
} from "lucide-react";

type AmbassadorCardItem = {
  key: string;
  eyebrow: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
  icon: LucideIcon;
  bestFor: string[];
  howTheyHelp: string[];
  href: string;
  cta: string;
};

const ambassadorCards: AmbassadorCardItem[] = [
  {
    key: "vet-tech",
    eyebrow: "Guide the Pack",
    title: "Vet Tech Ambassadors",
    tagline: "Trusted pet care guidance from the clinic side.",
    description:
      "Vet Techs are trusted by Pet Parents during some of the most important pet care conversations. As a SitGuru Ambassador, you can help families find dependable care beyond the clinic while helping responsible animal lovers discover a path to become Gurus.",
    image: "/images/ambassadors/vet-tech-ambassador3.jpg",
    imageAlt: "Vet professional with a dog in a clinic",
    imagePosition: "center 35%",
    icon: Stethoscope,
    bestFor: [
      "Vet Techs",
      "Veterinary assistants",
      "Animal clinic staff",
      "Pet care professionals in medical settings",
    ],
    howTheyHelp: [
      "Share SitGuru with Pet Parents who need trusted everyday support",
      "Encourage responsible pet lovers to become Gurus",
      "Help families feel confident when they need care outside the clinic",
      "Strengthen the local pet care community",
    ],
    href: "/programs/ambassadors/apply?type=vet-tech",
    cta: "Join as Vet Tech Ambassador",
  },
  {
    key: "veterinarian",
    eyebrow: "Strengthen the Pack",
    title: "Veterinarian Ambassadors",
    tagline: "A trusted local voice for Pet Parents.",
    description:
      "Veterinarians understand how much trust matters in pet care. SitGuru gives you a community-centered way to help Pet Parents find reliable support for walks, visits, routines, travel, and peace of mind.",
    image: "/images/ambassadors/veterinarian-ambassador2.jpg",
    imageAlt: "Veterinarian with pet owner and dog",
    imagePosition: "center 35%",
    icon: ShieldCheck,
    bestFor: [
      "Veterinarians",
      "Animal hospital leaders",
      "Clinic owners",
      "Veterinary community advocates",
    ],
    howTheyHelp: [
      "Introduce SitGuru as a trusted pet care community",
      "Help Pet Parents find reliable care options",
      "Encourage qualified animal lovers to apply as Gurus",
      "Support families before, during, and after pet care needs arise",
    ],
    href: "/programs/ambassadors/apply?type=veterinarian",
    cta: "Become a Veterinarian Ambassador",
  },
  {
    key: "trainer",
    eyebrow: "Shape the Pack",
    title: "Trainer Ambassadors",
    tagline: "Build trust, routine, and support through training.",
    description:
      "Trainers help pets and Pet Parents build structure, confidence, and better routines. SitGuru Ambassadors can help families keep that progress going with dependable local care between training sessions.",
    image: "/images/ambassadors/trainer-ambassador2.jpg",
    imageAlt: "Dog trainer with dog and owner",
    imagePosition: "center 32%",
    icon: PawPrint,
    bestFor: [
      "Dog trainers",
      "Obedience instructors",
      "Behavior specialists",
      "Training facility teams",
    ],
    howTheyHelp: [
      "Refer families who need consistent pet care support",
      "Encourage better routines between training sessions",
      "Help experienced pet people become Gurus",
      "Grow a more dependable local care network",
    ],
    href: "/programs/ambassadors/apply?type=trainer",
    cta: "Join as Trainer Ambassador",
  },
  {
    key: "groomer",
    eyebrow: "Connect the Pack",
    title: "Groomer Ambassadors",
    tagline: "Trusted regular touchpoints with Pet Parents.",
    description:
      "Groomers see Pet Parents regularly and often hear when families need extra help. SitGuru gives groomers a way to connect families with trusted care while helping grow a stronger pet community.",
    image: "/images/ambassadors/groomer-ambassador2.jpg",
    imageAlt: "Groomer with happy dog",
    imagePosition: "center 35%",
    icon: Scissors,
    bestFor: [
      "Dog groomers",
      "Cat groomers",
      "Pet salon teams",
      "Pet care professionals",
    ],
    howTheyHelp: [
      "Share SitGuru with busy Pet Parents",
      "Refer families who need sitting, visits, or walks",
      "Encourage animal-loving people to become Gurus",
      "Help Pet Parents stay connected to reliable care",
    ],
    href: "/programs/ambassadors/apply?type=groomer",
    cta: "Become a Groomer Ambassador",
  },
  {
    key: "student",
    eyebrow: "Grow the Pack",
    title: "Student Ambassadors",
    tagline: "Campus and community energy that spreads trust.",
    description:
      "Students are connected through campuses, apartments, clubs, teams, classmates, and social circles. Student Ambassadors can help SitGuru grow while helping friends and local Pet Parents discover flexible pet care opportunities.",
    image: "/images/ambassadors/student-ambassador2.jpg",
    imageAlt: "Student with dog outdoors",
    imagePosition: "center 32%",
    icon: GraduationCap,
    bestFor: [
      "College students",
      "High school seniors 18+",
      "Student leaders",
      "Campus community members",
    ],
    howTheyHelp: [
      "Share SitGuru on campus and in student communities",
      "Refer students who want flexible pet care work",
      "Introduce Pet Parents to trusted local care",
      "Help build a pet-friendly community around school and home",
    ],
    href: "/programs/ambassadors/apply?type=student",
    cta: "Become a Student Ambassador",
  },
  {
    key: "veteran-military",
    eyebrow: "Serve the Pack",
    title: "Veteran Ambassadors",
    tagline: "Military-connected trust and community connection.",
    description:
      "Veterans, military spouses, Guard, Reserve, and military-connected families understand service, trust, and responsibility. SitGuru gives military-connected Ambassadors a meaningful way to support Pet Parents and grow trusted local care.",
    image: "/images/ambassadors/veteran-military-ambassador.jpg",
    imageAlt: "Military-connected person with dog",
    imagePosition: "center 32%",
    icon: Medal,
    bestFor: [
      "Veterans",
      "Military spouses",
      "Guard and Reserve members",
      "Approved SkillBridge applicants",
      "Military-connected community leaders",
    ],
    howTheyHelp: [
      "Refer military-connected families who need pet care",
      "Help trusted veterans and spouses explore Guru opportunities",
      "Share SitGuru through military and veteran communities",
      "Support families with dependable local care connections",
    ],
    href: "/programs/ambassadors/apply?type=veteran-military",
    cta: "Join as Veteran Ambassador",
  },
  {
    key: "rescue-shelter",
    eyebrow: "Protect the Pack",
    title: "Rescue & Shelter Ambassadors",
    tagline: "Support adopters, fosters, and local pet care networks.",
    description:
      "Rescue and shelter advocates already care deeply about animal wellbeing. SitGuru Ambassadors can help adopters, volunteers, fosters, and Pet Parents find trusted support after adoption and throughout pet ownership.",
    image: "/images/ambassadors/rescue-shelter-ambassador2.jpg",
    imageAlt: "Rescue volunteer with dog and cat",
    imagePosition: "center 35%",
    icon: HandHeart,
    bestFor: [
      "Shelter volunteers",
      "Rescue advocates",
      "Foster families",
      "Animal welfare supporters",
    ],
    howTheyHelp: [
      "Share SitGuru with adopters and Pet Parents",
      "Encourage trusted animal lovers to become Gurus",
      "Promote responsible pet care in the community",
      "Help families keep pets supported at home",
    ],
    href: "/programs/ambassadors/apply?type=rescue-shelter",
    cta: "Become a Rescue Ambassador",
  },
  {
    key: "guru",
    eyebrow: "Build the Pack",
    title: "Guru Ambassadors",
    tagline: "Experienced caregivers helping grow trusted care.",
    description:
      "Existing Gurus can become some of SitGuru’s strongest Ambassadors. You understand what Pet Parents need, what makes a great Guru, and how trusted local care can make a real difference.",
    image: "/images/ambassadors/guru-ambassador2.jpg",
    imageAlt: "Guru walking with dog",
    imagePosition: "center 35%",
    icon: UsersRound,
    bestFor: [
      "Existing SitGuru Gurus",
      "Experienced pet sitters",
      "Dog walkers",
      "Trusted local caregivers",
    ],
    howTheyHelp: [
      "Refer responsible pet lovers who may become Gurus",
      "Refer Pet Parents who need reliable local care",
      "Share SitGuru in neighborhoods and local groups",
      "Help strengthen service coverage in your area",
    ],
    href: "/programs/ambassadors/apply?type=guru",
    cta: "Become a Guru Ambassador",
  },
];

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
      {children}
    </p>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-black text-green-900">
      {children}
    </span>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[22px] border border-[#dfe8df] bg-[#f8faf7] p-4">
      <h4 className="text-xs font-black uppercase tracking-[0.12em] text-green-800">
        {title}
      </h4>

      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-700"
          >
            <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={15} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AmbassadorCard({
  item,
  priority = false,
}: {
  item: AmbassadorCardItem;
  priority?: boolean;
}) {
  const Icon = item.icon;

  return (
    <article className="overflow-hidden rounded-[28px] border border-[#d9e7db] bg-white shadow-sm">
      <div className="relative h-[300px] overflow-hidden bg-green-50 sm:h-[340px]">
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          style={{ objectPosition: item.imagePosition || "center center" }}
        />

        <div className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/95 text-green-900 shadow-sm backdrop-blur">
          <Icon size={18} />
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-5 pb-5 pt-20">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFD54A] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
            {item.eyebrow}
          </p>

          <div className="inline-flex max-w-full rounded-2xl border border-white/80 bg-white/95 px-4 py-2 shadow-lg shadow-black/25 backdrop-blur">
            <h3 className="text-[22px] font-black leading-tight text-green-950 sm:text-[26px]">
              {item.title}
            </h3>
          </div>

          <p className="mt-2 text-sm font-bold leading-snug text-white/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">
            {item.tagline}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <p className="text-sm font-semibold leading-7 text-slate-700">
          {item.description}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <BulletList title="Best fit for" items={item.bestFor} />
          <BulletList title="How you help" items={item.howTheyHelp} />
        </div>

        <Link
          href={item.href}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
        >
          {item.cta}
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}

export default function AmbassadorProgramPage() {
  return (
    <main className="min-h-screen bg-[#f7faf7]">
      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-[#cfe2d2] bg-[#f4f9f5] p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <div>
              <SectionEyebrow>SitGuru Ambassador Program</SectionEyebrow>

              <h1 className="mt-1 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl">
                Together, we grow the Pack.
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-700 sm:text-base">
                SitGuru is more than a pet care service. We are building a pet
                care community where Pet Parents, Gurus, students,
                veterinarians, Vet Techs, trainers, groomers, rescue advocates,
                veterans, and local supporters can grow together. Ambassadors
                help families find trusted care, help great people become Gurus,
                and help local communities feel more connected around the pets
                they love.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/programs/ambassadors/apply"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-green-800 px-6 py-4 text-sm font-black text-white shadow-lg shadow-green-900/10 transition hover:bg-green-900"
                >
                  Become an Ambassador
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/programs"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-green-200 bg-white px-6 py-4 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  Explore SitGuru Programs
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-[#dce9df] bg-white p-4">
                <SectionEyebrow>Why join?</SectionEyebrow>

                <ul className="mt-3 space-y-2">
                  {[
                    "Help Pet Parents find trusted local care",
                    "Encourage responsible pet lovers to become Gurus",
                    "Support a community-first pet care network",
                    "Earn recognition as the Pack grows",
                    "Be part of something bigger than a booking",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm font-semibold text-slate-700"
                    >
                      <CheckCircle2
                        className="mt-0.5 shrink-0 text-green-700"
                        size={15}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[22px] border border-[#dce9df] bg-white p-4">
                <SectionEyebrow>What makes SitGuru different?</SectionEyebrow>

                <ul className="mt-3 space-y-2">
                  {[
                    "Community-first, not just transaction-first",
                    "Built around trust, pets, families, and local connection",
                    "Designed to grow Gurus and Pet Parents together",
                    "Welcoming to students, veterans, and pet professionals",
                    "Focused on real relationships, not just quick bookings",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm font-semibold text-slate-700"
                    >
                      <CheckCircle2
                        className="mt-0.5 shrink-0 text-green-700"
                        size={15}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-[#cfe2d2] bg-white p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionEyebrow>Ambassador paths</SectionEyebrow>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Choose how you want to Lead the Pack.
              </h2>

              <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-700 sm:text-base">
                Every Ambassador brings something meaningful to SitGuru. Choose
                the path that best matches your experience, your relationships,
                and the way you want to help Pet Parents, Gurus, and local pet
                care families grow together.
              </p>
            </div>

            <Link
              href="/programs/ambassadors/apply"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
            >
              Apply Now
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {ambassadorCards.map((item, index) => (
              <AmbassadorCard key={item.key} item={item} priority={index < 2} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-[#d9e7db] bg-white p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <SectionEyebrow>More than a service</SectionEyebrow>

              <h2 className="mt-1 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                SitGuru is a pet community built on trust.
              </h2>

              <p className="mt-4 text-sm font-semibold leading-7 text-slate-700 sm:text-base">
                Many platforms focus only on the booking. SitGuru is different.
                We want Pet Parents to feel supported, Gurus to feel valued, and
                Ambassadors to feel proud of the community they help grow.
              </p>

              <p className="mt-4 text-sm font-semibold leading-7 text-slate-700 sm:text-base">
                When you join as an Ambassador, you are helping build a trusted
                network for real families, real pets, and real local care needs.
                You are not just sharing a link. You are helping connect people
                who care.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-green-100 bg-[#f8faf7] p-5">
                <h3 className="text-lg font-black text-green-950">
                  For Pet Parents
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Help families find local Gurus they can trust for walks,
                  visits, sitting, routines, travel, and everyday support.
                </p>
              </div>

              <div className="rounded-[24px] border border-green-100 bg-[#f8faf7] p-5">
                <h3 className="text-lg font-black text-green-950">
                  For Gurus
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Help responsible pet lovers discover flexible opportunities to
                  care for pets and serve families in their area.
                </p>
              </div>

              <div className="rounded-[24px] border border-green-100 bg-[#f8faf7] p-5">
                <h3 className="text-lg font-black text-green-950">
                  For Communities
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Help build stronger local pet care networks through trust,
                  referrals, relationships, and shared love for animals.
                </p>
              </div>

              <div className="rounded-[24px] border border-green-100 bg-[#f8faf7] p-5">
                <h3 className="text-lg font-black text-green-950">
                  For Ambassadors
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Help grow SitGuru, earn recognition, and become part of a
                  mission-driven Pack that values your voice and connections.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[30px] border border-[#d9e7db] bg-white p-6">
            <SectionEyebrow>Cat care matters too</SectionEyebrow>

            <h2 className="mt-1 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Trusted support for dogs, cats, and every pet in the Pack.
            </h2>

            <p className="mt-4 text-sm font-semibold leading-7 text-slate-700 sm:text-base">
              Many Pet Parents need care for cats, senior pets, special
              routines, multi-pet homes, and animals who need patient, reliable
              support. SitGuru Ambassadors help spread the word that trusted pet
              care is for the whole household, not just dog walking.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Pill>Cat care support</Pill>
              <Pill>Senior pets</Pill>
              <Pill>Daily routines</Pill>
              <Pill>Multi-pet homes</Pill>
              <Pill>Trusted visits</Pill>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-[#d9e7db] bg-white shadow-sm">
            <div className="relative h-full min-h-[330px] bg-green-50">
              <Image
                src="/images/ambassadors/cat-care-trust.jpg"
                alt="Cat care support in a veterinary setting"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                style={{ objectPosition: "center 35%" }}
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-5 pb-5 pt-20">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFD54A] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                  Trusted care for every companion
                </p>

                <div className="inline-flex max-w-full rounded-2xl border border-white/80 bg-white/95 px-4 py-2 shadow-lg shadow-black/25 backdrop-blur">
                  <h3 className="text-2xl font-black leading-tight text-green-950 sm:text-3xl">
                    Dogs, cats, and every pet in between.
                  </h3>
                </div>

                <p className="mt-2 text-sm font-bold text-white/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">
                  Trusted SitGuru support for dogs, cats, seniors, routines, and
                  multi-pet homes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[30px] bg-green-900 p-6 text-white">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.95fr_0.95fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-green-200">
                Grow with SitGuru
              </p>

              <h2 className="mt-1 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Refer. Support. Earn recognition.
              </h2>

              <p className="mt-4 text-sm font-semibold leading-7 text-green-50/95 sm:text-base">
                Ambassadors help SitGuru grow by introducing the Pack to people
                who already care about pets, families, trust, and community.
                Your referrals can help more Pet Parents find care, more Gurus
                find opportunity, and more communities build dependable pet care
                support.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/programs/ambassadors/apply"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  Become an Ambassador
                </Link>

                <Link
                  href="/programs"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  Explore All Programs
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] bg-white p-5 text-slate-900">
              <h3 className="text-sm font-black uppercase tracking-[0.12em] text-green-800">
                Ambassador benefits
              </h3>

              <ul className="mt-3 space-y-2">
                {[
                  "Be part of a pet care community with a mission",
                  "Help people you know find trusted pet care",
                  "Support flexible opportunities for future Gurus",
                  "Earn recognition as your local Pack grows",
                  "Help build something meaningful in your area",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-700"
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-green-700"
                      size={15}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[24px] bg-white p-5 text-slate-900">
              <h3 className="text-sm font-black uppercase tracking-[0.12em] text-green-800">
                Ways to grow the Pack
              </h3>

              <ul className="mt-3 space-y-2">
                {[
                  "Share SitGuru with Pet Parents",
                  "Invite responsible pet lovers to become Gurus",
                  "Introduce SitGuru in local pet communities",
                  "Support students, veterans, and pet professionals",
                  "Celebrate trusted care in your neighborhood",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-700"
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-green-700"
                      size={15}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-[#d9e7db] bg-white p-6">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr_0.85fr]">
            <div>
              <SectionEyebrow>Recognition</SectionEyebrow>

              <h2 className="mt-1 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                Great Ambassadors deserve to be celebrated.
              </h2>

              <p className="mt-4 text-sm font-semibold leading-7 text-slate-700 sm:text-base">
                SitGuru believes community growth should be visible. As the Pack
                grows, top Ambassadors may be recognized for helping Pet
                Parents, Gurus, and local communities connect through trusted
                pet care.
              </p>

              <p className="mt-4 text-sm font-semibold leading-7 text-slate-700 sm:text-base">
                Recognition may include Pack Leader highlights, community
                spotlights, badges, social features, and other SitGuru
                Ambassador opportunities based on program availability and
                eligibility.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#dfe8df] bg-[#f8faf7] p-5">
              <h3 className="text-sm font-black uppercase tracking-[0.12em] text-green-800">
                You can be known for
              </h3>

              <ul className="mt-3 space-y-2">
                {[
                  "Helping Pet Parents find trusted care",
                  "Supporting new Gurus",
                  "Growing local pet care awareness",
                  "Creating community connections",
                  "Helping SitGuru reach more families",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-700"
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-green-700"
                      size={15}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[24px] border border-[#dfe8df] bg-[#f8faf7] p-5">
              <h3 className="text-sm font-black uppercase tracking-[0.12em] text-green-800">
                Recognition examples
              </h3>

              <ul className="mt-3 space-y-2">
                {[
                  "Pack Leader",
                  "Community Connector",
                  "Student Ambassador",
                  "Veterinary Ambassador",
                  "Local Growth Champion",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-700"
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-green-700"
                      size={15}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5 rounded-[22px] border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-bold leading-6 text-amber-950">
              Ambassador rewards, commissions, recognition, program eligibility,
              and public features may vary and are not guaranteed. SitGuru will
              always seek permission before publicly featuring an Ambassador’s
              name, photo, story, or performance highlights.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-green-100 bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 p-6 text-center text-white shadow-sm sm:p-8">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-green-900">
              <Trophy size={26} />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-100">
              Ready to help SitGuru grow?
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Become a SitGuru Ambassador.
            </h2>

            <p className="mt-3 text-sm font-semibold leading-7 text-green-50 sm:text-base">
              Help Pet Parents find trusted care, help great people become
              Gurus, and help SitGuru grow a stronger pet care community in your
              area.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/programs/ambassadors/apply"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-green-950 shadow-lg transition hover:bg-green-50"
              >
                Apply to Lead the Pack
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/programs"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                View All Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}