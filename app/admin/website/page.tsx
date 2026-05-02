import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  FileText,
  Gift,
  Globe2,
  Handshake,
  Link2,
  MessageCircle,
  MousePointerClick,
  PawPrint,
  ShieldCheck,
  Star,
  Store,
  Users,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

const websiteRoutes = [
  {
    title: "Home",
    description: "Main public SitGuru landing page.",
    publicHref: "/",
    adminHref: "/admin",
    icon: Globe2,
  },
  {
    title: "Find a Guru",
    description: "Customer search and booking entry point.",
    publicHref: "/search",
    adminHref: "/admin/bookings",
    icon: PawPrint,
  },
  {
    title: "Gurus",
    description: "Guru recruiting and network-facing page.",
    publicHref: "/guru",
    adminHref: "/admin/gurus",
    icon: Users,
  },
  {
    title: "Partner Network",
    description: "Main public partner network landing page.",
    publicHref: "/partners",
    adminHref: "/admin/partners",
    icon: Handshake,
  },
  {
    title: "Local Partners",
    description: "Local business partner program.",
    publicHref: "/partners/local",
    adminHref: "/admin/partners/active",
    icon: Store,
  },
  {
    title: "National Partners",
    description: "National brand and sponsored partner program.",
    publicHref: "/partners/national",
    adminHref: "/admin/partners/active",
    icon: BriefcaseBusiness,
  },
  {
    title: "Growth Affiliates",
    description: "Affiliate and creator growth program.",
    publicHref: "/partners/affiliates",
    adminHref: "/admin/partners/affiliates",
    icon: Link2,
  },
  {
    title: "Ambassadors",
    description: "Community ambassador and city captain program.",
    publicHref: "/partners/ambassadors",
    adminHref: "/admin/partners/ambassadors",
    icon: Star,
  },
  {
    title: "Referrals",
    description: "Referral program and referral rewards.",
    publicHref: "/referrals",
    adminHref: "/admin/referrals",
    icon: Gift,
  },
];

const adminFunctionRoutes = [
  {
    title: "Partner Applications",
    description: "Review new local, national, affiliate, and ambassador applications.",
    href: "/admin/partners/applications",
    icon: FileText,
  },
  {
    title: "Active Partners",
    description: "Manage approved partner businesses and brands.",
    href: "/admin/partners/active",
    icon: BriefcaseBusiness,
  },
  {
    title: "Ambassadors",
    description: "Track ambassador tiers, points, leads, and referrals.",
    href: "/admin/partners/ambassadors",
    icon: Star,
  },
  {
    title: "Affiliates",
    description: "Track affiliate codes, links, clicks, and performance.",
    href: "/admin/partners/affiliates",
    icon: Link2,
  },
  {
    title: "Campaigns",
    description: "Monitor referral codes, landing page clicks, and campaign sources.",
    href: "/admin/partners/campaigns",
    icon: MousePointerClick,
  },
  {
    title: "Rewards",
    description: "Review pending partner, ambassador, affiliate, and referral rewards.",
    href: "/admin/partners/rewards",
    icon: BadgeDollarSign,
  },
  {
    title: "Payouts",
    description: "Track payout status for approved rewards and partner programs.",
    href: "/admin/partners/payouts",
    icon: Gift,
  },
  {
    title: "Partner Messages",
    description: "Manage partner, affiliate, and ambassador messages.",
    href: "/admin/partners/messages",
    icon: MessageCircle,
  },
];

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function getStatus(row: AnyRow) {
  const status =
    asString(row.status) ||
    asString(row.application_status) ||
    asString(row.payout_status) ||
    asString(row.reward_status);

  return status.toLowerCase();
}

function isActiveStatus(row: AnyRow) {
  const status = getStatus(row);

  return (
    status === "active" ||
    status === "approved" ||
    status === "live" ||
    status === "enabled"
  );
}

function isPendingStatus(row: AnyRow) {
  const status = getStatus(row);

  return (
    status === "new" ||
    status === "pending" ||
    status === "submitted" ||
    status === "review" ||
    status === "in_review" ||
    status === "contacted" ||
    status === "interested" ||
    status === "applied"
  );
}

function getAmount(row: AnyRow) {
  return (
    asNumber(row.amount) ||
    asNumber(row.reward_amount) ||
    asNumber(row.payout_amount) ||
    asNumber(row.total) ||
    0
  );
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Website wiring query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Website wiring query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

async function getWebsiteWiringMetrics() {
  const [
    partnerApplicationsResult,
    partnersResult,
    ambassadorsResult,
    affiliatesResult,
    referralCodesResult,
    referralClicksResult,
    referralRewardsResult,
    networkProgramsResult,
    networkParticipantsResult,
    networkPartnerLeadsResult,
    networkRewardsResult,
    partnerPayoutsResult,
    partnerMessagesResult,
  ] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin.from("partner_applications").select("*").limit(1000),
      "partner_applications",
    ),
    safeAdminQuery(
      supabaseAdmin.from("partners").select("*").limit(1000),
      "partners",
    ),
    safeAdminQuery(
      supabaseAdmin.from("ambassadors").select("*").limit(1000),
      "ambassadors",
    ),
    safeAdminQuery(
      supabaseAdmin.from("affiliates").select("*").limit(1000),
      "affiliates",
    ),
    safeAdminQuery(
      supabaseAdmin.from("referral_codes").select("*").limit(1000),
      "referral_codes",
    ),
    safeAdminQuery(
      supabaseAdmin.from("referral_clicks").select("*").limit(1000),
      "referral_clicks",
    ),
    safeAdminQuery(
      supabaseAdmin.from("referral_rewards").select("*").limit(1000),
      "referral_rewards",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_programs").select("*").limit(1000),
      "network_programs",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_program_participants").select("*").limit(1000),
      "network_program_participants",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_partner_leads").select("*").limit(1000),
      "network_partner_leads",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_rewards").select("*").limit(1000),
      "network_rewards",
    ),
    safeAdminQuery(
      supabaseAdmin.from("partner_payouts").select("*").limit(1000),
      "partner_payouts",
    ),
    safeAdminQuery(
      supabaseAdmin.from("partner_messages").select("*").limit(1000),
      "partner_messages",
    ),
  ]);

  const partnerApplications = ((partnerApplicationsResult.data || []) as AnyRow[]).filter(Boolean);
  const partners = ((partnersResult.data || []) as AnyRow[]).filter(Boolean);
  const ambassadors = ((ambassadorsResult.data || []) as AnyRow[]).filter(Boolean);
  const affiliates = ((affiliatesResult.data || []) as AnyRow[]).filter(Boolean);
  const referralCodes = ((referralCodesResult.data || []) as AnyRow[]).filter(Boolean);
  const referralClicks = ((referralClicksResult.data || []) as AnyRow[]).filter(Boolean);
  const referralRewards = ((referralRewardsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkPrograms = ((networkProgramsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkParticipants = ((networkParticipantsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkPartnerLeads = ((networkPartnerLeadsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkRewards = ((networkRewardsResult.data || []) as AnyRow[]).filter(Boolean);
  const partnerPayouts = ((partnerPayoutsResult.data || []) as AnyRow[]).filter(Boolean);
  const partnerMessages = ((partnerMessagesResult.data || []) as AnyRow[]).filter(Boolean);

  const pendingApplications = partnerApplications.filter(isPendingStatus).length;
  const activePartners = partners.filter(isActiveStatus).length;
  const activePrograms = networkPrograms.filter(isActiveStatus).length;

  const pendingRewardsAmount =
    referralRewards.filter(isPendingStatus).reduce((sum, row) => sum + getAmount(row), 0) +
    networkRewards.filter(isPendingStatus).reduce((sum, row) => sum + getAmount(row), 0);

  const pendingPayoutAmount = partnerPayouts
    .filter(isPendingStatus)
    .reduce((sum, row) => sum + getAmount(row), 0);

  const unreadPartnerMessages = partnerMessages.filter((message) => {
    const readAt = asString(message.read_at);
    const status = getStatus(message);

    if (message.is_read === false || message.read === false) return true;
    if (!readAt && status !== "read" && status !== "archived") return true;

    return false;
  }).length;

  return {
    pendingApplications,
    activePartners,
    ambassadors: ambassadors.length,
    affiliates: affiliates.length,
    referralCodes: referralCodes.length,
    referralClicks: referralClicks.length,
    activePrograms,
    networkParticipants: networkParticipants.length,
    partnerLeads: networkPartnerLeads.length,
    pendingRewardsAmount,
    pendingPayoutAmount,
    unreadPartnerMessages,
  };
}

export default async function AdminWebsiteWiringPage() {
  const metrics = await getWebsiteWiringMetrics();

  const summaryCards = [
    {
      title: "Active Programs",
      value: number(metrics.activePrograms),
      description: "Live SitGuru Network programs.",
      icon: ShieldCheck,
      href: "/admin/programs",
    },
    {
      title: "Applications",
      value: number(metrics.pendingApplications),
      description: "Pending partner network applications.",
      icon: FileText,
      href: "/admin/partners/applications",
    },
    {
      title: "Active Partners",
      value: number(metrics.activePartners),
      description: "Approved partner businesses and brands.",
      icon: BriefcaseBusiness,
      href: "/admin/partners/active",
    },
    {
      title: "Ambassadors",
      value: number(metrics.ambassadors),
      description: "Ambassador records connected to SitGuru.",
      icon: Star,
      href: "/admin/partners/ambassadors",
    },
    {
      title: "Affiliates",
      value: number(metrics.affiliates),
      description: "Affiliate records connected to SitGuru.",
      icon: Link2,
      href: "/admin/partners/affiliates",
    },
    {
      title: "Referral Codes",
      value: number(metrics.referralCodes),
      description: "Trackable partner, affiliate, and ambassador codes.",
      icon: MousePointerClick,
      href: "/admin/partners/campaigns",
    },
    {
      title: "Landing Clicks",
      value: number(metrics.referralClicks),
      description: "Tracked clicks from public referral pages.",
      icon: Activity,
      href: "/admin/partners/campaigns",
    },
    {
      title: "Pending Rewards",
      value: money(metrics.pendingRewardsAmount),
      description: "Rewards waiting for review or approval.",
      icon: BadgeDollarSign,
      href: "/admin/partners/rewards",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <section className="border-b border-green-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-green-800">
                <Link href="/admin" className="hover:text-green-950">
                  Admin
                </Link>
                <span className="mx-2 text-slate-400">/</span>
                Website Wiring
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Website Wiring Center
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Connect the public SitGuru website pages to the correct admin
                tools, Supabase tracking, partner applications, referral codes,
                rewards, payouts, and campaign reporting.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/partners"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                View Public Partner Network
                <ArrowUpRight size={17} />
              </Link>

              <Link
                href="/admin/partners"
                className="inline-flex items-center justify-center rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                Open Partner Admin
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <Icon size={22} />
                </div>

                <p className="mt-5 text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                  {card.title}
                </p>

                <p className="mt-2 text-3xl font-black text-green-950">
                  {card.value}
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {card.description}
                </p>

                <p className="mt-4 text-sm font-black text-green-800">
                  View details <span className="transition group-hover:translate-x-1">→</span>
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                  Public Website Pages
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                  Website → Admin connections
                </h2>
              </div>

              <p className="text-sm font-semibold text-slate-500">
                Verify every public page has an admin destination.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {websiteRoutes.map((route) => {
                const Icon = route.icon;

                return (
                  <div
                    key={route.title}
                    className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-white">
                        <Icon size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-black text-green-950">
                          {route.title}
                        </h3>

                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                          {route.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <Link
                        href={route.publicHref}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                      >
                        Public Page
                        <ArrowUpRight size={15} />
                      </Link>

                      <Link
                        href={route.adminHref}
                        className="inline-flex items-center justify-center rounded-xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
                      >
                        Admin Page
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-green-800 bg-green-950 p-6 text-white shadow-xl shadow-green-950/15">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/80">
                Website Status
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                SitGuru Network is wired
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-white/80">
                Public partner pages now have direct admin routes for reviewing
                applications, approving partners, managing affiliates, tracking
                ambassadors, watching campaigns, and paying rewards.
              </p>

              <div className="mt-6 grid gap-3">
                <StatusLine label="Network participants" value={number(metrics.networkParticipants)} />
                <StatusLine label="Partner leads" value={number(metrics.partnerLeads)} />
                <StatusLine label="Pending payouts" value={money(metrics.pendingPayoutAmount)} />
                <StatusLine label="Unread partner messages" value={number(metrics.unreadPartnerMessages)} />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                Admin Functions
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                Management pages
              </h2>

              <div className="mt-5 space-y-3">
                {adminFunctionRoutes.map((route) => {
                  const Icon = route.icon;

                  return (
                    <Link
                      key={route.title}
                      href={route.href}
                      className="group flex items-start gap-3 rounded-2xl border border-green-100 bg-[#fbfaf6] p-4 transition hover:border-green-300 hover:bg-green-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-800 text-white">
                        <Icon size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-black text-green-950">
                          {route.title}
                        </p>

                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                          {route.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-sm font-bold text-white/75">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}