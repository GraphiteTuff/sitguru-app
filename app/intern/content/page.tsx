import Link from "next/link";
import { ContentCreativeField } from "@/components/internship/ContentCreativeField";
import { brandCategoryLabel } from "@/lib/manager/brand-kit";
import { CONTENT_PLATFORMS, CONTENT_TYPES, studioRowLabel } from "@/lib/internship/content-studio";
import { loadInternContentStudio, saveStudioContent } from "@/lib/internship/content-studio-actions";
import { currentAssignedIntern, requireGrowthWorkplace } from "@/lib/admin/growth/workplace";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternContentPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const intern = await currentAssignedIntern();
  if (!intern) {
    return <p className="text-sm font-semibold text-slate-600">Your internship record is not linked to this login yet.</p>;
  }
  const params = searchParams ? await searchParams : {};
  const studio = await loadInternContentStudio(intern.id);
  const editing = studio.items.find((item) => item.id === first(params.edit)) || null;
  const manager = (intern.dayToDayManagerName || "").split(" ")[0] || "your manager";
  const field = "min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-950">Create content</h1>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Save a draft, attach an approved Brand Kit file, then submit it to {intern.dayToDayManagerName || "your manager"}.
        </p>
      </header>
      {first(params.ok) ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{first(params.ok)}</p> : null}
      {first(params.error) ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{first(params.error)}</p> : null}
      <form key={editing?.id || "new"} action={saveStudioContent} className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-4">
        <input type="hidden" name="internId" value={intern.id} />
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
        <label className="block text-sm font-black text-slate-800">Content title
          <input name="title" required defaultValue={editing?.title || ""} className={`mt-1 ${field}`} placeholder="Pet Safety Awareness Post" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-black text-slate-800">Content type
            <select name="contentType" defaultValue={editing?.contentType || "social_post"} className={`mt-1 ${field}`}>
              {CONTENT_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-black text-slate-800">Platform
            <select name="platform" defaultValue={editing?.platform || "Instagram"} className={`mt-1 ${field}`}>
              {CONTENT_PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-sm font-black text-slate-800">Caption
          <textarea name="caption" rows={4} defaultValue={editing?.caption || ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Post text, hashtags, and call to action" />
        </label>
        <div>
          <p className="text-sm font-black text-slate-800">Finished graphic or video</p>
          <ContentCreativeField
            initial={editing?.creativePath ? { path: editing.creativePath, mime: editing.creativeMime, name: editing.creativeName } : null}
          />
        </div>
        <label className="block text-sm font-black text-slate-800">Or a Canva link
          <input name="draftUrl" defaultValue={editing?.draftUrl || ""} className={`mt-1 ${field}`} placeholder="https://" />
        </label>
        <fieldset>
          <legend className="text-sm font-black text-slate-800">Approved Brand Kit assets</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {studio.assets.map((asset) => (
              <label key={asset.id} className="flex items-start gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" name="assetId" value={asset.id} defaultChecked={editing?.assetIds.includes(asset.id)} className="mt-1" />
                <span>{asset.title}<span className="block break-words text-xs font-medium text-slate-500">{brandCategoryLabel(asset.category)}</span></span>
              </label>
            ))}
            {!studio.assets.length ? <p className="text-sm text-slate-500">No approved brand files yet. Ask a Super Admin to approve the Brand Kit.</p> : null}
          </div>
          <Link href="/intern/toolkit?tool=brand" className="mt-2 inline-flex text-sm font-black text-[#1D4ED8]">Open Brand Kit</Link>
        </fieldset>
        <details className="rounded-xl bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-black text-slate-800">Campaign, assignment, and timing</summary>
          <div className="mt-3 grid gap-3">
            <label className="text-sm font-bold text-slate-700">Campaign
              <select name="campaignId" className={`mt-1 ${field}`}>
                <option value="">None</option>
                {studio.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">Assignment
              <select name="taskId" className={`mt-1 ${field}`}>
                <option value="">None</option>
                {studio.tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">Planned publication (Eastern Time)
              <input type="datetime-local" name="plannedAt" className={`mt-1 ${field}`} />
            </label>
            <label className="text-sm font-bold text-slate-700">Notes for {manager}
              <textarea name="notes" rows={2} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>
          </div>
        </details>
        <div className="flex flex-wrap gap-2">
          <button name="intent" value="save" className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-black text-slate-800">Save draft</button>
          <button name="intent" value="submit" className="min-h-11 rounded-full bg-[#2563EB] px-4 text-sm font-black !text-white">Submit to {manager}</button>
        </div>
      </form>
      <section className="space-y-2">
        <h2 className="text-lg font-black text-slate-950">My drafts</h2>
        {studio.items.map((item) => {
          const labels = studioRowLabel(item);
          return (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="font-black text-slate-950">{item.title}</p>
              <p className="text-sm font-semibold text-slate-600">{item.platform} · {labels.status} · Next: {labels.action}</p>
              <Link href={`/intern/content?edit=${item.id}`} className="mt-2 inline-flex text-sm font-black text-[#1D4ED8]">Revise</Link>
              {item.feedback ? <p className="mt-2 text-sm font-semibold text-amber-900">Feedback: {item.feedback}</p> : null}
              {item.publishedUrl ? <p className="mt-1 break-all text-sm font-semibold text-[#1D4ED8]">{item.publishedUrl}</p> : null}
            </article>
          );
        })}
        {!studio.items.length ? <p className="text-sm font-semibold text-slate-500">You have not saved content yet.</p> : null}
      </section>
    </div>
  );
}
