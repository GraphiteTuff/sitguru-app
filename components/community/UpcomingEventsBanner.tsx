"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  PawPrint,
  X,
} from "lucide-react";
import {
  formatEventDateRange,
  getEventCardImage,
} from "@/lib/community/format";
import { fallbackEventCardImage } from "@/lib/community/event-card-fallbacks";
import type { CommunityEventWithPartner } from "@/lib/community/types";
import {
  getEventBannerHref,
  isExternalEventLink,
  isGoogleDiscoveryEvent,
} from "@/lib/community/event-preview";
import {
  buildDiscoveryPetParentSignupHref,
  savePendingDiscoveryOpen,
} from "@/lib/community/pet-parent-signup";

function BannerCardImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const fallback = fallbackEventCardImage(alt);
  const [current, setCurrent] = useState(src || fallback);
  const [failedPrimary, setFailedPrimary] = useState(false);

  useEffect(() => {
    setCurrent(src || fallback);
    setFailedPrimary(false);
  }, [src, fallback]);

  return (
    <Image
      src={current}
      alt={alt}
      fill
      className="object-cover transition duration-500 group-hover:scale-[1.03]"
      sizes="300px"
      onError={() => {
        if (!failedPrimary) {
          setFailedPrimary(true);
          setCurrent(fallback);
        }
      }}
    />
  );
}

function EventBannerCard({
  event,
  onGoogleCapture,
}: {
  event: CommunityEventWithPartner;
  onGoogleCapture: (event: CommunityEventWithPartner) => void;
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
  const href = getEventBannerHref(event);
  const external = isExternalEventLink(event);
  const googleDiscovery = isGoogleDiscoveryEvent(event);

  const cardBody = (
    <>
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-slate-100">
        <BannerCardImage src={imageUrl} alt={event.title} />
        <div className="absolute left-4 top-4 min-w-[52px] rounded-xl bg-emerald-700 px-2.5 py-1.5 text-center text-white shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.12em]">
            {badgeMonth}
          </p>
          <p className="text-xl font-black leading-none">{badgeDay}</p>
        </div>
        {googleDiscovery ? (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-700 shadow-sm">
            <ExternalLink className="h-3 w-3" />
            Around town
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 min-h-[3.5rem] text-xl font-black leading-snug tracking-tight text-slate-950">
          {event.title}
        </h3>

        <div className="space-y-1.5 text-sm font-semibold text-slate-600">
          <p className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-emerald-700" />
            <span className="line-clamp-1">{bannerDate}</span>
          </p>
          <p className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 shrink-0 text-emerald-700" />
            <span className="line-clamp-1">{timeLabel}</span>
          </p>
          <p className="line-clamp-1 text-slate-700">{venueLabel}</p>
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
    </>
  );

  const className =
    "group flex h-[440px] w-[280px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:w-[300px]";

  if (googleDiscovery && external) {
    return (
      <button
        type="button"
        onClick={() => onGoogleCapture(event)}
        className={`${className} cursor-pointer text-left`}
      >
        {cardBody}
      </button>
    );
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {cardBody}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {cardBody}
    </Link>
  );
}

function DiscoveryCaptureSheet({
  event,
  onClose,
}: {
  event: CommunityEventWithPartner;
  onClose: () => void;
}) {
  const eventUrl = event.event_url || getEventBannerHref(event);
  const signupHref = buildDiscoveryPetParentSignupHref({
    eventId: event.id,
    title: event.title,
    source: "homepage_events_banner",
    campaign: "google_discovery_capture",
  });

  function rememberAndJoin() {
    if (eventUrl) {
      savePendingDiscoveryOpen({
        eventId: event.id,
        title: event.title,
        eventUrl,
        savedAt: Date.now(),
      });
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discovery-capture-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Join the pack
            </p>
            <h3
              id="discovery-capture-title"
              className="mt-1 text-lg font-black tracking-tight text-slate-950"
            >
              {event.title}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="text-sm font-semibold leading-6 text-slate-600">
            Free Pet Parent signup takes seconds — then we&apos;ll send you back
            to this event and keep local pet hangs on your radar.
          </p>

          <Link
            href={signupHref}
            onClick={rememberAndJoin}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            Join free as Pet Parent
          </Link>

          <a
            href={eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50"
          >
            Just open the event
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export type EventsBannerSource = "live" | "google" | "demo";

type UpcomingEventsBannerProps = {
  events: CommunityEventWithPartner[];
  previewMode?: boolean;
  source?: EventsBannerSource;
  lastSyncedAt?: string | null;
  viewAllHref?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  adminHref?: string;
};

export default function UpcomingEventsBanner({
  events,
  previewMode = false,
  source = "demo",
  lastSyncedAt: _lastSyncedAt = null,
  viewAllHref = "/community/events",
  eyebrow = "Local pet life",
  title = "Where good pets gather.",
  subtitle,
  adminHref,
}: UpcomingEventsBannerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [captureEvent, setCaptureEvent] =
    useState<CommunityEventWithPartner | null>(null);

  if (!events.length) return null;

  const resolvedSubtitle =
    subtitle ||
    (source === "google"
      ? "Adoption days, meetups, and neighborhood pet energy near you — refreshed daily."
      : source === "demo"
        ? "A taste of the local calendar. Partner events take the lead as they go live."
        : "Pet-friendly hangs from SitGuru partners and the local scene.");

  const previewLabel =
    source === "google"
      ? "Around town"
      : source === "demo"
        ? "Coming soon"
        : null;

  function refreshScrollState() {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollLeft(track.scrollLeft > 8);
    setCanScrollRight(
      track.scrollLeft + track.clientWidth < track.scrollWidth - 8,
    );
  }

  function scrollByCards(direction: "left" | "right") {
    trackRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
    window.setTimeout(refreshScrollState, 280);
  }

  useEffect(() => {
    refreshScrollState();
    window.addEventListener("resize", refreshScrollState);
    return () => window.removeEventListener("resize", refreshScrollState);
  }, [events.length]);

  useEffect(() => {
    if (!captureEvent) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCaptureEvent(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [captureEvent]);

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
            {previewMode && previewLabel ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-900">
                {previewLabel}
              </span>
            ) : null}
          </div>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
            {resolvedSubtitle}
          </p>
        </div>

        <div className="relative mt-9">
          {canScrollLeft ? (
            <button
              type="button"
              aria-label="Previous events"
              onClick={() => scrollByCards("left")}
              className="absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-md transition hover:border-emerald-200 hover:text-emerald-800 sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}

          <div
            ref={trackRef}
            onScroll={refreshScrollState}
            className="flex items-stretch gap-4 overflow-x-auto scroll-smooth pb-2 pl-0 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-12"
          >
            {events.map((event) => (
              <EventBannerCard
                key={event.id}
                event={event}
                onGoogleCapture={setCaptureEvent}
              />
            ))}
          </div>

          {canScrollRight ? (
            <button
              type="button"
              aria-label="Next events"
              onClick={() => scrollByCards("right")}
              className="absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-md transition hover:border-emerald-200 hover:text-emerald-800 sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={viewAllHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-700 px-6 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            See what&apos;s on
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

      {captureEvent ? (
        <DiscoveryCaptureSheet
          event={captureEvent}
          onClose={() => setCaptureEvent(null)}
        />
      ) : null}
    </section>
  );
}
