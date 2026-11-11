import type { ReadsContentType } from "./types";

export type ReadsCategoryKey =
  | "books"
  | "magazines"
  | "podcasts"
  | "videos"
  | "authors"
  | "team-picks"
  | "guru-picks"
  | "pet-parent-picks";

export type ReadsRecommendationSource = "team" | "guru" | "pet_parent";

export type CategoryFilterChip = {
  label: string;
  param: string;
  value: string;
};

export type ReadsCategoryConfig = {
  key: ReadsCategoryKey;
  href: string;
  label: string;
  navLabel: string;
  format?: ReadsContentType | "author";
  recommendationSource?: ReadsRecommendationSource;
  eyebrow: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  filters: CategoryFilterChip[];
  featuredHeading: string;
  emptyHint: string;
};

export const READS_PRIMARY_PILLS = [
  { href: "/reads/books", label: "Browse Books" },
  { href: "/reads/magazines", label: "Browse Magazines" },
  { href: "/reads/podcasts", label: "Listen to Podcasts" },
] as const;

export const READS_CATEGORY_CONFIG: Record<
  ReadsCategoryKey,
  ReadsCategoryConfig
> = {
  books: {
    key: "books",
    href: "/reads/books",
    label: "Books",
    navLabel: "Books",
    format: "book",
    eyebrow: "SitGuru Reads",
    title: "Browse trusted pet books",
    description:
      "Featured titles, category browsing, Team Picks, community recommendations, and full book details for Pet Parents and Gurus.",
    searchPlaceholder: "Search books, authors, topics…",
    filters: [
      { label: "Featured", param: "featured", value: "1" },
      { label: "Dog Training", param: "topic", value: "dog-training-behavior" },
      { label: "Cat Care", param: "topic", value: "cats-cat-behavior" },
      { label: "Pet Health", param: "topic", value: "pet-health-first-aid" },
      { label: "Enrichment", param: "topic", value: "enrichment-activities" },
    ],
    featuredHeading: "Featured books",
    emptyHint: "New books are reviewed before they appear here.",
  },
  magazines: {
    key: "magazines",
    href: "/reads/magazines",
    label: "Magazines",
    navLabel: "Magazines",
    format: "magazine",
    eyebrow: "Pet magazine newsstand",
    title: "Explore the pet magazine newsstand",
    description:
      "Featured publications, dog and cat magazines, wellness titles, latest issues, and publisher links curated for SitGuru.",
    searchPlaceholder: "Search magazines, publishers, topics, or articles…",
    filters: [
      { label: "Dog Magazines", param: "segment", value: "dog" },
      { label: "Cat Magazines", param: "segment", value: "cat" },
      { label: "Pet Wellness", param: "segment", value: "health" },
      { label: "Training & Behavior", param: "segment", value: "training" },
      { label: "Latest Featured Issues", param: "featured", value: "1" },
    ],
    featuredHeading: "Featured magazines",
    emptyHint: "Publication spotlights publish after editorial review.",
  },
  podcasts: {
    key: "podcasts",
    href: "/reads/podcasts",
    label: "Podcasts",
    navLabel: "Podcasts",
    format: "podcast",
    eyebrow: "Audio podcasts",
    title: "Listen to pet-care podcasts",
    description:
      "Featured episodes, embedded players, SitGuru originals, pet-care topics, and podcast partner spotlights.",
    searchPlaceholder: "Search episodes, shows, guests, or topics…",
    filters: [
      { label: "Featured Episodes", param: "featured", value: "1" },
      { label: "SitGuru Originals", param: "segment", value: "original" },
      { label: "Training & Behavior", param: "topic", value: "dog-training-behavior" },
      { label: "Enrichment", param: "topic", value: "enrichment-activities" },
      { label: "Pet Health", param: "topic", value: "pet-health-first-aid" },
    ],
    featuredHeading: "Featured episodes",
    emptyHint: "Episodes appear after import review and publish approval.",
  },
  videos: {
    key: "videos",
    href: "/reads/videos",
    label: "Videos",
    navLabel: "Videos",
    format: "video",
    eyebrow: "Watch & learn",
    title: "Curated pet-care videos",
    description:
      "SitGuru acts as a discovery layer for approved YouTube learning — featured clips, topics, and creator spotlights.",
    searchPlaceholder: "Search videos, creators, or topics…",
    filters: [
      { label: "Featured", param: "featured", value: "1" },
      { label: "Training", param: "topic", value: "dog-training-behavior" },
      { label: "Enrichment", param: "topic", value: "enrichment-activities" },
      { label: "Health", param: "topic", value: "pet-health-first-aid" },
    ],
    featuredHeading: "Featured videos",
    emptyHint: "YouTube imports stay in needs-review until staff approve them.",
  },
  authors: {
    key: "authors",
    href: "/reads/authors",
    label: "Authors",
    navLabel: "Authors",
    format: "author",
    eyebrow: "Voices & experts",
    title: "Authors, veterinarians, and pet experts",
    description:
      "Meet the people behind trusted pet books, magazines, podcasts, and guides — with credentials and related works.",
    searchPlaceholder: "Search authors, experts, or credentials…",
    filters: [
      { label: "Featured", param: "featured", value: "1" },
      { label: "Veterinarians", param: "segment", value: "veterinarian" },
      { label: "Trainers", param: "segment", value: "trainer" },
      { label: "Authors", param: "segment", value: "author" },
    ],
    featuredHeading: "Featured voices",
    emptyHint: "Expert profiles publish after disclosure and editorial review.",
  },
  "team-picks": {
    key: "team-picks",
    href: "/reads/team-picks",
    label: "Team Picks",
    navLabel: "Team Picks",
    recommendationSource: "team",
    eyebrow: "Staff curated",
    title: "SitGuru Team Picks",
    description:
      "Recommendations curated by SitGuru staff. Each pick shows who submitted it and is reviewed before it goes live.",
    searchPlaceholder: "Search team recommendations…",
    filters: [
      { label: "Books", param: "format", value: "book" },
      { label: "Magazines", param: "format", value: "magazine" },
      { label: "Podcasts", param: "format", value: "podcast" },
      { label: "Videos", param: "format", value: "video" },
    ],
    featuredHeading: "Featured team recommendations",
    emptyHint: "Staff picks publish after Manager / Admin approval.",
  },
  "guru-picks": {
    key: "guru-picks",
    href: "/reads/guru-picks",
    label: "Guru Picks",
    navLabel: "Guru Picks",
    recommendationSource: "guru",
    eyebrow: "From registered Gurus",
    title: "Guru Picks",
    description:
      "Recommendations from registered pet-care providers (Gurus). Submissions show the Guru who shared them and require SitGuru review before publication.",
    searchPlaceholder: "Search Guru recommendations…",
    filters: [
      { label: "Books", param: "format", value: "book" },
      { label: "Magazines", param: "format", value: "magazine" },
      { label: "Podcasts", param: "format", value: "podcast" },
      { label: "Videos", param: "format", value: "video" },
    ],
    featuredHeading: "Approved Guru recommendations",
    emptyHint:
      "Guru Picks open after provider verification and editorial approval. Nothing public until reviewed.",
  },
  "pet-parent-picks": {
    key: "pet-parent-picks",
    href: "/reads/pet-parent-picks",
    label: "Pet Parent Picks",
    navLabel: "Pet Parent Picks",
    recommendationSource: "pet_parent",
    eyebrow: "From the community",
    title: "Pet Parent Picks",
    description:
      "Recommendations from the SitGuru Pet Parent community. Each submission shows who shared it and is reviewed before it appears publicly.",
    searchPlaceholder: "Search Pet Parent recommendations…",
    filters: [
      { label: "Books", param: "format", value: "book" },
      { label: "Magazines", param: "format", value: "magazine" },
      { label: "Podcasts", param: "format", value: "podcast" },
      { label: "Videos", param: "format", value: "video" },
    ],
    featuredHeading: "Approved community recommendations",
    emptyHint:
      "Pet Parent Picks stay private until staff review and approve them.",
  },
};

export const READS_CATEGORY_NAV = (
  Object.keys(READS_CATEGORY_CONFIG) as ReadsCategoryKey[]
).map((key) => ({
  key,
  href: READS_CATEGORY_CONFIG[key].href,
  label: READS_CATEGORY_CONFIG[key].navLabel,
}));

export const RECOMMENDATION_SOURCE_COPY: Record<
  ReadsRecommendationSource,
  { badge: string; submitterLabel: string; reviewNote: string }
> = {
  team: {
    badge: "Staff curated",
    submitterLabel: "SitGuru teammate",
    reviewNote: "Published after Manager / Admin review.",
  },
  guru: {
    badge: "Guru submitted",
    submitterLabel: "Registered Guru",
    reviewNote: "Requires SitGuru review and approval before publication.",
  },
  pet_parent: {
    badge: "Community submitted",
    submitterLabel: "Pet Parent",
    reviewNote: "Requires SitGuru review and approval before publication.",
  },
};
