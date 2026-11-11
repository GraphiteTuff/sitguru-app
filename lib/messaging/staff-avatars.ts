/** Known staff chat seats and avatars when profile photos are incomplete. */

export const AVA_STAFF_USER_ID = "023ef25a-44a5-4732-a96e-e67430ee8798";
export const AVA_STAFF_EMAIL = "ava@sitguru.com";

export const JASON_STAFF_USER_ID = "bf059713-fe82-4727-aa40-547201d2f08b";
export const JASON_STAFF_EMAIL = "jason@sitguru.com";

export const DANETTE_STAFF_USER_ID = "09df0bbd-6687-4ce9-b4b0-8120d90b1ef0";
export const DANETTE_STAFF_EMAIL = "nette@sitguru.com";

export const RYAN_INTERN_EMAIL = "rjm7578@psu.edu";
export const RYAN_INTERN_AVATAR = "/images/staff/ryan-manibo.png";

const HQ_ADMIN_AVATAR = "/images/sitguru-admin-avatar.jpg";

const BY_EMAIL: Record<string, string> = {
  [AVA_STAFF_EMAIL]: "/images/staff/ava-venezia.svg",
  [JASON_STAFF_EMAIL]: HQ_ADMIN_AVATAR,
  [DANETTE_STAFF_EMAIL]: HQ_ADMIN_AVATAR,
  [RYAN_INTERN_EMAIL]: RYAN_INTERN_AVATAR,
};

const BY_USER_ID: Record<string, string> = {
  [AVA_STAFF_USER_ID]: "/images/staff/ava-venezia.svg",
  [JASON_STAFF_USER_ID]: HQ_ADMIN_AVATAR,
  [DANETTE_STAFF_USER_ID]: HQ_ADMIN_AVATAR,
};

export function staffAvatarFallback(input: {
  email?: string | null;
  userId?: string | null;
}) {
  const email = String(input.email || "")
    .trim()
    .toLowerCase();
  const userId = String(input.userId || "").trim();
  if (userId && BY_USER_ID[userId]) return BY_USER_ID[userId];
  if (email && BY_EMAIL[email]) return BY_EMAIL[email];
  return "";
}

/**
 * Always-on HQ + Growth seats for Staff / Admins chat.
 * Profile photos still win when present; these guarantee the people show up.
 */
export const KNOWN_STAFF_CHAT_SEATS = [
  {
    id: JASON_STAFF_USER_ID,
    email: JASON_STAFF_EMAIL,
    firstName: "Jason Graff",
    detail: "Admin" as const,
    avatarUrl: HQ_ADMIN_AVATAR,
  },
  {
    id: DANETTE_STAFF_USER_ID,
    email: DANETTE_STAFF_EMAIL,
    firstName: "Danette Graff",
    detail: "Admin" as const,
    avatarUrl: HQ_ADMIN_AVATAR,
  },
  {
    id: AVA_STAFF_USER_ID,
    email: AVA_STAFF_EMAIL,
    firstName: "Ava Venezia",
    detail: "Manager" as const,
    avatarUrl: "/images/staff/ava-venezia.svg",
  },
] as const;
