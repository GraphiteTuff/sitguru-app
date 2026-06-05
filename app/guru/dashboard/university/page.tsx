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
  ImageIcon,
  LockKeyhole,
  PlayCircle,
  ShieldCheck,
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
  acknowledged_at?: string | null;
  completed_at?: string | null;
};

type MaterialWithUrl = TrainingMaterial & {
  openUrl: string;
  downloadUrl: string;
  acknowledgedAt: string | null;
  isAcknowledged: boolean;
};

type OrientationData = {
  orientationStep: TrainingStep | null;
  videoMaterial: MaterialWithUrl | null;
  guideMaterial: MaterialWithUrl | null;
  certificationMaterial: MaterialWithUrl | null;
  allDisplayedMaterials: MaterialWithUrl[];
  requiredDisplayedMaterials: MaterialWithUrl[];
  acknowledgedRequiredMaterials: number;
  completedAt: string | null;
  isCompleted: boolean;
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const academyType = "guru";

const guruRoutes = {
  dashboard: "/guru/dashboard",
  university: "/guru/dashboard/university",
  profile: "/guru/dashboard/profile",
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

function getAuthMetadata(authUser: AnyRow | null | undefined) {
  const userMetadata = authUser?.user_metadata;
  const rawUserMetadata = authUser?.raw_user_meta_data;

  if (userMetadata && typeof userMetadata === "object") {
    return userMetadata as AnyRow;
  }

  if (rawUserMetadata && typeof rawUserMetadata === "object") {
    return rawUserMetadata as AnyRow;
  }

  return null;
}

function getDisplayName({
  profile,
  guru,
  authUser,
}: {
  profile: AnyRow | null;
  guru: AnyRow | null;
  authUser: AnyRow | null;
}) {
  const metadata = getAuthMetadata(authUser);

  const firstName =
    asString(profile?.first_name) ||
    asString(guru?.first_name) ||
    asString(metadata?.first_name) ||
    asString(metadata?.given_name);
  const lastName =
    asString(profile?.last_name) ||
    asString(guru?.last_name) ||
    asString(metadata?.last_name) ||
    asString(metadata?.family_name);
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();

  return (
    combined ||
    asString(profile?.full_name) ||
    asString(profile?.display_name) ||
    asString(profile?.name) ||
    asString(guru?.full_name) ||
    asString(guru?.display_name) ||
    asString(guru?.name) ||
    asString(metadata?.full_name) ||
    asString(metadata?.name) ||
    asString(metadata?.display_name) ||
    "Guru"
  );
}

function getFirstName(displayName: string) {
  const cleanName = displayName.replace(/@.*/, "").trim();
  const firstName = cleanName.split(/[\s._-]+/).filter(Boolean)[0];

  return firstName || "Guru";
}

function getInitials(displayName: string) {
  const cleanName = displayName.replace(/@.*/, "").trim();
  const parts = cleanName.split(/[\s._-]+/).filter(Boolean);

  const firstInitial = parts[0]?.charAt(0) || "G";
  const secondInitial = parts[1]?.charAt(0) || "G";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function getAvatarUrl({
  profile,
  guru,
  authUser,
}: {
  profile: AnyRow | null;
  guru: AnyRow | null;
  authUser: AnyRow | null;
}) {
  const metadata = getAuthMetadata(authUser);

  return (
    asString(guru?.avatar_url) ||
    asString(guru?.profile_photo_url) ||
    asString(guru?.photo_url) ||
    asString(guru?.image_url) ||
    asString(guru?.profile_image_url) ||
    asString(profile?.avatar_url) ||
    asString(profile?.profile_photo_url) ||
    asString(profile?.photo_url) ||
    asString(profile?.image_url) ||
    asString(profile?.profile_image_url) ||
    asString(metadata?.avatar_url) ||
    asString(metadata?.profile_photo_url) ||
    asString(metadata?.photo_url) ||
    asString(metadata?.picture) ||
    asString(metadata?.image_url)
  );
}

function getContentTypeLabel(value?: string | null) {
  const normalized = asString(value).toLowerCase();

  if (normalized === "video") return "Video";
  if (normalized === "ppt" || normalized === "powerpoint") return "PowerPoint";
  if (normalized === "pdf") return "PDF";
  if (normalized === "document") return "Document";
  if (normalized === "image") return "Image / Slide";
  if (normalized === "certification") return "Certification";

  return "Training";
}

function getMaterialIcon(type?: string | null) {
  const normalized = asString(type).toLowerCase();

  if (normalized === "video") return <PlayCircle size={18} />;
  if (normalized === "image") return <ImageIcon size={18} />;
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
  const type = asString(material.content_type).toLowerCase();
  const title = asString(material.title).toLowerCase();

  return type === "video" || title.includes("video") || title.includes("masterclass");
}

function isCertificationMaterial(material: TrainingMaterial) {
  const type = asString(material.content_type).toLowerCase();
  const title = asString(material.title).toLowerCase();

  return (
    type === "certification" ||
    title.includes("certification") ||
    title.includes("certificate") ||
    title.includes("badge") ||
    title.includes("acknowledg")
  );
}

function isGuideMaterial(material: TrainingMaterial) {
  return !isVideoMaterial(material) && !isCertificationMaterial(material);
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

async function getGuruProfileData(userId: string) {
  try {
    const [{ data: profile }, { data: guru }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabaseAdmin.from("gurus").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    return {
      profile: (profile || null) as AnyRow | null,
      guru: (guru || null) as AnyRow | null,
    };
  } catch {
    return {
      profile: null,
      guru: null,
    };
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
      .select("training_step_id,status,acknowledged_at,completed_at")
      .eq("user_id", userId)
      .eq("academy_type", academyType),
  ]);

  if (materialProgressResult.error) {
    console.warn(
      "Unable to load Guru Academy material progress:",
      materialProgressResult.error,
    );
  }

  if (stepProgressResult.error) {
    console.warn(
      "Unable to load Guru Academy step progress:",
      stepProgressResult.error,
    );
  }

  return {
    materialProgressRows: (materialProgressResult.data || []) as MaterialProgress[],
    stepProgressRows: (stepProgressResult.data || []) as StepProgress[],
  };
}

async function getGuruUniversityData(userId: string): Promise<OrientationData> {
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
    console.warn("Unable to load Guru Academy steps:", stepsResult.error);
  }

  if (materialsResult.error) {
    console.warn("Unable to load Guru Academy materials:", materialsResult.error);
  }

  const steps = ((stepsResult.data || []) as TrainingStep[]).sort(
    (a, b) => asNumber(a.step_number) - asNumber(b.step_number),
  );
  const orientationStep = steps[0] || null;
  const orientationStepId = asString(orientationStep?.id);

  const materialProgressByMaterialId = new Map<string, MaterialProgress>();
  const stepProgressByStepId = new Map<string, StepProgress>();

  progressResult.materialProgressRows.forEach((row) => {
    const materialId = asString(row.material_id);
    if (materialId) materialProgressByMaterialId.set(materialId, row);
  });

  progressResult.stepProgressRows.forEach((row) => {
    const stepId = asString(row.training_step_id);
    if (stepId) stepProgressByStepId.set(stepId, row);
  });

  const rawMaterials = ((materialsResult.data || []) as TrainingMaterial[])
    .filter((material) => {
      if (!orientationStepId) return true;
      return asString(material.training_step_id) === orientationStepId;
    })
    .sort(sortMaterials);

  const materialsWithUrls: MaterialWithUrl[] = [];

  for (const material of rawMaterials) {
    const signedUrls = await getSignedMaterialUrls(material);
    const materialProgress = materialProgressByMaterialId.get(material.id);
    const acknowledgedAt = asString(materialProgress?.acknowledged_at) || null;

    materialsWithUrls.push({
      ...material,
      ...signedUrls,
      acknowledgedAt,
      isAcknowledged: Boolean(acknowledgedAt),
    });
  }

  const videoMaterial = materialsWithUrls.find(isVideoMaterial) || null;
  const guideMaterial =
    materialsWithUrls.find((material) => material.id !== videoMaterial?.id && isGuideMaterial(material)) ||
    null;
  const certificationMaterial =
    materialsWithUrls.find(
      (material) =>
        material.id !== videoMaterial?.id &&
        material.id !== guideMaterial?.id &&
        isCertificationMaterial(material),
    ) || null;

  const allDisplayedMaterials = [videoMaterial, guideMaterial, certificationMaterial].filter(
    Boolean,
  ) as MaterialWithUrl[];
  const requiredDisplayedMaterials = [videoMaterial, guideMaterial].filter(
    Boolean,
  ) as MaterialWithUrl[];

  const stepProgress = orientationStepId
    ? stepProgressByStepId.get(orientationStepId)
    : null;
  const completedAt = asString(stepProgress?.completed_at) || null;

  return {
    orientationStep,
    videoMaterial,
    guideMaterial,
    certificationMaterial,
    allDisplayedMaterials,
    requiredDisplayedMaterials,
    acknowledgedRequiredMaterials: requiredDisplayedMaterials.filter(
      (material) => material.isAcknowledged,
    ).length,
    completedAt,
    isCompleted: Boolean(completedAt),
  };
}


function getCertificationName() {
  return "Certified Guru";
}

function getFormalAcademyName() {
  return "Guru Academy";
}

function getCertifiedRoleName() {
  return "Guru";
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    "https://www.sitguru.com"
  ).replace(/\/$/, "");
}

function getEmailFromName() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.SITGURU_FROM_EMAIL ||
    "SitGuru University <support@sitguru.com>"
  );
}

function getCertificateNoticeEmailHtml({
  firstName,
  academyName,
  certifiedRoleName,
  dashboardUrl,
}: {
  firstName: string;
  academyName: string;
  certifiedRoleName: string;
  dashboardUrl: string;
}) {
  return `
    <div style="margin:0;padding:0;background:#f3fbf7;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3fbf7;padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #d7f3e3;">
              <tr>
                <td style="background:linear-gradient(135deg,#00d69f,#b8e5ff);padding:34px 28px;text-align:center;">
                  <div style="font-size:42px;line-height:1;margin-bottom:12px;">🐾</div>
                  <h1 style="margin:0;font-size:28px;line-height:1.15;font-weight:900;color:#062f2b;">Congratulations, ${firstName}!</h1>
                  <p style="margin:12px 0 0;font-size:16px;line-height:1.6;font-weight:700;color:#123833;">Your SitGuru University certification is complete.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:30px 28px;">
                  <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#334155;">You have successfully completed the <strong>${academyName}</strong>.</p>
                  <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#334155;">You are now a <strong>Certified SitGuru ${certifiedRoleName}</strong>. Your certification badge has been issued and will appear on your SitGuru profile.</p>
                  <div style="margin:22px 0;padding:18px;border-radius:18px;background:#ecfdf5;border:1px solid #bbf7d0;color:#065f46;">
                    <p style="margin:0;font-size:15px;line-height:1.6;font-weight:800;">Your official SitGuru University Certificate of Completion will be prepared and sent within 24 hours.</p>
                  </div>
                  <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#475569;">This certificate will include your name, academy completed, completion date, certificate ID, and SitGuru verification details.</p>
                  <a href="${dashboardUrl}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-weight:900;padding:14px 20px;border-radius:16px;font-size:14px;">Open SitGuru Dashboard</a>
                  <p style="margin:28px 0 0;font-size:15px;line-height:1.7;color:#475569;">Thank you for taking the time to complete your training and for being part of the SitGuru community.</p>
                  <p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#334155;font-weight:800;">The SitGuru Team<br/>SitGuru University</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function getCertificateNoticeEmailText({
  firstName,
  academyName,
  certifiedRoleName,
  dashboardUrl,
}: {
  firstName: string;
  academyName: string;
  certifiedRoleName: string;
  dashboardUrl: string;
}) {
  return [
    `Hi ${firstName},`,
    "",
    `Congratulations on completing your SitGuru University ${academyName}.`,
    "",
    `You are now a Certified SitGuru ${certifiedRoleName}. Your certification badge has been issued and will appear on your SitGuru profile.`,
    "",
    "Your official SitGuru University Certificate of Completion will be prepared and sent within 24 hours. This certificate will include your name, academy completed, completion date, certificate ID, and SitGuru verification details.",
    "",
    `Open your dashboard: ${dashboardUrl}`,
    "",
    "Thank you for taking the time to complete your training and for being part of the SitGuru community.",
    "",
    "Sincerely,",
    "The SitGuru Team",
    "SitGuru University",
  ].join("\n");
}

async function sendCertificationEmail({
  to,
  firstName,
}: {
  to?: string | null;
  firstName: string;
}) {
  const cleanTo = asString(to).toLowerCase();
  const resendApiKey = asString(process.env.RESEND_API_KEY);

  if (!cleanTo || !cleanTo.includes("@") || !resendApiKey) {
    return false;
  }

  const academyName = getFormalAcademyName();
  const certifiedRoleName = getCertifiedRoleName();
  const dashboardUrl = `${getSiteUrl()}${guruRoutes.dashboard}`;
  const subject = "Congratulations — Your SitGuru University Certification Is Complete";
  const adminBcc = [
    "jason@sitguru.com",
    "nette@sitguru.com",
    "support@sitguru.com",
  ];

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getEmailFromName(),
        to: [cleanTo],
        bcc: adminBcc,
        subject,
        html: getCertificateNoticeEmailHtml({
          firstName,
          academyName,
          certifiedRoleName,
          dashboardUrl,
        }),
        text: getCertificateNoticeEmailText({
          firstName,
          academyName,
          certifiedRoleName,
          dashboardUrl,
        }),
      }),
    });

    if (!response.ok) {
      console.warn("SitGuru University certification email failed:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.warn("SitGuru University certification email failed:", error);
    return false;
  }
}

async function issueAcademyCertification({
  userId,
  email,
  firstName,
}: {
  userId: string;
  email?: string | null;
  firstName: string;
}) {
  const now = new Date().toISOString();
  const emailSent = await sendCertificationEmail({ to: email, firstName });

  const { error } = await supabaseAdmin.from("academy_certifications").upsert(
    {
      user_id: userId,
      academy_type: academyType,
      certification_name: getCertificationName(),
      badge_status: "issued",
      certificate_status: "pending",
      email_sent_at: emailSent ? now : null,
      issued_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,academy_type" },
  );

  if (error) {
    console.warn("Unable to issue Guru Academy certification:", error);
    return false;
  }

  return true;
}

async function acknowledgeMaterial(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/guru/login");

  const materialId = asString(formData.get("material_id"));
  const trainingStepId = asString(formData.get("training_step_id"));
  const acknowledged = asBoolean(formData.get("acknowledgment"));

  if (!materialId || !trainingStepId || !acknowledged) {
    redirect(`${guruRoutes.university}?error=acknowledgment`);
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
    console.warn("Unable to acknowledge Guru Academy material:", upsertError);
    redirect(`${guruRoutes.university}?error=progress`);
  }

  revalidatePath(guruRoutes.university);
  revalidatePath(guruRoutes.dashboard);
  redirect(`${guruRoutes.university}?acknowledged=success`);
}

async function completeOrientation(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/guru/login");

  const trainingStepId = asString(formData.get("training_step_id"));
  const requiredMaterialIds = formData
    .getAll("required_material_id")
    .map((value) => asString(value))
    .filter(Boolean);

  if (!trainingStepId) redirect(`${guruRoutes.university}?error=step`);

  if (requiredMaterialIds.length) {
    const { data: acknowledgedRows, error: progressError } = await supabaseAdmin
      .from("academy_material_progress")
      .select("material_id,acknowledged_at")
      .eq("user_id", user.id)
      .eq("training_step_id", trainingStepId)
      .eq("academy_type", academyType);

    if (progressError) {
      console.warn("Unable to verify Guru Academy acknowledgments:", progressError);
      redirect(`${guruRoutes.university}?error=progress`);
    }

    const acknowledgedMaterialIds = new Set(
      ((acknowledgedRows || []) as Array<{
        material_id: string | null;
        acknowledged_at: string | null;
      }>)
        .filter((row) => row.material_id && row.acknowledged_at)
        .map((row) => row.material_id as string),
    );

    const missingRequiredAcknowledgment = requiredMaterialIds.some(
      (materialId) => !acknowledgedMaterialIds.has(materialId),
    );

    if (missingRequiredAcknowledgment) {
      redirect(`${guruRoutes.university}?error=incomplete`);
    }
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
    console.warn("Unable to complete Guru Academy orientation:", upsertError);
    redirect(`${guruRoutes.university}?error=progress`);
  }

  const { profile, guru } = await getGuruProfileData(user.id);
  const authUser = user as unknown as AnyRow;
  const displayName = getDisplayName({ profile, guru, authUser });
  const firstName = getFirstName(displayName);

  await issueAcademyCertification({
    userId: user.id,
    email: user.email,
    firstName,
  });

  revalidatePath(guruRoutes.university);
  revalidatePath(guruRoutes.dashboard);
  redirect(`${guruRoutes.university}?completed=success`);
}

function getNotice(searchParams?: Record<string, string | string[] | undefined>) {
  const acknowledged = asString(searchParams?.acknowledged);
  const completed = asString(searchParams?.completed);
  const error = asString(searchParams?.error);

  if (acknowledged === "success") {
    return {
      tone: "success" as const,
      title: "Acknowledgment saved",
      message: "Your training material acknowledgment was saved.",
    };
  }

  if (completed === "success") {
    return {
      tone: "success" as const,
      title: "Certified Guru badge issued",
      message:
        "Congratulations! Your badge has been issued. Your official SitGuru University certificate will be prepared and sent within 24 hours.",
    };
  }

  if (error === "incomplete") {
    return {
      tone: "error" as const,
      title: "Required acknowledgments still needed",
      message: "Please acknowledge the intro video and Guru Success Guide before completing certification.",
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
      message: "Confirm the academy progress tables exist in Supabase, then try again.",
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

export default async function GuruUniversityPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/guru/login");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const notice = getNotice(resolvedSearchParams);

  const [{ profile, guru }, orientationData] = await Promise.all([
    getGuruProfileData(user.id),
    getGuruUniversityData(user.id),
  ]);

  const authUser = user as unknown as AnyRow;
  const displayName = getDisplayName({ profile, guru, authUser });
  const firstName = getFirstName(displayName);
  const avatarUrl = getAvatarUrl({ profile, guru, authUser });
  const acknowledgedRequired = orientationData.acknowledgedRequiredMaterials;
  const requiredCount = orientationData.requiredDisplayedMaterials.length;
  const actionProgress =
    acknowledgedRequired + (orientationData.isCompleted ? 1 : 0);
  const actionProgressPercent = Math.round((actionProgress / 3) * 100);
  const academyCompleted = orientationData.isCompleted;
  const canCompleteOrientation =
    Boolean(orientationData.orientationStep) &&
    requiredCount > 0 &&
    acknowledgedRequired >= requiredCount;

  return (
    <main className="min-h-screen bg-[#f7fbf7] px-4 py-5 !text-[#062f2b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px] space-y-5">
        <section className="overflow-hidden rounded-[34px] border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-7 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-5 py-6 sm:px-7 md:px-10 md:py-9 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <Link
                href={guruRoutes.dashboard}
                className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-black !text-emerald-900 shadow-sm transition hover:bg-white"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>

              <p className="text-xs font-black uppercase tracking-[0.28em] !!text-slate-900/80">
                SitGuru University
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] !text-[#07132f] sm:text-5xl md:text-6xl">
                Learn SitGuru. Easy as 1, 2, 3.
              </h1>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-8 !!text-slate-900/75 md:text-lg">
                Hi {firstName}, learn the basics of SitGuru, how to complete your Guru
                profile, manage bookings professionally, provide safe pet care,
                set up payouts, and build trust with Pet Parents. Review the
                video and guide, then acknowledge completion to earn your
                Certified Guru badge.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <TrustBadge icon={<ShieldCheck size={15} />} label="Guru" />
                <TrustBadge
                  icon={<GraduationCap size={15} />}
                  label={`${actionProgress} of 3 actions complete`}
                />
                <TrustBadge icon={<Star size={15} />} label={`${actionProgressPercent}% complete`} />
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="rounded-[2.2rem] bg-white/75 p-5 shadow-xl ring-1 ring-white/60 backdrop-blur md:min-w-[280px]">
                <AvatarCircle avatarUrl={avatarUrl} displayName={displayName} />
                <h2 className="mt-4 text-2xl font-black !text-slate-950 md:text-3xl">
                  {firstName}
                </h2>
                <p className="mt-1 text-sm font-black !text-emerald-800">
                  {academyCompleted ? "Badge issued" : "Badge locked"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 bg-white px-5 py-5 sm:px-6 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardStatCard
              label="Progress"
              value={`${actionProgress} of 3`}
              detail="Video, guide, certification"
              icon={<GraduationCap size={20} />}
            />
            <DashboardStatCard
              label="Training"
              value="3 actions"
              detail="Easy as 1, 2, 3"
              icon={<ShieldCheck size={20} />}
            />
            <DashboardStatCard
              label="Badge"
              value={academyCompleted ? "Issued" : "Locked"}
              detail={academyCompleted ? "Certified Guru" : "Complete all actions"}
              icon={academyCompleted ? <BadgeCheck size={20} /> : <LockKeyhole size={20} />}
            />
          </div>
        </section>

        {notice ? (
          <section
            className={`rounded-[24px] border p-4 text-sm font-bold leading-6 ${
              notice.tone === "success"
                ? "border-green-100 bg-green-50 text-green-900"
                : "border-red-100 bg-red-50 !text-red-800"
            }`}
          >
            <p className="font-black">{notice.title}</p>
            <p className="mt-1">{notice.message}</p>
          </section>
        ) : null}

        <section className="rounded-[32px] border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] !text-emerald-700">
                  Certified Guru Orientation
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight !text-[#07132f] sm:text-4xl md:text-5xl">
                  Watch. Review. Acknowledge.
                </h2>
                <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 !text-slate-600 sm:text-base">
                  Learn the basics of SitGuru, how to complete your Guru profile,
                  manage bookings professionally, provide safe pet care, set up
                  payouts, and build trust with Pet Parents. Review the video and
                  guide, then acknowledge completion to earn your Certified Guru badge.
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-2xl px-5 py-3 text-sm font-black ${
                  academyCompleted
                    ? "bg-emerald-700 !text-white"
                    : "bg-white !text-emerald-900 ring-1 ring-emerald-100"
                }`}
              >
                {academyCompleted ? "Certified" : actionProgress > 0 ? "In progress" : "Not started"}
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              <OrientationActionCard
                stepLabel="Step 1"
                title="Watch the Intro Video"
                description="Learn the Guru opportunity, your role, and how SitGuru helps you earn income providing trusted pet care."
                material={orientationData.videoMaterial}
                orientationStepId={orientationData.orientationStep?.id || ""}
                icon={<PlayCircle size={22} />}
              />

              <OrientationActionCard
                stepLabel="Step 2"
                title="Review the Guru Success Guide"
                description="Understand profile setup, bookings, communication, care standards, Stripe payouts, earnings, safety, and reviews."
                material={orientationData.guideMaterial}
                orientationStepId={orientationData.orientationStep?.id || ""}
                icon={<FileText size={22} />}
              />

              <CertificationActionCard
                stepLabel="Step 3"
                title="Acknowledge & Get Certified"
                description="Confirm you reviewed the training. Your badge is issued immediately, and your official certificate will be prepared and sent within 24 hours."
                orientationStep={orientationData.orientationStep}
                requiredMaterials={orientationData.requiredDisplayedMaterials}
                canComplete={canCompleteOrientation}
                isCompleted={orientationData.isCompleted}
                completedAt={orientationData.completedAt}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AvatarCircle({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string;
  displayName: string;
}) {
  return (
    <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-[7px] border-white bg-white text-4xl font-black !text-emerald-800 shadow-2xl sm:h-36 sm:w-36">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${displayName} profile photo`}
          className="h-full w-full object-cover object-center"
        />
      ) : (
        getInitials(displayName)
      )}
    </div>
  );
}

function OrientationActionCard({
  stepLabel,
  title,
  description,
  material,
  orientationStepId,
  icon,
}: {
  stepLabel: string;
  title: string;
  description: string;
  material: MaterialWithUrl | null;
  orientationStepId: string;
  icon: ReactNode;
}) {
  const hasUrl = Boolean(material?.openUrl);

  return (
    <article
      className={`rounded-[26px] border p-4 sm:p-5 ${
        material?.isAcknowledged
          ? "border-emerald-200 bg-white"
          : "border-slate-100 bg-white/90"
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-3 py-1 text-xs font-black !text-white">
              {icon}
              {stepLabel}
            </span>
            <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-black !text-amber-900">
              Required
            </span>
            {material?.isAcknowledged ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black !text-emerald-900">
                Acknowledged
              </span>
            ) : null}
          </div>

          <h3 className="text-2xl font-black tracking-tight !text-[#07132f]">
            {title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 !text-slate-600">
            {description}
          </p>

          {material ? (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-black !text-emerald-900">
                  {getMaterialIcon(material.content_type)}
                  {getContentTypeLabel(material.content_type)}
                </span>
              </div>
              <p className="mt-3 text-base font-black !text-slate-950">
                {material.title}
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 !text-slate-600">
                {material.description || "Open this material to continue."}
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 !text-amber-900">
              This material has not been uploaded yet. Add one file in Admin for
              this action.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:min-w-[220px] lg:flex-col">
          {hasUrl ? (
            <>
              <a
                href={material?.openUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-emerald-900"
              >
                <ExternalLink size={16} />
                Open Material
              </a>
              <a
                href={material?.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black !text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <Download size={16} />
                Download / View
              </a>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
        {material?.isAcknowledged ? (
          <div className="flex items-start gap-3 text-sm font-bold leading-6 !text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-black">Acknowledgment saved</p>
              <p className="!text-emerald-800">
                You acknowledged this material on {formatDateTime(material.acknowledgedAt)}.
              </p>
            </div>
          </div>
        ) : material ? (
          <form action={acknowledgeMaterial} className="grid gap-3">
            <input type="hidden" name="material_id" value={material.id} />
            <input
              type="hidden"
              name="training_step_id"
              value={material.training_step_id || orientationStepId}
            />
            <label className="flex cursor-pointer items-start gap-3 text-sm font-bold leading-6 !text-slate-700">
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
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black !text-white shadow-sm transition hover:bg-emerald-900"
            >
              <CheckCircle2 size={17} />
              Save Acknowledgment
            </button>
          </form>
        ) : (
          <p className="text-sm font-bold leading-6 !text-slate-500">
            Acknowledgment will appear after the material is uploaded.
          </p>
        )}
      </div>
    </article>
  );
}

function CertificationActionCard({
  stepLabel,
  title,
  description,
  orientationStep,
  requiredMaterials,
  canComplete,
  isCompleted,
  completedAt,
}: {
  stepLabel: string;
  title: string;
  description: string;
  orientationStep: TrainingStep | null;
  requiredMaterials: MaterialWithUrl[];
  canComplete: boolean;
  isCompleted: boolean;
  completedAt: string | null;
}) {
  return (
    <article
      className={`rounded-[26px] border p-4 sm:p-5 ${
        isCompleted
          ? "border-emerald-300 bg-emerald-50 ring-4 ring-emerald-100/80"
          : canComplete
            ? "border-red-200 bg-red-50"
            : "border-slate-100 bg-white/90"
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-3 py-1 text-xs font-black !text-white">
              <BadgeCheck size={18} />
              {stepLabel}
            </span>
            <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-black !text-amber-900">
              Final Certification
            </span>
            {isCompleted ? (
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black !text-emerald-900">
                Certified
              </span>
            ) : null}
          </div>

          <h3 className="text-2xl font-black tracking-tight !text-[#07132f]">
            {title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 !text-slate-600">
            {description}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniProgressBox
              label="Required reviews"
              value={`${requiredMaterials.filter((material) => material.isAcknowledged).length} of ${requiredMaterials.length}`}
              detail="Intro video and Guru Success Guide acknowledgments"
            />
            <MiniProgressBox
              label="Badge status"
              value={isCompleted ? "Issued" : "Locked"}
              detail={isCompleted ? "Certificate pending within 24 hours" : "Complete this final action"}
            />
          </div>
        </div>

        <div className="lg:min-w-[240px]">
          {isCompleted ? (
            <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-bold leading-6 !text-emerald-900">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-black">Badge issued</p>
                  <p className="!text-emerald-800">
                    Completed on {formatDateTime(completedAt)}. Your official certificate will be prepared and sent within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form action={completeOrientation} className="grid gap-3">
              <input type="hidden" name="training_step_id" value={orientationStep?.id || ""} />
              {requiredMaterials.map((material) => (
                <input
                  key={material.id}
                  type="hidden"
                  name="required_material_id"
                  value={material.id}
                />
              ))}
              <button
                type="submit"
                disabled={!canComplete}
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                  canComplete
                    ? "bg-red-700 !text-white shadow-sm hover:bg-red-800"
                    : "bg-red-100 !text-red-400"
                }`}
              >
                <CheckCircle2 size={17} />
                Complete Guru Academy
              </button>
              <p
                className={`text-xs font-bold leading-5 ${
                  canComplete ? "!text-red-800" : "!text-slate-500"
                }`}
              >
                {canComplete
                  ? "Action required: click Complete Certification to issue your badge."
                  : "Watch and acknowledge the intro video and Guru Success Guide first."}
              </p>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}

function TrustBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black !text-slate-800 shadow-sm ring-1 ring-white/70">
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
    <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] !text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black !text-slate-950">{value}</p>
          <p className="mt-2 text-sm font-bold !text-emerald-700">{detail}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 !text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniProgressBox({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] !text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black !text-slate-950">{value}</p>
      <p className="text-xs font-bold !text-slate-500">{detail}</p>
    </div>
  );
}
