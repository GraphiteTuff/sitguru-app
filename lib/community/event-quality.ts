import type { CommunityEventRow } from "@/lib/community/types";

export type EventQualityCheck = {
  id: string;
  label: string;
  done: boolean;
};

export type EventQualityScore = {
  percent: number;
  checks: EventQualityCheck[];
  missing: EventQualityCheck[];
};

/** Heuristic Event Setup completeness — surfaces gaps before publish. */
export function computeEventQualityScore(
  event: Pick<
    CommunityEventRow,
    | "title"
    | "short_description"
    | "description"
    | "image_card_url"
    | "image_hero_url"
    | "image_original_url"
    | "start_at"
    | "end_at"
    | "venue_name"
    | "city"
    | "state"
    | "address_line_1"
    | "categories"
    | "ticket_url"
    | "event_url"
    | "contact_email"
    | "pet_friendly"
  >,
  organizer?: {
    business_name?: string | null;
    website?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null,
): EventQualityScore {
  const hasImage = Boolean(
    event.image_card_url || event.image_hero_url || event.image_original_url,
  );
  const hasDescription = Boolean(
    (event.short_description || "").trim().length >= 20 ||
      (event.description || "").trim().length >= 40,
  );
  const hasTitle = Boolean((event.title || "").trim().length >= 4);
  const hasWhen = Boolean(event.start_at);
  const hasWhere = Boolean(
    event.venue_name || event.city || event.address_line_1,
  );
  const hasCategories = Boolean((event.categories || []).length);
  const hasRegistration = Boolean(event.ticket_url || event.event_url);
  const hasOrganizer = Boolean(
    organizer?.business_name ||
      event.contact_email ||
      organizer?.email ||
      organizer?.website,
  );
  const hasSocialOrContact = Boolean(
    organizer?.website || organizer?.phone || event.contact_email,
  );

  const checks: EventQualityCheck[] = [
    { id: "title", label: "Event name", done: hasTitle },
    { id: "photo", label: "Event photo", done: hasImage },
    { id: "description", label: "Description", done: hasDescription },
    { id: "datetime", label: "Date / time", done: hasWhen },
    { id: "location", label: "Location", done: hasWhere },
    { id: "category", label: "Category", done: hasCategories },
    { id: "organizer", label: "Organizer", done: hasOrganizer },
    { id: "registration", label: "Registration / ticket link", done: hasRegistration },
    { id: "social", label: "Contact or website", done: hasSocialOrContact },
    { id: "pet", label: "Pet-friendly flagged", done: event.pet_friendly },
  ];

  const doneCount = checks.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checks.length) * 100);

  return {
    percent,
    checks,
    missing: checks.filter((c) => !c.done),
  };
}
