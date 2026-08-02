import { supabaseAdmin } from "@/lib/supabase/admin";

export type UniversityAcademyType = "pet_parent" | "guru" | "ambassador" | "all";

export type UniversitySourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  rowCount: number;
  message: string;
};

export type UniversityMetrics = {
  steps: number;
  activeSteps: number;
  materials: number;
  activeMaterials: number;
  requiredMaterials: number;
  assignments: number;
  activeAssignments: number;
  certifications: number;
  ambassadorProgressRows: number;
  academyProgressRows: number;
  petParentSteps: number;
  guruSteps: number;
  ambassadorSteps: number;
};

export type UniversityRecentItem = {
  id: string;
  title: string;
  subtitle: string;
  academy: string;
  status: string;
  date: string | null;
  href: string;
};

export type UniversityDashboardData = {
  metrics: UniversityMetrics;
  sourceHealth: UniversitySourceHealth[];
  recentSteps: UniversityRecentItem[];
  recentAssignments: UniversityRecentItem[];
  recentCertifications: UniversityRecentItem[];
  isLive: boolean;
};

type AnyRow = Record<string, unknown>;

type SafeResult = {
  data: AnyRow[];
  ok: boolean;
  message: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return fallback;
}

function getDate(row: AnyRow) {
  return (
    asString(row.updated_at) ||
    asString(row.issued_at) ||
    asString(row.assigned_at) ||
    asString(row.completed_at) ||
    asString(row.created_at) ||
    null
  );
}

function normalizeAcademy(value: unknown) {
  const raw = asString(value).toLowerCase();
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
  return raw || "unknown";
}

function academyLabel(value: string) {
  if (value === "pet_parent") return "Pet Parent";
  if (value === "guru") return "Guru";
  if (value === "ambassador") return "Ambassador";
  return "Academy";
}

async function safeSelect(
  table: string,
  columns = "*",
  limit = 2000,
): Promise<SafeResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .limit(limit);

    if (error) {
      return {
        data: [],
        ok: false,
        message: error.message || `${table} unavailable`,
      };
    }

    return {
      data: Array.isArray(data) ? (data as AnyRow[]) : [],
      ok: true,
      message: `${table} connected`,
    };
  } catch (error) {
    return {
      data: [],
      ok: false,
      message: error instanceof Error ? error.message : `${table} unavailable`,
    };
  }
}

export async function getUniversityDashboardData(): Promise<UniversityDashboardData> {
  const [
    stepsResult,
    materialsResult,
    assignmentsResult,
    certificationsResult,
    ambassadorProgressResult,
    academyStepProgressResult,
  ] = await Promise.all([
    safeSelect("ambassador_training_steps"),
    safeSelect("academy_step_materials"),
    safeSelect("academy_assignments"),
    safeSelect("academy_certifications"),
    safeSelect("ambassador_training_progress"),
    safeSelect("academy_step_progress"),
  ]);

  const steps = stepsResult.data;
  const materials = materialsResult.data;
  const assignments = assignmentsResult.data;
  const certifications = certificationsResult.data;

  const isActive = (row: AnyRow) => {
    if (
      row.is_active === false ||
      row.is_active === "false" ||
      row.is_active === 0
    ) {
      return false;
    }
    return true;
  };

  const liveSteps = steps.filter(isActive);
  const liveMaterials = materials.filter(isActive);
  const liveAssignments = assignments.filter(isActive);

  const metrics: UniversityMetrics = {
    steps: steps.length,
    activeSteps: liveSteps.length,
    materials: materials.length,
    activeMaterials: liveMaterials.length,
    requiredMaterials: liveMaterials.filter(
      (row) => row.is_required !== false && row.is_required !== "false",
    ).length,
    assignments: assignments.length,
    activeAssignments: liveAssignments.length,
    certifications: certifications.length,
    ambassadorProgressRows: ambassadorProgressResult.data.length,
    academyProgressRows: academyStepProgressResult.data.length,
    petParentSteps: liveSteps.filter(
      (row) => normalizeAcademy(row.academy_type) === "pet_parent",
    ).length,
    guruSteps: liveSteps.filter(
      (row) => normalizeAcademy(row.academy_type) === "guru",
    ).length,
    ambassadorSteps: liveSteps.filter(
      (row) => normalizeAcademy(row.academy_type) === "ambassador",
    ).length,
  };

  const sourceHealth: UniversitySourceHealth[] = [
    {
      id: "ambassador_training_steps",
      label: "Curriculum Steps",
      ok: stepsResult.ok,
      rowCount: steps.length,
      message: stepsResult.message,
    },
    {
      id: "academy_step_materials",
      label: "Step Materials",
      ok: materialsResult.ok,
      rowCount: materials.length,
      message: materialsResult.message,
    },
    {
      id: "academy_assignments",
      label: "Academy Assignments",
      ok: assignmentsResult.ok,
      rowCount: assignments.length,
      message: assignmentsResult.message,
    },
    {
      id: "academy_certifications",
      label: "Certifications",
      ok: certificationsResult.ok,
      rowCount: certifications.length,
      message: certificationsResult.message,
    },
    {
      id: "ambassador_training_progress",
      label: "Ambassador Progress",
      ok: ambassadorProgressResult.ok,
      rowCount: ambassadorProgressResult.data.length,
      message: ambassadorProgressResult.message,
    },
    {
      id: "academy_step_progress",
      label: "Academy Step Progress",
      ok: academyStepProgressResult.ok,
      rowCount: academyStepProgressResult.data.length,
      message: academyStepProgressResult.message,
    },
  ];

  const recentSteps = [...steps]
    .sort(
      (a, b) =>
        new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime(),
    )
    .slice(0, 6)
    .map((row, index) => {
      const academy = normalizeAcademy(row.academy_type);
      return {
        id: getText(row, ["id"], `step-${index}`),
        title: getText(row, ["title"], "Training step"),
        subtitle: `Step ${getText(row, ["step_number"], "—")} · ${
          isActive(row) ? "Active" : "Inactive"
        }`,
        academy: academyLabel(academy),
        status: isActive(row) ? "Live" : "Off",
        date: getDate(row),
        href: `/admin/ambassador-training/manage?academy=${academy}`,
      };
    });

  const recentAssignments = [...assignments]
    .sort(
      (a, b) =>
        new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime(),
    )
    .slice(0, 6)
    .map((row, index) => {
      const academy = normalizeAcademy(row.academy_type);
      const userId = getText(row, ["user_id"]);
      return {
        id: getText(row, ["id"], `assignment-${index}`),
        title: academyLabel(academy) + " Academy",
        subtitle: userId || "Assigned learner",
        academy: academyLabel(academy),
        status:
          row.certificate_issued === true ||
          row.certificate_issued === "true" ||
          row.certificate_issued === 1
            ? "Certified"
            : asString(row.completed_at)
              ? "Completed"
              : "Assigned",
        date: getDate(row),
        href: userId
          ? `/admin/university-assignments?user=${encodeURIComponent(userId)}`
          : "/admin/university-assignments",
      };
    });

  const recentCertifications = [...certifications]
    .sort(
      (a, b) =>
        new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime(),
    )
    .slice(0, 6)
    .map((row, index) => {
      const academy = normalizeAcademy(row.academy_type);
      return {
        id: getText(row, ["id"], `cert-${index}`),
        title: getText(
          row,
          ["certification_name", "badge_name"],
          `${academyLabel(academy)} Certified`,
        ),
        subtitle: getText(row, ["user_id", "email"], "Learner"),
        academy: academyLabel(academy),
        status: getText(row, ["badge_status", "certificate_status"], "Issued"),
        date: getDate(row),
        href: "/admin/university-progress",
      };
    });

  return {
    metrics,
    sourceHealth,
    recentSteps,
    recentAssignments,
    recentCertifications,
    isLive: sourceHealth.some((source) => source.ok),
  };
}
