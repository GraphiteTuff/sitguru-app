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
  eventSlug,
  initialCounts = null,
  compact = false,
  className = "",
}: EventAttendingButtonsProps) {
  const [counts, setCounts] = useState<EventAttendanceCounts>(
    normalizeCounts(initialCounts),
  );
  const [mine, setMine] = useState<AttendanceStatus | null>(null);
  const [authed, setAuthed] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
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
          setCounts(normalizeCounts(payload.counts));
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

  function rememberPending(status: AttendanceStatus) {
    savePendingEventRsvp({
      eventId,
      slug: eventSlug,
      savedAt: Date.now(),
      status,
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
        setShowJoin(true);
        rememberPending(status);
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
      setShowJoin(false);
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

      {/* Always show Yes / Maybe / No with live counts inside each button */}
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

      {!authed || showJoin ? (
        <CommunityJoinOptions
          slug={eventSlug}
          eventId={eventId}
          source="community_event_im_going"
          variant="event"
          onBeforeNavigate={() => rememberPending(mine || "going")}
        />
      ) : null}

      {message ? (
        <p className="text-[11px] font-bold text-emerald-800">{message}</p>
      ) : null}
    </div>
  );
}
