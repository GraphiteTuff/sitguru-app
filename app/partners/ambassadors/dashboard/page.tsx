import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Gift,
  Globe2,
  Home,
  Link2,
  MapPin,
  MessageCircle,
  MousePointerClick,
  PawPrint,
  QrCode,
  Share2,
  ShieldCheck,
  Star,
  Trophy,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ambassador = {
  name: "Sarah M.",
  title: "SitGuru Ambassador",
  city: "Doylestown, PA",
  tier: "Gold Tier",
  memberSince: "Jan 2025",
  points: 2150,
  nextTierPoints: 2500,
  cityRank: "Top 8%",
  profileImage:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
};

const metrics = [
  {
    label: "Clicks",
    value: "12,450",
    change: "18%",
    icon: MousePointerClick,
  },
  {
    label: "Qualified Referrals",
    value: "2,384",
    change: "21%",
    icon: Users,
  },
  {
    label: "First Bookings",
    value: "1,106",
    change: "16%",
    icon: CalendarDays,
  },
  {
    label: "Approved Partners",
    value: "128",
    change: "11%",
    icon: ShieldCheck,
  },
  {
    label: "Pending Rewards",
    value: "$1,248",
    change: "3 rewards pending",
    icon: Gift,
    isMoney: true,
  },
];

const referralLinks = [
  {
    title: "Customer Referral Link",
    description: "For pet parents to get $20 off their first booking.",
    url: "sitguru.com/r/sarahm",
    icon: Users,
  },
  {
    title: "Guru Referral Link",
    description: "Invite new Gurus to join the SitGuru community.",
    url: "sitguru.com/g/sarahm",
    icon: PawPrint,
  },
  {
    title: "Partner Referral Link",
    description: "Invite local businesses to join our Partner Network.",
    url: "sitguru.com/p/sarahm",
    icon: Building2,
  },
];

const localLeads = [
  {
    business: "Dogs & Cats Rule",
    category: "Pet Store",
    city: "Doylestown, PA",
    status: "Contacted",
    lastActivity: "May 15, 2025",
  },
  {
    business: "Happy Paws Grooming",
    category: "Grooming",
    city: "Newtown, PA",
    status: "Applied",
    lastActivity: "May 12, 2025",
  },
  {
    business: "Bucks County Rescue",
    category: "Rescue",
    city: "Yardley, PA",
    status: "Active",
    lastActivity: "May 8, 2025",
  },
];

const toolkitItems = [
  {
    title: "Flyer",
    type: "PDF",
    icon: ClipboardList,
  },
  {
    title: "QR Poster",
    type: "PDF",
    icon: QrCode,
  },
  {
    title: "Email Copy",
    type: "DOCX",
    icon: MessageCircle,
  },
  {
    title: "Social Post Templates",
    type: "ZIP",
    icon: Share2,
  },
];

const goals = [
  {
    title: "Refer 5 New Partners",
    progress: "3 / 5",
    percent: 60,
    reward: "$250 Bonus",
  },
  {
    title: "Earn 2,500 Points",
    progress: "2,150 / 2,500",
    percent: 86,
    reward: "Gold Tier",
  },
  {
    title: "Attend Partner Webinar",
    progress: "0 / 1",
    percent: 0,
    reward: "100 Points",
  },
];

const messages = [
  {
    title: "New Bonus Opportunity!",
    body: "Earn 2x rewards on partner referrals this month.",
    date: "May 15, 2025",
  },
  {
    title: "Partner Spotlight: Happy Paws Grooming",
    body: "Check out how they’re growing with SitGuru.",
    date: "May 12, 2025",
  },
  {
    title: "City Captain Challenge is Live!",
    body: "Top ambassadors in each city earn big.",
    date: "May 9, 2025",
  },
];

export default function AmbassadorDashboardPage() {
  const pointPercent = Math.min(
    100,
    Math.round((ambassador.points / ambassador.nextTierPoints) * 100),
  );

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-green-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/images/sitguru-logo-cropped.png"
              alt="SitGuru"
              className="h-10 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-black text-slate-700 lg:flex">
            <Link href="/" className="hover:text-green-800">
              Home
            </Link>
            <Link href="/search" className="hover:text-green-800">
              Find a Guru
            </Link>
            <Link href="/guru" className="hover:text-green-800">
              Gurus
            </Link>
            <Link href="/partners" className="text-green-800">
              Partner Network
            </Link>
            <Link href="/referrals" className="hover:text-green-800">
              Referrals
            </Link>
          </nav>

          <Link
            href="/partners/ambassadors"
            className="hidden rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900 sm:inline-flex"
          >
            Ambassador Program
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Link
            href="/partners/ambassadors"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2.5 text-sm font-black text-green-900 shadow-sm transition hover:border-green-700 hover:bg-green-50"
          >
            <ArrowLeft size={17} />
            Back to Ambassador Program
          </Link>

          <Link
            href="/partners"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-green-900"
          >
            <Home size={16} />
            Partner Network
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Welcome back, {ambassador.name.replace(".", "")} —
                  </p>

                  <h1 className="mt-2 flex flex-wrap items-center gap-3 text-4xl font-black leading-tight tracking-tight text-green-950 sm:text-5xl">
                    Ambassador Hub
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-green-100">
                      🐾
                    </span>
                  </h1>

                  <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-slate-600">
                    Here&apos;s your impact, referral activity, local business
                    leads, rewards, tools, and messages at a glance.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/partners/ambassadors"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:border-green-700 hover:bg-green-50"
                  >
                    View Program
                    <ArrowUpRight size={16} />
                  </Link>

                  <Link
                    href="/partners"
                    className="inline-flex items-center justify-center rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
                  >
                    Share SitGuru
                  </Link>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {metrics.map((metric) => {
                  const Icon = metric.icon;

                  return (
                    <div
                      key={metric.label}
                      className="rounded-[24px] border border-green-100 bg-[#fbfcf9] p-5 text-center shadow-sm"
                    >
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-800 text-white">
                        <Icon size={24} />
                      </div>

                      <p className="mt-4 text-sm font-black text-slate-600">
                        {metric.label}
                      </p>

                      <p className="mt-2 text-3xl font-black text-green-950">
                        {metric.value}
                      </p>

                      <p
                        className={`mt-2 text-xs font-black ${
                          metric.isMoney ? "text-orange-600" : "text-green-700"
                        }`}
                      >
                        {metric.isMoney ? metric.change : `↑ ${metric.change} vs last 30 days`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-3xl font-black text-green-950">
                    Referral Links
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Share your unique links and QR codes to grow SitGuru in your
                    community.
                  </p>
                </div>

                <Link
                  href="/referrals"
                  className="text-sm font-black text-green-800"
                >
                  View all links →
                </Link>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {referralLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[24px] border border-green-100 bg-[#fbfcf9] p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-800">
                          <Icon size={21} />
                        </div>

                        <div>
                          <h3 className="font-black text-green-950">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-blue-700 shadow-sm">
                        {item.url}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-100 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-green-50">
                          <Link2 size={16} />
                          Copy
                        </button>

                        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-100 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-green-50">
                          <QrCode size={16} />
                          QR
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-3xl font-black text-green-950">
                    Local Business Leads
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Track businesses you&apos;ve connected with and their
                    application status.
                  </p>
                </div>

                <Link
                  href="/partners/local"
                  className="text-sm font-black text-green-800"
                >
                  View all leads →
                </Link>
              </div>

              <div className="mt-6 overflow-hidden rounded-[24px] border border-green-100">
                <div className="hidden grid-cols-[1.3fr_1fr_1fr_0.8fr_1fr] bg-green-50 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-green-900 md:grid">
                  <span>Business</span>
                  <span>Category</span>
                  <span>City</span>
                  <span>Status</span>
                  <span>Last Activity</span>
                </div>

                <div className="divide-y divide-green-100">
                  {localLeads.map((lead) => (
                    <div
                      key={lead.business}
                      className="grid gap-3 bg-white p-4 md:grid-cols-[1.3fr_1fr_1fr_0.8fr_1fr] md:items-center"
                    >
                      <div>
                        <p className="font-black text-green-950">
                          {lead.business}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Local partner lead
                        </p>
                      </div>

                      <p className="text-sm font-bold text-slate-700">
                        {lead.category}
                      </p>

                      <p className="text-sm font-bold text-slate-700">
                        {lead.city}
                      </p>

                      <StatusPill status={lead.status} />

                      <p className="text-sm font-bold text-slate-600">
                        {lead.lastActivity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href="/partners/local"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:border-green-700 hover:bg-green-50"
                >
                  Add New Lead
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-green-950">
                      Rewards & Payouts
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      See your earnings and payout status.
                    </p>
                  </div>

                  <Link
                    href="/partners/ambassadors"
                    className="text-sm font-black text-green-800"
                  >
                    View details →
                  </Link>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <MiniReward label="Pending" value="$1,248" detail="3 rewards" />
                  <MiniReward label="Approved" value="$2,460" detail="8 rewards" />
                  <MiniReward label="Paid" value="$48,762" detail="24 payouts" />
                </div>

                <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-black text-green-900">
                    <CalendarDays size={17} />
                    Next payout scheduled for May 30, 2025
                  </p>
                </div>
              </section>

              <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-green-950">
                      Toolkit Downloads
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Everything you need to promote SitGuru.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {toolkitItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.title}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-green-100 bg-[#fbfcf9] p-4 text-left transition hover:bg-green-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-800">
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-green-950">
                              {item.title}
                            </p>
                            <p className="text-xs font-semibold text-slate-500">
                              {item.type}
                            </p>
                          </div>
                        </div>

                        <Download size={16} className="text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-green-950">
                      Leaderboard / Tier Progress
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Your progress toward the next tier.
                    </p>
                  </div>

                  <Link
                    href="/partners/ambassadors"
                    className="text-sm font-black text-green-800"
                  >
                    View leaderboard →
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-3 text-center">
                  {["Bronze", "Silver", "Gold", "City Captain"].map((tier) => (
                    <div key={tier}>
                      <div
                        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${
                          tier === "Gold"
                            ? "border-yellow-300 bg-yellow-100 text-yellow-700"
                            : tier === "City Captain"
                              ? "border-green-300 bg-green-100 text-green-800"
                              : "border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Trophy size={22} />
                      </div>
                      <p className="mt-2 text-xs font-black text-slate-700">
                        {tier}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm font-black">
                    <span className="text-green-950">
                      Your Progress: {numberWithCommas(ambassador.points)} pts
                    </span>
                    <span className="text-slate-500">
                      {ambassador.nextTierPoints - ambassador.points} pts to Gold
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-green-100">
                    <div
                      className="h-full rounded-full bg-green-800"
                      style={{ width: `${pointPercent}%` }}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-green-950">
                      Messages from SitGuru Admin
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Stay updated on program news and opportunities.
                    </p>
                  </div>

                  <Link
                    href="/messages"
                    className="text-sm font-black text-green-800"
                  >
                    View all messages →
                  </Link>
                </div>

                <div className="mt-6 space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.title}
                      className="flex gap-3 rounded-2xl border border-green-100 bg-[#fbfcf9] p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                        🐾
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-black text-green-950">
                            {message.title}
                          </p>
                          <p className="shrink-0 text-xs font-bold text-slate-500">
                            {message.date}
                          </p>
                        </div>

                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                          {message.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-green-100 bg-white p-6 text-center shadow-sm">
              <img
                src={ambassador.profileImage}
                alt={ambassador.name}
                className="mx-auto h-28 w-28 rounded-full object-cover"
              />

              <h2 className="mt-4 text-2xl font-black text-green-950">
                {ambassador.name}
              </h2>

              <p className="mt-1 text-sm font-bold text-slate-600">
                {ambassador.title}
              </p>

              <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-2xl bg-yellow-100 px-4 py-2 text-sm font-black text-yellow-800">
                🏆 {ambassador.tier}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-green-100 pt-5">
                <div>
                  <p className="text-2xl font-black text-green-950">
                    {numberWithCommas(ambassador.points)}
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    Total Points
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-black text-green-950">
                    {ambassador.cityRank}
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    City Rank
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-green-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-800">
                  <MapPin size={22} />
                </div>

                <div>
                  <h3 className="text-lg font-black text-green-950">
                    Your City & Territory
                  </h3>
                  <p className="mt-2 text-xl font-black text-slate-800">
                    {ambassador.city}
                  </p>
                  <Link
                    href="/partners/ambassadors"
                    className="mt-3 inline-flex text-sm font-black text-green-800"
                  >
                    View or update territory →
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-green-100 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-black text-green-950">
                Upcoming Goals
              </h3>

              <p className="mt-2 text-sm font-semibold text-slate-600">
                Keep going! You&apos;re on track.
              </p>

              <div className="mt-5 space-y-5">
                {goals.map((goal) => (
                  <div key={goal.title}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-slate-800">
                        {goal.title}
                      </p>
                      <p className="text-sm font-black text-slate-600">
                        {goal.progress}
                      </p>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-green-100">
                      <div
                        className="h-full rounded-full bg-green-800"
                        style={{ width: `${goal.percent}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Reward: {goal.reward}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/partners/ambassadors"
                className="mt-6 inline-flex text-sm font-black text-green-800"
              >
                View all goals →
              </Link>
            </section>

            <section className="rounded-[32px] border border-green-100 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-black text-green-950">
                Quick Actions
              </h3>

              <div className="mt-5 space-y-3">
                <ActionButton icon={<Share2 size={18} />} label="Share Your Links" />
                <ActionButton icon={<Building2 size={18} />} label="Invite a Business" />
                <ActionButton icon={<QrCode size={18} />} label="Download QR Kit" />
                <ActionButton icon={<Globe2 size={18} />} label="View Partner Network" />
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const classes =
    status === "Active"
      ? "border-green-200 bg-green-50 text-green-800"
      : status === "Applied"
        ? "border-purple-200 bg-purple-50 text-purple-800"
        : "border-blue-200 bg-blue-50 text-blue-800";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${classes}`}
    >
      {status}
    </span>
  );
}

function MiniReward({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-[#fbfcf9] p-4 text-center">
      <p
        className={`text-sm font-black ${
          label === "Pending"
            ? "text-orange-600"
            : label === "Approved"
              ? "text-green-700"
              : "text-slate-600"
        }`}
      >
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-green-950">{value}</p>

      <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
    </div>
  );
}

function ActionButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="flex w-full items-center gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-left text-sm font-black text-green-900 transition hover:border-green-300 hover:bg-green-100">
      {icon}
      {label}
    </button>
  );
}

function numberWithCommas(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}