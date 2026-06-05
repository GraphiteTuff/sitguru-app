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
  PlayCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type AnyRow = Record<string, unknown>;

type TrainingStep = {
  id: string;
  academy_type?: string | null;
  step_number?: number | null;
  title?: string | null;
  description?: string | null;
  estimated_minutes?: number | null;
  is_active?: boolean | null;
  is_required?: boolean | null;
  requires_acknowledgment?: boolean | null;
  requires_signature?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type TrainingMaterial = {
  id: string;
  training_step_id?: string | null;
  academy_type?: string | null;
  title?: string | null;
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

type MaterialProgress = {
  id?: string;
  user_id?: string | null;
  training_step_id?: string | null;
  material_id?: string | null;
  academy_type?: string | null;
  acknowledged_at?: string | null;
};

type StepProgress = {
  id?: string;
  user_id?: string | null;
  training_step_id?: string | null;
  academy_type?: string | null;
  status?: string | null;
  acknowledged_at?: string | null;
  completed_at?: string | null;
};

type CertificationRow = {
  id?: string;
  user_id?: string | null;
  academy_type?: string | null;
  certification_name?: string | null;
  badge_status?: string | null;
  certificate_status?: string | null;
  certificate_url?: string | null;
  certificate_id?: string | null;
  email_sent_at?: string | null;
  issued_at?: string | null;
  certificate_sent_at?: string | null;
};

const academyType = "guru";
const academyName = "Guru Academy";
const certificationName = "Certified Guru";

const guruRoutes = {
  dashboard: "/guru/dashboard",
  university: "/guru/dashboard/university",
  profile: "/guru/dashboard/profile",
  earnings: "/guru/dashboard/earnings",
};

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

function getFirstName(value: string) {
  const clean = value.replace(/@.*/, "").trim();

  if (!clean) return "Guru";

  return clean.split(/[\s._-]+/).filter(Boolean)[0] || "Guru";
}

function getNameFromRows({
  authUser,
  profile,
  guru,
}: {
  authUser: AnyRow | null;
  profile: AnyRow | null;
  guru: AnyRow | null;
}) {
  const metadata =
    authUser?.user_metadata && typeof authUser.user_metadata === "object"
      ? (authUser.user_metadata as AnyRow)
      : authUser?.raw_user_meta_data &&
          typeof authUser.raw_user_meta_data === "object"
        ? (authUser.raw_user_meta_data as AnyRow)
        : null;

  const first =
    asString(profile?.first_name) ||
    asString(guru?.first_name) ||
    asString(metadata?.first_name);

  const last =
    asString(profile?.last_name) ||
    asString(guru?.last_name) ||
    asString(metadata?.last_name);

  if (first || last) return `${first} ${last}`.trim();

  return (
    asString(profile?.full_name) ||
    asString(profile?.display_name) ||
    asString(profile?.name) ||
    asString(guru?.full_name) ||
    asString(guru?.display_name) ||
    asString(guru?.name) ||
    asString(metadata?.full_name) ||
    asString(metadata?.name) ||
    "Guru"
  );
}

function getAvatarUrl({
  authUser,
  profile,
  guru,
}: {
  authUser: AnyRow | null;
  profile: AnyRow | null;
  guru: AnyRow | null;
}) {
  const metadata =
    authUser?.user_metadata && typeof authUser.user_metadata === "object"
      ? (authUser.user_metadata as AnyRow)
      : authUser?.raw_user_meta_data &&
          typeof authUser.raw_user_meta_data === "object"
        ? (authUser.raw_user_meta_data as AnyRow)
        : null;

  return (
    asString(guru?.avatar_url) ||
    asString(guru?.profile_photo_url) ||
    asString(guru?.photo_url) ||
    asString(guru?.image_url) ||
    asString(profile?.avatar_url) ||
    asString(profile?.profile_photo_url) ||
    asString(profile?.photo_url) ||
    asString(profile?.image_url) ||
    asString(metadata?.avatar_url) ||
    asString(metadata?.profile_photo_url) ||
    asString(metadata?.picture) ||
    ""
  );
}

function getInitials(name: string) {
  const parts = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  return `${parts[0]?.charAt(0) || "G"}${parts[1]?.charAt(0) || ""}`.toUpperCase();
}

function getNotice(searchParams?: Record<string, string | string[] | undefined>) {
  const acknowledged = asString(searchParams?.acknowledged);
  const completed = asString(searchParams?.completed);
  const error = asString(searchParams?.error);

  if (completed === "success") {
    return {
      tone: "success" as const,
      title: "Guru Academy complete",
      message:
        "Congratulations! Your Certified Guru badge has been issued. Your official SitGuru University certificate will be prepared and sent within 24 hours.",
    };
  }

  if (acknowledged === "success") {
    return {
      tone: "success" as const,
      title: "Acknowledgment saved",
      message: "Your training acknowledgment was saved successfully.",
    };
  }

  if (error === "complete") {
    return {
      tone: "error" as const,
      title: "Complete all required training first",
      message:
        "Please acknowledge the Guru intro video and Guru Success Guide before completing certification.",
    };
  }

  if (error) {
    return {
      tone: "error" as const,
      title: "Training update failed",
      message:
        "SitGuru could not save this training update. Please try again or contact support.",
    };
  }

  return null;
}

function isCompletedStep(row: StepProgress) {
  const status = asString(row.status).toLowerCase();

  return Boolean(
    row.completed_at ||
      status === "completed" ||
      status === "complete" ||
      status === "done",
  );
}

function getMaterialKind(material: TrainingMaterial) {
  const type = asString(material.content_type).toLowerCase();
  const title = asString(material.title).toLowerCase();

  if (type.includes("video") || title.includes("video")) return "video";

  if (
    type.includes("powerpoint") ||
    type === "ppt" ||
    type === "pptx" ||
    type.includes("pdf") ||
    type.includes("document") ||
    title.includes("guide") ||
    title.includes("success")
  ) {
    return "guide";
  }

  if (type.includes("certification") || title.includes("certification")) {
    return "certification";
  }

  return "other";
}

function getContentTypeLabel(material: TrainingMaterial) {
  const type = asString(material.content_type).toLowerCase();

  if (type === "video") return "Video";
  if (type === "powerpoint" || type === "ppt" || type === "pptx") {
    return "PowerPoint";
  }
  if (type === "pdf") return "PDF";
  if (type === "document") return "Document";
  if (type === "image") return "Image / Slide";
  if (type === "link") return "Link";
  if (type === "certification") return "Certification";

  return "Training Material";
}

function getMaterialPublicUrl(material: TrainingMaterial) {
  const videoUrl = asString(material.video_url);
  const externalUrl = asString(material.external_url);
  const bucket = asString(material.storage_bucket);
  const path = asString(material.storage_path);

  if (videoUrl) return videoUrl;
  if (externalUrl) return externalUrl;

  if (bucket && path) {
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl || "";
  }

  return "";
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

function buildCertificateId(userId: string) {
  const shortUser = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}${String(date.getDate()).padStart(2, "0")}`;

  return `SG-GURU-${datePart}-${shortUser}`;
}

async function sendGuruCertificationEmail({
  email,
  firstName,
}: {
  email: string;
  firstName: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL ||
    "SitGuru University <support@sitguru.com>";

  if (!apiKey || !email.includes("@")) return false;

  const subject = "Congratulations — Your SitGuru Guru Certification Is Complete";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:680px;margin:0 auto;padding:24px;">
      <h1 style="color:#047857;margin-bottom:12px;">Congratulations, ${firstName}!</h1>
      <p>You have completed the SitGuru University Guru Academy.</p>
      <p>You are now a <strong>Certified SitGuru Guru</strong>. Your Certified Guru badge has been issued and will appear on your SitGuru profile.</p>
      <p>Your official SitGuru University Certificate of Completion will be prepared and sent within 24 hours. This certificate will include your name, academy completed, completion date, certificate ID, and SitGuru verification details.</p>
      <p>Thank you for completing your training and for helping SitGuru deliver trusted pet care.</p>
      <p style="margin-top:28px;">Sincerely,<br /><strong>The SitGuru Team</strong><br />SitGuru University</p>
    </div>
  `;

  const text = `Congratulations, ${firstName}!

You have completed the SitGuru University Guru Academy.

You are now a Certified SitGuru Guru. Your Certified Guru badge has been issued and will appear on your SitGuru profile.

Your official SitGuru University Certificate of Completion will be prepared and sent within 24 hours.

Sincerely,
The SitGuru Team
SitGuru University`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        bcc: ["jason@sitguru.com", "nette@sitguru.com", "support@sitguru.com"],
        subject,
        html,
        text,
      }),
    });

    return response.ok;
  } catch (error) {
    console.warn("Unable to send Guru certification email:", error);
    return false;
  }
}

async function requireGuruUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/guru/login");
  }

  return user as unknown as AnyRow;
}

async function getGuruProfile(userId: string) {
  const [{ data: guru }, { data: profile }] = await Promise.all([
    supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  return {
    guru: (guru || null) as AnyRow | null,
    profile: (profile || null) as AnyRow | null,
  };
}

async function getGuruTrainingData(userId: string) {
  const [stepsResult, materialsResult, materialProgressResult, stepProgressResult, certificationResult] =
    await Promise.all([
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
        .select("*")
        .eq("academy_type", academyType)
        .eq("user_id", userId)
        .not("acknowledged_at", "is", null),

      supabaseAdmin
        .from("academy_step_progress")
        .select("*")
        .eq("academy_type", academyType)
        .eq("user_id", userId),

      supabaseAdmin
        .from("academy_certifications")
        .select("*")
        .eq("academy_type", academyType)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  const steps = ((stepsResult.data || []) as TrainingStep[]).filter(
    (step) => step.is_active !== false,
  );

  const orientationStep = steps[0] || null;
  const orientationStepId = asString(orientationStep?.id);

  const allMaterials = ((materialsResult.data || []) as TrainingMaterial[])
    .filter((material) => material.is_active !== false)
    .sort(sortMaterials);

  const orientationMaterials = orientationStepId
    ? allMaterials.filter(
        (material) => asString(material.training_step_id) === orientationStepId,
      )
    : allMaterials;

  const materialProgress = (materialProgressResult.data || []) as MaterialProgress[];
  const stepProgress = (stepProgressResult.data || []) as StepProgress[];
  const certification = (certificationResult.data || null) as CertificationRow | null;

  const acknowledgedMaterialIds = new Set(
    materialProgress
      .filter((progress) => Boolean(progress.acknowledged_at))
      .map((progress) => asString(progress.material_id))
      .filter(Boolean),
  );

  const completed = stepProgress.some((progress) => {
    if (!isCompletedStep(progress)) return false;
    if (!orientationStepId) return true;

    return asString(progress.training_step_id) === orientationStepId;
  });

  const certified = certification?.badge_status === "issued" || completed;

  const videoMaterial =
    orientationMaterials.find((material) => getMaterialKind(material) === "video") ||
    null;

  const guideMaterial =
    orientationMaterials.find((material) => getMaterialKind(material) === "guide") ||
    null;

  const requiredActionCount = 3;
  const acknowledgedCount = [videoMaterial, guideMaterial].filter(
    (material) => material && acknowledgedMaterialIds.has(material.id),
  ).length;

  const completedActions = (videoMaterial && acknowledgedMaterialIds.has(videoMaterial.id) ? 1 : 0) +
    (guideMaterial && acknowledgedMaterialIds.has(guideMaterial.id) ? 1 : 0) +
    (certified ? 1 : 0);

  return {
    steps,
    orientationStep,
    orientationStepId,
    orientationMaterials,
    materialProgress,
    stepProgress,
    certification,
    acknowledgedMaterialIds,
    completed,
    certified,
    videoMaterial,
    guideMaterial,
    acknowledgedCount,
    completedActions,
    requiredActionCount,
  };
}

async function acknowledgeGuruMaterial(formData: FormData) {
  "use server";

  const user = await requireGuruUser();
  const materialId = asString(formData.get("material_id"));
  const trainingStepId = asString(formData.get("training_step_id"));

  if (!materialId || !trainingStepId) {
    redirect(`${guruRoutes.university}?error=acknowledgment`);
  }

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin.from("academy_material_progress").upsert(
    {
      user_id: asString(user.id),
      training_step_id: trainingStepId,
      material_id: materialId,
      academy_type: academyType,
      acknowledged_at: now,
      updated_at: now,
    },
    {
      onConflict: "user_id,material_id",
    },
  );

  if (error) {
    console.warn("Unable to save Guru material acknowledgment:", error);
    redirect(`${guruRoutes.university}?error=acknowledgment`);
  }

  revalidatePath(guruRoutes.university);
  revalidatePath(guruRoutes.dashboard);
  redirect(`${guruRoutes.university}?acknowledged=success`);
}

async function completeGuruAcademy(formData: FormData) {
  "use server";

  const user = await requireGuruUser();
  const trainingStepId = asString(formData.get("training_step_id"));

  if (!trainingStepId) {
    redirect(`${guruRoutes.university}?error=complete`);
  }

  const { guru, profile } = await getGuruProfile(asString(user.id));
  const trainingData = await getGuruTrainingData(asString(user.id));

  const videoReady =
    trainingData.videoMaterial &&
    trainingData.acknowledgedMaterialIds.has(trainingData.videoMaterial.id);

  const guideReady =
    trainingData.guideMaterial &&
    trainingData.acknowledgedMaterialIds.has(trainingData.guideMaterial.id);

  if (!videoReady || !guideReady) {
    redirect(`${guruRoutes.university}?error=complete`);
  }

  const now = new Date().toISOString();
  const fullName = getNameFromRows({ authUser: user, profile, guru });
  const firstName = getFirstName(fullName);
  const email = asString(user.email) || asString(profile?.email) || asString(guru?.email);
  const certificateId = buildCertificateId(asString(user.id));

  const { error: stepError } = await supabaseAdmin
    .from("academy_step_progress")
    .upsert(
      {
        user_id: asString(user.id),
        training_step_id: trainingStepId,
        academy_type: academyType,
        status: "completed",
        acknowledged_at: now,
        completed_at: now,
        updated_at: now,
      },
      {
        onConflict: "user_id,training_step_id",
      },
    );

  if (stepError) {
    console.warn("Unable to complete Guru Academy step:", stepError);
    redirect(`${guruRoutes.university}?error=complete`);
  }

  const emailSent = await sendGuruCertificationEmail({
    email,
    firstName,
  });

  const { error: certificationError } = await supabaseAdmin
    .from("academy_certifications")
    .upsert(
      {
        user_id: asString(user.id),
        academy_type: academyType,
        certification_name: certificationName,
        badge_status: "issued",
        certificate_status: "pending",
        certificate_id: certificateId,
        email_sent_at: emailSent ? now : null,
        issued_at: now,
        updated_at: now,
      },
      {
        onConflict: "user_id,academy_type",
      },
    );

  if (certificationError) {
    console.warn("Unable to issue Guru certification:", certificationError);
    redirect(`${guruRoutes.university}?error=complete`);
  }

  revalidatePath(guruRoutes.university);
  revalidatePath(guruRoutes.dashboard);
  revalidatePath(guruRoutes.profile);

  redirect(`${guruRoutes.university}?completed=success`);
}

export default async function GuruDashboardUniversityPage({
  searchParams,
}: PageProps) {
  const user = await requireGuruUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const notice = getNotice(resolvedSearchParams);

  const [{ guru, profile }, trainingData] = await Promise.all([
    getGuruProfile(asString(user.id)),
    getGuruTrainingData(asString(user.id)),
  ]);

  const fullName = getNameFromRows({ authUser: user, profile, guru });
  const firstName = getFirstName(fullName);
  const avatarUrl = getAvatarUrl({ authUser: user, profile, guru });
  const initials = getInitials(fullName);

  const {
    orientationStep,
    orientationStepId,
    videoMaterial,
    guideMaterial,
    acknowledgedMaterialIds,
    certified,
    completedActions,
    requiredActionCount,
    certification,
  } = trainingData;

  const videoAcknowledged = Boolean(
    videoMaterial && acknowledgedMaterialIds.has(videoMaterial.id),
  );
  const guideAcknowledged = Boolean(
    guideMaterial && acknowledgedMaterialIds.has(guideMaterial.id),
  );
  const canComplete = Boolean(
    orientationStepId && videoAcknowledged && guideAcknowledged && !certified,
  );

  const progressPercent = Math.round(
    (completedActions / requiredActionCount) * 100,
  );

  return (
    <main className="min-h-screen bg-[#f7fbf7] px-3 py-4 text-[#07132f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.95),transparent_19%),linear-gradient(120deg,#15d6a0_0%,#6ee7c8_48%,#b8e5ff_100%)] p-5 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <Link
                href={guruRoutes.dashboard}
                className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-emerald-900 shadow-sm ring-1 ring-white/70 transition hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>

              <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-950/80">
                SitGuru University
              </p>

              <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
                Guru Academy
              </h1>

              <p className="mt-5 max-w-3xl text-base font-bold leading-8 text-slate-800 sm:text-xl">
                Hi {firstName}, learn SitGuru. Easy as 1, 2, 3. Watch the Guru
                intro video, review the Guru Success Guide, then acknowledge
                completion to earn your Certified Guru badge.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <HeroPill icon={<UserRound className="h-4 w-4" />}>
                  Guru
                </HeroPill>
                <HeroPill icon={<GraduationCap className="h-4 w-4" />}>
                  {completedActions} of {requiredActionCount} actions complete
                </HeroPill>
                <HeroPill icon={<Sparkles className="h-4 w-4" />}>
                  {progressPercent}% complete
                </HeroPill>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm rounded-[2rem] border border-white/70 bg-white/75 p-5 text-center shadow-xl backdrop-blur">
                <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[7px] border-white bg-emerald-50 text-3xl font-black text-emerald-800 shadow-xl">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={`${firstName} profile photo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-950">
                  {firstName}
                </h2>
                <p className="mt-1 text-sm font-black text-emerald-800">
                  {certified ? "Certified Guru" : "Badge locked"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 bg-white p-4 sm:grid-cols-3 sm:p-6">
            <StatCard
              icon={<GraduationCap className="h-5 w-5" />}
              label="Progress"
              value={`${completedActions} of ${requiredActionCount}`}
              detail="Easy as 1, 2, 3"
            />
            <StatCard
              icon={<FileText className="h-5 w-5" />}
              label="Training"
              value="3 actions"
              detail="Video, guide, certification"
            />
            <StatCard
              icon={
                certified ? (
                  <BadgeCheck className="h-5 w-5" />
                ) : (
                  <LockKeyhole className="h-5 w-5" />
                )
              }
              label="Badge"
              value={certified ? "Issued" : "Locked"}
              detail={
                certified
                  ? "Certified Guru badge issued"
                  : "Complete all 3 actions"
              }
            />
          </div>
        </section>

        {notice ? (
          <section
            className={[
              "rounded-[1.5rem] border p-4 text-sm font-bold leading-6 shadow-sm",
              notice.tone === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-900"
                : "border-red-100 bg-red-50 text-red-800",
            ].join(" ")}
          >
            <p className="font-black">{notice.title}</p>
            <p className="mt-1">{notice.message}</p>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
                  Certified Guru Orientation
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  Watch. Review. Acknowledge.
                </h2>
                <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-700">
                  Learn how to complete your Guru profile, manage bookings
                  professionally, provide safe pet care, set up payouts, and
                  build trust with Pet Parents. Review the video and guide,
                  then acknowledge completion to earn your Certified Guru badge.
                </p>
              </div>

              <div
                className={[
                  "rounded-2xl px-5 py-3 text-sm font-black",
                  certified
                    ? "bg-emerald-600 text-white"
                    : "border border-emerald-100 bg-white text-emerald-900",
                ].join(" ")}
              >
                {certified ? "Certified" : "In progress"}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <ActionCard
              number="1"
              title="Watch the Intro Video"
              description="Learn the Guru opportunity, your role, and how SitGuru helps you earn income providing trusted pet care."
              icon={<PlayCircle className="h-6 w-6" />}
              material={videoMaterial}
              materialUrl={videoMaterial ? getMaterialPublicUrl(videoMaterial) : ""}
              acknowledged={videoAcknowledged}
              trainingStepId={orientationStepId}
              action={acknowledgeGuruMaterial}
              missingText="No Guru intro video has been uploaded yet."
            />

            <ActionCard
              number="2"
              title="Review the Guru Success Guide"
              description="Understand profile setup, bookings, communication, care standards, Stripe payouts, earnings, safety, and reviews."
              icon={<FileText className="h-6 w-6" />}
              material={guideMaterial}
              materialUrl={guideMaterial ? getMaterialPublicUrl(guideMaterial) : ""}
              acknowledged={guideAcknowledged}
              trainingStepId={orientationStepId}
              action={acknowledgeGuruMaterial}
              missingText="No Guru Success Guide PowerPoint/PDF has been uploaded yet."
            />

            <section
              className={[
                "rounded-[1.75rem] border p-4 sm:p-5",
                certified
                  ? "border-emerald-200 bg-emerald-50"
                  : canComplete
                    ? "border-emerald-200 bg-white"
                    : "border-red-100 bg-red-50",
              ].join(" ")}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                    {certified ? (
                      <BadgeCheck className="h-6 w-6" />
                    ) : (
                      <ShieldCheck className="h-6 w-6" />
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                      Step 3
                    </p>
                    <h3 className="mt-1 text-2xl font-black text-slate-950">
                      Acknowledge & Get Certified
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                      Confirm you reviewed the training and earn your Certified
                      Guru badge. Your official SitGuru University certificate
                      will be prepared and sent within 24 hours.
                    </p>

                    {certified ? (
                      <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4 text-sm font-bold text-emerald-900">
                        <p className="font-black">Certified Guru badge issued.</p>
                        <p className="mt-1">
                          Certificate status:{" "}
                          {asString(certification?.certificate_status) ||
                            "pending"}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 text-sm font-bold leading-6 text-slate-700">
                        I acknowledge that I have honestly and accurately
                        reviewed the required Guru Academy training materials,
                        understand the information provided, and completed this
                        SitGuru University training.
                      </div>
                    )}
                  </div>
                </div>

                {certified ? (
                  <div className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white">
                    <CheckCircle2 className="h-5 w-5" />
                    Completed
                  </div>
                ) : (
                  <form action={completeGuruAcademy} className="w-full lg:w-auto">
                    <input
                      type="hidden"
                      name="training_step_id"
                      value={orientationStep?.id || ""}
                    />
                    <button
                      type="submit"
                      disabled={!canComplete}
                      className={[
                        "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition lg:w-auto",
                        canComplete
                          ? "bg-emerald-700 text-white shadow-lg shadow-emerald-900/15 hover:bg-emerald-800"
                          : "cursor-not-allowed bg-red-100 text-red-500",
                      ].join(" ")}
                    >
                      <BadgeCheck className="h-5 w-5" />
                      Complete Guru Academy
                    </button>
                  </form>
                )}
              </div>

              {!canComplete && !certified ? (
                <p className="mt-4 text-sm font-black text-red-700">
                  Required acknowledgments needed: acknowledge the intro video
                  and Guru Success Guide before certification unlocks.
                </p>
              ) : null}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function HeroPill({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-slate-800 shadow-sm ring-1 ring-white/80">
      {icon}
      {children}
    </span>
  );
}

function StatCard({
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
    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-sm font-bold text-emerald-700">{detail}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  number,
  title,
  description,
  icon,
  material,
  materialUrl,
  acknowledged,
  trainingStepId,
  action,
  missingText,
}: {
  number: string;
  title: string;
  description: string;
  icon: ReactNode;
  material: TrainingMaterial | null;
  materialUrl: string;
  acknowledged: boolean;
  trainingStepId: string;
  action: (formData: FormData) => Promise<void>;
  missingText: string;
}) {
  return (
    <section
      className={[
        "rounded-[1.75rem] border p-4 sm:p-5",
        acknowledged
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            {icon}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              Step {number}
            </p>
            <h3 className="mt-1 text-2xl font-black text-slate-950">
              {title}
            </h3>
            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
              {description}
            </p>

            {material ? (
              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-black text-emerald-800">
                    {getContentTypeLabel(material)}
                  </span>
                  {material.is_required !== false ? (
                    <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
                      Required
                    </span>
                  ) : null}
                  {acknowledged ? (
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                      Acknowledged
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-base font-black text-slate-950">
                  {material.title}
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  {material.description || "Training material"}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {missingText}
              </div>
            )}
          </div>
        </div>

        {material && materialUrl ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:w-56 lg:grid-cols-1">
            <a
              href={materialUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800"
            >
              <ExternalLink className="h-4 w-4" />
              Open Material
            </a>
            <a
              href={materialUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
            >
              <Download className="h-4 w-4" />
              Download / View
            </a>
          </div>
        ) : null}
      </div>

      {material ? (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
          {acknowledged ? (
            <div className="flex items-start gap-3 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-black">Acknowledgment saved</p>
                <p className="mt-1">
                  You acknowledged this training material.
                </p>
              </div>
            </div>
          ) : (
            <form action={action} className="grid gap-3">
              <input type="hidden" name="material_id" value={material.id} />
              <input
                type="hidden"
                name="training_step_id"
                value={trainingStepId}
              />

              <label className="flex items-start gap-3 text-sm font-bold leading-6 text-slate-700">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-5 w-5 rounded border-slate-300 accent-emerald-700"
                />
                <span>
                  I acknowledge that I have honestly and accurately reviewed this
                  training material, understand the information provided, and
                  completed this portion of the SitGuru University training.
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800"
              >
                <CheckCircle2 className="h-5 w-5" />
                Save Acknowledgment
              </button>
            </form>
          )}
        </div>
      ) : null}
    </section>
  );
}