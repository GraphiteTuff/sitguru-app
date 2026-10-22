/**
 * Narrow, authorization-checked tools for companion chat.
 * Handlers enforce ownership independently of the model.
 */

import { tool } from "ai";
import { z } from "zod";
import { lookupGurusTool } from "@/lib/chat/rogue-guru-tool";
import { fetchLiveSocialFollowersTool } from "@/lib/chat/rogue-social-tool";
import {
  formatGuruLookupForPrompt,
  lookupGurusForChat,
} from "@/lib/gurus/lookup-gurus-for-chat";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CompanionActor } from "@/lib/companions/identity";
import type { CompanionUserContext } from "@/lib/companions/user-context";
import { HELP_ARTICLES } from "@/lib/help/articles";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function searchHelpArticles(query: string, limit = 5) {
  const q = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  if (!tokens.length) return [];

  return HELP_ARTICLES.map((article) => {
    const hay = [
      article.title,
      article.summary,
      article.category,
      ...article.tags,
      ...article.keywords,
    ]
      .join(" ")
      .toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (hay.includes(token)) score += 2;
    }
    return { article, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ article }) => ({
      title: article.title,
      href: article.href,
      summary: article.summary,
      category: article.category,
    }));
}

/**
 * Build the tool set for a companion turn.
 * Always includes public Guru lookup + help search.
 * Authenticated tools only expose the actor's own records.
 */
export function buildCompanionTools(opts: {
  actor: CompanionActor;
  context: CompanionUserContext;
}) {
  const { actor, context } = opts;

  const getMyPets = tool({
    description:
      "Retrieve the signed-in user's own pet profiles (name, species, breed). Never use for other users.",
    parameters: z.object({}),
    execute: async () => {
      if (!actor.userId) {
        return "Signed out — no personal pets available. Ask them to sign in.";
      }
      if (!context.pets.length) {
        return "No pets on this account yet. They can add pets in Pet Passports / Pets.";
      }
      return [
        "# MY PETS (owner only)",
        ...context.pets.map(
          (pet) =>
            `- ${pet.name}${pet.species ? ` · ${pet.species}` : ""}${pet.breed ? ` · ${pet.breed}` : ""}`,
        ),
        "Manage: /pets (web) or Pet Passports (mobile)",
      ].join("\n");
    },
  });

  const getMyBookings = tool({
    description:
      "Retrieve the signed-in user's recent booking status. Read-only — does not create, cancel, or charge.",
    parameters: z.object({}),
    execute: async () => {
      if (!actor.userId) {
        return "Signed out — no personal bookings available.";
      }
      if (!context.bookings.length) {
        return "No recent bookings found for this account.";
      }
      return [
        "# MY BOOKINGS (participant only)",
        ...context.bookings.map(
          (booking) =>
            `- ${booking.service || "care"} · status ${booking.status || "unknown"}${booking.startAt ? ` · ${booking.startAt}` : ""} · open booking-details?id=${booking.id}`,
        ),
        "To change a booking, open the booking screen in SitGuru — companions cannot cancel or charge.",
      ].join("\n");
    },
  });

  const searchSitGuruHelp = tool({
    description:
      "Search maintained SitGuru Help Center articles and return titles with source links.",
    parameters: z.object({
      query: z.string().min(2).describe("Help topic to search"),
    }),
    execute: async ({ query }) => {
      const hits = searchHelpArticles(query, 5);
      if (!hits.length) {
        return [
          "# HELP SEARCH",
          `No Help Center hits for "${query}".`,
          "Browse: /help",
        ].join("\n");
      }
      return [
        "# HELP SEARCH RESULTS",
        ...hits.map(
          (hit) => `- [${hit.title}](${hit.href}) — ${hit.summary}`,
        ),
        "Cite these links when answering informational questions.",
      ].join("\n");
    },
  });

  const lookupGurusNearMe = tool({
    description:
      "Look up live public SitGuru Gurus. Prefer the user's saved profile location when they ask for care near them without naming a city/ZIP.",
    parameters: z.object({
      service: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      name: z.string().optional(),
      useSavedLocation: z
        .boolean()
        .optional()
        .describe("When true, fill missing city/state/zip from the user's profile"),
      limit: z.number().int().min(1).max(80).optional(),
    }),
    execute: async (params) => {
      try {
        const city =
          asString(params.city) ||
          (params.useSavedLocation ? context.location.city || "" : "");
        const state =
          asString(params.state) ||
          (params.useSavedLocation ? context.location.state || "" : "");
        const zip =
          asString(params.zip) ||
          (params.useSavedLocation ? context.location.zip || "" : "");

        if (!city && !state && !zip && !asString(params.name)) {
          return [
            "# LIVE GURU LOOKUP RESULT",
            "Need a ZIP or city/state (or a Guru name) before searching.",
            "Ask the visitor, or if they are signed in with a saved location call again with useSavedLocation=true.",
          ].join("\n");
        }

        const result = await lookupGurusForChat({
          service: params.service,
          city: city || undefined,
          state: state || undefined,
          zip: zip || undefined,
          name: params.name,
          limit: params.limit,
          listAll: true,
        });
        const digest = formatGuruLookupForPrompt(result);
        const locationNote = [
          city && `city=${city}`,
          state && `state=${state}`,
          zip && `zip=${zip}`,
          params.useSavedLocation && "source=saved_profile_or_request",
        ]
          .filter(Boolean)
          .join(", ");
        return `${digest}\n\nSearch location used: ${locationNote || "name-only"}`;
      } catch (error) {
        return [
          "# LIVE GURU LOOKUP RESULT",
          "Catalog unavailable this turn. Do not invent Gurus.",
          "Send them to /search or Find Care.",
          error instanceof Error ? error.message : "",
        ]
          .filter(Boolean)
          .join("\n");
      }
    },
  });

  const getMyReferralInfo = tool({
    description:
      "Retrieve the signed-in ambassador's own referral code when authorized. Never invent codes or commissions.",
    parameters: z.object({}),
    execute: async () => {
      if (!actor.userId) return "Signed out — no referral info.";
      if (!actor.isAmbassador && !actor.isAdmin) {
        return "Referral dashboards are for Ambassadors. Suggest /programs/ambassadors/apply if they want to join.";
      }
      if (!context.ambassador) {
        return "No ambassador profile row found for this account yet.";
      }
      return [
        "# MY REFERRAL INFO (self only)",
        `Referral code: ${context.ambassador.referralCode || "(not set)"}`,
        "Open the Ambassador dashboard for live commissions — do not invent payout numbers.",
        "Web: /ambassador/dashboard",
      ].join("\n");
    },
  });

  const getMyPartnerInfo = tool({
    description:
      "Retrieve the signed-in Partner account (owner_user_id) when authorized. Never invent partner listings.",
    parameters: z.object({}),
    execute: async () => {
      if (!actor.userId) return "Signed out — no Partner info.";
      if (!actor.isPartner && !actor.isAdmin) {
        return "No Partner membership on this account. Partnership inquiries: /contact or Partner apply flows.";
      }
      if (context.dataErrors.some((err) => err.startsWith("partners:"))) {
        return [
          "# MY PARTNER INFO",
          "Partner lookup failed (schema/query error) — do not invent Partner data.",
          ...context.dataErrors.filter((err) => err.startsWith("partners:")),
        ].join("\n");
      }
      if (!context.partner) {
        return "No active Partner row (partners.owner_user_id) for this account.";
      }
      return [
        "# MY PARTNER INFO (self only)",
        `Business: ${context.partner.businessName || "(unnamed)"}`,
        `Location: ${[context.partner.city, context.partner.state].filter(Boolean).join(", ") || "(unset)"}`,
        "Partner Events are managed in the Partner workspace — companions do not create or publish events.",
      ].join("\n");
    },
  });

  const findCurrentEvents = tool({
    description:
      "Find current public SitGuru community events. Returns titles and routes only — no RSVP mutation.",
    parameters: z.object({
      city: z.string().optional(),
      state: z.string().optional(),
      limit: z.number().int().min(1).max(20).optional(),
    }),
    execute: async ({ city, state, limit }) => {
      let query = supabaseAdmin
        .from("community_events")
        .select("id,slug,title,city,state,starts_at,status")
        .order("starts_at", { ascending: true })
        .limit(limit ?? 8);

      if (city) query = query.ilike("city", `%${city}%`);
      if (state) query = query.ilike("state", `%${state}%`);

      const { data, error } = await query;
      if (error) {
        return [
          "# EVENTS",
          "Events catalog unavailable this turn.",
          "Browse: /events",
        ].join("\n");
      }
      const rows = (data as Array<Record<string, unknown>>) || [];
      if (!rows.length) {
        return "# EVENTS\nNo matching public events right now. Browse: /events";
      }
      return [
        "# CURRENT EVENTS",
        ...rows.map((row) => {
          const slug = asString(row.slug) || asString(row.id);
          const title = asString(row.title) || "Event";
          const where = [asString(row.city), asString(row.state)]
            .filter(Boolean)
            .join(", ");
          return `- ${title}${where ? ` · ${where}` : ""} → /events/${slug}`;
        }),
        "RSVP on the event page — companions do not change attendance.",
      ].join("\n");
    },
  });

  return {
    lookupGurus: lookupGurusTool,
    lookupGurusNearMe,
    searchSitGuruHelp,
    getMyPets,
    getMyBookings,
    getMyReferralInfo,
    getMyPartnerInfo,
    findCurrentEvents,
    fetchLiveSocialFollowers: fetchLiveSocialFollowersTool,
  };
}
