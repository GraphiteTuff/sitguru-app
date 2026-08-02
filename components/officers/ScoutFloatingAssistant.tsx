"use client";

/**
 * Scout — Guru Logistics Captain / Matching Officer floating assistant.
 * Dashboard: signed-in Guru logistics. Public: become-a-guru marketing FAQs.
 */

import OfficerFloatingAssistant, {
  type OfficerSurface,
} from "@/components/officers/OfficerFloatingAssistant";
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

const SCOUT_DASHBOARD_CHIPS = [
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

/** Exact marketing FAQ question strings for public signup help. */
const SCOUT_PUBLIC_CHIPS = [
  {
    id: "free_to_apply",
    label: "Free to apply?",
    prompt: "Is it free to apply?",
  },
  {
    id: "payments_work",
    label: "Payments",
    prompt: "How do payments work?",
  },
  {
    id: "services_offer",
    label: "Services",
    prompt: "What services can I offer?",
  },
  {
    id: "after_apply",
    label: "After I apply",
    prompt: "What happens after I apply?",
  },
] as const;

export default function ScoutFloatingAssistant({
  accessToken = null,
  providerId = null,
  surface = "dashboard",
}: {
  accessToken?: string | null;
  providerId?: string | null;
  surface?: OfficerSurface;
}) {
  const profile = SCOUT_OFFICER_PROMPT;
  const isPublic = surface === "public";

  return (
    <OfficerFloatingAssistant
      officerId="scout"
      displayName={profile.displayName}
      title={isPublic ? "Guru Matching Officer" : profile.title}
      avatarSrc={`${profile.avatarSrc}?v=6`}
      greetingMarkdown={
        isPublic
          ? "**Scout reporting for duty.** I'm here to help you sign up as a Guru and answer onboarding questions — tap a chip or ask away."
          : profile.greetingMarkdown
      }
      tipStatement={
        isPublic
          ? "Scout here! Free to apply? Payments? Ask your Guru Matching Officer."
          : profile.tipStatement
      }
      composerPlaceholder={
        isPublic
          ? "Ask Scout about applying, payments, services…"
          : profile.composerPlaceholder
      }
      footerLabel={
        isPublic
          ? "Public Guru FAQ · Exact marketing copy"
          : profile.footerLabel
      }
      subtitle={
        isPublic
          ? "Matching officer · Guru signup help"
          : "Logistics captain · your routes only"
      }
      theme={SCOUT_THEME}
      chips={isPublic ? SCOUT_PUBLIC_CHIPS : SCOUT_DASHBOARD_CHIPS}
      accessToken={accessToken}
      providerId={providerId}
      surface={isPublic ? "public" : "dashboard"}
      avatarObjectPosition="center 22%"
    />
  );
}
