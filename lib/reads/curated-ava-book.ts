import type {
  ReadsContentDetail,
  ReadsSearchFilters,
  ReadsTeamMember,
  ReadsTeamPick,
} from "./types";

/**
 * Editor-approved public book selection. This is deliberately not a demo
 * placeholder, and it remains visible if the Reads database already contains
 * other published items. It does not change any Supabase records.
 *
 * If an identically slugged book is published through Reads Studio later, the
 * database-backed version wins in the public listings.
 */
export const AVA_BOOK_AUTHOR_BIO =
  "Patricia B. McConnell, Ph.D., CAAB, is an ethologist and certified applied animal behaviorist known for translating animal behavior science into compassionate, practical guidance. She taught about human–animal relationships at the University of Wisconsin–Madison, hosted the nationally syndicated radio show Calling All Pets, and contributed to Animal Planet’s Petline. The author of numerous books on animal behavior and training, she helps dog lovers better recognize canine communication and build stronger relationships with their companions.";

export const AVA_BOOK_SLUG = "the-other-end-of-the-leash";
export const AVA_BOOK_ID = "editorial-book-the-other-end-of-the-leash";
const BOOK_COVER = "/images/reads/covers/the-other-end-of-the-leash-ava.webp";
const PUBLISHED_AT = "2026-11-12T23:00:00.000Z";

export const AVA_BOOK: ReadsContentDetail = {
  id: AVA_BOOK_ID,
  slug: AVA_BOOK_SLUG,
  title: "The Other End of the Leash",
  subtitle: "Why We Do What We Do Around Dogs",
  description:
    "Ethologist and certified applied animal behaviorist Patricia B. McConnell, Ph.D., draws on decades of work with dogs and their people to explain how human behavior influences canine communication. Her experience as an educator, author, and animal behavior consultant connects the science of animal behavior with practical insights for dog lovers.",
  editorial_summary:
    "Ava’s Pick — a thoughtful, compassionate look at the ways humans and dogs communicate, and how understanding the world from a dog’s perspective can strengthen the bond we share.",
  why_recommended:
    "A useful read for Pet Parents and Gurus who want to better understand canine body language, communicate more clearly, and approach pet care with empathy and science-informed insight.",
  content_type: "book",
  status: "published",
  visibility: "public",
  featured: false,
  feature_type: null,
  disclosure_label: "sitguru_recommended",
  image_url: BOOK_COVER,
  thumbnail_url: BOOK_COVER,
  external_url: null,
  affiliate_disclosure: null,
  audience: ["pet_parent", "guru"],
  tags: ["dogs", "dog behavior", "training", "communication", "team-pick", "ava"],
  created_by: null,
  assigned_manager_id: null,
  assigned_intern_id: null,
  published_at: PUBLISHED_AT,
  scheduled_at: null,
  review_note: null,
  created_at: PUBLISHED_AT,
  updated_at: PUBLISHED_AT,
  book: {
    content_id: AVA_BOOK_ID,
    author_name: "Patricia B. McConnell, Ph.D.",
    publisher: "Ballantine Books",
    publication_date: "2003-04-29",
    isbn: "9780345446787",
    page_count: 272,
    language: "en",
    cover_image_url: BOOK_COVER,
    purchase_url: null,
  },
  topics: [
    {
      id: "editorial-topic-dog-training",
      slug: "dog-training-behavior",
      name: "Dog Training & Behavior",
      description: "Training fundamentals and behavior support for dogs.",
      audience: ["pet_parent", "guru"],
      display_order: 10,
      is_active: true,
    },
  ],
  related: [],
  team_picks: [],
};

export function isAvaBook(type: string, slug: string) {
  return type === "book" && slug === AVA_BOOK_SLUG;
}

/**
 * Add this approved pick to live or fallback listings, without manufacturing
 * a database row or displacing existing book-of-the-month selections.
 */
export function mergeAvaBook(
  rows: ReadsContentDetail[],
  filters: ReadsSearchFilters = {},
): ReadsContentDetail[] {
  if (filters.featured || (filters.offset ?? 0) > 0) return rows;
  if (filters.format && filters.format !== "all" && filters.format !== "book") return rows;
  if (filters.audience && !AVA_BOOK.audience.includes(filters.audience)) return rows;
  if (filters.topic && !AVA_BOOK.topics?.some((topic) => topic.slug === filters.topic)) return rows;
  if (filters.q) {
    const query = filters.q.trim().toLowerCase();
    const searchable = [
      AVA_BOOK.title,
      AVA_BOOK.subtitle,
      AVA_BOOK.description,
      AVA_BOOK.editorial_summary,
      AVA_BOOK.book?.author_name,
    ].join(" ").toLowerCase();
    if (query && !searchable.includes(query)) return rows;
  }
  if (rows.some((row) => row.content_type === "book" && row.slug === AVA_BOOK_SLUG)) {
    return rows;
  }
  // Keep the first book in place (Jason's existing favorite/featured book).
  const firstBookIndex = rows.findIndex((row) => row.content_type === "book");
  const insertAt = firstBookIndex >= 0 ? firstBookIndex + 1 : rows.length;
  const result = [...rows];
  result.splice(insertAt, 0, AVA_BOOK);
  return result.slice(0, filters.limit ?? 48);
}

export function createAvaBookPick(member: ReadsTeamMember): ReadsTeamPick {
  return {
    id: "editorial-pick-ava-other-end-of-the-leash",
    team_member_id: member.id,
    content_id: AVA_BOOK_ID,
    recommendation_type: "favorite_book",
    // No invented first-person quote attributed to Ava.
    quote: "",
    display_order: 0,
    featured: true,
    is_active: true,
    published_at: PUBLISHED_AT,
    team_member: member,
    content: AVA_BOOK,
  };
}

export function mergeAvaBookPick(
  picks: ReadsTeamPick[],
  avaMember: ReadsTeamMember,
): ReadsTeamPick[] {
  const withoutObsoleteDemo = picks.filter((item) => item.id !== "demo-pick-ava-book");
  if (
    withoutObsoleteDemo.some((item) =>
      item.team_member?.slug === avaMember.slug &&
      item.content?.content_type === "book" &&
      item.content?.slug === AVA_BOOK_SLUG,
    )
  ) {
    return withoutObsoleteDemo;
  }
  return [...withoutObsoleteDemo, createAvaBookPick(avaMember)];
}
