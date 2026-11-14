import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import InternshipPlaybook from "@/components/internship/InternshipPlaybook";
import InternshipSyllabusEnhancements, {
  type SyllabusAcademicRow,
} from "@/components/internship/InternshipSyllabusEnhancements";
import { getActiveCohort, listInterns, listUniversities } from "@/lib/internship/queries";

export const dynamic = "force-dynamic";

/**
 * One employer-owned program standard; each intern's school-specific credit,
 * hours and evaluations remain in their private academic record.
 * Preserve the entire existing playbook below the enhanced syllabus.
 */
export default async function InternshipPlaybookPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");

  const cohort = await getActiveCohort();
  const [interns, universities] = await Promise.all([
    listInterns(cohort?.id || undefined),
    listUniversities(),
  ]);
  const universityNames = new Map(
    universities.map((school) => [school.id, school.displayName || school.name]),
  );
  const academicRows: SyllabusAcademicRow[] = interns
    .filter((intern) => !intern.isTest && intern.status !== "withdrawn")
    .map((intern) => ({
      id: intern.id,
      fullName: intern.fullName,
      universityName: universityNames.get(intern.universityId) || "School not recorded",
      courseCode: intern.courseCode || "",
      credits: intern.credits,
      requiredHours: intern.requiredHours,
      internshipWeeks: intern.internshipWeeks,
      universityVerificationStatus: intern.universityVerificationStatus,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 px-3 pb-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-500">
          Admin HQ / Internship Program / Program Syllabus
        </p>
        <Link href="/admin/internship" className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 hover:border-emerald-300">
          Back to Internship Program
        </Link>
      </div>

      <InternshipSyllabusEnhancements
        academicRows={academicRows}
        cohortName={cohort?.name || "Spring 2027"}
      />

      <section id="program-full" className="scroll-mt-24 space-y-4 border-t border-slate-200 pt-7">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
            Reference · Detailed program standards
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Existing Program Syllabus & Learning Playbook</h2>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
            All existing learning objectives, semester outcomes, the detailed week-by-week path,
            SMART goal guidelines, KPI definitions, supervision, compliance rules, and
            access safeguards are preserved below. The enhanced guide above makes these
            standards easier to apply to students from different universities.
          </p>
        </div>
        <InternshipPlaybook />
      </section>
    </main>
  );
}
