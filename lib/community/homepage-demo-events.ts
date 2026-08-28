import type { CommunityEventWithPartner } from "@/lib/community/types";

export const HOMEPAGE_DEMO_EVENT_ID_PREFIX = "demo-homepage-";

export function isHomepageDemoEvent(eventId: string | null | undefined) {
  return String(eventId || "").startsWith(HOMEPAGE_DEMO_EVENT_ID_PREFIX);
}

function daysFromNow(days: number, hour = 11, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function demoEvent(
  id: string,
  input: {
    title: string;
    slug: string;
    partnerName: string;
    shortDescription: string;
    venueName: string;
    city: string;
    state: string;
    startDaysFromNow: number;
    endDaysFromNow?: number;
    imageUrl?: string;
    categories?: string[];
    isFree?: boolean;
    featuredStatus?: "homepage" | "community" | "market";
  },
): CommunityEventWithPartner {
  const startAt = daysFromNow(input.startDaysFromNow, 11, 0);
  const endAt = input.endDaysFromNow
    ? daysFromNow(input.endDaysFromNow, 15, 0)
    : daysFromNow(input.startDaysFromNow, 15, 0);

  return {
    id: `${HOMEPAGE_DEMO_EVENT_ID_PREFIX}${id}`,
    partner_id: `${HOMEPAGE_DEMO_EVENT_ID_PREFIX}partner-${id}`,
    created_by: null,
    title: input.title,
    slug: input.slug,
    short_description: input.shortDescription,
    description: input.shortDescription,
    event_type: "community",
    categories: input.categories || ["Community"],
    image_original_url: input.imageUrl || null,
    image_hero_url: input.imageUrl || null,
    image_card_url: input.imageUrl || null,
    image_mobile_url: input.imageUrl || null,
    social_square_url: null,
    social_story_url: null,
    social_landscape_url: null,
    image_storage_bucket: null,
    image_storage_path: null,
    start_at: startAt,
    end_at: endAt,
    timezone: "America/New_York",
    venue_name: input.venueName,
    address_line_1: null,
    address_line_2: null,
    city: input.city,
    state: input.state,
    postal_code: "18018",
    country: "US",
    latitude: null,
    longitude: null,
    pet_friendly: true,
    family_friendly: true,
    outdoor: true,
    is_free: input.isFree ?? true,
    registration_required: false,
    ticket_url: null,
    event_url: null,
    contact_email: null,
    status: "published",
    featured_status: input.featuredStatus || "community",
    featured_priority: 100,
    featured_start_at: null,
    featured_end_at: null,
    featured_market_city: input.city,
    featured_market_state: input.state,
    moderation_note: null,
    moderated_by: null,
    moderated_at: null,
    published_at: new Date().toISOString(),
    cancelled_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    partners: {
      id: `${HOMEPAGE_DEMO_EVENT_ID_PREFIX}partner-${id}`,
      business_name: input.partnerName,
      slug: input.slug,
      city: input.city,
      state: input.state,
      website: null,
      email: null,
    },
  };
}

/** Marketing mockups shown until live partner events are published. */
export function getHomepageDemoEvents(locationLabel = "Lehigh Valley, PA") {
  const featured = demoEvent("adoption-day", {
    title: "Adoption Day at the Park",
    slug: "preview-adoption-day-at-the-park",
    partnerName: "Outcast 2nd Chance Rescue",
    shortDescription:
      "Meet adoptable dogs, talk with rescue volunteers, and connect with local Pet Gurus who love community outreach.",
    venueName: "Sand Island Park",
    city: "Bethlehem",
    state: "PA",
    startDaysFromNow: 12,
    imageUrl: "/images/partners/outcast-rescue.webp",
    categories: ["Adoption", "Community"],
    featuredStatus: "homepage",
  });

  const upcoming = [
    demoEvent("pints-and-pups", {
      title: "Pints & Pups Social",
      slug: "preview-pints-and-pups-social",
      partnerName: "Zeppa Studios",
      shortDescription:
        "Bring your pup for a relaxed patio hang, local pet-parent intros, and SitGuru community swag.",
      venueName: "Downtown Social Patio",
      city: "Allentown",
      state: "PA",
      startDaysFromNow: 19,
      imageUrl: "/images/partners/zeppa-studios.png",
      categories: ["Social"],
    }),
    demoEvent("portrait-pop-up", {
      title: "Pet Portrait Pop-Up",
      slug: "preview-pet-portrait-pop-up",
      partnerName: "Crimson Cat Studios",
      shortDescription:
        "Mini pet photo sessions, print previews, and tips for camera-shy pups and cats.",
      venueName: "Riverfront Arts Walk",
      city: "Bethlehem",
      state: "PA",
      startDaysFromNow: 26,
      imageUrl: "/images/partners/crimson-cat-studios-light.png",
      categories: ["Pet Business"],
    }),
    demoEvent("muttz-meetup", {
      title: "Mostly Muttz Community Meetup",
      slug: "preview-mostly-muttz-meetup",
      partnerName: "Mostly Muttz Rescue",
      shortDescription:
        "Volunteer meet-and-greet, foster info, and a pack walk for friendly, leashed dogs.",
      venueName: "Community Green",
      city: "Quakertown",
      state: "PA",
      startDaysFromNow: 33,
      categories: ["Rescue", "Community"],
    }),
    demoEvent("boarding-open-house", {
      title: "Partner Open House & Playdate",
      slug: "preview-partner-open-house",
      partnerName: "Acorn Valley Pet Boarding",
      shortDescription:
        "Tour the facility, meet the care team, and see how SitGuru partners support local pet families.",
      venueName: "Acorn Valley Pet Boarding",
      city: "Bethlehem",
      state: "PA",
      startDaysFromNow: 40,
      imageUrl: "/images/partners/acorn-valley-pet-boarding-light.png",
      categories: ["Pet Business"],
    }),
  ];

  return {
    featured,
    upcoming,
    locationLabel,
    previewMode: true as const,
  };
}
