import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  ClipboardList,
  ExternalLink,
  Gift,
  HandCoins,
  HeartHandshake,
  Megaphone,
  PawPrint,
  Plus,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  getReferralsDashboardData,
  type ReferralsRecentItem,
} from "@/lib/admin/referrals/dashboard";

export const dynamic = "force-dynamic";

const routes = {
  dashboard: "/admin",
  hub: "/admin/referrals",
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

type ModuleCard = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  wiring: "live" | "next";
  value?: string;
  icon: ReactNode;
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MetricTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

function ModuleLinkCard({ card }: { card: ModuleCard }) {
  return (
    <Link
      href={card.href}
      className="group flex h-full flex-col rounded-[1.6rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]">
          {card.icon}
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
            card.wiring === "live"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {card.wiring === "live" ? "Live" : "Next"}
        </span>
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {card.eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-black text-slate-950">{card.title}</h3>
      {card.value ? (
        <p className="mt-2 text-2xl font-black text-[#0D5C3A]">{card.value}</p>
      ) : null}
      <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-slate-600">
        {card.description}
      </p>
      <span className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
        Open
        <ExternalLink
          size={14}
          className="transition group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

function RecentList({
  title,
  subtitle,
  href,
  items,
  emptyTitle,
  emptyDetail,
}: {
  title: string;
  subtitle: string;
  href: string;
  items: ReferralsRecentItem[];
  emptyTitle: string;
  emptyDetail: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
        >
          Open
        </Link>
      </div>
      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                    {item.subtitle}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold text-slate-500">
                {formatDate(item.date)}
              </p>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <p className="font-black text-slate-950">{emptyTitle}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {emptyDetail}
            </p>
          </div>
        )}
      </div>
    </section>
  );
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
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Sign in with an authorized SitGuru admin account to open Growth &amp;
            Referrals.
          </p>
        </div>
      </div>
    );
  }

  const data = await getReferralsDashboardData();

  const modules: ModuleCard[] = [
    {
      eyebrow: "Registry",
      title: "Code Registry",
      description:
        "Generate, edit, archive, and audit referral codes across all programs.",
      href: routes.codes,
      wiring: "live",
      value: number(data.metrics.activeCodes),
      icon: <ClipboardList size={20} />,
    },
    {
      eyebrow: "Guru",
      title: "Guru Referrals",
      description: "Guru lead and referral program ledger.",
      href: routes.gurus,
      wiring: "live",
      value: number(data.metrics.guruCodes),
      icon: <PawPrint size={20} />,
    },
    {
      eyebrow: "PawPerks",
      title: "Pet Parent / PawPerks",
      description: "Pet Parent referral codes and PawPerks attribution.",
      href: routes.petParents,
      wiring: "live",
      value: number(data.metrics.petParentCodes),
      icon: <Gift size={20} />,
    },
    {
      eyebrow: "Ambassadors",
      title: "Ambassador Referrals",
      description: "Ambassador referral codes, links, and conversion tracking.",
      href: routes.ambassadors,
      wiring: "live",
      value: number(data.metrics.ambassadorCodes),
      icon: <HeartHandshake size={20} />,
    },
    {
      eyebrow: "Partners",
      title: "Partners / Clinics",
      description: "Partner and clinic referral relationships.",
      href: routes.partners,
      wiring: "live",
      value: number(data.metrics.partnerCodes),
      icon: <Users size={20} />,
    },
    {
      eyebrow: "Applications",
      title: "Applications / Signups",
      description: "Program and partner applications tied to referral growth.",
      href: routes.applications,
      wiring: "live",
      value: number(data.metrics.applications),
      icon: <Target size={20} />,
    },
    {
      eyebrow: "Payouts",
      title: "Payout Accountability",
      description: "Referral rewards and payout readiness.",
      href: routes.payouts,
      wiring: "live",
      value: number(data.metrics.rewardReview),
      icon: <HandCoins size={20} />,
    },
    {
      eyebrow: "Inventory",
      title: "PawPerks Inventory",
      description: "Conflict and backfill inventory for PawPerks codes.",
      href: routes.inventory,
      wiring: "live",
      value: number(data.metrics.openConflicts),
      icon: <ShieldAlert size={20} />,
    },
    {
      eyebrow: "Auditor",
      title: "Rewards Auditor",
      description: "Cross-check rewards, liability, and payout exceptions.",
      href: routes.rewards,
      wiring: "live",
      value: number(data.metrics.paidRewards),
      icon: <BadgeDollarSign size={20} />,
    },
    {
      eyebrow: "Field CRM",
      title: "Sales & Marketing",
      description: "Field lead intake and marketing CRM outside code registry.",
      href: routes.salesMarketing,
      wiring: "live",
      icon: <Megaphone size={20} />,
    },
    {
      eyebrow: "Finance",
      title: "Financials Growth ROI",
      description:
        "Growth expense, reward liability, and attributed revenue live in Financials.",
      href: routes.financials,
      wiring: actor.canAccessFinancials ? "live" : "next",
      icon: <Sparkles size={20} />,
    },
    {
      eyebrow: "Mutations",
      title: "Reward Approve Writes",
      description:
        "Canonical reward approve / conflict resolve write flows stay Next on drilldowns.",
      href: routes.payouts,
      wiring: "next",
      icon: <HandCoins size={20} />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(13,92,58,0.12),transparent_34%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_55%,#f8fafc_100%)] p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <Link
                href={routes.dashboard}
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                <ArrowLeft size={16} />
                Back to Admin
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl xl:text-5xl">
                  Growth &amp; Referrals
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Referral Command Center
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                    data.isLive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {data.isLive ? "Live Sources" : "Preview Sources"}
                </span>
              </div>

              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                Manage referral codes, program ledgers, PawPerks inventory,
                payout accountability, and growth handoffs from one hub. Code
                CRUD lives in the Code Registry.
              </p>

              <p className="mt-3 text-xs font-bold text-slate-500">
                Signed in as {actor.email} · Role {actor.role}
              </p>
            </div>

            <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
              <Link
                href={`${routes.codes}#generate-code`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
              >
                <Plus size={17} />
                Generate Code
              </Link>
              <Link
                href={routes.codes}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <ClipboardList size={17} />
                Code Registry
              </Link>
              <Link
                href={routes.inventory}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <ShieldAlert size={17} />
                PawPerks Inventory
              </Link>
              <Link
                href={routes.rewards}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-100"
              >
                <BadgeDollarSign size={17} />
                Rewards Auditor
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <MetricTile
            label="Active Codes"
            value={number(data.metrics.activeCodes)}
            helper={`${number(data.metrics.totalCodes)} total`}
          />
          <MetricTile
            label="Needs Review"
            value={number(data.metrics.needsReview)}
            helper="Codes / payouts in review"
          />
          <MetricTile
            label="Canonical Codes"
            value={number(data.metrics.canonicalCodes)}
            helper="PawPerks account codes"
          />
          <MetricTile
            label="Relationships"
            value={number(data.metrics.relationships)}
            helper="Tracked referral pairs"
          />
          <MetricTile
            label="Signup Captures"
            value={number(data.metrics.signupCaptures)}
            helper="Event stream captures"
          />
          <MetricTile
            label="Reward Review"
            value={number(data.metrics.rewardReview)}
            helper="Pending reward decisions"
          />
          <MetricTile
            label="Open Conflicts"
            value={number(data.metrics.openConflicts)}
            helper="PawPerks inventory"
          />
          <MetricTile
            label="Applications"
            value={number(data.metrics.applications)}
            helper="Program + partner apps"
          />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Manage growth from live modules
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Referral command center
              </h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              Live = wired ledgers · Next = approve/resolve writes
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {modules.map((card) => (
              <ModuleLinkCard key={card.title} card={card} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
          <RecentList
            title="Recent codes"
            subtitle="Newest editable registry codes."
            href={routes.codes}
            items={data.recentCodes}
            emptyTitle="No referral codes yet"
            emptyDetail="Generate codes from the Code Registry."
          />
          <RecentList
            title="Needs review"
            subtitle="Codes or payout states waiting on review."
            href={routes.codes}
            items={data.needsReviewCodes}
            emptyTitle="Nothing in review"
            emptyDetail="Review queue is clear."
          />
          <RecentList
            title="Relationships"
            subtitle="Latest tracked referral relationships."
            href={routes.codes}
            items={data.recentRelationships}
            emptyTitle="No relationships yet"
            emptyDetail="Relationships appear as referrals are tracked."
          />
          <RecentList
            title="Open conflicts"
            subtitle="PawPerks inventory conflicts needing cleanup."
            href={routes.inventory}
            items={data.openConflicts}
            emptyTitle="No open conflicts"
            emptyDetail="Inventory conflicts will show here when detected."
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">Source health</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Hub reads live referral registry, PawPerks, relationship, event,
              and conflict tables.
            </p>
            <div className="mt-4 grid gap-3">
              {data.sourceHealth.map((source) => (
                <div
                  key={source.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-slate-900">{source.label}</p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                        source.ok
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {source.ok ? "Connected" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {source.message}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    {number(source.rowCount)} rows
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]">
              <Sparkles size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-950">
              How to manage Growth &amp; Referrals
            </h2>
            <ul className="mt-3 space-y-3 text-sm font-semibold leading-6 text-slate-600">
              <li>
                Use this hub for KPIs and routing. Create and edit codes in Code
                Registry.
              </li>
              <li>
                Work program ledgers (Guru / PawPerks / Ambassador / Partners)
                for accountability.
              </li>
              <li>
                Resolve PawPerks conflicts in Inventory. Audit rewards separately.
              </li>
              <li>
                Field marketing leads stay in Sales &amp; Marketing; recruiting
                stays in HR / Ambassador Leads.
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={routes.ambassadorLeads}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
              >
                Ambassador Leads
              </Link>
              <Link
                href={routes.salesMarketing}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-50"
              >
                Sales &amp; Marketing
              </Link>
              <Link
                href={routes.financials}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-50"
              >
                Financials
              </Link>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
