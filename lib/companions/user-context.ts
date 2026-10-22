/**
 * Authorized, role-scoped user context for companion prompts.
 * Live application records always override stale memories.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CompanionActor } from "@/lib/companions/identity";
import type { CompanionId } from "@/lib/companions/types";
import {
  listActiveMemories,
  memoriesPromptBlock,
  type CompanionMemoryRow,
} from "@/lib/companions/memories";

export type CompanionUserContext = {
  actor: CompanionActor;
  location: {
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  pets: Array<{
    id: string;
    name: string;
    species: string | null;
    breed: string | null;
  }>;
  bookings: Array<{
    id: string;
    status: string | null;
    service: string | null;
    startAt: string | null;
  }>;
  guruPublic: {
    id: string;
    displayName: string | null;
    city: string | null;
    state: string | null;
  } | null;
  ambassador: {
    id: string;
    referralCode: string | null;
  } | null;
  memories: CompanionMemoryRow[];
  promptBlock: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function loadOwnedPets(userId: string) {
  for (const field of ["user_id", "owner_id", "owner_profile_id"] as const) {
    const { data, error } = await supabaseAdmin
      .from("pets")
      .select("id,name,species,pet_type,breed")
      .eq(field, userId)
      .limit(12);
    if (error) continue;
    return ((data as Array<Record<string, unknown>>) || []).map((row) => ({
      id: asString(row.id),
      name: asString(row.name) || "Pet",
      species: asString(row.species) || asString(row.pet_type) || null,
      breed: asString(row.breed) || null,
    }));
  }
  return [];
}

async function loadOwnedBookings(userId: string) {
  for (const field of [
    "pet_owner_id",
    "customer_id",
    "user_id",
    "pet_parent_id",
  ] as const) {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("id,status,service_type,service,start_at,starts_at,created_at")
      .eq(field, userId)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) continue;
    return ((data as Array<Record<string, unknown>>) || []).map((row) => ({
      id: asString(row.id),
      status: asString(row.status) || null,
      service:
        asString(row.service_type) || asString(row.service) || null,
      startAt:
        asString(row.start_at) ||
        asString(row.starts_at) ||
        asString(row.created_at) ||
        null,
    }));
  }
  return [];
}

async function loadProfileLocation(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select(
      "city,state,zip,postal_code,service_city,service_state,service_zip",
    )
    .eq("id", userId)
    .maybeSingle();

  const row = (data || {}) as Record<string, unknown>;
  return {
    city: asString(row.service_city) || asString(row.city) || null,
    state: asString(row.service_state) || asString(row.state) || null,
    zip:
      asString(row.service_zip) ||
      asString(row.zip) ||
      asString(row.postal_code) ||
      null,
  };
}

/**
 * Build permitted context for the authenticated actor.
 * Guests receive an empty personal context (public help only).
 */
export async function buildCompanionUserContext(opts: {
  actor: CompanionActor;
  companionId: CompanionId;
}): Promise<CompanionUserContext> {
  const { actor, companionId } = opts;

  if (!actor.userId) {
    return {
      actor,
      location: { city: null, state: null, zip: null },
      pets: [],
      bookings: [],
      guruPublic: null,
      ambassador: null,
      memories: [],
      promptBlock:
        "# USER CONTEXT\nSigned-out guest. No personal pets, bookings, or memories. Offer public SitGuru help and Guru search only.",
    };
  }

  const [location, pets, bookings, memories] = await Promise.all([
    loadProfileLocation(actor.userId),
    actor.isPetParent || actor.isAdmin
      ? loadOwnedPets(actor.userId)
      : Promise.resolve([]),
    actor.isPetParent || actor.isAdmin
      ? loadOwnedBookings(actor.userId)
      : Promise.resolve([]),
    listActiveMemories({ userId: actor.userId, companionId }),
  ]);

  let guruPublic: CompanionUserContext["guruPublic"] = null;
  if ((actor.isGuru || actor.isAdmin) && actor.guruId) {
    const { data: guru } = await supabaseAdmin
      .from("gurus")
      .select("id,display_name,full_name,service_city,service_state,city,state")
      .eq("id", actor.guruId)
      .maybeSingle();
    if (guru) {
      const row = guru as Record<string, unknown>;
      guruPublic = {
        id: asString(row.id),
        displayName:
          asString(row.display_name) || asString(row.full_name) || null,
        city: asString(row.service_city) || asString(row.city) || null,
        state: asString(row.service_state) || asString(row.state) || null,
      };
    }
  }

  let ambassador: CompanionUserContext["ambassador"] = null;
  if ((actor.isAmbassador || actor.isAdmin) && actor.userId) {
    const { data: ledger } = await supabaseAdmin
      .from("ambassador_profiles")
      .select("id,referral_code_slug,display_name")
      .eq("user_id", actor.userId)
      .maybeSingle();
    if (ledger) {
      ambassador = {
        id: asString((ledger as { id?: string }).id),
        referralCode:
          asString(
            (ledger as { referral_code_slug?: string }).referral_code_slug,
          ) || null,
      };
    } else if (actor.ambassadorId) {
      ambassador = { id: actor.ambassadorId, referralCode: null };
    }
  }

  // Guru bookings for Scout (provider side) — only own assigned bookings.
  let guruBookings: CompanionUserContext["bookings"] = [];
  if ((actor.isGuru || actor.isAdmin) && actor.guruId) {
    for (const field of ["guru_id", "provider_id"] as const) {
      const { data, error } = await supabaseAdmin
        .from("bookings")
        .select("id,status,service_type,service,start_at,starts_at,created_at")
        .eq(field, actor.guruId)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) continue;
      guruBookings = ((data as Array<Record<string, unknown>>) || []).map(
        (row) => ({
          id: asString(row.id),
          status: asString(row.status) || null,
          service: asString(row.service_type) || asString(row.service) || null,
          startAt:
            asString(row.start_at) ||
            asString(row.starts_at) ||
            asString(row.created_at) ||
            null,
        }),
      );
      break;
    }
  }

  const effectiveBookings =
    actor.isGuru && !actor.isPetParent ? guruBookings : bookings;

  const lines = [
    "# USER CONTEXT (authorized live records)",
    `Authenticated: yes`,
    `User id: ${actor.userId}`,
    `Primary role: ${actor.primaryRole}`,
    `Roles: ${actor.roles.join(", ")}`,
    `Display name: ${actor.displayName || "(none)"}`,
    `First name: ${actor.firstName || "(none)"}`,
    `Saved location: ${[location.city, location.state, location.zip].filter(Boolean).join(", ") || "(none on profile)"}`,
    "",
    "## Pets (owner only)",
    pets.length
      ? pets
          .map(
            (pet) =>
              `- ${pet.name}${pet.species ? ` (${pet.species})` : ""}${pet.breed ? ` · ${pet.breed}` : ""} [${pet.id}]`,
          )
          .join("\n")
      : "- (none accessible)",
    "",
    "## Recent bookings (participant only)",
    effectiveBookings.length
      ? effectiveBookings
          .map(
            (booking) =>
              `- ${booking.service || "care"} · ${booking.status || "unknown"}${booking.startAt ? ` · ${booking.startAt}` : ""} → /bookings/${booking.id} or mobile booking-details`,
          )
          .join("\n")
      : "- (none accessible)",
  ];

  if (guruPublic) {
    lines.push(
      "",
      "## Guru business (self)",
      `- ${guruPublic.displayName || "Guru"} · ${[guruPublic.city, guruPublic.state].filter(Boolean).join(", ") || "location unset"}`,
    );
  }

  if (ambassador) {
    lines.push(
      "",
      "## Ambassador (self)",
      `- Referral code: ${ambassador.referralCode || "(not set)"}`,
      `- Share via SitGuru ambassador tools — do not invent payout figures.`,
    );
  }

  lines.push(
    "",
    memoriesPromptBlock(memories),
    "",
    "RULES:",
    "- Prefer live records above over memories when they conflict.",
    "- Never expose another user's pets, bookings, or memories.",
    "- For prices/availability/booking status, retrieve live tools/records — do not invent.",
    "- Consequential actions (book, pay, message, cancel) stay on SitGuru screens — guide with links only.",
  );

  return {
    actor,
    location,
    pets,
    bookings: effectiveBookings,
    guruPublic,
    ambassador,
    memories,
    promptBlock: lines.join("\n"),
  };
}

/**
 * If the user asks for care "near me" without a location in the message,
 * prefer their saved profile location for Guru lookup hints.
 */
export function resolveCareLocationHint(opts: {
  userText: string;
  location: CompanionUserContext["location"];
  memories: CompanionMemoryRow[];
}): { city?: string; state?: string; zip?: string; source: string } | null {
  const text = opts.userText.toLowerCase();
  const asksNearMe =
    /\b(near me|nearby|my area|around me|close to me|my location|my zip)\b/.test(
      text,
    ) || /\b(find|looking for|need).*(guru|sitter|walker|boarding|care)\b/.test(text);

  if (!asksNearMe && !opts.location.zip && !opts.location.city) {
    return null;
  }

  if (opts.location.zip || opts.location.city || opts.location.state) {
    return {
      city: opts.location.city || undefined,
      state: opts.location.state || undefined,
      zip: opts.location.zip || undefined,
      source: "profile",
    };
  }

  const locationMemory = opts.memories.find(
    (memory) =>
      memory.is_active &&
      (memory.key === "preferred_location" ||
        memory.category === "location"),
  );
  if (locationMemory) {
    const zipMatch = locationMemory.value.match(/\b(\d{5})(?:-\d{4})?\b/);
    return {
      zip: zipMatch?.[1],
      city: zipMatch ? undefined : locationMemory.value,
      source: "memory",
    };
  }

  return null;
}
