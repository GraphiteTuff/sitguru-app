/**
 * Relational booking ↔ pet resolution.
 *
 * Source of truth: bookings.pet_id → pets.id
 * booking.pet_name / pet_photo_url are write-time fallbacks only
 * (deleted pets, receipts). Prefer live pet fields for all active UI.
 */

export type BookingPetLink = {
  pet_id?: string | null;
  customer_pet_id?: string | null;
  primary_pet_id?: string | null;
  pet_name?: string | null;
  petName?: string | null;
  animal_name?: string | null;
  pet_photo_url?: string | null;
  pet_type?: string | null;
  breed?: string | null;
  species?: string | null;
};

export type LivePetProfile = {
  id: string;
  name?: string | null;
  species?: string | null;
  pet_type?: string | null;
  breed?: string | null;
  size?: string | null;
  size_category?: string | null;
  medical_notes?: string | null;
  medications?: string | null;
  photo_url?: string | null;
  video_url?: string | null;
  temperament?: string | null;
  age?: string | null;
  weight?: string | null;
  feeding_routine?: string | null;
  potty_routine?: string | null;
  user_id?: string | null;
  owner_id?: string | null;
};

export type ResolvedBookingPet = {
  petId: string | null;
  name: string;
  species: string | null;
  breed: string | null;
  size: string | null;
  medicalNotes: string | null;
  photoUrl: string | null;
  videoUrl: string | null;
  temperament: string | null;
  age: string | null;
  weight: string | null;
  feedingRoutine: string | null;
  pottyRoutine: string | null;
  /** True when values came from public.pets rather than booking snapshot. */
  isLive: boolean;
  livePet: LivePetProfile | null;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getBookingPetId(booking: BookingPetLink | null | undefined): string | null {
  if (!booking) return null;
  return (
    asText(booking.pet_id) ||
    asText(booking.customer_pet_id) ||
    asText(booking.primary_pet_id) ||
    null
  );
}

export function getBookingPetNameFallback(
  booking: BookingPetLink | null | undefined,
): string {
  return (
    asText(booking?.pet_name) ||
    asText(booking?.petName) ||
    asText(booking?.animal_name) ||
    "Pet"
  );
}

/** Prefer pet by id, then exact name match, then sole household pet. */
export function findPetForBooking<T extends { id: string; name?: string | null }>(
  booking: BookingPetLink,
  pets: T[],
): T | null {
  const petId = getBookingPetId(booking);
  if (petId) {
    const byId = pets.find((pet) => pet.id === petId);
    if (byId) return byId;
  }

  const name = getBookingPetNameFallback(booking).toLowerCase();
  if (name && name !== "pet") {
    const byName = pets.find(
      (pet) => asText(pet.name).toLowerCase() === name,
    );
    if (byName) return byName;
  }

  return pets.length === 1 ? pets[0] : null;
}

/**
 * Resolve display fields: live pet profile wins over denormalized booking columns.
 */
export function resolveBookingPet(
  booking: BookingPetLink | null | undefined,
  livePet: LivePetProfile | null | undefined,
): ResolvedBookingPet {
  const fallbackName = getBookingPetNameFallback(booking);
  const petId = livePet?.id || getBookingPetId(booking);

  if (livePet) {
    return {
      petId,
      name: asText(livePet.name) || fallbackName,
      species: asText(livePet.species) || asText(livePet.pet_type) || null,
      breed: asText(livePet.breed) || null,
      size: asText(livePet.size) || asText(livePet.size_category) || null,
      medicalNotes:
        asText(livePet.medical_notes) || asText(livePet.medications) || null,
      photoUrl: asText(livePet.photo_url) || asText(booking?.pet_photo_url) || null,
      videoUrl: asText(livePet.video_url) || null,
      temperament: asText(livePet.temperament) || null,
      age: asText(livePet.age) || null,
      weight: asText(livePet.weight) || null,
      feedingRoutine: asText(livePet.feeding_routine) || null,
      pottyRoutine: asText(livePet.potty_routine) || null,
      isLive: true,
      livePet,
    };
  }

  return {
    petId,
    name: fallbackName,
    species: asText(booking?.species) || asText(booking?.pet_type) || null,
    breed: asText(booking?.breed) || null,
    size: null,
    medicalNotes: null,
    photoUrl: asText(booking?.pet_photo_url) || null,
    videoUrl: null,
    temperament: null,
    age: null,
    weight: null,
    feedingRoutine: null,
    pottyRoutine: null,
    isLive: false,
    livePet: null,
  };
}

export function mapPetsById<T extends { id: string }>(
  pets: T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const pet of pets) {
    if (pet?.id) map.set(String(pet.id), pet);
  }
  return map;
}

export function collectBookingPetIds(
  bookings: BookingPetLink[],
): string[] {
  const ids = new Set<string>();
  for (const booking of bookings) {
    const id = getBookingPetId(booking);
    if (id) ids.add(id);
  }
  return Array.from(ids);
}

/** Canonical select for live pet joins on bookings. */
export const BOOKING_LIVE_PET_SELECT = [
  "id",
  "name",
  "species",
  "pet_type",
  "breed",
  "size",
  "size_category",
  "medical_notes",
  "medications",
  "photo_url",
  "video_url",
  "temperament",
  "age",
  "weight",
  "feeding_routine",
  "potty_routine",
  "user_id",
  "owner_id",
].join(", ");
