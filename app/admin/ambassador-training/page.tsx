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
    detail: "Profile setup, pet profiles, Guru search, booking, reviews, and safety.",
    audience: "Pet Parents",
    modules: "3 modules",
    certificate: "Certified Pet Parent",
  },
  {
    value: "guru",
    label: "Guru Academy",
    shortLabel: "Guru",
    emoji: "🎓",
    detail: "Guru profile, bookings, care standards, Stripe payouts, earnings, and success center.",
    audience: "Gurus",
    modules: "5 modules",
    certificate: "Certified Guru",
  },
  {
    value: "ambassador",
    label: "Ambassador Academy",
    shortLabel: "Ambassador",
    emoji: "🌟",
    detail: "Referral links, outreach, dashboard, PawPerks, Stripe, rewards, and compliance.",
    audience: "Ambassadors",
    modules: "5 modules",
    certificate: "Certified Ambassador",
  },
];

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
  return academyOptions.find((academy) => academy.value === academyType) || academyOptions[2];
}

function getAcademyFilter(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalized = asString(rawValue).toLowerCase();

  if (normalized === "pet_parent" || normalized === "guru" || normalized === "ambassador") {
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

  if (error === "forbidden") {
    return {
      tone: "error" as const,
      title: "Access denied",
      message: "Only SitGuru Super Admins can update SitGuru University training steps.",
    };
  }

  if (error === "academy") {
    return {
      tone: "error" as const,
      title: "Academy type missing",
      message: "Please select Pet Parent Academy, Guru Academy, or Ambassador Academy.",
    };
  }

  if (error) {
    return {
      tone: "error" as const,
      title: "Training update failed",
      message:
        "The training step could not be saved. Please confirm the training table and academy_type column exist in Supabase.",
    };
  }

  return null;
}

async function createTrainingStep(formData: FormData) {
  "use server";

  await requireSuperAdmin();

  const academyType = normalizeAcademyType(asString(formData.get("academy_type")));
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

  revalidatePath(adminRoutes.ambassadorTraining);
  revalidatePath("/ambassador/training");
  revalidatePath("/guru/training");
  revalidatePath("/customer/training");
  redirect(`${adminRoutes.ambassadorTraining}?academy=${academyType}&created=success`);
}

async function updateTrainingStep(formData: FormData) {
  "use server";

  await requireSuperAdmin();

  const stepId = asString(formData.get("step_id"));
  const academyType = normalizeAcademyType(asString(formData.get("academy_type")));
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

  revalidatePath(adminRoutes.ambassadorTraining);
  revalidatePath("/ambassador/training");
  revalidatePath("/ambassador/dashboard");
  revalidatePath("/guru/training");
  revalidatePath("/guru/dashboard");
  revalidatePath("/customer/training");
  redirect(`${adminRoutes.ambassadorTraining}?academy=${academyType}&updated=success`);
}

async function toggleTrainingStepStatus(formData: FormData) {
  "use server";

  await requireSuperAdmin();

  const stepId = asString(formData.get("step_id"));
  const academyType = normalizeAcademyType(asString(formData.get("academy_type")));
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

  revalidatePath(adminRoutes.ambassadorTraining);
  revalidatePath("/ambassador/training");
  revalidatePath("/ambassador/dashboard");
  revalidatePath("/guru/training");
  revalidatePath("/guru/dashboard");
  revalidatePath("/customer/training");
  redirect(`${adminRoutes.ambassadorTraining}?academy=${academyType}&toggled=success`);
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

  const [{ data: stepsResult }, { data: progressResult }] = await Promise.all([
    supabaseAdmin
      .from("ambassador_training_steps")
      .select("*")
      .order("academy_type", { ascending: true })
      .order("step_number", { ascending: true }),
    supabaseAdmin
      .from("ambassador_training_progress")
      .select("training_step_id,status")
      .limit(5000),
  ]);

  const allSteps = ((stepsResult || []) as TrainingStep[]).sort((a, b) => {
    const academyA = normalizeAcademyType(a.academy_type);
    const academyB = normalizeAcademyType(b.academy_type);

    if (academyA !== academyB) {
      return academyA.localeCompare(academyB);
    }

    return asNumber(a.step_number) - asNumber(b.step_number);
  });

  const steps =
    academyFilter === "all"
      ? allSteps
      : allSteps.filter(
          (step) => normalizeAcademyType(step.academy_type) === academyFilter,
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

  const academyCounts = academyOptions.map((academy) => {
    const academySteps = allSteps.filter(
      (step) => normalizeAcademyType(step.academy_type) === academy.value,
    );

    return {
      ...academy,
      total: academySteps.length,
      active: academySteps.filter((step) => step.is_active !== false).length,
      required: academySteps.filter((step) => step.is_required !== false).length,
    };
  });

  const selectedAcademy =
    academyFilter === "all" ? null : getAcademyOption(academyFilter);

  const defaultStepNumber =
    academyFilter === "all"
      ? steps.length + 1
      : steps.filter(
          (step) => normalizeAcademyType(step.academy_type) === academyFilter,
        ).length + 1;

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
                training materials from one place. Each step can be tied to an
                academy, assigned by user type, and used for onboarding,
                acknowledgments, certification, badges, and completion tracking.
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
                      {number(academy.total)}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      Steps
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <MiniStat
                    label="Audience"
                    value={academy.audience}
                    detail="assigned users"
                  />
                  <MiniStat
                    label="Program"
                    value={academy.modules}
                    detail="academy path"
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
          <AcademyFilterLink active={academyFilter === "all"} href={adminRoutes.ambassadorTraining}>
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
            label="Visible Steps"
            value={number(steps.length)}
            detail={
              selectedAcademy
                ? `${selectedAcademy.label} records`
                : "All academy records"
            }
          />
          <MetricCard
            icon={<ToggleRight size={20} />}
            label="Active"
            value={number(activeSteps.length)}
            detail="Visible to assigned users"
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
                title="Add Academy Step"
                detail="Create training material for Pet Parents, Gurus, Ambassadors, or future SitGuru University paths."
              />
            </div>

            <TrainingStepForm
              action={createTrainingStep}
              submitLabel="Add Training Step"
              defaultAcademyType={selectedAcademy?.value || "ambassador"}
              defaultStepNumber={defaultStepNumber}
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
                    ? `${selectedAcademy.label} Steps`
                    : "All Academy Steps"
                }
                detail="Edit academy type, step order, descriptions, required settings, training materials, storage paths, and certification requirements."
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
                    Add your first SitGuru University training step for this academy.
                  </p>
                </div>
              )}
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
              title="Required step control"
              detail="Required steps count toward each academy's completion. Optional steps can be informational or supplemental."
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
  completedCount,
  startedCount,
}: {
  step: TrainingStep;
  completedCount: number;
  startedCount: number;
}) {
  const active = step.is_active !== false;
  const materialUrl = getTrainingMaterialUrl(step);
  const academy = getAcademyOption(step.academy_type);

  return (
    <article className="rounded-[28px] border border-[#dfe9e2] bg-[#fbfcf9] p-4 sm:p-5">
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

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
  defaultAcademyType = "ambassador",
  defaultStepNumber,
  defaultIsRequired = false,
  defaultIsActive = false,
  defaultRequiresAcknowledgment = false,
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  step?: TrainingStep;
  defaultAcademyType?: AcademyType;
  defaultStepNumber?: number;
  defaultIsRequired?: boolean;
  defaultIsActive?: boolean;
  defaultRequiresAcknowledgment?: boolean;
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
              Use a video URL, Gamma link, public PowerPoint/PDF URL, NotebookLM
              link, Synthesia video, or Supabase Storage bucket/path.
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
      <p className="mt-1 text-sm font-black text-green-950">{value}</p>
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
    <div className="rounded-[24px] border border-green-100 bg-green-50/50 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-green-800 shadow-sm">
        {icon}
      </div>
      <h3 className="text-sm font-black text-green-950">{title}</h3>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
        {detail}
      </p>
    </div>
  );
}