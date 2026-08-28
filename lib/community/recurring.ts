import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CommunityEventRow } from "@/lib/community/types";
import { buildEventSlug } from "@/lib/community/slug";

export type RecurrenceRule = "none" | "weekly" | "biweekly" | "monthly";

function addRecurrence(startIso: string, rule: RecurrenceRule, index: number) {
  const date = new Date(startIso);
  if (rule === "weekly") date.setDate(date.getDate() + 7 * index);
  if (rule === "biweekly") date.setDate(date.getDate() + 14 * index);
  if (rule === "monthly") date.setMonth(date.getMonth() + index);
  return date.toISOString();
}

function shiftEnd(startIso: string, endIso: string | null, nextStartIso: string) {
  if (!endIso) return null;
  const duration = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(duration) || duration <= 0) return null;
  return new Date(new Date(nextStartIso).getTime() + duration).toISOString();
}

export async function createRecurringEventOccurrences(input: {
  parent: CommunityEventRow;
  rule: RecurrenceRule;
  count: number;
}) {
  const rule = input.rule;
  const count = Math.min(Math.max(input.count || 1, 1), 26);

  if (rule === "none" || count <= 1) {
    return { ok: true as const, created: [] as CommunityEventRow[] };
  }

  const seriesId = input.parent.series_id || input.parent.id;
  const created: CommunityEventRow[] = [];

  await supabaseAdmin
    .from("community_events")
    .update({
      series_id: seriesId,
      is_series_parent: true,
      recurrence_rule: rule,
      recurrence_count: count,
    })
    .eq("id", input.parent.id);

  for (let index = 1; index < count; index += 1) {
    const startAt = addRecurrence(input.parent.start_at, rule, index);
    const endAt = shiftEnd(input.parent.start_at, input.parent.end_at, startAt);
    const slug = buildEventSlug(
      input.parent.title,
      `${seriesId.slice(0, 4)}${index}`,
    );

    const { data, error } = await supabaseAdmin
      .from("community_events")
      .insert({
        partner_id: input.parent.partner_id,
        created_by: input.parent.created_by,
        title: input.parent.title,
        slug,
        short_description: input.parent.short_description,
        description: input.parent.description,
        event_type: input.parent.event_type,
        categories: input.parent.categories,
        image_original_url: input.parent.image_original_url,
        image_hero_url: input.parent.image_hero_url,
        image_card_url: input.parent.image_card_url,
        image_mobile_url: input.parent.image_mobile_url,
        social_square_url: input.parent.social_square_url,
        social_story_url: input.parent.social_story_url,
        social_landscape_url: input.parent.social_landscape_url,
        image_storage_bucket: input.parent.image_storage_bucket,
        image_storage_path: input.parent.image_storage_path,
        start_at: startAt,
        end_at: endAt,
        timezone: input.parent.timezone,
        venue_name: input.parent.venue_name,
        address_line_1: input.parent.address_line_1,
        address_line_2: input.parent.address_line_2,
        city: input.parent.city,
        state: input.parent.state,
        postal_code: input.parent.postal_code,
        country: input.parent.country,
        latitude: input.parent.latitude,
        longitude: input.parent.longitude,
        pet_friendly: input.parent.pet_friendly,
        family_friendly: input.parent.family_friendly,
        outdoor: input.parent.outdoor,
        is_free: input.parent.is_free,
        registration_required: input.parent.registration_required,
        ticket_url: input.parent.ticket_url,
        event_url: input.parent.event_url,
        contact_email: input.parent.contact_email,
        status: "draft",
        series_id: seriesId,
        parent_event_id: input.parent.id,
        recurrence_rule: rule,
        recurrence_count: count,
        is_series_parent: false,
      })
      .select("*")
      .single();

    if (!error && data) {
      created.push(data as CommunityEventRow);
    }
  }

  return { ok: true as const, created };
}
