import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type AcademyProgressRecord = {
  key: string;
  name: string;
  email: string;
  role: string;
  academy: string;
  status: string;
  progress: number;
  completedAt: string | null;
  updatedAt: string | null;
  assignedAt: string | null;
  source: string;
};

const adminRoutes = {
  dashboard: "/admin",
  hr: "/admin/hr",
  university: "/admin/ambassador-training",
  assignments: "/admin/university-assignments",
  gurus: "/admin/gurus",
  ambassadors: "/admin/ambassadors",
  petParents: "/admin/pet-parents",
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  if (typeof value === "number") return value === 1;

  return false;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace("%", "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
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

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getDate(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return null;
}

function getDisplayName(row: AnyRow) {
  const firstName = getText(row, ["first_name", "firstName"]);
  const lastName = getText(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return getText(
    row,
    [
      "full_name",
      "display_name",
      "name",
      "user_name",
      "student_name",
      "participant_name",
      "guru_name",
      "ambassador_name",
      "pet_parent_name",
      "email",
    ],
    "Unknown User",
  );
}

function getEmail(row: AnyRow) {
  return getText(
    row,
    [
      "email",
      "user_email",
      "student_email",
      "participant_email",
      "guru_email",
      "ambassador_email",
      "pet_parent_email",
      "profile_email",
    ],
    "—",
  );
}

function getAcademy(row: AnyRow) {
  return getText(
    row,
    [
      "academy_name",
      "academy",
      "training_name",
      "course_name",
      "program_name",
      "module_name",
      "assignment_name",
      "title",
    ],
    "SitGuru Academy",
  );
}

function getRole(row: AnyRow) {
  const role = getText(
    row,
    [
      "role",
      "user_role",
      "account_type",
      "academy_role",
      "participant_role",
      "type",
    ],
    "",
  ).toLowerCase();

  const academy = getAcademy(row).toLowerCase();

  if (role.includes("guru") || academy.includes("guru")) return "Guru";
  if (role.includes("ambassador") || academy.includes("ambassador")) {
    return "Ambassador";
  }
  if (
    role.includes("pet_parent") ||
    role.includes("pet parent") ||
    role.includes("customer") ||
    academy.includes("pet parent")
  ) {
    return "Pet Parent";
  }

  return role
    ? role
        .split("_")
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" ")
    : "User";
}

function getRawStatus(row: AnyRow) {
  return getText(
    row,
    [
      "status",
      "progress_status",
      "completion_status",
      "academy_status",
      "training_status",
      "assignment_status",
    ],
    "",
  ).toLowerCase();
}

function getProgress(row: AnyRow) {
  const explicitProgress = asNumber(
    row.completion_percentage ??
      row.progress_percentage ??
      row.percent_complete ??
      row.completion_percent ??
      row.percentage ??
      row.progress,
  );

  if (explicitProgress > 0) {
    return Math.min(100, Math.max(0, Math.round(explicitProgress)));
  }

  const completedSteps = asNumber(
    row.completed_steps ?? row.steps_completed ?? row.completed_count,
  );
  const totalSteps = asNumber(row.total_steps ?? row.steps_total ?? row.step_count);

  if (totalSteps > 0) {
    return Math.min(
      100,
      Math.max(0, Math.round((completedSteps / totalSteps) * 100)),
    );
  }

  if (
    asBoolean(row.completed) ||
    asBoolean(row.is_completed) ||
    asBoolean(row.academy_completed)
  ) {
    return 100;
  }

  const status = getRawStatus(row);

  if (
    status === "complete" ||
    status === "completed" ||
    status === "approved" ||
    status === "certified"
  ) {
    return 100;
  }

  if (
    status === "in_progress" ||
    status === "in progress" ||
    status === "started" ||
    status === "active"
  ) {
    return 50;
  }

  return 0;
}

function getReadableStatus(row: AnyRow, progress: number) {
  const status = getRawStatus(row);

  if (progress >= 100) return "Completed";

  if (
    status === "not_started" ||
    status === "not started" ||
    status === "assigned" ||
    status === "pending"
  ) {
    return "Not Started";
  }

  if (
    status === "in_progress" ||
    status === "in progress" ||
    status === "started" ||
    status === "active"
  ) {
    return "In Progress";
  }

  if (progress > 0 && progress < 100) return "In Progress";

  return status
    ? status
        .split("_")
        .filter(Boolean)
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" ")
    : "Not Started";
}

function getCompletedAt(row: AnyRow) {
  return getDate(row, [
    "completed_at",
    "completion_date",
    "academy_completed_at",
    "training_completed_at",
    "certified_at",
  ]);
}

function getUpdatedAt(row: AnyRow) {
  return getDate(row, [
    "updated_at",
    "last_activity_at",
    "last_progress_at",
    "last_completed_at",
    "modified_at",
    "created_at",
  ]);
}

function getAssignedAt(row: AnyRow) {
  return getDate(row, ["assigned_at", "created_at", "started_at"]);
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`University progress query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`University progress query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

function withSourceTable(row: AnyRow, source: string) {
  return {
    ...row,
    __source_table: source,
  };
}

function normalizeProgressRow(row: AnyRow): AcademyProgressRecord {
  const progress = getProgress(row);
  const academy = getAcademy(row);
  const email = getEmail(row);
  const name = getDisplayName(row);
  const role = getRole(row);
  const userId = getText(row, [
    "user_id",
    "profile_id",
    "student_id",
    "participant_id",
    "guru_id",
    "ambassador_id",
    "pet_parent_id",
    "id",
  ]);
  const source = getText(row, ["__source_table"], "unknown");

  return {
    key: `${userId || email || name}:${academy}`.toLowerCase(),
    name,
    email,
    role,
    academy,
    status: getReadableStatus(row, progress),
    progress,
    completedAt: getCompletedAt(row),
    updatedAt: getUpdatedAt(row),
    assignedAt: getAssignedAt(row),
    source,
  };
}

function mergeProgressRecords(rows: AnyRow[]) {
  const map = new Map<string, AcademyProgressRecord>();

  for (const row of rows) {
    const record = normalizeProgressRow(row);
    const existing = map.get(record.key);

    if (!existing) {
      map.set(record.key, record);
      continue;
    }

    const bestProgress = Math.max(existing.progress, record.progress);
    const completedAt = existing.completedAt || record.completedAt;
    const updatedAt =
      [existing.updatedAt, record.updatedAt]
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(b || 0).getTime() - new Date(a || 0).getTime(),
        )[0] || null;

    map.set(record.key, {
      ...existing,
      name: existing.name !== "Unknown User" ? existing.name : record.name,
      email: existing.email !== "—" ? existing.email : record.email,
      role: existing.role !== "User" ? existing.role : record.role,
      academy:
        existing.academy !== "SitGuru Academy" ? existing.academy : record.academy,
      progress: bestProgress,
      status:
        bestProgress >= 100
          ? "Completed"
          : bestProgress > 0
            ? "In Progress"
            : existing.status || record.status,
      completedAt,
      updatedAt,
      assignedAt: existing.assignedAt || record.assignedAt,
      source: `${existing.source}, ${record.source}`,
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress;

    const dateA = new Date(a.updatedAt || a.assignedAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.assignedAt || 0).getTime();

    return dateB - dateA;
  });
}

async function getUniversityProgressData() {
  const [
    universityAssignmentsResult,
    academyAssignmentsResult,
    userAcademyAssignmentsResult,
    trainingAssignmentsResult,
    universityProgressResult,
    academyProgressResult,
    trainingProgressResult,
    userTrainingProgressResult,
  ] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin
        .from("university_assignments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      "university_assignments",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("academy_assignments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      "academy_assignments",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("user_academy_assignments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      "user_academy_assignments",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("training_assignments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000),
      "training_assignments",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("university_progress")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(2000),
      "university_progress",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("academy_progress")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(2000),
      "academy_progress",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("training_progress")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(2000),
      "training_progress",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("user_training_progress")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(2000),
      "user_training_progress",
    ),
  ]);

  const allRows = [
    ...(((universityAssignmentsResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "university_assignments"),
    )),
    ...(((academyAssignmentsResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "academy_assignments"),
    )),
    ...(((userAcademyAssignmentsResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "user_academy_assignments"),
    )),
    ...(((trainingAssignmentsResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "training_assignments"),
    )),
    ...(((universityProgressResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "university_progress"),
    )),
    ...(((academyProgressResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "academy_progress"),
    )),
    ...(((trainingProgressResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "training_progress"),
    )),
    ...(((userTrainingProgressResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "user_training_progress"),
    )),
  ];

  const records = mergeProgressRecords(allRows);

  const completedRecords = records.filter((record) => record.progress >= 100);
  const inProgressRecords = records.filter(
    (record) => record.progress > 0 && record.progress < 100,
  );
  const notStartedRecords = records.filter((record) => record.progress === 0);

  const guruRecords = records.filter((record) => record.role === "Guru");
  const ambassadorRecords = records.filter(
    (record) => record.role === "Ambassador",
  );
  const petParentRecords = records.filter(
    (record) => record.role === "Pet Parent",
  );

  return {
    records,
    completedRecords,
    inProgressRecords,
    notStartedRecords,
    metrics: {
      total: records.length,
      completed: completedRecords.length,
      inProgress: inProgressRecords.length,
      notStarted: notStartedRecords.length,
      gurus: guruRecords.length,
      ambassadors: ambassadorRecords.length,
      petParents: petParentRecords.length,
      averageProgress:
        records.length > 0
          ? Math.round(
              records.reduce((sum, record) => sum + record.progress, 0) /
                records.length,
            )
          : 0,
    },
  };
}

export default async function AdminUniversityProgressPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const data = await getUniversityProgressData();

  return (
    <main className="w-full min-w-0 space-y-5">
      <section className="rounded-[28px] border border-green-100 bg-gradient-to-br from-white via-[#f7fbf4] to-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div className="min-w-0">
            <Link
              href={adminRoutes.hr}
              className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-black text-green-800 shadow-sm ring-1 ring-green-100 transition hover:bg-green-50 hover:text-green-950 sm:text-sm"
            >
              <ArrowLeft size={16} />
              Back to HR
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl xl:text-5xl">
                Academy Progress Tracker
              </h1>
              <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-green-800 sm:text-xs">
                SitGuru University
              </span>
            </div>

            <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
              See who completed their academies, who is still in progress, who
              has not started, and how far each Pet Parent, Guru, Ambassador, or
              onboarding user has progressed.
            </p>
          </div>

          <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-auto">
            <Link
              href={adminRoutes.assignments}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <ClipboardCheck size={17} />
              Assignment Manager
            </Link>

            <Link
              href={adminRoutes.university}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-800 to-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:brightness-105"
            >
              <GraduationCap size={17} />
              Training Manager
            </Link>
          </div>
        </div>
      </section>

      <section className="grid w-full min-w-0 gap-3 rounded-[28px] border border-green-100 bg-white p-3 shadow-sm sm:grid-cols-2 sm:p-4 lg:grid-cols-4 2xl:grid-cols-8">
        <MetricTile label="Total Assigned" value={number(data.metrics.total)} />
        <MetricTile label="Completed" value={number(data.metrics.completed)} />
        <MetricTile label="In Progress" value={number(data.metrics.inProgress)} />
        <MetricTile label="Not Started" value={number(data.metrics.notStarted)} />
        <MetricTile label="Average Progress" value={`${data.metrics.averageProgress}%`} />
        <MetricTile label="Guru Records" value={number(data.metrics.gurus)} />
        <MetricTile label="Ambassadors" value={number(data.metrics.ambassadors)} />
        <MetricTile label="Pet Parents" value={number(data.metrics.petParents)} />
      </section>

      <section className="grid w-full min-w-0 gap-4 xl:grid-cols-3">
        <SummaryCard
          icon={<CheckCircle2 size={22} />}
          title="Completed Academies"
          value={number(data.metrics.completed)}
          detail="Users who reached 100% academy completion."
          tone="green"
        />
        <SummaryCard
          icon={<Clock3 size={22} />}
          title="Still In Progress"
          value={number(data.metrics.inProgress)}
          detail="Users who started but have not finished."
          tone="amber"
        />
        <SummaryCard
          icon={<BookOpenCheck size={22} />}
          title="Not Started"
          value={number(data.metrics.notStarted)}
          detail="Assigned users with no recorded progress yet."
          tone="slate"
        />
      </section>

      <section className="grid w-full min-w-0 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8">
          <DashboardCard>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Academy Completion Roster
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  Full progress view by user, role, academy, status, completion
                  percentage, and last activity.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-2 text-xs font-black text-green-900">
                <Search size={14} />
                Browser search works here
              </div>
            </div>

            <MobileProgressList records={data.records} />

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#edf3ee] text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Academy</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Progress</th>
                    <th className="pb-3">Completed</th>
                    <th className="pb-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.length ? (
                    data.records.map((record) => (
                      <tr
                        key={record.key}
                        className="border-b border-[#f1f5f2] last:border-0"
                      >
                        <td className="py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={record.name} />
                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-950">
                                {record.name}
                              </p>
                              <p className="truncate text-xs font-bold text-slate-500">
                                {record.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <RoleBadge role={record.role} />
                        </td>
                        <td className="py-4 font-bold text-slate-700">
                          {record.academy}
                        </td>
                        <td className="py-4">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="py-4">
                          <ProgressBar value={record.progress} />
                        </td>
                        <td className="py-4 font-bold text-slate-600">
                          {formatDate(record.completedAt)}
                        </td>
                        <td className="py-4 font-bold text-slate-600">
                          {formatDate(record.updatedAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8">
                        <EmptyState
                          title="No academy progress records found"
                          detail="This page is ready, but it did not find progress rows in the common SitGuru University progress tables. Once academy assignments or progress records exist, they will appear here."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>

        <div className="min-w-0 xl:col-span-4">
          <DashboardCard>
            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-950">
                Completed Academy Users
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Quick list of users who reached 100%.
              </p>
            </div>

            <div className="grid gap-3">
              {data.completedRecords.length ? (
                data.completedRecords.slice(0, 12).map((record) => (
                  <div
                    key={`completed-${record.key}`}
                    className="rounded-2xl border border-green-100 bg-green-50/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-800">
                        <BadgeCheck size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">
                          {record.name}
                        </p>
                        <p className="truncate text-xs font-bold text-slate-500">
                          {record.email}
                        </p>
                        <p className="mt-1 text-xs font-black text-green-800">
                          {record.academy}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          Completed: {formatDate(record.completedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No completed academies yet"
                  detail="Completed users will show here once they reach 100%."
                />
              )}
            </div>
          </DashboardCard>
        </div>
      </section>
    </main>
  );
}

function DashboardCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-w-0 rounded-[24px] border border-[#e3ece5] bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5">
      {children}
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-[#fbfcf9] px-4 py-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-green-950 sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  tone: "green" | "amber" | "slate";
}) {
  const styles = {
    green: "border-green-100 bg-green-50 text-green-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className="rounded-[24px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${styles[tone]}`}
        >
          {icon}
        </div>
        <p className="text-3xl font-black text-green-950">{value}</p>
      </div>
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="min-w-[160px]">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-black text-slate-500">Progress</span>
        <span className="text-xs font-black text-green-800">{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-green-700"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Completed"
      ? "bg-green-100 text-green-800"
      : status === "In Progress"
        ? "bg-amber-100 text-amber-800"
        : status === "Not Started"
          ? "bg-slate-100 text-slate-700"
          : "bg-blue-100 text-blue-800";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles}`}
    >
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles =
    role === "Guru"
      ? "border-green-100 bg-green-50 text-green-800"
      : role === "Ambassador"
        ? "border-blue-100 bg-blue-50 text-blue-800"
        : role === "Pet Parent"
          ? "border-purple-100 bg-purple-50 text-purple-800"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${styles}`}
    >
      {role}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-black text-green-800">
      {initials || "SG"}
    </div>
  );
}

function MobileProgressList({ records }: { records: AcademyProgressRecord[] }) {
  if (!records.length) {
    return (
      <div className="md:hidden">
        <EmptyState
          title="No academy progress records found"
          detail="Progress records will show here once academy assignment or completion data exists."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:hidden">
      {records.map((record) => (
        <article
          key={`mobile-${record.key}`}
          className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4"
        >
          <div className="flex min-w-0 items-start gap-3">
            <Avatar name={record.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-950">
                {record.name}
              </p>
              <p className="truncate text-xs font-bold text-slate-500">
                {record.email}
              </p>
            </div>
            <StatusBadge status={record.status} />
          </div>

          <div className="mt-4 grid gap-2">
            <MobileMetaRow label="Role" value={record.role} />
            <MobileMetaRow label="Academy" value={record.academy} />
            <ProgressBar value={record.progress} />
            <MobileMetaRow label="Completed" value={formatDate(record.completedAt)} />
            <MobileMetaRow label="Updated" value={formatDate(record.updatedAt)} />
          </div>
        </article>
      ))}
    </div>
  );
}

function MobileMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <span className="truncate text-right text-xs font-black text-slate-700">
        {value}
      </span>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/60 p-6 text-center">
      <p className="font-black text-green-950">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-green-900/70">
        {detail}
      </p>
    </div>
  );
}