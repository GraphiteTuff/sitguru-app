"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ImageIcon,
  Link2,
  Mail,
  MessageCircle,
  X,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics/track";
import { formatEventDateRange } from "@/lib/community/format";
import {
  buildEventShareBody,
  buildEventShareCaptionSocial,
  buildEventShareHref,
  type SharePlatform,
} from "@/lib/community/share";
import { getPublicEventPath, getPublicEventUrl } from "@/lib/community/slug";
import {
  downloadEventGraphic,
  getEventSocialAssets,
} from "@/lib/community/social-assets";

export type EventShareDrawerEvent = {
  id?: string;
  title: string;
  slug: string;
  /** Optional SitGuru path override (e.g. /events for discoveries). */
  sharePath?: string;
  startAt: string;
  endAt?: string | null;
  timezone?: string | null;
  city?: string | null;
  state?: string | null;
  shortDescription?: string | null;
  partnerName?: string | null;
  venueName?: string | null;
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

/** Mockup-aligned row: Messages · Facebook · Instagram · X · Email */
const SHARE_ACTIONS: Array<{
  id: SharePlatform | "instagram";
  label: string;
  tone: string;
}> = [
  { id: "sms", label: "Messages", tone: "bg-[#34C759] text-white" },
  { id: "facebook", label: "Facebook", tone: "bg-[#1877F2] text-white" },
  {
    id: "instagram",
    label: "Instagram",
    tone: "bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white",
  },
  { id: "x", label: "X", tone: "bg-slate-950 text-white" },
  { id: "email", label: "Email", tone: "bg-[#0A84FF] text-white" },
];

function displayShareHost(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

function PlatformGlyph({ id }: { id: SharePlatform | "instagram" }) {
  if (id === "email") return <Mail className="h-5 w-5" strokeWidth={2.25} />;
  if (id === "x") {
    return (
      <span className="text-[15px] font-black leading-none tracking-tight">𝕏</span>
    );
  }
  if (id === "facebook") {
    return <span className="text-[18px] font-black leading-none">f</span>;
  }
  if (id === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <rect
          x="3.5"
          y="3.5"
          width="17"
          height="17"
          rx="5"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  return <MessageCircle className="h-5 w-5" strokeWidth={2.25} />;
}

export default function EventShareDrawer({
  event,
  open,
  onClose,
  source = "community_event_share_drawer",
}: EventShareDrawerProps) {
  const [copied, setCopied] = useState(false);
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
      buildEventShareCaptionSocial(
        {
          title: event.title,
          start_at: event.startAt,
          end_at: event.endAt || null,
          timezone: event.timezone || null,
          city: event.city || null,
          state: event.state || null,
          short_description: event.shortDescription || null,
          venue_name: event.venueName || null,
        },
        event.partnerName,
      ),
    );
  }, [event]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !event) return null;

  const current = event;
  const square = assets.find((asset) => asset.id === "square") || assets[0];
  const shareBody = buildEventShareBody(caption, url);

  function trackShare(channel: string) {
    void trackEvent({
      eventName: "event_share",
      eventType: "community",
      source,
      metadata: { slug: current.slug, channel, eventId: current.id },
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      void trackEvent({
        eventName: "event_link_copy",
        eventType: "community",
        source,
        metadata: { slug: current.slug, eventId: current.id },
      });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  /**
   * Messages: prefer OS share (one payload: text + url).
   * Fallback sms: body is caption+url once — never append url twice.
   */
  async function shareViaMessages() {
    trackShare("sms");
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${current.title} | SitGuru Pet Events`,
          text: caption,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // fall through to sms:
      }
    }
    window.location.assign(buildEventShareHref("sms", url, caption));
  }

  async function shareViaPlatform(platform: SharePlatform) {
    trackShare(platform);
    const href = buildEventShareHref(platform, url, caption);

    // Facebook often ignores quote — copy SitGuru caption so it can paste into the post
    if (platform === "facebook") {
      try {
        await navigator.clipboard.writeText(shareBody);
        setHint("Caption copied — paste into your Facebook post");
        window.setTimeout(() => setHint(""), 3200);
      } catch {
        // continue to open sharer
      }
    }

    if (platform === "email" || platform === "sms") {
      window.location.assign(href);
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async function prepareInstagramShare() {
    trackShare("instagram");
    const story = assets.find((asset) => asset.id === "story") || assets[0];
    if (story?.url) {
      try {
        await downloadEventGraphic(story.url, `${current.slug}-instagram.png`);
      } catch {
        // continue with caption copy
      }
    }

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${current.title} | SitGuru Pet Events`,
          text: caption,
          url,
        });
        setHint("Shared — paste into Instagram if needed");
        window.setTimeout(() => setHint(""), 2800);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareBody);
    } catch {
      // ignore
    }
    setHint("Caption + SitGuru link copied — open Instagram to paste");
    window.setTimeout(() => setHint(""), 2800);
  }

  async function savePrimaryGraphic() {
    if (!square?.url) return;
    try {
      await downloadEventGraphic(square.url, `${current.slug}-share.png`);
      setHint("Graphic saved — ready to post");
      window.setTimeout(() => setHint(""), 2200);
      trackShare("save_graphic");
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
        className="absolute inset-0 bg-slate-950/45"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sitguru-share-title"
        className="relative z-[81] w-full max-w-[420px] overflow-hidden rounded-t-[1.5rem] bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.18)] sm:rounded-[1.5rem] sm:shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-5">
          <div className="min-w-0 pr-2">
            <h2
              id="sitguru-share-title"
              className="truncate text-[1.35rem] font-black leading-tight tracking-tight text-slate-950"
            >
              Share &ldquo;{event.title}&rdquo;
            </h2>
            <p className="mt-1 text-[15px] font-medium text-slate-500">
              Help pet parents discover this event!
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share panel"
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 pb-4 pt-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex gap-3 p-3.5">
              <div className="relative h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-xl bg-slate-100">
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
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/75 px-1 py-1 text-center text-[9px] font-black uppercase tracking-wide text-white">
                    {timing.timeLabel || timing.compactDate}
                  </div>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-4 whitespace-pre-line text-[13px] font-semibold leading-snug text-slate-800">
                  {caption}
                </p>
                <p
                  className="mt-2 truncate text-[12px] font-bold"
                  style={{ color: "#E85D04" }}
                >
                  {displayShareHost(url)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-start justify-between gap-1 px-0.5 sm:px-2">
            {SHARE_ACTIONS.map((action) => {
              const commonClass =
                "flex w-[4.25rem] flex-col items-center gap-1.5 sm:w-[4.5rem]";
              const iconClass = `grid h-[3.25rem] w-[3.25rem] place-items-center rounded-full shadow-sm ${action.tone}`;

              if (action.id === "instagram") {
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => void prepareInstagramShare()}
                    className={commonClass}
                  >
                    <span className={iconClass}>
                      <PlatformGlyph id={action.id} />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700">
                      {action.label}
                    </span>
                  </button>
                );
              }

              if (action.id === "sms") {
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => void shareViaMessages()}
                    className={commonClass}
                  >
                    <span className={iconClass}>
                      <PlatformGlyph id={action.id} />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700">
                      {action.label}
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => void shareViaPlatform(action.id as SharePlatform)}
                  className={commonClass}
                >
                  <span className={iconClass}>
                    <PlatformGlyph id={action.id} />
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>

          {hint ? (
            <p className="mt-3 text-center text-xs font-semibold text-[#0D5C3A]">
              {hint}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            {copied ? (
              <Check className="h-4 w-4 text-[#0D5C3A]" strokeWidth={2.5} />
            ) : (
              <Link2 className="h-4 w-4 text-slate-600" strokeWidth={2.25} />
            )}
            {copied ? "Copied" : "Copy Link"}
          </button>
          <button
            type="button"
            onClick={() => void savePrimaryGraphic()}
            disabled={!square?.url}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImageIcon className="h-4 w-4 text-slate-600" strokeWidth={2.25} />
            Save Graphic
          </button>
        </div>
      </div>
    </div>
  );
}
