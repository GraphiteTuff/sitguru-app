import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  ClipboardCheck,
  Copy,
  Gift,
  Handshake,
  Mail,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

const partnerStats = [
  {
    label: "Partner Status",
    value: "Active",
    helper: "Your SitGuru Network profile is ready",
    icon: ShieldCheck,
  },
  {
    label: "Referrals",
    value: "0",
    helper: "Tracked partner referrals",
    icon: Users,
  },
  {
    label: "Pending Rewards",
    value: "$0",
    helper: "Rewards awaiting approval",
    icon: Gift,
  },
  {
    label: "Campaigns",
    value: "0",
    helper: "Active partner campaigns",
    icon: Megaphone,
  },
];

const actionCards = [
  {
    title: "Share your partner link",
    description:
      "Use your SitGuru Network link to invite Gurus, pet parents, partners, and local pet-care communities.",
    href: "/partners/dashboard/referrals",
    icon: Copy,
    cta: "Open referrals",
  },
  {
    title: "Track rewards",
    description:
      "Review earned rewards, pending rewards, payout progress, and campaign performance.",
    href: "/partners/dashboard/rewards",
    icon: BadgeDollarSign,
    cta: "View rewards",
  },
  {
    title: "Review campaigns",
    description:
      "See partner campaigns, ambassador programs, affiliate activity, and network growth opportunities.",
    href: "/partners/dashboard/campaigns",
    icon: BarChart3,
    cta: "View campaigns",
  },
];

const quickLinks = [
  {
    label: "Partner Application",
    href: "/partners/apply",
    icon: ClipboardCheck,
  },
  {
    label: "Referrals",
    href: "/partners/dashboard/referrals",
    icon: Users,
  },
  {
    label: "Rewards",
    href: "/partners/dashboard/rewards",
    icon: Gift,
  },
  {
    label: "Contact SitGuru",
    href: "/contact",
    icon: Mail,
  },
];

export default function PartnerDashboardPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f4] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-[#dfe7df] bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.24),_transparent_34%),linear-gradient(135deg,#064e3b_0%,#047857_55%,#065f46_100%)] p-8 text-white sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white shadow-sm backdrop-blur">
                <Handshake className="h-4 w-4" />
                SitGuru Network Program
              </span>

              <h1 className="mt-8 max-w-2xl text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
                Partner Dashboard
              </h1>

              <p className="mt-5 max-w-2xl text-base font-bold leading-7 text-white/90">
                Track your SitGuru partner growth, referrals, rewards, campaigns,
                and network program activity from one simple dashboard.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/partners/dashboard/referrals"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-emerald-50"
                >
                  Share referral link
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white shadow-sm backdrop-blur transition hover:bg-white/15"
                >
                  Back to homepage
                </Link>
              </div>
            </div>

            <div className="p-8 sm:p-10">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-green-700">
                Network Overview
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-green-950">
                Partner growth center
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Use this dashboard to manage the relationship between SitGuru,
                ambassadors, affiliates, referral partners, local businesses, and
                community growth programs.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {quickLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 rounded-2xl border border-[#dfe7df] bg-[#f7f8f4] p-4 text-sm font-black text-green-950 transition hover:border-green-300 hover:bg-green-50"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-green-800 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </span>
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {partnerStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-[1.5rem] border border-[#dfe7df] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-600">
                      {stat.label}
                    </p>

                    <p className="mt-3 text-3xl font-black text-green-950">
                      {stat.value}
                    </p>

                    <p className="mt-2 text-sm font-bold text-slate-500">
                      {stat.helper}
                    </p>
                  </div>

                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-green-800">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {actionCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-[2rem] border border-[#dfe7df] bg-white p-6 shadow-sm transition hover:border-green-300 hover:bg-green-50"
              >
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-green-800 text-white shadow-sm">
                  <Icon className="h-6 w-6" />
                </span>

                <h3 className="mt-5 text-2xl font-black tracking-tight text-green-950">
                  {card.title}
                </h3>

                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  {card.description}
                </p>

                <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-green-800">
                  {card.cta}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </section>

        <section className="rounded-[2rem] border border-[#dfe7df] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-green-700">
                Program Notes
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                SitGuru Network Program
              </h2>

              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Partner dashboards can be wired into admin tracking for referrals,
                ambassadors, affiliates, rewards, campaign clicks, partner payouts,
                and approval workflows.
              </p>
            </div>

            <Link
              href="/partners/apply"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-green-900"
            >
              <Sparkles className="h-4 w-4" />
              Apply or update profile
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}