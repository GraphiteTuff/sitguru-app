import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  approvedHours,
  creditBearingHours,
  semesterOverage,
  semesterPace,
} from "@/lib/timekeeper/domain";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function rows(data: unknown) {
  return (Array.isArray(data) ? data : []) as Record<string, unknown>[];
}

export type TimeEntryView = {
  id: string;
  workedOn: string;
  hours: number;
  status: string;
  category: string;
  description: string;
  timerActive: boolean;
  startedAt: string | null;
  weekNumber: number;
};

function mapEntry(row: Record<string, unknown>): TimeEntryView {
  return {
    id: text(row.id),
    workedOn: text(row.worked_on),
    hours: Number(row.duration_hours || 0),
    status: text(row.status) || "draft",
    category: text(row.category_slug),
    description: text(row.description),
    timerActive: row.timer_active === true,
    startedAt: text(row.started_at) || null,
    weekNumber: Number(row.week_number || 0),
  };
}

export async function loadCategories(audience: "contractor" | "intern") {
  const { data, error } = await supabaseAdmin
    .from("timekeeper_categories")
    .select("slug,name,audience")
    .eq("is_active", true)
    .order("sort_order");
  if (error) return [];
  return rows(data)
    .filter((row) => text(row.audience) === audience || text(row.audience) === "both")
    .map((row) => ({ slug: text(row.slug), name: text(row.name) }));
}

export async function loadOwnEntries(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("timekeeper_entries")
    .select("id,worked_on,duration_hours,status,category_slug,description,timer_active,started_at,week_number")
    .eq("owner_user_id", userId)
    .order("worked_on", { ascending: false })
    .limit(40);
  if (error) return [] as TimeEntryView[];
  return rows(data).map(mapEntry);
}

export async function loadInternTime(input: {
  internId: string;
  requiredHours: number;
  weeks: number;
  weeklyTarget: number;
  currentWeek: number;
}) {
  const { data, error } = await supabaseAdmin
    .from("timekeeper_entries")
    .select("id,worked_on,duration_hours,status,category_slug,description,timer_active,started_at,week_number")
    .eq("intern_id", input.internId)
    .order("worked_on", { ascending: false })
    .limit(80);
  if (error) return null;
  const entries = rows(data).map(mapEntry);
  const official = approvedHours(entries.map((row) => ({ hours: row.hours, status: row.status })));
  const pace = semesterPace({
    requiredHours: input.requiredHours,
    approvedHours: official,
    internshipWeeks: input.weeks,
    currentWeek: input.currentWeek,
    weeklyTarget: input.weeklyTarget,
  });
  const pending = entries
    .filter((row) => row.weekNumber === input.currentWeek && !["founder_approved", "locked"].includes(row.status))
    .reduce((sum, row) => sum + row.hours, 0);
  const { data: week } = await supabaseAdmin
    .from("timekeeper_weeks")
    .select("id,status")
    .eq("intern_id", input.internId)
    .eq("week_number", input.currentWeek)
    .maybeSingle();
  return {
    entries,
    official,
    credit: creditBearingHours(official, input.requiredHours),
    pace,
    weekStatus: text(week?.status) || "open",
    overage: input.requiredHours > 0
      ? semesterOverage({ approvedHours: official, additionalHours: pending, requiredHours: input.requiredHours })
      : { exceeds: false, message: "", total: official },
  };
}

export async function loadFounderQueue() {
  const { data, error } = await supabaseAdmin
    .from("timekeeper_weeks")
    .select("id,intern_id,week_number,status")
    .eq("status", "manager_recommended")
    .limit(40);
  if (error) return [];
  return rows(data).map((row) => ({
    id: text(row.id),
    internId: text(row.intern_id),
    weekNumber: Number(row.week_number || 0),
    status: text(row.status),
  }));
}
