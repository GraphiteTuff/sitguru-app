// lib/messaging/handoff.ts
/**
 * Human-in-the-loop elevation — detect safety / sentiment / manager requests
 * and disable AI assist on the conversation.
 */

import type { HandoffEvaluation, HandoffTrigger } from "@/lib/messaging/types";

const SAFETY_PATTERNS: Array<{ trigger: HandoffTrigger; re: RegExp; label: string }> = [
  {
    trigger: "safety",
    re: /\b(emergency|911|injured|bleeding|attack(ed)?|abuse|neglect|poison|choking|lost dog|dog ?fight|bite|bitten|unsafe|danger(ous)?|threat)\b/i,
    label: "safety concern",
  },
  {
    trigger: "manager_request",
    re: /\b((speak|talk|connect).{0,24}(manager|supervisor|human|agent|representative|real person)|customer service|customer support|escalate|complaint)\b/i,
    label: "human / manager request",
  },
  {
    trigger: "explicit_human",
    re: /\b(stop (the )?ai|not (a )?bot|real (person|human)|live agent|human please)\b/i,
    label: "explicit human request",
  },
  {
    trigger: "signup_intent",
    re: /\b((sign|signing)[- ]?up|create (an? )?account|join (as|sitguru|the pack)|become (a )?(guru|ambassador|partner|handler)|register (now|today)?|join the pack)\b/i,
    label: "signup intent",
  },
  {
    trigger: "booking_intent",
    re: /\b((book|booking|schedule|reserve).{0,24}(walk|sit|sitting|boarding|visit|guru)|book (a |an )?(walk|sitter|boarding)|need (a )?(walk|sitter) (today|tomorrow|asap|now)|schedule (a )?sit)\b/i,
    label: "booking intent",
  },
  {
    trigger: "negative_sentiment",
    re: /\b(scam|fraud|lawsuit|lawyer|attorney|refund now|worst|horrible|terrible|furious|angry|frustrated|frustration|rip[- ]?off|never again|hate (this|sitguru)|unacceptable|ridiculous)\b/i,
    label: "strong negative sentiment / frustration",
  },
];

const EMAIL_RE =
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE =
  /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/;

export function extractLeadContact(messageText: string): {
  email: string | null;
  phone: string | null;
} {
  const text = String(messageText || "");
  const emailMatch = text.match(EMAIL_RE);
  const phoneMatch = text.match(PHONE_RE);
  let phone: string | null = null;
  if (phoneMatch?.[0]) {
    const digits = phoneMatch[0].replace(/\D/g, "");
    if (digits.length === 10) phone = `+1${digits}`;
    else if (digits.length === 11 && digits.startsWith("1")) phone = `+${digits}`;
    else if (phoneMatch[0].startsWith("+")) phone = phoneMatch[0].replace(/[^\d+]/g, "");
  }
  return {
    email: emailMatch?.[0]?.toLowerCase() || null,
    phone,
  };
}

export function evaluateHandoffNeed(messageText: string): HandoffEvaluation {
  const text = String(messageText || "").trim();
  if (!text) {
    return { shouldHandoff: false, triggers: [], reason: "" };
  }

  const triggers: HandoffTrigger[] = [];
  const labels: string[] = [];

  for (const rule of SAFETY_PATTERNS) {
    if (rule.re.test(text)) {
      if (!triggers.includes(rule.trigger)) triggers.push(rule.trigger);
      labels.push(rule.label);
    }
  }

  if (!triggers.length) {
    return { shouldHandoff: false, triggers: [], reason: "" };
  }

  return {
    shouldHandoff: true,
    triggers,
    reason: `Auto-elevated: ${labels.join(", ")}.`,
  };
}
