"use client";

import { useState } from "react";
import { Download, FileArchive, Film, LayoutGrid, List, X } from "lucide-react";
import { usePawPulse } from "@/components/pawpulse/PawPulseProvider";
import {
  BRAND_CATEGORIES,
  BUILT_IN_BRAND_ASSETS,
  brandCategoryLabel,
  internBrandLibraryHref,
  type BrandAssetRecord,
} from "@/lib/manager/brand-kit";

export type InternBrandCard = Pick<
  BrandAssetRecord,
  "id" | "title" | "category" | "fileName" | "mimeType" | "fileSize" | "previewKind"
>;

const fieldClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:ring-2 focus:ring-[#2563EB]/30";

function Preview({ asset, compact }: { asset: InternBrandCard; compact?: boolean }) {
  const href = `/api/brand-kit/${asset.id}/file`;
  const height = compact ? "h-28" : "max-h-[50vh]";
  if (asset.previewKind === "image") {
    return <img src={href} alt="" loading="lazy" className={`${height} w-full rounded-xl bg-slate-50 object-contain`} />;
  }
  if (!compact && asset.previewKind === "video") {
    return <video className={`${height} w-full rounded-xl bg-slate-950`} controls preload="metadata" src={href} />;
  }
  const Icon = asset.mimeType.startsWith("video/") ? Film : FileArchive;
  return (
    <div className={`flex ${compact ? "h-28" : "h-40"} items-center justify-center rounded-xl bg-slate-50 text-[#2563EB]`}>
      <Icon aria-hidden />
    </div>
  );
}

export default function InternBrandLibrary({
  assets,
  total,
  page,
  pages,
  loadError,
  query,
  category,
}: {
  assets: InternBrandCard[];
  total: number;
  page: number;
  pages: number;
  loadError: string;
  query: string;
  category: string;
}) {
  const pulse = usePawPulse();
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [notice, setNotice] = useState("");
  const selected = assets.find((asset) => asset.id === selectedId) || null;

  async function downloadAsset(asset: InternBrandCard) {
    if (downloadingId) return;
    setDownloadingId(asset.id);
    const pulseId = pulse.begin("Preparing download…");
    try {
      const response = await fetch(`/api/brand-kit/${asset.id}/file?download=1&format=json`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) throw new Error(payload.error || "Download failed. Try again.");
      const anchor = document.createElement("a");
      anchor.href = payload.url;
      anchor.download = payload.fileName || asset.fileName;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      pulse.succeed(pulseId, "Download started.");
      setNotice(`Saving ${payload.fileName || asset.fileName}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed. Try again.";
      pulse.fail(pulseId, message);
      setNotice(message);
    } finally {
      setDownloadingId("");
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-black text-slate-950">Approved Brand Kit</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          {total} approved {total === 1 ? "file" : "files"}. Download what you need here, then submit the post to your manager. SharePoint keeps the master files, and you do not need to open it.
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-3 md:hidden"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filters
        </button>
        <div className="inline-flex rounded-full border border-slate-200 p-1">
          <button type="button" aria-pressed={layout === "grid"} className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${layout === "grid" ? "bg-[#2563EB] !text-white" : "text-slate-950"}`} onClick={() => setLayout("grid")}>
            <LayoutGrid size={16} aria-hidden />
            <span className="sr-only">Grid</span>
          </button>
          <button type="button" aria-pressed={layout === "list"} className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${layout === "list" ? "bg-[#2563EB] !text-white" : "text-slate-950"}`} onClick={() => setLayout("list")}>
            <List size={16} aria-hidden />
            <span className="sr-only">List</span>
          </button>
        </div>
      </div>
      <form action="/intern/toolkit" method="get" className={`${filtersOpen ? "grid" : "hidden"} gap-3 md:grid md:grid-cols-4`}>
        <input type="hidden" name="tool" value="brand" />
        <label className="block md:col-span-2">
          <span className="sr-only">Search approved brand files</span>
          <input className={fieldClass} name="q" defaultValue={query} placeholder="Search logos and graphics" />
        </label>
        <label className="block">
          <span className="sr-only">Category</span>
          <select className={fieldClass} name="category" defaultValue={category}>
            <option value="">All categories</option>
            {BRAND_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0F2744] px-4 text-sm font-bold !text-white">
          Apply
        </button>
      </form>
      {notice ? <p role="status" className="text-sm font-bold text-[#0D5C3A]">{notice}</p> : null}
      {loadError ? <p role="alert" className="text-sm font-bold text-rose-700">{loadError}</p> : null}
      {!loadError && assets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-600">
          No approved files match this search.
        </p>
      ) : null}
      <ul className={layout === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2"}>
        {assets.map((asset) => (
          <li key={asset.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <button type="button" className="block w-full text-left" onClick={() => setSelectedId(asset.id)}>
              <Preview asset={asset} compact />
              <p className="mt-2 truncate text-sm font-black text-slate-950">{asset.title}</p>
              <p className="truncate text-xs font-semibold text-slate-500">
                {brandCategoryLabel(asset.category)} · {asset.fileName.split(".").pop()?.toUpperCase()}
              </p>
            </button>
            <button
              type="button"
              disabled={downloadingId === asset.id}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] px-3 text-sm font-bold !text-white disabled:opacity-60"
              onClick={() => downloadAsset(asset)}
            >
              <Download size={16} aria-hidden /> {downloadingId === asset.id ? "Saving…" : "Download"}
            </button>
          </li>
        ))}
      </ul>
      {pages > 1 ? (
        <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Approved brand pages">
          <a className={`inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold ${page <= 1 ? "pointer-events-none opacity-40" : "text-slate-950"}`} href={internBrandLibraryHref({ q: query, category, page: page - 1 })}>
            Previous page
          </a>
          <p className="text-sm font-semibold text-slate-600">Page {page} of {pages}</p>
          <a className={`inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold ${page >= pages ? "pointer-events-none opacity-40" : "text-slate-950"}`} href={internBrandLibraryHref({ q: query, category, page: page + 1 })}>
            Next page
          </a>
        </nav>
      ) : null}
      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-slate-950">Built-in SitGuru assets</summary>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {BUILT_IN_BRAND_ASSETS.map((asset) => (
            <li key={asset.href} className="rounded-xl bg-slate-50 p-3">
              <img src={asset.href} alt="" className="h-16 w-full object-contain" />
              <a className="mt-2 block text-sm font-bold text-[#2563EB]" href={asset.href} download>{asset.title}</a>
            </li>
          ))}
        </ul>
      </details>
      {selected ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/40" role="dialog" aria-modal="true" aria-labelledby="intern-brand-title">
          <button type="button" className="hidden flex-1 sm:block" aria-label="Close preview" onClick={() => setSelectedId("")} />
          <div className="h-full w-full overflow-y-auto bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md">
            <div className="flex items-start justify-between gap-3">
              <h3 id="intern-brand-title" className="text-lg font-black text-slate-950">{selected.title}</h3>
              <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200" aria-label="Close preview" onClick={() => setSelectedId("")}>
                <X size={16} />
              </button>
            </div>
            <div className="mt-3"><Preview asset={selected} /></div>
            <p className="mt-3 text-sm font-semibold text-slate-600">{brandCategoryLabel(selected.category)}</p>
            <button
              type="button"
              disabled={downloadingId === selected.id}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white disabled:opacity-60"
              onClick={() => downloadAsset(selected)}
            >
              <Download size={16} aria-hidden /> Download original
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
