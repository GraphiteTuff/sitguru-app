import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  LockKeyhole,
  LogOut,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const AMBASSADOR_TRAINING_HREF = "/ambassador/dashboard/training";
const AMBASSADOR_DASHBOARD_HREF = "/ambassador/dashboard";
const AMBASSADOR_MESSAGES_HREF = "/ambassador/dashboard/messages";
const AMBASSADOR_ACADEMY_TYPE = "ambassador";
const AMBASSADOR_BADGE_TITLE = "SitGuru Ambassador Badge";

type AmbassadorRecord = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  login_email?: string | null;
  login_username?: string | null;
  referral_code?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  dashboard_slug?: string | null;
  status?: string | null;
  referral_status?: string | null;
  onboarding_status?: string | null;
  training_status?: string | null;
  training_percent?: number | null;
  onboarding_step?: number | null;
  onboarding_percent?: number | null;
  training_completed_at?: string | null;
  onboarding_completed_at?: string | null;
  certification_signed_at?: string | null;
  certification_name?: string | null;
};

type TrainingStep = {
  id: string;
  academy_type?: string | null;
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
};

type TrainingProgress = {
  id?: string;
  ambassador_id?: string | null;
  training_step_id?: string | null;
  status?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  acknowledged_at?: string | null;
  signed_at?: string | null;
  signature_name?: string | null;
  certification_text?: string | null;
  notes?: string | null;
};

type TrainingItem = {
  id: string;
  stepNumber: number;
  title: string;
  description?: string | null;
  contentType?: string | null;
  storageBucket?: string | null;
  storagePath?: string | null;
  externalUrl?: string | null;
  videoUrl?: string | null;
  estimatedMinutes?: number | null;
  isRequired?: boolean | null;
  isCertification?: boolean;
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

function formatDate(value?: string | null) {
  if (!value) return "Not completed";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not completed";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    "https://www.sitguru.com";

  if (configuredUrl.startsWith("http://") || configuredUrl.startsWith("https://")) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return `https://${configuredUrl.replace(/\/+$/, "")}`;
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SG"
  );
}

function getFirstName(name: string) {
  return name.split(" ").filter(Boolean)[0] || "Ambassador";
}

function getContentTypeLabel(value?: string | null) {
  const normalized = asString(value).toLowerCase();

  if (normalized === "video") return "Video";
  if (normalized === "ppt" || normalized === "powerpoint") return "PowerPoint";
  if (normalized === "pdf") return "PDF";
  if (normalized === "document") return "Document";
  if (normalized === "image") return "Image";
  if (normalized === "link") return "Link";
  if (normalized === "quiz") return "Quiz";
  if (normalized === "certification") return "Certification";

  return "Training";
}

function getAssetUrl(item: TrainingItem) {
  const videoUrl = asString(item.videoUrl);
  const externalUrl = asString(item.externalUrl);

  if (videoUrl) return videoUrl;
  if (externalUrl) return externalUrl;

  const bucket = asString(item.storageBucket);
  const storagePath = asString(item.storagePath);

  if (!bucket || !storagePath) return "";

  return `${getSiteUrl()}/api/storage/${bucket}/${storagePath}`;
}

function isTrainingComplete(progress?: TrainingProgress | null) {
  const status = asString(progress?.status).toLowerCase();

  return Boolean(
    status === "completed" ||
      status === "complete" ||
      progress?.completed_at,
  );
}

function isTrainingStarted(progress?: TrainingProgress | null) {
  const status = asString(progress?.status).toLowerCase();

  return Boolean(
    status === "in_progress" ||
      status === "started" ||
      progress?.started_at ||
      isTrainingComplete(progress),
  );
}

function getTrainingPercent(progress?: TrainingProgress | null) {
  if (isTrainingComplete(progress)) return 100;
  if (isTrainingStarted(progress)) return 25;
  return 0;
}

function getBadgeStatusText(trainingComplete: boolean) {
  return trainingComplete
    ? "Badge earned — Ambassador training is complete."
    : "Badge unlocks when the official Ambassador Academy materials are reviewed and the final certification is submitted.";
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

function getCoreOrientationStep(steps: TrainingStep[]) {
  const activeSteps = steps.filter((step) => step.is_active !== false);

  const namedOrientation = activeSteps.find((step) =>
    asString(step.title).toLowerCase().includes("ambassador academy orientation"),
  );

  if (namedOrientation) return namedOrientation;

  const activeStepOne = activeSteps.find((step) => asNumber(step.step_number) === 1);
  if (activeStepOne) return activeStepOne;

  return activeSteps[0] || steps[0] || null;
}

function buildFallbackTrainingItems(orientationStep: TrainingStep | null): TrainingItem[] {
  return [
    {
      id: `${orientationStep?.id || "fallback"}-1`,
      stepNumber: 1,
      title: "Watch the Intro Video",
      description: "Learn what SitGuru is, how the Ambassador Program works, and how Ambassadors help grow trusted local pet care.",
      contentType: "video",
      videoUrl: orientationStep?.video_url || null,
      externalUrl: orientationStep?.external_url || null,
      storageBucket: orientationStep?.storage_bucket || null,
      storagePath: orientationStep?.storage_path || null,
      estimatedMinutes: orientationStep?.estimated_minutes || 2,
      isRequired: true,
    },
    {
      id: `${orientationStep?.id || "fallback"}-2`,
      stepNumber: 2,
      title: "Review the Ambassador Guide",
      description: "Review Ambassador expectations, referral basics, PawPerks, SitGuru University, and how to represent SitGuru professionally.",
      contentType: "powerpoint",
      estimatedMinutes: 3,
      isRequired: true,
    },
    {
      id: `${orientationStep?.id || "fallback"}-3`,
      stepNumber: 3,
      title: "Referral Links, QR Codes & Social Growth",
      description: "Learn how to share referral links, request QR support, and drive verified @SitGuruOfficial signups.",
      contentType: "document",
      estimatedMinutes: 3,
      isRequired: true,
    },
    {
      id: `${orientationStep?.id || "fallback"}-4`,
      stepNumber: 4,
      title: "Acknowledge & Get Certified",
      description: "Submit your final acknowledgment to unlock your SitGuru Ambassador Badge.",
      contentType: "certification",
      estimatedMinutes: 1,
      isRequired: true,
      isCertification: true,
    },
  ];
}

function buildTrainingItems(
  orientationStep: TrainingStep | null,
  materials: TrainingMaterial[],
) {
  const activeMaterials = materials
    .filter((material) => material.is_active !== false)
    .sort(sortTrainingMaterials);

  if (!activeMaterials.length) {
    return buildFallbackTrainingItems(orientationStep);
  }

  return activeMaterials.map((material, index) => {
    const contentType = asString(material.content_type) || "document";
    const normalizedType = contentType.toLowerCase();

    return {
      id: material.id,
      stepNumber: asNumber(material.sort_order) || index + 1,
      title: material.title,
      description: material.description,
      contentType,
      storageBucket: material.storage_bucket,
      storagePath: material.storage_path,
      externalUrl: material.external_url,
      videoUrl: material.video_url,
      estimatedMinutes: index === activeMaterials.length - 1 ? 1 : 3,
      isRequired: material.is_required !== false,
      isCertification:
        normalizedType === "certification" ||
        asString(material.title).toLowerCase().includes("certif"),
    } satisfies TrainingItem;
  });
}

async function signOutAction() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/ambassador/login");
}

async function getLoggedInAmbassador() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/ambassador/login");
  }

  const userEmail = asString(user.email).toLowerCase();

  const { data: ambassadorByUserId, error: ambassadorByUserIdError } =
    await supabaseAdmin
      .from("ambassadors")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

  if (ambassadorByUserIdError) {
    console.error(
      "Ambassador training lookup by user ID failed:",
      ambassadorByUserIdError.message,
    );
  }

  let ambassador = ambassadorByUserId as AmbassadorRecord | null;

  if (!ambassador && userEmail) {
    const emailColumns = ["login_email", "contact_email", "email"] as const;

    for (const column of emailColumns) {
      const { data, error: emailLookupError } = await supabaseAdmin
        .from("ambassadors")
        .select("*")
        .eq(column, userEmail)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (emailLookupError) {
        console.error(
          `Ambassador training lookup by ${column} failed:`,
          emailLookupError.message,
        );
        continue;
      }

      if (data) {
        ambassador = data as AmbassadorRecord;
        break;
      }
    }
  }

  const status = asString(ambassador?.status).toLowerCase();
  const workspaceAllowed =
    Boolean(ambassador?.id) &&
    ambassador?.dashboard_enabled === true &&
    ambassador?.login_enabled === true &&
    status !== "archived" &&
    status !== "inactive" &&
    status !== "not_a_fit";

  if (!ambassador || !workspaceAllowed) {
    await supabase.auth.signOut();
    redirect("/ambassador/login?error=restricted");
  }

  return ambassador;
}

async function getAmbassadorTrainingSetup() {
  const { data: stepsResult } = await supabaseAdmin
    .from("ambassador_training_steps")
    .select("*")
    .eq("academy_type", AMBASSADOR_ACADEMY_TYPE)
    .order("step_number", { ascending: true });

  const ambassadorSteps = (stepsResult || []) as TrainingStep[];
  const orientationStep = getCoreOrientationStep(ambassadorSteps);

  if (!orientationStep?.id) {
    return {
      orientationStep: null,
      materials: [] as TrainingMaterial[],
    };
  }

  const { data: materialsResult } = await supabaseAdmin
    .from("academy_step_materials")
    .select("*")
    .eq("training_step_id", orientationStep.id)
    .eq("academy_type", AMBASSADOR_ACADEMY_TYPE)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    orientationStep,
    materials: (materialsResult || []) as TrainingMaterial[],
  };
}

async function getActiveAmbassadorTrainingStep(trainingStepId: string) {
  if (!trainingStepId) return null;

  const { data, error } = await supabaseAdmin
    .from("ambassador_training_steps")
    .select("*")
    .eq("id", trainingStepId)
    .eq("academy_type", AMBASSADOR_ACADEMY_TYPE)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to verify Ambassador training step:",
      error.message,
    );
    return null;
  }

  return (data || null) as TrainingStep | null;
}

async function startTrainingAction(formData: FormData) {
  "use server";

  const ambassador = await getLoggedInAmbassador();
  const trainingStepId =
    asString(formData.get("training_step_id")) ||
    asString(formData.get("orientation_step_id"));

  if (!trainingStepId) {
    redirect(`${AMBASSADOR_TRAINING_HREF}?error=missing_step`);
  }

  const trainingStep = await getActiveAmbassadorTrainingStep(trainingStepId);

  if (!trainingStep) {
    redirect(`${AMBASSADOR_TRAINING_HREF}?error=invalid_step`);
  }

  const now = new Date().toISOString();

  const { error: progressError } = await supabaseAdmin
    .from("ambassador_training_progress")
    .upsert(
      {
        ambassador_id: ambassador.id,
        training_step_id: trainingStep.id,
        status: "in_progress",
        started_at: now,
        updated_at: now,
      },
      {
        onConflict: "ambassador_id,training_step_id",
      },
    );

  if (progressError) {
    console.error(
      "Unable to start Ambassador training:",
      progressError.message,
    );
    redirect(`${AMBASSADOR_TRAINING_HREF}?error=start_failed`);
  }

  const { error: ambassadorUpdateError } = await supabaseAdmin
    .from("ambassadors")
    .update({
      training_status: "In Progress",
      training_percent: Math.max(
        0,
        Math.min(99, asNumber(ambassador.training_percent) || 25),
      ),
      updated_at: now,
    })
    .eq("id", ambassador.id);

  revalidatePath(AMBASSADOR_TRAINING_HREF);
  revalidatePath(AMBASSADOR_DASHBOARD_HREF);
  revalidatePath(`/admin/ambassadors/${ambassador.id}`);

  if (ambassadorUpdateError) {
    console.error(
      "Ambassador training started, but summary sync failed:",
      ambassadorUpdateError.message,
    );
    redirect(
      `${AMBASSADOR_TRAINING_HREF}?warning=start_summary_sync_failed`,
    );
  }

  redirect(`${AMBASSADOR_TRAINING_HREF}?started=success`);
}

async function completeTrainingAction(formData: FormData) {
  "use server";

  const ambassador = await getLoggedInAmbassador();
  const trainingStepId =
    asString(formData.get("training_step_id")) ||
    asString(formData.get("orientation_step_id"));
  const acknowledgment = asString(formData.get("acknowledgment"));
  const signatureName = asString(formData.get("signature_name"));

  if (!trainingStepId) {
    redirect(`${AMBASSADOR_TRAINING_HREF}?error=missing_step`);
  }

  const trainingStep = await getActiveAmbassadorTrainingStep(trainingStepId);

  if (!trainingStep) {
    redirect(`${AMBASSADOR_TRAINING_HREF}?error=invalid_step`);
  }

  if (acknowledgment !== "yes") {
    redirect(`${AMBASSADOR_TRAINING_HREF}?error=acknowledgment_required`);
  }

  if (!signatureName) {
    redirect(`${AMBASSADOR_TRAINING_HREF}?error=signature_required`);
  }

  const now = new Date().toISOString();

  const { error: progressError } = await supabaseAdmin
    .from("ambassador_training_progress")
    .upsert(
      {
        ambassador_id: ambassador.id,
        training_step_id: trainingStep.id,
        status: "completed",
        started_at: now,
        completed_at: now,
        acknowledged_at: now,
        signed_at: now,
        signature_name: signatureName,
        certification_text:
          "I certify that I completed the SitGuru Ambassador Academy materials and understand SitGuru Ambassador expectations, referral-code use, social media outreach, support requests, and verified reward tracking.",
        updated_at: now,
      },
      {
        onConflict: "ambassador_id,training_step_id",
      },
    );

  if (progressError) {
    console.error(
      "Unable to complete Ambassador training:",
      progressError.message,
    );
    redirect(`${AMBASSADOR_TRAINING_HREF}?error=save_failed`);
  }

  const { error: ambassadorUpdateError } = await supabaseAdmin
    .from("ambassadors")
    .update({
      training_status: "Completed",
      training_percent: 100,
      training_completed_at: now,
      certification_signed_at: now,
      certification_name: signatureName,
      updated_at: now,
    })
    .eq("id", ambassador.id);

  revalidatePath(AMBASSADOR_TRAINING_HREF);
  revalidatePath(AMBASSADOR_DASHBOARD_HREF);
  revalidatePath(`/admin/ambassadors/${ambassador.id}`);
  revalidatePath("/admin/ambassadors");

  if (ambassadorUpdateError) {
    console.error(
      "Training completion saved, but Ambassador summary sync failed:",
      ambassadorUpdateError.message,
    );
    redirect(
      `${AMBASSADOR_TRAINING_HREF}?warning=completion_summary_sync_failed`,
    );
  }

  redirect(`${AMBASSADOR_TRAINING_HREF}?success=completed`);
}

function getPageMessage(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const error = asString(searchParams.error);
  const success = asString(searchParams.success);
  const started = asString(searchParams.started);
  const warning = asString(searchParams.warning);

  if (success === "completed") {
    return {
      type: "success" as const,
      text: "Ambassador training was saved successfully. Your SitGuru Ambassador Badge is now unlocked.",
    };
  }

  if (started === "success") {
    return {
      type: "success" as const,
      text: "Training progress was saved. Review the Ambassador Academy materials, then complete the final certification.",
    };
  }

  if (warning === "start_summary_sync_failed") {
    return {
      type: "warning" as const,
      text: "Training was started, but the dashboard summary could not be updated. Your progress record is saved. Please refresh, then message SitGuru if the dashboard status remains unchanged.",
    };
  }

  if (warning === "completion_summary_sync_failed") {
    return {
      type: "warning" as const,
      text: "Your signed training completion was saved, but the Ambassador summary could not be updated. Please message SitGuru so the dashboard and Admin status can be synchronized.",
    };
  }

  if (error === "acknowledgment_required") {
    return {
      type: "error" as const,
      text: "Please check the acknowledgment box before unlocking the Ambassador badge.",
    };
  }

  if (error === "signature_required") {
    return {
      type: "error" as const,
      text: "Please type your full name to certify Ambassador training completion.",
    };
  }

  if (error === "start_failed") {
    return {
      type: "error" as const,
      text: "We could not save the start of your Ambassador training. Please try again or message SitGuru.",
    };
  }

  if (error === "save_failed") {
    return {
      type: "error" as const,
      text: "We could not save your Ambassador training completion. Please try again or message SitGuru.",
    };
  }

  if (error === "invalid_step") {
    return {
      type: "error" as const,
      text: "That Ambassador training step is inactive or no longer available. Refresh the page or message SitGuru.",
    };
  }

  if (error === "missing_step") {
    return {
      type: "error" as const,
      text: "Ambassador training is not fully connected yet. Please message SitGuru for help.",
    };
  }

  return null;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AmbassadorTrainingPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const pageMessage = getPageMessage(resolvedSearchParams);
  const ambassador = await getLoggedInAmbassador();
  const { orientationStep, materials } = await getAmbassadorTrainingSetup();

  const fullName = asString(ambassador.full_name) || "SitGuru Ambassador";
  const firstName = getFirstName(fullName);
  const referralCode = asString(ambassador.referral_code);

  const trainingItems = buildTrainingItems(orientationStep, materials);
  const requiredItems = trainingItems.filter((item) => item.isRequired !== false);
  const finalCertificationItem =
    trainingItems.find((item) => item.isCertification) ||
    trainingItems[trainingItems.length - 1] ||
    null;

  const { data: progressResult } = orientationStep?.id
    ? await supabaseAdmin
        .from("ambassador_training_progress")
        .select("*")
        .eq("ambassador_id", ambassador.id)
        .eq("training_step_id", orientationStep.id)
        .maybeSingle()
    : { data: null };

  const progress = (progressResult || null) as TrainingProgress | null;
  const trainingComplete = isTrainingComplete(progress);
  const trainingStarted = isTrainingStarted(progress);
  const trainingPercent = getTrainingPercent(progress);
  const completedDisplayCount = trainingComplete ? requiredItems.length : 0;

  return (
    <main className="min-h-[100svh] bg-[#f8fbf6] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-green-50 text-xl font-black text-green-800 ring-1 ring-green-100 sm:h-20 sm:w-20">
                {getInitials(fullName)}
              </div>

              <div className="min-w-0">
                <Link
                  href={AMBASSADOR_DASHBOARD_HREF}
                  className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-2 text-xs font-black text-green-900 transition hover:bg-green-100"
                >
                  <ArrowLeft size={15} />
                  Back to Dashboard
                </Link>

                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-700 sm:text-xs">
                  SitGuru Ambassador Academy
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-green-950 sm:text-5xl">
                  {firstName}, continue onboarding
                </h1>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                  Review the official Ambassador Academy materials from your
                  phone, tablet, or desktop. Complete the final certification to
                  unlock your SitGuru Ambassador Badge.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill>{referralCode || "Ambassador"}</Pill>
                  <Pill>{completedDisplayCount} of {requiredItems.length} required complete</Pill>
                  <Pill>{trainingPercent}% complete</Pill>
                </div>
              </div>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50 lg:w-auto"
              >
                <LogOut size={17} />
                Sign Out
              </button>
            </form>
          </div>
        </section>

        {pageMessage ? (
          <section
            className={`rounded-[24px] border p-4 text-sm font-bold leading-6 ${
              pageMessage.type === "success"
                ? "border-green-100 bg-green-50 text-green-900"
                : pageMessage.type === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-red-100 bg-red-50 text-red-800"
            }`}
          >
            {pageMessage.text}
          </section>
        ) : null}

        <section
          className={`rounded-[28px] border p-5 shadow-sm sm:rounded-[32px] sm:p-6 ${
            trainingComplete
              ? "border-green-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_70%)]"
              : "border-[#dfe9e2] bg-white"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl ${
                  trainingComplete
                    ? "bg-green-800 text-white shadow-lg shadow-emerald-900/20"
                    : "bg-green-50 text-green-800"
                }`}
              >
                {trainingComplete ? <Award size={25} /> : <BadgeCheck size={25} />}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-700 sm:text-xs">
                  Ambassador Badge
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-green-950 sm:text-3xl">
                  {trainingComplete ? AMBASSADOR_BADGE_TITLE : "Complete training to unlock your badge"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                  {getBadgeStatusText(trainingComplete)} Your dashboard badge
                  points back to this training page so Ambassadors always know
                  where to finish or review their requirements.
                </p>
              </div>
            </div>

            <Link
              href={AMBASSADOR_TRAINING_HREF}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50 sm:w-auto"
            >
              View Training Page
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <DashboardCard>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeader
                icon={<GraduationCap size={22} />}
                title="Training Progress"
                detail="Work through the official Ambassador Academy materials. The badge unlocks after final certification."
              />

              <div className="rounded-[24px] border border-green-100 bg-green-50 p-4 sm:min-w-[220px]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                  Overall Progress
                </p>
                <p className="mt-2 text-4xl font-black text-green-950">
                  {trainingPercent}%
                </p>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-green-800"
                    style={{ width: `${trainingPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-xs font-bold leading-5 text-green-900/80">
                  {completedDisplayCount} of {requiredItems.length} required
                  Ambassador Academy materials complete.
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<Sparkles size={22} />}
              title="Next Step"
              detail={
                trainingComplete
                  ? "Your Ambassador badge is unlocked."
                  : finalCertificationItem
                    ? `Review materials, then complete ${finalCertificationItem.title}.`
                    : "Review the Ambassador Academy materials."
              }
            />

            {trainingComplete ? (
              <Link
                href={AMBASSADOR_DASHBOARD_HREF}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Return to Dashboard
                <ArrowRight size={17} />
              </Link>
            ) : (
              <a
                href="#certification"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Complete Certification
                <ArrowRight size={17} />
              </a>
            )}
          </DashboardCard>
        </section>

        {orientationStep?.id && !trainingStarted ? (
          <form action={startTrainingAction}>
            <input type="hidden" name="training_step_id" value={orientationStep.id} />
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <PlayCircle size={18} />
              Start Ambassador Training
            </button>
          </form>
        ) : null}

        <section className="grid gap-4">
          {trainingItems.map((item) => (
            <TrainingMaterialStepCard
              key={item.id}
              item={item}
              trainingComplete={trainingComplete}
            />
          ))}
        </section>

        <section id="certification" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <DashboardCard>
            <SectionHeader
              icon={<ShieldCheck size={22} />}
              title="Certification"
              detail="After reviewing the Ambassador Academy materials, acknowledge completion to unlock your SitGuru Ambassador Badge."
            />

            <div className="mt-4 rounded-2xl border border-green-100 bg-[#fbfcf9] p-4 text-sm font-semibold leading-6 text-slate-600">
              By completing this training, you confirm that you reviewed the
              official Ambassador materials and understand SitGuru’s approved
              outreach, referral-code use, QR support, @SitGuruOfficial social
              growth expectations, support requests, and verified reward tracking.
            </div>
          </DashboardCard>

          <DashboardCard>
            {orientationStep?.id ? (
              trainingComplete ? (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold leading-6 text-green-900">
                  <div className="mb-3 flex items-center gap-2 text-base font-black text-green-950">
                    <CheckCircle2 size={20} />
                    Badge earned
                  </div>
                  Completed on {formatDate(progress?.completed_at)}
                  {progress?.signature_name ? (
                    <span className="block">Signed by {progress.signature_name}</span>
                  ) : null}
                </div>
              ) : (
                <form action={completeTrainingAction} className="grid gap-3">
                  <input type="hidden" name="training_step_id" value={orientationStep.id} />

                  <label className="flex items-start gap-3 rounded-2xl border border-green-100 bg-white p-3">
                    <input
                      type="checkbox"
                      name="acknowledgment"
                      value="yes"
                      className="mt-1 h-4 w-4 rounded border-green-300 text-green-800"
                    />
                    <span className="text-xs font-bold leading-5 text-slate-700">
                      I reviewed the Ambassador Academy materials and understand
                      SitGuru’s Ambassador expectations.
                    </span>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Type your full name to certify
                    </span>
                    <input
                      name="signature_name"
                      placeholder={fullName}
                      className="min-h-11 rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
                  >
                    Complete Training & Unlock Badge
                    <ArrowRight size={17} />
                  </button>
                </form>
              )
            ) : (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                An active Ambassador Academy training step has not been created yet. Message
                SitGuru or ask an admin to publish the Ambassador training step.
              </div>
            )}
          </DashboardCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <DashboardCard>
            <SectionHeader
              icon={<LockKeyhole size={22} />}
              title="Need help?"
              detail="Message SitGuru if you cannot open a training file, need a QR code, need flyers, or have a question about your Ambassador steps."
            />
            <Link
              href={`${AMBASSADOR_MESSAGES_HREF}?topic=training-help&ref=${encodeURIComponent(referralCode)}`}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              Message SitGuru
              <ArrowRight size={17} />
            </Link>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<BadgeCheck size={22} />}
              title="Badge reminder"
              detail="Once complete, your Ambassador badge is shown from your dashboard and points back to this page for review."
            />
            <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold leading-6 text-green-900">
              {trainingComplete
                ? "Your badge is active because Ambassador training is complete."
                : "Your badge will unlock after certification is submitted."}
            </div>
          </DashboardCard>
        </section>
      </div>
    </main>
  );
}

function TrainingMaterialStepCard({
  item,
  trainingComplete,
}: {
  item: TrainingItem;
  trainingComplete: boolean;
}) {
  const assetUrl = getAssetUrl(item);
  const contentType = getContentTypeLabel(item.contentType);
  const canOpenAsset = Boolean(assetUrl);

  return (
    <article className="rounded-[28px] border border-[#dfe9e2] bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green-800 px-3 py-1 text-xs font-black text-white">
              Step {item.stepNumber}
            </span>
            <StatusPill complete={trainingComplete}>
              {trainingComplete ? "Complete" : item.isCertification ? "Certification" : "Review"}
            </StatusPill>
            {item.isRequired !== false ? (
              <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
                Required
              </span>
            ) : (
              <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
                Optional
              </span>
            )}
            <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
              {contentType}
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-green-950 sm:text-3xl">
            {item.title}
          </h2>

          {item.description ? (
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
              {item.description}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniMeta
              icon={<Clock3 size={17} />}
              label="Estimated"
              value={`${asNumber(item.estimatedMinutes) || 3} min`}
            />
            <MiniMeta
              icon={<FileText size={17} />}
              label="Material"
              value={contentType}
            />
            <MiniMeta
              icon={<BadgeCheck size={17} />}
              label="Status"
              value={trainingComplete ? "Complete" : item.isCertification ? "Ready after review" : "Review item"}
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-green-100 bg-[#fbfcf9] p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
              {trainingComplete ? <CheckCircle2 size={20} /> : <UserRoundCheck size={20} />}
            </div>
            <div>
              <p className="text-sm font-black text-green-950">
                {item.isCertification ? "Final certification" : "Review material"}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                {item.isCertification
                  ? "Submit the certification section below after reviewing all materials."
                  : "Open and review this material before completing certification."}
              </p>
            </div>
          </div>

          {canOpenAsset ? (
            <a
              href={assetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              Open Training
              <ExternalLink size={17} />
            </a>
          ) : item.isCertification ? (
            <a
              href="#certification"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              Go to Certification
              <ArrowRight size={17} />
            </a>
          ) : (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
              Training material has not been uploaded for this item yet.
            </div>
          )}
        </div>
      </div>
    </article>
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

function MiniMeta({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-[#fbfcf9] p-3">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-green-950">{value}</p>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
      {children}
    </span>
  );
}

function StatusPill({
  complete,
  children,
}: {
  complete: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black ${
        complete
          ? "border-green-100 bg-green-50 text-green-900"
          : "border-amber-100 bg-amber-50 text-amber-900"
      }`}
    >
      {children}
    </span>
  );
}