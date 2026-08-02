"use client";

/**
 * Taco — Ambassador Advocate floating assistant.
 * Dashboard: signed-in Ambassador growth. Public: ambassadors / affiliate FAQs.
 */

import OfficerFloatingAssistant, {
  type OfficerSurface,
} from "@/components/officers/OfficerFloatingAssistant";
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

const TACO_DASHBOARD_CHIPS = [
  {
    id: "what_ambassadors_do",
    label: "What we do",
    prompt: "What do Ambassadors do?",
  },
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
] as const;

/** Exact marketing FAQ question strings for public Ambassador help. */
const TACO_PUBLIC_CHIPS = [
  {
    id: "what_ambassadors_do",
    label: "What they do",
    prompt: "What do Ambassadors do?",
  },
  {
    id: "who_can_join",
    label: "Who can join?",
    prompt: "Who can become a SitGuru Ambassador?",
  },
  {
    id: "social_following",
    label: "Need followers?",
    prompt: "Do I need a huge social following?",
  },
  {
    id: "vs_guru",
    label: "Vs Guru?",
    prompt: "Is this the same as becoming a Guru?",
  },
] as const;

export default function TacoFloatingAssistant({
  accessToken = null,
  surface = "dashboard",
}: {
  accessToken?: string | null;
  surface?: OfficerSurface;
}) {
  const profile = TACO_OFFICER_PROMPT;
  const isPublic = surface === "public";

  return (
    <OfficerFloatingAssistant
      officerId="taco"
      displayName={profile.displayName}
      title={profile.title}
      avatarSrc={`${profile.avatarSrc}?v=2`}
      greetingMarkdown={
        isPublic
          ? "**Taco here — your Ambassador Advocate!** Curious about the Ambassador or affiliate pack? Tap a chip or ask me anything."
          : profile.greetingMarkdown
      }
      tipStatement={
        isPublic
          ? "Taco here! Ambassador FAQs, referrals, and growing the pack — ask away!"
          : profile.tipStatement
      }
      composerPlaceholder={
        isPublic
          ? "Ask Taco about Ambassadors, referrals, rewards…"
          : profile.composerPlaceholder
      }
      footerLabel={
        isPublic
          ? "Public Ambassador FAQ · Exact marketing copy"
          : profile.footerLabel
      }
      subtitle={
        isPublic
          ? "Ambassador advocate · growth pages"
          : "Ambassador advocate · your pack only"
      }
      theme={TACO_THEME}
      chips={isPublic ? TACO_PUBLIC_CHIPS : TACO_DASHBOARD_CHIPS}
      accessToken={accessToken}
      surface={isPublic ? "public" : "dashboard"}
      avatarObjectPosition="center 22%"
    />
  );
}
