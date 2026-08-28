"use client";

import { useEffect, useState } from "react";
import HomepageEventsSection from "@/components/community/HomepageEventsSection";
import type { CommunityEventWithPartner } from "@/lib/community/types";

type FeaturedPayload = {
  featured: CommunityEventWithPartner | null;
  upcoming: CommunityEventWithPartner[];
  locationLabel?: string;
};

export default function HomepageEventsSectionClient() {
  const [data, setData] = useState<FeaturedPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const params = new URLSearchParams();
        const savedZip = window.localStorage.getItem("sitguru_home_zip");
        const savedCity = window.localStorage.getItem("sitguru_home_city");
        const savedState = window.localStorage.getItem("sitguru_home_state");

        if (savedCity) params.set("city", savedCity);
        if (savedState) params.set("state", savedState);

        void savedZip;

        const response = await fetch(`/api/community/events/featured?${params.toString()}`);
        const payload = (await response.json()) as FeaturedPayload;

        if (!cancelled) setData(payload);
      } catch (error) {
        console.warn("Homepage events load skipped:", error);
      }
    }

    void loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data || (!data.featured && data.upcoming.length === 0)) {
    return null;
  }

  return (
    <HomepageEventsSection
      featured={data.featured}
      upcoming={data.upcoming}
      locationLabel={data.locationLabel}
    />
  );
}
