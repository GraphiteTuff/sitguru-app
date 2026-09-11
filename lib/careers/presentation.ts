import {
  CATEGORY_LABELS,
  COMPENSATION_LABELS,
  EMPLOYMENT_LABELS,
  type CareerJob,
} from "@/lib/careers/types";

export type CareerDescriptionBlock = {
  type: "heading" | "paragraph";
  text: string;
};

export function getCareerApplyHref(job: Pick<CareerJob, "title" | "applyEmail" | "applyUrl">) {
  if (job.applyUrl) return job.applyUrl;
  const subject = encodeURIComponent(`SitGuru application: ${job.title}`);
  return `mailto:${job.applyEmail}?subject=${subject}`;
}

export function getCareerMailtoHref(job: Pick<CareerJob, "title" | "applyEmail">) {
  const subject = encodeURIComponent(`SitGuru application: ${job.title}`);
  return `mailto:${job.applyEmail}?subject=${subject}`;
}

export function getCareerApplyLabel(job: Pick<CareerJob, "applyEmail" | "applyUrl">) {
  return job.applyUrl ? "Apply now" : `Email ${job.applyEmail}`;
}

export function parseCareerDescription(description: string): CareerDescriptionBlock[] {
  return String(description || "")
    .split(/\n{2,}/)
    .map((part) => part.replace(/\r/g, "").trim())
    .filter(Boolean)
    .map((text) => ({
      type: text.length <= 48 && !/[.!?]$/.test(text) ? "heading" : "paragraph",
      text,
    }));
}

export function careerJobFacts(job: CareerJob) {
  const facts = [
    { label: "Role type", value: CATEGORY_LABELS[job.category] },
    { label: "Location", value: job.location },
    { label: "Schedule", value: EMPLOYMENT_LABELS[job.employmentType] },
    {
      label: "Compensation",
      value: job.compensationNote || COMPENSATION_LABELS[job.compensationType],
    },
  ];

  if (job.hoursPerWeek) {
    facts.push({ label: "Hours", value: `${job.hoursPerWeek} / week` });
  }
  if (job.academicCreditEligible) {
    facts.push({ label: "Academic credit", value: "Eligible through your school" });
  }
  if (job.collegePartner) {
    facts.push({ label: "Schools", value: job.collegePartner });
  }

  return facts.filter((fact) => Boolean(fact.value));
}
