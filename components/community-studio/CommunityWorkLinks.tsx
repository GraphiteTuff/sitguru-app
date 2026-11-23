import Link from "next/link";
import { sitguruGrowthTeamsChannelLinks } from "@/lib/admin/growth/teams-access";
import { SITGURU_SHAREPOINT_FOLDERS, sitguruSharePointFolderHref, sitguruSharePointLibraryHref } from "@/lib/admin/growth/sharepoint-files";
import { SITGURU_ONENOTE_SECTIONS, sitguruOneNoteNotebookHref, sitguruOneNoteSectionHref } from "@/lib/admin/growth/onenote-notebook";

/** Uses existing team resources. Assignment pages retain their established Planner/Graph sync. */
export default function CommunityWorkLinks({ mode }: { mode: "manager" | "intern" }) {
  const teams = sitguruGrowthTeamsChannelLinks().find(channel => channel.id === "content-social");
  const reviewFolder = SITGURU_SHAREPOINT_FOLDERS.find(folder => folder.id === "content-ava-review");
  const notes = SITGURU_ONENOTE_SECTIONS.find(section => section.id === "partnerships-community");
  return <aside className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-5">
    <h2 className="text-base font-extrabold text-[#0F2744]">Keep your team in the loop</h2>
    <p className="mt-2 text-sm leading-6 text-slate-500">Connect stories to existing assignments and Content Studio drafts. Use your established team spaces for files, planning, and discussion.</p>
    <Link href={mode === "manager" ? "/manager/community-studio/guru-match" : "/intern/community-studio/guru-match"}
      className="mt-4 flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#BBF7D0] bg-gradient-to-r from-[#EFF6FF] to-[#F0FDF4] p-4 transition hover:border-[#0D5C3A]">
      <span><span className="block text-base font-black text-[#0F2744]">🐾 Guru Match &amp; Share</span>
        <span className="mt-1 block text-xs font-semibold text-slate-600">Match by city, state, service and pet type. Generate QR cards and see tracked clicks.</span></span>
      <span className="rounded-xl bg-[#2563EB] px-3 py-2 text-xs font-black text-white">Open tool →</span>
    </Link>
    <div className="mt-3 flex flex-wrap gap-2">
      {[{ label: "Teams · Content and Social", href: teams?.href || "" }, { label: "SharePoint · Manager review", href: reviewFolder ? sitguruSharePointFolderHref(reviewFolder) : sitguruSharePointLibraryHref() }, { label: "OneNote · Community", href: notes ? sitguruOneNoteSectionHref(notes) : sitguruOneNoteNotebookHref() }].filter(link => link.href).map(link => <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-blue-700">{link.label} ↗</a>)}
      <Link href={`/${mode}/assignments`} className="inline-flex min-h-12 items-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-blue-700">Assignments & Planner ↗</Link>
      <Link href={`/${mode}/calendar`} className="inline-flex min-h-12 items-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-blue-700">Team calendar ↗</Link>
    </div>
  </aside>;
}
