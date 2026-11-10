"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export default function ShareStoryButton({ id, title }: { id: string; title: string }) {
  const [message, setMessage] = useState("");
  async function share() {
    const url = `${window.location.origin}/pack#story-${id}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setMessage("Link copied"); }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Use your browser’s share menu to share this page.");
    }
  }
  return <div><button type="button" onClick={share} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-emerald-200 px-4 text-sm font-bold text-emerald-900"><Share2 size={16} />Share story</button><p role="status" className="mt-1 text-xs text-emerald-800">{message}</p></div>;
}
