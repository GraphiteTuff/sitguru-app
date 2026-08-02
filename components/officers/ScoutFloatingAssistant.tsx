"use client";

/**
 * Scout — Guru Logistics Captain floating assistant.
 * Mounted on Guru provider dashboard layouts. Streams to /api/ai/officer-stream.
 */

import OfficerFloatingAssistant from "@/components/officers/OfficerFloatingAssistant";
import { SCOUT_OFFICER_PROMPT } from "@/lib/ai/officer-prompts";

const SCOUT_THEME = {
  /** Provider dashboard mint / emerald palette */
  brand: "#047857",
  brandDeep: "#065f46",
  cream: "#f7fffb",
  chipClass:
    "px-4 py-1.5 bg-[#047857] text-white text-xs font-medium rounded-full shadow-sm hover:bg-[#065f46] active:scale-95 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
  ringClass: "ring-emerald-100",
  tableHeadClass:
    "bg-emerald-50 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-900",
  tableBorderClass: "border-emerald-100",
} as const;

const SCOUT_CHIPS = [
  {
    id: "trail_check",
    label: "Trail Check",
    prompt:
      "Run a Trail Check: summarize my assigned walks and what needs attention for tracking the trail today.",
  },
  {
    id: "safety_checks",
    label: "Safety Checks",
    prompt:
      "Walk me through safety checks for my upcoming visits — anything I should prep before route completion?",
  },
  {
    id: "cert_badges",
    label: "Cert Badges",
    prompt:
      "How am I doing on earning your certification badges in SitGuru University, and what's my next step?",
  },
  {
    id: "payout_cache",
    label: "Payout Ready",
    prompt:
      "Check my provider payout cache — is Stripe/PayPal ready, and are any recent visit payouts still pending?",
  },
] as const;

export default function ScoutFloatingAssistant({
  accessToken = null,
  providerId = null,
}: {
  accessToken?: string | null;
  providerId?: string | null;
}) {
  const profile = SCOUT_OFFICER_PROMPT;

  return (
    <OfficerFloatingAssistant
      officerId="scout"
      displayName={profile.displayName}
      title={profile.title}
      avatarSrc={profile.avatarSrc}
      greetingMarkdown={profile.greetingMarkdown}
      tipStatement={profile.tipStatement}
      composerPlaceholder={profile.composerPlaceholder}
      footerLabel={profile.footerLabel}
      subtitle="Logistics captain · your routes only"
      theme={SCOUT_THEME}
      chips={SCOUT_CHIPS}
      accessToken={accessToken}
      providerId={providerId}
    />
  );
}
