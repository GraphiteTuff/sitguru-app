import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AcademyProgressClient from "./AcademyProgressClient";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

export type AcademyProgressRecord = {
  key: string;
  name: string;
  email: string;
  avatarUrl: string;
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
  hr: "/admin/hr",
  university: "/admin/ambassador-training",
  assignments: "/admin/university-assignments",
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

function getId(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return "";
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

function getAvatarUrl(row: AnyRow | null) {
  if (!row) return "";

  return getText(
    row,
    [
      "avatar_url",
      "avatarUrl",
      "profile_photo_url",
      "profilePhotoUrl",
      "photo_url",
      "photoUrl",
      "image_url",
      "imageUrl",
      "profile_image_url",
      "profileImageUrl",
      "headshot_url",
      "headshotUrl",
      "picture",
      "picture_url",
      "pictureUrl",
    ],
    "",
  );
}

function getAcademyFromRow(row: AnyRow, academyNameById: Map<string, string>) {
  const directName = getText(
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
    "",
  );

  if (directName) return directName;

  const academyId = getId(row, [
    "academy_id",
    "training_id",
    "course_id",
    "program_id",
    "module_id",
    "assignment_id",
  ]);

  if (academyId && academyNameById.has(academyId)) {
    return academyNameById.get(academyId) || "SitGuru Academy";
  }

  return "SitGuru Academy";
}

function getRole(row: AnyRow, academy: string) {
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

  const academyLower = academy.toLowerCase();

  if (role.includes("guru") || academyLower.includes("guru")) return "Guru";
  if (role.includes("ambassador") || academyLower.includes("ambassador")) {
    return "Ambassador";
  }
  if (
    role.includes("pet_parent") ||
    role.includes("pet parent") ||
    role.includes("customer") ||
    academyLower.includes("pet parent")
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

function buildPersonMap(rows: AnyRow[]) {
  const map = new Map<string, AnyRow>();

  for (const row of rows) {
    const ids = [
      getId(row, ["id"]),
      getId(row, ["user_id"]),
      getId(row, ["profile_id"]),
      getId(row, ["auth_user_id"]),
      getId(row, ["owner_id"]),
      getEmail(row).toLowerCase(),
    ].filter(Boolean);

    for (const id of ids) {
      if (!map.has(id)) map.set(id, row);
    }
  }

  return map;
}

function buildAcademyNameMap(rows: AnyRow[]) {
  const map = new Map<string, string>();

  for (const row of rows) {
    const id = getId(row, ["id", "academy_id", "training_id", "course_id"]);
    const name = getText(
      row,
      ["name", "title", "academy_name", "training_name", "course_name"],
      "",
    );

    if (id && name) map.set(id, name);
  }

  return map;
}

function resolvePerson(row: AnyRow, personMap: Map<string, AnyRow>) {
  const possibleKeys = [
    getId(row, ["user_id"]),
    getId(row, ["profile_id"]),
    getId(row, ["student_id"]),
    getId(row, ["participant_id"]),
    getId(row, ["guru_id"]),
    getId(row, ["ambassador_id"]),
    getId(row, ["pet_parent_id"]),
    getId(row, ["customer_id"]),
    getId(row, ["owner_id"]),
    getEmail(row).toLowerCase(),
  ].filter(Boolean);

  for (const key of possibleKeys) {
    const person = personMap.get(key);
    if (person) return person;
  }

  return null;
}

function normalizeProgressRow(
  row: AnyRow,
  personMap: Map<string, AnyRow>,
  academyNameById: Map<string, string>,
): AcademyProgressRecord {
  const person = resolvePerson(row, personMap);
  const source = getText(row, ["__source_table"], "unknown");
  const academy = getAcademyFromRow(row, academyNameById);
  const progress = getProgress(row);

  const name = person ? getDisplayName(person) : getDisplayName(row);
  const email = person ? getEmail(person) : getEmail(row);
  const avatarUrl = person ? getAvatarUrl(person) : getAvatarUrl(row);

  const role = person
    ? getRole(
        {
          ...row,
          role: getText(person, ["role", "account_type", "type", "segment"], ""),
        },
        academy,
      )
    : getRole(row, academy);

  const userId =
    getId(row, [
      "user_id",
      "profile_id",
      "student_id",
      "participant_id",
      "guru_id",
      "ambassador_id",
      "pet_parent_id",
      "customer_id",
      "owner_id",
      "id",
    ]) || email;

  return {
    key: `${userId || name}:${academy}:${source}`.toLowerCase(),
    name,
    email,
    avatarUrl,
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

function mergeProgressRecords(records: AcademyProgressRecord[]) {
  const map = new Map<string, AcademyProgressRecord>();

  for (const record of records) {
    const mergeKey = `${record.email}:${record.name}:${record.academy}`.toLowerCase();
    const existing = map.get(mergeKey);

    if (!existing) {
      map.set(mergeKey, record);
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

    const source = Array.from(
      new Set(`${existing.source}, ${record.source}`.split(", ")),
    ).join(", ");

    map.set(mergeKey, {
      ...existing,
      name: existing.name !== "Unknown User" ? existing.name : record.name,
      email: existing.email !== "—" ? existing.email : record.email,
      avatarUrl: existing.avatarUrl || record.avatarUrl,
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
      source,
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    const academyCompare = a.academy.localeCompare(b.academy);
    if (academyCompare !== 0) return academyCompare;

    if (b.progress !== a.progress) return b.progress - a.progress;

    const dateA = new Date(a.updatedAt || a.assignedAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.assignedAt || 0).getTime();

    return dateB - dateA;
  });
}

async function getUniversityProgressData() {
  const [
    profilesResult,
    gurusResult,
    ambassadorsResult,
    petParentsResult,
    academiesResult,
    universityAcademiesResult,
    trainingAcademiesResult,
    universityAssignmentsResult,
    academyAssignmentsResult,
    userAcademyAssignmentsResult,
    trainingAssignmentsResult,
    universityProgressResult,
    academyProgressResult,
    trainingProgressResult,
    userTrainingProgressResult,
  ] = await Promise.all([
    safeAdminQuery(supabaseAdmin.from("profiles").select("*").limit(5000), "profiles"),
    safeAdminQuery(supabaseAdmin.from("gurus").select("*").limit(5000), "gurus"),
    safeAdminQuery(
      supabaseAdmin.from("ambassadors").select("*").limit(5000),
      "ambassadors",
    ),
    safeAdminQuery(
      supabaseAdmin.from("pet_parents").select("*").limit(5000),
      "pet_parents",
    ),
    safeAdminQuery(supabaseAdmin.from("academies").select("*").limit(1000), "academies"),
    safeAdminQuery(
      supabaseAdmin.from("university_academies").select("*").limit(1000),
      "university_academies",
    ),
    safeAdminQuery(
      supabaseAdmin.from("training_academies").select("*").limit(1000),
      "training_academies",
    ),
    safeAdminQuery(
      supabaseAdmin.from("university_assignments").select("*").limit(5000),
      "university_assignments",
    ),
    safeAdminQuery(
      supabaseAdmin.from("academy_assignments").select("*").limit(5000),
      "academy_assignments",
    ),
    safeAdminQuery(
      supabaseAdmin.from("user_academy_assignments").select("*").limit(5000),
      "user_academy_assignments",
    ),
    safeAdminQuery(
      supabaseAdmin.from("training_assignments").select("*").limit(5000),
      "training_assignments",
    ),
    safeAdminQuery(
      supabaseAdmin.from("university_progress").select("*").limit(5000),
      "university_progress",
    ),
    safeAdminQuery(
      supabaseAdmin.from("academy_progress").select("*").limit(5000),
      "academy_progress",
    ),
    safeAdminQuery(
      supabaseAdmin.from("training_progress").select("*").limit(5000),
      "training_progress",
    ),
    safeAdminQuery(
      supabaseAdmin.from("user_training_progress").select("*").limit(5000),
      "user_training_progress",
    ),
  ]);

  const personRows = [
    ...(((profilesResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "profiles"),
    )),
    ...(((gurusResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "gurus"),
    )),
    ...(((ambassadorsResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "ambassadors"),
    )),
    ...(((petParentsResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "pet_parents"),
    )),
  ];

  const academyRows = [
    ...(((academiesResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "academies"),
    )),
    ...(((universityAcademiesResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "university_academies"),
    )),
    ...(((trainingAcademiesResult.data || []) as AnyRow[]).map((row) =>
      withSourceTable(row, "training_academies"),
    )),
  ];

  const progressRows = [
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

  const personMap = buildPersonMap(personRows);
  const academyNameById = buildAcademyNameMap(academyRows);

  const normalizedRecords = progressRows.map((row) =>
    normalizeProgressRow(row, personMap, academyNameById),
  );

  const records = mergeProgressRecords(normalizedRecords);

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
              Sort, filter, and review academy progress by user, role, academy,
              status, completion percentage, avatar, and last activity.
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
        <MetricTile
          label="Average Progress"
          value={`${data.metrics.averageProgress}%`}
        />
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

      <AcademyProgressClient
        records={data.records}
        completedRecords={data.completedRecords}
      />
    </main>
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