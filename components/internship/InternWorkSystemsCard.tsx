import Link from "next/link";
import {
  INTERN_COLLABORATION_EXPECTATIONS,
  INTERN_MANAGER_SUPPORT,
  INTERN_WORK_SYSTEMS,
  INTERN_WORK_SYSTEMS_IMPORTANT,
  INTERN_WORKFLOW_STEPS,
} from "@/lib/internship/intern-work-systems";

/** Compact “where work happens” card for Marketing & Community Growth interns. */
export default function InternWorkSystemsCard({
  askAvaHref = "/intern?tab=home&focus=messages",
}: {
  askAvaHref?: string;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)] sm:p-5">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
          Marketing & Community Growth
        </p>
        <h2 className="mt-1 text-lg font-black text-[#0F2744]">
          Where work happens
        </h2>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
          Collaborate in a way that supports SitGuru business goals and your
          university learning requirements. Official internship records stay in
          the SitGuru Intern Portal.
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {INTERN_WORK_SYSTEMS.map((system) => (
          <li
            key={system.id}
            className="rounded-2xl border border-slate-100 bg-[#F8FAFC] px-3 py-3"
          >
            <p className="text-sm font-black text-[#0F2744]">{system.label}</p>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
              {system.role}
            </p>
            {system.href ? (
              <Link
                href={system.href}
                className="mt-2 inline-flex text-xs font-bold text-[#2563EB]"
              >
                Open →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl bg-[#F0FDFA] px-3 py-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0F766E]">
            Intern workflow
          </p>
          <ol className="mt-2 space-y-1.5 text-sm font-medium text-slate-700">
            {INTERN_WORKFLOW_STEPS.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="font-black text-[#0D5C3A]">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl bg-[#EFF6FF] px-3 py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1D4ED8]">
              Collaboration expectations
            </p>
            <ul className="mt-2 space-y-1.5 text-sm font-medium text-slate-700">
              {INTERN_COLLABORATION_EXPECTATIONS.slice(0, 5).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#F5F3FF] px-3 py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6D28D9]">
              Manager support
            </p>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {INTERN_MANAGER_SUPPORT.join(" · ")}
            </p>
            <Link
              href={askAvaHref}
              className="mt-2 inline-flex text-sm font-bold text-[#6D28D9]"
            >
              Ask Ava →
            </Link>
          </div>
        </div>
      </div>

      <p className="rounded-2xl border border-amber-100 bg-[#FFF7ED] px-3 py-3 text-sm font-semibold text-[#9A3412]">
        {INTERN_WORK_SYSTEMS_IMPORTANT}
      </p>
    </section>
  );
}
