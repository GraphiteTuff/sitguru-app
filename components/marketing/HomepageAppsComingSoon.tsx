"use client";

/**
 * Homepage announcement: SitGuru iOS + Android apps coming soon (free).
 * Encourages visitors to keep using the website / webapp today.
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
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-8">
        <div className="min-w-0 max-w-2xl space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] !text-emerald-100">
            SitGuru apps
          </p>
          <h2
            id="sitguru-apps-coming-soon"
            className="text-2xl font-black tracking-[-0.04em] !text-white sm:text-3xl lg:text-4xl"
          >
            iOS &amp; Android apps are coming soon — free to download.
          </h2>
          <p className="text-sm font-semibold leading-6 !text-emerald-50/95 sm:text-base sm:leading-7">
            SitGuru for iPhone and Android is on the way. Until then, book care,
            message Gurus, and run your pack on the website and webapp — same
            SitGuru, ready now.
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-4 lg:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <AppStoreBadge className="h-11 w-auto opacity-95 sm:h-12" />
              <span className="pointer-events-none absolute -right-1 -top-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#0D5C3A] shadow-sm">
                Soon
              </span>
            </div>
            <div className="relative">
              <GooglePlayBadge className="h-11 w-auto opacity-95 sm:h-12" />
              <span className="pointer-events-none absolute -right-1 -top-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#0D5C3A] shadow-sm">
                Soon
              </span>
            </div>
          </div>

          <p className="text-xs font-semibold !text-emerald-100/90 lg:text-right">
            Free when they launch · Keep using SitGuru on the web today
          </p>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Link
              href="/search"
              onClick={() => track("Apps banner Find Care", "/search")}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-black text-[#0D5C3A] shadow-sm transition hover:bg-emerald-50"
            >
              Find Care on the web
            </Link>
            <Link
              href="/signup?role=parent"
              onClick={() =>
                track("Apps banner Join free", "/signup?role=parent")
              }
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 bg-transparent px-5 text-sm font-black !text-white transition hover:bg-white/10"
            >
              Join free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
