"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  Copy,
  Download,
  ExternalLink,
  Mail,
  Pencil,
  Share2,
} from "lucide-react";
import EventShareDrawer from "@/components/community/EventShareDrawer";
import {
  formatEventDateRange,
  formatEventLocationInline,
  getEventCardImage,
} from "@/lib/community/format";
import type { EventPromotionStats } from "@/lib/community/event-analytics";
import { buildEventShareCaptionSocial, buildEventShareHref } from "@/lib/community/share";
import { getPublicEventPath } from "@/lib/community/slug";
import {
  downloadEventGraphic,
  getEventSocialAssets,
} from "@/lib/community/social-assets";
import type { CommunityEventRow } from "@/lib/community/types";
import type { PartnerAccount } from "@/lib/community/partner-access";
import { trackEvent } from "@/lib/analytics/track";

type PartnerEventPromoteWorkspaceProps = {
  events: CommunityEventRow[];
  selectedEvent: CommunityEventRow;
  partner: PartnerAccount;
};

function statusBadge(status: string) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-800";
    case "draft":
      return "bg-slate-100 text-slate-700";
    case "cancelled":
      return "bg-red-50 text-red-800";
    default:
      return "bg-sky-50 text-sky-900";
  }
}

function MetricCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: number;
  delta: number | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value.toLocaleString()}</p>
      {delta !== null ? (
        <p className="mt-1 text-xs font-bold text-emerald-700">
          {delta >= 0 ? "+" : ""}
          {delta}% vs prior 7 days
        </p>
      ) : (
        <p className="mt-1 text-xs font-semibold text-slate-500">Since published</p>
      )}
    </div>
  );
}

export default function PartnerEventPromoteWorkspace({
  events,
  selectedEvent,
  partner,
}: PartnerEventPromoteWorkspaceProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [copied, setCopied] = useState<"link" | "caption" | null>(null);
  const [stats, setStats] = useState<EventPromotionStats>({
    views: 0,
    shares: 0,
    clicks: 0,
    viewsDelta: null,
    sharesDelta: null,
    clicksDelta: null,
  });

  const imageUrl = getEventCardImage(selectedEvent);
  const timing = formatEventDateRange(
    selectedEvent.start_at,
    selectedEvent.end_at,
    selectedEvent.timezone,
  );
  const publicPath = getPublicEventPath(selectedEvent.slug);
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${publicPath}`
      : `https://www.sitguru.com${publicPath}`;

  const assets = useMemo(
    () => getEventSocialAssets(selectedEvent, { preferBranded: true }),
    [selectedEvent],
  );

  useEffect(() => {
    setCaption(
      buildEventShareCaptionSocial(
        {
          title: selectedEvent.title,
          start_at: selectedEvent.start_at,
          end_at: selectedEvent.end_at,
          timezone: selectedEvent.timezone,
          city: selectedEvent.city,
          state: selectedEvent.state,
          short_description: selectedEvent.short_description,
          venue_name: selectedEvent.venue_name,
        },
        partner.business_name,
      ),
    );
  }, [selectedEvent, partner.business_name]);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch(
          `/api/partners/events/${selectedEvent.id}/analytics`,
        );
        const payload = await response.json();
        if (payload.stats) setStats(payload.stats);
      } catch {
        // analytics optional
      }
    }
    void loadStats();
  }, [selectedEvent.id]);

  async function copyValue(value: string, kind: "link" | "caption") {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    void trackEvent({
      eventName: kind === "caption" ? "event_share" : "event_link_copy",
      eventType: "community",
      source: "partner_promote",
      metadata: { slug: selectedEvent.slug, eventId: selectedEvent.id, kind },
    });
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
      <aside className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-950">Your Events</h2>
          <Link
            href="/partners/dashboard/community/events?tab=drafts"
            className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white"
          >
            + New
          </Link>
        </div>

        <div className="space-y-3">
          {events.map((event) => {
            const thumb = getEventCardImage(event);
            const active = event.id === selectedEvent.id;
            return (
              <Link
                key={event.id}
                href={`/partners/dashboard/community/events/${event.id}/promote`}
                className={`block overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                  active
                    ? "border-emerald-500 ring-2 ring-emerald-100"
                    : "border-slate-200 hover:border-emerald-200"
                }`}
              >
                <div className="flex gap-3 p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-emerald-50">
                    {thumb ? (
                      <Image src={thumb} alt={event.title} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">{event.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      {formatEventDateRange(event.start_at, event.end_at, event.timezone).compactDate}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${statusBadge(event.status)}`}
                    >
                      {event.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-emerald-50">
                {imageUrl ? (
                  <Image src={imageUrl} alt={selectedEvent.title} fill className="object-cover" />
                ) : null}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  Promote Your Event
                </p>
                <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
                  {selectedEvent.title}
                </h1>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {timing.dateLabel} • {timing.timeLabel}
                </p>
                <p className="text-sm font-semibold text-slate-600">
                  {formatEventLocationInline(selectedEvent)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedEvent.status === "published" ? (
                <Link
                  href={publicPath}
                  target="_blank"
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black"
                >
                  <ExternalLink className="h-4 w-4" />
                  Preview Event Page
                </Link>
              ) : null}
              <Link
                href={`/partners/dashboard/community/events/${selectedEvent.id}/edit`}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black"
              >
                <Pencil className="h-4 w-4" />
                Edit Event Details
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-black text-slate-900">Share to Social Media</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {[
              { id: "facebook", label: "Facebook", tone: "bg-[#1877F2] text-white" },
              { id: "email", label: "Email", tone: "bg-sky-600 text-white" },
              { id: "x", label: "X", tone: "bg-slate-900 text-white" },
            ].map((platform) => (
              <a
                key={platform.id}
                href={buildEventShareHref(
                  platform.id as "facebook" | "email" | "x",
                  publicUrl,
                  caption,
                )}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black ${platform.tone}`}
              >
                {platform.id === "facebook" ? <Share2 className="h-4 w-4" /> : null}
                {platform.id === "email" ? <Mail className="h-4 w-4" /> : null}
                {platform.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                const story = assets.find((asset) => asset.id === "story");
                if (story?.url) {
                  void downloadEventGraphic(
                    story.url,
                    `${selectedEvent.slug}-instagram.png`,
                  );
                }
                void copyValue(caption, "caption");
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-violet-600 px-4 text-sm font-black text-white"
            >
              <Download className="h-4 w-4" />
              Instagram
            </button>
            <button
              type="button"
              onClick={() => void copyValue(publicUrl, "link")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black"
            >
              {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy Link
            </button>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-700 text-sm font-black text-white"
            >
              Open Share Panel
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-black text-slate-900">Auto-Generated Assets</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {assets.map((asset) => (
              <div key={asset.id} className="overflow-hidden rounded-2xl border border-slate-200">
                <div className={`relative ${asset.aspectClass} bg-emerald-50`}>
                  {asset.url ? (
                    <Image
                      src={asset.url}
                      alt={asset.label}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="space-y-2 p-3">
                  <p className="font-black text-slate-900">{asset.label}</p>
                  <p className="text-xs font-semibold text-slate-500">{asset.dimensions}</p>
                  {asset.url ? (
                    <button
                      type="button"
                      onClick={() =>
                        void downloadEventGraphic(
                          asset.url!,
                          `${selectedEvent.slug}-${asset.id}.png`,
                        )
                      }
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-black"
                    >
                      <Download className="h-4 w-4" />
                      Download Graphic
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-black text-slate-900">Suggested Caption</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void copyValue(caption, "caption")}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white"
              >
                {copied === "caption" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Caption
              </button>
              {assets[0]?.url ? (
                <button
                  type="button"
                  onClick={() =>
                    void downloadEventGraphic(
                      assets[0].url!,
                      `${selectedEvent.slug}-square.png`,
                    )
                  }
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black"
                >
                  <Download className="h-4 w-4" />
                  Download Graphic
                </button>
              ) : null}
            </div>
          </div>
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={4}
            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium leading-relaxed text-slate-700"
          />
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-700" />
            <p className="text-sm font-black text-slate-900">Promotion Performance</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Views" value={stats.views} delta={stats.viewsDelta} />
            <MetricCard label="Shares" value={stats.shares} delta={stats.sharesDelta} />
            <MetricCard label="Clicks" value={stats.clicks} delta={stats.clicksDelta} />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Metrics are updated from SitGuru analytics events.
          </p>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black text-slate-900">Share Settings</p>
          <label className="mt-4 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Public Event URL
          </label>
          <div className="mt-2 flex gap-2">
            <input
              readOnly
              value={publicUrl}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold"
            />
            <button
              type="button"
              onClick={() => void copyValue(publicUrl, "link")}
              className="rounded-xl bg-emerald-700 px-3 text-xs font-black text-white"
            >
              Copy
            </button>
          </div>
          <p className="mt-4 text-xs font-semibold text-slate-600">
            Presented by {partner.business_name}
          </p>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm font-black text-emerald-900">Tip</p>
          <p className="mt-2 text-sm font-semibold text-emerald-950/80">
            Engaging visuals and a personal caption get more clicks. Share your event with local pet
            parents and Gurus.
          </p>
        </div>
      </aside>

      <EventShareDrawer
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        source="partner_promote_drawer"
        event={{
          id: selectedEvent.id,
          title: selectedEvent.title,
          slug: selectedEvent.slug,
          startAt: selectedEvent.start_at,
          endAt: selectedEvent.end_at,
          timezone: selectedEvent.timezone,
          city: selectedEvent.city,
          state: selectedEvent.state,
          shortDescription: selectedEvent.short_description,
          partnerName: partner.business_name,
          venueName: selectedEvent.venue_name,
          imageUrl: imageUrl || undefined,
          social_square_url: selectedEvent.social_square_url,
          social_story_url: selectedEvent.social_story_url,
          social_landscape_url: selectedEvent.social_landscape_url,
          image_hero_url: selectedEvent.image_hero_url,
          image_card_url: selectedEvent.image_card_url,
          image_original_url: selectedEvent.image_original_url,
        }}
      />
    </div>
  );
}
