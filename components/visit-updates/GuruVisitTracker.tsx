"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  addVisitUpdateAction,
  endVisitAction,
  endWalkTrackAction,
  recordWalkTrackPointAction,
  startVisitAction,
  startWalkTrackAction,
} from "@/app/actions/visit-updates";

type VisitSession = {
  id: string;
  booking_id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  final_note: string | null;
};

type GuruVisitTrackerProps = {
  bookingId: string;
  initialSession?: VisitSession | null;
};

type BrowserLocation = {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
};

type CareNoteType = "note" | "medication" | "walk" | "play" | "mood";

type QuickAction = {
  type: string;
  title: string;
  helper: string;
  icon: string;
  note: string;
};

const pottyActions: QuickAction[] = [
  {
    type: "pee",
    title: "Pee",
    helper: "Bathroom update",
    icon: "💧",
    note: "Pee update added.",
  },
  {
    type: "poop",
    title: "Poop",
    helper: "Bathroom update",
    icon: "🐾",
    note: "Poop update added.",
  },
];

const careActions: QuickAction[] = [
  {
    type: "water",
    title: "Water",
    helper: "Fresh water given",
    icon: "🥣",
    note: "Fresh water was provided.",
  },
  {
    type: "food",
    title: "Food",
    helper: "Meal or treat update",
    icon: "🍽️",
    note: "Food update added.",
  },
];

const activityActions: QuickAction[] = [
  {
    type: "walk",
    title: "Walk",
    helper: "Walk completed",
    icon: "🦮",
    note: "Walk update added.",
  },
  {
    type: "play",
    title: "Play",
    helper: "Playtime update",
    icon: "🎾",
    note: "Playtime update added.",
  },
  {
    type: "mood",
    title: "Mood",
    helper: "Pet mood update",
    icon: "😊",
    note: "Mood update added.",
  },
  {
    type: "medication",
    title: "Medication",
    helper: "Medication note",
    icon: "💊",
    note: "Medication update added.",
  },
];

const noteTypeOptions: {
  value: CareNoteType;
  label: string;
  helper: string;
}[] = [
  {
    value: "note",
    label: "Care note",
    helper: "General visit observation",
  },
  {
    value: "medication",
    label: "Medication note",
    helper: "Medication, dosage, or reminder details",
  },
  {
    value: "walk",
    label: "Walk note",
    helper: "Walk route, leash behavior, or exercise details",
  },
  {
    value: "play",
    label: "Play note",
    helper: "Playtime, toys, enrichment, or activity details",
  },
  {
    value: "mood",
    label: "Mood note",
    helper: "Happy, relaxed, nervous, sleepy, energetic, etc.",
  },
];

function getFriendlyError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function getCurrentLocation(): Promise<BrowserLocation> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: null, lng: null, accuracy: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => {
        resolve({ lat: null, lng: null, accuracy: null });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      },
    );
  });
}

function statusLabel(status: string) {
  if (status === "completed") return "PawReport Complete";
  if (status === "in_progress") return "PawReport Active";
  return "Ready to Start";
}

function statusDescription(status: string) {
  if (status === "completed") {
    return "This report has been completed and is ready for the Pet Parent to review.";
  }

  if (status === "in_progress") {
    return "Add live care updates as the visit happens so the Pet Parent can stay connected.";
  }

  return "Start the PawReport when the visit begins. Location is optional and only saved when available.";
}

type WalkStatus = "not_started" | "walking" | "paused" | "completed";

type WalkPoint = {
  lat: number;
  lng: number;
  accuracy: number | null;
  recordedAt: number;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(from: WalkPoint, to: WalkPoint) {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatWalkDistance(meters: number) {
  if (!Number.isFinite(meters) || meters <= 0) return "0.00 mi";

  const miles = meters / 1609.344;
  return `${miles.toFixed(miles >= 10 ? 1 : 2)} mi`;
}

function formatWalkDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0 min";

  const minutes = Math.max(1, Math.round(seconds / 60));

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) return `${hours} hr`;

  return `${hours} hr ${remainingMinutes} min`;
}

function getWalkStatusLabel(status: WalkStatus) {
  if (status === "walking") return "Walking Live";
  if (status === "paused") return "Paused";
  if (status === "completed") return "Walk Completed";
  return "Not Started";
}

function ActionButton({
  action,
  disabled,
  onClick,
}: {
  action: QuickAction;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-[22px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="block text-3xl" aria-hidden="true">
        {action.icon}
      </span>
      <span className="mt-3 block text-base font-black !text-[#061638]">
        {action.title}
      </span>
      <span className="mt-1 block text-xs font-bold !text-slate-700">
        {action.helper}
      </span>
    </button>
  );
}

export default function GuruVisitTracker({
  bookingId,
  initialSession,
}: GuruVisitTrackerProps) {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState(
    initialSession?.status ?? "not_started",
  );
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState<CareNoteType>("note");
  const [finalNote, setFinalNote] = useState(initialSession?.final_note ?? "");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoNote, setPhotoNote] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [walkStatus, setWalkStatus] = useState<WalkStatus>("not_started");
  const [walkTrackId, setWalkTrackId] = useState("");
  const [walkStartedAt, setWalkStartedAt] = useState<number | null>(null);
  const [walkEndedAt, setWalkEndedAt] = useState<number | null>(null);
  const [walkDistanceMeters, setWalkDistanceMeters] = useState(0);
  const [walkLastLocation, setWalkLastLocation] = useState<WalkPoint | null>(
    null,
  );
  const [walkLocationMessage, setWalkLocationMessage] = useState("");
  const watchIdRef = useRef<number | null>(null);
  const walkTrackIdRef = useRef("");
  const walkStartedAtRef = useRef<number | null>(null);
  const walkLastPointRef = useRef<WalkPoint | null>(null);
  const walkLastSavedAtRef = useRef(0);
  const walkDistanceRef = useRef(0);

  const supabaseBrowser = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    );
  }, []);

  const reportActive = sessionStatus === "in_progress";
  const reportCompleted = sessionStatus === "completed";
  const selectedNoteOption =
    noteTypeOptions.find((option) => option.value === noteType) ||
    noteTypeOptions[0];

  function refreshReport() {
    router.refresh();
  }

  function clearWalkWatcher() {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  function getWalkDurationSeconds() {
    if (!walkStartedAtRef.current) return 0;

    const end = walkEndedAt || Date.now();
    return Math.max(0, Math.round((end - walkStartedAtRef.current) / 1000));
  }

  async function saveWalkPoint(point: WalkPoint, forceSave = false) {
    const activeWalkTrackId = walkTrackIdRef.current;

    if (!activeWalkTrackId) return;

    const now = Date.now();
    const secondsSinceLastSave = Math.round(
      (now - walkLastSavedAtRef.current) / 1000,
    );

    if (!forceSave && secondsSinceLastSave < 15) return;

    walkLastSavedAtRef.current = now;

    const result = await recordWalkTrackPointAction({
      bookingId,
      walkTrackId: activeWalkTrackId,
      lat: point.lat,
      lng: point.lng,
      accuracy: point.accuracy,
      totalDistanceMeters: walkDistanceRef.current,
      totalDurationSeconds: getWalkDurationSeconds(),
    });

    if (!result.success) {
      setWalkLocationMessage(result.error || "Could not save live walk point.");
    }
  }

  async function handleWalkPosition(point: WalkPoint) {
    const previousPoint = walkLastPointRef.current;
    let nextDistance = walkDistanceRef.current;

    if (previousPoint) {
      const distanceDelta = getDistanceMeters(previousPoint, point);

      if (distanceDelta >= 5 && distanceDelta <= 250) {
        nextDistance += distanceDelta;
      }
    }

    walkDistanceRef.current = nextDistance;
    walkLastPointRef.current = point;

    setWalkDistanceMeters(nextDistance);
    setWalkLastLocation(point);
    setWalkLocationMessage(
      `Live walk tracking active. Last location saved around ${new Intl.DateTimeFormat(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
        },
      ).format(new Date(point.recordedAt))}.`,
    );

    await saveWalkPoint(point);
  }

  function startWalkWatcher() {
    if (!navigator.geolocation) {
      setWalkLocationMessage(
        "This browser does not support GPS tracking. You can still add walk notes.",
      );
      return;
    }

    clearWalkWatcher();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        void handleWalkPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          recordedAt: Date.now(),
        });
      },
      () => {
        setWalkLocationMessage(
          "Location permission is needed for live walk tracking. Walk notes still work without GPS.",
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      },
    );
  }

  async function handleStartWalk() {
    if (!reportActive) {
      setMessage("Start the PawReport before starting a live walk.");
      return;
    }

    setWalkLocationMessage("Getting current location...");
    const location = await getCurrentLocation();

    if (location.lat === null || location.lng === null) {
      setWalkLocationMessage(
        "Location was not available. Allow location access to start live walk tracking.",
      );
      return;
    }

    startTransition(async () => {
      const result = await startWalkTrackAction(bookingId, location);

      if (!result.success || !result.walkTrackId) {
        setWalkLocationMessage(result.error || "Could not start live walk.");
        return;
      }

      const now = Date.now();
      const firstPoint = {
        lat: location.lat as number,
        lng: location.lng as number,
        accuracy: location.accuracy ?? null,
        recordedAt: now,
      };

      setWalkTrackId(result.walkTrackId);
      setWalkStatus("walking");
      setWalkStartedAt(now);
      setWalkEndedAt(null);
      setWalkDistanceMeters(0);
      setWalkLastLocation(firstPoint);
      setWalkLocationMessage("Live walk started. GPS tracking is active.");

      walkTrackIdRef.current = result.walkTrackId;
      walkStartedAtRef.current = now;
      walkLastPointRef.current = firstPoint;
      walkLastSavedAtRef.current = 0;
      walkDistanceRef.current = 0;

      await saveWalkPoint(firstPoint, true);
      startWalkWatcher();
      refreshReport();
    });
  }

  function handlePauseWalk() {
    clearWalkWatcher();
    setWalkStatus("paused");
    setWalkLocationMessage("Live walk paused. Resume when the walk continues.");
  }

  function handleResumeWalk() {
    if (!walkTrackIdRef.current) {
      setWalkLocationMessage("Start the walk before resuming tracking.");
      return;
    }

    setWalkStatus("walking");
    setWalkLocationMessage("Live walk resumed.");
    startWalkWatcher();
  }

  async function handleEndWalk() {
    if (!walkTrackIdRef.current) {
      setWalkLocationMessage("Start the walk before ending it.");
      return;
    }

    clearWalkWatcher();

    const location = await getCurrentLocation();
    const endedAt = Date.now();
    const durationSeconds = walkStartedAtRef.current
      ? Math.max(0, Math.round((endedAt - walkStartedAtRef.current) / 1000))
      : 0;

    startTransition(async () => {
      if (location.lat !== null && location.lng !== null) {
        const finalPoint = {
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy ?? null,
          recordedAt: endedAt,
        };

        const previousPoint = walkLastPointRef.current;

        if (previousPoint) {
          const distanceDelta = getDistanceMeters(previousPoint, finalPoint);

          if (distanceDelta >= 5 && distanceDelta <= 250) {
            walkDistanceRef.current += distanceDelta;
          }
        }

        walkLastPointRef.current = finalPoint;
        setWalkLastLocation(finalPoint);
        setWalkDistanceMeters(walkDistanceRef.current);
        await saveWalkPoint(finalPoint, true);
      }

      const result = await endWalkTrackAction({
        bookingId,
        walkTrackId: walkTrackIdRef.current,
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        totalDistanceMeters: walkDistanceRef.current,
        totalDurationSeconds: durationSeconds,
      });

      if (!result.success) {
        setWalkLocationMessage(result.error || "Could not end live walk.");
        return;
      }

      setWalkStatus("completed");
      setWalkEndedAt(endedAt);
      setWalkLocationMessage(
        `Walk completed: ${formatWalkDistance(
          walkDistanceRef.current,
        )} in ${formatWalkDuration(durationSeconds)}.`,
      );
      setMessage("Live walk summary added to the PawReport timeline.");
      refreshReport();
    });
  }

  async function handleStartVisit() {
    setMessage("Getting location...");

    const location = await getCurrentLocation();

    startTransition(async () => {
      const result = await startVisitAction(bookingId, location);

      if (!result.success) {
        setMessage(result.error || "Could not start PawReport.");
        return;
      }

      setSessionStatus("in_progress");
      setMessage("PawReport started. Pet Parent can now see updates.");
      refreshReport();
    });
  }

  async function handleEndVisit() {
    const cleanFinalNote = finalNote.trim();

    if (!cleanFinalNote) {
      setMessage("Add a final PawReport summary before completing the report.");
      return;
    }

    setMessage("Getting location...");

    const location = await getCurrentLocation();

    startTransition(async () => {
      const result = await endVisitAction(bookingId, cleanFinalNote, location);

      if (!result.success) {
        setMessage(result.error || "Could not complete PawReport.");
        return;
      }

      setSessionStatus("completed");
      setMessage("PawReport completed. SitGuru PawReport™ is ready.");
      refreshReport();
    });
  }

  async function handleQuickUpdate(updateType: string, updateNote: string) {
    if (!reportActive) {
      setMessage("Start the PawReport before adding updates.");
      return;
    }

    setMessage("Saving PawReport update...");

    const location = await getCurrentLocation();

    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("updateType", updateType);
    formData.append("note", updateNote);

    if (location.lat !== null) formData.append("lat", String(location.lat));
    if (location.lng !== null) formData.append("lng", String(location.lng));
    if (location.accuracy !== null) {
      formData.append("accuracy", String(location.accuracy));
    }

    startTransition(async () => {
      const result = await addVisitUpdateAction(formData);

      if (!result.success) {
        setMessage(result.error || "Could not add PawReport update.");
        return;
      }

      setMessage("PawReport update added.");
      refreshReport();
    });
  }

  async function handleNoteSubmit() {
    const cleanNote = note.trim();

    if (!cleanNote) {
      setMessage("Add a PawReport note first.");
      return;
    }

    await handleQuickUpdate(noteType, cleanNote);
    setNote("");
  }

  async function handlePhotoUrlSubmit() {
    const cleanPhotoUrl = photoUrl.trim();

    if (!reportActive) {
      setMessage("Start the PawReport before adding photos.");
      return;
    }

    if (!cleanPhotoUrl) {
      setMessage("Add a photo URL first.");
      return;
    }

    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("updateType", "photo");
    formData.append("note", photoNote.trim() || "Photo added to PawReport.");
    formData.append("photoUrl", cleanPhotoUrl);

    startTransition(async () => {
      const result = await addVisitUpdateAction(formData);

      if (!result.success) {
        setMessage(result.error || "Could not add PawReport photo.");
        return;
      }

      setPhotoUrl("");
      setPhotoNote("");
      setMessage("Photo added to PawReport.");
      refreshReport();
    });
  }

  async function handlePhotoFileUpload(file: File) {
    if (!reportActive) {
      setMessage("Start the PawReport before adding photos.");
      return;
    }

    try {
      setMessage("Uploading photo...");

      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `${bookingId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabaseBrowser.storage
        .from("visit-updates")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setMessage(uploadError.message);
        return;
      }

      const { data } = supabaseBrowser.storage
        .from("visit-updates")
        .getPublicUrl(filePath);

      const formData = new FormData();
      formData.append("bookingId", bookingId);
      formData.append("updateType", "photo");
      formData.append("note", photoNote.trim() || "Photo added to PawReport.");
      formData.append("photoUrl", data.publicUrl);

      startTransition(async () => {
        const result = await addVisitUpdateAction(formData);

        if (!result.success) {
          setMessage(result.error || "Could not save PawReport photo.");
          return;
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setPhotoNote("");
        setMessage("Photo uploaded to PawReport.");
        refreshReport();
      });
    } catch (error) {
      setMessage(getFriendlyError(error));
    }
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#dfeee7] bg-white !text-[#061638] shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="border-b border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] !text-emerald-700">
              SitGuru PawReport™ Live
            </p>

            <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-tight !text-[#061638] sm:text-5xl">
              My PawReport
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-bold leading-7 !text-slate-700 sm:text-base">
              Start the visit, add live care updates, upload photos, and send a
              clear final summary the Pet Parent can trust.
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm lg:w-[280px]">
            <p className="text-xs font-black uppercase tracking-[0.14em] !text-slate-600">
              Current Status
            </p>
            <p className="mt-1 text-xl font-black !text-[#061638]">
              {statusLabel(sessionStatus)}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 !text-slate-700">
              {statusDescription(sessionStatus)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6 lg:p-7">
        {message ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black !text-sky-900">
            {message}
          </div>
        ) : null}

        {!reportActive && !reportCompleted ? (
          <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-2xl font-black !text-[#061638]">
              Start this visit
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 !text-slate-700">
              Tap start when care begins. PawReport updates can be added after
              the visit is active.
            </p>
            <button
              type="button"
              onClick={handleStartVisit}
              disabled={isPending}
              className="mt-4 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-base font-black !text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Start PawReport
            </button>
          </div>
        ) : null}

        {reportActive ? (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg font-black !text-[#061638]">
                  Potty Updates
                </h2>
                <p className="mt-1 text-sm font-bold !text-slate-700">
                  Track pee and poop updates during the visit.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {pottyActions.map((action) => (
                    <ActionButton
                      key={action.type}
                      action={action}
                      disabled={isPending}
                      onClick={() =>
                        handleQuickUpdate(action.type, action.note)
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg font-black !text-[#061638]">
                  Food & Water
                </h2>
                <p className="mt-1 text-sm font-bold !text-slate-700">
                  Confirm meals, treats, and fresh water.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {careActions.map((action) => (
                    <ActionButton
                      key={action.type}
                      action={action}
                      disabled={isPending}
                      onClick={() =>
                        handleQuickUpdate(action.type, action.note)
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg font-black !text-[#061638]">
                  Activity & Wellness
                </h2>
                <p className="mt-1 text-sm font-bold !text-slate-700">
                  Add walk, play, mood, or medication updates.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {activityActions.map((action) => (
                    <ActionButton
                      key={action.type}
                      action={action}
                      disabled={isPending}
                      onClick={() =>
                        handleQuickUpdate(action.type, action.note)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black !text-[#061638]">
                      Add Care Note
                    </h2>
                    <p className="mt-1 text-sm font-bold leading-6 !text-slate-700">
                      Choose the note type so the PawReport timeline is easy to
                      understand.
                    </p>
                  </div>
                </div>

                <label className="mt-4 block">
                  <span className="text-xs font-black uppercase tracking-[0.12em] !text-slate-700">
                    Note Type
                  </span>
                  <select
                    value={noteType}
                    onChange={(event) =>
                      setNoteType(event.target.value as CareNoteType)
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black !text-[#061638] outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  >
                    {noteTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="mt-2 block text-xs font-bold !text-slate-600">
                    {selectedNoteOption.helper}
                  </span>
                </label>

                <label className="mt-4 block">
                  <span className="text-xs font-black uppercase tracking-[0.12em] !text-slate-700">
                    Note
                  </span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={5}
                    placeholder="Example: Bella was happy, drank water, enjoyed her walk, and settled calmly after playtime."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold leading-6 !text-[#061638] outline-none placeholder:!text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleNoteSubmit}
                  disabled={isPending}
                  className="mt-4 w-full rounded-2xl bg-sky-700 px-5 py-3 text-sm font-black !text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add Note to PawReport
                </button>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-2xl font-black !text-[#061638]">
                  Add Photo
                </h2>
                <p className="mt-1 text-sm font-bold leading-6 !text-slate-700">
                  Upload a visit photo or paste a photo URL. Add an optional
                  caption for the Pet Parent.
                </p>

                <label className="mt-4 block">
                  <span className="text-xs font-black uppercase tracking-[0.12em] !text-slate-700">
                    Optional Caption
                  </span>
                  <input
                    value={photoNote}
                    onChange={(event) => setPhotoNote(event.target.value)}
                    placeholder="Example: Max enjoying backyard playtime."
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold !text-[#061638] outline-none placeholder:!text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-xs font-black uppercase tracking-[0.12em] !text-slate-700">
                    Upload Photo
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold !text-[#061638] file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handlePhotoFileUpload(file);
                      }
                    }}
                  />
                </label>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] !text-slate-700">
                    Or Paste Photo URL
                  </p>
                  <input
                    value={photoUrl}
                    onChange={(event) => setPhotoUrl(event.target.value)}
                    placeholder="https://..."
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold !text-[#061638] outline-none placeholder:!text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                  <button
                    type="button"
                    onClick={handlePhotoUrlSubmit}
                    disabled={isPending}
                    className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black !text-[#061638] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add Photo URL
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] !text-sky-700">
                    Live Walk Tracking
                  </p>
                  <h2 className="mt-2 text-2xl font-black !text-[#061638]">
                    Walk Tracker
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm font-bold leading-6 !text-slate-700">
                    Start a GPS walk when walking care begins. SitGuru saves
                    walk points, distance, duration, and a walk summary into the
                    PawReport for Pet Parents.
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-left shadow-sm lg:min-w-[220px]">
                  <p className="text-xs font-black uppercase tracking-[0.12em] !text-slate-600">
                    Walk Status
                  </p>
                  <p className="mt-1 text-xl font-black !text-[#061638]">
                    {getWalkStatusLabel(walkStatus)}
                  </p>
                  <p className="mt-1 text-xs font-bold !text-slate-600">
                    {walkStatus === "walking"
                      ? "GPS is actively tracking."
                      : walkStatus === "paused"
                        ? "Tracking is paused."
                        : walkStatus === "completed"
                          ? "Summary saved."
                          : "Ready when the walk starts."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] !text-slate-600">
                    Distance
                  </p>
                  <p className="mt-1 text-2xl font-black !text-[#061638]">
                    {formatWalkDistance(walkDistanceMeters)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] !text-slate-600">
                    Duration
                  </p>
                  <p className="mt-1 text-2xl font-black !text-[#061638]">
                    {formatWalkDuration(getWalkDurationSeconds())}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] !text-slate-600">
                    Accuracy
                  </p>
                  <p className="mt-1 text-2xl font-black !text-[#061638]">
                    {walkLastLocation?.accuracy
                      ? `${Math.round(walkLastLocation.accuracy)} m`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] !text-slate-600">
                    Last Point
                  </p>
                  <p className="mt-1 text-sm font-black !text-[#061638]">
                    {walkLastLocation
                      ? `${walkLastLocation.lat.toFixed(
                          5,
                        )}, ${walkLastLocation.lng.toFixed(5)}`
                      : "Not tracking"}
                  </p>
                </div>
              </div>

              {walkLocationMessage ? (
                <div className="mt-4 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-black !text-sky-900">
                  {walkLocationMessage}
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={handleStartWalk}
                  disabled={isPending || walkStatus === "walking"}
                  className="rounded-2xl bg-sky-700 px-5 py-4 text-sm font-black !text-white shadow-lg shadow-sky-700/20 transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Start Walk
                </button>

                <button
                  type="button"
                  onClick={handlePauseWalk}
                  disabled={walkStatus !== "walking"}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black !text-[#061638] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Pause Walk
                </button>

                <button
                  type="button"
                  onClick={handleResumeWalk}
                  disabled={walkStatus !== "paused"}
                  className="rounded-2xl border border-emerald-200 bg-white px-5 py-4 text-sm font-black !text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Resume Walk
                </button>

                <button
                  type="button"
                  onClick={handleEndWalk}
                  disabled={
                    isPending ||
                    (walkStatus !== "walking" && walkStatus !== "paused")
                  }
                  className="rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black !text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  End Walk
                </button>
              </div>

              <p className="mt-4 text-xs font-bold leading-5 !text-slate-600">
                Live GPS tracking only runs while the Guru keeps this page open
                and location permission is allowed. Pet Parents see the saved
                walk summary in the PawReport timeline.
              </p>
            </div>

            <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="text-2xl font-black !text-emerald-950">
                Complete PawReport
              </h2>
              <p className="mt-1 text-sm font-bold leading-6 !text-emerald-900">
                Finish with a warm, professional summary. This is what the Pet
                Parent will remember after the booking.
              </p>

              <textarea
                value={finalNote}
                onChange={(event) => setFinalNote(event.target.value)}
                rows={5}
                placeholder="Example: PawReport completed. Bella was happy and relaxed, ate dinner, had fresh water, went potty, and enjoyed her walk."
                className="mt-4 w-full rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-bold leading-6 !text-[#061638] outline-none placeholder:!text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />

              <button
                type="button"
                onClick={handleEndVisit}
                disabled={isPending}
                className="mt-4 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-base font-black !text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Complete PawReport
              </button>
            </div>
          </>
        ) : null}

        {reportCompleted ? (
          <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="text-4xl" aria-hidden="true">
              ✅
            </p>
            <h2 className="mt-3 text-2xl font-black !text-emerald-950">
              PawReport completed
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-6 !text-emerald-900">
              The SitGuru PawReport™ is now available for the Pet Parent. You
              can still review the completed timeline below.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
