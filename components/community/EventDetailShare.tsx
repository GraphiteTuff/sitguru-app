"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import EventShareDrawer from "@/components/community/EventShareDrawer";

type EventDetailShareProps = {
  event: {
    id: string;
    title: string;
    slug: string;
    start_at: string;
    end_at: string | null;
    timezone: string | null;
    venue_name: string | null;
    city: string | null;
    state: string | null;
    short_description: string | null;
    social_square_url: string | null;
    social_story_url: string | null;
    social_landscape_url: string | null;
    image_hero_url: string | null;
    image_card_url: string | null;
    image_original_url: string | null;
  };
  partnerName: string;
};

export default function EventDetailShare({ event, partnerName }: EventDetailShareProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div id="share" className="mt-8">
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 text-sm font-black text-white sm:w-auto"
      >
        <Share2 className="h-4 w-4" />
        Share Event
      </button>

      <EventShareDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        source="public_event_detail_drawer"
        event={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          startAt: event.start_at,
          endAt: event.end_at,
          timezone: event.timezone,
          city: event.city,
          state: event.state,
          shortDescription: event.short_description,
          partnerName,
          venueName: event.venue_name,
          social_square_url: event.social_square_url,
          social_story_url: event.social_story_url,
          social_landscape_url: event.social_landscape_url,
          image_hero_url: event.image_hero_url,
          image_card_url: event.image_card_url,
          image_original_url: event.image_original_url,
        }}
      />
    </div>
  );
}
