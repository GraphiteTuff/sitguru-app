/**
 * Pure Trust & Credentials rules.
 * Public projections never include policy numbers, documents, or admin notes.
 */

export const CREDENTIAL_FILTERS = [
  { key: "pet_cpr", label: "Pet CPR & First Aid" },
  { key: "insured", label: "Insured" },
  { key: "bonded", label: "Bonded" },
  { key: "psi", label: "PSI Member" },
  { key: "professional", label: "Professional Certification" },
] as const;

export type CredentialFilterKey = (typeof CREDENTIAL_FILTERS)[number]["key"];

export const GURU_WRITABLE_STATUSES = ["draft", "submitted"] as const;

export const PRIVATE_CREDENTIAL_KEYS = [
  "certificate_or_member_reference",
  "storage_path",
  "submission_notes",
  "verification_notes",
  "rejection_reason",
  "coverage_limit",
  "policy_number",
  "bond_number",
  "membership_id",
  "named_insured",
  "document_name",
] as const;

export type CredentialStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "verified"
  | "rejected"
  | "expired"
  | "revoked"
  | "archived";

export type CredentialRecord = {
  id: string;
  guruId: string;
  ownerUserId: string;
  status: CredentialStatus | string;
  typeSlug: string;
  filterKey: string;
  chipLabel: string;
  badgeLabel: string;
  icon: string;
  sortOrder: number;
  providerName?: string | null;
  credentialName?: string | null;
  expirationDate?: string | null;
  issueDate?: string | null;
  reference?: string | null;
  storagePath?: string | null;
  submissionNotes?: string | null;
  verificationNotes?: string | null;
  rejectionReason?: string | null;
  coverageLimit?: string | null;
};

export type PublicCredentialHighlight = {
  id: string;
  guruId: string;
  ownerUserId: string;
  typeSlug: string;
  filterKey: string;
  chipLabel: string;
  badgeLabel: string;
  icon: string;
  providerName: string | null;
  summary: string;
  validThrough: string | null;
};

const PUBLIC_SUMMARY: Record<string, string> = {
  insured: "Current coverage verified",
  bonded: "Current bond documentation verified",
  psi: "Membership verified by SitGuru",
  professional: "Credential verified by SitGuru",
  pet_cpr: "Verified by SitGuru",
};

export function utcDateOnly(value: Date | string = new Date()) {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function isExpiredCredential(
  record: Pick<CredentialRecord, "status" | "expirationDate">,
  today = utcDateOnly(),
) {
  if (record.status === "expired" || record.status === "revoked") return true;
  if (!record.expirationDate) return false;
  return record.expirationDate < today;
}

export function isCurrentPublicCredential(
  record: Pick<CredentialRecord, "status" | "expirationDate">,
  today = utcDateOnly(),
) {
  if (record.status !== "verified") return false;
  if (!record.expirationDate) return true;
  return record.expirationDate >= today;
}

export function isExpiringSoon(
  record: Pick<CredentialRecord, "status" | "expirationDate">,
  today = utcDateOnly(),
  withinDays = 60,
) {
  if (!isCurrentPublicCredential(record, today) || !record.expirationDate) {
    return false;
  }
  const start = new Date(`${today}T00:00:00Z`);
  const end = new Date(`${record.expirationDate}T00:00:00Z`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return days >= 0 && days <= withinDays;
}

/** One reminder per window. A late check sends only the closest window. */
export function chooseExpirationNotice(
  daysUntilExpiration: number,
  alreadySent: { 60?: boolean; 30?: boolean; 7?: boolean },
) {
  if (daysUntilExpiration < 0 || daysUntilExpiration > 60) return null;
  const windows = [60, 30, 7] as const;
  const due = windows.filter(
    (windowDays) => daysUntilExpiration <= windowDays && !alreadySent[windowDays],
  );
  if (!due.length) return null;
  return {
    window: due[due.length - 1],
    mark: due,
  };
}

export function formatValidThrough(expirationDate?: string | null) {
  if (!expirationDate) return null;
  const date = new Date(`${expirationDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function toPublicCredential(
  record: CredentialRecord,
  today = utcDateOnly(),
): PublicCredentialHighlight | null {
  if (!isCurrentPublicCredential(record, today)) return null;

  const summary =
    record.filterKey === "pet_cpr" || record.filterKey === "professional"
      ? record.providerName || PUBLIC_SUMMARY[record.filterKey]
      : PUBLIC_SUMMARY[record.filterKey] || "Verified by SitGuru";

  return {
    id: record.id,
    guruId: record.guruId,
    ownerUserId: record.ownerUserId,
    typeSlug: record.typeSlug,
    filterKey: record.filterKey,
    chipLabel: record.chipLabel,
    badgeLabel: record.badgeLabel,
    icon: record.icon,
    providerName: record.providerName || null,
    summary,
    validThrough:
      record.filterKey === "insured"
        ? formatValidThrough(record.expirationDate)
        : null,
  };
}

export function selectSearchChips(
  highlights: PublicCredentialHighlight[],
  limit = 3,
) {
  const unique: PublicCredentialHighlight[] = [];
  const seen = new Set<string>();
  const ordered = [...highlights].sort((a, b) =>
    a.chipLabel.localeCompare(b.chipLabel),
  );

  for (const highlight of ordered) {
    if (seen.has(highlight.filterKey)) continue;
    seen.add(highlight.filterKey);
    unique.push(highlight);
  }

  return {
    chips: unique.slice(0, limit),
    extraCount: Math.max(0, unique.length - limit),
  };
}

/**
 * Empty filters keep every Guru, including those with no credentials.
 * Multiple selections require every selected type (AND).
 * Pass only current verified filter keys; pending, rejected, and expired
 * credentials must not be included.
 */
export function guruMatchesCredentialFilters(
  filterKeys: string[],
  selected: string[],
) {
  const chosen = selected.map((item) => item.trim()).filter(Boolean);
  if (!chosen.length) return true;
  return chosen.every((key) => filterKeys.includes(key));
}

export function canGuruSetStatus(nextStatus: string) {
  return (GURU_WRITABLE_STATUSES as readonly string[]).includes(nextStatus);
}

export function maskReference(value?: string | null) {
  const text = String(value || "").replace(/\s+/g, "");
  if (!text) return "";
  if (text.length <= 4) return "••••";
  return `••••${text.slice(-4)}`;
}

export function publicCredentialHasPrivateFields(
  value: Record<string, unknown>,
) {
  return PRIVATE_CREDENTIAL_KEYS.some((key) => key in value && value[key]);
}

/** American Health Training is a training option, not a SitGuru partner. */
export const AMERICAN_HEALTH_TRAINING = {
  slug: "american-health-training",
  analyticsProvider: "american_health_training",
  publicUrl: "https://www.americanhealthtraining.com/",
  trainingUrl: "https://www.americanhealthtraining.com/pet-cpr/",
  isPartner: false,
  logoAuthorized: false,
  affiliateEnabled: false,
  referralEnabled: false,
} as const;

const BLOCKED_URL_PARAMS = ["utm_", "gclid", "gbraid", "gad_source", "gad_campaignid"];

export function credentialAnalyticsSlug(slug?: string | null) {
  return String(slug || "").trim().replace(/-/g, "_");
}

/** Reject ad-tracking links. Explore actions use the configured course URL only. */
export function isCleanProviderUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") return false;
  for (const key of parsed.searchParams.keys()) {
    const name = key.toLowerCase();
    if (BLOCKED_URL_PARAMS.some((blocked) => name === blocked || name.startsWith(blocked))) {
      return false;
    }
  }
  return true;
}

export function cleanProviderExploreUrl(
  trainingUrl?: string | null,
  publicUrl?: string | null,
) {
  for (const candidate of [trainingUrl, publicUrl]) {
    const url = String(candidate || "").trim();
    if (!url) continue;
    try {
      if (isCleanProviderUrl(url)) return url;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Future AHT LMS/API fields belong in credential_providers.metadata
 * until American Health Training provides an authorized integration:
 * integration_type, external_provider_id, referral_url,
 * verification_endpoint, webhook_enabled, api_enabled.
 * partner_url, promo_code, and verification_url_template already exist as columns.
 */
export const FUTURE_PROVIDER_METADATA_KEYS = [
  "integration_type",
  "external_provider_id",
  "referral_url",
  "verification_endpoint",
  "webhook_enabled",
  "api_enabled",
] as const;

/** Use a date only when the certificate itself shows one. */
export function expirationFromCertificate(explicit?: string | null) {
  const text = String(explicit || "").trim();
  return text || null;
}

export function safeCredentialAnalytics(input: {
  typeSlug?: string | null;
  providerSlug?: string | null;
  platform?: string | null;
  role?: string | null;
  source?: string | null;
}) {
  return {
    credential_type: input.typeSlug || "",
    provider: input.providerSlug || "",
    platform: input.platform || "web",
    user_role: input.role || "",
    source_surface: input.source || "",
  };
}

export const VERIFIED_BY_SITGURU_COPY =
  "Verified by SitGuru means SitGuru reviewed documentation or available verification information for the credential shown. SitGuru does not provide the underlying training, insurance, bond, membership, or certification, and verification does not guarantee a Guru's performance.";

export const GURU_EMPTY_CREDENTIAL_COPY = {
  title: "Add your professional highlights 🐾",
  body: "Have pet-care training, insurance, bonding, memberships, or certifications? You can add them to your SitGuru profile whenever you're ready.",
};

export const NEGATIVE_CREDENTIAL_PHRASES = [
  "no credentials",
  "not insured",
  "missing credential",
  "incomplete",
  "weaker",
  "required",
  "finish your requirements",
];
