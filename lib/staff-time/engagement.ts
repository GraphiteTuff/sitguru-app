import { supabaseAdmin } from "@/lib/supabase/admin";
import { GROWTH_HIRE_ROLE, GROWTH_HIRE_TITLE } from "@/lib/admin/growth/hire";
import { mapEngagement, mapRate } from "@/lib/staff-time/mappers";
import type { StaffCompensationRate, StaffEngagement } from "@/lib/staff-time/types";
import { dollarsToCents } from "@/lib/staff-time/money";

/** Default Ava engagement seed values — overridable per engagement row. */
export const DEFAULT_STAFF_ENGAGEMENT = {
  expectedWeeklyMinHours: 10,
  expectedWeeklyMaxHours: 15,
  paymentCadence: "biweekly",
  periodAnchorOn: "2025-11-02",
  hourlyRateDollars: 16.75,
  title: GROWTH_HIRE_TITLE,
} as const;

async function profileName(userId: string, email: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("full_name,first_name,last_name,email")
    .eq("id", userId)
    .maybeSingle();
  const full =
    String(data?.full_name || "").trim() ||
    `${String(data?.first_name || "").trim()} ${String(data?.last_name || "").trim()}`.trim();
  if (full) return full;
  return email.split("@")[0] || "Team member";
}

/**
 * Ensure an active staff engagement exists for a growth/manager user.
 * Uses engagement table as source of truth for rate/range — never hardcodes UI globals.
 */
export async function ensureStaffEngagement(input: {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  createIfMissing?: boolean;
}): Promise<StaffEngagement | null> {
  const { data: existing } = await supabaseAdmin
    .from("staff_engagements")
    .select("*")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing) return mapEngagement(existing as Record<string, unknown>);

  if (input.createIfMissing === false) return null;

  const email = String(input.email || "").trim().toLowerCase();
  const displayName =
    String(input.displayName || "").trim() ||
    (await profileName(input.userId, email));

  const now = new Date().toISOString();
  const { data: created, error } = await supabaseAdmin
    .from("staff_engagements")
    .insert({
      user_id: input.userId,
      email,
      display_name: displayName,
      title: DEFAULT_STAFF_ENGAGEMENT.title,
      status: "active",
      expected_weekly_min_hours: DEFAULT_STAFF_ENGAGEMENT.expectedWeeklyMinHours,
      expected_weekly_max_hours: DEFAULT_STAFF_ENGAGEMENT.expectedWeeklyMaxHours,
      payment_cadence: DEFAULT_STAFF_ENGAGEMENT.paymentCadence,
      period_anchor_on: DEFAULT_STAFF_ENGAGEMENT.periodAnchorOn,
      currency: "USD",
      w9_status: "not_requested",
      employment_classification: "contractor",
      start_on: now.slice(0, 10),
      updated_at: now,
    })
    .select("*")
    .maybeSingle();

  if (error || !created) {
    console.warn("[staff-time] ensure engagement", error?.message);
    return null;
  }

  const engagement = mapEngagement(created as Record<string, unknown>);
  await supabaseAdmin.from("staff_compensation_rates").insert({
    engagement_id: engagement.id,
    hourly_rate_cents: dollarsToCents(DEFAULT_STAFF_ENGAGEMENT.hourlyRateDollars),
    effective_on: engagement.startOn || DEFAULT_STAFF_ENGAGEMENT.periodAnchorOn,
    notes: "Initial engagement rate",
  });

  return engagement;
}

/** Resolve engagement for the signed-in growth manager, creating defaults when eligible. */
export async function resolveManagerEngagement(input: {
  userId: string;
  email?: string | null;
  role?: string | null;
  isSuperUser?: boolean;
}): Promise<StaffEngagement | null> {
  const existing = await ensureStaffEngagement({
    userId: input.userId,
    email: input.email,
    createIfMissing: false,
  });
  if (existing) return existing;

  const role = String(input.role || "").toLowerCase();
  const eligible =
    role === GROWTH_HIRE_ROLE ||
    role === "marketing_admin" ||
    Boolean(input.isSuperUser);

  if (!eligible) return null;

  return ensureStaffEngagement({
    userId: input.userId,
    email: input.email,
    createIfMissing: true,
  });
}

export async function listCompensationRates(
  engagementId: string,
): Promise<StaffCompensationRate[]> {
  const { data, error } = await supabaseAdmin
    .from("staff_compensation_rates")
    .select("*")
    .eq("engagement_id", engagementId)
    .order("effective_on", { ascending: false });
  if (error) {
    console.warn("[staff-time] rates", error.message);
    return [];
  }
  return (data || []).map((row) => mapRate(row as Record<string, unknown>));
}

export async function findEngagementById(id: string) {
  const { data } = await supabaseAdmin
    .from("staff_engagements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapEngagement(data as Record<string, unknown>) : null;
}

export async function listActiveEngagements(): Promise<StaffEngagement[]> {
  const { data, error } = await supabaseAdmin
    .from("staff_engagements")
    .select("*")
    .eq("status", "active")
    .order("display_name", { ascending: true });
  if (error) {
    console.warn("[staff-time] list engagements", error.message);
    return [];
  }
  return (data || []).map((row) => mapEngagement(row as Record<string, unknown>));
}
