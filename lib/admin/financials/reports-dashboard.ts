import { supabaseAdmin } from "@/lib/supabase/admin";

export type FinancialReportsSourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

export type FinancialReportsMetrics = {
  savedReports: number;
  dailyPackages: number;
  weeklyPackages: number;
  exportHistory: number;
  overviewLive: boolean;
};

export type FinancialReportsRecentItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  date: string | null;
  href: string;
};

export type FinancialReportsDashboardData = {
  metrics: FinancialReportsMetrics;
  sourceHealth: FinancialReportsSourceHealth[];
  recentExports: FinancialReportsRecentItem[];
  isLive: boolean;
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

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return fallback;
}

function getDate(row: AnyRow) {
  return (
    asString(row.created_at) ||
    asString(row.updated_at) ||
    asString(row.generated_at) ||
    null
  );
}

async function safeSelect(
  table: string,
  columns = "*",
  limit = 200,
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

    const rows = Array.isArray(data) ? (data as AnyRow[]) : [];
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

function packageHref(row: AnyRow) {
  const id = getText(row, ["id"]);
  if (id) return `/admin/financials/exports/${encodeURIComponent(id)}`;
  const type = getText(row, ["package_type", "report_type", "type"]).toLowerCase();
  if (type.includes("weekly")) return "/admin/financials/reports/weekly";
  if (type.includes("custom")) return "/admin/financials/reports/custom";
  return "/admin/financials/reports/daily";
}

export async function getFinancialReportsDashboardData(): Promise<FinancialReportsDashboardData> {
  const [exportsResult, auditResult] = await Promise.all([
    safeSelect(
      "financial_export_history",
      "id, title, package_type, report_type, type, status, format, created_at, updated_at, generated_at, period_label, created_by",
      200,
    ),
    safeSelect(
      "admin_export_history",
      "id, title, package_type, report_type, type, status, format, created_at, updated_at, generated_at, period_label, created_by",
      100,
    ),
  ]);

  const exportRows = exportsResult.ok
    ? exportsResult.data
    : auditResult.ok
      ? auditResult.data
      : [];

  const dailyPackages = exportRows.filter((row) => {
    const blob = [
      getText(row, ["package_type"]),
      getText(row, ["report_type"]),
      getText(row, ["type"]),
      getText(row, ["title"]),
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes("daily");
  }).length;

  const weeklyPackages = exportRows.filter((row) => {
    const blob = [
      getText(row, ["package_type"]),
      getText(row, ["report_type"]),
      getText(row, ["type"]),
      getText(row, ["title"]),
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes("weekly");
  }).length;

  const sorted = [...exportRows].sort((a, b) => {
    const dateA = new Date(getDate(a) || 0).getTime();
    const dateB = new Date(getDate(b) || 0).getTime();
    return dateB - dateA;
  });

  const sourceHealth: FinancialReportsSourceHealth[] = [
    {
      id: "financial_export_history",
      label: "Financial Export History",
      ok: exportsResult.ok,
      rowCount: exportsResult.count,
      message: exportsResult.message,
    },
    {
      id: "admin_export_history",
      label: "Admin Export History",
      ok: auditResult.ok,
      rowCount: auditResult.count,
      message: auditResult.message,
    },
  ];

  return {
    metrics: {
      savedReports: exportRows.length,
      dailyPackages,
      weeklyPackages,
      exportHistory: exportsResult.ok ? exportsResult.count : auditResult.count,
      overviewLive: exportsResult.ok || auditResult.ok,
    },
    sourceHealth,
    recentExports: sorted.slice(0, 6).map((row) => {
      const title =
        getText(row, ["title", "package_type", "report_type"], "Export package");
      const format = getText(row, ["format"], "package");
      const period = getText(row, ["period_label"], "");
      const status = getText(row, ["status"], "saved");

      return {
        id: getText(row, ["id"], `${title}-${getDate(row)}`),
        title,
        subtitle: [format.toUpperCase(), period].filter(Boolean).join(" · "),
        status: status || "Saved",
        date: getDate(row),
        href: packageHref(row),
      };
    }),
    isLive: sourceHealth.some((item) => item.ok),
  };
}
