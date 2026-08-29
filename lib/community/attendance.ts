import { supabaseAdmin } from "@/lib/supabase/admin";

export type AttendanceRole = "pet_parent" | "guru" | "ambassador";
export type AttendanceStatus = "going" | "interested" | "cancelled";

export type EventAttendanceCounts = {
  petParents: number;
  gurus: number;
  ambassadors: number;
  totalGoing: number;
  /** Maybe = status `interested` */
  totalMaybe: number;
  /** No = status `cancelled` */
  totalNo: number;
};

export type EventAttendanceRow = {
  id: string;
  event_id: string;
  user_id: string | null;
  guest_key?: string | null;
  attendance_role: AttendanceRole;
  status: AttendanceStatus;
};

const emptyCounts = (): EventAttendanceCounts => ({
  petParents: 0,
  gurus: 0,
  ambassadors: 0,
  totalGoing: 0,
  totalMaybe: 0,
  totalNo: 0,
});

const GUEST_KEY_RE = /^[a-zA-Z0-9_-]{8,64}$/;

export function isValidGuestKey(value: unknown): value is string {
  return typeof value === "string" && GUEST_KEY_RE.test(value.trim());
}

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
      totalMaybe: Number(row.total_maybe ?? row.total_interested ?? 0),
      totalNo: Number(row.total_no ?? row.total_cancelled ?? 0),
    };
  }

  // Fallback if RPC not applied / older signature
  const { data: rows } = await supabaseAdmin
    .from("community_event_attendance")
    .select("attendance_role, status")
    .eq("event_id", eventId);

  const list = rows || [];
  const going = list.filter((row) => row.status === "going");
  return {
    ...emptyCounts(),
    petParents: going.filter((row) => row.attendance_role === "pet_parent").length,
    gurus: going.filter((row) => row.attendance_role === "guru").length,
    ambassadors: going.filter((row) => row.attendance_role === "ambassador")
      .length,
    totalGoing: going.length,
    totalMaybe: list.filter((row) => row.status === "interested").length,
    totalNo: list.filter((row) => row.status === "cancelled").length,
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

export async function getGuestEventAttendance(eventId: string, guestKey: string) {
  const { data } = await supabaseAdmin
    .from("community_event_attendance")
    .select("*")
    .eq("event_id", eventId)
    .eq("guest_key", guestKey.trim())
    .maybeSingle();

  return (data as EventAttendanceRow | null) || null;
}

export async function setEventAttendance(input: {
  eventId: string;
  userId?: string | null;
  guestKey?: string | null;
  status: AttendanceStatus;
  role?: AttendanceRole;
}) {
  const userId = input.userId?.trim() || null;
  const guestKey = input.guestKey?.trim() || null;

  if (!userId && !guestKey) {
    return { ok: false as const, error: "Sign-in or guest key required." };
  }
  if (userId && guestKey) {
    return { ok: false as const, error: "Provide either user or guest, not both." };
  }
  if (guestKey && !isValidGuestKey(guestKey)) {
    return { ok: false as const, error: "Invalid guest key." };
  }

  const role =
    input.role ||
    (userId ? await resolveAttendanceRole(userId) : "pet_parent");
  const now = new Date().toISOString();

  // Upsert by unique partial indexes — look up existing row first for guests/users
  const existing = userId
    ? await getUserEventAttendance(input.eventId, userId)
    : await getGuestEventAttendance(input.eventId, guestKey!);

  if (existing?.id) {
    const { data, error } = await supabaseAdmin
      .from("community_event_attendance")
      .update({
        attendance_role: role,
        status: input.status,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      return {
        ok: false as const,
        error: error.message || "Unable to update attendance.",
      };
    }
    return { ok: true as const, attendance: data as EventAttendanceRow };
  }

  const { data, error } = await supabaseAdmin
    .from("community_event_attendance")
    .insert({
      event_id: input.eventId,
      user_id: userId,
      guest_key: guestKey,
      attendance_role: role,
      status: input.status,
      updated_at: now,
    })
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
    .eq("status", "going")
    .not("user_id", "is", null);

  return (data || []).map((row) => String(row.user_id)).filter(Boolean);
}

export type EventAttendanceAdminRow = {
  id: string;
  userId: string | null;
  guestKey: string | null;
  status: AttendanceStatus;
  role: AttendanceRole;
  updatedAt: string | null;
  name: string;
  email: string | null;
};

function statusLabel(status: AttendanceStatus) {
  if (status === "going") return "Yes";
  if (status === "interested") return "Maybe";
  return "No";
}

export { statusLabel as attendanceStatusLabel };

/** Admin roster: who answered Yes / Maybe / No for an event. */
export async function listEventAttendanceForAdmin(eventId: string): Promise<{
  counts: EventAttendanceCounts;
  rows: EventAttendanceAdminRow[];
}> {
  const counts = await getEventAttendanceCounts(eventId);

  const { data: attendanceRows } = await supabaseAdmin
    .from("community_event_attendance")
    .select("id, user_id, guest_key, attendance_role, status, updated_at, created_at")
    .eq("event_id", eventId)
    .order("updated_at", { ascending: false });

  const list = attendanceRows || [];
  const userIds = Array.from(
    new Set(
      list
        .map((row) => (row.user_id ? String(row.user_id) : ""))
        .filter(Boolean),
    ),
  );

  const profileById = new Map<
    string,
    { full_name?: string | null; email?: string | null; display_name?: string | null }
  >();

  if (userIds.length) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, display_name, email")
      .in("id", userIds);

    for (const profile of profiles || []) {
      profileById.set(String(profile.id), profile);
    }
  }

  const rows: EventAttendanceAdminRow[] = list.map((row) => {
    const userId = row.user_id ? String(row.user_id) : null;
    const guestKey = row.guest_key ? String(row.guest_key) : null;
    const profile = userId ? profileById.get(userId) : null;
    const name = userId
      ? String(profile?.full_name || "").trim() ||
        String(profile?.display_name || "").trim() ||
        "SitGuru member"
      : "Guest";

    return {
      id: String(row.id),
      userId,
      guestKey,
      status: row.status as AttendanceStatus,
      role: row.attendance_role as AttendanceRole,
      updatedAt: row.updated_at || row.created_at || null,
      name,
      email: profile?.email ? String(profile.email) : null,
    };
  });

  return { counts, rows };
}
