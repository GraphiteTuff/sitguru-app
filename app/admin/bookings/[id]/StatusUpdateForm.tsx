"use client";

import { useMemo, useState, useTransition } from "react";
import { updateBookingStatus } from "./actions";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

type ActionResult = {
  ok: boolean;
  message: string;
  status?: BookingStatus;
};

type Props = {
  bookingId: string | number;
  currentStatus: string;
};

const STATUS_OPTIONS: {
  value: BookingStatus;
  label: string;
  helper: string;
}[] = [
  {
    value: "pending",
    label: "Pending",
    helper: "Booking request is waiting for review.",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    helper: "Booking is accepted and scheduled.",
  },
  {
    value: "in_progress",
    label: "In Progress",
    helper: "Care is currently active or underway.",
  },
  {
    value: "completed",
    label: "Completed",
    helper: "Care has been completed.",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    helper: "Booking was cancelled or declined.",
  },
];

function normalizeStatus(value?: string | null): BookingStatus {
  const clean = String(value || "").trim().toLowerCase();

  if (clean === "confirmed") return "confirmed";
  if (clean === "active") return "in_progress";
  if (clean === "in_progress") return "in_progress";
  if (clean === "in progress") return "in_progress";
  if (clean === "completed") return "completed";
  if (clean === "canceled") return "cancelled";
  if (clean === "cancelled") return "cancelled";

  return "pending";
}

function getStatusLabel(status: BookingStatus) {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ||
    "Pending"
  );
}

function getStatusHelper(status: BookingStatus) {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.helper ||
    "Booking request is waiting for review."
  );
}

export default function StatusUpdateForm({
  bookingId,
  currentStatus,
}: Props) {
  const normalizedInitialStatus = useMemo(
    () => normalizeStatus(currentStatus),
    [currentStatus],
  );

  const [status, setStatus] = useState<BookingStatus>(normalizedInitialStatus);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setResult(null);

    startTransition(async () => {
      try {
        const response = (await updateBookingStatus(formData)) as ActionResult;

        setResult(response);

        if (response?.ok) {
          const nextStatus =
            response.status || normalizeStatus(String(formData.get("status")));

          setStatus(nextStatus);
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
          Admin Action
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
          Update Booking Status
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          This changes the booking lifecycle only. Payment status and Guru payout
          status are tracked separately.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="bookingId" value={String(bookingId)} />

        <div className="space-y-2">
          <label
            htmlFor="status"
            className="block text-xs font-black uppercase tracking-[0.12em] text-slate-600"
          >
            Booking Lifecycle Status
          </label>

          <select
            id="status"
            name="status"
            value={status}
            onChange={(event) =>
              setStatus(normalizeStatus(event.target.value))
            }
            disabled={isPending}
            className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <p className="text-xs font-semibold leading-5 text-slate-500">
            {getStatusHelper(status)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Current Selection
          </p>
          <p className="mt-1 text-lg font-black text-slate-950">
            {getStatusLabel(status)}
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none sm:w-auto"
        >
          {isPending ? "Updating..." : "Save Status"}
        </button>

        {result ? (
          <div
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-bold leading-6",
              result.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800",
            ].join(" ")}
          >
            {result.message}
          </div>
        ) : null}
      </form>
    </div>
  );
}