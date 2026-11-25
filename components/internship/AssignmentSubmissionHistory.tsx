import { isHttpUrl } from "@/lib/internship/manager-assignment";
import type { AssignmentSubmissionSnapshot } from "@/lib/internship/submission-history";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export default function AssignmentSubmissionHistory({ entries, unavailable }: {
  entries: AssignmentSubmissionSnapshot[];
  unavailable: boolean;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <h2 className="text-xl font-black text-slate-950">Submission history</h2>
      {unavailable ? <p role="alert" className="mt-2 text-sm text-slate-700">Submission history is temporarily unavailable.</p> :
        entries.length ? (
          <ul className="mt-3 space-y-2">
            {entries.map((entry, index) => {
              const work = entry.work_snapshot && typeof entry.work_snapshot === "object" ? entry.work_snapshot as Record<string, unknown> : {};
              const candidates = [entry.work_url, work.researchLink, work.attachmentUrl, ...(Array.isArray(work.supportingLinks) ? work.supportingLinks : [])];
              const links = [...new Set(candidates.filter((link): link is string => typeof link === "string" && isHttpUrl(link)))];
              return (
                <li key={entry.id}>
                  <details className="rounded-xl border border-slate-200 p-3" open={index === 0}>
                    <summary className="min-h-10 cursor-pointer text-sm font-bold text-emerald-950">
                      Submitted <time dateTime={entry.submitted_at}>{dateFormat.format(new Date(entry.submitted_at))} UTC</time>
                    </summary>
                    {entry.notes ? <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{entry.notes}</p> : null}
                    <ul className="space-y-1">
                      {links.map((link) => <li key={link}><a href={link} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center break-all text-sm font-bold text-emerald-900 underline">{link}</a></li>)}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        ) : <p className="mt-2 text-sm text-slate-700">No versioned submissions have been recorded for this assignment.</p>}
    </section>
  );
}
