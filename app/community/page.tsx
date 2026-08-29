import Link from "next/link";
import { CalendarDays, PawPrint, Users } from "lucide-react";
import CommunityEventsMapSearch from "@/components/community/CommunityEventsMapSearch";
import CommunityFeaturedSection from "@/components/community/CommunityFeaturedSection";
import CommunityPetParentCta from "@/components/community/CommunityPetParentCta";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";
import {
  fetchFeaturedCommunityPageEvents,
  fetchPublicEvents,
} from "@/lib/community/queries";
import type { CommunityEventWithPartner } from "@/lib/community/types";

export const dynamic = "force-dynamic";

function mergeUniqueEvents(
  primary: CommunityEventWithPartner[],
  secondary: CommunityEventWithPartner[],
  limit = 48,
) {
  const seen = new Set<string>();
  const merged: CommunityEventWithPartner[] = [];

  for (const event of [...primary, ...secondary]) {
    const key = `${event.title}|${event.start_at}|${event.city || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(event);
    if (merged.length >= limit) break;
  }

  return merged;
}

const communityLinks = [
  {
    href: "/community/events",
    label: "Events",
    ready: true,
    description:
      "Browse upcoming pet friendly events, festivals, adoption days, and partner gatherings.",
  },
  {
    href: "/partners",
    label: "Partners",
    ready: true,
    description:
      "Discover SitGuru partners — pet businesses, rescues, and local pet friendly venues.",
  },
  {
    href: "/search",
    label: "Local Gurus",
    ready: true,
    description:
      "Find trusted pet Gurus near you for walks, sitting, training, and more.",
  },
  {
    href: "/find-care",
    label: "Pet Friendly Places",
    ready: true,
    description:
      "Explore pet friendly destinations and care options in your area.",
  },
  {
    href: "/ambassadors",
    label: "Community Groups",
    ready: true,
    description: "Meet SitGuru Ambassadors growing the local pet community.",
  },
];

export default async function CommunityPage() {
  const [featuredEvents, partnerEvents, discovered] = await Promise.all([
    fetchFeaturedCommunityPageEvents({ limit: 3 }),
    fetchPublicEvents({ limit: 40 }),
    fetchDiscoveredHomepageEvents({ limit: 24 }),
  ]);

  const mapEvents = mergeUniqueEvents(partnerEvents, discovered.events, 48);

  return (
    <main className="min-h-screen bg-[#f8fcfd]">
      <section className="public-dark-section border-b border-emerald-900/20 bg-[#0D5C3A] py-10 text-white sm:py-12">
        <div className="mx-auto max-w-[1500px] px-5 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
            SitGuru Community
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight !text-white sm:text-4xl lg:text-5xl">
            Pet friendly community events near you
          </h1>
          <p className="mt-3 max-w-2xl text-base font-semibold text-emerald-50">
            Search like Find Care — events on the left, map on the right. Partner
            events always lead.
          </p>
        </div>
      </section>

      <CommunityEventsMapSearch events={mapEvents} />

      <CommunityFeaturedSection events={featuredEvents} />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <CommunityPetParentCta
            nextPath="/community"
            source="community_hub"
            campaign="community_hub_cta"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {communityLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                    Community
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {item.label}
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                  Live
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: CalendarDays,
              title: "Local events",
              text: "Find adoption days, social meetups, and partner-hosted gatherings.",
            },
            {
              icon: PawPrint,
              title: "Pet friendly by design",
              text: "Filter for pet friendly, free, and family friendly experiences.",
            },
            {
              icon: Users,
              title: "Meet your community",
              text: "Connect with Gurus, partners, and Pet Parents near you.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >
              <Icon className="h-5 w-5 text-emerald-700" />
              <h3 className="mt-3 text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-emerald-900">
                Partners can host events too
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-950/80">
                Create polished community events from the Partner Dashboard in
                minutes.
              </p>
            </div>
            <Link
              href="/partners/dashboard/community/events"
              className="inline-flex min-h-11 items-center rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white"
            >
              Partner Events
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
