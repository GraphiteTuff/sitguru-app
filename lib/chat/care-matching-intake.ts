/**
 * Client-safe care-matching intake for Rogue / Scout.
 * Green-pill care asks should collect ZIP/area, every service type,
 * time of service, and extras before live Guru lookup.
 */

import {
  inferLookupParamsFromChat,
  isUsStateToken,
  looksLikeGuruDirectoryQuery,
  normalizeUsState,
} from "@/lib/gurus/guru-chat-snapshot";

export const MATCHING_INTAKE_MARKER = "[[matching_intake]]";

export const CARE_SERVICE_OPTIONS = [
  "Drop-In Visits",
  "Dog Walking",
  "Pet Sitting",
  "House Sitting",
  "Boarding",
  "Doggy Day Care",
  "Training Support",
] as const;

export const CARE_TIME_OPTIONS = [
  "Morning",
  "Midday",
  "Afternoon",
  "Evening",
  "Overnight",
  "Flexible",
] as const;

export const CARE_EXTRA_OPTIONS = [
  "Medication Help",
  "Puppy Care",
  "Extra Pets",
] as const;

export type MatchingChip = {
  group: "time" | "service" | "extra";
  label: string;
  content: string;
};

export const CARE_MATCHING_CHIPS: readonly MatchingChip[] = [
  ...CARE_TIME_OPTIONS.map((label) => ({
    group: "time" as const,
    label,
    content: `I need care in the ${label}`,
  })),
  ...CARE_SERVICE_OPTIONS.map((label) => ({
    group: "service" as const,
    label,
    content: `Also matching ${label}`,
  })),
  ...CARE_EXTRA_OPTIONS.map((label) => ({
    group: "extra" as const,
    label,
    content: `Also matching ${label}`,
  })),
];

const SERVICES_LIST =
  "walks, drop-ins, pet sitting, overnight / house sitting, boarding, day care, training";

const ALL_SERVICES_PHRASE = `**every service** to match (${SERVICES_LIST})`;

const TIME_PHRASE =
  "**when** you need care (morning, midday, afternoon, evening, overnight, a specific day, or flexible)";

const EXTRAS_PHRASE =
  "any **extras** (medication, puppy care, extra pets)";

export type CareMatchingIntake = {
  isCareSeeking: boolean;
  isProviderSignup: boolean;
  service: string | null;
  extras: string[];
  zip?: string;
  city?: string;
  state?: string;
  timeWindow?: string;
  hasLocation: boolean;
  hasZip: boolean;
  hasServiceType: boolean;
  hasTime: boolean;
  hasExtras: boolean;
  readyForLookup: boolean;
  missing: Array<"location" | "zip" | "service" | "time">;
};

const GURU_ROLE_SYNONYM =
  /\b((pet|dog|cat|house)\s*[- ]?sitters?|sitters?|gurus?|caregivers?|handlers?)\b/i;

const CARE_SEEKING =
  /\b(looking for|need|find|book|search|who (can|does)|any (local )?(gurus?|sitters?)|also matching|i need care)\b/i;

const PROVIDER_SIGNUP =
  /\b(want to register as|become a (guru|sitter|walker|trainer)|register as a)\b/i;

function clean(value: unknown) {
  return String(value || "").trim();
}

function detectService(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\bdrop[- ]?in|\bvisit/.test(lower)) return "Drop-In Visits";
  if (/\bwalk/.test(lower) && !/\bsitters?\b/.test(lower)) return "Dog Walking";
  if (/\bovernight|\bhouse\s*sit/.test(lower)) return "House Sitting";
  if (/\bboard/.test(lower)) return "Boarding";
  if (/\bday\s*care|\bdaycare/.test(lower)) return "Doggy Day Care";
  if (/\btrain/.test(lower)) return "Training Support";
  if (/\bpet\s+sitting\b/.test(lower)) return "Pet Sitting";
  return null;
}

function detectExtraServices(text: string): string[] {
  const lower = text.toLowerCase();
  const extras: string[] = [];
  if (/\bmedicat/.test(lower)) extras.push("Medication Help");
  if (/\bpuppy|\bkitten|\bsenior\b/.test(lower)) extras.push("Puppy Care");
  if (/\bextra pets?\b|\bmultiple pets?\b|\btwo dogs?\b|\bmore than one\b/.test(lower)) {
    extras.push("Extra Pets");
  }
  return extras;
}

function detectTimeWindow(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/\bflexible\b|\banytime\b|\bany time\b/.test(lower)) return "Flexible";
  if (/\bovernight\b|\ball[- ]night\b/.test(lower)) return "Overnight";
  if (/\bevening\b|\bafter work\b|\bafter 5\b|\btonight\b/.test(lower)) {
    return "Evening";
  }
  if (/\bafternoon\b|\bafter lunch\b/.test(lower)) return "Afternoon";
  if (/\bmidday\b|\bnoon\b|\blunch\b/.test(lower)) return "Midday";
  if (/\bmorning\b|\bbefore (work|noon)\b/.test(lower)) return "Morning";
  if (
    /\b(today|tomorrow|tonight|this weekend|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(
      lower,
    ) ||
    /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/.test(lower) ||
    /\b\d{1,2}(:\d{2})?\s*(am|pm)\b/.test(lower)
  ) {
    return "Scheduled date";
  }
  return undefined;
}

function isMatchingFollowUp(lower: string): boolean {
  return (
    /\bi need care in the\b/.test(lower) ||
    /\balso matching\b/.test(lower) ||
    CARE_TIME_OPTIONS.some((option) =>
      lower.includes(option.toLowerCase()),
    ) ||
    CARE_EXTRA_OPTIONS.some((option) =>
      lower.includes(option.toLowerCase()),
    )
  );
}

/** Join recent user turns so ZIP / time / services persist across chips. */
export function joinRecentUserTexts(
  messages: Array<{ role?: string; content?: unknown }>,
  fallback?: string | null,
): string {
  const fromThread = messages
    .filter((message) => message.role === "user")
    .slice(-6)
    .map((message) => {
      const content = message.content;
      if (typeof content === "string") return content.trim();
      if (Array.isArray(content)) {
        return content
          .map((part) => {
            if (typeof part === "string") return part;
            if (
              part &&
              typeof part === "object" &&
              "text" in part &&
              typeof (part as { text?: unknown }).text === "string"
            ) {
              return String((part as { text: string }).text);
            }
            return "";
          })
          .join(" ")
          .trim();
      }
      return "";
    })
    .filter(Boolean);

  if (fromThread.length) return fromThread.join(" \n ");
  return clean(fallback);
}

export function parseCareMatchingIntake(
  rawText?: string | null,
): CareMatchingIntake {
  const text = clean(rawText);
  const lower = text.toLowerCase();
  const inferred = inferLookupParamsFromChat(text);
  const service = detectService(text);
  const extras = detectExtraServices(text);
  const zip = inferred?.zip || text.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1];
  const city =
    inferred?.city && !isUsStateToken(inferred.city) ? inferred.city : undefined;
  const state = inferred?.state || normalizeUsState(inferred?.city) || undefined;
  const timeWindow = detectTimeWindow(text);

  const isProviderSignup = PROVIDER_SIGNUP.test(lower);
  const isCareSeeking =
    !isProviderSignup &&
    (Boolean(service) ||
      CARE_SEEKING.test(lower) ||
      GURU_ROLE_SYNONYM.test(lower) ||
      /\blooking for\b/.test(lower) ||
      isMatchingFollowUp(lower));

  const hasZip = Boolean(zip);
  const hasLocation = Boolean(zip || city || state);
  const hasServiceType = Boolean(service);
  const hasTime = Boolean(timeWindow);
  const hasExtras = extras.length > 0;

  const missing: CareMatchingIntake["missing"] = [];
  if (isCareSeeking || isProviderSignup) {
    if (!hasLocation) missing.push("location");
    if (!hasZip) missing.push("zip");
    if (!hasServiceType && isCareSeeking) missing.push("service");
    if (!hasTime) missing.push("time");
  }

  return {
    isCareSeeking,
    isProviderSignup,
    service,
    extras,
    zip,
    city,
    state,
    timeWindow,
    hasLocation,
    hasZip,
    hasServiceType,
    hasTime,
    hasExtras,
    readyForLookup: isCareSeeking && hasLocation,
    missing,
  };
}

export function needsCareMatchingAsk(rawText?: string | null): boolean {
  const intake = parseCareMatchingIntake(rawText);
  if (intake.isProviderSignup) {
    return !intake.hasLocation || !intake.hasTime || !intake.hasServiceType;
  }
  if (!intake.isCareSeeking) return false;
  if (looksLikeGuruDirectoryQuery(rawText) && intake.hasLocation) return false;
  return !intake.hasLocation || !intake.hasTime;
}

export function hasMatchingIntakeMarker(raw?: string | null): boolean {
  return /\[\[\s*matching_intake\s*\]\]/i.test(String(raw || ""));
}

export function buildCareMatchingAsk(
  rawText?: string | null,
  firstName?: string | null,
): string | null {
  const intake = parseCareMatchingIntake(rawText);
  if (!needsCareMatchingAsk(rawText)) return null;

  const name = clean(firstName);
  const lead = name ? `hey ${name}! ` : "";
  const serviceLabel = intake.service || "pet care";
  const marker = `${MATCHING_INTAKE_MARKER}`;

  if (intake.isProviderSignup) {
    return `${lead}love that Guru energy — pet sitters, dog sitters, and cat sitters are all SitGuru **Gurus**. What **ZIP or city** will you serve, which **services** will you offer (${SERVICES_LIST}), and what **times** are you usually free (morning, midday, afternoon, evening, overnight, or flexible)? ${marker} [[cta:guru]]`;
  }

  const bits: string[] = [];
  if (!intake.hasLocation || !intake.hasZip) {
    bits.push("your **ZIP code** (city + state also works)");
  }
  if (!intake.hasTime) {
    bits.push(TIME_PHRASE);
  }
  if (!intake.hasServiceType) {
    bits.push(ALL_SERVICES_PHRASE);
  } else {
    bits.push(`any **other services** besides ${serviceLabel} (${SERVICES_LIST})`);
  }
  bits.push(EXTRAS_PHRASE);

  const ask =
    bits.length === 1
      ? bits[0]
      : bits.length === 2
        ? `${bits[0]} and ${bits[1]}`
        : `${bits.slice(0, -1).join(", ")}, and ${bits[bits.length - 1]}`;

  return `${lead}**${serviceLabel}** — I'm on it. Tell me ${ask} so I can match the full visit, not just one pill. ${marker} [[cta:parent]]`;
}
