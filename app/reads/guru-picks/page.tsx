import type { Metadata } from "next";
import Link from "next/link";
import TrackPageView from "@/components/reads/TrackPageView";

export const metadata: Metadata = {
  title: "Guru Picks | SitGuru Reads & Listen",
  description: "Guru community recommendations — coming in a future release.",
};

export default function GuruPicksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <TrackPageView eventName="page_view" metadata={{ surface: "guru_picks_v2" }} />
      <h1 className="text-4xl font-black text-[#163127]">Guru Picks</h1>
      <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
        Guru-submitted recommendations are architected for Version 2. Today, explore
        SitGuru Team Picks and curated books, magazines, podcasts, and videos.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/reads/team-picks"
          className="rounded-full bg-[#0D5C3A] px-4 py-2.5 text-sm font-black text-white"
        >
          Browse Team Picks
        </Link>
        <Link
          href="/reads"
          className="rounded-full border border-emerald-200 px-4 py-2.5 text-sm font-bold text-[#0D5C3A]"
        >
          Back to Reads
        </Link>
      </div>
    </div>
  );
}
