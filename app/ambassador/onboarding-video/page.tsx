"use client";

import { useEffect } from "react";

/**
 * CTO chat CTA alias — lands on the public ambassador promo video section.
 * Hash must be applied client-side (server redirects drop fragments).
 */
export default function AmbassadorOnboardingVideoAliasPage() {
  useEffect(() => {
    window.location.replace("/ambassadors#ambassador-video");
  }, []);

  return (
    <main className="flex min-h-[40vh] items-center justify-center bg-white px-4">
      <p className="text-sm font-semibold text-slate-600">
        loading the pack video…
      </p>
    </main>
  );
}
