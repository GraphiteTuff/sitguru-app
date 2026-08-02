import { supabaseAdmin } from "@/lib/supabase/admin";

export type SalesMarketingSourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

export type SalesMarketingMetrics = {
  signupLeads: number;
  referrals: number;
  outreachContacts: number;
  tasksTotal: number;
  tasksAwaitingCeo: number;
  tasksBlockedOrHelp: number;
  weeklyReviews: number;
  monthlyReviews: number;
  contentItems: number;
  proofItems: number;
  campaigns: number;
  launchSignups: number;
  partnerApplications: number;
  ambassadorLeads: number;
};

export type SalesMarketingRecentItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  date: string | null;
  href: string;
};

export type SalesMarketingDashboardData = {
  metrics: SalesMarketingMetrics;
  sourceHealth: SalesMarketingSourceHealth[];
  recentLeads: SalesMarketingRecentItem[];
  reviewQueue: SalesMarketingRecentItem[];
  recentOutreach: SalesMarketingRecentItem[];
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
    asString(row.task_date) ||
    asString(row.updated_at) ||
    asString(row.created_at) ||
    asString(row.contacted_at) ||
    asString(row.review_date) ||
    null
  );
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

async function safeFilteredCount(
  table: string,
  mode: "ceo_review" | "blocked_help",
): Promise<{ ok: boolean; count: number; message: string }> {
  try {
    let query = supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true });

    if (mode === "ceo_review") {
      query = query.in("status", ["CEO Review"]);
    } else {
      query = query.or(
        "needs_help.eq.true,status.in.(Blocked,Needs Follow-Up),ceo_review_status.in.(Needs help,Needs Follow-Up)",
      );
    }

    const { count, error } = await query;
    if (error) {
      return {
        ok: false,
        count: 0,
        message: error.message || `${table} filter unavailable`,
      };
    }
    return {
      ok: true,
      count: count ?? 0,
      message: `${table} filter connected`,
    };
  } catch (error) {
    return {
      ok: false,
      count: 0,
      message: error instanceof Error ? error.message : `${table} filter unavailable`,
    };
  }
}

export async function getSalesMarketingDashboardData(): Promise<SalesMarketingDashboardData> {
  const [
    tasksResult,
    weeklyResult,
    monthlyResult,
    outreachResult,
    contentResult,
    proofResult,
    campaignsResult,
    leadsResult,
    referralsResult,
    launchResult,
    partnersResult,
    ambassadorLeadsResult,
    ceoReviewCount,
    blockedCount,
  ] = await Promise.all([
    safeSelect(
      "admin_marketing_tasks",
      "id, primary_task, owner_name, status, task_date, needs_help, ceo_review_status, sort_order, created_at, updated_at",
      200,
    ),
    safeSelect("admin_marketing_weekly_reviews", "id, created_at, updated_at, status, week_label, title", 100),
    safeSelect("admin_marketing_monthly_reviews", "id, created_at, updated_at, status, month_label, title", 100),
    safeSelect(
      "admin_marketing_outreach_contacts",
      "id, contact_name, full_name, business_name, email, status, created_at, updated_at, market_area",
      200,
    ),
    safeSelect("admin_marketing_content_calendar", "id, created_at, updated_at, status, title", 100),
    safeSelect("admin_marketing_proof_library", "id, created_at, updated_at, status, title", 100),
    safeSelect("admin_marketing_campaigns", "id, created_at, updated_at, status, name, title", 100),
    safeSelect(
      "admin_marketing_signup_leads",
      "id, first_name, last_name, full_name, email, status, created_at, updated_at, lead_type, priority_level",
      200,
    ),
    safeSelect("admin_marketing_referrals", "*", 200),
    safeSelect("launch_signups", "id, created_at", 50),
    safeSelect("partner_applications", "id, created_at, status", 50),
    safeSelect("ambassador_leads", "id, created_at, status", 50),
    safeFilteredCount("admin_marketing_tasks", "ceo_review"),
    safeFilteredCount("admin_marketing_tasks", "blocked_help"),
  ]);

  const metrics: SalesMarketingMetrics = {
    signupLeads: leadsResult.count,
    referrals: referralsResult.count,
    outreachContacts: outreachResult.count,
    tasksTotal: tasksResult.count,
    tasksAwaitingCeo: ceoReviewCount.count,
    tasksBlockedOrHelp: blockedCount.count,
    weeklyReviews: weeklyResult.count,
    monthlyReviews: monthlyResult.count,
    contentItems: contentResult.count,
    proofItems: proofResult.count,
    campaigns: campaignsResult.count,
    launchSignups: launchResult.count,
    partnerApplications: partnersResult.count,
    ambassadorLeads: ambassadorLeadsResult.count,
  };

  const sourceHealth: SalesMarketingSourceHealth[] = [
    {
      id: "admin_marketing_tasks",
      label: "Marketing Tasks",
      ok: tasksResult.ok,
      rowCount: tasksResult.count,
      message: tasksResult.message,
    },
    {
      id: "admin_marketing_signup_leads",
      label: "Signup Leads",
      ok: leadsResult.ok,
      rowCount: leadsResult.count,
      message: leadsResult.message,
    },
    {
      id: "admin_marketing_referrals",
      label: "Field Referrals",
      ok: referralsResult.ok,
      rowCount: referralsResult.count,
      message: referralsResult.message,
    },
    {
      id: "admin_marketing_outreach_contacts",
      label: "Outreach Contacts",
      ok: outreachResult.ok,
      rowCount: outreachResult.count,
      message: outreachResult.message,
    },
    {
      id: "admin_marketing_campaigns",
      label: "Campaigns",
      ok: campaignsResult.ok,
      rowCount: campaignsResult.count,
      message: campaignsResult.message,
    },
    {
      id: "admin_marketing_content_calendar",
      label: "Content Calendar",
      ok: contentResult.ok,
      rowCount: contentResult.count,
      message: contentResult.message,
    },
  ];

  const recentLeads = [...leadsResult.data]
    .sort(
      (a, b) =>
        new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime(),
    )
    .slice(0, 6)
    .map((row, index) => {
      const name =
        getText(row, ["full_name"]) ||
        [getText(row, ["first_name"]), getText(row, ["last_name"])]
          .filter(Boolean)
          .join(" ") ||
        "Lead";
      return {
        id: getText(row, ["id"], `lead-${index}`),
        title: name,
        subtitle:
          getText(row, ["email"]) ||
          getText(row, ["lead_type"], "Signup lead"),
        status: getText(row, ["status", "priority_level"], "New"),
        date: getDate(row),
        href: "/admin/sales-marketing/signup-leads",
      };
    });

  const reviewQueue = [...tasksResult.data]
    .filter((row) => {
      const status = getText(row, ["status"]).toLowerCase();
      const ceo = getText(row, ["ceo_review_status"]).toLowerCase();
      return (
        status === "ceo review" ||
        status === "blocked" ||
        status === "waiting" ||
        status === "needs follow-up" ||
        row.needs_help === true ||
        ceo.includes("needs")
      );
    })
    .sort(
      (a, b) =>
        new Date(getDate(a) || 0).getTime() - new Date(getDate(b) || 0).getTime(),
    )
    .slice(0, 6)
    .map((row, index) => {
      const status = row.needs_help
        ? "Needs Help"
        : getText(row, ["status", "ceo_review_status"], "Review");
      return {
        id: getText(row, ["id"], `task-${index}`),
        title: getText(row, ["primary_task"], "Marketing task"),
        subtitle: getText(row, ["owner_name"], "Unassigned"),
        status,
        date: getDate(row),
        href: "/admin/sales-marketing/ceo-review",
      };
    });

  const recentOutreach = [...outreachResult.data]
    .sort(
      (a, b) =>
        new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime(),
    )
    .slice(0, 6)
    .map((row, index) => ({
      id: getText(row, ["id"], `outreach-${index}`),
      title:
        getText(row, ["contact_name", "full_name", "business_name"]) ||
        "Outreach contact",
      subtitle:
        getText(row, ["email"]) ||
        getText(row, ["market_area"], "Local market"),
      status: getText(row, ["status"], "New"),
      date: getDate(row),
      href: "/admin/sales-marketing/outreach",
    }));

  return {
    metrics,
    sourceHealth,
    recentLeads,
    reviewQueue,
    recentOutreach,
    isLive: sourceHealth.some((source) => source.ok),
  };
}
