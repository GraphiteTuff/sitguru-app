"use client";

import { useEffect } from "react";
import { trackReadsEvent } from "@/lib/reads/analytics";
import type { ReadsAnalyticsEventName } from "@/lib/reads/types";

export default function TrackPageView({
  eventName = "page_view",
  contentId,
  contentType,
  metadata,
}: {
  eventName?: ReadsAnalyticsEventName;
  contentId?: string;
  contentType?: string;
  metadata?: Record<string, unknown>;
}) {
  useEffect(() => {
    void trackReadsEvent({
      eventName,
      contentId,
      contentType,
      pagePath:
        typeof window !== "undefined" ? window.location.pathname : undefined,
      metadata,
    });
  }, [eventName, contentId, contentType, metadata]);

  return null;
}
