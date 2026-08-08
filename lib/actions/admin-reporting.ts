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
  | "social_platform_metrics"
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

/** Sequential conversion funnel stages for signup→booking leak diagnostics. */
export type FunnelStageId =
  | "traffic_pageview"
  | "account_signup"
  | "booking_initiated"
  | "booking_completed";

export type FunnelStageMetric = {
  id: FunnelStageId;
  label: string;
  count: number;
  uniqueActors: number;
  dropOffCount: number | null;
  dropOffPct: number | null;
  conversionFromPreviousPct: number | null;
  conversionFromTopPct: number;
  eventNamesMatched: string[];
};

export type ConversionFunnelReport = {
  compiledAt: string;
  periodStart: string | null;
  totalEventsSampled: number;
  groundTruthSignups: number;
  groundTruthBookings: number;
  stages: FunnelStageMetric[];
  leakSummary: string;
  largestDropOff: {
    from: FunnelStageId;
    to: FunnelStageId;
    count: number;
    pct: number;
  } | null;
  sources: string[];
  errors: string[];
};

/** Isolated chat friction flag for Help Center article briefs. */
export type ChatFrictionFlag = {
  insightId: string;
  sessionId: string | null;
  userId: string | null;
  frictionSnippet: string;
  category: string;
  channel: string;
  frequency: number;
  createdAt: string | null;
  updatedAt: string | null;
  isConverted: boolean;
};

export type HelpCenterArticleBrief = {
  insightId: string;
  title: string;
  summary: string;
  solution: string;
  category:
    | "Pet Parent Support"
    | "Guru Success & Training Hub"
    | "Billing & Refunds"
    | "Account & Profiles"
    | "Booking & Cancellations"
    | "Trust & Safety";
  audience: "parent" | "guru" | "ambassador" | "all";
  tags: string[];
  frictionSnippet: string;
  sessionId: string | null;
  userId: string | null;
  createdAt: string | null;
  /** Prefill path for the Help Center article creator. */
  createPath: string;
};

export type ConversionLeakDiagnostics = {
  compiledAt: string;
  period: ReportPeriod;
  periodStart: string;
  funnel: ConversionFunnelReport;
  frictionFlags: ChatFrictionFlag[];
  insightRowsLogged: number;
  communicationsSampled: number;
  helpCenterBriefs: HelpCenterArticleBrief[];
  markdownContext: string;
};

type AnyRow = Record<string, unknown>;

type SafeResult = {
  ok: boolean;
  rows: AnyRow[];
  count: number;
  message: string;
};

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
      };
    }

    const rows = Array.isArray(data) ? (data as unknown as AnyRow[]) : [];
    return {
      ok: true,
      rows,
      count: typeof count === "number" ? count : rows.length,
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
      row.lead_status ||
      row.signup_invite_status ||
      row.payout_status ||
      row.application_status ||
      row.check_status,
  )
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function sumField(rows: AnyRow[], keys: string[]) {
  return rows.reduce((sum, row) => {
    for (const key of keys) {
      const raw = row[key];
      // Prefer explicit dollar fields; convert *_cents when needed.
      if (key.endsWith("_cents") || key === "amount_cents") {
        const cents = asNumber(raw);
        if (cents !== 0) return sum + cents / 100;
        continue;
      }
      const value = asNumber(raw);
      if (value !== 0) return sum + value;
    }
    // Last-resort: if amount missing but amount_cents present.
    if (keys.includes("amount") && row.amount_cents != null) {
      const cents = asNumber(row.amount_cents);
      if (cents !== 0) return sum + cents / 100;
    }
    return sum;
  }, 0);
}

/**
 * Try primary table/columns, then fallbacks. Never throws.
 */
async function safeSelectCascade(
  attempts: Array<{
    table: string;
    columns?: string;
    limit?: number;
    sinceIso?: string | null;
    dateColumn?: string;
  }>,
): Promise<SafeResult & { tableUsed: string }> {
  const errors: string[] = [];
  for (const attempt of attempts) {
    const result = await safeSelect(
      attempt.table,
      attempt.columns || "*",
      attempt.limit ?? 200,
      attempt.sinceIso,
      attempt.dateColumn || "created_at",
    );
    if (result.ok) {
      return { ...result, tableUsed: attempt.table };
    }
    errors.push(result.message);
  }
  return {
    ok: false,
    rows: [],
    count: 0,
    message: errors.filter(Boolean).join(" | ") || "No sources available",
    tableUsed: attempts[0]?.table || "unknown",
  };
}

function normalizePaymentRows(rows: AnyRow[]) {
  return rows.map((row) => {
    const amount =
      asNumber(row.amount) ||
      asNumber(row.total) ||
      asNumber(row.amount_cents) / 100;
    const fee =
      asNumber(row.fee_amount) ||
      asNumber(row.processing_fee) ||
      asNumber(row.marketplace_support_cents) / 100;
    return {
      ...row,
      amount,
      fee_amount: fee,
      processing_fee: fee,
    };
  });
}

function normalizePayoutRows(rows: AnyRow[]) {
  return rows.map((row) => {
    const amount =
      asNumber(row.amount) ||
      asNumber(row.payout_amount) ||
      asNumber(row.net_amount) ||
      asNumber(row.gross_amount) ||
      asNumber(row.amount_cents) / 100;
    return {
      ...row,
      amount,
      payout_amount: amount,
      status: row.status || row.payout_status,
    };
  });
}

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
    "booking_walk_tracks",
    "booking_visit_sessions",
  ]);
  const [liveWalks, walkSessions, gpsEvents] = await Promise.all([
    safeSelectCascade([
      {
        table: "live_walks",
        columns: "id,status,created_at,updated_at,guru_id,booking_id",
        limit: 100,
        sinceIso: since,
      },
      {
        table: "booking_walk_tracks",
        columns: "id,status,created_at,updated_at,guru_id,booking_id",
        limit: 100,
        sinceIso: since,
      },
    ]),
    safeSelectCascade([
      {
        table: "walk_sessions",
        columns: "id,status,created_at,check_in_at,check_out_at",
        limit: 100,
        sinceIso: since,
      },
      {
        table: "booking_visit_sessions",
        columns: "id,status,created_at,started_at,ended_at",
        limit: 100,
        sinceIso: since,
      },
    ]),
    safeSelectCascade([
      {
        table: "gps_events",
        columns: "id,created_at,event_type",
        limit: 50,
        sinceIso: since,
      },
      {
        table: "booking_walk_track_points",
        columns: "id,recorded_at,created_at,lat,lng,walk_track_id,booking_id",
        limit: 50,
        sinceIso: since,
        dateColumn: "recorded_at",
      },
      {
        table: "booking_walk_track_points",
        columns: "id,created_at,lat,lng",
        limit: 50,
        sinceIso: since,
      },
    ]),
  ]);
  const sessionRows = walkSessions.rows.map((row) => ({
    ...row,
    check_in_at: row.check_in_at ?? row.started_at ?? null,
    check_out_at: row.check_out_at ?? row.ended_at ?? null,
  }));
  const rows = liveWalks.ok ? liveWalks.rows : sessionRows;
  const active = countWhere(
    rows,
    (row) =>
      ["active", "in_progress", "live", "started"].includes(statusOf(row)) ||
      Boolean(row.check_in_at && !row.check_out_at) ||
      Boolean(row.started_at && !row.ended_at),
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
      liveWalksSource: liveWalks.tableUsed,
      walkSessionsSource: walkSessions.tableUsed,
      gpsSource: gpsEvents.tableUsed,
    },
    [`${number(active)} active walks`, `${number(gpsEvents.count)} GPS events`],
    [liveWalks, walkSessions, gpsEvents].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleBookings(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("bookings", "Bookings", "operations", ["bookings"]);
  const result = await safeSelectCascade([
    {
      table: "bookings",
      columns:
        "id,status,created_at,total_amount,amount,subtotal_amount,customer_total_amount,service_name,cancellation_reason",
      limit: 500,
      sinceIso: since,
    },
    {
      table: "bookings",
      columns: "id,status,created_at,total_amount,service_type",
      limit: 500,
      sinceIso: since,
    },
  ]);
  const completed = countWhere(result.rows, (r) =>
    ["completed", "complete", "paid", "confirmed"].includes(statusOf(r)),
  );
  const cancelled = countWhere(result.rows, (r) =>
    statusOf(r).includes("cancel"),
  );
  const pending = countWhere(result.rows, (r) =>
    ["pending", "requested", "new", "open"].includes(statusOf(r)),
  );
  const gmv = sumField(result.rows, [
    "total_amount",
    "amount",
    "customer_total_amount",
    "subtotal_amount",
  ]);
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

  let intelligenceSummary = "";
  let intelligenceMetrics: Record<string, number | string> = {};
  try {
    const { getCustomerIntelligenceReportDigest } = await import(
      "@/lib/admin/customer-intelligence/report"
    );
    const report = await getCustomerIntelligenceReportDigest();
    intelligenceSummary = ` Customer Intelligence: ${number(report.metrics.totalCustomers)} visible Pet Parents · LTV avg ${money(report.metrics.averageLifetimeValue)} · repeat ${report.metrics.repeatRate.toFixed(1)}% · social customers ${number(report.metrics.socialCustomers)} · social revenue ${money(report.metrics.socialRevenue)}.`;
    intelligenceMetrics = {
      ciPetParents: report.metrics.totalCustomers,
      ciAverageLtv: report.metrics.averageLifetimeValue,
      ciRepeatRate: report.metrics.repeatRate,
      ciActive30d: report.metrics.activeCustomersLast30,
      ciSocialCustomers: report.metrics.socialCustomers,
      ciSocialRevenue: report.metrics.socialRevenue,
      ciSocialClicks: report.metrics.socialClicks,
      ciTopSocialPlatform: report.metrics.topSocialPlatform,
    };
  } catch {
    // Best-effort enrichment for Rogue snapshots.
  }

  return finalize(
    snap,
    ok,
    `Pet Parent signals: ${number(Math.max(parentish, customers.count))} parents/customers in period · ${number(pets.count)} pets total.${intelligenceSummary}`,
    {
      parentsInPeriod: Math.max(parentish, customers.count),
      petsTotal: pets.count,
      profilesInPeriod: profiles.count,
      ...intelligenceMetrics,
    },
    [
      `${number(Math.max(parentish, customers.count))} parent signals`,
      `${number(pets.count)} pets`,
      ...(intelligenceSummary
        ? [
            `${number(Number(intelligenceMetrics.ciSocialCustomers || 0))} social customers`,
          ]
        : []),
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
    ["ambassador_rewards", "commission_ledger", "partner_payouts"],
  );
  const [rewards, commissions, payouts] = await Promise.all([
    safeSelect("ambassador_rewards", "id,status,amount,reward_amount,created_at", 300),
    safeSelect("commission_ledger", "id,status,amount,commission_amount,created_at", 300),
    safeSelect("partner_payouts", "id,status,amount,created_at", 200),
  ]);
  const pendingRewards = rewards.rows.filter((r) =>
    ["pending", "owed", "accrued", "review"].includes(statusOf(r)),
  );
  const pendingAmount =
    sumField(pendingRewards, ["amount", "reward_amount"]) +
    sumField(
      commissions.rows.filter((r) =>
        ["pending", "owed", "accrued"].includes(statusOf(r)),
      ),
      ["amount", "commission_amount"],
    );
  return finalize(
    snap,
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
    "support_intake_cases",
    "fraud_flags",
    "dispute_cases",
  ]);
  const [checks, moderation, fraud] = await Promise.all([
    safeSelect("guru_background_checks", "id,status,created_at", 300),
    // Rogue alias moderation_flags → native live queue support_intake_cases.
    safeSelectCascade([
      {
        table: "support_intake_cases",
        columns: "id,status,priority,created_at,subject,category",
        limit: 200,
      },
      {
        table: "support_intake_cases",
        columns: "id,status,priority,created_at",
        limit: 200,
      },
      {
        table: "moderation_flags",
        columns: "id,status,created_at,severity,reason,subject_type",
        limit: 200,
      },
      {
        table: "moderation_flags",
        columns: "id,status,created_at",
        limit: 200,
      },
    ]),
    // Rogue alias fraud_flags → native live queue dispute_cases.
    safeSelectCascade([
      {
        table: "dispute_cases",
        columns: "id,status,priority,created_at,reason,category",
        limit: 200,
      },
      {
        table: "dispute_cases",
        columns: "id,status,created_at",
        limit: 200,
      },
      {
        table: "fraud_flags",
        columns: "id,status,created_at,severity,reason,subject_type",
        limit: 200,
      },
      {
        table: "fraud_flags",
        columns: "id,status,created_at",
        limit: 200,
      },
    ]),
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
      moderationSource: moderation.tableUsed,
      fraudSource: fraud.tableUsed,
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

async function moduleSocialPlatformMetrics(): Promise<ModuleSnapshot> {
  const snap = snapshotBase(
    "social_platform_metrics",
    "Social Platform Metrics",
    "growth",
    ["social_platform_metrics"],
  );
  const result = await safeSelect(
    "social_platform_metrics",
    "id,entity_id,platform,current_followers,baseline_followers,updated_at",
    200,
  );

  if (!result.ok) {
    return finalize(
      snap,
      false,
      "Social platform metrics unavailable.",
      {},
      [],
      [result.message],
    );
  }

  const highlights: string[] = [];
  let totalCurrent = 0;
  let totalBaseline = 0;
  for (const row of result.rows) {
    const entity = asString(row.entity_id) || "brand";
    const platform = asString(row.platform) || "unknown";
    const current = asNumber(row.current_followers);
    const baseline = asNumber(row.baseline_followers);
    const delta = current - baseline;
    totalCurrent += current;
    totalBaseline += baseline;
    const sign = delta > 0 ? "+" : "";
    highlights.push(
      `${entity}/${platform}: ${number(current)} current · ${number(baseline)} baseline · ${sign}${number(delta)} delta`,
    );
  }

  const totalDelta = totalCurrent - totalBaseline;
  const totalSign = totalDelta > 0 ? "+" : "";

  return finalize(
    snap,
    true,
    result.rows.length
      ? `${number(result.rows.length)} social rows · ${number(totalCurrent)} current followers · ${totalSign}${number(totalDelta)} vs baseline.`
      : "No social_platform_metrics rows seeded yet.",
    {
      rows: result.rows.length,
      totalCurrentFollowers: totalCurrent,
      totalBaselineFollowers: totalBaseline,
      totalDelta,
    },
    highlights.slice(0, 12),
    [],
  );
}

async function moduleSalesMarketing(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("sales_marketing", "Sales & Marketing", "growth", [
    "admin_marketing_campaigns",
    "admin_marketing_signup_leads",
    "admin_marketing_tasks",
  ]);
  const [campaigns, leads, tasks] = await Promise.all([
    // Live campaigns expose `name`; Rogue also asks for `title` when present.
    safeSelectCascade([
      {
        table: "admin_marketing_campaigns",
        columns: "id,status,created_at,name,title",
        limit: 200,
      },
      {
        table: "admin_marketing_campaigns",
        columns: "id,status,created_at,name",
        limit: 200,
      },
      {
        table: "admin_marketing_campaigns",
        columns: "id,status,created_at",
        limit: 200,
      },
    ]),
    // Live signup leads use `lead_status`; Rogue prefers unified `status`.
    safeSelectCascade([
      {
        table: "admin_marketing_signup_leads",
        columns: "id,status,created_at,priority_level",
        limit: 300,
        sinceIso: since,
      },
      {
        table: "admin_marketing_signup_leads",
        columns: "id,lead_status,created_at,priority_level",
        limit: 300,
        sinceIso: since,
      },
      {
        table: "admin_marketing_signup_leads",
        columns: "id,created_at,priority_level",
        limit: 300,
        sinceIso: since,
      },
    ]),
    safeSelectCascade([
      {
        table: "admin_marketing_tasks",
        columns: "id,status,created_at,needs_help",
        limit: 200,
        sinceIso: since,
      },
      {
        table: "admin_marketing_tasks",
        columns: "id,status,created_at",
        limit: 200,
        sinceIso: since,
      },
    ]),
  ]);
  const campaignRows = campaigns.rows.map((row) => ({
    ...row,
    title: asString(row.title) || asString(row.name) || null,
  }));
  const leadRows = leads.rows.map((row) => ({
    ...row,
    status: asString(row.status) || asString(row.lead_status) || null,
  }));
  return finalize(
    snap,
    campaigns.ok || leads.ok || tasks.ok,
    `${number(campaigns.count)} campaigns · ${number(leads.count)} signup leads · ${number(tasks.count)} marketing tasks.`,
    {
      campaigns: campaigns.count,
      signupLeads: leads.count,
      tasks: tasks.count,
      campaignsSource: campaigns.tableUsed,
      signupLeadsSource: leads.tableUsed,
      tasksSource: tasks.tableUsed,
      campaignTitlesSampled: countWhere(campaignRows, (r) => Boolean(asString(r.title))),
      leadsWithStatus: countWhere(leadRows, (r) => Boolean(asString(r.status))),
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
    // Live referral_codes often expose program_type / program_context, not program.
    safeSelectCascade([
      {
        table: "referral_codes",
        columns: "id,status,created_at,program",
        limit: 300,
      },
      {
        table: "referral_codes",
        columns: "id,status,created_at,program_type,program_context",
        limit: 300,
      },
      {
        table: "referral_codes",
        columns: "id,status,created_at",
        limit: 300,
      },
      {
        table: "pawperks_account_referral_codes",
        columns: "id,status,created_at,program_type",
        limit: 300,
      },
    ]),
    safeSelectCascade([
      {
        table: "referral_events",
        columns: "id,created_at,event_type,status",
        limit: 300,
        sinceIso: since,
      },
      {
        table: "referral_events",
        columns: "id,created_at,event_type",
        limit: 300,
        sinceIso: since,
      },
    ]),
    safeSelectCascade([
      {
        table: "referral_rewards",
        columns: "id,status,amount,created_at",
        limit: 300,
        sinceIso: since,
      },
      {
        table: "referral_rewards",
        columns: "id,status,created_at",
        limit: 300,
        sinceIso: since,
      },
    ]),
  ]);
  const codeRows = codes.rows.map((row) => ({
    ...row,
    program:
      asString(row.program) ||
      asString(row.program_type) ||
      asString(row.program_context) ||
      null,
  }));
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
      codesSource: codes.tableUsed,
      eventsSource: events.tableUsed,
      rewardsSource: rewards.tableUsed,
      codesWithProgram: countWhere(codeRows, (r) => Boolean(asString(r.program))),
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

/* --------- CONVERSION FUNNEL + CHAT FRICTION DIAGNOSTICS --------- */

const FUNNEL_STAGE_ORDER: FunnelStageId[] = [
  "traffic_pageview",
  "account_signup",
  "booking_initiated",
  "booking_completed",
];

const FUNNEL_STAGE_LABELS: Record<FunnelStageId, string> = {
  traffic_pageview: "Traffic / Pageview",
  account_signup: "Account Signup",
  booking_initiated: "Booking Initiated",
  booking_completed: "Booking Completed",
};

const FUNNEL_EVENT_MATCHERS: Record<FunnelStageId, RegExp[]> = {
  traffic_pageview: [
    /^homepage_visit$/i,
    /^page_view$/i,
    /^launch_page_visit$/i,
    /^traffic$/i,
    /^page$/i,
  ],
  account_signup: [
    /^launch_signup_completed$/i,
    /^launch_signup_started$/i,
    /^account_signup$/i,
    /^signup$/i,
    /^account_created$/i,
    /^registration$/i,
    /^customer_signup$/i,
  ],
  booking_initiated: [
    /^booking_started$/i,
    /^booking_initiated$/i,
    /^booking_cta_clicked$/i,
    /^checkout_started$/i,
    /^booking_request_created$/i,
    /^booking$/i,
  ],
  booking_completed: [
    /^booking_completed$/i,
    /^completed_booking$/i,
    /^booking_paid$/i,
    /^first_booking$/i,
  ],
};

function pct(part: number, whole: number) {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function eventNameOf(row: AnyRow) {
  return asString(row.event_name || row.eventName || row.name || row.action);
}

function eventTypeOf(row: AnyRow) {
  return asString(row.event_type || row.eventType || row.type);
}

function actorKeyOf(row: AnyRow) {
  return (
    asString(row.user_id) ||
    asString(row.userId) ||
    asString(row.session_id) ||
    asString(row.sessionId) ||
    asString(row.id) ||
    ""
  );
}

function matchesFunnelStage(row: AnyRow, stage: FunnelStageId) {
  const name = eventNameOf(row);
  const type = eventTypeOf(row);
  const haystacks = [name, type].filter(Boolean);
  return FUNNEL_EVENT_MATCHERS[stage].some((rx) =>
    haystacks.some((value) => rx.test(value)),
  );
}

/**
 * Pure aggregator: map raw analytics_events rows into sequential funnel stages
 * with absolute + percentage drop-offs between each step.
 */
export function aggregateConversionFunnel(
  events: AnyRow[],
  opts?: {
    groundTruthSignups?: number;
    groundTruthBookings?: number;
    periodStart?: string | null;
    sources?: string[];
    errors?: string[];
  },
): ConversionFunnelReport {
  const compiledAt = new Date().toISOString();
  const rows = Array.isArray(events) ? events : [];
  const stageRows: Record<FunnelStageId, AnyRow[]> = {
    traffic_pageview: [],
    account_signup: [],
    booking_initiated: [],
    booking_completed: [],
  };
  const matchedNames: Record<FunnelStageId, Set<string>> = {
    traffic_pageview: new Set(),
    account_signup: new Set(),
    booking_initiated: new Set(),
    booking_completed: new Set(),
  };

  for (const row of rows) {
    for (const stage of FUNNEL_STAGE_ORDER) {
      if (!matchesFunnelStage(row, stage)) continue;
      stageRows[stage].push(row);
      const label = eventNameOf(row) || eventTypeOf(row);
      if (label) matchedNames[stage].add(label);
    }
  }

  const eventSignupActors = new Set(
    stageRows.account_signup.map(actorKeyOf).filter(Boolean),
  ).size;
  const eventBookingActors = new Set(
    stageRows.booking_completed.map(actorKeyOf).filter(Boolean),
  ).size;

  const groundTruthSignups =
    typeof opts?.groundTruthSignups === "number"
      ? opts.groundTruthSignups
      : eventSignupActors;
  const groundTruthBookings =
    typeof opts?.groundTruthBookings === "number"
      ? opts.groundTruthBookings
      : eventBookingActors;

  const counts: Record<FunnelStageId, number> = {
    traffic_pageview: new Set(
      stageRows.traffic_pageview.map(actorKeyOf).filter(Boolean),
    ).size || stageRows.traffic_pageview.length,
    account_signup: Math.max(groundTruthSignups, eventSignupActors),
    booking_initiated: new Set(
      stageRows.booking_initiated.map(actorKeyOf).filter(Boolean),
    ).size || stageRows.booking_initiated.length,
    booking_completed: Math.max(groundTruthBookings, eventBookingActors),
  };

  // Enforce funnel monotonicity for drop-off readability when ground truth
  // signups exceed tracked booking_initiated events.
  if (counts.booking_initiated > counts.account_signup) {
    counts.booking_initiated = counts.account_signup;
  }
  if (counts.booking_completed > counts.booking_initiated) {
    counts.booking_completed = counts.booking_initiated;
  }

  const top = counts.traffic_pageview || counts.account_signup || 0;
  const stages: FunnelStageMetric[] = FUNNEL_STAGE_ORDER.map((id, index) => {
    const previousId = index > 0 ? FUNNEL_STAGE_ORDER[index - 1] : null;
    const previousCount = previousId ? counts[previousId] : null;
    const count = counts[id];
    const dropOffCount =
      previousCount == null ? null : Math.max(previousCount - count, 0);
    const dropOffPct =
      previousCount == null ? null : pct(dropOffCount || 0, previousCount);
    const conversionFromPreviousPct =
      previousCount == null ? null : pct(count, previousCount);
    return {
      id,
      label: FUNNEL_STAGE_LABELS[id],
      count,
      uniqueActors: count,
      dropOffCount,
      dropOffPct,
      conversionFromPreviousPct,
      conversionFromTopPct: pct(count, top || 1),
      eventNamesMatched: [...matchedNames[id]].slice(0, 12),
    };
  });

  let largestDropOff: ConversionFunnelReport["largestDropOff"] = null;
  for (let i = 1; i < stages.length; i += 1) {
    const prev = stages[i - 1];
    const curr = stages[i];
    const drop = curr.dropOffCount ?? 0;
    const dropPct = curr.dropOffPct ?? 0;
    if (
      !largestDropOff ||
      drop > largestDropOff.count ||
      (drop === largestDropOff.count && dropPct > largestDropOff.pct)
    ) {
      largestDropOff = {
        from: prev.id,
        to: curr.id,
        count: drop,
        pct: dropPct,
      };
    }
  }

  const signupStage = stages.find((s) => s.id === "account_signup");
  const completedStage = stages.find((s) => s.id === "booking_completed");
  const leakSummary = `${number(signupStage?.count || 0)} signups → ${number(completedStage?.count || 0)} completed bookings (${pct(completedStage?.count || 0, signupStage?.count || 0)}% signup→book). Largest drop-off: ${largestDropOff ? `${FUNNEL_STAGE_LABELS[largestDropOff.from]} → ${FUNNEL_STAGE_LABELS[largestDropOff.to]} (−${number(largestDropOff.count)} / ${largestDropOff.pct}%)` : "n/a"}.`;

  return {
    compiledAt,
    periodStart: opts?.periodStart || null,
    totalEventsSampled: rows.length,
    groundTruthSignups,
    groundTruthBookings,
    stages,
    leakSummary,
    largestDropOff,
    sources: opts?.sources || ["analytics_events"],
    errors: (opts?.errors || []).filter(Boolean),
  };
}

/**
 * Load analytics + ground-truth signup/booking tables and compile funnel stages.
 */
export async function loadConversionFunnelDiagnostics(
  sinceIso?: string | null,
): Promise<ConversionFunnelReport> {
  const [events, signups, bookings] = await Promise.all([
    safeSelectCascade([
      {
        table: "analytics_events",
        columns:
          "id,user_id,session_id,event_name,event_type,role,source,page_path,booking_id,created_at",
        limit: 500,
        sinceIso: sinceIso || null,
      },
      {
        table: "analytics_events",
        columns: "id,user_id,session_id,event_name,event_type,created_at",
        limit: 500,
        sinceIso: sinceIso || null,
      },
      {
        table: "analytics_events",
        columns: "id,event_name,event_type,created_at",
        limit: 500,
        sinceIso: sinceIso || null,
      },
    ]),
    safeSelectCascade([
      {
        table: "launch_signups",
        columns: "id,user_id,email,created_at,role,status",
        limit: 500,
        sinceIso: sinceIso || null,
      },
      {
        table: "launch_signups",
        columns: "id,created_at",
        limit: 500,
        sinceIso: sinceIso || null,
      },
    ]),
    safeSelectCascade([
      {
        table: "bookings",
        columns: "id,status,created_at,pet_parent_id,guru_id,total_amount",
        limit: 500,
        sinceIso: sinceIso || null,
      },
      {
        table: "bookings",
        columns: "id,status,created_at",
        limit: 500,
        sinceIso: sinceIso || null,
      },
    ]),
  ]);

  const completedBookings = countWhere(bookings.rows, (row) =>
    ["completed", "complete", "paid", "succeeded", "confirmed", "fulfilled"].includes(
      statusOf(row),
    ),
  );

  return aggregateConversionFunnel(events.rows, {
    groundTruthSignups: signups.ok ? signups.count : undefined,
    // Completed bookings only — do not fall back to total rows (leak target is 0).
    groundTruthBookings: bookings.ok ? completedBookings : undefined,
    periodStart: sinceIso || null,
    sources: [events.tableUsed, signups.tableUsed, bookings.tableUsed].filter(
      Boolean,
    ),
    errors: [events, signups, bookings]
      .filter((result) => !result.ok)
      .map((result) => result.message),
  });
}

function mapInsightCategoryToHelpCategory(
  category: string,
): HelpCenterArticleBrief["category"] {
  const lower = category.toLowerCase();
  if (lower.includes("stripe") || lower.includes("billing") || lower.includes("payout")) {
    return "Billing & Refunds";
  }
  if (lower.includes("booking") || lower.includes("cancel") || lower.includes("schedule")) {
    return "Booking & Cancellations";
  }
  if (lower.includes("trust") || lower.includes("safety") || lower.includes("leash") || lower.includes("dispute")) {
    return "Trust & Safety";
  }
  if (lower.includes("account") || lower.includes("login") || lower.includes("profile")) {
    return "Account & Profiles";
  }
  if (lower.includes("guru") || lower.includes("training") || lower.includes("university")) {
    return "Guru Success & Training Hub";
  }
  return "Pet Parent Support";
}

/**
 * Extract friction-flagged chat insight rows into a structured payload
 * (session/user/snippet/timestamps) for Help Center article creation.
 */
export function mapChatFrictionFlags(rows: AnyRow[]): ChatFrictionFlag[] {
  return rows
    .filter((row) => Boolean(row.is_friction_flag))
    .map((row) => {
      const insightId = asString(row.insight_id || row.id);
      const snippet = asString(
        row.core_question_summary ||
          row.raw_question_text ||
          row.friction_snippet ||
          row.summary,
      );
      const hash = asString(row.text_string_hash);
      return {
        insightId,
        sessionId:
          asString(row.session_id) ||
          asString(row.sessionId) ||
          (hash ? `insight-hash:${hash.slice(0, 16)}` : null) ||
          (insightId ? `insight:${insightId}` : null),
        userId: asString(row.user_id) || asString(row.userId) || null,
        frictionSnippet: snippet,
        category: asString(row.ai_assigned_category) || "General Inquiry",
        channel: asString(row.channel_source_enum) || "UNKNOWN",
        frequency: asNumber(row.frequency_tally_count) || 1,
        createdAt: asString(row.created_at) || null,
        updatedAt: asString(row.updated_at) || asString(row.last_asked_at) || null,
        isConverted: Boolean(
          row.is_converted_to_article || row.is_converted_to_help_article,
        ),
      };
    })
    .filter((row) => Boolean(row.insightId) && Boolean(row.frictionSnippet))
    .sort((a, b) => b.frequency - a.frequency || (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

/**
 * Format friction flags as pre-populated Help Center article briefs for
 * `/admin/help/articles/new` (posts through `/api/admin/insights/convert`).
 */
export function buildHelpCenterArticleBriefs(
  flags: ChatFrictionFlag[],
  limit = 6,
): HelpCenterArticleBrief[] {
  return flags.slice(0, Math.max(limit, 0)).map((flag) => {
    const title = flag.frictionSnippet.slice(0, 120);
    const summary = `Friction signal (${flag.channel}): ${flag.frictionSnippet}`.slice(
      0,
      400,
    );
    const solution = [
      `Customers repeatedly hit this friction point:`,
      ``,
      `"${flag.frictionSnippet}"`,
      ``,
      `Category: ${flag.category}`,
      `Channel: ${flag.channel}`,
      `Frequency tally: ${flag.frequency}`,
      ``,
      `Draft the clear SitGuru answer that unblocks signup→booking conversion.`,
    ].join("\n");
    const params = new URLSearchParams({
      insightId: flag.insightId,
      title,
      category: mapInsightCategoryToHelpCategory(flag.category),
    });
    return {
      insightId: flag.insightId,
      title,
      summary,
      solution,
      category: mapInsightCategoryToHelpCategory(flag.category),
      audience: "all",
      tags: [
        "friction",
        "conversion-leak",
        "omnichannel",
        flag.channel.toLowerCase(),
        flag.category.toLowerCase().replace(/\s+/g, "-"),
      ].slice(0, 12),
      frictionSnippet: flag.frictionSnippet,
      sessionId: flag.sessionId,
      userId: flag.userId,
      createdAt: flag.createdAt || flag.updatedAt,
      createPath: `/admin/help/articles/new?${params.toString()}`,
    };
  });
}

/**
 * Operational query: pull friction-flagged chat insights and export Help briefs.
 */
export async function extractChatFrictionFlags(opts?: {
  limit?: number;
  briefLimit?: number;
}): Promise<{
  ok: boolean;
  insightRowsLogged: number;
  communicationsSampled: number;
  frictionFlags: ChatFrictionFlag[];
  helpCenterBriefs: HelpCenterArticleBrief[];
  sources: string[];
  errors: string[];
}> {
  const limit = opts?.limit ?? 250;
  const briefLimit = opts?.briefLimit ?? 6;
  const insights = await safeSelectCascade([
    {
      table: "global_chat_insights",
      columns:
        "insight_id,text_string_hash,core_question_summary,ai_assigned_category,channel_source_enum,frequency_tally_count,is_friction_flag,is_converted_to_article,created_at,updated_at",
      limit,
    },
    {
      table: "global_chat_insights",
      columns:
        "insight_id,core_question_summary,ai_assigned_category,channel_source_enum,frequency_tally_count,is_friction_flag,is_converted_to_article,updated_at",
      limit,
    },
    {
      table: "homepage_chat_insights",
      columns:
        "insight_id,raw_question_text,clean_ai_topic_category,frequency_tally_count,is_converted_to_help_article,last_asked_at,created_at",
      limit,
    },
  ]);

  const normalizedRows: AnyRow[] =
    insights.tableUsed === "homepage_chat_insights"
      ? insights.rows.map((row) => ({
          ...row,
          core_question_summary: row.raw_question_text,
          ai_assigned_category: row.clean_ai_topic_category,
          channel_source_enum: "HOMEPAGE_LEAD",
          is_friction_flag: true,
          is_converted_to_article: row.is_converted_to_help_article,
          updated_at: row.last_asked_at || row.created_at,
          frequency_tally_count: row.frequency_tally_count,
        }))
      : insights.rows;

  const frictionFlags = mapChatFrictionFlags(normalizedRows);
  const communicationsSampled = normalizedRows.reduce(
    (sum, row) => sum + (asNumber(row.frequency_tally_count) || 0),
    0,
  );

  return {
    ok: insights.ok,
    insightRowsLogged: insights.count,
    communicationsSampled,
    frictionFlags,
    helpCenterBriefs: buildHelpCenterArticleBriefs(frictionFlags, briefLimit),
    sources: [insights.tableUsed],
    errors: insights.ok ? [] : [insights.message],
  };
}

function funnelDiagnosticsMarkdown(
  funnel: ConversionFunnelReport,
  friction: Awaited<ReturnType<typeof extractChatFrictionFlags>>,
) {
  const lines = [
    `# Conversion Leak Diagnostics`,
    `- Compiled: ${funnel.compiledAt}`,
    `- Events sampled: ${number(funnel.totalEventsSampled)}`,
    `- Ground truth: ${number(funnel.groundTruthSignups)} signups · ${number(funnel.groundTruthBookings)} bookings`,
    `- Leak: ${funnel.leakSummary}`,
    ``,
    `## Funnel stages`,
    `| Stage | Count | Drop-off | Drop-% | Conv from prev |`,
    `| --- | --- | --- | --- | --- |`,
  ];
  for (const stage of funnel.stages) {
    lines.push(
      `| ${stage.label} | ${stage.count} | ${stage.dropOffCount ?? "—"} | ${stage.dropOffPct == null ? "—" : `${stage.dropOffPct}%`} | ${stage.conversionFromPreviousPct == null ? "—" : `${stage.conversionFromPreviousPct}%`} |`,
    );
  }
  lines.push(``);
  lines.push(`## Chat friction flags`);
  lines.push(
    `- Insight rows logged: ${number(friction.insightRowsLogged)} · Communications: ${number(friction.communicationsSampled)} · Friction flags: ${number(friction.frictionFlags.length)}`,
  );
  for (const brief of friction.helpCenterBriefs.slice(0, 6)) {
    lines.push(
      `- [${brief.category}] ${brief.title} → ${brief.createPath}`,
    );
  }
  return lines.join("\n").slice(0, 20000);
}

/**
 * Combined conversion-leak packet for Rogue + admin diagnostic endpoints.
 */
export async function compileConversionLeakDiagnostics(opts?: {
  period?: ReportPeriod;
}): Promise<ConversionLeakDiagnostics> {
  const now = new Date();
  const period = opts?.period || "yearly";
  const periodStart = getPeriodStart(period, now).toISOString();
  const [funnel, friction] = await Promise.all([
    loadConversionFunnelDiagnostics(periodStart),
    extractChatFrictionFlags({ limit: 250, briefLimit: 6 }),
  ]);

  return {
    compiledAt: now.toISOString(),
    period,
    periodStart,
    funnel,
    frictionFlags: friction.frictionFlags,
    insightRowsLogged: friction.insightRowsLogged,
    communicationsSampled: friction.communicationsSampled,
    helpCenterBriefs: friction.helpCenterBriefs,
    markdownContext: funnelDiagnosticsMarkdown(funnel, friction),
  };
}

async function moduleAnalytics(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("analytics", "Analytics", "growth", [
    "analytics_events",
    "launch_signups",
    "bookings",
  ]);
  const funnel = await loadConversionFunnelDiagnostics(since);
  const traffic = funnel.stages.find((s) => s.id === "traffic_pageview");
  const signups = funnel.stages.find((s) => s.id === "account_signup");
  const initiated = funnel.stages.find((s) => s.id === "booking_initiated");
  const completed = funnel.stages.find((s) => s.id === "booking_completed");
  const ok =
    funnel.totalEventsSampled > 0 ||
    funnel.groundTruthSignups > 0 ||
    funnel.groundTruthBookings > 0 ||
    funnel.errors.length === 0;
  return finalize(
    snap,
    ok,
    funnel.leakSummary,
    {
      events: funnel.totalEventsSampled,
      launchSignups: funnel.groundTruthSignups,
      bookings: funnel.groundTruthBookings,
      funnelTraffic: traffic?.count ?? 0,
      funnelSignups: signups?.count ?? 0,
      funnelBookingInitiated: initiated?.count ?? 0,
      funnelBookingCompleted: completed?.count ?? 0,
      largestDropOffFrom: funnel.largestDropOff?.from || null,
      largestDropOffTo: funnel.largestDropOff?.to || null,
      largestDropOffCount: funnel.largestDropOff?.count ?? 0,
      largestDropOffPct: funnel.largestDropOff?.pct ?? 0,
      signupToBookPct: pct(completed?.count || 0, signups?.count || 0),
    },
    [
      `${number(funnel.totalEventsSampled)} events sampled`,
      `${number(signups?.count || 0)} signups → ${number(completed?.count || 0)} bookings`,
      funnel.largestDropOff
        ? `Drop-off ${FUNNEL_STAGE_LABELS[funnel.largestDropOff.from]}→${FUNNEL_STAGE_LABELS[funnel.largestDropOff.to]} (−${number(funnel.largestDropOff.count)})`
        : "No drop-off computed",
    ],
    funnel.errors,
  );
}

async function moduleChatInsights(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("chat_insights", "Chat Insights", "growth", [
    "global_chat_insights",
  ]);
  const extracted = await extractChatFrictionFlags({ limit: 250, briefLimit: 6 });
  const topFriction = extracted.frictionFlags.slice(0, 6);
  return finalize(
    snap,
    extracted.ok,
    extracted.ok
      ? `${number(extracted.communicationsSampled)} communications · ${number(extracted.frictionFlags.length)} friction flags · ${number(extracted.helpCenterBriefs.length)} Help briefs ready.`
      : "Chat insights unavailable.",
    {
      insightRowsLogged: extracted.insightRowsLogged,
      insightRows: extracted.insightRowsLogged,
      communications: extracted.communicationsSampled,
      frictionFlags: extracted.frictionFlags.length,
      frictionCommunications: topFriction.reduce((sum, row) => sum + row.frequency, 0),
      convertedArticles: extracted.frictionFlags.filter((flag) => flag.isConverted)
        .length,
      helpBriefsReady: extracted.helpCenterBriefs.length,
      frictionSource: extracted.sources[0] || null,
    },
    [
      `${number(extracted.communicationsSampled)} communications`,
      `${number(extracted.frictionFlags.length)} friction flags`,
      `${number(extracted.helpCenterBriefs.length)} Help briefs`,
      ...topFriction.slice(0, 3).map(
        (flag) => `Friction: ${flag.frictionSnippet.slice(0, 80)}`,
      ),
    ],
    extracted.errors,
  );
}

/* ----------------------------- FINANCIALS ----------------------------- */

async function moduleFinancialOverview(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase(
    "financial_overview",
    "Financial Overview",
    "financials",
    ["bookings", "payments", "booking_payments", "payouts", "guru_payouts"],
  );
  const [bookings, paymentsRaw, payoutsRaw] = await Promise.all([
    safeSelectCascade([
      {
        table: "bookings",
        columns:
          "id,status,total_amount,amount,subtotal_amount,customer_total_amount,created_at",
        limit: 500,
        sinceIso: since,
      },
      {
        table: "bookings",
        columns: "id,status,total_amount,created_at",
        limit: 500,
        sinceIso: since,
      },
    ]),
    safeSelectCascade([
      {
        table: "payments",
        columns: "id,status,amount,fee_amount,processing_fee,created_at",
        limit: 400,
        sinceIso: since,
      },
      {
        table: "booking_payments",
        columns:
          "id,status,amount,amount_cents,fee_amount,marketplace_support_cents,created_at",
        limit: 400,
        sinceIso: since,
      },
      {
        table: "booking_payments",
        columns: "id,status,amount_cents,provider,currency,created_at",
        limit: 400,
        sinceIso: since,
      },
    ]),
    safeSelectCascade([
      {
        table: "payouts",
        columns: "id,status,amount,payout_amount,amount_cents,created_at",
        limit: 300,
        sinceIso: since,
      },
      {
        table: "guru_payouts",
        columns: "id,status,amount,amount_cents,created_at",
        limit: 300,
        sinceIso: since,
      },
      {
        table: "guru_payouts",
        columns:
          "id,payout_status,net_amount,gross_amount,created_at,guru_id,booking_id",
        limit: 300,
        sinceIso: since,
      },
    ]),
  ]);
  const paymentRows = normalizePaymentRows(paymentsRaw.rows);
  const payoutRows = normalizePayoutRows(payoutsRaw.rows);
  const gmv = sumField(bookings.rows, [
    "total_amount",
    "subtotal_amount",
    "customer_total_amount",
    "amount",
  ]);
  const collected = sumField(
    paymentRows.filter((r) =>
      ["paid", "succeeded", "captured", "complete"].includes(statusOf(r)),
    ),
    ["amount", "total", "amount_cents"],
  );
  const fees = sumField(paymentRows, [
    "fee_amount",
    "processing_fee",
    "marketplace_support_cents",
  ]);
  const payoutTotal = sumField(payoutRows, [
    "amount",
    "payout_amount",
    "net_amount",
    "gross_amount",
    "amount_cents",
  ]);
  const platformRevenue = Math.max(0, collected - payoutTotal - fees);
  const takeRate = gmv > 0 ? (platformRevenue / gmv) * 100 : 0;
  return finalize(
    snap,
    bookings.ok || paymentsRaw.ok || payoutsRaw.ok,
    `GMV ${money(gmv)} · collected ${money(collected)} · payouts ${money(payoutTotal)} · est. take-rate ${takeRate.toFixed(1)}%.`,
    {
      gmv,
      collected,
      fees,
      payouts: payoutTotal,
      platformRevenue,
      takeRatePercent: Number(takeRate.toFixed(1)),
      paymentsSource: paymentsRaw.tableUsed,
      payoutsSource: payoutsRaw.tableUsed,
    },
    [
      `GMV ${money(gmv)}`,
      `Collected ${money(collected)}`,
      `Take-rate ${takeRate.toFixed(1)}%`,
    ],
    [bookings, paymentsRaw, payoutsRaw].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleBanking(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("banking", "Banking", "financials", [
    "bank_transactions",
    "plaid_accounts",
  ]);
  const [txns, accounts] = await Promise.all([
    safeSelect(
      "bank_transactions",
      "id,amount,status,created_at,posted_at,category",
      300,
    ),
    safeSelect("plaid_accounts", "id,status,current_balance,available_balance", 50),
  ]);
  const balance = sumField(accounts.rows, [
    "current_balance",
    "available_balance",
    "balance",
  ]);
  const needsReview = countWhere(txns.rows, (r) =>
    ["needs_review", "review", "unmatched"].includes(statusOf(r)),
  );
  return finalize(
    snap,
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
    ["stripe_transactions", "stripe_balance_transactions", "payments", "booking_payments"],
  );
  const [stripeTx, balanceTx, payments] = await Promise.all([
    safeSelect(
      "stripe_transactions",
      "id,amount,fee,status,created_at,type",
      300,
      since,
    ),
    safeSelect(
      "stripe_balance_transactions",
      "id,amount,fee,status,created_at,type",
      300,
      since,
    ),
    safeSelectCascade([
      {
        table: "payments",
        columns: "id,amount,fee_amount,amount_cents,status,created_at",
        limit: 300,
        sinceIso: since,
      },
      {
        table: "booking_payments",
        columns:
          "id,amount,amount_cents,fee_amount,marketplace_support_cents,status,created_at",
        limit: 300,
        sinceIso: since,
      },
      {
        table: "booking_payments",
        columns: "id,amount_cents,status,provider,currency,created_at",
        limit: 300,
        sinceIso: since,
      },
    ]),
  ]);
  const paymentRows = normalizePaymentRows(payments.rows);
  const rows = stripeTx.ok
    ? stripeTx.rows
    : balanceTx.ok
      ? balanceTx.rows
      : paymentRows;
  const volume = sumField(rows, ["amount", "total", "amount_cents"]);
  const fees = sumField(rows, [
    "fee",
    "fee_amount",
    "marketplace_support_cents",
  ]);
  const disputes = countWhere(
    rows,
    (r) =>
      statusOf(r).includes("dispute") || asString(r.type).includes("dispute"),
  );
  return finalize(
    snap,
    stripeTx.ok || balanceTx.ok || payments.ok,
    `Stripe/payment volume ${money(volume)} · fees ${money(fees)} · disputes ${number(disputes)}.`,
    {
      volume,
      fees,
      disputes,
      rows: rows.length,
      source: stripeTx.ok
        ? "stripe_transactions"
        : balanceTx.ok
          ? "stripe_balance_transactions"
          : payments.tableUsed,
    },
    [`${money(volume)} volume`, `${money(fees)} fees`, `${number(disputes)} disputes`],
    [stripeTx, balanceTx, payments].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleProfitLoss(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("profit_loss", "Profit & Loss", "financials", [
    "bookings",
    "payments",
    "payouts",
    "admin_growth_marketing_expenses",
  ]);
  const overview = await moduleFinancialOverview(since);
  const expenses = await safeSelect(
    "admin_growth_marketing_expenses",
    "id,amount,created_at",
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
    "plaid_accounts",
    "payouts",
    "referral_rewards",
  ]);
  const [accounts, payouts, rewards] = await Promise.all([
    safeSelect("plaid_accounts", "id,current_balance,available_balance", 50),
    safeSelect("payouts", "id,amount,status", 300),
    safeSelect("referral_rewards", "id,amount,status", 300),
  ]);
  const assets = sumField(accounts.rows, [
    "current_balance",
    "available_balance",
  ]);
  const liabilities =
    sumField(
      payouts.rows.filter((r) =>
        ["pending", "processing", "owed"].includes(statusOf(r)),
      ),
      ["amount"],
    ) +
    sumField(
      rewards.rows.filter((r) =>
        ["pending", "owed", "review"].includes(statusOf(r)),
      ),
      ["amount"],
    );
  const equity = assets - liabilities;
  return finalize(
    snap,
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
    "payments",
    "booking_payments",
    "payouts",
    "guru_payouts",
    "bank_transactions",
  ]);
  const [payments, payouts, bank] = await Promise.all([
    safeSelectCascade([
      {
        table: "payments",
        columns: "id,amount,amount_cents,status,created_at",
        limit: 400,
        sinceIso: since,
      },
      {
        table: "booking_payments",
        columns: "id,amount,amount_cents,status,created_at",
        limit: 400,
        sinceIso: since,
      },
      {
        table: "booking_payments",
        columns: "id,amount_cents,status,created_at",
        limit: 400,
        sinceIso: since,
      },
    ]),
    safeSelectCascade([
      {
        table: "payouts",
        columns: "id,amount,payout_amount,amount_cents,status,created_at",
        limit: 300,
        sinceIso: since,
      },
      {
        table: "guru_payouts",
        columns: "id,amount,amount_cents,status,created_at",
        limit: 300,
        sinceIso: since,
      },
      {
        table: "guru_payouts",
        columns:
          "id,payout_status,net_amount,gross_amount,created_at,guru_id,booking_id",
        limit: 300,
        sinceIso: since,
      },
    ]),
    safeSelect("bank_transactions", "id,amount,status,created_at", 300, since),
  ]);
  const paymentRows = normalizePaymentRows(payments.rows);
  const payoutRows = normalizePayoutRows(payouts.rows);
  const inflow = sumField(
    paymentRows.filter((r) =>
      ["paid", "succeeded", "captured"].includes(statusOf(r)),
    ),
    ["amount", "amount_cents"],
  );
  const outflow = sumField(payoutRows, [
    "amount",
    "payout_amount",
    "net_amount",
    "gross_amount",
    "amount_cents",
  ]);
  const net = inflow - outflow;
  return finalize(
    snap,
    payments.ok || payouts.ok || bank.ok,
    `Cash velocity: in ${money(inflow)} · out ${money(outflow)} · net ${money(net)}.`,
    {
      inflow,
      outflow,
      net,
      bankTransactions: bank.count,
      paymentsSource: payments.tableUsed,
      payoutsSource: payouts.tableUsed,
    },
    [`In ${money(inflow)}`, `Out ${money(outflow)}`, `Net ${money(net)}`],
    [payments, payouts, bank].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleGeneralLedger(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("general_ledger", "General Ledger", "financials", [
    "general_ledger_entries",
    "commission_ledger",
    "payments",
  ]);
  const [ledger, commissions, payments] = await Promise.all([
    safeSelect(
      "general_ledger_entries",
      "id,account_type,amount,created_at",
      300,
      since,
    ),
    safeSelect("commission_ledger", "id,amount,created_at", 200, since),
    safeSelect("payments", "id,amount,created_at", 200, since),
  ]);
  return finalize(
    snap,
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
    "bank_transactions",
    "payments",
    "stripe_transactions",
  ]);
  const [bank, payments, stripe] = await Promise.all([
    safeSelect("bank_transactions", "id,status,amount", 300),
    safeSelect("payments", "id,status,amount", 300),
    safeSelect("stripe_transactions", "id,status,amount", 300),
  ]);
  const unmatched = countWhere(bank.rows, (r) =>
    ["unmatched", "needs_review", "review"].includes(statusOf(r)),
  );
  return finalize(
    snap,
    bank.ok || payments.ok || stripe.ok,
    `${number(unmatched)} bank rows need reconciliation review.`,
    {
      bankRows: bank.count,
      paymentRows: payments.count,
      stripeRows: stripe.count,
      unmatched,
    },
    [`${number(unmatched)} unmatched/review`],
    [bank, payments, stripe].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleProForma(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("pro_forma", "Pro Forma", "financials", [
    "bookings",
    "payments",
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
    "tax_liabilities",
    "gurus",
    "bookings",
  ]);
  const [tax, gurus, bookings] = await Promise.all([
    safeSelect("tax_liabilities", "id,amount,status,created_at", 200),
    safeHeadCount("gurus"),
    safeSelect("bookings", "id,tax_amount,total_amount", 300),
  ]);
  const taxPool =
    sumField(tax.rows, ["amount", "tax_amount"]) ||
    sumField(bookings.rows, ["tax_amount"]);
  return finalize(
    snap,
    tax.ok || gurus.ok || bookings.ok,
    `Tax pool signals ${money(taxPool)} · ${number(gurus.count)} providers potentially 1099-relevant.`,
    {
      taxPool,
      providers: gurus.count,
      taxRows: tax.count,
    },
    [`${money(taxPool)} tax pool`, `${number(gurus.count)} providers`],
    [tax, gurus, bookings].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function moduleCommissions(): Promise<ModuleSnapshot> {
  const snap = snapshotBase("commissions", "Commissions", "financials", [
    "commission_ledger",
    "partner_commissions",
  ]);
  const [ledger, partners] = await Promise.all([
    safeSelect("commission_ledger", "id,amount,status,created_at", 400),
    safeSelect("partner_commissions", "id,amount,status,created_at", 300),
  ]);
  const outstanding = sumField(
    [...ledger.rows, ...partners.rows].filter((r) =>
      ["pending", "owed", "accrued", "open"].includes(statusOf(r)),
    ),
    ["amount", "commission_amount"],
  );
  return finalize(
    snap,
    ledger.ok || partners.ok,
    `Outstanding commissions ≈ ${money(outstanding)}.`,
    {
      ledgerRows: ledger.count,
      partnerCommissionRows: partners.count,
      outstanding,
    },
    [`${money(outstanding)} outstanding`],
    [ledger, partners].filter((r) => !r.ok).map((r) => r.message),
  );
}

async function modulePayouts(since: string): Promise<ModuleSnapshot> {
  const snap = snapshotBase("payouts", "Payouts", "financials", [
    "payouts",
    "guru_payouts",
  ]);
  const payouts = await safeSelectCascade([
    {
      table: "payouts",
      columns:
        "id,amount,payout_amount,amount_cents,status,created_at,scheduled_for",
      limit: 400,
      sinceIso: since,
    },
    {
      table: "guru_payouts",
      columns: "id,amount,amount_cents,status,created_at",
      limit: 400,
      sinceIso: since,
    },
    {
      table: "guru_payouts",
      columns:
        "id,payout_status,net_amount,gross_amount,created_at,guru_id,booking_id",
      limit: 400,
      sinceIso: since,
    },
  ]);
  const rows = normalizePayoutRows(payouts.rows);
  const amountKeys = [
    "amount",
    "payout_amount",
    "net_amount",
    "gross_amount",
    "amount_cents",
  ];
  const pending = rows.filter((r) =>
    ["pending", "processing", "scheduled", "queued"].includes(statusOf(r)),
  );
  const paid = rows.filter((r) =>
    ["paid", "complete", "completed", "sent", "released"].includes(statusOf(r)),
  );
  return finalize(
    snap,
    payouts.ok,
    `${number(pending.length)} payouts pending (${money(sumField(pending, amountKeys))}) · ${number(paid.length)} paid.`,
    {
      pendingCount: pending.length,
      pendingAmount: sumField(pending, amountKeys),
      paidCount: paid.length,
      paidAmount: sumField(paid, amountKeys),
      source: payouts.tableUsed,
    },
    [
      `${number(pending.length)} pending`,
      `${money(sumField(pending, amountKeys))} queued`,
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
    safeSelectCascade([
      {
        table: "admin_audit_logs",
        columns: "id,action,created_at,actor_email,entity_type,target_type",
        limit: 300,
        sinceIso: since,
      },
      {
        table: "admin_audit_logs",
        columns: "id,action,created_at,actor_email,target_type",
        limit: 300,
        sinceIso: since,
      },
      {
        table: "admin_audit_logs",
        columns: "id,action,created_at,actor_email",
        limit: 300,
        sinceIso: since,
      },
    ]),
    // Rogue name: financial_audit_logs. Falls back to admin_audit_logs when
    // the finance-specific table is missing from the PostgREST schema cache.
    safeSelectCascade([
      {
        table: "financial_audit_logs",
        columns: "id,action,created_at,actor_email,entity_type,target_type",
        limit: 200,
        sinceIso: since,
      },
      {
        table: "financial_audit_logs",
        columns: "id,action,created_at,actor_email,target_type",
        limit: 200,
        sinceIso: since,
      },
      {
        table: "financial_audit_logs",
        columns: "id,action,created_at,actor_email",
        limit: 200,
        sinceIso: since,
      },
      {
        table: "admin_audit_logs",
        columns: "id,action,created_at,actor_email,entity_type,target_type,area",
        limit: 200,
        sinceIso: since,
      },
      {
        table: "admin_audit_logs",
        columns: "id,action,created_at,actor_email,target_type,area",
        limit: 200,
        sinceIso: since,
      },
      {
        table: "admin_audit_logs",
        columns: "id,action,created_at,actor_email",
        limit: 200,
        sinceIso: since,
      },
    ]),
  ]);
  return finalize(
    snap,
    adminLogs.ok || financeLogs.ok,
    `${number(adminLogs.count)} admin audit events · ${number(financeLogs.count)} financial audit events in period.`,
    {
      adminAuditEvents: adminLogs.count,
      financialAuditEvents: financeLogs.count,
      adminAuditSource: adminLogs.tableUsed,
      financialAuditSource: financeLogs.tableUsed,
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
  "social_platform_metrics",
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
  pet_parents: [
    "pet parent",
    "customer",
    "ltv",
    "retention",
    "onboarding funnel",
    "customer intelligence",
    "lifetime value",
    "repeat rate",
    "social customers",
    "social signups",
    "social revenue",
    "social bookings",
    "social clicks",
  ],
  gurus: ["guru", "provider", "capacity", "rating", "vetting"],
  ambassadors: ["ambassador", "affiliate", "influencer"],
  ambassador_ledger: ["ambassador ledger", "affiliate payout", "commission queue"],
  human_resources: ["hr", "human resources", "support ticket", "hiring"],
  sitguru_university: ["university", "training", "certification", "quiz", "academy"],
  trust_safety: ["trust", "safety", "background check", "fraud", "compliance"],
  messages: ["message", "inbox", "sla", "unread", "support lag"],
  sales_marketing: ["sales", "marketing", "campaign", "promo", "cac", "acquisition"],
  social_platform_metrics: [
    "social",
    "follower",
    "instagram",
    "tiktok",
    "youtube",
    "facebook",
    "twitter",
    "social media",
    "rogue followers",
    "delilah",
    "sitguruofficial",
  ],
  growth_referrals: ["referral", "invite", "bonus", "growth & referrals", "pawperks"],
  programs: ["program", "veteran", "military", "student hire", "community hire", "skillbridge"],
  partners: ["partner", "clinic", "b2b", "corporate"],
  analytics: ["analytics", "mom", "month-over-month", "cohort", "trend", "funnel", "conversion", "drop-off", "dropoff", "pageview", "signup leak"],
  chat_insights: ["chat insight", "friction", "intent", "ticket classification", "help brief", "help center", "insight_rows_logged"],
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
      "social_platform_metrics",
      "growth_referrals",
      "programs",
      "partners",
      "analytics",
      "chat_insights",
      "ambassadors",
      "pet_parents",
    ];
  }
  if (
    presetKey === "conversion_leak" ||
    presetKey === "conversion-leak" ||
    presetKey === "funnel_diagnostics" ||
    presetKey === "funnel-diagnostics"
  ) {
    return ["analytics", "chat_insights", "pet_parents", "bookings", "sales_marketing"];
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
      case "social_platform_metrics":
        return await moduleSocialPlatformMetrics();
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
