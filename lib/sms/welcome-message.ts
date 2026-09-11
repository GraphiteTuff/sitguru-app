const ROLE_LABELS: Record<string, string> = {
  guru: "Guru",
  pet_parent: "Pet Parent",
  customer: "Pet Parent",
  petparent: "Pet Parent",
  ambassador: "Ambassador",
};

export function normalizeWelcomeRoles(roles: string[]) {
  const labels = new Set<string>();
  for (const role of roles) {
    const key = String(role || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
    const mapped = ROLE_LABELS[key];
    if (mapped) labels.add(mapped);
    else if (/guru/i.test(role)) labels.add("Guru");
    else if (/pet\s*parent|customer/i.test(role)) labels.add("Pet Parent");
    else if (/ambassador/i.test(role)) labels.add("Ambassador");
  }

  const order = ["Guru", "Pet Parent", "Ambassador"];
  return order.filter((label) => labels.has(label));
}

export function welcomeRolePhrase(roles: string[]) {
  const labels = normalizeWelcomeRoles(roles);
  if (labels.length === 0) return "part of the SitGuru community";
  if (labels.length === 1) {
    return labels[0] === "Ambassador" ? "an Ambassador" : `a ${labels[0]}`;
  }
  if (labels.length === 2) {
    return `both a ${labels[0]} and ${labels[1]}`;
  }
  const last = labels[labels.length - 1];
  return `a ${labels.slice(0, -1).join(", ")}, and ${last}`;
}

export function firstNameFromDisplayName(name: string) {
  const cleaned = String(name || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "there";
  return cleaned.split(" ")[0] || "there";
}

export function buildWelcomeSms({
  firstName,
  roles,
}: {
  firstName: string;
  roles: string[];
}) {
  const greetingName = firstNameFromDisplayName(firstName);
  const rolePhrase = welcomeRolePhrase(roles);
  return `Hi ${greetingName}! This is Jason from SitGuru. Welcome to the SitGuru community! We’re excited to have you with us as ${rolePhrase}. If you have any questions or need help getting started, just reply anytime. Thanks for joining SitGuru! — Jason`;
}
