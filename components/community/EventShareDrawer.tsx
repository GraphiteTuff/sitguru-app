"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Link2,
  Mail,
  MessageCircle,
  PawPrint,
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
import {
  canUseNativeShare,
  shareEventNatively,
} from "@/lib/community/share-client";
import { getPublicEventPath, getPublicEventUrl } from "@/lib/community/slug";

export type EventShareDrawerEvent = {
  id?: string;
  title: string;
  slug: string;
  /** Optional SitGuru path override (e.g. /events for demo listings). */
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

const QUICK_ACTIONS: Array<{
  id: SharePlatform;
  label: string;
  tone: string;
}> = [
  { id: "sms", label: "Messages", tone: "bg-[#34C759] text-white" },
  { id: "facebook", label: "Facebook", tone: "bg-[#1877F2] text-white" },
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

function PlatformGlyph({ id }: { id: SharePlatform }) {
  if (id === "email") return <Mail className="h-5 w-5" strokeWidth={2.25} />;
  if (id === "x") {
    return (
      <span className="text-[15px] font-black leading-none tracking-tight">𝕏</span>
    );
  }
  if (id === "facebook") {
    return <span className="text-[18px] font-black leading-none">f</span>;
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
  const [canNativeShare, setCanNativeShare] = useState(false);

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

  const caption = useMemo(() => {
    if (!event) return "";
    return buildEventShareCaptionSocial(
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
    );
  }, [event]);

  useEffect(() => {
    setCanNativeShare(canUseNativeShare());
  }, []);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      return;
    }
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
  const placeLine = [
    timing?.compactDate,
    event.venueName || [event.city, event.state].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");

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

  async function shareNative() {
    const result = await shareEventNatively(current, source);
    if (result === "shared") {
      onClose();
      return;
    }
    if (result === "cancelled") return;
    await copyLink();
  }

  function shareViaPlatform(platform: SharePlatform) {
    trackShare(platform);
    const href = buildEventShareHref(
      platform,
      url,
      caption,
      current.title,
    );
    if (platform === "email" || platform === "sms") {
      window.location.assign(href);
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
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
        className="relative z-[81] w-full max-w-[420px] overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.18)] sm:rounded-[1.75rem] sm:shadow-2xl"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />

        <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-4">
          <h2
            id="sitguru-share-title"
            className="text-xl font-black tracking-tight text-slate-950"
          >
            Share event
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share panel"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 pb-5 pt-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex gap-3 p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-[4.5rem] sm:w-[4.5rem]">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center bg-emerald-50">
                    <PawPrint className="h-6 w-6 text-emerald-800/40" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="line-clamp-2 text-[15px] font-black leading-snug text-slate-950">
                  {event.title}
                </p>
                {placeLine ? (
                  <p className="mt-0.5 line-clamp-1 text-sm font-medium text-slate-500">
                    {placeLine}
                  </p>
                ) : null}
                <p
                  className="mt-1 truncate text-xs font-bold"
                  style={{ color: "#E85D04" }}
                >
                  {displayShareHost(url)}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void shareNative()}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white transition hover:bg-[#0a4a2f]"
          >
            <Share2 className="h-4 w-4" strokeWidth={2.4} />
            {canNativeShare ? "Share" : "Copy link"}
          </button>

          {canNativeShare ? (
            <button
              type="button"
              onClick={() => void copyLink()}
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
            >
              {copied ? (
                <Check className="h-4 w-4 text-[#0D5C3A]" strokeWidth={2.5} />
              ) : (
                <Link2 className="h-4 w-4 text-slate-600" strokeWidth={2.25} />
              )}
              {copied ? "Link copied" : "Copy link"}
            </button>
          ) : copied ? (
            <p className="mt-2 text-center text-sm font-semibold text-[#0D5C3A]">
              Link copied
            </p>
          ) : null}

          <p className="mt-5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Or send to
          </p>
          <div className="mt-3 flex items-start justify-around">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => shareViaPlatform(action.id)}
                className="flex w-[4.5rem] flex-col items-center gap-1.5"
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-full shadow-sm ${action.tone}`}
                >
                  <PlatformGlyph id={action.id} />
                </span>
                <span className="text-[11px] font-semibold text-slate-600">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
