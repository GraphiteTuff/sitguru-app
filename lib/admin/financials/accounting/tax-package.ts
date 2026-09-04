import { loadTaxCenterBundle, taxMoney } from "@/lib/admin/financials/tax-center";
import { loadTaxEntityProfile, type TaxEntityProfile } from "./tax-entity";

export type TaxPackageSummary = {
  taxYear: number;
  generatedAt: string;
  entity: TaxEntityProfile;
  disclaimer: string;
  income: { label: string; amount: number }[];
  expenses: { label: string; amount: number }[];
  guruPayouts: { label: string; amount: number };
  tips: { label: string; amount: number };
  salesTaxCollected: { label: string; amount: number };
  refunds: { label: string; amount: number };
  processingFees: { label: string; amount: number };
};

export async function buildTaxPackage(taxYear = new Date().getFullYear()) {
  const [bundle, entity] = await Promise.all([
    loadTaxCenterBundle(),
    loadTaxEntityProfile(),
  ]);

  const packageData: TaxPackageSummary = {
    taxYear,
    generatedAt: new Date().toISOString(),
    entity: { ...entity, taxYear },
    disclaimer:
      "This SitGuru Tax Package is bookkeeping support for a CPA, Enrolled Agent, or Block Advisors. It is not an IRS return and does not file taxes.",
    income: [
      { label: "Gross booking volume", amount: bundle.totals.gross },
      { label: "Marketplace receipts kept by SitGuru", amount: bundle.totals.fees },
    ],
    expenses: bundle.deductionCategories.map((row) => ({
      label: row.category,
      amount: row.amount,
    })),
    guruPayouts: {
      label: "Guru payouts",
      amount: bundle.totals.payoutTotal,
    },
    tips: {
      label: "Tips (Guru money, not SitGuru revenue)",
      amount: bundle.totals.tipsExcluded,
    },
    salesTaxCollected: {
      label: "Sales tax collected (SitGuru remits)",
      amount: bundle.totals.tax,
    },
    refunds: { label: "Refunds", amount: bundle.totals.refunds },
    processingFees: {
      label: "Processor / payout support",
      amount: bundle.totals.stripePayoutTotal,
    },
  };

  return { bundle, packageData };
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function taxPackageToCsv(summary: TaxPackageSummary) {
  const lines = [
    ["SitGuru Tax Package", String(summary.taxYear)],
    ["Legal entity", summary.entity.legalEntity],
    ["DBA", summary.entity.dba],
    ["Tax classification", summary.entity.taxClassification],
    ["Generated", summary.generatedAt],
    ["Disclaimer", summary.disclaimer],
    [],
    ["Owners"],
    ...summary.entity.owners.map((owner) => [
      owner.name,
      `${owner.percent}%`,
    ]),
    [],
    ["Section", "Line", "Amount"],
    ...summary.income.map((row) => ["Income", row.label, taxMoney(row.amount)]),
    ["Payouts", summary.guruPayouts.label, taxMoney(summary.guruPayouts.amount)],
    ["Tips", summary.tips.label, taxMoney(summary.tips.amount)],
    [
      "Sales tax",
      summary.salesTaxCollected.label,
      taxMoney(summary.salesTaxCollected.amount),
    ],
    ["Refunds", summary.refunds.label, taxMoney(summary.refunds.amount)],
    [
      "Processors",
      summary.processingFees.label,
      taxMoney(summary.processingFees.amount),
    ],
    ...summary.expenses.map((row) => [
      "Expenses",
      row.label,
      taxMoney(row.amount),
    ]),
  ];

  return lines
    .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
    .join("\n");
}
