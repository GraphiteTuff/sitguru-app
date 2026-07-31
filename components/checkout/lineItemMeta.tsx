import type { ReactNode } from "react";
import type {
  PricingLineItem,
  PricingLineItemCode,
} from "@/lib/billing/pricingCalculator";
import { PawIcon } from "@/components/ui/PawIcon";

export function lineItemIcon(code: PricingLineItemCode): ReactNode {
  switch (code) {
    case "BASE_VISIT":
      return <PawIcon size={16} contrast="light" solid aria-hidden />;
    case "ADDITIONAL_PET":
      return "🐕";
    case "HOLIDAY_SURGE":
      return "🎄";
    case "AMBASSADOR_DISCOUNT":
      return "🎟️";
    case "PAWPERKS_REDEMPTION":
      return "✨";
    default:
      return "•";
  }
}

export function displayLineLabel(
  item: PricingLineItem,
  ambassadorCode?: string | null,
): string {
  if (item.code === "BASE_VISIT") return "Base Rate";
  if (item.code === "ADDITIONAL_PET") return "Extra Pet Multiplier";
  if (item.code === "HOLIDAY_SURGE") return "Holiday Surge";
  if (item.code === "AMBASSADOR_DISCOUNT") {
    return ambassadorCode
      ? `Ambassador Credit applied from code ${ambassadorCode}`
      : "Ambassador Credit applied";
  }
  if (item.code === "PAWPERKS_REDEMPTION") {
    return "PawPerks credit applied";
  }
  return item.label;
}
