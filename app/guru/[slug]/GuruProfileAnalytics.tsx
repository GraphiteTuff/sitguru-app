"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

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
  useEffect(() => {
    const source = detectSourceFromUrl();

    trackEvent({
      eventName: "guru_profile_view",
      eventType: "profile",
      source,
      role: "customer",
      guruId,
      metadata: {
        guru_slug: guruSlug,
        guru_name: guruName,
        guru_location: guruLocation,
        primary_service: primaryService,
        hourly_rate: hourlyRate,
        is_fallback: isFallback,
        referrer: document.referrer || "",
        url: window.location.href,
        search: window.location.search,
        pathname: window.location.pathname,
      },
    });
  }, [guruId, guruSlug, guruName, guruLocation, primaryService, hourlyRate, isFallback]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const link = target.closest("a");

      if (!(link instanceof HTMLAnchorElement)) return;

      const href = link.getAttribute("href") || "";
      const label = link.textContent?.replace(/\s+/g, " ").trim() || "link";
      const source = detectSourceFromUrl();

      if (href.includes("/bookings/new")) {
        trackEvent({
          eventName: "booking_started",
          eventType: "booking",
          source,
          role: "customer",
          guruId,
          metadata: {
            label,
            destination: href,
            location: "guru_profile",
            guru_slug: guruSlug,
            guru_name: guruName,
            primary_service: primaryService,
            hourly_rate: hourlyRate,
          },
        });

        trackEvent({
          eventName: "booking_cta_clicked",
          eventType: "booking",
          source,
          role: "customer",
          guruId,
          metadata: {
            label,
            destination: href,
            location: "guru_profile",
            guru_slug: guruSlug,
            guru_name: guruName,
          },
        });
      }

      if (href.includes("/messages/new")) {
        trackEvent({
          eventName: "message_guru_clicked",
          eventType: "message",
          source,
          role: "customer",
          guruId,
          metadata: {
            label,
            destination: href,
            location: "guru_profile",
            guru_slug: guruSlug,
            guru_name: guruName,
          },
        });
      }

      if (href === "/search" || href.includes("/search")) {
        trackEvent({
          eventName: "browse_more_gurus_clicked",
          eventType: "navigation",
          source,
          role: "customer",
          guruId,
          metadata: {
            label,
            destination: href,
            location: "guru_profile",
            guru_slug: guruSlug,
            guru_name: guruName,
          },
        });
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [guruId, guruSlug, guruName, primaryService, hourlyRate]);

  return null;
}
