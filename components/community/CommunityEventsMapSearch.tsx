"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import ProviderMap from "@/components/ProviderMap";
import EventCard from "@/components/community/EventCard";
import {
  formatEventCountyState,
  formatEventDateRange,
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
import type { CommunityEventWithPartner } from "@/lib/community/types";
import { COMMUNITY_EVENT_CATEGORIES } from "@/lib/community/types";

type Filters = {
  q: string;
  city: string;
  state: string;
  category: string;
};

const DEFAULT_CENTER: [number, number] = [40.3368, -75.1113]; // Greater Philly / Bucks

function eventToMapMarker(event: CommunityEventWithPartner) {
  const href = getEventBannerHref(event);
  return {
    id: event.id,
    __sitguruMapMarkerId: `event:${event.id}`,
    title: event.title,
    name: event.title,
    headline: formatEventCountyState(event),
    city: event.city || event.featured_market_city || "",
    state: event.state || event.featured_market_state || "",
    latitude: event.latitude,
    longitude: event.longitude,
    radius_miles: 4,
    profileHref: href,
    href,
    avatar_url: event.image_card_url || event.image_hero_url || null,
  };
}

export default function CommunityEventsMapSearch({
  events,
}: {
  events: CommunityEventWithPartner[];
}) {
  const [filters, setFilters] = useState<Filters>({
    q: "",
    city: "",
    state: "",
    category: "",
  });
  const [draft, setDraft] = useState<Filters>(filters);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    const preference = readCommunityLocationPreference();
    if (!preference.city && !preference.state) return;
    const next = {
      q: "",
      city: preference.city || "",
      state: preference.state || "",
      category: "",
    };
    setDraft(next);
    setFilters(next);
  }, []);

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (
        filters.category &&
        !(event.categories || []).includes(filters.category)
      ) {
        return false;
      }
      if (
        filters.city &&
        !(
          event.city?.toLowerCase().includes(filters.city.toLowerCase()) ||
          event.featured_market_city
            ?.toLowerCase()
            .includes(filters.city.toLowerCase())
        )
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
  }, [events, filters]);

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
    if (filters.city || filters.state) return DEFAULT_CENTER;
    return DEFAULT_CENTER;
  }, [filtered, filters.city, filters.state]);

  function applySearch(next: Filters = draft) {
    setFilters(next);
    if (next.city || next.state) {
      saveCommunityLocationPreference({
        city: next.city || undefined,
        state: next.state || undefined,
        source: "manual",
      });
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
          Local pet life
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Find events near you.
        </h2>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600 sm:text-base">
          Search by city or state — same map vibe as Find Care, built for pet
          friendly gatherings.
        </p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
        <div className="relative">
          <div className="absolute inset-x-0 top-0 z-20 p-3 sm:p-4">
            <form
              className="rounded-3xl border border-white/70 bg-white/95 p-3 shadow-lg shadow-slate-900/10 backdrop-blur"
              onSubmit={(e) => {
                e.preventDefault();
                applySearch(draft);
              }}
            >
              <div className="grid gap-2 sm:grid-cols-[1.4fr_0.9fr_0.55fr_auto] sm:items-end">
                <label className="block min-w-0">
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Search
                  </span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={draft.q}
                      onChange={(e) =>
                        setDraft((current) => ({ ...current, q: e.target.value }))
                      }
                      placeholder="Adoption, meetup, festival…"
                      className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    City
                  </span>
                  <input
                    value={draft.city}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        city: e.target.value,
                      }))
                    }
                    placeholder="Doylestown"
                    className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
                    className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold uppercase text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-800"
                >
                  Search
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  value={draft.category}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      category: e.target.value,
                    }))
                  }
                  className="min-h-10 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"
                >
                  <option value="">All categories</option>
                  {COMMUNITY_EVENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {(filters.q || filters.city || filters.state || filters.category) && (
                  <button
                    type="button"
                    onClick={() => {
                      const cleared = {
                        q: "",
                        city: "",
                        state: "",
                        category: "",
                      };
                      setDraft(cleared);
                      applySearch(cleared);
                    }}
                    className="min-h-10 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="h-[460px] pt-[9.5rem] sm:h-[540px] sm:pt-[7.5rem]">
            <ProviderMap
              markers={markers as unknown as Record<string, unknown>[]}
              center={mapCenter}
              highlightedMarkerId={
                highlightedId ? `event:${highlightedId}` : undefined
              }
            />
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-800">
              {filtered.length} event{filtered.length === 1 ? "" : "s"}
              {filters.city || filters.state
                ? ` near ${[filters.city, filters.state].filter(Boolean).join(", ")}`
                : ""}
            </p>
            <Link
              href="/community/events"
              className="text-sm font-black text-emerald-800 hover:underline"
            >
              Open full list →
            </Link>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600">
              No events match that search yet. Try another city/state, or browse
              the full calendar.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filtered.slice(0, 12).map((event) => {
                const { compactDate } = formatEventDateRange(
                  event.start_at,
                  event.end_at,
                  event.timezone,
                );
                const href = getEventBannerHref(event);
                const external = isExternalEventLink(event);
                const className = `w-[240px] shrink-0 rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md ${
                  highlightedId === event.id
                    ? "border-emerald-400 ring-4 ring-emerald-100"
                    : "border-slate-200"
                }`;

                const body = (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                      {compactDate}
                      {isGoogleDiscoveryEvent(event) ? " · Community Event" : " · SitGuru Partner Event"}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-base font-black text-slate-950">
                      {event.title}
                    </h3>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">
                      <MapPin className="h-3.5 w-3.5" />
                      {formatEventCountyState(event)}
                    </p>
                  </>
                );

                if (external) {
                  return (
                    <a
                      key={event.id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={className}
                      onMouseEnter={() => setHighlightedId(event.id)}
                      onFocus={() => setHighlightedId(event.id)}
                    >
                      {body}
                    </a>
                  );
                }

                return (
                  <Link
                    key={event.id}
                    href={href}
                    className={className}
                    onMouseEnter={() => setHighlightedId(event.id)}
                    onFocus={() => setHighlightedId(event.id)}
                  >
                    {body}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-8 hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, 6).map((event) => (
            <div
              key={`card-${event.id}`}
              onMouseEnter={() => setHighlightedId(event.id)}
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
