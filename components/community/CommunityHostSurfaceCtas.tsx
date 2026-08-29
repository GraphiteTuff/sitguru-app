"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Surface = "phone" | "tablet" | "desktop" | "app";

function detectSurface(): Surface {
  if (typeof window === "undefined") return "desktop";

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari home-screen webapp
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

  const width = window.innerWidth;
  if (standalone) return "app";
  if (width < 640) return "phone";
  if (width < 1024) return "tablet";
  return "desktop";
}

type CommunityHostSurfaceCtasProps = {
  className?: string;
};

/**
 * Public host CTAs — same destinations, labels tuned for phone / tablet /
 * desktop / installed webapp so the page feels native on each SitGuru surface.
 */
export default function CommunityHostSurfaceCtas({
  className = "",
}: CommunityHostSurfaceCtasProps) {
  const [surface, setSurface] = useState<Surface>("desktop");

  useEffect(() => {
    function refresh() {
      setSurface(detectSurface());
    }
    refresh();
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, []);

  const primary =
    surface === "phone" || surface === "app"
      ? "Become a host"
      : "Become a Partner Host";
  const manage =
    surface === "phone" || surface === "app"
      ? "Manage events"
      : "Open Event Manager";
  const map =
    surface === "phone" || surface === "app" ? "Community map" : "View Community map";

  const stackClass =
    surface === "phone" || surface === "app"
      ? "flex w-full flex-col gap-3"
      : "flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap";

  return (
    <div className={`${stackClass} ${className}`}>
      <Link
        href="/partners/apply?intent=community_events&source=community_host"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-white px-6 text-sm font-black text-emerald-900 sm:w-auto"
      >
        {primary}
      </Link>
      <Link
        href="/partners/dashboard/community/events"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/40 bg-white/10 px-6 text-sm font-black !text-white sm:w-auto"
      >
        {manage}
      </Link>
      <Link
        href="/community"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/30 px-6 text-sm font-black !text-white sm:w-auto"
      >
        {map}
      </Link>
    </div>
  );
}
