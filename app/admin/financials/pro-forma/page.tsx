import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;
type ProFormaRow = Record<string, unknown>;
type TrustSafetyPurchaseRow = Record<string, unknown>;
type TrustSafetyFinancialEventRow = Record<string, unknown>;

type ScenarioRepositoryItem = {
  id: string;
  scenarioName: string;
  isActive: boolean;
  forecastMonths: number;
  monthlyBookings: number;
  averageBookingValue: number;
  platformFeeRate: number;
  monthlyGrowthRate: number;
  newGurusPerMonth: number;
  createdAt: string;
  updatedAt: string;
};

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
  canAccessFinancials: boolean;
};

type Assumptions = {
  id: string;
  scenarioName: string;
  monthlyBookings: number;
  averageBookingValue: number;
  platformFeeRate: number;
  guruPayoutRate: number;
  refundRate: number;
  monthlyMarketingSpend: number;
  monthlySoftwareSpend: number;
  monthlyAdminSpend: number;
  monthlyInsuranceSpend: number;
  monthlyLegalSpend: number;
  otherMonthlyExpenses: number;
  beginningCash: number;
  ownerContribution: number;
  loanProceeds: number;
  loanRepayments: number;
  monthlyGrowthRate: number;
  forecastMonths: number;
  newGurusPerMonth: number;
  pawInFullMixRate: number;
  pawstepMixRate: number;
  bookAndBarkMixRate: number;
  checkrCostPerGuru: number;
  trustSafetyStripeFeeRate: number;
  pawstepCollectionRate: number;
  bookAndBarkRecoveryRate: number;
};

type TrustSafetyActuals = {
  purchaseCount: number;
  pawInFullCount: number;
  pawstepCount: number;
  bookAndBarkCount: number;
  cashCollected: number;
  outstandingBalance: number;
  vendorCosts: number;
  stripeFees: number;
  refunds: number;
  monthlyPlanStarts: number;
};

type GrowthCampaignRoiRow = Record<string, unknown>;
type GrowthFinancialSummaryRow = Record<string, unknown>;
type GrowthMarketingExpenseRow = Record<string, unknown>;

type GrowthForecastActuals = {
  campaignCount: number;
  totalClicks: number;
  totalLeads: number;
  totalSignups: number;
  totalBookings: number;
  attributedRevenue: number;
  trackedMarketingCost: number;
  netGrowthReturn: number;
  averageRoiPercent: number;
  costPerSignup: number;
  costPerBooking: number;
  monthlyMarketingExpenseAverage: number;
  issuedReferralRewardExpense: number;
  pendingReferralRewardLiability: number;
  bestGrowthSignal: string;
  bestRecommendation: string;
};

type ForecastMonth = {
  monthNumber: number;
  label: string;
  projectedBookings: number;
  projectedTrustSafetyGurus: number;
  grossBookingVolume: number;
  platformRevenue: number;
  guruPayouts: number;
  refunds: number;
  trustSafetyContractedRevenue: number;
  trustSafetyCashCollected: number;
  trustSafetyInstallmentRecovery: number;
  trustSafetyBookingDeductionRecovery: number;
  trustSafetyVendorCosts: number;
  trustSafetyStripeFees: number;
  trustSafetyNetCash: number;
  grossProfit: number;
  growthMarketingSpend: number;
  referralRewardExpense: number;
  acquisitionCostPerBooking: number;
  operatingExpenses: number;
  netIncome: number;
  financingCash: number;
  netCashFlow: number;
  endingCash: number;
};

type ForecastReadinessItem = {
  label: string;
  status: "ready" | "needs_review" | "missing";
  detail: string;
};

const DEFAULT_ASSUMPTIONS: Assumptions = {
  id: "",
  scenarioName: "Base Case",
  monthlyBookings: 25,
  averageBookingValue: 90,
  platformFeeRate: 18,
  guruPayoutRate: 82,
  refundRate: 2.5,
  monthlyMarketingSpend: 500,
  monthlySoftwareSpend: 200,
  monthlyAdminSpend: 300,
  monthlyInsuranceSpend: 125,
  monthlyLegalSpend: 100,
  otherMonthlyExpenses: 150,
  beginningCash: 0,
  ownerContribution: 0,
  loanProceeds: 0,
  loanRepayments: 0,
  monthlyGrowthRate: 10,
  forecastMonths: 12,
  newGurusPerMonth: 5,
  pawInFullMixRate: 35,
  pawstepMixRate: 40,
  bookAndBarkMixRate: 25,
  checkrCostPerGuru: 25,
  trustSafetyStripeFeeRate: 3.2,
  pawstepCollectionRate: 90,
  bookAndBarkRecoveryRate: 75,
};

const TRUST_SAFETY_PLAN_CENTS = {
  pawInFullTotal: 3799,
  flexibleTotal: 3999,
  flexibleDownPayment: 1500,
  flexibleRemaining: 2499,
  projectedCheckrVendorCost: 2500,
};

const TRUST_SAFETY_PLAN_MIX = {
  pawInFull: 0.4,
  pawstep: 0.35,
  bookAndBark: 0.25,
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function centsToDollars(cents: number) {
  return cents / 100;
}

function money(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  return value < 0 ? `(${formatted})` : formatted;
}

function moneyExact(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value));

  return value < 0 ? `(${formatted})` : formatted;
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? Math.round(value) : 0,
  );
}

function getBarWidth(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(4, Math.min(100, (Math.abs(value) / max) * 100));
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Pro forma query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Pro forma query skipped for ${label}:`, error);
    return [];
  }
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
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", user.id)
        .limit(1),
      "admin_users_finance_access",
    ),
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "profiles_finance_access",
    ),
    safeRows<Record<string, unknown>>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", user.id)
        .limit(1),
      "users_finance_access",
    ),
  ]);

  const profile = profileChecks.flat().find(Boolean) || {};
  const role = asTrimmedString(profile.role) || "admin";
  const active =
    profile.is_active === undefined
      ? true
      : getOptionalBoolean(profile.is_active);
  const explicitFinanceAccess = getOptionalBoolean(
    profile.can_access_financials,
  );
  const envAllowed = envAdminEmails.includes(userEmail);

  return {
    id: user.id,
    email: userEmail,
    role,
    canAccessFinancials:
      active && (hasFinancialRole(role) || explicitFinanceAccess || envAllowed),
  };
}

async function requireFinancialAdminAction(action: string) {
  const identity = await getAdminIdentity();

  if (!identity?.canAccessFinancials) {
    console.warn(`Blocked pro forma financial admin action: ${action}`);
    return null;
  }

  return identity;
}

async function writeFinancialAuditLog({
  actor,
  action,
  targetType,
  targetId,
  metadata,
}: {
  actor: AdminIdentity;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    actor_id: actor.id,
    actor_email: actor.email,
    actor_role: actor.role,
    action,
    area: "financials.pro_forma",
    target_type: targetType,
    target_id: targetId || null,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin
      .from("financial_audit_logs")
      .insert(payload);

    if (!error) return;
  } catch {
    // Keep forecast updates from failing if the audit table has not been created yet.
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert(payload);
  } catch (error) {
    console.warn("Pro forma financial audit log skipped:", error);
  }
}

function rowToAssumptions(row?: ProFormaRow): Assumptions {
  if (!row) return DEFAULT_ASSUMPTIONS;

  return {
    id: asTrimmedString(row.id),
    scenarioName: asTrimmedString(row.scenario_name) || "Base Case",
    monthlyBookings:
      toNumber(row.monthly_bookings) || DEFAULT_ASSUMPTIONS.monthlyBookings,
    averageBookingValue:
      toNumber(row.average_booking_value) ||
      DEFAULT_ASSUMPTIONS.averageBookingValue,
    platformFeeRate:
      toNumber(row.platform_fee_rate) || DEFAULT_ASSUMPTIONS.platformFeeRate,
    guruPayoutRate:
      toNumber(row.guru_payout_rate) || DEFAULT_ASSUMPTIONS.guruPayoutRate,
    refundRate: toNumber(row.refund_rate) || DEFAULT_ASSUMPTIONS.refundRate,
    monthlyMarketingSpend: toNumber(row.monthly_marketing_spend),
    monthlySoftwareSpend: toNumber(row.monthly_software_spend),
    monthlyAdminSpend: toNumber(row.monthly_admin_spend),
    monthlyInsuranceSpend: toNumber(row.monthly_insurance_spend),
    monthlyLegalSpend: toNumber(row.monthly_legal_spend),
    otherMonthlyExpenses: toNumber(row.other_monthly_expenses),
    beginningCash: toNumber(row.beginning_cash),
    ownerContribution: toNumber(row.owner_contribution),
    loanProceeds: toNumber(row.loan_proceeds),
    loanRepayments: toNumber(row.loan_repayments),
    monthlyGrowthRate:
      toNumber(row.monthly_growth_rate) || DEFAULT_ASSUMPTIONS.monthlyGrowthRate,
    forecastMonths: Math.max(
      1,
      Math.min(36, Math.round(toNumber(row.forecast_months) || 12)),
    ),
    newGurusPerMonth:
      toNumber(row.new_gurus_per_month) || DEFAULT_ASSUMPTIONS.newGurusPerMonth,
    pawInFullMixRate:
      toNumber(row.paw_in_full_mix_rate) || DEFAULT_ASSUMPTIONS.pawInFullMixRate,
    pawstepMixRate:
      toNumber(row.pawstep_mix_rate) || DEFAULT_ASSUMPTIONS.pawstepMixRate,
    bookAndBarkMixRate:
      toNumber(row.book_bark_mix_rate) || DEFAULT_ASSUMPTIONS.bookAndBarkMixRate,
    checkrCostPerGuru:
      toNumber(row.checkr_cost_per_guru) || DEFAULT_ASSUMPTIONS.checkrCostPerGuru,
    trustSafetyStripeFeeRate:
      toNumber(row.trust_safety_stripe_fee_rate) ||
      DEFAULT_ASSUMPTIONS.trustSafetyStripeFeeRate,
    pawstepCollectionRate:
      toNumber(row.pawstep_collection_rate) || DEFAULT_ASSUMPTIONS.pawstepCollectionRate,
    bookAndBarkRecoveryRate:
      toNumber(row.book_bark_recovery_rate) || DEFAULT_ASSUMPTIONS.bookAndBarkRecoveryRate,
  };
}

function rowToScenarioRepositoryItem(row: ProFormaRow): ScenarioRepositoryItem {
  const assumptions = rowToAssumptions(row);

  return {
    id: assumptions.id,
    scenarioName: assumptions.scenarioName,
    isActive: getOptionalBoolean(row.is_active),
    forecastMonths: assumptions.forecastMonths,
    monthlyBookings: assumptions.monthlyBookings,
    averageBookingValue: assumptions.averageBookingValue,
    platformFeeRate: assumptions.platformFeeRate,
    monthlyGrowthRate: assumptions.monthlyGrowthRate,
    newGurusPerMonth: assumptions.newGurusPerMonth,
    createdAt: asTrimmedString(row.created_at),
    updatedAt: asTrimmedString(row.updated_at),
  };
}

function buildProFormaPayload(formData: FormData) {
  const forecastMonths = Math.max(
    1,
    Math.min(36, Math.round(Number(formData.get("forecastMonths") || 12))),
  );

  return {
    scenario_name:
      String(formData.get("scenarioName") || "Base Case").trim() ||
      "Base Case",
    monthly_bookings: Number(formData.get("monthlyBookings") || 0),
    average_booking_value: Number(formData.get("averageBookingValue") || 0),
    platform_fee_rate: Number(formData.get("platformFeeRate") || 0),
    guru_payout_rate: Number(formData.get("guruPayoutRate") || 0),
    refund_rate: Number(formData.get("refundRate") || 0),
    monthly_marketing_spend: Number(
      formData.get("monthlyMarketingSpend") || 0,
    ),
    monthly_software_spend: Number(formData.get("monthlySoftwareSpend") || 0),
    monthly_admin_spend: Number(formData.get("monthlyAdminSpend") || 0),
    monthly_insurance_spend: Number(
      formData.get("monthlyInsuranceSpend") || 0,
    ),
    monthly_legal_spend: Number(formData.get("monthlyLegalSpend") || 0),
    other_monthly_expenses: Number(formData.get("otherMonthlyExpenses") || 0),
    beginning_cash: Number(formData.get("beginningCash") || 0),
    owner_contribution: Number(formData.get("ownerContribution") || 0),
    loan_proceeds: Number(formData.get("loanProceeds") || 0),
    loan_repayments: Number(formData.get("loanRepayments") || 0),
    monthly_growth_rate: Number(formData.get("monthlyGrowthRate") || 0),
    forecast_months: forecastMonths,
    new_gurus_per_month: Number(formData.get("newGurusPerMonth") || 0),
    paw_in_full_mix_rate: Number(formData.get("pawInFullMixRate") || 0),
    pawstep_mix_rate: Number(formData.get("pawstepMixRate") || 0),
    book_bark_mix_rate: Number(formData.get("bookAndBarkMixRate") || 0),
    checkr_cost_per_guru: Number(formData.get("checkrCostPerGuru") || 0),
    trust_safety_stripe_fee_rate: Number(
      formData.get("trustSafetyStripeFeeRate") || 0,
    ),
    pawstep_collection_rate: Number(formData.get("pawstepCollectionRate") || 0),
    book_bark_recovery_rate: Number(formData.get("bookAndBarkRecoveryRate") || 0),
    is_active: true,
    updated_at: new Date().toISOString(),
  };
}

async function deactivateOtherProFormaScenarios(activeId?: string) {
  let query = supabaseAdmin
    .from("proforma_assumptions")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("is_active", true);

  if (activeId) {
    query = query.neq("id", activeId);
  }

  await query;
}

async function saveProFormaAssumptions(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("save_pro_forma_assumptions");

  if (!actor) return;

  const id = String(formData.get("id") || "").trim();
  const payload = buildProFormaPayload(formData);

  let savedId = id;

  if (id) {
    await deactivateOtherProFormaScenarios(id);
    await supabaseAdmin.from("proforma_assumptions").update(payload).eq("id", id);
  } else {
    await deactivateOtherProFormaScenarios();

    const { data } = await supabaseAdmin
      .from("proforma_assumptions")
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    savedId = asTrimmedString((data as Record<string, unknown> | null)?.id);
  }

  await writeFinancialAuditLog({
    actor,
    action: id ? "update_pro_forma_assumptions" : "create_pro_forma_assumptions",
    targetType: "proforma_assumptions",
    targetId: savedId,
    metadata: {
      scenarioName: payload.scenario_name,
      forecastMonths: payload.forecast_months,
      monthlyBookings: payload.monthly_bookings,
      averageBookingValue: payload.average_booking_value,
      platformFeeRate: payload.platform_fee_rate,
      newGurusPerMonth: payload.new_gurus_per_month,
      trustSafetyPlanMix: {
        pawInFull: payload.paw_in_full_mix_rate,
        pawstep: payload.pawstep_mix_rate,
        bookAndBark: payload.book_bark_mix_rate,
      },
    },
  });

  revalidatePath("/admin/financials/pro-forma");
}

async function setActiveProFormaScenario(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("set_active_pro_forma_scenario");
  if (!actor) return;

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  await deactivateOtherProFormaScenarios(id);
  await supabaseAdmin
    .from("proforma_assumptions")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  await writeFinancialAuditLog({
    actor,
    action: "set_active_pro_forma_scenario",
    targetType: "proforma_assumptions",
    targetId: id,
  });

  revalidatePath("/admin/financials/pro-forma");
}

async function cloneProFormaScenario(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("clone_pro_forma_scenario");
  if (!actor) return;

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  const { data } = await supabaseAdmin
    .from("proforma_assumptions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const source = (data || {}) as ProFormaRow;
  const sourceName = asTrimmedString(source.scenario_name) || "Forecast Scenario";
  const now = new Date().toISOString();

  const clone = {
    ...source,
    id: undefined,
    scenario_name: `${sourceName} Copy`,
    is_active: false,
    created_at: now,
    updated_at: now,
  };

  const { data: inserted } = await supabaseAdmin
    .from("proforma_assumptions")
    .insert(clone)
    .select("id")
    .single();

  const clonedId = asTrimmedString((inserted as Record<string, unknown> | null)?.id);

  await writeFinancialAuditLog({
    actor,
    action: "clone_pro_forma_scenario",
    targetType: "proforma_assumptions",
    targetId: clonedId,
    metadata: { sourceId: id, sourceName },
  });

  revalidatePath("/admin/financials/pro-forma");
}

async function archiveProFormaScenario(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("archive_pro_forma_scenario");
  if (!actor) return;

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  await supabaseAdmin
    .from("proforma_assumptions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  await writeFinancialAuditLog({
    actor,
    action: "archive_pro_forma_scenario",
    targetType: "proforma_assumptions",
    targetId: id,
  });

  revalidatePath("/admin/financials/pro-forma");
}

function getGrowthCampaignName(row: GrowthCampaignRoiRow) {
  return asTrimmedString(row.campaign_name) || "Unassigned Campaign";
}

function getGrowthSignal(row: GrowthCampaignRoiRow) {
  return asTrimmedString(row.growth_signal) || "needs_more_data";
}

function getGrowthRecommendation(row: GrowthCampaignRoiRow) {
  return (
    asTrimmedString(row.admin_recommendation) ||
    "Keep tracking campaign events before making a strong scaling decision."
  );
}

function getGrowthActuals({
  campaignRows,
  summaryRows,
  marketingExpenseRows,
}: {
  campaignRows: GrowthCampaignRoiRow[];
  summaryRows: GrowthFinancialSummaryRow[];
  marketingExpenseRows: GrowthMarketingExpenseRow[];
}): GrowthForecastActuals {
  const activeCampaignRows = campaignRows.filter((row) =>
    getGrowthCampaignName(row),
  );

  const totalClicks = activeCampaignRows.reduce(
    (sum, row) => sum + toNumber(row.clicks),
    0,
  );
  const totalLeads = activeCampaignRows.reduce(
    (sum, row) => sum + toNumber(row.leads),
    0,
  );
  const totalSignups = activeCampaignRows.reduce(
    (sum, row) => sum + toNumber(row.signups),
    0,
  );
  const totalBookings = activeCampaignRows.reduce(
    (sum, row) => sum + toNumber(row.bookings),
    0,
  );
  const attributedRevenue = activeCampaignRows.reduce(
    (sum, row) => sum + toNumber(row.attributed_revenue),
    0,
  );
  const trackedMarketingCost = activeCampaignRows.reduce(
    (sum, row) => sum + toNumber(row.total_cost),
    0,
  );
  const netGrowthReturn = activeCampaignRows.reduce(
    (sum, row) => sum + toNumber(row.net_growth_return),
    0,
  );

  const weightedCostPerSignup =
    totalSignups > 0 ? trackedMarketingCost / totalSignups : 0;
  const weightedCostPerBooking =
    totalBookings > 0 ? trackedMarketingCost / totalBookings : 0;

  const roiRows = activeCampaignRows
    .map((row) => toNumber(row.roi_percent))
    .filter((value) => Number.isFinite(value) && value !== 0);
  const averageRoiPercent = roiRows.length
    ? roiRows.reduce((sum, value) => sum + value, 0) / roiRows.length
    : trackedMarketingCost > 0
      ? ((attributedRevenue - trackedMarketingCost) / trackedMarketingCost) * 100
      : 0;

  const marketingSpendTotal = marketingExpenseRows.reduce(
    (sum, row) => sum + toNumber(row.amount),
    0,
  );

  const marketingDates = marketingExpenseRows
    .map((row) => asTrimmedString(row.cost_date) || asTrimmedString(row.created_at))
    .filter(Boolean)
    .map((value) => value.slice(0, 7));
  const marketingMonthCount = new Set(marketingDates).size || 1;

  const issuedReferralRewardExpense = summaryRows
    .filter(
      (row) =>
        asTrimmedString(row.source) === "referral_rewards" &&
        asTrimmedString(row.financial_statement_section) ===
          "issued_reward_expense",
    )
    .reduce((sum, row) => sum + toNumber(row.total_amount), 0);

  const pendingReferralRewardLiability = summaryRows
    .filter(
      (row) =>
        asTrimmedString(row.source) === "referral_rewards" &&
        asTrimmedString(row.financial_statement_section) ===
          "pending_reward_liability",
    )
    .reduce((sum, row) => sum + toNumber(row.total_amount), 0);

  const topCampaign = [...activeCampaignRows].sort((a, b) => {
    const leftBookings = toNumber(a.bookings);
    const rightBookings = toNumber(b.bookings);
    if (leftBookings !== rightBookings) return rightBookings - leftBookings;

    const leftRevenue = toNumber(a.attributed_revenue);
    const rightRevenue = toNumber(b.attributed_revenue);
    if (leftRevenue !== rightRevenue) return rightRevenue - leftRevenue;

    return toNumber(b.roi_percent) - toNumber(a.roi_percent);
  })[0];

  return {
    campaignCount: activeCampaignRows.length,
    totalClicks,
    totalLeads,
    totalSignups,
    totalBookings,
    attributedRevenue,
    trackedMarketingCost: trackedMarketingCost || marketingSpendTotal,
    netGrowthReturn:
      netGrowthReturn || attributedRevenue - (trackedMarketingCost || marketingSpendTotal),
    averageRoiPercent,
    costPerSignup: weightedCostPerSignup,
    costPerBooking: weightedCostPerBooking,
    monthlyMarketingExpenseAverage: marketingSpendTotal / marketingMonthCount,
    issuedReferralRewardExpense,
    pendingReferralRewardLiability,
    bestGrowthSignal: topCampaign ? getGrowthSignal(topCampaign) : "needs_more_data",
    bestRecommendation: topCampaign
      ? getGrowthRecommendation(topCampaign)
      : "Add campaign events and costs to improve Pro Forma growth forecasting.",
  };
}

function getTrustSafetyEventAmountCents(row: TrustSafetyFinancialEventRow) {
  return (
    toNumber(row.net_amount_cents) ||
    toNumber(row.gross_amount_cents) ||
    toNumber(row.amount_cents)
  );
}

function getTrustSafetyActuals({
  purchases,
  events,
}: {
  purchases: TrustSafetyPurchaseRow[];
  events: TrustSafetyFinancialEventRow[];
}): TrustSafetyActuals {
  const purchaseCount = purchases.length;
  const pawInFullCount = purchases.filter(
    (row) => asTrimmedString(row.plan_key) === "paw_in_full",
  ).length;
  const pawstepCount = purchases.filter(
    (row) => asTrimmedString(row.plan_key) === "pawstep_plan",
  ).length;
  const bookAndBarkCount = purchases.filter(
    (row) => asTrimmedString(row.plan_key) === "book_and_bark_plan",
  ).length;

  const cashCollected = purchases.reduce(
    (sum, row) => sum + centsToDollars(toNumber(row.amount_paid_cents)),
    0,
  );
  const outstandingBalance = purchases.reduce(
    (sum, row) => sum + centsToDollars(toNumber(row.remaining_balance_cents)),
    0,
  );

  const vendorCosts = events
    .filter((row) => asTrimmedString(row.event_type) === "checkr_vendor_cost")
    .reduce((sum, row) => sum + centsToDollars(Math.abs(getTrustSafetyEventAmountCents(row))), 0);
  const stripeFees = events
    .filter((row) => asTrimmedString(row.event_type) === "stripe_fee")
    .reduce((sum, row) => sum + centsToDollars(Math.abs(getTrustSafetyEventAmountCents(row))), 0);
  const refunds = events
    .filter((row) => asTrimmedString(row.event_type) === "refund")
    .reduce((sum, row) => sum + centsToDollars(Math.abs(getTrustSafetyEventAmountCents(row))), 0);

  return {
    purchaseCount,
    pawInFullCount,
    pawstepCount,
    bookAndBarkCount,
    cashCollected,
    outstandingBalance,
    vendorCosts,
    stripeFees,
    refunds,
    monthlyPlanStarts: Math.max(1, Math.round(purchaseCount / 3)),
  };
}

function buildForecast(
  assumptions: Assumptions,
  trustSafetyActuals: TrustSafetyActuals,
  growthActuals: GrowthForecastActuals,
): ForecastMonth[] {
  const forecastMonths = Math.max(
    1,
    Math.min(36, assumptions.forecastMonths || 12),
  );
  const growthRate = assumptions.monthlyGrowthRate / 100;

  let runningCash =
    assumptions.beginningCash +
    assumptions.ownerContribution +
    assumptions.loanProceeds;

  return Array.from({ length: forecastMonths }, (_, index) => {
    const monthNumber = index + 1;
    const growthMultiplier = Math.pow(1 + growthRate, index);
    const projectedBookings = assumptions.monthlyBookings * growthMultiplier;
    const grossBookingVolume =
      projectedBookings * assumptions.averageBookingValue;

    const platformRevenue =
      grossBookingVolume * (assumptions.platformFeeRate / 100);
    const guruPayouts =
      grossBookingVolume * (assumptions.guruPayoutRate / 100);
    const refunds = grossBookingVolume * (assumptions.refundRate / 100);

    const projectedTrustSafetyGurus = Math.max(
      0,
      (assumptions.newGurusPerMonth || trustSafetyActuals.monthlyPlanStarts) *
        growthMultiplier,
    );

    const totalMix = Math.max(
      1,
      assumptions.pawInFullMixRate +
        assumptions.pawstepMixRate +
        assumptions.bookAndBarkMixRate,
    );
    const pawInFullMix = assumptions.pawInFullMixRate / totalMix;
    const pawstepMix = assumptions.pawstepMixRate / totalMix;
    const bookAndBarkMix = assumptions.bookAndBarkMixRate / totalMix;

    const pawInFullCount = projectedTrustSafetyGurus * pawInFullMix;
    const pawstepCount = projectedTrustSafetyGurus * pawstepMix;
    const bookAndBarkCount = projectedTrustSafetyGurus * bookAndBarkMix;

    const pawInFullRevenue =
      pawInFullCount * centsToDollars(TRUST_SAFETY_PLAN_CENTS.pawInFullTotal);
    const pawstepContractedRevenue =
      pawstepCount * centsToDollars(TRUST_SAFETY_PLAN_CENTS.flexibleTotal);
    const bookAndBarkContractedRevenue =
      bookAndBarkCount * centsToDollars(TRUST_SAFETY_PLAN_CENTS.flexibleTotal);

    const trustSafetyContractedRevenue =
      pawInFullRevenue + pawstepContractedRevenue + bookAndBarkContractedRevenue;

    const trustSafetyCashToday =
      pawInFullRevenue +
      pawstepCount * centsToDollars(TRUST_SAFETY_PLAN_CENTS.flexibleDownPayment) +
      bookAndBarkCount * centsToDollars(TRUST_SAFETY_PLAN_CENTS.flexibleDownPayment);

    const recoveryRamp = Math.min(monthNumber, 3) / 3;
    const trustSafetyInstallmentRecovery =
      pawstepCount *
      centsToDollars(TRUST_SAFETY_PLAN_CENTS.flexibleRemaining) *
      recoveryRamp *
      (assumptions.pawstepCollectionRate / 100);
    const trustSafetyBookingDeductionRecovery =
      bookAndBarkCount *
      centsToDollars(TRUST_SAFETY_PLAN_CENTS.flexibleRemaining) *
      recoveryRamp *
      (assumptions.bookAndBarkRecoveryRate / 100);

    const trustSafetyCashCollected =
      trustSafetyCashToday +
      trustSafetyInstallmentRecovery +
      trustSafetyBookingDeductionRecovery;

    const trustSafetyVendorCosts =
      projectedTrustSafetyGurus * assumptions.checkrCostPerGuru;

    const trustSafetyStripeFees =
      trustSafetyCashCollected * (assumptions.trustSafetyStripeFeeRate / 100);

    const trustSafetyNetCash =
      trustSafetyCashCollected - trustSafetyVendorCosts - trustSafetyStripeFees;

    const grossProfit =
      platformRevenue + trustSafetyCashCollected - refunds - trustSafetyVendorCosts - trustSafetyStripeFees;

    const actualCostPerBooking = growthActuals.costPerBooking || 0;
    const growthMarketingSpend =
      actualCostPerBooking > 0
        ? Math.max(
            assumptions.monthlyMarketingSpend,
            projectedBookings * actualCostPerBooking,
          )
        : assumptions.monthlyMarketingSpend;
    const referralRewardExpense =
      growthActuals.issuedReferralRewardExpense > 0
        ? growthActuals.issuedReferralRewardExpense / forecastMonths
        : 0;

    const operatingExpenses =
      growthMarketingSpend +
      referralRewardExpense +
      assumptions.monthlySoftwareSpend +
      assumptions.monthlyAdminSpend +
      assumptions.monthlyInsuranceSpend +
      assumptions.monthlyLegalSpend +
      assumptions.otherMonthlyExpenses;

    const netIncome = grossProfit - operatingExpenses;

    const financingCash =
      index === 0
        ? assumptions.ownerContribution +
          assumptions.loanProceeds -
          assumptions.loanRepayments
        : -assumptions.loanRepayments;

    const netCashFlow = netIncome + financingCash;
    runningCash += netCashFlow;

    return {
      monthNumber,
      label: `Month ${monthNumber}`,
      projectedBookings,
      projectedTrustSafetyGurus,
      grossBookingVolume,
      platformRevenue,
      guruPayouts,
      refunds,
      trustSafetyContractedRevenue,
      trustSafetyCashCollected,
      trustSafetyInstallmentRecovery,
      trustSafetyBookingDeductionRecovery,
      trustSafetyVendorCosts,
      trustSafetyStripeFees,
      trustSafetyNetCash,
      grossProfit,
      growthMarketingSpend,
      referralRewardExpense,
      acquisitionCostPerBooking: actualCostPerBooking,
      operatingExpenses,
      netIncome,
      financingCash,
      netCashFlow,
      endingCash: runningCash,
    };
  });
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
  if (primary) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
    >
      {label}
    </Link>
  );
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
  tone?: "emerald" | "sky" | "violet" | "amber" | "rose";
}) {
  const toneClass = {
    emerald: "border-emerald-100 bg-emerald-50",
    sky: "border-sky-100 bg-sky-50",
    violet: "border-violet-100 bg-violet-50",
    amber: "border-amber-100 bg-amber-50",
    rose: "border-rose-100 bg-rose-50",
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

function NumberInput({
  label,
  name,
  defaultValue,
  step = "1",
}: {
  label: string;
  name: string;
  defaultValue: number;
  step?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </label>
      <input
        name={name}
        type="number"
        step={step}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}

function readinessClasses(status: ForecastReadinessItem["status"]) {
  const classes = {
    ready: "border-emerald-100 bg-emerald-50 text-emerald-800",
    needs_review: "border-amber-100 bg-amber-50 text-amber-800",
    missing: "border-rose-100 bg-rose-50 text-rose-800",
  };

  return classes[status];
}

function ForecastReadinessPanel({
  items,
}: {
  items: ForecastReadinessItem[];
}) {
  const readyCount = items.filter((item) => item.status === "ready").length;

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Forecast Readiness
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Planning checks for runway and CPA review
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            These checks confirm whether the forecast has enough assumptions to
            support revenue planning, cash runway, expense forecasting, funding
            scenarios, Trust & Safety screening projections, and comparison
            against actual financial statements.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          {readyCount}/{items.length} ready
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
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

function IntegrationFlowPanel() {
  const steps = [
    "Actual P&L, Balance Sheet, Cash Flow, General Ledger, and Trust & Safety records provide the baseline operating model.",
    "Pro forma assumptions project bookings, platform fees, refunds, payouts, expenses, Trust & Safety plans, and growth.",
    "Trust & Safety projections split Paw in Full, Pawstep, and Book & Bark into cash collected, receivables, vendor costs, Stripe fees, and recoveries.",
    "Cash planning layers in beginning cash, owner contributions, loan proceeds, repayments, and projected screening cash flow.",
    "Exports give CPA/bookkeeper/investor-ready planning schedules alongside actual statements.",
  ];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
        Actuals + Forecast Flow
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        How Pro Forma connects to the financial system
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

function getForecastReadinessItems({
  assumptions,
  forecast,
  savedScenarioCount,
  trustSafetyActuals,
  growthActuals,
}: {
  assumptions: Assumptions;
  forecast: ForecastMonth[];
  savedScenarioCount: number;
  trustSafetyActuals: TrustSafetyActuals;
  growthActuals: GrowthForecastActuals;
}): ForecastReadinessItem[] {
  const totalOperatingExpenses =
    assumptions.monthlyMarketingSpend +
    assumptions.monthlySoftwareSpend +
    assumptions.monthlyAdminSpend +
    assumptions.monthlyInsuranceSpend +
    assumptions.monthlyLegalSpend +
    assumptions.otherMonthlyExpenses;

  const hasFunding =
    assumptions.beginningCash > 0 ||
    assumptions.ownerContribution > 0 ||
    assumptions.loanProceeds > 0;

  const endingCash = forecast[forecast.length - 1]?.endingCash || 0;
  const trustSafetyCash = forecast.reduce(
    (sum, row) => sum + row.trustSafetyCashCollected,
    0,
  );

  return [
    {
      label: "Saved scenario",
      status: savedScenarioCount > 0 ? "ready" : "needs_review",
      detail:
        savedScenarioCount > 0
          ? `${savedScenarioCount.toLocaleString()} saved pro forma scenario record${savedScenarioCount === 1 ? "" : "s"} found.`
          : "Using default assumptions until a scenario is saved.",
    },
    {
      label: "Revenue assumptions",
      status:
        assumptions.monthlyBookings > 0 &&
        assumptions.averageBookingValue > 0 &&
        assumptions.platformFeeRate > 0
          ? "ready"
          : "missing",
      detail: `${assumptions.monthlyBookings.toLocaleString()} monthly bookings at ${moneyExact(
        assumptions.averageBookingValue,
      )} average booking value and ${percent(
        assumptions.platformFeeRate,
      )} platform fee.`,
    },
    {
      label: "Trust & Safety assumptions",
      status: trustSafetyCash > 0 ? "ready" : "needs_review",
      detail: trustSafetyActuals.purchaseCount
        ? `${trustSafetyActuals.purchaseCount.toLocaleString()} actual Trust & Safety purchases are available to anchor the forecast.`
        : "No historical Trust & Safety purchases found yet, so projections use the default plan mix model.",
    },
    {
      label: "Expense assumptions",
      status: totalOperatingExpenses > 0 ? "ready" : "needs_review",
      detail: `${moneyExact(
        totalOperatingExpenses,
      )} estimated recurring monthly operating expenses before growth actual overrides.`,
    },
    {
      label: "Growth ROI actuals",
      status: growthActuals.campaignCount > 0 ? "ready" : "needs_review",
      detail: growthActuals.campaignCount
        ? `${growthActuals.campaignCount.toLocaleString()} tracked campaign${growthActuals.campaignCount === 1 ? "" : "s"}; ${moneyExact(growthActuals.costPerBooking)} cost per booking and ${percent(growthActuals.averageRoiPercent)} average ROI.`
        : "No campaign ROI rows found yet, so Pro Forma uses manual marketing assumptions.",
    },
    {
      label: "Cash runway assumptions",
      status: hasFunding ? "ready" : "needs_review",
      detail: hasFunding
        ? `Forecast includes ${moneyExact(
            assumptions.beginningCash + assumptions.ownerContribution + assumptions.loanProceeds,
          )} of beginning/funding cash support.`
        : "Add beginning cash, owner contribution, or loan proceeds for more useful runway planning.",
    },
    {
      label: "Ending cash signal",
      status: endingCash >= 0 ? "ready" : "missing",
      detail:
        endingCash >= 0
          ? `Projected ending cash is ${moneyExact(endingCash)}.`
          : `Projected ending cash is negative at ${moneyExact(endingCash)}; review pricing, spend, screening costs, or funding.`,
    },
  ];
}


function GrowthForecastPanel({
  growthActuals,
  forecast,
}: {
  growthActuals: GrowthForecastActuals;
  forecast: ForecastMonth[];
}) {
  const projectedGrowthSpend = forecast.reduce(
    (sum, row) => sum + row.growthMarketingSpend,
    0,
  );
  const projectedReferralRewards = forecast.reduce(
    (sum, row) => sum + row.referralRewardExpense,
    0,
  );
  const projectedBookings = forecast.reduce(
    (sum, row) => sum + row.projectedBookings,
    0,
  );

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Growth ROI Forecast Link
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Marketing and referral actuals now inform Pro Forma.
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            This section reads the Growth & Referrals financial views and uses
            tracked cost per booking, campaign ROI, and issued referral reward
            expense to strengthen the forecast model.
          </p>
        </div>

        <ActionLink href="/admin/referrals" label="Open Growth & Referrals" primary />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tracked Campaigns"
          value={growthActuals.campaignCount.toLocaleString()}
          detail={`${growthActuals.totalClicks.toLocaleString()} clicks, ${growthActuals.totalSignups.toLocaleString()} signups, ${growthActuals.totalBookings.toLocaleString()} bookings.`}
          tone="emerald"
        />
        <StatCard
          label="Cost Per Booking"
          value={moneyExact(growthActuals.costPerBooking)}
          detail={
            growthActuals.costPerBooking > 0
              ? "Used as a forecast acquisition-cost floor when higher than manual marketing spend."
              : "No campaign booking cost yet; manual marketing spend remains the forecast driver."
          }
          tone="sky"
        />
        <StatCard
          label="Growth ROI"
          value={percent(growthActuals.averageRoiPercent)}
          detail={`${moneyExact(growthActuals.attributedRevenue)} attributed revenue against ${moneyExact(growthActuals.trackedMarketingCost)} tracked cost.`}
          tone={growthActuals.averageRoiPercent >= 0 ? "violet" : "rose"}
        />
        <StatCard
          label="Referral Liability"
          value={moneyExact(growthActuals.pendingReferralRewardLiability)}
          detail="Pending rewards remain a balance-sheet liability until issued, paid, or credited."
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Forecast impact
          </p>
          <div className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
            <div className="flex items-center justify-between gap-4">
              <span>Projected bookings</span>
              <span className="font-black text-slate-950">{number(projectedBookings)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Projected growth marketing spend</span>
              <span className="font-black text-slate-950">{moneyExact(projectedGrowthSpend)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Projected issued referral rewards</span>
              <span className="font-black text-slate-950">{moneyExact(projectedReferralRewards)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Growth signal
          </p>
          <p className="mt-2 text-xl font-black capitalize text-slate-950">
            {growthActuals.bestGrowthSignal.replaceAll("_", " ")}
          </p>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            {growthActuals.bestRecommendation}
          </p>
        </div>
      </div>
    </section>
  );
}

function ScenarioRepository({
  scenarios,
  activeId,
}: {
  scenarios: ScenarioRepositoryItem[];
  activeId: string;
}) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Saved Forecast Scenarios
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Scenario repository for SitGuru planning.
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Save Soft Launch, Base Case, Growth Case, Investor Case, or custom planning models. Set one active scenario to drive the Pro Forma forecast, clone it before changing assumptions, or archive scenarios you no longer want in the active planning list.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          {scenarios.length.toLocaleString()} saved
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {scenarios.length ? (
          scenarios.map((scenario) => (
            <article
              key={scenario.id}
              className={`rounded-[1.5rem] border p-4 ${
                scenario.id === activeId || scenario.isActive
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-100 bg-[#fbfefd]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-slate-950">
                    {scenario.scenarioName}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {scenario.forecastMonths} months · {number(scenario.monthlyBookings)} bookings/mo · {moneyExact(scenario.averageBookingValue)} ABV
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${
                    scenario.id === activeId || scenario.isActive
                      ? "border-emerald-200 bg-white text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {scenario.id === activeId || scenario.isActive ? "Active" : "Saved"}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                <div className="rounded-xl border border-white bg-white p-3">
                  <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Fee</span>
                  {percent(scenario.platformFeeRate)}
                </div>
                <div className="rounded-xl border border-white bg-white p-3">
                  <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Growth</span>
                  {percent(scenario.monthlyGrowthRate)}
                </div>
                <div className="rounded-xl border border-white bg-white p-3">
                  <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">New Gurus</span>
                  {number(scenario.newGurusPerMonth)}/mo
                </div>
                <div className="rounded-xl border border-white bg-white p-3">
                  <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Updated</span>
                  {scenario.updatedAt ? scenario.updatedAt.slice(0, 10) : "—"}
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <form action={setActiveProFormaScenario}>
                  <input type="hidden" name="id" value={scenario.id} />
                  <button
                    type="submit"
                    disabled={scenario.id === activeId || scenario.isActive}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-black transition ${
                      scenario.id === activeId || scenario.isActive
                        ? "cursor-not-allowed bg-emerald-100 text-emerald-700"
                        : "bg-emerald-700 text-white hover:bg-emerald-800"
                    }`}
                  >
                    Set Active
                  </button>
                </form>

                <form action={cloneProFormaScenario}>
                  <input type="hidden" name="id" value={scenario.id} />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    Clone
                  </button>
                </form>

                <form action={archiveProFormaScenario}>
                  <input type="hidden" name="id" value={scenario.id} />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-50"
                  >
                    Archive
                  </button>
                </form>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-600 lg:col-span-3">
            No saved forecast scenarios yet. Save the form below to create your first active Base Case scenario.
          </div>
        )}
      </div>
    </section>
  );
}

async function getProFormaData() {
  const [
    rows,
    trustSafetyPurchases,
    trustSafetyEvents,
    growthCampaignRows,
    growthFinancialSummaryRows,
    growthMarketingExpenseRows,
  ] = await Promise.all([
    safeRows<ProFormaRow>(
      supabaseAdmin
        .from("proforma_assumptions")
        .select("*")
        .order("is_active", { ascending: false })
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50),
      "proforma_assumptions",
    ),
    safeRows<TrustSafetyPurchaseRow>(
      supabaseAdmin
        .from("guru_trust_safety_plan_purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500),
      "guru_trust_safety_plan_purchases",
    ),
    safeRows<TrustSafetyFinancialEventRow>(
      supabaseAdmin
        .from("trust_safety_financial_events")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(1500),
      "trust_safety_financial_events",
    ),
    safeRows<GrowthCampaignRoiRow>(
      supabaseAdmin
        .from("admin_growth_campaign_roi")
        .select("*")
        .order("bookings", { ascending: false })
        .limit(250),
      "admin_growth_campaign_roi",
    ),
    safeRows<GrowthFinancialSummaryRow>(
      supabaseAdmin
        .from("admin_growth_financial_summary")
        .select("*")
        .limit(250),
      "admin_growth_financial_summary",
    ),
    safeRows<GrowthMarketingExpenseRow>(
      supabaseAdmin
        .from("admin_growth_marketing_expenses")
        .select("*")
        .order("cost_date", { ascending: false })
        .limit(1000),
      "admin_growth_marketing_expenses",
    ),
  ]);

  const scenarioRows = rows;
  const activeScenario =
    scenarioRows.find((row) => getOptionalBoolean(row.is_active)) ||
    scenarioRows[0];
  const scenarios = scenarioRows.map(rowToScenarioRepositoryItem);
  const assumptions = rowToAssumptions(activeScenario);
  const trustSafetyActuals = getTrustSafetyActuals({
    purchases: trustSafetyPurchases,
    events: trustSafetyEvents,
  });
  const growthActuals = getGrowthActuals({
    campaignRows: growthCampaignRows,
    summaryRows: growthFinancialSummaryRows,
    marketingExpenseRows: growthMarketingExpenseRows,
  });
  const forecast = buildForecast(assumptions, trustSafetyActuals, growthActuals);

  const totalGrossBookingVolume = forecast.reduce(
    (sum, row) => sum + row.grossBookingVolume,
    0,
  );

  const totalPlatformRevenue = forecast.reduce(
    (sum, row) => sum + row.platformRevenue,
    0,
  );

  const totalGuruPayouts = forecast.reduce(
    (sum, row) => sum + row.guruPayouts,
    0,
  );

  const totalRefunds = forecast.reduce((sum, row) => sum + row.refunds, 0);

  const totalTrustSafetyContractedRevenue = forecast.reduce(
    (sum, row) => sum + row.trustSafetyContractedRevenue,
    0,
  );
  const totalTrustSafetyCashCollected = forecast.reduce(
    (sum, row) => sum + row.trustSafetyCashCollected,
    0,
  );
  const totalTrustSafetyInstallments = forecast.reduce(
    (sum, row) => sum + row.trustSafetyInstallmentRecovery,
    0,
  );
  const totalTrustSafetyBookingDeductions = forecast.reduce(
    (sum, row) => sum + row.trustSafetyBookingDeductionRecovery,
    0,
  );
  const totalTrustSafetyVendorCosts = forecast.reduce(
    (sum, row) => sum + row.trustSafetyVendorCosts,
    0,
  );
  const totalTrustSafetyStripeFees = forecast.reduce(
    (sum, row) => sum + row.trustSafetyStripeFees,
    0,
  );
  const totalTrustSafetyNetCash = forecast.reduce(
    (sum, row) => sum + row.trustSafetyNetCash,
    0,
  );

  const totalOperatingExpenses = forecast.reduce(
    (sum, row) => sum + row.operatingExpenses,
    0,
  );
  const totalGrowthMarketingSpend = forecast.reduce(
    (sum, row) => sum + row.growthMarketingSpend,
    0,
  );
  const totalProjectedReferralRewards = forecast.reduce(
    (sum, row) => sum + row.referralRewardExpense,
    0,
  );

  const totalNetIncome = forecast.reduce((sum, row) => sum + row.netIncome, 0);

  const endingCash =
    forecast[forecast.length - 1]?.endingCash || assumptions.beginningCash;
  const breakEvenMonth =
    forecast.find((row) => row.netIncome >= 0)?.monthNumber || null;

  const maxVisualValue = Math.max(
    totalPlatformRevenue + totalTrustSafetyCashCollected,
    totalOperatingExpenses,
    Math.abs(totalNetIncome),
    Math.abs(endingCash),
    totalTrustSafetyCashCollected,
    1,
  );

  return {
    assumptions,
    scenarios,
    trustSafetyActuals,
    forecast,
    growthActuals,
    readinessItems: getForecastReadinessItems({
      assumptions,
      forecast,
      savedScenarioCount: scenarioRows.length,
      trustSafetyActuals,
      growthActuals,
    }),
    totals: {
      totalGrossBookingVolume,
      totalPlatformRevenue,
      totalGuruPayouts,
      totalRefunds,
      totalTrustSafetyContractedRevenue,
      totalTrustSafetyCashCollected,
      totalTrustSafetyInstallments,
      totalTrustSafetyBookingDeductions,
      totalTrustSafetyVendorCosts,
      totalTrustSafetyStripeFees,
      totalTrustSafetyNetCash,
      totalOperatingExpenses,
      totalGrowthMarketingSpend,
      totalProjectedReferralRewards,
      totalNetIncome,
      endingCash,
      breakEvenMonth,
      maxVisualValue,
    },
  };
}

export default async function AdminProFormaPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessFinancials) {
    return null;
  }

  const proForma = await getProFormaData();
  const { assumptions } = proForma;

  const visualRows = [
    {
      label: "Projected Platform Revenue",
      value: proForma.totals.totalPlatformRevenue,
      tone: "bg-emerald-500",
    },
    {
      label: "Projected Trust & Safety Cash",
      value: proForma.totals.totalTrustSafetyCashCollected,
      tone: "bg-sky-400",
    },
    {
      label: "Projected Operating Expenses",
      value: proForma.totals.totalOperatingExpenses,
      tone: "bg-amber-400",
    },
    {
      label:
        proForma.totals.totalNetIncome >= 0
          ? "Projected Net Income"
          : "Projected Net Loss",
      value: Math.abs(proForma.totals.totalNetIncome),
      tone:
        proForma.totals.totalNetIncome >= 0 ? "bg-violet-400" : "bg-rose-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7fbf8] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Admin / Financials / Pro Forma
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                SitGuru Pro Forma Forecast.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Forecast future booking revenue, Guru payouts, refunds,
                operating expenses, Trust & Safety screening plans, Checkr cost
                exposure, cash flow, break-even timing, and ending cash based on
                planning assumptions.
              </p>
            </div>

            <div className="flex max-w-2xl flex-wrap gap-3">
              <ActionLink href="/admin/financials" label="Financials" />
              <ActionLink href="/admin/financials/profit-loss" label="P&L" />
              <ActionLink href="/admin/financials/cash-flow" label="Cash Flow" />
              <ActionLink
                href="/admin/financials/balance-sheet"
                label="Balance Sheet"
              />
              <ActionLink
                href="/admin/background-checks"
                label="Trust & Safety"
              />
              <ActionLink
                href="/api/admin/financials/pro-forma/export?format=csv"
                label="CSV"
              />
              <ActionLink
                href="/api/admin/financials/pro-forma/export?format=excel"
                label="Excel"
              />
              <ActionLink
                href="/api/admin/financials/pro-forma/export?format=pdf"
                label="PDF / Print"
                primary
              />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Projected Revenue"
              value={money(
                proForma.totals.totalPlatformRevenue +
                  proForma.totals.totalTrustSafetyCashCollected,
              )}
              detail={`${assumptions.forecastMonths} month projected platform + Trust & Safety cash revenue.`}
              tone="emerald"
            />
            <StatCard
              label="Projected Trust & Safety"
              value={money(proForma.totals.totalTrustSafetyCashCollected)}
              detail={`${money(proForma.totals.totalTrustSafetyNetCash)} projected net Trust & Safety cash after Checkr and Stripe costs.`}
              tone="sky"
            />
            <StatCard
              label="Projected Net Income / Loss"
              value={money(proForma.totals.totalNetIncome)}
              detail={
                proForma.totals.breakEvenMonth
                  ? `Breakeven begins around month ${proForma.totals.breakEvenMonth}.`
                  : "No breakeven month in this forecast."
              }
              tone={proForma.totals.totalNetIncome >= 0 ? "violet" : "rose"}
            />
            <StatCard
              label="Projected Ending Cash"
              value={money(proForma.totals.endingCash)}
              detail="Beginning cash plus projected net cash movement."
              tone={proForma.totals.endingCash >= 0 ? "amber" : "rose"}
            />
          </div>
        </section>

        <ScenarioRepository
          scenarios={proForma.scenarios}
          activeId={assumptions.id}
        />

        <ForecastReadinessPanel items={proForma.readinessItems} />

        <IntegrationFlowPanel />

        <GrowthForecastPanel
          growthActuals={proForma.growthActuals}
          forecast={proForma.forecast}
        />

        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Forecast Assumptions
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Update SitGuru forecast inputs.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              These assumptions save into the pro forma scenario repository. The active scenario drives this forecast, and Trust & Safety assumptions now model Guru starts, plan mix, Checkr costs, Stripe fees, Pawstep collections, Book & Bark recovery, campaign ROI, cost per booking, and referral reward expense.
            </p>

            <form action={saveProFormaAssumptions} className="mt-6 grid gap-5">
              <input type="hidden" name="id" value={assumptions.id} />

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Scenario Name
                </label>
                <input
                  name="scenarioName"
                  type="text"
                  defaultValue={assumptions.scenarioName}
                  className="mt-2 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Revenue assumptions
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <NumberInput
                    label="Monthly Bookings"
                    name="monthlyBookings"
                    defaultValue={assumptions.monthlyBookings}
                  />
                  <NumberInput
                    label="Average Booking Value"
                    name="averageBookingValue"
                    defaultValue={assumptions.averageBookingValue}
                    step="0.01"
                  />
                  <NumberInput
                    label="Platform Fee %"
                    name="platformFeeRate"
                    defaultValue={assumptions.platformFeeRate}
                    step="0.01"
                  />
                  <NumberInput
                    label="Guru Payout %"
                    name="guruPayoutRate"
                    defaultValue={assumptions.guruPayoutRate}
                    step="0.01"
                  />
                  <NumberInput
                    label="Refund Rate %"
                    name="refundRate"
                    defaultValue={assumptions.refundRate}
                    step="0.01"
                  />
                  <NumberInput
                    label="Monthly Growth %"
                    name="monthlyGrowthRate"
                    defaultValue={assumptions.monthlyGrowthRate}
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Operating expense assumptions
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <NumberInput
                    label="Marketing Spend"
                    name="monthlyMarketingSpend"
                    defaultValue={assumptions.monthlyMarketingSpend}
                    step="0.01"
                  />
                  <NumberInput
                    label="Software Spend"
                    name="monthlySoftwareSpend"
                    defaultValue={assumptions.monthlySoftwareSpend}
                    step="0.01"
                  />
                  <NumberInput
                    label="Admin Spend"
                    name="monthlyAdminSpend"
                    defaultValue={assumptions.monthlyAdminSpend}
                    step="0.01"
                  />
                  <NumberInput
                    label="Insurance Spend"
                    name="monthlyInsuranceSpend"
                    defaultValue={assumptions.monthlyInsuranceSpend}
                    step="0.01"
                  />
                  <NumberInput
                    label="Legal Spend"
                    name="monthlyLegalSpend"
                    defaultValue={assumptions.monthlyLegalSpend}
                    step="0.01"
                  />
                  <NumberInput
                    label="Other Expenses"
                    name="otherMonthlyExpenses"
                    defaultValue={assumptions.otherMonthlyExpenses}
                    step="0.01"
                  />
                </div>
              </div>


              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Trust & Safety forecast assumptions
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <NumberInput
                    label="New Gurus Per Month"
                    name="newGurusPerMonth"
                    defaultValue={assumptions.newGurusPerMonth}
                    step="0.01"
                  />
                  <NumberInput
                    label="Paw in Full Mix %"
                    name="pawInFullMixRate"
                    defaultValue={assumptions.pawInFullMixRate}
                    step="0.01"
                  />
                  <NumberInput
                    label="Pawstep Mix %"
                    name="pawstepMixRate"
                    defaultValue={assumptions.pawstepMixRate}
                    step="0.01"
                  />
                  <NumberInput
                    label="Book & Bark Mix %"
                    name="bookAndBarkMixRate"
                    defaultValue={assumptions.bookAndBarkMixRate}
                    step="0.01"
                  />
                  <NumberInput
                    label="Checkr Cost Per Guru"
                    name="checkrCostPerGuru"
                    defaultValue={assumptions.checkrCostPerGuru}
                    step="0.01"
                  />
                  <NumberInput
                    label="Trust & Safety Stripe Fee %"
                    name="trustSafetyStripeFeeRate"
                    defaultValue={assumptions.trustSafetyStripeFeeRate}
                    step="0.01"
                  />
                  <NumberInput
                    label="Pawstep Collection Rate %"
                    name="pawstepCollectionRate"
                    defaultValue={assumptions.pawstepCollectionRate}
                    step="0.01"
                  />
                  <NumberInput
                    label="Book & Bark Recovery Rate %"
                    name="bookAndBarkRecoveryRate"
                    defaultValue={assumptions.bookAndBarkRecoveryRate}
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Cash and financing assumptions
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <NumberInput
                    label="Beginning Cash"
                    name="beginningCash"
                    defaultValue={assumptions.beginningCash}
                    step="0.01"
                  />
                  <NumberInput
                    label="Owner Contribution"
                    name="ownerContribution"
                    defaultValue={assumptions.ownerContribution}
                    step="0.01"
                  />
                  <NumberInput
                    label="Loan Proceeds"
                    name="loanProceeds"
                    defaultValue={assumptions.loanProceeds}
                    step="0.01"
                  />
                  <NumberInput
                    label="Loan Repayments"
                    name="loanRepayments"
                    defaultValue={assumptions.loanRepayments}
                    step="0.01"
                  />
                  <NumberInput
                    label="Forecast Months"
                    name="forecastMonths"
                    defaultValue={assumptions.forecastMonths}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
              >
                Save Forecast Assumptions
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-sky-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Trust & Safety Forecast
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Project screening revenue, cost, and recovery.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Uses the actual plan prices: Paw in Full at $37.99 and Pawstep / Book & Bark at $39.99 with $15 today and $24.99 recovered later.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <StatCard
                  label="Contracted Plan Value"
                  value={money(proForma.totals.totalTrustSafetyContractedRevenue)}
                  detail="Projected gross value of selected screening plans."
                  tone="sky"
                />
                <StatCard
                  label="Cash Collected"
                  value={money(proForma.totals.totalTrustSafetyCashCollected)}
                  detail="Upfront payments plus projected recoveries."
                  tone="emerald"
                />
                <StatCard
                  label="Book & Bark Recovery"
                  value={money(proForma.totals.totalTrustSafetyBookingDeductions)}
                  detail="Projected booking deduction recoveries."
                  tone="amber"
                />
                <StatCard
                  label="Checkr + Stripe Costs"
                  value={money(
                    proForma.totals.totalTrustSafetyVendorCosts +
                      proForma.totals.totalTrustSafetyStripeFees,
                  )}
                  detail="Projected screening vendor cost and processing fees."
                  tone="rose"
                />
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-[#fbfefd] p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Active Scenario Plan Mix
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-sm font-black text-slate-950">Paw in Full</p>
                    <p className="mt-1 text-2xl font-black text-emerald-700">40%</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">$37.99 today</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-sm font-black text-slate-950">Pawstep Plan</p>
                    <p className="mt-1 text-2xl font-black text-sky-700">35%</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">$15 today + installments</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-sm font-black text-slate-950">Book & Bark</p>
                    <p className="mt-1 text-2xl font-black text-amber-700">25%</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">$15 today + booking deductions</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Forecast Visuals
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Revenue, expenses, and net result.
              </h2>

              <div className="mt-6 space-y-5">
                {visualRows.map((row) => (
                  <div key={row.label}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-slate-950">
                        {row.label}
                      </p>
                      <p className="text-sm font-bold text-slate-950">
                        {money(row.value)}
                      </p>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div
                        className={`h-3 rounded-full ${row.tone}`}
                        style={{
                          width: `${getBarWidth(
                            row.value,
                            proForma.totals.maxVisualValue,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Monthly Forecast
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Booking + Trust & Safety projection by month
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Trust & Safety cash includes Paw in Full payments, Pawstep installment recoveries, Book & Bark booking deductions, estimated Checkr vendor cost, and Stripe fees.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1320px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3 text-right">Bookings</th>
                  <th className="px-4 py-3 text-right">Platform Rev.</th>
                  <th className="px-4 py-3 text-right">T&S Gurus</th>
                  <th className="px-4 py-3 text-right">T&S Cash</th>
                  <th className="px-4 py-3 text-right">Book & Bark</th>
                  <th className="px-4 py-3 text-right">Growth Spend</th>
                  <th className="px-4 py-3 text-right">Checkr/Stripe</th>
                  <th className="px-4 py-3 text-right">Net Income</th>
                  <th className="px-4 py-3 text-right">Ending Cash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {proForma.forecast.map((row) => (
                  <tr key={row.monthNumber} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4 font-black text-slate-950">
                      {row.label}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-600">
                      {number(row.projectedBookings)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-600">
                      {money(row.platformRevenue)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-600">
                      {number(row.projectedTrustSafetyGurus)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-700">
                      {money(row.trustSafetyCashCollected)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-amber-700">
                      {money(row.trustSafetyBookingDeductionRecovery)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-sky-700">
                      {money(row.growthMarketingSpend + row.referralRewardExpense)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-rose-700">
                      {money(row.trustSafetyVendorCosts + row.trustSafetyStripeFees)}
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-black ${
                        row.netIncome >= 0 ? "text-slate-950" : "text-rose-700"
                      }`}
                    >
                      {money(row.netIncome)}
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-black ${
                        row.endingCash >= 0 ? "text-slate-950" : "text-rose-700"
                      }`}
                    >
                      {money(row.endingCash)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-4">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Gross Booking Volume
            </p>
            <p className="mt-3 text-4xl font-black text-slate-950">
              {money(proForma.totals.totalGrossBookingVolume)}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Projected booking volume before platform fees, Guru payouts, and refunds.
            </p>
          </div>

          <div className="rounded-[2rem] border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Guru Payout Projection
            </p>
            <p className="mt-3 text-4xl font-black text-slate-950">
              {money(proForma.totals.totalGuruPayouts)}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Projected Guru payout activity based on payout percentage.
            </p>
          </div>

          <div className="rounded-[2rem] border border-amber-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Growth Spend Projection
            </p>
            <p className="mt-3 text-4xl font-black text-slate-950">
              {money(proForma.totals.totalGrowthMarketingSpend)}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Projected marketing spend using manual assumptions and actual cost-per-booking data when available.
            </p>
          </div>

          <div className="rounded-[2rem] border border-rose-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">
              Refund Exposure
            </p>
            <p className="mt-3 text-4xl font-black text-slate-950">
              {money(proForma.totals.totalRefunds)}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Projected refunds based on refund rate.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
