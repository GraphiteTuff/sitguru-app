/** First + last (or best available) label for desk-chat people lists. */

function text(value: unknown) {
  return String(value ?? "").trim();
}

function parts(value: string) {
  return value.split(/\s+/).filter(Boolean);
}

export function chatDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  preferredName?: string | null;
  email?: string | null;
  fallback?: string | null;
}) {
  const full = text(input.fullName);
  const first = text(input.firstName);
  const last = text(input.lastName);
  const preferred = text(input.preferredName);
  const combined = [first, last].filter(Boolean).join(" ");

  if (parts(full).length >= 2) return full;
  if (parts(combined).length >= 2) return combined;
  if (parts(preferred).length >= 2) return preferred;
  if (full) return full;
  if (combined) return combined;
  if (preferred) return preferred;
  if (first) return first;

  const email = text(input.email);
  if (email.includes("@")) return email.split("@")[0] || "SitGuru";
  return text(input.fallback) || "SitGuru";
}
