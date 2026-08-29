"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Mail,
  MessageCircle,
  Share2,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics/track";
import {
  buildEventShareCaption,
  buildEventShareHref,
  type SharePlatform,
} from "@/lib/community/share";
import { getPublicEventPath, getPublicEventUrl } from "@/lib/community/slug";

type EventSharePanelProps = {
  title: string;
  slug: string;
  startAt: string;
  endAt?: string | null;
  timezone?: string | null;
  venueName?: string | null;
  city?: string | null;
  state?: string | null;
  shortDescription?: string | null;
  partnerName?: string | null;
  source?: string;
  compact?: boolean;
};

export default function EventSharePanel({
  title,
  slug,
  startAt,
  endAt = null,
  timezone = null,
  venueName = null,
  city = null,
  state = null,
  shortDescription = null,
  partnerName = null,
  source = "community_event",
  compact = false,
}: EventSharePanelProps) {
  const [copied, setCopied] = useState<"link" | "caption" | null>(null);
  const [hint, setHint] = useState("");

  const url = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${getPublicEventPath(slug)}`;
    }
    return getPublicEventUrl(slug);
  }, [slug]);

  const caption = useMemo(
    () =>
      buildEventShareCaption(
        {
          title,
          start_at: startAt,
          end_at: endAt,
          timezone,
          venue_name: venueName,
          city,
          state,
          short_description: shortDescription,
        },
        partnerName,
      ),
    [title, startAt, endAt, timezone, venueName, city, state, shortDescription, partnerName],
  );

  async function copyValue(value: string, kind: "link" | "caption") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setHint(kind === "caption" ? "Caption copied" : "Link copied");
      void trackEvent({
        eventName: kind === "caption" ? "event_share" : "event_link_copy",
        eventType: "community",
        source,
        metadata: { slug, kind },
      });
      window.setTimeout(() => {
        setCopied(null);
        setHint("");
      }, 1600);
    } catch {
      setHint("Copy failed — select the text manually");
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        // Pass text + url separately so SMS/socials don't duplicate the link
        await navigator.share({ title, text: caption, url });
        void trackEvent({
          eventName: "event_share",
          eventType: "community",
          source,
          metadata: { slug, channel: "native" },
        });
        return;
      } catch {
        // cancelled
      }
    }

    await copyValue(url, "link");
  }

  const chips: Array<{
    id: string;
    label: string;
    href?: string;
    onClick?: () => void;
    tone: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "copy",
      label: copied === "link" ? "Copied" : "Copy Link",
      onClick: () => void copyValue(url, "link"),
      tone: "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700",
      icon: copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />,
    },
    {
      id: "caption",
      label: copied === "caption" ? "Copied" : "Copy Caption",
      onClick: () => void copyValue(caption, "caption"),
      tone: "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
      icon: copied === "caption" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />,
    },
    {
      id: "native",
      label: "Share",
      onClick: () => void nativeShare(),
      tone: "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
      icon: <Share2 className="h-4 w-4" />,
    },
    ...(["facebook", "x", "email", "sms"] as SharePlatform[]).map((platform) => ({
      id: platform,
      label: platform === "x" ? "X" : platform.charAt(0).toUpperCase() + platform.slice(1),
      href: buildEventShareHref(platform, url, caption),
      tone: "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100",
      icon:
        platform === "email" ? (
          <Mail className="h-4 w-4" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        ),
    })),
  ];

  return (
    <div className={compact ? "space-y-3" : "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"}>
      {!compact ? (
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Share Event
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Spread the word across social, email, and text.
          </p>
        </div>
      ) : null}

      {!compact ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Suggested caption
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">{caption}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {chips.map((chip) =>
          chip.href ? (
            <a
              key={chip.id}
              href={chip.href}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                void trackEvent({
                  eventName: "event_share",
                  eventType: "community",
                  source,
                  metadata: { slug, channel: chip.id },
                })
              }
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-black transition ${chip.tone}`}
            >
              {chip.icon}
              {chip.label}
            </a>
          ) : (
            <button
              key={chip.id}
              type="button"
              onClick={chip.onClick}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-black transition ${chip.tone}`}
            >
              {chip.icon}
              {chip.label}
            </button>
          ),
        )}
      </div>

      {hint ? <p className="text-xs font-black text-emerald-800">{hint}</p> : null}
    </div>
  );
}
