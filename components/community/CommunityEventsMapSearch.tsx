"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  MapPin,
  PawPrint,
  Search,
} from "lucide-react";
import ProviderMap from "@/components/ProviderMap";
import EventAttendingButtons from "@/components/community/EventAttendingButtons";
import {
  eventMatchesCounty,
  formatEventCountyState,
  formatEventDateRange,
  getEventCardImage,
  getEventCountyLabel,
} from "@/lib/community/format";
import {
  getEventBannerHref,
  isExternalEventLink,
  isGoogleDiscoveryEvent,
} from "@/lib/community/event-preview";
import {
  readCommunityLocationPreference,
  saveCommunityLocationPreference,
} from "@/lib/community/location-preference";
import { COMMUNITY_MAJOR_COUNTIES } from "@/lib/community/market-seed";
import CommunityCountySuggestInput from "@/components/community/CommunityCountySuggestInput";
import type { CommunityEventWithPartner } from "@/lib/community/types";
import { COMMUNITY_EVENT_CATEGORIES } from "@/lib/community/types";
import { isHomepageDemoEvent } from "@/lib/community/homepage-demo-events";

type Filters = {
  q: string;
  county: string;
  city: string;
  state: string;
  category: string;
};

const DEFAULT_CENTER: [number, number] = [40.3368, -75.1113];

function eventToMapMarker(event: CommunityEventWithPartner) {
  const href = getEventBannerHref(event);
  const { compactDate, timeLabel } = formatEventDateRange(
    event.start_at,
    event.end_at,
    event.timezone,
  );
  const description = (
    event.short_description ||
    event.description ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
  const googleDiscovery = isGoogleDiscoveryEvent(event);
  const badges = [
    event.is_free ? "Free" : null,
    event.pet_friendly ? "Pet Friendly" : null,
    googleDiscovery ? "Pet Event" : "SitGuru Partner Event",
  ].filter(Boolean) as string[];

  return {
    id: event.id,
    __sitguruMapMarkerId: `event:${event.id}`,
    __sitguruMapKind: "event",
    __sitguruCanBook: true,
    kind: "event",
    title: formatEventCountyState(event),
    name: event.title,
    headline: description,
    short_description: description,
    description,
    whenLabel: [compactDate, timeLabel].filter(Boolean).join(" · "),
    venue_name: event.venue_name || "",
    city: event.city || event.featured_market_city || "",
    state: event.state || event.featured_market_state || "",
    latitude: event.latitude,
    longitude: event.longitude,
    radius_miles: 1,
    profileHref: href,
    href,
    ctaLabel: googleDiscovery ? "Open event" : "View event",
    badges,
    avatar_url: event.image_card_url || event.image_hero_url || null,
  };
}

function EventListCard({
  event,
  highlighted,
  onHighlight,
}: {
  event: CommunityEventWithPartner;
  highlighted: boolean;
  onHighlight: () => void;
}) {
  const imageUrl = getEventCardImage(event);
  const { compactDate, timeLabel } = formatEventDateRange(
    event.start_at,
    event.end_at,
    event.timezone,
  );
  const href = getEventBannerHref(event);
  const external = isExternalEventLink(event);
  const googleDiscovery = isGoogleDiscoveryEvent(event);
  const sourceLabel = googleDiscovery
    ? "Pet Event"
    : "SitGuru Partner Event";
  const description = (
    event.short_description ||
    event.description ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim();
  const blurb =
    description.length > 110
      ? `${description.slice(0, 107).trim()}…`
      : description;

  const body = (
    <>
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-emerald-50 sm:h-[128px] sm:w-[128px]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 128px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-emerald-700">
            <PawPrint className="h-8 w-8 opacity-50" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black leading-snug text-slate-950 sm:text-xl">
                {event.title}
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${
                  googleDiscovery
                    ? "bg-slate-100 text-slate-700"
                    : "bg-emerald-50 text-emerald-800"
                }`}
              >
                {sourceLabel}
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-emerald-800">
              {formatEventCountyState(event)}
            </p>
            {blurb ? (
              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-600">
                {blurb}
              </p>
            ) : null}
          </div>
          <div className="min-w-[76px] rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-center sm:min-w-[88px]">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
              {compactDate.split(" ")[0]}
            </p>
            <p className="mt-0.5 text-2xl font-black leading-none text-slate-950 sm:text-3xl">
              {compactDate.split(" ")[1]}
            </p>
          </div>
        </div>

        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
          <CalendarDays className="h-4 w-4 shrink-0 text-emerald-700" />
          <span className="min-w-0 break-words">{timeLabel}</span>
        </p>
        <p className="mt-1 inline-flex items-start gap-1.5 text-sm font-semibold text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          <span className="min-w-0 break-words">
            {event.venue_name ||
              [event.city, event.state].filter(Boolean).join(", ") ||
              "Location TBA"}
          </span>
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {event.is_free ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
              Free
            </span>
          ) : null}
          {event.pet_friendly ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
              Pet Friendly
            </span>
          ) : null}
          {(event.categories || []).slice(0, 2).map((category) => (
            <span
              key={category}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700"
            >
              {category}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <span className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 sm:w-auto">
            View details
          </span>
          {googleDiscovery ? (
            <span className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white sm:w-auto">
              Open event
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  const shellClass = `rounded-[24px] border bg-white p-4 shadow-[0_8px_26px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:rounded-[28px] sm:p-5 ${
    highlighted
      ? "border-emerald-400 ring-4 ring-emerald-100"
      : "border-slate-200"
  }`;
  const linkClass =
    "flex flex-col gap-4 sm:flex-row focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 rounded-[20px]";

  return (
    <article
      className={shellClass}
      onMouseEnter={onHighlight}
      onFocus={onHighlight}
    >
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {body}
        </a>
      ) : (
        <Link href={href} className={linkClass}>
          {body}
        </Link>
      )}
      {!isHomepageDemoEvent(event.id) ? (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <EventAttendingButtons
            eventId={event.id}
            eventSlug={event.slug}
            compact
          />
        </div>
      ) : null}
    </article>
  );
}

export default function CommunityEventsMapSearch({
  events,
}: {
  events: CommunityEventWithPartner[];
}) {
  const [filters, setFilters] = useState<Filters>({
    q: "",
    county: "",
    city: "",
    state: "",
    category: "",
  });
  const [draft, setDraft] = useState<Filters>(filters);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    const preference = readCommunityLocationPreference();
    if (!preference.county && !preference.city && !preference.state) return;
    const next = {
      q: "",
      county: preference.county || "",
      city: preference.city || "",
      state: preference.state || "",
      category: "",
    };
    setDraft(next);
    setFilters(next);
  }, []);

  const filtered = useMemo(() => {
    const matched = events.filter((event) => {
      if (
        filters.category &&
        !(event.categories || []).includes(filters.category)
      ) {
        return false;
      }
      if (filters.county && !eventMatchesCounty(event, filters.county)) {
        return false;
      }
      if (
        filters.city &&
        !event.city?.toLowerCase().includes(filters.city.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.state &&
        !(
          event.state?.toLowerCase().includes(filters.state.toLowerCase()) ||
          event.featured_market_state
            ?.toLowerCase()
            .includes(filters.state.toLowerCase())
        )
      ) {
        return false;
      }
      if (filters.q) {
        const haystack =
          `${event.title} ${event.short_description || ""} ${event.venue_name || ""} ${formatEventCountyState(event)}`.toLowerCase();
        if (!haystack.includes(filters.q.toLowerCase())) return false;
      }
      return true;
    });

    // All events show by county (then date).
    return [...matched].sort((a, b) => {
      const countyA = getEventCountyLabel(a) || "Other";
      const countyB = getEventCountyLabel(b) || "Other";
      const byCounty = countyA.localeCompare(countyB);
      if (byCounty !== 0) return byCounty;
      return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
    });
  }, [events, filters]);

  const groupedByCounty = useMemo(() => {
    const groups: { county: string; events: CommunityEventWithPartner[] }[] =
      [];
    for (const event of filtered) {
      const county =
        formatEventCountyState(event) || getEventCountyLabel(event) || "Other";
      const last = groups[groups.length - 1];
      if (last && last.county === county) {
        last.events.push(event);
      } else {
        groups.push({ county, events: [event] });
      }
    }
    return groups;
  }, [filtered]);

  const markers = useMemo(
    () => filtered.map(eventToMapMarker),
    [filtered],
  );

  const mapCenter = useMemo<[number, number] | undefined>(() => {
    const withCoords = filtered.find(
      (event) =>
        Number.isFinite(Number(event.latitude)) &&
        Number.isFinite(Number(event.longitude)) &&
        Number(event.latitude) !== 0 &&
        Number(event.longitude) !== 0,
    );
    if (withCoords?.latitude != null && withCoords?.longitude != null) {
      return [Number(withCoords.latitude), Number(withCoords.longitude)];
    }
    return DEFAULT_CENTER;
  }, [filtered]);

  const activeFilterCount = [
    filters.q,
    filters.county,
    filters.city,
    filters.state,
    filters.category,
  ].filter(Boolean).length;

  function applySearch(next: Filters = draft) {
    setFilters(next);
    if (next.county || next.city || next.state) {
      saveCommunityLocationPreference({
        county: next.county || undefined,
        city: next.city || undefined,
        state: next.state || undefined,
        source: "manual",
      });
    }
  }

  function clearFilters() {
    const cleared = { q: "", county: "", city: "", state: "", category: "" };
    setDraft(cleared);
    applySearch(cleared);
  }

  return (
    <section className="pb-4">
      <div className="mx-auto max-w-[1500px] px-5 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <div className="mb-6 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Local pet life
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Find events near you
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-600 sm:text-base">
            Search nearby pet friendly events — map on top on phones, side-by-side on desktop.
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:rounded-[28px] sm:p-6">
          <form
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-[1fr_1.05fr_0.9fr_0.55fr_1.15fr_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch(draft);
            }}
          >
            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold text-slate-800">
                Category
              </span>
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    category: e.target.value,
                  }))
                }
                className="min-h-12 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:text-sm"
              >
                <option value="">All categories</option>
                {COMMUNITY_EVENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold text-slate-800">
                County
              </span>
              <CommunityCountySuggestInput
                value={draft.county}
                stateValue={draft.state}
                placeholder="Search any U.S. county"
                onChange={(county) =>
                  setDraft((current) => ({
                    ...current,
                    county,
                  }))
                }
                onSelect={(hit) => {
                  const next = {
                    ...draft,
                    county: hit.county_name,
                    state: hit.state,
                    city: hit.city || draft.city,
                  };
                  setDraft(next);
                }}
              />
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold text-slate-800">
                City
              </span>
              <input
                value={draft.city}
                onChange={(e) =>
                  setDraft((current) => ({ ...current, city: e.target.value }))
                }
                placeholder="Quakertown"
                className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:text-sm"
              />
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold text-slate-800">
                State
              </span>
              <input
                value={draft.state}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    state: e.target.value.toUpperCase().slice(0, 2),
                  }))
                }
                placeholder="PA"
                maxLength={2}
                className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:text-sm"
              />
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold text-slate-800">
                Search events
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={draft.q}
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, q: e.target.value }))
                  }
                  placeholder="Adoption, meetup, festival…"
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:text-sm"
                />
              </div>
            </label>

            <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-1">
              <button
                type="submit"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Search
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Major counties
            </span>
            {COMMUNITY_MAJOR_COUNTIES.map((option) => {
              const active = draft.county
                .toLowerCase()
                .includes(option.county.replace(/ County$/i, "").toLowerCase());
              return (
                <button
                  key={`${option.county}-${option.state}`}
                  type="button"
                  onClick={() => {
                    const next = {
                      ...draft,
                      county: option.county,
                      state: option.state,
                    };
                    setDraft(next);
                    applySearch(next);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                    active
                      ? "bg-emerald-700 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  {option.county.replace(/ County$/i, "")}, {option.state}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
              {filtered.length} event{filtered.length === 1 ? "" : "s"} nearby
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
              {activeFilterCount} active filter
              {activeFilterCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
          <div className="order-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)] xl:order-2 xl:sticky xl:top-28 xl:self-start">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                Events are closer with SitGuru
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Pet friendly gatherings near you — partners first, community next.
              </p>
              {(filters.county || filters.city || filters.state) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                    Centered on{" "}
                    {[filters.county, filters.city, filters.state]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
            </div>
            <div className="h-[300px] sm:h-[420px] md:h-[520px] xl:h-[calc(100vh-9rem)] xl:min-h-[520px] xl:max-h-[720px]">
              <ProviderMap
                markers={markers as unknown as Record<string, unknown>[]}
                center={mapCenter}
                highlightedMarkerId={
                  highlightedId ? `event:${highlightedId}` : undefined
                }
                footerTitle="Your next pet hang is already on the map."
                footerBadge="Pull up — paws welcome"
              />
            </div>
          </div>

          <div className="order-2 space-y-4 sm:space-y-5 xl:order-1">
            <div className="flex items-center justify-between gap-2 xl:hidden">
              <p className="text-sm font-black text-slate-800">
                {filtered.length} event{filtered.length === 1 ? "" : "s"}
              </p>
              <Link
                href="/events/host"
                className="text-sm font-black text-emerald-800"
              >
                Host an event
              </Link>
            </div>            {filtered.length === 0 ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
                <h3 className="text-xl font-bold text-slate-900">
                  No events match just yet
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  Try another county, city, or category. Partner Events and local
                  community listings show here when markets are syncing.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    Show all events
                  </button>
                  <Link
                    href="/events/host"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
                  >
                    Host a pet event
                  </Link>
                </div>
              </div>
            ) : (
              groupedByCounty.map((group) => (
                <div key={group.county} className="space-y-4 sm:space-y-5">
                  <div className="sticky top-20 z-[1] -mx-1 rounded-2xl border border-emerald-100 bg-emerald-50/95 px-4 py-2.5 backdrop-blur xl:static xl:mx-0">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
                      {group.county}
                    </p>
                    <p className="text-sm font-semibold text-emerald-900/80">
                      {group.events.length} event
                      {group.events.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {group.events.map((event) => (
                    <EventListCard
                      key={event.id}
                      event={event}
                      highlighted={highlightedId === event.id}
                      onHighlight={() => setHighlightedId(event.id)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
