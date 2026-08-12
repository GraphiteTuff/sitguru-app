export type AcademyType = "pet_parent" | "guru" | "ambassador";

export function normalizeAcademyType(value?: string | null): AcademyType {
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : "";

  if (normalized === "pet_parent" || normalized === "pet-parent") {
    return "pet_parent";
  }

  if (normalized === "guru") return "guru";

  return "ambassador";
}
