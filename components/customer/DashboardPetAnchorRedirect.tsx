"use client";

import { useEffect } from "react";

type DashboardPetAnchorRedirectProps = {
  hash?: "multi-pet-center" | "new-pet-passport";
};

/**
 * Next.js server redirects drop URL hashes, so pet passport shortcuts
 * have to land in the browser and then jump to the dashboard anchor.
 */
export default function DashboardPetAnchorRedirect({
  hash = "multi-pet-center",
}: DashboardPetAnchorRedirectProps) {
  useEffect(() => {
    window.location.replace(`/customer/dashboard#${hash}`);
  }, [hash]);

  return (
    <main className="flex min-h-[50vh] items-center justify-center bg-[#f7fbf9] px-4">
      <p className="text-center text-sm font-bold text-slate-600">
        Opening Pet Passports…
      </p>
    </main>
  );
}
