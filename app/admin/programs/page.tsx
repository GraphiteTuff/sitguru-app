import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Download,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Medal,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type ProgramKey =
  | "student-hire"
  | "community-hire"
  | "veterans-hire"
  | "ambassador-program";

type ProgramDefinition = {
  key: ProgramKey;
  title: string;
  shortTitle: string;
  campaign: string;
  eyebrow: string;
  description: string;
  href: string;
  applicationsHref: string;
  icon: ReactNode;
  audience: string[];
  partners: string[];
  goals: string[];
  requirements: string[];
  keywords: string[];
};

const adminRoutes = {
  dashboard: "/admin",
  programs: "/admin/programs",
  programApplications: "/admin/program-applications",
  programsExport: "/admin/programs/export",
  studentHire: "/admin/programs/student-hire",
  communityHire: "/admin/programs/community-hire",
  veteransHire: "/admin/programs/veterans-hire",
  ambassadorProgram: "/admin/programs/ambassadors",
  partners: "/admin/partners",
  gurus: "/admin/gurus",
  messages: "/admin/messages",
};

const programDefinitions: ProgramDefinition[] = [
  {
    key: "student-hire",
    title: "Student Hire Program",
    shortTitle: "Student Hire",
    campaign: "Earn with the Pack",
    eyebrow: "Extra cash for students",
    description:
      "Flexible pet care opportunities for students, recent grads, high school seniors 18+, trade school students, gap-year students, and summer workers who want to earn around class, weekends, school breaks, and summer.",
    href: adminRoutes.studentHire,
    applicationsHref: `${adminRoutes.programApplications}?program=student-hire`,
    icon: <GraduationCap size={26} />,
    audience: [
      "Students who want extra cash",
      "High school seniors 18+",
      "College students",
      "Trade school and certificate program students",
      "Recent graduates",
      "Summer workers",
      "Students looking for after-class, break, or weekend income",
    ],
    partners: [
      "Universities",
      "High schools",
      "Career centers",
      "Student organizations",
      "Athletic teams and clubs",
      "Summer work programs",
      "Local education partners",
      "Campus ambassadors",
    ],
    goals: [
      "Increase student Guru applicants",
      "Create flexible earning opportunities around school",
      "Track school, availability, services, resume, and onboarding readiness",
      "Encourage students to share Student Hire with friends",
      "Identify strong Student Ambassadors who can grow SitGuru locally",
    ],
    requirements: [
      "Independent contractor marketplace model",
      "Applicant review",
      "Age and eligibility review",
      "Onboarding completion",
      "Checkr background check when required",
      "Profile readiness",
      "Bookable Guru status when approved",
    ],
    keywords: [
      "student-hire",
      "student hire",
      "student",
      "college",
      "university",
      "graduate",
      "recent grad",
      "campus",
      "school",
      "summer",
      "after class",
      "between classes",
      "earn with the pack",
      "student ambassador",
      "campus ambassador",
      "pa careerlink",
      "careerlink",
      "career link",
    ],
  },
  {
    key: "community-hire",
    title: "Community Hire Program",
    shortTitle: "Community Hire",
    campaign: "Work with the Pack",
    eyebrow: "Community workforce pathway",
    description:
      "A supported referral and readiness pathway for qualified applicants connected through workforce programs, nonprofits, city, state, federal, community organizations, re-entry support programs, job-readiness programs, and local employment-support partners.",
    href: adminRoutes.communityHire,
    applicationsHref: `${adminRoutes.programApplications}?program=community-hire`,
    icon: <Building2 size={26} />,
    audience: [
      "Workforce program participants",
      "Nonprofit partner referrals",
      "City, state, and federal program referrals",
      "Job-readiness program participants",
      "Re-entry support program participants",
      "Community organization referrals",
      "People seeking flexible local work opportunities",
      "Applicants ready to learn, communicate, and show reliability",
    ],
    partners: [
      "Workforce development boards",
      "CareerLink and job centers",
      "City workforce programs",
      "State employment programs",
      "Federal workforce programs",
      "Nonprofit workforce partners",
      "Re-entry support organizations",
      "Community training organizations",
      "Faith-based and community organizations",
    ],
    goals: [
      "Support workforce-friendly access to local pet care opportunities",
      "Track partner/referral source and readiness",
      "Apply fair, consistent, role-related background check review",
      "Move qualified applicants toward onboarding and full Guru status",
      "Identify community partners who can become long-term growth sources",
    ],
    requirements: [
      "Independent contractor marketplace model",
      "Not full-time or part-time employment",
      "Not guaranteed job placement",
      "Partner/referral source tracking",
      "Fair Checkr background check review when required",
      "EEOC-guided background check review",
      "Applicable review and notice process when needed",
    ],
    keywords: [
      "community-hire",
      "community hire",
      "community",
      "workforce",
      "employment-support",
      "employment support",
      "job-readiness",
      "job readiness",
      "nonprofit",
      "re-entry",
      "reentry",
      "city",
      "state",
      "federal",
      "careerlink",
      "work program",
      "work with the pack",
      "community ambassador",
    ],
  },
  {
    key: "veterans-hire",
    title: "Military Hire Program",
    shortTitle: "Military Hire",
    campaign: "Serve with the Pack",
    eyebrow: "Military and veteran-connected pathway",
    description:
      "A SitGuru pathway for veterans, transitioning service members, eligible service members, National Guard, reservists, military spouses, qualified dependents over 18, and SkillBridge-interested active-duty members exploring future pet care, operations, and local service opportunities.",
    href: adminRoutes.veteransHire,
    applicationsHref: `${adminRoutes.programApplications}?program=veterans-hire`,
    icon: <Medal size={26} />,
    audience: [
      "Veterans",
      "Transitioning service members",
      "Eligible service members",
      "National Guard and reservists",
      "Military spouses",
      "Qualified dependents over 18",
      "SkillBridge-interested active-duty service members",
      "Military-connected applicants ready to work, learn, and grow",
    ],
    partners: [
      "Military transition offices",
      "Veteran support organizations",
      "Military spouse support networks",
      "Base community partners",
      "Guard and reserve networks",
      "Transition assistance programs",
      "Military education offices",
      "SkillBridge-related transition partners",
    ],
    goals: [
      "Increase qualified military-connected Guru applicants",
      "Track transferable experience and supporting documents",
      "Support onboarding, training, trust, and background check readiness",
      "Move strong applicants toward full Guru status",
      "Track SkillBridge interest without presenting it as guaranteed placement",
      "Identify Veteran Ambassadors who can support local community growth",
    ],
    requirements: [
      "Independent contractor marketplace model",
      "Applicant review",
      "Resume and optional supporting documents",
      "Onboarding completion",
      "Checkr background check when required",
      "Profile readiness",
      "Bookable Guru status when approved",
      "SkillBridge interest is tracked as an interest list only unless formally approved later",
    ],
    keywords: [
      "veterans-hire",
      "veterans hire",
      "veteran hire",
      "veteran",
      "veterans",
      "military-hire",
      "military hire",
      "military",
      "service member",
      "servicemember",
      "spouse",
      "dependent",
      "guard",
      "reservist",
      "transition",
      "transitioning",
      "active duty",
      "active-duty",
      "skillbridge-interest",
      "skillbridge interest",
      "skillbridge",
      "military education",
      "training pathway",
      "serve with the pack",
      "veteran ambassador",
      "military ambassador",
      "pa careerlink",
      "careerlink",
      "career link",
    ],
  },
  {
    key: "ambassador-program",
    title: "Ambassador Program",
    shortTitle: "Ambassadors",
    campaign: "Lead the Pack",
    eyebrow: "Referral growth and Pack Leader recognition",
    description:
      "A profession-based community growth program for students, Vet Techs, veterinarians, trainers, groomers, rescue advocates, veterans, military spouses, community leaders, and existing Gurus who help refer Gurus and Pet Parents while promoting trusted pet care in their local communities.",
    href: adminRoutes.ambassadorProgram,
    applicationsHref: `${adminRoutes.programApplications}?program=ambassador-program`,
    icon: <HeartHandshake size={26} />,
    audience: [
      "Vet Techs",
      "Veterinarians",
      "Trainers",
      "Groomers and pet care professionals",
      "Students and campus leaders",
      "Veterans and military spouses",
      "Rescue and shelter advocates",
      "Community leaders",
      "Existing Gurus",
      "Medical and pet-care professionals who support responsible pet care",
    ],
    partners: [
      "Veterinary clinics",
      "Animal hospitals",
      "Training businesses",
      "Grooming businesses",
      "Pet stores",
      "Shelters and rescues",
      "Campus organizations",
      "Military and veteran groups",
      "Local community groups",
      "Existing SitGuru Gurus",
    ],
    goals: [
      "Track which Ambassador types drive the strongest growth",
      "Track referred Gurus and Pet Parents",
      "Track completed bookings created from referrals",
      "Calculate referral rewards and commission costs",
      "Identify top-performing Pack Leaders",
      "Feature top Ambassadors publicly with consent",
      "Create local marketing and flyer opportunities by profession",
    ],
    requirements: [
      "Ambassador application review",
      "Referral source tracking",
      "Unique referral code or referral link",
      "Consent required before public homepage or carousel recognition",
      "Commission and bonus rules controlled by SitGuru terms",
      "No guaranteed earnings, commissions, placement, or bookings",
      "Rewards paid only when referrals meet qualified program rules",
    ],
    keywords: [
      "ambassador-program",
      "ambassador program",
      "ambassador",
      "ambassadors",
      "lead the pack",
      "grow the pack",
      "pack leader",
      "pack leaders",
      "referral",
      "referrals",
      "commission",
      "reward",
      "bonus",
      "vet tech",
      "veterinarian",
      "trainer",
      "groomer",
      "rescue",
      "shelter",
      "student ambassador",
      "guru ambassador",
      "community ambassador",
      "veteran ambassador",
      "military ambassador",
    ],
  },
];

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function percent(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`;
}

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getAmount(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value > 0) return value;
  }

  return 0;
}

function getStatus(row: AnyRow) {
  return getText(
    row,
    ["status", "application_status", "participant_status", "program_status"],
    "new",
  )
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isPendingStatus(row: AnyRow) {
  const status = getStatus(row);

  return [
    "new",
    "pending",
    "submitted",
    "review",
    "reviewing",
    "in_review",
    "contacted",
    "interested",
    "applied",
    "missing_info",
  ].includes(status);
}

function isApprovedStatus(row: AnyRow) {
  const status = getStatus(row);

  return [
    "active",
    "approved",
    "accepted",
    "live",
    "enabled",
    "bookable",
    "complete",
    "completed",
  ].includes(status);
}

function isOnboardingStatus(row: AnyRow) {
  const status = getStatus(row);
  const text = JSON.stringify(row).toLowerCase();

  return (
    status.includes("onboarding") ||
    status.includes("training") ||
    text.includes("onboarding") ||
    text.includes("training_started") ||
    text.includes("training started")
  );
}

function isCheckrStatus(row: AnyRow) {
  const status = getStatus(row);
  const text = JSON.stringify(row).toLowerCase();

  return (
    status.includes("checkr") ||
    status.includes("background") ||
    text.includes("checkr") ||
    text.includes("background_check") ||
    text.includes("background check")
  );
}

function isBookableStatus(row: AnyRow) {
  const status = getStatus(row);
  const text = JSON.stringify(row).toLowerCase();

  return (
    status.includes("bookable") ||
    row.is_bookable === true ||
    row.bookable === true ||
    text.includes("bookable")
  );
}

function isCompletedBookingStatus(row: AnyRow) {
  const status = getStatus(row);

  return (
    status === "completed" ||
    status === "complete" ||
    status === "paid" ||
    status === "confirmed"
  );
}

function isFeaturedPackLeader(row: AnyRow) {
  return (
    row.featured_on_homepage === true ||
    row.is_featured === true ||
    row.homepage_featured === true ||
    row.pack_leader_featured === true
  );
}

function getDate(row: AnyRow) {
  return (
    asString(row.created_at) ||
    asString(row.updated_at) ||
    asString(row.submitted_at) ||
    asString(row.application_date) ||
    asString(row.date) ||
    null
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeProgramKey(value: string) {
  const normalized = value.toLowerCase().trim().replace(/\s+/g, "-");

  if (
    normalized === "military-hire" ||
    normalized === "skillbridge-interest" ||
    normalized === "skillbridge" ||
    normalized === "military"
  ) {
    return "veterans-hire";
  }

  if (
    normalized === "ambassadors" ||
    normalized === "ambassador" ||
    normalized === "ambassador-program"
  ) {
    return "ambassador-program";
  }

  return normalized;
}

function getProgramSourceText(row: AnyRow) {
  return [
    getText(row, [
      "program",
      "program_key",
      "program_slug",
      "program_type",
      "program_name",
      "source_program",
      "campaign",
      "campaign_name",
      "utm_campaign",
      "partner_source",
      "source",
      "referral_source",
      "referral_code",
      "ambassador_code",
      "ambassador_type",
      "profession",
      "profession_type",
      "affiliation",
      "affiliation_type",
      "community_source",
      "contractor_type",
      "worker_type",
      "classification",
      "school_name",
      "student_status",
      "student_background",
      "military_connected_background",
      "veteran_status",
      "skillbridge_status",
      "notes",
      "message",
      "description",
      "type",
      "category",
      "topic",
    ]),
    JSON.stringify(row),
  ]
    .join(" ")
    .toLowerCase();
}

function rowMatchesProgram(row: AnyRow, program: ProgramDefinition) {
  const exactProgram = normalizeProgramKey(
    getText(row, ["program", "program_key", "program_slug", "program_type"]),
  );

  if (exactProgram === program.key) return true;

  const search = getProgramSourceText(row);
  return program.keywords.some((keyword) => search.includes(keyword));
}

function rowsForProgram(rows: AnyRow[], program: ProgramDefinition) {
  return rows.filter((row) => rowMatchesProgram(row, program));
}

function sumRows(rows: AnyRow[], keys: string[]) {
  return rows.reduce((sum, row) => sum + getAmount(row, keys), 0);
}

function latestDateFromRows(rows: AnyRow[]) {
  const latest = rows
    .map((row) => getDate(row))
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return latest?.toISOString() || null;
}

function getReadableStatus(row: AnyRow) {
  const status = getStatus(row);

  if (status === "new") return "New";
  if (status === "pending") return "Pending";
  if (status === "submitted") return "Submitted";
  if (status === "review" || status === "reviewing" || status === "in_review") {
    return "In Review";
  }
  if (status === "contacted") return "Contacted";
  if (status === "interested") return "Interested";
  if (status === "applied") return "Applied";
  if (status === "missing_info") return "Missing Info";
  if (status === "signed_up" || status === "converted") return "Signed Up";
  if (status === "approved" || status === "active" || status === "accepted") {
    return "Approved";
  }

  return (
    status
      .split("_")
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ") || "New"
  );
}

function isCareerLinkRow(row: AnyRow) {
  const search = getProgramSourceText(row);

  return (
    search.includes("careerlink") ||
    search.includes("career link") ||
    search.includes("pa career") ||
    search.includes("pacareerlink")
  );
}

function isAmbassadorLeadRow(row: AnyRow) {
  const search = getProgramSourceText(row);

  return (
    search.includes("ambassador") ||
    search.includes("student hire") ||
    search.includes("community hire") ||
    search.includes("military hire") ||
    search.includes("veterans hire") ||
    search.includes("careerlink") ||
    search.includes("career link")
  );
}

function getAmbassadorLeadProgram(row: AnyRow) {
  const studentProgram = programDefinitions.find(
    (program) => program.key === "student-hire",
  );
  const communityProgram = programDefinitions.find(
    (program) => program.key === "community-hire",
  );
  const militaryProgram = programDefinitions.find(
    (program) => program.key === "veterans-hire",
  );

  if (studentProgram && rowMatchesProgram(row, studentProgram)) return "Student Hire";
  if (communityProgram && rowMatchesProgram(row, communityProgram)) return "Community Hire";
  if (militaryProgram && rowMatchesProgram(row, militaryProgram)) return "Military Hire";

  return "Ambassador Program";
}

function getLeadSource(row: AnyRow) {
  const explicitSource = getText(row, [
    "source",
    "lead_source",
    "referral_source",
    "partner_source",
    "utm_source",
    "campaign",
    "campaign_name",
  ]);
  const search = `${explicitSource} ${getProgramSourceText(row)}`.toLowerCase();

  if (isCareerLinkRow(row)) return "PA CareerLink";
  if (search.includes("facebook") || search.includes("meta")) return "Facebook";
  if (search.includes("instagram") || search.includes("insta")) return "Instagram";
  if (search.includes("tiktok")) return "TikTok";
  if (search.includes("twitter") || search.includes("x.com")) return "X";
  if (search.includes("referral")) return "Referral";
  if (search.includes("website") || search.includes("sitguru.com")) return "Website";

  return explicitSource || "Manual / Other";
}

function getLeadEmail(row: AnyRow) {
  return getText(row, ["email", "applicant_email", "lead_email", "contact_email"], "—");
}

function getLeadPhone(row: AnyRow) {
  return getText(row, ["phone", "phone_number", "mobile", "contact_phone"], "—");
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin programs query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Admin programs query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

async function getProgramData() {
  const [
    programApplicationsResult,
    programsResult,
    ambassadorProfilesResult,
    referralEventsResult,
    commissionLedgerResult,
    featuredPackLeadersResult,
    networkProgramsResult,
    networkParticipantsResult,
    networkReferralsResult,
    networkRewardsResult,
    partnerLeadsResult,
    partnerApplicationsResult,
    messagesResult,
    gurusResult,
    bookingsResult,
  ] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin
        .from("program_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "program_applications",
    ),
    safeAdminQuery(
      supabaseAdmin.from("programs").select("*").limit(1000),
      "programs",
    ),
    safeAdminQuery(
      supabaseAdmin.from("ambassador_profiles").select("*").limit(5000),
      "ambassador_profiles",
    ),
    safeAdminQuery(
      supabaseAdmin.from("referral_events").select("*").limit(5000),
      "referral_events",
    ),
    safeAdminQuery(
      supabaseAdmin.from("commission_ledger").select("*").limit(5000),
      "commission_ledger",
    ),
    safeAdminQuery(
      supabaseAdmin.from("featured_pack_leaders").select("*").limit(5000),
      "featured_pack_leaders",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_programs").select("*").limit(1000),
      "network_programs",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("network_program_participants")
        .select("*")
        .limit(5000),
      "network_program_participants",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_referrals").select("*").limit(5000),
      "network_referrals",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_rewards").select("*").limit(5000),
      "network_rewards",
    ),
    safeAdminQuery(
      supabaseAdmin.from("network_partner_leads").select("*").limit(5000),
      "network_partner_leads",
    ),
    safeAdminQuery(
      supabaseAdmin.from("partner_applications").select("*").limit(5000),
      "partner_applications",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "messages",
    ),
    safeAdminQuery(
      supabaseAdmin.from("gurus").select("*").limit(5000),
      "gurus",
    ),
    safeAdminQuery(
      supabaseAdmin.from("bookings").select("*").limit(5000),
      "bookings",
    ),
  ]);

  const programApplications = (
    (programApplicationsResult.data || []) as AnyRow[]
  ).filter(Boolean);
  const programs = ((programsResult.data || []) as AnyRow[]).filter(Boolean);
  const ambassadorProfiles = (
    (ambassadorProfilesResult.data || []) as AnyRow[]
  ).filter(Boolean);
  const referralEvents = ((referralEventsResult.data || []) as AnyRow[]).filter(
    Boolean,
  );
  const commissionLedger = (
    (commissionLedgerResult.data || []) as AnyRow[]
  ).filter(Boolean);
  const featuredPackLeaders = (
    (featuredPackLeadersResult.data || []) as AnyRow[]
  ).filter(Boolean);
  const networkPrograms = ((networkProgramsResult.data || []) as AnyRow[]).filter(
    Boolean,
  );
  const networkParticipants = (
    (networkParticipantsResult.data || []) as AnyRow[]
  ).filter(Boolean);
  const networkReferrals = ((networkReferralsResult.data || []) as AnyRow[]).filter(
    Boolean,
  );
  const networkRewards = ((networkRewardsResult.data || []) as AnyRow[]).filter(
    Boolean,
  );
  const partnerLeads = ((partnerLeadsResult.data || []) as AnyRow[]).filter(
    Boolean,
  );
  const partnerApplications = (
    (partnerApplicationsResult.data || []) as AnyRow[]
  ).filter(Boolean);
  const messages = ((messagesResult.data || []) as AnyRow[]).filter(Boolean);
  const gurus = ((gurusResult.data || []) as AnyRow[]).filter(Boolean);
  const bookings = ((bookingsResult.data || []) as AnyRow[]).filter(Boolean);

  const allProgramRows = [
    ...programApplications,
    ...programs,
    ...ambassadorProfiles,
    ...referralEvents,
    ...commissionLedger,
    ...featuredPackLeaders,
    ...networkPrograms,
    ...networkParticipants,
    ...networkReferrals,
    ...networkRewards,
    ...partnerLeads,
    ...partnerApplications,
    ...messages,
    ...gurus,
    ...bookings,
  ];

  const programStats = programDefinitions.map((program) => {
    const matchingApplications = rowsForProgram(programApplications, program);
    const matchingLegacyApplications = rowsForProgram(
      [...partnerApplications, ...partnerLeads],
      program,
    );
    const matchingAmbassadors = rowsForProgram(ambassadorProfiles, program);
    const matchingReferralEvents = rowsForProgram(referralEvents, program);
    const matchingCommissionLedger = rowsForProgram(commissionLedger, program);
    const matchingFeaturedPackLeaders = rowsForProgram(
      featuredPackLeaders,
      program,
    );
    const matchingParticipants = rowsForProgram(networkParticipants, program);
    const matchingReferrals = rowsForProgram(networkReferrals, program);
    const matchingRewards = rowsForProgram(networkRewards, program);
    const matchingMessages = rowsForProgram(messages, program);
    const matchingBookings = rowsForProgram(bookings, program);
    const matchingGurus = rowsForProgram(gurus, program);
    const matchingRows = rowsForProgram(allProgramRows, program);

    const applications = matchingApplications.length;
    const legacyApplications = matchingLegacyApplications.length;
    const totalApplicationSignals = applications + legacyApplications;

    const pendingApplications = matchingApplications.filter(isPendingStatus).length;
    const approvedApplications = matchingApplications.filter(isApprovedStatus).length;
    const onboardingApplications =
      matchingApplications.filter(isOnboardingStatus).length;
    const checkrApplications = matchingApplications.filter(isCheckrStatus).length;

    const approvedParticipants =
      approvedApplications ||
      matchingParticipants.filter(isApprovedStatus).length ||
      matchingGurus.filter(isApprovedStatus).length ||
      matchingAmbassadors.filter(isApprovedStatus).length;

    const onboarding =
      onboardingApplications ||
      matchingParticipants.filter(isOnboardingStatus).length;

    const backgroundChecks =
      checkrApplications ||
      matchingParticipants.filter(isCheckrStatus).length ||
      matchingGurus.filter(isCheckrStatus).length;

    const bookable =
      matchingParticipants.filter(isBookableStatus).length ||
      matchingGurus.filter(isBookableStatus).length;

    const completedBookings = matchingBookings.filter(
      isCompletedBookingStatus,
    ).length;

    const participantEarnings = sumRows(matchingBookings, [
      "guru_payout",
      "payout_amount",
      "provider_amount",
      "sitter_payout",
      "guru_amount",
    ]);

    const totalBookingValue = sumRows(matchingBookings, [
      "total_customer_paid",
      "total_amount",
      "booking_total",
      "amount",
      "price",
    ]);

    const rewardsPending = matchingRewards.filter(isPendingStatus);
    const rewardsPendingAmount = sumRows(rewardsPending, [
      "amount",
      "reward_amount",
      "payout_amount",
      "total",
    ]);

    const commissionPending = matchingCommissionLedger.filter(isPendingStatus);
    const commissionPendingAmount = sumRows(commissionPending, [
      "amount",
      "commission_amount",
      "reward_amount",
      "payout_amount",
      "total",
    ]);

    const totalCommissionCost = sumRows(matchingCommissionLedger, [
      "amount",
      "commission_amount",
      "reward_amount",
      "payout_amount",
      "total",
    ]);

    const conversionRate =
      applications > 0 ? (approvedParticipants / applications) * 100 : 0;

    const readinessScore = Math.round(
      Math.min(
        100,
        approvedParticipants * 18 +
          onboarding * 10 +
          backgroundChecks * 14 +
          bookable * 22 +
          completedBookings * 6 +
          matchingReferralEvents.length * 4 +
          matchingAmbassadors.length * 8,
      ),
    );

    return {
      ...program,
      rows: matchingRows.length,
      applications,
      legacyApplications,
      totalApplicationSignals,
      pendingApplications,
      approvedApplications,
      approvedParticipants,
      onboarding,
      backgroundChecks,
      bookable,
      referrals: matchingReferrals.length + matchingReferralEvents.length,
      referralEvents: matchingReferralEvents.length,
      ambassadors: matchingAmbassadors.length,
      featuredPackLeaders:
        matchingFeaturedPackLeaders.length ||
        matchingAmbassadors.filter(isFeaturedPackLeader).length,
      messages: matchingMessages.length,
      completedBookings,
      participantEarnings,
      totalBookingValue,
      rewardsPending: rewardsPending.length + commissionPending.length,
      rewardsPendingAmount: rewardsPendingAmount + commissionPendingAmount,
      totalCommissionCost,
      conversionRate,
      readinessScore,
      latestActivity: latestDateFromRows(matchingRows),
    };
  });

  const totals = {
    applications: programStats.reduce((sum, item) => sum + item.applications, 0),
    legacyApplications: programStats.reduce(
      (sum, item) => sum + item.legacyApplications,
      0,
    ),
    totalApplicationSignals: programStats.reduce(
      (sum, item) => sum + item.totalApplicationSignals,
      0,
    ),
    pendingApplications: programStats.reduce(
      (sum, item) => sum + item.pendingApplications,
      0,
    ),
    approvedApplications: programStats.reduce(
      (sum, item) => sum + item.approvedApplications,
      0,
    ),
    approvedParticipants: programStats.reduce(
      (sum, item) => sum + item.approvedParticipants,
      0,
    ),
    onboarding: programStats.reduce((sum, item) => sum + item.onboarding, 0),
    backgroundChecks: programStats.reduce(
      (sum, item) => sum + item.backgroundChecks,
      0,
    ),
    bookable: programStats.reduce((sum, item) => sum + item.bookable, 0),
    completedBookings: programStats.reduce(
      (sum, item) => sum + item.completedBookings,
      0,
    ),
    earnings: programStats.reduce(
      (sum, item) => sum + item.participantEarnings,
      0,
    ),
    bookingValue: programStats.reduce(
      (sum, item) => sum + item.totalBookingValue,
      0,
    ),
    messages: programStats.reduce((sum, item) => sum + item.messages, 0),
    rewardsPendingAmount: programStats.reduce(
      (sum, item) => sum + item.rewardsPendingAmount,
      0,
    ),
    totalCommissionCost: programStats.reduce(
      (sum, item) => sum + item.totalCommissionCost,
      0,
    ),
    referrals: programStats.reduce((sum, item) => sum + item.referrals, 0),
    ambassadors: programStats.reduce((sum, item) => sum + item.ambassadors, 0),
    featuredPackLeaders: programStats.reduce(
      (sum, item) => sum + item.featuredPackLeaders,
      0,
    ),
  };

  const ambassadorLeadRows = [
    ...programApplications,
    ...partnerApplications,
    ...partnerLeads,
    ...networkParticipants,
    ...ambassadorProfiles,
  ]
    .filter(isAmbassadorLeadRow)
    .sort((a, b) => {
      const dateA = new Date(getDate(a) || 0).getTime();
      const dateB = new Date(getDate(b) || 0).getTime();
      return dateB - dateA;
    });

  const careerLinkLeadRows = ambassadorLeadRows.filter(isCareerLinkRow);
  const studentAmbassadorRows = ambassadorLeadRows.filter(
    (row) => getAmbassadorLeadProgram(row) === "Student Hire",
  );
  const communityAmbassadorRows = ambassadorLeadRows.filter(
    (row) => getAmbassadorLeadProgram(row) === "Community Hire",
  );
  const militaryAmbassadorRows = ambassadorLeadRows.filter(
    (row) => getAmbassadorLeadProgram(row) === "Military Hire",
  );

  const ambassadorLeadStatusTotals = {
    new: ambassadorLeadRows.filter((row) =>
      ["new", "pending", "submitted", "applied"].includes(getStatus(row)),
    ).length,
    contacted: ambassadorLeadRows.filter((row) =>
      ["contacted", "interested", "review", "reviewing", "in_review"].includes(
        getStatus(row),
      ),
    ).length,
    signedUp: ambassadorLeadRows.filter((row) =>
      ["signed_up", "converted"].includes(getStatus(row)),
    ).length,
    approved: ambassadorLeadRows.filter(isApprovedStatus).length,
  };

  const recentAmbassadorLeads = ambassadorLeadRows.slice(0, 8).map((row) => ({
    name: getText(row, ["full_name", "display_name", "name", "applicant_name", "lead_name", "email"], "Ambassador Lead"),
    email: getLeadEmail(row),
    phone: getLeadPhone(row),
    program: getAmbassadorLeadProgram(row),
    source: getLeadSource(row),
    status: getReadableStatus(row),
    date: getDate(row),
  }));

  const careerLinkPipeline = {
    total: ambassadorLeadRows.length,
    careerLink: careerLinkLeadRows.length,
    student: studentAmbassadorRows.length,
    community: communityAmbassadorRows.length,
    military: militaryAmbassadorRows.length,
    statusTotals: ambassadorLeadStatusTotals,
    recentLeads: recentAmbassadorLeads,
    latestActivity: latestDateFromRows(ambassadorLeadRows),
  };

  return {
    programApplications,
    programs,
    ambassadorProfiles,
    referralEvents,
    commissionLedger,
    featuredPackLeaders,
    networkPrograms,
    networkParticipants,
    networkReferrals,
    networkRewards,
    partnerLeads,
    partnerApplications,
    messages,
    gurus,
    bookings,
    programStats,
    totals,
    careerLinkPipeline,
  };
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
      {children}
    </span>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-green-800">
        {title}
      </p>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-2 text-sm font-bold text-slate-600"
          >
            <CheckCircle2
              className="mt-0.5 shrink-0 text-green-700"
              size={15}
            />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {content}
    </div>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
        <p className="text-xs font-black text-green-800">
          {Math.max(0, Math.min(100, value))}%
        </p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-[#eef4ef]">
        <div
          className="h-full rounded-full bg-green-800"
          style={{ width: `${Math.max(3, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function ProgramCard({
  program,
}: {
  program: Awaited<ReturnType<typeof getProgramData>>["programStats"][number];
}) {
  const isCommunity = program.key === "community-hire";
  const isVeterans = program.key === "veterans-hire";
  const isAmbassador = program.key === "ambassador-program";

  return (
    <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-white">
            {program.icon}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
              {program.eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-black text-green-950">
              {program.title}
            </h2>
            <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-amber-700">
              {program.campaign}
            </p>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              {program.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Link
            href={program.applicationsHref}
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
          >
            Review Applicants →
          </Link>

          <Link
            href={program.href}
            className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
          >
            Program Ops →
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MiniMetric label="Applications" value={number(program.applications)} />
        <MiniMetric
          label="Pending"
          value={number(program.pendingApplications)}
        />
        <MiniMetric
          label={isAmbassador ? "Ambassadors" : "Onboarding"}
          value={number(isAmbassador ? program.ambassadors : program.onboarding)}
        />
        <MiniMetric
          label={isAmbassador ? "Referrals" : "Checkr / Background"}
          value={number(
            isAmbassador ? program.referrals : program.backgroundChecks,
          )}
        />
        <MiniMetric
          label={isAmbassador ? "Pack Leaders" : "Bookable"}
          value={number(
            isAmbassador ? program.featuredPackLeaders : program.bookable,
          )}
        />
      </div>

      <div className="mt-5">
        <ProgressBar
          label={isAmbassador ? "Growth readiness" : "Program readiness"}
          value={program.readinessScore}
        />
      </div>

      {isCommunity ? (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-800 shadow-sm">
              <ShieldCheck size={21} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">
                Community Hire review reminder
              </p>
              <p className="mt-1 text-sm font-bold leading-6 text-blue-950">
                Community Hire is a referral and readiness pathway, not
                full-time employment, part-time employment, or guaranteed job
                placement. Background check information should be reviewed
                fairly, consistently, and in relation to pet care
                responsibilities, home access, safety, trust, and customer
                needs. SitGuru follows EEOC guidance for role-related review.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {isVeterans ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-800 shadow-sm">
              <Medal size={21} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">
                Military Hire includes veterans, military families, and SkillBridge interest
              </p>
              <p className="mt-1 text-sm font-bold leading-6 text-amber-950">
                This program tracks Military Hire, veteran-connected applicants, and
                SkillBridge Interest List signals in one admin pathway.
                SkillBridge remains an interest-tracking pathway unless SitGuru
                later creates a formally approved training program.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {isAmbassador ? (
        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-green-800 shadow-sm">
              <Trophy size={21} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                Pack Leader recognition and commission tracking
              </p>
              <p className="mt-1 text-sm font-bold leading-6 text-green-950">
                Track Ambassadors by profession, referrals, commission costs,
                bonuses, completed bookings, and homepage Pack Leader
                eligibility. Ambassadors should only be publicly featured with
                their consent.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <InfoList title="Who it supports" items={program.audience} />
        <InfoList title="Partner sources" items={program.partners} />
        <InfoList title="Program goals" items={program.goals} />
        <InfoList title="Requirements" items={program.requirements} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge>{number(program.approvedParticipants)} approved</Badge>
        <Badge>{number(program.legacyApplications)} legacy signals</Badge>
        <Badge>{number(program.referrals)} referrals</Badge>
        <Badge>{number(program.completedBookings)} bookings</Badge>
        <Badge>{money(program.totalBookingValue)} booking value</Badge>
        <Badge>{money(program.rewardsPendingAmount)} pending rewards</Badge>
        <Badge>{money(program.totalCommissionCost)} commission cost</Badge>
        <Badge>{number(program.messages)} messages</Badge>
        <Badge>{formatDate(program.latestActivity)} latest activity</Badge>
      </div>
    </div>
  );
}

function PipelineMiniCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-green-950">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function AmbassadorLeadPipeline({
  pipeline,
}: {
  pipeline: Awaited<ReturnType<typeof getProgramData>>["careerLinkPipeline"];
}) {
  return (
    <section className="rounded-[30px] border border-green-200 bg-gradient-to-br from-green-50 via-white to-[#f9faf5] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-800 text-white shadow-sm">
            <HeartHandshake size={24} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
              PA CareerLink / Ambassador Leads
            </p>
            <h2 className="mt-1 text-2xl font-black text-green-950">
              Track Student, Community, and Military Ambassador applicants.
            </h2>
            <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
              Use this section to monitor applicant and referral signals from PA CareerLink,
              website forms, partner referrals, and ambassador outreach. Program order stays
              aligned to SitGuru operations: Student Hire, Community Hire, Military Hire.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`${adminRoutes.programApplications}?source=careerlink`}
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-green-900"
          >
            Review CareerLink Leads →
          </Link>

          <Link
            href={adminRoutes.ambassadorProgram}
            className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
          >
            Ambassador Ops
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <PipelineMiniCard
          label="Total Leads"
          value={number(pipeline.total)}
          detail="All ambassador and program lead signals"
        />
        <PipelineMiniCard
          label="PA CareerLink"
          value={number(pipeline.careerLink)}
          detail="Applicants tied to CareerLink sourcing"
        />
        <PipelineMiniCard
          label="Student Hire"
          value={number(pipeline.student)}
          detail="Student Ambassador and campus leads"
        />
        <PipelineMiniCard
          label="Community Hire"
          value={number(pipeline.community)}
          detail="Community Ambassador and workforce leads"
        />
        <PipelineMiniCard
          label="Military Hire"
          value={number(pipeline.military)}
          detail="Military Ambassador and veteran-connected leads"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PipelineMiniCard
          label="New / Submitted"
          value={number(pipeline.statusTotals.new)}
          detail="Needs first review or routing"
        />
        <PipelineMiniCard
          label="Contacted"
          value={number(pipeline.statusTotals.contacted)}
          detail="Follow-up or interest stage"
        />
        <PipelineMiniCard
          label="Signed Up"
          value={number(pipeline.statusTotals.signedUp)}
          detail="Converted into SitGuru signup"
        />
        <PipelineMiniCard
          label="Approved"
          value={number(pipeline.statusTotals.approved)}
          detail={`Latest activity: ${formatDate(pipeline.latestActivity)}`}
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-[26px] border border-[#e3ece5] bg-white">
        <div className="border-b border-[#edf3ee] px-4 py-3">
          <h3 className="text-base font-black text-slate-950">
            Recent Ambassador Leads
          </h3>
          <p className="text-sm font-semibold text-slate-500">
            Quick view of candidates to review, contact, or route into signup.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#edf3ee] bg-[#fbfcf9] text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {pipeline.recentLeads.length ? (
                pipeline.recentLeads.map((lead, index) => (
                  <tr
                    key={`${lead.name}-${lead.email}-${index}`}
                    className="border-b border-[#f1f5f2] last:border-0"
                  >
                    <td className="px-4 py-3 font-black text-slate-950">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-600">
                      {lead.program}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-600">
                      {lead.source}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-600">
                      <div>{lead.email}</div>
                      <div className="text-xs text-slate-400">{lead.phone}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-600">
                      {formatDate(lead.date)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center font-bold text-slate-500"
                  >
                    No Ambassador or PA CareerLink leads found yet. New rows will
                    appear here when application, partner lead, or ambassador
                    tables include matching program/source data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ProgramChart({
  title,
  subtitle,
  items,
  valueKey,
  valueFormatter = number,
}: {
  title: string;
  subtitle: string;
  items: Awaited<ReturnType<typeof getProgramData>>["programStats"];
  valueKey:
    | "applications"
    | "pendingApplications"
    | "approvedParticipants"
    | "bookable"
    | "participantEarnings"
    | "completedBookings"
    | "messages"
    | "backgroundChecks"
    | "referrals"
    | "ambassadors"
    | "totalCommissionCost"
    | "rewardsPendingAmount";
  valueFormatter?: (value: number) => string;
}) {
  const maxValue = Math.max(
    ...items.map((item) => Number(item[valueKey]) || 0),
    0,
  );

  return (
    <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const value = Number(item[valueKey]) || 0;
          const width = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <Link
              key={item.key}
              href={item.applicationsHref}
              className="block rounded-2xl border border-transparent p-2 transition hover:border-green-100 hover:bg-[#fbfcf9]"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {item.title}
                  </p>
                  <p className="truncate text-xs font-bold text-slate-500">
                    {item.campaign}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-black text-green-800">
                  {valueFormatter(value)}
                </p>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#eef4ef]">
                <div
                  className="h-full rounded-full bg-green-800"
                  style={{
                    width: `${Math.max(3, width)}%`,
                    backgroundColor:
                      index === 0
                        ? "#f59e0b"
                        : index === 1
                          ? "#166534"
                          : index === 2
                            ? "#0f766e"
                            : "#2563eb",
                  }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default async function AdminProgramsPage() {
  const data = await getProgramData();

  const overallConversion =
    data.totals.applications > 0
      ? (data.totals.approvedParticipants / data.totals.applications) * 100
      : 0;

  const netTrackedProgramValue =
    data.totals.bookingValue - data.totals.totalCommissionCost;

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <section className="flex flex-col justify-between gap-4 rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm lg:flex-row lg:items-end">
          <div>
            <Link
              href={adminRoutes.dashboard}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
            >
              <ArrowLeft size={17} />
              Back to Admin Dashboard
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 text-white">
                <BriefcaseBusiness size={26} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                  Admin / Operations / Growth Programs
                </p>

                <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                  SitGuru Growth Programs Command Center
                </h1>

                <p className="mt-1 max-w-5xl text-base font-semibold text-slate-600">
                  Track Student Hire, Community Hire, Military Hire, and
                  Ambassador Program applications, referrals, onboarding,
                  Checkr / background check readiness, Pack Leader recognition,
                  commission costs, and progress toward bookable Guru status.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={adminRoutes.programApplications}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              <UserCheck size={17} />
              Review Applications
            </Link>

            <Link
              href={adminRoutes.programsExport}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <Download size={17} />
              Export CSV
            </Link>

            <Link
              href={adminRoutes.partners}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <Handshake size={17} />
              Partners
            </Link>
          </div>
        </section>

        <section className="rounded-[30px] border border-green-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Join the Pack program structure
              </p>
              <h2 className="mt-1 text-2xl font-black text-green-950">
                Four public pathways feeding one growth and operations system
              </h2>
              <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                SitGuru programs are designed to help qualified applicants apply
                for flexible local pet care opportunities and to help trusted
                Ambassadors grow the SitGuru community. Approved Gurus provide
                services as independent contractors. Program participation does
                not guarantee approval, bookings, earnings, employment,
                commissions, benefits, placement, or full Guru status.
              </p>
            </div>

            <div className="grid shrink-0 gap-3 sm:grid-cols-2">
              <Badge>Earn with the Pack</Badge>
              <Badge>Work with the Pack</Badge>
              <Badge>Serve with the Pack</Badge>
              <Badge>Lead the Pack</Badge>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-800 shadow-sm">
                <ShieldCheck size={24} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">
                  Compliance and fair review reminder
                </p>
                <h2 className="mt-1 text-2xl font-black text-blue-950">
                  Keep program language accurate and review applicants fairly.
                </h2>
                <p className="mt-2 max-w-5xl text-sm font-bold leading-6 text-blue-950">
                  Community Hire applicants should be reviewed fairly,
                  consistently, and in relation to pet care responsibilities,
                  home access, safety, trust, and customer needs. Ambassador
                  commissions and bonuses should be calculated only under
                  approved SitGuru program terms. Public Pack Leader recognition
                  should require consent before displaying names, photos,
                  testimonials, or performance highlights.
                </p>
              </div>
            </div>

            <Link
              href={`${adminRoutes.programApplications}?program=community-hire`}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-blue-300 bg-white px-5 py-3 text-sm font-black shadow-sm transition hover:border-blue-400 hover:bg-blue-100"
              style={{
                color: "#172554",
                WebkitTextFillColor: "#172554",
              }}
            >
              Review Community Applicants →
            </Link>
          </div>
        </section>

        <AmbassadorLeadPipeline pipeline={data.careerLinkPipeline} />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<BriefcaseBusiness size={22} />}
            label="Programs"
            value={number(programDefinitions.length)}
            detail="Student, Community, Military, Ambassadors"
            href={adminRoutes.programs}
          />

          <StatCard
            icon={<UserCheck size={22} />}
            label="Applications"
            value={number(data.totals.applications)}
            detail={`${number(data.totals.pendingApplications)} pending review`}
            href={adminRoutes.programApplications}
          />

          <StatCard
            icon={<BadgeCheck size={22} />}
            label="Approved"
            value={number(data.totals.approvedParticipants)}
            detail={`${percent(overallConversion)} application conversion`}
          />

          <StatCard
            icon={<HeartHandshake size={22} />}
            label="Ambassadors"
            value={number(data.totals.ambassadors)}
            detail={`${number(data.totals.referrals)} referral signals tracked`}
          />

          <StatCard
            icon={<Sparkles size={22} />}
            label="Bookable"
            value={number(data.totals.bookable)}
            detail="Program participants ready for bookings"
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<CheckCircle2 size={22} />}
            label="Completed Bookings"
            value={number(data.totals.completedBookings)}
            detail="Bookings connected to program signals"
          />

          <StatCard
            icon={<Trophy size={22} />}
            label="Booking Value"
            value={money(data.totals.bookingValue)}
            detail={`${money(netTrackedProgramValue)} after tracked commissions`}
          />

          <StatCard
            icon={<Medal size={22} />}
            label="Commission Cost"
            value={money(data.totals.totalCommissionCost)}
            detail={`${money(data.totals.rewardsPendingAmount)} pending rewards`}
          />

          <StatCard
            icon={<MessageCircle size={22} />}
            label="Messages"
            value={number(data.totals.messages)}
            detail="Program-related message activity"
            href={adminRoutes.messages}
          />
        </section>

        <section className="grid gap-5">
          {data.programStats.map((program) => (
            <ProgramCard key={program.key} program={program} />
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <ProgramChart
            title="Applications by Program"
            subtitle="Which program is creating the most applicant activity."
            items={data.programStats}
            valueKey="applications"
          />

          <ProgramChart
            title="Pending Review"
            subtitle="Applicants who may need admin follow-up or next steps."
            items={data.programStats}
            valueKey="pendingApplications"
          />

          <ProgramChart
            title="Referrals by Program"
            subtitle="Which pathway is creating the most referral activity."
            items={data.programStats}
            valueKey="referrals"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <ProgramChart
            title="Background Checks by Program"
            subtitle="Which program is moving candidates through trust and safety."
            items={data.programStats}
            valueKey="backgroundChecks"
          />

          <ProgramChart
            title="Bookable Readiness"
            subtitle="Participants connected to bookable readiness signals."
            items={data.programStats}
            valueKey="bookable"
          />

          <ProgramChart
            title="Completed Bookings"
            subtitle="Completed bookings connected to program signals."
            items={data.programStats}
            valueKey="completedBookings"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <ProgramChart
            title="Participant Earnings"
            subtitle="Income opportunity impact created through each program."
            items={data.programStats}
            valueKey="participantEarnings"
            valueFormatter={money}
          />

          <ProgramChart
            title="Commission Costs"
            subtitle="Tracked referral, reward, and Ambassador commission cost."
            items={data.programStats}
            valueKey="totalCommissionCost"
            valueFormatter={money}
          />

          <ProgramChart
            title="Pending Rewards"
            subtitle="Rewards or commissions that may need finance review."
            items={data.programStats}
            valueKey="rewardsPendingAmount"
            valueFormatter={money}
          />
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-950">
              Growth Programs Admin Workflow
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Use this dashboard to see program health. Use Program
              Applications to action individual applicants and Ambassador
              submissions.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoList
              title="Application Review"
              items={[
                "New application",
                "Program routing",
                "Resume and document review",
                "Referral source review",
              ]}
            />

            <InfoList
              title="Applicant Contact"
              items={[
                "Contacted",
                "Missing information",
                "Partner follow-up",
                "Applicant notes",
              ]}
            />

            <InfoList
              title="Trust and Safety"
              items={[
                "Checkr invitation needed",
                "Checkr pending",
                "Review required",
                "Applicable notice process",
              ]}
            />

            <InfoList
              title="Growth and Finance"
              items={[
                "Referral code tracked",
                "Qualified booking verified",
                "Commission calculated",
                "Pack Leader eligibility reviewed",
              ]}
            />
          </div>
        </section>

        <section className="rounded-[30px] border border-green-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-950">
              Pack Leader Recognition Model
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Top-performing Ambassadors can be recognized publicly after
              consent is captured and approved.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MiniMetric
              label="Tracked Ambassadors"
              value={number(data.totals.ambassadors)}
            />
            <MiniMetric
              label="Referral Signals"
              value={number(data.totals.referrals)}
            />
            <MiniMetric
              label="Featured Pack Leaders"
              value={number(data.totals.featuredPackLeaders)}
            />
            <MiniMetric
              label="Pending Rewards"
              value={money(data.totals.rewardsPendingAmount)}
            />
            <MiniMetric
              label="Commission Cost"
              value={money(data.totals.totalCommissionCost)}
            />
          </div>

          <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
            Future homepage carousel controls should allow Admin to choose
            whether an Ambassador is featured, which photo is shown, whether
            first name or full name appears, what performance highlight is
            displayed, and how long the Ambassador remains featured.
          </p>
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this page safely reads <code>program_applications</code>,{" "}
          <code>programs</code>, <code>ambassador_profiles</code>,{" "}
          <code>referral_events</code>, <code>commission_ledger</code>,{" "}
          <code>featured_pack_leaders</code>, <code>network_programs</code>,{" "}
          <code>network_program_participants</code>,{" "}
          <code>network_referrals</code>, <code>network_rewards</code>,{" "}
          <code>network_partner_leads</code>, <code>partner_applications</code>,{" "}
          <code>messages</code>, <code>gurus</code>, and <code>bookings</code>{" "}
          when those tables exist. Ambassador and PA CareerLink lead cards safely reuse
          those same rows, so missing future lead tables are skipped safely and this
          page can be deployed before every future tracking table is created.
        </div>
      </div>
    </main>
  );
}