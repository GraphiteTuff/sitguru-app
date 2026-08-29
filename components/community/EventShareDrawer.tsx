"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
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
import { SITGURU_OFFICIAL_SOCIAL_LINKS } from "@/lib/chat/sitguru-social";

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
  id: SharePlatform;
  label: string;
  tone: string;
}> = [
  { id: "sms", label: "Messages", tone: "bg-emerald-600 text-white" },
  { id: "facebook", label: "Facebook", tone: "bg-[#1877F2] text-white" },
  { id: "x", label: "X", tone: "bg-slate-900 text-white" },
  { id: "email", label: "Email", tone: "bg-sky-600 text-white" },
];

function displayShareHost(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

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
      return `https://www.sitguru.com${
        event.sharePath.startsWith("/") ? event.sharePath : `/${event.sharePath}`
      }`;
    }
    return getPublicEventUrl(event.slug);
  }, [event]);

  const timing = useMemo(() => {
    if (!event) return null;
    return formatEventDateRange(
      event.startAt,
      event.endAt || null,
      event.timezone || null,
    );
  }, [event]);

  const previewImage = useMemo(() => {
    if (!event) return null;
    return (
      event.imageUrl ||
      event.image_card_url ||
      event.image_hero_url ||
      event.image_original_url ||
      null
    );
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
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !event) return null;

  const current = event;
  const square = assets.find((asset) => asset.id === "square") || assets[0];

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
    setHint("Graphic saved + caption copied — open Instagram to post");
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

  async function savePrimaryGraphic() {
    if (!square?.url) return;
    try {
      await downloadEventGraphic(square.url, `${current.slug}-share.png`);
      setHint("Graphic saved — ready to post");
      window.setTimeout(() => setHint(""), 2200);
      void trackEvent({
        eventName: "event_share",
        eventType: "community",
        source,
        metadata: {
          slug: current.slug,
          channel: "save_graphic",
          eventId: current.id,
        },
      });
    } catch {
      setHint("Could not download graphic — try Copy Link instead");
      window.setTimeout(() => setHint(""), 2200);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close share overlay"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sitguru-share-title"
        className="relative z-[81] flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-2xl sm:rounded-[1.75rem]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
              SitGuru Community
            </p>
            <h2
              id="sitguru-share-title"
              className="mt-1 truncate text-xl font-black text-slate-950"
            >
              Share &ldquo;{event.title}&rdquo;
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Help pet parents discover this event!
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share panel"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="flex gap-3 p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-emerald-50">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : null}
                {timing ? (
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-1.5 py-1 text-center text-[9px] font-black uppercase tracking-wide text-white">
                    {timing.compactDate}
                  </div>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-3 text-sm font-semibold leading-snug text-slate-800">
                  {caption}
                </p>
                <p className="mt-2 truncate text-xs font-black text-emerald-700">
                  {displayShareHost(url)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-black text-slate-900">Share to</p>
            <div className="mt-3 flex flex-wrap justify-between gap-2 sm:justify-start sm:gap-3">
              <button
                type="button"
                onClick={() => void nativeShare()}
                className="flex w-[64px] flex-col items-center gap-1.5 sm:w-[72px]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#0D5C3A] text-white sm:h-14 sm:w-14">
                  <Share2 className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-bold text-slate-700">Share</span>
              </button>
              <button
                type="button"
                onClick={() => void prepareInstagramShare()}
                className="flex w-[64px] flex-col items-center gap-1.5 sm:w-[72px]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-violet-600 text-white sm:h-14 sm:w-14">
                  <Download className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-bold text-slate-700">
                  Instagram
                </span>
              </button>
              {socialPlatforms.map((platform) => (
                <a
                  key={platform.id}
                  href={buildEventShareHref(platform.id, url, caption)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    void trackEvent({
                      eventName: "event_share",
                      eventType: "community",
                      source,
                      metadata: {
                        slug: event.slug,
                        channel: platform.id,
                        eventId: event.id,
                      },
                    })
                  }
                  className="flex w-[64px] flex-col items-center gap-1.5 sm:w-[72px]"
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-full sm:h-14 sm:w-14 ${platform.tone}`}
                  >
                    {platform.id === "email" ? (
                      <Mail className="h-5 w-5" />
                    ) : (
                      <MessageCircle className="h-5 w-5" />
                    )}
                  </span>
                  <span className="text-[11px] font-bold text-slate-700">
                    {platform.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void copyValue(url, "link")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-900"
            >
              {copied === "link" ? (
                <Check className="h-4 w-4 text-emerald-700" />
              ) : (
                <Link2 className="h-4 w-4 text-emerald-700" />
              )}
              {copied === "link" ? "Copied" : "Copy Link"}
            </button>
            <button
              type="button"
              onClick={() => void savePrimaryGraphic()}
              disabled={!square?.url}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-emerald-700" />
              Save Graphic
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-900">Suggested caption</p>
              <button
                type="button"
                onClick={() => void copyValue(caption, "caption")}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#0D5C3A] px-3 text-xs font-black text-white"
              >
                {copied === "caption" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied === "caption" ? "Copied" : "Copy"}
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium leading-relaxed text-slate-700"
            />
            {hint ? (
              <p className="mt-2 text-xs font-black text-emerald-800">{hint}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
              SitGuru Community
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-950/90">
              Tag{" "}
              <span className="font-black text-emerald-900">@SitGuruOfficial</span>{" "}
              so the pack can amplify your post.
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
                  className="inline-flex min-h-8 items-center rounded-full border border-emerald-200 bg-white px-3 text-[11px] font-black text-emerald-900"
                >
                  {platform.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
