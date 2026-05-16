import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type GenericRow = Record<string, unknown>;

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

type ReadinessStatus = "ready" | "needs_review" | "missing";

type ReconciliationItem = {
  id: string;
  source: string;
  label: string;
  amount: number;
  status: string;
  bankStatus: string;
  reviewStatus: string;
  date: string;
  reference: string;
  category: string;
  issueType: string;
  recommendation: string;
};

type ReconciliationCheck = {
  label: string;
  status: ReadinessStatus;
  detail: string;
};

type ReconciliationData = {
  bankItems: ReconciliationItem[];
  manualItems: ReconciliationItem[];
  needsReviewItems: ReconciliationItem[];
  pendingItems: ReconciliationItem[];
  excludedItems: ReconciliationItem[];
  duplicateItems: ReconciliationItem[];
  uncategorizedItems: ReconciliationItem[];
  trustSafetyItems: ReconciliationItem[];
  stripeItems: ReconciliationItem[];
  growthMarketingItems: ReconciliationItem[];
  referralRewardItems: ReconciliationItem[];
  growthItems: ReconciliationItem[];
  reportChecks: ReconciliationCheck[];
  sourceCounts: { label: string; count: number; source: string }[];
  totals: {
    bankRows: number;
    postedRows: number;
    pendingRows: number;
    needsReviewRows: number;
    excludedRows: number;
    manualRows: number;
    duplicateRows: number;
    uncategorizedRows: number;
    stripeRows: number;
    trustSafetyRows: number;
    growthMarketingRows: number;
    referralRewardRows: number;
    growthRows: number;
    growthNeedsMatchingRows: number;
    totalCashIn: number;
    totalCashOut: number;
    netCashMovement: number;
    manualExpenseTotal: number;
    growthMarketingTotal: number;
    issuedReferralRewardTotal: number;
    pendingReferralRewardLiabilityTotal: number;
    reviewQueueTotal: number;
    reconciliationScore: number;
  };
};

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Reconciliation query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Reconciliation query skipped for ${label}:`, error);
    return [];
  }
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/[$,%\s,()]/g, "");
    const parsed = Number(cleaned);

    if (Number.isFinite(parsed)) {
      return value.includes("(") && value.includes(")") ? -parsed : parsed;
    }
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function centsToDollars(value: unknown) {
  return toNumber(value) / 100;
}

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
}

function moneyExact(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value || 0));

  return value < 0 ? `(${formatted})` : formatted;
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

function getOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }

  return false;
}

function hasFinancialRole(role: string) {
  return [
    "owner",
    "super_admin",
    "admin",
    "finance_admin",
    "finance",
    "accounting",
    "bookkeeper",
  ].includes(role.trim().toLowerCase());
}

function getEnvAdminEmails() {
  return String(
    process.env.SITGURU_FINANCE_ADMIN_EMAILS ||
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      "",
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const userEmail = (user.email || "").toLowerCase();
  const envAdminEmails = getEnvAdminEmails();

  const profileChecks = await Promise.all([
    safeRows<GenericRow>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_reconciliation_access",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_reconciliation_access",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_reconciliation_access",
    ),
  ]);

  const profile = (profileChecks.flat().find(Boolean) || {}) as GenericRow;
  const role = asTrimmedString(profile.role) || "admin";
  const active =
    profile.is_active === undefined
      ? true
      : getOptionalBoolean(profile.is_active);
  const explicitFinanceAccess = getOptionalBoolean(
    profile.can_access_financials,
  );
  const envAllowed = envAdminEmails.includes(userEmail);
  const canAccessFinancials =
    active && (hasFinancialRole(role) || explicitFinanceAccess || envAllowed);

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessFinancials,
  };
}

function getRowDate(row: GenericRow) {
  return (
    asTrimmedString(row.date) ||
    asTrimmedString(row.transaction_date) ||
    asTrimmedString(row.cost_date) ||
    asTrimmedString(row.posted_at) ||
    asTrimmedString(row.paid_at) ||
    asTrimmedString(row.earned_at) ||
    asTrimmedString(row.created_at) ||
    asTrimmedString(row.updated_at) ||
    ""
  );
}

function getRowLabel(row: GenericRow) {
  return (
    asTrimmedString(row.merchant_name) ||
    asTrimmedString(row.campaign_name) ||
    asTrimmedString(row.name) ||
    asTrimmedString(row.description) ||
    asTrimmedString(row.label) ||
    asTrimmedString(row.title) ||
    asTrimmedString(row.financial_category) ||
    "Financial activity"
  );
}

function getRowReference(row: GenericRow, fallback: string) {
  return (
    asTrimmedString(row.transaction_id) ||
    asTrimmedString(row.plaid_transaction_id) ||
    asTrimmedString(row.id) ||
    asTrimmedString(row.reward_id) ||
    asTrimmedString(row.referral_code_id) ||
    asTrimmedString(row.campaign_id) ||
    asTrimmedString(row.payment_intent_id) ||
    asTrimmedString(row.stripe_id) ||
    asTrimmedString(row.account_id) ||
    fallback
  );
}

function getBankCategoryType(row: GenericRow) {
  return (
    asTrimmedString(row.sitguru_category_type).toLowerCase() || "uncategorized"
  );
}

function getBankCategory(row: GenericRow) {
  return asTrimmedString(row.sitguru_category) || "Uncategorized";
}

function getReviewStatus(row: GenericRow) {
  return asTrimmedString(row.review_status) || "needs_review";
}

function getBankStatus(row: GenericRow) {
  return getOptionalBoolean(row.pending) ? "Pending" : "Posted";
}

function getBankAmount(row: GenericRow) {
  return Math.abs(toNumber(row.amount));
}

function getSignedBankCashAmount(row: GenericRow) {
  const type = getBankCategoryType(row);
  const amount = getBankAmount(row);

  if (type === "income" || type === "owner_equity") return amount;

  if (type === "expense" || type === "owner_draw" || type === "liability") {
    return -amount;
  }

  if (type === "transfer") {
    const label = `${getRowLabel(row)} ${asTrimmedString(row.sitguru_notes)}`.toLowerCase();

    if (
      label.includes("from savings") ||
      label.includes("to checking") ||
      label.includes("deposit")
    ) {
      return amount;
    }

    return -amount;
  }

  return toNumber(row.amount);
}

function getManualExpenseAmount(row: GenericRow) {
  return Math.abs(
    toNumber(row.amount) ||
      toNumber(row.total_amount) ||
      toNumber(row.expense_amount) ||
      toNumber(row.cost),
  );
}

function centsAwareAmount(value: unknown) {
  const amount = toNumber(value);

  if (Math.abs(amount) > 10000 && Number.isInteger(amount)) {
    return amount / 100;
  }

  return amount;
}

function getStripeAmount(row: GenericRow) {
  return (
    centsAwareAmount(row.net) ||
    centsAwareAmount(row.net_amount) ||
    centsAwareAmount(row.amount) ||
    centsAwareAmount(row.gross_amount) ||
    centsAwareAmount(row.balance_amount) ||
    centsToDollars(row.amount_cents) ||
    centsToDollars(row.net_amount_cents)
  );
}

function getTrustSafetyAmount(row: GenericRow) {
  return (
    centsToDollars(row.net_amount_cents) ||
    centsToDollars(row.gross_amount_cents) ||
    centsToDollars(row.remaining_balance_cents) ||
    centsToDollars(row.deduction_amount_cents) ||
    toNumber(row.amount) ||
    0
  );
}

function getBookingStripeAmount(row: GenericRow) {
  return (
    centsAwareAmount(row.total_customer_paid) ||
    centsAwareAmount(row.amount_total) ||
    centsAwareAmount(row.subtotal_amount) ||
    centsAwareAmount(row.total_amount) ||
    centsAwareAmount(row.booking_total) ||
    centsToDollars(row.amount_total_cents) ||
    centsToDollars(row.subtotal_amount_cents)
  );
}

function getBookingStripeFee(row: GenericRow) {
  return (
    centsAwareAmount(row.sitguru_fee_amount) ||
    centsAwareAmount(row.platform_fee) ||
    centsAwareAmount(row.marketplace_fee_amount) ||
    centsAwareAmount(row.stripe_fee) ||
    centsAwareAmount(row.processing_fee) ||
    centsToDollars(row.sitguru_fee_amount_cents) ||
    centsToDollars(row.platform_fee_cents) ||
    centsToDollars(row.marketplace_fee_amount_cents) ||
    centsToDollars(row.stripe_fee_cents)
  );
}

function getPayoutAmount(row: GenericRow) {
  return (
    centsAwareAmount(row.net_amount) ||
    centsAwareAmount(row.amount) ||
    centsAwareAmount(row.payout_amount) ||
    centsAwareAmount(row.transfer_amount) ||
    centsToDollars(row.net_amount_cents) ||
    centsToDollars(row.amount_cents) ||
    centsToDollars(row.payout_amount_cents) ||
    centsToDollars(row.transfer_amount_cents)
  );
}

function getGrowthMarketingAmount(row: GenericRow) {
  return (
    toNumber(row.amount) ||
    toNumber(row.total_amount) ||
    toNumber(row.cost_amount) ||
    toNumber(row.spend_amount) ||
    toNumber(row.expense_amount)
  );
}

function getReferralRewardAmount(row: GenericRow) {
  return (
    toNumber(row.normalized_amount) ||
    toNumber(row.reward_amount) ||
    toNumber(row.credit_amount) ||
    toNumber(row.payout_amount) ||
    toNumber(row.commission_amount) ||
    toNumber(row.amount)
  );
}

function isStripeRelatedBooking(row: GenericRow) {
  return Boolean(
    asTrimmedString(row.stripe_session_id) ||
      asTrimmedString(row.stripe_checkout_session_id) ||
      asTrimmedString(row.payment_intent_id) ||
      asTrimmedString(row.stripe_payment_intent_id) ||
      asTrimmedString(row.charge_id) ||
      asTrimmedString(row.stripe_charge_id) ||
      asTrimmedString(row.checkout_session_id) ||
      asTrimmedString(row.payment_status),
  );
}

function bankLooksLikeStripeDeposit(row: GenericRow) {
  const text = [
    getRowLabel(row),
    asTrimmedString(row.merchant_name),
    asTrimmedString(row.description),
    asTrimmedString(row.name),
    asTrimmedString(row.sitguru_notes),
    asTrimmedString(row.category),
  ]
    .join(" ")
    .toLowerCase();

  return (
    text.includes("stripe") ||
    text.includes("strp") ||
    text.includes("payout") ||
    text.includes("payment processing")
  );
}

function isArchivedRow(row: GenericRow) {
  return Boolean(
    row.deleted_at ||
      row.voided_at ||
      row.archived_at ||
      row.removed_at ||
      row.is_deleted === true ||
      row.is_void === true ||
      row.is_active === false,
  );
}

function bankRowToItem(row: GenericRow, index: number): ReconciliationItem {
  const reviewStatus = getReviewStatus(row);
  const bankStatus = getBankStatus(row);
  const categoryType = getBankCategoryType(row);
  const amount = getSignedBankCashAmount(row);

  return {
    id: `bank-${getRowReference(row, String(index))}`,
    source: "Plaid/NFCU",
    label: getRowLabel(row),
    amount,
    status: reviewStatus === "needs_review" ? "Needs Review" : "Ready",
    bankStatus,
    reviewStatus,
    date: formatDate(getRowDate(row)),
    reference: getRowReference(row, String(index)),
    category: getBankCategory(row),
    issueType:
      reviewStatus === "needs_review"
        ? "Needs category review"
        : categoryType === "uncategorized"
          ? "Uncategorized"
          : getOptionalBoolean(row.is_excluded_from_reports)
            ? "Excluded from reports"
            : "Reconciled candidate",
    recommendation:
      reviewStatus === "needs_review"
        ? "Open Banking and assign a SitGuru report category."
        : categoryType === "uncategorized"
          ? "Assign income, expense, transfer, owner equity, owner draw, liability, or ignore."
          : getOptionalBoolean(row.is_excluded_from_reports)
            ? "Confirm this was intentionally excluded from reports."
            : "Ready to support P&L, Cash Flow, General Ledger, or Balance Sheet.",
  };
}

function manualExpenseToItem(row: GenericRow, index: number): ReconciliationItem {
  const amount = getManualExpenseAmount(row);

  return {
    id: `manual-expense-${getRowReference(row, String(index))}`,
    source: "Manual Expense",
    label: getRowLabel(row),
    amount: -amount,
    status: "Manual",
    bankStatus: "Manual",
    reviewStatus: "reviewed",
    date: formatDate(getRowDate(row)),
    reference: getRowReference(row, String(index)),
    category: asTrimmedString(row.category) || "Manual Expense",
    issueType: "Manual entry",
    recommendation:
      "Confirm this manual expense is either not in the bank feed or should remain as a CPA adjustment.",
  };
}

function stripeToItem(row: GenericRow, index: number, source: string): ReconciliationItem {
  const amount = getStripeAmount(row);
  const status =
    asTrimmedString(row.status) ||
    asTrimmedString(row.payment_status) ||
    "Recorded";

  return {
    id: `${source}-${getRowReference(row, String(index))}`,
    source,
    label: getRowLabel(row),
    amount,
    status,
    bankStatus: "Stripe",
    reviewStatus: "recorded",
    date: formatDate(getRowDate(row)),
    reference: getRowReference(row, String(index)),
    category: asTrimmedString(row.type) || "Stripe Activity",
    issueType: "Stripe matching check",
    recommendation:
      "Match this Stripe activity to a bank deposit, payout, fee, refund, or payment record.",
  };
}

function trustSafetyToItem(
  row: GenericRow,
  index: number,
  source: string,
): ReconciliationItem {
  const amount = getTrustSafetyAmount(row);
  const status =
    asTrimmedString(row.payment_status) ||
    asTrimmedString(row.repayment_status) ||
    asTrimmedString(row.status) ||
    "Recorded";

  return {
    id: `${source}-${getRowReference(row, String(index))}`,
    source,
    label:
      asTrimmedString(row.plan_name) ||
      asTrimmedString(row.event_type) ||
      getRowLabel(row),
    amount,
    status,
    bankStatus: "Trust & Safety",
    reviewStatus: "recorded",
    date: formatDate(getRowDate(row)),
    reference: getRowReference(row, String(index)),
    category:
      asTrimmedString(row.plan_key) ||
      asTrimmedString(row.event_type) ||
      "Trust & Safety",
    issueType: "Trust & Safety receivable check",
    recommendation:
      "Confirm Trust & Safety receivable, collection, fee, refund, or booking deduction is represented in General Ledger and Balance Sheet.",
  };
}

function growthMarketingToItem(
  row: GenericRow,
  index: number,
): ReconciliationItem {
  const amount = getGrowthMarketingAmount(row);
  const category =
    asTrimmedString(row.financial_category) ||
    asTrimmedString(row.category) ||
    asTrimmedString(row.campaign_type) ||
    "Growth Marketing Expense";
  const campaignName =
    asTrimmedString(row.campaign_name) ||
    asTrimmedString(row.name) ||
    asTrimmedString(row.campaign_slug) ||
    category;

  return {
    id: `growth-marketing-${getRowReference(row, String(index))}`,
    source: "Growth Marketing Expense",
    label: campaignName,
    amount: -Math.abs(amount),
    status: asTrimmedString(row.status) || "Recorded",
    bankStatus: "Needs Bank Match",
    reviewStatus: "needs_review",
    date: formatDate(getRowDate(row)),
    reference: getRowReference(row, String(index)),
    category,
    issueType: "Growth campaign cost reconciliation",
    recommendation:
      "Match this campaign cost to Plaid/NFCU, Stripe, card activity, or an approved manual expense before month-end close.",
  };
}

function referralRewardToItem(
  row: GenericRow,
  index: number,
): ReconciliationItem {
  const amount = getReferralRewardAmount(row);
  const treatment =
    asTrimmedString(row.financial_treatment) ||
    asTrimmedString(row.normalized_status) ||
    asTrimmedString(row.status) ||
    "pending_reward_liability";
  const category =
    asTrimmedString(row.financial_category) ||
    asTrimmedString(row.reward_type) ||
    asTrimmedString(row.type) ||
    "Referral Rewards";
  const normalizedStatus =
    asTrimmedString(row.normalized_status) ||
    asTrimmedString(row.reward_status) ||
    asTrimmedString(row.payout_status) ||
    asTrimmedString(row.status) ||
    "pending";
  const isIssued =
    treatment.toLowerCase().includes("issued") ||
    ["paid", "credited", "issued", "complete", "completed"].includes(
      normalizedStatus.toLowerCase(),
    );

  return {
    id: `referral-reward-${getRowReference(row, String(index))}`,
    source: "Referral Reward Liability",
    label: category,
    amount: isIssued ? -Math.abs(amount) : Math.abs(amount),
    status: normalizedStatus,
    bankStatus: isIssued ? "Needs Payout Match" : "Not Paid Yet",
    reviewStatus: isIssued ? "needs_review" : "recorded",
    date: formatDate(getRowDate(row)),
    reference: getRowReference(row, String(index)),
    category,
    issueType: isIssued
      ? "Issued referral reward payout match"
      : "Pending referral reward liability",
    recommendation: isIssued
      ? "Match this issued reward to payout, Stripe, Plaid/NFCU, or customer credit records."
      : "Keep this as a current liability until it is credited, paid, rejected, expired, or cleared.",
  };
}

function findDuplicateBankItems(items: ReconciliationItem[]) {
  const groups = new Map<string, ReconciliationItem[]>();

  for (const item of items) {
    const key = [
      item.date,
      Math.abs(item.amount).toFixed(2),
      item.label.toLowerCase().slice(0, 28),
    ].join("|");

    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  return Array.from(groups.values())
    .filter((group) => group.length > 1)
    .flat()
    .map((item, index) => ({
      ...item,
      id: `${item.id}-duplicate-${index}`,
      issueType: "Possible duplicate",
      recommendation:
        "Review same-date, same-amount activity and confirm whether both rows are legitimate.",
    }));
}

function getUniqueReconciliationRows(rows: ReconciliationItem[]) {
  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = [
      row.id,
      row.source,
      row.reference,
      row.issueType,
      row.amount.toFixed(2),
    ].join("|");

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function getScore({
  needsReviewRows,
  pendingRows,
  duplicateRows,
  uncategorizedRows,
  excludedRows,
  bankRows,
  growthNeedsMatchingRows,
}: {
  needsReviewRows: number;
  pendingRows: number;
  duplicateRows: number;
  uncategorizedRows: number;
  excludedRows: number;
  bankRows: number;
  growthNeedsMatchingRows: number;
}) {
  if (bankRows === 0) return 0;

  const issueCount =
    needsReviewRows +
    duplicateRows +
    uncategorizedRows +
    Math.round(pendingRows / 2) +
    Math.round(growthNeedsMatchingRows / 2);

  const score = Math.max(0, Math.min(100, 100 - (issueCount / bankRows) * 100));

  if (excludedRows > bankRows * 0.5) return Math.min(score, 75);

  return Math.round(score);
}

function getUniqueSourceRows(rows: GenericRow[]) {
  const seen = new Set<string>();

  return rows.filter((row, index) => {
    const key =
      getRowReference(row, String(index)) ||
      [getRowDate(row), getRowLabel(row), String(toNumber(row.amount))].join("|");

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function bookingToStripeItem(row: GenericRow, index: number): ReconciliationItem {
  const amount = getBookingStripeAmount(row);
  const fee = getBookingStripeFee(row);
  const paymentStatus =
    asTrimmedString(row.payment_status) ||
    asTrimmedString(row.status) ||
    "Recorded";
  const reference =
    asTrimmedString(row.stripe_checkout_session_id) ||
    asTrimmedString(row.stripe_session_id) ||
    asTrimmedString(row.payment_intent_id) ||
    asTrimmedString(row.stripe_payment_intent_id) ||
    getRowReference(row, String(index));

  return {
    id: `booking-stripe-${reference}`,
    source: "Booking Stripe Payment",
    label:
      asTrimmedString(row.customer_name) ||
      asTrimmedString(row.pet_parent_name) ||
      asTrimmedString(row.service_name) ||
      getRowLabel(row),
    amount,
    status: paymentStatus,
    bankStatus: "Stripe",
    reviewStatus: "recorded",
    date: formatDate(getRowDate(row)),
    reference,
    category: fee ? `Stripe payment · Fee ${moneyExact(fee)}` : "Stripe payment",
    issueType: "Stripe booking payment check",
    recommendation:
      "Confirm this booking payment is represented in Stripe activity, payout batches, Plaid/NFCU deposits, P&L, Cash Flow, and General Ledger.",
  };
}

function stripePayoutToItem(row: GenericRow, index: number): ReconciliationItem {
  const amount = getPayoutAmount(row);
  const plaidReference =
    asTrimmedString(row.plaid_transaction_id) ||
    asTrimmedString(row.bank_transaction_id) ||
    asTrimmedString(row.matched_bank_transaction_id);
  const reference =
    asTrimmedString(row.stripe_payout_id) ||
    asTrimmedString(row.payout_id) ||
    asTrimmedString(row.transfer_id) ||
    getRowReference(row, String(index));

  return {
    id: `stripe-payout-${reference}`,
    source: "Stripe Payout",
    label:
      asTrimmedString(row.description) ||
      asTrimmedString(row.bank_description) ||
      "Stripe payout batch",
    amount,
    status:
      asTrimmedString(row.status) ||
      asTrimmedString(row.payout_status) ||
      "Recorded",
    bankStatus: plaidReference ? "Bank Matched" : "Needs Bank Match",
    reviewStatus: plaidReference ? "matched" : "needs_review",
    date: formatDate(getRowDate(row)),
    reference,
    category: plaidReference ? "Matched payout deposit" : "Unmatched payout deposit",
    issueType: plaidReference
      ? "Matched Stripe payout"
      : "Stripe payout needs Plaid/NFCU match",
    recommendation: plaidReference
      ? "Confirm the matched Plaid/NFCU deposit agrees to the Stripe payout batch."
      : "Match this Stripe payout to the corresponding Plaid/NFCU business bank deposit before month-end close.",
  };
}

async function getReconciliationData(): Promise<ReconciliationData> {
  const [
    adminPlaidRows,
    plaidTransactionRows,
    bankTransactionRows,
    manualExpenseRows,
    cashFlowLines,
    balanceSheetLines,
    statementLines,
    stripeRows,
    stripeBalanceRows,
    stripePayoutRows,
    bookingRows,
    trustSafetyEvents,
    trustSafetyPurchases,
    bookingDeductions,
    growthMarketingRows,
    referralRewardRows,
  ] = await Promise.all([
    safeRows<GenericRow>(
      supabaseAdmin
        .from("admin_plaid_transactions")
        .select("*")
        .is("removed_at", null)
        .order("date", { ascending: false })
        .limit(5000),
      "admin_plaid_transactions",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("plaid_transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(5000),
      "plaid_transactions",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("bank_transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(5000),
      "bank_transactions",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("expense_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2500),
      "expense_ledger",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("cash_flow_lines")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(500),
      "cash_flow_lines",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("balance_sheet_lines")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(500),
      "balance_sheet_lines",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("financial_statement_lines")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(500),
      "financial_statement_lines",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("stripe_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "stripe_transactions",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("stripe_balance_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "stripe_balance_transactions",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("stripe_payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      "stripe_payouts",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000),
      "bookings_stripe_reconciliation",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("trust_safety_financial_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      "trust_safety_financial_events",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("guru_trust_safety_plan_purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      "guru_trust_safety_plan_purchases",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("booking_trust_safety_deductions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      "booking_trust_safety_deductions",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("admin_growth_marketing_expenses")
        .select("*")
        .order("cost_date", { ascending: false })
        .limit(2000),
      "admin_growth_marketing_expenses",
    ),
    safeRows<GenericRow>(
      supabaseAdmin
        .from("admin_referral_reward_liability")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      "admin_referral_reward_liability",
    ),
  ]);

  const bankRows = getUniqueSourceRows([
    ...adminPlaidRows,
    ...plaidTransactionRows,
    ...bankTransactionRows,
  ]);
  const activeBankRows = bankRows.filter((row) => !isArchivedRow(row));
  const activeManualExpenseRows = manualExpenseRows.filter((row) => !isArchivedRow(row));
  const activeCashFlowLines = cashFlowLines.filter((row) => !isArchivedRow(row));
  const activeBalanceSheetLines = balanceSheetLines.filter((row) => !isArchivedRow(row));
  const activeStatementLines = statementLines.filter((row) => !isArchivedRow(row));

  const bankItems = activeBankRows.map(bankRowToItem);

  const manualItems = [
    ...activeManualExpenseRows.map(manualExpenseToItem),
    ...activeCashFlowLines.map((row, index) => ({
      id: `cash-flow-line-${getRowReference(row, String(index))}`,
      source: "Manual Cash Flow Line",
      label: getRowLabel(row),
      amount: toNumber(row.amount),
      status: "Manual",
      bankStatus: "Manual",
      reviewStatus: "reviewed",
      date: formatDate(getRowDate(row)),
      reference: getRowReference(row, String(index)),
      category: asTrimmedString(row.section) || "Cash Flow",
      issueType: "Manual cash flow line",
      recommendation:
        "Confirm this line should remain separate from bank-fed activity.",
    })),
    ...activeBalanceSheetLines.map((row, index) => ({
      id: `balance-sheet-line-${getRowReference(row, String(index))}`,
      source: "Manual Balance Sheet Line",
      label: getRowLabel(row),
      amount: toNumber(row.amount),
      status: "Manual",
      bankStatus: "Manual",
      reviewStatus: "reviewed",
      date: formatDate(getRowDate(row)),
      reference: getRowReference(row, String(index)),
      category: asTrimmedString(row.section) || "Balance Sheet",
      issueType: "Manual balance sheet line",
      recommendation:
        "Confirm this balance sheet adjustment is supported by CPA or opening balance documentation.",
    })),
  ];

  const stripeBookingRows = bookingRows
    .filter((row) => !isArchivedRow(row))
    .filter(isStripeRelatedBooking);
  const stripePayoutItems = stripePayoutRows
    .filter((row) => !isArchivedRow(row))
    .map(stripePayoutToItem);
  const stripeBankDepositItems = activeBankRows
    .filter(bankLooksLikeStripeDeposit)
    .map((row, index) => {
      const item = bankRowToItem(row, index);

      return {
        ...item,
        id: `${item.id}-stripe-bank-deposit-${index}`,
        source: "Plaid/NFCU Stripe Deposit",
        issueType: "Stripe deposit bank match candidate",
        recommendation:
          "Confirm this Plaid/NFCU bank row matches a Stripe payout batch and should clear the unmatched deposit queue.",
      };
    });

  const stripeItems = [
    ...stripeRows.map((row, index) => stripeToItem(row, index, "Stripe Transaction")),
    ...stripeBalanceRows.map((row, index) =>
      stripeToItem(row, index, "Stripe Balance Transaction"),
    ),
    ...stripeBookingRows.map(bookingToStripeItem),
    ...stripePayoutItems,
    ...stripeBankDepositItems,
  ];

  const trustSafetyItems = [
    ...trustSafetyEvents.map((row, index) =>
      trustSafetyToItem(row, index, "Trust & Safety Event"),
    ),
    ...trustSafetyPurchases.map((row, index) =>
      trustSafetyToItem(row, index, "Trust & Safety Plan"),
    ),
    ...bookingDeductions.map((row, index) =>
      trustSafetyToItem(row, index, "Book & Bark Deduction"),
    ),
  ];

  const growthMarketingItems = growthMarketingRows
    .filter((row) => !isArchivedRow(row))
    .map(growthMarketingToItem);

  const referralRewardItems = referralRewardRows
    .filter((row) => !isArchivedRow(row))
    .map(referralRewardToItem);

  const growthItems = [...growthMarketingItems, ...referralRewardItems];

  const issuedReferralRewardTotal = referralRewardItems
    .filter((item) => item.issueType.toLowerCase().includes("issued"))
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  const pendingReferralRewardLiabilityTotal = referralRewardItems
    .filter((item) => item.issueType.toLowerCase().includes("pending"))
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  const growthMarketingTotal = growthMarketingItems.reduce(
    (sum, item) => sum + Math.abs(item.amount),
    0,
  );

  const needsReviewItems = bankItems.filter(
    (item) => item.reviewStatus === "needs_review",
  );

  const pendingItems = bankItems.filter((item) => item.bankStatus === "Pending");

  const excludedItems = bankItems.filter((item) =>
    item.issueType.toLowerCase().includes("excluded"),
  );

  const uncategorizedItems = bankItems.filter(
    (item) =>
      item.category === "Uncategorized" ||
      item.issueType.toLowerCase().includes("uncategorized"),
  );

  const duplicateItems = findDuplicateBankItems(bankItems);

  const postedRows = bankItems.filter((item) => item.bankStatus === "Posted").length;

  const totalCashIn = bankItems
    .filter((item) => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);

  const totalCashOut = bankItems
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  const manualExpenseTotal = activeManualExpenseRows.reduce(
    (sum, row) => sum + getManualExpenseAmount(row),
    0,
  );

  const growthNeedsMatchingRows = growthItems.filter(
    (item) => item.reviewStatus === "needs_review",
  ).length;

  const reviewQueueTotal = getUniqueReconciliationRows([
    ...needsReviewItems,
    ...uncategorizedItems,
    ...duplicateItems,
    ...pendingItems,
    ...growthItems.filter((item) => item.reviewStatus === "needs_review"),
  ]).length;

  const reconciliationScore = getScore({
    needsReviewRows: needsReviewItems.length,
    pendingRows: pendingItems.length,
    duplicateRows: duplicateItems.length,
    uncategorizedRows: uncategorizedItems.length,
    excludedRows: excludedItems.length,
    bankRows: bankItems.length,
    growthNeedsMatchingRows,
  });

  const reportChecks: ReconciliationCheck[] = [
    {
      label: "Plaid/NFCU Bank Feed",
      status: bankItems.length > 0 ? "ready" : "missing",
      detail: `${bankItems.length.toLocaleString()} bank-fed rows are available for reconciliation.`,
    },
    {
      label: "Posted vs Pending",
      status: pendingItems.length === 0 ? "ready" : "needs_review",
      detail: `${postedRows.toLocaleString()} posted and ${pendingItems.length.toLocaleString()} pending transactions are visible.`,
    },
    {
      label: "Category Review",
      status: needsReviewItems.length === 0 ? "ready" : "needs_review",
      detail: needsReviewItems.length
        ? `${needsReviewItems.length.toLocaleString()} transactions still need review before reports are final.`
        : "No bank transactions are waiting for category review.",
    },
    {
      label: "Manual Entries",
      status: manualItems.length > 0 ? "ready" : "needs_review",
      detail: `${manualItems.length.toLocaleString()} manual expenses, cash flow lines, or balance sheet lines are available for review.`,
    },
    {
      label: "Duplicate Check",
      status: duplicateItems.length === 0 ? "ready" : "needs_review",
      detail: duplicateItems.length
        ? `${duplicateItems.length.toLocaleString()} possible duplicate rows should be reviewed.`
        : "No likely duplicate bank rows were detected by same date, amount, and label.",
    },
    {
      label: "Statement Lines",
      status:
        activeCashFlowLines.length ||
        activeBalanceSheetLines.length ||
        activeStatementLines.length
          ? "ready"
          : "needs_review",
      detail: `${(
        activeCashFlowLines.length +
        activeBalanceSheetLines.length +
        activeStatementLines.length
      ).toLocaleString()} saved statement or reporting lines are active.`,
    },
    {
      label: "Stripe / Payment Activity",
      status: stripeItems.length > 0 ? "ready" : "needs_review",
      detail: `${stripeItems.length.toLocaleString()} Stripe rows are available from bookings, Stripe payouts, Stripe tables, and Plaid/NFCU deposit candidates.`,
    },
    {
      label: "Trust & Safety Activity",
      status: trustSafetyItems.length > 0 ? "ready" : "needs_review",
      detail: `${trustSafetyItems.length.toLocaleString()} Trust & Safety rows are available for receivable, collection, fee, and deduction checks.`,
    },
    {
      label: "Growth Marketing Costs",
      status: growthMarketingItems.length > 0 ? "ready" : "needs_review",
      detail: `${growthMarketingItems.length.toLocaleString()} campaign cost rows totaling ${money(growthMarketingTotal)} are available for bank, card, Stripe, or manual expense matching.`,
    },
    {
      label: "Referral Reward Liability",
      status: referralRewardItems.length > 0 ? "ready" : "needs_review",
      detail: `${referralRewardItems.length.toLocaleString()} reward rows are available, including ${money(pendingReferralRewardLiabilityTotal)} pending liability and ${money(issuedReferralRewardTotal)} issued reward expense.`,
    },
  ];

  return {
    bankItems,
    manualItems,
    needsReviewItems,
    pendingItems,
    excludedItems,
    duplicateItems,
    uncategorizedItems,
    trustSafetyItems,
    stripeItems,
    growthMarketingItems,
    referralRewardItems,
    growthItems,
    reportChecks,
    sourceCounts: [
      { label: "Admin Plaid", count: adminPlaidRows.length, source: "admin_plaid_transactions" },
      { label: "Plaid", count: plaidTransactionRows.length, source: "plaid_transactions" },
      { label: "Bank", count: bankTransactionRows.length, source: "bank_transactions" },
      { label: "Manual Expenses", count: manualExpenseRows.length, source: "expense_ledger" },
      { label: "Cash Flow Lines", count: cashFlowLines.length, source: "cash_flow_lines" },
      { label: "Balance Sheet Lines", count: balanceSheetLines.length, source: "balance_sheet_lines" },
      { label: "Statement Lines", count: statementLines.length, source: "financial_statement_lines" },
      { label: "Stripe", count: stripeRows.length, source: "stripe_transactions" },
      { label: "Stripe Balance", count: stripeBalanceRows.length, source: "stripe_balance_transactions" },
      { label: "Stripe Payouts", count: stripePayoutRows.length, source: "stripe_payouts" },
      { label: "Bookings", count: bookingRows.length, source: "bookings" },
      { label: "Trust & Safety Events", count: trustSafetyEvents.length, source: "trust_safety_financial_events" },
      { label: "Trust & Safety Plans", count: trustSafetyPurchases.length, source: "guru_trust_safety_plan_purchases" },
      { label: "Book & Bark Deductions", count: bookingDeductions.length, source: "booking_trust_safety_deductions" },
      { label: "Growth Marketing", count: growthMarketingRows.length, source: "admin_growth_marketing_expenses" },
      { label: "Referral Rewards", count: referralRewardRows.length, source: "admin_referral_reward_liability" },
    ],
    totals: {
      bankRows: bankItems.length,
      postedRows,
      pendingRows: pendingItems.length,
      needsReviewRows: needsReviewItems.length,
      excludedRows: excludedItems.length,
      manualRows: manualItems.length,
      duplicateRows: duplicateItems.length,
      uncategorizedRows: uncategorizedItems.length,
      stripeRows: stripeItems.length,
      trustSafetyRows: trustSafetyItems.length,
      growthMarketingRows: growthMarketingItems.length,
      referralRewardRows: referralRewardItems.length,
      growthRows: growthItems.length,
      growthNeedsMatchingRows,
      totalCashIn,
      totalCashOut,
      netCashMovement: totalCashIn - totalCashOut,
      manualExpenseTotal,
      growthMarketingTotal,
      issuedReferralRewardTotal,
      pendingReferralRewardLiabilityTotal,
      reviewQueueTotal,
      reconciliationScore,
    },
  };
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("ready") ||
    normalized.includes("posted") ||
    normalized.includes("reviewed") ||
    normalized.includes("reconciled") ||
    normalized.includes("recorded") ||
    normalized.includes("paid") ||
    normalized.includes("succeeded") ||
    normalized.includes("matched")
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-800";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("review") ||
    normalized.includes("manual") ||
    normalized.includes("needs")
  ) {
    return "border-amber-100 bg-amber-50 text-amber-800";
  }

  if (
    normalized.includes("failed") ||
    normalized.includes("void") ||
    normalized.includes("dispute") ||
    normalized.includes("chargeback") ||
    normalized.includes("excluded")
  ) {
    return "border-rose-100 bg-rose-50 text-rose-800";
  }

  return "border-slate-100 bg-slate-50 text-slate-700";
}

function readinessClasses(status: ReadinessStatus) {
  const classes = {
    ready: "border-emerald-100 bg-emerald-50 text-emerald-800",
    needs_review: "border-amber-100 bg-amber-50 text-amber-800",
    missing: "border-rose-100 bg-rose-50 text-rose-800",
  };

  return classes[status];
}

function StatCard({
  label,
  value,
  detail,
  tone = "emerald",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "emerald" | "sky" | "violet" | "amber" | "rose" | "slate";
}) {
  const toneClass = {
    emerald: "border-emerald-100 bg-emerald-50",
    sky: "border-sky-100 bg-sky-50",
    violet: "border-violet-100 bg-violet-50",
    amber: "border-amber-100 bg-amber-50",
    rose: "border-rose-100 bg-rose-50",
    slate: "border-slate-100 bg-slate-50",
  }[tone];

  return (
    <div className={`rounded-[1.5rem] border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
          : "inline-flex items-center justify-center rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:border-emerald-200 hover:bg-emerald-50"
      }
    >
      {label}
    </Link>
  );
}

function ReconciliationChecks({ data }: { data: ReconciliationData }) {
  const readyCount = data.reportChecks.filter((item) => item.status === "ready").length;

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Reconciliation Health
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Matching and reporting checks
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            These checks compare bank activity, manual entries, Stripe activity,
            Trust & Safety rows, Growth & Referrals, reward liabilities, and
            reporting lines so SitGuru’s financial statements can be reviewed
            cleanly.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          {readyCount}/{data.reportChecks.length} ready
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data.reportChecks.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-4 ${readinessClasses(item.status)}`}
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] opacity-80">
              {item.status.replace("_", " ")}
            </p>
            <h3 className="mt-2 text-base font-black text-slate-950">
              {item.label}
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ItemsTable({
  eyebrow,
  title,
  description,
  rows,
  emptyMessage,
}: {
  eyebrow: string;
  title: string;
  description: string;
  rows: ReconciliationItem[];
  emptyMessage: string;
}) {
  const displayRows = getUniqueReconciliationRows(rows);

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="mt-6 w-full max-w-full overflow-hidden rounded-[1.5rem] border border-slate-100">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1180px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Activity
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Source
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  Issue
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em]">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {displayRows.length ? (
                displayRows.slice(0, 80).map((row, index) => (
                  <tr
                    key={`${row.id}-${row.source}-${row.issueType}-${index}`}
                    className="align-top transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                      {row.date}
                    </td>
                    <td className="max-w-[320px] px-4 py-4">
                      <p className="font-black text-slate-950">{row.label}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        Ref: {row.reference}
                      </p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                        {row.recommendation}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-600">
                      {row.source}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClasses(
                            row.status,
                          )}`}
                        >
                          {row.status}
                        </span>
                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClasses(
                            row.bankStatus,
                          )}`}
                        >
                          {row.bankStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                      {row.issueType}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-4 text-right font-black ${
                        row.amount < 0 ? "text-rose-700" : "text-slate-950"
                      }`}
                    >
                      {moneyExact(row.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-600">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {displayRows.length > 80 ? (
        <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm font-bold text-amber-800">
          Showing the latest 80 rows in this section.
        </p>
      ) : null}
    </section>
  );
}

function ReconciliationFlowPanel() {
  const steps = [
    "Plaid/NFCU bank rows are checked for pending, posted, needs review, excluded, and uncategorized states.",
    "Manual expenses and manual statement lines are checked so they do not accidentally duplicate bank activity.",
    "Stripe activity is reviewed against expected deposits, refunds, fees, and payment records.",
    "Trust & Safety and Growth & Referrals are checked against receivables, liabilities, reward payouts, campaign costs, and vendor costs.",
    "Exception queues show what needs cleanup before P&L, Cash Flow, General Ledger, Balance Sheet, and payout review are final.",
  ];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
        Reconciliation Flow
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        How SitGuru verifies financial activity
      </h2>

      <div className="mt-6 grid gap-3 lg:grid-cols-5">
        {steps.map((step, index) => (
          <div
            key={step}
            className="rounded-xl border border-slate-100 bg-[#fbfefd] p-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
              {index + 1}
            </span>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              {step}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SourceCoveragePanel({ data }: { data: ReconciliationData }) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
        Source Coverage
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        Data sources feeding reconciliation
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Missing sources are skipped safely. Row counts help confirm whether bank,
        Stripe, manual, Trust & Safety, Growth Marketing, and Referral Reward
        views are feeding this reconciliation pass.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.sourceCounts.map((source) => (
          <div
            key={source.source}
            className="rounded-2xl border border-slate-100 bg-[#fbfefd] p-4"
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              {source.label}
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {source.count.toLocaleString()}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {source.source}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function AdminReconciliationPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessFinancials) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
            Access Restricted
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Financial access required.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Sign in with a finance-enabled admin account to view SitGuru
            reconciliation reports.
          </p>
        </div>
      </div>
    );
  }

  const data = await getReconciliationData();

  return (
    <div className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-5 sm:space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(420px,620px)] 2xl:items-start">
            <div className="max-w-5xl self-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Admin / Financials / Reconciliation
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                SitGuru Reconciliation Center.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Review whether NFCU/Plaid bank activity, manual entries, Stripe
                records, Trust & Safety activity, Growth & Referrals, P&L, Cash
                Flow, General Ledger, and Balance Sheet support are aligned
                before financial reports are finalized.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-[#fbfefd] p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Financial Navigation
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <ActionLink href="/admin/financials" label="Overview" />
                <ActionLink href="/admin/financials/plaid" label="Banking" />
                <ActionLink href="/admin/financials/stripe" label="Stripe" />
                <ActionLink href="/admin/financials/profit-loss" label="P&L" />
                <ActionLink href="/admin/financials/cash-flow" label="Cash Flow" />
                <ActionLink href="/admin/financials/general-ledger" label="Ledger" />
                <ActionLink href="/admin/financials/balance-sheet" label="Balance Sheet" />
                <ActionLink
                  href="/admin/financials/commissions"
                  label="Rewards / Payouts"
                  primary
                />
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Reconciliation Score
                </p>
                <p className="mt-2 text-5xl font-black text-emerald-700">
                  {data.totals.reconciliationScore}%
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Based on needs review, pending, duplicate, uncategorized,
                  excluded bank activity, and growth/reward matching gaps.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Bank Rows"
              value={data.totals.bankRows.toLocaleString()}
              detail={`${data.totals.postedRows.toLocaleString()} posted and ${data.totals.pendingRows.toLocaleString()} pending.`}
              tone="emerald"
            />

            <StatCard
              label="Needs Review"
              value={data.totals.needsReviewRows.toLocaleString()}
              detail="Bank transactions that must be categorized before reports are final."
              tone={data.totals.needsReviewRows ? "amber" : "emerald"}
            />

            <StatCard
              label="Possible Duplicates"
              value={data.totals.duplicateRows.toLocaleString()}
              detail="Same-date, same-amount, similar-label bank rows."
              tone={data.totals.duplicateRows ? "rose" : "emerald"}
            />

            <StatCard
              label="Manual Entries"
              value={data.totals.manualRows.toLocaleString()}
              detail={`${money(data.totals.manualExpenseTotal)} in manual expenses plus reporting lines.`}
              tone="sky"
            />

            <StatCard
              label="Net Cash Movement"
              value={money(data.totals.netCashMovement)}
              detail={`${money(data.totals.totalCashIn)} cash in and ${money(data.totals.totalCashOut)} cash out.`}
              tone={data.totals.netCashMovement >= 0 ? "violet" : "rose"}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Uncategorized"
              value={data.totals.uncategorizedRows.toLocaleString()}
              detail="Rows that need a report category or category type."
              tone={data.totals.uncategorizedRows ? "amber" : "emerald"}
            />

            <StatCard
              label="Excluded Rows"
              value={data.totals.excludedRows.toLocaleString()}
              detail="Rows marked excluded or personal should be confirmed."
              tone="slate"
            />

            <StatCard
              label="Stripe Rows"
              value={data.totals.stripeRows.toLocaleString()}
              detail="Stripe transactions and balance rows available for matching."
              tone="sky"
            />

            <StatCard
              label="Trust & Safety Rows"
              value={data.totals.trustSafetyRows.toLocaleString()}
              detail="Plan, receivable, deduction, fee, refund, and collection support."
              tone="violet"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Growth Rows"
              value={data.totals.growthRows.toLocaleString()}
              detail="Campaign costs plus PawPerks, Guru, Ambassador, and Partner reward rows."
              tone="emerald"
            />

            <StatCard
              label="Growth Marketing"
              value={money(data.totals.growthMarketingTotal)}
              detail={`${data.totals.growthMarketingRows.toLocaleString()} campaign cost rows needing bank, Stripe, card, or manual expense support.`}
              tone="sky"
            />

            <StatCard
              label="Issued Rewards"
              value={money(data.totals.issuedReferralRewardTotal)}
              detail="Paid, credited, issued, or completed rewards that should match payout records."
              tone="violet"
            />

            <StatCard
              label="Pending Reward Liability"
              value={money(data.totals.pendingReferralRewardLiabilityTotal)}
              detail="Rewards still owed and carried as current liabilities until cleared."
              tone={data.totals.pendingReferralRewardLiabilityTotal ? "amber" : "emerald"}
            />
          </div>
        </section>

        <ReconciliationChecks data={data} />

        <ReconciliationFlowPanel />

        <ItemsTable
          eyebrow="Exception Queue"
          title="Transactions needing review"
          description="These rows should be cleaned up first because they can affect P&L, Cash Flow, General Ledger, Balance Sheet, and Growth & Referrals accuracy."
          rows={[
            ...data.needsReviewItems,
            ...data.uncategorizedItems,
            ...data.duplicateItems,
            ...data.pendingItems,
            ...data.growthItems.filter((item) => item.reviewStatus === "needs_review"),
          ]}
          emptyMessage="No exception rows found. Reconciliation looks clean for this pass."
        />

        <ItemsTable
          eyebrow="Possible Duplicates"
          title="Duplicate review"
          description="These rows share the same date, amount, and similar label. Confirm they are not accidental duplicates."
          rows={data.duplicateItems}
          emptyMessage="No likely duplicate bank rows detected."
        />

        <ItemsTable
          eyebrow="Pending Bank Activity"
          title="Pending transactions"
          description="Pending transactions are visible but may change after the bank posts them."
          rows={data.pendingItems}
          emptyMessage="No pending bank transactions found."
        />

        <ItemsTable
          eyebrow="Manual Entry Review"
          title="Manual entries and statement lines"
          description="Manual entries should be checked against bank activity so expenses or adjustments are not counted twice."
          rows={data.manualItems}
          emptyMessage="No manual expense, cash flow, or balance sheet lines found."
        />

        <section className="grid gap-8 xl:grid-cols-2">
          <ItemsTable
            eyebrow="Stripe Matching"
            title="Stripe activity"
            description="Stripe rows should eventually be matched to bank deposits, processing fees, refunds, chargebacks, and payments."
            rows={data.stripeItems}
            emptyMessage="No Stripe rows found yet."
          />

          <ItemsTable
            eyebrow="Trust & Safety Matching"
            title="Trust & Safety activity"
            description="Trust & Safety rows should align with receivables, collections, Book & Bark deductions, Checkr costs, and Stripe fees."
            rows={data.trustSafetyItems}
            emptyMessage="No Trust & Safety rows found yet."
          />
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <ItemsTable
            eyebrow="Growth Marketing Matching"
            title="Campaign costs and marketing spend"
            description="These rows should be matched against Plaid/NFCU, Stripe, card charges, or approved manual expenses so marketing spend is not missed or double-counted."
            rows={data.growthMarketingItems}
            emptyMessage="No growth marketing expense rows found yet."
          />

          <ItemsTable
            eyebrow="Referral Reward Matching"
            title="PawPerks, Guru, Ambassador, and Partner rewards"
            description="Pending rewards stay as liabilities. Issued, credited, or paid rewards should match payout, Stripe, Plaid/NFCU, or customer credit records."
            rows={data.referralRewardItems}
            emptyMessage="No referral reward rows found yet."
          />
        </section>

        <ItemsTable
          eyebrow="Excluded / Personal"
          title="Excluded transactions"
          description="These transactions are outside reports. Confirm they were intentionally excluded."
          rows={data.excludedItems}
          emptyMessage="No excluded rows found."
        />

        <SourceCoveragePanel data={data} />
      </div>
    </div>
  );
}
