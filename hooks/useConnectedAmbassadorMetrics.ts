/**
 * Connected ambassador metrics circuit.
 * Single source of truth: `referralCode` — charts freeze at 0 when unset.
 */

"use client";

import { useEffect, useState } from "react";
import { AMBASSADOR_SOCIAL_MILESTONES } from "@/lib/actions/officer-tools";

export type ConnectedMetrics = {
  referralCode: string | null;
  isCircuitConnected: boolean;
  clicksCount: number;
  referralCount: number;
  unlockedCommissions: number;
  loading: boolean;
  error: string | null;
  referralLink: string | null;
  milestones: ReadonlyArray<{
    signups: number;
    label: string;
    reward: number;
  }>;
};

const ZERO_STATE: Omit<ConnectedMetrics, "loading" | "error" | "milestones"> = {
  referralCode: null,
  isCircuitConnected: false,
  clicksCount: 0,
  referralCount: 0,
  unlockedCommissions: 0,
  referralLink: null,
};

type LedgerMeResponse = {
  ok?: boolean;
  error?: string;
  referralLink?: string;
  clicksTotal?: number;
  referralsTotal?: number;
  pendingCommissions?: number;
  lifetimePaid?: number;
  profile?: {
    referral_code_slug?: string | null;
    display_name?: string | null;
  };
};

function normalizeCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Pulls ambassador tracking metrics through the authenticated ledger.
 * Circuit is connected only when a non-empty `referralCode` is present.
 */
export function useConnectedAmbassadorMetrics(userSessionId?: string | null) {
  const [metrics, setMetrics] = useState<ConnectedMetrics>({
    ...ZERO_STATE,
    loading: true,
    error: null,
    milestones: AMBASSADOR_SOCIAL_MILESTONES,
  });

  useEffect(() => {
    let cancelled = false;

    const checkTrackingCircuit = async () => {
      try {
        // 1) Session-bound ledger — never trust a bare public code query.
        const response = await fetch("/api/ambassador/ledger/me", {
          method: "GET",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        const payload = (await response.json()) as LedgerMeResponse;

        if (cancelled) return;

        if (!response.ok || !payload.ok) {
          setMetrics({
            ...ZERO_STATE,
            loading: false,
            error:
              payload.error ||
              "Unable to sync ambassador metrics. Initialize your tracking code.",
            milestones: AMBASSADOR_SOCIAL_MILESTONES,
          });
          return;
        }

        const referralCode = normalizeCode(
          payload.profile?.referral_code_slug,
        );

        // 2) Empty / null code → circuit broken, charts held at zero.
        if (!referralCode) {
          setMetrics({
            ...ZERO_STATE,
            loading: false,
            error: null,
            milestones: AMBASSADOR_SOCIAL_MILESTONES,
          });
          return;
        }

        setMetrics({
          referralCode,
          isCircuitConnected: true,
          clicksCount: Number(payload.clicksTotal) || 0,
          referralCount: Number(payload.referralsTotal) || 0,
          unlockedCommissions:
            Number(payload.pendingCommissions) ||
            Number(payload.lifetimePaid) ||
            0,
          referralLink: payload.referralLink || null,
          loading: false,
          error: null,
          milestones: AMBASSADOR_SOCIAL_MILESTONES,
        });
      } catch (err) {
        console.error("Metrics sync fallback pipeline error:", err);
        if (!cancelled) {
          setMetrics({
            ...ZERO_STATE,
            loading: false,
            error: "Metrics sync fallback pipeline error.",
            milestones: AMBASSADOR_SOCIAL_MILESTONES,
          });
        }
      }
    };

    void checkTrackingCircuit();
    return () => {
      cancelled = true;
    };
  }, [userSessionId]);

  return metrics;
}
