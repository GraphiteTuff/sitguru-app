import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Trophy,
  Wallet,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
  stripe_account_id?: string | null;
  stripe_connect_account_id?: string | null;
  stripe_account_status?: string | null;
  stripe_onboarding_complete?: boolean | string | number | null;
  stripe_payouts_enabled?: boolean | string | number | null;
  payouts_enabled?: boolean | string | number | null;
  charges_enabled?: boolean | string | number | null;
};

type RewardRow = {
  id: string;
  ambassador_id?: string | null;
  referral_id?: string | null;
  referral_code?: string | null;
  reward_type?: string | null;
  reward_source?: string | null;
  source?: string | null;
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

type RewardBucket = "pending" | "approved" | "paid" | "excluded";

type NormalizedReward = {
  id: string;
  rewardType: string;
  source: string;
  amount: number;
  status: string;
  bucket: RewardBucket;
  date: string;
  rawDate: string;
  note: string;
};

type RewardsResult = {
  rows: RewardRow[];
  warning: string;
};

type PayoutReadiness = {
  accountId: string;
  status: string;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  ready: boolean;
  blockers: string[];
};

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

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

function isTruthyValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;

  const normalized = asString(value).toLowerCase();

  return [
    "true",
    "yes",
    "ready",
    "enabled",
    "complete",
    "completed",
    "active",
  ].includes(normalized);
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
  return asString(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRewardBucket(row: RewardRow): RewardBucket {
  const status = normalizeStatus(row.status || row.payout_status);

  if (
    status.includes("reject") ||
    status.includes("ineligible") ||
    status.includes("void") ||
    status.includes("cancel") ||
    status.includes("refund") ||
    status.includes("chargeback")
  ) {
    return "excluded";
  }

  if (
    status.includes("paid") ||
    status.includes("completed payout") ||
    Boolean(asString(row.paid_at))
  ) {
    return "paid";
  }

  if (
    status.includes("approved") ||
    status.includes("ready for payout") ||
    status.includes("payable")
  ) {
    return "approved";
  }

  return "pending";
}

function getRewardAmount(row: RewardRow) {
  return roundMoney(
    asNumber(row.amount) ||
      asNumber(row.reward_amount) ||
      asNumber(row.payout_amount),
  );
}

function getRewardDate(row: RewardRow, bucket: RewardBucket) {
  if (bucket === "paid") {
    return (
      asString(row.paid_at) ||
      asString(row.approved_at) ||
      asString(row.earned_at) ||
      asString(row.created_at) ||
      asString(row.updated_at)
    );
  }

  if (bucket === "approved") {
    return (
      asString(row.approved_at) ||
      asString(row.earned_at) ||
      asString(row.created_at) ||
      asString(row.updated_at)
    );
  }

  return (
    asString(row.earned_at) ||
    asString(row.created_at) ||
    asString(row.updated_at)
  );
}

function getRewardStatus(row: RewardRow, bucket: RewardBucket) {
  const rawStatus = normalizeStatus(row.status || row.payout_status);

  if (rawStatus) return titleCase(rawStatus);
  if (bucket === "paid") return "Paid";
  if (bucket === "approved") return "Approved";
  if (bucket === "excluded") return "Not Eligible";

  return "Pending Review";
}

function getRewardType(row: RewardRow) {
  const rawType = asString(
    row.reward_type || row.reward_source || row.source,
  )
    .replace(/[_-]+/g, " ")
    .trim();

  return rawType ? titleCase(rawType) : "Ambassador Reward";
}

function getRewardSource(row: RewardRow) {
  return (
    asString(row.referral_code) ||
    asString(row.referral_id) ||
    asString(row.reward_source) ||
    asString(row.source) ||
    "SitGuru verified activity"
  );
}

function getRewardNote(row: RewardRow, bucket: RewardBucket) {
  const savedNote = asString(row.notes || row.admin_notes);
  if (savedNote) return savedNote;

  if (bucket === "pending") {
    return "Waiting for SitGuru review. This amount is not approved or payable yet.";
  }

  if (bucket === "approved") {
    return "Approved by SitGuru and waiting for payout processing.";
  }

  if (bucket === "paid") {
    return "Paid reward recorded by SitGuru.";
  }

  return "This reward was excluded, canceled, refunded, or marked ineligible.";
}

function normalizeRewards(rows: RewardRow[]) {
  return rows
    .map((row) => {
      const bucket = getRewardBucket(row);
      const rawDate = getRewardDate(row, bucket);

      return {
        id: asString(row.id),
        rewardType: getRewardType(row),
        source: getRewardSource(row),
        amount: getRewardAmount(row),
        status: getRewardStatus(row, bucket),
        bucket,
        date: formatDate(rawDate),
        rawDate,
        note: getRewardNote(row, bucket),
      } satisfies NormalizedReward;
    })
    .filter((reward) => Boolean(reward.id))
    .sort((a, b) => {
      const aDate = new Date(a.rawDate).getTime();
      const bDate = new Date(b.rawDate).getTime();

      return (
        (Number.isNaN(bDate) ? 0 : bDate) -
        (Number.isNaN(aDate) ? 0 : aDate)
      );
    });
}

async function getAmbassadorForUser(userId: string, email?: string | null) {
  const { data: byUserId, error: userIdError } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (userIdError) {
    console.error(
      "Ambassador earnings lookup by user ID failed:",
      userIdError.message,
    );
  }

  let ambassador = byUserId as AmbassadorRecord | null;
  const cleanEmail = asString(email).toLowerCase();

  if (!ambassador && cleanEmail) {
    const emailColumns = ["login_email", "contact_email", "email"] as const;

    for (const column of emailColumns) {
      const { data, error } = await supabaseAdmin
        .from("ambassadors")
        .select("*")
        .eq(column, cleanEmail)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          `Ambassador earnings lookup by ${column} failed:`,
          error.message,
        );
        continue;
      }

      if (data) {
        ambassador = data as AmbassadorRecord;
        break;
      }
    }
  }

  if (!ambassador) return null;

  const status = normalizeStatus(ambassador.status);
  const workspaceAllowed =
    ambassador.dashboard_enabled === true &&
    ambassador.login_enabled === true &&
    status !== "archived" &&
    status !== "inactive" &&
    status !== "not a fit";

  return workspaceAllowed ? ambassador : null;
}

async function getCanonicalAmbassadorRewards(
  ambassadorId: string,
): Promise<RewardsResult> {
  const { data, error } = await supabaseAdmin
    .from("ambassador_rewards")
    .select("*")
    .eq("ambassador_id", ambassadorId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error(
      "Unable to load canonical Ambassador rewards:",
      error.message,
    );

    return {
      rows: [],
      warning:
        "SitGuru could not load your canonical reward records right now. No earnings totals are being estimated or substituted.",
    };
  }

  return {
    rows: (data || []) as RewardRow[],
    warning: "",
  };
}

function getPayoutReadiness(
  ambassador: AmbassadorRecord,
): PayoutReadiness {
  const accountId =
    asString(ambassador.stripe_account_id) ||
    asString(ambassador.stripe_connect_account_id);
  const status = asString(ambassador.stripe_account_status);
  const onboardingComplete = isTruthyValue(
    ambassador.stripe_onboarding_complete,
  );
  const payoutsEnabled =
    isTruthyValue(ambassador.stripe_payouts_enabled) ||
    isTruthyValue(ambassador.payouts_enabled);
  const chargesEnabled = isTruthyValue(ambassador.charges_enabled);

  const blockers: string[] = [];

  if (!accountId) {
    blockers.push("Connect a Stripe payout account.");
  }

  if (!onboardingComplete) {
    blockers.push("Complete Stripe identity, tax, and bank onboarding.");
  }

  if (!payoutsEnabled) {
    blockers.push("Stripe payouts are not enabled yet.");
  }

  return {
    accountId,
    status,
    onboardingComplete,
    payoutsEnabled,
    chargesEnabled,
    ready:
      Boolean(accountId) &&
      onboardingComplete &&
      payoutsEnabled,
    blockers,
  };
}

function statusClasses(bucket: RewardBucket) {
  if (bucket === "paid") {
    return "border-emerald-200 bg-emerald-50 !text-emerald-700";
  }

  if (bucket === "approved") {
    return "border-sky-200 bg-sky-50 !text-sky-700";
  }

  if (bucket === "excluded") {
    return "border-rose-200 bg-rose-50 !text-rose-700";
  }

  return "border-amber-200 bg-amber-50 !text-amber-700";
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

function RewardStatusBadge({
  reward,
}: {
  reward: NormalizedReward;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
        reward.bucket,
      )}`}
    >
      {reward.status}
    </span>
  );
}

function RewardCard({
  reward,
}: {
  reward: NormalizedReward;
}) {
  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-black !text-slate-950">
            {reward.rewardType}
          </p>
          <p className="mt-1 break-words text-xs font-semibold !text-slate-500">
            {reward.date} · {reward.source}
          </p>
        </div>

        <RewardStatusBadge reward={reward} />
      </div>

      <p className="mt-4 text-2xl font-black !text-emerald-700">
        {money(reward.amount)}
      </p>

      <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
        {reward.note}
      </p>
    </article>
  );
}

function RewardGroup({
  title,
  description,
  total,
  rewards,
  emptyMessage,
  icon,
}: {
  title: string;
  description: string;
  total: number;
  rewards: NormalizedReward[];
  emptyMessage: string;
  icon: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            {icon}
          </div>

          <div>
            <h2 className="text-xl font-black !text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-semibold leading-6 !text-slate-700">
              {description}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-2xl font-black !text-slate-950">
            {money(total)}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] !text-slate-500">
            {rewards.length} reward{rewards.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {rewards.length > 0 ? (
        <div className="mt-5 grid gap-4">
          {rewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-bold leading-6 !text-slate-700">
            {emptyMessage}
          </p>
        </div>
      )}
    </section>
  );
}

function StripePayoutCard({
  readiness,
  approvedAmount,
}: {
  readiness: PayoutReadiness;
  approvedAmount: number;
}) {
  const statusLabel = readiness.ready
    ? "Payout ready"
    : readiness.accountId
      ? "Setup needs attention"
      : "Setup required";

  const statusClassesValue = readiness.ready
    ? "border-emerald-200 bg-emerald-50 !text-emerald-700"
    : readiness.accountId
      ? "border-amber-200 bg-amber-50 !text-amber-700"
      : "border-rose-200 bg-rose-50 !text-rose-700";

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-emerald-700" />
          <h2 className="text-2xl font-black !text-slate-950">
            Payout Readiness
          </h2>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusClassesValue}`}
        >
          {statusLabel}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold leading-6 !text-slate-700">
        Approved rewards are separate from payout readiness. A reward can be
        approved while Stripe setup still needs attention, but it is not shown
        as paid until SitGuru records a paid reward status.
      </p>

      <div className="mt-5 rounded-[1.35rem] border border-sky-100 bg-sky-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">
          Approved and waiting
        </p>
        <p className="mt-2 text-3xl font-black text-sky-950">
          {money(approvedAmount)}
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {[
          {
            title: "Stripe account",
            detail: readiness.accountId
              ? "Connected account found"
              : "No connected payout account found",
            complete: Boolean(readiness.accountId),
          },
          {
            title: "Onboarding",
            detail: readiness.onboardingComplete
              ? "Identity, tax, and banking setup marked complete"
              : "Stripe onboarding is not marked complete",
            complete: readiness.onboardingComplete,
          },
          {
            title: "Payout capability",
            detail: readiness.payoutsEnabled
              ? "Stripe payouts are marked enabled"
              : "Stripe payouts are not enabled",
            complete: readiness.payoutsEnabled,
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100"
          >
            {item.complete ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            ) : (
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            )}

            <div>
              <p className="text-sm font-black !text-slate-950">
                {item.title}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 !text-slate-600">
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {readiness.blockers.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-black text-amber-950">
                Complete these payout steps
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-bold leading-5 text-amber-900">
                {readiness.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {readiness.accountId ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] !text-slate-500">
            Stripe Account
          </p>
          <p className="mt-1 break-all text-sm font-black !text-slate-900">
            {readiness.accountId}
          </p>
          {readiness.status ? (
            <p className="mt-1 text-xs font-bold !text-slate-600">
              Saved status: {readiness.status}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link
          href="/ambassador/dashboard/payouts"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black !text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
        >
          {readiness.ready ? "Review Payout Setup" : "Complete Payout Setup"}
        </Link>

        <Link
          href="/ambassador/dashboard/messages?role=ambassador&support=admin"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black !text-emerald-800 transition hover:bg-emerald-50"
        >
          Message SitGuru Support
        </Link>
      </div>
    </section>
  );
}

export default async function AmbassadorDashboardEarningsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const loginParams = new URLSearchParams({
      mode: "phone",
      role: "ambassador",
      next: "/login/route?preferred=ambassador",
    });

    redirect(`/login?${loginParams.toString()}`);
  }

  const ambassador = await getAmbassadorForUser(user.id, user.email);

  if (!ambassador?.id) {
    redirect("/login/route?preferred=ambassador");
  }

  const rewardsResult = await getCanonicalAmbassadorRewards(ambassador.id);
  const rewards = normalizeRewards(rewardsResult.rows);
  const payoutReadiness = getPayoutReadiness(ambassador);

  const pendingRewards = rewards.filter(
    (reward) => reward.bucket === "pending",
  );
  const approvedRewards = rewards.filter(
    (reward) => reward.bucket === "approved",
  );
  const paidRewards = rewards.filter(
    (reward) => reward.bucket === "paid",
  );
  const excludedRewards = rewards.filter(
    (reward) => reward.bucket === "excluded",
  );

  const pendingAmount = roundMoney(
    pendingRewards.reduce((sum, reward) => sum + reward.amount, 0),
  );
  const approvedAmount = roundMoney(
    approvedRewards.reduce((sum, reward) => sum + reward.amount, 0),
  );
  const paidAmount = roundMoney(
    paidRewards.reduce((sum, reward) => sum + reward.amount, 0),
  );
  const confirmedAmount = roundMoney(approvedAmount + paidAmount);

  const monthStart = startOfCurrentMonth();
  const paidThisMonth = roundMoney(
    paidRewards
      .filter((reward) => {
        const parsed = new Date(reward.rawDate);
        return !Number.isNaN(parsed.getTime()) && parsed >= monthStart;
      })
      .reduce((sum, reward) => sum + reward.amount, 0),
  );

  const referralCode =
    asString(ambassador.referral_code) || "Not assigned";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] px-4 py-6 !text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#b9f8df_0%,#d9f8ef_48%,#bde9ff_100%)] px-8 py-10 lg:grid-cols-[1.35fr_0.75fr] lg:items-center xl:px-10">
            <div>
              <Link
                href="/ambassador/dashboard"
                className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-white"
              >
                ← Back to Dashboard
              </Link>

              <p className="mt-5 text-sm font-black uppercase tracking-[0.26em] !text-emerald-800">
                Ambassador Earnings
              </p>

              <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-[-0.055em] !text-slate-950 md:text-6xl xl:text-7xl">
                Real rewards. Clear status.
              </h1>

              <p className="mt-5 max-w-4xl text-base font-semibold leading-8 !text-slate-800 md:text-lg">
                These totals come only from canonical ambassador_rewards rows
                assigned to your Ambassador account. Pending, approved, and
                paid money remain separate so projected or unverified activity
                is never displayed as confirmed earnings.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 text-sm font-black !text-slate-900 shadow-sm ring-1 ring-white/80">
                  <ShieldCheck className="h-4 w-4 !text-emerald-600" />
                  Canonical rewards only
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
                    What each status means
                  </h2>

                  <div className="mt-4 space-y-3 text-sm font-semibold leading-7 !text-slate-800">
                    <p>
                      <strong>Pending:</strong> under review and not approved.
                    </p>
                    <p>
                      <strong>Approved:</strong> confirmed by SitGuru but not
                      yet recorded as paid.
                    </p>
                    <p>
                      <strong>Paid:</strong> payout completion is recorded on
                      the reward.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {rewardsResult.warning ? (
          <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <p className="text-sm font-bold leading-6 text-amber-950">
                {rewardsResult.warning}
              </p>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Pending Review"
            value={money(pendingAmount)}
            description="Not approved or payable yet"
            icon={<Clock3 className="h-6 w-6" />}
          />
          <StatCard
            title="Approved Unpaid"
            value={money(approvedAmount)}
            description="Confirmed and waiting payout"
            icon={<BadgeDollarSign className="h-6 w-6" />}
          />
          <StatCard
            title="Paid Out"
            value={money(paidAmount)}
            description="Recorded as paid by SitGuru"
            icon={<PiggyBank className="h-6 w-6" />}
          />
          <StatCard
            title="Confirmed Total"
            value={money(confirmedAmount)}
            description="Approved plus paid rewards only"
            icon={<Trophy className="h-6 w-6" />}
          />
          <StatCard
            title="Paid This Month"
            value={money(paidThisMonth)}
            description="Paid rewards dated this month"
            icon={<CalendarDays className="h-6 w-6" />}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <RewardGroup
              title="Pending Review"
              description="These rewards are not confirmed earnings and are not available for payout."
              total={pendingAmount}
              rewards={pendingRewards}
              emptyMessage="No rewards are currently waiting for review."
              icon={<Clock3 className="h-5 w-5" />}
            />

            <RewardGroup
              title="Approved, Not Paid"
              description="SitGuru approved these rewards, but no paid status has been recorded yet."
              total={approvedAmount}
              rewards={approvedRewards}
              emptyMessage="No approved unpaid rewards are currently recorded."
              icon={<BadgeDollarSign className="h-5 w-5" />}
            />

            <RewardGroup
              title="Paid Rewards"
              description="Only rewards with a paid status or paid date appear in this section."
              total={paidAmount}
              rewards={paidRewards}
              emptyMessage="No paid Ambassador rewards are currently recorded."
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
          </div>

          <div className="space-y-6">
            <StripePayoutCard
              readiness={payoutReadiness}
              approvedAmount={approvedAmount}
            />

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-700" />
                <h2 className="text-2xl font-black !text-slate-950">
                  Earnings Integrity
                </h2>
              </div>

              <p className="mt-3 text-sm font-semibold leading-7 !text-slate-700">
                This page does not calculate possible earnings from referral
                counts, booking estimates, daily targets, or social growth
                projections. A dollar amount appears only after a canonical
                reward row exists for your Ambassador account.
              </p>

              <div className="mt-5 grid gap-3">
                {[
                  "Refreshing this page does not create rewards.",
                  "Pending rewards are not included in confirmed totals.",
                  "Approved rewards remain separate from paid rewards.",
                  "Excluded or canceled rewards are never added to earnings totals.",
                  "Payout readiness does not change a reward status.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <p className="text-sm font-bold leading-6 !text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {excludedRewards.length > 0 ? (
              <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-700" />
                  <div>
                    <h2 className="text-xl font-black text-rose-950">
                      Excluded Reward Records
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-rose-900">
                      {excludedRewards.length} reward record
                      {excludedRewards.length === 1 ? " is" : "s are"} marked
                      canceled, rejected, refunded, void, chargeback-related,
                      or ineligible. These amounts are not included in any
                      earnings total.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {excludedRewards.map((reward) => (
                    <RewardCard key={reward.id} reward={reward} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                  <Sparkles className="h-7 w-7" />
                </div>

                <div>
                  <p className="text-lg font-black !text-emerald-900">
                    Grow referrals without guessing earnings.
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-7 !text-emerald-900">
                    Use the Referrals page to share your tracked links and view
                    canonical referral activity. Earnings appear here only
                    after SitGuru creates and reviews the matching reward.
                  </p>

                  <Link
                    href="/ambassador/dashboard/referrals"
                    className="mt-4 inline-flex items-center justify-center rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-black !text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  >
                    View Referrals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}