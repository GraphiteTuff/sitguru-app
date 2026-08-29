import type { CommunityEventWithPartner } from "@/lib/community/types";

export const HOMEPAGE_DEMO_EVENT_ID_PREFIX = "demo-homepage-";

export function isHomepageDemoEvent(eventId: string | null | undefined) {
  return String(eventId || "").startsWith(HOMEPAGE_DEMO_EVENT_ID_PREFIX);
}

/** America/New_York wall time → ISO (EDT -04 through Oct; EST -05 from Nov). */
function easternIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
) {
  const pad = (n: number) => String(n).padStart(2, "0");
  // 2026 DST ends Nov 1 — use EST from November onward.
  const offset = month >= 11 ? "-05:00" : "-04:00";
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${offset}`,
  ).toISOString();
}

function rangeEastern(
  year: number,
  month: number,
  day: number,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
) {
  return {
    startAt: easternIso(year, month, day, startHour, startMinute),
    endAt: easternIso(year, month, day, endHour, endMinute),
  };
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
    addressLine1?: string | null;
    eventUrl?: string | null;
    postalCode?: string | null;
    countyLabel?: string;
    outdoor?: boolean;
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
    address_line_1: input.addressLine1 || null,
    address_line_2: null,
    city: input.city,
    state: input.state,
    postal_code: input.postalCode || null,
    country: "US",
    latitude: null,
    longitude: null,
    pet_friendly: true,
    family_friendly: true,
    outdoor: input.outdoor ?? true,
    is_free: input.isFree ?? true,
    registration_required: false,
    ticket_url: null,
    event_url: input.eventUrl || null,
    contact_email: null,
    status: "published",
    featured_status: input.featuredStatus || "homepage",
    featured_priority: 35,
    featured_start_at: null,
    featured_end_at: null,
    featured_market_city: input.countyLabel || input.city,
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
      website: input.eventUrl || null,
      email: null,
    },
  };
}

const IMG = {
  dogs: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=80",
  market:
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
  foster:
    "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=900&q=80",
  outdoor:
    "https://images.unsplash.com/photo-1551717743-49959806b965?auto=format&fit=crop&w=900&q=80",
  cats: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80",
  shop: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=900&q=80",
  spca: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80",
  fair: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=900&q=80",
} as const;

function wagsMarket(
  id: string,
  month: number,
  day: number,
  label: string,
): CommunityEventWithPartner {
  const range = rangeEastern(2026, month, day, 10, 0, 13, 0);
  return demoEvent(id, {
    title: "Wags Rescue Meet & Greet – Horsham Farmers Market",
    slug: `wags-rescue-horsham-farmers-market-${label}`,
    partnerName: "Wags Rescue & Referral",
    shortDescription:
      "Meet adoptable pups, learn about adoption & fostering, browse local vendors. Tip: check Wags Facebook the day before for which dogs attend.",
    venueName: "Horsham Farmers Market",
    addressLine1: "435 Babylon Rd",
    city: "Horsham",
    state: "PA",
    postalCode: "19044",
    countyLabel: "Montgomery County",
    startAt: range.startAt,
    endAt: range.endAt,
    imageUrl: IMG.market,
    categories: ["Adoption", "Community"],
    isFree: true,
    eventUrl: "https://wagsrescue.org/event-calendar/",
    featuredStatus: "homepage",
  });
}

/**
 * Curated Bucks & Montgomery County pet events for homepage cards + Delilah.
 * Sourced from organizer calendars (Wags, BCSPCA, FMCA, Clear the Shelters, etc.).
 */
export function getCuratedBucksMontgomeryPetEvents(): CommunityEventWithPartner[] {
  const patioAug23 = rangeEastern(2026, 8, 23, 13, 0, 15, 0);
  const patioOct = rangeEastern(2026, 10, 5, 13, 0, 15, 0);
  const fosterAug20 = rangeEastern(2026, 8, 20, 18, 0, 20, 0);
  const fosterSep14 = rangeEastern(2026, 9, 14, 18, 0, 20, 0);
  const rcFlyin22 = rangeEastern(2026, 8, 22, 9, 0, 15, 0);
  const rcFlyin23 = rangeEastern(2026, 8, 23, 9, 0, 15, 0);
  const clearShelters = rangeEastern(2026, 8, 29, 10, 0, 14, 0);
  const hartPetsmart = rangeEastern(2026, 8, 29, 11, 0, 15, 0);
  const langhorneFair = rangeEastern(2026, 8, 29, 10, 0, 15, 0);
  const bucksFoodTruck = rangeEastern(2026, 9, 12, 11, 0, 15, 0);
  const petSuppliesPlus = rangeEastern(2026, 9, 13, 11, 0, 13, 0);
  const corvettes = rangeEastern(2026, 9, 19, 8, 0, 15, 0);
  const paws4Life = rangeEastern(2026, 10, 3, 9, 0, 12, 0);
  const fallFest = rangeEastern(2026, 10, 24, 13, 0, 16, 0);
  const fmcaSep = rangeEastern(2026, 9, 12, 12, 0, 15, 0);
  const fmcaOct = rangeEastern(2026, 10, 10, 12, 0, 15, 0);
  const fmcaNov = rangeEastern(2026, 11, 14, 12, 0, 15, 0);
  const fmcaDec = rangeEastern(2026, 12, 12, 12, 0, 15, 0);
  const adoptAndShop = rangeEastern(2026, 10, 18, 10, 0, 16, 0);
  const montcoHours = rangeEastern(2026, 8, 30, 11, 0, 17, 0);

  return [
    demoEvent("clear-the-shelters-wac-2026-08-29", {
      title: "Clear the Shelters – Women's Animal Center",
      slug: "clear-the-shelters-womens-animal-center-aug-29-2026",
      partnerName: "Women's Animal Center",
      shortDescription:
        "NBC Clear the Shelters day — adoption fees waived for approved applicants (sponsor: Inspire FCU). Tip: review adoption guidelines online before you go.",
      venueName: "Women's Animal Center",
      addressLine1: "3839 Richlieu Rd",
      city: "Bensalem",
      state: "PA",
      postalCode: "19020",
      countyLabel: "Bucks County",
      startAt: clearShelters.startAt,
      endAt: clearShelters.endAt,
      imageUrl: IMG.dogs,
      categories: ["Adoption"],
      isFree: true,
      outdoor: false,
      eventUrl:
        "https://www.womensanimalcenter.org/events/clear-shelters-adoption-event",
      featuredStatus: "homepage",
    }),
    demoEvent("hart2heart-petsmart-warminster-2026-08-29", {
      title: "Hart 2 Heart Adoption Event – PetSmart Warminster",
      slug: "hart-2-heart-petsmart-warminster-aug-29-2026",
      partnerName: "Hart 2 Heart Animal Rescue",
      shortDescription:
        "Meet adoptable cats & kittens at PetSmart Warminster (Clear the Shelters weekend). Tip: start an application ahead so you're ready to adopt.",
      venueName: "PetSmart Warminster",
      addressLine1: "934 W Street Rd",
      city: "Warminster",
      state: "PA",
      postalCode: "18974",
      countyLabel: "Bucks County",
      startAt: hartPetsmart.startAt,
      endAt: hartPetsmart.endAt,
      imageUrl: IMG.cats,
      categories: ["Adoption"],
      isFree: true,
      outdoor: false,
      eventUrl: "https://hart2heartanimalrescue.rescuegroups.org/info/events",
      featuredStatus: "homepage",
    }),
    demoEvent("langhorne-rotary-pet-fair-2026-08-29", {
      title: "Langhorne Rotary Pet Fair & Family Fun Day",
      slug: "langhorne-rotary-pet-fair-aug-29-2026",
      partnerName: "Langhorne Rotary",
      shortDescription:
        "Free family pet fair with vendors, petting zoo, kids activities, raffles & more. Tip: rain date Sept 12 — confirm before you travel.",
      venueName: "Mayor's Playground",
      city: "Langhorne",
      state: "PA",
      countyLabel: "Bucks County",
      startAt: langhorneFair.startAt,
      endAt: langhorneFair.endAt,
      imageUrl: IMG.fair,
      categories: ["Festival", "Community"],
      isFree: true,
      featuredStatus: "homepage",
    }),
    demoEvent("wags-patio-horsham-2026-08-23", {
      title: "Wags Rescue Meet & Greet – The Patio of Horsham",
      slug: "wags-rescue-meet-greet-patio-horsham-aug-23-2026",
      partnerName: "Wags Rescue & Referral",
      shortDescription:
        "Meet adoptable dogs & puppies, enjoy food trucks, and relax outdoors. Tip: check Wags Facebook for which pups attend.",
      venueName: "The Patio of Horsham",
      addressLine1: "100 Lakeside Dr",
      city: "Horsham",
      state: "PA",
      postalCode: "19044",
      countyLabel: "Montgomery County",
      startAt: patioAug23.startAt,
      endAt: patioAug23.endAt,
      imageUrl: IMG.dogs,
      categories: ["Adoption", "Social"],
      isFree: true,
      eventUrl: "https://wagsrescue.org/event-calendar/",
      featuredStatus: "homepage",
    }),
    wagsMarket("wags-farmers-market-2026-08-30", 8, 30, "aug-30-2026"),
    wagsMarket("wags-farmers-market-2026-09-06", 9, 6, "sep-6-2026"),
    wagsMarket("wags-farmers-market-2026-09-20", 9, 20, "sep-20-2026"),
    wagsMarket("wags-farmers-market-2026-09-27", 9, 27, "sep-27-2026"),
    wagsMarket("wags-farmers-market-2026-10-11", 10, 11, "oct-11-2026"),
    wagsMarket("wags-farmers-market-2026-10-18", 10, 18, "oct-18-2026"),
    wagsMarket("wags-farmers-market-2026-10-25", 10, 25, "oct-25-2026"),
    demoEvent("wags-patio-horsham-2026-10-05", {
      title: "Wags Rescue Meet & Greet – The Patio of Horsham",
      slug: "wags-rescue-meet-greet-patio-horsham-oct-5-2026",
      partnerName: "Wags Rescue & Referral",
      shortDescription:
        "Meet adoptable dogs & puppies with food trucks and outdoor patio vibes. Tip: bring a friend — adoption apps can be started on site.",
      venueName: "The Patio of Horsham",
      addressLine1: "100 Lakeside Dr",
      city: "Horsham",
      state: "PA",
      postalCode: "19044",
      countyLabel: "Montgomery County",
      startAt: patioOct.startAt,
      endAt: patioOct.endAt,
      imageUrl: IMG.dogs,
      categories: ["Adoption", "Social"],
      isFree: true,
      eventUrl: "https://wagsrescue.org/event-calendar/",
      featuredStatus: "homepage",
    }),
    demoEvent("wags-bucks-fall-food-truck-2026-09-12", {
      title: "Wags Rescue at Bucks Fall Food Truck & Car Show",
      slug: "wags-bucks-fall-food-truck-car-show-sep-12-2026",
      partnerName: "Wags Rescue & Referral",
      shortDescription:
        "6th Annual Bucks Fall Food Truck & Car Show — meet Wags adoptable dogs, food trucks, live music, free petting zoo & kids activities.",
      venueName: "Warminster Community Park",
      addressLine1: "350 East Bristol Road",
      city: "Warminster",
      state: "PA",
      postalCode: "18974",
      countyLabel: "Bucks County",
      startAt: bucksFoodTruck.startAt,
      endAt: bucksFoodTruck.endAt,
      imageUrl: IMG.fair,
      categories: ["Adoption", "Festival"],
      isFree: true,
      eventUrl: "https://wagsrescue.org/events/bucks-fall-food-truck-car-show/",
      featuredStatus: "homepage",
    }),
    demoEvent("wags-pet-supplies-plus-southampton-2026-09-13", {
      title: "Wags Rescue Meet & Greet – Pet Supplies Plus Southampton",
      slug: "wags-pet-supplies-plus-southampton-sep-13-2026",
      partnerName: "Wags Rescue & Referral",
      shortDescription:
        "Meet adoptable dogs & puppies at Pet Supplies Plus. Tip: check Facebook for the attendee list before you go.",
      venueName: "Pet Supplies Plus Southampton",
      addressLine1: "488 2nd Street Pike",
      city: "Southampton",
      state: "PA",
      countyLabel: "Bucks County",
      startAt: petSuppliesPlus.startAt,
      endAt: petSuppliesPlus.endAt,
      imageUrl: IMG.dogs,
      categories: ["Adoption"],
      isFree: true,
      outdoor: false,
      eventUrl: "https://wagsrescue.org/events/pet-supplies-plus-warrington/",
      featuredStatus: "homepage",
    }),
    demoEvent("wags-cavalcade-corvettes-2026-09-19", {
      title: "Wags Rescue at Cavalcade of Corvettes",
      slug: "wags-cavalcade-of-corvettes-sep-19-2026",
      partnerName: "Wags Rescue & Referral",
      shortDescription:
        "Meet adoptable dogs at the Corvette Club of Delaware Valley show — cars, food, kids activities. Rain date Sept 26.",
      venueName: "Middle Bucks Institute of Technology",
      addressLine1: "2740 York Road",
      city: "Jamison",
      state: "PA",
      countyLabel: "Bucks County",
      startAt: corvettes.startAt,
      endAt: corvettes.endAt,
      imageUrl: IMG.outdoor,
      categories: ["Adoption", "Festival"],
      isFree: true,
      eventUrl:
        "https://wagsrescue.org/events/cavalcade-of-corvettes-meet-and-greet/",
      featuredStatus: "homepage",
    }),
    demoEvent("wags-paws-4-life-2026-10-03", {
      title: "Wags Rescue at Paws 4 Life Dog Walk",
      slug: "wags-paws-4-life-dog-walk-oct-3-2026",
      partnerName: "Wags Rescue & Referral",
      shortDescription:
        "Meet Wags rescue dogs & puppies at the Paws 4 Life Dog Walk. Tip: leashed friendly dogs welcome — confirm park rules on arrival.",
      venueName: "Warminster Community Park",
      addressLine1: "1100 Veterans Way",
      city: "Warminster",
      state: "PA",
      countyLabel: "Bucks County",
      startAt: paws4Life.startAt,
      endAt: paws4Life.endAt,
      imageUrl: IMG.outdoor,
      categories: ["Adoption", "Community"],
      isFree: true,
      eventUrl: "https://wagsrescue.org/events/paws-4-life-dog-walk/",
      featuredStatus: "homepage",
    }),
    demoEvent("family-pet-clinic-fall-fest-2026-10-24", {
      title: "Family Pet Clinic Fall Fest (with adoptable pets)",
      slug: "family-pet-clinic-fall-fest-oct-24-2026",
      partnerName: "Family Pet Clinic",
      shortDescription:
        "4th Annual Fall Fest — vendors, food truck, K9 demo, pet costume contest & adoptable pets. Pets on leash/carrier & vaccinated welcome.",
      venueName: "Family Pet Clinic",
      addressLine1: "1441 Bridgetown Pike",
      city: "Feasterville",
      state: "PA",
      countyLabel: "Bucks County",
      startAt: fallFest.startAt,
      endAt: fallFest.endAt,
      imageUrl: IMG.fair,
      categories: ["Festival", "Adoption"],
      isFree: true,
      eventUrl: "https://wagsrescue.org/events/family-pet-clinic-fall-fest/",
      featuredStatus: "homepage",
    }),
    demoEvent("bucks-spca-foster-training-2026-08-20", {
      title: "Bucks County SPCA Foster Training",
      slug: "bucks-county-spca-foster-training-aug-20-2026",
      partnerName: "Bucks County SPCA",
      shortDescription:
        "Learn to foster kittens, cats & other animals before adoption. Tip: complete online volunteer orientation first, then register for training.",
      venueName: "Bucks County SPCA (Quakertown)",
      city: "Quakertown",
      state: "PA",
      postalCode: "18951",
      countyLabel: "Bucks County",
      startAt: fosterAug20.startAt,
      endAt: fosterAug20.endAt,
      imageUrl: IMG.foster,
      categories: ["Education", "Adoption"],
      isFree: true,
      outdoor: false,
      eventUrl:
        "https://buckscountyspca.org/event/foster-training-32-3/2026-08-20/",
      featuredStatus: "homepage",
    }),
    demoEvent("bucks-spca-foster-training-2026-09-14", {
      title: "Bucks County SPCA Foster Training",
      slug: "bucks-county-spca-foster-training-sep-14-2026",
      partnerName: "Bucks County SPCA",
      shortDescription:
        "Next foster training session — help animals who need temporary care. Tip: finish online orientation before signing up.",
      venueName: "Bucks County SPCA (Quakertown)",
      city: "Quakertown",
      state: "PA",
      postalCode: "18951",
      countyLabel: "Bucks County",
      startAt: fosterSep14.startAt,
      endAt: fosterSep14.endAt,
      imageUrl: IMG.foster,
      categories: ["Education", "Adoption"],
      isFree: true,
      outdoor: false,
      eventUrl:
        "https://buckscountyspca.org/event/foster-training-32-3/2026-09-14/",
      featuredStatus: "homepage",
    }),
    demoEvent("buc-le-aero-flyin-2026-08-22", {
      title: "Buc-Le Aero Sportsmen Giant Scale RC Fly-in",
      slug: "buc-le-aero-giant-scale-rc-fly-in-aug-22-2026",
      partnerName: "Buc-Le Aero Sportsmen",
      shortDescription:
        "Free public giant-scale RC aircraft fly-in in Quakertown (listed via Bucks County SPCA community calendar). Tip: confirm pet rules on-site.",
      venueName: "John P. Fritzges Memorial Flying Field",
      city: "Quakertown",
      state: "PA",
      postalCode: "18951",
      countyLabel: "Bucks County",
      startAt: rcFlyin22.startAt,
      endAt: rcFlyin22.endAt,
      imageUrl: IMG.outdoor,
      categories: ["Community", "Festival"],
      isFree: true,
      featuredStatus: "community",
    }),
    demoEvent("buc-le-aero-flyin-2026-08-23", {
      title: "Buc-Le Aero Sportsmen Giant Scale RC Fly-in",
      slug: "buc-le-aero-giant-scale-rc-fly-in-aug-23-2026",
      partnerName: "Buc-Le Aero Sportsmen",
      shortDescription:
        "Day two of the free public giant-scale RC fly-in. Tip: bring sun protection for outdoor viewing.",
      venueName: "John P. Fritzges Memorial Flying Field",
      city: "Quakertown",
      state: "PA",
      postalCode: "18951",
      countyLabel: "Bucks County",
      startAt: rcFlyin23.startAt,
      endAt: rcFlyin23.endAt,
      imageUrl: IMG.outdoor,
      categories: ["Community", "Festival"],
      isFree: true,
      featuredStatus: "community",
    }),
    demoEvent("fmca-adoption-2026-09-12", {
      title: "FMCA Adoption Event – BlackRock Center for the Arts",
      slug: "fmca-adoption-black-rock-sep-12-2026",
      partnerName: "Friends of Montgomery County Animals",
      shortDescription:
        "Special cat & kitten adoption event at the BlackRock Artisans Market. Tip: bring a soft carrier if you're ready to adopt.",
      venueName: "BlackRock Center for the Arts",
      addressLine1: "19830 Century Blvd",
      city: "Germantown",
      state: "MD",
      postalCode: "20874",
      countyLabel: "Montgomery County (MD)",
      startAt: fmcaSep.startAt,
      endAt: fmcaSep.endAt,
      imageUrl: IMG.cats,
      categories: ["Adoption"],
      isFree: true,
      outdoor: false,
      eventUrl: "https://www.fmca.org",
      featuredStatus: "homepage",
    }),
    demoEvent("fmca-adoption-2026-10-10", {
      title: "FMCA Adoption Event – BlackRock Center for the Arts",
      slug: "fmca-adoption-black-rock-oct-10-2026",
      partnerName: "Friends of Montgomery County Animals",
      shortDescription:
        "Monthly FMCA adoption gathering with adoptable cats and kittens. Tip: follow FMCA for last-minute pet highlights.",
      venueName: "BlackRock Center for the Arts",
      addressLine1: "19830 Century Blvd",
      city: "Germantown",
      state: "MD",
      postalCode: "20874",
      countyLabel: "Montgomery County (MD)",
      startAt: fmcaOct.startAt,
      endAt: fmcaOct.endAt,
      imageUrl: IMG.cats,
      categories: ["Adoption"],
      isFree: true,
      outdoor: false,
      eventUrl: "https://www.fmca.org",
      featuredStatus: "homepage",
    }),
    demoEvent("fmca-adoption-2026-11-14", {
      title: "FMCA Adoption Event – BlackRock Center for the Arts",
      slug: "fmca-adoption-black-rock-nov-14-2026",
      partnerName: "Friends of Montgomery County Animals",
      shortDescription:
        "Fall FMCA adoption event featuring adoptable cats and kittens. Tip: ask about bonded pairs.",
      venueName: "BlackRock Center for the Arts",
      addressLine1: "19830 Century Blvd",
      city: "Germantown",
      state: "MD",
      postalCode: "20874",
      countyLabel: "Montgomery County (MD)",
      startAt: fmcaNov.startAt,
      endAt: fmcaNov.endAt,
      imageUrl: IMG.cats,
      categories: ["Adoption"],
      isFree: true,
      outdoor: false,
      eventUrl: "https://www.fmca.org",
      featuredStatus: "homepage",
    }),
    demoEvent("fmca-adoption-2026-12-12", {
      title: "FMCA Adoption Event – BlackRock Center for the Arts",
      slug: "fmca-adoption-black-rock-dec-12-2026",
      partnerName: "Friends of Montgomery County Animals",
      shortDescription:
        "Holiday-season FMCA adoption event with adoptable cats and kittens.",
      venueName: "BlackRock Center for the Arts",
      addressLine1: "19830 Century Blvd",
      city: "Germantown",
      state: "MD",
      postalCode: "20874",
      countyLabel: "Montgomery County (MD)",
      startAt: fmcaDec.startAt,
      endAt: fmcaDec.endAt,
      imageUrl: IMG.cats,
      categories: ["Adoption"],
      isFree: true,
      outdoor: false,
      eventUrl: "https://www.fmca.org",
      featuredStatus: "homepage",
    }),
    demoEvent("fmca-adopt-and-shop-2026", {
      title: "Adopt and Shop!",
      slug: "fmca-adopt-and-shop-2026",
      partnerName: "Friends of Montgomery County Animals",
      shortDescription:
        "Annual FMCA rescue & adoption event connecting the community with adoptable pets. Tip: bring a checklist for your new pet.",
      venueName: "Montgomery County, MD",
      city: "Germantown",
      state: "MD",
      countyLabel: "Montgomery County (MD)",
      startAt: adoptAndShop.startAt,
      endAt: adoptAndShop.endAt,
      imageUrl: IMG.shop,
      categories: ["Adoption", "Festival"],
      isFree: true,
      eventUrl: "https://www.fmca.org",
      featuredStatus: "homepage",
    }),
    demoEvent("montgomery-spca-adoption-hours", {
      title: "Montgomery County SPCA – Adoption Hours",
      slug: "montgomery-county-spca-adoption-hours",
      partnerName: "Montgomery County SPCA",
      shortDescription:
        "Regular adoption hours Mon–Fri 11 AM–5 PM and Sat–Sun 10 AM–4 PM, plus occasional pet fairs & volunteer opportunities. Tip: call ahead for available pets.",
      venueName: "Montgomery County SPCA",
      city: "Conshohocken",
      state: "PA",
      countyLabel: "Montgomery County",
      startAt: montcoHours.startAt,
      endAt: montcoHours.endAt,
      imageUrl: IMG.spca,
      categories: ["Adoption"],
      isFree: true,
      outdoor: false,
      eventUrl: "https://www.montgomerycountyspca.org",
      featuredStatus: "community",
    }),
  ];
}

/** Upcoming curated cards only (start_at >= ~now), soonest first. */
export function getUpcomingCuratedBucksMontgomeryPetEvents(
  now = new Date(),
): CommunityEventWithPartner[] {
  const cutoff = now.getTime() - 2 * 3600_000;
  return getCuratedBucksMontgomeryPetEvents()
    .filter((event) => new Date(event.start_at).getTime() >= cutoff)
    .sort(
      (a, b) =>
        new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    );
}

/** Homepage / community banner curated listings. */
export function getHomepageDemoEvents(
  locationLabel = "Bucks & Montgomery Counties, PA",
) {
  const upcoming = getUpcomingCuratedBucksMontgomeryPetEvents();
  const fallback = getCuratedBucksMontgomeryPetEvents().sort(
    (a, b) =>
      new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );
  const list = upcoming.length ? upcoming : fallback;

  return {
    featured: list[0] || null,
    upcoming: list.slice(1),
    locationLabel,
    previewMode: true as const,
  };
}

export function getCommunityBannerDemoEvents() {
  const { featured, upcoming } = getHomepageDemoEvents();
  return featured ? [featured, ...upcoming] : upcoming;
}

/** Markdown digest of curated Bucks/Montgomery events for Delilah. */
export function buildCuratedBucksMontgomeryEventsMarkdown(
  now = new Date(),
): string {
  const events = getCuratedBucksMontgomeryPetEvents().sort(
    (a, b) =>
      new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );
  const lines = [
    "# CURATED BUCKS & MONTGOMERY COUNTY PET EVENTS",
    "_Authoritative curated listings for Delilah (Wags, BCSPCA, FMCA, Clear the Shelters, Hart 2 Heart, and more). Quote these details when guests ask about local pet events._",
    "",
  ];

  for (const event of events) {
    const start = new Date(event.start_at);
    const end = event.end_at ? new Date(event.end_at) : null;
    const status =
      start.getTime() + 2 * 3600_000 < now.getTime() ? "past/recent" : "upcoming";
    lines.push(`### ${event.title}`);
    lines.push(`- Status: ${status}`);
    lines.push(
      `- When (ET): ${start.toLocaleString("en-US", { timeZone: "America/New_York" })} → ${
        end
          ? end.toLocaleString("en-US", { timeZone: "America/New_York" })
          : "TBA"
      }`,
    );
    lines.push(
      `- Where: ${[event.venue_name, event.address_line_1, event.city, event.state].filter(Boolean).join(", ")}`,
    );
    lines.push(`- County focus: ${event.featured_market_city || event.city}`);
    lines.push(`- Host: ${event.partners?.business_name || "Local partner"}`);
    lines.push(`- Free: ${event.is_free ? "yes" : "see listing"}`);
    if (event.short_description) lines.push(`- Details: ${event.short_description}`);
    if (event.event_url) lines.push(`- More info: ${event.event_url}`);
    lines.push(`- SitGuru slug: ${event.slug}`);
    lines.push("");
  }

  lines.push("ATTENDING TIPS:");
  lines.push(
    "- Confirm hours on the organizer site the day of (Wags, FMCA, SPCA, Women's Animal Center).",
  );
  lines.push(
    "- Bring a leash/carrier, ID, and questions about foster vs adopt.",
  );
  lines.push(
    "- Use SitGuru Attending? Yes / Maybe / No on cards so hosts see interest.",
  );
  lines.push(
    "- Pet Event Planners & Managers: publish lasting Partner Events via /events/host.",
  );
  lines.push(
    "- Source calendars: https://wagsrescue.org/event-calendar/ · https://buckscountyspca.org/events/ · https://www.fmca.org",
  );

  return lines.join("\n").trim();
}
