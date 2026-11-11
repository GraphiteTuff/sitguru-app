/**
 * Clearly marked DEMO placeholders for local/dev when DB has no published
 * Reads content yet. Not permanent production endorsements of real authors.
 */

import { READS_TEAM_AVATARS } from "@/lib/reads/team";
import type {
  ReadsContentDetail,
  ReadsTeamMember,
  ReadsTeamPick,
  ReadsTopic,
} from "./types";

export const READS_DEMO_BANNER =
  "Demo placeholders — not permanent SitGuru endorsements. Replace with approved partner content.";

export const DEMO_TOPICS: ReadsTopic[] = [
  {
    id: "demo-topic-dog-training",
    slug: "dog-training-behavior",
    name: "Dog Training & Behavior",
    description: "Training fundamentals and behavior support for dogs.",
    audience: ["pet_parent", "guru"],
    display_order: 10,
    is_active: true,
  },
  {
    id: "demo-topic-cats",
    slug: "cats-cat-behavior",
    name: "Cats & Cat Behavior",
    description: "Cat care, enrichment, and behavior guidance.",
    audience: ["pet_parent", "guru"],
    display_order: 20,
    is_active: true,
  },
  {
    id: "demo-topic-health",
    slug: "pet-health-first-aid",
    name: "Pet Health & First Aid",
    description: "Health literacy and emergency readiness for pets.",
    audience: ["pet_parent", "guru"],
    display_order: 30,
    is_active: true,
  },
  {
    id: "demo-topic-enrichment",
    slug: "enrichment-activities",
    name: "Enrichment & Activities",
    description: "Play, enrichment, and everyday activities.",
    audience: ["pet_parent", "guru"],
    display_order: 50,
    is_active: true,
  },
  {
    id: "demo-topic-guru-dev",
    slug: "guru-professional-development",
    name: "Guru Professional Development",
    description: "Skills for professional pet caregivers.",
    audience: ["guru"],
    display_order: 100,
    is_active: true,
  },
];

export const DEMO_TEAM: ReadsTeamMember[] = [
  {
    id: "demo-tm-jason",
    user_id: null,
    slug: "jason-graff",
    full_name: "Jason Graff",
    role_label: "Co-Founder",
    avatar_url: READS_TEAM_AVATARS["jason-graff"],
    display_order: 10,
    is_active: true,
  },
  {
    id: "demo-tm-danette",
    user_id: null,
    slug: "danette-graff",
    full_name: "Danette Graff",
    role_label: "Co-Founder",
    avatar_url: READS_TEAM_AVATARS["danette-graff"],
    display_order: 20,
    is_active: true,
  },
  {
    id: "demo-tm-ava",
    user_id: null,
    slug: "ava-venezia",
    full_name: "Ava Venezia",
    role_label: "Social Media & Community Growth Manager",
    avatar_url: READS_TEAM_AVATARS["ava-venezia"],
    display_order: 30,
    is_active: true,
  },
  {
    id: "demo-tm-ryan",
    user_id: null,
    slug: "ryan-manibo",
    full_name: "Ryan Manibo",
    role_label: "Intern — Penn State",
    avatar_url: READS_TEAM_AVATARS["ryan-manibo"],
    display_order: 40,
    is_active: true,
  },
  {
    id: "demo-tm-lola",
    user_id: null,
    slug: "lola-uhl",
    full_name: "Lola Uhl",
    role_label: "Intern — Saint Joseph's University",
    avatar_url: READS_TEAM_AVATARS["lola-uhl"],
    display_order: 50,
    is_active: true,
  },
];

function baseContent(
  partial: Partial<ReadsContentDetail> &
    Pick<ReadsContentDetail, "id" | "slug" | "title" | "content_type">,
): ReadsContentDetail {
  const now = new Date().toISOString();
  return {
    subtitle: null,
    description: null,
    editorial_summary: null,
    why_recommended: null,
    status: "published",
    visibility: "public",
    featured: false,
    feature_type: null,
    disclosure_label: "sitguru_recommended",
    image_url: null,
    thumbnail_url: null,
    external_url: null,
    affiliate_disclosure: null,
    audience: ["pet_parent"],
    tags: ["demo"],
    created_by: null,
    assigned_manager_id: null,
    assigned_intern_id: null,
    published_at: now,
    scheduled_at: null,
    review_note: null,
    created_at: now,
    updated_at: now,
    topics: [],
    related: [],
    team_picks: [],
    ...partial,
  };
}

const FOREVER_DOG_COVER = "/images/reads/covers/the-forever-dog.png";
const FOREVER_DOG_PURCHASE_URL = "https://www.amazon.com/dp/0063002604";
const KAREN_SHAW_BECKER_URL =
  "https://www.amazon.com/stores/Karen-Shaw-Becker/author/B08Z6DB717?ref=ap_rdr&shoppingPortalEnabled=true";

export const DEMO_CONTENT: ReadsContentDetail[] = [
  baseContent({
    id: "demo-book-the-forever-dog",
    slug: "the-forever-dog",
    title: "The Forever Dog",
    subtitle:
      "Surprising New Science to Help Your Canine Companion Live Younger, Healthier & Longer",
    content_type: "book",
    featured: true,
    feature_type: "book_of_the_month",
    description:
      "A #1 New York Times bestselling dog-care guide from Rodney Habib and Dr. Karen Shaw Becker (with Kristin Loberg) on helping dogs live younger, healthier, and longer.",
    editorial_summary:
      "Jason’s favorite book — practical longevity science for Pet Parents who want more healthy years with their dogs.",
    why_recommended:
      "Clear, research-backed habits Pet Parents can use to support canine healthspan.",
    image_url: FOREVER_DOG_COVER,
    thumbnail_url: FOREVER_DOG_COVER,
    external_url: FOREVER_DOG_PURCHASE_URL,
    tags: ["dogs", "health", "team-pick", "jason"],
    audience: ["pet_parent", "guru"],
    book: {
      content_id: "demo-book-the-forever-dog",
      author_name: "Rodney Habib & Dr. Karen Shaw Becker",
      publisher: "Harper",
      publication_date: "2021-10-12",
      isbn: "978-0063002609",
      page_count: 464,
      language: "en",
      cover_image_url: FOREVER_DOG_COVER,
      purchase_url: FOREVER_DOG_PURCHASE_URL,
    },
    topics: [DEMO_TOPICS[2]],
  }),
  baseContent({
    id: "demo-book-puppy-foundations",
    slug: "demo-puppy-foundations-handbook",
    title: "Demo: Puppy Foundations Handbook",
    subtitle: "A SitGuru sample title for development",
    content_type: "book",
    featured: false,
    feature_type: null,
    description:
      "Demo placeholder summarizing positive puppy routines for new Pet Parents.",
    editorial_summary:
      "Sample SitGuru editorial summary used only for UI development.",
    why_recommended:
      "Demo reason: helps Pet Parents practice short, consistent training sessions.",
    tags: ["demo", "dogs", "training"],
    audience: ["pet_parent", "guru"],
    book: {
      content_id: "demo-book-puppy-foundations",
      author_name: "SitGuru Demo Author",
      publisher: "SitGuru Demo Press",
      publication_date: "2024-01-01",
      isbn: null,
      page_count: 180,
      language: "en",
      cover_image_url: null,
      purchase_url: null,
    },
    topics: [DEMO_TOPICS[0]],
  }),
  baseContent({
    id: "demo-mag-pet-wellness",
    slug: "demo-pet-wellness-quarterly",
    title: "Demo: Pet Wellness Quarterly",
    content_type: "magazine",
    featured: true,
    feature_type: "magazine_spotlight",
    description:
      "Demo publication spotlight for health and enrichment themes.",
    editorial_summary: "Sample magazine spotlight for layout testing.",
    why_recommended: "Demo reason: clear seasonal wellness topics for families.",
    tags: ["demo", "health"],
    publication: {
      content_id: "demo-mag-pet-wellness",
      publication_name: "Demo Pet Wellness Quarterly",
      publication_type: "health",
      logo_url: null,
      website_url: null,
      issue_label: "Sample Issue",
      issue_date: "2025-06-01",
      partnership_status: "none",
    },
    topics: [DEMO_TOPICS[2]],
  }),
  baseContent({
    id: "demo-podcast-calm-homes",
    slug: "demo-calm-homes-with-guest",
    title: "Demo: Calm Homes with Guest Experts",
    content_type: "podcast",
    featured: true,
    feature_type: "featured_podcast",
    description:
      "Demo episode about separation anxiety and enrichment for busy households.",
    editorial_summary: "Sample podcast episode for player layout testing.",
    tags: ["demo", "behavior"],
    podcast: {
      content_id: "demo-podcast-calm-homes",
      show_name: "SitGuru Demo Conversations",
      guest_name: "Demo Guest Expert",
      guest_title: "Certified Trainer (Demo)",
      episode_artwork_url: null,
      duration_seconds: 32 * 60,
      audio_embed_url: null,
      youtube_video_id: null,
      publish_date: "2025-09-01",
      is_sitguru_original: true,
    },
    topics: [DEMO_TOPICS[0], DEMO_TOPICS[3]],
  }),
  baseContent({
    id: "demo-video-enrichment",
    slug: "demo-five-minute-enrichment",
    title: "Demo: Five-Minute Enrichment Ideas",
    content_type: "video",
    featured: true,
    feature_type: "featured_video",
    description: "Demo YouTube-curated enrichment tips for Pet Parents.",
    editorial_summary: "Sample video page for embed testing.",
    tags: ["demo", "enrichment"],
    video: {
      content_id: "demo-video-enrichment",
      youtube_video_id: null,
      youtube_channel_id: null,
      youtube_url: "https://www.youtube.com/@SitGuruOfficial",
      duration_seconds: 420,
      publish_date: "2025-08-01",
      guest_name: null,
      import_source: "seed",
      import_status: "ready",
    },
    topics: [DEMO_TOPICS[3]],
  }),
  baseContent({
    id: "demo-author-guest",
    slug: "demo-guest-expert",
    title: "Demo Guest Expert",
    content_type: "author",
    featured: true,
    feature_type: "featured_author",
    description: "Demo author/expert profile for layout testing.",
    editorial_summary: "Sample biography for author detail pages.",
    tags: ["demo", "expert"],
    person: {
      content_id: "demo-author-guest",
      person_type: "trainer",
      credentials: "Demo credentials only",
      organization: "SitGuru Demo Collective",
      biography:
        "This is a placeholder expert profile used for development. Replace with approved partner bios.",
      website_url: null,
      headshot_url: null,
      social_links: {},
      partnership_status: "none",
      upcoming_appearances: null,
    },
    topics: [DEMO_TOPICS[0]],
  }),
  baseContent({
    id: "demo-author-karen-shaw-becker",
    slug: "karen-shaw-becker",
    title: "Dr. Karen Shaw Becker",
    content_type: "author",
    featured: false,
    feature_type: null,
    description:
      "Integrative veterinarian and co-author of The Forever Dog, focused on proactive pet wellness and longevity.",
    editorial_summary:
      "Co-author of Jason’s favorite book, The Forever Dog.",
    tags: ["author", "health", "dogs"],
    audience: ["pet_parent", "guru"],
    external_url: KAREN_SHAW_BECKER_URL,
    person: {
      content_id: "demo-author-karen-shaw-becker",
      person_type: "veterinarian",
      credentials: "DVM",
      organization: null,
      biography:
        "Dr. Karen Shaw Becker is an integrative veterinarian and co-author of The Forever Dog with Rodney Habib (with Kristin Loberg).",
      website_url: KAREN_SHAW_BECKER_URL,
      headshot_url: null,
      social_links: { amazon_author: KAREN_SHAW_BECKER_URL },
      partnership_status: "none",
      upcoming_appearances: null,
    },
    topics: [DEMO_TOPICS[2]],
  }),
  baseContent({
    id: "demo-author-rodney-habib",
    slug: "rodney-habib",
    title: "Rodney Habib",
    content_type: "author",
    featured: false,
    feature_type: null,
    description:
      "Pet-health educator and co-author of The Forever Dog, known for translating longevity science for everyday Pet Parents.",
    editorial_summary:
      "Co-author of Jason’s favorite book, The Forever Dog.",
    tags: ["author", "health", "dogs"],
    audience: ["pet_parent", "guru"],
    person: {
      content_id: "demo-author-rodney-habib",
      person_type: "author",
      credentials: null,
      organization: null,
      biography:
        "Rodney Habib is a pet-health educator and co-author of The Forever Dog with Dr. Karen Shaw Becker (with Kristin Loberg).",
      website_url: null,
      headshot_url: null,
      social_links: {},
      partnership_status: "none",
      upcoming_appearances: null,
    },
    topics: [DEMO_TOPICS[2]],
  }),
];

/** Indices into DEMO_CONTENT for stable team-pick wiring. */
const DEMO_FOREVER_DOG = DEMO_CONTENT[0];
const DEMO_PUPPY_BOOK = DEMO_CONTENT[1];
const DEMO_PODCAST = DEMO_CONTENT[3];
const DEMO_VIDEO = DEMO_CONTENT[4];
const DEMO_GUEST_AUTHOR = DEMO_CONTENT[5];

export const DEMO_TEAM_PICKS: ReadsTeamPick[] = [
  {
    id: "demo-pick-jason-forever-dog",
    team_member_id: "demo-tm-jason",
    content_id: DEMO_FOREVER_DOG.id,
    recommendation_type: "favorite_book",
    quote:
      "This is my favorite book — science-backed habits that help dogs live younger, healthier, and longer.",
    display_order: 10,
    featured: true,
    is_active: true,
    published_at: new Date().toISOString(),
    team_member: DEMO_TEAM[0],
    content: DEMO_FOREVER_DOG,
  },
  {
    id: "demo-pick-ava-book",
    team_member_id: "demo-tm-ava",
    content_id: DEMO_PUPPY_BOOK.id,
    recommendation_type: "favorite_book",
    quote:
      "Demo quote: Clear, practical puppy routines Pet Parents can actually stick with.",
    display_order: 20,
    featured: true,
    is_active: true,
    published_at: new Date().toISOString(),
    team_member: DEMO_TEAM[2],
    content: DEMO_PUPPY_BOOK,
  },
  {
    id: "demo-pick-ryan-podcast",
    team_member_id: "demo-tm-ryan",
    content_id: DEMO_PODCAST.id,
    recommendation_type: "favorite_podcast",
    quote:
      "Demo quote: Great listen for families juggling work and restless pets.",
    display_order: 30,
    featured: true,
    is_active: true,
    published_at: new Date().toISOString(),
    team_member: DEMO_TEAM[3],
    content: DEMO_PODCAST,
  },
  {
    id: "demo-pick-lola-video",
    team_member_id: "demo-tm-lola",
    content_id: DEMO_VIDEO.id,
    recommendation_type: "favorite_video",
    quote: "Demo quote: Short enrichment ideas that feel doable on busy days.",
    display_order: 40,
    featured: true,
    is_active: true,
    published_at: new Date().toISOString(),
    team_member: DEMO_TEAM[4],
    content: DEMO_VIDEO,
  },
  {
    id: "demo-pick-danette-author",
    team_member_id: "demo-tm-danette",
    content_id: DEMO_GUEST_AUTHOR.id,
    recommendation_type: "additional",
    quote: "Demo quote: Warm expert voices help Pet Parents feel supported.",
    display_order: 50,
    featured: true,
    is_active: true,
    published_at: new Date().toISOString(),
    team_member: DEMO_TEAM[1],
    content: DEMO_GUEST_AUTHOR,
  },
];

export function isDemoContentId(id: string) {
  return id.startsWith("demo-");
}
