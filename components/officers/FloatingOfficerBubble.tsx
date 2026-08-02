"use client";

/**
 * Public + dashboard mount API for Scout (GURU) and Taco (AMBASSADOR).
 *
 * Usage:
 *   <FloatingOfficerBubble role="GURU" />
 *   <FloatingOfficerBubble role="AMBASSADOR" />
 *
 * Public marketing guests may omit session tokens — the stream endpoint
 * serves marketing FAQ mode without requiring authentication.
 */

import { SafeAssistantBubble } from "@/components/messaging/ChatBubbleErrorBoundary";
import ScoutFloatingAssistant from "@/components/officers/ScoutFloatingAssistant";
import TacoFloatingAssistant from "@/components/officers/TacoFloatingAssistant";
import type { OfficerSurface } from "@/components/officers/OfficerFloatingAssistant";

export type FloatingOfficerRole = "GURU" | "AMBASSADOR";

export type FloatingOfficerBubbleProps = {
  role: FloatingOfficerRole;
  /**
   * Optional bearer/session token for signed-in dashboard surfaces.
   * Public guests should leave this unset — never pass `"undefined"`.
   */
  accessToken?: string | null;
  /** Scout-only optional provider id when known. */
  providerId?: string | null;
  /**
   * `public` (default) = marketing FAQ guest mode.
   * `dashboard` = session-scoped Guru / Ambassador snapshots.
   */
  surface?: OfficerSurface;
};

function resolveSurface(
  surface: OfficerSurface | undefined,
): OfficerSurface {
  return surface === "dashboard" ? "dashboard" : "public";
}

export default function FloatingOfficerBubble({
  role,
  accessToken = null,
  providerId = null,
  surface = "public",
}: FloatingOfficerBubbleProps) {
  const safeRole = role === "AMBASSADOR" ? "AMBASSADOR" : "GURU";
  const safeSurface = resolveSurface(surface);
  const safeToken =
    typeof accessToken === "string" && accessToken.trim()
      ? accessToken.trim()
      : null;
  const safeProviderId =
    typeof providerId === "string" && providerId.trim()
      ? providerId.trim()
      : null;

  return (
    <SafeAssistantBubble>
      {safeRole === "AMBASSADOR" ? (
        <TacoFloatingAssistant
          accessToken={safeToken}
          surface={safeSurface}
        />
      ) : (
        <ScoutFloatingAssistant
          accessToken={safeToken}
          providerId={safeProviderId}
          surface={safeSurface}
        />
      )}
    </SafeAssistantBubble>
  );
}
