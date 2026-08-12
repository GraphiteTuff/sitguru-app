import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAdminIdentity } from "@/lib/admin/access";
import { getAdminPeopleDirectory } from "@/lib/admin/peopleResolver";
import AssignmentWorkbench, {
  type WorkbenchAssignment,
  type WorkbenchPerson,
} from "@/app/admin/university-assignments/AssignmentWorkbench";
import {
  normalizeAcademyType,
  type AcademyType,
} from "@/app/admin/university-assignments/types";

export const dynamic = "force-dynamic";

const adminRoutes = {
  dashboard: "/admin",
  universityHub: "/admin/ambassador-training",
  universityAssignments: "/admin/university-assignments",
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNotice(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const updated = asString(searchParams?.updated);
  const error = asString(searchParams?.error);

  if (updated === "success") {
    return {
      tone: "success" as const,
      title: "Academy assignments updated",
      message: "Assignments were saved successfully.",
    };
  }

  if (error) {
    return {
      tone: "error" as const,
      title: "Assignment update failed",
      message:
        "The academy assignment could not be saved. Confirm the academy_assignments table exists in Supabase.",
    };
  }

  return null;
}

async function requireUniversityAdmin() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    redirect("/admin/login");
  }

  return actor;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UniversityAssignmentsPage({
  searchParams,
}: PageProps) {
  await requireUniversityAdmin();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const notice = getNotice(resolvedSearchParams);

  const [{ data: assignmentsResult }, { data: stepsResult }] = await Promise.all([
    supabaseAdmin
      .from("academy_assignments")
      .select("id,user_id,academy_type,is_active,certificate_issued")
      .order("assigned_at", { ascending: false }),
    supabaseAdmin
      .from("ambassador_training_steps")
      .select("id,academy_type,is_active,is_required"),
  ]);

  const peopleDirectory = await getAdminPeopleDirectory({
    limit: 5000,
  });

  const people: WorkbenchPerson[] = peopleDirectory
    .filter((person) => Boolean(asString(person.userId)))
    .map((person) => ({
      userId: person.userId,
      displayName: person.displayName || person.email || "Unnamed user",
      email: person.email || "",
      initials: person.initials || "SG",
      roleLabel: person.roleLabel || "Unknown",
      role: person.role,
      guruId: person.guruId || "",
      petParentId: person.petParentId || "",
      ambassadorId: person.ambassadorId || "",
    }));

  const assignments: WorkbenchAssignment[] = (
    (assignmentsResult || []) as Array<{
      id?: string;
      user_id?: string;
      academy_type?: string | null;
      is_active?: boolean | null;
      certificate_issued?: boolean | null;
    }>
  )
    .filter((row) => asString(row.user_id))
    .map((row) => ({
      id: asString(row.id) || `${row.user_id}-${row.academy_type}`,
      userId: asString(row.user_id),
      academyType: normalizeAcademyType(row.academy_type),
      isActive: row.is_active !== false,
      certificateIssued: Boolean(row.certificate_issued),
    }));

  const stepCounts = (
    (stepsResult || []) as Array<{
      academy_type?: string | null;
      is_active?: boolean | null;
      is_required?: boolean | null;
    }>
  ).reduce(
    (acc, step) => {
      if (step.is_active === false || step.is_required === false) return acc;
      const academy = normalizeAcademyType(step.academy_type);
      acc[academy] += 1;
      return acc;
    },
    { pet_parent: 0, guru: 0, ambassador: 0 } as Record<AcademyType, number>,
  );

  return (
    <main className="min-h-screen bg-[#f8fbf6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px] space-y-5">
        <section className="rounded-[30px] border border-green-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <Link
                href={adminRoutes.universityHub}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-2 text-xs font-black text-green-900 transition hover:bg-green-100 sm:text-sm"
              >
                <ArrowLeft size={16} />
                Back to University
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-green-800 text-white">
                  <GraduationCap size={28} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                    Admin / SitGuru University
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                    Academy Assignment Manager
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
                Pick a role tab, then one-click assign the matching academy — or
                multi-select and assign many at once. Dual-role people can still
                toggle extra academies from the chips on each row.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={adminRoutes.universityHub}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
              >
                <BookOpenCheck size={17} />
                Training Manager
              </Link>

              <Link
                href={adminRoutes.dashboard}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                <ShieldCheck size={17} />
                Admin Dashboard
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

        <AssignmentWorkbench
          people={people}
          assignments={assignments}
          stepCounts={stepCounts}
        />
      </div>
    </main>
  );
}
