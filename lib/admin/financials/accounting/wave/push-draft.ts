import type { SitGuruLedgerAccountKey } from "../types";

export type WavePushDirection = "DEPOSIT" | "WITHDRAWAL";

export type WavePushItem = {
  key: string;
  externalId: string;
  description: string;
  amount: number;
  direction: WavePushDirection;
  ledgerKey: SitGuruLedgerAccountKey;
  anchorKey: "stripe_clearing";
};

function money(value: number) {
  return Number((Number.isFinite(value) ? value : 0).toFixed(2));
}

export function buildWavePushItems(input: {
  taxYear: number;
  asOf: string;
  fees: number;
  tax: number;
  payouts: number;
  expenses: number;
  refunds: number;
}): WavePushItem[] {
  const year = input.taxYear;
  const asOf = input.asOf.slice(0, 10);
  const items: WavePushItem[] = [];

  function add(
    key: string,
    amount: number,
    direction: WavePushDirection,
    ledgerKey: SitGuruLedgerAccountKey,
    description: string,
  ) {
    const next = money(amount);
    if (next <= 0) return;
    items.push({
      key,
      externalId: `sitguru:ytd:${year}:${key}`,
      description: `${description} · ${year} YTD through ${asOf}`,
      amount: next,
      direction,
      ledgerKey,
      anchorKey: "stripe_clearing",
    });
  }

  add(
    "platform-fees",
    input.fees,
    "DEPOSIT",
    "service_revenue",
    "SitGuru platform / marketplace fees",
  );
  add(
    "sales-tax",
    input.tax,
    "DEPOSIT",
    "sales_tax_payable",
    "Sales tax collected (payable by SitGuru)",
  );
  add(
    "guru-payouts",
    input.payouts,
    "WITHDRAWAL",
    "guru_payouts",
    "Guru and partner payouts",
  );
  add(
    "operating-expenses",
    input.expenses,
    "WITHDRAWAL",
    "operating_expenses",
    "Operating and growth expenses",
  );
  add("refunds", input.refunds, "WITHDRAWAL", "refunds", "Refunds and disputes");
  return items;
}

export function wavePushItemBalance(item: WavePushItem) {
  return "INCREASE";
}
