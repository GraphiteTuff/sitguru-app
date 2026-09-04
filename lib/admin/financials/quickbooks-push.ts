import type { QuickBooksFeed } from "@/lib/admin/financials/quickbooks-feed";
import {
  loadQuickBooksConnection,
  markQuickBooksPush,
  qboRequest,
  refreshQuickBooksConnection,
  type QuickBooksConnection,
} from "@/lib/admin/financials/quickbooks-online";

type QboAccount = {
  Id?: string;
  Name?: string;
  FullyQualifiedName?: string;
  AccountType?: string;
  Active?: boolean;
};

type AccountSpec = {
  sitguru: string;
  name: string;
  accountType: string;
  accountSubType: string;
};

const ACCOUNT_SPECS: AccountSpec[] = [
  {
    sitguru: "Bank: Navy Federal Business Checking/Savings",
    name: "Navy Federal Business Checking/Savings",
    accountType: "Bank",
    accountSubType: "Checking",
  },
  {
    sitguru: "Sales of Product Income: Service Revenue",
    name: "Service Revenue",
    accountType: "Income",
    accountSubType: "ServiceFeeIncome",
  },
  {
    sitguru: "Other Current Liabilities: Sales Tax Payable",
    name: "Sales Tax Payable",
    accountType: "Other Current Liability",
    accountSubType: "SalesTaxPayable",
  },
  {
    sitguru: "Cost of Goods Sold: Contractor Payments",
    name: "Contractor Payments",
    accountType: "Cost of Goods Sold",
    accountSubType: "SuppliesMaterialsCogs",
  },
  {
    sitguru: "Expenses: Advertising and Marketing",
    name: "Advertising and Marketing",
    accountType: "Expense",
    accountSubType: "AdvertisingPromotional",
  },
  {
    sitguru: "Expenses: Other Business Expenses",
    name: "Other Business Expenses",
    accountType: "Expense",
    accountSubType: "OtherMiscellaneousServiceCost",
  },
  {
    sitguru: "Other Current Liabilities: Referral Rewards Payable",
    name: "Referral Rewards Payable",
    accountType: "Other Current Liability",
    accountSubType: "OtherCurrentLiabilities",
  },
];

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function specForAccount(account: string) {
  return (
    ACCOUNT_SPECS.find((item) => item.sitguru === account) || {
      sitguru: account,
      name: account.split(":").pop()?.trim() || account,
      accountType: "Expense",
      accountSubType: "OtherMiscellaneousServiceCost",
    }
  );
}

async function listAccounts(connection: QuickBooksConnection) {
  const payload = await qboRequest<{ QueryResponse?: { Account?: QboAccount[] } }>(
    connection,
    `/v3/company/${connection.realmId}/query?query=${encodeURIComponent("select * from Account maxresults 1000")}`,
  );
  return payload.QueryResponse?.Account || [];
}

function matchAccount(accounts: QboAccount[], spec: AccountSpec) {
  const wanted = [normalize(spec.name), normalize(spec.sitguru)];
  return accounts.find((account) => {
    if (account.Active === false) return false;
    const names = [account.Name, account.FullyQualifiedName].map((item) => normalize(asTrimmed(item)));
    return names.some((name) => wanted.includes(name) || wanted.some((item) => name.endsWith(item)));
  });
}

async function ensureAccount(
  connection: QuickBooksConnection,
  accounts: QboAccount[],
  spec: AccountSpec,
) {
  const existing = matchAccount(accounts, spec);
  if (existing?.Id) return existing;

  const created = await qboRequest<{ Account?: QboAccount }>(
    connection,
    `/v3/company/${connection.realmId}/account`,
    {
      method: "POST",
      body: JSON.stringify({
        Name: spec.name,
        AccountType: spec.accountType,
        AccountSubType: spec.accountSubType,
      }),
    },
  );
  if (created.Account) accounts.push(created.Account);
  return created.Account;
}

async function findExistingJournal(connection: QuickBooksConnection, docNumber: string) {
  const escaped = docNumber.replace(/'/g, "\\'");
  const payload = await qboRequest<{
    QueryResponse?: { JournalEntry?: { Id?: string; DocNumber?: string }[] };
  }>(
    connection,
    `/v3/company/${connection.realmId}/query?query=${encodeURIComponent(
      `select * from JournalEntry where DocNumber = '${escaped}'`,
    )}`,
  );
  return payload.QueryResponse?.JournalEntry?.[0] || null;
}

function journalDate(feed: QuickBooksFeed) {
  const parsed = new Date(feed.generatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

export async function pushQuickBooksJournal(feed: QuickBooksFeed) {
  const existing = await loadQuickBooksConnection();
  if (!existing) {
    throw new Error("Connect QuickBooks first from Tax Center.");
  }
  if (!feed.lines.length) {
    throw new Error("No journal amounts yet. Paid bookings, payouts, or expenses will fill the feed.");
  }

  const connection = await refreshQuickBooksConnection(existing);
  const already = await findExistingJournal(connection, feed.journalNo);
  if (already?.Id) {
    await markQuickBooksPush({
      connectionId: connection.id,
      docNumber: feed.journalNo,
      journalId: already.Id,
    });
    return {
      alreadyPushed: true,
      journalId: already.Id,
      docNumber: feed.journalNo,
      companyName: connection.companyName,
    };
  }

  const accounts = await listAccounts(connection);
  const resolved = new Map<string, QboAccount>();
  for (const line of feed.lines) {
    if (resolved.has(line.account)) continue;
    const account = await ensureAccount(connection, accounts, specForAccount(line.account));
    if (!account?.Id) {
      throw new Error(`Could not create QuickBooks account for ${line.account}.`);
    }
    resolved.set(line.account, account);
  }

  const payload = await qboRequest<{ JournalEntry?: { Id?: string; DocNumber?: string } }>(
    connection,
    `/v3/company/${connection.realmId}/journalentry`,
    {
      method: "POST",
      body: JSON.stringify({
        TxnDate: journalDate(feed),
        DocNumber: feed.journalNo,
        PrivateNote: `${feed.company} dba ${feed.dba} · ${feed.periodLabel}`,
        Line: feed.lines.map((line, index) => ({
          Id: String(index + 1),
          Description: line.memo,
          Amount: line.debit || line.credit,
          DetailType: "JournalEntryLineDetail",
          JournalEntryLineDetail: {
            PostingType: line.debit > 0 ? "Debit" : "Credit",
            AccountRef: {
              value: resolved.get(line.account)?.Id,
              name: resolved.get(line.account)?.Name,
            },
          },
        })),
      }),
    },
  );

  const journalId = asTrimmed(payload.JournalEntry?.Id);
  await markQuickBooksPush({
    connectionId: connection.id,
    docNumber: feed.journalNo,
    journalId,
  });

  return {
    alreadyPushed: false,
    journalId,
    docNumber: feed.journalNo,
    companyName: connection.companyName,
  };
}
