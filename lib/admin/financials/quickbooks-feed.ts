import { SITGURU_DBA, SITGURU_LEGAL_ENTITY } from "@/lib/admin/financials/tax-filing-calendar";
import {
  loadTaxCenterBundle,
  type TaxCenterBundle,
} from "@/lib/admin/financials/tax-center";
import { MARKETPLACE_SALES_TAX_STATES } from "@/lib/admin/financials/marketplace-sales-tax-states";

export type QuickBooksJournalLine = {
  account: string;
  debit: number;
  credit: number;
  memo: string;
  name: string;
  location: string;
};

export type QuickBooksFeed = {
  company: string;
  dba: string;
  periodLabel: string;
  journalNo: string;
  journalDate: string;
  generatedAt: string;
  lines: QuickBooksJournalLine[];
  mapping: { sitguru: string; quickbooks: string; treatment: string }[];
};

const BANK = "Bank: Navy Federal Business Checking/Savings";
const REVENUE = "Sales of Product Income: Service Revenue";
const TAX_PAYABLE = "Other Current Liabilities: Sales Tax Payable";
const GURU_COGS = "Cost of Goods Sold: Contractor Payments";
const MARKETING = "Expenses: Advertising and Marketing";
const OTHER_EXPENSE = "Expenses: Other Business Expenses";
const REWARD_LIABILITY = "Other Current Liabilities: Referral Rewards Payable";

function money(value: number) {
  return Number((Number.isFinite(value) ? value : 0).toFixed(2));
}

function addLine(
  lines: QuickBooksJournalLine[],
  account: string,
  debit: number,
  credit: number,
  memo: string,
  location = "",
) {
  const nextDebit = money(debit);
  const nextCredit = money(credit);
  if (nextDebit <= 0 && nextCredit <= 0) return;
  lines.push({
    account,
    debit: nextDebit,
    credit: nextCredit,
    memo,
    name: SITGURU_DBA,
    location,
  });
}

export function buildQuickBooksFeed(bundle: TaxCenterBundle): QuickBooksFeed {
  const journalDate = new Date().toLocaleDateString("en-US");
  const journalNo = `SG-TAX-${new Date().toISOString().slice(0, 10)}`;
  const lines: QuickBooksJournalLine[] = [];
  const totals = bundle.totals;

  addLine(
    lines,
    BANK,
    totals.fees,
    0,
    "SitGuru platform fee cash in",
  );
  addLine(
    lines,
    REVENUE,
    0,
    totals.fees,
    "SitGuru platform fee revenue",
  );

  addLine(
    lines,
    BANK,
    totals.tax,
    0,
    "Sales tax collected from pet parents",
  );
  addLine(
    lines,
    TAX_PAYABLE,
    0,
    totals.tax,
    `Sales tax payable · ${MARKETPLACE_SALES_TAX_STATES.map((item) => item.state).join(", ")}`,
  );

  addLine(
    lines,
    GURU_COGS,
    totals.payoutTotal + totals.commissionTotal,
    0,
    "Guru and partner payouts · 1099 support, tax excluded",
  );
  addLine(
    lines,
    BANK,
    0,
    totals.payoutTotal + totals.commissionTotal,
    "Cash out to Gurus and partners",
  );

  addLine(
    lines,
    OTHER_EXPENSE,
    totals.expenseTotal,
    0,
    "Operating and growth expenses from SitGuru ledgers",
  );
  addLine(
    lines,
    BANK,
    0,
    totals.expenseTotal,
    "Expense cash out / accrual support",
  );

  addLine(
    lines,
    MARKETING,
    totals.issuedRewards,
    0,
    "Issued referral / PawPerks rewards",
  );
  addLine(
    lines,
    BANK,
    0,
    totals.issuedRewards,
    "Issued reward cash or credit",
  );

  addLine(
    lines,
    MARKETING,
    totals.pendingRewards,
    0,
    "Pending referral reward expense",
  );
  addLine(
    lines,
    REWARD_LIABILITY,
    0,
    totals.pendingRewards,
    "Pending referral reward liability",
  );

  return {
    company: SITGURU_LEGAL_ENTITY,
    dba: SITGURU_DBA,
    periodLabel: "Tax year 2026 · Jun 1–Dec 31",
    journalNo,
    journalDate,
    generatedAt: new Date().toISOString(),
    lines,
    mapping: [
      {
        sitguru: "Platform / marketplace fees",
        quickbooks: REVENUE,
        treatment: "Income",
      },
      {
        sitguru: "Sales tax collected",
        quickbooks: TAX_PAYABLE,
        treatment: "Liability · remitted by SitGuru, not Guru income",
      },
      {
        sitguru: "Guru / partner payouts",
        quickbooks: GURU_COGS,
        treatment: "1099-NEC review. Tips pass through.",
      },
      {
        sitguru: "expense_ledger + growth",
        quickbooks: OTHER_EXPENSE,
        treatment: "Deduction support",
      },
      {
        sitguru: "NFCU business cash",
        quickbooks: BANK,
        treatment: "Bank feed / clearing",
      },
      {
        sitguru: "Referral rewards",
        quickbooks: `${MARKETING} / ${REWARD_LIABILITY}`,
        treatment: "Expense when issued, liability when pending",
      },
    ],
  };
}

export async function loadQuickBooksFeed() {
  const bundle = await loadTaxCenterBundle();
  return { bundle, feed: buildQuickBooksFeed(bundle) };
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function buildQuickBooksOnlineCsv(feed: QuickBooksFeed) {
  const header = [
    "JournalNo",
    "JournalDate",
    "Account",
    "Debits",
    "Credits",
    "Description",
    "Name",
    "Location",
    "Class",
    "Currency",
  ];
  const rows = feed.lines.map((line) =>
    [
      feed.journalNo,
      feed.journalDate,
      line.account,
      line.debit ? line.debit.toFixed(2) : "",
      line.credit ? line.credit.toFixed(2) : "",
      line.memo,
      line.name,
      line.location,
      "Tax Center",
      "USD",
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function buildQuickBooksIif(feed: QuickBooksFeed) {
  const header = [
    "!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO",
    "!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO",
    "!ENDTRNS",
  ];
  const [first, ...rest] = feed.lines;
  if (!first) {
    return header.join("\n");
  }
  const firstAmount = first.debit > 0 ? first.debit : -first.credit;
  const body = [
    [
      "TRNS",
      "",
      "GENERAL JOURNAL",
      feed.journalDate,
      first.account,
      first.name,
      "Tax Center",
      firstAmount.toFixed(2),
      feed.journalNo,
      first.memo,
    ].join("\t"),
    ...rest.map((line) => {
      const amount = line.debit > 0 ? line.debit : -line.credit;
      return [
        "SPL",
        "",
        "GENERAL JOURNAL",
        feed.journalDate,
        line.account,
        line.name,
        "Tax Center",
        amount.toFixed(2),
        feed.journalNo,
        line.memo,
      ].join("\t");
    }),
    "ENDTRNS",
  ];
  return [...header, ...body].join("\n");
}

export function buildQuickBooksMappingCsv(feed: QuickBooksFeed) {
  const header = ["SitGuru source", "QuickBooks account", "Tax treatment"];
  return [
    header.join(","),
    ...feed.mapping.map((row) =>
      [row.sitguru, row.quickbooks, row.treatment].map(csvEscape).join(","),
    ),
  ].join("\n");
}
