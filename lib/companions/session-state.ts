/**
 * Typed per-conversation companion state for guests and signed-in users.
 * Read before every reply. Supports recall, summarise, correct, and start-over.
 */

export type CompanionSessionState = {
  name: string | null;
  role: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  service: string | null;
  dates: string | null;
  timeWindow: string | null;
  petName: string | null;
  petSpecies: string | null;
  namedGuru: string | null;
  namedEvent: string | null;
  goal: string | null;
  pendingWorkflow: "care_match" | "guru_apply" | "ambassador_apply" | "events" | null;
  corrections: string[];
  summaryBullets: string[];
};

export type SessionMetaIntent =
  | { type: "recall"; field: keyof CompanionSessionState | "all" }
  | { type: "summarise" }
  | { type: "correct"; field: keyof CompanionSessionState; value: string }
  | { type: "start_over" }
  | { type: "forget_field"; field: keyof CompanionSessionState }
  | null;

const EMPTY_STATE: CompanionSessionState = {
  name: null,
  role: null,
  city: null,
  state: null,
  zip: null,
  service: null,
  dates: null,
  timeWindow: null,
  petName: null,
  petSpecies: null,
  namedGuru: null,
  namedEvent: null,
  goal: null,
  pendingWorkflow: null,
  corrections: [],
  summaryBullets: [],
};

export function emptyCompanionSessionState(): CompanionSessionState {
  return { ...EMPTY_STATE, corrections: [], summaryBullets: [] };
}

function clean(value: unknown) {
  return String(value || "").trim();
}

const SERVICE_MAP: Array<{ re: RegExp; label: string }> = [
  { re: /\bdrop[- ]?in|\bvisit/i, label: "Drop-In Visits" },
  { re: /\bwalk/i, label: "Dog Walking" },
  { re: /\bovernight|\bhouse\s*sit/i, label: "House Sitting" },
  { re: /\bboard/i, label: "Boarding" },
  { re: /\bday\s*care|\bdaycare/i, label: "Doggy Day Care" },
  { re: /\btrain/i, label: "Training Support" },
  { re: /\bpet\s+sitting/i, label: "Pet Sitting" },
];

export function detectServiceLabel(text: string): string | null {
  for (const row of SERVICE_MAP) {
    if (row.re.test(text)) return row.label;
  }
  return null;
}

/** Merge facts extracted from the latest user turn into session state. */
export function mergeSessionStateFromTurn(
  prev: CompanionSessionState,
  userText: string,
): CompanionSessionState {
  const next = { ...prev, corrections: [...prev.corrections], summaryBullets: [...prev.summaryBullets] };
  const text = clean(userText);
  if (!text) return next;
  const lower = text.toLowerCase();

  const zip = text.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1];
  if (zip) next.zip = zip;

  const cityState = text.match(
    /\b(?:in|near|around)\s+([A-Za-z][A-Za-z .'-]+?),\s*([A-Z]{2})\b/,
  );
  if (cityState) {
    next.city = clean(cityState[1]);
    next.state = cityState[2]!.toUpperCase();
  }

  const nameMatch = text.match(
    /\b(?:my name is|i(?:'m| am)|call me)\s+([A-Z][a-zA-Z'-]{1,30})\b/i,
  );
  if (nameMatch?.[1] && !/looking|need|here|ready/i.test(nameMatch[1])) {
    next.name = nameMatch[1];
  }

  const petMatch = text.match(
    /\b(?:my|our)\s+(?:dog|cat|pet)\s+(?:is\s+)?(?:named\s+)?([A-Z][a-zA-Z'-]{1,24})\b/i,
  );
  if (petMatch?.[1]) {
    next.petName = petMatch[1];
    if (/\bdog\b/i.test(text)) next.petSpecies = "dog";
    if (/\bcat\b/i.test(text)) next.petSpecies = "cat";
  }

  const service = detectServiceLabel(text);
  if (service) next.service = service;

  // Explicit corrections: "actually boarding, not walking"
  const actually = text.match(
    /\b(?:actually|instead|not)\s+([a-z][a-z\s-]{2,40}?)(?:,|\.|$)/i,
  );
  if (/\bactually\b/i.test(lower) || /\binstead(?:\s+of)?\b/i.test(lower)) {
    const corrected = detectServiceLabel(text);
    if (corrected) {
      next.service = corrected;
      next.corrections.push(`service→${corrected}`);
    }
    const cityFix = text.match(
      /\b(?:actually|instead)\s+([A-Za-z][A-Za-z .'-]+?)(?:,\s*([A-Z]{2}))?\b/i,
    );
    if (cityFix?.[1] && !detectServiceLabel(cityFix[1])) {
      next.city = clean(cityFix[1]);
      if (cityFix[2]) next.state = cityFix[2].toUpperCase();
      next.corrections.push(`city→${next.city}`);
    }
  }

  if (/\b(need|looking for|find).{0,40}(care|walk|sit|board|guru|sitter)/i.test(lower)) {
    next.pendingWorkflow = "care_match";
  }
  if (/\b(become|apply).{0,20}guru/i.test(lower)) {
    next.pendingWorkflow = "guru_apply";
  }
  if (/\bambassador/i.test(lower) && /\b(apply|join|sign)/i.test(lower)) {
    next.pendingWorkflow = "ambassador_apply";
  }
  if (/\bevents?\b/i.test(lower) && /\b(find|near|upcoming|rsvp)/i.test(lower)) {
    next.pendingWorkflow = "events";
  }

  void actually;
  return next;
}

export function parseSessionMetaIntent(userText: string): SessionMetaIntent {
  const q = clean(userText).toLowerCase();
  if (!q) return null;

  if (
    /\b(start over|reset (this )?chat|clear (our |this )?conversation|forget (everything|all)|new chat)\b/.test(
      q,
    )
  ) {
    return { type: "start_over" };
  }

  if (
    /\b(summarize|summarise|recap|catch me up|what have we (talked|covered)|summary of (our|this) (chat|conversation))\b/.test(
      q,
    )
  ) {
    return { type: "summarise" };
  }

  if (/\bwhat (city|zip|zip code|service|name|pet|date|time).{0,20}(did i|have i|i give|i gave|i say|i said|i told)/i.test(q) ||
      /\bwhat (city|zip|zip code|service|name|pet).{0,12}(do you have|do you remember|did i give)\b/.test(q) ||
      /\b(what('s| is) my (city|zip|zip code|service|name|pet))\b/.test(q) ||
      /\b(remind me (what|of) (my )?(city|zip|service|name|pet))\b/.test(q)) {
    if (/\bzip\b/.test(q)) return { type: "recall", field: "zip" };
    if (/\bcity\b/.test(q)) return { type: "recall", field: "city" };
    if (/\bservice\b/.test(q)) return { type: "recall", field: "service" };
    if (/\bname\b/.test(q)) return { type: "recall", field: "name" };
    if (/\bpet\b/.test(q)) return { type: "recall", field: "petName" };
    if (/\bdate\b/.test(q)) return { type: "recall", field: "dates" };
    if (/\btime\b/.test(q)) return { type: "recall", field: "timeWindow" };
    return { type: "recall", field: "all" };
  }

  if (/\bforget (my )?(dog|pet|cat) name\b/.test(q)) {
    return { type: "forget_field", field: "petName" };
  }

  const correction = q.match(
    /\b(?:actually|instead(?: of)?)\s+(.+)$/i,
  );
  if (correction?.[1]) {
    const value = clean(correction[1]).replace(/[.?!]+$/, "");
    // Prefer the affirmative service before "not <old service>".
    const affirmative = value.split(/\bnot\b/i)[0] || value;
    const service = detectServiceLabel(affirmative) || detectServiceLabel(value);
    if (service) return { type: "correct", field: "service", value: service };
    const cityState = affirmative.match(/^([A-Za-z .'-]+?)(?:,\s*([A-Z]{2}))?$/i);
    if (cityState && !/\b(not|walking|boarding|sitting)\b/i.test(cityState[1]!)) {
      return {
        type: "correct",
        field: "city",
        value: clean(cityState[1]),
      };
    }
  }

  return null;
}

export function formatRecallReply(
  state: CompanionSessionState,
  field: keyof CompanionSessionState | "all",
): string {
  const label = (key: keyof CompanionSessionState, title: string) => {
    const value = state[key];
    if (value == null || value === "" || (Array.isArray(value) && !value.length)) {
      return `I don't have your ${title} yet in this chat.`;
    }
    return `You told me your ${title} is **${value}**.`;
  };

  if (field === "all") {
    const parts = [
      state.name ? `name **${state.name}**` : null,
      state.city || state.state || state.zip
        ? `location **${[state.city, state.state, state.zip].filter(Boolean).join(", ")}**`
        : null,
      state.service ? `service **${state.service}**` : null,
      state.petName ? `pet **${state.petName}**` : null,
    ].filter(Boolean);
    return parts.length
      ? `From this chat I have: ${parts.join("; ")}.`
      : "I don't have saved details from this chat yet.";
  }

  if (field === "zip") return label("zip", "ZIP");
  if (field === "city") {
    const place = [state.city, state.state].filter(Boolean).join(", ");
    return place
      ? `You told me your city is **${place}**.`
      : "I don't have your city yet in this chat.";
  }
  if (field === "service") return label("service", "service");
  if (field === "name") return label("name", "name");
  if (field === "petName") return label("petName", "pet name");
  if (field === "dates") return label("dates", "date");
  if (field === "timeWindow") return label("timeWindow", "time window");
  return label(field, String(field));
}

export function formatSessionSummary(state: CompanionSessionState): string {
  const lines = [
    state.name ? `Name: ${state.name}` : null,
    state.role ? `Role: ${state.role}` : null,
    state.city || state.state || state.zip
      ? `Location: ${[state.city, state.state, state.zip].filter(Boolean).join(", ")}`
      : null,
    state.service ? `Service: ${state.service}` : null,
    state.timeWindow ? `Time: ${state.timeWindow}` : null,
    state.dates ? `Dates: ${state.dates}` : null,
    state.petName
      ? `Pet: ${state.petName}${state.petSpecies ? ` (${state.petSpecies})` : ""}`
      : null,
    state.namedGuru ? `Named Guru: ${state.namedGuru}` : null,
    state.namedEvent ? `Named event: ${state.namedEvent}` : null,
    state.goal ? `Goal: ${state.goal}` : null,
    state.pendingWorkflow ? `Open task: ${state.pendingWorkflow}` : null,
  ].filter(Boolean);

  if (!lines.length) {
    return "We haven't locked any details yet in this chat — ask away and I'll keep track.";
  }
  return `Here's what I have from this conversation so far:\n- ${lines.join("\n- ")}`;
}

export function applySessionMetaIntent(
  state: CompanionSessionState,
  intent: NonNullable<SessionMetaIntent>,
): { state: CompanionSessionState; reply: string } {
  if (intent.type === "start_over") {
    return {
      state: emptyCompanionSessionState(),
      reply:
        "Fresh start — I cleared this chat's saved details (name, city, ZIP, service, pets, and open tasks). What would you like to do next?",
    };
  }
  if (intent.type === "summarise") {
    return { state, reply: formatSessionSummary(state) };
  }
  if (intent.type === "recall") {
    return { state, reply: formatRecallReply(state, intent.field) };
  }
  if (intent.type === "forget_field") {
    const next = { ...state, [intent.field]: null } as CompanionSessionState;
    return {
      state: next,
      reply: `Got it — I forgot your ${String(intent.field).replace(/([A-Z])/g, " $1").toLowerCase()} from this chat.`,
    };
  }
  if (intent.type === "correct") {
    const next = {
      ...state,
      [intent.field]: intent.value,
      corrections: [...state.corrections, `${String(intent.field)}→${intent.value}`],
    } as CompanionSessionState;
    return {
      state: next,
      reply: `Updated — I'll use **${intent.value}** as your ${String(intent.field)} going forward.`,
    };
  }
  return { state, reply: formatSessionSummary(state) };
}

export function sessionStatePromptBlock(state: CompanionSessionState): string {
  const lines = [
    "# COMPANION SESSION STATE (authoritative for this chat)",
    `- name: ${state.name || "(unknown)"}`,
    `- role: ${state.role || "(unknown)"}`,
    `- city: ${state.city || "(unknown)"}`,
    `- state: ${state.state || "(unknown)"}`,
    `- zip: ${state.zip || "(unknown)"}`,
    `- service: ${state.service || "(unknown)"}`,
    `- dates: ${state.dates || "(unknown)"}`,
    `- timeWindow: ${state.timeWindow || "(unknown)"}`,
    `- petName: ${state.petName || "(unknown)"}`,
    `- petSpecies: ${state.petSpecies || "(unknown)"}`,
    `- namedGuru: ${state.namedGuru || "(none)"}`,
    `- namedEvent: ${state.namedEvent || "(none)"}`,
    `- pendingWorkflow: ${state.pendingWorkflow || "(none)"}`,
    "",
    "Never re-ask a known field. On recall questions, answer from this block.",
  ];
  return lines.join("\n");
}
