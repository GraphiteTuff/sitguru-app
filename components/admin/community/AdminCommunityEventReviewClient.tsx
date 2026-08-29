"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarDays, MapPin, PawPrint } from "lucide-react";
import {
  moderateCommunityEvent,
  saveCommunityEventFeaturedSettings,
} from "@/app/admin/community/events/actions";
import EventSharePanel from "@/components/community/EventSharePanel";
import {
  formatEventDateRange,
  formatEventLocationInline,
  getEventHeroImage,
} from "@/lib/community/format";
import type { CommunityEventWithPartner } from "@/lib/community/types";
import { getPublicEventPath } from "@/lib/community/slug";

export default function AdminCommunityEventReviewClient({
  event,
}: {
  event: CommunityEventWithPartner;
}) {
  const router = useRouter();
  const [note, setNote] = useState(event.moderation_note || "");
  const [featuredStatus, setFeaturedStatus] = useState(event.featured_status || "none");
  const [featuredPriority, setFeaturedPriority] = useState(String(event.featured_priority || 0));
  const [featuredMarketCity, setFeaturedMarketCity] = useState(event.featured_market_city || "");
  const [featuredMarketState, setFeaturedMarketState] = useState(event.featured_market_state || "");
  const [featuredStartAt, setFeaturedStartAt] = useState(
    event.featured_start_at ? new Date(event.featured_start_at).toISOString().slice(0, 16) : "",
  );
  const [featuredEndAt, setFeaturedEndAt] = useState(
    event.featured_end_at ? new Date(event.featured_end_at).toISOString().slice(0, 16) : "",
  );
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const partnerName = event.partners?.business_name || "Partner";
  const imageUrl = getEventHeroImage(event);
  const timing = formatEventDateRange(event.start_at, event.end_at, event.timezone);

  function runAction(
    action:
      | "approve"
      | "publish"
      | "request_changes"
      | "reject"
      | "unpublish"
      | "cancel"
      | "archive",
  ) {
    startTransition(async () => {
      const result = await moderateCommunityEvent({
        eventId: event.id,
        action,
        note,
        featuredStatus,
        featuredPriority: Number(featuredPriority) || 0,
        featuredMarketCity: featuredMarketCity || null,
        featuredMarketState: featuredMarketState || null,
        featuredStartAt: featuredStartAt ? new Date(featuredStartAt).toISOString() : null,
        featuredEndAt: featuredEndAt ? new Date(featuredEndAt).toISOString() : null,
        publishSeries: true,
      });

      if (!result.ok) {
        setMessage(result.error || "Update failed");
        return;
      }

      setMessage(`Event ${action.replace(/_/g, " ")}`);
      router.refresh();
    });
  }

  function saveFeaturedOnly() {
    startTransition(async () => {
      const result = await saveCommunityEventFeaturedSettings({
        eventId: event.id,
        featuredStatus,
        featuredPriority: Number(featuredPriority) || 0,
        featuredStartAt: featuredStartAt ? new Date(featuredStartAt).toISOString() : null,
        featuredEndAt: featuredEndAt ? new Date(featuredEndAt).toISOString() : null,
        featuredMarketCity: featuredMarketCity || null,
        featuredMarketState: featuredMarketState || null,
      });

      if (!result.ok) {
        setMessage(result.error || "Featured save failed");
        return;
      }

      setMessage("Featured settings saved");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin/community/events" className="text-sm font-black text-emerald-800">
            ← Pet Events
          </Link>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{event.title}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-600">{partnerName}</p>
        </div>
        {event.status === "published" ? (
          <Link
            href={getPublicEventPath(event.slug)}
            className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 px-4 text-sm font-black"
          >
            View public page
          </Link>
        ) : null}
        <Link
          href={`/admin/community/events/${event.id}/edit`}
          className="inline-flex min-h-11 items-center rounded-2xl bg-emerald-700 px-4 text-sm font-black text-white"
        >
          Edit event
        </Link>
      </div>

      {message ? <p className="text-sm font-black text-emerald-800">{message}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[16/10] bg-emerald-50">
              {imageUrl ? (
                <Image src={imageUrl} alt={event.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <PawPrint className="h-12 w-12 text-emerald-700/30" />
                </div>
              )}
            </div>
            <div className="space-y-4 p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Event Preview
              </p>
              <h2 className="text-2xl font-black text-slate-950">{event.title}</h2>
              <div className="space-y-2 text-sm font-semibold text-slate-700">
                <p className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-emerald-700" />
                  {timing.dateLabel} • {timing.timeLabel}
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-700" />
                  {formatEventLocationInline(event)}
                </p>
              </div>
              {event.short_description ? (
                <p className="text-sm leading-relaxed text-slate-600">{event.short_description}</p>
              ) : null}
              {event.description ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                  {event.description}
                </div>
              ) : null}
            </div>
          </article>

          <EventSharePanel
            title={event.title}
            slug={event.slug}
            startAt={event.start_at}
            endAt={event.end_at}
            timezone={event.timezone}
            venueName={event.venue_name}
            city={event.city}
            state={event.state}
            shortDescription={event.short_description}
            partnerName={partnerName}
            source="admin_event_review"
          />
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Partner
            </p>
            <div className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              <p>{partnerName}</p>
              <p>{event.partners?.email}</p>
              <p>
                {[event.partners?.city, event.partners?.state].filter(Boolean).join(", ")}
              </p>
              {event.partners?.website ? (
                <a href={event.partners.website} className="font-black text-emerald-800">
                  {event.partners.website}
                </a>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Moderation
            </p>
            <p className="mt-2 text-sm font-semibold capitalize text-slate-700">
              Status: {event.status.replace(/_/g, " ")}
            </p>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder="Internal or partner-facing note (e.g. Please upload a clearer event photo.)"
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium"
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                ["Approve", "approve"],
                ["Publish", "publish"],
                ["Request Changes", "request_changes"],
                ["Reject", "reject"],
                ["Unpublish", "unpublish"],
                ["Cancel", "cancel"],
                ["Archive", "archive"],
              ].map(([label, action]) => (
                <button
                  key={action}
                  type="button"
                  disabled={pending}
                  onClick={() => runAction(action as never)}
                  className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black hover:bg-slate-50 disabled:opacity-60"
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Featured Controls
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-black text-slate-800">
                Feature on Homepage
                <select
                  value={featuredStatus}
                  onChange={(event) => setFeaturedStatus(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                >
                  <option value="none">No</option>
                  <option value="homepage">Yes — Homepage</option>
                  <option value="community">Community page</option>
                  <option value="market">Market-targeted</option>
                </select>
              </label>
              <label className="block text-sm font-black text-slate-800">
                Feature priority
                <input
                  type="number"
                  value={featuredPriority}
                  onChange={(event) => setFeaturedPriority(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="datetime-local"
                  value={featuredStartAt}
                  onChange={(event) => setFeaturedStartAt(event.target.value)}
                  className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                  aria-label="Featured start"
                />
                <input
                  type="datetime-local"
                  value={featuredEndAt}
                  onChange={(event) => setFeaturedEndAt(event.target.value)}
                  className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                  aria-label="Featured end"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={featuredMarketCity}
                  onChange={(event) => setFeaturedMarketCity(event.target.value)}
                  placeholder="Market city"
                  className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                />
                <input
                  value={featuredMarketState}
                  onChange={(event) => setFeaturedMarketState(event.target.value)}
                  placeholder="Market state"
                  className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={saveFeaturedOnly}
                  className="min-h-11 rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900 disabled:opacity-60"
                >
                  Save featured only
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runAction("publish")}
                  className="min-h-11 rounded-2xl bg-emerald-700 px-4 text-sm font-black text-white disabled:opacity-60"
                >
                  Publish + series sync
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                Publishing a series parent also publishes all child occurrences in reviewable
                states.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
