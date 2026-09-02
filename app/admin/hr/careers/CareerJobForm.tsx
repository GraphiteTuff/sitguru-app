import {
  CAREER_CATEGORIES,
  CAREER_STATUSES,
  CAREER_TRACKS,
  CATEGORY_LABELS,
  COMPENSATION_LABELS,
  COMPENSATION_TYPES,
  EMPLOYMENT_LABELS,
  EMPLOYMENT_TYPES,
  STATUS_LABELS,
  TRACK_LABELS,
  type CareerJob,
} from "@/lib/careers/types";
import { saveCareerJob } from "@/lib/admin/hr/career-job-actions";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm font-semibold text-slate-950";
const labelClass = "text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800";

export function CareerJobForm({
  job,
}: {
  job?: CareerJob | null;
}) {
  return (
    <form action={saveCareerJob} className="grid gap-3">
      {job?.id ? <input type="hidden" name="id" value={job.id} /> : null}

      <label className="block">
        <span className={labelClass}>Title</span>
        <input
          name="title"
          required
          defaultValue={job?.title || ""}
          placeholder="Social Media & Community Growth Intern"
          className={fieldClass}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Category</span>
          <select
            name="category"
            defaultValue={job?.category || "career"}
            className={fieldClass}
          >
            {CAREER_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Career track</span>
          <select
            name="track"
            defaultValue={job?.track || "social_media"}
            className={fieldClass}
          >
            {CAREER_TRACKS.map((value) => (
              <option key={value} value={value}>
                {TRACK_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Location</span>
          <input
            name="location"
            defaultValue={job?.location || "Remote"}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Employment type</span>
          <select
            name="employmentType"
            defaultValue={job?.employmentType || "full_time"}
            className={fieldClass}
          >
            {EMPLOYMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {EMPLOYMENT_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Pay / credit</span>
          <select
            name="compensationType"
            defaultValue={job?.compensationType || "paid_salary"}
            className={fieldClass}
          >
            {COMPENSATION_TYPES.map((value) => (
              <option key={value} value={value}>
                {COMPENSATION_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Pay note</span>
          <input
            name="compensationNote"
            defaultValue={job?.compensationNote || ""}
            placeholder="Paid hourly · Academic credit eligible"
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Hours / week</span>
          <input
            name="hoursPerWeek"
            defaultValue={job?.hoursPerWeek || ""}
            placeholder="8–12"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Status</span>
          <select
            name="status"
            defaultValue={job?.status || "draft"}
            className={fieldClass}
          >
            {CAREER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-950">
        <input
          type="checkbox"
          name="academicCreditEligible"
          defaultChecked={job?.academicCreditEligible}
          className="h-4 w-4 accent-emerald-800"
        />
        Academic credit eligible (college-coordinated)
      </label>

      <label className="block">
        <span className={labelClass}>College partner</span>
        <input
          name="collegePartner"
          defaultValue={job?.collegePartner || ""}
          placeholder="Bucks County Community College and partner colleges"
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Short summary</span>
        <textarea
          name="summary"
          required
          rows={3}
          defaultValue={job?.summary || ""}
          className={`${fieldClass} py-2`}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Full description</span>
        <textarea
          name="description"
          required
          rows={8}
          defaultValue={job?.description || ""}
          className={`${fieldClass} py-2`}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Highlights (one per line)</span>
        <textarea
          name="highlights"
          rows={6}
          defaultValue={(job?.highlights || []).join("\n")}
          className={`${fieldClass} py-2`}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Apply email</span>
          <input
            name="applyEmail"
            type="email"
            defaultValue={job?.applyEmail || "jason@sitguru.com"}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Apply URL (Handshake, form)</span>
          <input
            name="applyUrl"
            defaultValue={job?.applyUrl || ""}
            placeholder="https://"
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>URL slug (optional)</span>
          <input
            name="slug"
            defaultValue={job?.slug || ""}
            placeholder="auto-from-title"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Sort order</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={job?.sortOrder ?? 100}
            className={fieldClass}
          />
        </label>
      </div>

      <button
        type="submit"
        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white transition hover:bg-emerald-900"
      >
        {job?.id ? "Save and update Careers" : "Save role"}
      </button>
    </form>
  );
}
