const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeContactEmail(value: unknown): string {
  const email = String(value ?? "").trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : "";
}

export function isUsableContactEmail(value: unknown): boolean {
  return Boolean(normalizeContactEmail(value));
}

type ContactEmailInput = {
  profileEmail?: unknown;
  roleEmails?: unknown[];
  authEmail?: unknown;
  identityEmails?: unknown[];
  metadataEmail?: unknown;
  submittedEmail?: unknown;
};

/**
 * Stored profile email wins. Auth, identity, metadata, and the signup form
 * only fill a blank contact email. Apple Private Relay addresses are valid.
 * The account identity key stays auth.users.id.
 */
export function resolveCanonicalContactEmail(input: ContactEmailInput): string {
  const stored = [input.profileEmail, ...(input.roleEmails || [])]
    .map(normalizeContactEmail)
    .find(Boolean);
  if (stored) return stored;

  return (
    [
      input.authEmail,
      ...(input.identityEmails || []),
      input.metadataEmail,
      input.submittedEmail,
    ]
      .map(normalizeContactEmail)
      .find(Boolean) || ""
  );
}

export function emailForBlankProfile(
  currentProfileEmail: unknown,
  candidate: unknown,
): string | null {
  if (normalizeContactEmail(currentProfileEmail)) return null;
  return normalizeContactEmail(candidate) || null;
}

export function contactChannelLabel(email: unknown, phone: unknown): string {
  const emailReady = isUsableContactEmail(email);
  const digits = String(phone ?? "").replace(/\D/g, "");
  const phoneReady = digits.length >= 10 && !/^0+$/.test(digits);

  if (emailReady && phoneReady) return "Email + phone";
  if (phoneReady) return "Phone only";
  if (emailReady) return "Email only";
  return "No usable contact";
}

const PROVIDER_LABELS: Record<string, string> = {
  phone: "Phone",
  apple: "Apple",
  google: "Google",
  email: "Email",
};

export function formatLoginAndContact(input: {
  providers?: string[] | null;
  email?: unknown;
  phone?: unknown;
}): string {
  const contact = contactChannelLabel(input.email, input.phone);
  const login = (input.providers || [])
    .map((provider) => PROVIDER_LABELS[provider.toLowerCase()] || provider)
    .filter(Boolean);
  if (!login.length) return contact;
  return `Login: ${login.join(", ")} · Contact: ${contact}`;
}
