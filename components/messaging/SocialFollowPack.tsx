"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track";
import {
  SITGURU_OFFICIAL_HANDLE,
  SITGURU_OFFICIAL_SOCIAL_LINKS,
  type SitGuruSocialPlatform,
} from "@/lib/chat/sitguru-social";

type SocialFollowPackProps = {
  /** Where the pack was shown — defaults to Rogue homepage chat. */
  source?: string;
};

function detectPageSource() {
  if (typeof window === "undefined") return "direct";
  try {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("utm_source") ||
      params.get("source") ||
      params.get("ref") ||
      "direct"
    );
  } catch {
    return "direct";
  }
}

/** Log which @SitGuruOfficial platform Rogue drove a visitor to follow. */
function trackSocialFollowClick(
  link: SitGuruSocialPlatform,
  packSource: string,
) {
  void trackEvent({
    eventName: "rogue_social_follow_click",
    eventType: "conversion",
    role: "visitor",
    source: packSource,
    metadata: {
      platform: link.id,
      platform_label: link.label,
      handle: SITGURU_OFFICIAL_HANDLE,
      destination_url: link.href,
      traffic_source: detectPageSource(),
      conversion_surface: "rogue_social_follow_pack",
      funnel: "ambassador_social_follow",
    },
  });
}

/** Compact follow pack for Rogue chat — all @SitGuruOfficial. */
export function SocialFollowPack({
  source = "rogue_homepage_chat",
}: SocialFollowPackProps) {
  const impressed = useRef(false);

  useEffect(() => {
    if (impressed.current) return;
    impressed.current = true;

    void trackEvent({
      eventName: "rogue_social_follow_pack_impression",
      eventType: "engagement",
      role: "visitor",
      source,
      metadata: {
        handle: SITGURU_OFFICIAL_HANDLE,
        platforms: SITGURU_OFFICIAL_SOCIAL_LINKS.map((l) => l.id),
        traffic_source: detectPageSource(),
        conversion_surface: "rogue_social_follow_pack",
        funnel: "ambassador_social_follow",
      },
    });
  }, [source]);

  return (
    <div
      className="mt-2 overflow-hidden rounded-2xl border border-[#0D5C3A]/20 bg-white shadow-sm"
      data-analytics-surface="rogue_social_follow_pack"
    >
      <p className="m-0 px-3 pt-2.5 text-xs font-semibold text-slate-900">
        Follow {SITGURU_OFFICIAL_HANDLE}
      </p>
      <p className="m-0 px-3 pt-0.5 text-[11px] leading-snug text-slate-600">
        Events, pack moments, and community highlights — same handle on every
        platform.
      </p>
      <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
        {SITGURU_OFFICIAL_SOCIAL_LINKS.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            data-platform={link.id}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-[#0D5C3A]/30 bg-[#E8F3EC] px-2.5 py-1.5 text-center text-[11px] font-semibold text-[#0D5C3A] transition-colors hover:bg-[#0D5C3A] hover:text-white min-w-[4.5rem]"
            onClick={() => trackSocialFollowClick(link, source)}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
