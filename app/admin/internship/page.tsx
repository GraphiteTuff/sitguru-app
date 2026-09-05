import Link from "next/link";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  ClipboardCheck,
  Landmark,
  Sparkles,
} from "lucide-react";
import { getAdminIdentity } from "@/lib/admin/access";
import { INTERNSHIP_PROGRAM_NAME } from "@/lib/internship/constants";
import {
  formatCohortHeadline,
  formatInstitutionLine,
  formatProgramStatLine,
  institutionRelationshipLabel,
  internStatusLabel,
} from "@/lib/internship/labels";
import { getActiveCohort, getCohortDashboard, listCohortMilestones } from "@/lib/internship/queries";
import InternshipTimelineBoard from "@/components/internship/InternshipTimelineBoard";

export const dynamic = "force-dynamic";

export default async function InternshipProgramDashboardPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");

  const cohort = await getActiveCohort();
  const dashboard = cohort
    ? await getCohortDashboard(cohort.id)
    : {
        stats: { universities: 0, interns: 0, requiredHours: 0, projects: 0 },
        universities: [],
        interns: [],
        projects: [],
        cohortUniversities: [],
        programAnalytics: {
          universitiesRepresented: 0,
          universityPartners: 0,
          creditBearing: 0,
          nonCredit: 0,
          totalCredits: 0,
          fundingAwards: 0,
        },
      };
  const milestones = cohort ? await listCohortMilestones(cohort.id) : [];

  const universityById = new Map(
    dashboard.universities.map((row) => [row.id, row]),
  );

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 pb-8 sm:px-6">
      <section
        className="public-dark-section overflow-hidden rounded-[1.75rem] border border-emerald-100 p-5 shadow-sm sm:p-7"
        data-brand-green
        style={{ background: "#0D5C3A" }}
      >
        <p className="text-xs font-black uppercase tracking-[0.24em] !text-white">
          Internship Program
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight !text-white sm:text-4xl">
          {INTERNSHIP_PROGRAM_NAME}
        </h1>
        <p className="mt-3 text-lg font-black !text-white">
          {formatCohortHeadline(cohort || { name: "No active cohort" })}
        </p>
        <p className="mt-2 text-sm font-semibold !text-white/90">
          {formatProgramStatLine(dashboard.stats)}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/admin/internship/interns"
            className="inline-flex min-h-11 items-center rounded-2xl bg-white px-4 text-sm font-black text-green-950"
          >
            Review interns
          </Link>
          <Link
            href="/admin/internship/playbook"
            className="inline-flex min-h-11 items-center rounded-2xl border border-white/30 px-4 text-sm font-black !text-white"
          >
            Playbook
          </Link>
          <Link
            href="/admin/internship/timeline"
            className="inline-flex min-h-11 items-center rounded-2xl border border-white/30 px-4 text-sm font-black !text-white"
          >
            Timeline
          </Link>
          <Link
            href="/admin/internship/universities"
            className="inline-flex min-h-11 items-center rounded-2xl border border-white/30 px-4 text-sm font-black !text-white"
          >
            University directory
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Universities represented",
            value: dashboard.programAnalytics.universitiesRepresented,
            icon: GraduationCap,
          },
          {
            label: "University Partners",
            value: dashboard.programAnalytics.universityPartners,
            icon: Landmark,
          },
          {
            label: "Credit-bearing internships",
            value: dashboard.programAnalytics.creditBearing,
            icon: ClipboardCheck,
          },
          {
            label: "Active growth projects",
            value: dashboard.stats.projects,
            icon: Sparkles,
          },
        ].map((tile) => (
          <div
            key={tile.label}
            className="rounded-[1.25rem] border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <tile.icon className="text-emerald-800" size={18} />
            <p className="mt-3 text-2xl font-black text-slate-950">{tile.value}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              {tile.label}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm xl:col-span-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Universities</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Student institutions in the directory. Partner status is separate
                from where a student attends.
              </p>
            </div>
            <Link
              href="/admin/internship/universities"
              className="text-xs font-black text-emerald-800"
            >
              Open directory
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {dashboard.cohortUniversities.length ? (
              dashboard.cohortUniversities.map((row) => {
                const university = universityById.get(row.universityId);
                if (!university) return null;
                return (
                  <Link
                    key={row.universityId}
                    href={`/admin/internship/universities/${university.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3 hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <div>
                      <p className="font-black text-slate-950">
                        {formatInstitutionLine({
                          universityName: university.name,
                          displayName: university.displayName,
                        })}
                        {row.targetProgram ? ` — ${row.targetProgram}` : ""}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {institutionRelationshipLabel(university.isUniversityPartner)}
                        {" · "}
                        {university.city}
                        {university.state ? `, ${university.state}` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      {row.participationStatus}
                    </span>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm font-semibold text-slate-500">
                Add universities to the cohort from the directory. Do not mark a
                school as a University Partner just because a student attends there.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm xl:col-span-5">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Interns</h2>
            <Link
              href="/admin/internship/interns"
              className="text-xs font-black text-emerald-800"
            >
              Assign intern
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {dashboard.interns.length ? (
              dashboard.interns.map((intern) => {
                const university = universityById.get(intern.universityId);
                return (
                  <Link
                    key={intern.id}
                    href={`/admin/internship/interns/${intern.id}`}
                    className="block rounded-2xl border border-slate-100 px-4 py-3 hover:border-emerald-200"
                  >
                    <p className="font-black text-slate-950">{intern.fullName}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {university?.displayName || "Student institution"}
                      {intern.academicProgram ? ` — ${intern.academicProgram}` : ""}
                      {" · "}
                      {internStatusLabel(intern.status)}
                    </p>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm font-semibold text-slate-500">
                No interns assigned yet. Each student keeps their own university
                hours, credits, faculty supervisor, and packet.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">
          SitGuru Market Growth Projects
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Academic requirements vary by university. The business project standard
          does not.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard.projects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
            >
              <p className="font-black text-slate-950">{project.name}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Baseline · Target · Evidence · Verified results
              </p>
            </div>
          ))}
        </div>
      </section>

      {milestones.length ? (
        <InternshipTimelineBoard milestones={milestones.slice(0, 8)} compact />
      ) : null}
    </main>
  );
}
