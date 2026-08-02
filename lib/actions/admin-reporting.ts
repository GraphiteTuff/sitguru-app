/**
 * Rogue admin reporting — read-only structural snapshots for the 33 SitGuru
 * admin subcategories. Defensive: empty / missing tables never throw.
 *
 * SERVER ONLY — do not import from client components.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type AdminReportModuleId =
  | "dashboard"
  | "live_walks"
  | "bookings"
  | "pet_parents"
  | "gurus"
  | "ambassadors"
  | "ambassador_ledger"
  | "human_resources"
  | "sitguru_university"
  | "trust_safety"
  | "messages"
  | "sales_marketing"
  | "growth_referrals"
  | "programs"
  | "partners"
  | "analytics"
  | "chat_insights"
  | "financial_overview"
  | "banking"
  | "stripe_transactions"
  | "profit_loss"
  | "balance_sheet"
  | "cash_flow"
  | "general_ledger"
  | "reconciliation"
  | "pro_forma"
  | "tax_center"
  | "commissions"
  | "payouts"
  | "reports_exports"
  | "audit_trail"
  | "settings_global"
  | "settings_tech";

export type ModuleSnapshot = {
  id: AdminReportModuleId;
  label: string;
  group: "operations" | "growth" | "financials" | "analytics_admin";
  ok: boolean;
  summary: string;
  metrics: Record<string, number | string | boolean | null>;
  highlights: string[];
  sources: string[];
  errors: string[];
};

export type AdminReportingSnapshot = {
  compiledAt: string;
  period: ReportPeriod;
  periodStart: string;
  periodLabel: string;
  selectedModules: AdminReportModuleId[];
  modules: ModuleSnapshot[];
  markdownContext: string;
};

type AnyRow = Record<string, unknown>;

type SafeResult = {
  ok: boolean;
  rows: AnyRow[];
  count: number;
  message: string;
  table?: string;
};

/** Canonical financial sources — prefer these over legacy/aspirational names. */
const FINANCIAL_TABLES = {
  payments: [
    "booking_payments",
    "payments",
    "stripe_transactions",
    "stripe_balance_transactions",
  ],
  bankTransactions: [
    "admin_plaid_transactions",
    "bank_transactions",
    "plaid_bank_transactions",
  ],
  bankAccounts: ["admin_plaid_accounts", "plaid_accounts"],
  payouts: [
    "guru_payouts",
    "payouts",
    "stripe_payouts",
    "user_payout_destinations",
  ],
  commissions: [
    "ambassador_rewards",
    "commission_ledger",
    "partner_commissions",
    "referral_rewards",
  ],
  tax: ["booking_payments", "bookings", "tax_liabilities"],
} as const;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%\s,()]/g, ""));
    if (!Number.isFinite(parsed)) return 0;
    return value.includes("(") && value.includes(")") ? -parsed : parsed;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

export function getPeriodStart(period: ReportPeriod, now = new Date()): Date {
  const start = new Date(now);
  if (period === "daily") {
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "weekly") {
    start.setDate(start.getDate() - 7);
    return start;
  }
  if (period === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function periodLabel(period: ReportPeriod, now = new Date()) {
  if (period === "daily") return `Today (${now.toISOString().slice(0, 10)})`;
  if (period === "weekly") return "Last 7 days";
  if (period === "monthly") {
    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return `Year ${now.getFullYear()}`;
}

async function safeSelect(
  table: string,
  columns = "*",
  limit = 200,
  sinceIso?: string | null,
  dateColumn = "created_at",
): Promise<SafeResult> {
  try {
    let query = supabaseAdmin
      .from(table)
      .select(columns, { count: "exact" })
      .limit(limit);

    if (sinceIso) {
      query = query.gte(dateColumn, sinceIso);
    }

    const { data, error, count } = await query;

    if (error) {
      return {
        ok: false,
        rows: [],
        count: 0,
        message: error.message || `${table} unavailable`,
        table,
      };
    }

    const rows = Array.isArray(data) ? (data as unknown as AnyRow[]) : [];
    return {
      ok: true,
      rows,
      count: typeof count === "number" ? count : rows.length,
      message: `${table} connected`,
      table,
    };
  } catch (error) {
    return {
      ok: false,
      rows: [],
      count: 0,
      message: error instanceof Error ? error.message : `${table} unavailable`,
      table,
    };
  }
}

/**
 * Try candidate tables in order; return the first that resolves.
 * Avoids hard failures when legacy names were renamed (e.g. payments → booking_payments).
 */
async function safeSelectFirst(
  tables: readonly string[],
  columns = "*",
  limit = 200,
  sinceIso?: string | null,
  dateColumn = "created_at",
): Promise<SafeResult> {
  const errors: string[] = [];
  for (const table of tables) {
    const result = await safeSelect(table, columns, limit, sinceIso, dateColumn);
    if (result.ok) return result;
    errors.push(`${table}: ${result.message}`);
  }
  return {
    ok: false,
    rows: [],
    count: 0,
    message: errors[0] || "No candidate tables available",
    table: tables[0],
  };
}

async function safeHeadCount(
  table: string,
  sinceIso?: string | null,
  dateColumn = "created_at",
): Promise<SafeResult> {
  try {
    let query = supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true });

    if (sinceIso) {
      query = query.gte(dateColumn, sinceIso);
    }

    const { error, count } = await query;
    if (error) {
      return {
        ok: false,
        rows: [],
        count: 0,
        message: error.message || `${table} unavailable`,
      };
    }
    return {
      ok: true,
      rows: [],
      count: count ?? 0,
      message: `${table} connected`,
    };
  } catch (error) {
    return {
      ok: false,
      rows: [],
      count: 0,
      message: error instanceof Error ? error.message : `${table} unavailable`,
    };
  }
}

function statusOf(row: AnyRow) {
  return asString(
    row.status ||
      row.application_status ||
      row.check_status ||
      row.review_status ||
      row.payment_status ||
      row.payout_status ||
      row.dispute_status ||
      row.refund_status,
  )
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function moneyFromRow(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    if (!(key in row)) continue;
    const raw = row[key];
    if (raw == null || raw === "") continue;
    const value = asNumber(raw);
    if (!value) continue;

    const lower = key.toLowerCase();
    if (
      lower.includes("cents") ||
      lower.includes("_cent") ||
      lower === "amount_received" ||
      lower === "amount_captured" ||
      lower === "amount_refunded" ||
      lower === "application_fee_amount"
    ) {
      return value / 100;
    }
    return value;
  }
  return 0;
}

function sumField(rows: AnyRow[], keys: string[]) {
  return rows.reduce((sum, row) => sum + moneyFromRow(row, keys), 0);
}

const BOOKING_AMOUNT_KEYS = [
  "total_amount",
  "customer_total_amount",
  "subtotal_amount",
  "amount_total",
  "gross_amount",
  "booking_total",
  "amount",
  "price",
];

const PAYMENT_AMOUNT_KEYS = [
  "amount_cents",
  "total_cents",
  "gross_amount_cents",
  "amount",
  "total",
  "total_amount",
  "gross_amount",
];

const FEE_AMOUNT_KEYS = [
  "marketplace_support_cents",
  "platform_fee_cents",
  "fee",
  "fee_amount",
  "processing_fee",
  "stripe_fee",
  "application_fee_amount",
];

const TAX_AMOUNT_KEYS = [
  "tax_cents",
  "sales_tax_cents",
  "sales_tax_amount",
  "tax_amount",
  "tax",
];

const PAYOUT_AMOUNT_KEYS = [
  "amount_cents",
  "payout_amount_cents",
  "amount",
  "payout_amount",
  "guru_payout_amount",
  "guru_net_amount",
  "net_payout",
  "guru_earnings",
];

const COMMISSION_AMOUNT_KEYS = [
  "amount_cents",
  "reward_amount_cents",
  "amount",
  "commission_amount",
  "reward_amount",
  "partner_commission",
  "payout_amount",
];

function countWhere(rows: AnyRow[], predicate: (row: AnyRow) => boolean) {
  return rows.filter(predicate).length;
}

function snapshotBase(
  id: AdminReportModuleId,
  label: string,
  group: ModuleSnapshot["group"],
  sources: string[],
): ModuleSnapshot {
  return {
    id,
    label,
    group,
    ok: false,
    summary: `${label} data unavailable.`,
    metrics: {},
    highlights: [],
    sources,
    errors: [],
  };
}

function finalize(
  snap: ModuleSnapshot,
  ok: boolean,
  summary: string,
  metrics: ModuleSnapshot["metrics"],
  highlights: string[],
  errors: string[] = [],
): ModuleSnapshot {
  return {
    ...snap,
    ok,
    summary,
    metrics,
    highlights,
    errors: errors.filter(Boolean),
  };
}

/* ----------------------------- OPERATIONS ----------------------------- */

async function moduleDashboard(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("dashboard", "Dashboard", "operations", [
    "bookings",
    "messages",
    "gurus",
    "profiles",
  ]);
  const [bookings, messages, gurus, parents] = await Promise.all([
    safeHeadCount("bookings", since),
    safeHeadCount("messages", since),
    safeHeadCount("gurus"),
    safeHeadCount("profiles"),
  ]);
  const ok = bookings.ok || messages.ok || gurus.ok || parents.ok;
  const errors = [bookings, messages, gurus, parents]
    .filter((r) => !r.ok)
    .map((r) => r.message);
  return finalize(
    snap,
    ok,
    `Platform pulse for period: ${number(bookings.count)} bookings, ${number(messages.count)} messages, ${number(gurus.count)} gurus, ${number(parents.count)} profiles.`,
    {
      bookingsInPeriod: bookings.count,
      messagesInPeriod: messages.count,
      gurusTotal: gurus.count,
      profilesTotal: parents.count,
    },
    [
      `${number(bookings.count)} bookings in period`,
      `${number(messages.count)} messages in period`,
      `${number(gurus.count)} gurus on platform`,
    ],
    errors,
  );
}

async function moduleLiveWalks(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("live_walks", "Live Walks", "operations", [
    "live_walks",
    "walk_sessions",
    "gps_events",
  ]);
  const [liveWalks, walkSessions, gpsEvents] = await Promise.all([
    safeSelect("live_walks", "id,status,created_at,updated_at,guru_id,booking_id", 100, since),
    safeSelect("walk_sessions", "id,status,created_at,check_in_at,check_out_at", 100, since),
    safeSelect("gps_events", "id,created_at,event_type", 50, since),
  ]);
  const rows = liveWalks.ok ? liveWalks.rows : walkSessions.rows;
  const active = countWhere(
    rows,
    (row) =>
      ["active", "in_progress", "live", "started"].includes(statusOf(row)) ||
      Boolean(row.check_in_at && !row.check_out_at),
  );
  const ok = liveWalks.ok || walkSessions.ok || gpsEvents.ok;
  return finalize(
    snap,
    ok,
    ok
      ? `${number(active)} active walk sessions; ${number(gpsEvents.count)} GPS events sampled.`
      : "Live walk tables unavailable.",
    {
      activeWalks: active,
      walkRows: liveWalks.ok ? liveWalks.count : walkSessions.count,
      gpsEvents: gpsEvents.count,
    },
    [`${number(active)} active walks`, `${number(gpsEvents.count)} GPS events`],
    [liveWalks, walkSessions, gpsEvents].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleBookings(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("bookings", "Bookings", "operations", ["bookings"]);
  // Use * so missing legacy columns (e.g. bare `amount`) never fail the select.
  const result = await safeSelect("bookings", "*", 500, since);
  const completed = countWhere(result.rows, (r) =>
    ["completed", "complete", "paid", "confirmed"].includes(statusOf(r)),
  );
  const cancelled = countWhere(result.rows, (r) =>
    statusOf(r).includes("cancel"),
  );
  const pending = countWhere(result.rows, (r) =>
    ["pending", "requested", "new", "open"].includes(statusOf(r)),
  );
  const gmv = sumField(result.rows, BOOKING_AMOUNT_KEYS);
  const cancelRate =
    result.rows.length > 0 ? (cancelled / result.rows.length) * 100 : 0;
  return finalize(
    snap,
    result.ok,
    result.ok
      ? `${number(result.count)} bookings · ${money(gmv)} sampled GMV · ${cancelRate.toFixed(1)}% cancel rate.`
      : "Bookings unavailable.",
    {
      bookings: result.count,
      completed,
      cancelled,
      pending,
      sampledGmv: gmv,
      cancelRate: Number(cancelRate.toFixed(1)),
    },
    [
      `${number(completed)} completed`,
      `${number(pending)} pending`,
      `${cancelRate.toFixed(1)}% cancelled`,
    ],
    result.ok ? [] : [result.message],
  );
}

async function modulePetParents(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("pet_parents", "Pet Parents", "operations", [
    "profiles",
    "customers",
    "pets",
  ]);
  const [profiles, customers, pets] = await Promise.all([
    safeSelect("profiles", "id,role,created_at,account_status", 300, since),
    safeSelect("customers", "id,created_at,status", 200, since),
    safeHeadCount("pets"),
  ]);
  const parentish = profiles.rows.filter((row) => {
    const role = asString(row.role).toLowerCase();
    return (
      !role ||
      role.includes("parent") ||
      role.includes("customer") ||
      role === "user"
    );
  }).length;
  const ok = profiles.ok || customers.ok || pets.ok;
  return finalize(
    snap,
    ok,
    `Pet Parent signals: ${number(Math.max(parentish, customers.count))} parents/customers in period · ${number(pets.count)} pets total.`,
    {
      parentsInPeriod: Math.max(parentish, customers.count),
      petsTotal: pets.count,
      profilesInPeriod: profiles.count,
    },
    [
      `${number(Math.max(parentish, customers.count))} parent signals`,
      `${number(pets.count)} pets`,
    ],
    [profiles, customers, pets].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleGurus(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("gurus", "Gurus", "operations", [
    "gurus",
    "guru_background_checks",
  ]);
  const [gurus, checks] = await Promise.all([
    safeSelect(
      "gurus",
      "id,status,is_verified,is_bookable,city,state,rating,created_at",
      400,
    ),
    safeSelect(
      "guru_background_checks",
      "id,status,created_at,updated_at",
      200,
    ),
  ]);
  const bookable = countWhere(
    gurus.rows,
    (r) =>
      r.is_bookable === true ||
      statusOf(r) === "bookable" ||
      statusOf(r) === "active" ||
      statusOf(r) === "approved",
  );
  const verified = countWhere(
    gurus.rows,
    (r) => r.is_verified === true || statusOf(r).includes("verif"),
  );
  const pendingChecks = countWhere(checks.rows, (r) =>
    ["pending", "review", "in_review", "submitted"].includes(statusOf(r)),
  );
  return finalize(
    snap,
    gurus.ok || checks.ok,
    `${number(gurus.count)} gurus · ${number(bookable)} bookable · ${number(pendingChecks)} background checks pending.`,
    {
      gurus: gurus.count,
      bookable,
      verified,
      pendingBackgroundChecks: pendingChecks,
    },
    [
      `${number(bookable)} bookable`,
      `${number(verified)} verified`,
      `${number(pendingChecks)} checks pending`,
    ],
    [gurus, checks].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleAmbassadors(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("ambassadors", "Ambassadors", "operations", [
    "ambassadors",
    "ambassador_leads",
  ]);
  const [ambassadors, leads] = await Promise.all([
    safeSelect("ambassadors", "id,status,created_at,dashboard_enabled", 300),
    safeSelect("ambassador_leads", "id,status,created_at,program", 300),
  ]);
  const active = countWhere(ambassadors.rows, (r) =>
    ["active", "approved", "live"].includes(statusOf(r)),
  );
  return finalize(
    snap,
    ambassadors.ok || leads.ok,
    `${number(active)} active ambassadors · ${number(leads.count)} leads in pipeline.`,
    {
      ambassadors: ambassadors.count,
      active,
      leads: leads.count,
    },
    [`${number(active)} active`, `${number(leads.count)} leads`],
    [ambassadors, leads].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleAmbassadorLedger(): Promise<ModuleSnapshot> {
  const snap = snapshotBase(
    "ambassador_ledger",
    "Ambassador Ledger",
    "operations",
    ["ambassador_rewards", "partner_commissions", "partner_payouts"],
  );
  const [rewards, commissions, payouts] = await Promise.all([
    safeSelect("ambassador_rewards", "*", 300),
    safeSelectFirst(FINANCIAL_TABLES.commissions, "*", 300),
    safeSelectFirst(
      ["partner_payouts", "guru_payouts", "payouts"],
      "*",
      200,
    ),
  ]);
  const pendingRewards = rewards.rows.filter((r) =>
    ["pending", "owed", "accrued", "review", "earned"].includes(statusOf(r)),
  );
  const pendingAmount =
    sumField(pendingRewards, COMMISSION_AMOUNT_KEYS) +
    sumField(
      commissions.rows.filter((r) =>
        ["pending", "owed", "accrued", "open"].includes(statusOf(r)),
      ),
      COMMISSION_AMOUNT_KEYS,
    );
  return finalize(
    {
      ...snap,
      sources: [
        "ambassador_rewards",
        commissions.ok
          ? commissions.table || "partner_commissions"
          : "partner_commissions",
        payouts.ok ? payouts.table || "partner_payouts" : "partner_payouts",
      ],
    },
    rewards.ok || commissions.ok || payouts.ok,
    `Outstanding affiliate/commission exposure ≈ ${money(pendingAmount)}.`,
    {
      rewardRows: rewards.count,
      commissionRows: commissions.count,
      payoutRows: payouts.count,
      pendingExposure: pendingAmount,
    },
    [`${money(pendingAmount)} pending exposure`],
    [rewards, commissions, payouts].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleHr(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("human_resources", "Human Resources", "operations", [
    "ambassador_leads",
    "program_applications",
    "support_intake_cases",
  ]);
  const [leads, apps, support] = await Promise.all([
    safeHeadCount("ambassador_leads"),
    safeHeadCount("program_applications"),
    safeSelect("support_intake_cases", "id,status,priority,created_at", 200),
  ]);
  const openSupport = countWhere(support.rows, (r) =>
    !["closed", "resolved", "done"].includes(statusOf(r)),
  );
  return finalize(
    snap,
    leads.ok || apps.ok || support.ok,
    `HR/people ops load: ${number(leads.count)} ambassador leads · ${number(apps.count)} program apps · ${number(openSupport)} open support cases.`,
    {
      ambassadorLeads: leads.count,
      programApplications: apps.count,
      openSupportCases: openSupport,
    },
    [
      `${number(leads.count)} leads`,
      `${number(apps.count)} applications`,
      `${number(openSupport)} open support`,
    ],
    [leads, apps, support].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleUniversity(): Promise<ModuleSnapshot> {
  const snap = snapshotBase(
    "sitguru_university",
    "SitGuru University",
    "operations",
    [
      "ambassador_training_steps",
      "ambassador_training_progress",
      "academy_assignments",
      "academy_certifications",
    ],
  );
  const [steps, progress, assignments, certs] = await Promise.all([
    safeHeadCount("ambassador_training_steps"),
    safeSelect("ambassador_training_progress", "id,status,completed_at,created_at", 300),
    safeHeadCount("academy_assignments"),
    safeHeadCount("academy_certifications"),
  ]);
  const completed = countWhere(
    progress.rows,
    (r) => Boolean(r.completed_at) || statusOf(r).includes("complete"),
  );
  return finalize(
    snap,
    steps.ok || progress.ok || assignments.ok || certs.ok,
    `University: ${number(steps.count)} curriculum steps · ${number(completed)} progress completions · ${number(certs.count)} certifications.`,
    {
      steps: steps.count,
      progressRows: progress.count,
      completedProgress: completed,
      assignments: assignments.count,
      certifications: certs.count,
    },
    [
      `${number(steps.count)} steps`,
      `${number(completed)} completions`,
      `${number(certs.count)} certifications`,
    ],
    [steps, progress, assignments, certs]
      .filter((r) => !r.ok)
      .map((r) => r.message),
  );
}

async function moduleTrustSafety(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("trust_safety", "Trust & Safety", "operations", [
    "guru_background_checks",
    "moderation_flags",
    "fraud_flags",
  ]);
  const [checks, moderation, fraud] = await Promise.all([
    safeSelect("guru_background_checks", "id,status,created_at", 300),
    safeSelect("moderation_flags", "id,status,created_at", 200),
    safeSelect("fraud_flags", "id,status,created_at", 200),
  ]);
  const escalations = countWhere(checks.rows, (r) =>
    ["review", "escalated", "failed", "consider", "pending"].includes(statusOf(r)),
  );
  return finalize(
    snap,
    checks.ok || moderation.ok || fraud.ok,
    `Trust queue: ${number(escalations)} check escalations · ${number(moderation.count)} moderation · ${number(fraud.count)} fraud flags.`,
    {
      backgroundChecks: checks.count,
      escalations,
      moderationFlags: moderation.count,
      fraudFlags: fraud.count,
    },
    [
      `${number(escalations)} escalations`,
      `${number(moderation.count)} moderation`,
      `${number(fraud.count)} fraud`,
    ],
    [checks, moderation, fraud].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleMessages(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("messages", "Messages", "operations", ["messages"]);
  const result = await safeSelect(
    "messages",
    "id,created_at,is_read,read_at,status,channel",
    400,
    since,
  );
  const unread = countWhere(
    result.rows,
    (r) => r.is_read === false || (!r.read_at && statusOf(r) !== "read"),
  );
  return finalize(
    snap,
    result.ok,
    result.ok
      ? `${number(result.count)} messages in period · ${number(unread)} unread in sample.`
      : "Messages unavailable.",
    {
      messagesInPeriod: result.count,
      unreadSample: unread,
    },
    [`${number(result.count)} messages`, `${number(unread)} unread sampled`],
    result.ok ? [] : [result.message],
  );
}

/* -------------------------- GROWTH & MARKETING ------------------------- */

async function moduleSalesMarketing(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("sales_marketing", "Sales & Marketing", "growth", [
    "admin_marketing_campaigns",
    "admin_marketing_signup_leads",
    "admin_marketing_tasks",
  ]);
  const [campaigns, leads, tasks] = await Promise.all([
    safeSelect("admin_marketing_campaigns", "id,status,created_at,name,title", 200),
    safeSelect(
      "admin_marketing_signup_leads",
      "id,status,created_at,priority_level",
      300,
      since,
    ),
    safeSelect("admin_marketing_tasks", "id,status,created_at,needs_help", 200, since),
  ]);
  return finalize(
    snap,
    campaigns.ok || leads.ok || tasks.ok,
    `${number(campaigns.count)} campaigns · ${number(leads.count)} signup leads · ${number(tasks.count)} marketing tasks.`,
    {
      campaigns: campaigns.count,
      signupLeads: leads.count,
      tasks: tasks.count,
    },
    [
      `${number(campaigns.count)} campaigns`,
      `${number(leads.count)} leads`,
      `${number(tasks.count)} tasks`,
    ],
    [campaigns, leads, tasks].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleGrowthReferrals(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("growth_referrals", "Growth & Referrals", "growth", [
    "referral_codes",
    "referral_events",
    "referral_rewards",
  ]);
  const [codes, events, rewards] = await Promise.all([
    safeSelect("referral_codes", "id,status,created_at,program", 300),
    safeSelect("referral_events", "id,created_at,event_type,status", 300, since),
    safeSelect("referral_rewards", "id,status,amount,created_at", 300, since),
  ]);
  const pendingRewards = sumField(
    rewards.rows.filter((r) =>
      ["pending", "owed", "review"].includes(statusOf(r)),
    ),
    ["amount", "reward_amount"],
  );
  return finalize(
    snap,
    codes.ok || events.ok || rewards.ok,
    `${number(codes.count)} codes · ${number(events.count)} events · ${money(pendingRewards)} pending rewards.`,
    {
      codes: codes.count,
      events: events.count,
      rewards: rewards.count,
      pendingRewardAmount: pendingRewards,
    },
    [
      `${number(codes.count)} codes`,
      `${number(events.count)} events`,
      `${money(pendingRewards)} pending`,
    ],
    [codes, events, rewards].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function modulePrograms(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("programs", "Programs", "growth", [
    "program_applications",
  ]);
  const apps = await safeSelect(
    "program_applications",
    "id,program,program_key,status,created_at",
    500,
  );
  const byProgram = {
    student: 0,
    community: 0,
    veterans: 0,
    skillbridge: 0,
    ambassador: 0,
    other: 0,
  };
  for (const row of apps.rows) {
    const key = asString(row.program || row.program_key).toLowerCase();
    if (key.includes("student")) byProgram.student += 1;
    else if (key.includes("community")) byProgram.community += 1;
    else if (key.includes("skillbridge")) byProgram.skillbridge += 1;
    else if (
      key.includes("veteran") ||
      key.includes("military") ||
      key.includes("veterans-hire")
    ) {
      byProgram.veterans += 1;
    } else if (key.includes("ambassador")) byProgram.ambassador += 1;
    else byProgram.other += 1;
  }
  return finalize(
    snap,
    apps.ok,
    apps.ok
      ? `${number(apps.count)} applications · Veterans & Military Families: ${number(byProgram.veterans)} · SkillBridge: ${number(byProgram.skillbridge)}.`
      : "Program applications unavailable.",
    {
      applications: apps.count,
      studentHire: byProgram.student,
      communityHire: byProgram.community,
      veteransMilitaryFamilies: byProgram.veterans,
      skillbridgeInterest: byProgram.skillbridge,
      ambassadorProgram: byProgram.ambassador,
    },
    [
      `Student ${number(byProgram.student)}`,
      `Community ${number(byProgram.community)}`,
      `Veterans ${number(byProgram.veterans)}`,
    ],
    apps.ok ? [] : [apps.message],
  );
}

async function modulePartners(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("partners", "Partners", "growth", [
    "partner_applications",
    "partners",
  ]);
  const [apps, partners] = await Promise.all([
    safeSelect("partner_applications", "id,status,created_at", 300),
    safeSelect("partners", "id,status,created_at", 200),
  ]);
  return finalize(
    snap,
    apps.ok || partners.ok,
    `${number(partners.count)} partners · ${number(apps.count)} partner applications.`,
    {
      partners: partners.count,
      applications: apps.count,
    },
    [`${number(partners.count)} partners`, `${number(apps.count)} applications`],
    [apps, partners].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleAnalytics(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("analytics", "Analytics", "growth", [
    "analytics_events",
    "launch_signups",
    "bookings",
  ]);
  const [events, launches, bookings] = await Promise.all([
    safeHeadCount("analytics_events", since),
    safeHeadCount("launch_signups", since),
    safeHeadCount("bookings", since),
  ]);
  return finalize(
    snap,
    events.ok || launches.ok || bookings.ok,
    `Growth KPIs in period: ${number(events.count)} tracked events · ${number(launches.count)} launch signups · ${number(bookings.count)} bookings.`,
    {
      events: events.count,
      launchSignups: launches.count,
      bookings: bookings.count,
    },
    [
      `${number(events.count)} events`,
      `${number(launches.count)} launch signups`,
      `${number(bookings.count)} bookings`,
    ],
    [events, launches, bookings].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleChatInsights(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("chat_insights", "Chat Insights", "growth", [
    "global_chat_insights",
  ]);
  const insights = await safeSelect(
    "global_chat_insights",
    "insight_id,frequency_tally_count,is_friction_flag,is_converted_to_article,ai_assigned_category,core_question_summary",
    400,
  );
  const communications = insights.rows.reduce(
    (sum, row) => sum + asNumber(row.frequency_tally_count),
    0,
  );
  const friction = insights.rows.reduce(
    (sum, row) =>
      sum +
      (row.is_friction_flag ? asNumber(row.frequency_tally_count) : 0),
    0,
  );
  const converted = countWhere(insights.rows, (r) =>
    Boolean(r.is_converted_to_article),
  );
  return finalize(
    snap,
    insights.ok,
    insights.ok
      ? `${number(communications)} communications · ${number(friction)} friction · ${number(converted)} converted to Help.`
      : "Chat insights unavailable.",
    {
      insightRows: insights.count,
      communications,
      frictionFlags: friction,
      convertedArticles: converted,
    },
    [
      `${number(communications)} communications`,
      `${number(friction)} friction`,
      `${number(converted)} converted`,
    ],
    insights.ok ? [] : [insights.message],
  );
}

/* ----------------------------- FINANCIALS ----------------------------- */

async function moduleFinancialOverview(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase(
    "financial_overview",
    "Financial Overview",
    "financials",
    ["bookings", "booking_payments", "guru_payouts"],
  );
  const [bookings, payments, payouts] = await Promise.all([
    safeSelect("bookings", "*", 500, since),
    safeSelectFirst(FINANCIAL_TABLES.payments, "*", 400, since),
    safeSelectFirst(FINANCIAL_TABLES.payouts, "*", 300, since),
  ]);
  const gmv = sumField(bookings.rows, BOOKING_AMOUNT_KEYS);
  const paidPayments = payments.rows.filter((r) =>
    ["paid", "succeeded", "captured", "complete", "completed"].includes(
      statusOf(r),
    ),
  );
  const collected =
    sumField(paidPayments.length ? paidPayments : payments.rows, PAYMENT_AMOUNT_KEYS) ||
    gmv;
  const fees = sumField(payments.rows, FEE_AMOUNT_KEYS);
  const payoutTotal = sumField(payouts.rows, PAYOUT_AMOUNT_KEYS);
  const platformFromPayments = sumField(payments.rows, [
    "marketplace_support_cents",
    "platform_fee_cents",
    "platform_revenue",
    "sitguru_fee_amount",
    "marketplace_fee_amount",
    "application_fee_amount",
  ]);
  const platformRevenue =
    platformFromPayments > 0
      ? platformFromPayments
      : Math.max(0, collected - payoutTotal - fees);
  const takeRate = gmv > 0 ? (platformRevenue / gmv) * 100 : 0;
  const sources = [
    bookings.ok ? "bookings" : null,
    payments.ok ? payments.table || "booking_payments" : null,
    payouts.ok ? payouts.table || "guru_payouts" : null,
  ].filter(Boolean) as string[];
  return finalize(
    {
      ...snap,
      sources: sources.length ? sources : snap.sources,
    },
    bookings.ok || payments.ok || payouts.ok,
    `GMV ${money(gmv)} · collected ${money(collected)} · payouts ${money(payoutTotal)} · est. take-rate ${takeRate.toFixed(1)}%.`,
    {
      gmv,
      collected,
      fees,
      payouts: payoutTotal,
      platformRevenue,
      takeRatePercent: Number(takeRate.toFixed(1)),
    },
    [
      `GMV ${money(gmv)}`,
      `Collected ${money(collected)}`,
      `Take-rate ${takeRate.toFixed(1)}%`,
    ],
    [bookings, payments, payouts].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleBanking(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("banking", "Banking", "financials", [
    "admin_plaid_transactions",
    "admin_plaid_accounts",
  ]);
  const [txns, accounts] = await Promise.all([
    safeSelectFirst(FINANCIAL_TABLES.bankTransactions, "*", 300),
    safeSelectFirst(FINANCIAL_TABLES.bankAccounts, "*", 50),
  ]);
  const balance = sumField(accounts.rows, [
    "current_balance",
    "available_balance",
    "balance",
  ]);
  const needsReview = countWhere(txns.rows, (r) => {
    const status = statusOf(r);
    return (
      ["needs_review", "review", "unmatched", "pending_review"].includes(
        status,
      ) || r.pending === true
    );
  });
  return finalize(
    {
      ...snap,
      sources: [
        txns.ok ? txns.table || "admin_plaid_transactions" : "admin_plaid_transactions",
        accounts.ok
          ? accounts.table || "admin_plaid_accounts"
          : "admin_plaid_accounts",
      ],
    },
    txns.ok || accounts.ok,
    `Banking: ${money(balance)} account balance signals · ${number(needsReview)} txns need review.`,
    {
      accounts: accounts.count,
      transactions: txns.count,
      balanceSignals: balance,
      needsReview,
    },
    [`${money(balance)} balance signals`, `${number(needsReview)} need review`],
    [txns, accounts].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleStripe(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase(
    "stripe_transactions",
    "Stripe Transactions",
    "financials",
    ["booking_payments", "stripe_transactions", "payments"],
  );
  const payments = await safeSelectFirst(
    FINANCIAL_TABLES.payments,
    "*",
    400,
    since,
  );
  const rows = payments.rows;
  const volume = sumField(rows, PAYMENT_AMOUNT_KEYS);
  const fees = sumField(rows, FEE_AMOUNT_KEYS);
  const disputes = countWhere(
    rows,
    (r) =>
      statusOf(r).includes("dispute") ||
      statusOf(r).includes("chargeback") ||
      asString(r.type).toLowerCase().includes("dispute") ||
      asNumber(r.dispute_amount_cents) > 0 ||
      Boolean(r.dispute_status),
  );
  return finalize(
    {
      ...snap,
      sources: [payments.ok ? payments.table || "booking_payments" : "booking_payments"],
    },
    payments.ok,
    `Stripe/payment volume ${money(volume)} · fees ${money(fees)} · disputes ${number(disputes)}.`,
    {
      volume,
      fees,
      disputes,
      rows: rows.length,
    },
    [`${money(volume)} volume`, `${money(fees)} fees`, `${number(disputes)} disputes`],
    payments.ok ? [] : [payments.message],
  );
}

async function moduleProfitLoss(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("profit_loss", "Profit & Loss", "financials", [
    "bookings",
    "booking_payments",
    "admin_growth_marketing_expenses",
  ]);
  const overview = await moduleFinancialOverview(since);
  const expenses = await safeSelect(
    "admin_growth_marketing_expenses",
    "*",
    200,
    since,
  );
  const marketing = sumField(expenses.rows, ["amount", "total_cost", "cost"]);
  const revenue = asNumber(overview.metrics.platformRevenue);
  const noi = revenue - marketing;
  return finalize(
    snap,
    overview.ok || expenses.ok,
    `Est. NOI ${money(noi)} (platform revenue ${money(revenue)} − marketing ${money(marketing)}).`,
    {
      platformRevenue: revenue,
      marketingExpense: marketing,
      netOperatingIncome: noi,
    },
    [`NOI ${money(noi)}`, `Marketing ${money(marketing)}`],
    [...overview.errors, ...(expenses.ok ? [] : [expenses.message])],
  );
}

async function moduleBalanceSheet(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("balance_sheet", "Balance Sheet", "financials", [
    "admin_plaid_accounts",
    "guru_payouts",
    "referral_rewards",
  ]);
  const [accounts, payouts, rewards] = await Promise.all([
    safeSelectFirst(FINANCIAL_TABLES.bankAccounts, "*", 50),
    safeSelectFirst(FINANCIAL_TABLES.payouts, "*", 300),
    safeSelectFirst(
      ["referral_rewards", "ambassador_rewards"],
      "*",
      300,
    ),
  ]);
  const assets = sumField(accounts.rows, [
    "current_balance",
    "available_balance",
  ]);
  const liabilities =
    sumField(
      payouts.rows.filter((r) =>
        ["pending", "processing", "owed", "scheduled", "queued"].includes(
          statusOf(r),
        ),
      ),
      PAYOUT_AMOUNT_KEYS,
    ) +
    sumField(
      rewards.rows.filter((r) =>
        ["pending", "owed", "review", "accrued"].includes(statusOf(r)),
      ),
      COMMISSION_AMOUNT_KEYS,
    );
  const equity = assets - liabilities;
  return finalize(
    {
      ...snap,
      sources: [
        accounts.ok
          ? accounts.table || "admin_plaid_accounts"
          : "admin_plaid_accounts",
        payouts.ok ? payouts.table || "guru_payouts" : "guru_payouts",
        rewards.ok ? rewards.table || "referral_rewards" : "referral_rewards",
      ],
    },
    accounts.ok || payouts.ok || rewards.ok,
    `Assets ${money(assets)} · liabilities ${money(liabilities)} · equity signal ${money(equity)}.`,
    { assets, liabilities, equity },
    [
      `Assets ${money(assets)}`,
      `Liabilities ${money(liabilities)}`,
      `Equity ${money(equity)}`,
    ],
    [accounts, payouts, rewards].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleCashFlow(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("cash_flow", "Cash Flow", "financials", [
    "booking_payments",
    "guru_payouts",
    "admin_plaid_transactions",
  ]);
  const [payments, payouts, bank] = await Promise.all([
    safeSelectFirst(FINANCIAL_TABLES.payments, "*", 400, since),
    safeSelectFirst(FINANCIAL_TABLES.payouts, "*", 300, since),
    safeSelectFirst(FINANCIAL_TABLES.bankTransactions, "*", 300, since),
  ]);
  const inflow = sumField(
    payments.rows.filter((r) =>
      ["paid", "succeeded", "captured", "complete", "completed"].includes(
        statusOf(r),
      ),
    ),
    PAYMENT_AMOUNT_KEYS,
  );
  const outflow = sumField(payouts.rows, PAYOUT_AMOUNT_KEYS);
  const net = inflow - outflow;
  return finalize(
    {
      ...snap,
      sources: [
        payments.ok ? payments.table || "booking_payments" : "booking_payments",
        payouts.ok ? payouts.table || "guru_payouts" : "guru_payouts",
        bank.ok
          ? bank.table || "admin_plaid_transactions"
          : "admin_plaid_transactions",
      ],
    },
    payments.ok || payouts.ok || bank.ok,
    `Cash velocity: in ${money(inflow)} · out ${money(outflow)} · net ${money(net)}.`,
    {
      inflow,
      outflow,
      net,
      bankTransactions: bank.count,
    },
    [`In ${money(inflow)}`, `Out ${money(outflow)}`, `Net ${money(net)}`],
    [payments, payouts, bank].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleGeneralLedger(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("general_ledger", "General Ledger", "financials", [
    "general_ledger_entries",
    "booking_payments",
    "ambassador_rewards",
  ]);
  const [ledger, commissions, payments] = await Promise.all([
    safeSelect("general_ledger_entries", "*", 300, since),
    safeSelectFirst(FINANCIAL_TABLES.commissions, "*", 200, since),
    safeSelectFirst(FINANCIAL_TABLES.payments, "*", 200, since),
  ]);
  return finalize(
    {
      ...snap,
      sources: [
        "general_ledger_entries",
        commissions.ok
          ? commissions.table || "ambassador_rewards"
          : "ambassador_rewards",
        payments.ok ? payments.table || "booking_payments" : "booking_payments",
      ],
    },
    ledger.ok || commissions.ok || payments.ok,
    `Ledger signals: ${number(ledger.count)} GL entries · ${number(commissions.count)} commission rows · ${number(payments.count)} payments.`,
    {
      ledgerEntries: ledger.count,
      commissionRows: commissions.count,
      paymentRows: payments.count,
    },
    [
      `${number(ledger.count)} GL entries`,
      `${number(commissions.count)} commissions`,
    ],
    [ledger, commissions, payments].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleReconciliation(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("reconciliation", "Reconciliation", "financials", [
    "admin_plaid_transactions",
    "booking_payments",
  ]);
  const [bank, payments] = await Promise.all([
    safeSelectFirst(FINANCIAL_TABLES.bankTransactions, "*", 300),
    safeSelectFirst(FINANCIAL_TABLES.payments, "*", 300),
  ]);
  const unmatched = countWhere(bank.rows, (r) => {
    const status = statusOf(r);
    return (
      ["unmatched", "needs_review", "review", "pending_review"].includes(
        status,
      ) || r.pending === true
    );
  });
  return finalize(
    {
      ...snap,
      sources: [
        bank.ok
          ? bank.table || "admin_plaid_transactions"
          : "admin_plaid_transactions",
        payments.ok ? payments.table || "booking_payments" : "booking_payments",
      ],
    },
    bank.ok || payments.ok,
    `${number(unmatched)} bank rows need reconciliation review.`,
    {
      bankRows: bank.count,
      paymentRows: payments.count,
      stripeRows: payments.count,
      unmatched,
    },
    [`${number(unmatched)} unmatched/review`],
    [bank, payments].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleProForma(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("pro_forma", "Pro Forma", "financials", [
    "bookings",
    "booking_payments",
  ]);
  const overview = await moduleFinancialOverview(since);
  const gmv = asNumber(overview.metrics.gmv);
  const days =
    since && Date.parse(since)
      ? Math.max(1, Math.round((Date.now() - Date.parse(since)) / 86400000))
      : 30;
  const dailyRunRate = gmv / days;
  return finalize(
    snap,
    overview.ok,
    `Forward scale from run-rate: ~${money(dailyRunRate)}/day GMV · ~${money(dailyRunRate * 30)}/month projected.`,
    {
      dailyGmvRunRate: Number(dailyRunRate.toFixed(2)),
      monthlyGmvProjection: Number((dailyRunRate * 30).toFixed(2)),
      yearlyGmvProjection: Number((dailyRunRate * 365).toFixed(2)),
    },
    [
      `${money(dailyRunRate)}/day`,
      `${money(dailyRunRate * 30)}/mo proj.`,
    ],
    overview.errors,
  );
}

async function moduleTaxCenter(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("tax_center", "Tax Center", "financials", [
    "booking_payments",
    "bookings",
    "gurus",
  ]);
  const [payments, gurus, bookings, taxLiabilities] = await Promise.all([
    safeSelectFirst(["booking_payments", "payments"], "*", 400),
    safeHeadCount("gurus"),
    safeSelect("bookings", "*", 300),
    safeSelect("tax_liabilities", "*", 200),
  ]);
  const taxPool =
    sumField(payments.rows, TAX_AMOUNT_KEYS) ||
    sumField(bookings.rows, TAX_AMOUNT_KEYS) ||
    sumField(taxLiabilities.rows, ["amount", "tax_amount", "amount_cents"]);
  return finalize(
    {
      ...snap,
      sources: [
        payments.ok ? payments.table || "booking_payments" : "booking_payments",
        "gurus",
        "bookings",
      ],
    },
    payments.ok || gurus.ok || bookings.ok || taxLiabilities.ok,
    `Tax pool signals ${money(taxPool)} · ${number(gurus.count)} providers potentially 1099-relevant.`,
    {
      taxPool,
      providers: gurus.count,
      taxRows: taxLiabilities.count || payments.count,
    },
    [`${money(taxPool)} tax pool`, `${number(gurus.count)} providers`],
    [payments, gurus, bookings]
      .filter((r) => !r.ok)
      .map((r) => r.message),
  );
}

async function moduleCommissions(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("commissions", "Commissions", "financials", [
    "ambassador_rewards",
    "partner_commissions",
    "commission_ledger",
  ]);
  const commissions = await safeSelectFirst(
    FINANCIAL_TABLES.commissions,
    "*",
    400,
  );
  const outstanding = sumField(
    commissions.rows.filter((r) =>
      ["pending", "owed", "accrued", "open", "approved", "earned"].includes(
        statusOf(r),
      ),
    ),
    COMMISSION_AMOUNT_KEYS,
  );
  const total = sumField(commissions.rows, COMMISSION_AMOUNT_KEYS);
  return finalize(
    {
      ...snap,
      sources: [
        commissions.ok
          ? commissions.table || "ambassador_rewards"
          : "ambassador_rewards",
      ],
    },
    commissions.ok,
    `Outstanding commissions ≈ ${money(outstanding || total)}.`,
    {
      ledgerRows: commissions.count,
      partnerCommissionRows: commissions.count,
      outstanding: outstanding || total,
    },
    [`${money(outstanding || total)} outstanding`],
    commissions.ok ? [] : [commissions.message],
  );
}

async function modulePayouts(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("payouts", "Payouts", "financials", [
    "guru_payouts",
    "payouts",
  ]);
  const payouts = await safeSelectFirst(
    FINANCIAL_TABLES.payouts,
    "*",
    400,
    since,
  );
  const rows = payouts.rows;
  const pending = rows.filter((r) =>
    ["pending", "processing", "scheduled", "queued", "owed"].includes(
      statusOf(r),
    ),
  );
  const paid = rows.filter((r) =>
    ["paid", "complete", "completed", "sent", "transferred"].includes(
      statusOf(r),
    ),
  );
  return finalize(
    {
      ...snap,
      sources: [payouts.ok ? payouts.table || "guru_payouts" : "guru_payouts"],
    },
    payouts.ok,
    `${number(pending.length)} payouts pending (${money(sumField(pending, PAYOUT_AMOUNT_KEYS))}) · ${number(paid.length)} paid.`,
    {
      pendingCount: pending.length,
      pendingAmount: sumField(pending, PAYOUT_AMOUNT_KEYS),
      paidCount: paid.length,
      paidAmount: sumField(paid, PAYOUT_AMOUNT_KEYS),
    },
    [
      `${number(pending.length)} pending`,
      `${money(sumField(pending, PAYOUT_AMOUNT_KEYS))} queued`,
    ],
    payouts.ok ? [] : [payouts.message],
  );
}

/* ------------------------ ANALYTICS & ADMIN ---------------------------- */

async function moduleReportsExports(): Promise<ModuleSnapshot> {
  const snap = snapshotBase(
    "reports_exports",
    "Reports & Exports",
    "analytics_admin",
    ["financial_export_history", "admin_export_history"],
  );
  const [financial, admin] = await Promise.all([
    safeSelect(
      "financial_export_history",
      "id,status,package_type,created_at",
      200,
    ),
    safeSelect("admin_export_history", "id,status,package_type,created_at", 200),
  ]);
  return finalize(
    snap,
    financial.ok || admin.ok,
    `${number(financial.count + admin.count)} export/history records available.`,
    {
      financialExports: financial.count,
      adminExports: admin.count,
    },
    [`${number(financial.count + admin.count)} export records`],
    [financial, admin].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleAuditTrail(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("audit_trail", "Audit Trail", "analytics_admin", [
    "admin_audit_logs",
    "financial_audit_logs",
  ]);
  const [adminLogs, financeLogs] = await Promise.all([
    safeSelect(
      "admin_audit_logs",
      "id,action,created_at,actor_email,entity_type",
      300,
      since,
    ),
    safeSelect(
      "financial_audit_logs",
      "id,action,created_at,actor_email",
      200,
      since,
    ),
  ]);
  return finalize(
    snap,
    adminLogs.ok || financeLogs.ok,
    `${number(adminLogs.count)} admin audit events · ${number(financeLogs.count)} financial audit events in period.`,
    {
      adminAuditEvents: adminLogs.count,
      financialAuditEvents: financeLogs.count,
    },
    [
      `${number(adminLogs.count)} admin actions`,
      `${number(financeLogs.count)} finance actions`,
    ],
    [adminLogs, financeLogs].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleSettingsGlobal(): Promise<ModuleSnapshot> {
  const snap = snapshotBase(
    "settings_global",
    "Settings (Top/Global)",
    "analytics_admin",
    ["platform_settings", "admin_settings", "fee_settings"],
  );
  const [platform, admin, fees] = await Promise.all([
    safeSelect("platform_settings", "id,key,value,updated_at", 100),
    safeSelect("admin_settings", "id,key,value,updated_at", 100),
    safeSelect("fee_settings", "id,key,value,updated_at", 100),
  ]);
  const rows = platform.ok
    ? platform.rows
    : admin.ok
      ? admin.rows
      : fees.rows;
  return finalize(
    snap,
    platform.ok || admin.ok || fees.ok,
    `${number(rows.length)} global configuration rows readable.`,
    {
      settingsRows: rows.length,
    },
    [`${number(rows.length)} config rows`],
    [platform, admin, fees].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleSettingsTech(): Promise<ModuleSnapshot> {
  const snap = snapshotBase(
    "settings_tech",
    "Settings (Bottom/Tech)",
    "analytics_admin",
    ["webhook_deliveries", "integration_statuses", "analytics_events"],
  );
  const [webhooks, integrations, events] = await Promise.all([
    safeSelect("webhook_deliveries", "id,status,created_at", 100),
    safeSelect("integration_statuses", "id,status,provider,updated_at", 50),
    safeHeadCount("analytics_events"),
  ]);
  const failedWebhooks = countWhere(webhooks.rows, (r) =>
    ["failed", "error", "dead"].includes(statusOf(r)),
  );
  return finalize(
    snap,
    webhooks.ok || integrations.ok || events.ok,
    `Infra heartbeat: ${number(webhooks.count)} webhook deliveries (${number(failedWebhooks)} failed) · ${number(integrations.count)} integration rows · ${number(events.count)} analytics events.`,
    {
      webhookDeliveries: webhooks.count,
      failedWebhooks,
      integrations: integrations.count,
      analyticsEvents: events.count,
    },
    [
      `${number(failedWebhooks)} failed webhooks`,
      `${number(integrations.count)} integrations`,
    ],
    [webhooks, integrations, events].filter((r) => !r.ok).map((r) => r.message),
  );
}

/* ------------------------------ ROUTING ------------------------------- */

export const ALL_ADMIN_REPORT_MODULES: AdminReportModuleId[] = [
  "dashboard",
  "live_walks",
  "bookings",
  "pet_parents",
  "gurus",
  "ambassadors",
  "ambassador_ledger",
  "human_resources",
  "sitguru_university",
  "trust_safety",
  "messages",
  "sales_marketing",
  "growth_referrals",
  "programs",
  "partners",
  "analytics",
  "chat_insights",
  "financial_overview",
  "banking",
  "stripe_transactions",
  "profit_loss",
  "balance_sheet",
  "cash_flow",
  "general_ledger",
  "reconciliation",
  "pro_forma",
  "tax_center",
  "commissions",
  "payouts",
  "reports_exports",
  "audit_trail",
  "settings_global",
  "settings_tech",
];

const MODULE_KEYWORDS: Record<AdminReportModuleId, string[]> = {
  dashboard: ["dashboard", "kpi", "alert", "overview pulse", "daily sync"],
  live_walks: ["live walk", "gps", "geofence", "check-in", "check in", "walk session"],
  bookings: ["booking", "cancellation", "fulfillment", "matching pipeline"],
  pet_parents: ["pet parent", "customer", "ltv", "retention", "onboarding funnel"],
  gurus: ["guru", "provider", "capacity", "rating", "vetting"],
  ambassadors: ["ambassador", "affiliate", "influencer"],
  ambassador_ledger: ["ambassador ledger", "affiliate payout", "commission queue"],
  human_resources: ["hr", "human resources", "support ticket", "hiring"],
  sitguru_university: ["university", "training", "certification", "quiz", "academy"],
  trust_safety: ["trust", "safety", "background check", "fraud", "compliance"],
  messages: ["message", "inbox", "sla", "unread", "support lag"],
  sales_marketing: ["sales", "marketing", "campaign", "promo", "cac", "acquisition"],
  growth_referrals: ["referral", "invite", "bonus", "growth & referrals", "pawperks"],
  programs: ["program", "veteran", "military", "student hire", "community hire", "skillbridge"],
  partners: ["partner", "clinic", "b2b", "corporate"],
  analytics: ["analytics", "mom", "month-over-month", "cohort", "trend"],
  chat_insights: ["chat insight", "friction", "intent", "ticket classification"],
  financial_overview: ["financial overview", "gmv", "take-rate", "margin", "net profit"],
  banking: ["banking", "plaid", "liquidity", "operating account"],
  stripe_transactions: ["stripe", "charge", "processing fee", "dispute"],
  profit_loss: ["profit", "loss", "p&l", "noi", "operating income"],
  balance_sheet: ["balance sheet", "assets", "liabilities", "equity"],
  cash_flow: ["cash flow", "velocity", "inbound", "outbound"],
  general_ledger: ["general ledger", "journal", "gl "],
  reconciliation: ["reconcil", "mismatch", "unmatched"],
  pro_forma: ["pro forma", "projection", "run rate", "forecast"],
  tax_center: ["tax", "1099", "sales tax"],
  commissions: ["commission", "affiliate balance", "partner percentage"],
  payouts: ["payout", "batch payment", "friday payout", "provider pay"],
  reports_exports: ["export", "report package", "template"],
  audit_trail: ["audit", "who approved", "config override", "admin action"],
  settings_global: ["settings", "fee margin", "platform config", "global operating"],
  settings_tech: ["webhook", "integration", "infrastructure", "heartbeat", "tech settings"],
};

export function inferPeriodFromText(text: string): ReportPeriod {
  const lower = text.toLowerCase();
  if (lower.includes("yearly") || lower.includes("annual") || lower.includes("ytd")) {
    return "yearly";
  }
  if (lower.includes("monthly") || lower.includes("month-over-month") || lower.includes("mom")) {
    return "monthly";
  }
  if (lower.includes("weekly") || lower.includes("week")) {
    return "weekly";
  }
  return "daily";
}

export function resolveModulesForQuery(
  query: string,
  preset?: string | null,
): AdminReportModuleId[] {
  const presetKey = asString(preset).toLowerCase();
  if (presetKey === "daily_sync" || presetKey === "daily-sync") {
    return [
      "dashboard",
      "bookings",
      "messages",
      "live_walks",
      "financial_overview",
      "payouts",
      "trust_safety",
      "audit_trail",
    ];
  }
  if (presetKey === "weekly_financials" || presetKey === "weekly-financials") {
    return [
      "financial_overview",
      "banking",
      "stripe_transactions",
      "profit_loss",
      "balance_sheet",
      "cash_flow",
      "reconciliation",
      "commissions",
      "payouts",
      "tax_center",
      "pro_forma",
    ];
  }
  if (presetKey === "growth_analytics" || presetKey === "growth-analytics") {
    return [
      "sales_marketing",
      "growth_referrals",
      "programs",
      "partners",
      "analytics",
      "chat_insights",
      "ambassadors",
      "pet_parents",
    ];
  }
  if (presetKey === "system_audit" || presetKey === "system-audit") {
    return [
      "audit_trail",
      "trust_safety",
      "settings_global",
      "settings_tech",
      "reports_exports",
      "reconciliation",
      "messages",
      "human_resources",
    ];
  }
  if (presetKey === "full_scan" || presetKey === "full-scan") {
    return [...ALL_ADMIN_REPORT_MODULES];
  }

  const lower = query.toLowerCase();
  const matched = ALL_ADMIN_REPORT_MODULES.filter((id) =>
    MODULE_KEYWORDS[id].some((keyword) => lower.includes(keyword)),
  );

  if (matched.length >= 1) {
    // Always include dashboard pulse for context.
    if (!matched.includes("dashboard")) matched.unshift("dashboard");
    return matched.slice(0, 12);
  }

  // Default daily ops pulse when query is generic.
  return [
    "dashboard",
    "bookings",
    "financial_overview",
    "payouts",
    "growth_referrals",
    "messages",
    "analytics",
  ];
}

async function runModule(
  id: AdminReportModuleId,
  sinceIso: string,
): Promise<ModuleSnapshot> {
  try {
    switch (id) {
      case "dashboard":
        return await moduleDashboard(sinceIso);
      case "live_walks":
        return await moduleLiveWalks(sinceIso);
      case "bookings":
        return await moduleBookings(sinceIso);
      case "pet_parents":
        return await modulePetParents(sinceIso);
      case "gurus":
        return await moduleGurus();
      case "ambassadors":
        return await moduleAmbassadors();
      case "ambassador_ledger":
        return await moduleAmbassadorLedger();
      case "human_resources":
        return await moduleHr();
      case "sitguru_university":
        return await moduleUniversity();
      case "trust_safety":
        return await moduleTrustSafety();
      case "messages":
        return await moduleMessages(sinceIso);
      case "sales_marketing":
        return await moduleSalesMarketing(sinceIso);
      case "growth_referrals":
        return await moduleGrowthReferrals(sinceIso);
      case "programs":
        return await modulePrograms();
      case "partners":
        return await modulePartners();
      case "analytics":
        return await moduleAnalytics(sinceIso);
      case "chat_insights":
        return await moduleChatInsights();
      case "financial_overview":
        return await moduleFinancialOverview(sinceIso);
      case "banking":
        return await moduleBanking();
      case "stripe_transactions":
        return await moduleStripe(sinceIso);
      case "profit_loss":
        return await moduleProfitLoss(sinceIso);
      case "balance_sheet":
        return await moduleBalanceSheet();
      case "cash_flow":
        return await moduleCashFlow(sinceIso);
      case "general_ledger":
        return await moduleGeneralLedger(sinceIso);
      case "reconciliation":
        return await moduleReconciliation();
      case "pro_forma":
        return await moduleProForma(sinceIso);
      case "tax_center":
        return await moduleTaxCenter();
      case "commissions":
        return await moduleCommissions();
      case "payouts":
        return await modulePayouts(sinceIso);
      case "reports_exports":
        return await moduleReportsExports();
      case "audit_trail":
        return await moduleAuditTrail(sinceIso);
      case "settings_global":
        return await moduleSettingsGlobal();
      case "settings_tech":
        return await moduleSettingsTech();
      default:
        return finalize(
          snapshotBase(id, id, "analytics_admin", []),
          false,
          "Unknown module.",
          {},
          [],
          ["Unknown module id"],
        );
    }
  } catch (error) {
    return finalize(
      snapshotBase(id, id, "analytics_admin", []),
      false,
      "Module failed safely.",
      {},
      [],
      [error instanceof Error ? error.message : "Module failure"],
    );
  }
}

function modulesToMarkdown(
  modules: ModuleSnapshot[],
  period: ReportPeriod,
  compiledAt: string,
) {
  const lines: string[] = [
    `# SitGuru Admin Snapshot`,
    `- Compiled at: ${compiledAt}`,
    `- Period: ${period}`,
    ``,
  ];

  for (const mod of modules) {
    lines.push(`## ${mod.label} (${mod.group})`);
    lines.push(`- Status: ${mod.ok ? "live" : "unavailable"}`);
    lines.push(`- Summary: ${mod.summary}`);
    const metricEntries = Object.entries(mod.metrics || {});
    if (metricEntries.length) {
      lines.push(`| Metric | Value |`);
      lines.push(`| --- | --- |`);
      for (const [key, value] of metricEntries.slice(0, 12)) {
        lines.push(`| ${key} | ${String(value)} |`);
      }
    }
    if (mod.highlights.length) {
      lines.push(`Highlights:`);
      for (const item of mod.highlights.slice(0, 6)) {
        lines.push(`- ${item}`);
      }
    }
    if (mod.errors.length) {
      lines.push(`Notes: ${mod.errors.slice(0, 2).join(" | ")}`);
    }
    lines.push(``);
  }

  return lines.join("\n").slice(0, 28000);
}

/**
 * Compile a defensive admin reporting snapshot for Rogue's context window.
 */
export async function compileAdminReportingSnapshot(opts?: {
  period?: ReportPeriod;
  modules?: AdminReportModuleId[];
  query?: string;
  preset?: string | null;
}): Promise<AdminReportingSnapshot> {
  const now = new Date();
  const query = asString(opts?.query);
  const period = opts?.period || inferPeriodFromText(query || opts?.preset || "daily");
  const start = getPeriodStart(period, now);
  const sinceIso = start.toISOString();
  const selected =
    opts?.modules?.length
      ? opts.modules
      : resolveModulesForQuery(query || opts?.preset || "", opts?.preset);

  const modules = await Promise.all(
    selected.map((id) => runModule(id, sinceIso)),
  );

  const compiledAt = now.toISOString();
  return {
    compiledAt,
    period,
    periodStart: sinceIso,
    periodLabel: periodLabel(period, now),
    selectedModules: selected,
    modules,
    markdownContext: modulesToMarkdown(modules, period, compiledAt),
  };
}
