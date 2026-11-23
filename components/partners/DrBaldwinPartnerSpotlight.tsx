"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HomepagePartnerSpotlight } from "@/lib/partners/homepage-spotlight";

type Props = { onTrack: (label: string, destination: string) => void };

export default function DrBaldwinPartnerSpotlight({ onTrack }: Props) {
  const [item, setItem] = useState<HomepagePartnerSpotlight | null>(null);
  useEffect(() => {
    let live = true;
    async function refresh() {
      try {
        const response = await fetch("/api/partners/spotlight", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { spotlight: HomepagePartnerSpotlight | null };
        if (live) setItem(data.spotlight);
      } catch { /* Hide optional feature during temporary backend outage. */ }
    }
    void refresh();
    const interval = setInterval(() => { if (!document.hidden) void refresh(); }, 60_000);
    return () => { live = false; clearInterval(interval); };
  }, []);
  if (!item || !item.is_published) return null;

  return (
    <section aria-labelledby="homepage-partner-spotlight-heading" className="bg-white px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-9">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800 sm:text-sm">{item.eyebrow}</p>
            <h2 id="homepage-partner-spotlight-heading" className="mt-2 text-3xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-[2.6rem]">{item.title}</h2>
            <p className="mt-1 text-lg font-semibold text-slate-700 sm:text-xl">{item.subtitle}</p>
            <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">{item.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href={item.primary_href} onClick={() => onTrack(item.primary_label, item.primary_href)} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#075b41] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#064b35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">{item.primary_label}<span aria-hidden="true" className="ml-2">→</span></Link>
              <a href={item.secondary_href} target="_blank" rel="noopener noreferrer" onClick={() => onTrack(item.secondary_label, item.secondary_href)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-emerald-900 transition hover:border-emerald-700 hover:bg-emerald-50">{item.secondary_label}<span aria-hidden="true" className="ml-2">→</span></a>
            </div>
          </div>
          <div className="relative min-w-0 overflow-hidden rounded-[1.3rem] bg-emerald-50 shadow-sm">
            <img src={item.image_url || "/images/partners/annabels-touch-chiropractic.png"} alt={item.image_alt || item.title} className="aspect-[2.2/1] h-auto w-full object-cover" loading="lazy" />
            <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-slate-900 shadow-sm">📍 Local Partner Feature</span>
          </div>
        </div>
      </div>
    </section>
  );
}
