/** Pet-focused discovery intents for SerpApi Community Markets. */
export const DEFAULT_PET_SEARCH_INTENTS = [
  "pet events",
  "dog events",
  "pet adoption events",
  "animal rescue events",
  "dog adoption events",
  "pet expo",
  "dog festival",
  "pet friendly events",
  "dog friendly events",
  "animal shelter fundraiser",
  "pet wellness event",
  "veterinary community event",
  "dog walk fundraiser",
  "puppy event",
  "cat adoption event",
] as const;

const EXPLICIT_PET =
  /\b(pet|pets|dog|dogs|puppy|puppies|cat|cats|kitten|kittens|animal|animals|rescue|rescues|shelter|shelters|adoption|adopt|veterinary|veterinarian|vet\b|groomer|grooming|trainer|training|canine|feline|paw|bark|woof|meow|foster|humane society|spca|aspca|pet expo|pet fest|dog fest|dog walk|pet walk)\b/i;

const STRONG_PET_FRIENDLY =
  /\b(pet[- ]?friendly|dog[- ]?friendly|cat[- ]?friendly|bring your (dog|pet)|leash|yappy|pup crawl|pet meetup|dog meetup|animal lovers?)\b/i;

const WEAK_COMMUNITY =
  /\b(community|festival|fair|fundraiser|parade|farmers? market|outdoor|family|park|meetup)\b/i;

/**
 * Score 0–100 for how relevant a discovered event is to Pet Parents / Gurus / pet businesses.
 */
export function scorePetRelevance(input: {
  title: string;
  description?: string | null;
  searchQuery?: string | null;
  venueName?: string | null;
}): number {
  const title = String(input.title || "");
  const description = String(input.description || "");
  const venue = String(input.venueName || "");
  const query = String(input.searchQuery || "");
  const blob = `${title} ${description} ${venue}`.trim();
  const lower = blob.toLowerCase();

  if (!blob) return 35;

  let score = 20;

  if (EXPLICIT_PET.test(title)) score += 55;
  else if (EXPLICIT_PET.test(blob)) score += 45;

  if (STRONG_PET_FRIENDLY.test(blob)) score += 25;

  if (
    /\b(adoption|rescue|shelter|humane|spca|foster|vet|veterinary|groom|train)\b/i.test(
      lower,
    )
  ) {
    score += 15;
  }

  if (/\b(expo|festival|fest|fundraiser|walkathon|5k)\b/i.test(lower)) {
    score += 8;
  }

  if (WEAK_COMMUNITY.test(blob) && EXPLICIT_PET.test(blob)) {
    score += 5;
  }

  // Generic community with no pet signal stays low even if query was pet-focused
  if (!EXPLICIT_PET.test(blob) && !STRONG_PET_FRIENDLY.test(blob)) {
    if (EXPLICIT_PET.test(query) || STRONG_PET_FRIENDLY.test(query)) {
      score = Math.min(score, 38);
    } else {
      score = Math.min(score, 25);
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function effectivePetRelevanceScore(row: {
  pet_relevance_score?: number | null;
  pet_relevance_override?: number | null;
}) {
  if (
    typeof row.pet_relevance_override === "number" &&
    Number.isFinite(row.pet_relevance_override)
  ) {
    return Math.max(0, Math.min(100, Math.round(row.pet_relevance_override)));
  }
  return Math.max(
    0,
    Math.min(100, Math.round(row.pet_relevance_score ?? 50)),
  );
}

/** Qualifying pet events for homepage / yield (70+ or override). */
export function isQualifyingPetEvent(score: number) {
  return score >= 70;
}

/** Accept for storage: high relevance, or mid with pet-friendly evidence. */
export function shouldAcceptDiscoveredEvent(score: number) {
  return score >= 40;
}
