"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Star } from "lucide-react";
import HomepageEventsSection from "@/components/community/HomepageEventsSection";
import { saveCommunityEventFeaturedSettings } from "@/app/admin/community/events/actions";
import {
  formatEventDateRange,
  formatEventLocationInline,
  getEventHeroImage,
} from "@/lib/community/format";
import type { CommunityEventWithPartner } from "@/lib/community/types";

function toDatetimeLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminFeaturedEventsManager({
  events,
  previewUpcoming,
}: {
  events: CommunityEventWithPartner[];
  previewUpcoming: CommunityEventWithPartner[];
}) {
  const [rows, setRows] = useState(events);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [previewCity, setPreviewCity] = useState("");
  const [previewState, setPreviewState] = useState("");

  const previewFeatured = useMemo(() => {
    const filtered = rows.filter((event) => {
      if (event.featured_status === "none") return false;
      if (!previewCity && !previewState) return true;
      if (!event.featured_market_city && !event.featured_market_state) return true;
      return (
        event.featured_market_city?.toLowerCase() === previewCity.toLowerCase() &&
        event.featured_market_state?.toLowerCase() === previewState.toLowerCase()
      );
    });

    return filtered.sort((a, b) => b.featured_priority - a.featured_priority)[0] || null;
  }, [previewCity, previewState, rows]);

  function updateRow(eventId: string, patch: Partial<CommunityEventWithPartner>) {
    setRows((current) =>
      current.map((row) => (row.id === eventId ? { ...row, ...patch } : row)),
    );
  }

  function movePriority(eventId: string, direction: "up" | "down") {
    setRows((current) => {
      const sorted = [...current].sort((a, b) => b.featured_priority - a.featured_priority);
      const index = sorted.findIndex((row) => row.id === eventId);
      if (index < 0) return current;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= sorted.length) return current;

      const currentPriority = sorted[index].featured_priority;
      const swapPriority = sorted[swapIndex].featured_priority;

      return current.map((row) => {
        if (row.id === sorted[index].id) {
          return { ...row, featured_priority: swapPriority };
        }
        if (row.id === sorted[swapIndex].id) {
          return { ...row, featured_priority: currentPriority };
        }
        return row;
      });
    });
  }

  function saveRow(event: CommunityEventWithPartner) {
    startTransition(async () => {
      const result = await saveCommunityEventFeaturedSettings({
        eventId: event.id,
        featuredStatus: event.featured_status,
        featuredPriority: event.featured_priority,
        featuredStartAt: event.featured_start_at,
        featuredEndAt: event.featured_end_at,
        featuredMarketCity: event.featured_market_city,
        featuredMarketState: event.featured_market_state,
      });

      if (!result.ok) {
        setMessage(result.error || "Save failed");
        return;
      }

      updateRow(event.id, result.event);
      setMessage(`Saved featured settings for ${event.title}`);
    });
  }

  const publishedPool = rows.length
    ? rows
    : events;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Preview market
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={previewCity}
                onChange={(event) => setPreviewCity(event.target.value)}
                placeholder="Preview city"
                className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
              />
              <input
                value={previewState}
                onChange={(event) => setPreviewState(event.target.value)}
                placeholder="Preview state"
                className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
              />
            </div>
          </div>

          {publishedPool.map((event) => {
            const imageUrl = getEventHeroImage(event);
            const timing = formatEventDateRange(event.start_at, event.end_at, event.timezone);

            return (
              <article
                key={event.id}
                className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-emerald-50 sm:block">
                    {imageUrl ? (
                      <Image src={imageUrl} alt={event.title} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-black text-slate-950">{event.title}</h2>
                        <p className="text-sm font-semibold text-slate-600">
                          {timing.dateLabel} • {formatEventLocationInline(event)}
                        </p>
                      </div>
                      {event.featured_status !== "none" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-900">
                          <Star className="h-3.5 w-3.5" />
                          Featured
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <select
                        value={event.featured_status}
                        onChange={(e) =>
                          updateRow(event.id, { featured_status: e.target.value })
                        }
                        className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                      >
                        <option value="none">Not featured</option>
                        <option value="homepage">Homepage</option>
                        <option value="community">Community hub</option>
                        <option value="market">Market</option>
                      </select>
                      <input
                        type="number"
                        value={event.featured_priority}
                        onChange={(e) =>
                          updateRow(event.id, {
                            featured_priority: Number(e.target.value) || 0,
                          })
                        }
                        className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                        placeholder="Priority"
                      />
                      <input
                        type="datetime-local"
                        value={toDatetimeLocalInput(event.featured_start_at)}
                        onChange={(e) =>
                          updateRow(event.id, {
                            featured_start_at: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : null,
                          })
                        }
                        className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                      />
                      <input
                        type="datetime-local"
                        value={toDatetimeLocalInput(event.featured_end_at)}
                        onChange={(e) =>
                          updateRow(event.id, {
                            featured_end_at: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : null,
                          })
                        }
                        className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                      />
                      <input
                        value={event.featured_market_city || ""}
                        onChange={(e) =>
                          updateRow(event.id, { featured_market_city: e.target.value || null })
                        }
                        placeholder="Market city"
                        className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                      />
                      <input
                        value={event.featured_market_state || ""}
                        onChange={(e) =>
                          updateRow(event.id, { featured_market_state: e.target.value || null })
                        }
                        placeholder="Market state"
                        className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => movePriority(event.id, "up")}
                        className="inline-flex min-h-10 items-center gap-1 rounded-2xl border border-slate-200 px-3 text-sm font-black"
                      >
                        <ArrowUp className="h-4 w-4" />
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => movePriority(event.id, "down")}
                        className="inline-flex min-h-10 items-center gap-1 rounded-2xl border border-slate-200 px-3 text-sm font-black"
                      >
                        <ArrowDown className="h-4 w-4" />
                        Down
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => saveRow(event)}
                        className="inline-flex min-h-10 items-center rounded-2xl bg-emerald-700 px-4 text-sm font-black text-white disabled:opacity-60"
                      >
                        Save
                      </button>
                      <Link
                        href={`/admin/community/events/${event.id}/edit`}
                        className="inline-flex min-h-10 items-center rounded-2xl border border-slate-200 px-4 text-sm font-black"
                      >
                        Edit event
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50/40 p-4">
            <p className="text-sm font-black text-emerald-900">Homepage banner preview</p>
            <p className="mt-1 text-xs font-semibold text-emerald-800">
              Shows how the &quot;More Upcoming Events&quot; carousel renders on the homepage and
              community page with current featured settings.
            </p>
          </div>
          <div className="-mx-4 overflow-hidden rounded-[2rem] border border-slate-200 sm:mx-0">
            <HomepageEventsSection
              featured={previewFeatured}
              upcoming={previewUpcoming}
              locationLabel={
                previewCity && previewState ? `${previewCity}, ${previewState}` : undefined
              }
              adminHref="/admin/community/events/featured"
            />
          </div>
        </div>
      </div>

      {message ? <p className="text-sm font-black text-emerald-800">{message}</p> : null}
    </div>
  );
}
