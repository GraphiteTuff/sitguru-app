"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CalendarDays, MapPin, Search, Star } from "lucide-react";
import {
  formatEventDateRange,
  formatEventLocationInline,
} from "@/lib/community/format";
import { COMMUNITY_EVENT_CATEGORIES, COMMUNITY_EVENT_STATUSES } from "@/lib/community/types";
import type { CommunityEventWithPartner } from "@/lib/community/types";

type Filters = {
  q?: string;
  status?: string;
  partnerId?: string;
  city?: string;
  state?: string;
  category?: string;
};

export default function AdminCommunityEventsClient({
  events,
  initialFilters,
}: {
  events: CommunityEventWithPartner[];
  initialFilters: Filters;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (filters.status && filters.status !== "all" && event.status !== filters.status) {
        return false;
      }

      if (filters.category && !(event.categories || []).includes(filters.category)) {
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

  function applyFilters(next: Filters) {
    setFilters(next);
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    startTransition(() => {
      router.push(`/admin/community/events?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-6">
        <label className="lg:col-span-2">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Search
          </span>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              defaultValue={filters.q || ""}
              onBlur={(event) => applyFilters({ ...filters, q: event.target.value })}
              className="min-h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-3 text-sm font-semibold"
              placeholder="Event, venue, partner"
            />
          </div>
        </label>

        <label>
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Status
          </span>
          <select
            defaultValue={filters.status || "all"}
            onChange={(event) => applyFilters({ ...filters, status: event.target.value })}
            className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
          >
            <option value="all">All</option>
            {COMMUNITY_EVENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            City
          </span>
          <input
            defaultValue={filters.city || ""}
            onBlur={(event) => applyFilters({ ...filters, city: event.target.value })}
            className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
          />
        </label>

        <label>
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            State
          </span>
          <input
            defaultValue={filters.state || ""}
            onBlur={(event) => applyFilters({ ...filters, state: event.target.value })}
            className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
          />
        </label>

        <label>
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Category
          </span>
          <select
            defaultValue={filters.category || ""}
            onChange={(event) => applyFilters({ ...filters, category: event.target.value })}
            className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
          >
            <option value="">All</option>
            {COMMUNITY_EVENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      {pending ? (
        <p className="text-sm font-semibold text-slate-500">Updating filters…</p>
      ) : null}

      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Partner</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Manage</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((event) => {
              const timing = formatEventDateRange(event.start_at, event.end_at, event.timezone);
              return (
                <tr key={event.id} className="border-t border-slate-100">
                  <td className="px-4 py-4 font-black text-slate-950">{event.title}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {event.partners?.business_name || "Partner"}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {formatEventLocationInline(event)}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{timing.dateLabel}</td>
                  <td className="px-4 py-4 capitalize">{event.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-4">
                    {event.featured_status !== "none" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-900">
                        <Star className="h-3.5 w-3.5" />
                        Yes
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/community/events/${event.id}`}
                        className="font-black text-emerald-800 hover:underline"
                      >
                        Review
                      </Link>
                      <Link
                        href={`/admin/community/events/${event.id}/edit`}
                        className="font-black text-slate-700 hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {filtered.map((event) => {
          const timing = formatEventDateRange(event.start_at, event.end_at, event.timezone);
          return (
            <article
              key={event.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-950">{event.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {event.partners?.business_name}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black capitalize">
                  {event.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                <CalendarDays className="h-4 w-4" />
                {timing.dateLabel}
              </p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                <MapPin className="h-4 w-4" />
                {formatEventLocationInline(event)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/admin/community/events/${event.id}`}
                  className="inline-flex min-h-11 items-center rounded-2xl bg-emerald-700 px-4 text-sm font-black text-white"
                >
                  Review
                </Link>
                <Link
                  href={`/admin/community/events/${event.id}/edit`}
                  className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 px-4 text-sm font-black"
                >
                  Edit
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
