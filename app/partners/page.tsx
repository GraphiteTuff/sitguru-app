import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Globe2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  MapPin,
  Megaphone,
  PawPrint,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Stethoscope,
  Trophy,
  UsersRound,
} from "lucide-react";

const partnerCategories = [
  {
    title: "Local Partners",
    eyebrow: "Community reach",
    description:
      "Local businesses, neighborhood groups, apartments, pet care providers, shelters, rescues, schools, and community organizations that want to grow with SitGuru locally.",
    icon: <MapPin size={24} />,
    examples: [
      "Local businesses",
      "Apartment communities",
      "Neighborhood groups",
      "Shelters and rescues",
      "Community organizations",
    ],
  },
  {
    title: "National Partners",
    eyebrow: "Multi-market growth",
    description:
      "National brands, associations, franchises, nonprofit networks, multi-location companies, and larger organizations looking to connect with pet families and local service markets.",
    icon: <Globe2 size={24} />,
    examples: [
      "National brands",
      "Multi-location companies",
      "Associations",
      "Franchise networks",
      "National nonprofits",
    ],
  },
  {
    title: "Veterinary & Pet Care Partners",
    eyebrow: "Trusted pet ecosystem",
    description:
      "Veterinarians, groomers, trainers, boarding providers, shelters, rescues, and pet service professionals who want to add trusted pet care resources for their clients.",
    icon: <Stethoscope size={24} />,
    examples: [
      "Veterinarians",
      "Groomers",
      "Dog trainers",
      "Shelters and rescues",
      "Pet care professionals",
    ],
  },
  {
    title: "Pet Stores & Pet Retail",
    eyebrow: "Retail connection",
    description:
      "Pet stores and pet retail partners can connect shoppers with trusted pet sitting, dog walking, and local care resources while creating referral and co-marketing opportunities.",
    icon: <ShoppingBag size={24} />,
    examples: [
      "Independent pet stores",
      "Pet supply retailers",
      "Boutique pet shops",
      "Pet product brands",
      "Retail referral campaigns",
    ],
  },
  {
    title: "School & Campus Partners",
    eyebrow: "Student opportunity",
    description:
      "Schools, colleges, universities, student organizations, career centers, and campus groups that want to help students find flexible earning pathways.",
    icon: <GraduationCap size={24} />,
    examples: [
      "Colleges and universities",
      "High schools",
      "Career centers",
      "Student organizations",
      "Campus clubs",
    ],
  },
  {
    title: "Community & Nonprofit Partners",
    eyebrow: "Opportunity access",
    description:
      "For-profit and nonprofit organizations supporting workforce readiness, community growth, re-entry support, job-readiness, and local opportunity access.",
    icon: <HeartHandshake size={24} />,
    examples: [
      "Nonprofits",
      "Workforce groups",
      "Job-readiness programs",
      "Re-entry organizations",
      "Community programs",
    ],
  },
  {
    title: "Military & Veteran Partners",
    eyebrow: "Military-connected pathways",
    description:
      "Veteran organizations, military spouse networks, transition offices, Guard and reserve communities, and military-connected groups that support flexible local pathways.",
    icon: <ShieldCheck size={24} />,
    examples: [
      "Veteran groups",
      "Transition offices",
      "Military spouse networks",
      "Guard and reserve networks",
      "Military community partners",
    ],
  },
  {
    title: "Business & Brand Partners",
    eyebrow: "Co-marketing growth",
    description:
      "Brands, businesses, creators, event partners, and companies that want to build visibility, reach pet families, and grow through SitGuru’s pet care network.",
    icon: <BriefcaseBusiness size={24} />,
    examples: [
      "Pet brands",
      "Local companies",
      "Lifestyle brands",
      "Event partners",
      "Community campaigns",
    ],
  },
];

const growthChannels = [
  {
    title: "Partner Network",
    description:
      "For organizations, businesses, schools, nonprofits, pet care professionals, local groups, national brands, and community partners.",
    icon: <Handshake size={22} />,
    href: "#become-a-partner",
    cta: "Become a Partner",
  },
  {
    title: "Affiliate Program",
    description:
      "For creators, influencers, bloggers, promotional affiliates, social media pages, newsletters, podcasts, and content partners.",
    icon: <Megaphone size={22} />,
    href: "/affiliate-program",
    cta: "Explore Affiliates",
  },
  {
    title: "Ambassador Program",
    description:
      "For Gurus, students, community advocates, military-connected advocates, campus leaders, and trusted local referral champions.",
    icon: <UsersRound size={22} />,
    href: "/ambassadors",
    cta: "Explore Ambassadors",
  },
];

const partnerBenefits = [
  "Connect your audience with trusted local pet care resources.",
  "Create referral, co-marketing, and community growth opportunities.",
  "Support flexible earning pathways for students, veterans, workers, and local residents.",
  "Add value for customers, clients, members, residents, employees, or program participants.",
  "Grow visibility through SitGuru’s expanding pet care and community network.",
  "Build local and national partnership campaigns around real pet care needs.",
];

const howItWorks = [
  {
    step: "01",
    title: "Tell us who you serve",
    description:
      "Share your organization type, audience, location, reach, goals, and how you want to grow with SitGuru.",
  },
  {
    step: "02",
    title: "Choose the best pathway",
    description:
      "We help route you toward Partner Network, Affiliate Program, Ambassador Program, Hiring Programs, or a combined growth path.",
  },
  {
    step: "03",
    title: "Launch shared growth",
    description:
      "SitGuru can support referral campaigns, local awareness, community outreach, program promotion, and partner visibility.",
  },
  {
    step: "04",
    title: "Grow together",
    description:
      "As the SitGuru network expands, partners can grow through engagement, referrals, community trust, and future campaigns.",
  },
];

const petMoments = [
  {
    title: "Trusted local care",
    caption: "Help more pet families connect with care they can trust.",
    src: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
    alt: "Happy dog looking at the camera",
  },
  {
    title: "Pet-loving communities",
    caption: "Grow alongside neighborhoods, campuses, and local partners.",
    src: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=900&q=80",
    alt: "Curious cat relaxing indoors",
  },
  {
    title: "Shared growth",
    caption: "Create opportunities that support pets, people, and partners.",
    src: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=80",
    alt: "Dog and cat together on a blanket",
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

export default function PartnerNetworkPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <section className="overflow-hidden border-b border-emerald-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              <Sparkles size={15} />
              SitGuru Partner Network
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Grow with SitGuru through trusted pet care, community reach, and
              shared opportunity.
            </h1>

            <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              SitGuru partners with local organizations, national brands,
              veterinarians, pet stores, schools, nonprofits, workforce groups,
              military-connected organizations, businesses, creators, and
              affiliates to grow trusted pet care access and create more ways
              for communities to connect.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#become-a-partner"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900"
              >
                Become a Partner
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/affiliate-program"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                Explore Affiliate Program
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <Pill>Local partners</Pill>
              <Pill>National partners</Pill>
              <Pill>Veterinarians</Pill>
              <Pill>Pet stores</Pill>
              <Pill>Schools</Pill>
              <Pill>Nonprofits</Pill>
              <Pill>Military groups</Pill>
              <Pill>Affiliates</Pill>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/50 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-200/60 blur-3xl" />

            <div className="relative rounded-[2rem] border border-emerald-100 bg-[#f8fff9] p-5 shadow-2xl shadow-emerald-950/10">
              <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-800 text-white">
                    <PawPrint size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-emerald-800">
                      Community-powered growth
                    </p>
                    <p className="text-xs font-bold text-slate-500">
                      Partners helping pet families, Gurus, and communities
                      connect.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Pet families", "Trusted care resources"],
                    ["Gurus", "Flexible earning pathways"],
                    ["Partners", "Shared growth opportunities"],
                    ["Communities", "Local support and connection"],
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
                  <p className="text-3xl font-black">Local</p>
                  <p className="mt-1 text-xs font-bold text-emerald-50">
                    Neighborhood, city, campus, pet care, and community reach.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950 p-4 text-white">
                  <p className="text-3xl font-black">National</p>
                  <p className="mt-1 text-xs font-bold text-slate-200">
                    Brands, networks, associations, and multi-market growth.
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-400 p-4 text-slate-950">
                  <p className="text-3xl font-black">Affiliate</p>
                  <p className="mt-1 text-xs font-bold text-amber-950">
                    Creators, influencers, bloggers, and promotional partners.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <SectionHeader
          eyebrow="Why partner with SitGuru"
          title="A partner network built for reach, trust, and growth."
          description="SitGuru helps partners connect with pet families, promote trusted local pet care, support flexible earning pathways, and grow visibility through a community-centered platform."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partnerBenefits.map((benefit) => (
            <div
              key={benefit}
              className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm"
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
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeader
            eyebrow="Partner categories"
            title="Built for organizations, pet care businesses, brands, schools, and communities."
            description="The SitGuru Partner Network is intentionally broad. Partners can be local or national, for-profit or nonprofit, pet-focused or community-focused, promotional or mission-driven."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {partnerCategories.map((category) => (
              <div
                key={category.title}
                className="group rounded-[1.75rem] border border-emerald-100 bg-[#fbfaf6] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg"
              >
                <IconBadge>{category.icon}</IconBadge>

                <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  {category.eyebrow}
                </p>

                <h3 className="mt-2 text-xl font-black text-slate-950">
                  {category.title}
                </h3>

                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  {category.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {category.examples.map((example) => (
                    <span
                      key={example}
                      className="rounded-full border border-white bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <SectionHeader
          eyebrow="Growth channels"
          title="One network. Multiple ways to grow together."
          description="Some partners are organizations. Some are promotional affiliates. Some are trusted community ambassadors. SitGuru keeps each path clear while connecting them under one growth ecosystem."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {growthChannels.map((channel) => (
            <div
              key={channel.title}
              className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm"
            >
              <IconBadge>{channel.icon}</IconBadge>

              <h3 className="mt-5 text-2xl font-black text-slate-950">
                {channel.title}
              </h3>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                {channel.description}
              </p>

              <Link
                href={channel.href}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
              >
                {channel.cta}
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#eef8f1_0%,#f8fbf8_100%)] py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                How partners grow with us
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                We help partners turn reach into real community connection.
              </h2>

              <p className="mt-5 text-base font-semibold leading-7 text-slate-600">
                Whether you are a veterinarian, pet store, school, nonprofit,
                national brand, local business, military-connected organization,
                creator, or affiliate, SitGuru helps create clearer pathways to
                pet care, earning opportunities, visibility, and shared growth.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {petMoments.map((pet) => (
                  <div
                    key={pet.title}
                    className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-sm"
                  >
                    <div className="relative h-44 w-full overflow-hidden">
                      <img
                        src={pet.src}
                        alt={pet.alt}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/5 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-sm font-black text-white">
                          {pet.title}
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold leading-6 text-slate-600">
                        {pet.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </section>

      <section
        id="become-a-partner"
        className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10"
      >
        <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
                <Trophy size={15} />
                Become a Partner
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Partner with SitGuru to grow pet care access, community reach,
                and shared visibility.
              </h2>

              <p className="mt-5 text-base font-semibold leading-7 text-slate-600">
                We are building a partner network for organizations, businesses,
                pet care providers, pet stores, schools, nonprofits, workforce
                groups, military-connected organizations, brands, creators, and
                affiliates that want to grow with a trusted pet care platform.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Local and national partnerships",
                  "Veterinary and pet care relationships",
                  "Pet store and retail campaigns",
                  "School and campus growth",
                  "Community and nonprofit pathways",
                  "Military and veteran support",
                  "Affiliate and creator promotion",
                  "Shared growth opportunities",
                ].map((item) => (
                  <div key={item} className="flex gap-2">
                    <BadgeCheck className="mt-0.5 shrink-0 text-emerald-700" />
                    <p className="text-sm font-bold text-slate-700">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900"
                >
                  Contact SitGuru
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/affiliate-program"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                >
                  Affiliate Program
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="bg-[#f8fff9] p-6 sm:p-8 lg:p-10">
              <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
                <Store className="text-emerald-800" size={34} />

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  A network designed for many partner types.
                </h3>

                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  SitGuru can support partners who want to promote trusted pet
                  care, connect their audience with flexible services, create
                  referral opportunities, or help more people access local
                  earning pathways.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    [
                      "Veterinarians",
                      "Add trusted pet care resources for clients.",
                    ],
                    [
                      "Pet stores",
                      "Connect shoppers with local care and referral options.",
                    ],
                    [
                      "Schools",
                      "Promote student-friendly earning opportunities.",
                    ],
                    [
                      "Nonprofits",
                      "Support community access and readiness pathways.",
                    ],
                    [
                      "Brands",
                      "Grow visibility through trusted pet care audiences.",
                    ],
                    [
                      "Creators",
                      "Promote SitGuru through affiliate-style campaigns.",
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
      </section>
    </main>
  );
}