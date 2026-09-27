/**
 * Conversational care-matching intake for Rogue / Scout.
 * One question per turn: ZIP → when → (optional extras), then live Guru lookup.
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
  "Afternoon",
  "Night",
  "Midday",
  "Evening",
  "Overnight",
  "Flexible",
] as const;

/** Chips shown while Rogue is asking "when?" — keep it simple. */
export const CARE_TIME_STEP_OPTIONS = [
  "Morning",
  "Afternoon",
  "Night",
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
    content:
      label === "Night"
        ? "I need care at Night"
        : `I need care in the ${label}`,
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

export type CareMatchingStep = "location" | "time" | "extras" | "ready";

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
  nextStep: CareMatchingStep;
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
  if (
    /\bextra pets?\b|\bmultiple pets?\b|\btwo dogs?\b|\bmore than one\b/.test(
      lower,
    )
  ) {
    extras.push("Extra Pets");
  }
  return extras;
}

function detectTimeWindow(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/\bflexible\b|\banytime\b|\bany time\b/.test(lower)) return "Flexible";
  if (/\bovernight\b|\ball[- ]night\b/.test(lower)) return "Overnight";
  if (
    /\bnight\b|\bevening\b|\bafter work\b|\bafter 5\b|\btonight\b/.test(lower)
  ) {
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
    /\bi need care at\b/.test(lower) ||
    /\balso matching\b/.test(lower) ||
    CARE_TIME_OPTIONS.some((option) =>
      lower.includes(option.toLowerCase()),
    ) ||
    CARE_EXTRA_OPTIONS.some((option) =>
      lower.includes(option.toLowerCase()),
    )
  );
}

function resolveNextStep(intake: {
  isCareSeeking: boolean;
  isProviderSignup: boolean;
  hasLocation: boolean;
  hasServiceType: boolean;
  hasTime: boolean;
}): CareMatchingStep {
  if (intake.isProviderSignup) {
    if (!intake.hasLocation) return "location";
    if (!intake.hasServiceType) return "time";
    if (!intake.hasTime) return "time";
    return "ready";
  }
  // ZIP **or** city+state is enough to move on — never force ZIP only.
  if (!intake.hasLocation) return "location";
  if (!intake.hasTime) return "time";
  return "ready";
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
  const zip = inferred?.zip;
  let city = inferred?.city || undefined;
  let state = inferred?.state || undefined;
  // "in Virginia" alone → state only. "New York, NY" keeps both city + state.
  if (city && isUsStateToken(city) && !state) {
    state = normalizeUsState(city) || undefined;
    city = undefined;
  }
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
  // Accept a US ZIP **or** city + state (e.g. Arlington VA / Austin, TX).
  const hasCityState = Boolean(city && state);
  const hasLocation = Boolean(hasZip || hasCityState);
  const hasServiceType = Boolean(service);
  const hasTime = Boolean(timeWindow);
  const hasExtras = extras.length > 0;

  const missing: CareMatchingIntake["missing"] = [];
  if (isCareSeeking || isProviderSignup) {
    if (!hasLocation) missing.push("location");
    if (!hasZip && !hasCityState) missing.push("zip");
    if (!hasServiceType && isCareSeeking) missing.push("service");
    if (!hasTime) missing.push("time");
  }

  const nextStep = resolveNextStep({
    isCareSeeking,
    isProviderSignup,
    hasLocation,
    hasServiceType,
    hasTime,
  });

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
    readyForLookup: isCareSeeking && hasLocation && hasTime,
    nextStep,
    missing,
  };
}

export function needsCareMatchingAsk(rawText?: string | null): boolean {
  const intake = parseCareMatchingIntake(rawText);
  if (intake.isProviderSignup) {
    return intake.nextStep !== "ready";
  }
  if (!intake.isCareSeeking) return false;
  if (looksLikeGuruDirectoryQuery(rawText) && intake.hasLocation && intake.hasTime) {
    return false;
  }
  return intake.nextStep !== "ready";
}

export function hasMatchingIntakeMarker(raw?: string | null): boolean {
  return /\[\[\s*matching_intake\s*\]\]/i.test(String(raw || ""));
}

/** Chips for the current intake step only — never dump every option. */
export function getCareMatchingChipsForThread(
  rawText?: string | null,
): MatchingChip[] {
  const intake = parseCareMatchingIntake(rawText);
  if (!intake.isCareSeeking && !intake.isProviderSignup) return [];

  if (intake.nextStep === "location") {
    return [];
  }

  if (intake.nextStep === "time") {
    return CARE_TIME_STEP_OPTIONS.map((label) => ({
      group: "time" as const,
      label,
      content:
        label === "Night"
          ? "I need care at Night"
          : `I need care in the ${label}`,
    }));
  }

  if (intake.nextStep === "extras") {
    return CARE_MATCHING_CHIPS.filter((chip) => chip.group === "extra");
  }

  return [];
}

/**
 * One conversational question only — never open with "Hey {name}" on every turn.
 * Example: "For Drop-In Visits, I'm on it — what city and state (or ZIP)?"
 */
export function buildCareMatchingAsk(
  rawText?: string | null,
  _firstName?: string | null,
): string | null {
  const intake = parseCareMatchingIntake(rawText);
  if (!needsCareMatchingAsk(rawText)) return null;

  const serviceLabel = intake.service || "pet care";
  const marker = MATCHING_INTAKE_MARKER;
  const placeLabel =
    intake.hasZip && intake.zip
      ? intake.zip
      : intake.city && intake.state
        ? `${intake.city}, ${intake.state}`
        : "";

  if (intake.isProviderSignup) {
    if (!intake.hasLocation) {
      return `Love that Guru energy — what **city and state** or **ZIP** will you serve? ${marker}`;
    }
    if (!intake.hasServiceType) {
      return `Got it — which **services** will you offer? ${marker} [[cta:guru]]`;
    }
    if (!intake.hasTime) {
      return `And when are you usually free — Morning, Afternoon, or Night? ${marker}`;
    }
    return null;
  }

  if (intake.nextStep === "location") {
    return `For **${serviceLabel}**, I'm on it — what **city and state** or **ZIP** where you need care? ${marker}`;
  }

  if (intake.nextStep === "time") {
    const where = placeLabel ? ` in **${placeLabel}**` : "";
    return `When do you need your **${serviceLabel}**${where} — Morning, Afternoon, or Night? ${marker}`;
  }

  return null;
}
