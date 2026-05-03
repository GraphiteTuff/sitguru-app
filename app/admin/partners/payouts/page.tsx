import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  BadgeDollarSign,
  Banknote,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  MessageCircle,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BackToPartnersButton from "../_components/back-to-partners-button";
import SupabaseCoordinationBanner from "../_components/supabase-coordination-banner";

type PartnerPayout = {
  id: string;
  partner_id: string | null;
  ambassador_id: string | null;
  affiliate_id: string | null;
  reward_id: string | null;
  payout_batch_id: string | null;

  recipient_name: string | null;
  recipient_email: string | null;
  recipient_type: "partner" | "ambassador" | "affiliate" | "manual" | null;

  payout_amount: number | null;
  currency: string | null;

  payment_method: string | null;
  payment_status:
    | "pending"
    | "approved"
    | "processing"
    | "paid"
    | "failed"
    | "cancelled"
    | "exception"
    | null;

  transaction_reference: string | null;
  accounting_reference: string | null;

  notes: string | null;
  admin_note: string | null;
  exception_reason: string | null;

  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  failed_at: string | null;

  created_at: string;
  updated_at: string;
};

type PartnerReward = {
  id: string;
  partner_id: string | null;
  ambassador_id: string | null;
  affiliate_id: string | null;
  campaign_id: string | null;
  reward_amount: number | null;
  currency: string | null;
  status: string | null;
  payout_batch_id: string | null;
  created_at: string;
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
  }).format(Number(value || 0));
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("en-US").format(value);
}

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function statusClasses(status: PartnerPayout["payment_status"]) {
  switch (status) {
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "approved":
      return "border-green-200 bg-green-50 text-green-800";
    case "processing":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "failed":
    case "exception":
      return "border-red-200 bg-red-50 text-red-800";
    case "cancelled":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function recipientClasses(type: PartnerPayout["recipient_type"]) {
  switch (type) {
    case "partner":
      return "border-green-200 bg-green-50 text-green-800";
    case "ambassador":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "affiliate":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "manual":
      return "border-blue-200 bg-blue-50 text-blue-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function payoutIcon(type: PartnerPayout["recipient_type"]) {
  switch (type) {
    case "partner":
      return "🤝";
    case "ambassador":
      return "⭐";
    case "affiliate":
      return "📈";
    case "manual":
      return "🧾";
    default:
      return "💸";
  }
}

function sumPayouts(
  payouts: PartnerPayout[],
  statuses?: NonNullable<PartnerPayout["payment_status"]>[]
) {
  return payouts.reduce((sum, payout) => {
    if (statuses && !statuses.includes(payout.payment_status || "pending")) {
      return sum;
    }

    return sum + Number(payout.payout_amount || 0);
  }, 0);
}

function sumRewards(
  rewards: PartnerReward[],
  statuses?: string[]
) {
  return rewards.reduce((sum, reward) => {
    if (statuses && !statuses.includes(reward.status || "")) return sum;
    return sum + Number(reward.reward_amount || 0);
  }, 0);
}

async function updatePayoutStatusAction(formData: FormData) {
  "use server";

  const payoutId = String(formData.get("payoutId") || "");
  const paymentStatus = String(
    formData.get("paymentStatus") || ""
  ) as NonNullable<PartnerPayout["payment_status"]>;
  const adminNote = String(formData.get("adminNote") || "");
  const transactionReference = String(
    formData.get("transactionReference") || ""
  );

  if (!payoutId || !paymentStatus) return;

  const now = new Date().toISOString();

  const updatePayload: Partial<PartnerPayout> = {
    payment_status: paymentStatus,
    admin_note: adminNote || null,
    updated_at: now,
  };

  if (transactionReference) {
    updatePayload.transaction_reference = transactionReference;
  }

  if (paymentStatus === "approved") {
    updatePayload.approved_at = now;
  }

  if (paymentStatus === "paid") {
    updatePayload.paid_at = now;
  }

  if (paymentStatus === "failed" || paymentStatus === "exception") {
    updatePayload.failed_at = now;
  }

  const supabase = await createClient();

  await supabase.from("partner_payouts").update(updatePayload).eq("id", payoutId);

  revalidatePath("/admin/partners/payouts");
  revalidatePath("/admin/partners");
}

export default async function AdminPartnerPayoutsPage() {
  const supabase = await createClient();

  const [payoutResponse, rewardResponse] = await Promise.all([
    supabase
      .from("partner_payouts")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("partner_rewards")
      .select(
        "id, partner_id, ambassador_id, affiliate_id, campaign_id, reward_amount, currency, status, payout_batch_id, created_at"
      )
      .order("created_at", { ascending: false }),
  ]);

  const payouts = (payoutResponse.data ?? []) as PartnerPayout[];
  const rewards = (rewardResponse.data ?? []) as PartnerReward[];

  const payoutError = payoutResponse.error;
  const rewardError = rewardResponse.error;

  const pendingCount = payouts.filter(
    (payout) => payout.payment_status === "pending"
  ).length;

  const approvedCount = payouts.filter(
    (payout) => payout.payment_status === "approved"
  ).length;

  const processingCount = payouts.filter(
    (payout) => payout.payment_status === "processing"
  ).length;

  const paidCount = payouts.filter(
    (payout) => payout.payment_status === "paid"
  ).length;

  const failedCount = payouts.filter(
    (payout) =>
      payout.payment_status === "failed" ||
      payout.payment_status === "exception"
  ).length;

  const cancelledCount = payouts.filter(
    (payout) => payout.payment_status === "cancelled"
  ).length;

  const pendingValue = sumPayouts(payouts, ["pending"]);
  const approvedValue = sumPayouts(payouts, ["approved"]);
  const processingValue = sumPayouts(payouts, ["processing"]);
  const paidValue = sumPayouts(payouts, ["paid"]);
  const exceptionValue = sumPayouts(payouts, ["failed", "exception"]);
  const totalPayoutValue = sumPayouts(payouts);

  const approvedRewardValue = sumRewards(rewards, ["approved"]);
  const paidRewardValue = sumRewards(rewards, ["paid"]);
  const payoutReadyRewardValue = approvedRewardValue;

  const partnerPayoutCount = payouts.filter(
    (payout) => payout.recipient_type === "partner"
  ).length;

  const ambassadorPayoutCount = payouts.filter(
    (payout) => payout.recipient_type === "ambassador"
  ).length;

  const affiliatePayoutCount = payouts.filter(
    (payout) => payout.recipient_type === "affiliate"
  ).length;

  const manualPayoutCount = payouts.filter(
    (payout) => payout.recipient_type === "manual"
  ).length;

  const paidRate = percentage(paidCount, payouts.length);
  const approvalRate = percentage(approvedCount + processingCount + paidCount, payouts.length);
  const exceptionRate = percentage(failedCount, payouts.length);

  return (
    <main className="min-h-screen bg-[#F7FAF3] text-[#17382B]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BackToPartnersButton />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/admin/partners/rewards"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous: Rewards
                </Link>

                <Link
                  href="/api/admin/partners/payouts/export"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Link>
              </div>
            </div>

            <div className="max-w-4xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <WalletCards className="h-7 w-7" />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Partner Network Payments and Accounting Reports
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-[#17382B] sm:text-5xl lg:text-6xl">
                Payouts
              </h1>

              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
                Track SitGuru partner payouts, ambassador payments, affiliate
                commissions, payout batches, payment statuses, transaction
                references, exceptions, and accounting-ready payout reporting.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-black text-blue-900">Pending Payouts</p>
            <p className="mt-3 text-4xl font-black leading-none text-blue-950">
              {pendingCount}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Payouts waiting for admin approval or payment processing.
            </p>
          </div>

          <div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-black text-green-900">Approved / Processing</p>
            <p className="mt-3 text-4xl font-black leading-none text-green-950">
              {approvedCount + processingCount}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Payouts approved or currently being processed.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-black text-emerald-900">Paid Payouts</p>
            <p className="mt-3 text-4xl font-black leading-none text-emerald-950">
              {paidCount}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Payouts marked paid with accounting or transaction references.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-black text-amber-900">Pending Value</p>
            <p className="mt-3 text-4xl font-black leading-none text-amber-950">
              {formatMoney(pendingValue)}
            </p>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Estimated payout value waiting for approval or processing.
            </p>
          </div>
        </section>

        {payoutError ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
            <h2 className="text-xl font-black">Could not load payouts</h2>
            <p className="mt-2 text-sm font-semibold leading-6">
              Supabase returned an error while loading partner payouts.
            </p>
            <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-xs font-bold text-red-900">
              {payoutError.message}
            </pre>
          </section>
        ) : null}

        {rewardError ? (
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
            <h2 className="text-xl font-black">
              Reward payout readiness could not load
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6">
              The Payouts page loaded, but Supabase could not read
              partner_rewards for payout-ready reward value.
            </p>
            <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-xs font-bold text-amber-900">
              {rewardError.message}
            </pre>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                  Payout Records
                </p>

                <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                  {payouts.length} Payout Records
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Partner Network payout records for partners, ambassadors,
                  affiliates, manual payments, payout batches, accounting exports,
                  and exception handling.
                </p>
              </div>

              {payouts.length === 0 ? (
                <div className="rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                    💸
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#17382B]">
                    No payouts yet
                  </h3>

                  <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                    Once approved rewards are batched for payment, payout records
                    will appear here with recipient details, payment status,
                    transaction references, and accounting export readiness.
                  </p>

                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/admin/partners/rewards"
                      className="inline-flex rounded-2xl bg-[#007A3D] px-5 py-3 text-sm font-black !text-white transition hover:bg-[#006B35]"
                    >
                      View Rewards
                    </Link>

                    <BackToPartnersButton />
                  </div>
                </div>
              ) : (
                <div className="grid gap-5">
                  {payouts.map((payout) => (
                    <article
                      key={payout.id}
                      className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-sm"
                    >
                      <div className="border-b border-emerald-100 bg-[#FBFCF8] p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                              {payoutIcon(payout.recipient_type)}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-black ${recipientClasses(
                                    payout.recipient_type
                                  )}`}
                                >
                                  {formatLabel(payout.recipient_type)}
                                </span>

                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                                    payout.payment_status
                                  )}`}
                                >
                                  {formatLabel(payout.payment_status)}
                                </span>

                                {payout.payout_batch_id ? (
                                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">
                                    Batch Linked
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
                                    No Batch
                                  </span>
                                )}
                              </div>

                              <h3 className="mt-3 text-2xl font-black text-[#17382B]">
                                {payout.recipient_name || "Unnamed Recipient"}
                              </h3>

                              <p className="mt-1 text-sm font-semibold text-slate-600">
                                Created {formatDate(payout.created_at)} · Updated{" "}
                                {formatDate(payout.updated_at)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Link
                              href={`/admin/messages?payoutId=${payout.id}`}
                              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-50"
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Message
                            </Link>

                            <Link
                              href="/api/admin/partners/payouts/export"
                              className="inline-flex items-center justify-center rounded-xl bg-[#007A3D] px-4 py-2 text-sm font-black !text-white transition hover:bg-[#006B35]"
                            >
                              <FileSpreadsheet className="mr-2 h-4 w-4 !text-white" />
                              Export
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-5 p-5 lg:grid-cols-3">
                        <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Payout Amount
                          </p>

                          <p className="mt-3 text-3xl font-black text-[#17382B]">
                            {formatMoney(payout.payout_amount, payout.currency || "USD")}
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            Currency: {payout.currency || "USD"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Recipient
                          </p>

                          <p className="mt-3 text-sm font-black text-[#17382B]">
                            {payout.recipient_name || "Not provided"}
                          </p>

                          <p className="mt-2 break-words text-sm font-semibold text-slate-700">
                            {payout.recipient_email || "No email provided"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-[#FBFCF8] p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Payment Timeline
                          </p>

                          <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">
                            <p>Approved: {formatDate(payout.approved_at)}</p>
                            <p>Paid: {formatDate(payout.paid_at)}</p>
                            <p>Failed: {formatDate(payout.failed_at)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-5 border-t border-emerald-100 p-5 lg:grid-cols-4">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-blue-900">
                            Partner ID
                          </p>
                          <p className="mt-3 break-words text-sm font-black text-blue-950">
                            {payout.partner_id || "Not linked"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-orange-900">
                            Ambassador ID
                          </p>
                          <p className="mt-3 break-words text-sm font-black text-orange-950">
                            {payout.ambassador_id || "Not linked"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-purple-900">
                            Affiliate ID
                          </p>
                          <p className="mt-3 break-words text-sm font-black text-purple-950">
                            {payout.affiliate_id || "Not linked"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-900">
                            Reward ID
                          </p>
                          <p className="mt-3 break-words text-sm font-black text-emerald-950">
                            {payout.reward_id || "Not linked"}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-5 border-t border-emerald-100 p-5 lg:grid-cols-3">
                        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Payment Details
                          </p>

                          <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">
                            <p>Method: {payout.payment_method || "Not set"}</p>
                            <p>
                              Transaction:{" "}
                              {payout.transaction_reference || "Not provided"}
                            </p>
                            <p>
                              Accounting Ref:{" "}
                              {payout.accounting_reference || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Batch Details
                          </p>

                          <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">
                            <p>Batch ID: {payout.payout_batch_id || "Not batched"}</p>
                            <p>Approved By: {payout.approved_by || "Not available"}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                            Exceptions
                          </p>

                          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                            {payout.exception_reason ||
                              payout.admin_note ||
                              payout.notes ||
                              "No exceptions recorded."}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-emerald-100 p-5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <form action={updatePayoutStatusAction}>
                            <input type="hidden" name="payoutId" value={payout.id} />
                            <input
                              type="hidden"
                              name="paymentStatus"
                              value="approved"
                            />
                            <input
                              type="hidden"
                              name="adminNote"
                              value="Payout approved from admin payouts page."
                            />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-xl bg-[#007A3D] px-4 py-3 text-sm font-black !text-white transition hover:bg-[#006B35]"
                            >
                              <ShieldCheck className="mr-2 h-4 w-4 !text-white" />
                              Approve
                            </button>
                          </form>

                          <form action={updatePayoutStatusAction}>
                            <input type="hidden" name="payoutId" value={payout.id} />
                            <input
                              type="hidden"
                              name="paymentStatus"
                              value="processing"
                            />
                            <input
                              type="hidden"
                              name="adminNote"
                              value="Payout moved to processing from admin payouts page."
                            />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-900 transition hover:bg-blue-100"
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Processing
                            </button>
                          </form>

                          <form action={updatePayoutStatusAction}>
                            <input type="hidden" name="payoutId" value={payout.id} />
                            <input type="hidden" name="paymentStatus" value="paid" />
                            <input
                              type="hidden"
                              name="transactionReference"
                              value={`TXN-${payout.id.slice(0, 8).toUpperCase()}`}
                            />
                            <input
                              type="hidden"
                              name="adminNote"
                              value="Payout marked paid from admin payouts page."
                            />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark Paid
                            </button>
                          </form>

                          <form action={updatePayoutStatusAction}>
                            <input type="hidden" name="payoutId" value={payout.id} />
                            <input
                              type="hidden"
                              name="paymentStatus"
                              value="exception"
                            />
                            <input
                              type="hidden"
                              name="adminNote"
                              value="Payout marked as exception from admin payouts page."
                            />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-900 transition hover:bg-red-100"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Exception
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
                <Banknote className="h-6 w-6 !text-white" />
              </div>

              <h2 className="text-3xl font-black leading-tight !text-white">
                Payout Health
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
                  <p className="text-sm font-black !text-white">Exception Rate</p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {exceptionRate}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">
                    Total Payout Value
                  </p>
                  <p className="mt-2 text-3xl font-black !text-white">
                    {formatMoney(totalPayoutValue)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 !text-white">
                  <p className="text-sm font-black !text-white">Next Priority</p>
                  <p className="mt-2 text-sm font-semibold leading-6 !text-white">
                    Wire payout batch creation, payment provider exports,
                    accounting references, exception resolution, and payout
                    notifications.
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
                    Payout Totals
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
                    {formatMoney(pendingValue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm font-black text-green-900">
                    Approved Value
                  </p>
                  <p className="mt-2 text-3xl font-black text-green-950">
                    {formatMoney(approvedValue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                  <p className="text-sm font-black text-purple-900">
                    Processing Value
                  </p>
                  <p className="mt-2 text-3xl font-black text-purple-950">
                    {formatMoney(processingValue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-black text-emerald-900">
                    Paid Value
                  </p>
                  <p className="mt-2 text-3xl font-black text-emerald-950">
                    {formatMoney(paidValue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <p className="text-sm font-black text-red-900">
                    Exception Value
                  </p>
                  <p className="mt-2 text-3xl font-black text-red-950">
                    {formatMoney(exceptionValue)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <RefreshCcw className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Reward Readiness
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Batch Inputs
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm font-black text-green-900">
                    Approved Rewards
                  </p>
                  <p className="mt-2 text-3xl font-black text-green-950">
                    {formatMoney(approvedRewardValue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-black text-emerald-900">
                    Paid Rewards
                  </p>
                  <p className="mt-2 text-3xl font-black text-emerald-950">
                    {formatMoney(paidRewardValue)}
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-black text-blue-900">
                    Payout Ready
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-950">
                    {formatMoney(payoutReadyRewardValue)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                  <ShieldAlert className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Recipient Breakdown
                  </p>
                  <h2 className="text-2xl font-black text-[#17382B]">
                    Sources
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-sm font-black text-green-900">
                    Partner Payouts
                  </p>
                  <p className="mt-2 text-3xl font-black text-green-950">
                    {formatNumber(partnerPayoutCount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <p className="text-sm font-black text-orange-900">
                    Ambassador Payouts
                  </p>
                  <p className="mt-2 text-3xl font-black text-orange-950">
                    {formatNumber(ambassadorPayoutCount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                  <p className="text-sm font-black text-purple-900">
                    Affiliate Payouts
                  </p>
                  <p className="mt-2 text-3xl font-black text-purple-950">
                    {formatNumber(affiliatePayoutCount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-black text-blue-900">
                    Manual Payouts
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-950">
                    {formatNumber(manualPayoutCount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-800">
                    Cancelled
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {formatNumber(cancelledCount)}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <SupabaseCoordinationBanner
          pagePath="app/admin/partners/payouts/page.tsx"
          folderPath="app/admin/partners/payouts"
          primaryTable="partner_payouts"
          operation="Read partner_payouts, read partner_rewards for payout readiness, approve payouts, move payouts to processing, mark payouts paid, mark payout exceptions, and prepare accounting-ready payout reporting"
          selectQuery='supabase.from("partner_payouts").select("*").order("created_at", { ascending: false }); supabase.from("partner_rewards").select("id, partner_id, ambassador_id, affiliate_id, campaign_id, reward_amount, currency, status, payout_batch_id, created_at").order("created_at", { ascending: false })'
          readFields={[
            "partner_payouts.id",
            "partner_payouts.partner_id",
            "partner_payouts.ambassador_id",
            "partner_payouts.affiliate_id",
            "partner_payouts.reward_id",
            "partner_payouts.payout_batch_id",
            "partner_payouts.recipient_name",
            "partner_payouts.recipient_email",
            "partner_payouts.recipient_type",
            "partner_payouts.payout_amount",
            "partner_payouts.currency",
            "partner_payouts.payment_method",
            "partner_payouts.payment_status",
            "partner_payouts.transaction_reference",
            "partner_payouts.accounting_reference",
            "partner_payouts.exception_reason",
            "partner_payouts.approved_at",
            "partner_payouts.paid_at",
            "partner_payouts.failed_at",
            "partner_payouts.created_at",
            "partner_payouts.updated_at",
            "partner_rewards.id",
            "partner_rewards.reward_amount",
            "partner_rewards.status",
            "partner_rewards.payout_batch_id",
          ]}
          filters={[
            "pending value is calculated from partner_payouts.payout_amount where payment_status is pending",
            "approved value is calculated from approved payouts",
            "processing value is calculated from processing payouts",
            "paid value is calculated from paid payouts",
            "exception value is calculated from failed and exception payouts",
            "reward readiness reads approved and paid partner_rewards rows",
            "recipient breakdown is calculated from recipient_type",
          ]}
          searchFields={[
            "No search input on this page yet",
            "recipient_name",
            "recipient_email",
            "transaction_reference",
            "accounting_reference",
            "payout_batch_id",
            "payment_status",
          ]}
          writeActions={[
            "updatePayoutStatusAction updates partner_payouts.payment_status",
            "approve action writes approved status and approved_at",
            "processing action writes processing status",
            "mark paid action writes paid status, paid_at, and transaction_reference",
            "exception action writes exception status and failed_at",
            "all payout actions update admin_note and updated_at",
          ]}
          exportRoutes={[
            "/api/admin/partners/payouts/export",
            "/admin/partners/rewards",
          ]}
          relatedPages={[
            "/admin/partners",
            "/admin/partners/rewards",
            "/admin/partners/campaigns",
            "/admin/partners/active",
            "/admin/partners/ambassadors",
            "/admin/partners/affiliates",
          ]}
          relatedTables={[
            "partner_rewards",
            "partner_tracking_events",
            "partner_campaigns",
            "partners",
            "ambassadors",
            "affiliates",
          ]}
          notes={[
            "This page is designed for accounting-ready payout reporting.",
            "Approved rewards are shown as payout-ready inputs until payout batches are created.",
            "Payout action buttons write directly to partner_payouts.",
            "The next build should add payout batch creation and external payment provider exports.",
          ]}
        />
      </div>
    </main>
  );
}