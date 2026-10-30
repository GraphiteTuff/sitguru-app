"use client";

import { useState } from "react";

export default function GuruPromoteActions({
  url,
  caption,
  qrHref,
}: {
  url: string;
  caption: string;
  qrHref: string;
}) {
  const [draft, setDraft] = useState(caption);
  const [note, setNote] = useState("");

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNote(`${label} copied.`);
    } catch {
      setNote("Copy was blocked by this browser. Select the text and copy it.");
    }
  }

  async function shareDevice() {
    if (!navigator.share) {
      await copy(url, "Profile link");
      return;
    }
    try {
      await navigator.share({ title: "Book pet care on SitGuru", text: draft, url });
      setNote("Share sheet opened. Nothing is posted until you confirm it there.");
    } catch {
      setNote("Share was canceled.");
    }
  }

  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-slate-700">
        Suggested caption
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={6}
          className="mt-2 w-full rounded-2xl border border-emerald-100 p-3 text-base font-medium text-slate-800"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <a href={facebook} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white">Share to Facebook</a>
        <button type="button" onClick={() => void shareDevice()} className="inline-flex min-h-11 items-center rounded-full border border-emerald-200 px-4 text-sm font-bold text-[#0D5C3A]">Share</button>
        <button type="button" onClick={() => void copy(url, "Booking link")} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-700">Copy booking link</button>
        <button type="button" onClick={() => void copy(draft, "Caption")} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-700">Copy caption</button>
        <a href={qrHref} download className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-700">Download QR</a>
      </div>
      <p className="text-xs font-semibold text-slate-500">Instagram does not accept a web post from SitGuru. Download the QR and paste your caption in the Instagram app. Nothing is published until you post it yourself.</p>
      {note ? <p className="text-sm font-bold text-[#0D5C3A]">{note}</p> : null}
    </div>
  );
}
