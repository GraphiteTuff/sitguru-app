import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, PawPrint, Search, Ticket } from "lucide-react";
import EventCard from "@/components/community/EventCard";
import {
  formatEventDateRange,
  formatEventLocationInline,
  getEventHeroImage,
} from "@/lib/community/format";
import type { CommunityEventWithPartner } from "@/lib/community/types";
import { getPublicEventPath } from "@/lib/community/slug";

type HomepageEventsSectionProps = {
  featured: CommunityEventWithPartner | null;
  upcoming: CommunityEventWithPartner[];
  locationLabel?: string;
};

function FeaturedEventHero({ event }: { event: CommunityEventWithPartner }) {
  const imageUrl = getEventHeroImage(event);
  const { dateLabel, timeLabel } = formatEventDateRange(
    event.start_at,
    event.end_at,
    event.timezone,
  );
  const partnerName = event.partners?.business_name || "SitGuru Partner";
  const href = getPublicEventPath(event.slug);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="grid lg:grid-cols-[1.1fr_1fr_0.9fr]">
        <div className="relative min-h-[260px] bg-emerald-50 lg:min-h-[420px]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
          ) : (
            <div className="flex h-full min-h-[260px] items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-50">
              <PawPrint className="h-16 w-16 text-emerald-700/40" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Featured Event
          </p>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {event.title}
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Presented by {partnerName}
            </p>
          </div>

          <div className="space-y-2 text-sm font-semibold text-slate-700">
            <p className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-700" />
              {dateLabel}
              <span className="text-slate-400">•</span>
              {timeLabel}
            </p>
            <p className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-700" />
              {formatEventLocationInline(event)}
            </p>
          </div>

          {event.short_description ? (
            <p className="max-w-xl text-sm leading-relaxed text-slate-600">
              {event.short_description}
            </p>
          ) : null}

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
        </div>

        <div className="flex flex-col justify-center gap-3 border-t border-slate-100 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <Link
            href={href}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            View Event Details
          </Link>
          <Link
            href={`/search?city=${encodeURIComponent(event.city || "")}&state=${encodeURIComponent(event.state || "")}`}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 transition hover:bg-slate-50"
          >
            Meet Local Gurus
          </Link>
          <Link
            href={`${href}#share`}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
          >
            Share Event
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomepageEventsSection({
  featured,
  upcoming,
  locationLabel,
}: HomepageEventsSectionProps) {
  const cards = upcoming.filter((event) => event.id !== featured?.id).slice(0, 4);

  if (!featured && cards.length === 0) {
    return null;
  }

  return (
    <section className="border-y border-slate-100 bg-[#f8fcfd] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Community
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
              Happening Near You
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600 sm:text-base">
              Pet-friendly events and activities in your community
              {locationLabel ? ` — ${locationLabel}` : ""}.
            </p>
          </div>
          <Link
            href="/community/events"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
          >
            <Search className="h-4 w-4" />
            Browse all events
          </Link>
        </div>

        {featured ? (
          <div className="mt-8">
            <FeaturedEventHero event={featured} />
          </div>
        ) : null}

        {cards.length ? (
          <div className="mt-10">
            <h3 className="text-lg font-black tracking-tight text-slate-950">
              More upcoming events
            </h3>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {cards.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
