import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { CareerApplyActions } from "@/components/careers/CareerApplyActions";
import {
  careerJobFacts,
  parseCareerDescription,
} from "@/lib/careers/presentation";
import { CATEGORY_LABELS, TRACK_LABELS, type CareerJob } from "@/lib/careers/types";

export function CareerJobDetail({ job }: { job: CareerJob }) {
  const blocks = parseCareerDescription(job.description);
  const facts = careerJobFacts(job);
  const isInternship = job.category === "internship";

  return (
    <main className="min-h-screen bg-[#f6faf7] pb-[calc(7.25rem+env(safe-area-inset-bottom))] text-slate-950 lg:pb-16">
      <section
        className="public-dark-section bg-[#0D5C3A] px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8"
        data-brand-green
      >
        <div className="mx-auto max-w-6xl">
          <Link
            href="/careers#open-roles"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold !text-white/85 hover:!text-white"
          >
            <ArrowLeft size={16} />
            Back to careers
          </Link>

          <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.16em] !text-emerald-100">
            {CATEGORY_LABELS[job.category]} · {TRACK_LABELS[job.track]}
          </p>
          <h1 className="mt-2 max-w-4xl text-[1.75rem] font-extrabold leading-tight tracking-normal !text-white sm:text-4xl lg:text-5xl">
            {job.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base font-medium leading-7 tracking-normal !text-white/90 sm:text-lg sm:leading-8">
            {job.summary}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {facts.slice(0, 5).map((fact) => (
              <span
                key={fact.label}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-bold tracking-normal text-emerald-950"
              >
                {fact.value}
              </span>
            ))}
          </div>

          <div className="mt-6 hidden max-w-md lg:block">
            <CareerApplyActions job={job} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-8 lg:py-10">
        <article className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-8">
          <div className="space-y-4">
            {blocks.map((block) =>
              block.type === "heading" ? (
                <h2
                  key={block.text}
                  className="pt-2 text-xl font-extrabold tracking-normal text-slate-950"
                >
                  {block.text}
                </h2>
              ) : (
                <p
                  key={block.text.slice(0, 72)}
                  className="text-base font-medium leading-7 tracking-normal text-slate-600 sm:leading-8"
                >
                  {block.text}
                </p>
              ),
            )}
          </div>

          {job.highlights.length ? (
            <div className="mt-8">
              <h2 className="text-xl font-extrabold tracking-normal text-slate-950">
                {isInternship ? "What you will do" : "What this role owns"}
              </h2>
              <div className="mt-4 space-y-3">
                {job.highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-start gap-3 rounded-2xl border border-emerald-50 bg-[#f7fbf8] px-4 py-3"
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-[#0D5C3A]"
                      size={18}
                    />
                    <span className="text-sm font-semibold leading-6 tracking-normal text-slate-700 sm:text-base">
                      {highlight}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {isInternship ? (
            <p className="mt-8 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 tracking-normal text-emerald-950">
              Open to students at any college or university whose academic
              program approves the experience.
            </p>
          ) : null}
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4 rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-800">
              {isInternship ? "Apply for this internship" : "Apply for this role"}
            </p>
            <h2 className="text-2xl font-extrabold tracking-normal text-slate-950">
              Ready to join SitGuru?
            </h2>
            <p className="text-sm font-medium leading-6 tracking-normal text-slate-600">
              {isInternship
                ? "Send a short note and any relevant work samples. Selected candidates are contacted for an interview."
                : "Apply online or email SitGuru careers. We review complete applications first."}
            </p>
            <CareerApplyActions job={job} />
            <dl className="space-y-3 border-t border-emerald-50 pt-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-800">
                    {fact.label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold leading-6 tracking-normal text-slate-700">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href="/careers#open-roles"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-emerald-200 px-5 text-sm font-extrabold text-emerald-950 hover:bg-emerald-50"
            >
              See all openings
            </Link>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 px-4 pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <CareerApplyActions job={job} compact={!job.applyUrl} />
      </div>
    </main>
  );
}
