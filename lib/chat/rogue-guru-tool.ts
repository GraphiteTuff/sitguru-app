/**
 * Rogue tool: lookup live public Gurus by care type / location / name.
 */

import { tool } from "ai";
import { z } from "zod";
import {
  formatGuruLookupForPrompt,
  lookupGurusForChat,
} from "@/lib/gurus/lookup-gurus-for-chat";

export const lookupGurusTool = tool({
  description:
    "Look up live SitGuru Pet Guru profiles by care type (Dog Walking, Drop-In Visits, Overnight/House Sitting, Boarding, Pet Sitting, day care, training, etc.), city, state, ZIP, and/or Guru name. Pet sitters / dog sitters / cat sitters are Gurus. Use after the visitor shares a ZIP or city/state. Always return the FULL public directory for that area (service matches first, then other local Gurus). Show every card. Booking stays on SitGuru.",
  parameters: z.object({
    service: z
      .string()
      .optional()
      .describe(
        "Care type, e.g. Dog Walking, Drop-In Visits, Overnight, Boarding, Pet Sitting. Omit for all services.",
      ),
    city: z.string().optional().describe("City name"),
    state: z.string().optional().describe("State name or abbreviation"),
    zip: z.string().optional().describe("5-digit US ZIP code"),
    name: z.string().optional().describe("Guru display name or slug fragment"),
    listAll: z
      .boolean()
      .optional()
      .describe(
        "Always true for city/state/ZIP directory lists. Returns the full public area set.",
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(80)
      .optional()
      .describe(
        "Max results. For area lists omit this or use 60+ — never request fewer than ~40 for a city/ZIP directory.",
      ),
  }),
  execute: async (params) => {
    try {
      const hasArea = Boolean(
        params.city || params.state || params.zip || params.listAll,
      );
      const result = await lookupGurusForChat({
        ...params,
        listAll: hasArea ? true : params.listAll,
        limit: hasArea
          ? Math.max(Number(params.limit) || 60, 40)
          : params.limit,
      });
      // Return the digest string so Claude copies exact [[guru_card:...]] markers.
      return formatGuruLookupForPrompt(result);
    } catch (error) {
      console.warn(
        "[lookupGurus] catalog lookup failed:",
        error instanceof Error ? error.message : error,
      );
      return [
        "# LIVE GURU LOOKUP RESULT",
        `Query: ${JSON.stringify(params)}`,
        "The live catalog could not be read on this turn. Do not invent Gurus.",
        "Tell the visitor you can still help — open Explore / Find Care or /search for that area, and try again in a moment.",
        "Browse: /search",
      ].join("\n");
    }
  },
});
