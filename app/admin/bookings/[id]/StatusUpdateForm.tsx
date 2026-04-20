"use client";

import { useState, useTransition } from "react";
import { updateBookingStatus } from "./actions";

type ActionResult = {
  ok: boolean;
  message: string;
};

type Props = {
  bookingId: string | number;
  currentStatus: string;
};

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export default function StatusUpdateForm({
  bookingId,
  currentStatus,
}: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setResult(null);

    startTransition(async () => {
      try {
        const response = (await updateBookingStatus(formData)) as ActionResult;
        setResult(response);

        if (response?.ok) {
          const nextStatus = formData.get("status");
          if (typeof nextStatus === "string") {
            setStatus(nextStatus);
          }
        }
      } catch (error) {
        console.error("Failed to update booking status:", error);
        setResult({
          ok: false,
          message: "Something went wrong while updating the booking status.",
        });
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Update Booking Status</h2>
        <p className="mt-1 text-sm text-slate-300">
          Change the booking lifecycle status for this order.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="bookingId" value={String(bookingId)} />

        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-medium text-slate-200">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isPending}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Updating..." : "Save Status"}
          </button>

          <span className="text-xs text-slate-400">
            Current:{" "}
            <span className="font-medium text-slate-200">
              {status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </span>
        </div>

        {result && (
          <div
            className={`rounded-xl border px-3 py-2 text-sm ${
              result.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
          >
            {result.message}
          </div>
        )}
      </form>
    </div>
  );
}