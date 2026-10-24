const GENERIC_NAMES = new Set([
  "admin",
  "admin user",
  "admin hq",
  "sitguru staff",
  "sitguru admin",
  "test",
  "test user",
  "staff",
  "system",
  "service",
  "service account",
  "user",
  "hq",
  "unknown",
]);

const CUSTOMER_ROLES = new Set([
  "pet_parent",
  "petparent",
  "customer",
  "guru",
  "ambassador",
  "user",
  "member",
]);

export type InternshipStaffIdentity = {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle: string;
  active: boolean;
  isTest?: boolean;
  canManageInterns: boolean;
  canSuperviseInterns: boolean;
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[-\s]+/g, "_");
}

export function isCustomerOnlyRole(role: string | null | undefined) {
  const value = normalize(String(role || ""));
  if (!value) return false;
  return CUSTOMER_ROLES.has(value);
}

export function isGenericStaffIdentity(input: { name: string; email: string }) {
  const name = input.name.trim().toLowerCase();
  const local = input.email.split("@")[0]?.trim().toLowerCase() || "";
  if (!name || GENERIC_NAMES.has(name)) return true;
  if (name === local) return true;
  if (/\b(test|demo|fixture|system|service)\b/i.test(name)) return true;
  return false;
}

export function isTestStaffEmail(email: string) {
  const value = email.trim().toLowerCase();
  if (!value.includes("@")) return true;
  return (
    value.endsWith("@example.com") ||
    value.endsWith("@example.edu") ||
    value.includes("+test") ||
    value.startsWith("test@") ||
    value.startsWith("noreply@") ||
    value.startsWith("no-reply@")
  );
}

export function internshipStaffIdentityOk(person: InternshipStaffIdentity) {
  if (!person.id || person.active === false || person.isTest) return false;
  if (isCustomerOnlyRole(person.role)) return false;
  if (isTestStaffEmail(person.email)) return false;
  if (isGenericStaffIdentity(person)) return false;
  const parts = person.name.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 && parts.every((part) => part.length > 1);
}

export function canSelectInternshipManager(person: InternshipStaffIdentity) {
  return person.canManageInterns === true && internshipStaffIdentityOk(person);
}

export function canSelectInternshipSupervisor(person: InternshipStaffIdentity) {
  return person.canSuperviseInterns === true && internshipStaffIdentityOk(person);
}

export function internshipStaffOptionLabel(person: Pick<InternshipStaffIdentity, "name" | "jobTitle" | "email">) {
  const title = person.jobTitle.trim() || "Title not set";
  return `${person.name.trim()} — ${title} — ${person.email.trim()}`;
}

export function assignmentStaffChangeAllowed(input: {
  currentId?: string | null;
  nextId?: string | null;
  selectable: boolean;
  roleLabel: "manager" | "supervisor";
}) {
  const nextId = String(input.nextId || "");
  if (!nextId) return { ok: true as const };
  if (nextId === String(input.currentId || "")) return { ok: true as const };
  if (!input.selectable) {
    return {
      ok: false as const,
      error: `Choose an active staff member who is explicitly eligible to be the ${input.roleLabel}.`,
    };
  }
  return { ok: true as const };
}
