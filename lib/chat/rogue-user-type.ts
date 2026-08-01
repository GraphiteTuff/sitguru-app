/**
 * Map SitGuru account / intent roles into Rogue audience labels.
 */

export type RogueUserTypeLabel =
  | "Guest Pet Parent"
  | "Pet Parent"
  | "Guru"
  | "Ambassador"
  | "Admin";

const STORAGE_KEY = "sitguru_rogue_user_type";

export function normalizeRogueUserType(raw: unknown): RogueUserTypeLabel {
  const role = String(raw || "")
    .toLowerCase()
    .trim();

  if (!role) return "Guest Pet Parent";
  if (role.includes("admin")) return "Admin";
  if (
    role.includes("ambassador") ||
    role.includes("sitguru_rep") ||
    role.includes("student") ||
    role.includes("veteran") ||
    role.includes("community ambassador")
  ) {
    return "Ambassador";
  }
  if (
    role.includes("guru") ||
    role.includes("handler") ||
    role.includes("sitter") ||
    role.includes("walker") ||
    role.includes("trainer") ||
    role.includes("provider")
  ) {
    return "Guru";
  }
  if (
    role.includes("customer") ||
    role.includes("pet_parent") ||
    role.includes("pet-parent") ||
    role.includes("parent") ||
    role.includes("guest pet parent") ||
    role.includes("pet parent")
  ) {
    return role.includes("guest") ? "Guest Pet Parent" : "Pet Parent";
  }

  return "Guest Pet Parent";
}

/** Infer audience from homepage intent chip content. */
export function inferRogueUserTypeFromIntent(
  content: string,
): RogueUserTypeLabel | null {
  const text = String(content || "").toLowerCase();
  if (!text) return null;
  if (text.includes("ambassador")) return "Ambassador";
  if (
    text.includes("register as") ||
    text.includes("sitter") ||
    text.includes("dog walker") ||
    text.includes("trainer")
  ) {
    return "Guru";
  }
  if (
    text.includes("looking for") ||
    text.includes("drop-in") ||
    text.includes("dog walk") ||
    text.includes("overnight") ||
    text.includes("boarding")
  ) {
    return "Guest Pet Parent";
  }
  return null;
}

export function readStoredRogueUserType(): RogueUserTypeLabel {
  try {
    return normalizeRogueUserType(
      localStorage.getItem(STORAGE_KEY) ||
        sessionStorage.getItem(STORAGE_KEY) ||
        "",
    );
  } catch {
    return "Guest Pet Parent";
  }
}

export function persistRogueUserType(label: RogueUserTypeLabel) {
  try {
    localStorage.setItem(STORAGE_KEY, label);
    sessionStorage.setItem(STORAGE_KEY, label);
  } catch {
    // ignore quota
  }
}

export function formatRogueUserTypeDirective(userType?: string | null): string {
  const label = normalizeRogueUserType(userType || "Guest Pet Parent");
  if (!String(userType || "").trim()) {
    return `\nCURRENT USER TYPE: General visitor / Guest Pet Parent.\n`;
  }
  return `\nCURRENT USER TYPE: Optimize your tone specifically for a ${label}.\n`;
}
