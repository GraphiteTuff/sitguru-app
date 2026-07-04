"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  addVisitUpdateAction,
  endVisitAction,
  startVisitAction,
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

const noteTypeOptions: { value: CareNoteType; label: string; helper: string }[] = [
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
      }
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
    initialSession?.status ?? "not_started"
  );
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState<CareNoteType>("note");
  const [finalNote, setFinalNote] = useState(initialSession?.final_note ?? "");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoNote, setPhotoNote] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const supabaseBrowser = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
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
    formData.append(
      "note",
      photoNote.trim() || "Photo added to PawReport."
    );
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
      formData.append(
        "note",
        photoNote.trim() || "Photo added to PawReport."
      );
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
                      onClick={() => handleQuickUpdate(action.type, action.note)}
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
                      onClick={() => handleQuickUpdate(action.type, action.note)}
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
                      onClick={() => handleQuickUpdate(action.type, action.note)}
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
