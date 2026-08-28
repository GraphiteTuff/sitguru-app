"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { PawPrint, Users } from "lucide-react";
import type { EventAttendanceCounts } from "@/lib/community/attendance";
import {
  buildCommunityPetParentLoginHref,
  buildCommunityPetParentSignupHref,
  savePendingEventRsvp,
} from "@/lib/community/pet-parent-signup";

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

  const signupHref = buildCommunityPetParentSignupHref({
    slug: eventSlug,
    eventId,
    source: "community_event_im_going",
    campaign: "community_event_im_going",
  });
  const loginHref = buildCommunityPetParentLoginHref({ slug: eventSlug });

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
        setMessage("Join free as a Pet Parent — then you're going in one tap.");
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
        <div className="space-y-2">
          <Link
            href={signupHref}
            onClick={rememberPending}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-800 sm:w-auto"
          >
            <PawPrint className="h-4 w-4" />
            Join free &amp; say I&apos;m Going
          </Link>
          <p className="text-xs font-semibold text-slate-600">
            Quick Pet Parent signup — we&apos;ll bring you right back to this event.
          </p>
          <Link
            href={loginHref}
            onClick={rememberPending}
            className="inline-flex text-xs font-black text-emerald-800 underline-offset-2 hover:underline"
          >
            Already have an account? Log in
          </Link>
        </div>
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
