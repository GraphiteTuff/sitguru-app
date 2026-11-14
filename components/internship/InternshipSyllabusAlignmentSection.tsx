import Link from "next/link";
import { ArrowRight, BookOpenCheck, ClipboardList, FileCheck2 } from "lucide-react";
import { FINAL_PROJECT_OUTPUTS, FINAL_WORKSPACE_CHAPTERS } from "@/lib/internship/final-project";
import type { InternshipProject } from "@/lib/internship/types";

export type SyllabusUnmappedAssignment = {
  id: string;
  title: string;
  internName: string;
};

export default function InternshipSyllabusAlignmentSection({
  projects,
  unmappedAssignments,
}: {
  projects: InternshipProject[];
  unmappedAssignments: SyllabusUnmappedAssignment[];
}) {
  return (
    <section id="program-final-project" className="scroll-mt-24 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-[#167251]">One continuous capstone</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
        Every approved assignment moves the final project forward
      </h2>
      <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
        The existing SitGuru Final Growth Project workspace is the source of truth.
        Ava chooses the project and the final-project chapter when creating an assignment.
        Students submit evidence once; approved work feeds the Growth Report, Playbook,
        and sanitized Portfolio without duplicate homework.
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {FINAL_PROJECT_OUTPUTS.map((output, index) => (
          <div key={output.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#0D5C3A]">
              {index === 0 ? "Primary deliverable" : "Supporting output"}
            </p>
            <h3 className="mt-1 text-lg font-black text-slate-950">{output.name}</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{output.purpose}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <BookOpenCheck size={19} className="text-[#0D5C3A]" aria-hidden="true"/>
            <h3 className="font-black text-slate-950">Actual SitGuru cohort projects</h3>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-600">
            Linked to existing project records—not separate syllabus assignments.
          </p>
          {projects.length ? (
            <ul className="mt-4 space-y-2">
              {projects.map((project) => (
                <li key={project.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">{project.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {project.status.replaceAll("_", " ")} · {project.projectKind.replaceAll("_", " ")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-600">
              No projects are configured for this cohort yet. Create projects and milestones before connecting assignments.
            </p>
          )}
          <Link href="/admin/internship/timeline" className="mt-4 inline-flex min-h-10 items-center gap-1 text-xs font-black text-blue-800 underline">
            Open Projects & Milestones <ArrowRight size={14} aria-hidden="true"/>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <FileCheck2 size={19} className="text-[#0D5C3A]" aria-hidden="true"/>
            <h3 className="font-black text-slate-950">Actual final-project chapters</h3>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-600">
            These same chapters are populated by approved assignments, weekly reports,
            campaigns, experiments, SMART goals, and verified KPIs.
          </p>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {FINAL_WORKSPACE_CHAPTERS.map((chapter) => (
              <li key={chapter.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs font-bold text-slate-950">{chapter.label}</p>
                <p className="text-[11px] text-slate-500">{chapter.output === "report" ? "Business Growth Report" : chapter.output === "playbook" ? "Market Growth Playbook" : "Portfolio Case Study"}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <ClipboardList size={19} className="text-blue-700" aria-hidden="true"/>
          <h3 className="font-black text-slate-950">Check existing assignment-to-final-project mapping</h3>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {unmappedAssignments.length === 0
            ? "All published assignments visible in this cohort have a mapped final-project chapter."
            : String(unmappedAssignments.length) + " existing published assignments need a final-project chapter. Ava can open each in Manager Assignments, select the correct chapter, and save. Existing submitted work is preserved."}
        </p>
        {unmappedAssignments.length ? (
          <ul className="mt-3 space-y-2">
            {unmappedAssignments.slice(0, 6).map((task) => (
              <li key={task.id} className="text-xs font-semibold text-slate-700">
                {task.internName} · <Link href={"/manager/assignments/" + task.id} className="text-blue-800 underline">{task.title}</Link>
              </li>
            ))}
          </ul>
        ) : null}
        {unmappedAssignments.length > 6 ? (
          <p className="mt-2 text-xs font-medium text-slate-500">Showing the first 6. Review the remaining tasks in Manager Assignments.</p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/manager/assignments" className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-xs font-black text-white">
          Open Manager Assignments
        </Link>
        <Link href="/intern/growth" className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-xs font-black text-blue-800">
          Open Intern Growth Report
        </Link>
      </div>
    </section>
  );
}
