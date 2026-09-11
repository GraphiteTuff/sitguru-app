import { ArrowRight, Mail } from "lucide-react";
import {
  getCareerApplyHref,
  getCareerApplyLabel,
  getCareerMailtoHref,
} from "@/lib/careers/presentation";
import type { CareerJob } from "@/lib/careers/types";

const primaryClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 text-sm font-extrabold text-white transition hover:bg-[#09462c] sm:min-h-14";
const secondaryClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-extrabold text-emerald-950 transition hover:bg-emerald-50 sm:min-h-14";

export function CareerApplyActions({
  job,
  compact = false,
}: {
  job: CareerJob;
  compact?: boolean;
}) {
  const applyHref = getCareerApplyHref(job);
  const applyLabel = getCareerApplyLabel(job);
  const showEmail = Boolean(job.applyUrl && job.applyEmail);

  return (
    <div className={compact ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
      <a
        href={applyHref}
        className={primaryClass}
        {...(job.applyUrl
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {applyLabel}
        {job.applyUrl ? <ArrowRight size={16} /> : <Mail size={16} />}
      </a>
      {showEmail ? (
        <a href={getCareerMailtoHref(job)} className={secondaryClass}>
          Email {job.applyEmail}
          <Mail size={16} />
        </a>
      ) : null}
    </div>
  );
}
