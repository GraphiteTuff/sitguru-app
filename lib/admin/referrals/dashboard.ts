import { supabaseAdmin } from "@/lib/supabase/admin";

export type ReferralsSourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

export type ReferralsMetrics = {
  totalCodes: number;
  activeCodes: number;
  needsReview: number;
  guruCodes: number;
  petParentCodes: number;
  ambassadorCodes: number;
  partnerCodes: number;
  canonicalCodes: number;
  relationships: number;
  linkVisits: number;
  qrScans: number;
  signupCaptures: number;
  qualified: number;
  firstBookings: number;
  rewardReview: number;
  paidRewards: number;
  openConflicts: number;
  applications: number;
  activityRows: number;
};

export type ReferralsRecentItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  date: string | null;
  href: string;
};

export type ReferralsDashboardData = {
  metrics: ReferralsMetrics;
  sourceHealth: ReferralsSourceHealth[];
  recentCodes: ReferralsRecentItem[];
  needsReviewCodes: ReferralsRecentItem[];
  recentRelationships: ReferralsRecentItem[];
  openConflicts: ReferralsRecentItem[];
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
    asString(row.updated_at) ||
    asString(row.created_at) ||
    asString(row.occurred_at) ||
    asString(row.event_at) ||
    null
  );
}

function programBucket(value: unknown) {
  const raw = asString(value).toLowerCase();
  if (raw.includes("guru")) return "guru";
  if (raw.includes("ambassador")) return "ambassador";
  if (raw.includes("partner") || raw.includes("clinic")) return "partner";
  if (
    raw.includes("pet_parent") ||
    raw.includes("pet parent") ||
    raw.includes("customer") ||
    raw.includes("petperk") ||
    raw.includes("pawperk")
  ) {
    return "pet_parent";
  }
  return "other";
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

export async function getReferralsDashboardData(): Promise<ReferralsDashboardData> {
  const [
    codesResult,
    canonicalResult,
    relationshipsResult,
    eventsResult,
    activityResult,
    conflictsResult,
    programAppsResult,
    partnerAppsResult,
    rewardsResult,
  ] = await Promise.all([
    safeSelect(
      "referral_codes",
      "id, code, program_type, owner_type, owner_name, owner_email, status, payout_status, created_at, updated_at",
      500,
    ),
    safeSelect("pawperks_account_referral_codes", "id, created_at, updated_at, status, code", 300),
    safeSelect(
      "admin_referral_tracking",
      "id, created_at, updated_at, status, referrer_name, referred_name, program_type, relationship_type",
      300,
    ),
    safeSelect(
      "pawperks_referral_events",
      "id, created_at, event_type, event_name, status, referral_code",
      500,
    ),
    safeSelect("referral_activity", "id, created_at, code, activity_type, status", 200),
    safeSelect(
      "pawperks_referral_conflicts",
      "id, created_at, updated_at, status, conflict_type, referral_code, notes",
      200,
    ),
    safeSelect("program_applications", "id, created_at, status", 100),
    safeSelect("partner_applications", "id, created_at, status", 100),
    safeSelect(
      "referral_rewards",
      "id, created_at, updated_at, status, amount, reward_status, payout_status",
      300,
    ),
  ]);

  const codes = codesResult.data;
  const activeCodes = codes.filter((row) => {
    const status = getText(row, ["status"]).toLowerCase();
    return !status || status === "active" || status === "live" || status === "enabled";
  });
  const needsReview = codes.filter((row) => {
    const status = getText(row, ["status", "payout_status"]).toLowerCase();
    return (
      status.includes("review") ||
      status.includes("pending") ||
      status.includes("hold")
    );
  });

  const eventType = (row: AnyRow) =>
    getText(row, ["event_type", "event_name", "status"]).toLowerCase();

  const metrics: ReferralsMetrics = {
    totalCodes: codesResult.count,
    activeCodes: activeCodes.length,
    needsReview: needsReview.length,
    guruCodes: codes.filter((row) => programBucket(row.program_type) === "guru")
      .length,
    petParentCodes: codes.filter(
      (row) => programBucket(row.program_type) === "pet_parent",
    ).length,
    ambassadorCodes: codes.filter(
      (row) => programBucket(row.program_type) === "ambassador",
    ).length,
    partnerCodes: codes.filter(
      (row) => programBucket(row.program_type) === "partner",
    ).length,
    canonicalCodes: canonicalResult.count,
    relationships: relationshipsResult.count,
    linkVisits: eventsResult.data.filter((row) => {
      const value = eventType(row);
      return value.includes("click") || value.includes("visit") || value.includes("link");
    }).length,
    qrScans: eventsResult.data.filter((row) => eventType(row).includes("qr"))
      .length,
    signupCaptures: eventsResult.data.filter((row) => {
      const value = eventType(row);
      return value.includes("signup") || value.includes("capture");
    }).length,
    qualified: eventsResult.data.filter((row) =>
      eventType(row).includes("qualif"),
    ).length,
    firstBookings: eventsResult.data.filter((row) => {
      const value = eventType(row);
      return value.includes("booking") || value.includes("first_book");
    }).length,
    rewardReview: rewardsResult.data.filter((row) => {
      const status = getText(row, ["status", "reward_status", "payout_status"]).toLowerCase();
      return status.includes("review") || status.includes("pending");
    }).length,
    paidRewards: rewardsResult.data.filter((row) => {
      const status = getText(row, ["status", "reward_status", "payout_status"]).toLowerCase();
      return status.includes("paid") || status.includes("complete");
    }).length,
    openConflicts: conflictsResult.data.filter((row) => {
      const status = getText(row, ["status"]).toLowerCase();
      return !status || status === "open" || status.includes("open") || status.includes("unresolved");
    }).length,
    applications: programAppsResult.count + partnerAppsResult.count,
    activityRows: activityResult.count,
  };

  const sourceHealth: ReferralsSourceHealth[] = [
    {
      id: "referral_codes",
      label: "Editable Code Registry",
      ok: codesResult.ok,
      rowCount: codesResult.count,
      message: codesResult.message,
    },
    {
      id: "pawperks_account_referral_codes",
      label: "Canonical PawPerks Codes",
      ok: canonicalResult.ok,
      rowCount: canonicalResult.count,
      message: canonicalResult.message,
    },
    {
      id: "admin_referral_tracking",
      label: "Referral Relationships",
      ok: relationshipsResult.ok,
      rowCount: relationshipsResult.count,
      message: relationshipsResult.message,
    },
    {
      id: "pawperks_referral_events",
      label: "Referral Events",
      ok: eventsResult.ok,
      rowCount: eventsResult.count,
      message: eventsResult.message,
    },
    {
      id: "referral_activity",
      label: "Manual Activity",
      ok: activityResult.ok,
      rowCount: activityResult.count,
      message: activityResult.message,
    },
    {
      id: "pawperks_referral_conflicts",
      label: "PawPerks Conflicts",
      ok: conflictsResult.ok,
      rowCount: conflictsResult.count,
      message: conflictsResult.message,
    },
  ];

  const recentCodes = [...codes]
    .sort(
      (a, b) =>
        new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime(),
    )
    .slice(0, 6)
    .map((row, index) => ({
      id: getText(row, ["id"], `code-${index}`),
      title: getText(row, ["code"], "Referral code"),
      subtitle:
        getText(row, ["owner_name", "owner_email"]) ||
        getText(row, ["program_type"], "Program"),
      status: getText(row, ["status"], "active"),
      date: getDate(row),
      href: "/admin/referrals/codes",
    }));

  const needsReviewCodes = needsReview
    .slice(0, 6)
    .map((row, index) => ({
      id: getText(row, ["id"], `review-${index}`),
      title: getText(row, ["code"], "Referral code"),
      subtitle: getText(row, ["owner_name", "program_type"], "Needs review"),
      status: getText(row, ["status", "payout_status"], "review"),
      date: getDate(row),
      href: "/admin/referrals/codes",
    }));

  const recentRelationships = [...relationshipsResult.data]
    .sort(
      (a, b) =>
        new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime(),
    )
    .slice(0, 6)
    .map((row, index) => ({
      id: getText(row, ["id"], `rel-${index}`),
      title:
        getText(row, ["referrer_name"]) ||
        getText(row, ["relationship_type"], "Referral relationship"),
      subtitle:
        getText(row, ["referred_name"]) ||
        getText(row, ["program_type"], "Tracked relationship"),
      status: getText(row, ["status"], "tracked"),
      date: getDate(row),
      href: "/admin/referrals/codes",
    }));

  const openConflicts = conflictsResult.data
    .filter((row) => {
      const status = getText(row, ["status"]).toLowerCase();
      return !status || status === "open" || status.includes("open") || status.includes("unresolved");
    })
    .slice(0, 6)
    .map((row, index) => ({
      id: getText(row, ["id"], `conflict-${index}`),
      title: getText(row, ["referral_code", "conflict_type"], "PawPerks conflict"),
      subtitle: getText(row, ["notes", "conflict_type"], "Needs cleanup"),
      status: getText(row, ["status"], "open"),
      date: getDate(row),
      href: "/admin/referrals/inventory",
    }));

  return {
    metrics,
    sourceHealth,
    recentCodes,
    needsReviewCodes,
    recentRelationships,
    openConflicts,
    isLive: sourceHealth.some((source) => source.ok),
  };
}
