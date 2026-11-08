"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileArchive, Film, LayoutGrid, List, MoreHorizontal, Upload, X } from "lucide-react";
import { usePawPulse } from "@/components/pawpulse/PawPulseProvider";
import {
  BRAND_CATEGORIES,
  BUILT_IN_BRAND_ASSETS,
  brandCategoryLabel,
  brandMasterFolder,
  type BrandAssetRecord,
  type BrandStatus,
} from "@/lib/manager/brand-kit";

type Capabilities = {
  upload: boolean;
  edit: boolean;
  archive: boolean;
  approve: boolean;
  delete: boolean;
};

const fieldClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0F2744] outline-none focus:ring-2 focus:ring-[#2563EB]/30";

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function libraryQuery(input: {
  q?: string;
  category?: string;
  status?: string;
  sort?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.category) params.set("category", input.category);
  if (input.status) params.set("status", input.status);
  if (input.sort && input.sort !== "approved_first") params.set("sort", input.sort);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return query ? `/manager/toolkit/brand?${query}` : "/manager/toolkit/brand";
}

function uploadThroughSitGuru(
  file: File,
  fields: { category: string; title: string; description: string; tags: string; replacesId: string },
  onProgress: (value: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const body = new FormData();
    body.set("file", file);
    body.set("category", fields.category);
    body.set("title", fields.title || file.name);
    body.set("description", fields.description);
    body.set("tags", fields.tags);
    if (fields.replacesId) body.set("replacesId", fields.replacesId);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/brand-kit/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      let payload: { error?: string } = {};
      try {
        payload = JSON.parse(xhr.responseText || "{}");
      } catch {
        payload = {};
      }
      if (xhr.status >= 200 && xhr.status < 300 && !payload.error) resolve();
      else reject(new Error(payload.error || "The file did not finish uploading."));
    };
    xhr.onerror = () => reject(new Error("You appear to be offline. Check your connection and try again."));
    xhr.send(body);
  });
}

async function putSignedFile(url: string, file: File, onProgress: (value: number) => void) {
  await new Promise<void>((resolve, reject) => {
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("The file did not finish uploading."));
    };
    xhr.onerror = () => reject(new Error("You appear to be offline. Check your connection and try again."));
    xhr.send(body);
  });
}

export default function BrandKitManager({
  assets,
  total,
  page,
  pages,
  loadError,
  capabilities,
  isSuperUser,
  query,
  category,
  status,
  sort,
  sharePointHref,
}: {
  assets: BrandAssetRecord[];
  total: number;
  page: number;
  pages: number;
  loadError: string;
  capabilities: Capabilities;
  isSuperUser: boolean;
  query: string;
  category: string;
  status: string;
  sort: string;
  sharePointHref: string;
}) {
  const router = useRouter();
  const pulse = usePawPulse();
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"ok" | "error">("ok");
  const selected = assets.find((asset) => asset.id === selectedId) || null;
  const filters = { q: query, category, status, sort };

  function say(tone: "ok" | "error", message: string) {
    setNoticeTone(tone);
    setNotice(message);
  }

  async function downloadAsset(asset: BrandAssetRecord) {
    if (downloadingId) return;
    setDownloadingId(asset.id);
    const pulseId = pulse.begin("Preparing download…");
    try {
      const response = await fetch(`/api/brand-kit/${asset.id}/file?download=1&format=json`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Download failed. Try again.");
      }
      const anchor = document.createElement("a");
      anchor.href = payload.url;
      anchor.download = payload.fileName || asset.fileName;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      pulse.succeed(pulseId, "Download started.");
      say("ok", `Saving ${payload.fileName || asset.fileName}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed. Try again.";
      pulse.fail(pulseId, message);
      say("error", message);
    } finally {
      setDownloadingId("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">
          {total} {total === 1 ? "file" : "files"}
          {isSuperUser
            ? ". Approved files lead the library. Drafts, pending review, and the archive stay in the status filter."
            : ". Approved files are shown for the team. A Super Admin reviews drafts before they appear here."}
        </p>
        <div className="flex flex-wrap gap-2">
          {capabilities.upload ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white"
              onClick={() => setUploadOpen(true)}
            >
              <Upload size={16} aria-hidden /> Upload Asset
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-3 md:hidden"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Filters
          </button>
          <div className="inline-flex rounded-full border border-slate-200 p-1">
            <button type="button" aria-pressed={layout === "grid"} className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${layout === "grid" ? "bg-[#2563EB] !text-white" : "text-[#0F2744]"}`} onClick={() => setLayout("grid")}>
              <LayoutGrid size={16} aria-hidden />
              <span className="sr-only">Grid</span>
            </button>
            <button type="button" aria-pressed={layout === "list"} className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${layout === "list" ? "bg-[#2563EB] !text-white" : "text-[#0F2744]"}`} onClick={() => setLayout("list")}>
              <List size={16} aria-hidden />
              <span className="sr-only">List</span>
            </button>
          </div>
        </div>
      </div>

      <form action="/manager/toolkit/brand" method="get" className={`${filtersOpen ? "grid" : "hidden"} gap-3 md:grid md:grid-cols-4`}>
        <label className="block md:col-span-2">
          <span className="sr-only">Search brand assets</span>
          <input className={fieldClass} name="q" defaultValue={query} placeholder="Search logos, graphics, and files" />
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
        {isSuperUser ? (
          <label className="block">
            <span className="sr-only">Approval status</span>
            <select className={fieldClass} name="status" defaultValue={status || "active"}>
              <option value="active">Approved first</option>
              <option value="approved">Approved only</option>
              <option value="draft">Drafts</option>
              <option value="pending_review">Pending review</option>
              <option value="archived">Archive</option>
              <option value="all">All files</option>
            </select>
          </label>
        ) : (
          <input type="hidden" name="status" value="approved" />
        )}
        <label className="block">
          <span className="sr-only">Sort</span>
          <select className={fieldClass} name="sort" defaultValue={sort || "approved_first"}>
            <option value="approved_first">Approved first</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="updated">Recently updated</option>
          </select>
        </label>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0F2744] px-4 text-sm font-bold !text-white">
          Apply
        </button>
      </form>

      {notice ? (
        <p role={noticeTone === "error" ? "alert" : "status"} className={`text-sm font-bold ${noticeTone === "error" ? "text-rose-700" : "text-[#0D5C3A]"}`}>
          {notice}
        </p>
      ) : null}
      {loadError ? <p role="alert" className="text-sm font-bold text-rose-700">{loadError}</p> : null}
      {!loadError && assets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-600">
          No files in this view.
        </p>
      ) : null}

      <ul className={layout === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "space-y-2"}>
        {assets.map((asset) => (
          <li key={asset.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <button type="button" className="block w-full text-left" onClick={() => setSelectedId(asset.id)}>
              <Preview asset={asset} compact />
              <p className="mt-2 truncate text-sm font-black text-[#0F2744]">{asset.title}</p>
              <p className="truncate text-xs font-semibold text-slate-500">
                {brandCategoryLabel(asset.category)} · {asset.fileName.split(".").pop()?.toUpperCase()} · {asset.approvalStatus.replace(/_/g, " ")}
              </p>
            </button>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={downloadingId === asset.id}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#2563EB] px-3 text-sm font-bold !text-white disabled:opacity-60"
                onClick={() => downloadAsset(asset)}
              >
                <Download size={16} aria-hidden /> {downloadingId === asset.id ? "Saving…" : "Download"}
              </button>
              <button type="button" className="inline-flex min-h-11 w-11 items-center justify-center rounded-full border border-slate-200" aria-label={`More actions for ${asset.title}`} onClick={() => setSelectedId(asset.id)}>
                <MoreHorizontal size={16} aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {pages > 1 ? (
        <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Brand asset pages">
          <a className={`inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold ${page <= 1 ? "pointer-events-none opacity-40" : "text-[#0F2744]"}`} href={libraryQuery({ ...filters, page: page - 1 })}>
            Previous page
          </a>
          <p className="text-sm font-semibold text-slate-600">Page {page} of {pages}</p>
          <a className={`inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold ${page >= pages ? "pointer-events-none opacity-40" : "text-[#0F2744]"}`} href={libraryQuery({ ...filters, page: page + 1 })}>
            Next page
          </a>
        </nav>
      ) : null}

      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-[#0F2744]">Built-in SitGuru Assets</summary>
        <p className="mt-2 text-xs font-medium text-slate-500">Website files, not uploaded library records. These cannot be deleted from the Brand Kit.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {BUILT_IN_BRAND_ASSETS.map((asset) => (
            <li key={asset.href}>
              <a className="text-sm font-bold text-[#2563EB]" href={asset.href} download>{asset.title}</a>
              <p className="text-xs text-slate-500">{asset.note}</p>
            </li>
          ))}
        </ul>
      </details>

      {uploadOpen ? (
        <UploadDialog
          capabilities={capabilities}
          isSuperUser={isSuperUser}
          onClose={() => setUploadOpen(false)}
          onDone={(message) => {
            setUploadOpen(false);
            say("ok", message);
            router.refresh();
          }}
          onError={(message) => say("error", message)}
        />
      ) : null}
      {selected ? (
        <AssetDrawer
          asset={selected}
          capabilities={capabilities}
          sharePointHref={sharePointHref}
          downloading={downloadingId === selected.id}
          onDownload={() => downloadAsset(selected)}
          onClose={() => setSelectedId("")}
          onChanged={(message) => {
            say("ok", message);
            router.refresh();
          }}
          onError={(message) => say("error", message)}
        />
      ) : null}
    </div>
  );
}

function Preview({ asset, compact }: { asset: BrandAssetRecord; compact?: boolean }) {
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

function UploadDialog({
  isSuperUser,
  onClose,
  onDone,
  onError,
}: {
  capabilities: Capabilities;
  isSuperUser: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const pulse = usePawPulse();
  const [category, setCategory] = useState("official_logos");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function uploadFiles(files: File[]) {
    if (uploading || files.length === 0) return;
    setUploading(true);
    const pulseId = pulse.begin("Uploading brand file…");
    try {
      for (const file of files) {
        setProgress(0.05);
        if (file.size <= 4 * 1024 * 1024) {
          await uploadThroughSitGuru(file, { category, title, description, tags, replacesId: "" }, setProgress);
          continue;
        }
        const prepared = await fetch("/api/brand-kit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "prepare",
            fileName: file.name,
            declaredMime: file.type,
            declaredSize: file.size,
            category,
            title: title || file.name,
            description,
            tags,
          }),
        });
        const payload = await prepared.json().catch(() => ({}));
        if (!prepared.ok || !payload.signedUrl || !payload.id) throw new Error(payload.error || "Upload could not be started.");
        await putSignedFile(payload.signedUrl, file, setProgress);
        const verified = await fetch("/api/brand-kit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", id: payload.id }),
        });
        const verifiedBody = await verified.json().catch(() => ({}));
        if (!verified.ok) throw new Error(verifiedBody.error || "SitGuru could not accept this file.");
      }
      pulse.succeed(pulseId, "Brand file saved.");
      onDone(
        isSuperUser
          ? "Saved. It stays a draft until you approve it."
          : "Saved as a draft. It appears in the team library after a Super Admin approves it.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      pulse.fail(pulseId, message);
      onError(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="upload-brand-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="upload-brand-title" className="text-lg font-black text-[#0F2744]">Upload asset</h2>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200" onClick={onClose} aria-label="Close upload">
            <X size={16} />
          </button>
        </div>
        <div className="mt-3 grid gap-3">
          <label className="block text-xs font-bold text-slate-500">Category
            <select className={`${fieldClass} mt-1`} value={category} onChange={(event) => setCategory(event.target.value)}>
              {BRAND_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-500">Name
            <input className={`${fieldClass} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Optional display name" />
          </label>
          <label className="block text-xs font-bold text-slate-500">Description
            <input className={`${fieldClass} mt-1`} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label className="block text-xs font-bold text-slate-500">Tags
            <input className={`${fieldClass} mt-1`} value={tags} onChange={(event) => setTags(event.target.value)} placeholder="logo, spring, instagram" />
          </label>
          <div
            className="rounded-2xl border border-dashed border-[#93C5FD] bg-[#EFF6FF] p-4 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void uploadFiles(Array.from(event.dataTransfer.files || []));
            }}
          >
            <p className="text-sm font-bold text-[#0F2744]">Drop a file or choose one. 25MB maximum.</p>
            <input
              aria-label="Choose brand files"
              className="mt-3 block w-full text-sm"
              type="file"
              multiple
              disabled={uploading}
              accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.zip,.mp4,.webm,.mov,image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,application/zip,video/mp4,video/webm,video/quicktime"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                event.target.value = "";
                void uploadFiles(files);
              }}
            />
            {uploading ? <p className="mt-2 text-xs font-bold text-[#2563EB]">Uploading {Math.round(progress * 100)}%</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetDrawer({
  asset,
  capabilities,
  sharePointHref,
  downloading,
  onDownload,
  onClose,
  onChanged,
  onError,
}: {
  asset: BrandAssetRecord;
  capabilities: Capabilities;
  sharePointHref: string;
  downloading: boolean;
  onDownload: () => void;
  onClose: () => void;
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}) {
  const pulse = usePawPulse();
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState(asset.description);
  const [category, setCategory] = useState(asset.category);
  const [tags, setTags] = useState(asset.tags.join(", "));
  const [busy, setBusy] = useState(false);
  const master = brandMasterFolder(asset);
  const placed = new Date(asset.createdAt || "").toLocaleString();

  async function patch(body: Record<string, unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    const pulseId = pulse.begin("Saving brand file…");
    try {
      const response = await fetch(`/api/brand-kit/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not save this file.");
      pulse.succeed(pulseId, success);
      onChanged(success);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this file.";
      pulse.fail(pulseId, message);
      onError(message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!capabilities.delete || busy) return;
    setBusy(true);
    const pulseId = pulse.begin("Deleting brand file…");
    try {
      const response = await fetch(`/api/brand-kit/${asset.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete this file.");
      pulse.succeed(pulseId, "Brand file deleted.");
      onChanged("Brand file deleted.");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete this file.";
      pulse.fail(pulseId, message);
      onError(message);
    } finally {
      setBusy(false);
    }
  }

  async function replace(file: File) {
    if (busy) return;
    setBusy(true);
    const pulseId = pulse.begin("Replacing brand file…");
    try {
      if (file.size <= 4 * 1024 * 1024) {
        await uploadThroughSitGuru(file, { category, title, description, tags, replacesId: asset.id }, () => undefined);
      } else {
        const prepared = await fetch("/api/brand-kit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "prepare",
            fileName: file.name,
            declaredMime: file.type,
            declaredSize: file.size,
            category,
            title,
            description,
            tags,
            replacesId: asset.id,
          }),
        });
        const payload = await prepared.json().catch(() => ({}));
        if (!prepared.ok || !payload.signedUrl || !payload.id) throw new Error(payload.error || "Replace could not be started.");
        await putSignedFile(payload.signedUrl, file, () => undefined);
        const verified = await fetch("/api/brand-kit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", id: payload.id }),
        });
        const verifiedBody = await verified.json().catch(() => ({}));
        if (!verified.ok) throw new Error(verifiedBody.error || "SitGuru could not accept this file.");
      }
      pulse.succeed(pulseId, "New version saved.");
      onChanged("New version saved as a draft.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Replace failed.";
      pulse.fail(pulseId, message);
      onError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/40" role="dialog" aria-modal="true" aria-labelledby="brand-detail-title">
      <button type="button" className="hidden flex-1 sm:block" aria-label="Close details" onClick={onClose} />
      <div className="h-full w-full overflow-y-auto bg-white p-4 shadow-xl sm:max-w-md pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          <h2 id="brand-detail-title" className="text-lg font-black text-[#0F2744]">{asset.title}</h2>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200" onClick={onClose} aria-label="Close details">
            <X size={16} />
          </button>
        </div>
        <div className="mt-3"><Preview asset={asset} /></div>
        <p className="mt-3 break-all text-xs font-semibold text-slate-500">{asset.fileName}</p>
        <p className="text-xs font-semibold text-slate-500">{formatBytes(asset.fileSize)} · v{asset.version} · {asset.uploadedByName} · {placed || "Saved"}</p>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-black text-[#0F2744]">SharePoint master: {master.name}</p>
          <p className="mt-1 text-xs font-medium">{master.purpose}</p>
          <p className="mt-2 text-xs font-medium">SitGuru does not copy this file into SharePoint. Save the original in the active folder and use SharePoint version history. Only a retired design belongs in 99 Brand Archive.</p>
          {sharePointHref ? (
            <a className="mt-2 inline-flex min-h-11 items-center font-bold text-[#2563EB]" href={sharePointHref} target="_blank" rel="noreferrer">
              View SharePoint Master
            </a>
          ) : (
            <p className="mt-2 text-xs font-semibold">The SharePoint folder opens on an @sitguru.com work account.</p>
          )}
        </div>
        {capabilities.edit ? (
          <div className="mt-4 space-y-2">
            <label className="block text-xs font-bold text-slate-500">Name
              <input className={`${fieldClass} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="block text-xs font-bold text-slate-500">Description
              <input className={`${fieldClass} mt-1`} value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label className="block text-xs font-bold text-slate-500">Category
              <select className={`${fieldClass} mt-1`} value={category} onChange={(event) => setCategory(event.target.value)}>
                {BRAND_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-500">Tags
              <input className={`${fieldClass} mt-1`} value={tags} onChange={(event) => setTags(event.target.value)} />
            </label>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={downloading || busy} className="inline-flex min-h-11 items-center rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white disabled:opacity-60" onClick={onDownload}>
            {downloading ? "Saving…" : "Download original"}
          </button>
          {capabilities.edit ? (
            <button type="button" disabled={busy} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold" onClick={() => patch({ title, description, category, tags }, "Brand file updated.")}>
              Save details
            </button>
          ) : null}
          {capabilities.edit && asset.approvalStatus !== "pending_review" ? (
            <button type="button" disabled={busy} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold" onClick={() => patch({ approvalStatus: "pending_review" satisfies BrandStatus }, "Sent for review.")}>
              Send for review
            </button>
          ) : null}
          {capabilities.approve && asset.approvalStatus !== "approved" ? (
            <button type="button" disabled={busy} className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white" onClick={() => patch({ approvalStatus: "approved" }, "Brand file approved.")}>
              Approve
            </button>
          ) : null}
          {capabilities.archive && asset.approvalStatus !== "archived" ? (
            <button type="button" disabled={busy} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold" onClick={() => patch({ approvalStatus: "archived" }, "Brand file archived.")}>
              Archive
            </button>
          ) : null}
          {capabilities.delete ? (
            <button type="button" disabled={busy} className="inline-flex min-h-11 items-center rounded-full border border-rose-200 px-4 text-sm font-bold text-rose-700" onClick={remove}>
              Delete
            </button>
          ) : null}
        </div>
        {capabilities.upload ? (
          <label className="mt-4 block text-xs font-bold text-slate-500">
            Replace version
            <input className="mt-1 block w-full text-sm" type="file" disabled={busy} onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void replace(file);
            }} />
          </label>
        ) : null}
      </div>
    </div>
  );
}
