import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { getPublishedCareerJobBySlug } from "@/lib/careers/jobs";
import {
  CATEGORY_LABELS,
  TRACK_LABELS,
  jobMetaChips,
} from "@/lib/careers/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getPublishedCareerJobBySlug(slug);
  if (!job) {
    return { title: "Role not found | SitGuru Careers" };
  }
  return {
    title: `${job.title} | SitGuru Careers`,
    description: job.summary,
  };
}

export default async function CareerJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getPublishedCareerJobBySlug(slug);
  if (!job) notFound();

  const applyHref = job.applyUrl || `mailto:${job.applyEmail}?subject=${encodeURIComponent(`SitGuru application: ${job.title}`)}`;
  const paragraphs = job.description.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

  return (
    <main className="min-h-screen bg-[#f9faf5] pb-16 text-slate-950">
      <section className="public-dark-section bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4 py-10 text-white sm:px-6 lg:px-8" data-brand-green>
        <div className="mx-auto max-w-[900px]">
          <Link
            href="/careers#open-roles"
            className="inline-flex items-center gap-2 text-sm font-black !text-white/85 hover:!text-white"
          >
            <ArrowLeft size={16} />
            Back to Careers
          </Link>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] !text-emerald-100">
            {CATEGORY_LABELS[job.category]} · {TRACK_LABELS[job.track]}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight !text-white sm:text-5xl">
            {job.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 !text-white/90">
            {job.summary}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {jobMetaChips(job).map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-white px-3 py-1 text-xs font-black text-green-950"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[900px] space-y-5 px-4 py-8 sm:px-6">
        <article className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm sm:p-8">
          <div className="space-y-4 text-sm font-semibold leading-7 text-slate-600 sm:text-base">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>

          {job.highlights.length ? (
            <div className="mt-6 space-y-2">
              {job.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-600"
                >
                  <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={15} />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          ) : null}

          {job.collegePartner ? (
            <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
              College partnership: {job.collegePartner}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={applyHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-green-800 px-6 text-sm font-black text-white transition hover:bg-green-900"
            >
              {job.applyUrl ? "Apply now" : `Email ${job.applyEmail}`}
              {job.applyUrl ? <ArrowRight size={16} /> : <Mail size={16} />}
            </a>
            <Link
              href="/careers#open-roles"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-green-200 bg-white px-6 text-sm font-black text-green-900 transition hover:bg-green-50"
            >
              See all openings
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
