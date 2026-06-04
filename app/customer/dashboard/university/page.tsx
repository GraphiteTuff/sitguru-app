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
  completed_at?: string | null;
};

type MaterialWithUrl = TrainingMaterial & {
  openUrl: string;
  downloadUrl: string;
  acknowledgedAt: string | null;
  isAcknowledged: boolean;
};

type StepWithMaterials = TrainingStep & {
  materials: MaterialWithUrl[];
  completedAt: string | null;
  isCompleted: boolean;
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
  return new Intl.NumberFormat("en-US").format(Number.isFinite(value) ? value : 0);
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
  const parts = value.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return `${parts[0]?.charAt(0) || "P"}${parts[1]?.charAt(0) || "P"}`.toUpperCase();
}

function getDisplayName(profile: AnyRow | null, email: string) {
  const firstName = asString(profile?.first_name);
  const lastName = asString(profile?.last_name);
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  return combined || asString(profile?.full_name) || asString(profile?.display_name) || email || "Pet Parent";
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
  return asString(a.title).localeCompare(asString(b.title), undefined, { numeric: true, sensitivity: "base" });
}

function getStepEstimatedMinutes(step: TrainingStep) {
  if (step.step_number === 1) return 6;
  return asNumber(step.estimated_minutes) || 5;
}

function getStepRequiredMaterials(step: StepWithMaterials) {
  return step.materials.filter((material) => material.is_required !== false);
}

function canCompleteStep(step: StepWithMaterials) {
  const requiredMaterials = getStepRequiredMaterials(step);
  if (!requiredMaterials.length) return true;
  return requiredMaterials.every((material) => material.isAcknowledged);
}

function getExternalMaterialUrl(material: TrainingMaterial) {
  return asString(material.video_url) || asString(material.external_url);
}

async function getSignedMaterialUrls(material: TrainingMaterial) {
  const externalUrl = getExternalMaterialUrl(material);
  if (externalUrl) return { openUrl: externalUrl, downloadUrl: externalUrl };

  const bucket = asString(material.storage_bucket);
  const path = asString(material.storage_path);
  if (!bucket || !path) return { openUrl: "", downloadUrl: "" };

  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 60);
    if (error || !data?.signedUrl) {
      console.warn("Unable to create signed SitGuru University material URL:", { bucket, path, error });
      return { openUrl: "", downloadUrl: "" };
    }
    return { openUrl: data.signedUrl, downloadUrl: data.signedUrl };
  } catch (error) {
    console.warn("Unable to create signed SitGuru University material URL:", { bucket, path, error });
    return { openUrl: "", downloadUrl: "" };
  }
}

async function getProfile(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) return null;
    return (data || null) as AnyRow | null;
  } catch {
    return null;
  }
}

async function getProgressRows(userId: string) {
  const [materialProgressResult, stepProgressResult] = await Promise.all([
    supabaseAdmin.from("academy_material_progress").select("training_step_id,material_id,acknowledged_at").eq("user_id", userId).eq("academy_type", academyType),
    supabaseAdmin.from("academy_step_progress").select("training_step_id,completed_at").eq("user_id", userId).eq("academy_type", academyType),
  ]);

  if (materialProgressResult.error) console.warn("Unable to load Pet Parent Academy material progress:", materialProgressResult.error);
  if (stepProgressResult.error) console.warn("Unable to load Pet Parent Academy step progress:", stepProgressResult.error);

  return {
    materialProgressRows: (materialProgressResult.data || []) as MaterialProgress[],
    stepProgressRows: (stepProgressResult.data || []) as StepProgress[],
  };
}

async function getPetParentUniversityData(userId: string) {
  const [stepsResult, materialsResult, progressResult] = await Promise.all([
    supabaseAdmin.from("ambassador_training_steps").select("*").eq("academy_type", academyType).eq("is_active", true).order("step_number", { ascending: true }),
    supabaseAdmin.from("academy_step_materials").select("*").eq("academy_type", academyType).eq("is_active", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    getProgressRows(userId),
  ]);

  if (stepsResult.error) console.warn("Unable to load Pet Parent Academy steps:", stepsResult.error);
  if (materialsResult.error) console.warn("Unable to load Pet Parent Academy materials:", materialsResult.error);

  const steps = ((stepsResult.data || []) as TrainingStep[]).sort((a, b) => asNumber(a.step_number) - asNumber(b.step_number));
  const materials = ((materialsResult.data || []) as TrainingMaterial[]).sort(sortMaterials);

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

  const materialsByStep = new Map<string, MaterialWithUrl[]>();

  for (const material of materials) {
    const stepId = asString(material.training_step_id);
    if (!stepId) continue;
    const signedUrls = await getSignedMaterialUrls(material);
    const materialProgress = materialProgressByMaterialId.get(material.id);
    const acknowledgedAt = asString(materialProgress?.acknowledged_at) || null;
    const materialWithUrl: MaterialWithUrl = { ...material, ...signedUrls, acknowledgedAt, isAcknowledged: Boolean(acknowledgedAt) };
    const existing = materialsByStep.get(stepId) || [];
    existing.push(materialWithUrl);
    materialsByStep.set(stepId, existing.sort(sortMaterials));
  }

  const stepsWithMaterials: StepWithMaterials[] = steps.map((step) => {
    const stepProgress = stepProgressByStepId.get(step.id);
    const completedAt = asString(stepProgress?.completed_at) || null;
    return { ...step, materials: materialsByStep.get(step.id) || [], completedAt, isCompleted: Boolean(completedAt) };
  });

  const totalMaterials = stepsWithMaterials.reduce((sum, step) => sum + step.materials.length, 0);
  const requiredMaterials = stepsWithMaterials.reduce((sum, step) => sum + step.materials.filter((material) => material.is_required !== false).length, 0);
  const acknowledgedMaterials = stepsWithMaterials.reduce((sum, step) => sum + step.materials.filter((material) => material.isAcknowledged).length, 0);
  const completedSteps = stepsWithMaterials.filter((step) => step.isCompleted).length;

  return { steps: stepsWithMaterials, totalMaterials, requiredMaterials, acknowledgedMaterials, completedSteps };
}

async function acknowledgeMaterial(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const materialId = asString(formData.get("material_id"));
  const trainingStepId = asString(formData.get("training_step_id"));
  const acknowledged = asBoolean(formData.get("acknowledgment"));
  if (!materialId || !trainingStepId || !acknowledged) redirect(`${customerRoutes.university}?error=acknowledgment`);

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseAdmin.from("academy_material_progress").upsert(
    { user_id: user.id, training_step_id: trainingStepId, material_id: materialId, academy_type: academyType, acknowledged_at: now, updated_at: now },
    { onConflict: "user_id,material_id" },
  );

  if (upsertError) {
    console.warn("Unable to acknowledge Pet Parent Academy material:", upsertError);
    redirect(`${customerRoutes.university}?error=progress`);
  }

  revalidatePath(customerRoutes.university);
  revalidatePath(customerRoutes.dashboard);
  redirect(`${customerRoutes.university}?acknowledged=success#step-${trainingStepId}`);
}

async function completeStep(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const trainingStepId = asString(formData.get("training_step_id"));
  if (!trainingStepId) redirect(`${customerRoutes.university}?error=step`);

  const [{ data: requiredMaterials }, { data: acknowledgedRows }] = await Promise.all([
    supabaseAdmin.from("academy_step_materials").select("id").eq("training_step_id", trainingStepId).eq("academy_type", academyType).eq("is_active", true).eq("is_required", true),
    supabaseAdmin.from("academy_material_progress").select("material_id,acknowledged_at").eq("user_id", user.id).eq("training_step_id", trainingStepId).eq("academy_type", academyType),
  ]);

  const requiredMaterialIds = new Set(((requiredMaterials || []) as Array<{ id: string }>).map((material) => material.id));
  const acknowledgedMaterialIds = new Set(((acknowledgedRows || []) as Array<{ material_id: string | null; acknowledged_at: string | null }>).filter((row) => row.material_id && row.acknowledged_at).map((row) => row.material_id as string));
  const missingRequiredAcknowledgment = Array.from(requiredMaterialIds).some((materialId) => !acknowledgedMaterialIds.has(materialId));
  if (missingRequiredAcknowledgment) redirect(`${customerRoutes.university}?error=incomplete#step-${trainingStepId}`);

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseAdmin.from("academy_step_progress").upsert(
    { user_id: user.id, training_step_id: trainingStepId, academy_type: academyType, status: "completed", acknowledged_at: now, completed_at: now, updated_at: now },
    { onConflict: "user_id,training_step_id" },
  );

  if (upsertError) {
    console.warn("Unable to complete Pet Parent Academy step:", upsertError);
    redirect(`${customerRoutes.university}?error=progress#step-${trainingStepId}`);
  }

  revalidatePath(customerRoutes.university);
  revalidatePath(customerRoutes.dashboard);
  redirect(`${customerRoutes.university}?completed=success#step-${trainingStepId}`);
}

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function getNotice(searchParams?: Record<string, string | string[] | undefined>) {
  const acknowledged = asString(searchParams?.acknowledged);
  const completed = asString(searchParams?.completed);
  const error = asString(searchParams?.error);
  if (acknowledged === "success") return { tone: "success" as const, title: "Material acknowledged", message: "Your training material acknowledgment was saved." };
  if (completed === "success") return { tone: "success" as const, title: "Step completed", message: "Your Pet Parent Academy step completion was saved." };
  if (error === "incomplete") return { tone: "error" as const, title: "Required materials still need acknowledgment", message: "Please acknowledge every required material in this step before marking it complete." };
  if (error === "acknowledgment") return { tone: "error" as const, title: "Acknowledgment required", message: "Check the acknowledgment box before saving this material." };
  if (error === "progress") return { tone: "error" as const, title: "Progress could not be saved", message: "Confirm the academy progress tables exist in Supabase, then try again." };
  if (error) return { tone: "error" as const, title: "Training progress update failed", message: "The academy progress update could not be completed. Please try again." };
  return null;
}

export default async function CustomerUniversityPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const notice = getNotice(resolvedSearchParams);
  const [profile, universityData] = await Promise.all([getProfile(user.id), getPetParentUniversityData(user.id)]);
  const email = asString(user.email);
  const displayName = getDisplayName(profile, email);
  const firstName = displayName.split(" ")[0] || "Pet Parent";
  const totalSteps = universityData.steps.length || 9;
  const completedSteps = universityData.completedSteps;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const academyCompleted = totalSteps > 0 && completedSteps >= totalSteps;

  return (
    <main className="min-h-screen bg-[#f7fbf7] px-4 py-5 text-[#062f2b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="overflow-hidden rounded-[34px] border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-6 py-8 md:px-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div>
              <Link href={customerRoutes.dashboard} className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-white">
                <ArrowLeft size={16} /> Back to Dashboard
              </Link>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-900/80">SitGuru University</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] text-slate-950 md:text-6xl">Pet Parent Academy</h1>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-slate-900/75 md:text-lg">
                Welcome, {firstName}. Complete your Pet Parent Academy training materials, acknowledge each required material honestly, and prepare to earn your Certified Pet Parent badge.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <TrustBadge icon={<PawPrint size={15} />} label="Pet Parent" />
                <TrustBadge icon={<GraduationCap size={15} />} label={`${completedSteps} of ${totalSteps} steps complete`} />
                <TrustBadge icon={<Star size={15} />} label={`${progressPercent}% complete`} />
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-full border-[8px] border-white bg-white/80 text-5xl font-black text-emerald-800 shadow-2xl md:h-52 md:w-52">{getInitials(displayName)}</div>
              <h2 className="mt-5 text-3xl font-black text-slate-950">{displayName}</h2>
              <p className="mt-1 text-sm font-black text-slate-700">{academyCompleted ? "Certified Pet Parent: Completed" : "Certified Pet Parent: In progress"}</p>
            </div>
          </div>
          <div className="grid gap-4 bg-white px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardStatCard label="Progress" value={`${completedSteps} of ${totalSteps}`} detail="Academy steps" icon={<BookOpenCheck size={20} />} />
            <DashboardStatCard label="Materials" value={`${number(universityData.acknowledgedMaterials)} of ${number(universityData.totalMaterials)}`} detail="Acknowledged" icon={<FileText size={20} />} />
            <DashboardStatCard label="Required" value={number(universityData.requiredMaterials)} detail="Required materials" icon={<ShieldCheck size={20} />} />
            <DashboardStatCard label="Badge" value={academyCompleted ? "Unlocked" : "Locked"} detail={academyCompleted ? "Academy complete" : "Complete all steps"} icon={academyCompleted ? <BadgeCheck size={20} /> : <LockKeyhole size={20} />} />
          </div>
        </section>

        {notice ? <section className={`rounded-[24px] border p-4 text-sm font-bold leading-6 ${notice.tone === "success" ? "border-green-100 bg-green-50 text-green-900" : "border-red-100 bg-red-50 text-red-800"}`}><p className="font-black">{notice.title}</p><p className="mt-1">{notice.message}</p></section> : null}

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Academy Lessons</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Complete each step in order</h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">Open each material, review it fully, then check the acknowledgment box. A step can only be completed after every required material inside that step is acknowledged.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900">{number(universityData.totalMaterials)} materials loaded</div>
          </div>
          <div className="mt-6 grid gap-5">
            {universityData.steps.length ? universityData.steps.map((step) => <AcademyStepCard key={step.id} step={step} />) : <div className="rounded-[26px] border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-center"><BookOpenCheck className="mx-auto mb-3 text-emerald-700" size={38} /><h3 className="text-xl font-black text-emerald-950">Pet Parent Academy is being prepared</h3><p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-emerald-900/75">Training steps have not been published yet. Please check back soon or contact SitGuru support.</p></div>}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <InfoCard icon={<ShieldCheck size={21} />} title="Honest acknowledgments" description="Each required material asks the Pet Parent to confirm they reviewed and understand that specific training portion." />
          <InfoCard icon={<PawPrint size={21} />} title="Step completion control" description="A step cannot be marked complete until all required materials inside that step are acknowledged." />
          <InfoCard icon={<BadgeCheck size={21} />} title="Certified Pet Parent path" description="After all nine steps are complete, the badge and certificate workflow can be unlocked next." />
        </section>
      </div>
    </main>
  );
}

function AcademyStepCard({ step }: { step: StepWithMaterials }) {
  const requiredMaterials = getStepRequiredMaterials(step);
  const acknowledgedRequiredMaterials = requiredMaterials.filter((material) => material.isAcknowledged);
  const readyToComplete = canCompleteStep(step);
  return (
    <article id={`step-${step.id}`} className={`rounded-[28px] border p-5 shadow-sm ${step.isCompleted ? "border-emerald-300 bg-emerald-50/70 ring-4 ring-emerald-50" : "border-emerald-100 bg-[#fbfffb]"}`}>
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-black text-white">Step {step.step_number}</span>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900">{step.is_required !== false ? "Required" : "Optional"}</span>
            {step.requires_acknowledgment !== false ? <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">Acknowledgment</span> : null}
            {step.isCompleted ? <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black text-emerald-900">Completed</span> : null}
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{step.title}</h3>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">{step.description || "Review the materials for this academy step."}</p>
        </div>
        <div className="grid min-w-[260px] gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <MiniBox label="Materials" value={number(step.materials.length)} detail={`${number(acknowledgedRequiredMaterials.length)} of ${number(requiredMaterials.length)} required acknowledged`} />
          <MiniBox label="Estimated" value={`${getStepEstimatedMinutes(step)} min`} detail="Approx. time" />
        </div>
      </div>
      <div className="mt-5 rounded-[24px] border border-emerald-100 bg-white p-4">
        <h4 className="text-lg font-black text-slate-950">Training materials</h4>
        {step.materials.length ? <div className="mt-4 grid gap-3">{step.materials.map((material) => <MaterialCard key={material.id} material={material} step={step} />)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500">No materials have been added to this step yet.</div>}
      </div>
      <div className="mt-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">{step.isCompleted ? `Step ${step.step_number} complete` : readyToComplete ? `Ready to complete Step ${step.step_number}` : "Required acknowledgments needed"}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{step.isCompleted ? `Completed on ${formatDateTime(step.completedAt)}.` : readyToComplete ? "All required materials are acknowledged. You can now complete this step." : "Acknowledge every required material above before completing this step."}</p>
          </div>
          {step.isCompleted ? <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-5 py-3 text-sm font-black text-emerald-900"><CheckCircle2 size={17} />Completed</span> : <form action={completeStep}><input type="hidden" name="training_step_id" value={step.id} /><button type="submit" disabled={!readyToComplete} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${readyToComplete ? "bg-emerald-800 text-white shadow-sm hover:bg-emerald-900" : "bg-slate-200 text-slate-500"}`}><CheckCircle2 size={17} />Complete Step {step.step_number}</button></form>}
        </div>
      </div>
    </article>
  );
}

function MaterialCard({ material, step }: { material: MaterialWithUrl; step: StepWithMaterials }) {
  const typeLabel = getContentTypeLabel(material.content_type);
  const hasUrl = Boolean(material.openUrl);
  return (
    <div className={`rounded-[22px] border p-4 ${material.isAcknowledged ? "border-emerald-200 bg-emerald-50/70" : "border-slate-100 bg-slate-50"}`}>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-black text-emerald-900">{getMaterialIcon(material.content_type)}{typeLabel}</span>
            {material.is_required !== false ? <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">Required</span> : <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">Optional</span>}
            {material.isAcknowledged ? <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black text-emerald-900">Acknowledged</span> : null}
          </div>
          <h5 className="text-lg font-black text-slate-950">{material.title}</h5>
          <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-600">{material.description || "Open this material to continue the lesson."}</p>
          <p className="mt-2 break-all text-xs font-bold text-slate-400">{asString(material.storage_path) || asString(material.external_url) || asString(material.video_url)}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {hasUrl ? <><a href={material.openUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"><ExternalLink size={16} />Open Material</a><a href={material.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"><Download size={16} />Download / View</a></> : <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm font-black text-amber-900">Material link unavailable</div>}
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
        {material.isAcknowledged ? <div className="flex items-start gap-3 text-sm font-bold leading-6 text-emerald-900"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-black">Acknowledgment saved</p><p className="text-emerald-800">You acknowledged this material on {formatDateTime(material.acknowledgedAt)}.</p></div></div> : <form action={acknowledgeMaterial} className="grid gap-3"><input type="hidden" name="material_id" value={material.id} /><input type="hidden" name="training_step_id" value={step.id} /><label className="flex cursor-pointer items-start gap-3 text-sm font-bold leading-6 text-slate-700"><input name="acknowledgment" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-emerald-700" /><span>I acknowledge that I have honestly and accurately reviewed this training material, understand the information provided, and completed this portion of the SitGuru University training.</span></label><button type="submit" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900 sm:w-auto"><CheckCircle2 size={17} />Save Acknowledgment</button></form>}
      </div>
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-slate-800 shadow-sm ring-1 ring-white/70">{icon}{label}</span>;
}

function DashboardStatCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p><p className="mt-2 text-sm font-bold text-emerald-700">{detail}</p></div><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">{icon}</div></div></div>;
}

function MiniBox({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-emerald-100 bg-white p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-500">{detail}</p></div>;
}

function InfoCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">{icon}</div><h3 className="text-lg font-black text-slate-950">{title}</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{description}</p></div>;
}
