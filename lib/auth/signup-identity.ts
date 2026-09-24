/**
 * Signup identity rules.
 *
 * One SitGuru core account per Supabase auth.users.id.
 * Phone/name/ZIP collected before auth are a draft, not a second user.
 * A phone match may flag review. It must not merge two authenticated users.
 */

export function normalizeUsPhone(value: string | null | undefined): string | null {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

export type SignupAuthUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
};

export type ExistingAccount = {
  userId: string;
  guruId?: string | null;
};

/**
 * Resolve the single account for an authenticated user.
 * Never creates a second core id. Draft migration is the caller's job
 * and must target this id only.
 */
export function resolveAuthenticatedAccount(input: {
  authUser: SignupAuthUser;
  existingByAuthId?: ExistingAccount | null;
}): { userId: string; reused: boolean; guruId: string | null } {
  const userId = input.authUser.id;
  if (!userId) {
    throw new Error("Authenticated user id is required.");
  }

  if (input.existingByAuthId && input.existingByAuthId.userId === userId) {
    return {
      userId,
      reused: true,
      guruId: input.existingByAuthId.guruId || null,
    };
  }

  return { userId, reused: false, guruId: null };
}

/**
 * Phone may connect a pre-auth draft to the current session.
 * Two different authenticated ids are a review flag, never an auto-merge.
 */
export function classifyPhoneCollision(input: {
  currentAuthUserId: string;
  otherAuthUserId: string | null;
  currentPhone: string | null | undefined;
  otherPhone: string | null | undefined;
}): "none" | "same_account" | "possible_duplicate_review" {
  const current = normalizeUsPhone(input.currentPhone);
  const other = normalizeUsPhone(input.otherPhone);
  if (!current || !other || current !== other) return "none";
  if (!input.otherAuthUserId || input.otherAuthUserId === input.currentAuthUserId) {
    return "same_account";
  }
  return "possible_duplicate_review";
}

export function duplicateReasonLabels(keys: string[]): string[] {
  const labels = new Set<string>();
  for (const key of keys) {
    if (key.startsWith("auth:")) labels.add("AUTH IDENTITY DUPLICATE");
    else if (key.startsWith("phone:")) labels.add("Same normalized phone");
    else if (key.startsWith("email:")) labels.add("Same email");
    else if (key.startsWith("namezip:")) labels.add("Same name + ZIP");
    else if (key.startsWith("name:")) labels.add("Same name");
    else if (key.startsWith("apple:")) labels.add("Apple signup conflict");
  }
  return Array.from(labels);
}
