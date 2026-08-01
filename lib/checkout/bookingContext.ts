/**
 * Booking context shown in the checkout drawer header / timeline.
 * Live pet profile (via pet_id) wins over denormalized booking snapshots.
 */

import {
  resolveBookingPet,
  type LivePetProfile,
} from "@/lib/bookings/booking-pet";

export type CheckoutBookingContext = {
  petName: string;
  petPhotoUrl: string | null;
  guruName: string;
  guruAvatarUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  durationLabel: string;
  daysCount: number;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatDisplayDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function buildDurationLabel(daysCount: number): string {
  const days = Math.max(1, Math.floor(daysCount || 1));
  return days === 1 ? "1 day of care" : `${days} days of care`;
}

/**
 * Normalize booking row fields (and optional live pet) into drawer context.
 */
export function extractCheckoutBookingContext(
  booking: Record<string, unknown> | null | undefined,
  overrides?: Partial<CheckoutBookingContext> & {
    daysCount?: number;
    livePet?: LivePetProfile | null;
  },
): CheckoutBookingContext {
  const daysCount = Math.max(
    1,
    Math.floor(
      overrides?.daysCount ||
        Number(booking?.days_count) ||
        Number(booking?.duration_days) ||
        1,
    ),
  );

  const startRaw =
    overrides?.startDate ||
    asText(booking?.requested_start_date) ||
    asText(booking?.start_date) ||
    asText(booking?.date_range_label) ||
    null;

  const endRaw =
    overrides?.endDate ||
    asText(booking?.requested_end_date) ||
    asText(booking?.end_date) ||
    null;

  const resolved = resolveBookingPet(
    booking || undefined,
    overrides?.livePet || null,
  );

  const petName = overrides?.petName || resolved.name || "your pet";

  const guruName =
    overrides?.guruName ||
    asText(booking?.guru_name) ||
    asText(booking?.sitter_name) ||
    asText(booking?.provider_name) ||
    "your Guru";

  const petPhotoUrl =
    overrides?.petPhotoUrl ||
    resolved.photoUrl ||
    asText(booking?.pet_photo_url) ||
    asText(booking?.petPhotoUrl) ||
    null;

  const guruAvatarUrl =
    overrides?.guruAvatarUrl ||
    asText(booking?.guru_avatar_url) ||
    asText(booking?.guruAvatarUrl) ||
    asText(booking?.guru_photo_url) ||
    null;

  return {
    petName,
    petPhotoUrl: petPhotoUrl || null,
    guruName,
    guruAvatarUrl: guruAvatarUrl || null,
    startDate: formatDisplayDate(startRaw),
    endDate: formatDisplayDate(endRaw),
    durationLabel: overrides?.durationLabel || buildDurationLabel(daysCount),
    daysCount,
  };
}

export function checkoutHeadline(context: CheckoutBookingContext): string {
  const pet = context.petName || "your pet";
  const guru = context.guruName || "your Guru";
  return `Securing ${pet}'s Adventure with Guru ${guru}`;
}
