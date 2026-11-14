/**
 * Jason's intern profile was used to test the Manager Assignments workflow.
 * Keep test records out of the active manager assignment experience without
 * deleting internship history or touching any real intern's work.
 *
 * A permanent database purge must be a separately audited, explicit operation.
 */
type InternIdentity = {
  fullName?: unknown;
  full_name?: unknown;
  preferredName?: unknown;
  preferred_name?: unknown;
  email?: unknown;
  workEmail?: unknown;
  work_email?: unknown;
};

function normalized(value: unknown) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/\./g, "");
}

export function isJasonManagerAssignmentTestIntern(intern: InternIdentity) {
  const fullName = normalized(intern.fullName ?? intern.full_name);
  const preferredName = normalized(intern.preferredName ?? intern.preferred_name);
  const email = normalized(intern.email);
  const workEmail = normalized(intern.workEmail ?? intern.work_email);
  const knownName = ["jason", "jason graff", "jason l graff"].includes(fullName);
  const knownEmail = email === "jason@sitguru.com" || workEmail === "jason@sitguru.com";

  return knownName || (knownEmail && (fullName.startsWith("jason") || preferredName === "jason"));
}
