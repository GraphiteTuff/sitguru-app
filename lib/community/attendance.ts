import { supabaseAdmin } from "@/lib/supabase/admin";

export type AttendanceRole = "pet_parent" | "guru" | "ambassador";
export type AttendanceStatus = "going" | "interested" | "cancelled";

export type EventAttendanceCounts = {
  petParents: number;
  gurus: number;
  ambassadors: number;
  totalGoing: number;
};

export type EventAttendanceRow = {
  id: string;
  event_id: string;
  user_id: string;
  attendance_role: AttendanceRole;
  status: AttendanceStatus;
};

export async function resolveAttendanceRole(userId: string): Promise<AttendanceRole> {
  const [{ data: roles }, { data: guru }, { data: ambassador }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    supabaseAdmin.from("gurus").select("id").eq("user_id", userId).limit(1).maybeSingle(),
    supabaseAdmin
      .from("ambassadors")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle(),
  ]);

  const roleSet = new Set(
    (roles || []).map((row) =>
      String(row.role || "")
        .trim()
        .toLowerCase(),
    ),
  );

  if (roleSet.has("ambassador") || ambassador?.id) return "ambassador";
  if (roleSet.has("guru") || roleSet.has("provider") || guru?.id) return "guru";
  return "pet_parent";
}

export async function getEventAttendanceCounts(
  eventId: string,
): Promise<EventAttendanceCounts> {
  const { data, error } = await supabaseAdmin.rpc(
    "get_community_event_attendance_counts",
    { p_event_id: eventId },
  );

  if (!error && Array.isArray(data) && data[0]) {
    const row = data[0] as Record<string, unknown>;
    return {
      petParents: Number(row.pet_parents || 0),
      gurus: Number(row.gurus || 0),
      ambassadors: Number(row.ambassadors || 0),
      totalGoing: Number(row.total_going || 0),
    };
  }

  // Fallback if RPC not applied yet
  const { data: rows } = await supabaseAdmin
    .from("community_event_attendance")
    .select("attendance_role, status")
    .eq("event_id", eventId)
    .eq("status", "going");

  const list = rows || [];
  return {
    petParents: list.filter((row) => row.attendance_role === "pet_parent").length,
    gurus: list.filter((row) => row.attendance_role === "guru").length,
    ambassadors: list.filter((row) => row.attendance_role === "ambassador").length,
    totalGoing: list.length,
  };
}

export async function getUserEventAttendance(eventId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from("community_event_attendance")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  return (data as EventAttendanceRow | null) || null;
}

export async function setEventAttendance(input: {
  eventId: string;
  userId: string;
  status: AttendanceStatus;
  role?: AttendanceRole;
}) {
  const role = input.role || (await resolveAttendanceRole(input.userId));
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("community_event_attendance")
    .upsert(
      {
        event_id: input.eventId,
        user_id: input.userId,
        attendance_role: role,
        status: input.status,
        updated_at: now,
      },
      { onConflict: "event_id,user_id" },
    )
    .select("*")
    .single();

  if (error) {
    return { ok: false as const, error: error.message || "Unable to update attendance." };
  }

  return { ok: true as const, attendance: data as EventAttendanceRow };
}

export async function getEventAttendeeUserIds(eventId: string) {
  const { data } = await supabaseAdmin
    .from("community_event_attendance")
    .select("user_id")
    .eq("event_id", eventId)
    .eq("status", "going");

  return (data || []).map((row) => String(row.user_id)).filter(Boolean);
}
