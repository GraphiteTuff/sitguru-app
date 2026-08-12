/**
 * Shared Pet Parent booking deep-links and draft helpers.
 * Keep map/search map features out of this module.
 */

export const BOOKING_DRAFT_STORAGE_KEY = "sitguru_pet_parent_booking_draft_v1";

export type PetParentBookingDraft = {
  guruSlug: string;
  petId?: string;
  petName?: string;
  careZipCode?: string;
  careCity?: string;
  careState?: string;
  selectedService?: string;
  bookingDate?: string;
  bookingEndDate?: string;
  timeWindow?: string;
  visitLength?: string;
  bookingType?: string;
  notes?: string;
  express?: boolean;
  savedAt: string;
};

export type BuildPetParentBookUrlInput = {
  slug: string;
  petId?: string | null;
  zip?: string | null;
  service?: string | null;
  express?: boolean;
  rebook?: boolean;
  bookingDate?: string | null;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

export function buildPetParentBookUrl({
  slug,
  petId,
  zip,
  service,
  express = false,
  rebook = false,
  bookingDate,
}: BuildPetParentBookUrlInput) {
  const safeSlug = clean(slug);
  if (!safeSlug) return "/search";

  const params = new URLSearchParams();
  if (express || rebook) params.set("express", "1");
  if (rebook) params.set("rebook", "1");

  const safePetId = clean(petId);
  if (safePetId) params.set("pet_id", safePetId);

  const safeZip = clean(zip).replace(/\D/g, "").slice(0, 5);
  if (safeZip.length === 5) params.set("zip", safeZip);

  const safeService = clean(service);
  if (safeService) params.set("service", safeService);

  const safeDate = clean(bookingDate);
  if (safeDate) params.set("date", safeDate);

  const query = params.toString();
  return query ? `/book/${encodeURIComponent(safeSlug)}?${query}` : `/book/${encodeURIComponent(safeSlug)}`;
}

export function savePetParentBookingDraft(draft: PetParentBookingDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      BOOKING_DRAFT_STORAGE_KEY,
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function loadPetParentBookingDraft(
  guruSlug: string,
): PetParentBookingDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(BOOKING_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PetParentBookingDraft;
    if (clean(parsed?.guruSlug) !== clean(guruSlug)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPetParentBookingDraft() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function bookingReturnPathWithParams(
  guruSlug: string,
  search: string | URLSearchParams,
) {
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;
  const query = params.toString();
  return query
    ? `/book/${encodeURIComponent(guruSlug)}?${query}`
    : `/book/${encodeURIComponent(guruSlug)}`;
}
