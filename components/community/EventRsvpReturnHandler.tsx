"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  clearPendingEventRsvp,
  readPendingEventRsvp,
} from "@/lib/community/pet-parent-signup";

type EventRsvpReturnHandlerProps = {
  eventId: string;
  slug: string;
};

/**
 * After Pet Parent signup/login with ?rsvp=1 (or a pending localStorage RSVP),
 * complete "I'm Going" automatically so conversion stays one tap away.
 */
export default function EventRsvpReturnHandler({
  eventId,
  slug,
}: EventRsvpReturnHandlerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      const wantsRsvp = searchParams.get("rsvp") === "1";
      const pending = readPendingEventRsvp();
      const matchesPending =
        pending && (pending.eventId === eventId || pending.slug === slug);

      if (!wantsRsvp && !matchesPending) return;

      const response = await fetch(`/api/community/events/${eventId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "going" }),
      });

      if (cancelled) return;

      if (response.status === 401) {
        setNote("Sign up free as a Pet Parent to finish saying you're going.");
        return;
      }

      if (!response.ok) {
        setNote("Welcome back — tap I'm Going to confirm your RSVP.");
        return;
      }

      clearPendingEventRsvp();
      setNote("You're going! Welcome to the SitGuru community.");

      if (wantsRsvp) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("rsvp");
        const next = params.toString();
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      }
    }

    void complete();

    return () => {
      cancelled = true;
    };
  }, [eventId, pathname, router, searchParams, slug]);

  if (!note) return null;

  return (
    <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900">
      {note}
    </p>
  );
}
