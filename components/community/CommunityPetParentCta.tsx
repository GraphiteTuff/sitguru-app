"use client";

import CommunityJoinOptions, {
  CommunityJoinHubBanner,
} from "@/components/community/CommunityJoinOptions";

type CommunityPetParentCtaProps = {
  nextPath?: string;
  source?: string;
  campaign?: string;
  compact?: boolean;
  slug?: string;
  eventId?: string;
};

/** Community join CTA — Pet Parent, Guru, or Ambassador. */
export default function CommunityPetParentCta({
  nextPath = "/events",
  source = "community",
  campaign = "community_join_cta",
  compact = false,
  slug,
  eventId,
}: CommunityPetParentCtaProps) {
  if (compact && slug) {
    return (
      <CommunityJoinOptions
        slug={slug}
        eventId={eventId}
        source={source}
        campaign={campaign}
        variant="event"
      />
    );
  }

  if (compact) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="mb-2 text-sm font-black text-emerald-900">
          Free account — RSVP, connect locally, join the pack.
        </p>
        <CommunityJoinOptions
          variant="compact"
          source={source}
          campaign={campaign}
        />
      </div>
    );
  }

  return (
    <CommunityJoinHubBanner />
  );
}
