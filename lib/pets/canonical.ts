/**
 * Canonical SitGuru pet data contract.
 * Source of truth aligned with `app/pets/page.tsx`.
 *
 * Deprecated aliases (read-normalized, write-canonical):
 * - pet_type → species
 * - size_category → size
 * - medications → medical_notes
 */

export const CANONICAL_PET_SELECT = [
  "id",
  "user_id",
  "owner_id",
  "owner_profile_id",
  "name",
  "species",
  "pet_type",
  "breed",
  "age",
  "size",
  "size_category",
  "weight",
  "temperament",
  "medical_notes",
  "medications",
  "care_instructions",
  "story",
  "is_public",
  "created_at",
  "notes",
  "photo_url",
  "video_url",
  "updated_at",
  "personality",
  "energy_level",
  "good_with_people",
  "good_with_pets",
  "separation_anxiety",
  "triggers",
  "feeding_routine",
  "potty_routine",
  "walking_instructions",
  "sleeping_location",
  "crate_trained",
  "favorite_things",
  "allergies",
  "medical_conditions",
  "vet_name",
  "vet_phone",
  "emergency_contact_name",
  "emergency_contact_phone",
  "supplies_location",
  "entry_notes",
  "restricted_areas",
  "safety_notes",
  "bite_history",
  "escape_risk",
  "booking_notes",
].join(", ");

export type CanonicalPet = {
  id: string;
  user_id: string | null;
  owner_id: string | null;
  owner_profile_id: string | null;
  name: string;
  species: string | null;
  breed: string | null;
  age: string | null;
  size: string | null;
  weight: string | null;
  temperament: string | null;
  medical_notes: string | null;
  care_instructions: string | null;
  story: string | null;
  is_public: boolean | null;
  created_at: string | null;
  notes: string | null;
  photo_url: string | null;
  video_url: string | null;
  updated_at: string | null;
  personality: string | null;
  energy_level: string | null;
  good_with_people: string | null;
  good_with_pets: string | null;
  separation_anxiety: string | null;
  triggers: string | null;
  feeding_routine: string | null;
  potty_routine: string | null;
  walking_instructions: string | null;
  sleeping_location: string | null;
  crate_trained: string | null;
  favorite_things: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  supplies_location: string | null;
  entry_notes: string | null;
  restricted_areas: string | null;
  safety_notes: string | null;
  bite_history: string | null;
  escape_risk: string | null;
  booking_notes: string | null;
};

export type CanonicalPetForm = {
  name: string;
  species: string;
  breed: string;
  age: string;
  size: string;
  weight: string;
  photo_url: string;
  video_url: string;
  personality: string;
  temperament: string;
  energy_level: string;
  good_with_people: string;
  good_with_pets: string;
  separation_anxiety: string;
  triggers: string;
  feeding_routine: string;
  potty_routine: string;
  walking_instructions: string;
  sleeping_location: string;
  crate_trained: string;
  favorite_things: string;
  medical_notes: string;
  allergies: string;
  medical_conditions: string;
  vet_name: string;
  vet_phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  supplies_location: string;
  entry_notes: string;
  restricted_areas: string;
  safety_notes: string;
  bite_history: string;
  escape_risk: string;
  booking_notes: string;
  care_instructions: string;
  story: string;
  notes: string;
};

export const EMPTY_CANONICAL_PET_FORM: CanonicalPetForm = {
  name: "",
  species: "",
  breed: "",
  age: "",
  size: "",
  weight: "",
  photo_url: "",
  video_url: "",
  personality: "",
  temperament: "",
  energy_level: "",
  good_with_people: "",
  good_with_pets: "",
  separation_anxiety: "",
  triggers: "",
  feeding_routine: "",
  potty_routine: "",
  walking_instructions: "",
  sleeping_location: "",
  crate_trained: "",
  favorite_things: "",
  medical_notes: "",
  allergies: "",
  medical_conditions: "",
  vet_name: "",
  vet_phone: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  supplies_location: "",
  entry_notes: "",
  restricted_areas: "",
  safety_notes: "",
  bite_history: "",
  escape_risk: "",
  booking_notes: "",
  care_instructions: "",
  story: "",
  notes: "",
};

export const PET_TRAIT_TABS = [
  { id: "basics", label: "Basics" },
  { id: "behavior", label: "Behavior" },
  { id: "routines", label: "Routines" },
  { id: "medical", label: "Medical" },
] as const;

export type PetTraitTabId = (typeof PET_TRAIT_TABS)[number]["id"];

export const PET_SIZE_OPTIONS = [
  { value: "teacup", label: "Teacup" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "extra_large", label: "Extra Large" },
] as const;

export const PET_SPECIES_OPTIONS = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
] as const;

const PASSPORT_FIELDS: Array<keyof CanonicalPetForm> = [
  "name",
  "species",
  "breed",
  "age",
  "weight",
  "personality",
  "energy_level",
  "feeding_routine",
  "potty_routine",
  "medical_notes",
  "allergies",
  "vet_name",
  "vet_phone",
  "emergency_contact_name",
  "emergency_contact_phone",
  "safety_notes",
];

function asString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asNullable(value: unknown) {
  const text = asString(value);
  return text || null;
}

function asBool(value: unknown) {
  if (typeof value === "boolean") return value;
  return null;
}

/** Normalize any legacy/raw pet row into the canonical shape. */
export function normalizeCanonicalPet(
  row: Record<string, unknown> | null | undefined,
): CanonicalPet | null {
  if (!row || typeof row !== "object") return null;
  const id = asString(row.id);
  if (!id) return null;

  const species =
    asNullable(row.species) || asNullable(row.pet_type) || asNullable(row.type);
  const size =
    asNullable(row.size) || asNullable(row.size_category) || asNullable(row.pet_size);
  const medicalNotes =
    asNullable(row.medical_notes) ||
    asNullable(row.medications) ||
    asNullable(row.medication_notes);

  return {
    id,
    user_id: asNullable(row.user_id),
    owner_id: asNullable(row.owner_id),
    owner_profile_id: asNullable(row.owner_profile_id),
    name: asString(row.name) || "Unnamed pet",
    species,
    breed: asNullable(row.breed),
    age: asNullable(row.age),
    size,
    weight: asNullable(row.weight),
    temperament: asNullable(row.temperament),
    medical_notes: medicalNotes,
    care_instructions: asNullable(row.care_instructions),
    story: asNullable(row.story),
    is_public: asBool(row.is_public),
    created_at: asNullable(row.created_at),
    notes: asNullable(row.notes),
    photo_url: asNullable(row.photo_url),
    video_url: asNullable(row.video_url),
    updated_at: asNullable(row.updated_at),
    personality: asNullable(row.personality),
    energy_level: asNullable(row.energy_level),
    good_with_people: asNullable(row.good_with_people),
    good_with_pets: asNullable(row.good_with_pets),
    separation_anxiety: asNullable(row.separation_anxiety),
    triggers: asNullable(row.triggers),
    feeding_routine:
      asNullable(row.feeding_routine) || asNullable(row.feeding_notes),
    potty_routine: asNullable(row.potty_routine),
    walking_instructions: asNullable(row.walking_instructions),
    sleeping_location: asNullable(row.sleeping_location),
    crate_trained: asNullable(row.crate_trained),
    favorite_things: asNullable(row.favorite_things),
    allergies: asNullable(row.allergies),
    medical_conditions: asNullable(row.medical_conditions),
    vet_name: asNullable(row.vet_name),
    vet_phone: asNullable(row.vet_phone),
    emergency_contact_name: asNullable(row.emergency_contact_name),
    emergency_contact_phone: asNullable(row.emergency_contact_phone),
    supplies_location: asNullable(row.supplies_location),
    entry_notes: asNullable(row.entry_notes),
    restricted_areas: asNullable(row.restricted_areas),
    safety_notes: asNullable(row.safety_notes),
    bite_history: asNullable(row.bite_history),
    escape_risk: asNullable(row.escape_risk),
    booking_notes: asNullable(row.booking_notes),
  };
}

export function petToForm(pet: CanonicalPet): CanonicalPetForm {
  return {
    name: pet.name || "",
    species: pet.species || "",
    breed: pet.breed || "",
    age: pet.age || "",
    size: pet.size || "",
    weight: pet.weight || "",
    photo_url: pet.photo_url || "",
    video_url: pet.video_url || "",
    personality: pet.personality || "",
    temperament: pet.temperament || "",
    energy_level: pet.energy_level || "",
    good_with_people: pet.good_with_people || "",
    good_with_pets: pet.good_with_pets || "",
    separation_anxiety: pet.separation_anxiety || "",
    triggers: pet.triggers || "",
    feeding_routine: pet.feeding_routine || "",
    potty_routine: pet.potty_routine || "",
    walking_instructions: pet.walking_instructions || "",
    sleeping_location: pet.sleeping_location || "",
    crate_trained: pet.crate_trained || "",
    favorite_things: pet.favorite_things || "",
    medical_notes: pet.medical_notes || "",
    allergies: pet.allergies || "",
    medical_conditions: pet.medical_conditions || "",
    vet_name: pet.vet_name || "",
    vet_phone: pet.vet_phone || "",
    emergency_contact_name: pet.emergency_contact_name || "",
    emergency_contact_phone: pet.emergency_contact_phone || "",
    supplies_location: pet.supplies_location || "",
    entry_notes: pet.entry_notes || "",
    restricted_areas: pet.restricted_areas || "",
    safety_notes: pet.safety_notes || "",
    bite_history: pet.bite_history || "",
    escape_risk: pet.escape_risk || "",
    booking_notes: pet.booking_notes || "",
    care_instructions: pet.care_instructions || "",
    story: pet.story || "",
    notes: pet.notes || "",
  };
}

function clean(value: string) {
  return value.trim() || null;
}

/**
 * Build a write payload with canonical columns + user_id binding.
 * Also mirrors deprecated columns for backward-compatible readers.
 */
export function buildCanonicalPetWritePayload(
  form: CanonicalPetForm,
  userId: string,
): Record<string, unknown> {
  const species = clean(form.species);
  const size = clean(form.size);
  const medicalNotes = clean(form.medical_notes);

  return {
    user_id: userId,
    owner_id: userId,
    name: form.name.trim(),
    species,
    pet_type: species, // deprecated mirror
    breed: clean(form.breed),
    age: clean(form.age),
    size,
    size_category: size, // deprecated mirror
    weight: clean(form.weight),
    photo_url: clean(form.photo_url),
    video_url: clean(form.video_url),
    personality: clean(form.personality),
    temperament: clean(form.temperament),
    energy_level: clean(form.energy_level),
    good_with_people: clean(form.good_with_people),
    good_with_pets: clean(form.good_with_pets),
    separation_anxiety: clean(form.separation_anxiety),
    triggers: clean(form.triggers),
    feeding_routine: clean(form.feeding_routine),
    potty_routine: clean(form.potty_routine),
    walking_instructions: clean(form.walking_instructions),
    sleeping_location: clean(form.sleeping_location),
    crate_trained: clean(form.crate_trained),
    favorite_things: clean(form.favorite_things),
    medical_notes: medicalNotes,
    medications: medicalNotes, // deprecated mirror
    allergies: clean(form.allergies),
    medical_conditions: clean(form.medical_conditions),
    vet_name: clean(form.vet_name),
    vet_phone: clean(form.vet_phone),
    emergency_contact_name: clean(form.emergency_contact_name),
    emergency_contact_phone: clean(form.emergency_contact_phone),
    supplies_location: clean(form.supplies_location),
    entry_notes: clean(form.entry_notes),
    restricted_areas: clean(form.restricted_areas),
    safety_notes: clean(form.safety_notes),
    bite_history: clean(form.bite_history),
    escape_risk: clean(form.escape_risk),
    booking_notes: clean(form.booking_notes),
    care_instructions: clean(form.care_instructions),
    story: clean(form.story),
    notes: clean(form.notes),
    updated_at: new Date().toISOString(),
  };
}

export function calculatePetCompletion(pet: Partial<CanonicalPetForm | CanonicalPet>) {
  const completed = PASSPORT_FIELDS.filter((field) => {
    const value = pet[field as keyof typeof pet];
    return typeof value === "string" && value.trim().length > 0;
  }).length;
  return Math.round((completed / PASSPORT_FIELDS.length) * 100);
}

/** Admin-friendly filters against canonical columns. */
export function petMatchesAdminFilters(
  pet: CanonicalPet,
  filters: {
    breed?: string;
    species?: string;
    hasMedicalNotes?: boolean;
    size?: string;
  },
): boolean {
  if (filters.breed) {
    const needle = filters.breed.trim().toLowerCase();
    if (!(pet.breed || "").toLowerCase().includes(needle)) return false;
  }
  if (filters.species) {
    if ((pet.species || "").toLowerCase() !== filters.species.toLowerCase()) {
      return false;
    }
  }
  if (filters.size) {
    if ((pet.size || "").toLowerCase() !== filters.size.toLowerCase()) {
      return false;
    }
  }
  if (filters.hasMedicalNotes === true) {
    if (!(pet.medical_notes || "").trim() && !(pet.allergies || "").trim()) {
      return false;
    }
  }
  if (filters.hasMedicalNotes === false) {
    if ((pet.medical_notes || "").trim() || (pet.allergies || "").trim()) {
      return false;
    }
  }
  return true;
}

export function hasMedicalFlag(pet: CanonicalPet) {
  return Boolean(
    (pet.medical_notes || "").trim() ||
      (pet.allergies || "").trim() ||
      (pet.medical_conditions || "").trim(),
  );
}
