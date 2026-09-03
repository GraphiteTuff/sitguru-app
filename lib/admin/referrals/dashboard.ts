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

export type ReferralWeekDay = {
  day: string;
  visits: number;
  scans: number;
  other: number;
};

export type ReferralsDashboardData = {
  metrics: ReferralsMetrics;
  sourceHealth: ReferralsSourceHealth[];
  recentCodes: ReferralsRecentItem[];
  needsReviewCodes: ReferralsRecentItem[];
  recentRelationships: ReferralsRecentItem[];
  openConflicts: ReferralsRecentItem[];
  recentEvents: ReferralsRecentItem[];
  weekDays: ReferralWeekDay[];
  weekVisits: number;
  weekScans: number;
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
  const extractMissingColumn = (message: string): string | null => {
    const patterns = [
      /Could not find the ['"`]?([a-zA-Z_][a-zA-Z0-9_]*)['"`]? column/i,
      /column\s+[a-zA-Z0-9_]+\.([a-zA-Z_][a-zA-Z0-9_]*)\s+does not exist/i,
      /column\s+['"`]?([a-zA-Z_][a-zA-Z0-9_]*)['"`]?\s+does not exist/i,
    ];
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match?.[1]) return match[1];
    }
    return null;
  };

  const stripColumn = (cols: string, missing: string): string | null => {
    if (!cols || cols.trim() === "*") return null;
    const next = cols
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => {
        const bare = part.includes(".")
          ? part.split(".").pop()!.trim()
          : part;
        return bare.toLowerCase() !== missing.toLowerCase();
      });
    if (!next.length || next.join(",") === cols) return null;
    return next.join(",");
  };

  let activeColumns = columns;
  const stripped: string[] = [];

  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from(table)
        .select(activeColumns, { count: "exact" })
        .limit(limit);

      if (!error) {
        const rows = Array.isArray(data) ? (data as unknown as AnyRow[]) : [];
        return {
          data: rows,
          ok: true,
          message: stripped.length
            ? `${table} connected (omitted missing: ${stripped.join(", ")})`
            : `${table} connected`,
          count: typeof count === "number" ? count : rows.length,
        };
      }

      const message = error.message || `${table} unavailable`;
      const missing = extractMissingColumn(message);
      if (!missing) {
        return { data: [], ok: false, message, count: 0 };
      }
      const nextColumns = stripColumn(activeColumns, missing);
      if (!nextColumns) {
        return { data: [], ok: false, message, count: 0 };
      }
      stripped.push(missing);
      activeColumns = nextColumns;
    } catch (error) {
      return {
        data: [],
        ok: false,
        message:
          error instanceof Error ? error.message : `${table} unavailable`,
        count: 0,
      };
    }
  }

  return {
    data: [],
    ok: false,
    message: `${table} unavailable after column retries`,
    count: 0,
  };
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
      "pawperks_referral_relationships",
      "id, created_at, updated_at, status, referral_code, referrer_display_name, referred_display_name, referrer_role, referred_role, referral_stage",
      300,
    ),
    safeSelect(
      "pawperks_referral_events",
      "id, created_at, occurred_at, event_type, conversion_status, submitted_code",
      500,
    ),
    safeSelect(
      "referral_activity",
      "id, created_at, code, activity_type, conversion_status, payout_status",
      200,
    ),
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

  const eventDay = (row: AnyRow) =>
    (getText(row, ["occurred_at", "created_at"]) || "").slice(0, 10);

  const weekStart = (() => {
    const next = new Date();
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() - next.getDay());
    return next;
  })();
  const weekDays: ReferralWeekDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      day: date.toISOString().slice(0, 10),
      visits: 0,
      scans: 0,
      other: 0,
    };
  });
  const weekSet = new Set(weekDays.map((item) => item.day));
  for (const row of eventsResult.data) {
    const day = eventDay(row);
    if (!weekSet.has(day)) continue;
    const bucket = weekDays.find((item) => item.day === day);
    if (!bucket) continue;
    const kind = eventType(row);
    if (kind.includes("qr")) bucket.scans += 1;
    else if (kind.includes("visit") || kind.includes("click") || kind.includes("link")) {
      bucket.visits += 1;
    } else {
      bucket.other += 1;
    }
  }
  const weekVisits = weekDays.reduce((sum, item) => sum + item.visits, 0);
  const weekScans = weekDays.reduce((sum, item) => sum + item.scans, 0);

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
      id: "pawperks_referral_relationships",
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
        getText(row, ["referrer_display_name"]) ||
        getText(row, ["referral_code"], "Referral relationship"),
      subtitle:
        getText(row, ["referred_display_name"]) ||
        getText(row, ["referral_stage", "referrer_role"], "Tracked relationship"),
      status: getText(row, ["status"], "tracked"),
      date: getDate(row),
      href: "/admin/referrals/codes",
    }));

  const recentEvents = [...eventsResult.data]
    .sort(
      (a, b) =>
        new Date(getText(b, ["occurred_at", "created_at"]) || 0).getTime() -
        new Date(getText(a, ["occurred_at", "created_at"]) || 0).getTime(),
    )
    .slice(0, 8)
    .map((row, index) => ({
      id: getText(row, ["id"], `event-${index}`),
      title: getText(row, ["event_type"], "Referral event"),
      subtitle:
        getText(row, ["submitted_code"]) ||
        getText(row, ["conversion_status"], "Tracked"),
      status: getText(row, ["conversion_status"], "recorded"),
      date: getText(row, ["occurred_at", "created_at"]) || null,
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
    recentEvents,
    weekDays,
    weekVisits,
    weekScans,
    isLive: sourceHealth.some((source) => source.ok),
  };
}
