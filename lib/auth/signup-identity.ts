/**
 * One SitGuru account per auth.users.id.
 * A second provider links to the current session. It never starts another user.
 * Phone matches across different auth users are review-only.
 */

export type AccountRole = "guru" | "pet_parent" | "ambassador";

export type AuthProviderName = "apple" | "phone" | "email" | "google" | "unknown";

export type SignupAuthUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  identities?: Array<{ provider?: string | null }> | null;
};

export type ExistingAccount = {
  userId: string;
  roles?: AccountRole[];
  guruId?: string | null;
  petParentId?: string | null;
  ambassadorId?: string | null;
};

export type AuthStep =
  | { action: "start_oauth"; provider: "apple" | "google" }
  | { action: "link_identity"; provider: "apple" | "google" }
  | { action: "require_phone_verification"; provider: "apple" | "google" }
  | { action: "start_phone_otp" }
  | { action: "attach_phone_to_session" };

export function normalizeUsPhone(value: string | null | undefined): string | null {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

export function resolveAuthenticatedAccount(input: {
  authUser: SignupAuthUser;
  existingByAuthId?: ExistingAccount | null;
}): { userId: string; reused: boolean } {
  const userId = input.authUser.id?.trim();
  if (!userId) throw new Error("Authenticated user id is required.");
  return {
    userId,
    reused: input.existingByAuthId?.userId === userId,
  };
}

function uniqueRoles(roles: AccountRole[]): AccountRole[] {
  const order: AccountRole[] = ["guru", "pet_parent", "ambassador"];
  return order.filter((role) => roles.includes(role));
}

export function resolveGuruRole(account: ExistingAccount): ExistingAccount {
  return {
    ...account,
    roles: uniqueRoles([...(account.roles || []), "guru"]),
  };
}

export function resolvePetParentRole(account: ExistingAccount): ExistingAccount {
  return {
    ...account,
    roles: uniqueRoles([...(account.roles || []), "pet_parent"]),
  };
}

export function resolveAmbassadorRole(account: ExistingAccount): ExistingAccount {
  return {
    ...account,
    roles: uniqueRoles([...(account.roles || []), "ambassador"]),
  };
}

/**
 * Second provider never creates a user.
 * Apple/Google before any phone session starts OAuth.
 * A verified session links the provider.
 * An unverified phone code must be finished first so linking has a session.
 */
export function decideNextAuthStep(input: {
  provider: "apple" | "google" | "phone";
  hasVerifiedSession: boolean;
  phoneCodeSent: boolean;
  phoneVerified: boolean;
}): AuthStep {
  if (input.provider === "phone") {
    if (input.hasVerifiedSession) return { action: "attach_phone_to_session" };
    return { action: "start_phone_otp" };
  }

  if (input.hasVerifiedSession || input.phoneVerified) {
    return { action: "link_identity", provider: input.provider };
  }

  if (input.phoneCodeSent) {
    return { action: "require_phone_verification", provider: input.provider };
  }

  return { action: "start_oauth", provider: input.provider };
}

export function provisionOnce(input: {
  authUserId: string;
  alreadyProvisionedUserIds: string[];
}): { userId: string; created: boolean } {
  const created = !input.alreadyProvisionedUserIds.includes(input.authUserId);
  return { userId: input.authUserId, created };
}

/**
 * Verified phone owned by a different auth user blocks permanent role provisioning.
 * It does not merge accounts. An unused or same-account phone may provision.
 */
export function reconcileVerifiedPhone(input: {
  authUserId: string;
  verifiedPhone: string | null | undefined;
  existingAccounts: Array<{ userId: string; phone?: string | null }>;
}):
  | { action: "provision"; userId: string }
  | {
      action: "reconciliation_required";
      existingUserId: string;
      reason: "verified_phone_belongs_to_another_account";
    } {
  const phone = normalizeUsPhone(input.verifiedPhone);
  if (!phone) return { action: "provision", userId: input.authUserId };

  const owner = input.existingAccounts.find(
    (account) =>
      account.userId !== input.authUserId &&
      normalizeUsPhone(account.phone) === phone,
  );

  if (!owner) return { action: "provision", userId: input.authUserId };

  return {
    action: "reconciliation_required",
    existingUserId: owner.userId,
    reason: "verified_phone_belongs_to_another_account",
  };
}

export function classifyPhoneCollision(input: {
  currentAuthUserId: string;
  otherAuthUserId: string | null;
  currentPhone: string | null | undefined;
  otherPhone: string | null | undefined;
}): "none" | "same_account" | "possible_cross_auth_duplicate" {
  const current = normalizeUsPhone(input.currentPhone);
  const other = normalizeUsPhone(input.otherPhone);
  if (!current || !other || current !== other) return "none";
  if (!input.otherAuthUserId || input.otherAuthUserId === input.currentAuthUserId) {
    return "same_account";
  }
  return "possible_cross_auth_duplicate";
}

export function listAuthProviders(input: {
  identities?: Array<{ provider?: string | null }> | null;
  appMetadata?: Record<string, unknown> | null;
  email?: string | null;
  phone?: string | null;
}): AuthProviderName[] {
  const found = new Set<AuthProviderName>();
  for (const identity of input.identities || []) {
    const provider = String(identity?.provider || "").toLowerCase();
    if (provider.includes("apple")) found.add("apple");
    else if (provider.includes("google")) found.add("google");
    else if (provider.includes("phone")) found.add("phone");
    else if (provider.includes("email")) found.add("email");
  }
  const meta = input.appMetadata?.provider;
  if (typeof meta === "string") {
    const provider = meta.toLowerCase();
    if (provider.includes("apple")) found.add("apple");
    else if (provider.includes("google")) found.add("google");
    else if (provider.includes("phone")) found.add("phone");
    else if (provider.includes("email")) found.add("email");
  }
  if (input.phone) found.add("phone");
  if (input.email && !found.size) found.add("email");
  return Array.from(found);
}

export function duplicateReasonLabels(keys: string[]): string[] {
  const labels = new Set<string>();
  let crossAuth = false;
  for (const key of keys) {
    if (key.startsWith("auth:")) labels.add("AUTH IDENTITY DUPLICATE");
    else if (key.startsWith("phone:")) {
      labels.add("Same normalized phone");
      crossAuth = true;
    } else if (key.startsWith("email:")) labels.add("Same email");
    else if (key.startsWith("namezip:")) {
      labels.add("Same name + ZIP");
      crossAuth = true;
    } else if (key.startsWith("namephone:")) {
      labels.add("Same name + phone");
      crossAuth = true;
    } else if (key.startsWith("name:")) labels.add("Same name");
    else if (key.startsWith("apple-phone:")) {
      labels.add("Apple account paired with incomplete phone account");
      crossAuth = true;
    }
  }
  if (crossAuth) labels.add("Possible Cross-Auth Duplicate");
  return Array.from(labels);
}
