import Link from "next/link";
import { CalendarDays, PawPrint, Users } from "lucide-react";
import CommunityPetParentCta from "@/components/community/CommunityPetParentCta";

export const dynamic = "force-dynamic";

const communityLinks = [
  { href: "/community/events", label: "Events", ready: true },
  { href: "/partners", label: "Partners", ready: false },
  { href: "/search", label: "Local Gurus", ready: false },
  { href: "/find-care", label: "Pet-Friendly Places", ready: false },
  { href: "/ambassadors", label: "Community Groups", ready: false },
];

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-[#f8fcfd]">
      <section className="public-dark-section border-b border-emerald-900/20 bg-[#0D5C3A] py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
            SitGuru Community
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight !text-white sm:text-5xl">
            Pet-friendly community, events, and local connections
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold text-emerald-50">
            Discover events near you, meet local Gurus, and connect with SitGuru partners
            who love pets as much as you do.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/signup?role=pet_parent&intent=pet_parent&next=%2Fcommunity%2Fevents&source=community_hub&campaign=community_hub_join&utm_source=sitguru&utm_medium=community_events&utm_campaign=community_hub_join"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 text-sm font-black text-emerald-900"
            >
              Join free as a Pet Parent
            </Link>
            <Link
              href="/community/events"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/40 bg-transparent px-6 text-sm font-black !text-white"
            >
              Browse events
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <CommunityPetParentCta
            nextPath="/community/events"
            source="community_hub"
            campaign="community_hub_cta"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {communityLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                    Community
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{item.label}</h2>
                </div>
                {item.ready ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                    Live
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                {item.label === "Events"
                  ? "Browse upcoming pet-friendly events, festivals, adoption days, and partner gatherings."
                  : "More community features are on the way across SitGuru web and mobile."}
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
              title: "Pet-friendly by design",
              text: "Filter for pet-friendly, free, and family-friendly experiences.",
            },
            {
              icon: Users,
              title: "Meet your community",
              text: "Connect with Gurus, partners, and pet parents near you.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5">
              <Icon className="h-5 w-5 text-emerald-700" />
              <h3 className="mt-3 text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-emerald-900">Partners can host events too</p>
              <p className="mt-1 text-sm font-semibold text-emerald-950/80">
                Create polished community events from the Partner Dashboard in minutes.
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
