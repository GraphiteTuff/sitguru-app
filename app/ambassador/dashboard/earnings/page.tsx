import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type AmbassadorRecord = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  login_email?: string | null;
  referral_code?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  status?: string | null;
};

type RewardRow = {
  id: string;
  referral_code?: string | null;
  ambassador_id?: string | null;
  ambassador_user_id?: string | null;
  referral_id?: string | null;
  reward_type?: string | null;
  reward_source?: string | null;
  amount?: number | string | null;
  reward_amount?: number | string | null;
  payout_amount?: number | string | null;
  status?: string | null;
  payout_status?: string | null;
  notes?: string | null;
  admin_notes?: string | null;
  earned_at?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ReferralStats = {
  petParentSignups: number;
  guruSignups: number;
  completedBookings: number;
};

type NormalizedReward = {
  id: string;
  rewardType: string;
  source: string;
  amount: number;
  status: string;
  date: string;
  rawDate: string;
  note: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(value) ? value : 0);
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
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

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function normalizeStatus(value?: string | null) {
  return asString(value).toLowerCase().replace(/_/g, " ") || "pending";
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClasses(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized.includes("paid")) {
    return "border-emerald-200 bg-emerald-50 !text-emerald-700";
  }

  if (normalized.includes("approved")) {
    return "border-sky-200 bg-sky-50 !text-sky-700";
  }

  if (
    normalized.includes("reject") ||
    normalized.includes("ineligible") ||
    normalized.includes("void") ||
    normalized.includes("cancel")
  ) {
    return "border-rose-200 bg-rose-50 !text-rose-700";
  }

  return "border-amber-200 bg-amber-50 !text-amber-700";
}

function rewardAmount(row: RewardRow) {
  return roundMoney(
    asNumber(row.amount) ||
      asNumber(row.reward_amount) ||
      asNumber(row.payout_amount),
  );
}

function rewardStatus(row: RewardRow) {
  return titleCase(normalizeStatus(row.status || row.payout_status));
}

function rewardDate(row: RewardRow) {
  return (
    asString(row.paid_at) ||
    asString(row.approved_at) ||
    asString(row.earned_at) ||
    asString(row.created_at) ||
    asString(row.updated_at)
  );
}

function rewardTypeLabel(row: RewardRow) {
  const rawType = asString(row.reward_type || row.reward_source)
    .replace(/_/g, " ")
    .trim();

  if (!rawType) return "Ambassador reward";

  return titleCase(rawType);
}

async function getAmbassadorForUser(userId: string, email?: string | null) {
  const cleanEmail = asString(email).toLowerCase();

  const { data, error } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .or(
      `user_id.eq.${userId},login_email.eq.${cleanEmail},contact_email.eq.${cleanEmail},email.eq.${cleanEmail}`,
    )
    .eq("dashboard_enabled", true)
    .eq("login_enabled", true)
    .neq("status", "archived")
    .maybeSingle();

  if (error || !data) return null;

  return data as AmbassadorRecord;
}

async function safeReferralCount({
  table,
  referralCode,
  referralColumns,
  extraFilters = {},
}: {
  table: string;
  referralCode: string;
  referralColumns: string[];
  extraFilters?: Record<string, string>;
}) {
  const matchingIds = new Set<string>();

  for (const column of referralColumns) {
    try {
      let query = supabaseAdmin
        .from(table)
        .select("id")
        .eq(column, referralCode);

      Object.entries(extraFilters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query.limit(1000);

      if (error || !Array.isArray(data)) continue;

      data.forEach((row: AnyRow) => {
        const id = asString(row.id);
        if (id) matchingIds.add(id);
      });
    } catch {
      // Some live tables may not have every referral column yet. Skip safely.
    }
  }

  return matchingIds.size;
}

async function getReferralStats(referralCode: string): Promise<ReferralStats> {
  const [petParentSignups, guruSignups, completedBookings] = await Promise.all([
    safeReferralCount({
      table: "profiles",
      referralCode,
      referralColumns: ["ambassador_referral_code", "referral_code"],
    }),
    safeReferralCount({
      table: "guru_applications",
      referralCode,
      referralColumns: ["ambassador_referral_code", "referral_code"],
    }),
    safeReferralCount({
      table: "bookings",
      referralCode,
      referralColumns: ["ambassador_referral_code", "referral_code"],
      extraFilters: { status: "completed" },
    }),
  ]);

  return {
    petParentSignups,
    guruSignups,
    completedBookings,
  };
}

async function selectRewardsByColumn(column: string, value: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("ambassador_rewards")
      .select("*")
      .eq(column, value)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error || !Array.isArray(data)) return [];

    return data as RewardRow[];
  } catch {
    return [];
  }
}

async function getAmbassadorRewards({
  ambassadorId,
  userId,
  referralCode,
}: {
  ambassadorId: string;
  userId: string;
  referralCode: string;
}) {
  const rewardRows = await Promise.all([
    selectRewardsByColumn("referral_code", referralCode),
    selectRewardsByColumn("ambassador_id", ambassadorId),
    selectRewardsByColumn("ambassador_user_id", userId),
  ]);

  const seenIds = new Set<string>();
  const mergedRows: RewardRow[] = [];

  rewardRows.flat().forEach((row, index) => {
    const id = asString(row.id) || `reward-${index}`;
    if (seenIds.has(id)) return;
    seenIds.add(id);
    mergedRows.push({ ...row, id });
  });

  return mergedRows;
}

function normalizeRewards(rows: RewardRow[]): NormalizedReward[] {
  return rows
    .map((row, index) => {
      const rawDate = rewardDate(row);

      return {
        id: asString(row.id) || `reward-${index}`,
        rewardType: rewardTypeLabel(row),
        source: asString(row.referral_code) || asString(row.referral_id) || "—",
        amount: rewardAmount(row),
        status: rewardStatus(row),
        date: formatDate(rawDate),
        rawDate,
        note:
          asString(row.notes || row.admin_notes) ||
          "Verified by SitGuru review",
      };
    })
    .sort((a, b) => {
      const aDate = new Date(a.rawDate).getTime();
      const bDate = new Date(b.rawDate).getTime();
      return (
        (Number.isNaN(bDate) ? 0 : bDate) - (Number.isNaN(aDate) ? 0 : aDate)
      );
    });
}

function isPendingStatus(status: string) {
  const normalized = normalizeStatus(status);
  return normalized.includes("pending") || normalized.includes("review");
}

function isApprovedStatus(status: string) {
  const normalized = normalizeStatus(status);
  return normalized.includes("approved") && !normalized.includes("paid");
}

function isPaidStatus(status: string) {
  return normalizeStatus(status).includes("paid");
}

function isEligibleReward(status: string) {
  const normalized = normalizeStatus(status);

  return !(
    normalized.includes("reject") ||
    normalized.includes("ineligible") ||
    normalized.includes("void") ||
    normalized.includes("cancel")
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black !text-slate-800">{title}</p>
          <p className="mt-3 text-2xl font-black tracking-tight !text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 !text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProjectionCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50 p-4">
      <p className="text-sm font-black !text-emerald-950">{title}</p>
      <p className="mt-2 text-2xl font-black tracking-tight !text-emerald-800">
        {value}
      </p>
      <p className="mt-2 text-xs font-bold leading-5 !text-slate-700">
        {detail}
      </p>
    </div>
  );
}

function RewardStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses(status)}`}
    >
      {status}
    </span>
  );
}

function RewardEmptyState() {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-emerald-700 ring-1 ring-emerald-100">
        <Wallet className="h-7 w-7" />
      </div>
      <p className="mt-4 text-lg font-black !text-slate-950">No rewards yet</p>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 !text-slate-700">
        Ambassador earnings will appear here after SitGuru verifies qualifying
        signups, referrals, social milestones, completed bookings, and approved
        reward activity.
      </p>
    </div>
  );
}

export default async function AmbassadorDashboardEarningsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?mode=phone");
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);

  if (!ambassador?.id) {
    redirect("/login/route?preferred=ambassador");
  }

  const referralCode = asString(ambassador.referral_code);

  if (!referralCode) {
    redirect("/ambassador/dashboard");
  }

  const [rewardRows, stats] = await Promise.all([
    getAmbassadorRewards({
      ambassadorId: ambassador.id,
      userId: user.id,
      referralCode,
    }),
    getReferralStats(referralCode),
  ]);

  const rewards = normalizeRewards(rewardRows);
  const monthStart = startOfCurrentMonth();

  const pendingRewards = roundMoney(
    rewards
      .filter((reward) => isPendingStatus(reward.status))
      .reduce((sum, reward) => sum + reward.amount, 0),
  );

  const approvedRewards = roundMoney(
    rewards
      .filter((reward) => isApprovedStatus(reward.status))
      .reduce((sum, reward) => sum + reward.amount, 0),
  );

  const paidRewards = roundMoney(
    rewards
      .filter((reward) => isPaidStatus(reward.status))
      .reduce((sum, reward) => sum + reward.amount, 0),
  );

  const lifetimeRewards = roundMoney(
    rewards
      .filter((reward) => isEligibleReward(reward.status))
      .reduce((sum, reward) => sum + reward.amount, 0),
  );

  const thisMonthRewards = roundMoney(
    rewards
      .filter((reward) => {
        const parsed = new Date(reward.rawDate);
        return !Number.isNaN(parsed.getTime()) && parsed >= monthStart;
      })
      .filter((reward) => isEligibleReward(reward.status))
      .reduce((sum, reward) => sum + reward.amount, 0),
  );

  const verifiedActivityCount =
    stats.petParentSignups + stats.guruSignups + stats.completedBookings;

  const recentRewards = rewards.slice(0, 25);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-4 py-6 !text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-8 py-10 lg:grid-cols-[1.35fr_0.75fr] lg:items-center xl:px-10">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.26em] !text-emerald-800">
                Ambassador Earnings
              </p>

              <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-[-0.055em] !text-slate-950 md:text-6xl xl:text-7xl">
                Referral rewards, simplified 💰
              </h1>

              <p className="mt-5 max-w-4xl text-base font-semibold leading-8 !text-slate-800 md:text-lg">
                Track pending, approved, and paid Ambassador rewards from
                verified signups, qualifying referrals, completed bookings,
                social growth milestones, and SitGuru-reviewed reward activity.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 text-sm font-black !text-slate-900 shadow-sm ring-1 ring-white/80">
                  <ShieldCheck className="h-4 w-4 !text-emerald-600" />
                  Verified rewards
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 text-sm font-black !text-slate-900 shadow-sm ring-1 ring-white/80">
                  <Sparkles className="h-4 w-4 !text-amber-500" />
                  Referral code: {referralCode}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-xl backdrop-blur">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 !text-emerald-700 ring-1 ring-emerald-200">
                  <Wallet className="h-8 w-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tight !text-slate-950 md:text-3xl">
                    Rewards are reviewed before approval.
                  </h2>

                  <p className="mt-4 text-sm font-semibold leading-7 !text-slate-800">
                    Pending rewards are waiting for SitGuru review. Approved
                    rewards are unpaid. Paid rewards have already been
                    processed. Fake, duplicate, self-created, canceled,
                    refunded, or unverifiable activity does not qualify.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            title="Lifetime Rewards"
            value={money(lifetimeRewards)}
            description="All eligible Ambassador rewards"
            icon={<Trophy className="h-6 w-6" />}
          />
          <StatCard
            title="Pending Rewards"
            value={money(pendingRewards)}
            description="Awaiting SitGuru review"
            icon={<Clock3 className="h-6 w-6" />}
          />
          <StatCard
            title="Approved Unpaid"
            value={money(approvedRewards)}
            description="Approved and waiting payout"
            icon={<BadgeDollarSign className="h-6 w-6" />}
          />
          <StatCard
            title="Paid Out"
            value={money(paidRewards)}
            description="Already paid to you"
            icon={<PiggyBank className="h-6 w-6" />}
          />
          <StatCard
            title="This Month"
            value={money(thisMonthRewards)}
            description="Eligible reward activity this month"
            icon={<CalendarDays className="h-6 w-6" />}
          />
          <StatCard
            title="Verified Activity"
            value={String(verifiedActivityCount)}
            description="Signups, Guru applicants, and bookings"
            icon={<CheckCircle2 className="h-6 w-6" />}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] !text-slate-800">
                  Reward-by-reward breakdown
                </p>
                <p className="mt-1 text-sm font-semibold !text-slate-700">
                  Same earnings source used by your Ambassador dashboard totals.
                </p>
              </div>

              <Link
                href="/ambassador/dashboard/referrals"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black !text-emerald-800 transition hover:bg-emerald-100"
              >
                View Referrals
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {recentRewards.length > 0 ? (
              <>
                <div className="hidden overflow-hidden rounded-[1.5rem] border border-slate-200 lg:block">
                  <table className="min-w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] !text-slate-600">
                      <tr>
                        <th className="px-5 py-4 font-black">Reward</th>
                        <th className="px-5 py-4 font-black">Source</th>
                        <th className="px-5 py-4 font-black">Date</th>
                        <th className="px-5 py-4 font-black">Amount</th>
                        <th className="px-5 py-4 font-black">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 bg-white">
                      {recentRewards.map((reward) => (
                        <tr key={reward.id} className="text-sm">
                          <td className="px-5 py-4 align-middle">
                            <p className="font-black !text-slate-950">
                              {reward.rewardType}
                            </p>
                            <p className="mt-1 text-xs font-semibold !text-slate-500">
                              {reward.note}
                            </p>
                          </td>
                          <td className="px-5 py-4 font-bold !text-slate-700">
                            {reward.source}
                          </td>
                          <td className="px-5 py-4 font-bold !text-slate-700">
                            {reward.date}
                          </td>
                          <td className="px-5 py-4 text-lg font-black !text-emerald-700">
                            {money(reward.amount)}
                          </td>
                          <td className="px-5 py-4">
                            <RewardStatusBadge status={reward.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 lg:hidden">
                  {recentRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-black !text-slate-950">
                            {reward.rewardType}
                          </p>
                          <p className="mt-1 text-xs font-semibold !text-slate-500">
                            {reward.date} · {reward.source}
                          </p>
                        </div>
                        <RewardStatusBadge status={reward.status} />
                      </div>
                      <p className="mt-4 text-2xl font-black !text-emerald-700">
                        {money(reward.amount)}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
                        {reward.note}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <RewardEmptyState />
            )}
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-emerald-700" />
                <h2 className="text-2xl font-black !text-slate-950">
                  Reward rules
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  [
                    "Pet Parent first completed booking",
                    "20% of SitGuru share, max $3",
                  ],
                  ["Referred Guru approved / bookable", "$5"],
                  ["Referred Guru first completed booking", "$10"],
                  ["Max per referred Guru", "$15"],
                  [
                    "Social growth milestones",
                    "25 = $10 · 50 = $25 · 100 = $50",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100"
                  >
                    <p className="text-sm font-black !text-slate-900">
                      {label}
                    </p>
                    <p className="shrink-0 text-sm font-black !text-emerald-700">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-emerald-700" />
                <h2 className="text-2xl font-black !text-slate-950">
                  Projected examples
                </h2>
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
                Examples only. Actual rewards depend on verified qualifying
                activity and SitGuru approval.
              </p>

              <div className="mt-5 grid gap-3">
                <ProjectionCard
                  title="1 qualifying Guru per day"
                  value="Up to $15/day"
                  detail="Up to $105/week, about $450/month, or about $5,475/year if repeated consistently."
                />
                <ProjectionCard
                  title="5 completed Pet Parent bookings per week"
                  value="Up to $15/week"
                  detail="At the $3 max per qualifying booking, about $65/month or about $780/year."
                />
                <ProjectionCard
                  title="Growth stack example"
                  value="Up to $185/month"
                  detail="Example: 4 qualified Gurus, 25 qualifying Pet Parent bookings, and 100 verified social signups in a month."
                />
              </div>
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                <ShieldCheck className="h-7 w-7" />
              </div>

              <div>
                <p className="text-lg font-black !text-emerald-900">
                  Transparent, reviewed, and referral-based.
                </p>
                <p className="mt-2 max-w-5xl text-sm font-semibold leading-7 !text-emerald-900">
                  Ambassador rewards are based on verified activity. SitGuru may
                  reject fake, duplicate, self-created, canceled, refunded,
                  chargeback-related, or unverifiable activity.
                </p>
              </div>
            </div>

            <Link
              href="/ambassador/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-black !text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              Back to Ambassador Dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
