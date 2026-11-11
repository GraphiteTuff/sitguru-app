import type { Metadata } from "next";
import Link from "next/link";
import TrackPageView from "@/components/reads/TrackPageView";

export const metadata: Metadata = {
  title: "Pet Parent Picks | SitGuru Reads & Listen",
  description:
    "Pet Parent recommendations — coming in a future release.",
};

export default function PetParentPicksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <TrackPageView
        eventName="page_view"
        metadata={{ surface: "pet_parent_picks_v2" }}
      />
      <h1 className="text-4xl font-black text-[#0F2744]">Pet Parent Picks</h1>
      <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
        Pet Parent-submitted recommendations and community voting are planned for
        Version 2. Explore Team Picks and topic collections meanwhile.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/reads/team-picks"
          className="rounded-full bg-[#2563EB] px-4 py-2.5 text-sm font-black text-white"
        >
          Browse Team Picks
        </Link>
        <Link
          href="/reads/topics"
          className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-bold text-[#2563EB]"
        >
          Explore Topics
        </Link>
      </div>
    </div>
  );
}
