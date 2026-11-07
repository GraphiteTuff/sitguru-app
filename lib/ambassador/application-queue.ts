/**
 * Ambassador applications submitted on the public form land in
 * program_applications. The Admin work queue has to read that table too,
 * or a new applicant never appears among existing Ambassador records.
 */

export type AmbassadorWorkQueue =
  | "new"
  | "pending"
  | "attention"
  | "approved"
  | "all";

const PENDING_STATUSES = new Set([
  "reviewing",
  "contacted",
  "interested",
  "interview_scheduled",
  "interviewed",
  "conditional_offer_sent",
  "onboarding_sent",
  "onboarding",
  "checkr_pending",
  "checkr_complete",
  "signup_incomplete",
]);

export function isAmbassadorProgram(program: string | null | undefined) {
  return String(program || "")
    .trim()
    .toLowerCase()
    .includes("ambassador");
}

export function isOpenAmbassadorApplicationId(id: string | null | undefined) {
  return String(id || "").startsWith("application:");
}

/** One inserted or missing character in the mailbox, same domain. */
export function sameInboxEmail(left: string | null | undefined, right: string | null | undefined) {
  const a = String(left || "").trim().toLowerCase();
  const b = String(right || "").trim().toLowerCase();
  if (!a.includes("@") || !b.includes("@")) return false;
  if (a === b) return true;
  const [localA, domainA] = a.split("@");
  const [localB, domainB] = b.split("@");
  if (!localA || !localB || domainA !== domainB) return false;
  if (localA.length === localB.length) {
    let differences = 0;
    for (let index = 0; index < localA.length; index += 1) {
      if (localA[index] !== localB[index]) differences += 1;
    }
    return differences === 1;
  }
  if (Math.abs(localA.length - localB.length) !== 1) return false;
  const [shorter, longer] = localA.length < localB.length ? [localA, localB] : [localB, localA];
  for (let index = 0; index < longer.length; index += 1) {
    if (`${longer.slice(0, index)}${longer.slice(index + 1)}` === shorter) return true;
  }
  return false;
}

/** Personal address stays the live contact. A work address is kept beside it. */
export function roleContactEmails(personal: string, work?: string | null) {
  const email = String(personal || "").trim().toLowerCase();
  const workEmail = String(work || "").trim().toLowerCase();
  const assigned = workEmail && workEmail !== email ? workEmail : "";
  return {
    email,
    contactEmail: email,
    loginEmail: assigned || email,
    workEmail: assigned,
  };
}

export function ambassadorTypeForApplication(raw: string | null | undefined) {
  const value = String(raw || "").toLowerCase();
  if (value.includes("campus") || value.includes("student")) return "campus_ambassador";
  if (value.includes("city")) return "city_captain";
  if (value.includes("neighborhood")) return "neighborhood_ambassador";
  if (value.includes("partner")) return "local_partner_ambassador";
  return "community_ambassador";
}

export function matchesAmbassadorWorkQueue(input: {
  queue: string | null | undefined;
  id: string;
  status: string | null | undefined;
  needsAttention: boolean;
  archived: boolean;
}) {
  const queue = String(input.queue || "all").trim().toLowerCase();
  if (!queue || queue === "all") return true;
  if (input.archived) return false;
  const status = String(input.status || "").trim().toLowerCase();
  if (queue === "new") {
    return isOpenAmbassadorApplicationId(input.id) || status === "new";
  }
  if (queue === "pending") return PENDING_STATUSES.has(status);
  if (queue === "attention") return input.needsAttention;
  if (queue === "approved") return status === "active";
  return true;
}
