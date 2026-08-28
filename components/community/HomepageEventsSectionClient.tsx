"use client";

import { useEffect, useState } from "react";
import HomepageEventsSection from "@/components/community/HomepageEventsSection";
import { getHomepageDemoEvents } from "@/lib/community/homepage-demo-events";
import {
  formatCommunityLocationLabel,
  readCommunityLocationPreference,
  resolveCommunityLocationFromZip,
  saveCommunityLocationPreference,
} from "@/lib/community/location-preference";
import type { CommunityEventWithPartner } from "@/lib/community/types";

type FeaturedPayload = {
  featured: CommunityEventWithPartner | null;
  upcoming: CommunityEventWithPartner[];
  locationLabel?: string;
  previewMode?: boolean;
};

export default function HomepageEventsSectionClient() {
  const [data, setData] = useState<FeaturedPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        let preference = readCommunityLocationPreference();

        if (!preference.city && preference.zip) {
          const resolved = await resolveCommunityLocationFromZip(preference.zip);
          if (resolved?.city) {
            preference = resolved;
            saveCommunityLocationPreference(resolved);
          }
        }

        const params = new URLSearchParams();
        if (preference.city) params.set("city", preference.city);
        if (preference.state) params.set("state", preference.state);
        if (preference.zip) params.set("zip", preference.zip);

        const response = await fetch(`/api/community/events/featured?${params.toString()}`);
        const payload = (await response.json()) as FeaturedPayload;

        if (!cancelled) {
          setData({
            ...payload,
            locationLabel:
              payload.locationLabel || formatCommunityLocationLabel(preference),
          });
        }
      } catch (error) {
        console.warn("Homepage events load skipped:", error);
        if (!cancelled) {
          setData(getHomepageDemoEvents());
        }
      }
    }

    void loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return null;
  }

  const hasLiveEvents = Boolean(data.featured) || data.upcoming.length > 0;
  const payload = hasLiveEvents
    ? data
    : getHomepageDemoEvents(data.locationLabel);

  return (
    <HomepageEventsSection
      featured={payload.featured}
      upcoming={payload.upcoming}
      locationLabel={payload.locationLabel}
      previewMode={payload.previewMode}
    />
  );
}
