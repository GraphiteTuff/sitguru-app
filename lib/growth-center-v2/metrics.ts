/** Central KPI definitions — never mix incompatible denominators. */

export type MetricDefinition = {
  id: string;
  label: string;
  description: string;
  numerator: string;
  denominator: string | null;
  unit: "count" | "percent" | "ratio";
  category:
    | "social"
    | "guru"
    | "pet_parent"
    | "ambassador"
    | "community"
    | "campaign"
    | "conversion"
    | "goal";
};

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  pet_parent_registrations: {
    id: "pet_parent_registrations",
    label: "New Pet Parents",
    description:
      "Live Pet Parent profiles created in the selected window (excludes demo/test/archived).",
    numerator: "profiles meeting live Pet Parent criteria",
    denominator: null,
    unit: "count",
    category: "pet_parent",
  },
  guru_registrations: {
    id: "guru_registrations",
    label: "New Gurus",
    description: "Guru rows created in the selected window.",
    numerator: "gurus.created_at in range",
    denominator: null,
    unit: "count",
    category: "guru",
  },
  ambassador_registrations: {
    id: "ambassador_registrations",
    label: "New Ambassadors",
    description: "Ambassador rows created in the selected window.",
    numerator: "ambassadors.created_at in range",
    denominator: null,
    unit: "count",
    category: "ambassador",
  },
  campaign_visits: {
    id: "campaign_visits",
    label: "Campaign Visits",
    description:
      "growth_campaign_events of type click or page_view in the window.",
    numerator: "campaign visit events",
    denominator: null,
    unit: "count",
    category: "campaign",
  },
  campaign_signups: {
    id: "campaign_signups",
    label: "Attributed Signups",
    description:
      "growth_campaign_events of type signup (or signup_*) with campaign attribution.",
    numerator: "attributed signup events",
    denominator: null,
    unit: "count",
    category: "campaign",
  },
  registration_conversion_rate: {
    id: "registration_conversion_rate",
    label: "Registration Conversion",
    description:
      "Attributed campaign signups ÷ attributed campaign visits for the same window. Labeled unavailable when visits are zero.",
    numerator: "attributed signups",
    denominator: "attributed visits",
    unit: "percent",
    category: "conversion",
  },
  referral_clicks: {
    id: "referral_clicks",
    label: "Referral Clicks",
    description: "referral_clicks rows created in the window.",
    numerator: "referral click events",
    denominator: null,
    unit: "count",
    category: "campaign",
  },
  booking_requests: {
    id: "booking_requests",
    label: "Booking Requests",
    description: "bookings rows created in the window (all statuses).",
    numerator: "bookings.created_at in range",
    denominator: null,
    unit: "count",
    category: "conversion",
  },
  content_in_review: {
    id: "content_in_review",
    label: "Content Needs Review",
    description:
      "Content Studio / calendar items currently awaiting manager or CEO review.",
    numerator: "content rows in Submitted to Ava / Needs CEO Review",
    denominator: null,
    unit: "count",
    category: "campaign",
  },
  social_followers: {
    id: "social_followers",
    label: "Tracked Followers",
    description:
      "Sum of current_followers from social_platform_metrics. Not unique people across platforms.",
    numerator: "sum(current_followers) per connected/manual rows",
    denominator: null,
    unit: "count",
    category: "social",
  },
};

export function getMetricDefinition(id: string) {
  return METRIC_DEFINITIONS[id] || null;
}
