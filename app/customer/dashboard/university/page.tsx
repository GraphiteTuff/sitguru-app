import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  ImageIcon,
  LinkIcon,
  LockKeyhole,
  PawPrint,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type TrainingStep = {
  id: string;
  academy_type?: string | null;
  step_number: number;
  title: string;
  description?: string | null;
  estimated_minutes?: number | null;
  is_required?: boolean | null;
  is_active?: boolean | null;
  requires_acknowledgment?: boolean | null;
};

type TrainingMaterial = {
  id: string;
  training_step_id?: string | null;
  academy_type?: string | null;
  title: string;
  description?: string | null;
  content_type?: string | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  external_url?: string | null;
  video_url?: string | null;
  sort_order?: number | null;
  is_required?: boolean | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type MaterialProgress = {
  training_step_id?: string | null;
  material_id?: string | null;
  acknowledged_at?: string | null;
};

type StepProgress = {
  training_step_id?: string | null;
  status?: string | null;
  completed_at?: string | null;
};

type MaterialWithUrl = TrainingMaterial & {
  openUrl: string;
  downloadUrl: string;
  acknowledgedAt: string | null;
  isAcknowledged: boolean;
  displayStepNumber: 1 | 2;
  displayStepTitle: string;
  displayStepDescription: string;
};

type PetParentUniversityData = {
  primaryStep: TrainingStep | null;
  materials: MaterialWithUrl[];
  completedAt: string | null;
  isCompleted: boolean;
  totalMaterials: number;
  requiredMaterials: number;
  acknowledgedMaterials: number;
  acknowledgedRequiredMaterials: number;
  readyForCertification: boolean;
};

const academyType = "pet_parent";

const customerRoutes = {
  dashboard: "/customer/dashboard",
  university: "/customer/dashboard/university",
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function asBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "yes";
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(value: string) {
  const parts = value
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  return `${parts[0]?.charAt(0) || "P"}${parts[1]?.charAt(0) || "P"}`.toUpperCase();
}

function getDisplayName(profile: AnyRow | null, email: string) {
  const firstName = asString(profile?.first_name);
  const lastName = asString(profile?.last_name);
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();

  return (
    combined ||
    asString(profile?.full_name) ||
    asString(profile?.display_name) ||
    email ||
    "Pet Parent"
  );
}

function getContentTypeLabel(value?: string | null) {
  const normalized = asString(value).toLowerCase();

  if (normalized === "video") return "Video";
  if (normalized === "ppt" || normalized === "powerpoint") return "PowerPoint";
  if (normalized === "pdf") return "PDF";
  if (normalized === "document") return "Document";
  if (normalized === "image") return "Image / Slide";
  if (normalized === "link") return "Link";
  if (normalized === "quiz") return "Quiz";
  if (normalized === "certification") return "Certification";

  return "Training";
}

function getMaterialIcon(type?: string | null) {
  const normalized = asString(type).toLowerCase();

  if (normalized === "video") return <PlayCircle size={18} />;
  if (normalized === "image") return <ImageIcon size={18} />;
  if (normalized === "link") return <LinkIcon size={18} />;
  if (normalized === "certification") return <BadgeCheck size={18} />;

  return <FileText size={18} />;
}

function sortMaterials(a: TrainingMaterial, b: TrainingMaterial) {
  const aSort = asNumber(a.sort_order) || 999;
  const bSort = asNumber(b.sort_order) || 999;

  if (aSort !== bSort) return aSort - bSort;

  return asString(a.title).localeCompare(asString(b.title), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getExternalMaterialUrl(material: TrainingMaterial) {
  return asString(material.video_url) || asString(material.external_url);
}

function isVideoMaterial(material: TrainingMaterial) {
  return asString(material.content_type).toLowerCase() === "video";
}

function getDisplayStepForMaterial(material: TrainingMaterial): {
  displayStepNumber: 1 | 2;
  displayStepTitle: string;
  displayStepDescription: string;
} {
  if (isVideoMaterial(material)) {
    return {
      displayStepNumber: 1,
      displayStepTitle: "Watch the Intro Video",
      displayStepDescription:
        "Start here. Watch the SitGuru intro video so you understand how trusted pet care works on the platform.",
    };
  }

  return {
    displayStepNumber: 2,
    displayStepTitle: "Review the Pet Parent Guide",
    displayStepDescription:
      "Review the Pet Parent guide, slides, and support materials before completing your certification acknowledgment.",
  };
}

async function getSignedMaterialUrls(material: TrainingMaterial) {
  const externalUrl = getExternalMaterialUrl(material);

  if (externalUrl) {
    return {
      openUrl: externalUrl,
      downloadUrl: externalUrl,
    };
  }

  const bucket = asString(material.storage_bucket);
  const path = asString(material.storage_path);

  if (!bucket || !path) {
    return {
      openUrl: "",
      downloadUrl: "",
    };
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60);

    if (error || !data?.signedUrl) {
      console.warn("Unable to create signed SitGuru University material URL:", {
        bucket,
        path,
        error,
      });

      return {
        openUrl: "",
        downloadUrl: "",
      };
    }

    return {
      openUrl: data.signedUrl,
      downloadUrl: data.signedUrl,
    };
  } catch (error) {
    console.warn("Unable to create signed SitGuru University material URL:", {
      bucket,
      path,
      error,
    });

    return {
      openUrl: "",
      downloadUrl: "",
    };
  }
}

async function getProfile(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) return null;

    return (data || null) as AnyRow | null;
  } catch {
    return null;
  }
}

async function getProgressRows(userId: string) {
  const [materialProgressResult, stepProgressResult] = await Promise.all([
    supabaseAdmin
      .from("academy_material_progress")
      .select("training_step_id,material_id,acknowledged_at")
      .eq("user_id", userId)
      .eq("academy_type", academyType),
    supabaseAdmin
      .from("academy_step_progress")
      .select("training_step_id,status,completed_at")
      .eq("user_id", userId)
      .eq("academy_type", academyType),
  ]);

  if (materialProgressResult.error) {
    console.warn(
      "Unable to load Pet Parent Academy material progress:",
      materialProgressResult.error,
    );
  }

  if (stepProgressResult.error) {
    console.warn(
      "Unable to load Pet Parent Academy step progress:",
      stepProgressResult.error,
    );
  }

  return {
    materialProgressRows: (materialProgressResult.data || []) as MaterialProgress[],
    stepProgressRows: (stepProgressResult.data || []) as StepProgress[],
  };
}

function getCompletedAtForPrimaryStep({
  primaryStep,
  stepProgressRows,
}: {
  primaryStep: TrainingStep | null;
  stepProgressRows: StepProgress[];
}) {
  if (!primaryStep) return null;

  const matchingProgress = stepProgressRows.find((row) => {
    const status = asString(row.status).toLowerCase();

    return (
      asString(row.training_step_id) === primaryStep.id &&
      (Boolean(row.completed_at) || status === "completed")
    );
  });

  return asString(matchingProgress?.completed_at) || null;
}

async function getPetParentUniversityData(
  userId: string,
): Promise<PetParentUniversityData> {
  const [stepsResult, materialsResult, progressResult] = await Promise.all([
    supabaseAdmin
      .from("ambassador_training_steps")
      .select("*")
      .eq("academy_type", academyType)
      .eq("is_active", true)
      .order("step_number", { ascending: true }),
    supabaseAdmin
      .from("academy_step_materials")
      .select("*")
      .eq("academy_type", academyType)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    getProgressRows(userId),
  ]);

  if (stepsResult.error) {
    console.warn("Unable to load Pet Parent Academy steps:", stepsResult.error);
  }

  if (materialsResult.error) {
    console.warn(
      "Unable to load Pet Parent Academy materials:",
      materialsResult.error,
    );
  }

  const steps = ((stepsResult.data || []) as TrainingStep[]).sort(
    (a, b) => asNumber(a.step_number) - asNumber(b.step_number),
  );
  const materials = ((materialsResult.data || []) as TrainingMaterial[]).sort(
    sortMaterials,
  );

  const primaryStep = steps[0] || null;
  const activeStepIds = new Set(steps.map((step) => step.id).filter(Boolean));

  const materialProgressByMaterialId = new Map<string, MaterialProgress>();

  progressResult.materialProgressRows.forEach((row) => {
    const materialId = asString(row.material_id);
    if (materialId) materialProgressByMaterialId.set(materialId, row);
  });

  const visibleMaterials = activeStepIds.size
    ? materials.filter((material) =>
        activeStepIds.has(asString(material.training_step_id)),
      )
    : materials;

  const materialsWithUrls: MaterialWithUrl[] = [];

  for (const material of visibleMaterials) {
    const signedUrls = await getSignedMaterialUrls(material);
    const materialProgress = materialProgressByMaterialId.get(material.id);
    const acknowledgedAt = asString(materialProgress?.acknowledged_at) || null;
    const displayStep = getDisplayStepForMaterial(material);

    materialsWithUrls.push({
      ...material,
      ...signedUrls,
      ...displayStep,
      acknowledgedAt,
      isAcknowledged: Boolean(acknowledgedAt),
    });
  }

  const totalMaterials = materialsWithUrls.length;
  const requiredMaterials = materialsWithUrls.filter(
    (material) => material.is_required !== false,
  ).length;
  const acknowledgedMaterials = materialsWithUrls.filter(
    (material) => material.isAcknowledged,
  ).length;
  const acknowledgedRequiredMaterials = materialsWithUrls.filter(
    (material) => material.is_required !== false && material.isAcknowledged,
  ).length;
  const completedAt = getCompletedAtForPrimaryStep({
    primaryStep,
    stepProgressRows: progressResult.stepProgressRows,
  });
  const readyForCertification =
    requiredMaterials > 0 && acknowledgedRequiredMaterials >= requiredMaterials;

  return {
    primaryStep,
    materials: materialsWithUrls,
    completedAt,
    isCompleted: Boolean(completedAt),
    totalMaterials,
    requiredMaterials,
    acknowledgedMaterials,
    acknowledgedRequiredMaterials,
    readyForCertification,
  };
}

async function acknowledgeMaterial(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const materialId = asString(formData.get("material_id"));
  const trainingStepId = asString(formData.get("training_step_id"));
  const acknowledged = asBoolean(formData.get("acknowledgment"));

  if (!materialId || !trainingStepId || !acknowledged) {
    redirect(`${customerRoutes.university}?error=acknowledgment`);
  }

  const now = new Date().toISOString();

  const { error: upsertError } = await supabaseAdmin
    .from("academy_material_progress")
    .upsert(
      {
        user_id: user.id,
        training_step_id: trainingStepId,
        material_id: materialId,
        academy_type: academyType,
        acknowledged_at: now,
        updated_at: now,
      },
      { onConflict: "user_id,material_id" },
    );

  if (upsertError) {
    console.warn("Unable to acknowledge Pet Parent Academy material:", upsertError);
    redirect(`${customerRoutes.university}?error=progress`);
  }

  revalidatePath(customerRoutes.university);
  revalidatePath(customerRoutes.dashboard);
  redirect(`${customerRoutes.university}?acknowledged=success`);
}

async function completeOrientation(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const trainingStepId = asString(formData.get("training_step_id"));

  if (!trainingStepId) {
    redirect(`${customerRoutes.university}?error=step`);
  }

  const activeStepsResult = await supabaseAdmin
    .from("ambassador_training_steps")
    .select("id")
    .eq("academy_type", academyType)
    .eq("is_active", true);

  const activeStepIds = new Set(
    ((activeStepsResult.data || []) as Array<{ id: string }>).map((step) =>
      step.id,
    ),
  );

  const [{ data: requiredMaterials }, { data: acknowledgedRows }] =
    await Promise.all([
      supabaseAdmin
        .from("academy_step_materials")
        .select("id,training_step_id")
        .eq("academy_type", academyType)
        .eq("is_active", true)
        .eq("is_required", true),
      supabaseAdmin
        .from("academy_material_progress")
        .select("material_id,acknowledged_at")
        .eq("user_id", user.id)
        .eq("academy_type", academyType),
    ]);

  const requiredMaterialIds = new Set(
    ((requiredMaterials || []) as Array<{
      id: string;
      training_step_id: string | null;
    }>)
      .filter((material) => activeStepIds.has(asString(material.training_step_id)))
      .map((material) => material.id),
  );

  const acknowledgedMaterialIds = new Set(
    ((acknowledgedRows || []) as Array<{
      material_id: string | null;
      acknowledged_at: string | null;
    }>)
      .filter((row) => row.material_id && row.acknowledged_at)
      .map((row) => row.material_id as string),
  );

  const missingRequiredAcknowledgment = Array.from(requiredMaterialIds).some(
    (materialId) => !acknowledgedMaterialIds.has(materialId),
  );

  if (missingRequiredAcknowledgment) {
    redirect(`${customerRoutes.university}?error=incomplete`);
  }

  const now = new Date().toISOString();

  const { error: upsertError } = await supabaseAdmin
    .from("academy_step_progress")
    .upsert(
      {
        user_id: user.id,
        training_step_id: trainingStepId,
        academy_type: academyType,
        status: "completed",
        acknowledged_at: now,
        completed_at: now,
        updated_at: now,
      },
      { onConflict: "user_id,training_step_id" },
    );

  if (upsertError) {
    console.warn("Unable to complete Pet Parent Academy orientation:", upsertError);
    redirect(`${customerRoutes.university}?error=progress`);
  }

  revalidatePath(customerRoutes.university);
  revalidatePath(customerRoutes.dashboard);
  redirect(`${customerRoutes.university}?completed=success`);
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getNotice(searchParams?: Record<string, string | string[] | undefined>) {
  const acknowledged = asString(searchParams?.acknowledged);
  const completed = asString(searchParams?.completed);
  const error = asString(searchParams?.error);

  if (acknowledged === "success") {
    return {
      tone: "success" as const,
      title: "Material acknowledged",
      message: "Your training acknowledgment was saved.",
    };
  }

  if (completed === "success") {
    return {
      tone: "success" as const,
      title: "Certified Pet Parent orientation completed",
      message: "Your badge status is now ready to show as completed.",
    };
  }

  if (error === "incomplete") {
    return {
      tone: "error" as const,
      title: "Required acknowledgments still needed",
      message:
        "Acknowledge every required material before completing your Certified Pet Parent orientation.",
    };
  }

  if (error === "acknowledgment") {
    return {
      tone: "error" as const,
      title: "Acknowledgment required",
      message: "Check the acknowledgment box before saving this material.",
    };
  }

  if (error === "progress") {
    return {
      tone: "error" as const,
      title: "Progress could not be saved",
      message:
        "Confirm the academy progress tables exist in Supabase, then try again.",
    };
  }

  if (error) {
    return {
      tone: "error" as const,
      title: "Training progress update failed",
      message: "The academy progress update could not be completed. Please try again.",
    };
  }

  return null;
}

export default async function CustomerUniversityPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const notice = getNotice(resolvedSearchParams);
  const [profile, universityData] = await Promise.all([
    getProfile(user.id),
    getPetParentUniversityData(user.id),
  ]);

  const email = asString(user.email);
  const displayName = getDisplayName(profile, email);
  const firstName = displayName.split(" ")[0] || "Pet Parent";
  const completedCount = universityData.isCompleted ? 1 : 0;
  const progressPercent = universityData.isCompleted
    ? 100
    : universityData.requiredMaterials > 0
      ? Math.round(
          (universityData.acknowledgedRequiredMaterials /
            universityData.requiredMaterials) *
            66,
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#f7fbf7] px-3 py-4 text-[#062f2b] sm:px-5 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
        <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm sm:rounded-[34px]">
          <div className="grid gap-6 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-4 py-6 sm:px-6 md:px-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div>
              <Link
                href={customerRoutes.dashboard}
                className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-white"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>

              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-900/80 sm:text-xs">
                SitGuru University
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
                Learn SitGuru. Easy as 1, 2, 3.
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-900/75 sm:text-base md:text-lg">
                Welcome, {firstName}. Watch the intro video, review the Pet
                Parent guide, then acknowledge completion to earn your Certified
                Pet Parent badge.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
                <TrustBadge icon={<PawPrint size={15} />} label="Pet Parent" />
                <TrustBadge
                  icon={<GraduationCap size={15} />}
                  label={`${completedCount} of 1 orientation complete`}
                />
                <TrustBadge icon={<Star size={15} />} label={`${progressPercent}% ready`} />
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-[7px] border-white bg-white/80 text-4xl font-black text-emerald-800 shadow-2xl sm:h-40 sm:w-40 md:h-48 md:w-48">
                {getInitials(displayName)}
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">
                {displayName}
              </h2>
              <p className="mt-1 text-sm font-black text-slate-700">
                {universityData.isCompleted
                  ? "Certified Pet Parent: Completed"
                  : universityData.acknowledgedRequiredMaterials > 0
                    ? "Certified Pet Parent: In progress"
                    : "Certified Pet Parent: Not started"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 bg-white px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            <DashboardStatCard
              label="Orientation"
              value={`${completedCount} of 1`}
              detail={universityData.isCompleted ? "Completed" : "Finish 1, 2, 3"}
              icon={<BookOpenCheck size={20} />}
            />
            <DashboardStatCard
              label="Materials"
              value={`${number(universityData.acknowledgedRequiredMaterials)} of ${number(universityData.requiredMaterials)}`}
              detail="Required acknowledged"
              icon={<FileText size={20} />}
            />
            <DashboardStatCard
              label="Estimated Time"
              value="6 min"
              detail="Mobile-friendly"
              icon={<Sparkles size={20} />}
            />
            <DashboardStatCard
              label="Badge"
              value={universityData.isCompleted ? "Issued" : "Locked"}
              detail={universityData.isCompleted ? "Certified" : "Complete Step 3"}
              icon={
                universityData.isCompleted ? (
                  <BadgeCheck size={20} />
                ) : (
                  <LockKeyhole size={20} />
                )
              }
            />
          </div>
        </section>

        {notice ? (
          <section
            className={`rounded-[22px] border p-4 text-sm font-bold leading-6 ${
              notice.tone === "success"
                ? "border-green-100 bg-green-50 text-green-900"
                : "border-red-100 bg-red-50 text-red-800"
            }`}
          >
            <p className="font-black">{notice.title}</p>
            <p className="mt-1">{notice.message}</p>
          </section>
        ) : null}

        <section className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700 sm:text-xs">
                Certified Pet Parent Orientation
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                One simple card. Three easy actions.
              </h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                Open each material, review it fully, save your acknowledgments,
                then complete the final certification action. This keeps Pet
                Parent training quick, clear, and mobile friendly.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900">
              {number(universityData.requiredMaterials)} required materials
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <OrientationStepOneAndTwo materials={universityData.materials} />

              <CertificationActionCard
                primaryStep={universityData.primaryStep}
                completedAt={universityData.completedAt}
                isCompleted={universityData.isCompleted}
                readyForCertification={universityData.readyForCertification}
                acknowledgedRequiredMaterials={
                  universityData.acknowledgedRequiredMaterials
                }
                requiredMaterials={universityData.requiredMaterials}
              />
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-[24px] border border-emerald-100 bg-[#fbfffb] p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                  Your path
                </p>
                <div className="mt-4 space-y-3">
                  <ProgressPill
                    step="1"
                    title="Watch video"
                    complete={universityData.materials
                      .filter((material) => material.displayStepNumber === 1)
                      .every((material) => material.isAcknowledged)}
                  />
                  <ProgressPill
                    step="2"
                    title="Review guide"
                    complete={universityData.materials
                      .filter((material) => material.displayStepNumber === 2)
                      .every((material) => material.isAcknowledged)}
                  />
                  <ProgressPill
                    step="3"
                    title="Get certified"
                    complete={universityData.isCompleted}
                  />
                </div>

                <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-950">
                  {universityData.isCompleted
                    ? "You completed the Pet Parent Academy orientation. Your Certified Pet Parent status is ready."
                    : universityData.readyForCertification
                      ? "You reviewed every required material. Complete Step 3 to finish certification."
                      : "Complete Step 1 and Step 2 first. Step 3 unlocks after all required materials are acknowledged."}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <InfoCard
            icon={<ShieldCheck size={21} />}
            title="Honest acknowledgments"
            description="Each required material asks the Pet Parent to confirm they reviewed and understand that specific training portion."
          />
          <InfoCard
            icon={<PawPrint size={21} />}
            title="Built for mobile"
            description="The academy is one simple card with large tap targets, clear steps, and no long confusing lesson list."
          />
          <InfoCard
            icon={<BadgeCheck size={21} />}
            title="Certified Pet Parent"
            description="After Step 3 is completed, the Certified Pet Parent badge and dashboard status can show as completed."
          />
        </section>
      </div>
    </main>
  );
}

function OrientationStepOneAndTwo({
  materials,
}: {
  materials: MaterialWithUrl[];
}) {
  const stepOneMaterials = materials.filter(
    (material) => material.displayStepNumber === 1,
  );
  const stepTwoMaterials = materials.filter(
    (material) => material.displayStepNumber === 2,
  );

  return (
    <div className="space-y-4">
      <OrientationMaterialGroup
        stepNumber={1}
        title="Watch the Intro Video"
        description="Learn what SitGuru is, how trusted pet care works, and why platform safety matters."
        materials={stepOneMaterials}
      />
      <OrientationMaterialGroup
        stepNumber={2}
        title="Review the Pet Parent Guide"
        description="Review the guide, slides, and support materials so you understand profiles, pets, messaging, booking, reviews, and safety."
        materials={stepTwoMaterials}
      />
    </div>
  );
}

function OrientationMaterialGroup({
  stepNumber,
  title,
  description,
  materials,
}: {
  stepNumber: 1 | 2;
  title: string;
  description: string;
  materials: MaterialWithUrl[];
}) {
  const requiredCount = materials.filter(
    (material) => material.is_required !== false,
  ).length;
  const acknowledgedRequiredCount = materials.filter(
    (material) => material.is_required !== false && material.isAcknowledged,
  ).length;
  const groupComplete =
    requiredCount > 0 && acknowledgedRequiredCount >= requiredCount;

  return (
    <section
      className={`rounded-[24px] border p-4 sm:p-5 ${
        groupComplete
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-slate-100 bg-slate-50"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-black text-white">
              Step {stepNumber}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${
                groupComplete
                  ? "border-emerald-200 bg-white text-emerald-900"
                  : "border-amber-100 bg-amber-50 text-amber-900"
              }`}
            >
              {groupComplete ? "Complete" : "Required"}
            </span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-950">
            {title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <MiniBox
          label="Progress"
          value={`${number(acknowledgedRequiredCount)} of ${number(requiredCount)}`}
          detail="Acknowledged"
        />
      </div>

      <div className="mt-4 grid gap-3">
        {materials.length ? (
          materials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-bold leading-6 text-slate-500">
            No material has been added to this part yet.
          </div>
        )}
      </div>
    </section>
  );
}

function MaterialCard({ material }: { material: MaterialWithUrl }) {
  const typeLabel = getContentTypeLabel(material.content_type);
  const hasUrl = Boolean(material.openUrl);
  const trainingStepId = asString(material.training_step_id);

  return (
    <div
      className={`rounded-[22px] border p-4 ${
        material.isAcknowledged
          ? "border-emerald-200 bg-white"
          : "border-slate-100 bg-white"
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-start">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-black text-emerald-900">
              {getMaterialIcon(material.content_type)}
              {typeLabel}
            </span>
            {material.is_required !== false ? (
              <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">
                Required
              </span>
            ) : (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                Optional
              </span>
            )}
            {material.isAcknowledged ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900">
                Acknowledged
              </span>
            ) : null}
          </div>

          <h4 className="text-lg font-black text-slate-950">
            {material.title}
          </h4>
          <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
            {material.description || "Open this material to continue the lesson."}
          </p>
          <p className="mt-2 break-all text-xs font-bold text-slate-400">
            {asString(material.storage_path) ||
              asString(material.external_url) ||
              asString(material.video_url)}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          {hasUrl ? (
            <>
              <a
                href={material.openUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
              >
                <ExternalLink size={16} />
                Open
              </a>
              <a
                href={material.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <Download size={16} />
                View
              </a>
            </>
          ) : (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm font-black text-amber-900">
              Material link unavailable
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-[#fbfffb] p-4">
        {material.isAcknowledged ? (
          <div className="flex items-start gap-3 text-sm font-bold leading-6 text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-black">Acknowledgment saved</p>
              <p className="text-emerald-800">
                You acknowledged this material on {formatDateTime(material.acknowledgedAt)}.
              </p>
            </div>
          </div>
        ) : (
          <form action={acknowledgeMaterial} className="grid gap-3">
            <input type="hidden" name="material_id" value={material.id} />
            <input type="hidden" name="training_step_id" value={trainingStepId} />
            <label className="flex cursor-pointer items-start gap-3 text-sm font-bold leading-6 text-slate-700">
              <input
                name="acknowledgment"
                type="checkbox"
                required
                className="mt-1 h-5 w-5 shrink-0 accent-emerald-700"
              />
              <span>
                I acknowledge that I have honestly and accurately reviewed this
                training material, understand the information provided, and
                completed this portion of the SitGuru University training.
              </span>
            </label>
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
            >
              <CheckCircle2 size={17} />
              Save Acknowledgment
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function CertificationActionCard({
  primaryStep,
  completedAt,
  isCompleted,
  readyForCertification,
  acknowledgedRequiredMaterials,
  requiredMaterials,
}: {
  primaryStep: TrainingStep | null;
  completedAt: string | null;
  isCompleted: boolean;
  readyForCertification: boolean;
  acknowledgedRequiredMaterials: number;
  requiredMaterials: number;
}) {
  return (
    <section
      className={`rounded-[24px] border p-4 sm:p-5 ${
        isCompleted
          ? "border-emerald-200 bg-emerald-50"
          : readyForCertification
            ? "border-red-200 bg-red-50"
            : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-black text-white">
              Step 3
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${
                isCompleted
                  ? "border-emerald-200 bg-white text-emerald-900"
                  : readyForCertification
                    ? "border-red-200 bg-white text-red-900"
                    : "border-amber-200 bg-white text-amber-900"
              }`}
            >
              {isCompleted
                ? "Certified"
                : readyForCertification
                  ? "Action Needed"
                  : "Locked"}
            </span>
          </div>

          <h3 className="text-2xl font-black tracking-tight text-slate-950">
            Acknowledge & Get Certified
          </h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            {isCompleted
              ? `Certified Pet Parent orientation completed on ${formatDateTime(completedAt)}.`
              : readyForCertification
                ? "All required materials are acknowledged. Click Complete Orientation to finish and issue your Certified Pet Parent status."
                : `Complete Step 1 and Step 2 first. ${number(acknowledgedRequiredMaterials)} of ${number(requiredMaterials)} required materials acknowledged.`}
          </p>
        </div>

        {isCompleted ? (
          <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm">
            <BadgeCheck size={18} />
            Badge Issued
          </span>
        ) : (
          <form action={completeOrientation}>
            <input type="hidden" name="training_step_id" value={primaryStep?.id || ""} />
            <button
              type="submit"
              disabled={!readyForCertification || !primaryStep?.id}
              className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition sm:w-auto ${
                readyForCertification && primaryStep?.id
                  ? "bg-red-700 text-white shadow-sm hover:bg-red-800"
                  : "bg-amber-100 text-amber-500"
              }`}
            >
              <CheckCircle2 size={17} />
              Complete Orientation
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function ProgressPill({
  step,
  title,
  complete,
}: {
  step: string;
  title: string;
  complete: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3 ${
        complete
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-slate-100 bg-white text-slate-700"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
          complete ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
        }`}
      >
        {complete ? <CheckCircle2 size={17} /> : step}
      </span>
      <div>
        <p className="text-sm font-black">Step {step}</p>
        <p className="text-xs font-bold">{title}</p>
      </div>
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-slate-800 shadow-sm ring-1 ring-white/70">
      {icon}
      {label}
    </span>
  );
}

function DashboardStatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-2 text-sm font-bold text-emerald-700">{detail}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniBox({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-w-[160px] rounded-2xl border border-emerald-100 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold text-slate-500">{detail}</p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[26px] border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
        {icon}
      </div>
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}
