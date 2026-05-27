import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardSignature,
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

type AnyRow = Record<string, unknown>;

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
  onboarding_step?: number | null;
  onboarding_percent?: number | null;
  training_completed_at?: string | null;
  onboarding_completed_at?: string | null;
  certification_signed_at?: string | null;
  certification_name?: string | null;
};

type TrainingStep = {
  id: string;
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

type StepWithProgress = TrainingStep & {
  progress?: TrainingProgress | null;
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

function getStatusLabel(status?: string | null) {
  const normalized = asString(status).toLowerCase();

  if (normalized === "completed" || normalized === "complete") return "Complete";
  if (normalized === "in_progress") return "In Progress";
  if (normalized === "started") return "In Progress";
  if (normalized === "acknowledged") return "Acknowledged";

  return "Not Started";
}

function isStepComplete(step: StepWithProgress) {
  const status = asString(step.progress?.status).toLowerCase();

  return Boolean(
    status === "completed" ||
      status === "complete" ||
      step.progress?.completed_at,
  );
}

function getTrainingPercent(steps: StepWithProgress[]) {
  const requiredSteps = steps.filter((step) => step.is_required !== false);

  if (!requiredSteps.length) return 0;

  const completed = requiredSteps.filter(isStepComplete).length;

  return Math.round((completed / requiredSteps.length) * 100);
}

function getTrainingAssetUrl(step: TrainingStep) {
  const externalUrl = asString(step.external_url);
  const videoUrl = asString(step.video_url);

  if (videoUrl) return videoUrl;
  if (externalUrl) return externalUrl;

  const bucket = asString(step.storage_bucket);
  const storagePath = asString(step.storage_path);

  if (!bucket || !storagePath) return "";

  return `${getSiteUrl()}/api/storage/${bucket}/${storagePath}`;
}

function getContentTypeLabel(value?: string | null) {
  const normalized = asString(value).toLowerCase();

  if (normalized === "video") return "Video";
  if (normalized === "ppt" || normalized === "powerpoint") return "PowerPoint";
  if (normalized === "pdf") return "PDF";
  if (normalized === "document") return "Document";
  if (normalized === "link") return "Link";

  return "Training";
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

  const { data: ambassador, error: ambassadorError } = await supabaseAdmin
    .from("ambassadors")
    .select("*")
    .or(
      `user_id.eq.${user.id},login_email.eq.${userEmail},contact_email.eq.${userEmail},email.eq.${userEmail}`,
    )
    .eq("dashboard_enabled", true)
    .eq("login_enabled", true)
    .neq("status", "archived")
    .maybeSingle();

  if (ambassadorError || !ambassador) {
    await supabase.auth.signOut();
    redirect("/ambassador/login?error=restricted");
  }

  return ambassador as AmbassadorRecord;
}

async function startTrainingStepAction(formData: FormData) {
  "use server";

  const ambassador = await getLoggedInAmbassador();
  const stepId = asString(formData.get("step_id"));

  if (!stepId) {
    redirect("/ambassador/training");
  }

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("ambassador_training_progress")
    .upsert(
      {
        ambassador_id: ambassador.id,
        training_step_id: stepId,
        status: "in_progress",
        started_at: now,
        updated_at: now,
      },
      {
        onConflict: "ambassador_id,training_step_id",
      },
    );

  if (error) {
    console.warn("Unable to start Ambassador training step:", error);
  }

  revalidatePath("/ambassador/training");
  redirect("/ambassador/training");
}

async function completeTrainingStepAction(formData: FormData) {
  "use server";

  const ambassador = await getLoggedInAmbassador();
  const stepId = asString(formData.get("step_id"));
  const signatureName = asString(formData.get("signature_name"));
  const acknowledgment = asString(formData.get("acknowledgment"));

  if (!stepId) {
    redirect("/ambassador/training");
  }

  const { data: step, error: stepError } = await supabaseAdmin
    .from("ambassador_training_steps")
    .select("*")
    .eq("id", stepId)
    .maybeSingle();

  if (stepError || !step) {
    console.warn("Unable to load Ambassador training step:", stepError);
    redirect("/ambassador/training?error=missing_step");
  }

  const trainingStep = step as TrainingStep;
  const requiresSignature = trainingStep.requires_signature === true;
  const requiresAcknowledgment = trainingStep.requires_acknowledgment !== false;

  if (requiresAcknowledgment && acknowledgment !== "yes") {
    redirect("/ambassador/training?error=acknowledgment_required");
  }

  if (requiresSignature && !signatureName) {
    redirect("/ambassador/training?error=signature_required");
  }

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("ambassador_training_progress")
    .upsert(
      {
        ambassador_id: ambassador.id,
        training_step_id: stepId,
        status: "completed",
        started_at: now,
        completed_at: now,
        acknowledged_at: now,
        signed_at: requiresSignature ? now : null,
        signature_name: requiresSignature ? signatureName : null,
        certification_text: requiresSignature
          ? `I certify that I completed this SitGuru Ambassador training step and understand the requirements for ${trainingStep.title}.`
          : null,
        updated_at: now,
      },
      {
        onConflict: "ambassador_id,training_step_id",
      },
    );

  if (error) {
    console.warn("Unable to complete Ambassador training step:", error);
    redirect("/ambassador/training?error=save_failed");
  }

  await refreshAmbassadorTrainingSummary(ambassador.id);

  revalidatePath("/ambassador/training");
  revalidatePath("/ambassador/dashboard");
  redirect("/ambassador/training?success=completed");
}

async function refreshAmbassadorTrainingSummary(ambassadorId: string) {
  const [{ data: steps }, { data: progressRows }] = await Promise.all([
    supabaseAdmin
      .from("ambassador_training_steps")
      .select("*")
      .eq("is_active", true)
      .order("step_number", { ascending: true }),
    supabaseAdmin
      .from("ambassador_training_progress")
      .select("*")
      .eq("ambassador_id", ambassadorId),
  ]);

  const trainingSteps = ((steps || []) as TrainingStep[]).filter(
    (step) => step.is_required !== false,
  );
  const progress = (progressRows || []) as TrainingProgress[];

  const progressMap = new Map(
    progress.map((row) => [asString(row.training_step_id), row]),
  );

  const merged = trainingSteps.map((step) => ({
    ...step,
    progress: progressMap.get(step.id) || null,
  }));

  const percent = getTrainingPercent(merged);
  const completedCount = merged.filter(isStepComplete).length;
  const nextStep = merged.find((step) => !isStepComplete(step));
  const now = new Date().toISOString();

  const trainingComplete = trainingSteps.length > 0 && completedCount >= trainingSteps.length;

  await supabaseAdmin
    .from("ambassadors")
    .update({
      onboarding_step: nextStep?.step_number || trainingSteps.length,
      onboarding_percent: percent,
      training_status: trainingComplete ? "Completed" : "In Progress",
      training_completed_at: trainingComplete ? now : null,
      certification_signed_at: trainingComplete ? now : null,
      updated_at: now,
    })
    .eq("id", ambassadorId);
}

function getPageMessage(searchParams: Record<string, string | string[] | undefined>) {
  const error = asString(searchParams.error);
  const success = asString(searchParams.success);

  if (success === "completed") {
    return {
      type: "success" as const,
      text: "Training step completed. Your onboarding progress has been updated.",
    };
  }

  if (error === "acknowledgment_required") {
    return {
      type: "error" as const,
      text: "Please check the acknowledgment box before marking this step complete.",
    };
  }

  if (error === "signature_required") {
    return {
      type: "error" as const,
      text: "Please type your name to certify this required training step.",
    };
  }

  if (error === "save_failed") {
    return {
      type: "error" as const,
      text: "We could not save that training step. Please try again or message SitGuru.",
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

  const fullName = asString(ambassador.full_name) || "SitGuru Ambassador";
  const firstName = getFirstName(fullName);
  const referralCode = asString(ambassador.referral_code);

  const [{ data: stepsResult }, { data: progressResult }] = await Promise.all([
    supabaseAdmin
      .from("ambassador_training_steps")
      .select("*")
      .eq("is_active", true)
      .order("step_number", { ascending: true }),
    supabaseAdmin
      .from("ambassador_training_progress")
      .select("*")
      .eq("ambassador_id", ambassador.id),
  ]);

  const trainingSteps = (stepsResult || []) as TrainingStep[];
  const progressRows = (progressResult || []) as TrainingProgress[];

  const progressMap = new Map(
    progressRows.map((row) => [asString(row.training_step_id), row]),
  );

  const stepsWithProgress: StepWithProgress[] = trainingSteps.map((step) => ({
    ...step,
    progress: progressMap.get(step.id) || null,
  }));

  const requiredSteps = stepsWithProgress.filter(
    (step) => step.is_required !== false,
  );
  const completedRequiredCount = requiredSteps.filter(isStepComplete).length;
  const trainingPercent = getTrainingPercent(stepsWithProgress);
  const nextStep =
    stepsWithProgress.find((step) => !isStepComplete(step)) ||
    stepsWithProgress[stepsWithProgress.length - 1] ||
    null;

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
                  href="/ambassador/dashboard"
                  className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-2 text-xs font-black text-green-900 transition hover:bg-green-100"
                >
                  <ArrowLeft size={15} />
                  Back to Dashboard
                </Link>

                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-700 sm:text-xs">
                  SitGuru Student Ambassador Training
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-green-950 sm:text-5xl">
                  {firstName}, continue onboarding
                </h1>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                  Complete each training step, review the materials, and certify
                  your progress. SitGuru uses this checklist to move you from
                  early referral approval into full active Ambassador readiness.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill>{referralCode || "Ambassador"}</Pill>
                  <Pill>{completedRequiredCount} of {requiredSteps.length} required complete</Pill>
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
                : "border-red-100 bg-red-50 text-red-800"
            }`}
          >
            {pageMessage.text}
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <DashboardCard>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <SectionHeader
                  icon={<GraduationCap size={22} />}
                  title="Training Progress"
                  detail="Work through each required training item in order. You can complete items from your phone, tablet, or desktop."
                />
              </div>

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
                  {completedRequiredCount} of {requiredSteps.length} required
                  training steps complete.
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<Sparkles size={22} />}
              title="Next Step"
              detail={
                nextStep
                  ? `Step ${nextStep.step_number}: ${nextStep.title}`
                  : "All training steps are complete."
              }
            />

            {nextStep ? (
              <a
                href={`#step-${nextStep.id}`}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Continue Step {nextStep.step_number}
                <ArrowRight size={17} />
              </a>
            ) : (
              <Link
                href="/ambassador/dashboard"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Return to Dashboard
                <ArrowRight size={17} />
              </Link>
            )}
          </DashboardCard>
        </section>

        <section className="grid gap-4">
          {stepsWithProgress.length ? (
            stepsWithProgress.map((step) => (
              <TrainingStepCard
                key={step.id}
                step={step}
                ambassadorName={fullName}
              />
            ))
          ) : (
            <DashboardCard>
              <SectionHeader
                icon={<BookOpenCheck size={22} />}
                title="No training steps loaded yet"
                detail="SitGuru has not published Ambassador training steps yet. Please check back soon or contact your onboarding contact."
              />
            </DashboardCard>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <DashboardCard>
            <SectionHeader
              icon={<ClipboardSignature size={22} />}
              title="Certification"
              detail="Some required steps may ask you to type your name as your completion acknowledgment."
            />
            <div className="mt-4 rounded-2xl border border-green-100 bg-[#fbfcf9] p-4 text-sm font-semibold leading-6 text-slate-600">
              By marking training steps complete, you confirm that you reviewed
              the material and understand SitGuru’s approved outreach,
              referral-code, signup, and payout tracking expectations.
            </div>
          </DashboardCard>

          <DashboardCard>
            <SectionHeader
              icon={<MessageCircleIcon />}
              title="Need help?"
              detail="Message SitGuru if you cannot open a training file, need a password link, or have a question about your Ambassador steps."
            />
            <Link
              href={`/ambassador/messages?ref=${encodeURIComponent(referralCode)}`}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              Message SitGuru
              <ArrowRight size={17} />
            </Link>
          </DashboardCard>
        </section>
      </div>
    </main>
  );
}

function TrainingStepCard({
  step,
  ambassadorName,
}: {
  step: StepWithProgress;
  ambassadorName: string;
}) {
  const complete = isStepComplete(step);
  const statusLabel = getStatusLabel(step.progress?.status);
  const assetUrl = getTrainingAssetUrl(step);
  const contentType = getContentTypeLabel(step.content_type);
  const requiresAcknowledgment = step.requires_acknowledgment !== false;
  const requiresSignature = step.requires_signature === true;

  return (
    <article
      id={`step-${step.id}`}
      className="rounded-[28px] border border-[#dfe9e2] bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green-800 px-3 py-1 text-xs font-black text-white">
              Step {step.step_number}
            </span>
            <StatusPill complete={complete}>{statusLabel}</StatusPill>
            {step.is_required !== false ? (
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
            {step.title}
          </h2>

          {step.description ? (
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
              {step.description}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniMeta
              icon={<Clock3 size={17} />}
              label="Estimated"
              value={`${asNumber(step.estimated_minutes) || 5} min`}
            />
            <MiniMeta
              icon={<FileText size={17} />}
              label="Material"
              value={contentType}
            />
            <MiniMeta
              icon={<BadgeCheck size={17} />}
              label="Completed"
              value={formatDate(step.progress?.completed_at)}
            />
          </div>

          {assetUrl ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <form action={startTrainingStepAction}>
                <input type="hidden" name="step_id" value={step.id} />
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50 sm:w-auto"
                >
                  <PlayCircle size={18} />
                  Start / Resume
                </button>
              </form>

              <a
                href={assetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900 sm:w-auto"
              >
                Open Training
                <ExternalLink size={17} />
              </a>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
              Training material has not been uploaded for this step yet.
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-green-100 bg-[#fbfcf9] p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800">
              {complete ? <CheckCircle2 size={20} /> : <UserRoundCheck size={20} />}
            </div>
            <div>
              <p className="text-sm font-black text-green-950">
                {complete ? "Training Complete" : "Complete this step"}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                {complete
                  ? "This step has been certified on your Ambassador record."
                  : "Review the material, acknowledge completion, and submit."}
              </p>
            </div>
          </div>

          {complete ? (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold leading-6 text-green-900">
              Completed on {formatDate(step.progress?.completed_at)}
              {step.progress?.signature_name ? (
                <span className="block">
                  Signed by {step.progress.signature_name}
                </span>
              ) : null}
            </div>
          ) : (
            <form action={completeTrainingStepAction} className="grid gap-3">
              <input type="hidden" name="step_id" value={step.id} />

              {requiresAcknowledgment ? (
                <label className="flex items-start gap-3 rounded-2xl border border-green-100 bg-white p-3">
                  <input
                    type="checkbox"
                    name="acknowledgment"
                    value="yes"
                    className="mt-1 h-4 w-4 rounded border-green-300 text-green-800"
                  />
                  <span className="text-xs font-bold leading-5 text-slate-700">
                    I reviewed this training step and understand SitGuru’s
                    Ambassador expectations for this topic.
                  </span>
                </label>
              ) : (
                <input type="hidden" name="acknowledgment" value="yes" />
              )}

              {requiresSignature ? (
                <label className="grid gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Type your full name to certify
                  </span>
                  <input
                    name="signature_name"
                    placeholder={ambassadorName}
                    className="min-h-11 rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
                  />
                </label>
              ) : null}

              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Mark Step Complete
                <ArrowRight size={17} />
              </button>
            </form>
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

function MessageCircleIcon() {
  return <LockKeyhole size={22} />;
}