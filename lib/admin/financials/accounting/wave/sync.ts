import { loadTaxCenterBundle } from "@/lib/admin/financials/tax-center";
import { type AccountingAccount, type AccountingAccountMapping, type SitGuruLedgerAccountKey } from "../types";
import { suggestAccountMappings } from "../mapping";
import { hasWaveWriteScope } from "./config";
import {
  WAVE_ACCOUNT_CREATE_MUTATION,
  WAVE_MONEY_TRANSACTION_CREATE_MUTATION,
  WaveGraphQLError,
  waveGraphql,
} from "./graphql";
import {
  loadAccountMappings,
  loadSyncedExternalIds,
  recordWaveSync,
  saveAccountMappings,
} from "./mapping-store";
import { listWaveAccounts, listWaveBusinesses, withFreshTokens } from "./provider";
import { buildWavePushItems, type WavePushItem } from "./push-draft";
import { markAccountingSync } from "../connections";

const CREATE_SPECS: Record<
  SitGuruLedgerAccountKey,
  Array<{ type: string; subtype: string }>
> = {
  service_revenue: [{ type: "INCOME", subtype: "INCOME" }],
  sales_tax_payable: [
    { type: "LIABILITY", subtype: "SALES_TAX" },
    { type: "LIABILITY", subtype: "CURRENT_LIABILITY" },
  ],
  guru_payouts: [
    { type: "EXPENSE", subtype: "COST_OF_GOODS_SOLD" },
    { type: "EXPENSE", subtype: "EXPENSE" },
  ],
  tips_payable: [{ type: "LIABILITY", subtype: "CURRENT_LIABILITY" }],
  stripe_clearing: [
    { type: "ASSET", subtype: "OTHER_CURRENT_ASSETS" },
    { type: "ASSET", subtype: "CASH_AND_BANK" },
  ],
  paypal_clearing: [
    { type: "ASSET", subtype: "OTHER_CURRENT_ASSETS" },
    { type: "ASSET", subtype: "CASH_AND_BANK" },
  ],
  processing_fees: [
    { type: "EXPENSE", subtype: "PAYMENT_PROCESSING_FEES" },
    { type: "EXPENSE", subtype: "OPERATING_EXPENSES" },
    { type: "EXPENSE", subtype: "EXPENSE" },
  ],
  refunds: [
    { type: "INCOME", subtype: "DISCOUNTS" },
    { type: "EXPENSE", subtype: "EXPENSE" },
  ],
  operating_expenses: [
    { type: "EXPENSE", subtype: "OPERATING_EXPENSES" },
    { type: "EXPENSE", subtype: "EXPENSE" },
  ],
};

type AccountCreatePayload = {
  accountCreate?: {
    didSucceed?: boolean;
    inputErrors?: Array<{ message?: string; code?: string }>;
    account?: { id?: string; name?: string; type?: { value?: string }; subtype?: { value?: string } };
  };
};

type MoneyCreatePayload = {
  moneyTransactionCreate?: {
    didSucceed?: boolean;
    inputErrors?: Array<{ message?: string; code?: string }>;
    transaction?: { id?: string };
  };
};

function mappingByKey(rows: AccountingAccountMapping[]) {
  return new Map(rows.map((row) => [row.sitguruAccountKey, row]));
}

function mergeMappings(
  suggested: AccountingAccountMapping[],
  saved: AccountingAccountMapping[],
  accounts: AccountingAccount[],
) {
  const liveIds = new Set(accounts.map((row) => row.id));
  const savedMap = mappingByKey(saved);
  return suggested.map((row) => {
    const previous = savedMap.get(row.sitguruAccountKey);
    if (previous?.providerAccountId && liveIds.has(previous.providerAccountId)) {
      return previous;
    }
    return row;
  });
}

async function createWaveAccount(
  accessToken: string,
  businessId: string,
  mapping: AccountingAccountMapping,
) {
  const specs = CREATE_SPECS[mapping.sitguruAccountKey] || [];
  let lastError = "Could not create Wave account.";
  for (const spec of specs) {
    try {
      const data = await waveGraphql<AccountCreatePayload>(
        accessToken,
        WAVE_ACCOUNT_CREATE_MUTATION,
        {
          input: {
            businessId,
            name: mapping.sitguruAccountName,
            description: "Created by SitGuru Tax Center sync",
            type: spec.type,
            subtype: spec.subtype,
          },
        },
      );
      const created = data.accountCreate;
      if (created?.didSucceed && created.account?.id) {
        return {
          ...mapping,
          providerAccountId: created.account.id,
          providerAccountName: created.account.name || mapping.sitguruAccountName,
          providerAccountType: created.account.type?.value || spec.type,
          mappingSource: "suggested" as const,
        };
      }
      lastError = created?.inputErrors?.[0]?.message || lastError;
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
    }
  }
  throw new Error(`${mapping.sitguruAccountName}: ${lastError}`);
}

async function ensureWaveMappings(
  accessToken: string,
  businessId: string,
) {
  const accounts = await listWaveAccounts(accessToken, businessId);
  const suggested = suggestAccountMappings(accounts);
  const saved = await loadAccountMappings("wave");
  const merged = mergeMappings(suggested, saved, accounts);
  const needed = new Set<SitGuruLedgerAccountKey>([
    "stripe_clearing",
    "service_revenue",
    "sales_tax_payable",
    "guru_payouts",
    "operating_expenses",
    "refunds",
  ]);
  const next: AccountingAccountMapping[] = [];
  for (const row of merged) {
    if (row.providerAccountId) {
      next.push(row);
      continue;
    }
    if (!needed.has(row.sitguruAccountKey)) {
      next.push(row);
      continue;
    }
    next.push(await createWaveAccount(accessToken, businessId, row));
  }
  await saveAccountMappings(next);
  return mappingByKey(next);
}

function alreadyExists(message: string) {
  const text = message.toLowerCase();
  return (
    text.includes("already") ||
    text.includes("duplicate") ||
    text.includes("external id") ||
    text.includes("externalid")
  );
}

async function pushItem(
  accessToken: string,
  businessId: string,
  item: WavePushItem,
  mappings: Map<SitGuruLedgerAccountKey, AccountingAccountMapping>,
) {
  const anchor = mappings.get(item.anchorKey);
  const category = mappings.get(item.ledgerKey);
  if (!anchor?.providerAccountId || !category?.providerAccountId) {
    throw new Error(`Wave account mapping missing for ${item.ledgerKey}.`);
  }

  try {
    const data = await waveGraphql<MoneyCreatePayload>(
      accessToken,
      WAVE_MONEY_TRANSACTION_CREATE_MUTATION,
      {
        input: {
          businessId,
          externalId: item.externalId,
          date: new Date().toISOString().slice(0, 10),
          description: item.description,
          notes: "Posted from SitGuru Tax Center. Anchored to Stripe Clearing so Navy Federal bank feed is not double-counted as sales.",
          anchor: {
            accountId: anchor.providerAccountId,
            amount: item.amount,
            direction: item.direction,
          },
          lineItems: [
            {
              accountId: category.providerAccountId,
              amount: item.amount,
              balance: "INCREASE",
            },
          ],
        },
      },
    );
    const created = data.moneyTransactionCreate;
    const errorMessage = created?.inputErrors?.[0]?.message || "";
    if (created?.didSucceed && created.transaction?.id) {
      await recordWaveSync({ externalId: item.externalId, status: "ok" });
      return { ...item, waveId: created.transaction.id, status: "posted" as const };
    }
    if (alreadyExists(errorMessage)) {
      await recordWaveSync({ externalId: item.externalId, status: "ok" });
      return { ...item, waveId: "", status: "already_synced" as const };
    }
    throw new Error(errorMessage || "Wave did not accept the transaction.");
  } catch (error) {
    const message = error instanceof WaveGraphQLError || error instanceof Error ? error.message : "Wave push failed.";
    if (alreadyExists(message)) {
      await recordWaveSync({ externalId: item.externalId, status: "ok" });
      return { ...item, waveId: "", status: "already_synced" as const };
    }
    await recordWaveSync({ externalId: item.externalId, status: "error", error: message });
    throw new Error(message);
  }
}

export async function syncSitGuruBooksToWave() {
  const { connection, accessToken } = await withFreshTokens();
  if (!connection.providerBusinessId) {
    throw new Error("Choose a Wave business before syncing.");
  }
  if (!hasWaveWriteScope(connection.scopes)) {
    const error = new Error(
      "Reconnect Wave so Tax Center can post books. The current connection is read-only.",
    );
    (error as Error & { code?: string }).code = "WAVE_RECONNECT_REQUIRED";
    throw error;
  }

  const businesses = await listWaveBusinesses(accessToken);
  const selected = businesses.find((row) => row.id === connection.providerBusinessId);
  if (selected?.isClassicAccounting) {
    throw new Error(
      "This Wave business is on classic accounting. Switch it to Wave’s current accounting to post Tax Center books.",
    );
  }

  await markAccountingSync({ provider: "wave", status: "syncing" });

  const bundle = await loadTaxCenterBundle();
  const asOf = new Date().toISOString().slice(0, 10);
  const taxYear = new Date().getFullYear();
  const items = buildWavePushItems({
    taxYear,
    asOf,
    fees: bundle.totals.fees,
    tax: bundle.totals.tax,
    payouts: bundle.totals.payoutTotal + bundle.totals.commissionTotal,
    expenses: bundle.totals.expenseTotal,
    refunds: bundle.totals.refunds,
  });

  const mappings = await ensureWaveMappings(accessToken, connection.providerBusinessId);
  const already = await loadSyncedExternalIds();
  const posted: Array<WavePushItem & { waveId: string; status: "posted" | "already_synced" | "skipped" }> = [];

  for (const item of items) {
    if (already.has(item.externalId)) {
      posted.push({ ...item, waveId: "", status: "already_synced" });
      continue;
    }
    posted.push(await pushItem(accessToken, connection.providerBusinessId, item, mappings));
  }

  if (!items.length) {
    posted.push({
      key: "empty",
      externalId: `sitguru:ytd:${taxYear}:empty`,
      description: `No SitGuru marketplace amounts to post for ${taxYear} through ${asOf}.`,
      amount: 0,
      direction: "DEPOSIT",
      ledgerKey: "service_revenue",
      anchorKey: "stripe_clearing",
      waveId: "",
      status: "skipped",
    });
  }

  await markAccountingSync({ provider: "wave", status: "up_to_date" });

  const postedCount = posted.filter((row) => row.status === "posted").length;
  const skippedCount = posted.filter((row) => row.status !== "posted").length;
  const postedTotal = posted
    .filter((row) => row.status === "posted")
    .reduce((sum, row) => sum + row.amount, 0);

  return {
    ok: true,
    readonly: false,
    asOf,
    taxYear,
    sitguru: {
      fees: bundle.totals.fees,
      tax: bundle.totals.tax,
      payouts: bundle.totals.payoutTotal + bundle.totals.commissionTotal,
      expenses: bundle.totals.expenseTotal,
      refunds: bundle.totals.refunds,
      gross: bundle.totals.gross,
      liveCash: bundle.totals.liveCash,
    },
    posted,
    postedCount,
    skippedCount,
    postedTotal,
    detail: postedCount
      ? `Posted ${postedCount} SitGuru book${postedCount === 1 ? "" : "s"} ($${postedTotal.toFixed(2)}) into Wave. Navy Federal stays the bank feed; these landed in Stripe Clearing.`
      : items.length
        ? "Wave already has this SitGuru Tax Center catch-up. Nothing new to post."
        :     "SitGuru has no 2026 marketplace fees, tax, payouts, or expenses to post yet. NFCU bank rows in Wave stay separate.",
  };
}
