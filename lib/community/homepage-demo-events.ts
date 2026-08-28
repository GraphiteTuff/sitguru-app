import type { CommunityEventWithPartner } from "@/lib/community/types";

export const HOMEPAGE_DEMO_EVENT_ID_PREFIX = "demo-homepage-";

export function isHomepageDemoEvent(eventId: string | null | undefined) {
  return String(eventId || "").startsWith(HOMEPAGE_DEMO_EVENT_ID_PREFIX);
}

/** Align demo event dates forward so banner badges stay upcoming. */
function alignDemoDateToFuture(month: number, day: number, hour = 11) {
  const now = new Date();
  let year = now.getFullYear();
  let candidate = new Date(year, month - 1, day, hour, 0, 0, 0);
  if (candidate.getTime() < now.getTime()) {
    year += 1;
    candidate = new Date(year, month - 1, day, hour, 0, 0, 0);
  }
  const end = new Date(candidate);
  end.setHours(end.getHours() + 3);
  return { startAt: candidate.toISOString(), endAt: end.toISOString() };
}

function fixedDemoDate(month: number, day: number, _year = 2026, hour = 11) {
  const { startAt, endAt } = alignDemoDateToFuture(month, day, hour);
  return { startAt, endAt };
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
    startAt: string;
    endAt: string;
    imageUrl?: string;
    categories?: string[];
    isFree?: boolean;
    featuredStatus?: "homepage" | "community" | "market";
  },
): CommunityEventWithPartner {
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
    start_at: input.startAt,
    end_at: input.endAt,
    timezone: "America/New_York",
    venue_name: input.venueName,
    address_line_1: null,
    address_line_2: null,
    city: input.city,
    state: input.state,
    postal_code: "18901",
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

/** Marketing mockups aligned to homepage/community banner designs. */
export function getHomepageDemoEvents(locationLabel = "Bucks County, PA") {
  const adoptionSaturday = alignDemoDateToFuture(9, 18, 11);
  const adoptionEnd = new Date(adoptionSaturday.startAt);
  adoptionEnd.setHours(adoptionEnd.getHours() + 3);

  const upcoming = [
    demoEvent("adoption-saturday", {
      title: "Adoption Saturday",
      slug: "preview-adoption-saturday",
      partnerName: "Bucks County Animal Rescue",
      shortDescription:
        "Meet adoptable dogs and cats, talk with rescue volunteers, and connect with local pet families.",
      venueName: "Bucks County Animal Rescue",
      city: "Doylestown",
      state: "PA",
      startAt: adoptionSaturday.startAt,
      endAt: adoptionEnd.toISOString(),
      imageUrl:
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=80",
      categories: ["Adoption"],
      isFree: true,
      featuredStatus: "homepage",
    }),
    demoEvent("paws-and-yoga", {
      title: "Paws & Yoga",
      slug: "preview-paws-and-yoga",
      partnerName: "Peaceful Poses Yoga",
      shortDescription:
        "Outdoor yoga with leashed pups, guided breathing, and a relaxed community social after class.",
      venueName: "Peaceful Poses Yoga, Doylestown",
      city: "Doylestown",
      state: "PA",
      startAt: fixedDemoDate(9, 20, 2026, 9).startAt,
      endAt: fixedDemoDate(9, 20, 2026, 10).endAt,
      imageUrl:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80",
      categories: ["Wellness", "Social"],
      isFree: false,
    }),
    demoEvent("dock-diving", {
      title: "Dog Dock Diving",
      slug: "preview-dog-dock-diving",
      partnerName: "Lake Nockamixon Events",
      shortDescription:
        "Watch dock-diving demos, try beginner lanes with your dog, and meet local adventure pet parents.",
      venueName: "Lake Nockamixon",
      city: "Quakertown",
      state: "PA",
      startAt: fixedDemoDate(9, 26, 2026, 10).startAt,
      endAt: fixedDemoDate(9, 26, 2026, 16).endAt,
      imageUrl:
        "https://images.unsplash.com/photo-1551717743-49959806b965?auto=format&fit=crop&w=900&q=80",
      categories: ["Festival", "Community"],
      isFree: false,
    }),
    demoEvent("howl-o-ween", {
      title: "Howl-O-Ween Festival",
      slug: "preview-howl-o-ween-festival",
      partnerName: "Peddler's Village",
      shortDescription:
        "Costume parade, pet-friendly vendors, treat stations, and SitGuru partner booths.",
      venueName: "Peddler's Village, Lahaska",
      city: "Lahaska",
      state: "PA",
      startAt: fixedDemoDate(10, 2, 2026, 12).startAt,
      endAt: fixedDemoDate(10, 2, 2026, 17).endAt,
      imageUrl:
        "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=900&q=80",
      categories: ["Festival"],
      isFree: true,
    }),
  ];

  return {
    featured: upcoming[0],
    upcoming: upcoming.slice(1),
    locationLabel,
    previewMode: true as const,
  };
}

export function getCommunityBannerDemoEvents() {
  const { featured, upcoming } = getHomepageDemoEvents();
  return featured ? [featured, ...upcoming] : upcoming;
}
