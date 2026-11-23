"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Check, ClipboardCopy, ExternalLink, Filter, Share2 } from "lucide-react";
import type { CommunityItem } from "@/lib/community-studio/types";

type Role = "manager" | "intern";
type Channel = "facebook" | "instagram" | "tiktok" | "x" | "youtube";
const channels: { id: Channel; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "x", label: "X" },
  { id: "youtube", label: "YouTube" },
];
const categories = [
  ["all", "All stories"],
  ["pack", "SitGuru Pack"],
  ["pet_of_week", "Pet of the Week"],
  ["gallery", "Gallery"],
  ["guru_spotlight", "Guru Spotlights"],
] as const;

function publicShareUrl(id: string, channel: Channel) {
  const url = new URL("https://www.sitguru.com/pack");
  url.searchParams.set("utm_source", channel);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "community_studio");
  url.searchParams.set("utm_content", id);
  url.hash = "story-" + id;
  return url.toString();
}

function captionFor(item: CommunityItem, channel: Channel) {
  const location = item.location ? " in " + item.location : "";
  const intro = item.kind === "guru_spotlight"
    ? "Meet one of the people helping make our local pet-care community special"
    : item.kind === "pet_of_week" ? "A new furry face to celebrate" : "A moment worth sharing from the SitGuru Pack";
  const story = item.story.length > 220 ? item.story.slice(0, 217).trimEnd() + "..." : item.story;
  return [
    "🐾 " + intro + location + "!",
    "",
    item.title,
    story,
    "",
    "Explore local pet care, meet Gurus, and join our community at SitGuru.",
    publicShareUrl(item.id, channel),
    "",
    "#SitGuru #PetCare #SitGuruPack",
  ].join("\n");
}

export default function CommunityShareDesk({ items, role }: { items: CommunityItem[]; role: Role }) {
  const [category, setCategory] = useState("all");
  const [channel, setChannel] = useState<Channel>("facebook");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState("");
  const [notice, setNotice] = useState("");
  const ready = useMemo(() => items.filter((item) => item.status === "published" && item.publicConsent && item.socialConsent), [items]);
  const visible = ready.filter((item) =>
    (category === "all" || item.kind === category) &&
    (item.title + " " + item.story + " " + item.location).toLowerCase().includes(search.toLowerCase())
  );
  const compactButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0F2744] hover:bg-slate-50";
  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(label + " copied. Paste it into your approved SitGuru social account.");
    } catch {
      setNotice("Clipboard unavailable. Select and copy the caption from the text box instead.");
    }
  }
  async function share(item: CommunityItem) {
    const url = publicShareUrl(item.id, channel);
    const caption = captionFor(item, channel);
    if (channel === "facebook") {
      window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), "_blank", "noopener,noreferrer");
      setNotice("Facebook sharing opened. Add the approved caption and confirm the post in Facebook.");
    } else if (channel === "x") {
      window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(item.title + " 🐾 Join the SitGuru Pack!") + "&url=" + encodeURIComponent(url), "_blank", "noopener,noreferrer");
      setNotice("X sharing opened. Confirm the post in X before marking it shared.");
    } else if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: item.title, text: caption, url });
        setNotice("Share sheet closed. Confirm the post on the social platform.");
      } catch {
        setNotice("Share cancelled. You can copy the caption and link below.");
      }
    } else {
      await copy(caption, "Caption");
    }
  }
  return <section aria-label="Community social share desk" className="mx-auto max-w-7xl space-y-4 rounded-3xl border border-[#D1EADD] bg-[#F8FCFA] p-4 text-[#0F2744] sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#0D5C3A]">Community growth · Social sharing</p>
        <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">Ready-to-share community stories</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Create an approved SitGuru social post in fewer steps. Each public link brings visitors back to the Pet Parent-facing SitGuru Pack. Only published stories with valid social reuse permission appear here.</p>
      </div>
      <span className="rounded-xl bg-white px-4 py-3 text-sm font-black shadow-sm">{ready.length} ready</span>
    </div>
    <div className="flex flex-wrap gap-2">
      <Link href={role === "manager" ? "/manager/campaigns-content" : "/intern/content"} className={compactButton}>Content Studio <ArrowUpRight size={15}/></Link>
      <Link href={role === "manager" ? "/manager/community-studio/guru-match" : "/intern/community-studio/guru-match"} className={compactButton}>Guru Match &amp; Share <ArrowUpRight size={15}/></Link>
      <Link href={role === "manager" ? "/manager/community-studio/event-match" : "/intern/community-studio/event-match"} className={compactButton}>Event Match &amp; Share <ArrowUpRight size={15}/></Link>
      <Link href="/pack" target="_blank" rel="noreferrer" className={compactButton}>Public SitGuru Pack <ExternalLink size={15}/></Link>
    </div>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
      <label className="text-xs font-black text-slate-600">Social platform
        <select value={channel} onChange={(event) => setChannel(event.target.value as Channel)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900">{channels.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select>
      </label>
      <label className="text-xs font-black text-slate-600">Content type
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"><>{categories.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</></select>
      </label>
      <label className="text-xs font-black text-slate-600">Find a story
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, story, or town" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"/>
      </label>
    </div>
    <p role="status" aria-live="polite" className="text-xs font-semibold text-[#0D5C3A]">{notice || "Choose a published story to preview its branded caption, destination link, and sharing options."}</p>
    {visible.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">No approved public stories match these filters. Publish a story with permission for social reuse, then it will appear here.</div> :
      <div className="grid gap-3 lg:grid-cols-2">
        {visible.slice(0, 24).map((item) => {
          const opened = expanded === item.id;
          const url = publicShareUrl(item.id, channel);
          const caption = captionFor(item, channel);
          return <article key={item.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl bg-emerald-50 object-cover" loading="lazy"/> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl">🐾</div>}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#0D5C3A]">{categories.find(([id]) => id === item.kind)?.[1]}{item.location ? " · " + item.location : ""}</p>
                <h3 className="mt-1 line-clamp-2 text-base font-extrabold">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-500">Published · Social reuse permitted</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setExpanded(opened ? "" : item.id); setNotice(""); }} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">{opened ? "Close preview" : "Preview & share"} <Share2 size={15} className="ml-2"/></button>
              <Link href={url} target="_blank" rel="noreferrer" className={compactButton}>View public post <ArrowUpRight size={15}/></Link>
            </div>
            {opened && <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
              <label className="block text-xs font-bold text-slate-600">Suggested social caption (editable after copying)
                <textarea readOnly value={caption} rows={8} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-[#0F2744]"/>
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={compactButton} onClick={() => copy(caption, "Caption")}><ClipboardCopy size={15}/>Copy caption</button>
                <button type="button" className={compactButton} onClick={() => copy(url, "Tracked link")}><Check size={15}/>Copy tracked link</button>
                <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-xs font-black !text-white" onClick={() => share(item)}><Share2 size={15}/>Open {channels.find((entry) => entry.id === channel)?.label} share</button>
              </div>
              <p className="text-xs leading-5 text-slate-500">The link includes campaign attribution parameters. Platform publishing requires confirmation inside the social account; copying or opening a share window does not prove that a post was published. Use Guru Match or Event Match for their dedicated tracked campaign counters.</p>
            </div>}
          </article>;
        })}
      </div>}
    {visible.length > 24 && <p className="text-xs font-semibold text-slate-500">Showing the 24 newest matching stories. Narrow your search to find more.</p>}
  </section>;
}
