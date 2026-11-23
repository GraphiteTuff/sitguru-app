import { supabaseAdmin } from "@/lib/supabase/admin";
import { campaignTrackingUrl, slugifyCampaign } from "@/lib/admin/growth/constants";
import {
  bookingCountBucket,
  conversionRate,
  weekStartKey,
} from "@/lib/manager-growth/model";

type Row = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nyDay(iso: string) {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "";
  return new Date(time).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export function addDays(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function reportWindow(preset: string, today = weekStartKey()) {
  if (preset === "previous") return { start: addDays(today, -7), end: today, label: "Previous week" };
  if (preset === "month") return { start: `${today.slice(0, 8)}01`, end: addDays(today, 7), label: "This month" };
  if (preset === "previous-month") {
    const [year, month] = today.split("-").map(Number);
    const first = new Date(Date.UTC(year, month - 2, 1));
    const next = new Date(Date.UTC(year, month - 1, 1));
    return {
      start: first.toISOString().slice(0, 10),
      end: next.toISOString().slice(0, 10),
      label: "Previous month",
    };
  }
  return { start: today, end: addDays(today, 7), label: "This week" };
}

async function rows(table: string, columns: string, filter?: { column: string; value: string }) {
  try {
    let query = supabaseAdmin.from(table).select(columns).limit(200);
    if (filter) query = query.eq(filter.column, filter.value);
    const { data, error } = await query;
    if (error) return [] as Row[];
    return (data || []) as unknown as Row[];
  } catch {
    return [] as Row[];
  }
}

export async function loadWeeklyWork(ownerId: string) {
  const week = weekStartKey();
  const [initiatives, reviewRows, goalRows] = await Promise.all([
    rows("manager_work_initiatives", "id,title,objective,audience,idea,channel,call_to_action,measurement,category,status,start_on,due_on,notes,archived", { column: "owner_user_id", value: ownerId }),
    rows("manager_work_reviews", "week_start,happened,why,learning,next_step,hours_note,ceo_note", { column: "owner_user_id", value: ownerId }),
    rows("manager_work_goals", "goals", { column: "owner_user_id", value: ownerId }),
  ]);
  const visible = initiatives.filter((row) => row.archived !== true);
  return {
    week,
    initiatives: visible,
    inProgress: visible.filter((row) => ["Execution", "Assignment", "Decision"].includes(text(row.status))).length,
    completed: visible.filter((row) => row.status === "Learning").length,
    review: reviewRows.find((row) => text(row.week_start) === week) || null,
    goals: (goalRows[0]?.goals && typeof goalRows[0].goals === "object" ? goalRows[0].goals : {}) as Record<string, string>,
  };
}

export async function loadCampaignDesk(ownerId: string) {
  const [campaigns, content] = await Promise.all([
    rows("growth_campaigns", "id,campaign_name,campaign_slug,channel,status,utm_source,utm_campaign,destination_url,start_date,end_date,notes"),
    rows("manager_work_content", "id,title,caption,channel,planned_on,status,published_url,activity_note,happened,learning,next_step", { column: "owner_user_id", value: ownerId }),
  ]);
  return {
    campaigns: campaigns.map((row) => ({
      ...row,
      link: campaignTrackingUrl(text(row.campaign_slug) || slugifyCampaign(text(row.campaign_name))),
    })),
    content,
  };
}

export async function loadOutreach(ownerId: string) {
  const [{ data, error }, { data: staff }] = await Promise.all([
    supabaseAdmin.from("manager_work_outreach")
      .select("id,owner_user_id,created_by_user_id,assigned_to_user_id,partner_name,contact_name,partner_kind,opportunity,sitguru_benefit,partner_benefit,who_benefits,proposed_activity,commitment,leadership_approved,status,follow_up_on,next_action,lesson,lead_source,city,state,street_address,phone,email,website,social_url,interests,priority,outcome_type,last_contacted_at,created_at,updated_at")
      .order("updated_at", { ascending: false }).limit(300),
    supabaseAdmin.from("staff_engagements").select("user_id,display_name,email").eq("status", "active").order("display_name"),
  ]);
  if (error) console.error("[growth-outreach] failed to load", error.message);
  const list = (data || []) as Row[];
  const people = (staff || []).filter((person) => Boolean(person.user_id)).map((person) => ({
    id: String(person.user_id),
    name: String(person.display_name || person.email || "Staff member"),
    email: String(person.email || ""),
  }));
  const ids = list.map((record) => String(record.id));
  let activity: Row[] = [];
  if (ids.length) {
    const { data: events, error: eventError } = await supabaseAdmin
      .from("manager_work_outreach_activity")
      .select("id,outreach_id,actor_user_id,activity_type,previous_status,new_status,note,created_at")
      .in("outreach_id", ids)
      .order("created_at", { ascending: false })
      .limit(600);
    if (eventError) console.error("[growth-outreach] history unavailable", eventError.message);
    activity = (events || []) as Row[];
  }
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const weekEnd = addDays(today, 7);
  return {
    list,
    activity,
    staff: people,
    ownerId,
    followUps: list.filter((record) =>
      text(record.follow_up_on) && text(record.follow_up_on) <= weekEnd &&
      !["Closed", "Not interested"].includes(text(record.status))),
    overdue: list.filter((record) =>
      text(record.follow_up_on) && text(record.follow_up_on) < today &&
      !["Closed", "Not interested"].includes(text(record.status))).length,
  };
}

export async function loadSurveys(ownerId: string) {
  const surveys = await rows(
    "manager_work_surveys",
    "id,code,title,question,audience,choices,start_on,end_on,status,learning,next_step",
    { column: "owner_user_id", value: ownerId },
  );
  const ids = surveys.map((row) => text(row.id)).filter(Boolean);
  let responses: Row[] = [];
  if (ids.length) {
    try {
      const { data, error } = await supabaseAdmin.from("manager_work_responses").select("survey_id,choice").in("survey_id", ids).limit(500);
      if (!error) responses = (data || []) as Row[];
    } catch {
      responses = [];
    }
  }
  return { surveys, responses };
}

export async function loadScorecard(preset: string) {
  const window = reportWindow(preset);
  const inRange = (iso: string) => {
    const day = nyDay(iso);
    return Boolean(day) && day >= window.start && day < window.end;
  };
  let visits: number | null = null;
  let signups: number | null = null;
  let registrations: number | null = null;
  let gurus: number | null = null;
  let bookingRequests = 0;
  let confirmedBookings = 0;
  try {
    const { data, error } = await supabaseAdmin
      .from("growth_campaign_events")
      .select("event_type,created_at")
      .gte("created_at", `${window.start}T00:00:00.000Z`)
      .limit(2000);
    if (!error) {
      const events = (data || []) as Row[];
      visits = events.filter((row) => inRange(text(row.created_at)) && ["click", "page_view", "visit"].includes(text(row.event_type).toLowerCase())).length;
      signups = events.filter((row) => inRange(text(row.created_at)) && text(row.event_type).toLowerCase() === "signup").length;
    }
  } catch {
    visits = null;
    signups = null;
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("role,account_type,created_at")
      .gte("created_at", `${window.start}T00:00:00.000Z`)
      .limit(1500);
    if (!error) {
      const people = ((data || []) as Row[]).filter((row) => inRange(text(row.created_at)));
      const role = (row: Row) => `${text(row.role)} ${text(row.account_type)}`.toLowerCase();
      registrations = people.filter((row) => /parent|customer|pet/.test(role(row)) && !/guru/.test(role(row))).length;
      gurus = people.filter((row) => /guru/.test(role(row))).length;
    }
  } catch {
    registrations = null;
    gurus = null;
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("status,booking_status,created_at")
      .gte("created_at", `${window.start}T00:00:00.000Z`)
      .limit(1500);
    if (!error) {
      for (const row of (data || []) as Row[]) {
        if (!inRange(text(row.created_at))) continue;
        const bucket = bookingCountBucket(text(row.booking_status) || text(row.status));
        if (bucket === "confirmed") confirmedBookings += 1;
        if (bucket === "requested") bookingRequests += 1;
      }
    }
  } catch {
    bookingRequests = 0;
    confirmedBookings = 0;
  }
  return {
    ...window,
    visits,
    signups,
    registrations,
    gurus,
    bookingRequests,
    confirmedBookings,
    visitToRegistration: conversionRate(registrations || 0, visits),
    registrationToRequest: conversionRate(bookingRequests, registrations),
    requestToConfirmed: conversionRate(confirmedBookings, bookingRequests),
  };
}

export async function loadPublicSurvey(code: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("manager_work_surveys")
      .select("id,code,title,question,choices,start_on,end_on,status")
      .eq("code", code)
      .maybeSingle();
    if (error || !data) return null;
    return data as Row;
  } catch {
    return null;
  }
}
