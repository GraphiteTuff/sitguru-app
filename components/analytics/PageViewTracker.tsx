"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

export default function PageViewTracker({
  eventName = "page_view",
  eventType = "page",
  source,
  role,
}: {
  eventName?: string;
  eventType?: string;
  source?: string;
  role?: string;
}) {
  useEffect(() => {
    trackEvent({
      eventName,
      eventType,
      source,
      role,
      metadata: {
        referrer: document.referrer || "",
        url: window.location.href,
      },
    });
  }, [eventName, eventType, source, role]);

  return null;
}