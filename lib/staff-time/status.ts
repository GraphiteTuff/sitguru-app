export const PAYMENT_PERIOD_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "ready_for_payment",
  "processing",
  "paid",
  "needs_correction",
] as const;

export type PaymentPeriodStatus = (typeof PAYMENT_PERIOD_STATUSES)[number];

export const TIME_ENTRY_STATUSES = ["draft", "submitted", "locked"] as const;
export type TimeEntryStatus = (typeof TIME_ENTRY_STATUSES)[number];

export function paymentStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "approved":
      return "Approved";
    case "ready_for_payment":
      return "Ready for Payment";
    case "processing":
      return "Processing";
    case "paid":
      return "Paid";
    case "needs_correction":
      return "Needs Correction";
    default:
      return status.replaceAll("_", " ");
  }
}

export function paymentStatusTone(
  status: string,
): "neutral" | "amber" | "emerald" | "sky" | "rose" {
  switch (status) {
    case "submitted":
    case "needs_correction":
      return "amber";
    case "approved":
    case "ready_for_payment":
      return "sky";
    case "processing":
      return "sky";
    case "paid":
      return "emerald";
    default:
      return "neutral";
  }
}

/** Entries editable by the team member. */
export function canEditTimeEntry(status: string, periodStatus: string): boolean {
  if (status === "locked") return false;
  if (["approved", "ready_for_payment", "processing", "paid"].includes(periodStatus)) {
    return false;
  }
  return status === "draft" || periodStatus === "needs_correction" || periodStatus === "draft";
}
