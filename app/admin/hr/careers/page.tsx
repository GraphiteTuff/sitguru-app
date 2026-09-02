import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, GraduationCap } from "lucide-react";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  TRACK_LABELS,
  countCareerJobs,
  listCareerJobs,
} from "@/lib/careers/jobs";
import { CareerJobForm } from "./CareerJobForm";

export const dynamic = "force-dynamic";

function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

export default async function AdminCareerJobsPage({
  searchParams,
}: {
  searchParams?: Promise<{ ok?: string; error?: string }>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10">
        <h1 className="text-3xl font-black text-slate-950">Admin access required.</h1>
      </div>
    );
  }

  const query = (await searchParams) || {};
  const [jobs, counts] = await Promise.all([listCareerJobs(), countCareerJobs()]);

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px] space-y-5">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
          <Link
            href="/admin/hr"
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800"
          >
            <ArrowLeft size={16} />
            Back to HR
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Careers & internships
            </h1>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              Feeds sitguru.com/careers
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Add company careers and SitGuru Internship Program roles. Published
            posts appear on the public Careers page with search. Prefer paid
            internships plus college credit — do not advertise unpaid “free
            labor for credit.”
          </p>
          {query.ok ? (
            <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              {query.ok}
            </p>
          ) : null}
          {query.error ? (
            <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
              {query.error}
            </p>
          ) : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Published" value={String(counts.published)} helper="Live on /careers" />
          <Metric label="Careers" value={String(counts.careers)} helper="Company roles" />
          <Metric
            label="Internships"
            value={String(counts.internships)}
            helper="Internship Program"
          />
          <Metric label="Drafts" value={String(counts.drafts)} helper="Not public yet" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]">
                <BriefcaseBusiness size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  Live board
                </p>
                <h2 className="text-xl font-black">Posted roles</h2>
              </div>
            </div>
            <div className="space-y-3">
              {jobs.length ? (
                jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/admin/hr/careers/${job.id}`}
                    className="block rounded-2xl border border-emerald-100 bg-[#f7fbf8] p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-black text-slate-950">{job.title}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          job.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : job.status === "closed"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {STATUS_LABELS[job.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-emerald-800">
                      {CATEGORY_LABELS[job.category]} · {TRACK_LABELS[job.track]} ·{" "}
                      {job.location}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {job.summary}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm font-semibold text-slate-500">
                  No roles yet. Add the first career or internship on the right.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]">
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  Add a role
                </p>
                <h2 className="text-xl font-black">New career or internship</h2>
              </div>
            </div>
            <CareerJobForm />
          </div>
        </section>
      </div>
    </main>
  );
}
