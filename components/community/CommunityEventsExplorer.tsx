"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EventCard from "@/components/community/EventCard";
import {
  eventMatchesCounty,
  formatEventCountyState,
  getEventCountyLabel,
} from "@/lib/community/format";
import {
  readCommunityLocationPreference,
  saveCommunityLocationPreference,
} from "@/lib/community/location-preference";
import CommunityCountySuggestInput from "@/components/community/CommunityCountySuggestInput";
import { COMMUNITY_EVENT_CATEGORIES } from "@/lib/community/types";
import type { CommunityEventWithPartner } from "@/lib/community/types";

type Filters = {
  q: string;
  county: string;
  city: string;
  state: string;
  category: string;
  petFriendly: boolean;
  isFree?: boolean;
};

export default function CommunityEventsExplorer({
  events,
  initialFilters,
}: {
  events: CommunityEventWithPartner[];
  initialFilters: Filters;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [countyDraft, setCountyDraft] = useState(initialFilters.county);
  const [hydratedLocation, setHydratedLocation] = useState(false);

  useEffect(() => {
    setCountyDraft(filters.county);
  }, [filters.county]);

  useEffect(() => {
    if (hydratedLocation) return;
    if (initialFilters.county || initialFilters.city || initialFilters.state) {
      setHydratedLocation(true);
      return;
    }

    const preference = readCommunityLocationPreference();
    if (preference.county || preference.city || preference.state) {
      const next = {
        ...initialFilters,
        county: preference.county || "",
        city: preference.city || "",
        state: preference.state || "",
      };
      setFilters(next);
      setCountyDraft(next.county);
      const params = new URLSearchParams();
      if (next.county) params.set("county", next.county);
      if (next.city) params.set("city", next.city);
      if (next.state) params.set("state", next.state);
      router.replace(`/community/events?${params.toString()}`);
    }
    setHydratedLocation(true);
  }, [hydratedLocation, initialFilters, router]);

  const filtered = useMemo(() => {
    const matched = events.filter((event) => {
      if (filters.category && !(event.categories || []).includes(filters.category)) {
        return false;
      }
      if (filters.petFriendly && !event.pet_friendly) return false;
      if (typeof filters.isFree === "boolean" && event.is_free !== filters.isFree) {
        return false;
      }
      if (filters.county && !eventMatchesCounty(event, filters.county)) {
        return false;
      }
      if (filters.city && !event.city?.toLowerCase().includes(filters.city.toLowerCase())) {
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

    return [...matched].sort((a, b) => {
      const countyA = getEventCountyLabel(a) || "Other";
      const countyB = getEventCountyLabel(b) || "Other";
      const byCounty = countyA.localeCompare(countyB);
      if (byCounty !== 0) return byCounty;
      return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
    });
  }, [events, filters]);

  const groupedByCounty = useMemo(() => {
    const groups: { county: string; events: CommunityEventWithPartner[] }[] = [];
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

  function apply(next: Filters) {
    setFilters(next);
    if (next.county || next.city || next.state) {
      saveCommunityLocationPreference({
        county: next.county || undefined,
        city: next.city || undefined,
        state: next.state || undefined,
        source: "manual",
      });
    }
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.county) params.set("county", next.county);
    if (next.city) params.set("city", next.city);
    if (next.state) params.set("state", next.state);
    if (next.category) params.set("category", next.category);
    if (next.petFriendly) params.set("petFriendly", "true");
    if (typeof next.isFree === "boolean") params.set("isFree", String(next.isFree));
    router.push(`/community/events?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {(filters.county || filters.city || filters.state) && (
        <p className="text-sm font-semibold text-slate-600">
          Showing events near{" "}
          <span className="font-black text-slate-900">
            {[filters.county, filters.city, filters.state]
              .filter(Boolean)
              .join(", ")}
          </span>
        </p>
      )}

      <div className="sticky top-0 z-10 -mx-4 border-b border-slate-100 bg-[#f8fcfd]/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-7">
        <input
          defaultValue={filters.q}
          onBlur={(event) => apply({ ...filters, q: event.target.value })}
          placeholder="Search events"
          className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold xl:col-span-2"
        />
        <CommunityCountySuggestInput
          value={countyDraft}
          stateValue={filters.state}
          placeholder="County"
          className="min-h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          onChange={setCountyDraft}
          onCommit={(county) => {
            if (county !== filters.county) {
              apply({ ...filters, county });
            }
          }}
          onSelect={(hit) =>
            apply({
              ...filters,
              county: hit.county_name,
              state: hit.state,
              city: hit.city || filters.city,
            })
          }
        />
        <input
          key={`city-${filters.city}`}
          defaultValue={filters.city}
          onBlur={(event) => apply({ ...filters, city: event.target.value })}
          placeholder="City"
          className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold"
        />
        <input
          key={`state-${filters.state}`}
          defaultValue={filters.state}
          onBlur={(event) => apply({ ...filters, state: event.target.value })}
          placeholder="State"
          className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold"
        />
        <select
          defaultValue={filters.category}
          onChange={(event) => apply({ ...filters, category: event.target.value })}
          className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
        >
          <option value="">All categories</option>
          {COMMUNITY_EVENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          defaultValue={
            typeof filters.isFree === "boolean" ? String(filters.isFree) : "any"
          }
          onChange={(event) =>
            apply({
              ...filters,
              isFree:
                event.target.value === "any" ? undefined : event.target.value === "true",
            })
          }
          className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
        >
          <option value="any">Free or paid</option>
          <option value="true">Free only</option>
          <option value="false">Ticketed</option>
        </select>
        </div>
      </div>

      <label className="inline-flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800">
        <input
          type="checkbox"
          defaultChecked={filters.petFriendly}
          onChange={(event) => apply({ ...filters, petFriendly: event.target.checked })}
        />
        Pet-friendly only
      </label>

      {filtered.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-black text-slate-900">No upcoming events match your filters</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Try another county or city — partners add new events regularly.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByCounty.map((group) => (
            <section key={group.county} className="space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/90 px-4 py-2.5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
                  {group.county}
                </p>
                <p className="text-sm font-semibold text-emerald-900/80">
                  {group.events.length} event
                  {group.events.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {group.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
