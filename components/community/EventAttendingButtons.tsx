"use client";

import { useEffect, useState, useTransition } from "react";
import type {
  AttendanceStatus,
  EventAttendanceCounts,
} from "@/lib/community/attendance";
import CommunityJoinOptions from "@/components/community/CommunityJoinOptions";
import { savePendingEventRsvp } from "@/lib/community/pet-parent-signup";

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
}[] = [
  {
    label: "Yes",
    status: "going",
    countKey: "totalGoing",
    activeClass: "border-emerald-600 bg-emerald-700 text-white",
  },
  {
    label: "Maybe",
    status: "interested",
    countKey: "totalMaybe",
    activeClass: "border-amber-500 bg-amber-500 text-white",
  },
  {
    label: "No",
    status: "cancelled",
    countKey: "totalNo",
    activeClass: "border-slate-600 bg-slate-700 text-white",
  },
];

export default function EventAttendingButtons({
  eventId,
  eventSlug,
  initialCounts = null,
  compact = false,
  className = "",
}: EventAttendingButtonsProps) {
  const [counts, setCounts] = useState<EventAttendanceCounts>(
    initialCounts || emptyCounts,
  );
  const [mine, setMine] = useState<AttendanceStatus | null>(null);
  const [authed, setAuthed] = useState(true);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(
          `/api/community/events/${eventId}/attendance`,
        );
        const payload = await response.json();
        if (payload.counts) {
          setCounts({
            ...emptyCounts,
            ...payload.counts,
          });
        }
        const status = payload.mine?.status as AttendanceStatus | undefined;
        setMine(status && status.length ? status : null);
        if (typeof payload.authenticated === "boolean") {
          setAuthed(payload.authenticated);
        }
      } catch {
        // optional
      }
    }
    void load();
  }, [eventId]);

  function rememberPending() {
    savePendingEventRsvp({
      eventId,
      slug: eventSlug,
      savedAt: Date.now(),
    });
  }

  function choose(status: AttendanceStatus) {
    startTransition(async () => {
      const response = await fetch(
        `/api/community/events/${eventId}/attendance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );

      if (response.status === 401) {
        setAuthed(false);
        rememberPending();
        setMessage("Join free to save your RSVP.");
        return;
      }

      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error || "Unable to update RSVP.");
        return;
      }

      setMine(status);
      setAuthed(true);
      if (payload.counts) {
        setCounts({
          ...emptyCounts,
          ...payload.counts,
        });
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

      {!authed ? (
        <CommunityJoinOptions
          slug={eventSlug}
          eventId={eventId}
          source="community_event_im_going"
          variant="event"
          onBeforeNavigate={rememberPending}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {OPTIONS.map((option) => {
            const active = mine === option.status;
            const count = counts[option.countKey] || 0;
            return (
              <button
                key={option.status}
                type="button"
                disabled={pending}
                aria-pressed={active}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  choose(option.status);
                }}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-black transition disabled:opacity-60 ${
                  active
                    ? option.activeClass
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                <span>{option.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {message ? (
        <p className="text-[11px] font-bold text-emerald-800">{message}</p>
      ) : null}
    </div>
  );
}
