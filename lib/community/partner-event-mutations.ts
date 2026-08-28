import { geocodeAddress } from "@/lib/geocodeAddress";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PartnerAccount } from "@/lib/community/partner-access";
import { notifyAttendeesEventCancelled } from "@/lib/community/event-notifications";
import {
  createRecurringEventOccurrences,
  type RecurrenceRule,
} from "@/lib/community/recurring";
import { buildEventSlug } from "@/lib/community/slug";
import type {
  CommunityEventDraftInput,
  CommunityEventRow,
  CommunityEventStatus,
} from "@/lib/community/types";

export type PartnerAccessContext = {
  userId: string;
  partner: PartnerAccount;
};

function cleanText(value: unknown, max = 5000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function cleanOptionalText(value: unknown, max = 5000) {
  const cleaned = cleanText(value, max);
  return cleaned || null;
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

function parseCategories(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item, 40)).filter(Boolean).slice(0, 8);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  return [];
}

async function ensureUniqueSlug(title: string, eventId?: string) {
  const base = buildEventSlug(title);
  let candidate = base;
  let attempt = 0;

  while (attempt < 12) {
    let query = supabaseAdmin
      .from("community_events")
      .select("id")
      .eq("slug", candidate)
      .limit(1);

    if (eventId) {
      query = query.neq("id", eventId);
    }

    const { data } = await query.maybeSingle();

    if (!data) return candidate;

    attempt += 1;
    candidate = buildEventSlug(title, Math.random().toString(36).slice(2, 8));
  }

  return `${base}-${Date.now().toString(36)}`;
}

async function maybeGeocode(input: CommunityEventDraftInput) {
  if (input.latitude && input.longitude) {
    return { latitude: input.latitude, longitude: input.longitude };
  }

  const parts = [
    input.address_line_1,
    input.city,
    input.state,
    input.postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  if (parts.length < 5) {
    return { latitude: input.latitude ?? null, longitude: input.longitude ?? null };
  }

  try {
    const result = await geocodeAddress(parts);
    return { latitude: result.latitude, longitude: result.longitude };
  } catch {
    return { latitude: input.latitude ?? null, longitude: input.longitude ?? null };
  }
}

function buildPartnerDefaults(partner: PartnerAccount): CommunityEventDraftInput {
  return {
    venue_name: partner.business_name || undefined,
    city: partner.city || undefined,
    state: partner.state || undefined,
    postal_code: partner.zip_code || undefined,
    contact_email: partner.email || undefined,
  };
}

export async function createPartnerEventDraftWithAccess(
  access: PartnerAccessContext,
  input: CommunityEventDraftInput = {},
) {
  const title = cleanText(input.title, 160) || "Untitled Event";
  const slug = await ensureUniqueSlug(title);
  const defaults = buildPartnerDefaults(access.partner);
  const startAt =
    cleanText(input.start_at, 40) || new Date(Date.now() + 7 * 86400000).toISOString();
  const coords = await maybeGeocode({ ...defaults, ...input });

  const payload = {
    partner_id: access.partner.id,
    created_by: access.userId,
    title,
    slug,
    short_description: cleanOptionalText(input.short_description, 280),
    description: cleanOptionalText(input.description, 8000),
    event_type: cleanText(input.event_type, 40) || "community",
    categories: parseCategories(input.categories),
    start_at: startAt,
    end_at: cleanOptionalText(input.end_at, 40),
    timezone: cleanText(input.timezone, 80) || "America/Denver",
    venue_name: cleanOptionalText(input.venue_name, 160) || defaults.venue_name,
    address_line_1: cleanOptionalText(input.address_line_1, 200),
    address_line_2: cleanOptionalText(input.address_line_2, 200),
    city: cleanOptionalText(input.city, 120) || defaults.city,
    state: cleanOptionalText(input.state, 40) || defaults.state,
    postal_code: cleanOptionalText(input.postal_code, 20) || defaults.postal_code,
    country: cleanText(input.country, 4) || "US",
    latitude: coords.latitude,
    longitude: coords.longitude,
    pet_friendly: parseBoolean(input.pet_friendly, true),
    family_friendly: parseBoolean(input.family_friendly, false),
    outdoor: parseBoolean(input.outdoor, false),
    is_free: parseBoolean(input.is_free, true),
    registration_required: parseBoolean(input.registration_required, false),
    ticket_url: cleanOptionalText(input.ticket_url, 500),
    event_url: cleanOptionalText(input.event_url, 500),
    contact_email: cleanOptionalText(input.contact_email, 200) || defaults.contact_email,
    image_original_url: cleanOptionalText(input.image_original_url, 1000),
    image_hero_url: cleanOptionalText(input.image_hero_url, 1000),
    image_card_url: cleanOptionalText(input.image_card_url, 1000),
    image_mobile_url: cleanOptionalText(input.image_mobile_url, 1000),
    social_square_url: cleanOptionalText(input.social_square_url, 1000),
    social_story_url: cleanOptionalText(input.social_story_url, 1000),
    social_landscape_url: cleanOptionalText(input.social_landscape_url, 1000),
    image_storage_bucket: cleanOptionalText(input.image_storage_bucket, 80),
    image_storage_path: cleanOptionalText(input.image_storage_path, 300),
    status: "draft" as CommunityEventStatus,
  };

  const { data, error } = await supabaseAdmin
    .from("community_events")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("createPartnerEventDraftWithAccess:", error);
    return { ok: false as const, error: error.message || "Unable to create draft." };
  }

  return { ok: true as const, event: data as CommunityEventRow };
}

export async function autosavePartnerEventWithAccess(
  access: PartnerAccessContext,
  eventId: string,
  input: CommunityEventDraftInput,
) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("community_events")
    .select("*")
    .eq("id", eventId)
    .eq("partner_id", access.partner.id)
    .maybeSingle();

  if (existingError || !existing) {
    return { ok: false as const, error: "Event not found." };
  }

  const title = cleanText(input.title, 160) || existing.title;
  const slug =
    title !== existing.title ? await ensureUniqueSlug(title, eventId) : existing.slug;

  const coords = await maybeGeocode({
    ...existing,
    ...input,
    address_line_1: cleanOptionalText(input.address_line_1, 200) ?? existing.address_line_1,
    city: cleanOptionalText(input.city, 120) ?? existing.city,
    state: cleanOptionalText(input.state, 40) ?? existing.state,
    postal_code: cleanOptionalText(input.postal_code, 20) ?? existing.postal_code,
  });

  const payload = {
    title,
    slug,
    short_description:
      input.short_description !== undefined
        ? cleanOptionalText(input.short_description, 280)
        : existing.short_description,
    description:
      input.description !== undefined
        ? cleanOptionalText(input.description, 8000)
        : existing.description,
    event_type:
      input.event_type !== undefined
        ? cleanText(input.event_type, 40) || "community"
        : existing.event_type,
    categories:
      input.categories !== undefined ? parseCategories(input.categories) : existing.categories,
    start_at: cleanText(input.start_at, 40) || existing.start_at,
    end_at:
      input.end_at !== undefined ? cleanOptionalText(input.end_at, 40) : existing.end_at,
    timezone:
      input.timezone !== undefined
        ? cleanText(input.timezone, 80) || "America/Denver"
        : existing.timezone,
    venue_name:
      input.venue_name !== undefined
        ? cleanOptionalText(input.venue_name, 160)
        : existing.venue_name,
    address_line_1:
      input.address_line_1 !== undefined
        ? cleanOptionalText(input.address_line_1, 200)
        : existing.address_line_1,
    address_line_2:
      input.address_line_2 !== undefined
        ? cleanOptionalText(input.address_line_2, 200)
        : existing.address_line_2,
    city: input.city !== undefined ? cleanOptionalText(input.city, 120) : existing.city,
    state: input.state !== undefined ? cleanOptionalText(input.state, 40) : existing.state,
    postal_code:
      input.postal_code !== undefined
        ? cleanOptionalText(input.postal_code, 20)
        : existing.postal_code,
    country:
      input.country !== undefined ? cleanText(input.country, 4) || "US" : existing.country,
    latitude: coords.latitude,
    longitude: coords.longitude,
    pet_friendly:
      input.pet_friendly !== undefined
        ? parseBoolean(input.pet_friendly, existing.pet_friendly)
        : existing.pet_friendly,
    family_friendly:
      input.family_friendly !== undefined
        ? parseBoolean(input.family_friendly, existing.family_friendly)
        : existing.family_friendly,
    outdoor:
      input.outdoor !== undefined
        ? parseBoolean(input.outdoor, existing.outdoor)
        : existing.outdoor,
    is_free:
      input.is_free !== undefined
        ? parseBoolean(input.is_free, existing.is_free)
        : existing.is_free,
    registration_required:
      input.registration_required !== undefined
        ? parseBoolean(input.registration_required, existing.registration_required)
        : existing.registration_required,
    ticket_url:
      input.ticket_url !== undefined
        ? cleanOptionalText(input.ticket_url, 500)
        : existing.ticket_url,
    event_url:
      input.event_url !== undefined
        ? cleanOptionalText(input.event_url, 500)
        : existing.event_url,
    contact_email:
      input.contact_email !== undefined
        ? cleanOptionalText(input.contact_email, 200)
        : existing.contact_email,
    image_original_url:
      input.image_original_url !== undefined
        ? cleanOptionalText(input.image_original_url, 1000)
        : existing.image_original_url,
    image_hero_url:
      input.image_hero_url !== undefined
        ? cleanOptionalText(input.image_hero_url, 1000)
        : existing.image_hero_url,
    image_card_url:
      input.image_card_url !== undefined
        ? cleanOptionalText(input.image_card_url, 1000)
        : existing.image_card_url,
    image_mobile_url:
      input.image_mobile_url !== undefined
        ? cleanOptionalText(input.image_mobile_url, 1000)
        : existing.image_mobile_url,
    social_square_url:
      input.social_square_url !== undefined
        ? cleanOptionalText(input.social_square_url, 1000)
        : existing.social_square_url,
    social_story_url:
      input.social_story_url !== undefined
        ? cleanOptionalText(input.social_story_url, 1000)
        : existing.social_story_url,
    social_landscape_url:
      input.social_landscape_url !== undefined
        ? cleanOptionalText(input.social_landscape_url, 1000)
        : existing.social_landscape_url,
    image_storage_bucket:
      input.image_storage_bucket !== undefined
        ? cleanOptionalText(input.image_storage_bucket, 80)
        : existing.image_storage_bucket,
    image_storage_path:
      input.image_storage_path !== undefined
        ? cleanOptionalText(input.image_storage_path, 1000)
        : existing.image_storage_path,
  };

  const { data, error } = await supabaseAdmin
    .from("community_events")
    .update(payload)
    .eq("id", eventId)
    .eq("partner_id", access.partner.id)
    .select("*")
    .single();

  if (error) {
    console.error("autosavePartnerEventWithAccess:", error);
    return { ok: false as const, error: error.message || "Unable to save event." };
  }

  return {
    ok: true as const,
    event: data as CommunityEventRow,
    savedAt: new Date().toISOString(),
  };
}

export async function submitPartnerEventForReviewWithAccess(
  access: PartnerAccessContext,
  eventId: string,
) {
  const { data: existing } = await supabaseAdmin
    .from("community_events")
    .select("*")
    .eq("id", eventId)
    .eq("partner_id", access.partner.id)
    .maybeSingle();

  if (!existing) {
    return { ok: false as const, error: "Event not found." };
  }

  if (!existing.title?.trim()) {
    return { ok: false as const, error: "Event name is required." };
  }

  if (!existing.start_at) {
    return { ok: false as const, error: "Event date is required." };
  }

  if (!existing.short_description?.trim()) {
    return { ok: false as const, error: "Short description is required." };
  }

  if (!existing.image_original_url) {
    return { ok: false as const, error: "Event image is required." };
  }

  if (!existing.venue_name && !existing.city) {
    return { ok: false as const, error: "Location is required." };
  }

  const { data, error } = await supabaseAdmin
    .from("community_events")
    .update({
      status: "pending_review",
      moderation_note: null,
    })
    .eq("id", eventId)
    .eq("partner_id", access.partner.id)
    .select("*")
    .single();

  if (error) {
    return { ok: false as const, error: error.message || "Unable to submit event." };
  }

  return { ok: true as const, event: data as CommunityEventRow };
}

export async function cancelPartnerEventWithAccess(
  access: PartnerAccessContext,
  eventId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("community_events")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("partner_id", access.partner.id)
    .select("*")
    .single();

  if (error) {
    return { ok: false as const, error: error.message || "Unable to cancel event." };
  }

  try {
    await notifyAttendeesEventCancelled({
      id: data.id,
      title: data.title,
      slug: data.slug,
      partner_id: data.partner_id,
    });
  } catch (notifyError) {
    console.warn("Cancel attendance notifications skipped:", notifyError);
  }

  return { ok: true as const, event: data as CommunityEventRow };
}

export async function duplicatePartnerEventWithAccess(
  access: PartnerAccessContext,
  eventId: string,
) {
  const { data: existing } = await supabaseAdmin
    .from("community_events")
    .select("*")
    .eq("id", eventId)
    .eq("partner_id", access.partner.id)
    .maybeSingle();

  if (!existing) {
    return { ok: false as const, error: "Event not found." };
  }

  const slug = await ensureUniqueSlug(`${existing.title} Copy`);

  const { data, error } = await supabaseAdmin
    .from("community_events")
    .insert({
      partner_id: existing.partner_id,
      created_by: access.userId,
      title: `${existing.title} Copy`,
      slug,
      short_description: existing.short_description,
      description: existing.description,
      event_type: existing.event_type,
      categories: existing.categories,
      image_original_url: existing.image_original_url,
      image_hero_url: existing.image_hero_url,
      image_card_url: existing.image_card_url,
      image_mobile_url: existing.image_mobile_url,
      social_square_url: existing.social_square_url,
      social_story_url: existing.social_story_url,
      social_landscape_url: existing.social_landscape_url,
      image_storage_bucket: existing.image_storage_bucket,
      image_storage_path: existing.image_storage_path,
      start_at: existing.start_at,
      end_at: existing.end_at,
      timezone: existing.timezone,
      venue_name: existing.venue_name,
      address_line_1: existing.address_line_1,
      address_line_2: existing.address_line_2,
      city: existing.city,
      state: existing.state,
      postal_code: existing.postal_code,
      country: existing.country,
      latitude: existing.latitude,
      longitude: existing.longitude,
      pet_friendly: existing.pet_friendly,
      family_friendly: existing.family_friendly,
      outdoor: existing.outdoor,
      is_free: existing.is_free,
      registration_required: existing.registration_required,
      ticket_url: existing.ticket_url,
      event_url: existing.event_url,
      contact_email: existing.contact_email,
      status: "draft",
    })
    .select("*")
    .single();

  if (error) {
    return { ok: false as const, error: error.message || "Unable to duplicate event." };
  }

  return { ok: true as const, event: data as CommunityEventRow };
}

export async function deletePartnerEventDraftWithAccess(
  access: PartnerAccessContext,
  eventId: string,
) {
  const { error } = await supabaseAdmin
    .from("community_events")
    .delete()
    .eq("id", eventId)
    .eq("partner_id", access.partner.id)
    .eq("status", "draft");

  if (error) {
    return { ok: false as const, error: error.message || "Unable to delete draft." };
  }

  return { ok: true as const };
}

export async function createPartnerEventSeriesWithAccess(
  access: PartnerAccessContext,
  eventId: string,
  rule: RecurrenceRule,
  count: number,
) {
  if (!["weekly", "biweekly", "monthly"].includes(rule)) {
    return { ok: false as const, error: "Choose a recurrence pattern." };
  }

  const { data: existing } = await supabaseAdmin
    .from("community_events")
    .select("*")
    .eq("id", eventId)
    .eq("partner_id", access.partner.id)
    .maybeSingle();

  if (!existing) {
    return { ok: false as const, error: "Event not found." };
  }

  if (existing.is_series_parent || existing.parent_event_id) {
    return { ok: false as const, error: "This event already belongs to a series." };
  }

  const result = await createRecurringEventOccurrences({
    parent: existing as CommunityEventRow,
    rule,
    count,
  });

  return {
    ok: true as const,
    createdCount: result.created.length,
    events: result.created,
  };
}

export async function fetchPartnerEventByIdWithAccess(
  access: PartnerAccessContext,
  eventId: string,
) {
  const { data } = await supabaseAdmin
    .from("community_events")
    .select("*")
    .eq("id", eventId)
    .eq("partner_id", access.partner.id)
    .maybeSingle();

  return (data as CommunityEventRow | null) || null;
}
