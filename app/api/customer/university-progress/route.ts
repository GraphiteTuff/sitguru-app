import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type UniversityProgress = {
  totalSteps: number;
  completedSteps: number;
  totalMaterials: number;
  acknowledgedMaterials: number;
  requiredMaterials: number;
  progressPercent: number;
  isStarted: boolean;
  isComplete: boolean;
  certificationLabel: string;
  badgeStatus: string;
  progressHelper: string;
  universityTileHelper: string;
  academyButtonLabel: string;
};

const defaultUniversityProgress: UniversityProgress = {
  totalSteps: 1,
  completedSteps: 0,
  totalMaterials: 0,
  acknowledgedMaterials: 0,
  requiredMaterials: 0,
  progressPercent: 0,
  isStarted: false,
  isComplete: false,
  certificationLabel: "Certified Pet Parent: Not started",
  badgeStatus: "Locked",
  progressHelper:
    "Watch the intro video, review the guide, and acknowledge completion.",
  universityTileHelper: "Start Easy as 1, 2, 3",
  academyButtonLabel: "Start Pet Parent Academy",
};

function isRequired(row: AnyRow) {
  return row.is_required !== false;
}

function isCompletedStep(row: AnyRow) {
  const status = String(row.status || "").trim().toLowerCase();

  return Boolean(
    row.completed_at ||
      status === "completed" ||
      status === "complete" ||
      status === "done",
  );
}

function buildProgress({
  completedSteps,
  totalSteps,
  totalMaterials,
  requiredMaterials,
  acknowledgedMaterials,
}: {
  completedSteps: number;
  totalSteps: number;
  totalMaterials: number;
  requiredMaterials: number;
  acknowledgedMaterials: number;
}): UniversityProgress {
  const normalizedTotalSteps = totalSteps || 1;
  const normalizedRequiredMaterials = requiredMaterials || totalMaterials;

  const isComplete =
    normalizedTotalSteps > 0 && completedSteps >= normalizedTotalSteps;
  const isStarted = completedSteps > 0 || acknowledgedMaterials > 0;

  const progressPercent =
    normalizedTotalSteps > 0
      ? Math.round((completedSteps / normalizedTotalSteps) * 100)
      : 0;

  return {
    totalSteps: normalizedTotalSteps,
    completedSteps,
    totalMaterials,
    acknowledgedMaterials,
    requiredMaterials: normalizedRequiredMaterials,
    progressPercent,
    isStarted,
    isComplete,
    certificationLabel: isComplete
      ? "Certified Pet Parent: Completed"
      : isStarted
        ? "Certified Pet Parent: In progress"
        : "Certified Pet Parent: Not started",
    badgeStatus: isComplete
      ? "Certified Pet Parent"
      : isStarted
        ? "In progress"
        : "Locked",
    progressHelper: isComplete
      ? "Certified Pet Parent complete"
      : isStarted
        ? `${acknowledgedMaterials} of ${normalizedRequiredMaterials} required materials acknowledged`
        : "Watch the intro video, review the guide, and acknowledge completion.",
    universityTileHelper: isComplete
      ? "View certification"
      : isStarted
        ? "Continue Easy as 1, 2, 3"
        : "Start Easy as 1, 2, 3",
    academyButtonLabel: isComplete
      ? "Review Pet Parent Academy"
      : isStarted
        ? "Continue Pet Parent Academy"
        : "Start Pet Parent Academy",
  };
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Not authenticated.",
        progress: defaultUniversityProgress,
      },
      { status: 401 },
    );
  }

  try {
    const [
      stepsResult,
      materialsResult,
      materialProgressResult,
      stepProgressResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("ambassador_training_steps")
        .select("id, step_number, title, is_active")
        .eq("academy_type", "pet_parent")
        .eq("is_active", true)
        .order("step_number", { ascending: true }),

      supabaseAdmin
        .from("academy_step_materials")
        .select("id, training_step_id, title, content_type, is_required, is_active")
        .eq("academy_type", "pet_parent")
        .eq("is_active", true),

      supabaseAdmin
        .from("academy_material_progress")
        .select("material_id, training_step_id, acknowledged_at")
        .eq("academy_type", "pet_parent")
        .eq("user_id", user.id)
        .not("acknowledged_at", "is", null),

      supabaseAdmin
        .from("academy_step_progress")
        .select("training_step_id, status, completed_at")
        .eq("academy_type", "pet_parent")
        .eq("user_id", user.id),
    ]);

    if (stepsResult.error) throw stepsResult.error;
    if (materialsResult.error) throw materialsResult.error;
    if (materialProgressResult.error) throw materialProgressResult.error;
    if (stepProgressResult.error) throw stepProgressResult.error;

    const activeSteps = Array.isArray(stepsResult.data)
      ? (stepsResult.data as AnyRow[])
      : [];

    const firstActiveStep = activeSteps[0] || null;
    const orientationStepId = String(firstActiveStep?.id || "");

    const activeMaterials = Array.isArray(materialsResult.data)
      ? (materialsResult.data as AnyRow[])
      : [];

    const orientationMaterials = orientationStepId
      ? activeMaterials.filter(
          (material) =>
            String(material.training_step_id || "") === orientationStepId,
        )
      : activeMaterials;

    const requiredMaterials = orientationMaterials.filter(isRequired);

    const visibleMaterialIds = new Set(
      orientationMaterials
        .map((material) => String(material.id))
        .filter(Boolean),
    );

    const materialProgress = Array.isArray(materialProgressResult.data)
      ? (materialProgressResult.data as AnyRow[])
      : [];

    const acknowledgedMaterials = materialProgress.filter(
      (row) =>
        Boolean(row.acknowledged_at) &&
        visibleMaterialIds.has(String(row.material_id || "")),
    ).length;

    const stepProgress = Array.isArray(stepProgressResult.data)
      ? (stepProgressResult.data as AnyRow[])
      : [];

    const completedSteps = stepProgress.filter((row) => {
      if (!isCompletedStep(row)) return false;

      if (!orientationStepId) return true;

      return String(row.training_step_id || "") === orientationStepId;
    }).length;

    const progress = buildProgress({
      totalSteps: 1,
      completedSteps: completedSteps > 0 ? 1 : 0,
      totalMaterials: orientationMaterials.length,
      requiredMaterials: requiredMaterials.length,
      acknowledgedMaterials,
    });

    return NextResponse.json(
      {
        ok: true,
        progress,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.warn("Unable to load Pet Parent Academy dashboard progress:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to load Pet Parent Academy progress.",
        progress: defaultUniversityProgress,
      },
      { status: 500 },
    );
  }
}