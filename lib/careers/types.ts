export const CAREER_CATEGORIES = ["career", "internship"] as const;
export const CAREER_STATUSES = ["draft", "published", "closed"] as const;
export const CAREER_TRACKS = [
  "social_media",
  "community",
  "events",
  "design",
  "engineering",
  "analytics",
  "operations",
  "general",
] as const;
export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
] as const;
export const COMPENSATION_TYPES = [
  "paid_hourly",
  "paid_salary",
  "paid_plus_credit",
  "academic_credit",
] as const;

export type CareerCategory = (typeof CAREER_CATEGORIES)[number];
export type CareerStatus = (typeof CAREER_STATUSES)[number];
export type CareerTrack = (typeof CAREER_TRACKS)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type CompensationType = (typeof COMPENSATION_TYPES)[number];

export type CareerJob = {
  id: string;
  slug: string;
  title: string;
  category: CareerCategory;
  track: CareerTrack;
  location: string;
  employmentType: EmploymentType;
  compensationType: CompensationType;
  compensationNote: string;
  hoursPerWeek: string;
  academicCreditEligible: boolean;
  collegePartner: string;
  status: CareerStatus;
  summary: string;
  description: string;
  highlights: string[];
  applyEmail: string;
  applyUrl: string;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CareerJobInput = {
  id?: string;
  slug?: string;
  title: string;
  category: CareerCategory;
  track: CareerTrack;
  location: string;
  employmentType: EmploymentType;
  compensationType: CompensationType;
  compensationNote?: string;
  hoursPerWeek?: string;
  academicCreditEligible?: boolean;
  collegePartner?: string;
  status: CareerStatus;
  summary: string;
  description: string;
  highlights: string[];
  applyEmail?: string;
  applyUrl?: string;
  sortOrder?: number;
};

export const TRACK_LABELS: Record<CareerTrack, string> = {
  social_media: "Social Media & Digital Marketing",
  community: "Community Partnerships",
  events: "Pet Event Marketing",
  design: "Graphic Design / Content",
  engineering: "Software Development",
  analytics: "Data / Analytics",
  operations: "Operations",
  general: "General",
};

export const CATEGORY_LABELS: Record<CareerCategory, string> = {
  career: "Career",
  internship: "Internship",
};

export const STATUS_LABELS: Record<CareerStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
};

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const COMPENSATION_LABELS: Record<CompensationType, string> = {
  paid_hourly: "Paid hourly",
  paid_salary: "Paid salary",
  paid_plus_credit: "Paid + academic credit",
  academic_credit: "Academic credit (college-coordinated)",
};

export function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function jobMetaChips(job: CareerJob) {
  const chips = [
    CATEGORY_LABELS[job.category],
    TRACK_LABELS[job.track],
    job.location,
    EMPLOYMENT_LABELS[job.employmentType],
    job.compensationNote || COMPENSATION_LABELS[job.compensationType],
  ];
  if (job.hoursPerWeek) chips.push(`${job.hoursPerWeek} hrs/week`);
  if (job.academicCreditEligible) chips.push("Academic credit eligible");
  return chips.filter(Boolean);
}
