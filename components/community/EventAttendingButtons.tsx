"use client";

import { useEffect, useState, useTransition } from "react";
import type {
  AttendanceStatus,
  EventAttendanceCounts,
} from "@/lib/community/attendance";
import { getOrCreateEventGuestKey } from "@/lib/community/guest-key";

type EventAttendingButtonsProps = {
  eventId: string;
  eventSlug: string;
  initialCounts?: EventAttendanceCounts | null;
  compact?: boolean;
  className?: string;
};

const emptyCounts: EventAttendanceCounts = {
  petParents: 0,
  gurus: 0,
  ambassadors: 0,
  totalGoing: 0,
  totalMaybe: 0,
  totalNo: 0,
};

const OPTIONS: {
  label: string;
  status: AttendanceStatus;
  countKey: keyof Pick<
    EventAttendanceCounts,
    "totalGoing" | "totalMaybe" | "totalNo"
  >;
  activeClass: string;
  countActiveClass: string;
}[] = [
  {
    label: "Yes",
    status: "going",
    countKey: "totalGoing",
    activeClass: "border-emerald-600 bg-emerald-700 text-white",
    countActiveClass: "bg-white text-emerald-800",
  },
  {
    label: "Maybe",
    status: "interested",
    countKey: "totalMaybe",
    activeClass: "border-amber-500 bg-amber-500 text-white",
    countActiveClass: "bg-white text-amber-800",
  },
  {
    label: "No",
    status: "cancelled",
    countKey: "totalNo",
    activeClass: "border-slate-600 bg-slate-700 text-white",
    countActiveClass: "bg-white text-slate-800",
  },
];

function normalizeCounts(raw: Partial<EventAttendanceCounts> | null | undefined) {
  return {
    ...emptyCounts,
    petParents: Number(raw?.petParents ?? 0),
    gurus: Number(raw?.gurus ?? 0),
    ambassadors: Number(raw?.ambassadors ?? 0),
    totalGoing: Number(raw?.totalGoing ?? 0),
    totalMaybe: Number(raw?.totalMaybe ?? 0),
    totalNo: Number(raw?.totalNo ?? 0),
  };
}

export default function EventAttendingButtons({
  eventId,
  eventSlug: _eventSlug,
  initialCounts = null,
  compact = false,
  className = "",
}: EventAttendingButtonsProps) {
  const [counts, setCounts] = useState<EventAttendanceCounts>(
    normalizeCounts(initialCounts),
  );
  const [mine, setMine] = useState<AttendanceStatus | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [guestKey, setGuestKey] = useState("");

  useEffect(() => {
    setGuestKey(getOrCreateEventGuestKey());
  }, []);

  useEffect(() => {
    if (!guestKey && typeof window !== "undefined") return;

    async function load() {
      try {
        const key = guestKey || getOrCreateEventGuestKey();
        const response = await fetch(
          `/api/community/events/${eventId}/attendance`,
          {
            headers: key ? { "x-sitguru-guest-key": key } : undefined,
          },
        );
        const payload = await response.json();
        if (payload.counts) {
          setCounts(normalizeCounts(payload.counts));
        }
        const status = payload.mine?.status as AttendanceStatus | undefined;
        setMine(status && status.length ? status : null);
      } catch {
        // optional
      }
    }
    void load();
  }, [eventId, guestKey]);

  function choose(status: AttendanceStatus) {
    startTransition(async () => {
      const key = guestKey || getOrCreateEventGuestKey();
      if (!guestKey) setGuestKey(key);

      const response = await fetch(
        `/api/community/events/${eventId}/attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sitguru-guest-key": key,
          },
          body: JSON.stringify({ status, guestKey: key }),
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || "Unable to update RSVP.");
        return;
      }

      setMine(status);
      if (payload.counts) {
        setCounts(normalizeCounts(payload.counts));
      }
      setMessage(
        status === "going"
          ? "You're going!"
          : status === "interested"
            ? "Marked as maybe"
            : "Marked as not attending",
      );
    });
  }

  return (
    <div
      className={`space-y-2 ${className}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <p
        className={`font-black text-slate-800 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        Attending?
      </p>

      <div className="grid grid-cols-3 gap-1.5">
        {OPTIONS.map((option) => {
          const active = mine === option.status;
          const count = counts[option.countKey] || 0;
          return (
            <button
              key={option.status}
              type="button"
              disabled={pending}
              aria-pressed={active}
              aria-label={`${option.label}, ${count} ${count === 1 ? "person" : "people"}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                choose(option.status);
              }}
              className={`inline-flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-2xl border px-2 py-1.5 transition disabled:opacity-60 sm:min-h-9 sm:flex-row sm:gap-2 sm:rounded-full sm:px-3 ${
                active
                  ? option.activeClass
                  : "border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              <span
                className={`text-xs font-black ${compact ? "" : "sm:text-sm"}`}
              >
                {option.label}
              </span>
              <span
                className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-black tabular-nums leading-none ${
                  active
                    ? option.countActiveClass
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {message ? (
        <p
          className={`text-[11px] font-bold ${
            message.startsWith("Unable") ||
            message.toLowerCase().includes("invalid") ||
            message.toLowerCase().includes("error")
              ? "text-red-700"
              : "text-emerald-800"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
