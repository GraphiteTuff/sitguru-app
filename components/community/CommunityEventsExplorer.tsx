"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EventCard from "@/components/community/EventCard";
import {
  readCommunityLocationPreference,
  saveCommunityLocationPreference,
} from "@/lib/community/location-preference";
import { COMMUNITY_EVENT_CATEGORIES } from "@/lib/community/types";
import type { CommunityEventWithPartner } from "@/lib/community/types";

type Filters = {
  q: string;
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
  const [hydratedLocation, setHydratedLocation] = useState(false);

  useEffect(() => {
    if (hydratedLocation) return;
    if (initialFilters.city || initialFilters.state) {
      setHydratedLocation(true);
      return;
    }

    const preference = readCommunityLocationPreference();
    if (preference.city || preference.state) {
      const next = {
        ...initialFilters,
        city: preference.city || "",
        state: preference.state || "",
      };
      setFilters(next);
      const params = new URLSearchParams();
      if (next.city) params.set("city", next.city);
      if (next.state) params.set("state", next.state);
      router.replace(`/community/events?${params.toString()}`);
    }
    setHydratedLocation(true);
  }, [hydratedLocation, initialFilters, router]);

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (filters.category && !(event.categories || []).includes(filters.category)) {
        return false;
      }
      if (filters.petFriendly && !event.pet_friendly) return false;
      if (typeof filters.isFree === "boolean" && event.is_free !== filters.isFree) {
        return false;
      }
      if (filters.city && !event.city?.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }
      if (filters.state && !event.state?.toLowerCase().includes(filters.state.toLowerCase())) {
        return false;
      }
      if (filters.q) {
        const haystack = `${event.title} ${event.short_description || ""} ${event.venue_name || ""}`.toLowerCase();
        if (!haystack.includes(filters.q.toLowerCase())) return false;
      }
      return true;
    });
  }, [events, filters]);

  function apply(next: Filters) {
    setFilters(next);
    if (next.city || next.state) {
      saveCommunityLocationPreference({
        city: next.city || undefined,
        state: next.state || undefined,
        source: "manual",
      });
    }
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.city) params.set("city", next.city);
    if (next.state) params.set("state", next.state);
    if (next.category) params.set("category", next.category);
    if (next.petFriendly) params.set("petFriendly", "true");
    if (typeof next.isFree === "boolean") params.set("isFree", String(next.isFree));
    router.push(`/community/events?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {(filters.city || filters.state) && (
        <p className="text-sm font-semibold text-slate-600">
          Showing events near{" "}
          <span className="font-black text-slate-900">
            {[filters.city, filters.state].filter(Boolean).join(", ")}
          </span>
        </p>
      )}

      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
        <input
          defaultValue={filters.q}
          onBlur={(event) => apply({ ...filters, q: event.target.value })}
          placeholder="Search events"
          className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold xl:col-span-2"
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
            Try another city or check back soon — partners add new events regularly.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
