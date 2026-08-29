import { Suspense } from "react";
import Link from "next/link";
import CommunityEventsExplorer from "@/components/community/CommunityEventsExplorer";
import CommunityEventsBannerSection from "@/components/community/CommunityEventsBannerSection";
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
      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Local pet life
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            All community events
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-slate-600 sm:text-base">
            Full list with filters for adoption days, meetups, training, fundraisers,
            and partner hangs. Map search lives on the Community hub.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/community"
              className="inline-flex text-sm font-black text-emerald-800 hover:underline"
            >
              ← Back to map search
            </Link>
            <Link
              href="/community/host"
              className="inline-flex min-h-10 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-black text-white"
            >
              Pet Event Planners & Managers
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <DiscoveryReturnOpener />
        </Suspense>
      </section>

      <CommunityEventsBannerSection />

      <section className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <CommunityPetParentCta
          nextPath="/community/events"
          source="community_events_list"
          campaign="community_events_list_cta"
        />
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
      </section>
    </main>
  );
}
