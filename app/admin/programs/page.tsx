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
  | "military-hire"
  | "skillbridge-interest";

type ProgramDefinition = {
  key: ProgramKey;
  title: string;
  shortTitle: string;
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
  militaryHire: "/admin/programs/military-hire",
  skillbridgeInterest: "/admin/programs/skillbridge-interest",
  partners: "/admin/partners",
  gurus: "/admin/gurus",
  messages: "/admin/messages",
};

const programDefinitions: ProgramDefinition[] = [
  {
    key: "student-hire",
    title: "Student Hire Program",
    shortTitle: "Student Hire",
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
    ],
    goals: [
      "Increase student Guru applicants",
      "Create flexible earning opportunities around school",
      "Track school, availability, services, resume, and onboarding readiness",
      "Encourage students to share Student Hire with friends",
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
    ],
  },
  {
    key: "community-hire",
    title: "Community Hire Program",
    shortTitle: "Community Hire",
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
    ],
  },
  {
    key: "military-hire",
    title: "Military Hire Program",
    shortTitle: "Military Hire",
    eyebrow: "Military-connected pathway",
    description:
      "A supported pathway for veterans, transitioning service members, eligible service members, National Guard, reservists, military spouses, and qualified military-connected applicants over 18 who want flexible pet care opportunities.",
    href: adminRoutes.militaryHire,
    applicationsHref: `${adminRoutes.programApplications}?program=military-hire`,
    icon: <Medal size={26} />,
    audience: [
      "Veterans",
      "Transitioning service members",
      "Eligible service members",
      "National Guard and reservists",
      "Military spouses",
      "Qualified dependents over 18",
      "Military-connected applicants ready to work, learn, and grow",
    ],
    partners: [
      "Military transition offices",
      "Veteran support organizations",
      "Military spouse support networks",
      "Base community partners",
      "Guard and reserve networks",
    ],
    goals: [
      "Increase qualified military-connected Guru applicants",
      "Track transferable experience and supporting documents",
      "Support onboarding, training, trust, and background check readiness",
      "Move strong applicants toward full Guru status",
    ],
    requirements: [
      "Independent contractor marketplace model",
      "Applicant review",
      "Resume and optional supporting documents",
      "Onboarding completion",
      "Checkr background check when required",
      "Profile readiness",
      "Bookable Guru status when approved",
    ],
    keywords: [
      "military-hire",
      "military hire",
      "military",
      "veteran",
      "veterans",
      "service member",
      "servicemember",
      "spouse",
      "dependent",
      "guard",
      "reservist",
      "transition",
    ],
  },
  {
    key: "skillbridge-interest",
    title: "SkillBridge Interest List",
    shortTitle: "SkillBridge",
    eyebrow: "Future transition pathway",
    description:
      "An interest list for active-duty transitioning service members interested in future SitGuru training pathways around pet care operations, trust and safety, customer experience, local services, and post-transition opportunities.",
    href: adminRoutes.skillbridgeInterest,
    applicationsHref: `${adminRoutes.programApplications}?program=skillbridge-interest`,
    icon: <ShieldCheck size={26} />,
    audience: [
      "Active-duty transitioning service members",
      "Service members exploring civilian pet care operations",
      "Applicants interested in customer trust and safety",
      "Applicants interested in local services and operations",
      "Transitioning service members with command approval when applicable",
      "People planning post-transition flexible opportunities",
    ],
    partners: [
      "Transition assistance programs",
      "Military education offices",
      "SkillBridge providers",
      "Veteran transition partners",
      "Local workforce partners",
    ],
    goals: [
      "Track interest in a future SkillBridge-style pathway",
      "Collect transition timelines and transferable experience",
      "Evaluate future training and provider partnership options",
      "Route interested applicants into future SitGuru pathways",
    ],
    requirements: [
      "Interest list only",
      "No guaranteed SkillBridge participation",
      "No guaranteed placement or bookings",
      "Transition timeline review",
      "Supporting document review when provided",
      "Future pathway evaluation",
    ],
    keywords: [
      "skillbridge-interest",
      "skillbridge interest",
      "skillbridge",
      "transition",
      "transitioning",
      "active duty",
      "active-duty",
      "military education",
      "training pathway",
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
  const exactProgram = getText(row, [
    "program",
    "program_key",
    "program_slug",
    "program_type",
  ])
    .toLowerCase()
    .replace(/\s+/g, "-");

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
      matchingGurus.filter(isApprovedStatus).length;

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

    const conversionRate =
      applications > 0 ? (approvedParticipants / applications) * 100 : 0;

    const readinessScore = Math.round(
      Math.min(
        100,
        approvedParticipants * 22 +
          onboarding * 12 +
          backgroundChecks * 16 +
          bookable * 26 +
          completedBookings * 8,
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
      referrals: matchingReferrals.length,
      messages: matchingMessages.length,
      completedBookings,
      participantEarnings,
      totalBookingValue,
      rewardsPending: rewardsPending.length,
      rewardsPendingAmount,
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
  };

  return {
    programApplications,
    programs,
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
          label="Onboarding"
          value={number(program.onboarding)}
        />
        <MiniMetric
          label="Checkr / Background"
          value={number(program.backgroundChecks)}
        />
        <MiniMetric label="Bookable" value={number(program.bookable)} />
      </div>

      <div className="mt-5">
        <ProgressBar
          label="Program readiness"
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

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <InfoList title="Who it supports" items={program.audience} />
        <InfoList title="Partner sources" items={program.partners} />
        <InfoList title="Program goals" items={program.goals} />
        <InfoList title="Requirements" items={program.requirements} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge>{number(program.approvedParticipants)} approved</Badge>
        <Badge>{number(program.legacyApplications)} legacy signals</Badge>
        <Badge>{number(program.completedBookings)} bookings</Badge>
        <Badge>{money(program.participantEarnings)} earnings</Badge>
        <Badge>{number(program.messages)} messages</Badge>
        <Badge>{formatDate(program.latestActivity)} latest activity</Badge>
      </div>
    </div>
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
    | "backgroundChecks";
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
                    {item.eyebrow}
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
                  Admin / Operations / Programs
                </p>

                <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                  SitGuru Program Operations
                </h1>

                <p className="mt-1 max-w-5xl text-base font-semibold text-slate-600">
                  Track Student Hire, Community Hire, Military Hire, and
                  SkillBridge Interest applications, onboarding, Checkr /
                  background check readiness, partner sources, and progress
                  toward bookable Guru status.
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
                Program Work Model
              </p>
              <h2 className="mt-1 text-2xl font-black text-green-950">
                Supported pathways into independent-contractor pet care
                opportunities
              </h2>
              <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                SitGuru programs are designed to help qualified applicants apply
                for flexible local pet care opportunities. Approved Gurus
                provide services as independent contractors. Program
                participation does not guarantee approval, bookings, earnings,
                employment, commissions, benefits, placement, or full Guru
                status.
              </p>
            </div>

            <div className="grid shrink-0 gap-3 sm:grid-cols-2">
              <Badge>Student → Community → Military → SkillBridge</Badge>
              <Badge>Admin applicant tracking</Badge>
              <Badge>Checkr readiness</Badge>
              <Badge>No guaranteed employment</Badge>
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
                  Community Hire fair review
                </p>
                <h2 className="mt-1 text-2xl font-black text-blue-950">
                  SitGuru follows EEOC guidance for background check review.
                </h2>
                <p className="mt-2 max-w-5xl text-sm font-bold leading-6 text-blue-950">
                  For Community Hire applicants, background check information
                  should be reviewed fairly, consistently, and in relation to
                  pet care responsibilities, home access, safety, trust, and
                  customer needs. Background check information is reviewed in
                  context and does not automatically disqualify every applicant.
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<BriefcaseBusiness size={22} />}
            label="Programs"
            value={number(programDefinitions.length)}
            detail="Student, Community, Military, SkillBridge"
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
            icon={<ShieldCheck size={22} />}
            label="Checkr / Background"
            value={number(data.totals.backgroundChecks)}
            detail="Trust and safety readiness signal"
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
            label="Participant Earnings"
            value={money(data.totals.earnings)}
            detail={`${money(data.totals.bookingValue)} booking value tracked`}
          />

          <StatCard
            icon={<MessageCircle size={22} />}
            label="Messages"
            value={number(data.totals.messages)}
            detail="Program-related message activity"
            href={adminRoutes.messages}
          />

          <StatCard
            icon={<UsersRound size={22} />}
            label="Gurus"
            value={number(data.gurus.length)}
            detail="Total Guru rows loaded"
            href={adminRoutes.gurus}
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
            title="Background Checks by Program"
            subtitle="Which program is moving candidates through trust and safety."
            items={data.programStats}
            valueKey="backgroundChecks"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
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

          <ProgramChart
            title="Participant Earnings"
            subtitle="Income opportunity impact created through each program."
            items={data.programStats}
            valueKey="participantEarnings"
            valueFormatter={money}
          />
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-950">
              Program Admin Workflow
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Use this dashboard to see program health. Use Program
              Applications to action individual applicants.
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
              title="Growth Path"
              items={[
                "Onboarding started",
                "Profile readiness",
                "Approved",
                "Full Guru status tracking",
              ]}
            />
          </div>
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this page safely reads <code>program_applications</code>,{" "}
          <code>programs</code>, <code>network_programs</code>,{" "}
          <code>network_program_participants</code>,{" "}
          <code>network_referrals</code>, <code>network_rewards</code>,{" "}
          <code>network_partner_leads</code>,{" "}
          <code>partner_applications</code>, <code>messages</code>,{" "}
          <code>gurus</code>, and <code>bookings</code> when those tables exist.
          The main applicant source is now <code>program_applications</code>.
        </div>
      </div>
    </main>
  );
}