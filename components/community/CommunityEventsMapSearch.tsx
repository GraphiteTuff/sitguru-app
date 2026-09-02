"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  LocateFixed,
  MapPin,
  PawPrint,
  Search,
} from "lucide-react";
import ProviderMap from "@/components/ProviderMap";
import EventAttendingButtons from "@/components/community/EventAttendingButtons";
import PlaceListCard from "@/components/community/PlaceListCard";
import {
  eventMatchesCounty,
  eventMatchesDateRange,
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
import { isHomepageDemoEvent } from "@/lib/community/homepage-demo-events";
import {
  readCommunityLocationPreference,
  saveCommunityLocationPreference,
} from "@/lib/community/location-preference";
import {
  defaultMetroChips,
  nearbyMetroChips,
  type MetroChip,
} from "@/lib/community/us-metros";
import CommunityCountySuggestInput from "@/components/community/CommunityCountySuggestInput";
import { mergeUniqueCommunityEvents } from "@/lib/community/dedupe-events";
import type { CommunityEventWithPartner } from "@/lib/community/types";
import { COMMUNITY_EVENT_CATEGORIES } from "@/lib/community/types";
import { placeGlyph } from "@/lib/community/place-icons";
import {
  LANE_SEARCH_PLACEHOLDERS,
  PLACE_LANES,
  categoriesForLane,
  type PetFriendlyPlace,
  type PlaceCategoryId,
  type PlaceLane,
} from "@/lib/community/places";

type Filters = {
  q: string;
  county: string;
  city: string;
  state: string;
  category: string;
  dateFrom: string;
  dateTo: string;
};

const EMPTY_FILTERS: Filters = {
  q: "",
  county: "",
  city: "",
  state: "",
  category: "",
  dateFrom: "",
  dateTo: "",
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
  const curated = isHomepageDemoEvent(event.id);
  const badges = [
    event.is_free ? "Free" : null,
    event.pet_friendly ? "Pet Friendly" : null,
    googleDiscovery || curated ? "Pet Event" : "SitGuru Partner Event",
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
    ctaLabel: "RSVP on SitGuru",
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
  const curated = isHomepageDemoEvent(event.id);
  const sourceLabel =
    googleDiscovery || curated ? "Pet Event" : "SitGuru Partner Event";
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
                  googleDiscovery || curated
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
              RSVP on SitGuru
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
      <div className="mt-4 border-t border-slate-100 pt-3">
        <EventAttendingButtons
          eventId={event.id}
          eventSlug={event.slug}
          compact
        />
      </div>
    </article>
  );
}

function placeToMapMarker(place: PetFriendlyPlace) {
  return {
    id: place.id,
    __sitguruMapMarkerId: place.id,
    __sitguruMapKind: "place",
    __sitguruCanBook: false,
    kind: "place",
    title: place.petFriendlyLabel,
    name: place.name,
    headline: place.reasons[0] || place.categoryLabel,
    short_description: place.reasons.slice(0, 3).join(" · "),
    description: place.editorialSummary || place.reasons.join(" · "),
    whenLabel: place.hoursLabel || "",
    venue_name: place.address,
    city: place.city,
    state: place.state,
    latitude: place.latitude,
    longitude: place.longitude,
    radius_miles: 0.4,
    profileHref: place.googleMapsUrl || place.websiteUrl || "/events?view=places",
    href: place.googleMapsUrl || place.websiteUrl || "/events?view=places",
    ctaLabel: place.category === "vet_er" ? "Call / Directions" : "Directions",
    badges: [
      place.categoryLabel,
      `Pet Friendliness ${place.petFriendlyScore.toFixed(1)}`,
      place.category === "vet_er" ? "ER" : null,
    ].filter(Boolean) as string[],
    avatar_url: place.photoUrl,
    photoAttribution: place.photoAttribution,
    placeCategory: place.category,
    placeLane: place.lane,
    placeGlyph: placeGlyph(place.category, place.lane),
  };
}

function syncCommunityView(view: "events" | "places", lane: PlaceLane, category: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (view === "places") {
    url.searchParams.set("view", "places");
    url.searchParams.set("lane", lane);
    if (category) url.searchParams.set("category", category);
    else url.searchParams.delete("category");
  } else {
    url.searchParams.delete("view");
    url.searchParams.delete("lane");
    url.searchParams.delete("category");
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

export default function CommunityEventsMapSearch({
  events,
  initialView = "events",
  initialLane = "eat",
  initialCategory = "",
}: {
  events: CommunityEventWithPartner[];
  initialView?: "events" | "places";
  initialLane?: PlaceLane;
  initialCategory?: PlaceCategoryId | "";
}) {
  const [view, setView] = useState<"events" | "places">(initialView);
  const [lane, setLane] = useState<PlaceLane>(initialLane);
  const [placeCategory, setPlaceCategory] = useState<PlaceCategoryId | "">(
    initialCategory,
  );
  const [highlyFriendly, setHighlyFriendly] = useState(false);
  const [dogsIndoors, setDogsIndoors] = useState(false);
  const [outdoorPatio, setOutdoorPatio] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [places, setPlaces] = useState<PetFriendlyPlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [placesErrorCode, setPlacesErrorCode] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [nearbyChips, setNearbyChips] = useState<MetroChip[]>(defaultMetroChips());
  const [locationReady, setLocationReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [deviceCenter, setDeviceCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  async function locateFromDevice() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationReady(true);
      return false;
    }

    setLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 10 * 60 * 1000,
        });
      });
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const response = await fetch(
        `/api/community/locate?lat=${encodeURIComponent(String(latitude))}&lng=${encodeURIComponent(String(longitude))}`,
      );
      const payload = (await response.json()) as {
        city?: string;
        county?: string;
        state?: string;
        nearby?: MetroChip[];
      };
      const next = {
        ...EMPTY_FILTERS,
        county: payload.county || "",
        city: payload.city || "",
        state: payload.state || "",
      };
      setDraft(next);
      setFilters(next);
      setDeviceCenter({ latitude, longitude });
      setNearbyChips(
        Array.isArray(payload.nearby) && payload.nearby.length
          ? payload.nearby
          : nearbyMetroChips({
              latitude,
              longitude,
              city: next.city,
              county: next.county,
              state: next.state,
            }),
      );
      saveCommunityLocationPreference({
        county: next.county,
        city: next.city,
        state: next.state,
        latitude,
        longitude,
        source: "device",
      });
      return true;
    } catch {
      setNearbyChips(defaultMetroChips());
      return false;
    } finally {
      setLocating(false);
      setLocationReady(true);
    }
  }

  useEffect(() => {
    const preference = readCommunityLocationPreference();
    if (preference.county || preference.city || preference.state) {
      const next = {
        ...EMPTY_FILTERS,
        county: preference.county || "",
        city: preference.city || "",
        state: preference.state || "",
      };
      setDraft(next);
      setFilters(next);
      if (
        Number.isFinite(preference.latitude) &&
        Number.isFinite(preference.longitude)
      ) {
        setDeviceCenter({
          latitude: preference.latitude as number,
          longitude: preference.longitude as number,
        });
      }
      setNearbyChips(
        nearbyMetroChips({
          latitude: preference.latitude,
          longitude: preference.longitude,
          city: preference.city,
          county: preference.county,
          state: preference.state,
        }),
      );
      setLocationReady(true);
      return;
    }

    void locateFromDevice();
  }, []);

  useEffect(() => {
    if (view !== "places" || !locationReady) return;
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.county) params.set("county", filters.county);
    if (filters.city) params.set("city", filters.city);
    if (filters.state) params.set("state", filters.state);
    if (deviceCenter) {
      params.set("lat", String(deviceCenter.latitude));
      params.set("lng", String(deviceCenter.longitude));
    }
    params.set("lane", lane);
    if (placeCategory) params.set("category", placeCategory);
    if (highlyFriendly) params.set("highlyFriendly", "true");
    if (dogsIndoors) params.set("dogsIndoors", "true");
    if (outdoorPatio) params.set("outdoor", "true");
    if (openNow) params.set("openNow", "true");

    setPlacesLoading(true);
    setPlacesError(null);
    setPlacesErrorCode(null);

    fetch(`/api/community/places?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          places?: PetFriendlyPlace[];
          error?: string;
          code?: string;
        };
        if (!response.ok) {
          const err = new Error(
            payload.error || "Place search failed.",
          ) as Error & { code?: string };
          err.code = payload.code;
          throw err;
        }
        setPlaces(payload.places || []);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setPlaces([]);
        const err = error as Error & { code?: string };
        setPlacesError(err?.message || "Place search failed.");
        setPlacesErrorCode(err?.code || "google_unavailable");
      })
      .finally(() => {
        if (!controller.signal.aborted) setPlacesLoading(false);
      });

    return () => controller.abort();
  }, [
    view,
    lane,
    placeCategory,
    highlyFriendly,
    dogsIndoors,
    outdoorPatio,
    openNow,
    filters.q,
    filters.county,
    filters.city,
    filters.state,
    locationReady,
    deviceCenter?.latitude,
    deviceCenter?.longitude,
  ]);

  const filtered = useMemo(() => {
    const unique = mergeUniqueCommunityEvents(
      events,
      [],
      Math.max(events.length, 1),
    );
    const matched = unique.filter((event) => {
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
      if (!eventMatchesDateRange(event, filters.dateFrom, filters.dateTo)) {
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
    () =>
      view === "places"
        ? places.map(placeToMapMarker)
        : filtered.map(eventToMapMarker),
    [view, places, filtered],
  );

  const mapCenter = useMemo<[number, number] | undefined>(() => {
    const source =
      view === "places"
        ? places.map((place) => ({
            latitude: place.latitude,
            longitude: place.longitude,
          }))
        : filtered;
    const withCoords = source.find(
      (item) =>
        Number.isFinite(Number(item.latitude)) &&
        Number.isFinite(Number(item.longitude)) &&
        Number(item.latitude) !== 0 &&
        Number(item.longitude) !== 0,
    );
    if (withCoords?.latitude != null && withCoords?.longitude != null) {
      return [Number(withCoords.latitude), Number(withCoords.longitude)];
    }
    return DEFAULT_CENTER;
  }, [view, places, filtered]);

  const activeFilterCount = [
    filters.q,
    filters.county,
    filters.city,
    filters.state,
    view === "events" ? filters.category : placeCategory,
    view === "events" ? filters.dateFrom : "",
    view === "events" ? filters.dateTo : "",
    view === "places" && highlyFriendly ? "1" : "",
    view === "places" && dogsIndoors ? "1" : "",
    view === "places" && outdoorPatio ? "1" : "",
    view === "places" && openNow ? "1" : "",
  ].filter(Boolean).length;

  function applySearch(next: Filters = draft) {
    const normalized = { ...next };
    if (
      normalized.dateFrom &&
      normalized.dateTo &&
      normalized.dateFrom > normalized.dateTo
    ) {
      // Swap if user picked an inverted range.
      const swap = normalized.dateFrom;
      normalized.dateFrom = normalized.dateTo;
      normalized.dateTo = swap;
      setDraft(normalized);
    }
    setFilters(normalized);
    if (normalized.county || normalized.city || normalized.state) {
      saveCommunityLocationPreference({
        county: normalized.county,
        city: normalized.city,
        state: normalized.state,
        source: "manual",
      });
    }
  }

  function clearFilters() {
    setDraft(EMPTY_FILTERS);
    setPlaceCategory("");
    setHighlyFriendly(false);
    setDogsIndoors(false);
    setOutdoorPatio(false);
    setOpenNow(false);
    applySearch(EMPTY_FILTERS);
  }

  function changeView(next: "events" | "places") {
    setView(next);
    setHighlightedId(null);
    syncCommunityView(next, lane, placeCategory);
  }

  function changeLane(next: PlaceLane, category: PlaceCategoryId | "" = "") {
    setView("places");
    setLane(next);
    setPlaceCategory(category);
    setHighlightedId(null);
    syncCommunityView("places", next, category);
  }

  function applyDatePreset(preset: "today" | "weekend" | "week") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let from = today;
    let to = today;

    if (preset === "weekend") {
      const day = today.getDay(); // 0 Sun … 6 Sat
      const daysUntilSaturday = (6 - day + 7) % 7;
      from = new Date(today);
      from.setDate(today.getDate() + daysUntilSaturday);
      to = new Date(from);
      to.setDate(from.getDate() + 1);
    } else if (preset === "week") {
      to = new Date(today);
      to.setDate(today.getDate() + 6);
    }

    const ymd = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const next = {
      ...draft,
      dateFrom: ymd(from),
      dateTo: ymd(to),
    };
    setDraft(next);
    applySearch(next);
  }

  return (
    <section className="pb-4">
      <div className="mx-auto max-w-[1500px] px-5 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <div className="mb-6 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Local pet life
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {view === "places"
              ? "Find places where pets are truly welcome"
              : "Find events near you"}
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-600 sm:text-base">
            {view === "places"
              ? "Same map as events — restaurants, stays, dog parks, and pet services, scored for how pet-friendly it really is."
              : "Search nearby pet friendly events — map on top on phones, side-by-side on desktop."}
          </p>
          <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
            {(
              [
                ["events", "Events"],
                ["places", "Pet-Friendly Places"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => changeView(id)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  view === id
                    ? "bg-emerald-700 text-white"
                    : "text-slate-700 hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:rounded-[28px] sm:p-6">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch(draft);
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
              {view === "events" ? (
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
              ) : null}

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
                  placeholder="Any U.S. city"
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

              {view === "events" ? (
              <>
              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-800">
                  From date
                </span>
                <input
                  type="date"
                  value={draft.dateFrom}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      dateFrom: e.target.value,
                    }))
                  }
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:text-sm"
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-800">
                  To date
                </span>
                <input
                  type="date"
                  value={draft.dateTo}
                  min={draft.dateFrom || undefined}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      dateTo: e.target.value,
                    }))
                  }
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:text-sm"
                />
              </label>
              </>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-semibold text-slate-800">
                  {view === "places" ? "Search places" : "Search events"}
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={draft.q}
                    onChange={(e) =>
                      setDraft((current) => ({ ...current, q: e.target.value }))
                    }
                    placeholder={
                      view === "places"
                        ? LANE_SEARCH_PLACEHOLDERS[lane]
                        : "Adoption, meetup, festival…"
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:text-sm"
                  />
                </div>
              </label>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:flex-none sm:px-6"
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
            </div>
          </form>

          {view === "places" ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {PLACE_LANES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => changeLane(item.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                      lane === item.id
                        ? "bg-emerald-700 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-500">
                {PLACE_LANES.find((item) => item.id === lane)?.hint}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeLane(lane, "")}
                  className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                    !placeCategory
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  All
                </button>
                {categoriesForLane(lane).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => changeLane(lane, item.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                      placeCategory === item.id
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ["highly", "Highly pet friendly", highlyFriendly, () => setHighlyFriendly((v) => !v)],
                    ["indoors", "Dogs indoors", dogsIndoors, () => setDogsIndoors((v) => !v)],
                    ["outdoor", "Outdoor patio", outdoorPatio, () => setOutdoorPatio((v) => !v)],
                    ["open", "Open now", openNow, () => setOpenNow((v) => !v)],
                  ] as const
                )
                  .filter(([id]) => {
                    if (lane === "services") return id === "open";
                    if (lane === "play") return id !== "indoors";
                    return true;
                  })
                  .map(([id, label, active, toggle]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={toggle}
                      className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                        active
                          ? "bg-emerald-700 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Dates
            </span>
            {(
              [
                ["today", "Today"],
                ["weekend", "This weekend"],
                ["week", "Next 7 days"],
              ] as const
            ).map(([preset, label]) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyDatePreset(preset)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                {label}
              </button>
            ))}
          </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void locateFromDevice();
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
            >
              <LocateFixed className="h-3.5 w-3.5" />
              {locating ? "Finding you…" : "Use my location"}
            </button>
            {nearbyChips.map((option) => {
              const active =
                (option.city &&
                  draft.city.toLowerCase() === option.city.toLowerCase() &&
                  (!option.state ||
                    draft.state.toLowerCase() === option.state.toLowerCase())) ||
                Boolean(
                  option.county &&
                    draft.county
                      .toLowerCase()
                      .includes(
                        option.county.replace(/ County$/i, "").toLowerCase(),
                      ) &&
                    (!option.state ||
                      draft.state.toLowerCase() === option.state.toLowerCase()),
                );
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    const next = {
                      ...draft,
                      county: option.county,
                      city: option.city,
                      state: option.state,
                    };
                    setDraft(next);
                    setDeviceCenter({
                      latitude: option.latitude,
                      longitude: option.longitude,
                    });
                    applySearch(next);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                    active
                      ? "bg-emerald-700 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
              {view === "places"
                ? `${placesLoading ? "Searching" : places.length} place${places.length === 1 ? "" : "s"} nearby`
                : `${filtered.length} event${filtered.length === 1 ? "" : "s"} nearby`}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
              {activeFilterCount} active filter
              {activeFilterCount === 1 ? "" : "s"}
            </span>
            {(view === "events" && (filters.dateFrom || filters.dateTo)) && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
                {[
                  filters.dateFrom
                    ? new Date(`${filters.dateFrom}T12:00:00`).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" },
                      )
                    : "Any",
                  filters.dateTo
                    ? new Date(`${filters.dateTo}T12:00:00`).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" },
                      )
                    : "Any",
                ].join(" – ")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
          <div className="order-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)] xl:order-2 xl:sticky xl:top-28 xl:self-start">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {view === "places"
                  ? "Places are closer with SitGuru"
                  : "Events are closer with SitGuru"}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {view === "places"
                  ? "Pet-friendly restaurants, stays, parks, and pet services — scored for the pet experience."
                  : "Pet friendly gatherings near you — partners first, community next."}
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
                  highlightedId
                    ? view === "places"
                      ? highlightedId
                      : `event:${highlightedId}`
                    : undefined
                }
                footerTitle={
                  view === "places"
                    ? "Take your best friend with you."
                    : "Your next pet hang is already on the map."
                }
                footerBadge={
                  view === "places" ? "Truly pet welcome" : "Pull up — paws welcome"
                }
              />
            </div>
          </div>

          <div className="order-2 space-y-4 sm:space-y-5 xl:order-1">
            <div className="flex items-center justify-between gap-2 xl:hidden">
              <p className="text-sm font-black text-slate-800">
                {view === "places"
                  ? `${places.length} place${places.length === 1 ? "" : "s"}`
                  : `${filtered.length} event${filtered.length === 1 ? "" : "s"}`}
              </p>
              <Link
                href={view === "places" ? "/partners/apply?intent=pet_friendly_place&source=community_places" : "/events/host"}
                className="text-sm font-black text-emerald-800"
              >
                {view === "places" ? "Claim a place" : "Host an event"}
              </Link>
            </div>
            {view === "places" ? (
              !locationReady || locating || placesLoading ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-7">
                  <h3 className="text-xl font-bold text-slate-900">
                    {!locationReady || locating
                      ? "Finding your city…"
                      : "Finding pet-friendly places…"}
                  </h3>
                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    {!locationReady || locating
                      ? "SitGuru works nationwide — we’ll search near you, or pick any U.S. city."
                      : "Checking Google listings, then scoring how welcome pets really are."}
                  </p>
                </div>
              ) : placesError ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-7">
                  <h3 className="text-xl font-bold text-slate-900">
                    {placesErrorCode === "missing_key"
                      ? "Places search is not configured"
                      : "Could not load pet-friendly places"}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                    {placesError}
                  </p>
                </div>
              ) : places.length === 0 ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-7">
                  <h3 className="text-xl font-bold text-slate-900">
                    {!filters.city && !filters.county && !filters.state
                      ? "Pick a city to see places nearby"
                      : "No places match just yet"}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                    {!filters.city && !filters.county && !filters.state
                      ? "Tap Use my location, choose a metro, or type any U.S. city and state."
                      : "Try another county, city, or lane — Eat & Drink, Stay, Play, or Pet Services."}
                  </p>
                </div>
              ) : (
                places.map((place) => (
                  <PlaceListCard
                    key={place.id}
                    place={place}
                    highlighted={highlightedId === place.id}
                    onHighlight={() => setHighlightedId(place.id)}
                    onSwitchLane={changeLane}
                  />
                ))
              )
            ) : filtered.length === 0 ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
                <h3 className="text-xl font-bold text-slate-900">
                  No events match just yet
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  Try another county, city, category, or date range. Partner Events and local
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
