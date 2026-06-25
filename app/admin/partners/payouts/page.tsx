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
  UserCheck,
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


type StripeReadinessRecord = {
  id: string;
  role: "Guru" | "Ambassador";
  name: string;
  email: string;
  stripeAccountId: string | null;
  onboardingComplete: boolean | null;
  payoutsEnabled: boolean | null;
  chargesEnabled: boolean | null;
  disabledReason: string | null;
  requirementsDue: number;
  latestPaymentMethod: string | null;
  payoutCount: number;
  exceptionCount: number;
  missingReferenceCount: number;
  needsAdminReview: boolean;
  reviewReasons: string[];
};

type ReadinessCounts = {
  stripeReady: number;
  stripeOnboardingStarted: number;
  stripeRestricted: number;
  noStripeAccount: number;
  existingNonStripeMethods: number;
  missingPayoutReference: number;
  needsAdminReview: number;
};

type SourceRow = Record<string, unknown>;

const STRIPE_METHOD_VALUES = new Set(["stripe", "stripe_connect", "connect", "stripe transfer", "stripe_transfer"]);

function asText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (["true", "yes", "1", "enabled", "complete", "completed"].includes(normalized)) return true;
    if (["false", "no", "0", "disabled", "incomplete"].includes(normalized)) return false;
  }
  if (typeof value === "number") return value === 1;
  return null;
}

function getAccountId(row: SourceRow) {
  return asText(row.stripe_account_id) || asText(row.stripe_connect_account_id);
}

function getPayoutReference(payout: PartnerPayout) {
  return (
    asText(payout.transaction_reference) ||
    asText(payout.accounting_reference) ||
    asText(payout.payout_batch_id)
  );
}

function isNonStripePaymentMethod(value: string | null | undefined) {
  if (!value) return false;
  return !STRIPE_METHOD_VALUES.has(value.toLowerCase().trim());
}

function buildReadinessRecords(
  gurus: SourceRow[],
  ambassadors: SourceRow[],
  payouts: PartnerPayout[]
) {
  const payoutsByAmbassador = new Map<string, PartnerPayout[]>();

  for (const payout of payouts) {
    if (payout.ambassador_id) {
      const existing = payoutsByAmbassador.get(payout.ambassador_id) ?? [];
      existing.push(payout);
      payoutsByAmbassador.set(payout.ambassador_id, existing);
    }
  }

  const buildRecord = (row: SourceRow, role: "Guru" | "Ambassador"): StripeReadinessRecord => {
    const id = asText(row.id) || `${role.toLowerCase()}-unknown`;
    const accountId = getAccountId(row);
    const onboardingComplete =
      asBoolean(row.stripe_onboarding_complete) ?? asBoolean(row.onboarding_complete);
    const payoutsEnabled =
      asBoolean(row.payouts_enabled) ??
      asBoolean(row.stripe_payouts_enabled) ??
      asBoolean(row.stripe_payouts_enabled_at);
    const chargesEnabled =
      asBoolean(row.charges_enabled) ?? asBoolean(row.stripe_charges_enabled);
    const disabledReason = asText(row.stripe_disabled_reason);
    const requirementsDue = Array.isArray(row.stripe_requirements_currently_due)
      ? row.stripe_requirements_currently_due.length
      : Number(row.stripe_requirements_currently_due_count || 0);
    const relatedPayouts = role === "Ambassador" ? payoutsByAmbassador.get(id) ?? [] : [];
    const latestPaymentMethod = relatedPayouts.find((payout) => payout.payment_method)?.payment_method || null;
    const exceptionCount = relatedPayouts.filter((payout) =>
      payout.payment_status === "exception" || payout.payment_status === "failed" || Boolean(payout.exception_reason)
    ).length;
    const missingReferenceCount = relatedPayouts.filter((payout) => !getPayoutReference(payout)).length;
    const reviewReasons = [
      !accountId ? "No Stripe account" : null,
      accountId && onboardingComplete !== true ? "Stripe onboarding incomplete" : null,
      accountId && payoutsEnabled !== true ? "Payouts disabled or unknown" : null,
      accountId && chargesEnabled !== true ? "Charges disabled or unknown" : null,
      disabledReason || requirementsDue > 0 ? "Stripe restricted or missing setup" : null,
      latestPaymentMethod && isNonStripePaymentMethod(latestPaymentMethod) ? `Existing ${latestPaymentMethod} method` : null,
      exceptionCount > 0 ? "Payout exception" : null,
      missingReferenceCount > 0 ? "Missing payout reference" : null,
    ].filter(Boolean) as string[];

    return {
      id,
      role,
      name:
        asText(row.display_name) ||
        asText(row.full_name) ||
        asText(row.name) ||
        asText(row.business_name) ||
        "Unnamed recipient",
      email: asText(row.email) || asText(row.contact_email) || "No email saved",
      stripeAccountId: accountId,
      onboardingComplete,
      payoutsEnabled,
      chargesEnabled,
      disabledReason,
      requirementsDue,
      latestPaymentMethod,
      payoutCount: relatedPayouts.length,
      exceptionCount,
      missingReferenceCount,
      needsAdminReview: reviewReasons.length > 0,
      reviewReasons,
    };
  };

  return [
    ...gurus.map((guru) => buildRecord(guru, "Guru")),
    ...ambassadors.map((ambassador) => buildRecord(ambassador, "Ambassador")),
  ].sort((a, b) => Number(b.needsAdminReview) - Number(a.needsAdminReview) || a.name.localeCompare(b.name));
}

function buildReadinessCounts(records: StripeReadinessRecord[], payouts: PartnerPayout[]): ReadinessCounts {
  const nonStripeMethods = new Set(
    payouts.map((payout) => payout.payment_method).filter((method): method is string => isNonStripePaymentMethod(method))
  );

  return {
    stripeReady: records.filter(
      (record) => record.stripeAccountId && record.onboardingComplete === true && record.payoutsEnabled === true && record.chargesEnabled === true && !record.disabledReason && record.requirementsDue === 0
    ).length,
    stripeOnboardingStarted: records.filter(
      (record) => record.stripeAccountId && record.onboardingComplete !== true && !record.disabledReason
    ).length,
    stripeRestricted: records.filter(
      (record) => record.stripeAccountId && (record.payoutsEnabled !== true || record.disabledReason || record.requirementsDue > 0)
    ).length,
    noStripeAccount: records.filter((record) => !record.stripeAccountId).length,
    existingNonStripeMethods: nonStripeMethods.size,
    missingPayoutReference: payouts.filter((payout) => !getPayoutReference(payout)).length,
    needsAdminReview: records.filter((record) => record.needsAdminReview).length,
  };
}

function readinessBadgeClasses(value: boolean | null) {
  if (value === true) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value === false) return "border-red-200 bg-red-50 text-red-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function readinessLabel(value: boolean | null, trueLabel = "Enabled", falseLabel = "Disabled") {
  if (value === true) return trueLabel;
  if (value === false) return falseLabel;
  return "Unknown";
}

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

  const [payoutResponse, rewardResponse, guruResponse, ambassadorResponse] = await Promise.all([
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
    supabase.from("gurus").select("*").order("created_at", { ascending: false }),
    supabase.from("ambassadors").select("*").order("created_at", { ascending: false }),
  ]);

  const payouts = (payoutResponse.data ?? []) as PartnerPayout[];
  const rewards = (rewardResponse.data ?? []) as PartnerReward[];
  const gurus = (guruResponse.data ?? []) as SourceRow[];
  const ambassadors = (ambassadorResponse.data ?? []) as SourceRow[];

  const payoutError = payoutResponse.error;
  const rewardError = rewardResponse.error;
  const readinessError = guruResponse.error || ambassadorResponse.error;
  const readinessRecords = buildReadinessRecords(gurus, ambassadors, payouts);
  const readinessCounts = buildReadinessCounts(readinessRecords, payouts);
  const nonStripePaymentMethods = Array.from(
    new Set(
      payouts
        .map((payout) => payout.payment_method)
        .filter((method): method is string => isNonStripePaymentMethod(method))
    )
  ).sort();
  const payoutReviewRows = payouts.filter(
    (payout) =>
      payout.payment_status === "exception" ||
      payout.payment_status === "failed" ||
      Boolean(payout.exception_reason) ||
      !getPayoutReference(payout) ||
      isNonStripePaymentMethod(payout.payment_method)
  );

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

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <UserCheck className="h-6 w-6" />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
                Admin-only payout operations
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-[#17382B] sm:text-4xl">
                Payout Method Readiness
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                Read-only visibility into Guru and Ambassador Stripe Connect readiness,
                existing partner payout payment methods, payout exceptions, and rows
                that may need finance review before any backup payout decision.
              </p>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-950 lg:max-w-md">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-800">
                Admin policy guardrails
              </p>
              <ul className="mt-3 space-y-2 text-sm font-bold leading-6">
                <li>Pet Parent payments must stay inside SitGuru checkout.</li>
                <li>Backup payout methods are for admin-approved SitGuru-to-Guru/Ambassador payouts only.</li>
                <li>Do not expose PayPal, Venmo, Cash App, Zelle, or direct payment handles to Pet Parents.</li>
              </ul>
            </div>
          </div>

          {readinessError ? (
            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <h3 className="text-lg font-black">Readiness data partially unavailable</h3>
              <p className="mt-2 text-sm font-semibold leading-6">
                The payouts page loaded, but Guru or Ambassador Stripe readiness rows could not be read.
              </p>
              <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-xs font-bold text-amber-900">
                {readinessError.message}
              </pre>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Stripe ready", readinessCounts.stripeReady, "Onboarding, charges, and payouts enabled."],
              ["Stripe onboarding started", readinessCounts.stripeOnboardingStarted, "Stripe account exists but setup is not complete."],
              ["Restricted / payouts disabled", readinessCounts.stripeRestricted, "Payouts disabled, setup missing, or restricted."],
              ["No Stripe account", readinessCounts.noStripeAccount, "No Connect account ID saved."],
              ["Non-Stripe/manual methods", readinessCounts.existingNonStripeMethods, "Distinct existing partner_payouts.payment_method values."],
              ["Missing payout reference", readinessCounts.missingPayoutReference, "Rows lacking transaction, accounting, or batch reference."],
              ["Needs admin review", readinessCounts.needsAdminReview, "Guru/Ambassador records with readiness issues."],
              ["Payout rows to review", payoutReviewRows.length, "Exception, missing-reference, or non-Stripe method rows."],
            ].map(([label, value, description]) => (
              <div key={String(label)} className="rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-5">
                <p className="text-sm font-black text-emerald-900">{label}</p>
                <p className="mt-3 text-4xl font-black leading-none text-[#17382B]">{value}</p>
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white">
              <div className="border-b border-emerald-100 bg-[#FBFCF8] p-5">
                <h3 className="text-xl font-black text-[#17382B]">Guru / Ambassador Stripe readiness</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Displays saved Connect IDs and readiness flags only; this does not call Stripe or alter transfers.
                </p>
              </div>
              <div className="max-h-[520px] overflow-auto">
                <table className="min-w-full divide-y divide-emerald-100 text-left text-sm">
                  <thead className="bg-white text-xs font-black uppercase tracking-wide text-emerald-700">
                    <tr>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Stripe account</th>
                      <th className="px-4 py-3">Onboarding</th>
                      <th className="px-4 py-3">Payouts</th>
                      <th className="px-4 py-3">Charges</th>
                      <th className="px-4 py-3">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {readinessRecords.slice(0, 75).map((record) => (
                      <tr key={`${record.role}-${record.id}`} className="align-top">
                        <td className="px-4 py-4">
                          <p className="font-black text-[#17382B]">{record.name}</p>
                          <p className="mt-1 text-xs font-bold text-slate-600">{record.role} · {record.email}</p>
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-700">
                          {record.stripeAccountId || "No Stripe account"}
                          {record.disabledReason ? <p className="mt-1 text-xs text-red-700">{record.disabledReason}</p> : null}
                          {record.requirementsDue > 0 ? <p className="mt-1 text-xs text-amber-700">{record.requirementsDue} requirements due</p> : null}
                        </td>
                        <td className="px-4 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-black ${readinessBadgeClasses(record.onboardingComplete)}`}>{readinessLabel(record.onboardingComplete, "Complete", "Incomplete")}</span></td>
                        <td className="px-4 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-black ${readinessBadgeClasses(record.payoutsEnabled)}`}>{readinessLabel(record.payoutsEnabled)}</span></td>
                        <td className="px-4 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-black ${readinessBadgeClasses(record.chargesEnabled)}`}>{readinessLabel(record.chargesEnabled)}</span></td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-700">
                          {record.reviewReasons.length ? record.reviewReasons.join(" · ") : "Stripe ready"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-emerald-100 bg-[#FBFCF8] p-5">
                <h3 className="text-lg font-black text-[#17382B]">Existing payment_method values</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  {nonStripePaymentMethods.length ? nonStripePaymentMethods.join(", ") : "No non-Stripe/manual values found."}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-lg font-black text-amber-950">Manual review payout rows</h3>
                <div className="mt-4 space-y-3">
                  {payoutReviewRows.slice(0, 8).map((payout) => (
                    <div key={payout.id} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                      <p className="font-black text-[#17382B]">{payout.recipient_name || "Unnamed recipient"}</p>
                      <p className="mt-1 font-semibold text-slate-700">
                        {formatMoney(payout.payout_amount, payout.currency || "USD")} · {formatLabel(payout.payment_status)} · {payout.payment_method || "No method"}
                      </p>
                      <p className="mt-1 text-xs font-bold text-amber-800">
                        {payout.exception_reason || (!getPayoutReference(payout) ? "Missing payout reference" : "Review payment method")}
                      </p>
                    </div>
                  ))}
                  {payoutReviewRows.length === 0 ? (
                    <p className="text-sm font-semibold leading-6 text-slate-700">No payout exception or missing-reference rows found.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

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