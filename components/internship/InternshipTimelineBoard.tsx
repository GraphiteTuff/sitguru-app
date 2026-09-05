import { saveMilestoneStatus } from "@/lib/internship/actions";
import { milestoneStatus } from "@/lib/internship/timeline";
import type { InternshipMilestone } from "@/lib/internship/types";

function formatDue(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InternshipTimelineBoard({
  milestones,
  compact = false,
}: {
  milestones: InternshipMilestone[];
  compact?: boolean;
}) {
  const sitguru = milestones.filter((row) => row.owner !== "university");
  const university = milestones.filter((row) => row.owner === "university");

  return (
    <div className="space-y-4">
      <MilestoneGroup
        title="SitGuru execution"
        detail="Employer calendar for the cohort. Academic dates still follow each intern’s university."
        milestones={sitguru}
        compact={compact}
      />
      {university.length ? (
        <MilestoneGroup
          title="Student-institution dates"
          detail="These belong to one university’s published calendar. Do not apply them to another intern’s school."
          milestones={university}
          compact={compact}
        />
      ) : null}
    </div>
  );
}

function MilestoneGroup({
  title,
  detail,
  milestones,
  compact,
}: {
  title: string;
  detail: string;
  milestones: InternshipMilestone[];
  compact: boolean;
}) {
  return (
    <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <h3 className="font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-500">{detail}</p>
      <div className="mt-4 space-y-2">
        {milestones.map((row) => {
          const urgency = milestoneStatus(row.dueOn);
          return (
            <article
              key={row.id}
              className="rounded-2xl border border-slate-100 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
                    {row.phase} · {formatDue(row.dueOn)}
                    {row.universityName ? ` · ${row.universityName}` : ""}
                  </p>
                  <p className="mt-1 font-black text-slate-950">{row.title}</p>
                  {compact ? null : (
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {row.action}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                    urgency === "due_or_past"
                      ? "bg-rose-50 text-rose-800"
                      : urgency === "upcoming"
                        ? "bg-amber-50 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {row.status.replaceAll("_", " ")}
                </span>
              </div>
              {compact ? null : (
                <form action={saveMilestoneStatus} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={row.id} />
                  <select
                    name="status"
                    defaultValue={row.status}
                    className="min-h-10 rounded-xl border border-emerald-100 px-3 text-xs font-black"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  <button className="min-h-10 rounded-xl bg-[#0D5C3A] px-3 text-xs font-black !text-white">
                    Update
                  </button>
                </form>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
