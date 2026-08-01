// lib/pawreport/service.ts
/**
 * PawReport data loader — builds the live payload for GET /api/pawreports/[bookingId].
 * Place frontend hooks against this shape (see hooks/usePawReportLive.ts).
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import type { PawReportAccess } from "@/lib/pawreport/access";
import {
  calculateDurationSeconds,
  metersToMilesLabel,
  secondsToDurationLabel,
} from "@/lib/pawreport/format";
import type {
  PawReportLivePayload,
  PawReportPhoto,
  PawReportSessionStatus,
  PawReportStatusLog,
  WalkPoint,
} from "@/lib/pawreport/types";

type SessionRow = {
  id: string;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
  final_note: string | null;
  updated_at?: string | null;
};

type UpdateRow = {
  id: string;
  update_type: string | null;
  note: string | null;
  photo_url: string | null;
  created_at: string | null;
};

type WalkRow = {
  id: string;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
  total_distance_meters: number | string | null;
  total_duration_seconds: number | string | null;
  updated_at: string | null;
};

type PointRow = {
  lat: number | string | null;
  lng: number | string | null;
  recorded_at: string | null;
};

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSessionStatus(value: string | null): PawReportSessionStatus {
  const status = String(value || "not_started").toLowerCase();
  if (status === "in_progress") return "in_progress";
  if (status === "completed") return "completed";
  if (status === "canceled" || status === "cancelled") return "canceled";
  return "not_started";
}

function buildStatusLogs(updates: UpdateRow[]): PawReportStatusLog[] {
  const latestByKey = new Map<string, UpdateRow>();

  for (const update of updates) {
    const type = String(update.update_type || "").toLowerCase();
    let key: "food" | "water" | "potty" | "medication" | null = null;

    if (type === "food") key = "food";
    else if (type === "water") key = "water";
    else if (type === "pee" || type === "poop") key = "potty";
    else if (type === "medication") key = "medication";

    if (!key) continue;
    latestByKey.set(key, update);
  }

  const defs: Array<{
    key: "food" | "water" | "potty" | "medication";
    label: string;
    empty: string;
  }> = [
    { key: "food", label: "Food", empty: "Not logged yet" },
    { key: "water", label: "Water", empty: "Not logged yet" },
    { key: "potty", label: "Potty", empty: "Not logged yet" },
    { key: "medication", label: "Medication", empty: "Not scheduled" },
  ];

  return defs.map((def) => {
    const hit = latestByKey.get(def.key);
    return {
      key: def.key,
      label: def.label,
      done: Boolean(hit),
      detail: hit?.note?.trim() || (hit ? "Logged" : def.empty),
      updatedAt: hit?.created_at || null,
    };
  });
}

async function resolveDisplayNames(params: {
  booking: Record<string, unknown>;
  guruId: string;
}) {
  let petName = "Your pet";
  let guruName = "Your Guru";

  const petId = String(
    params.booking.pet_id ||
      params.booking.customer_pet_id ||
      params.booking.primary_pet_id ||
      "",
  ).trim();

  if (petId) {
    const { data: pet } = await supabaseAdmin
      .from("pets")
      .select("name")
      .eq("id", petId)
      .maybeSingle();
    const liveName = (pet as { name?: string } | null)?.name;
    if (liveName?.trim()) petName = liveName.trim();
  }

  if (petName === "Your pet") {
    const petFromBooking =
      params.booking.pet_name ||
      params.booking.petName ||
      params.booking.animal_name;
    if (typeof petFromBooking === "string" && petFromBooking.trim()) {
      petName = petFromBooking.trim();
    }
  }

  if (params.guruId) {
    const { data: guru } = await supabaseAdmin
      .from("gurus")
      .select("display_name,full_name")
      .or(`user_id.eq.${params.guruId},id.eq.${params.guruId}`)
      .limit(1)
      .maybeSingle();

    const name =
      (guru as { display_name?: string; full_name?: string } | null)
        ?.display_name ||
      (guru as { display_name?: string; full_name?: string } | null)?.full_name;

    if (name?.trim()) guruName = name.trim();
  }

  return { petName, guruName };
}

export async function buildPawReportLivePayload(params: {
  bookingId: string;
  access: PawReportAccess;
}): Promise<PawReportLivePayload> {
  const bookingId = params.bookingId;

  const [{ data: session }, { data: updates }, { data: walks }] =
    await Promise.all([
      supabaseAdmin
        .from("booking_visit_sessions")
        .select("id,status,started_at,ended_at,final_note,updated_at")
        .eq("booking_id", bookingId)
        .maybeSingle(),
      supabaseAdmin
        .from("booking_visit_updates")
        .select("id,update_type,note,photo_url,created_at")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("booking_walk_tracks")
        .select(
          "id,status,started_at,ended_at,total_distance_meters,total_duration_seconds,updated_at",
        )
        .eq("booking_id", bookingId)
        .order("updated_at", { ascending: false }),
    ]);

  const sessionRow = (session as SessionRow | null) || null;
  const updateRows = (updates || []) as UpdateRow[];
  const walkRows = (walks || []) as WalkRow[];

  const activeWalk =
    walkRows.find((walk) =>
      ["in_progress", "paused"].includes(
        String(walk.status || "").toLowerCase(),
      ),
    ) || walkRows[0] || null;

  let path: WalkPoint[] = [];
  if (activeWalk?.id) {
    const { data: points } = await supabaseAdmin
      .from("booking_walk_track_points")
      .select("lat,lng,recorded_at")
      .eq("walk_track_id", activeWalk.id)
      .order("recorded_at", { ascending: true })
      .limit(500);

    path = ((points || []) as PointRow[])
      .map((point) => ({
        lat: asNumber(point.lat),
        lng: asNumber(point.lng),
        recordedAt: point.recorded_at || new Date().toISOString(),
      }))
      .filter((point) => point.lat !== 0 || point.lng !== 0);
  }

  const distanceMeters = asNumber(activeWalk?.total_distance_meters);
  const storedDuration = asNumber(activeWalk?.total_duration_seconds);
  const liveDuration =
    activeWalk &&
    ["in_progress", "paused"].includes(
      String(activeWalk.status || "").toLowerCase(),
    )
      ? calculateDurationSeconds(activeWalk.started_at, activeWalk.ended_at)
      : storedDuration;

  const photos: PawReportPhoto[] = updateRows
    .filter((row) => row.photo_url)
    .map((row) => ({
      id: row.id,
      url: String(row.photo_url),
      note: row.note,
      createdAt: row.created_at || new Date().toISOString(),
    }));

  const assignedGuruId =
    String(
      (params.access.booking as { guru_id?: string }).guru_id ||
        (params.access.booking as { provider_id?: string }).provider_id ||
        "",
    ) || "";

  const { petName, guruName } = await resolveDisplayNames({
    booking: params.access.booking as Record<string, unknown>,
    guruId: assignedGuruId,
  });

  const updatedAt =
    activeWalk?.updated_at ||
    sessionRow?.updated_at ||
    updateRows[updateRows.length - 1]?.created_at ||
    new Date().toISOString();

  return {
    bookingId,
    petName,
    guruName,
    viewerRole: params.access.role,
    canWrite: params.access.canWrite,
    session: {
      id: sessionRow?.id || null,
      status: normalizeSessionStatus(sessionRow?.status || null),
      startedAt: sessionRow?.started_at || null,
      endedAt: sessionRow?.ended_at || null,
      finalNote: sessionRow?.final_note || null,
    },
    walk: {
      isActive: ["in_progress", "paused"].includes(
        String(activeWalk?.status || "").toLowerCase(),
      ),
      distanceMeters,
      durationSeconds: liveDuration,
      distanceLabel: metersToMilesLabel(distanceMeters),
      durationLabel: secondsToDurationLabel(liveDuration),
      path,
    },
    photos,
    newPhotoCount: photos.length,
    statusLogs: buildStatusLogs(updateRows),
    recentNotes: updateRows
      .slice(-8)
      .reverse()
      .map((row) => ({
        id: row.id,
        updateType: String(row.update_type || "note"),
        note: row.note,
        createdAt: row.created_at || new Date().toISOString(),
      })),
    updatedAt,
  };
}
