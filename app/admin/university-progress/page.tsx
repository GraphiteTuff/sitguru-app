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

type ProgressBucket = {
  userId: string;
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
    if (["true", "1", "yes", "y", "active"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "inactive"].includes(normalized)) return false;
  }

  if (typeof value === "number") return value === 1;

  return false;
}

function isExplicitFalse(value: unknown) {
  if (typeof value === "boolean") return value === false;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["false", "0", "no", "n", "inactive"].includes(normalized);
  }

  if (typeof value === "number") return value === 0;

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

function getLatestDate(...values: Array<string | null | undefined>) {
  const sorted = values
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b || 0).getTime() - new Date(a || 0).getTime(),
    );

  return sorted[0] || null;
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

function normalizeAcademyType(value: unknown) {
  const raw = asString(value).toLowerCase();

  if (!raw) return "sitguru";

  if (raw.includes("guru")) return "guru";
  if (raw.includes("ambassador")) return "ambassador";
  if (
    raw.includes("pet_parent") ||
    raw.includes("pet parent") ||
    raw.includes("customer") ||
    raw.includes("parent")
  ) {
    return "pet_parent";
  }

  return raw
    .replace(/academy/g, "")
    .replace(/training/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "sitguru";
}

function academyLabel(academyType: string) {
  const normalized = normalizeAcademyType(academyType);

  if (normalized === "guru") return "Guru Academy";
  if (normalized === "ambassador") return "Ambassador Academy";
  if (normalized === "pet_parent") return "Pet Parent Academy";

  return "SitGuru Academy";
}

function getAcademyType(row: AnyRow) {
  const academyType = getText(
    row,
    [
      "academy_type",
      "academy",
      "academy_name",
      "training_name",
      "course_name",
      "program_name",
      "module_name",
      "assignment_name",
      "title",
    ],
    "",
  );

  return normalizeAcademyType(academyType);
}

function getRole(row: AnyRow, academyType: string) {
  const role = getText(
    row,
    [
      "role",
      "user_role",
      "account_type",
      "academy_role",
      "participant_role",
      "type",
      "segment",
    ],
    "",
  ).toLowerCase();

  const academy = normalizeAcademyType(academyType);

  if (role.includes("guru") || academy === "guru") return "Guru";
  if (role.includes("ambassador") || academy === "ambassador") {
    return "Ambassador";
  }
  if (
    role.includes("pet_parent") ||
    role.includes("pet parent") ||
    role.includes("customer") ||
    academy === "pet_parent"
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

function isCompletedStatus(value: string) {
  const status = value.toLowerCase();

  return (
    status === "complete" ||
    status === "completed" ||
    status === "approved" ||
    status === "certified" ||
    status === "done"
  );
}

function isStartedStatus(value: string) {
  const status = value.toLowerCase();

  return (
    status === "in_progress" ||
    status === "in progress" ||
    status === "started" ||
    status === "active" ||
    status === "acknowledged" ||
    status === "viewed"
  );
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

function getUserId(row: AnyRow) {
  return (
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
    ]) || getEmail(row).toLowerCase()
  );
}

function getTrainingStepId(row: AnyRow) {
  return getId(row, ["training_step_id", "step_id", "id"]);
}

function getMaterialId(row: AnyRow) {
  return getId(row, ["material_id", "id"]);
}

function getSource(row: AnyRow) {
  return getText(row, ["__source_table"], "unknown");
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
    const stepId = getTrainingStepId(step);
    if (!stepId) continue;

    const isActive = !isExplicitFalse(step.is_active);
    if (!isActive) continue;

    const requirement = getRequirement(academyType);
    requirement.activeStepIds.add(stepId);

    const isRequired = !isExplicitFalse(step.is_required);
    if (isRequired) requirement.requiredStepIds.add(stepId);
  }

  for (const material of stepMaterials) {
    const academyType = getAcademyType(material);
    const materialId = getMaterialId(material);
    if (!materialId) continue;

    const isActive = !isExplicitFalse(material.is_active);
    if (!isActive) continue;

    const requirement = getRequirement(academyType);
    requirement.activeMaterialIds.add(materialId);

    const isRequired = !isExplicitFalse(material.is_required);
    if (isRequired) requirement.requiredMaterialIds.add(materialId);

    const stepId = getTrainingStepId(material);
    if (stepId) {
      requirement.activeStepIds.add(stepId);
      if (isRequired) requirement.requiredStepIds.add(stepId);
    }
  }

  return requirements;
}

function getBucketKey(userId: string, academyType: string) {
  return `${userId}:${normalizeAcademyType(academyType)}`.toLowerCase();
}

function createBucket(userId: string, academyType: string): ProgressBucket {
  return {
    userId,
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
  userId: string,
  academyType: string,
) {
  const key = getBucketKey(userId, academyType);
  const existing = buckets.get(key);
  if (existing) return existing;

  const created = createBucket(userId, academyType);
  buckets.set(key, created);
  return created;
}

function addAssignmentToBucket(
  buckets: Map<string, ProgressBucket>,
  row: AnyRow,
) {
  const userId = getUserId(row);
  if (!userId) return;

  const academyType = getAcademyType(row);
  const bucket = getOrCreateBucket(buckets, userId, academyType);

  bucket.assignedAt = bucket.assignedAt || getAssignedAt(row);
  bucket.completedAt = bucket.completedAt || getCompletedAt(row);
  bucket.updatedAt = getLatestDate(bucket.updatedAt, getUpdatedAt(row));
  bucket.assignmentStatus = bucket.assignmentStatus || getRawStatus(row);
  bucket.assignmentProgress = Math.max(
    bucket.assignmentProgress,
    getAssignmentProgress(row),
  );
  bucket.sourceTables.add(getSource(row));
}

function addStepProgressToBucket(
  buckets: Map<string, ProgressBucket>,
  row: AnyRow,
) {
  const userId = getUserId(row);
  const stepId = getTrainingStepId(row);

  if (!userId || !stepId) return;

  const academyType = getAcademyType(row);
  const bucket = getOrCreateBucket(buckets, userId, academyType);
  const status = getRawStatus(row);
  const completedAt = getCompletedAt(row);
  const acknowledgedAt = getDate(row, ["acknowledged_at"]);

  bucket.touchedStepIds.add(stepId);

  if (completedAt || acknowledgedAt || isCompletedStatus(status)) {
    bucket.completedStepIds.add(stepId);
  }

  bucket.completedAt = bucket.completedAt || completedAt;
  bucket.updatedAt = getLatestDate(
    bucket.updatedAt,
    getUpdatedAt(row),
    completedAt,
    acknowledgedAt,
  );
  bucket.sourceTables.add(getSource(row));
}

function addMaterialProgressToBucket(
  buckets: Map<string, ProgressBucket>,
  row: AnyRow,
) {
  const userId = getUserId(row);
  const materialId = getMaterialId(row);

  if (!userId || !materialId) return;

  const academyType = getAcademyType(row);
  const bucket = getOrCreateBucket(buckets, userId, academyType);
  const stepId = getTrainingStepId(row);
  const acknowledgedAt = getDate(row, ["acknowledged_at"]);

  bucket.touchedMaterialIds.add(materialId);

  if (acknowledgedAt) {
    bucket.completedMaterialIds.add(materialId);
  }

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

  const stepProgress =
    stepDenominator > 0 ? (completedSteps / stepDenominator) * 100 : 0;
  const materialProgress =
    materialDenominator > 0
      ? (completedMaterials / materialDenominator) * 100
      : 0;

  const denominators = [stepDenominator, materialDenominator].filter(
    (value) => value > 0,
  );

  let calculatedProgress = 0;

  if (denominators.length === 2) {
    calculatedProgress = Math.max(stepProgress, materialProgress);
  } else if (stepDenominator > 0) {
    calculatedProgress = stepProgress;
  } else if (materialDenominator > 0) {
    calculatedProgress = materialProgress;
  }

  if (!calculatedProgress && bucket.touchedStepIds.size) {
    calculatedProgress = 10;
  }

  if (!calculatedProgress && bucket.touchedMaterialIds.size) {
    calculatedProgress = 10;
  }

  if (bucket.completedAt || isCompletedStatus(bucket.assignmentStatus)) {
    calculatedProgress = 100;
  }

  return clampProgress(Math.max(calculatedProgress, bucket.assignmentProgress));
}

function getReadableStatus(progress: number, bucket: ProgressBucket) {
  if (progress >= 100) return "Completed";

  if (
    progress > 0 ||
    bucket.touchedStepIds.size > 0 ||
    bucket.touchedMaterialIds.size > 0 ||
    isStartedStatus(bucket.assignmentStatus)
  ) {
    return "In Progress";
  }

  return "Not Started";
}

function normalizeRecord(
  bucket: ProgressBucket,
  personMap: Map<string, AnyRow>,
  requirements: Map<string, AcademyRequirement>,
): AcademyProgressRecord {
  const person =
    personMap.get(bucket.userId) || personMap.get(bucket.userId.toLowerCase()) || null;

  const progress = calculateProgress(bucket, requirements.get(bucket.academyType));

  const name = person ? getDisplayName(person) : "Unknown User";
  const email = person ? getEmail(person) : bucket.userId;
  const avatarUrl = person ? getAvatarUrl(person) : "";
  const role = person
    ? getRole(
        {
          role: getText(person, ["role", "account_type", "type", "segment"], ""),
        },
        bucket.academyType,
      )
    : getRole({}, bucket.academyType);

  return {
    key: getBucketKey(bucket.userId, bucket.academyType),
    name,
    email,
    avatarUrl,
    role,
    academy: academyLabel(bucket.academyType),
    status: getReadableStatus(progress, bucket),
    progress,
    completedAt: bucket.completedAt,
    updatedAt: bucket.updatedAt || bucket.assignedAt,
    assignedAt: bucket.assignedAt,
    source: Array.from(bucket.sourceTables).join(", "),
  };
}

async function getUniversityProgressData() {
  const [
    profilesResult,
    gurusResult,
    ambassadorsResult,
    petParentsResult,
    academyAssignmentsResult,
    universityAssignmentsResult,
    academyStepProgressResult,
    academyMaterialProgressResult,
    academyStepMaterialsResult,
    ambassadorTrainingStepsResult,
    academyCertificationsResult,
  ] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin.from("profiles").select("*").limit(5000),
      "profiles",
    ),
    safeAdminQuery(
      supabaseAdmin.from("gurus").select("*").limit(5000),
      "gurus",
    ),
    safeAdminQuery(
      supabaseAdmin.from("ambassadors").select("*").limit(5000),
      "ambassadors",
    ),
    safeAdminQuery(
      supabaseAdmin.from("pet_parents").select("*").limit(5000),
      "pet_parents",
    ),
    safeAdminQuery(
      supabaseAdmin.from("academy_assignments").select("*").limit(5000),
      "academy_assignments",
    ),
    safeAdminQuery(
      supabaseAdmin.from("university_assignments").select("*").limit(5000),
      "university_assignments",
    ),
    safeAdminQuery(
      supabaseAdmin.from("academy_step_progress").select("*").limit(10000),
      "academy_step_progress",
    ),
    safeAdminQuery(
      supabaseAdmin.from("academy_material_progress").select("*").limit(10000),
      "academy_material_progress",
    ),
    safeAdminQuery(
      supabaseAdmin.from("academy_step_materials").select("*").limit(10000),
      "academy_step_materials",
    ),
    safeAdminQuery(
      supabaseAdmin.from("ambassador_training_steps").select("*").limit(5000),
      "ambassador_training_steps",
    ),
    safeAdminQuery(
      supabaseAdmin.from("academy_certifications").select("*").limit(5000),
      "academy_certifications",
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

  const academyAssignments = ((academyAssignmentsResult.data || []) as AnyRow[]).map(
    (row) => withSourceTable(row, "academy_assignments"),
  );
  const universityAssignments = (
    (universityAssignmentsResult.data || []) as AnyRow[]
  ).map((row) => withSourceTable(row, "university_assignments"));
  const academyStepProgress = (
    (academyStepProgressResult.data || []) as AnyRow[]
  ).map((row) => withSourceTable(row, "academy_step_progress"));
  const academyMaterialProgress = (
    (academyMaterialProgressResult.data || []) as AnyRow[]
  ).map((row) => withSourceTable(row, "academy_material_progress"));
  const academyStepMaterials = (
    (academyStepMaterialsResult.data || []) as AnyRow[]
  ).map((row) => withSourceTable(row, "academy_step_materials"));
  const ambassadorTrainingSteps = (
    (ambassadorTrainingStepsResult.data || []) as AnyRow[]
  ).map((row) => withSourceTable(row, "ambassador_training_steps"));
  const academyCertifications = (
    (academyCertificationsResult.data || []) as AnyRow[]
  ).map((row) => withSourceTable(row, "academy_certifications"));

  const personMap = buildPersonMap(personRows);
  const requirements = buildAcademyRequirements(
    ambassadorTrainingSteps,
    academyStepMaterials,
  );

  const buckets = new Map<string, ProgressBucket>();

  for (const row of academyAssignments) addAssignmentToBucket(buckets, row);
  for (const row of universityAssignments) addAssignmentToBucket(buckets, row);
  for (const row of academyStepProgress) addStepProgressToBucket(buckets, row);
  for (const row of academyMaterialProgress) addMaterialProgressToBucket(buckets, row);

  for (const row of academyCertifications) {
    const userId = getUserId(row);
    if (!userId) continue;

    const academyType = getAcademyType(row);
    const bucket = getOrCreateBucket(buckets, userId, academyType);
    const issuedAt = getDate(row, ["issued_at", "certificate_sent_at", "created_at"]);
    const status = getText(row, ["certificate_status", "badge_status", "status"], "");

    if (issuedAt || isCompletedStatus(status)) {
      bucket.completedAt = bucket.completedAt || issuedAt;
      bucket.assignmentProgress = Math.max(bucket.assignmentProgress, 100);
    }

    bucket.updatedAt = getLatestDate(bucket.updatedAt, getUpdatedAt(row), issuedAt);
    bucket.sourceTables.add(getSource(row));
  }

  const records = Array.from(buckets.values())
    .map((bucket) => normalizeRecord(bucket, personMap, requirements))
    .sort((a, b) => {
      const academyCompare = a.academy.localeCompare(b.academy);
      if (academyCompare !== 0) return academyCompare;

      if (b.progress !== a.progress) return b.progress - a.progress;

      const dateA = new Date(a.updatedAt || a.assignedAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.assignedAt || 0).getTime();

      return dateB - dateA;
    });

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
              status, completion percentage, avatar, completed videos, and last
              activity.
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