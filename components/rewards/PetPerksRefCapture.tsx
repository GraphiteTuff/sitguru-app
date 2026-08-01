"use client";

/**
 * Captures ?ref= (and aliases) on the public PetPerks page into localStorage
 * so PawPerks dashboard + checkout can attribute the visit.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  commitPetPerksRefToStorage,
  readRefFromSearchParams,
} from "@/lib/rewards/perks-broker";

export default function PetPerksRefCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = readRefFromSearchParams(searchParams);
    if (!code) return;

    commitPetPerksRefToStorage({
      code,
      landingPath: pathname || "/petperks",
      source: "petperks",
    });

    // Best-effort click log (same pipeline as ambassador refs when available)
    void fetch("/api/ambassador/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: code,
        landingPath: pathname || "/petperks",
        referrer: document.referrer || null,
        utmSource: searchParams.get("utm_source"),
        utmMedium: searchParams.get("utm_medium"),
        utmCampaign: searchParams.get("utm_campaign"),
        program: "petperks",
      }),
      keepalive: true,
    }).catch(() => {
      // attribution is best-effort
    });
  }, [pathname, searchParams]);

  return null;
}
