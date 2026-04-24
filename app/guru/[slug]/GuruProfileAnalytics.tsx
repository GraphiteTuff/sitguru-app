"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function detectSourceFromUrl() {
  if (typeof window === "undefined") return "direct";

  const params = new URLSearchParams(window.location.search);
  const sourceParam =
    params.get("source") ||
    params.get("utm_source") ||
    params.get("ref") ||
    "";

  const normalized = sourceParam.trim().toLowerCase();

  if (!normalized) return "direct";
  if (normalized.includes("instagram") || normalized === "ig") return "instagram";
  if (normalized.includes("facebook") || normalized === "fb") return "facebook";
  if (normalized.includes("tiktok") || normalized === "tt") return "tiktok";
  if (normalized.includes("referral")) return "referral";
  if (normalized.includes("email")) return "email";

  return normalized;
}

export default function GuruProfileAnalytics({
  guruId,
  guruSlug,
  guruName,
  guruLocation,
  primaryService,
  hourlyRate,
  isFallback,
}: {
  guruId: string;
  guruSlug: string;
  guruName: string;
  guruLocation: string;
  primaryService: string;
  hourlyRate: number;
  isFallback: boolean;
}) {
  const hasTrackedProfileView = useRef(false);

  useEffect(() => {
    if (hasTrackedProfileView.current) return;

    hasTrackedProfileView.current = true;

    const source = detectSourceFromUrl();
    const resolvedGuruId = safeString(guruId);
    const resolvedGuruSlug = safeString(guruSlug);
    const resolvedGuruName = safeString(guruName) || "Guru";
    const resolvedGuruLocation = safeString(guruLocation) || "Serving your area";
    const resolvedPrimaryService = safeString(primaryService) || "Pet Care";
    const resolvedHourlyRate = safeNumber(hourlyRate);

    trackEvent({
      eventName: "guru_profile_view",
      eventType: "profile",
      source,
      role: "customer",
      guruId: resolvedGuruId,
      pagePath: window.location.pathname,
      metadata: {
        location: "guru_profile_page",
        guru_id: resolvedGuruId,
        guru_slug: resolvedGuruSlug,
        guru_name: resolvedGuruName,
        guru_location: resolvedGuruLocation,
        primary_service: resolvedPrimaryService,
        hourly_rate: resolvedHourlyRate,
        is_fallback: Boolean(isFallback),
        referrer: document.referrer || "",
        url: window.location.href,
        search: window.location.search,
        pathname: window.location.pathname,
      },
    });
  }, [
    guruId,
    guruSlug,
    guruName,
    guruLocation,
    primaryService,
    hourlyRate,
    isFallback,
  ]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const link = target.closest("a");

      if (!(link instanceof HTMLAnchorElement)) return;

      const href = link.getAttribute("href") || "";
      const label = link.textContent?.replace(/\s+/g, " ").trim() || "link";
      const source = detectSourceFromUrl();

      const resolvedGuruId = safeString(guruId);
      const resolvedGuruSlug = safeString(guruSlug);
      const resolvedGuruName = safeString(guruName) || "Guru";
      const resolvedPrimaryService = safeString(primaryService) || "Pet Care";
      const resolvedHourlyRate = safeNumber(hourlyRate);

      if (href.includes("/bookings/new")) {
        trackEvent({
          eventName: "booking_started",
          eventType: "booking",
          source,
          role: "customer",
          guruId: resolvedGuruId,
          pagePath: window.location.pathname,
          metadata: {
            label,
            destination: href,
            location: "guru_profile",
            guru_slug: resolvedGuruSlug,
            guru_name: resolvedGuruName,
            primary_service: resolvedPrimaryService,
            hourly_rate: resolvedHourlyRate,
          },
        });

        trackEvent({
          eventName: "booking_cta_clicked",
          eventType: "booking",
          source,
          role: "customer",
          guruId: resolvedGuruId,
          pagePath: window.location.pathname,
          metadata: {
            label,
            destination: href,
            location: "guru_profile",
            guru_slug: resolvedGuruSlug,
            guru_name: resolvedGuruName,
          },
        });
      }

      if (href.includes("/messages/new")) {
        trackEvent({
          eventName: "message_guru_clicked",
          eventType: "message",
          source,
          role: "customer",
          guruId: resolvedGuruId,
          pagePath: window.location.pathname,
          metadata: {
            label,
            destination: href,
            location: "guru_profile",
            guru_slug: resolvedGuruSlug,
            guru_name: resolvedGuruName,
          },
        });
      }

      if (href === "/search" || href.includes("/search")) {
        trackEvent({
          eventName: "browse_more_gurus_clicked",
          eventType: "navigation",
          source,
          role: "customer",
          guruId: resolvedGuruId,
          pagePath: window.location.pathname,
          metadata: {
            label,
            destination: href,
            location: "guru_profile",
            guru_slug: resolvedGuruSlug,
            guru_name: resolvedGuruName,
          },
        });
      }
    }

    document.addEventListener("click", handleClick);

    return () => document.removeEventListener("click", handleClick);
  }, [guruId, guruSlug, guruName, primaryService, hourlyRate]);

  return null;
}