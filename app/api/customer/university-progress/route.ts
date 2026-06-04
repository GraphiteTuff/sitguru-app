import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type AcademyStepRow = {
  id: string;
  academy_type?: string | null;
  step_number?: number | null;
  title?: string | null;
  is_active?: boolean | null;
};

type AcademyMaterialRow = {
  id: string;
  training_step_id?: string | null;
  academy_type?: string | null;
  is_required?: boolean | null;
  is_active?: boolean | null;
};

type AcademyMaterialProgressRow = {
  id?: string;
  user_id?: string | null;
  training_step_id?: string | null;
  material_id?: string | null;
  academy_type?: string | null;
  acknowledged_at?: string | null;
};

type AcademyStepProgressRow = {
  id?: string;
  user_id?: string | null;
  training_step_id?: string | null;
  academy_type?: string | null;
  status?: string | null;
  acknowledged_at?: string | null;
  completed_at?: string | null;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isCompletedStep(row: AcademyStepProgressRow) {
  const status = asString(row.status).toLowerCase();

  return Boolean(
    row.completed_at ||
      status === "completed" ||
      status === "complete" ||
      status === "done",
  );
}

function getAcademyStatus({
  completedSteps,
  totalSteps,
}: {
  completedSteps: number;
  totalSteps: number;
}) {
  if (totalSteps > 0 && completedSteps >= totalSteps) {
    return {
      status: "completed",
      label: "Certified Pet Parent: Completed",
      badgeStatus: "Certified Pet Parent",
      badgeLocked: false,
      actionLabel: "Review Pet Parent Academy",
    };
  }

  if (completedSteps > 0) {
    return {
      status: "in_progress",
      label: "Certified Pet Parent: In progress",
      badgeStatus: "Locked",
      badgeLocked: true,
      actionLabel: "Continue Pet Parent Academy",
    };
  }

  return {
    status: "not_started",
    label: "Certified Pet Parent: Not started",
    badgeStatus: "Locked",
    badgeLocked: true,
    actionLabel: "Start Pet Parent Academy",
  };
}

async function safeSelect<T>({
  table,
  select,
  filter,
}: {
  table: string;
  select: string;
  filter?: (query: any) => any;
}) {
  try {
    const baseQuery = supabaseAdmin.from(table).select(select);
    const query = filter ? filter(baseQuery) : baseQuery;
    const { data, error } = await query;

    if (error) {
      console.warn(`University progress query skipped for ${table}:`, error);
      return [] as T[];
    }

    return Array.isArray(data) ? (data as T[]) : [];
  } catch (error) {
    console.warn(`University progress query failed for ${table}:`, error);
    return [] as T[];
  }
}

export async function GET() {
  try {
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
        },
        { status: 401 },
      );
    }

    const academyType = "pet_parent";

    const [steps, materials, materialProgress, stepProgress] =
      await Promise.all([
        safeSelect<AcademyStepRow>({
          table: "ambassador_training_steps",
          select: "id, academy_type, step_number, title, is_active",
          filter: (query) =>
            query
              .eq("academy_type", academyType)
              .eq("is_active", true)
              .order("step_number", { ascending: true }),
        }),

        safeSelect<AcademyMaterialRow>({
          table: "academy_step_materials",
          select:
            "id, training_step_id, academy_type, is_required, is_active",
          filter: (query) =>
            query
              .eq("academy_type", academyType)
              .eq("is_active", true)
              .order("sort_order", { ascending: true }),
        }),

        safeSelect<AcademyMaterialProgressRow>({
          table: "academy_material_progress",
          select:
            "id, user_id, training_step_id, material_id, academy_type, acknowledged_at",
          filter: (query) =>
            query
              .eq("academy_type", academyType)
              .eq("user_id", user.id),
        }),

        safeSelect<AcademyStepProgressRow>({
          table: "academy_step_progress",
          select:
            "id, user_id, training_step_id, academy_type, status, acknowledged_at, completed_at",
          filter: (query) =>
            query
              .eq("academy_type", academyType)
              .eq("user_id", user.id),
        }),
      ]);

    const activeSteps = steps.filter((step) => step.is_active !== false);
    const activeMaterials = materials.filter(
      (material) => material.is_active !== false,
    );

    const requiredMaterials = activeMaterials.filter(
      (material) => material.is_required !== false,
    );

    const acknowledgedMaterialIds = new Set(
      materialProgress
        .filter((progress) => Boolean(progress.acknowledged_at))
        .map((progress) => asString(progress.material_id))
        .filter(Boolean),
    );

    const acknowledgedRequiredMaterials = requiredMaterials.filter((material) =>
      acknowledgedMaterialIds.has(material.id),
    );

    const completedStepIds = new Set(
      stepProgress
        .filter(isCompletedStep)
        .map((progress) => asString(progress.training_step_id))
        .filter(Boolean),
    );

    const completedSteps = activeSteps.filter((step) =>
      completedStepIds.has(step.id),
    );

    const totalSteps = activeSteps.length || 9;
    const completedStepCount = completedSteps.length;
    const totalMaterials = activeMaterials.length;
    const requiredMaterialCount = requiredMaterials.length;
    const acknowledgedRequiredMaterialCount =
      acknowledgedRequiredMaterials.length;

    const progressPercent =
      totalSteps > 0
        ? Math.round((completedStepCount / totalSteps) * 100)
        : 0;

    const materialPercent =
      requiredMaterialCount > 0
        ? Math.round(
            (acknowledgedRequiredMaterialCount / requiredMaterialCount) * 100,
          )
        : 0;

    const academyStatus = getAcademyStatus({
      completedSteps: completedStepCount,
      totalSteps,
    });

    return NextResponse.json(
      {
        ok: true,
        academyType,
        userId: user.id,
        totalSteps,
        completedSteps: completedStepCount,
        progressPercent,
        totalMaterials,
        requiredMaterials: requiredMaterialCount,
        acknowledgedRequiredMaterials: acknowledgedRequiredMaterialCount,
        materialPercent,
        status: academyStatus.status,
        certificationLabel: academyStatus.label,
        badgeStatus: academyStatus.badgeStatus,
        badgeLocked: academyStatus.badgeLocked,
        actionLabel: academyStatus.actionLabel,
        helperText:
          completedStepCount > 0
            ? `${completedStepCount} of ${totalSteps} academy steps complete`
            : "Start the academy to begin tracking",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Customer university progress API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load university progress.",
      },
      { status: 500 },
    );
  }
}