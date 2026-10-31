import { planInternshipHours } from "@/lib/internship/onboarding-authority";

export type Spring2027CandidatePlan = {
  key: "ryan" | "lola" | "lalita";
  fullName: string;
  contactEmail: string | null;
  universityName: string;
  academicProgram: string;
  status: "pending_university_approval" | "prospective";
  offerStatus: "pending";
  requestedCredits: number | null;
  hoursPerCredit: number | null;
  plannedTotalHours: number;
  plannedWeeklyHours: number;
  plannedWeeks: number;
  verifiedRequiredHours: null;
  requirementStatus: "pending";
  universityVerificationStatus: "pending";
};

const ryanPlan = planInternshipHours({
  requestedCredits: 3,
  hoursPerCredit: 50,
  plannedWeeks: 15,
});
const lolaPlan = planInternshipHours({
  requestedCredits: null,
  hoursPerCredit: null,
  plannedWeeks: 15,
  plannedTotalHours: 150,
});
const lalitaPlan = planInternshipHours({
  requestedCredits: 6,
  hoursPerCredit: 50,
  plannedWeeks: 15,
});

export const SPRING_2027_CANDIDATE_PLANS: Spring2027CandidatePlan[] = [
  {
    key: "ryan",
    fullName: "Ryan Manibo",
    contactEmail: null,
    universityName: "Penn State University",
    academicProgram: "Advertising & Public Relations",
    status: "pending_university_approval",
    offerStatus: "pending",
    requestedCredits: 3,
    hoursPerCredit: 50,
    plannedTotalHours: ryanPlan.plannedTotalHours || 150,
    plannedWeeklyHours: ryanPlan.plannedWeeklyHours || 10,
    plannedWeeks: 15,
    verifiedRequiredHours: null,
    requirementStatus: "pending",
    universityVerificationStatus: "pending",
  },
  {
    key: "lola",
    fullName: "Lola Uhl",
    contactEmail: "lola.uh15@gmail.com",
    universityName: "Saint Joseph's University",
    academicProgram: "Marketing",
    status: "pending_university_approval",
    offerStatus: "pending",
    requestedCredits: null,
    hoursPerCredit: null,
    plannedTotalHours: lolaPlan.plannedTotalHours || 150,
    plannedWeeklyHours: lolaPlan.plannedWeeklyHours || 10,
    plannedWeeks: 15,
    verifiedRequiredHours: null,
    requirementStatus: "pending",
    universityVerificationStatus: "pending",
  },
  {
    key: "lalita",
    fullName: "Lalita Dhital",
    contactEmail: "lalitadhital5@gmail.com",
    universityName: "Penn State Hazleton",
    academicProgram: "",
    status: "prospective",
    offerStatus: "pending",
    requestedCredits: 6,
    hoursPerCredit: 50,
    plannedTotalHours: lalitaPlan.plannedTotalHours || 300,
    plannedWeeklyHours: lalitaPlan.plannedWeeklyHours || 20,
    plannedWeeks: 15,
    verifiedRequiredHours: null,
    requirementStatus: "pending",
    universityVerificationStatus: "pending",
  },
];

export function candidateContactEmail(plan: Spring2027CandidatePlan, ryanEmail?: string | null) {
  if (plan.key === "ryan") {
    const email = String(ryanEmail || "").trim().toLowerCase();
    return email.includes("@") ? email : null;
  }
  return plan.contactEmail;
}
