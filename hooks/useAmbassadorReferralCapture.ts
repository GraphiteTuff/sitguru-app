// hooks/useAmbassadorReferralCapture.ts
"use client";

/**
 * Captures ?ref=CODE (and aliases) on public routes, logs a click,
 * and relies on the API to set a 30-day attribution cookie.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const REF_QUERY_KEYS = ["ref", "referral", "ambassador", "amb"] as const;
const SESSION_FLAG = "sitguru_ref_tracked";

function readRefParam(searchParams: URLSearchParams | null) {
  if (!searchParams) return "";
  for (const key of REF_QUERY_KEYS) {
    const value = searchParams.get(key);
    if (value && value.trim()) return value.trim().toUpperCase();
  }
  return "";
}

function readPathCode(pathname: string | null) {
  if (!pathname) return "";
  const match = pathname.match(/^\/r\/([^/]+)$/i);
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  } catch {
    return "";
  }
}

export function useAmbassadorReferralCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = readRefParam(searchParams) || readPathCode(pathname);
    if (!code) return;

    // Avoid duplicate fires for the same code in this browser tab session
    try {
      const key = `${SESSION_FLAG}:${code}`;
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage may be blocked — still attempt track once
    }

    const params = new URLSearchParams(searchParams?.toString() || "");
    const payload = {
      ref: code,
      landingPath: pathname || "/",
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      sessionId:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : null,
    };

    // Non-blocking — never await in a way that stalls navigation UX
    void fetch("/api/ambassador/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Swallow — attribution is best-effort
    });
  }, [pathname, searchParams]);
}

export default useAmbassadorReferralCapture;
