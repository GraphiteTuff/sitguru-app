import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ProFormaRow = Record<string, unknown>;

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
};

type ForecastMonth = {
  monthNumber: number;
  label: string;
  projectedBookings: number;
  grossBookingVolume: number;
  platformRevenue: number;
  guruPayouts: number;
  refunds: number;
  grossProfit: number;
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
  averageBookingValue: 75,
  platformFeeRate: 8,
  guruPayoutRate: 92,
  refundRate: 2,
  monthlyMarketingSpend: 250,
  monthlySoftwareSpend: 100,
  monthlyAdminSpend: 150,
  monthlyInsuranceSpend: 75,
  monthlyLegalSpend: 100,
  otherMonthlyExpenses: 100,
  beginningCash: 0,
  ownerContribution: 0,
  loanProceeds: 0,
  loanRepayments: 0,
  monthlyGrowthRate: 10,
  forecastMonths: 12,
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

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
    monthlyBookings: toNumber(row.monthly_bookings),
    averageBookingValue: toNumber(row.average_booking_value),
    platformFeeRate: toNumber(row.platform_fee_rate),
    guruPayoutRate: toNumber(row.guru_payout_rate),
    refundRate: toNumber(row.refund_rate),
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
    monthlyGrowthRate: toNumber(row.monthly_growth_rate),
    forecastMonths: Math.max(
      1,
      Math.min(36, Math.round(toNumber(row.forecast_months) || 12)),
    ),
  };
}

async function saveProFormaAssumptions(formData: FormData) {
  "use server";

  const actor = await requireFinancialAdminAction("save_pro_forma_assumptions");

  if (!actor) return;

  const id = String(formData.get("id") || "").trim();

  const payload = {
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
    forecast_months: Math.max(
      1,
      Math.min(36, Math.round(Number(formData.get("forecastMonths") || 12))),
    ),
    is_active: true,
  };

  let savedId = id;

  if (id) {
    await supabaseAdmin.from("proforma_assumptions").update(payload).eq("id", id);
  } else {
    const { data } = await supabaseAdmin
      .from("proforma_assumptions")
      .insert(payload)
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
    },
  });

  revalidatePath("/admin/financials/pro-forma");
}

function buildForecast(assumptions: Assumptions): ForecastMonth[] {
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

    const grossProfit = platformRevenue - refunds;

    const operatingExpenses =
      assumptions.monthlyMarketingSpend +
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
      grossBookingVolume,
      platformRevenue,
      guruPayouts,
      refunds,
      grossProfit,
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
            scenarios, and comparison against actual financial statements.
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
    "Actual P&L, Balance Sheet, and Cash Flow provide the baseline operating model.",
    "Pro forma assumptions project bookings, platform fees, refunds, payouts, expenses, and growth.",
    "Cash planning layers in beginning cash, owner contributions, loan proceeds, and repayments.",
    "Runway and break-even outputs guide pricing, marketing spend, hiring, and reserve decisions.",
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
}: {
  assumptions: Assumptions;
  forecast: ForecastMonth[];
  savedScenarioCount: number;
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

  return [
    {
      label: "Saved scenario",
      status: savedScenarioCount > 0 ? "ready" : "needs_review",
      detail:
        savedScenarioCount > 0
          ? `${savedScenarioCount.toLocaleString()} active pro forma scenario record found.`
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
      label: "Expense assumptions",
      status: totalOperatingExpenses > 0 ? "ready" : "needs_review",
      detail: `${moneyExact(
        totalOperatingExpenses,
      )} estimated recurring monthly operating expenses.`,
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
      label: "Forecast horizon",
      status: assumptions.forecastMonths >= 12 ? "ready" : "needs_review",
      detail: `${assumptions.forecastMonths} month forecast horizon. 12+ months is better for annual planning.`,
    },
    {
      label: "Ending cash signal",
      status: endingCash >= 0 ? "ready" : "missing",
      detail:
        endingCash >= 0
          ? `Projected ending cash is ${moneyExact(endingCash)}.`
          : `Projected ending cash is negative at ${moneyExact(endingCash)}; review pricing, spend, or funding.`,
    },
  ];
}

async function getProFormaData() {
  const rows = await safeRows<ProFormaRow>(
    supabaseAdmin
      .from("proforma_assumptions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1),
    "proforma_assumptions",
  );

  const assumptions = rowToAssumptions(rows[0]);
  const forecast = buildForecast(assumptions);

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

  const totalOperatingExpenses = forecast.reduce(
    (sum, row) => sum + row.operatingExpenses,
    0,
  );

  const totalNetIncome = forecast.reduce((sum, row) => sum + row.netIncome, 0);

  const endingCash =
    forecast[forecast.length - 1]?.endingCash || assumptions.beginningCash;
  const breakEvenMonth =
    forecast.find((row) => row.netIncome >= 0)?.monthNumber || null;

  const maxVisualValue = Math.max(
    totalPlatformRevenue,
    totalOperatingExpenses,
    Math.abs(totalNetIncome),
    Math.abs(endingCash),
    1,
  );

  return {
    assumptions,
    forecast,
    readinessItems: getForecastReadinessItems({
      assumptions,
      forecast,
      savedScenarioCount: rows.length,
    }),
    totals: {
      totalGrossBookingVolume,
      totalPlatformRevenue,
      totalGuruPayouts,
      totalRefunds,
      totalOperatingExpenses,
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
    {
      label: "Projected Ending Cash",
      value: Math.abs(proForma.totals.endingCash),
      tone: proForma.totals.endingCash >= 0 ? "bg-sky-400" : "bg-rose-400",
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
                Forecast future revenue, Guru payouts, refunds, operating
                expenses, net income, cash flow, break-even timing, and ending
                cash based on planning assumptions.
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
              value={money(proForma.totals.totalPlatformRevenue)}
              detail={`${assumptions.forecastMonths} month projected SitGuru platform fee revenue.`}
              tone="emerald"
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
              tone={proForma.totals.endingCash >= 0 ? "sky" : "rose"}
            />
            <StatCard
              label="Projected Bookings"
              value={Math.round(
                proForma.forecast.reduce(
                  (sum, row) => sum + row.projectedBookings,
                  0,
                ),
              ).toLocaleString()}
              detail={`${percent(
                assumptions.monthlyGrowthRate,
              )} monthly growth assumption.`}
              tone="amber"
            />
          </div>
        </section>

        <ForecastReadinessPanel items={proForma.readinessItems} />

        <IntegrationFlowPanel />

        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Forecast Assumptions
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Update SitGuru forecast inputs.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Change these assumptions and the forecast will update after
              saving. These assumptions are planning estimates and should be
              reviewed against actual P&L, Balance Sheet, Cash Flow, Stripe, and
              Navy Federal banking activity.
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
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Forecast Visuals
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Revenue, expenses, net income, and cash.
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

            <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                Scenario Summary
              </p>
              <h3 className="mt-3 text-3xl font-black text-slate-950">
                {assumptions.scenarioName}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                This scenario assumes{" "}
                {assumptions.monthlyBookings.toLocaleString()} starting monthly
                bookings at {moneyExact(assumptions.averageBookingValue)} average
                booking value, with {percent(assumptions.monthlyGrowthRate)}{" "}
                monthly growth and {percent(assumptions.platformFeeRate)}{" "}
                SitGuru platform fee revenue.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-blue-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Break-even Month
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {proForma.totals.breakEvenMonth
                      ? `Month ${proForma.totals.breakEvenMonth}`
                      : "Not reached"}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Ending Cash
                  </p>
                  <p
                    className={`mt-2 text-2xl font-black ${
                      proForma.totals.endingCash >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {money(proForma.totals.endingCash)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Planning Links
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ActionLink href="/admin/financials/profit-loss" label="Compare P&L" />
                <ActionLink href="/admin/financials/cash-flow" label="Compare Cash Flow" />
                <ActionLink href="/admin/financials/balance-sheet" label="Compare Balance Sheet" />
                <ActionLink href="/admin/financials/exports" label="Open Export Center" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Forecast Table
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Monthly pro forma projection.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Projected performance based on the current saved assumptions.
              </p>
            </div>

            <ActionLink href="/admin/financials/cash-flow" label="Compare Cash Flow" />
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Month
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Bookings
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Gross Volume
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Refunds
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Expenses
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Net Income
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                      Ending Cash
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {proForma.forecast.map((row) => (
                    <tr key={row.monthNumber} className="transition hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-slate-950">
                        {row.label}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {Math.round(row.projectedBookings).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-950">
                        {money(row.grossBookingVolume)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-700">
                        {money(row.platformRevenue)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-rose-700">
                        {money(row.refunds)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-amber-700">
                        {money(row.operatingExpenses)}
                      </td>
                      <td
                        className={`px-4 py-4 font-semibold ${
                          row.netIncome >= 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {money(row.netIncome)}
                      </td>
                      <td
                        className={`px-4 py-4 font-semibold ${
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
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Gross Booking Volume
            </p>
            <p className="mt-3 text-4xl font-black text-slate-950">
              {money(proForma.totals.totalGrossBookingVolume)}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Total projected customer booking volume.
            </p>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Guru Payouts
            </p>
            <p className="mt-3 text-4xl font-black text-slate-950">
              {money(proForma.totals.totalGuruPayouts)}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Projected amount paid to Gurus.
            </p>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
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
