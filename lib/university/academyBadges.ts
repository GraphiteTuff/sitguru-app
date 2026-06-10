export type AcademyType = "guru" | "pet_parent" | "ambassador";

export type AcademyBadgeConfig = {
  academyType: AcademyType;
  label: string;
  shortLabel: string;
  chipLabel: string;
  description: string;
  completedThroughText: string;
  imagePath: string;
};

export const ACADEMY_BADGES: Record<AcademyType, AcademyBadgeConfig> = {
  guru: {
    academyType: "guru",
    label: "Guru Academy Graduate",
    shortLabel: "Certified Guru",
    chipLabel: "Academy Graduate",
    description: "Completed Guru Academy through SitGuru University.",
    completedThroughText: "Completed through SitGuru University",
    imagePath: "/images/badges/sitguru-certified-guru-badge.png",
  },
  pet_parent: {
    academyType: "pet_parent",
    label: "Pet Parent Academy Graduate",
    shortLabel: "Certified Pet Parent",
    chipLabel: "Academy Graduate",
    description: "Completed Pet Parent Academy through SitGuru University.",
    completedThroughText: "Completed through SitGuru University",
    imagePath: "/images/badges/sitguru-certified-pet-parent-badge.png",
  },
  ambassador: {
    academyType: "ambassador",
    label: "Ambassador Academy Graduate",
    shortLabel: "Certified Ambassador",
    chipLabel: "Academy Graduate",
    description: "Completed Ambassador Academy through SitGuru University.",
    completedThroughText: "Completed through SitGuru University",
    imagePath: "/images/badges/sitguru-certified-ambassador-badge.png",
  },
};

export function getAcademyBadgeConfig(
  academyType: AcademyType,
): AcademyBadgeConfig {
  return ACADEMY_BADGES[academyType];
}

export function isAcademyType(value: unknown): value is AcademyType {
  return value === "guru" || value === "pet_parent" || value === "ambassador";
}