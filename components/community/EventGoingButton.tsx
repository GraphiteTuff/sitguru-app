"use client";

import { useEffect, useState, useTransition } from "react";
import { Users } from "lucide-react";
import type { EventAttendanceCounts } from "@/lib/community/attendance";
import CommunityJoinOptions from "@/components/community/CommunityJoinOptions";
import { savePendingEventRsvp } from "@/lib/community/pet-parent-signup";

type EventGoingButtonProps = {
  eventId: string;
  eventSlug: string;
  initialCounts?: EventAttendanceCounts | null;
  compact?: boolean;
};

const emptyCounts: EventAttendanceCounts = {
  petParents: 0,
  gurus: 0,
  ambassadors: 0,
  totalGoing: 0,
};

export default function EventGoingButton({
  eventId,
  eventSlug,
  initialCounts = null,
  compact = false,
}: EventGoingButtonProps) {
  const [counts, setCounts] = useState<EventAttendanceCounts>(
    initialCounts || emptyCounts,
  );
  const [going, setGoing] = useState(false);
  const [authed, setAuthed] = useState(true);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/community/events/${eventId}/attendance`);
        const payload = await response.json();
        if (payload.counts) setCounts(payload.counts);
        if (payload.mine?.status === "going") setGoing(true);
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

  function toggle() {
    startTransition(async () => {
      const nextStatus = going ? "cancelled" : "going";
      const response = await fetch(`/api/community/events/${eventId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (response.status === 401) {
        setAuthed(false);
        rememberPending();
        setMessage("Join free — pick Pet Parent, Guru, or Ambassador below.");
        return;
      }

      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error || "Unable to update RSVP.");
        return;
      }

      setGoing(nextStatus === "going");
      setAuthed(true);
      if (payload.counts) setCounts(payload.counts);
      setMessage(nextStatus === "going" ? "You're going!" : "RSVP cancelled");
    });
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!authed ? (
        <CommunityJoinOptions
          slug={eventSlug}
          eventId={eventId}
          source="community_event_im_going"
          variant="event"
          onBeforeNavigate={rememberPending}
        />
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={toggle}
          className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition sm:w-auto ${
            going
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "bg-emerald-700 text-white hover:bg-emerald-800"
          } disabled:opacity-60`}
        >
          <Users className="h-4 w-4" />
          {pending ? "Saving…" : going ? "You're Going" : "I'm Going"}
        </button>
      )}

      <div className="flex flex-wrap gap-2 text-xs font-black text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {counts.petParents} Pet Parents
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{counts.gurus} Gurus</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {counts.ambassadors} Ambassadors
        </span>
        {!compact ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
            {counts.totalGoing} Going
          </span>
        ) : null}
      </div>

      {message ? <p className="text-xs font-black text-emerald-800">{message}</p> : null}
    </div>
  );
}
