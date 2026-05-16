import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type TrackBody = {
  eventName?: string;
  eventType?: string;
  role?: string;
  source?: string;
  pagePath?: string;
  guruId?: string;
  bookingId?: string;
  sessionId?: string;
  severity?: "info" | "success" | "warning" | "critical";
  auditArea?: string;
  auditAction?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

type AdminProfile = Record<string, unknown>;

const MAX_STRING_LENGTH = 300;
const MAX_METADATA_KEYS = 50;

const SENSITIVE_METADATA_KEYS = [
  "password",
  "passcode",
  "token",
  "access_token",
  "refresh_token",
  "secret",
  "api_key",
  "apikey",
  "authorization",
  "cookie",
  "session",
  "ssn",
  "social_security",
  "card",
  "card_number",
  "cvc",
  "cvv",
  "routing_number",
  "account_number",
  "bank_password",
  "plaid_access_token",
  "stripe_secret",
];

const ADMIN_EVENT_TYPES = new Set([
  "admin",
  "audit",
  "financial",
  "security",
  "export",
  "import",
  "settings",
  "user_management",
]);

function safeString(value: unknown, maxLength = MAX_STRING_LENGTH) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function safeEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fallback: T,
): T {
  const normalized = safeString(value).toLowerCase();

  return allowedValues.includes(normalized as T) ? (normalized as T) : fallback;
}

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return cfIp || realIp || null;
}

function redactMetadataValue(key: string, value: unknown): unknown {
  const normalizedKey = key.toLowerCase();

  if (SENSITIVE_METADATA_KEYS.some((sensitiveKey) => normalizedKey.includes(sensitiveKey))) {
    return "[REDACTED]";
  }

  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    return value.slice(0, 1000);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item, index) =>
      redactMetadataValue(`${key}_${index}`, item),
    );
  }

  if (typeof value === "object") {
    return sanitizeMetadata(value as Record<string, unknown>);
  }

  return String(value).slice(0, 500);
}

function sanitizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>).slice(
    0,
    MAX_METADATA_KEYS,
  );

  return entries.reduce<Record<string, unknown>>((acc, [key, rawValue]) => {
    const safeKey = safeString(key, 100);

    if (!safeKey) return acc;

    acc[safeKey] = redactMetadataValue(safeKey, rawValue);
    return acc;
  }, {});
}

function shouldMirrorToAuditLog({
  eventName,
  eventType,
  source,
  auditArea,
  auditAction,
}: {
  eventName: string;
  eventType: string;
  source: string;
  auditArea: string;
  auditAction: string;
}) {
  const normalized = [eventName, eventType, source, auditArea, auditAction]
    .join(" ")
    .toLowerCase();

  return (
    Boolean(auditArea || auditAction) ||
    ADMIN_EVENT_TYPES.has(eventType.toLowerCase()) ||
    normalized.includes("admin") ||
    normalized.includes("audit") ||
    normalized.includes("financial") ||
    normalized.includes("export") ||
    normalized.includes("email") ||
    normalized.includes("import") ||
    normalized.includes("void") ||
    normalized.includes("delete") ||
    normalized.includes("deactivate") ||
    normalized.includes("approve") ||
    normalized.includes("reject") ||
    normalized.includes("settings") ||
    normalized.includes("permission") ||
    normalized.includes("stripe") ||
    normalized.includes("plaid") ||
    normalized.includes("bank") ||
    normalized.includes("navy federal")
  );
}

async function safeRows<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Analytics tracking lookup skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Analytics tracking lookup skipped for ${label}:`, error);
    return [];
  }
}

function getOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }

  return false;
}

function getActorRole(profile: AdminProfile | undefined, fallbackRole: string) {
  return (
    safeString(profile?.role) ||
    safeString(profile?.admin_role) ||
    safeString(fallbackRole) ||
    null
  );
}

async function getAdminProfile(userId: string) {
  const [adminUsers, profiles, users] = await Promise.all([
    safeRows<AdminProfile>(
      supabaseAdmin
        .from("admin_users")
        .select("role,email,is_active,can_access_financials")
        .eq("user_id", userId)
        .limit(1),
      "admin_users",
    ),
    safeRows<AdminProfile>(
      supabaseAdmin
        .from("profiles")
        .select("role,email,is_active,can_access_financials")
        .eq("id", userId)
        .limit(1),
      "profiles",
    ),
    safeRows<AdminProfile>(
      supabaseAdmin
        .from("users")
        .select("role,email,is_active,can_access_financials")
        .eq("id", userId)
        .limit(1),
      "users",
    ),
  ]);

  return adminUsers[0] || profiles[0] || users[0] || undefined;
}

async function writeAuditTrail({
  userId,
  userEmail,
  actorRole,
  eventName,
  eventType,
  source,
  pagePath,
  severity,
  auditArea,
  auditAction,
  targetType,
  targetId,
  metadata,
  ipAddress,
  userAgent,
}: {
  userId: string | null;
  userEmail: string | null;
  actorRole: string | null;
  eventName: string;
  eventType: string;
  source: string | null;
  pagePath: string | null;
  severity: "info" | "success" | "warning" | "critical";
  auditArea: string;
  auditAction: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const action = auditAction || eventName;
  const area =
    auditArea ||
    (eventType === "financial" || source?.includes("financial")
      ? "financials"
      : "analytics");

  const auditPayload = {
    actor_id: userId,
    actor_email: userEmail,
    actor_role: actorRole,
    action,
    area,
    target_type: targetType,
    target_id: targetId,
    metadata: {
      ...metadata,
      eventName,
      eventType,
      source,
      pagePath,
      severity,
      ipAddress,
      userAgent,
    },
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin
      .from("admin_audit_logs")
      .insert(auditPayload);

    if (!error) return;
  } catch {
    // Keep tracking from failing if audit table does not exist yet.
  }

  try {
    await supabaseAdmin.from("financial_audit_logs").insert(auditPayload);
  } catch (error) {
    console.warn("Audit trail mirror skipped:", error);
  }
}


function metadataString(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = safeString(metadata[key], 200);

    if (value) return value;
  }

  return "";
}

function metadataNumber(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value.replace(/[$,%\s,]/g, ""));

      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return 0;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeGrowthEventType(eventName: string, eventType: string) {
  const normalized = `${eventName} ${eventType}`.toLowerCase();

  if (
    normalized.includes("booking_completed") ||
    normalized.includes("completed_booking") ||
    normalized.includes("first_booking") ||
    normalized.includes("paid_booking") ||
    normalized.includes("booking_paid")
  ) {
    return "completed_booking";
  }

  if (normalized.includes("booking") || normalized.includes("checkout")) {
    return "booking";
  }

  if (
    normalized.includes("pet_parent_signup") ||
    normalized.includes("customer_signup") ||
    normalized.includes("guru_signup") ||
    normalized.includes("account_created") ||
    normalized.includes("signup") ||
    normalized.includes("sign_up") ||
    normalized.includes("registration")
  ) {
    return "signup";
  }

  if (
    normalized.includes("ambassador_application") ||
    normalized.includes("partner_application") ||
    normalized.includes("program_application") ||
    normalized.includes("application_submitted") ||
    normalized.includes("apply") ||
    normalized.includes("lead")
  ) {
    return "lead";
  }

  if (
    normalized.includes("qr_scan") ||
    normalized.includes("scan") ||
    normalized.includes("click") ||
    normalized.includes("cta")
  ) {
    return "click";
  }

  if (
    normalized.includes("page_view") ||
    normalized.includes("view") ||
    normalized.includes("visit")
  ) {
    return "page_view";
  }

  return eventType || eventName;
}

function shouldMirrorToGrowthCampaignEvents({
  eventName,
  eventType,
  source,
  pagePath,
  role,
  metadata,
}: {
  eventName: string;
  eventType: string;
  source: string;
  pagePath: string;
  role: string | null;
  metadata: Record<string, unknown>;
}) {
  const normalizedRole = String(role || "").toLowerCase();
  const normalizedText = `${eventName} ${eventType} ${source} ${pagePath}`.toLowerCase();

  if (
    normalizedRole.includes("admin") ||
    normalizedText.includes("/admin") ||
    normalizedText.includes("audit") ||
    normalizedText.includes("financial") ||
    normalizedText.includes("security") ||
    normalizedText.includes("export")
  ) {
    return false;
  }

  const campaignFields = [
    "campaignId",
    "campaign_id",
    "campaignSlug",
    "campaign_slug",
    "campaignName",
    "campaign_name",
    "utm_campaign",
    "utmCampaign",
    "utm_source",
    "utmSource",
    "utm_medium",
    "utmMedium",
    "referralCode",
    "referral_code",
    "qrCode",
    "qr_code",
    "adId",
    "ad_id",
  ];

  const hasCampaignField = campaignFields.some((key) => safeString(metadata[key], 200));

  if (hasCampaignField) return true;

  return [
    "page_view",
    "view",
    "visit",
    "click",
    "qr_scan",
    "scan",
    "lead",
    "application",
    "signup",
    "sign_up",
    "registration",
    "booking",
    "checkout",
  ].some((keyword) => normalizedText.includes(keyword));
}

async function writeGrowthCampaignEvent({
  userId,
  eventName,
  eventType,
  source,
  pagePath,
  guruId,
  bookingId,
  sessionId,
  metadata,
}: {
  userId: string | null;
  eventName: string;
  eventType: string;
  source: string;
  pagePath: string;
  guruId: string | null;
  bookingId: string | null;
  sessionId: string | null;
  metadata: Record<string, unknown>;
}) {
  void userId;
  void pagePath;
  void guruId;
  void bookingId;
  void sessionId;

  const campaignId = metadataString(metadata, ["campaignId", "campaign_id"]);
  const campaignSlug =
    metadataString(metadata, ["campaignSlug", "campaign_slug", "utm_campaign", "utmCampaign"]) ||
    source ||
    "unassigned";
  const campaignName =
    metadataString(metadata, ["campaignName", "campaign_name", "campaign", "utm_campaign"]) ||
    campaignSlug ||
    "Unassigned Campaign";
  const campaignSource =
    metadataString(metadata, ["utm_source", "utmSource", "source", "referralSource"]) ||
    source ||
    "direct";
  const normalizedEventType = normalizeGrowthEventType(eventName, eventType);

  const revenue = metadataNumber(metadata, ["revenue", "attributedRevenue", "attributed_revenue"]);
  const bookingAmount = metadataNumber(metadata, [
    "bookingAmount",
    "booking_amount",
    "grossAmount",
    "gross_amount",
    "totalAmount",
    "total_amount",
  ]);
  const amount = metadataNumber(metadata, ["amount", "value"]);

  const growthPayload: Record<string, unknown> = {
    campaign_slug: campaignSlug,
    campaign_name: campaignName,
    source: campaignSource,
    event_type: normalizedEventType,
    revenue,
    booking_amount: bookingAmount,
    amount,
    created_at: new Date().toISOString(),
  };

  if (campaignId && isUuid(campaignId)) {
    growthPayload.campaign_id = campaignId;
  }

  try {
    const { error } = await supabaseAdmin
      .from("growth_campaign_events")
      .insert(growthPayload);

    if (!error) return true;

    console.warn("Growth campaign event mirror skipped:", error);
    return false;
  } catch (error) {
    console.warn("Growth campaign event mirror skipped:", error);
    return false;
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as TrackBody | null;

    const eventName = safeString(body?.eventName, 150);
    const eventType = safeString(body?.eventType || "interaction", 100);
    const role = safeString(body?.role, 100);
    const source = safeString(body?.source, 150);
    const pagePath = safeString(body?.pagePath, 300);
    const guruId = safeString(body?.guruId, 150);
    const bookingId = safeString(body?.bookingId, 150);
    const sessionId = safeString(body?.sessionId, 150);
    const auditArea = safeString(body?.auditArea, 150);
    const auditAction = safeString(body?.auditAction, 150);
    const targetType = safeString(body?.targetType, 150);
    const targetId = safeString(body?.targetId, 150);
    const severity = safeEnum(
      body?.severity,
      ["info", "success", "warning", "critical"] as const,
      "info",
    );
    const metadata = sanitizeMetadata(body?.metadata);

    if (!eventName) {
      return NextResponse.json(
        { error: "Missing eventName." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get("user-agent");
    const profile = user?.id ? await getAdminProfile(user.id) : undefined;
    const actorRole = getActorRole(profile, role);
    const profileActive =
      profile?.is_active === undefined ? true : getOptionalBoolean(profile.is_active);

    const analyticsPayload = {
      user_id: user?.id || null,
      session_id: sessionId || null,
      event_name: eventName,
      event_type: eventType || null,
      role: actorRole || role || null,
      source: source || null,
      page_path: pagePath || null,
      guru_id: guruId || null,
      booking_id: bookingId || null,
      metadata: {
        ...metadata,
        severity,
        targetType: targetType || null,
        targetId: targetId || null,
        auditArea: auditArea || null,
        auditAction: auditAction || null,
        ipAddress,
        userAgent,
        profileActive,
      },
    };

    const { error } = await supabaseAdmin
      .from("analytics_events")
      .insert(analyticsPayload);

    if (error) {
      console.error("Analytics tracking error:", error);

      return NextResponse.json(
        { error: "Unable to track analytics event." },
        { status: 500 },
      );
    }

    const mirroredToGrowthCampaigns = shouldMirrorToGrowthCampaignEvents({
      eventName,
      eventType,
      source,
      pagePath,
      role: actorRole || role || null,
      metadata,
    })
      ? await writeGrowthCampaignEvent({
          userId: user?.id || null,
          eventName,
          eventType,
          source,
          pagePath,
          guruId: guruId || null,
          bookingId: bookingId || null,
          sessionId: sessionId || null,
          metadata,
        })
      : false;

    if (
      shouldMirrorToAuditLog({
        eventName,
        eventType,
        source,
        auditArea,
        auditAction,
      })
    ) {
      await writeAuditTrail({
        userId: user?.id || null,
        userEmail: user?.email || null,
        actorRole,
        eventName,
        eventType,
        source: source || null,
        pagePath: pagePath || null,
        severity,
        auditArea,
        auditAction,
        targetType: targetType || null,
        targetId: targetId || null,
        metadata,
        ipAddress,
        userAgent,
      });
    }

    return NextResponse.json({
      ok: true,
      mirroredToAuditTrail: shouldMirrorToAuditLog({
        eventName,
        eventType,
        source,
        auditArea,
        auditAction,
      }),
      mirroredToGrowthCampaigns,
    });
  } catch (error) {
    console.error("Analytics route error:", error);

    return NextResponse.json(
      { error: "Unexpected analytics error." },
      { status: 500 },
    );
  }
}
