import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CommandEntity =
  | "activity"
  | "marketing_effort"
  | "lead"
  | "template";

type AuthenticatedUser = {
  id: string;
  email: string | null;
};

type AmbassadorIdentity = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  referral_code: string | null;
  status: string | null;
  dashboard_enabled: boolean | null;
  login_enabled: boolean | null;
};

type CommandBody = Record<string, unknown> & {
  entity?: unknown;
  id?: unknown;
  data?: unknown;
};

const LOCAL_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
]);

const ACTIVITY_FIELDS = new Set([
  "template_id",
  "title",
  "description",
  "category",
  "activity_type",
  "engagement_mode",
  "status",
  "priority",
  "activity_date",
  "starts_at",
  "ends_at",
  "all_day",
  "estimated_minutes",
  "actual_minutes",
  "reminder_minutes_before",
  "series_id",
  "parent_activity_id",
  "recurrence_rule",
  "event_name",
  "venue_name",
  "organization_name",
  "address_line_1",
  "address_line_2",
  "city",
  "state",
  "zip_code",
  "virtual_url",
  "campaign_name",
  "target_audience",
  "goal",
  "expected_contacts",
  "actual_contacts",
  "conversations",
  "qr_scans",
  "referral_links_shared",
  "materials_distributed",
  "leads_generated",
  "pet_parent_leads",
  "guru_leads",
  "ambassador_leads",
  "partner_leads",
  "verified_signups",
  "completed_bookings",
  "travel_miles",
  "out_of_pocket_cost",
  "outcome_summary",
  "notes",
  "blocker_notes",
  "proof_urls",
  "attachments",
  "metadata",
  "needs_admin_help",
  "admin_help_reason",
]);

const MARKETING_FIELDS = new Set([
  "activity_id",
  "effort_date",
  "effort_type",
  "platform",
  "campaign_name",
  "target_audience",
  "target_location",
  "title",
  "description",
  "content_url",
  "call_to_action",
  "minutes_spent",
  "spend_amount",
  "impressions",
  "reach",
  "engagements",
  "clicks",
  "messages_received",
  "qr_scans",
  "materials_distributed",
  "leads_generated",
  "verified_signups",
  "completed_bookings",
  "status",
  "outcome_summary",
  "notes",
  "proof_urls",
  "metadata",
  "needs_admin_help",
]);

const LEAD_FIELDS = new Set([
  "activity_id",
  "marketing_effort_id",
  "lead_type",
  "lead_status",
  "lead_temperature",
  "priority",
  "first_name",
  "last_name",
  "full_name",
  "email",
  "phone",
  "business_name",
  "organization_name",
  "website_url",
  "social_handle",
  "city",
  "state",
  "zip_code",
  "market_area",
  "source_type",
  "source_detail",
  "campaign_name",
  "target_audience",
  "referral_code",
  "consent_to_contact",
  "preferred_contact_method",
  "next_follow_up",
  "next_action",
  "outcome_goal",
  "notes",
  "admin_assistance_requested",
  "admin_assistance_reason",
]);

const TEMPLATE_FIELDS = new Set([
  "title",
  "description",
  "category",
  "activity_type",
  "engagement_mode",
  "default_duration_minutes",
  "default_day_of_week",
  "default_target_audience",
  "is_active",
  "sort_order",
]);

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function isAllowedOrigin(origin: string) {
  const normalized = normalizeOrigin(origin);

  if (LOCAL_ORIGINS.has(normalized)) {
    return true;
  }

  try {
    const url = new URL(normalized);

    return (
      url.hostname === "sitguru.com" ||
      url.hostname.endsWith(".sitguru.com")
    );
  } catch {
    return false;
  }
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store, max-age=0",
    Pragma: "no-cache",
    Vary: "Origin",
  };

  const origin = req.headers.get("origin") || "";

  if (!origin || !isAllowedOrigin(origin)) {
    return headers;
  }

  headers["Access-Control-Allow-Credentials"] = "true";
  headers["Access-Control-Allow-Headers"] =
    "Authorization, Content-Type, X-Requested-With";
  headers["Access-Control-Allow-Methods"] =
    "GET, POST, PATCH, DELETE, OPTIONS";
  headers["Access-Control-Allow-Origin"] = origin;

  return headers;
}

function json(
  req: NextRequest,
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: corsHeaders(req),
  });
}

function normalizeEntity(value: unknown): CommandEntity | null {
  const normalized = asString(value).toLowerCase();

  if (
    normalized === "activity" ||
    normalized === "marketing_effort" ||
    normalized === "lead" ||
    normalized === "template"
  ) {
    return normalized;
  }

  return null;
}

function cleanAllowedFields(
  source: Record<string, unknown>,
  allowed: Set<string>,
) {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (!allowed.has(key) || value === undefined) {
      continue;
    }

    if (typeof value === "string") {
      cleaned[key] = value.trim() || null;
      continue;
    }

    cleaned[key] = value;
  }

  return cleaned;
}

function tableForEntity(entity: CommandEntity) {
  if (entity === "activity") return "ambassador_activity_log";
  if (entity === "marketing_effort") {
    return "ambassador_marketing_efforts";
  }
  if (entity === "lead") return "ambassador_leads";
  return "ambassador_activity_templates";
}

function fieldsForEntity(entity: CommandEntity) {
  if (entity === "activity") return ACTIVITY_FIELDS;
  if (entity === "marketing_effort") return MARKETING_FIELDS;
  if (entity === "lead") return LEAD_FIELDS;
  return TEMPLATE_FIELDS;
}

function parseDateParam(value: string | null) {
  if (!value) return null;

  const clean = value.trim();

  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : null;
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function getAuthenticatedUser(
  req: NextRequest,
): Promise<AuthenticatedUser | null> {
  const authorization = req.headers.get("authorization") || "";
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);

  if (bearerMatch?.[1]) {
    const { data, error } = await supabaseAdmin.auth.getUser(
      bearerMatch[1].trim(),
    );

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || null,
  };
}

function ambassadorIsActive(ambassador: AmbassadorIdentity) {
  const status = asString(ambassador.status).toLowerCase();

  return (
    Boolean(ambassador.id) &&
    ![
      "archived",
      "inactive",
      "disabled",
      "suspended",
      "not a fit",
    ].includes(status)
  );
}

async function getAmbassador(
  user: AuthenticatedUser,
): Promise<AmbassadorIdentity | null> {
  const columns =
    "id, user_id, full_name, referral_code, status, dashboard_enabled, login_enabled";

  const { data: byUserId, error: userIdError } = await supabaseAdmin
    .from("ambassadors")
    .select(columns)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (userIdError) {
    console.error(
      "AMBASSADOR COMMAND CENTER USER LOOKUP ERROR:",
      userIdError,
    );
  }

  if (byUserId && ambassadorIsActive(byUserId as AmbassadorIdentity)) {
    return byUserId as AmbassadorIdentity;
  }

  if (!user.email) {
    return null;
  }

  for (const emailColumn of [
    "login_email",
    "contact_email",
    "email",
  ]) {
    const { data, error } = await supabaseAdmin
      .from("ambassadors")
      .select(columns)
      .ilike(emailColumn, user.email)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(
        `AMBASSADOR COMMAND CENTER ${emailColumn} LOOKUP ERROR:`,
        error.message,
      );
      continue;
    }

    if (data && ambassadorIsActive(data as AmbassadorIdentity)) {
      return data as AmbassadorIdentity;
    }
  }

  return null;
}

async function requireAmbassador(req: NextRequest) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return {
      error: json(
        req,
        {
          success: false,
          error: "Authentication required.",
        },
        401,
      ),
      user: null,
      ambassador: null,
    };
  }

  const ambassador = await getAmbassador(user);

  if (!ambassador) {
    return {
      error: json(
        req,
        {
          success: false,
          error:
            "An active SitGuru Ambassador workspace is required.",
        },
        403,
      ),
      user,
      ambassador: null,
    };
  }

  return {
    error: null,
    user,
    ambassador,
  };
}

async function loadCommandCenter({
  ambassador,
  startDate,
  endDate,
}: {
  ambassador: AmbassadorIdentity;
  startDate: string;
  endDate: string;
}) {
  const [
    templatesResult,
    activitiesResult,
    effortsResult,
    leadsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("ambassador_activity_templates")
      .select("*")
      .or(
        `owner_ambassador_id.is.null,owner_ambassador_id.eq.${ambassador.id}`,
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true }),
    supabaseAdmin
      .from("ambassador_activity_log")
      .select("*")
      .eq("ambassador_id", ambassador.id)
      .gte("activity_date", startDate)
      .lte("activity_date", endDate)
      .order("activity_date", { ascending: true })
      .order("starts_at", { ascending: true, nullsFirst: false }),
    supabaseAdmin
      .from("ambassador_marketing_efforts")
      .select("*")
      .eq("ambassador_id", ambassador.id)
      .gte("effort_date", startDate)
      .lte("effort_date", endDate)
      .order("effort_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("ambassador_leads")
      .select("*")
      .eq("ambassador_id", ambassador.id)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const errors = [
    templatesResult.error?.message,
    activitiesResult.error?.message,
    effortsResult.error?.message,
    leadsResult.error?.message,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error("AMBASSADOR COMMAND CENTER LOAD ERRORS:", errors);
  }

  const activities = activitiesResult.data || [];
  const efforts = effortsResult.data || [];
  const leads = leadsResult.data || [];

  const completedActivities = activities.filter(
    (row) => row.status === "completed",
  );

  const totalActualMinutes = completedActivities.reduce(
    (sum, row) =>
      sum +
      (typeof row.actual_minutes === "number"
        ? row.actual_minutes
        : 0),
    0,
  );

  const activityTotals = activities.reduce(
    (totals, row) => {
      totals.contacts += Number(row.actual_contacts || 0);
      totals.conversations += Number(row.conversations || 0);
      totals.qrScans += Number(row.qr_scans || 0);
      totals.materials += Number(row.materials_distributed || 0);
      totals.leads += Number(row.leads_generated || 0);
      totals.signups += Number(row.verified_signups || 0);
      totals.bookings += Number(row.completed_bookings || 0);
      return totals;
    },
    {
      contacts: 0,
      conversations: 0,
      qrScans: 0,
      materials: 0,
      leads: 0,
      signups: 0,
      bookings: 0,
    },
  );

  const leadCounts = leads.reduce(
    (counts, row) => {
      const status = asString(row.lead_status) || "new";
      counts.total += 1;
      counts.byStatus[status] =
        (counts.byStatus[status] || 0) + 1;

      if (row.admin_assistance_requested) {
        counts.needsAdmin += 1;
      }

      if (status === "converted") {
        counts.converted += 1;
      }

      return counts;
    },
    {
      total: 0,
      converted: 0,
      needsAdmin: 0,
      byStatus: {} as Record<string, number>,
    },
  );

  const upcoming = activities.filter((row) =>
    ["planned", "confirmed", "in_progress"].includes(
      asString(row.status),
    ),
  ).length;

  return {
    templates: templatesResult.data || [],
    activities,
    marketingEfforts: efforts,
    leads,
    summary: {
      dateRange: {
        startDate,
        endDate,
      },
      scheduledActivities: activities.length,
      completedActivities: completedActivities.length,
      upcomingActivities: upcoming,
      totalMinutes: totalActualMinutes,
      totalHours: Number((totalActualMinutes / 60).toFixed(2)),
      contacts: activityTotals.contacts,
      conversations: activityTotals.conversations,
      qrScans: activityTotals.qrScans,
      materialsDistributed: activityTotals.materials,
      activityReportedLeads: activityTotals.leads,
      verifiedSignups: activityTotals.signups,
      completedBookings: activityTotals.bookings,
      generatedLeads: leadCounts.total,
      convertedLeads: leadCounts.converted,
      leadsNeedingAdmin: leadCounts.needsAdmin,
      leadsByStatus: leadCounts.byStatus,
      marketingEfforts: efforts.length,
    },
    warning:
      errors.length > 0
        ? "Some Command Center records could not be loaded."
        : "",
  };
}

function validateRequiredFields(
  entity: CommandEntity,
  data: Record<string, unknown>,
) {
  if (entity === "activity") {
    if (!asString(data.title)) return "Activity title is required.";
    if (!asString(data.activity_date)) {
      return "Activity date is required.";
    }
  }

  if (entity === "marketing_effort") {
    if (!asString(data.title)) {
      return "Marketing effort title is required.";
    }
    if (!asString(data.effort_date)) {
      return "Marketing effort date is required.";
    }
    if (!asString(data.effort_type)) {
      return "Marketing effort type is required.";
    }
  }

  if (entity === "lead") {
    if (!asString(data.lead_type)) {
      return "Lead type is required.";
    }

    const hasContact =
      asString(data.full_name) ||
      asString(data.first_name) ||
      asString(data.last_name) ||
      asString(data.email) ||
      asString(data.phone) ||
      asString(data.business_name) ||
      asString(data.organization_name);

    if (!hasContact) {
      return "Enter a name, email, phone, business, or organization.";
    }
  }

  if (entity === "template" && !asString(data.title)) {
    return "Template title is required.";
  }

  return "";
}

async function verifyOwnedRecord({
  entity,
  id,
  ambassadorId,
}: {
  entity: CommandEntity;
  id: string;
  ambassadorId: string;
}) {
  const table = tableForEntity(entity);
  const ownerColumn =
    entity === "template"
      ? "owner_ambassador_id"
      : "ambassador_id";

  const { data, error } = await supabaseAdmin
    .from(table)
    .select("*")
    .eq("id", id)
    .eq(ownerColumn, ambassadorId)
    .maybeSingle();

  if (error) {
    console.error("AMBASSADOR COMMAND CENTER OWNERSHIP ERROR:", error);
    return null;
  }

  return data;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}

export async function GET(req: NextRequest) {
  const access = await requireAmbassador(req);

  if (access.error || !access.ambassador || !access.user) {
    return access.error;
  }

  const defaultStart = addDays(todayIsoDate(), -30);
  const defaultEnd = addDays(todayIsoDate(), 60);
  const startDate =
    parseDateParam(req.nextUrl.searchParams.get("start")) ||
    defaultStart;
  const endDate =
    parseDateParam(req.nextUrl.searchParams.get("end")) ||
    defaultEnd;

  if (endDate < startDate) {
    return json(
      req,
      {
        success: false,
        error: "End date must be on or after start date.",
      },
      400,
    );
  }

  const commandCenter = await loadCommandCenter({
    ambassador: access.ambassador,
    startDate,
    endDate,
  });

  return json(req, {
    success: true,
    user: access.user,
    ambassador: access.ambassador,
    commandCenter,
  });
}

export async function POST(req: NextRequest) {
  const access = await requireAmbassador(req);

  if (access.error || !access.ambassador || !access.user) {
    return access.error;
  }

  let body: CommandBody;

  try {
    body = (await req.json()) as CommandBody;
  } catch {
    return json(
      req,
      {
        success: false,
        error: "Request body must be valid JSON.",
      },
      400,
    );
  }

  const entity = normalizeEntity(body.entity);

  if (!entity) {
    return json(
      req,
      {
        success: false,
        error:
          "Entity must be activity, marketing_effort, lead, or template.",
      },
      400,
    );
  }

  const data = cleanAllowedFields(
    asObject(body.data),
    fieldsForEntity(entity),
  );
  const validationError = validateRequiredFields(entity, data);

  if (validationError) {
    return json(
      req,
      {
        success: false,
        error: validationError,
      },
      400,
    );
  }

  const table = tableForEntity(entity);
  const insertPayload: Record<string, unknown> = {
    ...data,
    created_by: access.user.id,
  };

  if (entity === "template") {
    insertPayload.owner_ambassador_id = access.ambassador.id;
    delete insertPayload.created_by;
  } else {
    insertPayload.ambassador_id = access.ambassador.id;
    insertPayload.ambassador_user_id = access.user.id;
  }

  if (entity === "lead") {
    insertPayload.referral_code =
      asString(data.referral_code) ||
      access.ambassador.referral_code ||
      null;
  }

  const { data: created, error } = await supabaseAdmin
    .from(table)
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    console.error("AMBASSADOR COMMAND CENTER CREATE ERROR:", error);

    return json(
      req,
      {
        success: false,
        error: `SitGuru could not save the ${entity.replaceAll(
          "_",
          " ",
        )}.`,
        details: error.message,
      },
      500,
    );
  }

  return json(
    req,
    {
      success: true,
      message: `${entity
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase(),
        )} saved.`,
      entity,
      record: created,
    },
    201,
  );
}

export async function PATCH(req: NextRequest) {
  const access = await requireAmbassador(req);

  if (access.error || !access.ambassador || !access.user) {
    return access.error;
  }

  let body: CommandBody;

  try {
    body = (await req.json()) as CommandBody;
  } catch {
    return json(
      req,
      {
        success: false,
        error: "Request body must be valid JSON.",
      },
      400,
    );
  }

  const entity = normalizeEntity(body.entity);
  const id = asString(body.id);

  if (!entity || !id) {
    return json(
      req,
      {
        success: false,
        error: "Entity and record ID are required.",
      },
      400,
    );
  }

  const existing = await verifyOwnedRecord({
    entity,
    id,
    ambassadorId: access.ambassador.id,
  });

  if (!existing) {
    return json(
      req,
      {
        success: false,
        error: "The requested record was not found.",
      },
      404,
    );
  }

  const updates = cleanAllowedFields(
    asObject(body.data),
    fieldsForEntity(entity),
  );

  if (Object.keys(updates).length === 0) {
    return json(
      req,
      {
        success: false,
        error: "No supported changes were provided.",
      },
      400,
    );
  }

  const table = tableForEntity(entity);

  const { data: updated, error } = await supabaseAdmin
    .from(table)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("AMBASSADOR COMMAND CENTER UPDATE ERROR:", error);

    return json(
      req,
      {
        success: false,
        error: `SitGuru could not update the ${entity.replaceAll(
          "_",
          " ",
        )}.`,
        details: error.message,
      },
      500,
    );
  }

  return json(req, {
    success: true,
    message: "Changes saved.",
    entity,
    record: updated,
  });
}

export async function DELETE(req: NextRequest) {
  const access = await requireAmbassador(req);

  if (access.error || !access.ambassador) {
    return access.error;
  }

  const entity = normalizeEntity(
    req.nextUrl.searchParams.get("entity"),
  );
  const id = asString(req.nextUrl.searchParams.get("id"));

  if (!entity || !id) {
    return json(
      req,
      {
        success: false,
        error: "Entity and record ID are required.",
      },
      400,
    );
  }

  if (entity === "lead") {
    return json(
      req,
      {
        success: false,
        error:
          "Lead records are preserved for Admin accuracy. Update the lead status instead of deleting it.",
      },
      409,
    );
  }

  const existing = await verifyOwnedRecord({
    entity,
    id,
    ambassadorId: access.ambassador.id,
  });

  if (!existing) {
    return json(
      req,
      {
        success: false,
        error: "The requested record was not found.",
      },
      404,
    );
  }

  if (
    entity === "activity" &&
    !["planned", "confirmed", "deferred", "cancelled"].includes(
      asString(existing.status),
    )
  ) {
    return json(
      req,
      {
        success: false,
        error:
          "Completed or in-progress activity records are preserved for reporting. Mark the activity cancelled or deferred instead.",
      },
      409,
    );
  }

  if (
    entity === "marketing_effort" &&
    ["published", "completed"].includes(asString(existing.status))
  ) {
    return json(
      req,
      {
        success: false,
        error:
          "Published or completed marketing records are preserved for reporting.",
      },
      409,
    );
  }

  const table = tableForEntity(entity);
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("AMBASSADOR COMMAND CENTER DELETE ERROR:", error);

    return json(
      req,
      {
        success: false,
        error: "SitGuru could not delete the record.",
        details: error.message,
      },
      500,
    );
  }

  return json(req, {
    success: true,
    message: "Record deleted.",
    entity,
    id,
  });
}