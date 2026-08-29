import Link from "next/link";
import EventCard from "@/components/community/EventCard";
import type { CommunityEventWithPartner } from "@/lib/community/types";

export default function CommunityFeaturedSection({
  events,
}: {
  events: CommunityEventWithPartner[];
}) {
  if (!events.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Featured
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Spotlight events
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
            Hand-picked gatherings from SitGuru partners and the local pet community.
          </p>
        </div>
        <Link
          href="/events"
          className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-800"
        >
          See all events
        </Link>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
