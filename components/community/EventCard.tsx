"use client";

import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, PawPrint, Ticket } from "lucide-react";
import EventAttendingButtons from "@/components/community/EventAttendingButtons";
import {
  formatEventDateRange,
  formatEventCountyState,
  formatEventLocationInline,
  getEventCardImage,
} from "@/lib/community/format";
import type { CommunityEventWithPartner } from "@/lib/community/types";
import { getPublicEventPath } from "@/lib/community/slug";
import { isHomepageDemoEvent } from "@/lib/community/homepage-demo-events";
import { isGoogleDiscoveryEvent } from "@/lib/community/event-preview";

type EventCardProps = {
  event: CommunityEventWithPartner;
  showPartner?: boolean;
  className?: string;
  previewMode?: boolean;
};

export default function EventCard({
  event,
  showPartner = true,
  className = "",
  previewMode = false,
}: EventCardProps) {
  const imageUrl = getEventCardImage(event);
  const { compactDate, timeLabel } = formatEventDateRange(
    event.start_at,
    event.end_at,
    event.timezone,
  );
  const googleDiscovery = isGoogleDiscoveryEvent(event);
  const sourceLabel = googleDiscovery
    ? "Pet Event"
    : "SitGuru Partner Event";
  const partnerName = googleDiscovery
    ? "Pet Event"
    : event.partners?.business_name || "SitGuru Partner";
  const isPreview = previewMode || isHomepageDemoEvent(event.id);
  const href = isPreview ? "/events" : getPublicEventPath(event.slug);
  const showAttending = !isPreview && !googleDiscovery;

  return (
    <article
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      <Link href={href} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-emerald-50">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-800">
              <PawPrint className="h-10 w-10 opacity-60" />
            </div>
          )}
          <div className="absolute left-4 top-4 rounded-2xl bg-white/95 px-3 py-2 text-center shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              {compactDate.split(" ")[0]}
            </p>
            <p className="text-lg font-black leading-none text-slate-950">
              {compactDate.split(" ")[1]}
            </p>
          </div>
          <div
            className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] shadow-sm ${
              googleDiscovery
                ? "bg-slate-900/90 text-white"
                : "bg-[#0D5C3A] text-white"
            }`}
          >
            {sourceLabel}
          </div>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex flex-wrap gap-2">
            {event.is_free ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                Free Event
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                <Ticket className="h-3.5 w-3.5" />
                Tickets
              </span>
            )}
            {event.pet_friendly ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                <PawPrint className="h-3.5 w-3.5" />
                Pet Friendly
              </span>
            ) : null}
          </div>

          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              {event.title}
            </h3>
            <p className="mt-1 text-sm font-bold text-emerald-800">
              {formatEventCountyState(event)}
            </p>
            {showPartner ? (
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {partnerName}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5 text-sm font-semibold text-slate-600">
            <p className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-700" />
              {timeLabel}
            </p>
            <p className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-700" />
              {formatEventLocationInline(event)}
            </p>
          </div>
        </div>
      </Link>

      <div className="space-y-3 border-t border-slate-100 px-5 py-4">
        {showAttending ? (
          <EventAttendingButtons
            eventId={event.id}
            eventSlug={event.slug}
            compact
          />
        ) : null}
        <Link
          href={href}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-800"
        >
          {isPreview ? "Explore Events" : "View Event"}
        </Link>
      </div>
    </article>
  );
}
