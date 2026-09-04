import { supabaseAdmin } from "@/lib/supabase/admin";
import { weekOverWeekTrend, type KpiTrend } from "@/lib/sitguru/kpi-trend";

export type InsightsSourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

export type InsightsMetrics = {
  insightRows: number;
  communications: number;
  frictionFlags: number;
  convertedArticles: number;
  openLeakVectors: number;
  homepageChannel: number;
  activeWalkChannel: number;
  adminSupportChannel: number;
  legacyHomepageInsights: number;
  helpArticles: number;
  supportCases: number;
  messages: number;
};

export type InsightsRecentItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  date: string | null;
  href: string;
};

export type InsightsDashboardData = {
  metrics: InsightsMetrics;
  sourceHealth: InsightsSourceHealth[];
  topFriction: InsightsRecentItem[];
  leakQueue: InsightsRecentItem[];
  recentConverted: InsightsRecentItem[];
  topCategory: string;
  topCategoryCount: number;
  isLive: boolean;
  trends: {
    communications: KpiTrend;
    frictionFlags: KpiTrend;
    openLeakVectors: KpiTrend;
    convertedArticles: KpiTrend;
    insightRows: KpiTrend;
    helpArticles: KpiTrend;
    supportCases: KpiTrend;
  };
};

type AnyRow = Record<string, unknown>;

type SafeResult = {
  data: AnyRow[];
  ok: boolean;
  message: string;
  count: number;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  if (typeof value === "number") return value === 1;
  return false;
}

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return fallback;
}

function getDate(row: AnyRow) {
  return (
    asString(row.updated_at) ||
    asString(row.converted_at) ||
    asString(row.created_at) ||
    null
  );
}

function channelLabel(channel: string) {
  if (channel === "HOMEPAGE_LEAD") return "Homepage Lead";
  if (channel === "ACTIVE_WALK") return "Active Walk";
  if (channel === "ADMIN_SUPPORT") return "Admin Support";
  return channel || "Channel";
}

async function safeSelect(
  table: string,
  columns = "*",
  limit = 500,
): Promise<SafeResult> {
  try {
    const { data, error, count } = await supabaseAdmin
      .from(table)
      .select(columns, { count: "exact" })
      .limit(limit);

    if (error) {
      return {
        data: [],
        ok: false,
        message: error.message || `${table} unavailable`,
        count: 0,
      };
    }

    const rows = Array.isArray(data) ? (data as unknown as AnyRow[]) : [];
    return {
      data: rows,
      ok: true,
      message: `${table} connected`,
      count: typeof count === "number" ? count : rows.length,
    };
  } catch (error) {
    return {
      data: [],
      ok: false,
      message: error instanceof Error ? error.message : `${table} unavailable`,
      count: 0,
    };
  }
}

function toInsightItem(row: AnyRow): InsightsRecentItem {
  const id = getText(row, ["insight_id", "id"], "insight");
  const question = getText(
    row,
    ["core_question_summary", "question", "summary"],
    "Insight",
  );
  const channel = getText(row, ["channel_source_enum", "channel"], "");
  const category = getText(row, ["ai_assigned_category", "category"], "");
  const tally = asNumber(row.frequency_tally_count);
  const converted = asBoolean(row.is_converted_to_article);
  const friction = asBoolean(row.is_friction_flag);
  const slug = getText(row, ["converted_article_slug"], "");

  return {
    id,
    title: question,
    subtitle: [channelLabel(channel), category, tally ? `${tally}×` : ""]
      .filter(Boolean)
      .join(" · "),
    status: converted ? "Converted" : friction ? "Friction" : "Open",
    date: getDate(row),
    href: converted && slug
      ? `/help/insights/${encodeURIComponent(slug)}`
      : "/admin/insights/chat",
  };
}

export async function getInsightsDashboardData(): Promise<InsightsDashboardData> {
  const [
    globalResult,
    homepageResult,
    helpResult,
    supportResult,
    messagesResult,
  ] = await Promise.all([
    safeSelect(
      "global_chat_insights",
      "insight_id, core_question_summary, ai_assigned_category, channel_source_enum, frequency_tally_count, is_converted_to_article, is_friction_flag, updated_at, created_at, converted_article_slug, converted_at",
      800,
    ),
    safeSelect(
      "homepage_chat_insights",
      "insight_id, core_question_summary, frequency_tally_count, is_converted_to_article, updated_at, created_at",
      200,
    ),
    safeSelect("help_center_articles", "id, slug, title, created_at, updated_at, status", 100),
    safeSelect("support_intake_cases", "id, status, created_at, updated_at", 100),
    safeSelect("messages", "id, created_at", 50),
  ]);

  const insights = globalResult.data;
  const communications = insights.reduce(
    (sum, row) => sum + asNumber(row.frequency_tally_count),
    0,
  );
  const frictionRows = insights.filter((row) => asBoolean(row.is_friction_flag));
  const frictionFlags = frictionRows.reduce(
    (sum, row) => sum + asNumber(row.frequency_tally_count),
    0,
  );
  const convertedRows = insights.filter((row) =>
    asBoolean(row.is_converted_to_article),
  );
  const leakRows = insights.filter(
    (row) =>
      !asBoolean(row.is_converted_to_article) &&
      asNumber(row.frequency_tally_count) >= 2,
  );

  const categoryCounts = new Map<string, number>();
  for (const row of insights) {
    const cat = getText(row, ["ai_assigned_category"], "General Inquiry");
    categoryCounts.set(
      cat,
      (categoryCounts.get(cat) || 0) + asNumber(row.frequency_tally_count),
    );
  }

  let topCategory = "—";
  let topCategoryCount = 0;
  for (const [cat, count] of categoryCounts) {
    if (count > topCategoryCount) {
      topCategory = cat;
      topCategoryCount = count;
    }
  }

  const countChannel = (channel: string) =>
    insights.filter(
      (row) => getText(row, ["channel_source_enum"]) === channel,
    ).length;

  const metrics: InsightsMetrics = {
    insightRows: globalResult.count,
    communications,
    frictionFlags,
    convertedArticles: convertedRows.length,
    openLeakVectors: leakRows.length,
    homepageChannel: countChannel("HOMEPAGE_LEAD"),
    activeWalkChannel: countChannel("ACTIVE_WALK"),
    adminSupportChannel: countChannel("ADMIN_SUPPORT"),
    legacyHomepageInsights: homepageResult.count,
    helpArticles: helpResult.count,
    supportCases: supportResult.count,
    messages: messagesResult.count,
  };

  const sortedByTally = [...insights].sort(
    (a, b) => asNumber(b.frequency_tally_count) - asNumber(a.frequency_tally_count),
  );
  const sortedFriction = [...frictionRows].sort(
    (a, b) => asNumber(b.frequency_tally_count) - asNumber(a.frequency_tally_count),
  );
  const sortedLeaks = [...leakRows].sort(
    (a, b) => asNumber(b.frequency_tally_count) - asNumber(a.frequency_tally_count),
  );
  const sortedConverted = [...convertedRows].sort((a, b) => {
    const dateA = new Date(getDate(a) || 0).getTime();
    const dateB = new Date(getDate(b) || 0).getTime();
    return dateB - dateA;
  });

  const sourceHealth: InsightsSourceHealth[] = [
    {
      id: "global_chat_insights",
      label: "Global Chat Insights",
      ok: globalResult.ok,
      rowCount: globalResult.count,
      message: globalResult.message,
    },
    {
      id: "homepage_chat_insights",
      label: "Legacy Homepage Insights",
      ok: homepageResult.ok,
      rowCount: homepageResult.count,
      message: homepageResult.message,
    },
    {
      id: "help_center_articles",
      label: "Help Center Articles",
      ok: helpResult.ok,
      rowCount: helpResult.count,
      message: helpResult.message,
    },
    {
      id: "support_intake_cases",
      label: "Support Intake Cases",
      ok: supportResult.ok,
      rowCount: supportResult.count,
      message: supportResult.message,
    },
    {
      id: "messages",
      label: "Messages",
      ok: messagesResult.ok,
      rowCount: messagesResult.count,
      message: messagesResult.message,
    },
  ];

  return {
    metrics,
    sourceHealth,
    topFriction: (sortedFriction.length ? sortedFriction : sortedByTally)
      .slice(0, 6)
      .map(toInsightItem),
    leakQueue: sortedLeaks.slice(0, 6).map(toInsightItem),
    recentConverted: sortedConverted.slice(0, 6).map(toInsightItem),
    topCategory,
    topCategoryCount,
    isLive: sourceHealth.some((item) => item.ok),
    trends: {
      communications: weekOverWeekTrend(insights.map(getDate)),
      frictionFlags: weekOverWeekTrend(frictionRows.map(getDate), {
        invert: true,
      }),
      openLeakVectors: weekOverWeekTrend(leakRows.map(getDate), {
        invert: true,
      }),
      convertedArticles: weekOverWeekTrend(convertedRows.map(getDate)),
      insightRows: weekOverWeekTrend(insights.map(getDate)),
      helpArticles: weekOverWeekTrend(helpResult.data.map(getDate)),
      supportCases: weekOverWeekTrend(supportResult.data.map(getDate), {
        invert: true,
      }),
    },
  };
}
