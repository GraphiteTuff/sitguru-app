import Link from "next/link";
import { reviewStudioContent } from "@/lib/internship/content-studio-actions";
import { studioRowLabel } from "@/lib/internship/content-studio";
import { loadManagerContentStudio } from "@/lib/internship/content-studio-actions";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";

export const dynamic = "force-dynamic";

const FILTERS = [
  ["", "All"],
  ["draft", "Drafts"],
  ["pending", "Pending"],
  ["changes", "Changes requested"],
  ["approved", "Approved"],
  ["scheduled", "Scheduled"],
  ["published", "Published"],
  ["escalated", "Escalations"],
] as const;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

function inQueue(item: { status: string; reviewStage: string; publishedUrl: string; plannedAt: string }, filter: string) {
  const labels = studioRowLabel(item);
  if (!filter) return true;
  if (filter === "draft") return labels.status === "Draft";
  if (filter === "pending") return labels.action === "Review";
  if (filter === "changes") return labels.status === "Changes Requested";
  if (filter === "approved") return labels.action === "Publish" && !item.plannedAt;
  if (filter === "scheduled") return labels.action === "Publish" && Boolean(item.plannedAt);
  if (filter === "published") return labels.status === "Published";
  if (filter === "escalated") return labels.action === "CEO review";
  return true;
}

export default async function AdminContentOverviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("admin");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const filter = first(params.queue);
  const focus = first(params.content);
  const studio = await loadManagerContentStudio(access.actor.id, access.actor.isSuperUser);
  const items = studio.items.filter((item) => inQueue(item, filter));
  const counts = studio.summary;

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <header>
        <h1 className="text-3xl font-black text-slate-950">Content overview</h1>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Read-only view of intern content. Routine approval stays with the assigned manager. Escalations can be decided here.
        </p>
      </header>
      {first(params.ok) ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{first(params.ok)}</p> : null}
      {first(params.error) ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{first(params.error)}</p> : null}
      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["Drafts", counts.drafts],
          ["Pending", counts.pending],
          ["Changes", counts.changes],
          ["Approved", counts.approved],
          ["Scheduled", counts.scheduled],
          ["Published", counts.published],
        ].map(([label, count]) => (
          <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-2xl font-black text-slate-950">{count}</p>
            <p className="text-xs font-semibold text-slate-600">{label}</p>
          </article>
        ))}
      </div>
      <nav className="flex flex-wrap gap-2">
        {FILTERS.map(([id, label]) => (
          <Link
            key={id || "all"}
            href={id ? `/admin/growth/content?queue=${id}` : "/admin/growth/content"}
            className={`rounded-full px-3 py-2 text-xs font-black ${filter === id ? "bg-[#0D5C3A] !text-white" : "bg-white text-slate-700"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <ul className="space-y-3">
        {items.map((item) => {
          const labels = studioRowLabel(item);
          return (
            <li id={`content-${item.id}`} key={item.id} className={`rounded-2xl border border-slate-200 bg-white p-4 ${focus === item.id ? "ring-2 ring-[#2563EB]" : ""}`}>
              <p className="font-black text-slate-950">{item.title}</p>
              <p className="text-sm font-semibold text-slate-600">
                {item.internName} · {item.platform || "No platform"} · {labels.status}
                {item.plannedAt ? ` · Planned ${item.plannedAt.slice(0, 16).replace("T", " ")}` : ""}
              </p>
              {item.creativePath ? (
                item.creativeMime.startsWith("video/")
                  ? <video src={`/api/content-studio/${item.id}/file`} controls className="mt-3 max-h-64 w-full rounded-xl bg-slate-950" />
                  : <img src={`/api/content-studio/${item.id}/file`} alt="" className="mt-3 max-h-64 w-full rounded-xl object-contain bg-slate-50" />
              ) : null}
              {item.caption ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.caption}</p> : null}
              {item.publishedUrl ? <p className="mt-2 break-all text-sm font-semibold text-[#1D4ED8]">{item.publishedUrl}</p> : null}
              {labels.action === "CEO review" && access.actor.isSuperUser ? (
                <form action={reviewStudioContent} className="mt-3 grid gap-2">
                  <input type="hidden" name="contentId" value={item.id} />
                  <input type="hidden" name="internId" value={item.internId} />
                  <input type="hidden" name="returnTo" value="/admin/growth/content" />
                  <textarea name="comment" rows={2} placeholder="Leadership note" className="min-h-16 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <div className="flex flex-wrap gap-2">
                    <button name="reviewAction" value="ceo_approve" className="min-h-11 rounded-full bg-[#0D5C3A] px-4 text-sm font-black !text-white">CEO approve</button>
                    <button name="reviewAction" value="ceo_request_changes" className="min-h-11 rounded-full border border-amber-300 px-4 text-sm font-black text-amber-950">Send back</button>
                  </div>
                </form>
              ) : null}
            </li>
          );
        })}
        {!items.length ? <li className="text-sm font-semibold text-slate-500">Nothing is in this queue.</li> : null}
      </ul>
    </main>
  );
}
