/** Known staff chat avatars when profile photos are not uploaded yet. */

const BY_EMAIL: Record<string, string> = {
  "ava@sitguru.com": "/images/staff/ava-venezia.svg",
};

export function staffAvatarFallback(input: {
  email?: string | null;
  userId?: string | null;
}) {
  const email = String(input.email || "")
    .trim()
    .toLowerCase();
  if (email && BY_EMAIL[email]) return BY_EMAIL[email];
  return "";
}
