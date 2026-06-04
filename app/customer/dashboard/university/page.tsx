import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
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
  updated_at?: string | null;
};

type MaterialWithUrl = TrainingMaterial & {
  openUrl: string;
  downloadUrl: string;
};

type StepWithMaterials = TrainingStep & {
  materials: MaterialWithUrl[];
};

const customerRoutes = {
  dashboard: "/customer/dashboard",
  profile: "/customer/profile",
  pets: "/customer/pets",
  bookings: "/customer/bookings",
  messages: "/customer/messages",
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

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
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

async function getPetParentUniversityData() {
  const [{ data: stepsData, error: stepsError }, { data: materialsData, error: materialsError }] =
    await Promise.all([
      supabaseAdmin
        .from("ambassador_training_steps")
        .select("*")
        .eq("academy_type", "pet_parent")
        .eq("is_active", true)
        .order("step_number", { ascending: true }),
      supabaseAdmin
        .from("academy_step_materials")
        .select("*")
        .eq("academy_type", "pet_parent")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

  if (stepsError) {
    console.warn("Unable to load Pet Parent Academy steps:", stepsError);
  }

  if (materialsError) {
    console.warn("Unable to load Pet Parent Academy materials:", materialsError);
  }

  const steps = ((stepsData || []) as TrainingStep[]).sort(
    (a, b) => asNumber(a.step_number) - asNumber(b.step_number),
  );

  const materials = ((materialsData || []) as TrainingMaterial[]).sort(
    sortMaterials,
  );

  const materialsByStep = new Map<string, MaterialWithUrl[]>();

  for (const material of materials) {
    const stepId = asString(material.training_step_id);
    if (!stepId) continue;

    const signedUrls = await getSignedMaterialUrls(material);

    const materialWithUrl: MaterialWithUrl = {
      ...material,
      ...signedUrls,
    };

    const existing = materialsByStep.get(stepId) || [];
    existing.push(materialWithUrl);
    materialsByStep.set(stepId, existing.sort(sortMaterials));
  }

  const stepsWithMaterials: StepWithMaterials[] = steps.map((step) => ({
    ...step,
    materials: materialsByStep.get(step.id) || [],
  }));

  const totalMaterials = stepsWithMaterials.reduce(
    (sum, step) => sum + step.materials.length,
    0,
  );

  const requiredMaterials = stepsWithMaterials.reduce(
    (sum, step) =>
      sum + step.materials.filter((material) => material.is_required !== false).length,
    0,
  );

  return {
    steps: stepsWithMaterials,
    totalMaterials,
    requiredMaterials,
  };
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

export default async function CustomerUniversityPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const [profile, universityData] = await Promise.all([
    getProfile(user.id),
    getPetParentUniversityData(),
  ]);

  const email = asString(user.email);
  const displayName = getDisplayName(profile, email);
  const firstName = displayName.split(" ")[0] || "Pet Parent";

  const totalSteps = universityData.steps.length || 9;
  const completedSteps = 0;
  const progressPercent =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#f7fbf7] px-4 py-5 text-[#062f2b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="overflow-hidden rounded-[34px] border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.95),transparent_18%),linear-gradient(120deg,#00d69f_0%,#66e3c7_48%,#b8e5ff_100%)] px-6 py-8 md:px-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div>
              <Link
                href={customerRoutes.dashboard}
                className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-white"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>

              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-900/80">
                SitGuru University
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] text-slate-950 md:text-6xl">
                Pet Parent Academy
              </h1>

              <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-slate-900/75 md:text-lg">
                Welcome, {firstName}. Complete your Pet Parent Academy training
                materials, learn how to use SitGuru safely, and prepare to earn
                your Certified Pet Parent badge.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <TrustBadge icon={<PawPrint size={15} />} label="Pet Parent" />
                <TrustBadge
                  icon={<GraduationCap size={15} />}
                  label={`${completedSteps} of ${totalSteps} steps complete`}
                />
                <TrustBadge
                  icon={<Star size={15} />}
                  label={`${progressPercent}% complete`}
                />
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-full border-[8px] border-white bg-white/80 text-5xl font-black text-emerald-800 shadow-2xl md:h-52 md:w-52">
                {getInitials(displayName)}
              </div>

              <h2 className="mt-5 text-3xl font-black text-slate-950">
                {displayName}
              </h2>
              <p className="mt-1 text-sm font-black text-slate-700">
                Certified Pet Parent: Not started
              </p>
            </div>
          </div>

          <div className="grid gap-4 bg-white px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardStatCard
              label="Progress"
              value={`${completedSteps} of ${totalSteps}`}
              detail="Academy steps"
              icon={<BookOpenCheck size={20} />}
            />
            <DashboardStatCard
              label="Materials"
              value={number(universityData.totalMaterials)}
              detail="Training resources"
              icon={<FileText size={20} />}
            />
            <DashboardStatCard
              label="Required"
              value={number(universityData.requiredMaterials)}
              detail="Required materials"
              icon={<ShieldCheck size={20} />}
            />
            <DashboardStatCard
              label="Badge"
              value="Locked"
              detail="Complete all steps"
              icon={<LockKeyhole size={20} />}
            />
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Academy Lessons
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Start with Step 1
              </h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                Review each material in order. Videos, slides, PDFs, images, and
                links uploaded by SitGuru admins appear under the matching step.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900">
              {number(universityData.totalMaterials)} materials loaded
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            {universityData.steps.length ? (
              universityData.steps.map((step) => (
                <AcademyStepCard key={step.id} step={step} />
              ))
            ) : (
              <div className="rounded-[26px] border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-center">
                <BookOpenCheck
                  className="mx-auto mb-3 text-emerald-700"
                  size={38}
                />
                <h3 className="text-xl font-black text-emerald-950">
                  Pet Parent Academy is being prepared
                </h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-emerald-900/75">
                  Training steps have not been published yet. Please check back
                  soon or contact SitGuru support.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <InfoCard
            icon={<ShieldCheck size={21} />}
            title="Safety-first learning"
            description="Learn how to review Guru profiles, use platform messaging, and keep payments and booking activity inside SitGuru."
          />
          <InfoCard
            icon={<PawPrint size={21} />}
            title="Better pet care details"
            description="Build stronger pet profiles with routines, medical notes, behavioral information, and household care preferences."
          />
          <InfoCard
            icon={<BadgeCheck size={21} />}
            title="Certified Pet Parent badge"
            description="After academy completion is fully wired, your Certified Pet Parent badge will appear on your profile."
          />
        </section>
      </div>
    </main>
  );
}

function AcademyStepCard({ step }: { step: StepWithMaterials }) {
  const requiredMaterials = step.materials.filter(
    (material) => material.is_required !== false,
  );

  return (
    <article className="rounded-[28px] border border-emerald-100 bg-[#fbfffb] p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-black text-white">
              Step {step.step_number}
            </span>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900">
              {step.is_required !== false ? "Required" : "Optional"}
            </span>
            {step.requires_acknowledgment !== false ? (
              <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">
                Acknowledgment
              </span>
            ) : null}
          </div>

          <h3 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            {step.title}
          </h3>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
            {step.description || "Review the materials for this academy step."}
          </p>
        </div>

        <div className="grid min-w-[260px] gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <MiniBox
            label="Materials"
            value={number(step.materials.length)}
            detail={`${number(requiredMaterials.length)} required`}
          />
          <MiniBox
            label="Estimated"
            value={`${step.estimated_minutes || 5} min`}
            detail="Approx. time"
          />
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-emerald-100 bg-white p-4">
        <h4 className="text-lg font-black text-slate-950">
          Training materials
        </h4>

        {step.materials.length ? (
          <div className="mt-4 grid gap-3">
            {step.materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500">
            No materials have been added to this step yet.
          </div>
        )}
      </div>

      <div className="mt-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">
              Completion tracking coming next
            </p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              This view now displays the uploaded materials. The next update can
              wire acknowledgments, step completion, and badge unlocking.
            </p>
          </div>

          <button
            type="button"
            disabled
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-200 px-5 py-3 text-sm font-black text-slate-500"
          >
            <CheckCircle2 size={17} />
            Mark Complete Soon
          </button>
        </div>
      </div>
    </article>
  );
}

function MaterialCard({ material }: { material: MaterialWithUrl }) {
  const typeLabel = getContentTypeLabel(material.content_type);
  const hasUrl = Boolean(material.openUrl);

  return (
    <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
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
          </div>

          <h5 className="text-lg font-black text-slate-950">
            {material.title}
          </h5>
          <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
            {material.description || "Open this material to continue the lesson."}
          </p>

          <p className="mt-2 break-all text-xs font-bold text-slate-400">
            {asString(material.storage_path) || asString(material.external_url) || asString(material.video_url)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {hasUrl ? (
            <>
              <a
                href={material.openUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
              >
                <ExternalLink size={16} />
                Open Material
              </a>

              <a
                href={material.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                <Download size={16} />
                Download / View
              </a>
            </>
          ) : (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm font-black text-amber-900">
              Material link unavailable
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrustBadge({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
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
    <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
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
    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
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
    <div className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm">
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