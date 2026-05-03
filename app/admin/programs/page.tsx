import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Download,
  GraduationCap,
  Handshake,
  Medal,
  MessageCircle,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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

type ProgramDefinition = {
  key: "military-hire" | "student-hire" | "community-hire";
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  icon: ReactNode;
  audience: string[];
  partners: string[];
  goals: string[];
  contractorRequirements: string[];
  keywords: string[];
};

const adminRoutes = {
  dashboard: "/admin",
  programs: "/admin/programs",
  programsExport: "/admin/programs/export",
  militaryHire: "/admin/programs/military-hire",
  studentHire: "/admin/programs/student-hire",
  communityHire: "/admin/programs/community-hire",
  partners: "/admin/partners",
  gurus: "/admin/gurus",
  messages: "/admin/messages",
};

const programDefinitions: ProgramDefinition[] = [
  {
    key: "military-hire",
    title: "Military Hire Program",
    eyebrow: "1099 marketplace opportunities for military-connected applicants",
    description:
      "Create flexible independent contractor income opportunities for veterans, eligible service members, National Guard, reservists, military spouses, and qualified dependents over 18 who want to become trusted bookable SitGuru pet care providers.",
    href: adminRoutes.militaryHire,
    icon: <Medal size={26} />,
    audience: [
      "Veterans",
      "Eligible service members",
      "National Guard",
      "Reservists",
      "Military spouses",
      "Qualified dependents 18+",
    ],
    partners: [
      "Military transition offices",
      "Veteran support organizations",
      "Military spouse employment networks",
      "Base community partners",
    ],
    goals: [
      "Increase qualified Guru applicants",
      "Support military-connected contractor income opportunities",
      "Track onboarding, background checks, and bookable readiness",
    ],
    contractorRequirements: [
      "1099 independent contractor model",
      "Identity verification",
      "Background check eligibility",
      "Trust and safety approval",
      "Profile readiness",
      "Bookable Guru status",
    ],
    keywords: [
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
    key: "student-hire",
    title: "Student Hire Program",
    eyebrow: "Flexible 1099 income opportunities for students",
    description:
      "Help students and recent graduates access flexible independent contractor income opportunities through pet care services while building responsibility, communication skills, trust, and local marketplace work experience.",
    href: adminRoutes.studentHire,
    icon: <GraduationCap size={26} />,
    audience: [
      "College students",
      "Trade school students",
      "Recent graduates",
      "Responsible student workers",
    ],
    partners: [
      "Universities",
      "Career centers",
      "Student organizations",
      "Local education partners",
    ],
    goals: [
      "Create flexible contractor work opportunities",
      "Grow local Guru coverage",
      "Track student onboarding, trust checks, and retention",
    ],
    contractorRequirements: [
      "1099 independent contractor model",
      "Age and eligibility review",
      "Background check eligibility",
      "Training completion",
      "Profile readiness",
      "Bookable Guru status",
    ],
    keywords: [
      "student",
      "college",
      "university",
      "graduate",
      "campus",
      "career center",
      "intern",
      "school",
    ],
  },
  {
    key: "community-hire",
    title: "Community Hire Program",
    eyebrow: "1099 income pathways through workforce partnerships",
    description:
      "Coordinate workforce partnerships with city, state, federal, nonprofit, and community employment programs so qualified people who need work can apply, complete SitGuru onboarding, pass trust and safety requirements, and access flexible pet care income opportunities as independent contractors.",
    href: adminRoutes.communityHire,
    icon: <Building2 size={26} />,
    audience: [
      "People needing work",
      "Workforce program participants",
      "Job training participants",
      "Community re-entry participants",
      "Local nonprofit referrals",
    ],
    partners: [
      "City workforce programs",
      "State employment programs",
      "Federal workforce programs",
      "Nonprofit workforce partners",
      "Community training organizations",
    ],
    goals: [
      "Support qualified workers facing employment barriers",
      "Track partner source, eligibility, and readiness",
      "Convert qualified participants into bookable Gurus",
    ],
    contractorRequirements: [
      "1099 independent contractor model",
      "Program source tracking",
      "Identity verification",
      "Background check eligibility",
      "Trust and safety approval",
      "Bookable Guru status",
    ],
    keywords: [
      "community",
      "city",
      "state",
      "federal",
      "workforce",
      "employment",
      "nonprofit",
      "job training",
      "re-entry",
      "work program",
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
    "pending",
  ).toLowerCase();
}

function isActiveStatus(row: AnyRow) {
  const status = getStatus(row);

  return (
    status === "active" ||
    status === "approved" ||
    status === "accepted" ||
    status === "live" ||
    status === "enabled" ||
    status === "bookable" ||
    status === "complete" ||
    status === "completed"
  );
}

function isPendingStatus(row: AnyRow) {
  const status = getStatus(row);

  return (
    status === "new" ||
    status === "pending" ||
    status === "submitted" ||
    status === "review" ||
    status === "in_review" ||
    status === "contacted" ||
    status === "interested" ||
    status === "applied"
  );
}

function isTrainingStatus(row: AnyRow) {
  const status = getStatus(row);
  const text = JSON.stringify(row).toLowerCase();

  return (
    status.includes("training") ||
    text.includes("training_started") ||
    text.includes("training started") ||
    text.includes("training")
  );
}

function isBackgroundCheckStatus(row: AnyRow) {
  const text = JSON.stringify(row).toLowerCase();
  const status = getStatus(row);

  return (
    status.includes("background") ||
    status.includes("checkr") ||
    text.includes("background_check") ||
    text.includes("background check") ||
    text.includes("checkr")
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

function getProgramSourceText(row: AnyRow) {
  return [
    getText(row, [
      "program_key",
      "program_slug",
      "program_type",
      "program_name",
      "program",
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
  const search = getProgramSourceText(row);

  return program.keywords.some((keyword) => search.includes(keyword));
}

function rowsForProgram(rows: AnyRow[], program: ProgramDefinition) {
  return rows.filter((row) => rowMatchesProgram(row, program));
}

function sumRows(rows: AnyRow[], keys: string[]) {
  return rows.reduce((sum, row) => sum + getAmount(row, keys), 0);
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
      supabaseAdmin
        .from("network_partner_leads")
        .select("*")
        .limit(5000),
      "network_partner_leads",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("partner_applications")
        .select("*")
        .limit(5000),
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

  const programs = ((programsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkPrograms = ((networkProgramsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkParticipants = ((networkParticipantsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkReferrals = ((networkReferralsResult.data || []) as AnyRow[]).filter(Boolean);
  const networkRewards = ((networkRewardsResult.data || []) as AnyRow[]).filter(Boolean);
  const partnerLeads = ((partnerLeadsResult.data || []) as AnyRow[]).filter(Boolean);
  const partnerApplications = ((partnerApplicationsResult.data || []) as AnyRow[]).filter(Boolean);
  const messages = ((messagesResult.data || []) as AnyRow[]).filter(Boolean);
  const gurus = ((gurusResult.data || []) as AnyRow[]).filter(Boolean);
  const bookings = ((bookingsResult.data || []) as AnyRow[]).filter(Boolean);

  const allProgramRows = [
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
    const matchingRows = rowsForProgram(allProgramRows, program);
    const matchingParticipants = rowsForProgram(networkParticipants, program);
    const matchingApplications = rowsForProgram(
      [...partnerApplications, ...partnerLeads, ...gurus],
      program,
    );
    const matchingReferrals = rowsForProgram(networkReferrals, program);
    const matchingRewards = rowsForProgram(networkRewards, program);
    const matchingMessages = rowsForProgram(messages, program);
    const matchingBookings = rowsForProgram(bookings, program);
    const matchingGurus = rowsForProgram(gurus, program);

    const applications = matchingApplications.length;
    const approvedParticipants =
      matchingParticipants.filter(isActiveStatus).length ||
      matchingGurus.filter(isActiveStatus).length;
    const pendingApplications = matchingApplications.filter(isPendingStatus).length;
    const training = matchingParticipants.filter(isTrainingStatus).length;
    const backgroundChecks =
      matchingParticipants.filter(isBackgroundCheckStatus).length ||
      matchingGurus.filter(isBackgroundCheckStatus).length;
    const bookable =
      matchingParticipants.filter(isBookableStatus).length ||
      matchingGurus.filter(isBookableStatus).length;
    const completedBookings = matchingBookings.filter(isCompletedBookingStatus).length;

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
          training * 12 +
          backgroundChecks * 16 +
          bookable * 26 +
          completedBookings * 8,
      ),
    );

    const latestActivityDate = matchingRows
      .map((row) => getDate(row))
      .filter(Boolean)
      .map((value) => new Date(value as string))
      .filter((value) => !Number.isNaN(value.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      ...program,
      rows: matchingRows.length,
      applications,
      pendingApplications,
      approvedParticipants,
      training,
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
      latestActivity: latestActivityDate?.toISOString() || null,
    };
  });

  const totals = {
    applications: programStats.reduce((sum, item) => sum + item.applications, 0),
    approvedParticipants: programStats.reduce(
      (sum, item) => sum + item.approvedParticipants,
      0,
    ),
    pendingApplications: programStats.reduce(
      (sum, item) => sum + item.pendingApplications,
      0,
    ),
    training: programStats.reduce((sum, item) => sum + item.training, 0),
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

function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
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
  return (
    <Link
      href={program.href}
      className="group block rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
    >
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

        <span className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-900 transition group-hover:bg-green-800 group-hover:text-white">
          Open Program →
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniMetric label="Applications" value={number(program.applications)} />
        <MiniMetric
          label="Approved"
          value={number(program.approvedParticipants)}
        />
        <MiniMetric label="Bookable" value={number(program.bookable)} />
        <MiniMetric
          label="Earnings"
          value={money(program.participantEarnings)}
        />
      </div>

      <div className="mt-5">
        <ProgressBar label="1099 marketplace readiness" value={program.readinessScore} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <InfoList title="Who it supports" items={program.audience} />
        <InfoList title="Partner sources" items={program.partners} />
        <InfoList title="Program goals" items={program.goals} />
        <InfoList title="1099 requirements" items={program.contractorRequirements} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge>{number(program.pendingApplications)} pending applications</Badge>
        <Badge>{number(program.training)} in training</Badge>
        <Badge>{number(program.backgroundChecks)} background checks</Badge>
        <Badge>{number(program.completedBookings)} bookings</Badge>
        <Badge>{number(program.messages)} messages</Badge>
        <Badge>{formatDate(program.latestActivity)} latest activity</Badge>
      </div>
    </Link>
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
          <div key={item} className="flex items-start gap-2 text-sm font-bold text-slate-600">
            <CheckCircle2 className="mt-0.5 shrink-0 text-green-700" size={15} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
      {children}
    </span>
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
    | "approvedParticipants"
    | "bookable"
    | "participantEarnings"
    | "completedBookings"
    | "messages"
    | "backgroundChecks";
  valueFormatter?: (value: number) => string;
}) {
  const maxValue = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 0);

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
              href={item.href}
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
                      index === 0 ? "#166534" : index === 1 ? "#16a34a" : "#0f766e",
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
                  SitGuru 1099 Programs
                </h1>

                <p className="mt-1 max-w-5xl text-base font-semibold text-slate-600">
                  Manage flexible independent contractor marketplace programs
                  that help qualified people access pet care income opportunities
                  after onboarding, eligibility review, background checks, trust
                  and safety approval, and bookable Guru readiness.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
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

            <Link
              href={adminRoutes.gurus}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              <UsersRound size={18} />
              Gurus
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
                1099 independent contractor marketplace opportunities
              </h2>
              <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                SitGuru programs are designed to help qualified participants
                access flexible contractor income opportunities, similar to
                marketplace models used by rideshare and delivery platforms.
                Program participation does not guarantee bookings or employment.
                Participants must meet SitGuru onboarding, eligibility,
                background check, trust, safety, service quality, and marketplace
                readiness requirements before becoming bookable Gurus.
              </p>
            </div>

            <div className="grid shrink-0 gap-3 sm:grid-cols-2">
              <Badge>1099 contractor model</Badge>
              <Badge>Background checks required</Badge>
              <Badge>Trust and safety approval</Badge>
              <Badge>No guaranteed bookings</Badge>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<BriefcaseBusiness size={22} />}
            label="Active Programs"
            value={number(programDefinitions.length)}
            detail="Military, Student, Community"
            href={adminRoutes.programs}
          />

          <StatCard
            icon={<UserCheck size={22} />}
            label="Applications"
            value={number(data.totals.applications)}
            detail={`${number(data.totals.pendingApplications)} pending review`}
          />

          <StatCard
            icon={<BadgeCheck size={22} />}
            label="Approved"
            value={number(data.totals.approvedParticipants)}
            detail={`${percent(overallConversion)} application conversion`}
          />

          <StatCard
            icon={<ShieldCheck size={22} />}
            label="Background Checks"
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
            icon={<TrendingUp size={22} />}
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
            icon={<MousePointerClick size={22} />}
            label="Rows Loaded"
            value={number(
              data.programs.length +
                data.networkPrograms.length +
                data.networkParticipants.length +
                data.networkReferrals.length +
                data.networkRewards.length +
                data.partnerLeads.length +
                data.partnerApplications.length,
            )}
            detail="Supabase program and network rows"
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
            subtitle="Which 1099 program is creating the most candidate activity."
            items={data.programStats}
            valueKey="applications"
          />

          <ProgramChart
            title="Background Checks by Program"
            subtitle="Which program is moving candidates through trust and safety."
            items={data.programStats}
            valueKey="backgroundChecks"
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
              Program KPI Framework
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              These are the operational measurements SitGuru should use to know
              whether programs are creating qualified 1099 contractors, bookable
              supply, completed bookings, participant earnings, and safe service
              quality.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoList
              title="Contractor Eligibility"
              items={[
                "1099 eligibility",
                "Age and identity verification",
                "Program source",
                "Application status",
              ]}
            />
            <InfoList
              title="Trust and Safety"
              items={[
                "Background check started",
                "Background check completed",
                "Safety approval",
                "Profile verification",
              ]}
            />
            <InfoList
              title="Marketplace Readiness"
              items={[
                "Training started",
                "Training completed",
                "Profile readiness",
                "Bookable Guru status",
              ]}
            />
            <InfoList
              title="Business Outcomes"
              items={[
                "First booking completed",
                "Participant earnings",
                "Ratings and quality",
                "Retention",
              ]}
            />
          </div>
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this page safely reads `programs`, `network_programs`,
          `network_program_participants`, `network_referrals`,
          `network_rewards`, `network_partner_leads`, `partner_applications`,
          `messages`, `gurus`, and `bookings` when those tables exist. The page
          classifies rows into Military Hire, Student Hire, and Community Hire
          using program names, topics, campaigns, sources, notes, and message
          content while clearly framing program work as flexible 1099
          independent contractor marketplace opportunities.
        </div>
      </div>
    </main>
  );
}