import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Download,
  Gift,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Undo2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BackToPartnersButton from "../_components/back-to-partners-button";
import SupabaseCoordinationBanner from "../_components/supabase-coordination-banner";

type PartnerReward = {
  id: string;
  partner_id: string | null;
  ambassador_id: string | null;
  affiliate_id: string | null;
  campaign_id: string | null;
  tracking_event_id: string | null;

  reward_type:
    | "partner_referral"
    | "ambassador_bonus"
    | "affiliate_commission"
    | "campaign_reward"
    | "booking_reward"
    | "signup_reward"
    | "donation_reward"
    | "manual";

  reward_source:
    | "partner"
    | "ambassador"
    | "affiliate"
    | "campaign"
    | "booking"
    | "signup"
    | "donation"
    | "manual";

  title: string;
  description: string | null;
  referral_code: string | null;
  event_type: string | null;

  reward_amount: number;
  revenue_amount: number;
  currency: string;

  status:
    | "pending"
    | "needs_review"
    | "approved"
    | "rejected"
    | "reversed"
    | "paid";

  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  reversed_by: string | null;
  reversed_at: string | null;
  paid_at: string | null;

  payout_batch_id: string | null;
  notes: string | null;
  audit_note: string | null;

  created_at: string;
  updated_at: string;
};

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not Available";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("en-US").format(value);
}

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function rewardIcon(type: string | null | undefined) {
  const safeType = type?.toLowerCase() || "";

  if (safeType.includes("partner")) return "🤝";
  if (safeType.includes("ambassador")) return "⭐";
  if (safeType.includes("affiliate")) return "📈";
  if (safeType.includes("campaign")) return "🎯";
  if (safeType.includes("booking")) return "🐾";
  if (safeType.includes("signup")) return "📝";
  if (safeType.includes("donation")) return "💚";

  return "🎁";
}

function statusClasses(status: PartnerReward["status"]) {
  switch (status) {
    case "approved":
      return "border-green-200 bg-green-50 text-green-800";
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "pending":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "needs_review":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-800";
    case "reversed":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function rewardTypeClasses(type: PartnerReward["reward_type"]) {
  switch (type) {
    case "partner_referral":
      return "border-green-200 bg-green-50 text-green-800";
    case "ambassador_bonus":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "affiliate_commission":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "campaign_reward":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "booking_reward":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "signup_reward":
      return "border-indigo-200 bg-indigo-50 text-indigo-800";
    case "donation_reward":
      return "border-pink-200 bg-pink-50 text-pink-800";
    case "manual":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function sourceClasses(source: PartnerReward["reward_source"]) {
  switch (source) {
    case "partner":
      return "border-green-200 bg-green-50 text-green-800";
    case "ambassador":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "affiliate":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "campaign":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "booking":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "signup":
      return "border-indigo-200 bg-indigo-50 text-indigo-800";
    case "donation":
      return "border-pink-200 bg-pink-50 text-pink-800";
    case "manual":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function sumRewards(
  rewards: PartnerReward[],
  statuses?: PartnerReward["status"][]
) {
  return rewards.reduce((sum, reward) => {
    if (statuses && !statuses.includes(reward.status)) return sum;
    return sum + Number(reward.reward_amount || 0);
  }, 0);
}

async function updateRewardStatusAction(formData: FormData) {
  "use server";

  const rewardId = String(formData.get("rewardId") || "");
  const status = String(formData.get("status") || "") as PartnerReward["status"];
  const auditNote = String(formData.get("auditNote") || "");

  if (!rewardId || !status) return;

  const now = new Date().toISOString();

  const updatePayload: Partial<PartnerReward> = {
    status,
    updated_at: now,
    audit_note: auditNote || null,
  };

  if (status === "approved") {
    updatePayload.approved_at = now;
  }

  if (status === "rejected") {
    updatePayload.rejected_at = now;
  }

  if (status === "reversed") {
    updatePayload.reversed_at = now;
  }

  if (status === "paid") {
    updatePayload.paid_at = now;
  }

  const supabase = await createClient();

  await supabase.from("partner_rewards").update(updatePayload).eq("id", rewardId);

  revalidatePath("/admin/partners/rewards");
  revalidatePath("/admin/partners");
}

export default async function AdminPartnerRewardsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("partner_rewards")
    .select("*")
    .order("created_at", { ascending: false });

  const rewards = (data ?? []) as PartnerReward[];

  const pendingCount = rewards.filter(
    (reward) => reward.status === "pending"
  ).length;

  const needsReviewCount = rewards.filter(
    (reward) => reward.status === "needs_review"
  ).length;

  const approvedCount = rewards.filter(
    (reward) => reward.status === "approved"
  ).length;

  const paidCount = rewards.filter((reward) => reward.status === "paid").length;

  const rejectedCount = rewards.filter(
    (reward) => reward.status === "rejected"
  ).length;

  const reversedCount = rewards.filter(
    (reward) => reward.status === "reversed"
  ).length;

  const reviewQueueCount = pendingCount + needsReviewCount;

  const pendingRewardValue = sumRewards(rewards, ["pending", "needs_review"]);
  const approvedRewardValue = sumRewards(rewards, ["approved"]);
  const paidRewardValue = sumRewards(rewards, ["paid"]);
  const rejectedRewardValue = sumRewards(rewards, ["rejected", "reversed"]);
  const totalRewardValue = sumRewards(rewards);

  const approvalRate = percentage(approvedCount + paidCount, rewards.length);
  const paidRate = percentage(paidCount, rewards.length);
  const rejectionRate = percentage(rejectedCount + reversedCount, rewards.length);

  const partnerRewardCount = rewards.filter(
    (reward) => reward.reward_source === "partner"
  ).length;

  const ambassadorRewardCount = rewards.filter(
    (reward) => reward.reward_source === "ambassador"
  ).length;

  const affiliateRewardCount = rewards.filter(
    (reward) => reward.reward_source === "affiliate"
  ).length;

  const campaignRewardCount = rewards.filter(
    (reward) => reward.reward_source === "campaign"
  ).length;

  return (
    <main className="min-h-screen bg-[#F7FAF3] text-[#17382B]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BackToPartnersButton />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/admin/partners/campaigns"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous: Campaigns
                </Link>

                <Link
                  href="/admin/partners/payouts"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-[#006B35]"
                >
                  Next: Payouts
                  <ArrowRight className="ml-2 h-4 w-4 !text-white" />
                </Link>

                <Link
                  href="/api/admin/partners/rewards/export"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Link>
              </div>
            </div>

            <div className="max-w-4xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <Gift className="h-7 w-7" />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Referral Rewards, Approvals, and Audit Queue
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-[#17382B] sm:text-5xl lg:text-6xl">
                Rewards
              </h1>

              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                Review, approve, reject, reverse, audit, and track SitGuru
                partner rewards, ambassador bonuses, affiliate commissions,
                referral incentives, campaign rewards, and donation rewards.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-black text-blue-900">Review Queue</p>
            <p className="mt-3 text-4xl font-black leading-none text-blue-950">
              {reviewQueueCount}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Pending and needs-review rewards waiting for admin action.
            </p>
          </div>

          <div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-black text-green-900">Approved</p>
            <p className="mt-3 text-4xl font-black leading-none text-green-950">
              {approvedCount}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Rewards approved and ready for payout processing.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-black text-emerald-900">Paid</p>
            <p className="mt-3 text-4xl font-black leading-none text-emerald-950">
              {paidCount}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Rewards already marked as paid or completed.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-black text-amber-900">Pending Value</p>
            <p className="mt-3 text-4xl font-black leading-none text-amber-950">
              {formatMoney(pendingRewardValue)}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Estimated value of rewards waiting for review or approval.
            </p>
          </div>
        </section>

        {error ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
            <h2 className="text-xl font-black">Could not load rewards</h2>
            <p className="mt-2 text-sm font-semibold leading-6">
              Supabase returned an error while loading partner rewards.
            </p>
            <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-xs font-bold text-red-900">
              {error.message}
            </pre>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                  Reward Records
                </p>

                <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                  {rewards.length} Reward Records
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Partner Network rewards from referrals, campaigns,
                  ambassador bonuses, affiliate commissions, donations, and
                  manual adjustments.
                </p>
              </div>

              {rewards.length === 0 ? (
                <div className="rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
                    🎁
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#17382B]">
                    No rewards yet
                  </h3>

                  <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                    Once partner referrals, ambassador bonuses, affiliate
                    commissions, campaign rewards, or manual rewards are
                    created, they will appear here for review and payout
                    tracking.
                  </p>

                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/admin/partners/campaigns"
                      className="inline-flex rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white transition hover:bg-[#006B35]"
                    >
                      View Campaigns
                    </Link>

                    <BackToPartnersButton />
                  </div>
                </div>
              ) : (
                <div className="grid gap-5">
                  {rewards.map((reward) => (
                    <article
                      key={reward.id}
                      className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-sm"
                    >
                      <div className="border-b border-emerald-100 bg-[#FBFCF8] p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
                              {rewardIcon(reward.reward_type)}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-black ${sourceClasses(
                                    reward.reward_source
                                  )}`}
                                >
                                  {formatLabel(reward.reward_source)}
                                </span>

                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-black ${rewardTypeClasses(
                                    reward.reward_type
                                  )}`}
                                >
                                  {formatLabel(reward.reward_type)}
                                </span>

                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                                    reward.status
                                  )}`}
                                >
                                  {formatLabel(reward.status)}
                                </span>
                              </div>

                              <h3 className="mt-3 text-2xl font-black text-[#17382B]">
                                {reward.title || "Partner Reward"}
                              </h3>

                              <p className="mt-1 text-sm font-semibold text-slate-600">
                                Created {formatDate(reward.created_at)} ·
                                Updated {formatDate(reward.updated_at)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Link
                              href={`/admin/messages?rewardId=${reward.id}`}
                              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-50"
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Message
                            </Link>

                            <Link
                              href={`/admin/partners/payouts?reward_id=${reward.id}`}
                              className="inline-flex items-center justify-center rounded-xl bg-[#007A3D] px-4 py-2 text-sm font-black !text-white transition hover:bg-[#006B35]"
                            >
                              Payouts
                              <ArrowRight className="ml-2 h-4 w-4 !text-white" />
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-5 p-5 lg:grid-cols-3">
                        <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Reward Amount
                          </p>

                          <p className="mt-3 text-3xl font-black text-[#17382B]">
                            {formatMoney(
                              Number(reward.reward_amount || 0),
                              reward.currency
                            )}
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            Revenue:{" "}
                            {formatMoney(
                              Number(reward.revenue_amount || 0),
                              reward.currency
                            )}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Referral / Event
                          </p>

                          <p className="mt-3 text-sm font-black text-[#17382B]">
                            {reward.referral_code || "No referral code"}
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            Event: {reward.event_type || "Not linked"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Status Timeline
                          </p>

                          <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">
                            <p>Approved: {formatDate(reward.approved_at)}</p>
                            <p>Rejected: {formatDate(reward.rejected_at)}</p>
                            <p>Reversed: {formatDate(reward.reversed_at)}</p>
                            <p>Paid: {formatDate(reward.paid_at)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-5 border-t border-emerald-100 p-5 lg:grid-cols-4">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-blue-900">
                            Partner ID
                          </p>
                          <p className="mt-3 break-words text-sm font-black text-blue-950">
                            {reward.partner_id || "Not linked"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-orange-900">
                            Ambassador ID
                          </p>
                          <p className="mt-3 break-words text-sm font-black text-orange-950">
                            {reward.ambassador_id || "Not linked"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-purple-900">
                            Affiliate ID
                          </p>
                          <p className="mt-3 break-words text-sm font-black text-purple-950">
                            {reward.affiliate_id || "Not linked"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-900">
                            Campaign ID
                          </p>
                          <p className="mt-3 break-words text-sm font-black text-emerald-950">
                            {reward.campaign_id || "Not linked"}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-5 border-t border-emerald-100 p-5 lg:grid-cols-2">
                        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Public Notes
                          </p>

                          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                            {reward.notes || reward.description || "No public notes."}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Admin Audit Note
                          </p>

                          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                            {reward.audit_note || "No admin audit note."}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-emerald-100 p-5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <form action={updateRewardStatusAction}>
                            <input type="hidden" name="rewardId" value={reward.id} />
                            <input type="hidden" name="status" value="approved" />
                            <input
                              type="hidden"
                              name="auditNote"
                              value="Reward approved from admin rewards page."
                            />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-xl bg-[#007A3D] px-4 py-3 text-sm font-black !text-white transition hover:bg-[#006B35]"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 !text-white" />
                              Approve
                            </button>
                          </form>

                          <form action={updateRewardStatusAction}>
                            <input type="hidden" name="rewardId" value={reward.id} />
                            <input type="hidden" name="status" value="rejected" />
                            <input
                              type="hidden"
                              name="auditNote"
                              value="Reward rejected from admin rewards page."
                            />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-900 transition hover:bg-red-100"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </button>
                          </form>

                          <form action={updateRewardStatusAction}>
                            <input type="hidden" name="rewardId" value={reward.id} />
                            <input type="hidden" name="status" value="reversed" />
                            <input
                              type="hidden"
                              name="auditNote"
                              value="Reward reversed from admin rewards page."
                            />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100"
                            >
                              <Undo2 className="mr-2 h-4 w-4" />
                              Reverse
                            </button>
                          </form>

                          <form action={updateRewardStatusAction}>
                            <input type="hidden" name="rewardId" value={reward.id} />
                            <input type="hidden" name="status" value="paid" />
                            <input
                              type="hidden"
                              name="auditNote"
                              value="Reward marked paid from admin rewards page."
                            />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
                            >
                              <BadgeDollarSign className="mr-2 h-4 w-4" />
                              Mark Paid
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-[2rem] bg-[#003D1F] p-6 !text-white shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 !text-white">
                <ShieldCheck className="h-6 w-6 !text-white" />
              </div>

              <h2 className="text-3xl font-black leading-tight !text-white">
                Reward Health
              </h2>

              <div className="mt-6 space-y-4 !text-white">
                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">Approval Rate</p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {approvalRate}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">Paid Rate</p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {paidRate}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Rejection/Reversal Rate
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {rejectionRate}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Total Reward Value
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {formatMoney(totalRewardValue)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">Next Priority</p>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-white">
                    Wire reward approvals into payout batches, payout history,
                    payment exports, admin audit logs, and partner notifications.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                  <BadgeDollarSign className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Reward Totals
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Value Summary
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-black text-blue-900">
                    Pending Value
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-950">
                    {formatMoney(pendingRewardValue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm font-black text-green-900">
                    Approved Value
                  </p>
                  <p className="mt-2 text-3xl font-black text-green-950">
                    {formatMoney(approvedRewardValue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-black text-emerald-900">
                    Paid Value
                  </p>
                  <p className="mt-2 text-3xl font-black text-emerald-950">
                    {formatMoney(paidRewardValue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <p className="text-sm font-black text-red-900">
                    Rejected/Reversed Value
                  </p>
                  <p className="mt-2 text-3xl font-black text-red-950">
                    {formatMoney(rejectedRewardValue)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <Gift className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Source Breakdown
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Reward Sources
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm font-black text-green-900">
                    Partner Rewards
                  </p>
                  <p className="mt-2 text-3xl font-black text-green-950">
                    {formatNumber(partnerRewardCount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <p className="text-sm font-black text-orange-900">
                    Ambassador Rewards
                  </p>
                  <p className="mt-2 text-3xl font-black text-orange-950">
                    {formatNumber(ambassadorRewardCount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                  <p className="text-sm font-black text-purple-900">
                    Affiliate Rewards
                  </p>
                  <p className="mt-2 text-3xl font-black text-purple-950">
                    {formatNumber(affiliateRewardCount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-black text-blue-900">
                    Campaign Rewards
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-950">
                    {formatNumber(campaignRewardCount)}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <SupabaseCoordinationBanner
          pagePath="app/admin/partners/rewards/page.tsx"
          folderPath="app/admin/partners/rewards"
          primaryTable="partner_rewards"
          operation="Read partner_rewards, visualize reward queues and values, approve rewards, reject rewards, reverse rewards, mark rewards paid, and coordinate rewards with payout processing"
          selectQuery='supabase.from("partner_rewards").select("*").order("created_at", { ascending: false })'
          readFields={[
            "partner_rewards.id",
            "partner_rewards.partner_id",
            "partner_rewards.ambassador_id",
            "partner_rewards.affiliate_id",
            "partner_rewards.campaign_id",
            "partner_rewards.tracking_event_id",
            "partner_rewards.reward_type",
            "partner_rewards.reward_source",
            "partner_rewards.title",
            "partner_rewards.description",
            "partner_rewards.referral_code",
            "partner_rewards.event_type",
            "partner_rewards.reward_amount",
            "partner_rewards.revenue_amount",
            "partner_rewards.currency",
            "partner_rewards.status",
            "partner_rewards.approved_at",
            "partner_rewards.rejected_at",
            "partner_rewards.reversed_at",
            "partner_rewards.paid_at",
            "partner_rewards.payout_batch_id",
            "partner_rewards.notes",
            "partner_rewards.audit_note",
            "partner_rewards.created_at",
            "partner_rewards.updated_at",
          ]}
          filters={[
            "review queue includes pending and needs_review rewards",
            "pending value is calculated from reward_amount for pending and needs_review rewards",
            "approved value is calculated from approved rewards",
            "paid value is calculated from paid rewards",
            "rejected/reversed value is calculated from rejected and reversed rewards",
            "source breakdown is calculated from reward_source",
          ]}
          searchFields={[
            "No search input on this page yet",
            "title",
            "referral_code",
            "reward_type",
            "reward_source",
            "status",
          ]}
          writeActions={[
            "updateRewardStatusAction updates partner_rewards.status",
            "approve action writes status approved and approved_at",
            "reject action writes status rejected and rejected_at",
            "reverse action writes status reversed and reversed_at",
            "mark paid action writes status paid and paid_at",
            "all actions update audit_note and updated_at",
          ]}
          exportRoutes={[
            "/api/admin/partners/rewards/export",
            "/admin/partners/payouts",
          ]}
          relatedPages={[
            "/admin/partners",
            "/admin/partners/campaigns",
            "/admin/partners/payouts",
            "/admin/partners/active",
            "/admin/partners/ambassadors",
            "/admin/partners/affiliates",
          ]}
          relatedTables={[
            "partner_tracking_events",
            "partner_campaigns",
            "partner_payouts",
            "partners",
            "ambassadors",
            "affiliates",
          ]}
          notes={[
            "This page now uses reward_amount instead of the old amount field.",
            "Pending value should now correctly show the seeded $15 reward.",
            "Approval, rejection, reversal, and paid actions write directly to partner_rewards.",
            "The next build should wire approved rewards into payout batches and payout export workflows.",
          ]}
        />
      </div>
    </main>
  );
}