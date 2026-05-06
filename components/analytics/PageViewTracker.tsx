"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

type PageViewTrackerProps = {
  eventName?: string;
  eventType?: string;
  source?: string;
  role?: string;
  auditArea?: string;
  auditAction?: string;
  targetType?: string;
  targetId?: string;
  severity?: "info" | "success" | "warning" | "critical";
  metadata?: Record<string, unknown>;
};

function getOrCreateSessionId() {
  if (typeof window === "undefined") return "";

  const existingSessionId = window.sessionStorage.getItem(
    "sitguru_session_id",
  );

  if (existingSessionId) return existingSessionId;

  const newSessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sitguru_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  window.sessionStorage.setItem("sitguru_session_id", newSessionId);

  return newSessionId;
}

export default function PageViewTracker({
  eventName = "page_view",
  eventType = "page",
  source,
  role,
  auditArea,
  auditAction,
  targetType,
  targetId,
  severity = "info",
  metadata = {},
}: PageViewTrackerProps) {
  useEffect(() => {
    const pagePath = `${window.location.pathname}${window.location.search}`;
    const sessionId = getOrCreateSessionId();

    void trackEvent({
      eventName,
      eventType,
      source,
      role,
      pagePath,
      metadata: {
        ...metadata,
        sessionId,
        auditArea,
        auditAction,
        targetType,
        targetId,
        severity,
        referrer: document.referrer || "",
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        title: document.title || "",
      },
    });
  }, [
    eventName,
    eventType,
    source,
    role,
    auditArea,
    auditAction,
    targetType,
    targetId,
    severity,
    metadata,
  ]);

  return null;
}