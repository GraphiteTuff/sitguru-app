import { mergeUniqueCommunityEvents } from "@/lib/community/dedupe-events";
import { getUpcomingCuratedBucksMontgomeryPetEvents } from "@/lib/community/homepage-demo-events";
import { fetchPublicEvents } from "@/lib/community/queries";
import {
  toInternPromoteEvent,
  type InternPromoteEvent,
} from "@/lib/internship/intern-tools";

/** Upcoming public events interns can promote. No Admin HQ, no partner emails. */
export async function listInternPromoteEvents(): Promise<InternPromoteEvent[]> {
  const published = await fetchPublicEvents({
    state: "PA",
    petFriendly: true,
    limit: 16,
  });
  const curated = getUpcomingCuratedBucksMontgomeryPetEvents();
  return mergeUniqueCommunityEvents(published, curated, 12).map(toInternPromoteEvent);
}
