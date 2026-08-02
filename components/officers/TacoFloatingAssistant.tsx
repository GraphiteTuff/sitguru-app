"use client";

/**
 * Taco — Ambassador Advocate floating assistant.
 * Mounted on Ambassador dashboard layouts. Streams to /api/ai/officer-stream.
 */

import OfficerFloatingAssistant from "@/components/officers/OfficerFloatingAssistant";
import { TACO_OFFICER_PROMPT } from "@/lib/ai/officer-prompts";

const TACO_THEME = {
  /** Ambassador green palette accents */
  brand: "#166534",
  brandDeep: "#0D5C3A",
  cream: "#f8fbf6",
  chipClass:
    "px-4 py-1.5 bg-[#166534] text-white text-xs font-medium rounded-full shadow-sm hover:bg-[#14532d] active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
  ringClass: "ring-green-100",
  tableHeadClass:
    "bg-green-50 text-[10px] font-black uppercase tracking-[0.12em] text-green-900",
  tableBorderClass: "border-green-100",
} as const;

const TACO_CHIPS = [
  {
    id: "pack_pulse",
    label: "Pack Pulse",
    prompt:
      "Give me a quick Pack Pulse: how are we doing growing the pack — referrals, link clicks, and treat commissions right now?",
  },
  {
    id: "pounce_leads",
    label: "Pounce Leads",
    prompt:
      "Help me pouncing on new leads — what should I focus on next to boost referrals and link clicks?",
  },
  {
    id: "treat_commissions",
    label: "Treat Commissions",
    prompt:
      "Break down my pending and approved treat commissions, and tell me what's still waiting on audit.",
  },
  {
    id: "milestones",
    label: "Milestones",
    prompt:
      "Where am I on social milestones for growing the pack, and how many verified signups until the next reward?",
  },
] as const;

export default function TacoFloatingAssistant({
  accessToken = null,
}: {
  accessToken?: string | null;
}) {
  const profile = TACO_OFFICER_PROMPT;

  return (
    <OfficerFloatingAssistant
      officerId="taco"
      displayName={profile.displayName}
      title={profile.title}
      avatarSrc={`${profile.avatarSrc}?v=2`}
      greetingMarkdown={profile.greetingMarkdown}
      tipStatement={profile.tipStatement}
      composerPlaceholder={profile.composerPlaceholder}
      footerLabel={profile.footerLabel}
      subtitle="Ambassador advocate · your pack only"
      theme={TACO_THEME}
      chips={TACO_CHIPS}
      accessToken={accessToken}
      avatarObjectPosition="center 22%"
    />
  );
}
