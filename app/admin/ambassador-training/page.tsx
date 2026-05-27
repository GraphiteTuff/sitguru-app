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
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
  ambassadorLeads: "/admin/ambassador-leads",
  ambassadorTraining: "/admin/ambassador-training",
};

const contentTypes = [
  "video",
  "powerpoint",
  "pdf",
  "document",
  "link",
  "quiz",
  "certification",
];

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
  if (normalized === "link") return "Link";
  if (normalized === "quiz") return "Quiz";
  if (normalized === "certification") return "Certification";

  return "Training";
}

function getTrainingMaterialLabel(step: TrainingStep) {
  if (asString(step.video_url)) return "Video URL";
  if (asString(step.external_url)) return "External URL";
  if (asString(step.storage_path)) return "Storage File";
  return "No material";
}

function getTrainingMaterialUrl(step: TrainingStep) {
  const videoUrl = asString(step.video_url);
  const externalUrl = asString(step.external_url);

  if (videoUrl) return videoUrl;
  if (externalUrl) return externalUrl;

  return "";
}

function getNotice(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const created = asString(searchParams?.created);
  const updated = asString(searchParams?.updated);
  const toggled = asString(searchParams?.toggled);
  const error = asString(searchParams?.error);

  if (created === "success") {
    return {
      tone: "success" as const,
      title: "Training step added",
      message: "The Ambassador training step was created successfully.",
    };
  }

  if (updated === "success") {
    return {
      tone: "success" as const,
      title: "Training step updated",
      message: "The Ambassador training step was updated successfully.",
    };
  }

  if (toggled === "success") {
    return {
      tone: "success" as const,
      title: "Training step status updated",
      message: "The active/inactive status was updated successfully.",
    };
  }

  if (error === "forbidden") {
    return {
      tone: "error" as const,
      title: "Access denied",
      message: "Only SitGuru Super Admins can update Ambassador training steps.",
    };
  }

  if (error) {
    return {
      tone: "error" as const,
      title: "Training update failed",
      message:
        "The training step could not be saved. Please confirm the training tables exist in Supabase.",
    };
  }

  return null;
}

async function createTrainingStep(formData: FormData) {
  "use server";

  await requireSuperAdmin();

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

  if (!title || !stepNumber) {
    redirect(`${adminRoutes.ambassadorTraining}?error=missing`);
  }

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("ambassador_training_steps")
    .insert({
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
    console.warn("Unable to create Ambassador training step:", error);
    redirect(`${adminRoutes.ambassadorTraining}?error=create`);
  }

  revalidatePath(adminRoutes.ambassadorTraining);
  revalidatePath("/ambassador/training");
  redirect(`${adminRoutes.ambassadorTraining}?created=success`);
}

async function updateTrainingStep(formData: FormData) {
  "use server";

  await requireSuperAdmin();

  const stepId = asString(formData.get("step_id"));
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

  if (!stepId || !title || !stepNumber) {
    redirect(`${adminRoutes.ambassadorTraining}?error=missing`);
  }

  const { error } = await supabaseAdmin
    .from("ambassador_training_steps")
    .update({
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
    console.warn("Unable to update Ambassador training step:", error);
    redirect(`${adminRoutes.ambassadorTraining}?error=update`);
  }

  revalidatePath(adminRoutes.ambassadorTraining);
  revalidatePath("/ambassador/training");
  revalidatePath("/ambassador/dashboard");
  redirect(`${adminRoutes.ambassadorTraining}?updated=success`);
}

async function toggleTrainingStepStatus(formData: FormData) {
  "use server";

  await requireSuperAdmin();

  const stepId = asString(formData.get("step_id"));
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
    console.warn("Unable to toggle Ambassador training step:", error);
    redirect(`${adminRoutes.ambassadorTraining}?error=toggle`);
  }

  revalidatePath(adminRoutes.ambassadorTraining);
  revalidatePath("/ambassador/training");
  revalidatePath("/ambassador/dashboard");
  redirect(`${adminRoutes.ambassadorTraining}?toggled=success`);
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

  const [{ data: stepsResult }, { data: progressResult }] = await Promise.all([
    supabaseAdmin
      .from("ambassador_training_steps")
      .select("*")
      .order("step_number", { ascending: true }),
    supabaseAdmin
      .from("ambassador_training_progress")
      .select("training_step_id,status")
      .limit(5000),
  ]);

  const steps = ((stepsResult || []) as TrainingStep[]).sort(
    (a, b) => asNumber(a.step_number) - asNumber(b.step_number),
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
  const signatureSteps = steps.filter((step) => step.requires_signature === true);
  const acknowledgmentSteps = steps.filter(
    (step) => step.requires_acknowledgment !== false,
  );

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
                    Admin / Ambassador Training
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-5xl">
                    Training Step Manager
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-5xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                Add and update Student Ambassador onboarding videos, PowerPoints,
                PDFs, documents, required acknowledgments, and certification
                steps. Changes here control what Ambassadors see on their mobile
                training checklist.
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

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            icon={<ClipboardList size={20} />}
            label="Total Steps"
            value={number(steps.length)}
            detail="All active and inactive records"
          />
          <MetricCard
            icon={<ToggleRight size={20} />}
            label="Active"
            value={number(activeSteps.length)}
            detail="Visible to Ambassadors"
          />
          <MetricCard
            icon={<BadgeCheck size={20} />}
            label="Required"
            value={number(requiredSteps.length)}
            detail="Counts toward completion"
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
                title="Add Training Step"
                detail="Create a new onboarding step for all Student Ambassadors."
              />
            </div>

            <TrainingStepForm
              action={createTrainingStep}
              submitLabel="Add Training Step"
              defaultStepNumber={steps.length + 1}
              defaultIsActive
              defaultIsRequired
              defaultRequiresAcknowledgment
            />
          </DashboardCard>

          <DashboardCard>
            <div className="mb-5">
              <SectionHeader
                icon={<BookOpenCheck size={22} />}
                title="Current Training Steps"
                detail="Edit titles, descriptions, required settings, materials, storage paths, and certification requirements."
              />
            </div>

            <div className="grid gap-4">
              {steps.length ? (
                steps.map((step) => (
                  <TrainingStepEditor
                    key={step.id}
                    step={step}
                    completedCount={completedByStep.get(step.id) || 0}
                    startedCount={startedByStep.get(step.id) || 0}
                  />
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-green-200 bg-green-50 p-6 text-center">
                  <BookOpenCheck
                    className="mx-auto mb-3 text-green-700"
                    size={36}
                  />
                  <h2 className="text-lg font-black text-green-950">
                    No training steps yet
                  </h2>
                  <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-green-900/75">
                    Add your first Ambassador training step to start building
                    the mobile onboarding checklist.
                  </p>
                </div>
              )}
            </div>
          </DashboardCard>
        </section>

        <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoTile
              icon={<FileText size={20} />}
              title="Storage path support"
              detail="Upload PPTs, PDFs, and videos into Supabase Storage, then paste the bucket and file path into the step."
            />
            <InfoTile
              icon={<ShieldCheck size={20} />}
              title="Required step control"
              detail="Required steps count toward Ambassador training completion. Optional steps can be informational."
            />
            <InfoTile
              icon={<LockKeyhole size={20} />}
              title="Certification control"
              detail="Use typed signature on key steps such as referral tracking, payout basics, policy acknowledgments, or contractor onboarding."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function TrainingStepEditor({
  step,
  completedCount,
  startedCount,
}: {
  step: TrainingStep;
  completedCount: number;
  startedCount: number;
}) {
  const active = step.is_active !== false;
  const materialUrl = getTrainingMaterialUrl(step);

  return (
    <article className="rounded-[28px] border border-[#dfe9e2] bg-[#fbfcf9] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green-800 px-3 py-1 text-xs font-black text-white">
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

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniStat
              label="Started"
              value={number(startedCount)}
              detail="in progress"
            />
            <MiniStat
              label="Completed"
              value={number(completedCount)}
              detail="Ambassadors"
            />
            <MiniStat
              label="Material"
              value={getTrainingMaterialLabel(step)}
              detail={getContentTypeLabel(step.content_type)}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {materialUrl ? (
            <a
              href={materialUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <ExternalLink size={16} />
              Open Material
            </a>
          ) : null}

          <form action={toggleTrainingStepStatus}>
            <input type="hidden" name="step_id" value={step.id} />
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

function TrainingStepForm({
  action,
  submitLabel,
  step,
  defaultStepNumber,
  defaultIsRequired = false,
  defaultIsActive = false,
  defaultRequiresAcknowledgment = false,
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  step?: TrainingStep;
  defaultStepNumber?: number;
  defaultIsRequired?: boolean;
  defaultIsActive?: boolean;
  defaultRequiresAcknowledgment?: boolean;
}) {
  const isEdit = Boolean(step?.id);

  return (
    <form action={action} className="grid gap-4">
      {isEdit ? <input type="hidden" name="step_id" value={step?.id} /> : null}

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
          placeholder="Welcome to SitGuru"
          defaultValue={step?.title || ""}
          className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
        />
      </FormField>

      <FormField label="Description">
        <textarea
          name="description"
          rows={4}
          placeholder="Explain what this training step covers."
          defaultValue={step?.description || ""}
          className="w-full resize-none rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
        />
      </FormField>

      <FormField label="Content Type">
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
              Training Material
            </h3>
            <p className="mt-1 text-xs font-bold leading-5 text-green-900/75">
              Use a video URL, public PowerPoint/PDF URL, or Supabase Storage
              bucket/path. Storage upload controls can be added next.
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
                placeholder="ambassador-training"
                defaultValue={step?.storage_bucket || ""}
                className="min-h-12 w-full rounded-2xl border border-[#dfe9e2] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
              />
            </FormField>

            <FormField label="Storage Path">
              <input
                name="storage_path"
                placeholder="student-hire/video-1.mp4"
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
          label="Active / visible to Ambassadors"
          defaultChecked={step ? step.is_active !== false : defaultIsActive}
        />
        <CheckboxField
          name="is_required"
          label="Required for onboarding completion"
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
      <p className="mt-1 text-lg font-black text-green-950">{value}</p>
      <p className="text-xs font-bold text-slate-500">{detail}</p>
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
    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-green-100 bg-[#fbfcf9] px-4 py-3">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-green-300 text-green-800"
      />
      <span className="text-xs font-black leading-5 text-green-950">
        {label}
      </span>
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
    <div className="rounded-2xl border border-green-100 bg-[#fbfcf9] p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>
      <p className="font-black text-green-950">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {detail}
      </p>
    </div>
  );
}