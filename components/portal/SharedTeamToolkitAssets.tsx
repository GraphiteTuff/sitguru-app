import Link from "next/link";
import { ArrowUpRight, FileVideo, FolderOpen, ImageIcon, Palette } from "lucide-react";
import { APPROVED_TEAM_ASSET_CATEGORIES, teamBrandHref, teamResourcesHref, type TeamToolkitRole } from "@/lib/manager/shared-team-toolkit";
import { DESK_UI } from "@/lib/portal/desk-ui";
import type { BrandAssetRecord } from "@/lib/manager/brand-kit";

export default function SharedTeamToolkitAssets({
  role,
  assets,
  total,
  error = "",
}: {
  role: TeamToolkitRole;
  assets: Array<Pick<BrandAssetRecord, "id" | "title" | "category" | "fileName" | "previewKind">>;
  total: number;
  error?: string;
}) {
  return (
    <section aria-label="Shared team resources and approved assets" className={`${DESK_UI.card} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-[#0D5C3A]">One SitGuru approved library</p>
          <h2 className="mt-1 text-xl font-black text-[#0F2744] sm:text-2xl">Team assets & resources</h2>
          <p className="mt-1 max-w-3xl text-sm font-medium text-slate-600">
            Managers, interns and admins use the same approved logos, templates, guidelines and campaign assets.
            Drafts remain in the authorized review workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={teamBrandHref(role)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-xs font-black !text-white hover:bg-[#1D4ED8]">
            <Palette size={16} aria-hidden="true" /> Open Brand Kit
          </Link>
          <Link href={teamResourcesHref(role)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-[#0F2744] hover:bg-[#F4F7FB]">
            <FolderOpen size={16} aria-hidden="true" /> Resources
          </Link>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {APPROVED_TEAM_ASSET_CATEGORIES.map((category) => (
          <Link key={category.id} href={teamBrandHref(role, category.id)} className="rounded-xl border border-slate-100 bg-[#F4F7FB] p-3 hover:border-[#BFDBFE] hover:bg-[#EFF6FF]">
            <span className="flex items-center justify-between gap-2 text-sm font-black text-[#0F2744]">{category.title} <ArrowUpRight size={15} className="shrink-0 text-[#2563EB]" aria-hidden="true" /></span>
            <span className="mt-1 block text-xs font-medium text-slate-500">{category.detail}</span>
          </Link>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-base font-black text-[#0F2744]">Latest approved files</h3>
          <p className="mt-1 text-xs font-medium text-slate-600">{total} approved uploaded {total === 1 ? "file" : "files"} available through the shared SitGuru library.</p>
        </div>
        <Link className="text-xs font-black text-[#2563EB] hover:underline" href={teamBrandHref(role)}>Browse all approved files</Link>
      </div>
      {error ? <p role="alert" className="mt-3 text-sm font-bold text-rose-700">{error}</p> : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {assets.slice(0, 6).map((asset) => (
          <article key={asset.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">
            <div aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
              {asset.previewKind === "video" ? <FileVideo size={19} /> : <ImageIcon size={19} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[#0F2744]" title={asset.title}>{asset.title}</p>
              <p className="truncate text-xs font-medium text-slate-500">{asset.fileName}</p>
              <a href={`/api/brand-kit/${encodeURIComponent(asset.id)}/file?download=1`} className="mt-2 inline-flex min-h-9 items-center text-xs font-black text-[#2563EB] hover:underline">
                Download approved file
              </a>
            </div>
          </article>
        ))}
      </div>
      {!assets.length && !error ? <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-sm font-medium text-slate-600">No uploaded approved files yet. Built-in SitGuru artwork remains available in the Brand Kit.</p> : null}
      <p className="mt-4 text-xs font-medium leading-5 text-slate-500">SharePoint remains the source for Microsoft 365 master files. Opening a SharePoint link still requires the appropriate work account permissions.</p>
    </section>
  );
}
