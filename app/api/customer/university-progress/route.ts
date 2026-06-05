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
  totalSteps: 3,
  completedSteps: 0,
  totalMaterials: 0,
  acknowledgedMaterials: 0,
  requiredMaterials: 0,
  progressPercent: 0,
  isStarted: false,
  isComplete: false,
  certificationLabel: "Certified Pet Parent: Not started",
  badgeStatus: "Locked",
  progressHelper: "Start with Step 1: watch the intro video",
  universityTileHelper: "Start 1, 2, 3",
  academyButtonLabel: "Start Pet Parent Academy",
};

function isRequired(row: AnyRow) {
  return row.is_required !== false;
}

function isCompletedStep(row: AnyRow) {
  return (
    Boolean(row.completed_at) ||
    String(row.status || "").toLowerCase() === "completed"
  );
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
        .select("id, step_number")
        .eq("academy_type", "pet_parent")
        .eq("is_active", true)
        .lte("step_number", 3),
      supabaseAdmin
        .from("academy_step_materials")
        .select("id, training_step_id, is_required")
        .eq("academy_type", "pet_parent")
        .eq("is_active", true),
      supabaseAdmin
        .from("academy_material_progress")
        .select("material_id, acknowledged_at")
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

    const steps = Array.isArray(stepsResult.data)
      ? (stepsResult.data as AnyRow[])
      : [];

    const materials = Array.isArray(materialsResult.data)
      ? (materialsResult.data as AnyRow[])
      : [];

    const materialProgress = Array.isArray(materialProgressResult.data)
      ? (materialProgressResult.data as AnyRow[])
      : [];

    const stepProgress = Array.isArray(stepProgressResult.data)
      ? (stepProgressResult.data as AnyRow[])
      : [];

    const activeStepIds = new Set(
      steps.map((step) => String(step.id)).filter(Boolean),
    );

    const visibleMaterials = materials.filter((material) =>
      activeStepIds.has(String(material.training_step_id || "")),
    );

    const visibleMaterialIds = new Set(
      visibleMaterials.map((material) => String(material.id)).filter(Boolean),
    );

    const totalSteps = steps.length || 3;
    const totalMaterials = visibleMaterials.length;
    const requiredMaterials = visibleMaterials.filter(isRequired).length;

    const acknowledgedMaterials = materialProgress.filter(
      (row) =>
        Boolean(row.acknowledged_at) &&
        visibleMaterialIds.has(String(row.material_id || "")),
    ).length;

    const completedSteps = stepProgress.filter(isCompletedStep).length;

    const progressPercent =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    const isComplete = totalSteps > 0 && completedSteps >= totalSteps;
    const isStarted = completedSteps > 0 || acknowledgedMaterials > 0;

    const progress: UniversityProgress = {
      totalSteps,
      completedSteps,
      totalMaterials,
      acknowledgedMaterials,
      requiredMaterials,
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
          ? `${acknowledgedMaterials} of ${
              requiredMaterials || totalMaterials
            } materials acknowledged`
          : "Start with Step 1: watch the intro video",
      universityTileHelper: isComplete
        ? "View certificate"
        : isStarted
          ? "Continue academy"
          : "Start 1, 2, 3",
      academyButtonLabel: isComplete
        ? "Review Pet Parent Academy"
        : isStarted
          ? "Continue Pet Parent Academy"
          : "Start Pet Parent Academy",
    };

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