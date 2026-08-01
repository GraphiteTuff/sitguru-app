/**
 * Server/client helpers to load live pet rows for booking lists.
 */

import {
  BOOKING_LIVE_PET_SELECT,
  collectBookingPetIds,
  getBookingPetId,
  mapPetsById,
  resolveBookingPet,
  type BookingPetLink,
  type LivePetProfile,
  type ResolvedBookingPet,
} from "@/lib/bookings/booking-pet";

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      in: (
        column: string,
        values: string[],
      ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
    };
  };
};

export async function loadLivePetsByIds(
  client: SupabaseLike,
  petIds: string[],
): Promise<Map<string, LivePetProfile>> {
  const unique = Array.from(new Set(petIds.filter(Boolean)));
  if (unique.length === 0) return new Map();

  const { data, error } = await client
    .from("pets")
    .select(BOOKING_LIVE_PET_SELECT)
    .in("id", unique);

  if (error || !Array.isArray(data)) {
    return new Map();
  }

  return mapPetsById(data as LivePetProfile[]);
}

export async function hydrateBookingsWithLivePets<T extends BookingPetLink>(
  client: SupabaseLike,
  bookings: T[],
): Promise<
  Array<
    T & {
      resolvedPet: ResolvedBookingPet;
    }
  >
> {
  const petsById = await loadLivePetsByIds(
    client,
    collectBookingPetIds(bookings),
  );

  return bookings.map((booking) => {
    const petId = getBookingPetId(booking);
    const live = petId ? petsById.get(petId) || null : null;
    return {
      ...booking,
      resolvedPet: resolveBookingPet(booking, live),
    };
  });
}

/**
 * Build write-time fallback cache from the live pet row.
 * Prefer these over client-supplied snapshot strings when pet_id is linked.
 */
export function buildBookingPetWriteCache(livePet: LivePetProfile | null, fallback: {
  petId?: string | null;
  petName?: string;
  petPhotoUrl?: string | null;
}) {
  const petId = livePet?.id || fallback.petId || null;
  const petName =
    (livePet?.name || "").trim() ||
    (fallback.petName || "").trim() ||
    "Pet";
  const petPhotoUrl =
    (livePet?.photo_url || "").trim() ||
    (fallback.petPhotoUrl || "").trim() ||
    null;

  return {
    pet_id: petId,
    /** Fallback label only — UI should resolve live name via pet_id. */
    pet_name: petName,
    pet_photo_url: petPhotoUrl,
  };
}
