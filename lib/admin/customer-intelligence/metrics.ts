/**
 * Shared Customer Intelligence metric drill-down + Rogue report helpers.
 */

export type CustomerIntelligenceMetricId =
  | "pet_parents"
  | "lifetime_value"
  | "repeat_rate"
  | "active_30d"
  | "rows_excluded"
  | "social_signups"
  | "social_customers"
  | "social_bookings"
  | "social_revenue"
  | "social_clicks";

export type CustomerIntelligenceMetricCustomer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city: string;
  state: string;
  zipCode: string;
  source: string;
  bookingCount: number;
  totalSpend: number;
  lastBookingDate: string | null;
  signupQuality?: string;
  signupQualityLabel?: string;
  segment?: string;
};

const SOCIAL_PLATFORM_TOKENS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "linkedin",
  "twitter",
  "x / twitter",
];

export const CUSTOMER_INTELLIGENCE_METRICS: Array<{
  id: CustomerIntelligenceMetricId;
  label: string;
  description: string;
  drillKind: "customers" | "archive" | "platforms" | "signups";
}> = [
  {
    id: "pet_parents",
    label: "Pet Parents",
    description: "All visible Pet Parents in the live registry.",
    drillKind: "customers",
  },
  {
    id: "lifetime_value",
    label: "Lifetime Value",
    description: "Pet Parents with recorded spend, ranked by lifetime value.",
    drillKind: "customers",
  },
  {
    id: "repeat_rate",
    label: "Repeat Rate",
    description: "Pet Parents with 2+ bookings.",
    drillKind: "customers",
  },
  {
    id: "active_30d",
    label: "Active Last 30 Days",
    description: "Pet Parents with a booking in the last 30 days.",
    drillKind: "customers",
  },
  {
    id: "rows_excluded",
    label: "Rows Excluded",
    description: "Demo, archived, spam, and cleanup rows removed from live stats.",
    drillKind: "archive",
  },
  {
    id: "social_signups",
    label: "Social Signups",
    description: "Launch signup / waitlist rows attributed to social sources.",
    drillKind: "signups",
  },
  {
    id: "social_customers",
    label: "Social Pet Parents",
    description: "Pet Parents attributed to Instagram, Facebook, TikTok, and related social sources.",
    drillKind: "customers",
  },
  {
    id: "social_bookings",
    label: "Social Bookings",
    description: "Social-attributed Pet Parents who have at least one booking.",
    drillKind: "customers",
  },
  {
    id: "social_revenue",
    label: "Social Revenue",
    description: "Social-attributed Pet Parents with spend.",
    drillKind: "customers",
  },
  {
    id: "social_clicks",
    label: "Social Clicks",
    description: "Click attribution by social platform.",
    drillKind: "platforms",
  },
];

export function parseCustomerIntelligenceMetric(
  value?: string | string[] | null,
): CustomerIntelligenceMetricId | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return (
    CUSTOMER_INTELLIGENCE_METRICS.find((metric) => metric.id === normalized)?.id ||
    null
  );
}

export function getCustomerIntelligenceMetricMeta(
  metric: CustomerIntelligenceMetricId,
) {
  return (
    CUSTOMER_INTELLIGENCE_METRICS.find((item) => item.id === metric) ||
    CUSTOMER_INTELLIGENCE_METRICS[0]
  );
}

export function getCustomerIntelligenceMetricHref(
  metric: CustomerIntelligenceMetricId,
  basePath = "/admin/petparents",
) {
  if (metric === "rows_excluded") {
    return "/admin/petparents/archive";
  }

  return `${basePath}?metric=${encodeURIComponent(metric)}#ci-drill-down`;
}

export function isSocialAttributionSource(source?: string | null) {
  const normalized = String(source || "").trim().toLowerCase();
  if (!normalized) return false;
  return SOCIAL_PLATFORM_TOKENS.some((token) => normalized.includes(token));
}

function isWithinLastDays(value: string | null | undefined, days: number) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return date.getTime() >= cutoff;
}

export function filterCustomersForMetric<
  T extends CustomerIntelligenceMetricCustomer,
>(customers: T[], metric: CustomerIntelligenceMetricId | null): T[] {
  if (!metric) return customers;

  switch (metric) {
    case "pet_parents":
      return customers;
    case "lifetime_value":
      return [...customers]
        .filter((customer) => customer.totalSpend > 0)
        .sort((a, b) => b.totalSpend - a.totalSpend);
    case "repeat_rate":
      return customers.filter((customer) => customer.bookingCount >= 2);
    case "active_30d":
      return customers.filter((customer) =>
        isWithinLastDays(customer.lastBookingDate, 30),
      );
    case "social_customers":
      return customers.filter((customer) =>
        isSocialAttributionSource(customer.source),
      );
    case "social_bookings":
      return customers.filter(
        (customer) =>
          isSocialAttributionSource(customer.source) &&
          customer.bookingCount > 0,
      );
    case "social_revenue":
      return customers.filter(
        (customer) =>
          isSocialAttributionSource(customer.source) &&
          customer.totalSpend > 0,
      );
    case "rows_excluded":
    case "social_signups":
    case "social_clicks":
      return [];
    default:
      return customers;
  }
}

export function formatCustomerIntelligenceMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatCustomerIntelligenceNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

export function buildCustomerIntelligenceDigest(input: {
  metrics: {
    totalCustomers: number;
    totalRevenue: number;
    averageLifetimeValue: number;
    repeatCustomers: number;
    repeatRate: number;
    activeCustomersLast30: number;
    averageBookingsPerCustomer: number;
    socialSignups: number;
    socialCustomers: number;
    socialBookings: number;
    socialRevenue: number;
    socialClicks: number;
    topSocialPlatform: string;
    hiddenDemoRows: number;
    separatedAdminRows: number;
    reviewQueueRows: number;
  };
  customers: CustomerIntelligenceMetricCustomer[];
  socialSources?: Array<{ label: string; customers?: number; bookings?: number; revenue?: number; signups?: number }>;
  metric?: CustomerIntelligenceMetricId | null;
}) {
  const metric = input.metric || null;
  const meta = metric ? getCustomerIntelligenceMetricMeta(metric) : null;
  const drilled = filterCustomersForMetric(input.customers, metric);
  const sample = (metric ? drilled : input.customers)
    .slice(0, 12)
    .map((customer) => {
      const location = [customer.city, customer.state].filter(Boolean).join(", ");
      return `- ${customer.name}${customer.email ? ` <${customer.email}>` : ""}${
        location ? ` · ${location}` : ""
      } · ${customer.bookingCount} bookings · ${formatCustomerIntelligenceMoney(
        customer.totalSpend,
      )} · source ${customer.source || "Direct"}`;
    });

  const lines = [
    `# Customer Intelligence Report`,
    meta
      ? `Drill-down: **${meta.label}** — ${meta.description}`
      : `Full pack overview for Pet Parent value, social attribution, and follow-up queues.`,
    ``,
    `## Headline Metrics`,
    `- Pet Parents: ${formatCustomerIntelligenceNumber(input.metrics.totalCustomers)}`,
    `- Lifetime Value (avg): ${formatCustomerIntelligenceMoney(input.metrics.averageLifetimeValue)}`,
    `- Total spend: ${formatCustomerIntelligenceMoney(input.metrics.totalRevenue)}`,
    `- Repeat rate: ${input.metrics.repeatRate.toFixed(1)}% (${formatCustomerIntelligenceNumber(input.metrics.repeatCustomers)} repeat)`,
    `- Active last 30 days: ${formatCustomerIntelligenceNumber(input.metrics.activeCustomersLast30)}`,
    `- Avg bookings / Pet Parent: ${input.metrics.averageBookingsPerCustomer.toFixed(1)}`,
    `- Review queue: ${formatCustomerIntelligenceNumber(input.metrics.reviewQueueRows)} incomplete / needs-review`,
    `- Rows excluded: ${formatCustomerIntelligenceNumber(input.metrics.hiddenDemoRows)} demo+filtered · ${formatCustomerIntelligenceNumber(input.metrics.separatedAdminRows)} archive/spam/deleted`,
    ``,
    `## Social Attribution`,
    `- Social signups: ${formatCustomerIntelligenceNumber(input.metrics.socialSignups)}`,
    `- Social customers: ${formatCustomerIntelligenceNumber(input.metrics.socialCustomers)}`,
    `- Social bookings: ${formatCustomerIntelligenceNumber(input.metrics.socialBookings)}`,
    `- Social revenue: ${formatCustomerIntelligenceMoney(input.metrics.socialRevenue)}`,
    `- Social clicks: ${formatCustomerIntelligenceNumber(input.metrics.socialClicks)}`,
    `- Top platform: ${input.metrics.topSocialPlatform || "None yet"}`,
  ];

  if (input.socialSources?.length) {
    lines.push(``, `### Social platforms`);
    for (const row of input.socialSources.slice(0, 8)) {
      lines.push(
        `- ${row.label}: ${formatCustomerIntelligenceNumber(row.customers || row.signups || 0)} customers/signups · ${formatCustomerIntelligenceNumber(row.bookings || 0)} bookings · ${formatCustomerIntelligenceMoney(row.revenue || 0)}`,
      );
    }
  }

  if (sample.length) {
    lines.push(
      ``,
      metric ? `## Drill-down sample (${drilled.length} matching)` : `## Sample Pet Parents`,
      ...sample,
    );
  } else if (metric === "rows_excluded") {
    lines.push(
      ``,
      `## Next hop`,
      `- Open cleanup queue: /admin/petparents/archive`,
    );
  } else if (metric) {
    lines.push(``, `## Drill-down`, `_No matching Pet Parent rows for this metric yet._`);
  }

  lines.push(
    ``,
    `## Admin routes`,
    `- Registry: /admin/petparents`,
    `- Archive / spam: /admin/petparents/archive`,
    `- Export: /admin/petparents/export`,
  );

  return lines.join("\n");
}
