"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, MapPin, PawPrint, Users } from "lucide-react";
import {
  buildCommunityEventLoginHref,
  buildCommunityEventSignupHref,
  savePendingEventRsvp,
} from "@/lib/community/pet-parent-signup";
import {
  formatEventCountyState,
  formatEventDateRange,
} from "@/lib/community/format";
import type { CommunityEventWithPartner } from "@/lib/community/types";

type EventPetParentSignupBoxProps = {
  event: Pick<
    CommunityEventWithPartner,
    | "id"
    | "slug"
    | "title"
    | "start_at"
    | "end_at"
    | "timezone"
    | "venue_name"
    | "city"
    | "state"
    | "featured_market_city"
    | "featured_market_state"
  > & {
    partners?: { city?: string | null; state?: string | null } | null;
  };
  source?: string;
  campaign?: string;
  className?: string;
};

/**
 * Conversion box on event detail / search → details.
 * Shows this event’s details so Pet Parents verify, then signup returns
 * with ?rsvp=1 to open the event and complete attendance.
 */
export default function EventPetParentSignupBox({
  event,
  source = "community_event_detail",
  campaign = "event_detail_pet_parent_signup",
  className = "",
}: EventPetParentSignupBoxProps) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const timing = formatEventDateRange(
    event.start_at,
    event.end_at,
    event.timezone,
  );
  const place = formatEventCountyState(event);
  const venue = event.venue_name?.trim();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const response = await fetch(
          `/api/community/events/${event.id}/attendance`,
        );
        const payload = await response.json();
        if (!cancelled && typeof payload.authenticated === "boolean") {
          setAuthed(payload.authenticated);
        }
      } catch {
        if (!cancelled) setAuthed(false);
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  if (authed) return null;

  const signupHref = buildCommunityEventSignupHref({
    slug: event.slug,
    eventId: event.id,
    role: "pet_parent",
    source,
    campaign,
  });
  const loginHref = buildCommunityEventLoginHref({
    slug: event.slug,
    role: "pet_parent",
  });

  function remember() {
    savePendingEventRsvp({
      eventId: event.id,
      slug: event.slug,
      savedAt: Date.now(),
    });
  }

  return (
    <aside
      className={`overflow-hidden rounded-[1.75rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-sm ${className}`}
    >
      <div className="border-b border-emerald-100 bg-[#0D5C3A] px-5 py-4 public-dark-section">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">
          Free Pet Parent signup
        </p>
        <p className="mt-1 text-sm font-black !text-white">
          Verify this event, join free, then we&apos;ll open it for you
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
            You&apos;re looking at
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">
            {event.title}
          </h3>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
            <li className="inline-flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>
                {timing.dateLabel}
                {timing.timeLabel ? ` · ${timing.timeLabel}` : ""}
              </span>
            </li>
            <li className="inline-flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>
                {[venue, place].filter(Boolean).join(" · ") || "Location TBA"}
              </span>
            </li>
          </ul>
        </div>

        <p className="text-sm font-semibold leading-relaxed text-slate-600">
          Create a free Pet Parent account in seconds. After signup we bring you
          right back here so you can RSVP and keep local pet events on your
          radar.
        </p>

        <Link
          href={signupHref}
          onClick={remember}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white transition hover:bg-emerald-900"
        >
          <Users className="h-4 w-4" />
          Join free as Pet Parent
        </Link>

        <Link
          href={loginHref}
          onClick={remember}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
        >
          Already have an account? Log in
        </Link>

        <p className="inline-flex items-start gap-2 text-xs font-semibold text-slate-500">
          <PawPrint className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
          After you join, this event opens again with your RSVP ready.
        </p>
      </div>
    </aside>
  );
}
