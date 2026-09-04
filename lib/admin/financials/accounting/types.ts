export const SITGURU_ACCOUNTING_ORG_ID = "sitguru";

export const ACCOUNTING_PROVIDERS = ["quickbooks", "wave"] as const;

export type AccountingProviderId = (typeof ACCOUNTING_PROVIDERS)[number];

export const ACCOUNTING_CONNECTION_STATUSES = [
  "connected",
  "action_required",
  "disconnected",
  "error",
] as const;

export type AccountingConnectionStatus =
  (typeof ACCOUNTING_CONNECTION_STATUSES)[number];

export const ACCOUNTING_SYNC_STATUSES = [
  "up_to_date",
  "syncing",
  "action_required",
  "error",
  "verified_readonly",
] as const;

export type AccountingSyncStatus = (typeof ACCOUNTING_SYNC_STATUSES)[number];

export const TAX_RETURN_STATUSES = [
  "not_started",
  "records_ready",
  "sent_to_preparer",
  "preparer_reviewing",
  "signature_required",
  "filed",
  "accepted",
] as const;

export type TaxReturnStatus = (typeof TAX_RETURN_STATUSES)[number];

export const SITGURU_LEDGER_ACCOUNTS = [
  {
    key: "service_revenue",
    name: "SitGuru Service Revenue",
    kind: "income",
  },
  {
    key: "sales_tax_payable",
    name: "Sales Tax Payable",
    kind: "liability",
  },
  {
    key: "guru_payouts",
    name: "Guru Payable / Guru Payouts",
    kind: "expense",
  },
  {
    key: "tips_payable",
    name: "Tips Payable",
    kind: "liability",
  },
  {
    key: "stripe_clearing",
    name: "Stripe Clearing",
    kind: "asset",
  },
  {
    key: "paypal_clearing",
    name: "PayPal Clearing",
    kind: "asset",
  },
  {
    key: "processing_fees",
    name: "Payment Processing Fees",
    kind: "expense",
  },
  {
    key: "refunds",
    name: "Refunds / Contra Revenue",
    kind: "contra",
  },
  {
    key: "operating_expenses",
    name: "Operating Expenses",
    kind: "expense",
  },
] as const;

export type SitGuruLedgerAccountKey =
  (typeof SITGURU_LEDGER_ACCOUNTS)[number]["key"];

export type AccountingConnectionRecord = {
  id: string;
  organizationId: string;
  provider: AccountingProviderId;
  providerBusinessId: string;
  providerBusinessName: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  tokenExpiresAt: string | null;
  scopes: string;
  status: AccountingConnectionStatus;
  lastSyncAt: string | null;
  lastSyncStatus: AccountingSyncStatus | null;
  lastSyncError: string | null;
  connectedEmail: string;
};

export type SafeAccountingConnection = {
  provider: AccountingProviderId;
  status: AccountingConnectionStatus;
  businessId: string;
  businessName: string;
  connectedEmail: string;
  lastSyncAt: string | null;
  lastSyncStatus: AccountingSyncStatus | null;
  lastSyncError: string | null;
  lastSyncLabel: string;
};

export type AccountingBusiness = {
  id: string;
  name: string;
  isPersonal?: boolean;
};

export type AccountingAccount = {
  id: string;
  name: string;
  type: string;
  subtype: string;
  archived: boolean;
};

export type AccountingAccountMapping = {
  sitguruAccountKey: SitGuruLedgerAccountKey;
  sitguruAccountName: string;
  providerAccountId: string;
  providerAccountName: string;
  providerAccountType: string;
  mappingSource: "suggested" | "manual";
};

export type CanonicalAccountingEvent = {
  sourceKey: string;
  bookingId: string;
  paymentId: string;
  eventType: string;
  eventDate: string;
  grossServiceAmount: number;
  salesTax: number;
  tip: number;
  guruPayout: number;
  refundAmount: number;
  paymentProcessingCost: number;
  otherExpense: number;
  currency: string;
};

export type AccountingProviderAdapter = {
  id: AccountingProviderId;
  connectPath: string;
  disconnect(): Promise<void>;
  refreshToken(): Promise<void>;
  getBusiness(): Promise<AccountingBusiness | null>;
  getAccounts(): Promise<AccountingAccount[]>;
  healthCheck(): Promise<{ ok: boolean; detail: string }>;
};

export type TaxProfessionalRecord = {
  taxYear: number;
  name: string;
  firm: string;
  email: string;
  dateSent: string | null;
  returnStatus: TaxReturnStatus;
};

export type ProviderCatalogRow = {
  provider: AccountingProviderId;
  providerName: string;
  pricingNote: string;
  supportUrl: string;
  connectUrl: string;
  enabled: boolean;
};
