import type {
  ACADEMIC_CREDIT_STATUSES,
  CONTRIBUTION_TYPES,
  FUNDING_DIRECTORY_STATUSES,
  INTERNSHIP_ELIGIBILITY_STATUSES,
  INTERN_STATUSES,
  METRIC_SOURCE_SYSTEMS,
  TASK_STATUSES,
  UNIVERSITY_STATUSES,
  WORKSPACE_SECTIONS,
} from "@/lib/internship/constants";

export type UniversityStatus = (typeof UNIVERSITY_STATUSES)[number];
export type AcademicCreditStatus = (typeof ACADEMIC_CREDIT_STATUSES)[number];
export type InternshipEligibilityStatus =
  (typeof INTERNSHIP_ELIGIBILITY_STATUSES)[number];
export type FundingDirectoryStatus = (typeof FUNDING_DIRECTORY_STATUSES)[number];
export type InternStatus = (typeof INTERN_STATUSES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];
export type MetricSourceSystem = (typeof METRIC_SOURCE_SYSTEMS)[number];
export type WorkspaceSection = (typeof WORKSPACE_SECTIONS)[number];

export type InternshipUniversity = {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  shortName: string;
  parentUniversityId: string | null;
  city: string;
  state: string;
  region: string;
  country: string;
  websiteUrl: string;
  status: UniversityStatus;
  isUniversityPartner: boolean;
  partnerNotes: string;
  partnerSince: string | null;
  remoteEligible: boolean;
  academicCreditStatus: AcademicCreditStatus;
  internshipEligibilityStatus: InternshipEligibilityStatus;
  fundingStatus: FundingDirectoryStatus;
  sourceUrl: string;
  verifiedAt: string | null;
  notes: string;
  archived: boolean;
};

export type InternshipCampus = {
  id: string;
  universityId: string;
  slug: string;
  name: string;
  displayName: string;
  city: string;
  state: string;
  isPrimary: boolean;
};

export type AcademicRequirement = {
  id: string;
  universityId: string;
  campusId: string | null;
  department: string;
  academicProgram: string;
  courseCode: string;
  courseName: string;
  creditHours: number | null;
  minimumInternshipHours: number | null;
  maximumInternshipHours: number | null;
  requiredWeeklyHours: number | null;
  requiresFacultySupervisor: boolean;
  requiresLearningAgreement: boolean;
  requiresOfferLetter: boolean;
  requiresMidpointEvaluation: boolean;
  requiresFinalEvaluation: boolean;
  requiresTimesheet: boolean;
  requiresFinalReport: boolean;
  requiresStudentReflection: boolean;
  requiresSiteVisit: boolean;
  otherRequirements: string;
  sourceUrl: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  status: string;
};

export type InternshipCohort = {
  id: string;
  name: string;
  season: string;
  year: number;
  academicYear: string;
  startsOn: string | null;
  endsOn: string | null;
  status: string;
};

export type InternshipProject = {
  id: string;
  cohortId: string;
  slug: string;
  name: string;
  projectKind: string;
  baselineNotes: string;
  targetNotes: string;
  status: string;
};

export type InternshipIntern = {
  id: string;
  userId: string | null;
  fullName: string;
  email: string;
  phone: string;
  cohortId: string;
  universityId: string;
  campusId: string | null;
  pathType: string;
  academicProgram: string;
  courseCode: string;
  credits: number | null;
  requiredHours: number | null;
  facultySupervisor: string;
  academicAdvisor: string;
  careerOffice: string;
  academicCoordinator: string;
  approvalStatus: string;
  approvalDate: string | null;
  semester: string;
  academicStartDate: string | null;
  academicEndDate: string | null;
  status: InternStatus;
  portalEnabled: boolean;
  academicSnapshot: Record<string, unknown>;
  notes: string;
};

export type InternshipTask = {
  id: string;
  internId: string;
  projectId: string | null;
  title: string;
  dueOn: string | null;
  status: TaskStatus;
  workUrl: string;
  businessObjective: string;
  metricAffected: string;
  studentNotes: string;
  supervisorNotes: string;
  supervisorApproved: boolean;
  approvedAt: string | null;
  submittedAt: string | null;
  employerLetter: string;
  kpiTier: string;
  outputVsTarget: number | null;
};

export type InternshipContentItem = {
  id: string;
  internId: string;
  title: string;
  platform: string;
  draftUrl: string;
  publishedUrl: string;
  status: string;
  dueOn: string | null;
  studentNotes: string;
  supervisorNotes: string;
  supervisorApproved: boolean;
  submittedAt: string | null;
  employerLetter: string;
  kpiTier: string;
  outputVsTarget: number | null;
};

export type InternshipWorkComment = {
  id: string;
  internId: string;
  itemType: "task" | "content";
  itemId: string;
  authorRole: "intern" | "supervisor";
  body: string;
  createdAt: string;
};

export type InternshipCampaign = {
  id: string;
  internId: string | null;
  projectId: string | null;
  name: string;
  utmSource: string;
  utmCampaign: string;
  referralCode: string;
  trackingUrl: string;
  objective: string;
  status: string;
  primaryOwnerInternId: string | null;
};

export type InternshipMetric = {
  id: string;
  internId: string | null;
  campaignId: string | null;
  projectId: string | null;
  metricKey: string;
  label: string;
  valueNumeric: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  sourceSystem: MetricSourceSystem;
  sourceNote: string;
  isVerified: boolean;
  selfReported: boolean;
};

export type InternshipScorecard = {
  id: string;
  internId: string;
  periodStart: string;
  periodEnd: string;
  quality: number;
  communication: number;
  reliability: number;
  creativity: number;
  analytics: number;
  judgment: number;
  initiative: number;
  kpiContribution: number;
  strongestContribution: string;
  improvementRequired: string;
  scoredAt: string | null;
};

export type InternshipWeeklyReview = {
  id: string;
  internId: string;
  weekOf: string;
  accomplished: string;
  dataShowed: string;
  didntWork: string;
  changingNextWeek: string;
  upcomingApproved: boolean;
};

export type FrozenAcademicProfile = {
  university: string;
  campus: string;
  academicProgram: string;
  courseCode: string;
  credits: number | null;
  requiredHours: number | null;
  facultySupervisor: string;
  academicAdvisor: string;
  careerOffice: string;
  academicCoordinator: string;
  approvalStatus: string;
  approvalDate: string | null;
  semester: string;
  academicStartDate: string | null;
  academicEndDate: string | null;
  requirementId: string | null;
  copiedAt: string;
};

export type CohortDashboardStats = {
  universities: number;
  interns: number;
  requiredHours: number;
  projects: number;
};

export type InternshipMilestone = {
  id: string;
  cohortId: string;
  universityId: string | null;
  universityName: string;
  key: string;
  title: string;
  dueOn: string;
  phase: string;
  owner: string;
  action: string;
  status: string;
};

export type InternshipSmartGoal = {
  id: string;
  internId: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  metricKey: string;
  baselineValue: string;
  targetValue: string;
  sourceSystem: string;
  status: string;
};

export type InternshipExperiment = {
  id: string;
  internId: string;
  hypothesis: string;
  action: string;
  audience: string;
  result: string;
  lesson: string;
  nextStep: string;
};

export type InternshipAccessGrant = {
  toolKey: string;
  granted: boolean;
  notes: string;
};

export type InternshipWorkspaceData = {
  intern: InternshipIntern;
  university: InternshipUniversity | null;
  campus: InternshipCampus | null;
  cohort: InternshipCohort | null;
  projects: InternshipProject[];
  tasks: InternshipTask[];
  content: InternshipContentItem[];
  campaigns: InternshipCampaign[];
  metrics: InternshipMetric[];
  scorecards: InternshipScorecard[];
  weeklyReviews: InternshipWeeklyReview[];
  smartGoals: InternshipSmartGoal[];
  experiments: InternshipExperiment[];
  accessGrants: InternshipAccessGrant[];
  milestones: InternshipMilestone[];
  comments: InternshipWorkComment[];
};
