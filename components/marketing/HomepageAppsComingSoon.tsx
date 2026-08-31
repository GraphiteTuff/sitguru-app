"use client";

/**
 * Compact homepage strip: SitGuru iOS + Android apps coming soon.
 * Logos stay; copy stays short so the hero and Guru grid remain primary.
 */

import Link from "next/link";
import {
  AppStoreBadge,
  GooglePlayBadge,
} from "@/components/marketing/StoreBadges";
import { trackEvent } from "@/lib/analytics/track";

type HomepageAppsComingSoonProps = {
  onTrack?: (label: string, href: string) => void;
};

export default function HomepageAppsComingSoon({
  onTrack,
}: HomepageAppsComingSoonProps) {
  function track(label: string, href: string) {
    if (onTrack) {
      onTrack(label, href);
      return;
    }
    void trackEvent({
      eventName: "homepage_apps_coming_soon_cta",
      source: "homepage",
      pagePath: "/",
      metadata: { label, href },
    });
  }

  return (
    <section
      aria-labelledby="sitguru-apps-coming-soon"
      className="public-dark-section border-y border-emerald-900/20 bg-[#0D5C3A]"
      data-brand-green
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
        <div className="min-w-0 sm:max-w-md">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] !text-emerald-100">
            SitGuru apps
          </p>
          <h2
            id="sitguru-apps-coming-soon"
            className="mt-1 text-lg font-black tracking-[-0.03em] !text-white sm:text-xl"
          >
            iOS &amp; Android apps coming soon
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <div className="relative">
            <AppStoreBadge className="h-9 w-auto opacity-95 sm:h-10" />
            <span className="pointer-events-none absolute -right-1 -top-2 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#0D5C3A] shadow-sm">
              Soon
            </span>
          </div>
          <div className="relative">
            <GooglePlayBadge className="h-9 w-auto opacity-95 sm:h-10" />
            <span className="pointer-events-none absolute -right-1 -top-2 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#0D5C3A] shadow-sm">
              Soon
            </span>
          </div>

          <Link
            href="/search"
            onClick={() => track("Apps banner Find Care", "/search")}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 text-xs font-black text-[#0D5C3A] shadow-sm transition hover:bg-emerald-50"
          >
            Find Care
          </Link>
          <Link
            href="/signup?role=parent"
            onClick={() =>
              track("Apps banner Join free", "/signup?role=parent")
            }
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/40 bg-transparent px-4 text-xs font-black !text-white transition hover:bg-white/10"
          >
            Join free
          </Link>
        </div>
      </div>
    </section>
  );
}
