"use client";

import { useState } from "react";

type CreativeValue = { path: string; mime: string; name: string };

async function putSignedFile(url: string, file: File) {
  await new Promise<void>((resolve, reject) => {
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("The file did not finish uploading."));
    };
    xhr.onerror = () => reject(new Error("You appear to be offline. Check your connection and try again."));
    xhr.send(body);
  });
}

export function ContentCreativeField({ initial }: { initial?: CreativeValue | null }) {
  const [value, setValue] = useState<CreativeValue>(initial || { path: "", mime: "", name: "" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setStatus("");
    setPreview(URL.createObjectURL(file));
    try {
      if (file.size <= 4 * 1024 * 1024) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/content-studio/upload", { method: "POST", body });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Upload failed.");
        setValue({ path: payload.path, mime: payload.mime, name: payload.name || file.name });
      } else {
        const prepared = await fetch("/api/content-studio/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "prepare", name: file.name, size: file.size }),
        });
        const start = await prepared.json();
        if (!prepared.ok) throw new Error(start.error || "Upload could not be started.");
        await putSignedFile(start.signedUrl, file);
        const verified = await fetch("/api/content-studio/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", path: start.path, name: file.name, size: file.size }),
        });
        const done = await verified.json();
        if (!verified.ok) throw new Error(done.error || "The file could not be checked.");
        setValue({ path: done.path, mime: done.mime, name: done.name || file.name });
      }
      setStatus("Creative uploaded. Save the draft to keep it.");
    } catch (error) {
      setValue(initial || { path: "", mime: "", name: "" });
      setPreview("");
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input type="hidden" name="creativePath" value={value.path} />
      <input type="hidden" name="creativeMime" value={value.mime} />
      <input type="hidden" name="creativeName" value={value.name} />
      <label
        className="mt-1 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
      >
        <span className="text-sm font-black text-slate-800">{busy ? "Uploading…" : "Drop a graphic or video, or browse"}</span>
        <span className="mt-1 text-xs font-semibold text-slate-500">PNG, JPG, WEBP, GIF, MP4, WEBM, or MOV. Up to 25MB. Private to your team.</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </label>
      {value.name ? <p className="mt-2 text-sm font-semibold text-slate-700">{value.name}</p> : null}
      {preview ? (
        value.mime.startsWith("video/")
          ? <video src={preview} controls className="mt-2 max-h-64 w-full rounded-xl bg-slate-950" />
          : <img src={preview} alt="" className="mt-2 max-h-64 w-full rounded-xl object-contain bg-white" />
      ) : value.path ? (
        <p className="mt-2 text-xs font-semibold text-slate-500">A creative file is already attached.</p>
      ) : null}
      {value.path ? (
        <button
          type="button"
          className="mt-2 text-xs font-black text-slate-600"
          onClick={() => {
            setValue({ path: "", mime: "", name: "" });
            setPreview("");
            setStatus("Creative removed. Save the draft to apply that.");
          }}
        >
          Remove creative
        </button>
      ) : null}
      {status ? <p className="mt-2 text-sm font-semibold text-slate-700">{status}</p> : null}
    </div>
  );
}
