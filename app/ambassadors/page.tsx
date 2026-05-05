import type { ReactNode } from "react";
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
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";

const ambassadorTypes = [
  {
    title: "Guru Ambassadors",
    eyebrow: "Trusted service voices",
    description:
      "Experienced or aspiring Gurus who help represent SitGuru, share the brand, refer new users, and support local trust in pet care.",
    icon: <PawPrint size={24} />,
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
      "High school, college, and university students who help spread SitGuru across campuses, clubs, student groups, sports teams, and local communities.",
    icon: <GraduationCap size={24} />,
    examples: [
      "Campus promoters",
      "Student groups",
      "Club leaders",
      "Athletes",
      "Social students",
    ],
  },
  {
    title: "Community Ambassadors",
    eyebrow: "Local connection",
    description:
      "Community-minded people who help SitGuru grow through neighborhoods, events, local organizations, pet communities, and trusted referrals.",
    icon: <HeartHandshake size={24} />,
    examples: [
      "Community advocates",
      "Neighborhood voices",
      "Event helpers",
      "Pet parent groups",
      "Local referral leaders",
    ],
  },
  {
    title: "Military Ambassadors",
    eyebrow: "Mission-driven reach",
    description:
      "Veterans, military spouses, military-connected advocates, Guard/reserve members, and transition-minded leaders who help SitGuru reach military communities.",
    icon: <ShieldCheck size={24} />,
    examples: [
      "Veterans",
      "Military spouses",
      "Transition advocates",
      "Guard and reserve networks",
      "Military community voices",
    ],
  },
];

const benefits = [
  "Help more pet families discover trusted local pet care.",
  "Spread SitGuru through campuses, communities, neighborhoods, military networks, and social circles.",
  "Refer future Gurus, pet parents, partners, and community supporters.",
  "Support flexible earning pathways for students, veterans, community members, and pet-loving people.",
  "Build leadership, local visibility, and community engagement around a pet-friendly brand.",
  "Grow with SitGuru through future campaigns, referrals, promotions, and ambassador opportunities.",
];

const howItWorks = [
  {
    step: "01",
    title: "Tell us your community",
    description:
      "Share where you have reach — campus, neighborhood, military community, pet groups, social media, events, or local networks.",
  },
  {
    step: "02",
    title: "Choose your ambassador path",
    description:
      "We help route you toward Guru Ambassador, Student Ambassador, Community Ambassador, Military Ambassador, or another SitGuru growth pathway.",
  },
  {
    step: "03",
    title: "Spread SitGuru",
    description:
      "Ambassadors help promote SitGuru through referrals, events, content, community outreach, campus sharing, and local conversations.",
  },
  {
    step: "04",
    title: "Grow with us",
    description:
      "As SitGuru expands, ambassadors may support campaigns, referral growth, partner awareness, and future local opportunities.",
  },
];

const ambassadorActivities = [
  "Share SitGuru with pet parents",
  "Refer future Gurus",
  "Promote Hiring Programs",
  "Spread campus awareness",
  "Support community events",
  "Introduce local partners",
  "Create social content",
  "Help grow trusted referrals",
];

const trustPoints = [
  {
    title: "People-powered growth",
    description:
      "Ambassadors are people who help SitGuru grow through real relationships, trusted recommendations, and community connection.",
    icon: <UsersRound size={22} />,
  },
  {
    title: "Clear, honest promotion",
    description:
      "Ambassadors should share SitGuru accurately, professionally, and in a way that builds trust with pet parents, Gurus, and partners.",
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
      "The Ambassador Program is for Gurus, students, community advocates, military-connected advocates, campus leaders, referral leaders, and trusted local voices who want to help represent and grow SitGuru.",
  },
  {
    question: "Is this the same as becoming a Guru?",
    answer:
      "No. Becoming a Guru is for people who want to provide pet care services. The Ambassador Program is for people who want to help promote, refer, represent, and grow SitGuru. Some people may do both.",
  },
  {
    question: "Is this the same as the Affiliate Program?",
    answer:
      "Not exactly. Affiliates are usually promotional channels, creators, influencers, bloggers, or marketers. Ambassadors are people-based advocates who represent SitGuru in communities, campuses, neighborhoods, and personal networks.",
  },
  {
    question: "Can students, veterans, or community applicants become ambassadors?",
    answer:
      "Yes. Ambassadors can come from student, community, military-connected, Guru, or local referral pathways. SitGuru can route applicants to the right program fit.",
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

export default function AmbassadorProgramPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <section className="overflow-hidden border-b border-emerald-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              <Sparkles size={15} />
              SitGuru Ambassador Program
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Represent SitGuru. Spread the word. Help your community connect
              through trusted pet care.
            </h1>

            <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              SitGuru Ambassadors are people-powered growth leaders who help
              share SitGuru with pet parents, future Gurus, students, community
              groups, military-connected networks, local partners, and trusted
              referral circles.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#join-ambassador-program"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900"
              >
                Join the Ambassador Program
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/programs"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                Explore Hiring Programs
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <Pill>Guru Ambassadors</Pill>
              <Pill>Student Ambassadors</Pill>
              <Pill>Community Ambassadors</Pill>
              <Pill>Military Ambassadors</Pill>
              <Pill>Campus leaders</Pill>
              <Pill>Referral voices</Pill>
              <Pill>Pet lovers</Pill>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/50 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-200/60 blur-3xl" />

            <div className="relative rounded-[2rem] border border-emerald-100 bg-[#f8fff9] p-5 shadow-2xl shadow-emerald-950/10">
              <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm">
                <div className="relative h-72 w-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1525253013412-55c1a69a5738?auto=format&fit=crop&w=1100&q=80"
                    alt="Happy dog with a person outdoors"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                      Community voices matter
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-white">
                      Help SitGuru grow where people already trust you.
                    </h2>
                  </div>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  {[
                    [
                      "Share",
                      "Tell pet parents and future Gurus about SitGuru",
                    ],
                    ["Refer", "Help bring trusted people into the network"],
                    ["Represent", "Support SitGuru in your community"],
                    ["Grow", "Build reach through local and social connection"],
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
                  <Radio size={22} />
                  <p className="mt-3 text-2xl font-black">Buzz</p>
                  <p className="mt-1 text-xs font-bold text-emerald-50">
                    Spread SitGuru across trusted local circles.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950 p-4 text-white">
                  <Gift size={22} />
                  <p className="mt-3 text-2xl font-black">Refer</p>
                  <p className="mt-1 text-xs font-bold text-slate-200">
                    Help bring in pet parents, Gurus, and partners.
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-400 p-4 text-slate-950">
                  <Trophy size={22} />
                  <p className="mt-3 text-2xl font-black">Lead</p>
                  <p className="mt-1 text-xs font-bold text-amber-950">
                    Build community visibility as SitGuru grows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <SectionHeader
          eyebrow="Why become an ambassador"
          title="Ambassadors help SitGuru grow through real trust, local reach, and personal connection."
          description="The best ambassadors are people who naturally share, refer, encourage, and connect. SitGuru gives them a pet-friendly brand that is easy to talk about and meaningful to communities."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
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
            eyebrow="Ambassador paths"
            title="Built for Gurus, students, community advocates, and military-connected leaders."
            description="Ambassadors are people, not organizations. They help represent SitGuru through trusted relationships, personal networks, local conversations, social sharing, and community energy."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {ambassadorTypes.map((type) => (
              <div
                key={type.title}
                className="group rounded-[1.75rem] border border-emerald-100 bg-[#fbfaf6] p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg"
              >
                <IconBadge>{type.icon}</IconBadge>

                <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
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
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              What ambassadors can do
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Simple, social, local ways to help SitGuru grow.
            </h2>
            <p className="mt-5 text-base font-semibold leading-7 text-slate-600">
              Ambassadors can support SitGuru through referrals, local
              conversations, campus energy, social posts, community groups,
              pet-friendly events, and introductions to future Gurus, pet
              parents, partners, and affiliates.
            </p>

            <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-sm">
              <div className="relative h-72 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&w=1100&q=80"
                  alt="Dogs with people in a friendly community setting"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-sm font-black text-white">
                    SitGuru grows through trusted people and pet-loving
                    communities.
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
            title="A simple path from supporter to SitGuru ambassador."
            description="The Ambassador Program is designed to be flexible for people who want to help promote, refer, represent, and grow SitGuru in their own communities."
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
              spread SitGuru through trust, referrals, campus energy, community
              reach, and local leadership.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              [
                "Ambassadors",
                "Gurus, students, community advocates, military-connected advocates, and local referral leaders.",
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
          description="A few quick answers to help Gurus, students, community advocates, and military-connected leaders understand where the Ambassador Program fits."
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
                Help SitGuru grow through referrals, community trust, and
                pet-friendly local energy.
              </h2>

              <p className="mt-5 text-base font-semibold leading-7 text-slate-600">
                If you are a Guru, student, community advocate,
                military-connected advocate, campus leader, referral leader, or
                pet-loving local voice, the SitGuru Ambassador Program may be a
                strong fit.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Guru and student ambassadors",
                  "Community referral leaders",
                  "Military-connected advocates",
                  "Campus and local awareness",
                  "Pet parent introductions",
                  "Future Guru referrals",
                  "Partner and affiliate introductions",
                  "Shared growth conversations",
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
                  href="/programs"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                >
                  Hiring Programs
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="bg-[#f8fff9] p-6 sm:p-8 lg:p-10">
              <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
                <Star className="text-emerald-800" size={34} />

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  Built for trusted people with real community reach.
                </h3>

                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  Ambassadors can help SitGuru grow by sharing the brand,
                  referring pet parents, encouraging future Gurus, supporting
                  hiring programs, and helping SitGuru become visible in more
                  trusted local spaces.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    ["Gurus", "Represent the brand and refer trusted people."],
                    [
                      "Students",
                      "Spread SitGuru through campus and social circles.",
                    ],
                    [
                      "Community voices",
                      "Help local pet families discover SitGuru.",
                    ],
                    [
                      "Military advocates",
                      "Support military-connected awareness.",
                    ],
                    [
                      "Referral leaders",
                      "Introduce pet parents, Gurus, and partners.",
                    ],
                    [
                      "Pet lovers",
                      "Share a brand built around trusted pet care.",
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