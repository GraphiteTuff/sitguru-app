/**
 * High-priority pet profile detection for marketing CRM conversion alerts.
 * Evaluates admin_marketing_signup_lead_pets (+ parent lead flags).
 */

export type MarketingLeadPetInput = {
  pet_order?: number | null;
  pet_name?: string | null;
  pet_type?: string | null;
  pet_breed?: string | null;
  pet_birthday_month?: string | null;
  pet_birthday_year?: string | null;
  pet_notes?: string | null;
};

export type MarketingLeadInput = {
  id?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  market_area?: string | null;
  lead_type?: string | null;
  relationship_category?: string | null;
  priority_level?: string | null;
  referral_potential?: string | null;
  ceo_priority?: boolean | null;
  campaign_source?: string | null;
  growth_channel?: string | null;
  notes?: string | null;
};

export type HighPriorityReason = {
  code: string;
  label: string;
  weight: number;
};

export type HighPriorityPetLeadAssessment = {
  isHighPriority: boolean;
  score: number;
  reasons: HighPriorityReason[];
  suggestedDeal: string;
  petSummary: string;
};

/** Breeds that often need premium / specialized care — conversion-worthy. */
const PREMIUM_BREED_KEYWORDS = [
  "german shorthaired",
  "german shepherd",
  "belgian malinois",
  "cane corso",
  "rottweiler",
  "doberman",
  "bernese mountain",
  "great dane",
  "mastiff",
  "saint bernard",
  "newfoundland",
  "akita",
  "husky",
  "malamute",
  "border collie",
  "australian shepherd",
  "goldendoodle",
  "labradoodle",
  "french bulldog",
  "english bulldog",
  "pug",
  "boxer",
  "pit bull",
  "american staffordshire",
];

const EXOTIC_OR_SPECIAL_TYPES = [
  "horse",
  "reptile",
  "bird",
  "rabbit",
  "fish",
  "small animal",
];

const CARE_NEED_KEYWORDS = [
  "medication",
  "medicine",
  "medical",
  "allergy",
  "allergies",
  "special need",
  "special needs",
  "senior",
  "puppy",
  "kitten",
  "anxious",
  "anxiety",
  "reactive",
  "aggressive",
  "diabetic",
  "seizure",
  "insulin",
  "crate",
  "separation",
  "service animal",
  "esa",
  "therapy",
];

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

function estimateAgeYears(birthdayYear: string | null | undefined) {
  const year = Number(clean(birthdayYear));
  if (!Number.isFinite(year) || year < 1990) return null;
  return new Date().getFullYear() - year;
}

function buildSuggestedDeal(reasons: HighPriorityReason[]) {
  const codes = new Set(reasons.map((reason) => reason.code));

  if (codes.has("multi_pet")) {
    return "Multi-pet household deal: offer a bundled first-week Drop-In + Walk package with PawPerks credit.";
  }
  if (codes.has("care_needs") || codes.has("senior_or_puppy")) {
    return "Special-care conversion: offer a Trust & Safety intro call + first medical-aware Drop-In at a welcome rate.";
  }
  if (codes.has("premium_breed") || codes.has("exotic_type")) {
    return "Premium pet profile deal: invite a Guru Meet & Greet + first overnight/walk credit.";
  }
  if (codes.has("ceo_priority") || codes.has("lead_priority_high")) {
    return "CEO/high-priority lead: personal outreach within 2 hours with a founder welcome offer.";
  }
  return "Personalized conversion outreach: send a local Guru shortlist + first-booking credit.";
}

export function assessHighPriorityPetLead(params: {
  lead: MarketingLeadInput;
  pets: MarketingLeadPetInput[];
}): HighPriorityPetLeadAssessment {
  const { lead, pets } = params;
  const reasons: HighPriorityReason[] = [];

  if (lead.ceo_priority === true) {
    reasons.push({
      code: "ceo_priority",
      label: "CEO priority flag",
      weight: 40,
    });
  }

  if (lower(lead.priority_level) === "high") {
    reasons.push({
      code: "lead_priority_high",
      label: "Lead priority is High",
      weight: 30,
    });
  }

  if (lower(lead.referral_potential) === "high") {
    reasons.push({
      code: "referral_potential_high",
      label: "High referral potential",
      weight: 20,
    });
  }

  if (pets.length >= 2) {
    reasons.push({
      code: "multi_pet",
      label: `Multi-pet household (${pets.length} pets)`,
      weight: 25,
    });
  }

  for (const pet of pets) {
    const type = lower(pet.pet_type);
    const breed = lower(pet.pet_breed);
    const notes = lower(pet.pet_notes);
    const label = clean(pet.pet_name) || `Pet ${pet.pet_order || ""}`.trim();

    if (includesAny(type, EXOTIC_OR_SPECIAL_TYPES)) {
      reasons.push({
        code: "exotic_type",
        label: `${label}: special pet type (${clean(pet.pet_type)})`,
        weight: 22,
      });
    }

    if (includesAny(breed, PREMIUM_BREED_KEYWORDS)) {
      reasons.push({
        code: "premium_breed",
        label: `${label}: premium/specialized breed (${clean(pet.pet_breed)})`,
        weight: 18,
      });
    }

    if (includesAny(notes, CARE_NEED_KEYWORDS) || includesAny(lower(lead.notes), CARE_NEED_KEYWORDS)) {
      reasons.push({
        code: "care_needs",
        label: `${label}: medical or special-care notes`,
        weight: 28,
      });
    }

    const ageYears = estimateAgeYears(pet.pet_birthday_year);
    if (ageYears !== null && (ageYears <= 1 || ageYears >= 8)) {
      reasons.push({
        code: "senior_or_puppy",
        label: `${label}: ${ageYears <= 1 ? "puppy/kitten" : "senior"} profile (~${ageYears}y)`,
        weight: 16,
      });
    }
  }

  // Deduplicate by code+label
  const unique = new Map<string, HighPriorityReason>();
  for (const reason of reasons) {
    const key = `${reason.code}:${reason.label}`;
    if (!unique.has(key)) unique.set(key, reason);
  }
  const deduped = Array.from(unique.values());
  const score = deduped.reduce((sum, reason) => sum + reason.weight, 0);

  // Threshold: any strong signal, or combined score.
  const isHighPriority =
    deduped.some((reason) =>
      ["ceo_priority", "lead_priority_high", "multi_pet", "care_needs"].includes(
        reason.code,
      ),
    ) || score >= 30;

  const petSummary =
    pets.length === 0
      ? "No pet rows attached"
      : pets
          .map((pet) =>
            [clean(pet.pet_name) || "Pet", clean(pet.pet_type), clean(pet.pet_breed)]
              .filter(Boolean)
              .join(" · "),
          )
          .join("; ");

  return {
    isHighPriority,
    score,
    reasons: deduped,
    suggestedDeal: buildSuggestedDeal(deduped),
    petSummary,
  };
}
