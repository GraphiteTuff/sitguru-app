import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminIdentity } from "@/lib/admin/access";
import { getCareerJobById } from "@/lib/careers/jobs";
import { deleteCareerJob } from "@/lib/admin/hr/career-job-actions";
import { CareerJobForm } from "../CareerJobForm";

export const dynamic = "force-dynamic";

export default async function EditCareerJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
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

  const { id } = await params;
  const query = (await searchParams) || {};
  const job = await getCareerJobById(id);
  if (!job) notFound();

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[800px] space-y-5">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
          <Link
            href="/admin/hr/careers"
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800"
          >
            <ArrowLeft size={16} />
            All roles
          </Link>
          <h1 className="text-3xl font-black tracking-tight">{job.title}</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Edits sync to{" "}
            <Link href={`/careers/${job.slug}`} className="text-emerald-800 underline">
              /careers/{job.slug}
            </Link>{" "}
            when published.
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

        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <CareerJobForm job={job} />
          {actor.canManageUsers ? (
            <form action={deleteCareerJob} className="mt-4">
              <input type="hidden" name="id" value={job.id} />
              <button
                type="submit"
                className="text-sm font-black text-rose-700 underline-offset-2 hover:underline"
              >
                Remove this role
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  );
}
