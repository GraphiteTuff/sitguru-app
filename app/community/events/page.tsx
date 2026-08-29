import { Suspense } from "react";
import Link from "next/link";
import { Filter, List, Map } from "lucide-react";
import CommunityEventsExplorer from "@/components/community/CommunityEventsExplorer";
import CommunityPetParentCta from "@/components/community/CommunityPetParentCta";
import DiscoveryReturnOpener from "@/components/community/DiscoveryReturnOpener";
import { fetchPublicEvents } from "@/lib/community/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    city?: string;
    state?: string;
    category?: string;
    petFriendly?: string;
    isFree?: string;
    welcome?: string;
  }>;
};

export default async function CommunityEventsPage({ searchParams }: PageProps) {
  const filters = await searchParams;

  const events = await fetchPublicEvents({
    q: filters?.q,
    city: filters?.city,
    state: filters?.state,
    category: filters?.category,
    petFriendly: filters?.petFriendly === "true",
    isFree:
      filters?.isFree === "true"
        ? true
        : filters?.isFree === "false"
          ? false
          : undefined,
  });

  return (
    <main className="min-h-screen bg-[#f8fcfd]">
      <section className="border-b border-slate-100 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Event list
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Browse every upcoming event
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-slate-600 sm:text-base">
            This page is the full text list with filters — not the map. Use it when
            you want to scan many events by category, city, free, or pet friendly.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <List className="h-3.5 w-3.5" />
                You are here
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">
                /community/events — full list
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Filterable cards for every published Partner event (and list
                browsing). Best for scanning.
              </p>
            </div>
            <Link
              href="/community"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition hover:border-emerald-300"
            >
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                <Map className="h-3.5 w-3.5" />
                Prefer the map?
              </p>
              <p className="mt-1 text-sm font-black text-emerald-950">
                /community — map + search hub
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-900/80">
                Find Care-style layout: search on top, events left, map right.
              </p>
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/community"
              className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-5 text-sm font-black text-white"
            >
              Open map search
            </Link>
            <Link
              href="/community/host"
              className="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-5 text-sm font-black text-slate-800"
            >
              Host / manage an event
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <DiscoveryReturnOpener />
        </Suspense>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Filter className="h-4 w-4 text-emerald-700" />
          Filter the list below — results update as you search.
        </div>

        <CommunityEventsExplorer
          events={events}
          initialFilters={{
            q: filters?.q || "",
            city: filters?.city || "",
            state: filters?.state || "",
            category: filters?.category || "",
            petFriendly: filters?.petFriendly === "true",
            isFree:
              filters?.isFree === "true"
                ? true
                : filters?.isFree === "false"
                  ? false
                  : undefined,
          }}
        />

        <CommunityPetParentCta
          nextPath="/community/events"
          source="community_events_list"
          campaign="community_events_list_cta"
        />
      </section>
    </main>
  );
}
