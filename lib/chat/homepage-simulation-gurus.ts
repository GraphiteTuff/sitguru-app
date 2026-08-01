/**
 * SERVER-ONLY simulation enrichment — live Guru snapshots via service role.
 * Never import from `"use client"` components.
 */

import {
  buildHomepageSimulationReply,
  type HomepageSimulationOpts,
} from "@/lib/chat/homepage-simulation";
import {
  extractVisitorPreferredName,
  formatDisplayName,
  isReservedPreferredName,
  sanitizePreferredName,
} from "@/lib/chat/homepage-name";
import {
  encodeGuruCardMarker,
  inferLookupParamsFromChat,
} from "@/lib/gurus/guru-chat-snapshot";
import { lookupGurusForChat } from "@/lib/gurus/lookup-gurus-for-chat";

function appendGuruCards(base: string, markers: string[]) {
  if (!markers.length) return base;
  return `${base.trim()} ${markers.join(" ")}`.trim();
}

/** Server-only simulation with live Guru snapshots when city/state/ZIP/name is present. */
export async function buildHomepageSimulationReplyWithGurus(
  opts: HomepageSimulationOpts,
): Promise<string> {
  const base = buildHomepageSimulationReply(opts);
  const lookupParams = inferLookupParamsFromChat(opts.lastUserText);
  if (
    !lookupParams ||
    !(
      lookupParams.city ||
      lookupParams.state ||
      lookupParams.zip ||
      lookupParams.name
    )
  ) {
    return base;
  }

  try {
    const result = await lookupGurusForChat(lookupParams);
    if (!result.gurus.length) {
      let preferred = sanitizePreferredName(opts.clientFirstName);
      if (isReservedPreferredName(preferred)) preferred = "";
      const extracted = extractVisitorPreferredName(opts.lastUserText);
      if (extracted) preferred = extracted;
      const name = formatDisplayName(preferred);
      const lead = name ? `hey ${name}! ` : "";
      return `${lead}i checked our live Guru catalog for that filter — nothing public yet in that slice. try a nearby ZIP or browse /search, and i'll keep hunting with you.`;
    }

    const markers = result.gurus.map((g) => encodeGuruCardMarker(g));
    const serviceBit = lookupParams.service
      ? ` for **${lookupParams.service}**`
      : "";
    const intro = `found live Guru matches${serviceBit} — book through **SitGuru**, tap a snapshot, and you can always find your favorite Guru again in-app.`;
    let preferred = sanitizePreferredName(opts.clientFirstName);
    if (isReservedPreferredName(preferred)) preferred = "";
    const extracted = extractVisitorPreferredName(opts.lastUserText);
    if (extracted) preferred = extracted;
    const name = formatDisplayName(preferred);
    const lead = name ? `hey ${name}! ` : "";

    if (
      /\b(walk|drop|overnight|board|sit|zip|\d{5}|near|in )\b/i.test(
        String(opts.lastUserText || ""),
      )
    ) {
      return appendGuruCards(`${lead}${intro} [[cta:parent]]`, markers);
    }
    return appendGuruCards(`${base}`, markers);
  } catch (error) {
    console.warn("[homepage-simulation] guru lookup failed:", error);
    return base;
  }
}
