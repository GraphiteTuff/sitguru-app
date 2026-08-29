"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Heart,
  Link2,
  Mail,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics/track";
import { formatEventDateRange } from "@/lib/community/format";
import {
  buildEventShareCaptionSocial,
  buildEventShareHref,
  type SharePlatform,
} from "@/lib/community/share";
import { getPublicEventPath, getPublicEventUrl } from "@/lib/community/slug";
import {
  downloadEventGraphic,
  getEventSocialAssets,
} from "@/lib/community/social-assets";
import {
  SITGURU_OFFICIAL_SOCIAL_LINKS,
} from "@/lib/chat/sitguru-social";

export type EventShareDrawerEvent = {
  id?: string;
  title: string;
  slug: string;
  /** Optional SitGuru path override (e.g. /community for discoveries). */
  sharePath?: string;
  startAt: string;
  endAt?: string | null;
  timezone?: string | null;
  city?: string | null;
  state?: string | null;
  shortDescription?: string | null;
  partnerName?: string | null;
  imageUrl?: string | null;
  social_square_url?: string | null;
  social_story_url?: string | null;
  social_landscape_url?: string | null;
  image_hero_url?: string | null;
  image_card_url?: string | null;
  image_original_url?: string | null;
  preferBrandedGraphics?: boolean;
};

type EventShareDrawerProps = {
  event: EventShareDrawerEvent | null;
  open: boolean;
  onClose: () => void;
  source?: string;
};

const socialPlatforms: Array<{
  id: SharePlatform | "native";
  label: string;
  tone: string;
}> = [
  { id: "sms", label: "Messages", tone: "bg-emerald-600 text-white" },
  { id: "facebook", label: "Facebook", tone: "bg-[#1877F2] text-white" },
  { id: "email", label: "Email", tone: "bg-sky-600 text-white" },
  { id: "x", label: "X", tone: "bg-slate-900 text-white" },
];

export default function EventShareDrawer({
  event,
  open,
  onClose,
  source = "community_event_share_drawer",
}: EventShareDrawerProps) {
  const [copied, setCopied] = useState<"link" | "caption" | null>(null);
  const [caption, setCaption] = useState("");
  const [hint, setHint] = useState("");

  const url = useMemo(() => {
    if (!event) return "";
    const path = event.sharePath || getPublicEventPath(event.slug);
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
    }
    if (event.sharePath) {
      return `https://www.sitguru.com${event.sharePath.startsWith("/") ? event.sharePath : `/${event.sharePath}`}`;
    }
    return getPublicEventUrl(event.slug);
  }, [event]);

  const timing = useMemo(() => {
    if (!event) return null;
    return formatEventDateRange(event.startAt, event.endAt || null, event.timezone || null);
  }, [event]);

  const assets = useMemo(() => {
    if (!event) return [];
    return getEventSocialAssets(
      {
        slug: event.slug,
        social_square_url: event.social_square_url,
        social_story_url: event.social_story_url,
        social_landscape_url: event.social_landscape_url,
        image_hero_url: event.image_hero_url || event.imageUrl,
        image_card_url: event.image_card_url,
        image_original_url: event.image_original_url,
      },
      { preferBranded: event.preferBrandedGraphics !== false },
    );
  }, [event]);

  useEffect(() => {
    if (!event) return;
    setCaption(
      buildEventShareCaptionSocial({
        title: event.title,
        start_at: event.startAt,
        end_at: event.endAt || null,
        timezone: event.timezone || null,
        city: event.city || null,
        state: event.state || null,
        short_description: event.shortDescription || null,
      }),
    );
  }, [event]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !event) return null;

  const current = event;

  async function copyValue(value: string, kind: "link" | "caption") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      void trackEvent({
        eventName: kind === "caption" ? "event_share" : "event_link_copy",
        eventType: "community",
        source,
        metadata: { slug: current.slug, kind, eventId: current.id },
      });
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      // ignore
    }
  }

  async function prepareInstagramShare() {
    const story = assets.find((asset) => asset.id === "story") || assets[0];
    if (story?.url) {
      try {
        await downloadEventGraphic(story.url, `${current.slug}-instagram.png`);
      } catch {
        // continue with caption copy even if download fails
      }
    }
    await copyValue(caption, "caption");
    setHint("Instagram: graphic saved + caption copied — open Instagram to post");
    window.setTimeout(() => setHint(""), 2800);
    void trackEvent({
      eventName: "event_share",
      eventType: "community",
      source,
      metadata: { slug: current.slug, channel: "instagram", eventId: current.id },
    });
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: current.title, text: caption, url });
        void trackEvent({
          eventName: "event_share",
          eventType: "community",
          source,
          metadata: { slug: current.slug, channel: "native", eventId: current.id },
        });
        return;
      } catch {
        // cancelled
      }
    }
    await copyValue(url, "link");
  }

  const drawer = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Share Event
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
            {event.title}
          </h2>
          {timing ? (
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {timing.dateLabel} • {timing.timeLabel}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close share panel"
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-slate-600">
            Anyone with this link can view the event details.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs font-bold text-slate-800">
              {url}
            </div>
            <button
              type="button"
              onClick={() => void copyValue(url, "link")}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white"
            >
              {copied === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {copied === "link" ? "Copied" : "Copy Link"}
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-black text-slate-900">Share to</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void nativeShare()}
              className="flex w-[72px] flex-col items-center gap-2"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-700 text-white">
                <Share2 className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold text-slate-700">Share</span>
            </button>
            <button
              type="button"
              onClick={() => void prepareInstagramShare()}
              className="flex w-[72px] flex-col items-center gap-2"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-violet-600 text-white">
                <Download className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold text-slate-700">Instagram</span>
            </button>
            {socialPlatforms.map((platform) => (
              <a
                key={platform.id}
                href={buildEventShareHref(platform.id as SharePlatform, url, caption)}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  void trackEvent({
                    eventName: "event_share",
                    eventType: "community",
                    source,
                    metadata: { slug: event.slug, channel: platform.id, eventId: event.id },
                  })
                }
                className="flex w-[72px] flex-col items-center gap-2"
              >
                <span
                  className={`grid h-14 w-14 place-items-center rounded-full ${platform.tone}`}
                >
                  {platform.id === "email" ? (
                    <Mail className="h-5 w-5" />
                  ) : (
                    <MessageCircle className="h-5 w-5" />
                  )}
                </span>
                <span className="text-xs font-bold text-slate-700">{platform.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-black text-slate-900">Social graphics</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Download and post on social media.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
                  <p className="text-sm font-black text-slate-900">{asset.label}</p>
                  <p className="text-xs font-semibold text-slate-500">{asset.dimensions}</p>
                  {asset.url ? (
                    <button
                      type="button"
                      onClick={() =>
                        void downloadEventGraphic(
                          asset.url!,
                          `${event.slug}-${asset.id}.jpg`,
                        )
                      }
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-black text-slate-800"
                    >
                      <Download className="h-4 w-4" />
                      Save
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-slate-900">Suggested caption</p>
            <button
              type="button"
              onClick={() => void copyValue(caption, "caption")}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white"
            >
              {copied === "caption" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "caption" ? "Copied" : "Copy Caption"}
            </button>
          </div>
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={4}
            className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium leading-relaxed text-slate-700"
          />
          <p className="mt-2 text-right text-xs font-semibold text-slate-500">
            {caption.length} characters
          </p>
          {hint ? <p className="mt-2 text-xs font-black text-emerald-800">{hint}</p> : null}
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          <Heart className="mb-1 inline h-4 w-4 text-emerald-700" /> Thanks for helping spread the
          word. Sharing events helps build a stronger pet-loving community.
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm font-black text-slate-900">Share SitGuru too</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Tag <span className="font-black text-emerald-800">@SitGuruOfficial</span> so the pack
            can amplify your post.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SITGURU_OFFICIAL_SOCIAL_LINKS.map((platform) => (
              <a
                key={platform.id}
                href={platform.href}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  void trackEvent({
                    eventName: "event_share",
                    eventType: "community",
                    source,
                    metadata: {
                      slug: event.slug,
                      channel: `sitguru_${platform.id}`,
                      eventId: event.id,
                    },
                  })
                }
                className="inline-flex min-h-9 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
              >
                {platform.label}
              </a>
            ))}
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-500">
          Instagram does not allow direct browser posting — use Save Graphic + Copy Caption, then
          open Instagram.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Close share overlay"
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-[1px]"
      />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 right-0 z-[80] hidden w-full max-w-md border-l border-slate-200 shadow-2xl lg:block">
        {drawer}
      </aside>

      {/* Mobile bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[80] max-h-[92vh] overflow-hidden rounded-t-[2rem] border border-slate-200 shadow-2xl lg:hidden">
        {drawer}
      </div>
    </>
  );
}
