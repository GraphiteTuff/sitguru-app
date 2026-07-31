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
    trigger: "negative_sentiment",
    re: /\b(scam|fraud|lawsuit|lawyer|attorney|refund now|worst|horrible|terrible|furious|angry|frustrated|frustration|rip[- ]?off|never again|hate (this|sitguru)|unacceptable|ridiculous)\b/i,
    label: "strong negative sentiment / frustration",
  },
];

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
