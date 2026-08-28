"use client";

import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock3, PawPrint } from "lucide-react";
import {
  formatEventDateRange,
  getEventCardImage,
} from "@/lib/community/format";
import type { CommunityEventWithPartner } from "@/lib/community/types";
import { getPublicEventPath } from "@/lib/community/slug";
import { isHomepageDemoEvent } from "@/lib/community/homepage-demo-events";

function EventBannerCard({
  event,
  previewMode = false,
}: {
  event: CommunityEventWithPartner;
  previewMode?: boolean;
}) {
  const imageUrl = getEventCardImage(event);
  const { bannerDate, timeLabel, badgeMonth, badgeDay } = formatEventDateRange(
    event.start_at,
    event.end_at,
    event.timezone,
  );
  const venueLabel =
    event.venue_name?.trim() ||
    event.partners?.business_name ||
    [event.city, event.state].filter(Boolean).join(", ") ||
    "Location TBA";
  const isPreview = previewMode || isHomepageDemoEvent(event.id);
  const href = isPreview ? "/community/events" : getPublicEventPath(event.slug);

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100">
            <PawPrint className="h-12 w-12 text-emerald-700/35" />
          </div>
        )}
        <div className="absolute left-4 top-4 min-w-[52px] rounded-xl bg-emerald-700 px-2.5 py-1.5 text-center text-white shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.12em]">
            {badgeMonth}
          </p>
          <p className="text-xl font-black leading-none">{badgeDay}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-xl font-black tracking-tight text-slate-950">
          {event.title}
        </h3>

        <div className="space-y-1.5 text-sm font-semibold text-slate-600">
          <p className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-emerald-700" />
            {bannerDate}
          </p>
          <p className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 shrink-0 text-emerald-700" />
            {timeLabel}
          </p>
          <p className="line-clamp-2 text-slate-700">{venueLabel}</p>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {event.is_free ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-800">
              Free Event
            </span>
          ) : (
            <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-sky-900">
              Tickets
            </span>
          )}
          {event.pet_friendly ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-800">
              <PawPrint className="h-3 w-3" />
              Pet Friendly
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

type UpcomingEventsBannerProps = {
  events: CommunityEventWithPartner[];
  previewMode?: boolean;
  viewAllHref?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  adminHref?: string;
};

export default function UpcomingEventsBanner({
  events,
  previewMode = false,
  viewAllHref = "/community/events",
  eyebrow = "Community events",
  title = "More upcoming events.",
  subtitle = "Pet-friendly gatherings from SitGuru partners near you.",
  adminHref,
}: UpcomingEventsBannerProps) {
  if (!events.length) return null;

  const displayEvents = events.slice(0, 4);

  return (
    <section className="border-y border-slate-100 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {eyebrow}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
              {title}
            </h2>
            {previewMode ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-900">
                Preview examples
              </span>
            ) : null}
          </div>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
            {previewMode
              ? "Sample listings from the Community mockups — live partner events replace these after admin publish."
              : subtitle}
          </p>
        </div>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {displayEvents.map((event) => (
            <EventBannerCard
              key={event.id}
              event={event}
              previewMode={previewMode}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={viewAllHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-700 px-6 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            View all events
          </Link>
          <Link
            href="/community"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50"
          >
            Explore Community
          </Link>
          {adminHref ? (
            <Link
              href={adminHref}
              className="text-sm font-black text-slate-500 transition hover:text-emerald-800 hover:underline"
            >
              Manage in Admin
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
