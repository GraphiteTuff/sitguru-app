"use client";

/**
 * Expandable triple-lock cost panel for transparent checkout pricing.
 */

import { ChevronDown } from "lucide-react";
import {
  formatUsd,
  type BookingPricingBreakdown,
} from "@/lib/billing/pricingCalculator";
import { displayLineLabel, lineItemIcon } from "@/components/checkout/lineItemMeta";

type CheckoutCostBreakdownProps = {
  pricing: BookingPricingBreakdown;
  expanded: boolean;
  onToggle: () => void;
};

export default function CheckoutCostBreakdown({
  pricing,
  expanded,
  onToggle,
}: CheckoutCostBreakdownProps) {
  const ambassadorCode = pricing.inputs.ambassadorCode;

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-[#f7fffb]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-emerald-50/60"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            Triple-lock cost context
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">
            {expanded ? "Hide itemized breakdown" : "View what you’re paying for"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black tabular-nums text-slate-900">
            {formatUsd(pricing.total)}
          </span>
          <ChevronDown
            className={[
              "h-4 w-4 text-emerald-700 transition-transform duration-300",
              expanded ? "rotate-180" : "",
            ].join(" ")}
          />
        </div>
      </button>

      <div
        className={[
          "grid transition-[grid-template-rows] duration-300 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <ul className="divide-y divide-emerald-50 border-t border-emerald-50">
            {pricing.lineItems.map((item) => (
              <li
                key={`${item.code}-${item.label}`}
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm shadow-sm ring-1 ring-emerald-100"
                    aria-hidden
                  >
                    {lineItemIcon(item.code)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {displayLineLabel(item, ambassadorCode)}
                    </p>
                    {item.quantity > 1 ? (
                      <p className="text-xs text-slate-500">
                        Qty {item.quantity} · {formatUsd(item.unitAmount)} each
                      </p>
                    ) : null}
                  </div>
                </div>
                <p
                  className={[
                    "shrink-0 text-sm font-bold tabular-nums",
                    item.amount < 0 ? "text-emerald-700" : "text-slate-900",
                  ].join(" ")}
                >
                  {formatUsd(item.amount)}
                </p>
              </li>
            ))}
          </ul>
          {pricing.discountTotal > 0 ? (
            <p className="border-t border-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              You’re saving {formatUsd(pricing.discountTotal)} with ambassador credit.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
