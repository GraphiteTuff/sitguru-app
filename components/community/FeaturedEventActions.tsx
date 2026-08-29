"use client";

import Link from "next/link";
import { useState } from "react";
import EventShareDrawer, {
  type EventShareDrawerEvent,
} from "@/components/community/EventShareDrawer";
import { getPublicEventPath } from "@/lib/community/slug";
import { isHomepageDemoEvent } from "@/lib/community/homepage-demo-events";

type FeaturedEventActionsProps = {
  event: EventShareDrawerEvent;
  searchCity?: string;
  searchState?: string;
  previewMode?: boolean;
};

export default function FeaturedEventActions({
  event,
  searchCity = "",
  searchState = "",
  previewMode = false,
}: FeaturedEventActionsProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const isPreview = previewMode || isHomepageDemoEvent(event.id);
  const href = isPreview ? "/events" : getPublicEventPath(event.slug);

  return (
    <>
      <div className="flex flex-col justify-center gap-3 border-t border-slate-100 p-6 sm:p-8 lg:border-l lg:border-t-0">
        <Link
          href={href}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-800"
        >
          {isPreview ? "Explore Pet Events" : "View Event Details"}
        </Link>

        <Link
          href={`/search?city=${encodeURIComponent(searchCity)}&state=${encodeURIComponent(searchState)}`}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 transition hover:bg-slate-50"
        >
          Meet Local Gurus
        </Link>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
        >
          Share Event
        </button>
      </div>

      <EventShareDrawer
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        event={event}
        source="homepage_featured_event"
      />
    </>
  );
}
