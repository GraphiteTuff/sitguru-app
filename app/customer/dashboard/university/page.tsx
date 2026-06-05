import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  LockKeyhole,
  PawPrint,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type TrainingStep = {
  id: string;
  academy_type?: string | null;
  step_number?: number | null;
  title?: string | null;
  description?: string | null;
  is_active?: boolean | null;
  requires_acknowledgment?: boolean | null;
  requires_signature?: boolean | null;
  estimated_minutes?: number | null;
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

type MaterialWithUrl = TrainingMaterial & {
  openUrl: string;
  downloadUrl: string;
  acknowledged: boolean;
};

type PageData = {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  orientationStep: TrainingStep | null;
  videoMaterial: MaterialWithUrl | null;
  guideMaterial: MaterialWithUrl | null;
  orientationCompleted: boolean;
  completedAt: string | null;
  progressPercent: number;
};

const academyType = "pet_parent";
const customerRoutes = {
  dashboard: "/customer/dashboard",
  profile: "/customer/dashboard/profile",
  pets: "/customer/dashboard/pets",
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

function formatDate(value?: string | null) {
  if (!value) return "Not completed yet";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not completed yet";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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


function getAvatarUrl(profile: AnyRow | null, userMetadata?: AnyRow | null) {
  return (
    asString(profile?.avatar_url) ||
    asString(profile?.profile_photo_url) ||
    asString(profile?.photo_url) ||
    asString(profile?.image_url) ||
    asString(userMetadata?.avatar_url) ||
    asString(userMetadata?.profile_photo_url) ||
    asString(userMetadata?.photo_url) ||
    asString(userMetadata?.picture) ||
    asString(userMetadata?.avatar) ||
    ""
  );
}

function getInitials(value: string) {
  const parts = value
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  return `${parts[0]?.charAt(0) || "P"}${parts[1]?.charAt(0) || "P"}`.toUpperCase();
}

function getContentTypeLabel(value?: string | null) {
  const normalized = asString(value).toLowerCase();

  if (normalized === "video") return "Video";
  if (normalized === "ppt" || normalized === "powerpoint") return "PowerPoint";
  if (normalized === "pdf") return "PDF";
  if (normalized === "document") return "Guide";
  if (normalized === "image") return "Image / Slide";
  if (normalized === "link") return "Link";

  return "Training";
}

function isVideoMaterial(material: TrainingMaterial) {
  const type = asString(material.content_type).toLowerCase();
  const title = asString(material.title).toLowerCase();
  const path = asString(material.storage_path).toLowerCase();

  return (
    type === "video" ||
    title.includes("video") ||
    path.endsWith(".mp4") ||
    path.endsWith(".mov") ||
    path.endsWith(".webm") ||
    Boolean(material.video_url)
  );
}

function isGuideMaterial(material: TrainingMaterial) {
  const type = asString(material.content_type).toLowerCase();
  const title = asString(material.title).toLowerCase();
  const path = asString(material.storage_path).toLowerCase();

  return (
    type === "powerpoint" ||
    type === "ppt" ||
    type === "pdf" ||
    type === "document" ||
    title.includes("guide") ||
    title.includes("ppt") ||
    title.includes("powerpoint") ||
    title.includes("overview") ||
    path.endsWith(".ppt") ||
    path.endsWith(".pptx") ||
    path.endsWith(".pdf") ||
    path.endsWith(".doc") ||
    path.endsWith(".docx")
  );
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

function isCompletedStep(row: AnyRow) {
  const status = asString(row.status).toLowerCase();

  return Boolean(
    row.completed_at || status === "completed" || status === "complete" || status === "done",
  );
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
      console.warn("Unable to create signed Pet Parent Academy material URL:", {
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
    console.warn("Unable to create signed Pet Parent Academy material URL:", {
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

async function getPetParentAcademyData(userId: string, email: string, userMetadata?: AnyRow | null): Promise<PageData> {
  const [profile, stepsResult, materialsResult, materialProgressResult, stepProgressResult] =
    await Promise.all([
      getProfile(userId),
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
      supabaseAdmin
        .from("academy_material_progress")
        .select("material_id, acknowledged_at")
        .eq("academy_type", academyType)
        .eq("user_id", userId)
        .not("acknowledged_at", "is", null),
      supabaseAdmin
        .from("academy_step_progress")
        .select("training_step_id, status, completed_at")
        .eq("academy_type", academyType)
        .eq("user_id", userId),
    ]);

  if (stepsResult.error) {
    console.warn("Unable to load Pet Parent Academy step:", stepsResult.error);
  }

  if (materialsResult.error) {
    console.warn("Unable to load Pet Parent Academy materials:", materialsResult.error);
  }

  const activeSteps = ((stepsResult.data || []) as TrainingStep[]).filter(
    (step) => step.is_active !== false,
  );
  const orientationStep = activeSteps[0] || null;
  const activeStepIds = new Set(activeSteps.map((step) => step.id));

  const allMaterials = ((materialsResult.data || []) as TrainingMaterial[])
    .filter((material) => material.is_active !== false)
    .filter((material) =>
      orientationStep
        ? asString(material.training_step_id) === orientationStep.id
        : activeStepIds.has(asString(material.training_step_id)),
    )
    .sort(sortMaterials);

  const acknowledgedMaterialIds = new Set(
    ((materialProgressResult.data || []) as AnyRow[])
      .map((row) => asString(row.material_id))
      .filter(Boolean),
  );

  const videoBase = allMaterials.find(isVideoMaterial) || null;
  const guideBase = allMaterials.find((material) => !isVideoMaterial(material) && isGuideMaterial(material)) || null;

  const videoUrls = videoBase ? await getSignedMaterialUrls(videoBase) : null;
  const guideUrls = guideBase ? await getSignedMaterialUrls(guideBase) : null;

  const videoMaterial = videoBase
    ? {
        ...videoBase,
        openUrl: videoUrls?.openUrl || "",
        downloadUrl: videoUrls?.downloadUrl || "",
        acknowledged: acknowledgedMaterialIds.has(videoBase.id),
      }
    : null;

  const guideMaterial = guideBase
    ? {
        ...guideBase,
        openUrl: guideUrls?.openUrl || "",
        downloadUrl: guideUrls?.downloadUrl || "",
        acknowledged: acknowledgedMaterialIds.has(guideBase.id),
      }
    : null;

  const stepProgress = ((stepProgressResult.data || []) as AnyRow[]).find((row) =>
    orientationStep ? asString(row.training_step_id) === orientationStep.id : false,
  );

  const orientationCompleted = Boolean(stepProgress && isCompletedStep(stepProgress));
  const completedAt = asString(stepProgress?.completed_at) || null;

  const actionCount = 3;
  const completedActions =
    (videoMaterial?.acknowledged ? 1 : 0) +
    (guideMaterial?.acknowledged ? 1 : 0) +
    (orientationCompleted ? 1 : 0);

  return {
    userId,
    email,
    displayName: getDisplayName(profile, email),
    avatarUrl: getAvatarUrl(profile, userMetadata),
    orientationStep,
    videoMaterial,
    guideMaterial,
    orientationCompleted,
    completedAt,
    progressPercent: Math.round((completedActions / actionCount) * 100),
  };
}

async function requireCustomerUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

async function acknowledgeAcademyMaterial(formData: FormData) {
  "use server";

  const user = await requireCustomerUser();

  const materialId = asString(formData.get("material_id"));
  const trainingStepId = asString(formData.get("training_step_id"));

  if (!materialId || !trainingStepId) {
    redirect(`${customerRoutes.university}?error=missing_material`);
  }

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin.from("academy_material_progress").upsert(
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

  if (error) {
    console.warn("Unable to acknowledge Pet Parent Academy material:", error);
    redirect(`${customerRoutes.university}?error=acknowledgment`);
  }

  revalidatePath(customerRoutes.university);
  revalidatePath(customerRoutes.dashboard);
  redirect(`${customerRoutes.university}?saved=material`);
}

async function completeCertifiedPetParentOrientation(formData: FormData) {
  "use server";

  const user = await requireCustomerUser();

  const trainingStepId = asString(formData.get("training_step_id"));
  const finalAcknowledgment = formData.get("final_acknowledgment") === "on";

  if (!trainingStepId || !finalAcknowledgment) {
    redirect(`${customerRoutes.university}?error=final_acknowledgment`);
  }

  const [{ data: materialRows }, { data: progressRows }] = await Promise.all([
    supabaseAdmin
      .from("academy_step_materials")
      .select("id, training_step_id, content_type, title, storage_path, video_url, external_url, is_active")
      .eq("academy_type", academyType)
      .eq("training_step_id", trainingStepId)
      .eq("is_active", true),
    supabaseAdmin
      .from("academy_material_progress")
      .select("material_id, acknowledged_at")
      .eq("academy_type", academyType)
      .eq("user_id", user.id)
      .not("acknowledged_at", "is", null),
  ]);

  const activeMaterials = ((materialRows || []) as TrainingMaterial[]).sort(sortMaterials);
  const videoMaterial = activeMaterials.find(isVideoMaterial) || null;
  const guideMaterial = activeMaterials.find((material) => !isVideoMaterial(material) && isGuideMaterial(material)) || null;
  const acknowledgedIds = new Set(
    ((progressRows || []) as AnyRow[])
      .map((row) => asString(row.material_id))
      .filter(Boolean),
  );

  const missingVideoAck = Boolean(videoMaterial && !acknowledgedIds.has(videoMaterial.id));
  const missingGuideAck = Boolean(guideMaterial && !acknowledgedIds.has(guideMaterial.id));

  if (!videoMaterial || !guideMaterial || missingVideoAck || missingGuideAck) {
    redirect(`${customerRoutes.university}?error=materials_required`);
  }

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin.from("academy_step_progress").upsert(
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

  if (error) {
    console.warn("Unable to complete Pet Parent Academy orientation:", error);
    redirect(`${customerRoutes.university}?error=complete`);
  }

  revalidatePath(customerRoutes.university);
  revalidatePath(customerRoutes.dashboard);
  redirect(`${customerRoutes.university}?saved=certified`);
}

function getNotice(searchParams?: Record<string, string | string[] | undefined>) {
  const saved = asString(searchParams?.saved);
  const error = asString(searchParams?.error);

  if (saved === "material") {
    return {
      tone: "success" as const,
      title: "Acknowledgment saved",
      message: "Your training acknowledgment was saved. Continue to the next item when ready.",
    };
  }

  if (saved === "certified") {
    return {
      tone: "success" as const,
      title: "Certified Pet Parent orientation complete",
      message: "Your Certified Pet Parent badge is now ready to display across SitGuru.",
    };
  }

  if (error === "materials_required") {
    return {
      tone: "error" as const,
      title: "Training still needs review",
      message: "Please acknowledge the intro video and Pet Parent guide before completing certification.",
    };
  }

  if (error) {
    return {
      tone: "error" as const,
      title: "Unable to save training progress",
      message: "Please confirm the training material is available and try again.",
    };
  }

  return null;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerUniversityPage({ searchParams }: PageProps) {
  const user = await requireCustomerUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const notice = getNotice(resolvedSearchParams);

  const data = await getPetParentAcademyData(
    user.id,
    asString(user.email),
    (user.user_metadata || null) as AnyRow | null,
  );
  const firstName = data.displayName.split(" ")[0] || "Pet Parent";
  const canComplete = Boolean(
    data.orientationStep &&
      data.videoMaterial?.acknowledged &&
      data.guideMaterial?.acknowledged &&
      !data.orientationCompleted,
  );

  return (
    <main className="min-h-screen bg-[#f7fbf7] px-4 py-5 text-[#062f2b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="overflow-hidden rounded-[34px] border border-emerald-100 bg-white shadow-sm">
          <div className="bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-5 py-7 sm:px-8 sm:py-10">
            <Link
              href={customerRoutes.dashboard}
              className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-white"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-900/80">
                  SitGuru University
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
                  Learn SitGuru. Easy as 1, 2, 3.
                </h1>
                <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-900/75 sm:text-lg">
                  Hi {firstName}, complete your Certified Pet Parent orientation by watching the intro video, reviewing the Pet Parent guide, and acknowledging completion to earn your badge.
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-center rounded-[2rem] bg-white/85 p-5 text-center shadow-sm ring-1 ring-white/70">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-2xl font-black text-emerald-800 ring-1 ring-emerald-100">
                  {data.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.avatarUrl}
                      alt={`${data.displayName} profile photo`}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    getInitials(data.displayName)
                  )}
                </div>
                <p className="mt-3 text-sm font-black text-slate-950">
                  {data.displayName}
                </p>
                <p className="mt-1 text-xs font-black text-emerald-800">
                  {data.orientationCompleted ? "Certified Pet Parent" : "Badge locked"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 bg-white px-5 py-5 sm:grid-cols-3 sm:px-8">
            <ProgressStat
              label="Progress"
              value={data.orientationCompleted ? "1 of 1" : "0 of 1"}
              detail={`${data.progressPercent}% complete`}
              icon={<GraduationCap size={20} />}
            />
            <ProgressStat
              label="Training"
              value="3 actions"
              detail="Video, guide, certification"
              icon={<Sparkles size={20} />}
            />
            <ProgressStat
              label="Badge"
              value={data.orientationCompleted ? "Issued" : "Locked"}
              detail={data.orientationCompleted ? "Certified Pet Parent" : "Complete all 3 actions"}
              icon={data.orientationCompleted ? <BadgeCheck size={20} /> : <LockKeyhole size={20} />}
            />
          </div>
        </section>

        {notice ? (
          <section
            className={`rounded-[24px] border p-4 text-sm font-bold leading-6 ${
              notice.tone === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-900"
                : "border-red-100 bg-red-50 text-red-800"
            }`}
          >
            <p className="font-black">{notice.title}</p>
            <p className="mt-1">{notice.message}</p>
          </section>
        ) : null}

        <section className="rounded-[34px] border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 rounded-[28px] border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                  Certified Pet Parent Orientation
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Watch. Review. Acknowledge.
                </h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                  This page intentionally shows only three simple actions. Upload one intro video and one Pet Parent guide in Admin. Step 3 issues the certification after both are acknowledged.
                </p>
              </div>

              <span
                className={`inline-flex shrink-0 items-center justify-center rounded-2xl px-4 py-3 text-sm font-black ${
                  data.orientationCompleted
                    ? "bg-emerald-700 text-white"
                    : "bg-white text-emerald-900 ring-1 ring-emerald-100"
                }`}
              >
                {data.orientationCompleted ? "Completed" : "In progress"}
              </span>
            </div>
          </div>

          {!data.orientationStep ? (
            <div className="rounded-[28px] border border-dashed border-amber-200 bg-amber-50 p-6 text-center text-sm font-bold leading-6 text-amber-900">
              Pet Parent Academy is not active yet. In Admin Training Manager, create one active Pet Parent step named Certified Pet Parent Orientation.
            </div>
          ) : (
            <div className="grid gap-4">
              <ActionCard
                stepNumber="1"
                title="Watch the Intro Video"
                description="Start with the SitGuru intro video to understand the platform, trust expectations, and how Pet Parents use SitGuru."
                material={data.videoMaterial}
                emptyTitle="Intro video not uploaded yet"
                emptyDescription="Upload one video material to the active Pet Parent orientation step in Admin."
                icon={<PlayCircle size={24} />}
                action={acknowledgeAcademyMaterial}
                orientationStepId={data.orientationStep.id}
              />

              <ActionCard
                stepNumber="2"
                title="Review the Pet Parent Guide"
                description="Open the Pet Parent PowerPoint or PDF guide to review profiles, pets, messaging, bookings, reviews, trust, and safety."
                material={data.guideMaterial}
                emptyTitle="Pet Parent guide not uploaded yet"
                emptyDescription="Upload one PowerPoint, PDF, or document material to the active Pet Parent orientation step in Admin."
                icon={<FileText size={24} />}
                action={acknowledgeAcademyMaterial}
                orientationStepId={data.orientationStep.id}
              />

              <CertificationCard
                orientationStepId={data.orientationStep.id}
                canComplete={canComplete}
                completed={data.orientationCompleted}
                completedAt={data.completedAt}
                action={completeCertifiedPetParentOrientation}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ActionCard({
  stepNumber,
  title,
  description,
  material,
  emptyTitle,
  emptyDescription,
  icon,
  action,
  orientationStepId,
}: {
  stepNumber: string;
  title: string;
  description: string;
  material: MaterialWithUrl | null;
  emptyTitle: string;
  emptyDescription: string;
  icon: ReactNode;
  action: (formData: FormData) => Promise<void>;
  orientationStepId: string;
}) {
  const complete = Boolean(material?.acknowledged);

  return (
    <article
      className={`rounded-[28px] border p-4 transition sm:p-5 ${
        complete
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white ${
            complete ? "bg-emerald-700" : "bg-slate-900"
          }`}
        >
          {complete ? <CheckCircle2 size={25} /> : icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-800 ring-1 ring-slate-200">
              Step {stepNumber}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                complete
                  ? "bg-emerald-700 text-white"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {complete ? "Acknowledged" : "Action needed"}
            </span>
          </div>

          <h3 className="mt-3 text-xl font-black text-slate-950 sm:text-2xl">
            {title}
          </h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {description}
          </p>

          {material ? (
            <div className="mt-4 rounded-2xl border border-white bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-950">
                    {material.title}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                    {getContentTypeLabel(material.content_type)}
                  </p>
                  {material.description ? (
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {material.description}
                    </p>
                  ) : null}
                </div>

                <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {material.openUrl ? (
                    <a
                      href={material.openUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
                    >
                      <ExternalLink size={16} />
                      Open Material
                    </a>
                  ) : null}

                  {material.downloadUrl ? (
                    <a
                      href={material.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
                    >
                      <Download size={16} />
                      Download / View
                    </a>
                  ) : null}
                </div>
              </div>

              {complete ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-900">
                  Acknowledgment complete.
                </div>
              ) : (
                <form action={action} className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                  <input type="hidden" name="material_id" value={material.id} />
                  <input type="hidden" name="training_step_id" value={orientationStepId} />
                  <p className="text-sm font-bold leading-6 text-amber-950">
                    I acknowledge that I have honestly and accurately reviewed this training material, understand the information provided, and completed this portion of SitGuru University training.
                  </p>
                  <button
                    type="submit"
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-amber-600 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-700 sm:w-auto"
                  >
                    Save Acknowledgment
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-white p-4 text-sm font-bold leading-6 text-amber-900">
              <p className="font-black">{emptyTitle}</p>
              <p className="mt-1">{emptyDescription}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function CertificationCard({
  orientationStepId,
  canComplete,
  completed,
  completedAt,
  action,
}: {
  orientationStepId: string;
  canComplete: boolean;
  completed: boolean;
  completedAt: string | null;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <article
      className={`rounded-[28px] border p-4 transition sm:p-5 ${
        completed
          ? "border-emerald-200 bg-emerald-50"
          : canComplete
            ? "border-red-200 bg-red-50"
            : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white ${
            completed ? "bg-emerald-700" : canComplete ? "bg-red-700" : "bg-slate-900"
          }`}
        >
          {completed ? <BadgeCheck size={25} /> : <ShieldCheck size={25} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-800 ring-1 ring-slate-200">
              Step 3
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                completed
                  ? "bg-emerald-700 text-white"
                  : canComplete
                    ? "bg-red-700 text-white"
                    : "bg-slate-200 text-slate-700"
              }`}
            >
              {completed ? "Certified" : canComplete ? "Ready to complete" : "Locked"}
            </span>
          </div>

          <h3 className="mt-3 text-xl font-black text-slate-950 sm:text-2xl">
            Acknowledge & Get Certified
          </h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            After reviewing the intro video and Pet Parent guide, complete the final acknowledgment to receive your Certified Pet Parent badge.
          </p>

          {completed ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="text-lg font-black text-emerald-900">
                Certified Pet Parent badge issued
              </p>
              <p className="mt-1 text-sm font-bold text-slate-600">
                Completed on {formatDate(completedAt)}. Your badge can now appear on your SitGuru profile.
              </p>
            </div>
          ) : canComplete ? (
            <form action={action} className="mt-4 rounded-2xl border border-red-200 bg-white p-4">
              <input type="hidden" name="training_step_id" value={orientationStepId} />
              <label className="flex cursor-pointer items-start gap-3 text-sm font-bold leading-6 text-slate-800">
                <input
                  name="final_acknowledgment"
                  type="checkbox"
                  required
                  className="mt-1 h-5 w-5 shrink-0 accent-red-700"
                />
                <span>
                  I certify that I honestly and accurately completed the Pet Parent Academy orientation, reviewed the required training materials, understand SitGuru’s trust and safety expectations, and agree to use the platform responsibly.
                </span>
              </label>
              <button
                type="submit"
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-red-800 sm:w-auto"
              >
                <BadgeCheck size={17} />
                Complete Certification & Issue Badge
              </button>
            </form>
          ) : (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold leading-6 text-slate-600">
              Step 3 unlocks after Step 1 and Step 2 are acknowledged.
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ProgressStat({
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
    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-black text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-sm font-bold text-emerald-700">{detail}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}
