"use client";

/**
 * High-conversion PawPerks redemption card for checkout.
 */

import { formatUsd } from "@/lib/billing/pricingCalculator";
import {
  formatPawPerks,
  pointsToUsd,
} from "@/lib/pawperks/constants";

type CheckoutPawPerksCardProps = {
  petName: string;
  availablePoints: number;
  maxRedeemablePoints: number;
  pointsToRedeem: number;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onPointsChange: (points: number) => void;
};

export default function CheckoutPawPerksCard({
  petName,
  availablePoints,
  maxRedeemablePoints,
  pointsToRedeem,
  enabled,
  onEnabledChange,
  onPointsChange,
}: CheckoutPawPerksCardProps) {
  if (availablePoints <= 0 || maxRedeemablePoints <= 0) return null;

  const maxUsd = pointsToUsd(maxRedeemablePoints);

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700">
            PawPerks vault
          </p>
          <p className="mt-1 text-sm font-black leading-snug text-slate-900">
            ✨ {petName} has {formatPawPerks(availablePoints)} available! Apply
            points to save up to {formatUsd(maxUsd)}.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => {
            const next = !enabled;
            onEnabledChange(next);
            onPointsChange(next ? maxRedeemablePoints : 0);
          }}
          className={[
            "relative h-8 w-14 shrink-0 rounded-full transition",
            enabled ? "bg-emerald-600" : "bg-slate-300",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition",
              enabled ? "left-7" : "left-1",
            ].join(" ")}
          />
        </button>
      </div>

      {enabled ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Redeem {pointsToRedeem} pts</span>
            <span className="text-emerald-700">
              −{formatUsd(pointsToUsd(pointsToRedeem))}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={maxRedeemablePoints}
            step={5}
            value={Math.min(pointsToRedeem, maxRedeemablePoints)}
            onChange={(event) =>
              onPointsChange(Math.floor(Number(event.target.value) || 0))
            }
            className="w-full accent-emerald-600"
            aria-label="PawPerks to redeem"
          />
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <span>0</span>
            <span>{maxRedeemablePoints} max</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
