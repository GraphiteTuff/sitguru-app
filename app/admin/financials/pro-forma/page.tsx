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
  label: string
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
    forecastMonths: Math.max(1, Math.min(36, Math.round(toNumber(row.forecast_months) || 12))),
  };
}

async function saveProFormaAssumptions(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "").trim();

  const payload = {
    scenario_name: String(formData.get("scenarioName") || "Base Case").trim() || "Base Case",
    monthly_bookings: Number(formData.get("monthlyBookings") || 0),
    average_booking_value: Number(formData.get("averageBookingValue") || 0),
    platform_fee_rate: Number(formData.get("platformFeeRate") || 0),
    guru_payout_rate: Number(formData.get("guruPayoutRate") || 0),
    refund_rate: Number(formData.get("refundRate") || 0),
    monthly_marketing_spend: Number(formData.get("monthlyMarketingSpend") || 0),
    monthly_software_spend: Number(formData.get("monthlySoftwareSpend") || 0),
    monthly_admin_spend: Number(formData.get("monthlyAdminSpend") || 0),
    monthly_insurance_spend: Number(formData.get("monthlyInsuranceSpend") || 0),
    monthly_legal_spend: Number(formData.get("monthlyLegalSpend") || 0),
    other_monthly_expenses: Number(formData.get("otherMonthlyExpenses") || 0),
    beginning_cash: Number(formData.get("beginningCash") || 0),
    owner_contribution: Number(formData.get("ownerContribution") || 0),
    loan_proceeds: Number(formData.get("loanProceeds") || 0),
    loan_repayments: Number(formData.get("loanRepayments") || 0),
    monthly_growth_rate: Number(formData.get("monthlyGrowthRate") || 0),
    forecast_months: Math.max(
      1,
      Math.min(36, Math.round(Number(formData.get("forecastMonths") || 12)))
    ),
    is_active: true,
  };

  if (id) {
    await supabaseAdmin.from("proforma_assumptions").update(payload).eq("id", id);
  } else {
    await supabaseAdmin.from("proforma_assumptions").insert(payload);
  }

  revalidatePath("/admin/financials/pro-forma");
}

function buildForecast(assumptions: Assumptions): ForecastMonth[] {
  const forecastMonths = Math.max(1, Math.min(36, assumptions.forecastMonths || 12));
  const growthRate = assumptions.monthlyGrowthRate / 100;

  let runningCash =
    assumptions.beginningCash +
    assumptions.ownerContribution +
    assumptions.loanProceeds;

  return Array.from({ length: forecastMonths }, (_, index) => {
    const monthNumber = index + 1;
    const growthMultiplier = Math.pow(1 + growthRate, index);
    const projectedBookings = assumptions.monthlyBookings * growthMultiplier;
    const grossBookingVolume = projectedBookings * assumptions.averageBookingValue;

    const platformRevenue = grossBookingVolume * (assumptions.platformFeeRate / 100);
    const guruPayouts = grossBookingVolume * (assumptions.guruPayoutRate / 100);
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
        ? assumptions.ownerContribution + assumptions.loanProceeds - assumptions.loanRepayments
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
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-emerald-300/30 hover:bg-white/10"
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
    emerald: "border-emerald-400/20 bg-emerald-400/10",
    sky: "border-sky-400/20 bg-sky-400/10",
    violet: "border-violet-400/20 bg-violet-400/10",
    amber: "border-amber-400/20 bg-amber-400/10",
    rose: "border-rose-400/20 bg-rose-400/10",
  }[tone];

  return (
    <div className={`rounded-3xl border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
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
        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50"
      />
    </div>
  );
}

async function getProFormaData() {
  const rows = await safeRows<ProFormaRow>(
    supabaseAdmin
      .from("proforma_assumptions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1),
    "proforma_assumptions"
  );

  const assumptions = rowToAssumptions(rows[0]);
  const forecast = buildForecast(assumptions);

  const totalGrossBookingVolume = forecast.reduce(
    (sum, row) => sum + row.grossBookingVolume,
    0
  );

  const totalPlatformRevenue = forecast.reduce(
    (sum, row) => sum + row.platformRevenue,
    0
  );

  const totalGuruPayouts = forecast.reduce(
    (sum, row) => sum + row.guruPayouts,
    0
  );

  const totalRefunds = forecast.reduce((sum, row) => sum + row.refunds, 0);

  const totalOperatingExpenses = forecast.reduce(
    (sum, row) => sum + row.operatingExpenses,
    0
  );

  const totalNetIncome = forecast.reduce((sum, row) => sum + row.netIncome, 0);

  const endingCash = forecast[forecast.length - 1]?.endingCash || assumptions.beginningCash;
  const breakEvenMonth = forecast.find((row) => row.netIncome >= 0)?.monthNumber || null;

  const maxVisualValue = Math.max(
    totalPlatformRevenue,
    totalOperatingExpenses,
    Math.abs(totalNetIncome),
    Math.abs(endingCash),
    1
  );

  return {
    assumptions,
    forecast,
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
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const proForma = await getProFormaData();
  const { assumptions } = proForma;

  const visualRows = [
    {
      label: "Projected Platform Revenue",
      value: proForma.totals.totalPlatformRevenue,
      tone: "bg-emerald-400",
    },
    {
      label: "Projected Operating Expenses",
      value: proForma.totals.totalOperatingExpenses,
      tone: "bg-amber-400",
    },
    {
      label: proForma.totals.totalNetIncome >= 0 ? "Projected Net Income" : "Projected Net Loss",
      value: Math.abs(proForma.totals.totalNetIncome),
      tone: proForma.totals.totalNetIncome >= 0 ? "bg-violet-400" : "bg-rose-400",
    },
    {
      label: "Projected Ending Cash",
      value: Math.abs(proForma.totals.endingCash),
      tone: proForma.totals.endingCash >= 0 ? "bg-sky-400" : "bg-rose-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Admin / Financials / Pro Forma
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                SitGuru Pro Forma Forecast.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Forecast future revenue, Guru payouts, refunds, expenses, net
                income, cash flow, and ending cash based on planning assumptions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/financials" label="Financials" />
              <ActionLink href="/admin/financials/profit-loss" label="P&L" />
              <ActionLink href="/admin/financials/cash-flow" label="Cash Flow" />
              <ActionLink href="/admin/financials/balance-sheet" label="Balance Sheet" primary />
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
                proForma.forecast.reduce((sum, row) => sum + row.projectedBookings, 0)
              ).toLocaleString()}
              detail={`${percent(assumptions.monthlyGrowthRate)} monthly growth assumption.`}
              tone="amber"
            />
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Forecast Assumptions
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Update SitGuru forecast inputs.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Change these assumptions and the 12-month forecast will update
              after saving.
            </p>

            <form action={saveProFormaAssumptions} className="mt-6 grid gap-4">
              <input type="hidden" name="id" value={assumptions.id} />

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Scenario Name
                </label>
                <input
                  name="scenarioName"
                  type="text"
                  defaultValue={assumptions.scenarioName}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="grid gap-4 sm:grid-cols-2">
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

              <button
                type="submit"
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
              >
                Save Forecast Assumptions
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Forecast Visuals
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Revenue, expenses, net income, and cash.
              </h2>

              <div className="mt-6 space-y-5">
                {visualRows.map((row) => (
                  <div key={row.label}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-white">{row.label}</p>
                      <p className="text-sm font-bold text-white">
                        {money(row.value)}
                      </p>
                    </div>

                    <div className="h-3 rounded-full bg-white/10">
                      <div
                        className={`h-3 rounded-full ${row.tone}`}
                        style={{
                          width: `${getBarWidth(
                            row.value,
                            proForma.totals.maxVisualValue
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-sky-400/20 bg-sky-400/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                Scenario Summary
              </p>
              <h3 className="mt-3 text-3xl font-black text-white">
                {assumptions.scenarioName}
              </h3>
              <p className="mt-3 text-sm leading-7 text-sky-50/90">
                This scenario assumes {assumptions.monthlyBookings.toLocaleString()} starting
                monthly bookings at {moneyExact(assumptions.averageBookingValue)} average booking
                value, with {percent(assumptions.monthlyGrowthRate)} monthly growth and{" "}
                {percent(assumptions.platformFeeRate)} SitGuru platform fee revenue.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                12-Month Forecast
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Monthly pro forma projection.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Projected performance based on your current assumptions.
              </p>
            </div>

            <ActionLink href="/admin/financials/cash-flow" label="Compare Cash Flow" />
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400">
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

                <tbody className="divide-y divide-white/10 bg-slate-950/40">
                  {proForma.forecast.map((row) => (
                    <tr key={row.monthNumber} className="transition hover:bg-white/5">
                      <td className="px-4 py-4 font-semibold text-white">
                        {row.label}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {Math.round(row.projectedBookings).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 font-semibold text-white">
                        {money(row.grossBookingVolume)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-200">
                        {money(row.platformRevenue)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-rose-200">
                        {money(row.refunds)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-amber-200">
                        {money(row.operatingExpenses)}
                      </td>
                      <td
                        className={`px-4 py-4 font-semibold ${
                          row.netIncome >= 0 ? "text-emerald-200" : "text-rose-200"
                        }`}
                      >
                        {money(row.netIncome)}
                      </td>
                      <td
                        className={`px-4 py-4 font-semibold ${
                          row.endingCash >= 0 ? "text-white" : "text-rose-200"
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

        <section className="grid gap-8 xl:grid-cols-3">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Gross Booking Volume
            </p>
            <p className="mt-3 text-4xl font-black text-white">
              {money(proForma.totals.totalGrossBookingVolume)}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Total projected customer booking volume.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Guru Payouts
            </p>
            <p className="mt-3 text-4xl font-black text-white">
              {money(proForma.totals.totalGuruPayouts)}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Projected amount paid to Gurus.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Refund Exposure
            </p>
            <p className="mt-3 text-4xl font-black text-white">
              {money(proForma.totals.totalRefunds)}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Projected refunds based on refund rate.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}