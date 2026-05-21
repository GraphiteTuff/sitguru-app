import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Gift,
  HeartHandshake,
  Megaphone,
  PenLine,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
  Video,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Affiliate Program | SitGuru",
  description:
    "Join the SitGuru Affiliate Program and help Pet Parents and Pet Gurus discover trusted local pet care.",
};

type IconCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

const affiliateTypes = [
  {
    title: "Creators & Influencers",
    description:
      "Pet creators, lifestyle influencers, TikTokers, Instagram pages, YouTubers, and local personalities who want to share SitGuru with their audience.",
    icon: <Video className="h-6 w-6" />,
  },
  {
    title: "Bloggers & Publishers",
    description:
      "Pet blogs, local guides, newsletters, review sites, family blogs, and community publishers that can introduce SitGuru through helpful content.",
    icon: <PenLine className="h-6 w-6" />,
  },
  {
    title: "Local Businesses",
    description:
      "Pet stores, groomers, trainers, apartment communities, rescues, schools, local brands, and neighborhood partners.",
    icon: <Store className="h-6 w-6" />,
  },
  {
    title: "Community Promoters",
    description:
      "People who can spread SitGuru through local groups, events, campuses, pet communities, QR codes, flyers, and word of mouth.",
    icon: <UsersRound className="h-6 w-6" />,
  },
];

const ambassadorPaths = [
  {
    title: "Student Hire",
    description:
      "Great for students who want to promote SitGuru through campuses, clubs, events, social posts, and local pet communities.",
  },
  {
    title: "Community Hire",
    description:
      "Great for local connectors, neighborhood promoters, parent groups, pet groups, community leaders, and event helpers.",
  },
  {
    title: "Military Hire",
    description:
      "Great for military spouses, veterans, service members, and military-connected communities who want to support SitGuru growth.",
  },
];

const benefits = [
  "Promote a launched pet care platform",
  "Help Pet Parents find trusted local care",
  "Help Pet Gurus get discovered",
  "Share SitGuru through social media, blogs, QR codes, local groups, and events",
  "Support student, community, and military ambassador opportunities",
  "Grow with a pet care brand built around trust and community",
];

const steps = [
  {
    step: "01",
    title: "Apply or reach out",
    description:
      "Tell us who you are, where you promote, and how you want to help SitGuru grow.",
  },
  {
    step: "02",
    title: "Choose your path",
    description:
      "We help match you with the best affiliate, ambassador, community, or partner opportunity.",
  },
  {
    step: "03",
    title: "Share SitGuru",
    description:
      "Promote SitGuru through posts, videos, blogs, newsletters, flyers, QR codes, local groups, events, or referrals.",
  },
  {
    step: "04",
    title: "Grow with us",
    description:
      "As SitGuru expands, affiliates and ambassadors can support more Pet Parents, Pet Gurus, and local communities.",
  },
];

const faqs = [
  {
    question: "Is this different from becoming a Pet Guru?",
    answer:
      "Yes. Pet Gurus provide pet care. Affiliates help promote SitGuru. You can be both if you want to offer care and also help spread the word.",
  },
  {
    question: "Who should apply?",
    answer:
      "Creators, influencers, bloggers, students, military-connected promoters, local businesses, community leaders, pet groups, and people who want to help SitGuru grow.",
  },
  {
    question: "Is SitGuru already launched?",
    answer:
      "Yes. SitGuru is live, so affiliates and ambassadors can start helping people discover the platform now.",
  },
  {
    question: "Can businesses partner with SitGuru?",
    answer:
      "Yes. Pet stores, groomers, trainers, apartment communities, rescues, schools, and local brands may fit as affiliates, ambassadors, or partners.",
  },
];

function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 text-base font-semibold leading-7 text-slate-600 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

function IconCard({ title, description, icon }: IconCardProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>

      <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export default function AffiliateProgramPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e9fbf8] via-white to-[#f3fbff] text-slate-950">
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
            <Sparkles className="h-4 w-4" />
            SitGuru Affiliate Program
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Help more pet families discover SitGuru.
          </h1>

          <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Join the SitGuru Affiliate Program to promote a live pet care
            platform built for Pet Parents, Pet Gurus, local communities, and
            trusted pet care connections.
          </p>

          <div className="mt-8 grid w-full max-w-sm gap-3 sm:flex sm:max-w-none">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-4 text-base font-black text-white shadow-lg transition hover:bg-emerald-700"
            >
              Join SitGuru
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/partners"
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-7 py-4 text-base font-black text-slate-800 shadow-sm transition hover:border-emerald-400"
            >
              View Partners
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-950 p-6 shadow-xl sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <Gift className="h-6 w-6" />
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-300">
                Built for growth
              </p>

              <h2
                className="text-2xl font-black"
                style={{ color: "#ffffff" }}
              >
                Share SitGuru your way.
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex gap-3 rounded-2xl bg-white/10 p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

                <p
                  className="text-sm font-semibold leading-6"
                  style={{ color: "rgba(255, 255, 255, 0.92)" }}
                >
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 sm:pb-20 lg:px-8">
        <SectionHeader
          eyebrow="Who it is for"
          title="Affiliates, ambassadors, creators, and local promoters."
          description="SitGuru is looking for people and organizations that can help introduce Pet Parents and Pet Gurus to the platform."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {affiliateTypes.map((type) => (
            <IconCard
              key={type.title}
              title={type.title}
              description={type.description}
              icon={type.icon}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 sm:pb-20 lg:px-8">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-10">
          <SectionHeader
            eyebrow="Ambassador paths"
            title="Three simple ways to help SitGuru grow."
            description="These ambassador paths help organize outreach opportunities for students, community promoters, and military-connected supporters."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {ambassadorPaths.map((path) => (
              <div
                key={path.title}
                className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                  <BadgeCheck className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-950">
                  {path.title}
                </h3>

                <p className="mt-3 text-base leading-7 text-slate-700">
                  {path.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 sm:pb-20 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="Easy to start. Easy to share."
          description="The affiliate program is designed to be simple, flexible, and easy to understand on mobile."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <div
              key={item.step}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
            >
              <div className="text-sm font-black text-emerald-700">
                {item.step}
              </div>

              <h3 className="mt-3 text-xl font-black text-slate-950">
                {item.title}
              </h3>

              <p className="mt-3 text-base leading-7 text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 sm:pb-20 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <IconCard
            title="Promote with trust"
            description="Affiliates should share SitGuru clearly and honestly so Pet Parents, Pet Gurus, and partners understand what the platform offers."
            icon={<ShieldCheck className="h-6 w-6" />}
          />

          <IconCard
            title="Support local care"
            description="SitGuru helps people discover dog walking, pet sitting, boarding, training, drop-in visits, and everyday pet care support."
            icon={<HeartHandshake className="h-6 w-6" />}
          />

          <IconCard
            title="Build community"
            description="The best affiliates help SitGuru grow through real relationships, local awareness, useful content, and community connection."
            icon={<Share2 className="h-6 w-6" />}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 sm:pb-20 lg:px-8">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-10">
          <SectionHeader
            eyebrow="Questions"
            title="Affiliate Program FAQs"
            description="Quick answers for people interested in promoting SitGuru."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-6"
              >
                <h3 className="text-lg font-black text-slate-950">
                  {faq.question}
                </h3>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="rounded-[2rem] bg-slate-950 p-6 shadow-xl sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">
                Get started
              </p>

              <h2
                className="mt-3 text-3xl font-black tracking-tight sm:text-4xl"
                style={{ color: "#ffffff" }}
              >
                Ready to help SitGuru grow?
              </h2>

              <p
                className="mt-5 text-base font-semibold leading-7 sm:text-lg sm:leading-8"
                style={{ color: "rgba(255, 255, 255, 0.92)" }}
              >
                Join SitGuru and start helping more Pet Parents and Pet Gurus
                discover trusted local pet care.
              </p>
            </div>

            <div className="grid gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-center text-base font-black text-white shadow-lg transition hover:bg-emerald-400"
              >
                Join SitGuru
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-8 py-4 text-center text-base font-black text-white transition hover:bg-white/20"
              >
                Contact Us
                <Megaphone className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}