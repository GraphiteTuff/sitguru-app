import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Gift,
  Handshake,
  Heart,
  Megaphone,
  MessageCircleHeart,
  PenLine,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Trophy,
  UsersRound,
  Video,
} from "lucide-react";

const affiliateTypes = [
  {
    title: "Creators & Influencers",
    eyebrow: "Social reach",
    description:
      "Pet creators, lifestyle influencers, local personalities, TikTokers, Instagram pages, YouTubers, and social media promoters who want to share SitGuru with their audience.",
    icon: <Video size={24} />,
    examples: [
      "Pet influencers",
      "Lifestyle creators",
      "Local social pages",
      "YouTube creators",
      "TikTok promoters",
    ],
  },
  {
    title: "Bloggers & Publishers",
    eyebrow: "Content growth",
    description:
      "Pet bloggers, local guides, family blogs, newsletters, review sites, community publishers, and content partners who can introduce SitGuru through useful stories and resources.",
    icon: <PenLine size={24} />,
    examples: [
      "Pet bloggers",
      "Newsletter owners",
      "Local guides",
      "Review sites",
      "Community publishers",
    ],
  },
  {
    title: "Promotional Affiliates",
    eyebrow: "Campaign partners",
    description:
      "Affiliate marketers, promo-code partners, deal pages, local advertisers, referral partners, and campaign promoters who help drive awareness and signups.",
    icon: <Megaphone size={24} />,
    examples: [
      "Promo-code partners",
      "Referral marketers",
      "Deal pages",
      "Local advertisers",
      "Campaign promoters",
    ],
  },
  {
    title: "Community Promoters",
    eyebrow: "Local connection",
    description:
      "People, groups, and community voices that help spread SitGuru through neighborhoods, schools, events, pet groups, apartment communities, and local networks.",
    icon: <UsersRound size={24} />,
    examples: [
      "Community pages",
      "Campus promoters",
      "Neighborhood groups",
      "Event promoters",
      "Pet parent groups",
    ],
  },
];

const benefits = [
  "Promote a pet care brand built around local trust, convenience, and community.",
  "Help pet parents discover dog walking, pet sitting, and trusted local pet care resources.",
  "Share SitGuru through content, social posts, newsletters, videos, blogs, promo campaigns, or local outreach.",
  "Support flexible earning pathways for Gurus, students, veterans, and community applicants.",
  "Create future referral, campaign, promo-code, and shared-growth opportunities.",
  "Grow with a brand designed for pet families, local communities, partners, and service-minded people.",
];

const howItWorks = [
  {
    step: "01",
    title: "Tell us about your reach",
    description:
      "Share your audience, platform, content style, local market, niche, and how you want to promote SitGuru.",
  },
  {
    step: "02",
    title: "Choose your affiliate path",
    description:
      "We help determine whether you fit best as a creator affiliate, promotional affiliate, community promoter, blogger, or future ambassador.",
  },
  {
    step: "03",
    title: "Promote SitGuru",
    description:
      "Share SitGuru through posts, videos, blogs, newsletters, local campaigns, community groups, or partner-friendly promotions.",
  },
  {
    step: "04",
    title: "Grow with the network",
    description:
      "As SitGuru expands, affiliates may grow through campaigns, referrals, co-marketing, audience engagement, and future promotional opportunities.",
  },
];

const contentIdeas = [
  "Pet parent tips",
  "Dog walking reminders",
  "Pet sitting travel posts",
  "Local pet care guides",
  "Student side-money content",
  "Military-friendly opportunity posts",
  "Community pet care resources",
  "Referral and promo campaigns",
];

const trustPoints = [
  {
    title: "Clear, honest promotion",
    description:
      "Affiliates should promote SitGuru in a clear, accurate, and trustworthy way that does not mislead pet parents, Gurus, applicants, or partners.",
    icon: <ClipboardCheck size={22} />,
  },
  {
    title: "Pet care confidence",
    description:
      "SitGuru’s brand is built around trust, safety, local care, and simple pet care access for modern pet parents and Gurus.",
    icon: <ShieldCheck size={22} />,
  },
  {
    title: "Community-first growth",
    description:
      "The best affiliates help SitGuru grow by connecting real pet families, local communities, and service-minded people.",
    icon: <Heart size={22} />,
  },
];

const faqs = [
  {
    question: "Who is the Affiliate Program for?",
    answer:
      "The Affiliate Program is for creators, influencers, bloggers, social media promoters, newsletter owners, podcast hosts, affiliate marketers, community pages, and promotional partners who want to help advertise SitGuru.",
  },
  {
    question: "Is this the same as becoming a Guru?",
    answer:
      "No. Becoming a Guru is for people who want to provide pet care services. The Affiliate Program is for people or channels that want to promote SitGuru and help grow awareness.",
  },
  {
    question: "Is this the same as the Partner Network?",
    answer:
      "Not exactly. The Partner Network is mainly for organizations, pet care businesses, schools, nonprofits, local businesses, national brands, and community partners. The Affiliate Program is focused on promotional reach, content, referrals, and campaigns.",
  },
  {
    question: "Can pet stores, veterinarians, or brands also be affiliates?",
    answer:
      "Yes. Some organizations may fit both the Partner Network and Affiliate Program. SitGuru can help route each relationship to the best path.",
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

export default function AffiliateProgramPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <section className="overflow-hidden border-b border-emerald-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              <Sparkles size={15} />
              SitGuru Affiliate Program
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Promote SitGuru. Grow your reach. Help more pet families connect
              with trusted care.
            </h1>

            <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              SitGuru’s Affiliate Program is built for creators, influencers,
              bloggers, social media promoters, newsletters, podcasters, pet
              content pages, community voices, and promotional partners who want
              to share SitGuru with their audience.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#join-affiliate-program"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900"
              >
                Join the Affiliate Program
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/partners"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                Explore Partner Network
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <Pill>Creators</Pill>
              <Pill>Influencers</Pill>
              <Pill>Bloggers</Pill>
              <Pill>Social media</Pill>
              <Pill>Newsletters</Pill>
              <Pill>Podcasts</Pill>
              <Pill>Promo partners</Pill>
              <Pill>Pet content</Pill>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/50 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-200/60 blur-3xl" />

            <div className="relative rounded-[2rem] border border-emerald-100 bg-[#f8fff9] p-5 shadow-2xl shadow-emerald-950/10">
              <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm">
                <div className="relative h-72 w-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1100&q=80"
                    alt="Happy dogs outside representing pet-friendly affiliate content"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                      Promote pet care people trust
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-white">
                      Share SitGuru with your audience.
                    </h2>
                  </div>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  {[
                    ["Creators", "Content, social, video, and storytelling"],
                    ["Affiliates", "Referral, promo, and campaign growth"],
                    [
                      "Communities",
                      "Local pages, groups, and neighborhood reach",
                    ],
                    [
                      "Pet audiences",
                      "Pet parents, Gurus, and partner networks",
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

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-emerald-800 p-4 text-white">
                  <Share2 size={22} />
                  <p className="mt-3 text-2xl font-black">Share</p>
                  <p className="mt-1 text-xs font-bold text-emerald-50">
                    Promote SitGuru through your best channels.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950 p-4 text-white">
                  <Radio size={22} />
                  <p className="mt-3 text-2xl font-black">Reach</p>
                  <p className="mt-1 text-xs font-bold text-slate-200">
                    Connect pet parents and communities.
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-400 p-4 text-slate-950">
                  <Trophy size={22} />
                  <p className="mt-3 text-2xl font-black">Grow</p>
                  <p className="mt-1 text-xs font-bold text-amber-950">
                    Build future shared-growth opportunities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <SectionHeader
          eyebrow="Why join"
          title="A pet-friendly affiliate program built for real community growth."
          description="SitGuru gives affiliates a brand that is easy to talk about: trusted pet care, flexible local opportunities, community connection, and modern convenience for pet parents."
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
            eyebrow="Affiliate types"
            title="Built for creators, publishers, promoters, and community voices."
            description="The Affiliate Program supports many types of promotional growth partners. Some affiliates create content. Some run campaigns. Some grow through community reach."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {affiliateTypes.map((type) => (
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
              Content that connects
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Easy to promote because pet care is personal.
            </h2>
            <p className="mt-5 text-base font-semibold leading-7 text-slate-600">
              Affiliates can help SitGuru reach pet parents, future Gurus,
              partner organizations, student communities, military-connected
              families, and local neighborhoods through content people actually
              care about.
            </p>

            <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-sm">
              <div className="relative h-72 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=1100&q=80"
                  alt="Dog with pet parent at home"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-sm font-black text-white">
                    Real pet care moments make strong content.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {contentIdeas.map((idea) => (
              <div
                key={idea}
                className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm"
              >
                <div className="flex gap-3">
                  <MessageCircleHeart className="mt-0.5 shrink-0 text-emerald-700" />
                  <p className="text-sm font-black leading-6 text-slate-800">
                    {idea}
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
            title="A simple path from audience to shared growth."
            description="SitGuru’s affiliate path is designed to be flexible enough for creators, promotional affiliates, local pages, bloggers, newsletters, and community promoters."
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
              Affiliates promote. Partners collaborate. Ambassadors represent.
            </h2>

            <p
              className="mt-5 text-base font-semibold leading-7"
              style={{
                color: "#ecfdf5",
                WebkitTextFillColor: "#ecfdf5",
              }}
            >
              SitGuru has multiple growth pathways, but each one serves a
              different purpose. We help route people and organizations to the
              right fit.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              [
                "Affiliates",
                "Creators, influencers, bloggers, promoters, and content channels.",
                <Megaphone key="affiliate" size={22} />,
              ],
              [
                "Partners",
                "Organizations, brands, schools, pet care businesses, nonprofits, and community groups.",
                <Handshake key="partner" size={22} />,
              ],
              [
                "Ambassadors",
                "Gurus, students, community advocates, and local referral champions.",
                <Gift key="ambassador" size={22} />,
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
          title="Affiliate Program FAQ"
          description="A few quick answers to help creators, promoters, and community voices understand where the Affiliate Program fits."
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
        id="join-affiliate-program"
        className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 lg:px-10"
      >
        <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
                <Trophy size={15} />
                Join the Affiliate Program
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Help SitGuru grow through content, community, referrals, and
                trusted promotion.
              </h2>

              <p className="mt-5 text-base font-semibold leading-7 text-slate-600">
                If you are a creator, influencer, blogger, affiliate marketer,
                local promoter, pet content page, newsletter, podcast, or
                community voice, SitGuru wants to hear how you can help share
                trusted pet care with more people.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Creator and influencer campaigns",
                  "Social media promotion",
                  "Blog and newsletter features",
                  "Pet parent education content",
                  "Referral and promo opportunities",
                  "Local community awareness",
                  "Pet care and lifestyle audiences",
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
                  href="/partners"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                >
                  Partner Network
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="bg-[#f8fff9] p-6 sm:p-8 lg:p-10">
              <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
                <Store className="text-emerald-800" size={34} />

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  Built for promotional growth partners.
                </h3>

                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  SitGuru is creating a flexible affiliate path for people and
                  channels that can help grow awareness, share trusted pet care
                  resources, and connect audiences with a platform built for pet
                  parents and Gurus.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    ["Creators", "Share pet-friendly content and campaigns."],
                    [
                      "Influencers",
                      "Introduce SitGuru to engaged audiences.",
                    ],
                    [
                      "Bloggers",
                      "Write helpful pet care and local resource content.",
                    ],
                    [
                      "Promoters",
                      "Support campaigns, referrals, and visibility.",
                    ],
                    [
                      "Newsletters",
                      "Feature SitGuru in trusted audience updates.",
                    ],
                    [
                      "Community pages",
                      "Help local pet parents discover SitGuru.",
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