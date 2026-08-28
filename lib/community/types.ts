export const COMMUNITY_EVENT_STATUSES = [
  "draft",
  "pending_review",
  "changes_requested",
  "approved",
  "published",
  "cancelled",
  "completed",
  "archived",
] as const;

export type CommunityEventStatus = (typeof COMMUNITY_EVENT_STATUSES)[number];

export const COMMUNITY_EVENT_CATEGORIES = [
  "Adoption",
  "Social",
  "Training",
  "Fundraiser",
  "Festival",
  "Community",
  "Pet Business",
  "Rescue",
  "Wellness",
  "Other",
] as const;

export type CommunityEventCategory = (typeof COMMUNITY_EVENT_CATEGORIES)[number];

export const PARTNER_EVENT_TABS = [
  "upcoming",
  "published",
  "drafts",
  "pending",
  "past",
  "cancelled",
] as const;

export type PartnerEventTab = (typeof PARTNER_EVENT_TABS)[number];

export type CommunityEventRow = {
  id: string;
  partner_id: string;
  created_by: string | null;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  event_type: string | null;
  categories: string[] | null;
  image_original_url: string | null;
  image_hero_url: string | null;
  image_card_url: string | null;
  image_mobile_url: string | null;
  social_square_url: string | null;
  social_story_url: string | null;
  social_landscape_url: string | null;
  image_storage_bucket: string | null;
  image_storage_path: string | null;
  start_at: string;
  end_at: string | null;
  timezone: string | null;
  venue_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  pet_friendly: boolean;
  family_friendly: boolean;
  outdoor: boolean;
  is_free: boolean;
  registration_required: boolean;
  ticket_url: string | null;
  event_url: string | null;
  contact_email: string | null;
  status: CommunityEventStatus;
  featured_status: string;
  featured_priority: number;
  featured_start_at: string | null;
  featured_end_at: string | null;
  featured_market_city: string | null;
  featured_market_state: string | null;
  moderation_note: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  published_at: string | null;
  cancelled_at: string | null;
  series_id?: string | null;
  parent_event_id?: string | null;
  recurrence_rule?: string | null;
  recurrence_count?: number | null;
  is_series_parent?: boolean | null;
  created_at: string;
  updated_at: string;
};

export type CommunityEventWithPartner = CommunityEventRow & {
  partners?: {
    id: string;
    business_name: string | null;
    slug: string | null;
    city: string | null;
    state: string | null;
    website: string | null;
    email: string | null;
  } | null;
};

export type CommunityEventDraftInput = {
  title?: string;
  short_description?: string | null;
  description?: string | null;
  event_type?: string | null;
  categories?: string[] | null;
  start_at?: string;
  end_at?: string | null;
  timezone?: string | null;
  venue_name?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pet_friendly?: boolean;
  family_friendly?: boolean;
  outdoor?: boolean;
  is_free?: boolean;
  registration_required?: boolean;
  ticket_url?: string | null;
  event_url?: string | null;
  contact_email?: string | null;
  image_original_url?: string | null;
  image_hero_url?: string | null;
  image_card_url?: string | null;
  image_mobile_url?: string | null;
  social_square_url?: string | null;
  social_story_url?: string | null;
  social_landscape_url?: string | null;
  image_storage_bucket?: string | null;
  image_storage_path?: string | null;
  status?: CommunityEventStatus;
};
