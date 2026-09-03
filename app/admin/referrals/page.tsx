import Link from "next/link";
import {
  BadgeDollarSign,
  ClipboardList,
  Gift,
  HandCoins,
  HeartHandshake,
  Megaphone,
  MousePointerClick,
  PawPrint,
  Plus,
  QrCode,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  GrowthCard,
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import { getReferralsDashboardData } from "@/lib/admin/referrals/dashboard";

export const dynamic = "force-dynamic";

const routes = {
  codes: "/admin/referrals/codes",
  gurus: "/admin/referrals/gurus",
  petParents: "/admin/referrals/pet-parents",
  ambassadors: "/admin/referrals/ambassadors",
  partners: "/admin/referrals/partners",
  applications: "/admin/referrals/applications",
  payouts: "/admin/referrals/payouts",
  inventory: "/admin/referrals/inventory",
  rewards: "/admin/rewards",
  salesMarketing: "/admin/sales-marketing",
  financials: "/admin/financials",
  ambassadorLeads: "/admin/ambassador-leads",
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function prettyWeekday(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function formatWhen(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function eventLabel(value: string) {
  const raw = value.replace(/_/g, " ");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default async function AdminGrowthReferralsHubPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
            Access Restricted
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Admin access required.
          </h1>
        </div>
      </div>
    );
  }

  const data = await getReferralsDashboardData();
  const today = new Date().toISOString().slice(0, 10);
  const todayBucket = data.weekDays.find((day) => day.day === today);
  const todayHits = (todayBucket?.visits || 0) + (todayBucket?.scans || 0);
  const healthy = data.sourceHealth.filter((source) => source.ok).length;

  const tiles = [
    {
      label: "Link visits",
      value: number(data.metrics.linkVisits),
      helper: `${number(data.weekVisits)} this week`,
      tone: "violet" as const,
      icon: <MousePointerClick size={18} />,
    },
    {
      label: "QR scans",
      value: number(data.metrics.qrScans),
      helper: `${number(data.weekScans)} this week`,
      tone: "sky" as const,
      icon: <QrCode size={18} />,
    },
    {
      label: "Active codes",
      value: number(data.metrics.activeCodes),
      helper: `${number(data.metrics.totalCodes)} in registry`,
      tone: "emerald" as const,
      icon: <ClipboardList size={18} />,
    },
    {
      label: "PawPerks codes",
      value: number(data.metrics.canonicalCodes),
      helper: "Canonical account codes",
      tone: "emerald" as const,
      icon: <Gift size={18} />,
    },
    {
      label: "Relationships",
      value: number(data.metrics.relationships),
      helper: "First-touch pairs",
      tone: "slate" as const,
      icon: <Users size={18} />,
    },
    {
      label: "Needs review",
      value: number(data.metrics.needsReview),
      helper: "Codes or payouts",
      tone: "amber" as const,
      icon: <ClipboardList size={18} />,
    },
    {
      label: "Conflicts",
      value: number(data.metrics.openConflicts),
      helper: "PawPerks inventory",
      tone: "rose" as const,
      icon: <ShieldAlert size={18} />,
    },
    {
      label: "Reward review",
      value: number(data.metrics.rewardReview),
      helper: `${number(data.metrics.paidRewards)} paid`,
      tone: "amber" as const,
      icon: <HandCoins size={18} />,
    },
  ];

  const actions = [
    {
      href: `${routes.codes}#generate-code`,
      label: "Generate a code",
      detail: "Issue a live referral code now",
      icon: Plus,
      primary: true,
    },
    {
      href: routes.codes,
      label: "Code Registry",
      detail: "Edit, archive, and audit codes",
      icon: ClipboardList,
    },
    {
      href: routes.petParents,
      label: "PawPerks / Pet Parents",
      detail: "Parent codes and attribution",
      icon: Gift,
    },
    {
      href: routes.ambassadors,
      label: "Ambassador referrals",
      detail: "Codes, links, conversions",
      icon: HeartHandshake,
    },
    {
      href: routes.gurus,
      label: "Guru referrals",
      detail: "Guru ledger and payouts",
      icon: PawPrint,
    },
    {
      href: routes.partners,
      label: "Partner / clinic codes",
      detail: "Clinic and partner programs",
      icon: Users,
    },
    {
      href: routes.inventory,
      label: "PawPerks inventory",
      detail: "Conflicts, missing codes, cleanup",
      icon: ShieldAlert,
    },
    {
      href: routes.payouts,
      label: "Payouts",
      detail: "Reward readiness",
      icon: HandCoins,
    },
    {
      href: routes.rewards,
      label: "Rewards auditor",
      detail: "Shared links and exceptions",
      icon: BadgeDollarSign,
    },
  ];

  const programs = [
    {
      href: routes.gurus,
      label: "Guru",
      value: data.metrics.guruCodes,
      tone: "sky" as const,
      icon: <PawPrint size={18} />,
    },
    {
      href: routes.petParents,
      label: "Pet Parent",
      value: data.metrics.petParentCodes,
      tone: "emerald" as const,
      icon: <Gift size={18} />,
    },
    {
      href: routes.ambassadors,
      label: "Ambassador",
      value: data.metrics.ambassadorCodes,
      tone: "violet" as const,
      icon: <HeartHandshake size={18} />,
    },
    {
      href: routes.partners,
      label: "Partner",
      value: data.metrics.partnerCodes,
      tone: "amber" as const,
      icon: <Users size={18} />,
    },
  ];

  return (
    <GrowthPageFrame
      kicker="Growth & Referrals Workplace"
      title="Turn codes, QR, and links into real SitGuru signups."
      detail="This is the workbench. Issue a code, watch this week’s scans and clicks, then clear review, conflicts, and payouts."
      action={
        <Link
          href={`${routes.codes}#generate-code`}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          <Plus size={17} />
          Generate code
        </Link>
      }
    >
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile) => (
          <AdminThemeCard
            key={tile.label}
            label={tile.label}
            value={tile.value}
            helper={tile.helper}
            tone={tile.tone}
            icon={tile.icon}
          />
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.primary
                  ? "flex min-h-24 items-center gap-4 rounded-[1.6rem] px-5 py-4 text-white shadow-sm"
                  : "flex min-h-24 items-center gap-4 rounded-[1.6rem] border border-emerald-100 bg-white px-5 py-4 shadow-sm"
              }
              style={action.primary ? { background: "#0D5C3A" } : undefined}
            >
              <span
                className={
                  action.primary
                    ? "flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"
                    : "flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]"
                }
              >
                <Icon size={26} />
              </span>
              <span>
                <span
                  className={`block text-lg font-black ${
                    action.primary ? "!text-white" : "text-slate-950"
                  }`}
                >
                  {action.label}
                </span>
                <span
                  className={`mt-1 block text-sm font-semibold ${
                    action.primary ? "!text-white/85" : "text-slate-500"
                  }`}
                >
                  {action.detail}
                </span>
              </span>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {programs.map((program) => (
          <Link key={program.href} href={program.href}>
            <AdminThemeCard
              label={`${program.label} codes`}
              value={number(program.value)}
              helper="Open this ledger"
              tone={program.tone}
              icon={program.icon}
            />
          </Link>
        ))}
      </section>

      <GrowthCard>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              This week
            </p>
            <h2 className="text-lg font-black text-slate-950">
              Referral activity calendar
            </h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {number(data.weekVisits)} visits · {number(data.weekScans)} QR
          </p>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1">
          {data.weekDays.map((item) => {
            const hits = item.visits + item.scans + item.other;
            const isToday = item.day === today;
            return (
              <div
                key={item.day}
                className={`min-h-[92px] rounded-xl border p-2 sm:min-h-[118px] ${
                  isToday
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                  {prettyWeekday(item.day)}
                </p>
                <p className="text-sm font-black text-slate-950">
                  {Number(item.day.slice(8))}
                </p>
                <p className="mt-2 text-lg font-black text-emerald-800">
                  {hits || "·"}
                </p>
                <p className="hidden text-[10px] font-bold text-slate-500 sm:block">
                  {item.visits} link · {item.scans} QR
                </p>
              </div>
            );
          })}
        </div>
      </GrowthCard>

      <div className="grid gap-4 md:grid-cols-2">
        <GrowthCard>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Today’s work</h2>
            <StatusPill
              value={
                data.metrics.needsReview + data.metrics.openConflicts > 0
                  ? "Review"
                  : "Ready"
              }
            />
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="font-black text-slate-950">
                {todayHits} scans + clicks today
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Live from PawPerks referral events
              </p>
            </div>
            {data.metrics.needsReview > 0 ? (
              <Link
                href={routes.codes}
                className="block rounded-2xl bg-amber-50 px-3 py-3 text-sm font-black text-amber-900"
              >
                {data.metrics.needsReview} codes waiting for review
              </Link>
            ) : null}
            {data.metrics.openConflicts > 0 ? (
              <Link
                href={routes.inventory}
                className="block rounded-2xl bg-rose-50 px-3 py-3 text-sm font-black text-rose-900"
              >
                {data.metrics.openConflicts} PawPerks conflicts to clean
              </Link>
            ) : null}
            {data.metrics.rewardReview > 0 ? (
              <Link
                href={routes.payouts}
                className="block rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-900"
              >
                {data.metrics.rewardReview} rewards ready to decide
              </Link>
            ) : null}
            {data.needsReviewCodes.length === 0 &&
            data.openConflicts.length === 0 &&
            data.metrics.rewardReview === 0 ? (
              <p className="text-sm font-semibold text-slate-500">
                Queue is clear. Generate a code or check this week’s QR board.
              </p>
            ) : null}
          </div>
        </GrowthCard>

        <GrowthCard>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Latest activity</h2>
            <Link
              href={routes.codes}
              className="text-sm font-black text-emerald-800"
            >
              Registry →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {data.recentEvents.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-slate-950">
                    {eventLabel(item.title)}
                  </p>
                  <StatusPill value={item.status} />
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {item.subtitle} · {formatWhen(item.date)}
                </p>
              </Link>
            ))}
            {data.recentEvents.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500">
                No referral events yet. Share a code or QR to start the stream.
              </p>
            ) : null}
          </div>
        </GrowthCard>
      </div>

      <GrowthCard>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Source health</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {healthy} of {data.sourceHealth.length} live · signed in as{" "}
              {actor.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={routes.salesMarketing}
              className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900"
            >
              <Megaphone size={13} className="mr-1 inline" />
              Sales &amp; Marketing
            </Link>
            <Link
              href={routes.ambassadorLeads}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              Ambassador Leads
            </Link>
            <Link
              href={routes.financials}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              Financials
            </Link>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {data.sourceHealth.map((source) => (
            <div
              key={source.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">{source.label}</p>
                <StatusPill value={source.ok ? "Connected" : "Pending"} />
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {number(source.rowCount)} rows
              </p>
            </div>
          ))}
        </div>
      </GrowthCard>
    </GrowthPageFrame>
  );
}
