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
    });
  } catch (error) {
    console.error("Analytics route error:", error);

    return NextResponse.json(
      { error: "Unexpected analytics error." },
      { status: 500 },
    );
  }
}
