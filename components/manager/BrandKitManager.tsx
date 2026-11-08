"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileArchive, Film, Upload } from "lucide-react";
import { usePawPulse } from "@/components/pawpulse/PawPulseProvider";
import {
  BRAND_CATEGORIES,
  BUILT_IN_BRAND_ASSETS,
  brandCategoryLabel,
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

type ProgressFile = { name: string; progress: number; status: string };

const fieldClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0F2744] outline-none focus:ring-2 focus:ring-[#2563EB]/30";

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
  loadError,
  capabilities,
  initialCategory = "",
  initialStatus = "",
  initialQuery = "",
}: {
  assets: BrandAssetRecord[];
  loadError: string;
  capabilities: Capabilities;
  initialCategory?: string;
  initialStatus?: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const pulse = usePawPulse();
  const [category, setCategory] = useState(initialCategory || "official_logos");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"ok" | "error">("ok");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<ProgressFile[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [busyId, setBusyId] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (filterCategory && asset.category !== filterCategory) return false;
      if (!filterStatus && asset.approvalStatus === "archived") return false;
      if (filterStatus && asset.approvalStatus !== filterStatus) return false;
      if (!needle) return true;
      return `${asset.title} ${asset.description} ${asset.fileName} ${asset.tags.join(" ")}`
        .toLowerCase()
        .includes(needle);
    });
  }, [assets, filterCategory, filterStatus, query]);

  const builtIn = BUILT_IN_BRAND_ASSETS.filter((asset) => !filterCategory || asset.category === filterCategory);

  function say(tone: "ok" | "error", message: string) {
    setNoticeTone(tone);
    setNotice(message);
  }

  async function uploadFiles(files: File[], replacesId = "") {
    if (!capabilities.upload || uploading || files.length === 0) return;
    setUploading(true);
    setProgress(files.map((file) => ({ name: file.name, progress: 0, status: "Waiting" })));
    const pulseId = pulse.begin(files.length > 1 ? "Uploading brand files…" : "Uploading brand file…");
    let saved = 0;
    let failed = "";
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const update = (patch: Partial<ProgressFile>) => {
        setProgress((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
      };
      try {
        update({ status: "Starting", progress: 0.02 });
        if (file.size <= 4 * 1024 * 1024) {
          await uploadThroughSitGuru(file, { category, title, description, tags, replacesId }, (value) =>
            update({ progress: value, status: "Uploading" }),
          );
          update({ status: "Saved", progress: 1 });
          saved += 1;
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
            replacesId,
          }),
        });
        const payload = await prepared.json().catch(() => ({}));
        if (!prepared.ok || !payload.signedUrl || !payload.id) {
          throw new Error(payload.error || "Upload could not be started.");
        }
        update({ status: "Uploading" });
        await putSignedFile(payload.signedUrl, file, (value) => update({ progress: value, status: "Uploading" }));
        update({ status: "Checking", progress: 1 });
        const verified = await fetch("/api/brand-kit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", id: payload.id }),
        });
        const verifiedBody = await verified.json().catch(() => ({}));
        if (!verified.ok) {
          await fetch("/api/brand-kit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "abandon", id: payload.id }),
          });
          throw new Error(verifiedBody.error || "SitGuru could not accept this file.");
        }
        update({ status: "Saved", progress: 1 });
        saved += 1;
      } catch (error) {
        failed = error instanceof Error ? error.message : "Upload failed.";
        update({ status: failed });
      }
    }
    setUploading(false);
    if (saved && !failed) {
      pulse.succeed(pulseId, saved === 1 ? "Brand file saved." : `${saved} brand files saved.`);
      say("ok", saved === 1 ? "Saved in the Brand Kit." : `${saved} files saved in the Brand Kit.`);
      setTitle("");
      setDescription("");
      setTags("");
      router.refresh();
    } else {
      pulse.fail(pulseId, failed || "Upload failed.");
      say("error", failed || "Upload failed.");
    }
  }

  async function patchAsset(id: string, body: Record<string, unknown>, success: string) {
    if (busyId) return;
    setBusyId(id);
    const pulseId = pulse.begin("Saving brand file…");
    try {
      const response = await fetch(`/api/brand-kit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not save this file.");
      pulse.succeed(pulseId, success);
      say("ok", success);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this file.";
      pulse.fail(pulseId, message);
      say("error", message);
    } finally {
      setBusyId("");
    }
  }

  async function removeAsset(id: string) {
    if (!capabilities.delete || busyId) return;
    setBusyId(id);
    const pulseId = pulse.begin("Deleting brand file…");
    try {
      const response = await fetch(`/api/brand-kit/${id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete this file.");
      pulse.succeed(pulseId, "Brand file deleted.");
      say("ok", "Brand file deleted.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete this file.";
      pulse.fail(pulseId, message);
      say("error", message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-5">
      <section id="upload" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-[#0F2744]">Upload brand files</h2>
        <p className="mt-1 text-sm font-medium text-slate-600">
          PNG, JPG, WEBP, SVG, PDF, ZIP, and video up to 25MB. Originals stay downloadable.
        </p>
        {capabilities.upload ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">Category</span>
              <select className={`${fieldClass} mt-1`} value={category} onChange={(event) => setCategory(event.target.value)}>
                {BRAND_CATEGORIES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">Name</span>
              <input className={`${fieldClass} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Optional display name" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">Description</span>
              <input className={`${fieldClass} mt-1`} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Where this file should be used" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">Tags</span>
              <input className={`${fieldClass} mt-1`} value={tags} onChange={(event) => setTags(event.target.value)} placeholder="logo, spring, instagram" />
            </label>
            <div
              className="md:col-span-2 rounded-2xl border border-dashed border-[#93C5FD] bg-[#EFF6FF] p-5 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void uploadFiles(Array.from(event.dataTransfer.files || []));
              }}
            >
              <Upload className="mx-auto text-[#2563EB]" aria-hidden />
              <p className="mt-2 text-sm font-bold text-[#0F2744]">Drag files here or choose them</p>
              <input
                aria-label="Upload brand files"
                className="mt-3 block w-full text-sm font-semibold"
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
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm font-semibold text-slate-600">You can view approved brand files. Uploads stay with managers and Super Admins.</p>
        )}
        {progress.length ? (
          <ul className="mt-4 space-y-2" aria-live="polite">
            {progress.map((file, index) => (
              <li key={`${index}-${file.name}`} className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-sm font-bold text-[#0F2744]">{file.name}</p>
                <p className="text-xs font-semibold text-slate-500">{file.status}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full bg-[#2563EB]" style={{ width: `${Math.round(file.progress * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {notice ? (
          <p role={noticeTone === "error" ? "alert" : "status"} className={`mt-3 text-sm font-bold ${noticeTone === "error" ? "text-rose-700" : "text-[#0D5C3A]"}`}>
            {notice}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-[#0F2744]">Library</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="sr-only">Search brand files</span>
            <input className={fieldClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search brand files" />
          </label>
          <select aria-label="Filter by category" className={fieldClass} value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
            <option value="">All categories</option>
            {BRAND_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <select aria-label="Filter by status" className={fieldClass} value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="">Hide archived</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending review</option>
            <option value="approved">Approved</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        {loadError ? <p role="alert" className="mt-3 text-sm font-bold text-rose-700">{loadError}</p> : null}
        {!loadError && visible.length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-slate-600">No uploaded files in this view yet.</p>
        ) : null}
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {visible.map((asset) => (
            <li key={asset.id} id={`asset-${asset.id}`} className="rounded-2xl border border-slate-200 p-3">
              <AssetPreview asset={asset} />
              <p className="mt-3 text-sm font-black text-[#0F2744]">{asset.title}</p>
              <p className="text-xs font-semibold text-slate-500">
                {brandCategoryLabel(asset.category)} · v{asset.version} · {formatBytes(asset.fileSize)} · {asset.approvalStatus.replace(/_/g, " ")}
              </p>
              {capabilities.edit ? <AssetEditor asset={asset} busy={busyId === asset.id} capabilities={capabilities} onPatch={patchAsset} onDelete={removeAsset} onReplace={(file) => uploadFiles([file], asset.id)} /> : (
                <a className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#2563EB]" href={`/api/brand-kit/${asset.id}/file`}>
                  <Download size={16} aria-hidden /> Download
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-[#0F2744]">Included with the site</h2>
        <p className="mt-1 text-sm font-medium text-slate-600">These files ship with SitGuru and are not uploads.</p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {builtIn.map((asset) => (
            <li key={asset.href} className="rounded-xl bg-slate-50 p-3">
              <a className="text-sm font-black text-[#2563EB]" href={asset.href} download>
                {asset.title}
              </a>
              <p className="text-xs font-semibold text-slate-500">{asset.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AssetPreview({ asset }: { asset: BrandAssetRecord }) {
  const href = `/api/brand-kit/${asset.id}/file`;
  if (asset.previewKind === "image") {
    return <img src={href} alt="" className="h-36 w-full rounded-xl bg-slate-50 object-contain" />;
  }
  if (asset.previewKind === "video") {
    return <video className="h-36 w-full rounded-xl bg-slate-950" controls src={href} />;
  }
  const Icon = asset.mimeType.startsWith("video/") ? Film : FileArchive;
  return (
    <div className="flex h-36 items-center justify-center rounded-xl bg-slate-50 text-[#2563EB]">
      <Icon aria-hidden />
    </div>
  );
}

function AssetEditor({
  asset,
  busy,
  capabilities,
  onPatch,
  onDelete,
  onReplace,
}: {
  asset: BrandAssetRecord;
  busy: boolean;
  capabilities: Capabilities;
  onPatch: (id: string, body: Record<string, unknown>, success: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReplace: (file: File) => void;
}) {
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState(asset.description);
  const [category, setCategory] = useState(asset.category);
  const [tags, setTags] = useState(asset.tags.join(", "));
  return (
    <div className="mt-3 space-y-2">
      <label className="block text-xs font-bold text-slate-500">
        Name
        <input className={`${fieldClass} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="block text-xs font-bold text-slate-500">
        Description
        <input className={`${fieldClass} mt-1`} value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label className="block text-xs font-bold text-slate-500">
        Category
        <select className={`${fieldClass} mt-1`} value={category} onChange={(event) => setCategory(event.target.value)}>
          {BRAND_CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-bold text-slate-500">
        Tags
        <input className={`${fieldClass} mt-1`} value={tags} onChange={(event) => setTags(event.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="inline-flex min-h-11 items-center rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white disabled:opacity-60"
          onClick={() => onPatch(asset.id, { title, description, category, tags }, "Brand file updated.")}
        >
          Save details
        </button>
        <a className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold text-[#0F2744]" href={`/api/brand-kit/${asset.id}/file`}>
          Download
        </a>
        {capabilities.edit && asset.approvalStatus !== "pending_review" ? (
          <button type="button" disabled={busy} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold" onClick={() => onPatch(asset.id, { approvalStatus: "pending_review" satisfies BrandStatus }, "Sent for review.")}>
            Send for review
          </button>
        ) : null}
        {capabilities.approve && asset.approvalStatus !== "approved" ? (
          <button type="button" disabled={busy} className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white" onClick={() => onPatch(asset.id, { approvalStatus: "approved" }, "Brand file approved.")}>
            Approve
          </button>
        ) : null}
        {capabilities.archive && asset.approvalStatus !== "archived" ? (
          <button type="button" disabled={busy} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold" onClick={() => onPatch(asset.id, { approvalStatus: "archived" }, "Brand file archived.")}>
            Archive
          </button>
        ) : null}
        {capabilities.delete ? (
          <button type="button" disabled={busy} className="inline-flex min-h-11 items-center rounded-full border border-rose-200 px-4 text-sm font-bold text-rose-700" onClick={() => onDelete(asset.id)}>
            Delete
          </button>
        ) : null}
      </div>
      {capabilities.upload ? (
        <label className="block text-xs font-bold text-slate-500">
          Replace with a new version
          <input
            className="mt-1 block w-full text-sm"
            type="file"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onReplace(file);
            }}
          />
        </label>
      ) : null}
    </div>
  );
}
