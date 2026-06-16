import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  buildAdminPersonLookup,
  getAdminPeopleDirectory,
  type AdminPerson,
} from "@/lib/admin/peopleResolver";

export type AcademyProgressRecord = {
  key: string;
  personId: string;
  rawUserKey: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  academyType: string;
  academy: string;
  status: "Completed" | "In Progress" | "Not Started" | "Needs Cleanup";
  progress: number;
  completedAt: string | null;
  updatedAt: string | null;
  assignedAt: string | null;
  source: string;
  cleanupIssue: string | null;
  profileHref: string;
  messageHref: string;
  assignmentHref: string;
};

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type ProgressBucket = {
  rawUserKey: string;
  academyType: string;
  assignedAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
  assignmentStatus: string;
  assignmentProgress: number;
  completedStepIds: Set<string>;
  touchedStepIds: Set<string>;
  completedMaterialIds: Set<string>;
  touchedMaterialIds: Set<string>;
  sourceTables: Set<string>;
};

type AcademyRequirement = {
  academyType: string;
  activeStepIds: Set<string>;
  requiredStepIds: Set<string>;
  activeMaterialIds: Set<string>;
  requiredMaterialIds: Set<string>;
};

export type AcademyProgressDashboardData = {
  records: AcademyProgressRecord[];
  completedRecords: AcademyProgressRecord[];
  metrics: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    needsCleanup: number;
  };
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace("%", "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isExplicitFalse(value: unknown) {
  if (typeof value === "boolean") return value === false;

  if (typeof value === "string") {
    return ["false", "0", "no", "n", "inactive"].includes(
      value.trim().toLowerCase(),
    );
  }

  if (typeof value === "number") return value === 0;

  return false;
}

function clampProgress(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getId(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return "";
}

function getDate(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return null;
}

function getLatestDate(...values: Array<string | null | undefined>) {
  const sorted = values
    .filter(Boolean)
    .sort((a, b) => new Date(b || 0).getTime() - new Date(a || 0).getTime());

  return sorted[0] || null;
}

function normalizeAcademyType(value: unknown) {
  const raw = asString(value).toLowerCase();

  if (!raw) return "sitguru";
  if (raw.includes("ambassador")) return "ambassador";
  if (raw.includes("guru")) return "guru";
  if (
    raw.includes("pet_parent") ||
    raw.includes("pet parent") ||
    raw.includes("customer") ||
    raw.includes("parent")
  ) {
    return "pet_parent";
  }

  return (
    raw
      .replace(/academy/g, "")
      .replace(/training/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "sitguru"
  );
}

function academyLabel(academyType: string) {
  const normalized = normalizeAcademyType(academyType);

  if (normalized === "guru") return "Guru Academy";
  if (normalized === "ambassador") return "Ambassador Academy";
  if (normalized === "pet_parent") return "Pet Parent Academy";

  return "SitGuru Academy";
}

function roleFromAcademy(academyType: string) {
  const academy = normalizeAcademyType(academyType);

  if (academy === "guru") return "Guru";
  if (academy === "ambassador") return "Ambassador";
  if (academy === "pet_parent") return "Pet Parent";

  return "User";
}

function getAcademyType(row: AnyRow) {
  return normalizeAcademyType(
    getText(row, [
      "academy_type",
      "academy",
      "academy_name",
      "training_name",
      "course_name",
      "program_name",
      "module_name",
      "assignment_name",
      "title",
    ]),
  );
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
      "certificate_status",
      "badge_status",
    ],
    "",
  ).toLowerCase();
}

function isCompletedStatus(value: string) {
  const status = value.toLowerCase();

  return ["complete", "completed", "approved", "certified", "done", "issued"].includes(status);
}

function isStartedStatus(value: string) {
  const status = value.toLowerCase();

  return [
    "in_progress",
    "in progress",
    "started",
    "active",
    "acknowledged",
    "viewed",
  ].includes(status);
}

function getCompletedAt(row: AnyRow) {
  return getDate(row, [
    "completed_at",
    "completion_date",
    "academy_completed_at",
    "training_completed_at",
    "certified_at",
    "issued_at",
    "certificate_sent_at",
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

function getAssignmentProgress(row: AnyRow) {
  return clampProgress(
    asNumber(
      row.progress_percent ??
        row.progress_percentage ??
        row.completion_percentage ??
        row.percent_complete ??
        row.completion_percent ??
        row.percentage ??
        row.progress,
    ),
  );
}

function getEmail(row: AnyRow) {
  const email = getText(row, [
    "email",
    "user_email",
    "student_email",
    "participant_email",
    "guru_email",
    "ambassador_email",
    "pet_parent_email",
    "profile_email",
  ]);

  return email && email !== "—" ? email.toLowerCase() : "";
}

function getUserKey(row: AnyRow) {
  return (
    getId(row, [
      "user_id",
      "profile_id",
      "auth_user_id",
      "student_id",
      "participant_id",
      "guru_user_id",
      "ambassador_user_id",
      "pet_parent_user_id",
      "customer_id",
      "owner_id",
      "guru_id",
      "ambassador_id",
      "pet_parent_id",
    ]) || getEmail(row)
  );
}

function getStepId(row: AnyRow) {
  return getId(row, ["training_step_id", "step_id", "id"]);
}

function getMaterialId(row: AnyRow) {
  return getId(row, ["material_id", "id"]);
}

function getSource(row: AnyRow) {
  return getText(row, ["__source_table"], "unknown");
}

function withSourceTable(row: AnyRow, source: string) {
  return {
    ...row,
    __source_table: source,
  };
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Academy progress query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Academy progress query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

function createRequirement(academyType: string): AcademyRequirement {
  return {
    academyType,
    activeStepIds: new Set<string>(),
    requiredStepIds: new Set<string>(),
    activeMaterialIds: new Set<string>(),
    requiredMaterialIds: new Set<string>(),
  };
}

function buildAcademyRequirements(
  trainingSteps: AnyRow[],
  stepMaterials: AnyRow[],
) {
  const requirements = new Map<string, AcademyRequirement>();

  function getRequirement(academyType: string) {
    const normalized = normalizeAcademyType(academyType);
    const existing = requirements.get(normalized);
    if (existing) return existing;

    const created = createRequirement(normalized);
    requirements.set(normalized, created);
    return created;
  }

  for (const step of trainingSteps) {
    const academyType = getAcademyType(step);
    const stepId = getStepId(step);
    if (!stepId || isExplicitFalse(step.is_active)) continue;

    const requirement = getRequirement(academyType);
    requirement.activeStepIds.add(stepId);
    if (!isExplicitFalse(step.is_required)) requirement.requiredStepIds.add(stepId);
  }

  for (const material of stepMaterials) {
    const academyType = getAcademyType(material);
    const materialId = getMaterialId(material);
    if (!materialId || isExplicitFalse(material.is_active)) continue;

    const requirement = getRequirement(academyType);
    requirement.activeMaterialIds.add(materialId);
    if (!isExplicitFalse(material.is_required)) {
      requirement.requiredMaterialIds.add(materialId);
    }

    const stepId = getStepId(material);
    if (stepId) {
      requirement.activeStepIds.add(stepId);
      if (!isExplicitFalse(material.is_required)) {
        requirement.requiredStepIds.add(stepId);
      }
    }
  }

  return requirements;
}

function bucketKey(rawUserKey: string, academyType: string) {
  return `${rawUserKey}:${normalizeAcademyType(academyType)}`.toLowerCase();
}

function createBucket(rawUserKey: string, academyType: string): ProgressBucket {
  return {
    rawUserKey,
    academyType: normalizeAcademyType(academyType),
    assignedAt: null,
    completedAt: null,
    updatedAt: null,
    assignmentStatus: "",
    assignmentProgress: 0,
    completedStepIds: new Set<string>(),
    touchedStepIds: new Set<string>(),
    completedMaterialIds: new Set<string>(),
    touchedMaterialIds: new Set<string>(),
    sourceTables: new Set<string>(),
  };
}

function getOrCreateBucket(
  buckets: Map<string, ProgressBucket>,
  rawUserKey: string,
  academyType: string,
) {
  const key = bucketKey(rawUserKey, academyType);
  const existing = buckets.get(key);
  if (existing) return existing;

  const created = createBucket(rawUserKey, academyType);
  buckets.set(key, created);
  return created;
}

function addAssignmentToBucket(
  buckets: Map<string, ProgressBucket>,
  row: AnyRow,
) {
  const rawUserKey = getUserKey(row);
  if (!rawUserKey) return;

  const academyType = getAcademyType(row);
  const bucket = getOrCreateBucket(buckets, rawUserKey, academyType);

  bucket.assignedAt = bucket.assignedAt || getAssignedAt(row);
  bucket.completedAt = bucket.completedAt || getCompletedAt(row);
  bucket.updatedAt = getLatestDate(bucket.updatedAt, getUpdatedAt(row));
  bucket.assignmentStatus = bucket.assignmentStatus || getRawStatus(row);
  bucket.assignmentProgress = Math.max(bucket.assignmentProgress, getAssignmentProgress(row));
  bucket.sourceTables.add(getSource(row));
}

function addStepProgressToBucket(
  buckets: Map<string, ProgressBucket>,
  row: AnyRow,
) {
  const rawUserKey = getUserKey(row);
  const stepId = getStepId(row);
  if (!rawUserKey || !stepId) return;

  const academyType = getAcademyType(row);
  const bucket = getOrCreateBucket(buckets, rawUserKey, academyType);
  const status = getRawStatus(row);
  const completedAt = getCompletedAt(row);
  const acknowledgedAt = getDate(row, ["acknowledged_at"]);

  bucket.touchedStepIds.add(stepId);

  if (completedAt || acknowledgedAt || isCompletedStatus(status)) {
    bucket.completedStepIds.add(stepId);
  }

  bucket.completedAt = bucket.completedAt || completedAt;
  bucket.updatedAt = getLatestDate(bucket.updatedAt, getUpdatedAt(row), completedAt, acknowledgedAt);
  bucket.sourceTables.add(getSource(row));
}

function addMaterialProgressToBucket(
  buckets: Map<string, ProgressBucket>,
  row: AnyRow,
) {
  const rawUserKey = getUserKey(row);
  const materialId = getMaterialId(row);
  if (!rawUserKey || !materialId) return;

  const academyType = getAcademyType(row);
  const bucket = getOrCreateBucket(buckets, rawUserKey, academyType);
  const stepId = getStepId(row);
  const acknowledgedAt = getDate(row, ["acknowledged_at"]);

  bucket.touchedMaterialIds.add(materialId);

  if (acknowledgedAt) bucket.completedMaterialIds.add(materialId);

  if (stepId) {
    bucket.touchedStepIds.add(stepId);
    if (acknowledgedAt) bucket.completedStepIds.add(stepId);
  }

  bucket.updatedAt = getLatestDate(bucket.updatedAt, getUpdatedAt(row), acknowledgedAt);
  bucket.sourceTables.add(getSource(row));
}

function calculateProgress(
  bucket: ProgressBucket,
  requirement: AcademyRequirement | undefined,
) {
  const requiredStepCount = requirement?.requiredStepIds.size || 0;
  const activeStepCount = requirement?.activeStepIds.size || 0;
  const requiredMaterialCount = requirement?.requiredMaterialIds.size || 0;
  const activeMaterialCount = requirement?.activeMaterialIds.size || 0;

  const stepDenominator = requiredStepCount || activeStepCount;
  const materialDenominator = requiredMaterialCount || activeMaterialCount;

  const completedSteps =
    requirement && stepDenominator
      ? Array.from(bucket.completedStepIds).filter((id) =>
          requiredStepCount
            ? requirement.requiredStepIds.has(id)
            : requirement.activeStepIds.has(id),
        ).length
      : bucket.completedStepIds.size;

  const completedMaterials =
    requirement && materialDenominator
      ? Array.from(bucket.completedMaterialIds).filter((id) =>
          requiredMaterialCount
            ? requirement.requiredMaterialIds.has(id)
            : requirement.activeMaterialIds.has(id),
        ).length
      : bucket.completedMaterialIds.size;

  const stepProgress = stepDenominator > 0 ? (completedSteps / stepDenominator) * 100 : 0;
  const materialProgress =
    materialDenominator > 0 ? (completedMaterials / materialDenominator) * 100 : 0;

  let calculated = 0;

  if (stepDenominator > 0 && materialDenominator > 0) {
    calculated = Math.max(stepProgress, materialProgress);
  } else if (stepDenominator > 0) {
    calculated = stepProgress;
  } else if (materialDenominator > 0) {
    calculated = materialProgress;
  }

  if (!calculated && (bucket.touchedStepIds.size || bucket.touchedMaterialIds.size)) {
    calculated = 10;
  }

  if (bucket.completedAt || isCompletedStatus(bucket.assignmentStatus)) {
    calculated = 100;
  }

  return clampProgress(Math.max(calculated, bucket.assignmentProgress));
}

function statusFromProgress(progress: number, bucket: ProgressBucket) {
  if (progress >= 100) return "Completed" as const;

  if (
    progress > 0 ||
    bucket.touchedStepIds.size > 0 ||
    bucket.touchedMaterialIds.size > 0 ||
    isStartedStatus(bucket.assignmentStatus)
  ) {
    return "In Progress" as const;
  }

  return "Not Started" as const;
}

function profileHref(person: AdminPerson | null) {
  if (!person) return "/admin/data-cleanup";
  if (person.role === "guru") return person.guruId ? `/admin/gurus?highlight=${person.guruId}` : "/admin/gurus";
  if (person.role === "ambassador") return person.ambassadorId ? `/admin/ambassadors?highlight=${person.ambassadorId}` : "/admin/ambassadors";
  if (person.role === "pet_parent") return person.profileId ? `/admin/pet-parents?highlight=${person.profileId}` : "/admin/pet-parents";
  return "/admin";
}

function messageHref(person: AdminPerson | null) {
  return person?.userId ? `/admin/messages?user=${encodeURIComponent(person.userId)}` : "/admin/messages";
}

function cleanupIssueFor(person: AdminPerson | null, rawUserKey: string) {
  if (!person) return "No matching person record found";
  if (person.displayName === "Needs Cleanup" || person.isUnknown) return "Missing usable name";
  if (!person.email) return "Missing email";
  if (!person.avatarUrl) return "Missing profile photo";
  if (person.userId !== rawUserKey && person.profileId !== rawUserKey && person.guruId !== rawUserKey && person.ambassadorId !== rawUserKey && person.petParentId !== rawUserKey && person.email.toLowerCase() !== rawUserKey.toLowerCase()) {
    return null;
  }

  return null;
}

function normalizeRecord(
  bucket: ProgressBucket,
  personLookup: Map<string, AdminPerson>,
  requirements: Map<string, AcademyRequirement>,
): AcademyProgressRecord {
  const person =
    personLookup.get(bucket.rawUserKey) ||
    personLookup.get(bucket.rawUserKey.toLowerCase()) ||
    null;
  const progress = calculateProgress(bucket, requirements.get(bucket.academyType));
  const cleanupIssue = cleanupIssueFor(person, bucket.rawUserKey);
  const status = cleanupIssue && !person ? "Needs Cleanup" : statusFromProgress(progress, bucket);
  const personId = person?.userId || bucket.rawUserKey;

  return {
    key: `${personId}:${bucket.academyType}`.toLowerCase(),
    personId,
    rawUserKey: bucket.rawUserKey,
    name: person?.displayName || "Needs Cleanup",
    email: person?.email || "Missing linked profile",
    avatarUrl: person?.avatarUrl || "",
    role: person?.roleLabel || roleFromAcademy(bucket.academyType),
    academyType: bucket.academyType,
    academy: academyLabel(bucket.academyType),
    status,
    progress,
    completedAt: bucket.completedAt,
    updatedAt: bucket.updatedAt || bucket.assignedAt,
    assignedAt: bucket.assignedAt,
    source: Array.from(bucket.sourceTables).join(", "),
    cleanupIssue,
    profileHref: profileHref(person),
    messageHref: messageHref(person),
    assignmentHref: `/admin/university-assignments?user=${encodeURIComponent(personId)}`,
  };
}

function recordScore(record: AcademyProgressRecord) {
  let score = 0;
  if (!record.cleanupIssue) score += 100;
  if (record.avatarUrl) score += 20;
  if (record.email && record.email !== "Missing linked profile") score += 20;
  if (record.status === "Completed") score += 30;
  score += record.progress;
  score += new Date(record.updatedAt || record.completedAt || record.assignedAt || 0).getTime() / 10000000000000;
  return score;
}

function mergeRecords(
  existing: AcademyProgressRecord,
  incoming: AcademyProgressRecord,
): AcademyProgressRecord {
  const preferred = recordScore(incoming) > recordScore(existing) ? incoming : existing;
  const fallback = preferred === incoming ? existing : incoming;
  const progress = Math.max(preferred.progress, fallback.progress);
  const completedAt = preferred.completedAt || fallback.completedAt;
  const cleanupIssue = preferred.cleanupIssue || fallback.cleanupIssue;

  return {
    ...fallback,
    ...preferred,
    progress,
    status: completedAt || progress >= 100 ? "Completed" : preferred.status,
    completedAt,
    updatedAt: getLatestDate(preferred.updatedAt, fallback.updatedAt),
    assignedAt: preferred.assignedAt || fallback.assignedAt,
    source: Array.from(new Set([preferred.source, fallback.source].join(", ").split(", ").filter(Boolean))).join(", "),
    cleanupIssue: preferred.cleanupIssue === null ? null : cleanupIssue,
  };
}

function dedupeRecords(records: AcademyProgressRecord[]) {
  const map = new Map<string, AcademyProgressRecord>();

  for (const record of records) {
    const dedupeKey = `${record.personId}:${record.academyType}`.toLowerCase();
    const existing = map.get(dedupeKey);
    map.set(dedupeKey, existing ? mergeRecords(existing, record) : record);
  }

  return Array.from(map.values());
}

export async function getAcademyProgressDashboardData(): Promise<AcademyProgressDashboardData> {
  const [
    academyAssignmentsResult,
    universityAssignmentsResult,
    academyStepProgressResult,
    academyMaterialProgressResult,
    academyStepMaterialsResult,
    ambassadorTrainingStepsResult,
    academyCertificationsResult,
  ] = await Promise.all([
    safeAdminQuery(supabaseAdmin.from("academy_assignments").select("*").limit(5000), "academy_assignments"),
    safeAdminQuery(supabaseAdmin.from("university_assignments").select("*").limit(5000), "university_assignments"),
    safeAdminQuery(supabaseAdmin.from("academy_step_progress").select("*").limit(10000), "academy_step_progress"),
    safeAdminQuery(supabaseAdmin.from("academy_material_progress").select("*").limit(10000), "academy_material_progress"),
    safeAdminQuery(supabaseAdmin.from("academy_step_materials").select("*").limit(10000), "academy_step_materials"),
    safeAdminQuery(supabaseAdmin.from("ambassador_training_steps").select("*").limit(5000), "ambassador_training_steps"),
    safeAdminQuery(supabaseAdmin.from("academy_certifications").select("*").limit(5000), "academy_certifications"),
  ]);

  const academyAssignments = ((academyAssignmentsResult.data || []) as AnyRow[]).map((row) => withSourceTable(row, "academy_assignments"));
  const universityAssignments = ((universityAssignmentsResult.data || []) as AnyRow[]).map((row) => withSourceTable(row, "university_assignments"));
  const academyStepProgress = ((academyStepProgressResult.data || []) as AnyRow[]).map((row) => withSourceTable(row, "academy_step_progress"));
  const academyMaterialProgress = ((academyMaterialProgressResult.data || []) as AnyRow[]).map((row) => withSourceTable(row, "academy_material_progress"));
  const academyStepMaterials = ((academyStepMaterialsResult.data || []) as AnyRow[]).map((row) => withSourceTable(row, "academy_step_materials"));
  const ambassadorTrainingSteps = ((ambassadorTrainingStepsResult.data || []) as AnyRow[]).map((row) => withSourceTable(row, "ambassador_training_steps"));
  const academyCertifications = ((academyCertificationsResult.data || []) as AnyRow[]).map((row) => withSourceTable(row, "academy_certifications"));

  const progressSourceRows = [
    ...academyAssignments,
    ...universityAssignments,
    ...academyStepProgress,
    ...academyMaterialProgress,
    ...academyCertifications,
  ];
  const progressUserKeys = Array.from(
    new Set(progressSourceRows.map((row) => getUserKey(row)).filter(Boolean)),
  );
  const people = await getAdminPeopleDirectory({
    limit: 5000,
    includeUserIds: progressUserKeys,
  });
  const personLookup = buildAdminPersonLookup(people);
  const requirements = buildAcademyRequirements(
    ambassadorTrainingSteps,
    academyStepMaterials,
  );
  const buckets = new Map<string, ProgressBucket>();

  academyAssignments.forEach((row) => addAssignmentToBucket(buckets, row));
  universityAssignments.forEach((row) => addAssignmentToBucket(buckets, row));
  academyStepProgress.forEach((row) => addStepProgressToBucket(buckets, row));
  academyMaterialProgress.forEach((row) => addMaterialProgressToBucket(buckets, row));

  for (const row of academyCertifications) {
    const rawUserKey = getUserKey(row);
    if (!rawUserKey) continue;

    const academyType = getAcademyType(row);
    const bucket = getOrCreateBucket(buckets, rawUserKey, academyType);
    const issuedAt = getDate(row, ["issued_at", "certificate_sent_at", "created_at"]);
    const status = getRawStatus(row);

    if (issuedAt || isCompletedStatus(status)) {
      bucket.completedAt = bucket.completedAt || issuedAt;
      bucket.assignmentProgress = Math.max(bucket.assignmentProgress, 100);
    }

    bucket.updatedAt = getLatestDate(bucket.updatedAt, getUpdatedAt(row), issuedAt);
    bucket.sourceTables.add(getSource(row));
  }

  const records = dedupeRecords(
    Array.from(buckets.values()).map((bucket) =>
      normalizeRecord(bucket, personLookup, requirements),
    ),
  ).sort((a, b) => {
    const cleanupCompare = Number(Boolean(a.cleanupIssue)) - Number(Boolean(b.cleanupIssue));
    if (cleanupCompare !== 0) return cleanupCompare;

    const statusRank: Record<AcademyProgressRecord["status"], number> = {
      Completed: 0,
      "In Progress": 1,
      "Not Started": 2,
      "Needs Cleanup": 3,
    };
    const statusCompare = statusRank[a.status] - statusRank[b.status];
    if (statusCompare !== 0) return statusCompare;

    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  const completedRecords = records.filter((record) => record.status === "Completed");
  const inProgressRecords = records.filter((record) => record.status === "In Progress");
  const notStartedRecords = records.filter((record) => record.status === "Not Started");
  const needsCleanupRecords = records.filter((record) => Boolean(record.cleanupIssue));

  return {
    records,
    completedRecords,
    metrics: {
      total: records.length,
      completed: completedRecords.length,
      inProgress: inProgressRecords.length,
      notStarted: notStartedRecords.length,
      needsCleanup: needsCleanupRecords.length,
    },
  };
}
