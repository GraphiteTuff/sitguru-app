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
    "Look up live SitGuru Pet Guru profiles by care type (Dog Walking, Drop-In Visits, Overnight/House Sitting, Boarding, etc.), city, state, ZIP, and/or Guru name. Use whenever the visitor asks to find care, meet a Guru, search by location/name, or find their favorite Guru. Booking stays on SitGuru.",
  parameters: z.object({
    service: z
      .string()
      .optional()
      .describe(
        "Care type, e.g. Dog Walking, Drop-In Visits, Overnight, Boarding, Pet Sitting",
      ),
    city: z.string().optional().describe("City name"),
    state: z.string().optional().describe("State name or abbreviation"),
    zip: z.string().optional().describe("5-digit US ZIP code"),
    name: z.string().optional().describe("Guru display name or slug fragment"),
    limit: z.number().int().min(1).max(5).optional().describe("Max results (default 3)"),
  }),
  execute: async (params) => {
    try {
      const result = await lookupGurusForChat(params);
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
