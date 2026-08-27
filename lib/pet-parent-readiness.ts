/**
 * Pet Parent booking vs connection readiness.
 *
 * This is display/scoring only. Do not use it to gate Stripe checkout,
 * Guru `can_book`, or shared `profile_completed` writes.
 * Guru and Ambassador completion stay in `lib/profileCompletion.ts`.
 */

const PLACEHOLDER_NAMES = new Set([
  "customer",
  "signup review needed",
  "sitguru member",
  "sitguru user",
  "pet parent",
]);

export type PetParentSetupFlags = {
  basicInfoComplete: boolean;
  serviceLocationComplete: boolean;
  petPassportsComplete: boolean;
  careNotesComplete: boolean;
  emergencyContactComplete: boolean;
  notificationsComplete: boolean;
};

export type PetParentReadiness = PetParentSetupFlags & {
  hasUsableName: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasZip: boolean;
  hasLocation: boolean;
  hasStreetAddress: boolean;
  hasPet: boolean;
  hasPhoto: boolean;
  readyToBrowse: boolean;
  readyToBook: boolean;
  guruReady: boolean;
  bookingReadyCompleted: number;
  bookingReadyTotal: 3;
  bookingReadyPercent: number;
  recommendedCompleted: number;
  recommendedTotal: 3;
  connectionPercent: number;
};

function asRecord(source: unknown): Record<string, unknown> {
  if (source && typeof source === "object") {
    return source as Record<string, unknown>;
  }

  return {};
}

function firstText(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function firstBoolean(source: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => {
    const value = source[key];

    return value === true || value === "true";
  });
}

function isPlaceholderName(value: string) {
  return PLACEHOLDER_NAMES.has(value.trim().toLowerCase());
}

function getUsableName(source: Record<string, unknown>) {
  const fullName = firstText(source, ["full_name", "name", "display_name"]);

  if (fullName && !isPlaceholderName(fullName)) {
    return fullName;
  }

  const combined = [
    firstText(source, ["first_name"]),
    firstText(source, ["last_name"]),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (combined && !isPlaceholderName(combined)) {
    return combined;
  }

  return "";
}

function getPetCount(source: Record<string, unknown>) {
  const raw =
    source.petCount ?? source.petsCount ?? source.pet_count ?? source.pets_count;

  const count = typeof raw === "number" ? raw : Number(raw);

  return Number.isFinite(count) && count > 0 ? count : 0;
}

export function getPetParentReadiness(
  source: unknown,
): PetParentReadiness {
  const profile = asRecord(source);
  const hasUsableName = Boolean(getUsableName(profile));
  const hasEmail = Boolean(
    firstText(profile, ["email", "contact_email", "login_email"]),
  );
  const hasPhone = Boolean(
    firstText(profile, ["phone", "phone_number", "mobile_phone"]),
  );
  const hasZip = Boolean(
    firstText(profile, [
      "service_zip",
      "zip_code",
      "zipCode",
      "zip",
      "zipcode",
      "postal_code",
      "care_zip",
    ]),
  );
  const hasLocation = Boolean(
    hasZip ||
      firstText(profile, [
        "service_city",
        "city",
        "service_state",
        "state",
      ]),
  );
  const hasStreetAddress = Boolean(
    firstText(profile, [
      "service_address",
      "street_address",
      "address",
      "home_address",
    ]),
  );
  const hasPet = getPetCount(profile) > 0;
  const hasPhoto = Boolean(
    firstText(profile, [
      "avatar_url",
      "profile_photo_url",
      "photo_url",
      "image_url",
    ]),
  );
  const careNotesComplete = Boolean(
    firstText(profile, [
      "care_preferences",
      "care_notes",
      "preferences",
      "notes",
    ]),
  );
  const emergencyContactComplete = Boolean(
    firstText(profile, ["emergency_contact"]) ||
      (firstText(profile, ["emergency_contact_name"]) &&
        firstText(profile, ["emergency_contact_phone"])),
  );
  const notificationsComplete = firstBoolean(profile, [
    "email_notifications",
    "push_notifications",
    "text_notifications",
  ]);

  const basicInfoComplete = hasUsableName;
  const serviceLocationComplete = hasZip;
  const petPassportsComplete = hasPet;
  const readyToBrowse = hasUsableName && hasZip;
  const readyToBook = readyToBrowse && hasPet;
  const guruReady =
    readyToBook && careNotesComplete && emergencyContactComplete;

  const bookingChecks = [hasUsableName, hasZip, hasPet];
  const bookingReadyCompleted = bookingChecks.filter(Boolean).length;
  const recommendedChecks = [
    careNotesComplete,
    emergencyContactComplete,
    notificationsComplete,
  ];
  const recommendedCompleted = recommendedChecks.filter(Boolean).length;

  return {
    hasUsableName,
    hasEmail,
    hasPhone,
    hasZip,
    hasLocation,
    hasStreetAddress,
    hasPet,
    hasPhoto,
    basicInfoComplete,
    serviceLocationComplete,
    petPassportsComplete,
    careNotesComplete,
    emergencyContactComplete,
    notificationsComplete,
    readyToBrowse,
    readyToBook,
    guruReady,
    bookingReadyCompleted,
    bookingReadyTotal: 3,
    bookingReadyPercent: Math.round((bookingReadyCompleted / 3) * 100),
    recommendedCompleted,
    recommendedTotal: 3,
    connectionPercent: Math.round((recommendedCompleted / 3) * 100),
  };
}

export function getPetParentSetupStatus(
  profile: unknown,
  petCount = 0,
): PetParentSetupFlags {
  const readiness = getPetParentReadiness({
    ...asRecord(profile),
    petCount,
  });

  return {
    basicInfoComplete: readiness.basicInfoComplete,
    serviceLocationComplete: readiness.serviceLocationComplete,
    petPassportsComplete: readiness.petPassportsComplete,
    careNotesComplete: readiness.careNotesComplete,
    emergencyContactComplete: readiness.emergencyContactComplete,
    notificationsComplete: readiness.notificationsComplete,
  };
}
