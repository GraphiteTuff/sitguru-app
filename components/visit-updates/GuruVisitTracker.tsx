"use client";

import { useMemo, useRef, useState, useTransition } from "react";
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

export default function GuruVisitTracker({
  bookingId,
  initialSession,
}: GuruVisitTrackerProps) {
  const [sessionStatus, setSessionStatus] = useState(
    initialSession?.status ?? "not_started"
  );
  const [note, setNote] = useState("");
  const [finalNote, setFinalNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
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
    });
  }

  async function handleEndVisit() {
    setMessage("Getting location...");

    const location = await getCurrentLocation();

    startTransition(async () => {
      const result = await endVisitAction(bookingId, finalNote, location);

      if (!result.success) {
        setMessage(result.error || "Could not complete PawReport.");
        return;
      }

      setSessionStatus("completed");
      setFinalNote("");
      setMessage("PawReport completed. SitGuru PawReport™ is ready.");
    });
  }

  async function handleQuickUpdate(updateType: string, updateNote: string) {
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
    });
  }

  async function handleNoteSubmit() {
    if (!note.trim()) {
      setMessage("Add a PawReport note first.");
      return;
    }

    await handleQuickUpdate("note", note.trim());
    setNote("");
  }

  async function handlePhotoUrlSubmit() {
    if (!photoUrl.trim()) {
      setMessage("Add a photo URL first.");
      return;
    }

    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("updateType", "photo");
    formData.append("note", "Photo added to PawReport.");
    formData.append("photoUrl", photoUrl.trim());

    startTransition(async () => {
      const result = await addVisitUpdateAction(formData);

      if (!result.success) {
        setMessage(result.error || "Could not add PawReport photo.");
        return;
      }

      setPhotoUrl("");
      setMessage("Photo added to PawReport.");
    });
  }

  async function handlePhotoFileUpload(file: File) {
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
      formData.append("note", "Photo added to PawReport.");
      formData.append("photoUrl", data.publicUrl);

      startTransition(async () => {
        const result = await addVisitUpdateAction(formData);

        if (!result.success) {
          setMessage(result.error || "Could not save PawReport photo.");
          return;
        }

        setMessage("Photo uploaded to PawReport.");
      });
    } catch (error) {
      setMessage(getFriendlyError(error));
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 !bg-white !text-slate-950 shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold !text-sky-700">
              SitGuru PawReport™
            </p>

            <h1 className="mt-2 max-w-3xl text-3xl font-black leading-tight !text-slate-950 sm:text-5xl">
              Create a professional PawReport for every visit
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium !text-slate-700 sm:text-base">
              Start the PawReport, add care updates, upload photos, and complete
              a warm, professional summary for the Pet Parent.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 !bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide !text-slate-500">
              Status
            </p>
            <p className="text-sm font-black !text-slate-950">
              {reportCompleted
                ? "PawReport Complete"
                : reportActive
                  ? "PawReport Active"
                  : "Ready to Start"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {message ? (
          <div className="rounded-2xl border border-sky-100 !bg-sky-50 px-4 py-3 text-sm font-bold !text-sky-800">
            {message}
          </div>
        ) : null}

        {!reportActive && !reportCompleted ? (
          <button
            type="button"
            onClick={handleStartVisit}
            disabled={isPending}
            className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-base font-bold !text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
          >
            Start PawReport
          </button>
        ) : null}

        {reportActive ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleQuickUpdate("pee", "Pee update added.")}
                className="rounded-2xl border border-slate-200 !bg-slate-50 p-4 text-left shadow-sm transition hover:!bg-white disabled:opacity-60"
              >
                <span className="block text-2xl">💧</span>
                <span className="mt-2 block font-black !text-slate-950">
                  Pee
                </span>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleQuickUpdate("poop", "Poop update added.")}
                className="rounded-2xl border border-slate-200 !bg-slate-50 p-4 text-left shadow-sm transition hover:!bg-white disabled:opacity-60"
              >
                <span className="block text-2xl">🐾</span>
                <span className="mt-2 block font-black !text-slate-950">
                  Poop
                </span>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleQuickUpdate("water", "Water refreshed.")}
                className="rounded-2xl border border-slate-200 !bg-slate-50 p-4 text-left shadow-sm transition hover:!bg-white disabled:opacity-60"
              >
                <span className="block text-2xl">🥣</span>
                <span className="mt-2 block font-black !text-slate-950">
                  Water
                </span>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleQuickUpdate("food", "Food update added.")}
                className="rounded-2xl border border-slate-200 !bg-slate-50 p-4 text-left shadow-sm transition hover:!bg-white disabled:opacity-60"
              >
                <span className="block text-2xl">🍽️</span>
                <span className="mt-2 block font-black !text-slate-950">
                  Food
                </span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4">
              <label className="text-sm font-black !text-slate-950">
                Add PawReport Note
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                placeholder="Example: Bella was happy, drank water, and enjoyed the walk."
                className="mt-2 w-full rounded-2xl border border-slate-200 !bg-white p-3 text-sm !text-slate-950 outline-none placeholder:!text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              <button
                type="button"
                onClick={handleNoteSubmit}
                disabled={isPending}
                className="mt-3 w-full rounded-2xl bg-sky-600 px-5 py-3 font-bold !text-white transition hover:bg-sky-700 disabled:opacity-60"
              >
                Add PawReport Note
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 !bg-slate-50 p-4">
              <label className="text-sm font-black !text-slate-950">
                Add PawReport Photo
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="mt-3 block w-full rounded-2xl border border-slate-200 !bg-white p-3 text-sm !text-slate-950"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handlePhotoFileUpload(file);
                  }
                }}
              />

              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wide !text-slate-600">
                  Or paste a photo URL
                </p>
                <input
                  value={photoUrl}
                  onChange={(event) => setPhotoUrl(event.target.value)}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-2xl border border-slate-200 !bg-white p-3 text-sm !text-slate-950 outline-none placeholder:!text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
                <button
                  type="button"
                  onClick={handlePhotoUrlSubmit}
                  disabled={isPending}
                  className="mt-3 w-full rounded-2xl border border-slate-200 !bg-white px-5 py-3 font-bold !text-slate-950 transition hover:!bg-slate-100 disabled:opacity-60"
                >
                  Add Photo URL
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 !bg-emerald-50 p-4">
              <label className="text-sm font-black !text-emerald-950">
                Final PawReport Summary
              </label>
              <textarea
                value={finalNote}
                onChange={(event) => setFinalNote(event.target.value)}
                rows={4}
                placeholder="Example: PawReport completed. Bella was happy and relaxed."
                className="mt-2 w-full rounded-2xl border border-emerald-200 !bg-white p-3 text-sm !text-slate-950 outline-none placeholder:!text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={handleEndVisit}
                disabled={isPending}
                className="mt-3 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-base font-bold !text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
              >
                Complete PawReport
              </button>
            </div>
          </>
        ) : null}

        {reportCompleted ? (
          <div className="rounded-2xl border border-emerald-200 !bg-emerald-50 p-5 text-center">
            <p className="text-3xl">✅</p>
            <h2 className="mt-2 text-xl font-black !text-emerald-950">
              PawReport completed
            </h2>
            <p className="mt-1 text-sm font-medium !text-emerald-800">
              The SitGuru PawReport™ is now available for the Pet Parent.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}