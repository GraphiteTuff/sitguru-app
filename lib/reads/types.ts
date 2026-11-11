export const READS_CONTENT_TYPES = [
  "book",
  "magazine",
  "podcast",
  "video",
  "author",
  "expert",
  "publication",
] as const;

export type ReadsContentType = (typeof READS_CONTENT_TYPES)[number];

export const READS_STATUSES = [
  "draft",
  "submitted",
  "changes_requested",
  "approved",
  "scheduled",
  "published",
  "archived",
] as const;

export type ReadsStatus = (typeof READS_STATUSES)[number];

export const READS_DISCLOSURE_LABELS = [
  "sitguru_recommended",
  "partner_feature",
  "sponsored",
  "none",
] as const;

export type ReadsDisclosureLabel = (typeof READS_DISCLOSURE_LABELS)[number];

export const READS_FEATURE_TYPES = [
  "book_of_the_month",
  "magazine_spotlight",
  "featured_podcast",
  "featured_author",
  "featured_video",
  "homepage",
  "none",
] as const;

export type ReadsFeatureType = (typeof READS_FEATURE_TYPES)[number];

export const READS_PARTNER_TYPES = [
  "author",
  "publisher",
  "magazine",
  "podcast",
  "veterinarian",
  "trainer",
  "behaviorist",
  "pet_expert",
  "rescue_nonprofit",
  "other",
] as const;

export type ReadsPartnerType = (typeof READS_PARTNER_TYPES)[number];

export const READS_PARTNER_STATUSES = [
  "new",
  "under_review",
  "contacted",
  "interested",
  "interview_planned",
  "content_planned",
  "content_created",
  "published",
  "active_partner",
  "declined",
  "archived",
] as const;

export type ReadsPartnerStatus = (typeof READS_PARTNER_STATUSES)[number];

export const READS_RECOMMENDATION_TYPES = [
  "favorite_book",
  "favorite_magazine",
  "favorite_podcast",
  "favorite_video",
  "additional",
] as const;

export type ReadsRecommendationType =
  (typeof READS_RECOMMENDATION_TYPES)[number];

export type ReadsTopic = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  audience: string[];
  display_order: number;
  is_active: boolean;
};

export type ReadsContent = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  editorial_summary: string | null;
  why_recommended: string | null;
  content_type: ReadsContentType;
  status: ReadsStatus;
  visibility: "public" | "unlisted" | "private";
  featured: boolean;
  feature_type: ReadsFeatureType | null;
  disclosure_label: ReadsDisclosureLabel;
  image_url: string | null;
  thumbnail_url: string | null;
  external_url: string | null;
  affiliate_disclosure: string | null;
  audience: string[];
  tags: string[];
  created_by: string | null;
  assigned_manager_id: string | null;
  assigned_intern_id: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export type ReadsBook = {
  content_id: string;
  author_name: string | null;
  publisher: string | null;
  publication_date: string | null;
  isbn: string | null;
  page_count: number | null;
  language: string | null;
  cover_image_url: string | null;
  purchase_url: string | null;
};

export type ReadsPublication = {
  content_id: string;
  publication_name: string;
  publication_type: string | null;
  logo_url: string | null;
  website_url: string | null;
  issue_label: string | null;
  issue_date: string | null;
  partnership_status: string;
};

export type ReadsPodcast = {
  content_id: string;
  show_name: string | null;
  guest_name: string | null;
  guest_title: string | null;
  episode_artwork_url: string | null;
  duration_seconds: number | null;
  audio_embed_url: string | null;
  youtube_video_id: string | null;
  publish_date: string | null;
  is_sitguru_original: boolean;
};

export type ReadsVideo = {
  content_id: string;
  youtube_video_id: string | null;
  youtube_channel_id: string | null;
  youtube_url: string | null;
  duration_seconds: number | null;
  publish_date: string | null;
  guest_name: string | null;
  import_source: "manual" | "api" | "seed";
  import_status: "needs_review" | "ready" | "rejected";
};

export type ReadsPerson = {
  content_id: string;
  person_type: string;
  credentials: string | null;
  organization: string | null;
  biography: string | null;
  website_url: string | null;
  headshot_url: string | null;
  social_links: Record<string, string>;
  partnership_status: string;
  upcoming_appearances: string | null;
};

export type ReadsTeamMember = {
  id: string;
  user_id: string | null;
  slug: string;
  full_name: string;
  role_label: string;
  avatar_url: string | null;
  display_order: number;
  is_active: boolean;
};

export type ReadsTeamPick = {
  id: string;
  team_member_id: string;
  content_id: string;
  recommendation_type: ReadsRecommendationType;
  quote: string;
  display_order: number;
  featured: boolean;
  is_active: boolean;
  published_at: string | null;
  team_member?: ReadsTeamMember;
  content?: ReadsContent;
};

export type ReadsContentDetail = ReadsContent & {
  book?: ReadsBook | null;
  publication?: ReadsPublication | null;
  podcast?: ReadsPodcast | null;
  video?: ReadsVideo | null;
  person?: ReadsPerson | null;
  topics?: ReadsTopic[];
  related?: ReadsContent[];
  team_picks?: ReadsTeamPick[];
};

export type ReadsSearchFilters = {
  q?: string;
  format?: ReadsContentType | "all";
  topic?: string;
  audience?: string;
  featured?: boolean;
  teamPick?: boolean;
  newest?: boolean;
  limit?: number;
  offset?: number;
};

export type ReadsPartnerSubmissionInput = {
  name: string;
  organization?: string;
  email: string;
  phone?: string;
  partner_type: ReadsPartnerType;
  website?: string;
  social_links?: Record<string, string>;
  work_title?: string;
  description?: string;
  topics?: string[];
  publication_date?: string;
  publisher?: string;
  isbn?: string;
  interested_interview?: boolean;
  interested_giveaway?: boolean;
  review_copy_available?: boolean;
  interested_social?: boolean;
  interested_partnership?: boolean;
  message?: string;
  permission_agreed: boolean;
  privacy_acknowledged: boolean;
  turnstileToken?: string;
};

export type ReadsAnalyticsEventName =
  | "page_view"
  | "content_view"
  | "book_view"
  | "magazine_view"
  | "podcast_view"
  | "podcast_play"
  | "video_play"
  | "youtube_click"
  | "author_view"
  | "partner_cta_click"
  | "external_book_click"
  | "team_pick_view"
  | "search"
  | "topic_filter"
  | "newsletter_signup"
  | "guru_search_from_reads"
  | "pet_parent_registration_from_reads"
  | "guru_registration_from_reads"
  | "booking_start_from_reads"
  | "booking_completed_from_reads";

export type ReadsStaffRole =
  | "admin"
  | "manager"
  | "intern"
  | "none";
