/**
 * Adaptive Guru ↔ pet compatibility scoring matrix.
 * Energy (+30) · Medical (+40) · Breed familiarity (+20) → match_score 0–100
 */

export type MatchPetProfile = {
  id: string;
  name?: string | null;
  breed?: string | null;
  energy_level?: string | null;
  medical_notes?: string | null;
  allergies?: string | null;
  medical_conditions?: string | null;
  medications?: string | null;
};

export type MatchGuruCandidate = {
  id: string | number;
  user_id?: string | null;
  bio?: string | null;
  title?: string | null;
  services?: unknown;
  skills?: unknown;
  skill_tags?: unknown;
  tags?: unknown;
  specialties?: unknown;
  amenities?: unknown;
  care_style?: string | null;
  yard?: string | null;
  has_yard?: boolean | null;
  large_yard?: boolean | null;
  /** Past care breed labels from booking / assignment history */
  pastBreeds?: string[] | null;
  [key: string]: unknown;
};

export type MatchScoreBreakdown = {
  match_score: number;
  energy_points: number;
  medical_points: number;
  breed_points: number;
  match_reasons: string[];
  /** Short UI subtext for search cards */
  match_headline: string;
  pet_name: string;
};

const ENERGY_POINTS = 30;
const MEDICAL_POINTS = 40;
const BREED_POINTS = 20;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeKey(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => clean(item)).filter(Boolean);
      }
    } catch {
      // comma / newline separated
    }
    return value
      .split(/[,;\n|]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function guruTagCorpus(guru: MatchGuruCandidate): string {
  const parts = [
    clean(guru.bio),
    clean(guru.title),
    clean(guru.care_style),
    clean(guru.yard),
    ...toStringList(guru.services),
    ...toStringList(guru.skills),
    ...toStringList(guru.skill_tags),
    ...toStringList(guru.tags),
    ...toStringList(guru.specialties),
    ...toStringList(guru.amenities),
  ];

  if (guru.has_yard === true || guru.large_yard === true) {
    parts.push("large yard");
  }

  return normalizeKey(parts.join(" | "));
}

function hasTag(corpus: string, needles: string[]) {
  return needles.some((needle) => corpus.includes(normalizeKey(needle)));
}

function normalizeEnergy(value: unknown): "high" | "low" | "moderate" | null {
  const raw = normalizeKey(value);
  if (!raw) return null;
  if (
    raw.includes("high") ||
    raw.includes("active") ||
    raw.includes("energetic") ||
    raw === "very high"
  ) {
    return "high";
  }
  if (
    raw.includes("low") ||
    raw.includes("calm") ||
    raw.includes("gentle") ||
    raw.includes("couch")
  ) {
    return "low";
  }
  if (raw.includes("med") || raw.includes("moderate") || raw.includes("medium")) {
    return "moderate";
  }
  return null;
}

function petHasMedicalNeeds(pet: MatchPetProfile) {
  return Boolean(
    clean(pet.medical_notes) ||
      clean(pet.allergies) ||
      clean(pet.medical_conditions) ||
      clean(pet.medications),
  );
}

function breedsMatch(petBreed: string, pastBreeds: string[]) {
  const target = normalizeKey(petBreed);
  if (!target || target.length < 2) return false;

  return pastBreeds.some((breed) => {
    const candidate = normalizeKey(breed);
    if (!candidate) return false;
    return (
      candidate === target ||
      candidate.includes(target) ||
      target.includes(candidate)
    );
  });
}

function pickHeadline(reasons: string[], petName: string, score: number) {
  if (reasons.length === 0) {
    return score > 0
      ? `Compatible care options for ${petName}`
      : `Growing familiarity with pets like ${petName}`;
  }
  return reasons[0];
}

/**
 * Score one Guru against a canonical pet profile.
 */
export function scoreGuruPetMatch(
  pet: MatchPetProfile,
  guru: MatchGuruCandidate,
): MatchScoreBreakdown {
  const petName = clean(pet.name) || "your pet";
  const corpus = guruTagCorpus(guru);
  const energy = normalizeEnergy(pet.energy_level);
  const reasons: string[] = [];

  let energyPoints = 0;
  let medicalPoints = 0;
  let breedPoints = 0;

  // Energy Affinity (+30)
  if (energy === "high") {
    const activeRunner = hasTag(corpus, [
      "active runner",
      "runner",
      "running",
      "high energy",
      "active walks",
      "agility",
    ]);
    const largeYard = hasTag(corpus, [
      "large yard",
      "fenced yard",
      "big yard",
      "yard access",
      "private yard",
    ]);
    if (activeRunner || largeYard) {
      energyPoints = ENERGY_POINTS;
      reasons.push(
        activeRunner && largeYard
          ? "This Guru is highly rated for high-energy breeds!"
          : activeRunner
            ? "Active Runner skill matches this high-energy pet."
            : "Large Yard access fits high-energy play needs.",
      );
    }
  } else if (energy === "low") {
    if (
      hasTag(corpus, [
        "cuddle companion",
        "cuddle",
        "companionship",
        "lap dog",
        "calm care",
        "gentle",
        "low energy",
      ])
    ) {
      energyPoints = ENERGY_POINTS;
      reasons.push(
        "Cuddle Companion style is a great fit for low-energy pets.",
      );
    }
  }

  // Medical Prioritization (+40)
  if (petHasMedicalNeeds(pet)) {
    if (
      hasTag(corpus, [
        "medication trained",
        "medication",
        "meds trained",
        "special needs experience",
        "special needs",
        "senior care",
        "diabetic",
        "insulin",
        "medical care",
      ])
    ) {
      medicalPoints = MEDICAL_POINTS;
      reasons.unshift(
        "Medication / special-needs experience prioritizes this Guru for medical care notes.",
      );
    }
  }

  // Breed Familiarity (+20)
  const petBreed = clean(pet.breed);
  const pastBreeds = (guru.pastBreeds || []).map(clean).filter(Boolean);
  if (petBreed && breedsMatch(petBreed, pastBreeds)) {
    breedPoints = BREED_POINTS;
    reasons.push(
      `Veteran affinity: prior care experience with ${petBreed} pets.`,
    );
  }

  const match_score = Math.min(
    100,
    Math.max(0, energyPoints + medicalPoints + breedPoints),
  );

  return {
    match_score,
    energy_points: energyPoints,
    medical_points: medicalPoints,
    breed_points: breedPoints,
    match_reasons: reasons,
    match_headline: pickHeadline(reasons, petName, match_score),
    pet_name: petName,
  };
}

/**
 * Attach scores to a Guru list and sort by match_score DESC.
 * Medical-prioritized Gurus naturally rise because +40 dominates the sort key.
 */
export function rankGurusForPet<T extends MatchGuruCandidate>(
  pet: MatchPetProfile,
  gurus: T[],
): Array<
  T & {
    match_score: number;
    match_headline: string;
    match_reasons: string[];
    match_pet_name: string;
    match_breakdown: MatchScoreBreakdown;
  }
> {
  return gurus
    .map((guru) => {
      const breakdown = scoreGuruPetMatch(pet, guru);
      return {
        ...guru,
        match_score: breakdown.match_score,
        match_headline: breakdown.match_headline,
        match_reasons: breakdown.match_reasons,
        match_pet_name: breakdown.pet_name,
        match_breakdown: breakdown,
      };
    })
    .sort((a, b) => {
      if (b.match_score !== a.match_score) {
        return b.match_score - a.match_score;
      }
      // Stable secondary: medical boost first, then energy, then breed
      const aMed = a.match_breakdown.medical_points;
      const bMed = b.match_breakdown.medical_points;
      if (bMed !== aMed) return bMed - aMed;
      return String(a.id).localeCompare(String(b.id));
    });
}

export function buildMatchBadgeLabel(score: number, petName: string) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const name = clean(petName) || "your pet";
  return `🎉 ${safeScore}% Match for ${name}`;
}
