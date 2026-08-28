"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

export default function EventViewTracker({
  eventId,
  slug,
}: {
  eventId: string;
  slug: string;
}) {
  useEffect(() => {
    void trackEvent({
      eventName: "event_view",
      eventType: "community",
      source: "public_event_detail",
      metadata: { eventId, slug },
    });
  }, [eventId, slug]);

  return null;
}
