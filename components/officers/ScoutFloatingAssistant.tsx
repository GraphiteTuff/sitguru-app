"use client";

/**
 * Scout — Guru Logistics Captain / Matching Officer floating assistant.
 * Dashboard: signed-in Guru logistics. Public: become-a-guru marketing FAQs.
 */

import OfficerFloatingAssistant, {
  type OfficerSurface,
} from "@/components/officers/OfficerFloatingAssistant";
import { SCOUT_OFFICER_PROMPT } from "@/lib/ai/officer-prompts";
import { getCompanionBenefitsChip } from "@/lib/companions/companion-benefits";

const SCOUT_BENEFITS_CHIP = getCompanionBenefitsChip("scout");

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
  {
    id: "update_profile",
    label: "Update Profile",
    prompt: "How do I update my Guru profile?",
  },
  {
    id: "pawreport",
    label: "PawReport",
    prompt: "What is PawReport Live?",
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
    id: SCOUT_BENEFITS_CHIP.id,
    label: SCOUT_BENEFITS_CHIP.label,
    prompt: SCOUT_BENEFITS_CHIP.prompt,
    localResponse: SCOUT_BENEFITS_CHIP.response,
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
    id: "set_rates",
    label: "My rates",
    prompt: "Can I set my own rates?",
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
  guruName = null,
  guruEmail = null,
  surface = "dashboard",
}: {
  accessToken?: string | null;
  providerId?: string | null;
  /** Signed-in Guru display name for personalized greetings + prompt context. */
  guruName?: string | null;
  guruEmail?: string | null;
  surface?: OfficerSurface;
}) {
  const profile = SCOUT_OFFICER_PROMPT;
  const isPublic = surface === "public";
  const safeName =
    typeof guruName === "string" && guruName.trim() ? guruName.trim() : null;

  const personalizedGreeting = safeName
    ? `Hi ${safeName.split(/\s+/)[0] || safeName}! I'm your Scout AI Companion. How can I assist you with your dashboard schedule today?`
    : "Hi! I'm your Scout AI Companion. How can I assist you with your dashboard schedule today?";

  const personalizedTip = safeName
    ? `Hi ${safeName.split(/\s+/)[0] || safeName}! Scout here — tap to review your dashboard schedule.`
    : profile.tipStatement;

  return (
    <OfficerFloatingAssistant
      officerId="scout"
      displayName={profile.displayName}
      title={isPublic ? "Guru Matching Officer" : profile.title}
      avatarSrc={`${profile.avatarSrc}?v=6`}
      greetingMarkdown={
        isPublic
          ? "**Scout reporting for duty.** I'm here to help you sign up as a Guru and answer onboarding questions — tap a chip or ask away."
          : personalizedGreeting
      }
      tipStatement={
        isPublic
          ? "Scout here! Free to apply? Payments? Ask your Guru Matching Officer."
          : personalizedTip
      }
      composerPlaceholder={
        isPublic
          ? "Ask Scout about applying, payments, services…"
          : profile.composerPlaceholder
      }
      footerLabel={
        isPublic
          ? "Public Guru FAQ · Exact marketing copy"
          : safeName
            ? `${safeName}'s Guru snapshot · Read-only`
            : profile.footerLabel
      }
      subtitle={
        isPublic
          ? "Matching officer · Guru signup help"
          : safeName
            ? `Logistics captain · ${safeName}'s routes`
            : "Logistics captain · your routes only"
      }
      theme={SCOUT_THEME}
      chips={isPublic ? SCOUT_PUBLIC_CHIPS : SCOUT_DASHBOARD_CHIPS}
      accessToken={accessToken}
      providerId={providerId}
      guruName={safeName}
      guruEmail={guruEmail}
      surface={isPublic ? "public" : "dashboard"}
      avatarObjectPosition="center 22%"
    />
  );
}
