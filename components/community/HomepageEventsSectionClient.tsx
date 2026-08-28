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
import type { EventsBannerSource } from "@/components/community/UpcomingEventsBanner";

type FeaturedPayload = {
  featured: CommunityEventWithPartner | null;
  upcoming: CommunityEventWithPartner[];
  bannerEvents?: CommunityEventWithPartner[];
  locationLabel?: string;
  previewMode?: boolean;
  source?: EventsBannerSource;
  lastSyncedAt?: string | null;
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

  const events =
    data.bannerEvents ||
    (data.featured ? [data.featured, ...data.upcoming] : data.upcoming);

  if (!events.length) {
    const demo = getHomepageDemoEvents(data.locationLabel);
    return (
      <HomepageEventsSection
        featured={demo.featured}
        upcoming={demo.upcoming}
        bannerEvents={
          demo.featured ? [demo.featured, ...demo.upcoming] : demo.upcoming
        }
        previewMode
        source="demo"
      />
    );
  }

  return (
    <HomepageEventsSection
      featured={data.featured}
      upcoming={data.upcoming}
      bannerEvents={events}
      locationLabel={data.locationLabel}
      previewMode={Boolean(data.previewMode)}
      source={data.source || "live"}
      lastSyncedAt={data.lastSyncedAt}
    />
  );
}
