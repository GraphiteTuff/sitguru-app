import type { AccountingAccount, SitGuruLedgerAccountKey } from "./types";
import { SITGURU_LEDGER_ACCOUNTS } from "./types";

type MappingHint = {
  key: SitGuruLedgerAccountKey;
  names: string[];
  types: string[];
  subtypes: string[];
};

const HINTS: MappingHint[] = [
  {
    key: "service_revenue",
    names: ["sales", "service", "income", "revenue"],
    types: ["INCOME"],
    subtypes: ["INCOME", "OTHER_INCOME"],
  },
  {
    key: "sales_tax_payable",
    names: ["sales tax", "tax payable"],
    types: ["LIABILITY"],
    subtypes: ["SALES_TAX", "CURRENT_LIABILITY"],
  },
  {
    key: "guru_payouts",
    names: ["contractor", "payout", "guru", "cost of goods"],
    types: ["EXPENSE"],
    subtypes: ["COST_OF_GOODS_SOLD", "EXPENSE"],
  },
  {
    key: "tips_payable",
    names: ["tip", "gratuity"],
    types: ["LIABILITY"],
    subtypes: ["CURRENT_LIABILITY"],
  },
  {
    key: "stripe_clearing",
    names: ["stripe"],
    types: ["ASSET"],
    subtypes: ["BANK", "PAYMENT_CLEARING"],
  },
  {
    key: "paypal_clearing",
    names: ["paypal"],
    types: ["ASSET"],
    subtypes: ["BANK", "PAYMENT_CLEARING"],
  },
  {
    key: "processing_fees",
    names: ["processing", "stripe fee", "merchant"],
    types: ["EXPENSE"],
    subtypes: ["PAYMENT_PROCESSING_FEES", "EXPENSE"],
  },
  {
    key: "refunds",
    names: ["refund", "returns", "discounts"],
    types: ["INCOME"],
    subtypes: ["DISCOUNTS", "OTHER_INCOME"],
  },
  {
    key: "operating_expenses",
    names: ["operating", "office", "software", "advertising"],
    types: ["EXPENSE"],
    subtypes: ["EXPENSE"],
  },
];

function scoreAccount(hint: MappingHint, account: AccountingAccount) {
  if (account.archived) return -1;
  const haystack = `${account.name} ${account.type} ${account.subtype}`.toLowerCase();
  let score = 0;
  if (hint.types.includes(account.type.toUpperCase())) score += 4;
  if (hint.subtypes.includes(account.subtype.toUpperCase())) score += 6;
  if (hint.names.some((name) => haystack.includes(name))) score += 5;
  return score;
}

export function suggestAccountMappings(accounts: AccountingAccount[]) {
  const used = new Set<string>();
  return SITGURU_LEDGER_ACCOUNTS.map((ledger) => {
    const hint = HINTS.find((row) => row.key === ledger.key)!;
    const ranked = [...accounts]
      .map((account) => ({ account, score: scoreAccount(hint, account) }))
      .filter((row) => row.score > 0 && !used.has(row.account.id))
      .sort((a, b) => b.score - a.score);
    const winner = ranked[0]?.account;
    if (winner) used.add(winner.id);
    return {
      sitguruAccountKey: ledger.key,
      sitguruAccountName: ledger.name,
      providerAccountId: winner?.id || "",
      providerAccountName: winner?.name || "",
      providerAccountType: winner?.type || "",
      mappingSource: "suggested" as const,
    };
  });
}
