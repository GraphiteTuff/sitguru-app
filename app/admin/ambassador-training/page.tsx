import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  LinkIcon,
  LockKeyhole,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import TrainingMaterialUploadField from "./TrainingMaterialUploadField";

export const dynamic = "force-dynamic";

type AcademyType = "pet_parent" | "guru" | "ambassador";

type TrainingStep = {
  id: string;
  academy_type?: AcademyType | string | null;
  step_number: number;
  title: string;
  description?: string | null;
  content_type?: string | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  external_url?: string | null;
  video_url?: string | null;
  estimated_minutes?: number | null;
  is_required?: boolean | null;
  is_active?: boolean | null;
  requires_acknowledgment?: boolean | null;
  requires_signature?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type TrainingMaterial = {
  id: string;
  training_step_id?: string | null;
  academy_type?: AcademyType | string | null;
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
  updated_at?: string | null;
};

type TrainingProgressSummary = {
  training_step_id?: string | null;
  status?: string | null;
};

const superAdminEmails = ["jason@sitguru.com", "nette@sitguru.com"];

const adminRoutes = {
  dashboard: "/admin",
  hr: "/admin/hr",
  ambassadors: "/admin/ambassadors",
  ambassadorTraining: "/admin/ambassador-training",
};

const academyOptions: {
  value: AcademyType;
  label: string;
  shortLabel: string;
  emoji: string;
  detail: string;
  audience: string;
  modules: string;
  certificate: string;
}[] = [
  {
    value: "pet_parent",
    label: "Pet Parent Academy",
    shortLabel: "Pet Parent",
    emoji: "🐾",
    detail:
      "Watch the intro video, review the Pet Parent guide, and acknowledge completion to earn the badge.",
    audience: "Pet Parents",
    modules: "3 steps",
    certificate: "Certified Pet Parent",
  },
  {
    value: "guru",
    label: "Guru Academy",
    shortLabel: "Guru",
    emoji: "🎓",
    detail:
      "Watch the Guru intro video, review the Guru Success Guide, and acknowledge completion to earn the badge.",
    audience: "Gurus",
    modules: "3 steps",
    certificate: "Certified Guru",
  },
  {
    value: "ambassador",
    label: "Ambassador Academy",
    shortLabel: "Ambassador",
    emoji: "🌟",
    detail:
      "Watch the Ambassador intro video, review the Ambassador Guide, and acknowledge completion to earn the badge.",
    audience: "Ambassadors",
    modules: "3 steps",
    certificate: "Certified Ambassador",
  },
];

const contentTypes = [
  "video",
  "powerpoint",
  "pdf",
  "document",
  "image",
  "link",
  "quiz",
  "certification",
];

const universityStorageBucket = "sitguru-university";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

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

function normalizeAcademyType(value?: string | null): AcademyType {
  const normalized = asString(value).toLowerCase();

  if (normalized === "pet_parent" || normalized === "pet-parent") {
    return "pet_parent";
  }

  if (normalized === "guru") return "guru";

  return "ambassador";
}

function getAcademyOption(value?: string | null) {
  const academyType = normalizeAcademyType(value);
  return (
    academyOptions.find((academy) => academy.value === academyType) ||
    academyOptions[2]
  );
}

function getOrientationTitle(academyType: AcademyType) {
  if (academyType === "pet_parent") return "Certified Pet Parent Orientation";
  if (academyType === "guru") return "Certified Guru Orientation";

  return "Certified Ambassador Orientation";
}

function getOrientationDescription(academyType: AcademyType) {
  if (academyType === "pet_parent") {
    return "Learn the basics of SitGuru, how to set up your profile, and how to safely connect with trusted local Gurus. Review the video and guide, then acknowledge completion to earn your Certified Pet Parent badge.";
  }

  if (academyType === "guru") {
    return "Learn how SitGuru works for Gurus, how to complete your profile, serve Pet Parents safely, manage bookings, and acknowledge completion to earn your Certified Guru badge.";
  }

  return "Learn how to represent SitGuru, use approved outreach, understand referrals and PawPerks, and acknowledge completion to earn your Certified Ambassador badge.";
}

function getCoreOrientationStep(steps: TrainingStep[]) {
  const activeStepOne = steps.find(
    (step) => asNumber(step.step_number) === 1 && step.is_active !== false,
  );

  if (activeStepOne) return activeStepOne;

  const stepOne = steps.find((step) => asNumber(step.step_number) === 1);

  if (stepOne) return stepOne;

  return steps[0] || null;
}

function getOrientationMaterialPlan(academyType?: string | null) {
  const academy = getAcademyOption(academyType);

  return [
    {
      label: "Step 1",
      title: "Watch the Intro Video",
      detail: `Upload the ${academy.shortLabel} intro video.`,
      type: "Video",
    },
    {
      label: "Step 2",
      title:
        academy.value === "pet_parent"
          ? "Review the Pet Parent Guide"
          : academy.value === "guru"
            ? "Review the Guru Success Guide"
            : "Review the Ambassador Guide",
      detail: "Upload the PowerPoint, PDF, or guide file.",
      type: "PowerPoint / PDF",
    },
    {
      label: "Step 3",
      title: "Acknowledge & Get Certified",
      detail: `Final acknowledgment and ${academy.certificate} badge issuance.`,
      type: "Certification",
    },
  ];
}

function getAcademyFilter(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalized = asString(rawValue).toLowerCase();

  if (
    normalized === "pet_parent" ||
    normalized === "guru" ||
    normalized === "ambassador"
  ) {
    return normalized as AcademyType;
  }

  return "all";
}

async function requireSuperAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  const email = asString(user.email).toLowerCase();

  if (!superAdminEmails.includes(email)) {
    redirect("/ambassador/dashboard");
  }

  return user;
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

function getTrainingMaterialLabel(step: TrainingStep) {
  if (asString(step.video_url)) return "Video URL";
  if (asString(step.external_url)) return "External URL";
  if (asString(step.storage_path)) return "Storage File";
  return "No primary material";
}

function getTrainingMaterialUrl(step: TrainingStep) {
  const videoUrl = asString(step.video_url);
  const externalUrl = asString(step.external_url);

  if (videoUrl) return videoUrl;
  if (externalUrl) return externalUrl;

  return "";
}

function getMaterialUrl(material: TrainingMaterial) {
  const videoUrl = asString(material.video_url);
  const externalUrl = asString(material.external_url);

  if (videoUrl) return videoUrl;
  if (externalUrl) return externalUrl;

  return "";
}

function getMaterialLocationLabel(material: TrainingMaterial) {
  const videoUrl = asString(material.video_url);
  const externalUrl = asString(material.external_url);
  const storagePath = asString(material.storage_path);

  if (videoUrl) return "Video URL";
  if (externalUrl) return "External URL";
  if (storagePath) return "Storage File";

  return "No file/link added";
}

async function removeTrainingMaterialStorageFile(
  storageBucket?: string | null,
  storagePath?: string | null,
) {
  const bucket = asString(storageBucket);
  const path = asString(storagePath);

  if (!bucket || !path) return;

  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

    if (error) {
      console.warn("Unable to remove SitGuru University material file:", error);
    }
  } catch (error) {
    console.warn("Unable to remove SitGuru University material file:", error);
  }
}

function getDefaultMaterialPath(step: TrainingStep) {
  const academyType = normalizeAcademyType(step.academy_type);
  const folder =
    academyType === "pet_parent"
      ? "pet-parent"
      : academyType === "guru"
        ? "guru"
        : "ambassador";

  const safeTitle = asString(step.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${folder}/${String(step.step_number).padStart(2, "0")}-${safeTitle || "training-material"}`;
}

function sortTrainingMaterials(a: TrainingMaterial, b: TrainingMaterial) {
  const aSort = asNumber(a.sort_order) || 999;
  const bSort = asNumber(b.sort_order) || 999;

  if (aSort !== bSort) return aSort - bSort;

  return asString(a.title).localeCompare(asString(b.title), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getNotice(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const created = asString(searchParams?.created);
  const updated = asString(searchParams?.updated);
  const toggled = asString(searchParams?.toggled);
  const material = asString(searchParams?.material);
  const error = asString(searchParams?.error);

  if (created === "success") {
    return {
      tone: "success" as const,
      title: "Training step added",
      message: "The SitGuru University training step was created successfully.",
    };
  }

  if (updated === "success") {
    return {
      tone: "success" as const,
      title: "Training step updated",
      message: "The SitGuru University training step was updated successfully.",
    };
  }

  if (toggled === "success") {
    return {
      tone: "success" as const,
      title: "Training step status updated",
      message: "The active/inactive status was updated successfully.",
    };
  }

  if (material === "created") {
    return {
      tone: "success" as const,
      title: "Training material added",
      message:
        "The additional training material was added to the academy step.",
    };
  }

  if (material === "uploaded") {
    return {
      tone: "success" as const,
      title: "Training material uploaded and saved",
      message:
        "The file was attached, uploaded to Supabase Storage, and saved to this academy step.",
    };
  }

  if (material === "updated") {
    return {
      tone: "success" as const,
      title: "Training material updated",
      message: "The training material was updated successfully.",
    };
  }

  if (material === "toggled") {
    return {
      tone: "success" as const,
      title: "Training material status updated",
      message: "The material active/inactive status was updated successfully.",
    };
  }

  if (material === "deleted") {
    return {
      tone: "success" as const,
      title: "Training material deleted",
      message:
        "The supplemental material was removed from the academy step. If it had an uploaded storage file, that file was removed too.",
    };
  }

  if (material === "file_removed") {
    return {
      tone: "success" as const,
      title: "Uploaded file removed",
      message:
        "The uploaded file was removed from Supabase Storage and detached from the material record.",
    };
  }

  if (material === "upload_error") {
    return {
      tone: "error" as const,
      title: "File upload failed",
      message:
        "The material could not upload to Supabase Storage. Confirm the sitguru-university bucket exists and the file is under the allowed upload size.",
    };
  }

  if (error === "forbidden") {
    return {
      tone: "error" as const,
      title: "Access denied",
      message:
        "Only SitGuru Super Admins can update SitGuru University training steps.",
    };
  }

  if (error === "academy") {
    return {
      tone: "error" as const,
      title: "Academy type missing",
      message:
        "Please select Pet Parent Academy, Guru Academy, or Ambassador Academy.",
    };
  }

  if (error === "materials") {
    return {
      tone: "error" as const,
      title: "Training materials table unavailable",
      message:
        "The academy_step_materials table could not be read or saved. Create the Supabase table first, then retry.",
    };
  }

  if (error) {
    return {
      tone: "error" as const,
      title: "Training update failed",
      message:
        "The training step could not be saved. Please confirm the training tables and academy columns exist in Supabase.",
    };
  }

  return null;
}

async function createTrainingStep(formData: FormData) {
  "use server";

  await requireSuperAdmin();

  const academyType = normalizeAcademyType(
    asString(formData.get("academy_type")),
  );
  const stepNumber = asNumber(formData.get("step_number"));
  const title = asString(formData.get("title"));
  const description = asString(formData.get("description"));
  const contentType = asString(formData.get("content_type")) || "video";
  const estimatedMinutes = asNumber(formData.get("estimated_minutes")) || 5;
  const storageBucket = asString(formData.get("storage_bucket"));
  const storagePath = asString(formData.get("storage_path"));
  const externalUrl = asString(formData.get("external_url"));
  const videoUrl = asString(formData.get("video_url"));
  const isRequired = asBoolean(formData.get("is_required"));
  const isActive = asBoolean(formData.get("is_active"));
  const requiresAcknowledgment = asBoolean(
    formData.get("requires_acknowledgment"),
  );
  const requiresSignature = asBoolean(formData.get("requires_signature"));

  if (!title || !stepNumber || !academyType) {
    redirect(`${adminRoutes.ambassadorTraining}?error=missing`);
  }

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("ambassador_training_steps")
    .insert({
      academy_type: academyType,
      step_number: stepNumber,
      title,
      description: description || null,
      content_type: contentType,
      storage_bucket: storageBucket || null,
      storage_path: storagePath || null,
      external_url: externalUrl || null,
      video_url: videoUrl || null,
      estimated_minutes: estimatedMinutes,
      is_required: isRequired,
      is_active: isActive,
      requires_acknowledgment: requiresAcknowledgment,
      requires_signature: requiresSignature,
      created_at: now,
      updated_at: now,
    });

  if (error) {
    console.warn("Unable to create SitGuru University training step:", error);
    redirect(`${adminRoutes.ambassadorTraining}?error=create`);
  }

  revalidateUniversityPaths();
  redirect(
    `${adminRoutes.ambassadorTraining}?academy=${academyType}&created=success`,
  );
}

async function updateTrainingStep(formData: FormData) {
  "use server";

  await requireSuperAdmin();

  const stepId = asString(formData.get("step_id"));
  const academyType = normalizeAcademyType(
    asString(formData.get("academy_type")),
  );
  const stepNumber = asNumber(formData.get("step_number"));
  const title = asString(formData.get("title"));
  const description = asString(formData.get("description"));
  const contentType = asString(formData.get("content_type")) || "video";
  const estimatedMinutes = asNumber(formData.get("estimated_minutes")) || 5;
  const storageBucket = asString(formData.get("storage_bucket"));
  const storagePath = asString(formData.get("storage_path"));
  const externalUrl = asString(formData.get("external_url"));
  const videoUrl = asString(formData.get("video_url"));
  const isRequired = asBoolean(formData.get("is_required"));
  const isActive = asBoolean(formData.get("is_active"));
  const requiresAcknowledgment = asBoolean(
    formData.get("requires_acknowledgment"),
  );
  const requiresSignature = asBoolean(formData.get("requires_signature"));

  if (!stepId || !title || !stepNumber || !academyType) {
    redirect(`${adminRoutes.ambassadorTraining}?error=missing`);
  }

  const { error } = await supabaseAdmin
    .from("ambassador_training_steps")
    .update({
      academy_type: academyType,
      step_number: stepNumber,
      title,
      description: description || null,
      content_type: contentType,
      storage_bucket: storageBucket || null,
      storage_path: storagePath || null,
      external_url: externalUrl || null,
      video_url: videoUrl || null,
      estimated_minutes: estimatedMinutes,
      is_required: isRequired,
      is_active: isActive,
      requires_acknowledgment: requiresAcknowledgment,
      requires_signature: requiresSignature,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stepId);

  if (error) {
    console.warn("Unable to update SitGuru University training step:", error);
    redirect(`${adminRoutes.ambassadorTraining}?error=update`);
  }

  revalidateUniversityPaths();
  redirect(
    `${adminRoutes.ambassadorTraining}?academy=${academyType}&updated=success`,
  );
}

async function toggleTrainingStepStatus(formData: FormData) {
  "use server";

  await requireSuperAdmin();

  const stepId = asString(formData.get("step_id"));
  const academyType = normalizeAcademyType(
    asString(formData.get("academy_type")),
  );
  const nextActive = asString(formData.get("next_active")) === "true";

  if (!stepId) {
    redirect(`${adminRoutes.ambassadorTraining}?error=missing`);
  }

  const { error } = await supabaseAdmin
    .from("ambassador_training_steps")
    .update({
      is_active: nextActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stepId);

  if (error) {
    console.warn("Unable to toggle SitGuru University training step:", error);
    redirect(`${adminRoutes.ambassadorTraining}?error=toggle`);
  }

  revalidateUniversityPaths();
  redirect(
    `${adminRoutes.ambassadorTraining}?academy=${academyType}&toggled=success`,
  );
}

async function createTrainingMaterial(formData: FormData) {
  "use server";

  await requireSuperAdmin();

  const trainingStepId = asString(formData.get("training_step_id"));
  const academyType = normalizeAcademyType(
    asString(formData.get("academy_type")),
  );
  const title = asString(formData.get("title"));
  const description = asString(formData.get("description"));
  const contentType = asString(formData.get("content_type")) || "document";
  const sortOrder = asNumber(formData.get("sort_order")) || 1;
  const externalUrl = asString(formData.get("external_url"));
  const videoUrl = asString(formData.get("video_url"));
  const storageBucket = asString(formData.get("storage_bucket"));
  const storagePath = asString(formData.get("storage_path"));
  const isRequired = asBoolean(formData.get("is_required"));
  const isActive = asBoolean(formData.get("is_active"));

  if (!trainingStepId || !title || !academyType) {
    redirect(
      `${adminRoutes.ambassadorTraining}?academy=${academyType}&error=missing`,
    );
  }

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin.from("academy_step_materials").insert({
    training_step_id: trainingStepId,
    academy_type: academyType,
    title,
    description: description || null,
    content_type: contentType,
    sort_order: sortOrder,
    storage_bucket: storageBucket || null,
    storage_path: storagePath || null,
    external_url: externalUrl || null,
    video_url: videoUrl || null,
    is_required: isRequired,
    is_active: isActive,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.warn(
      "Unable to create SitGuru University training material:",
      error,
    );
    redirect(
      `${adminRoutes.ambassadorTraining}?academy=${academyType}&error=materials`,
    );
  }

  revalidateUniversityPaths();
  redirect(
    `${adminRoutes.ambassadorTraining}?academy=${academyType}&material=${
      storagePath ? "uploaded" : "created"
    }&saved_step=${trainingStepId}`,
  );
}

async function updateTrainingMaterial(formData: FormData) {
  "use server";

  await requireSuperAdmin();

  const materialId = asString(formData.get("material_id"));
  const trainingStepId = asString(formData.get("training_step_id"));
  const academyType = normalizeAcademyType(
    asString(formData.get("academy_type")),
  );
  const title = asString(formData.get("title"));
  const description = asString(formData.get("description"));
  const contentType = asString(formData.get("content_type")) || "document";
  const sortOrder = asNumber(formData.get("sort_order")) || 1;
  const removeUploadedFile = asBoolean(formData.get("remove_storage_file"));
  const externalUrl = asString(formData.get("external_url"));
  const videoUrl = asString(formData.get("video_url"));
  const isRequired = asBoolean(formData.get("is_required"));
  const isActive = asBoolean(formData.get("is_active"));
  let storageBucket = asString(formData.get("storage_bucket"));
  let storagePath = asString(formData.get("storage_path"));

  if (!materialId || !trainingStepId || !title || !academyType) {
    redirect(
      `${adminRoutes.ambassadorTraining}?academy=${academyType}&error=missing`,
    );
  }

  const { data: existingMaterial } = await supabaseAdmin
    .from("academy_step_materials")
    .select("storage_bucket,storage_path")
    .eq("id", materialId)
    .maybeSingle();

  const existingBucket = asString(
    (existingMaterial as TrainingMaterial | null)?.storage_bucket,
  );
  const existingPath = asString(
    (existingMaterial as TrainingMaterial | null)?.storage_path,
  );
  const storageFileWasReplaced = Boolean(
    storagePath && existingPath && storagePath !== existingPath,
  );

  if (storageFileWasReplaced || removeUploadedFile) {
    await removeTrainingMaterialStorageFile(existingBucket, existingPath);
  }

  if (removeUploadedFile && !storageFileWasReplaced) {
    storageBucket = "";
    storagePath = "";
  }

  const { error } = await supabaseAdmin
    .from("academy_step_materials")
    .update({
      training_step_id: trainingStepId,
      academy_type: academyType,
      title,
      description: description || null,
      content_type: contentType,
      sort_order: sortOrder,
      storage_bucket: storageBucket || null,
      storage_path: storagePath || null,
      external_url: externalUrl || null,
      video_url: videoUrl || null,
      is_required: isRequired,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", materialId);

  if (error) {
    console.warn(
      "Unable to update SitGuru University training material:",
      error,
    );
    redirect(
      `${adminRoutes.ambassadorTraining}?academy=${academyType}&error=materials`,
    );
  }

  revalidateUniversityPaths();
  redirect(
    `${adminRoutes.ambassadorTraining}?academy=${academyType}&material=${
      storageFileWasReplaced
        ? "uploaded"
        : removeUploadedFile
          ? "file_removed"
          : "updated"
    }&saved_step=${trainingStepId}`,
  );
}

async function toggleTrainingMaterialStatus(formData: FormData) {
  "use server";

  await requireSuperAdmin();

  const materialId = asString(formData.get("material_id"));
  const academyType = normalizeAcademyType(
    asString(formData.get("academy_type")),
  );
  const nextActive = asString(formData.get("next_active")) === "true";

  if (!materialId) {
    redirect(
      `${adminRoutes.ambassadorTraining}?academy=${academyType}&error=missing`,
    );
  }

  const { error } = await supabaseAdmin
    .from("academy_step_materials")
    .update({
      is_active: nextActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", materialId);

  if (error) {
    console.warn(
      "Unable to toggle SitGuru University training material:",
      error,
    );
    redirect(
      `${adminRoutes.ambassadorTraining}?academy=${academyType}&error=materials`,
    );
  }

  revalidateUniversityPaths();
  redirect(
    `${adminRoutes.ambassadorTraining}?academy=${academyType}&material=toggled`,
  );
}

async function deleteTrainingMaterial(formData: FormData) {
  "use server";

  await requireSuperAdmin();

  const materialId = asString(formData.get("material_id"));
  const academyType = normalizeAcademyType(
    asString(formData.get("academy_type")),
  );

  if (!materialId) {
    redirect(
      `${adminRoutes.ambassadorTraining}?academy=${academyType}&error=missing`,
    );
  }

  const { data: existingMaterial } = await supabaseAdmin
    .from("academy_step_materials")
    .select("training_step_id,storage_bucket,storage_path")
    .eq("id", materialId)
    .maybeSingle();

  const savedStepId = asString(
    (existingMaterial as TrainingMaterial | null)?.training_step_id,
  );

  const { error } = await supabaseAdmin
    .from("academy_step_materials")
    .delete()
    .eq("id", materialId);

  if (error) {
    console.warn(
      "Unable to delete SitGuru University training material:",
      error,
    );
    redirect(
      `${adminRoutes.ambassadorTraining}?academy=${academyType}&error=materials`,
    );
  }

  await removeTrainingMaterialStorageFile(
    (existingMaterial as TrainingMaterial | null)?.storage_bucket,
    (existingMaterial as TrainingMaterial | null)?.storage_path,
  );

  revalidateUniversityPaths();
  redirect(
    `${adminRoutes.ambassadorTraining}?academy=${academyType}&material=deleted${
      savedStepId ? `&saved_step=${savedStepId}` : ""
    }`,
  );
}

function revalidateUniversityPaths() {
  revalidatePath(adminRoutes.ambassadorTraining);
  revalidatePath("/ambassador/training");
  revalidatePath("/ambassador/dashboard");
  revalidatePath("/guru/training");
  revalidatePath("/guru/dashboard");
  revalidatePath("/customer/training");
  revalidatePath("/customer/dashboard");
  revalidatePath("/customer/dashboard/university");
}

async function getTrainingMaterials() {
  try {
    const { data, error } = await supabaseAdmin
      .from("academy_step_materials")
      .select("*")
      .order("training_step_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("academy_step_materials table could not be read:", error);
      return [] as TrainingMaterial[];
    }

    return ((data || []) as TrainingMaterial[]).sort(sortTrainingMaterials);
  } catch (error) {
    console.warn("academy_step_materials table could not be read:", error);
    return [] as TrainingMaterial[];
  }
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAmbassadorTrainingPage({
  searchParams,
}: PageProps) {
  await requireSuperAdmin();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const notice = getNotice(resolvedSearchParams);
  const academyFilter = getAcademyFilter(resolvedSearchParams?.academy);
  const savedStepId = asString(resolvedSearchParams?.saved_step);

  const [{ data: stepsResult }, { data: progressResult }, materialsResult] =
    await Promise.all([
      supabaseAdmin
        .from("ambassador_training_steps")
        .select("*")
        .order("academy_type", { ascending: true })
        .order("step_number", { ascending: true }),
      supabaseAdmin
        .from("ambassador_training_progress")
        .select("training_step_id,status")
        .limit(5000),
      getTrainingMaterials(),
    ]);

  const allSteps = ((stepsResult || []) as TrainingStep[]).sort((a, b) => {
    const academyA = normalizeAcademyType(a.academy_type);
    const academyB = normalizeAcademyType(b.academy_type);

    if (academyA !== academyB) {
      return academyA.localeCompare(academyB);
    }

    return asNumber(a.step_number) - asNumber(b.step_number);
  });

  const allMaterials = materialsResult as TrainingMaterial[];
  const materialsByStep = new Map<string, TrainingMaterial[]>();

  allMaterials.forEach((material) => {
    const stepId = asString(material.training_step_id);
    if (!stepId) return;

    const existing = materialsByStep.get(stepId) || [];
    existing.push(material);
    materialsByStep.set(stepId, existing.sort(sortTrainingMaterials));
  });

  const filteredSteps =
    academyFilter === "all"
      ? allSteps
      : allSteps.filter(
          (step) => normalizeAcademyType(step.academy_type) === academyFilter,
        );

  const orientationStepIds = new Set(
    academyOptions
      .map((academy) =>
        getCoreOrientationStep(
          allSteps.filter(
            (step) => normalizeAcademyType(step.academy_type) === academy.value,
          ),
        ),
      )
      .filter(Boolean)
      .map((step) => (step as TrainingStep).id),
  );

  const steps = filteredSteps.filter((step) => orientationStepIds.has(step.id));
  const legacySteps = filteredSteps.filter(
    (step) => !orientationStepIds.has(step.id),
  );

  const progressRows = (progressResult || []) as TrainingProgressSummary[];

  const completedByStep = new Map<string, number>();
  const startedByStep = new Map<string, number>();

  progressRows.forEach((row) => {
    const stepId = asString(row.training_step_id);
    const status = asString(row.status).toLowerCase();

    if (!stepId) return;

    if (status === "completed" || status === "complete") {
      completedByStep.set(stepId, (completedByStep.get(stepId) || 0) + 1);
    }

    if (status === "in_progress" || status === "started") {
      startedByStep.set(stepId, (startedByStep.get(stepId) || 0) + 1);
    }
  });

  const activeSteps = steps.filter((step) => step.is_active !== false);
  const requiredSteps = steps.filter((step) => step.is_required !== false);
  const signatureSteps = steps.filter(
    (step) => step.requires_signature === true,
  );
  const acknowledgmentSteps = steps.filter(
    (step) => step.requires_acknowledgment !== false,
  );
  const visibleStepMaterials = steps.flatMap(
    (step) => materialsByStep.get(step.id) || [],
  );
  const activeMaterials = visibleStepMaterials.filter(
    (material) => material.is_active !== false,
  );
  const requiredMaterials = visibleStepMaterials.filter(
    (material) => material.is_required !== false,
  );

  const academyCounts = academyOptions.map((academy) => {
    const academySteps = allSteps.filter(
      (step) => normalizeAcademyType(step.academy_type) === academy.value,
    );
    const orientationStep = getCoreOrientationStep(academySteps);
    const academyMaterials = orientationStep
      ? allMaterials.filter(
          (material) =>
            asString(material.training_step_id) === orientationStep.id,
        )
      : [];

    return {
      ...academy,
      total: orientationStep ? 1 : 0,
      active: orientationStep && orientationStep.is_active !== false ? 1 : 0,
      required:
        orientationStep && orientationStep.is_required !== false ? 1 : 0,
      materials: academyMaterials.length,
      legacy: Math.max(academySteps.length - (orientationStep ? 1 : 0), 0),
    };
  });

  const selectedAcademy =
    academyFilter === "all" ? null : getAcademyOption(academyFilter);

  const defaultStepNumber = 1;
  const defaultAcademyType = selectedAcademy?.value || "pet_parent";

  return (
    <main className="min-h-screen bg-[#f8fbf6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="rounded-[30px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <Link
                href={adminRoutes.hr}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-2 text-xs font-black text-green-900 transition hover:bg-green-100 sm:text-sm"
              >
                <ArrowLeft size={16} />
                Back to HR
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-green-800 text-white">
                  <GraduationCap size={28} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                    Admin / SitGuru University
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-5xl">
                    Training Manager
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-5xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                Manage Pet Parent Academy, Guru Academy, and Ambassador Academy
                from one clean backend. Each academy should have one active
                orientation record with three user-facing actions: watch the
                video, review the guide, and acknowledge completion to earn the
                certification badge.
              </p>

              <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-green-900">
                Super Admin Only: Jason and Danette can manage this page.
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-auto">
              <Link
                href={adminRoutes.ambassadors}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
              >
                <BadgeCheck size={17} />
                Ambassadors
              </Link>

              <Link
                href="/ambassador/training"
                target="_blank"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                <ExternalLink size={17} />
                Preview Training
              </Link>
            </div>
          </div>
        </section>

        {notice ? (
          <section
            className={`rounded-[24px] border p-4 text-sm font-bold leading-6 ${
              notice.tone === "success"
                ? "border-green-100 bg-green-50 text-green-900"
                : "border-red-100 bg-red-50 text-red-800"
            }`}
          >
            <p className="font-black">{notice.title}</p>
            <p className="mt-1">{notice.message}</p>
          </section>
        ) : null}

        <section className="grid gap-3 lg:grid-cols-3">
          {academyCounts.map((academy) => {
            const active = academyFilter === academy.value;

            return (
              <Link
                key={academy.value}
                href={`${adminRoutes.ambassadorTraining}?academy=${academy.value}`}
                className={`rounded-[26px] border p-5 shadow-sm transition ${
                  active
                    ? "border-green-300 bg-green-50 ring-4 ring-green-100"
                    : "border-[#dfe9e2] bg-white hover:bg-green-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-3xl">{academy.emoji}</p>
                    <h2 className="mt-2 text-xl font-black text-green-950">
                      {academy.label}
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {academy.detail}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-white px-3 py-2 text-right">
                    <p className="text-xl font-black text-green-950">
                      {academy.active ? "Ready" : "Setup"}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      Orientation
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <MiniStat
                    label="Audience"
                    value={academy.audience}
                    detail="assigned users"
                  />
                  <MiniStat
                    label="Flow"
                    value="Easy as 1, 2, 3"
                    detail={
                      academy.legacy
                        ? `${number(academy.legacy)} legacy hidden`
                        : "clean academy path"
                    }
                  />
                  <MiniStat
                    label="Materials"
                    value={number(academy.materials)}
                    detail="step resources"
                  />
                  <MiniStat
                    label="Credential"
                    value={academy.certificate}
                    detail="completion badge"
                  />
                </div>
              </Link>
            );
          })}
        </section>

        <section className="flex flex-wrap gap-2 rounded-[24px] border border-green-100 bg-white p-3 shadow-sm">
          <AcademyFilterLink
            active={academyFilter === "all"}
            href={adminRoutes.ambassadorTraining}
          >
            All Academies
          </AcademyFilterLink>

          {academyOptions.map((academy) => (
            <AcademyFilterLink
              key={academy.value}
              active={academyFilter === academy.value}
              href={`${adminRoutes.ambassadorTraining}?academy=${academy.value}`}
            >
              {academy.emoji} {academy.shortLabel}
            </AcademyFilterLink>
          ))}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            icon={<ClipboardList size={20} />}
            label="Orientation Records"
            value={number(steps.length)}
            detail={
              selectedAcademy
                ? `${selectedAcademy.label} active setup`
                : "One core record per academy"
            }
          />
          <MetricCard
            icon={<FileText size={20} />}
            label="Materials"
            value={number(visibleStepMaterials.length)}
            detail={`${number(activeMaterials.length)} active materials`}
          />
          <MetricCard
            icon={<BadgeCheck size={20} />}
            label="Required"
            value={number(requiredSteps.length)}
            detail={`${number(requiredMaterials.length)} required materials`}
          />
          <MetricCard
            icon={<CheckCircle2 size={20} />}
            label="Acknowledgment"
            value={number(acknowledgmentSteps.length)}
            detail="Requires checkbox"
          />
          <MetricCard
            icon={<ClipboardList size={20} />}
            label="Signature"
            value={number(signatureSteps.length)}
            detail="Requires typed certification"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <DashboardCard>
            <div className="mb-5">
              <SectionHeader
                icon={<Plus size={22} />}
                title="Add Orientation Record"
                detail="Create one active orientation record per academy. Add the three user-facing actions as materials under that one record: video, guide, and certification."
              />
            </div>

            <TrainingStepForm
              action={createTrainingStep}
              submitLabel="Add Training Step"
              defaultAcademyType={defaultAcademyType}
              defaultStepNumber={defaultStepNumber}
              defaultTitle={getOrientationTitle(defaultAcademyType)}
              defaultDescription={getOrientationDescription(defaultAcademyType)}
              defaultIsActive
              defaultIsRequired
              defaultRequiresAcknowledgment
            />
          </DashboardCard>

          <DashboardCard>
            <div className="mb-5">
              <SectionHeader
                icon={<BookOpenCheck size={22} />}
                title={
                  selectedAcademy
                    ? `${selectedAcademy.label} Orientation`
                    : "Academy Orientations"
                }
                detail="Keep one active orientation record per academy. Add only the three clean actions inside that record: Step 1 video, Step 2 guide, Step 3 acknowledgment/certification."
              />
            </div>

            <div className="grid gap-4">
              {steps.length ? (
                steps.map((step) => (
                  <TrainingStepEditor
                    key={step.id}
                    step={step}
                    materials={materialsByStep.get(step.id) || []}
                    completedCount={completedByStep.get(step.id) || 0}
                    startedCount={startedByStep.get(step.id) || 0}
                    saved={savedStepId === step.id}
                    orientationMode
                  />
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-green-200 bg-green-50 p-6 text-center">
                  <BookOpenCheck
                    className="mx-auto mb-3 text-green-700"
                    size={36}
                  />
                  <h2 className="text-lg font-black text-green-950">
                    No orientation record yet
                  </h2>
                  <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-green-900/75">
                    Add one orientation record, then add the video, guide, and
                    certification materials inside it.
                  </p>
                </div>
              )}

              {legacySteps.length ? (
                <details className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                  <summary className="cursor-pointer list-none text-sm font-black text-amber-950">
                    Legacy / extra steps hidden from the simplified academy flow
                    ({number(legacySteps.length)})
                  </summary>

                  <p className="mt-2 text-xs font-bold leading-5 text-amber-900/80">
                    These older step records are separated so they do not
                    confuse the Easy as 1, 2, 3 backend. Deactivate them if they
                    should not appear to users.
                  </p>

                  <div className="mt-4 grid gap-4">
                    {legacySteps.map((step) => (
                      <TrainingStepEditor
                        key={step.id}
                        step={step}
                        materials={materialsByStep.get(step.id) || []}
                        completedCount={completedByStep.get(step.id) || 0}
                        startedCount={startedByStep.get(step.id) || 0}
                        saved={savedStepId === step.id}
                      />
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          </DashboardCard>
        </section>

        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoTile
              icon={<Users size={20} />}
              title="Multi-academy assignments"
              detail="A user can be assigned Pet Parent Academy, Guru Academy, Ambassador Academy, or multiple academies depending on their SitGuru role."
            />
            <InfoTile
              icon={<ShieldCheck size={20} />}
              title="Required material control"
              detail="Each step can now have multiple required or optional materials. Required materials should be reviewed before step completion."
            />
            <InfoTile
              icon={<LockKeyhole size={20} />}
              title="Certification control"
              detail="Use acknowledgment and typed signature on key steps such as safety, payouts, policy acknowledgments, and final certification."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function TrainingStepEditor({
  step,
  materials,
  completedCount,
  startedCount,
  saved,
  orientationMode = false,
}: {
  step: TrainingStep;
  materials: TrainingMaterial[];
  completedCount: number;
  startedCount: number;
  saved?: boolean;
  orientationMode?: boolean;
}) {
  const active = step.is_active !== false;
  const primaryMaterialUrl = getTrainingMaterialUrl(step);
  const academy = getAcademyOption(step.academy_type);
  const activeMaterials = materials.filter(
    (material) => material.is_active !== false,
  );
  const requiredMaterials = materials.filter(
    (material) => material.is_required !== false,
  );
  const materialPlan = getOrientationMaterialPlan(step.academy_type);

  return (
    <article
      className={[
        "rounded-[28px] border bg-[#fbfcf9] p-4 sm:p-5",
        saved ? "border-green-400 ring-4 ring-green-100" : "border-[#dfe9e2]",
      ].join(" ")}
    >
      {saved ? (
        <div className="mb-4 rounded-[22px] border border-green-200 bg-green-700 px-5 py-4 text-white shadow-lg shadow-emerald-900/15">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-black">Saved</p>
              <p className="mt-1 text-sm font-bold text-green-50">
                This training step was updated successfully. The attached
                material is now saved to this step.
              </p>
            </div>
            <span className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-black text-green-800">
              Step {step.step_number} saved
            </span>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green-800 px-3 py-1 text-xs font-black text-white">
              {academy.emoji} {academy.shortLabel}
            </span>

            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
              Step {step.step_number}
            </span>

            <StatusPill active={active}>
              {active ? "Active" : "Inactive"}
            </StatusPill>

            {step.is_required !== false ? (
              <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
                Required
              </span>
            ) : (
              <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
                Optional
              </span>
            )}

            {step.requires_signature ? (
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-900">
                Signature
              </span>
            ) : null}

            {step.requires_acknowledgment !== false ? (
              <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">
                Acknowledgment
              </span>
            ) : null}
          </div>

          <h2 className="text-2xl font-black tracking-tight text-green-950">
            {step.title}
          </h2>

          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
            {step.description || "No description added yet."}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <MiniStat
              label="Started"
              value={number(startedCount)}
              detail="in progress"
            />
            <MiniStat
              label="Completed"
              value={number(completedCount)}
              detail="users"
            />
            <MiniStat
              label="Materials"
              value={number(materials.length)}
              detail={`${number(requiredMaterials.length)} required`}
            />
            <MiniStat
              label="Active"
              value={number(activeMaterials.length)}
              detail="visible resources"
            />
          </div>

          {orientationMode ? (
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {materialPlan.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-green-100 bg-white p-3"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-green-700">
                    {item.label} · {item.type}
                  </p>
                  <p className="mt-1 text-sm font-black text-green-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {primaryMaterialUrl ? (
            <a
              href={primaryMaterialUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <ExternalLink size={16} />
              Open Primary
            </a>
          ) : null}

          <form action={toggleTrainingStepStatus}>
            <input type="hidden" name="step_id" value={step.id} />
            <input type="hidden" name="academy_type" value={academy.value} />
            <input type="hidden" name="next_active" value={String(!active)} />
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              {active ? <ToggleLeft size={17} /> : <ToggleRight size={17} />}
              {active ? "Deactivate" : "Activate"}
            </button>
          </form>
        </div>
      </div>

      <div className="mb-4 rounded-[24px] border border-green-100 bg-white p-4">
        <div className="mb-3 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="text-base font-black text-green-950">
              Training Materials
            </h3>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              For the simplified flow, keep this clean: Material 1 = video,
              Material 2 = guide/PDF/PowerPoint, Material 3 = certification
              acknowledgment.
            </p>
          </div>

          <details className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
            <summary className="cursor-pointer list-none text-sm font-black text-green-900">
              + Add Material
            </summary>

            <div className="mt-4">
              <TrainingMaterialForm
                action={createTrainingMaterial}
                submitLabel="Add Material"
                step={step}
                defaultSortOrder={materials.length + 1}
              />
            </div>
          </details>
        </div>

        {materials.length ? (
          <div className="grid gap-3">
            {materials.map((material) => (
              <TrainingMaterialCard
                key={material.id}
                material={material}
                step={step}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/60 p-4 text-sm font-bold leading-6 text-green-900">
            No materials have been added yet. Add only the three core items:
            video, guide, and certification acknowledgment.
          </div>
        )}
      </div>

      <details className="rounded-[24px] border border-green-100 bg-white p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-black text-green-900">
          <Pencil size={16} />
          Edit Step {step.step_number}
        </summary>

        <div className="mt-4">
          <TrainingStepForm
            action={updateTrainingStep}
            submitLabel="Save Training Step"
            step={step}
          />
        </div>
      </details>

      <div className="mt-3 text-xs font-bold text-slate-400">
        Last updated: {formatDate(step.updated_at)}
      </div>
    </article>
  );
}

function TrainingMaterialCard({
  material,
  step,
}: {
  material: TrainingMaterial;
  step: TrainingStep;
}) {
  const academy = getAcademyOption(material.academy_type || step.academy_type);
  const active = material.is_active !== false;
  const materialUrl = getMaterialUrl(material);

  return (
    <div className="rounded-[22px] border border-[#dfe9e2] bg-[#fbfcf9] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700">
              Material {material.sort_order || 1}
            </span>
            <StatusPill active={active}>
              {active ? "Active" : "Inactive"}
            </StatusPill>
            {material.is_required !== false ? (
              <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
                Required
              </span>
            ) : (
              <span className="rounded-full border border-slate-100 bg-white px-3 py-1 text-xs font-black text-slate-600">
                Optional
              </span>
            )}
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-900">
              {getContentTypeLabel(material.content_type)}
            </span>
          </div>

          <h4 className="text-lg font-black text-green-950">
            {material.title}
          </h4>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            {material.description || "No material description added yet."}
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <MiniStat
              label="Source"
              value={getMaterialLocationLabel(material)}
              detail={getContentTypeLabel(material.content_type)}
            />
            <MiniStat
              label="Bucket"
              value={asString(material.storage_bucket) || "—"}
              detail="Supabase storage"
            />
            <MiniStat
              label="Path"
              value={asString(material.storage_path) || "—"}
              detail="file location"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {materialUrl ? (
            <a
              href={materialUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2 text-xs font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <ExternalLink size={14} />
              Open
            </a>
          ) : null}

          <form action={toggleTrainingMaterialStatus}>
            <input type="hidden" name="material_id" value={material.id} />
            <input type="hidden" name="academy_type" value={academy.value} />
            <input type="hidden" name="next_active" value={String(!active)} />
            <button
              type="submit"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2 text-xs font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              {active ? "Deactivate" : "Activate"}
            </button>
          </form>
        </div>
      </div>

      <details className="mt-3 rounded-2xl border border-green-100 bg-white p-3">
        <summary className="cursor-pointer list-none text-xs font-black uppercase tracking-[0.12em] text-green-900">
          Edit material
        </summary>

        <div className="mt-3">
          <TrainingMaterialForm
            action={updateTrainingMaterial}
            submitLabel="Save Material"
            step={step}
            material={material}
          />
        </div>
      </details>

      <details className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3">
        <summary className="cursor-pointer list-none text-xs font-black uppercase tracking-[0.12em] text-red-800">
          Delete material
        </summary>

        <form action={deleteTrainingMaterial} className="mt-3">
          <input type="hidden" name="material_id" value={material.id} />
          <input type="hidden" name="academy_type" value={academy.value} />
          <p className="mb-3 text-xs font-bold leading-5 text-red-800">
            This removes this material from the step and deletes its uploaded
            Supabase Storage file, if one is attached.
          </p>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-red-700 px-4 py-2 text-xs font-black text-white transition hover:bg-red-800"
          >
            Delete Material
          </button>
        </form>
      </details>
    </div>
  );
}

function TrainingMaterialForm({
  action,
  submitLabel,
  step,
  material,
  defaultSortOrder = 1,
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  step: TrainingStep;
  material?: TrainingMaterial;
  defaultSortOrder?: number;
}) {
  const academy = getAcademyOption(step.academy_type);
  const isEdit = Boolean(material?.id);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="training_step_id" value={step.id} />
      <input type="hidden" name="academy_type" value={academy.value} />
      <input type="hidden" name="step_number" value={step.step_number} />
      <input type="hidden" name="step_title" value={step.title} />
      {isEdit ? (
        <input type="hidden" name="material_id" value={material?.id} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
        <FormField label="Material Title">
          <input
            name="title"
            placeholder={`Step ${step.step_number} material title`}
            defaultValue={material?.title || ""}
            className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
          />
        </FormField>

        <FormField label="Sort Order">
          <input
            name="sort_order"
            type="number"
            min={1}
            defaultValue={material?.sort_order || defaultSortOrder}
            className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
          />
        </FormField>
      </div>

      <FormField label="Material Description">
        <textarea
          name="description"
          rows={3}
          placeholder="Explain what this material covers inside this training step."
          defaultValue={material?.description || ""}
          className="w-full resize-none rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
        />
      </FormField>

      <FormField label="Material Type">
        <select
          name="content_type"
          defaultValue={material?.content_type || "document"}
          className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
        >
          {contentTypes.map((type) => (
            <option key={type} value={type}>
              {getContentTypeLabel(type)}
            </option>
          ))}
        </select>
      </FormField>

      <div className="rounded-[24px] border border-green-100 bg-green-50/60 p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-green-800 shadow-sm">
            <LinkIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-green-950">
              Material File / Link
            </h3>
            <p className="mt-1 text-xs font-bold leading-5 text-green-900/75">
              Attach a file for the easiest workflow. SitGuru will upload it to
              Supabase Storage and save the bucket/path automatically. Use URLs
              only for externally hosted videos or resources.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <TrainingMaterialUploadField
            academyType={academy.value}
            stepNumber={step.step_number}
            stepTitle={step.title}
            initialBucket={material?.storage_bucket || universityStorageBucket}
            initialPath={material?.storage_path || ""}
            isEdit={isEdit}
          />

          <FormField label="Video URL">
            <input
              name="video_url"
              placeholder="Only use this for YouTube/Vimeo/Synthesia-style video links"
              defaultValue={material?.video_url || ""}
              className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
            />
          </FormField>

          <FormField label="External URL">
            <input
              name="external_url"
              placeholder="https://..."
              defaultValue={material?.external_url || ""}
              className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
            />
          </FormField>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxField
          name="is_active"
          label="Active / visible to assigned users"
          defaultChecked={material ? material.is_active !== false : true}
        />
        <CheckboxField
          name="is_required"
          label="Required inside this step"
          defaultChecked={material ? material.is_required !== false : true}
        />
      </div>

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
      >
        <Save size={17} />
        {submitLabel}
      </button>
    </form>
  );
}

function TrainingStepForm({
  action,
  submitLabel,
  step,
  defaultAcademyType = "ambassador",
  defaultStepNumber,
  defaultIsRequired = false,
  defaultIsActive = false,
  defaultRequiresAcknowledgment = false,
  defaultTitle = "",
  defaultDescription = "",
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  step?: TrainingStep;
  defaultAcademyType?: AcademyType;
  defaultStepNumber?: number;
  defaultIsRequired?: boolean;
  defaultIsActive?: boolean;
  defaultRequiresAcknowledgment?: boolean;
  defaultTitle?: string;
  defaultDescription?: string;
}) {
  const isEdit = Boolean(step?.id);
  const academy = getAcademyOption(step?.academy_type || defaultAcademyType);

  return (
    <form action={action} className="grid gap-4">
      {isEdit ? <input type="hidden" name="step_id" value={step?.id} /> : null}

      <FormField label="Academy Type">
        <select
          name="academy_type"
          defaultValue={academy.value}
          className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
        >
          {academyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.emoji} {option.label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Step Number">
          <input
            name="step_number"
            type="number"
            min={1}
            defaultValue={step?.step_number || defaultStepNumber || 1}
            className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
          />
        </FormField>

        <FormField label="Estimated Minutes">
          <input
            name="estimated_minutes"
            type="number"
            min={1}
            defaultValue={step?.estimated_minutes || 5}
            className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
          />
        </FormField>
      </div>

      <FormField label="Training Title">
        <input
          name="title"
          placeholder="Certified Pet Parent Orientation"
          defaultValue={step?.title || defaultTitle}
          className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
        />
      </FormField>

      <FormField label="Description">
        <textarea
          name="description"
          rows={4}
          placeholder="Explain what this training orientation covers."
          defaultValue={step?.description || defaultDescription}
          className="w-full resize-none rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
        />
      </FormField>

      <FormField label="Primary / Legacy Content Type">
        <select
          name="content_type"
          defaultValue={step?.content_type || "video"}
          className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
        >
          {contentTypes.map((type) => (
            <option key={type} value={type}>
              {getContentTypeLabel(type)}
            </option>
          ))}
        </select>
      </FormField>

      <div className="rounded-[24px] border border-green-100 bg-green-50/60 p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-green-800 shadow-sm">
            <LinkIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-green-950">
              Primary / Legacy Material
            </h3>
            <p className="mt-1 text-xs font-bold leading-5 text-green-900/75">
              This keeps your original one-material fields working. Use Training
              Materials above for multiple portions inside the same step.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <FormField label="Video URL">
            <input
              name="video_url"
              placeholder="https://..."
              defaultValue={step?.video_url || ""}
              className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
            />
          </FormField>

          <FormField label="External URL">
            <input
              name="external_url"
              placeholder="https://..."
              defaultValue={step?.external_url || ""}
              className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Storage Bucket">
              <input
                name="storage_bucket"
                placeholder="sitguru-university"
                defaultValue={step?.storage_bucket || ""}
                className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
              />
            </FormField>

            <FormField label="Storage Path">
              <input
                name="storage_path"
                placeholder="guru-academy/module-1.mp4"
                defaultValue={step?.storage_path || ""}
                className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
              />
            </FormField>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxField
          name="is_active"
          label="Active / visible to assigned users"
          defaultChecked={step ? step.is_active !== false : defaultIsActive}
        />
        <CheckboxField
          name="is_required"
          label="Required for academy completion"
          defaultChecked={step ? step.is_required !== false : defaultIsRequired}
        />
        <CheckboxField
          name="requires_acknowledgment"
          label="Requires completion acknowledgment"
          defaultChecked={
            step
              ? step.requires_acknowledgment !== false
              : defaultRequiresAcknowledgment
          }
        />
        <CheckboxField
          name="requires_signature"
          label="Requires typed signature"
          defaultChecked={step?.requires_signature === true}
        />
      </div>

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
      >
        <Save size={17} />
        {submitLabel}
      </button>
    </form>
  );
}

function AcademyFilterLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? "bg-green-800 text-white shadow-lg shadow-emerald-900/15"
          : "border border-green-100 bg-green-50 text-green-900 hover:bg-green-100"
      }`}
    >
      {children}
    </Link>
  );
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-[#dfe9e2] bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-2xl font-black text-green-950">{title}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          {detail}
        </p>
      </div>
    </div>
  );
}

function MetricCard({
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
    <div className="rounded-[24px] border border-[#dfe9e2] bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-green-950">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-green-950">
        {value}
      </p>
      <p className="break-words text-xs font-bold text-slate-500">{detail}</p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-green-100 bg-white p-3 text-sm font-black text-slate-900">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-green-700"
      />
      {label}
    </label>
  );
}

function StatusPill({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black ${
        active
          ? "border-green-100 bg-green-50 text-green-900"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {children}
    </span>
  );
}

function InfoTile({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-green-100 bg-green-50/60 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-green-800">
        {icon}
      </div>
      <h3 className="text-sm font-black text-green-950">{title}</h3>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
        {detail}
      </p>
    </div>
  );
}
