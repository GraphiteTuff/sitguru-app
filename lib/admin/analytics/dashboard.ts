import { supabaseAdmin } from "@/lib/supabase/admin";
import { asAnyRows } from "@/lib/supabase/as-rows";

export type AnalyticsSourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

export type AnalyticsMetrics = {
  events: number;
  bookings: number;
  completedBookings: number;
  gurus: number;
  launchSignups: number;
  ambassadorLeads: number;
  ambassadors: number;
  pets: number;
  chatInsights: number;
  growthCampaigns: number;
  referralCodes: number;
  programApplications: number;
};

export type AnalyticsRecentItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  date: string | null;
  href: string;
};

export type AnalyticsDashboardData = {
  metrics: AnalyticsMetrics;
  sourceHealth: AnalyticsSourceHealth[];
  recentEvents: AnalyticsRecentItem[];
  recentBookings: AnalyticsRecentItem[];
  recentLeads: AnalyticsRecentItem[];
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
    asString(row.booking_date) ||
    asString(row.start_time) ||
    null
  );
}

function getStatus(row: AnyRow) {
  return getText(row, ["status", "booking_status", "event_type"], "new")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function readableStatus(status: string) {
  if (!status) return "New";
  return status
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function isCompletedBooking(row: AnyRow) {
  const status = getStatus(row);
  return (
    status === "completed" ||
    status === "complete" ||
    status === "paid" ||
    status === "confirmed"
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

    const rows = asAnyRows(data);
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

function toEventItem(row: AnyRow): AnalyticsRecentItem {
  const eventName = getText(row, ["event_name", "name"], "Tracked event");
  const source = getText(row, ["source", "role"], "");
  const pagePath = getText(row, ["page_path", "path"], "");
  const id = getText(row, ["id"], `${eventName}-${getDate(row)}`);

  return {
    id,
    title: eventName,
    subtitle: [source, pagePath].filter(Boolean).join(" · ") || "analytics_events",
    status: readableStatus(getStatus(row) || getText(row, ["event_type"], "event")),
    date: getDate(row),
    href: "/admin/analytics/overview",
  };
}

function toBookingItem(row: AnyRow): AnalyticsRecentItem {
  const service = getText(
    row,
    ["service_name", "service", "service_type", "title"],
    "Booking",
  );
  const market = [
    getText(row, ["city", "customer_city", "location_city"]),
    getText(row, ["state", "customer_state", "location_state"]),
  ]
    .filter(Boolean)
    .join(", ");
  const id = getText(row, ["id"], `${service}-${getDate(row)}`);
  const status = getStatus(row);

  return {
    id,
    title: service,
    subtitle: market || "Marketplace booking",
    status: readableStatus(status),
    date: getDate(row),
    href: id ? `/admin/bookings?id=${encodeURIComponent(id)}` : "/admin/bookings",
  };
}

function toLeadItem(row: AnyRow): AnalyticsRecentItem {
  const name = getText(
    row,
    ["full_name", "display_name", "name", "lead_name"],
    "Lead",
  );
  const email = getText(row, ["email", "lead_email"], "");
  const program = getText(row, ["program", "program_interest", "source"], "");
  const id = getText(row, ["id"], `${name}-${email}`);

  return {
    id,
    title: name,
    subtitle: [program, email].filter(Boolean).join(" · "),
    status: readableStatus(getStatus(row)),
    date: getDate(row),
    href: id
      ? `/admin/ambassador-leads/${encodeURIComponent(id)}`
      : "/admin/ambassador-leads",
  };
}

export async function getAnalyticsDashboardData(): Promise<AnalyticsDashboardData> {
  const [
    eventsResult,
    bookingsResult,
    gurusResult,
    launchResult,
    leadsResult,
    ambassadorsResult,
    petsResult,
    insightsResult,
    campaignsResult,
    referralCodesResult,
    applicationsResult,
  ] = await Promise.all([
    safeSelect(
      "analytics_events",
      "id, event_name, event_type, source, role, page_path, created_at",
      200,
    ),
    safeSelect(
      "bookings",
      "id, status, service_name, service, service_type, city, state, customer_city, customer_state, created_at, booking_date, start_time",
      200,
    ),
    safeSelect("gurus", "id, created_at, status", 100),
    safeSelect("launch_signups", "id, created_at, status", 100),
    safeSelect(
      "ambassador_leads",
      "id, full_name, name, email, program, program_interest, source, status, created_at, updated_at",
      200,
    ),
    safeSelect("ambassadors", "id, status, created_at", 100),
    safeSelect("pets", "id, created_at", 50),
    safeSelect("global_chat_insights", "insight_id, updated_at, created_at", 50),
    safeSelect("growth_campaigns", "id, created_at, status", 50),
    safeSelect("referral_codes", "id, created_at, status", 50),
    safeSelect("program_applications", "id, created_at, status", 50),
  ]);

  const completedBookings = bookingsResult.data.filter(isCompletedBooking).length;

  const metrics: AnalyticsMetrics = {
    events: eventsResult.count,
    bookings: bookingsResult.count,
    completedBookings,
    gurus: gurusResult.count,
    launchSignups: launchResult.count,
    ambassadorLeads: leadsResult.count,
    ambassadors: ambassadorsResult.count,
    pets: petsResult.count,
    chatInsights: insightsResult.count,
    growthCampaigns: campaignsResult.count,
    referralCodes: referralCodesResult.count,
    programApplications: applicationsResult.count,
  };

  const sortedEvents = [...eventsResult.data].sort((a, b) => {
    const dateA = new Date(getDate(a) || 0).getTime();
    const dateB = new Date(getDate(b) || 0).getTime();
    return dateB - dateA;
  });

  const sortedBookings = [...bookingsResult.data].sort((a, b) => {
    const dateA = new Date(getDate(a) || 0).getTime();
    const dateB = new Date(getDate(b) || 0).getTime();
    return dateB - dateA;
  });

  const sortedLeads = [...leadsResult.data].sort((a, b) => {
    const dateA = new Date(getDate(a) || 0).getTime();
    const dateB = new Date(getDate(b) || 0).getTime();
    return dateB - dateA;
  });

  const sourceHealth: AnalyticsSourceHealth[] = [
    {
      id: "analytics_events",
      label: "Analytics Events",
      ok: eventsResult.ok,
      rowCount: eventsResult.count,
      message: eventsResult.message,
    },
    {
      id: "bookings",
      label: "Bookings",
      ok: bookingsResult.ok,
      rowCount: bookingsResult.count,
      message: bookingsResult.message,
    },
    {
      id: "growth_campaigns",
      label: "Growth Campaigns",
      ok: campaignsResult.ok,
      rowCount: campaignsResult.count,
      message: campaignsResult.message,
    },
    {
      id: "pets",
      label: "Pets",
      ok: petsResult.ok,
      rowCount: petsResult.count,
      message: petsResult.message,
    },
    {
      id: "global_chat_insights",
      label: "Chat Insights",
      ok: insightsResult.ok,
      rowCount: insightsResult.count,
      message: insightsResult.message,
    },
    {
      id: "ambassador_leads",
      label: "Ambassador Leads",
      ok: leadsResult.ok,
      rowCount: leadsResult.count,
      message: leadsResult.message,
    },
    {
      id: "referral_codes",
      label: "Referral Codes",
      ok: referralCodesResult.ok,
      rowCount: referralCodesResult.count,
      message: referralCodesResult.message,
    },
    {
      id: "launch_signups",
      label: "Launch Signups",
      ok: launchResult.ok,
      rowCount: launchResult.count,
      message: launchResult.message,
    },
  ];

  return {
    metrics,
    sourceHealth,
    recentEvents: sortedEvents.slice(0, 6).map(toEventItem),
    recentBookings: sortedBookings.slice(0, 6).map(toBookingItem),
    recentLeads: sortedLeads.slice(0, 6).map(toLeadItem),
    isLive: sourceHealth.some((item) => item.ok),
  };
}
